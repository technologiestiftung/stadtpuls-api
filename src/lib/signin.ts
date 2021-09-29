// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { getIdByEmail, checkEmail } from "./db-utils";
import { logLevel } from "./env";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface PostBody {
  email: string;
  name: string;
}

export interface SigninPluginOptions {
  mount: string;
  apiVersion: string;
  endpoint: string;
}

const postSigninBodySchema = S.object()
  .id("/signin")
  .title("Sign in body schema")
  .additionalProperties(false)
  .prop(
    "email",
    S.string()
      .format(S.FORMATS.EMAIL)
      .required()
      .description("The email address of the user")
  );

const server: FastifyPluginAsync<SigninPluginOptions> = async (
  fastify,
  { mount, apiVersion, endpoint }
) => {
  fastify.route<{ Body: PostBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "POST",
    logLevel,
    config: {
      rateLimit: {
        max: 1,
        timeWindow: 1000 * 10, // 10 seconds
        allowList: ["127.0.0.1"],
      },
    },
    schema: {
      body: postSigninBodySchema,
    },
    handler: async (request, reply) => {
      const { email } = request.body;
      // Check if the mail is already taken
      let isEmailTaken = true;
      try {
        isEmailTaken = await checkEmail(email);
      } catch (error) {
        fastify.log.error("pg db request error", error);
        throw fastify.httpErrors.internalServerError();
      }
      if (isEmailTaken === true) {
        fastify.log.info("Signin try with existing email. Aborting...");
        // TODO: [STADTPULS-394] Backend (User Signin Route) Should we respond with a hint if an email is taken?
        throw fastify.httpErrors.conflict(
          `The email ${email} is already taken`
        );
      }
      // We can create the user and send him his magic link
      // and afterwards change his username
      // send magic link first

      const { error: signinError } = await fastify.supabase.auth.signIn({
        email,
      });

      // was there an error sending the magic link?
      // if so we have an signinError is not null here
      if (signinError) {
        fastify.log.error(signinError);
        throw fastify.httpErrors.internalServerError(signinError.message);
      }
      // No error on magic link sending. Nice so now we get the id of the user
      // again for updating his user_profile
      // try {
      const { data: idData, error: idError } = await getIdByEmail(email);
      // if we have an error here there was an issue connectiong to the database
      // using the pg module
      // log and throw an internal server error
      if (idError) {
        fastify.log.error(idError);
        throw fastify.httpErrors.internalServerError();
      }
      // again if the id is null the user profile was not created
      // this is another internal server error
      if (idData === null) {
        fastify.log.error(idData);
        throw fastify.httpErrors.internalServerError();
      }
      // awesome we made it to the end. Respond with 204
      // Since we wait for the login with the magic link
      // we dont have to send anything.
      reply.status(201).send({
        method: `${request.method}`,
        url: `${request.url}`,
      });
      // } catch (error) {
      //   fastify.log.error("db error", error);
      //   throw fastify.httpErrors.internalServerError();
      // }
    },
  });
};

export default fp(server);
