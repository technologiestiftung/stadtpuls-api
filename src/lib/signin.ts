// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { checkEmail } from "./db-utils";
import { logLevel } from "./env";
import { buildReplyPayload } from "./reply-utils";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface PostBody {
  email: string;
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

const signinPlugin: FastifyPluginAsync<SigninPluginOptions> = async (
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
        timeWindow: "10s",
        allowList: ["127.0.0.1"],
      },
    },
    schema: {
      body: postSigninBodySchema,
    },
    handler: async (request, reply) => {
      const { email } = request.body;
      // Check if the mail is already taken
      let isEmailTaken = false;
      try {
        isEmailTaken = await checkEmail(email);
      } catch (error) {
        fastify.log.error("pg db request error", error);
        throw fastify.httpErrors.internalServerError();
      }
      if (isEmailTaken === false) {
        fastify.log.warn("Signin try with non existing email. Aborting...");
        // TODO: [STADTPULS-394] Backend (User Signin Route) Should we respond with a hint if an email is taken?
        throw fastify.httpErrors.notFound(
          "The email address you entered is not registered."
        );
      }
      // Thee email exists lets send magic link
      const { error: signinError } = await fastify.supabase.auth.signIn({
        email,
      });

      // was there an error sending the magic link?
      // if so we have an signinError is not null here
      if (signinError) {
        fastify.log.error(signinError);
        throw fastify.httpErrors.internalServerError(signinError.message);
      }
      // No error on magic link sending.We are out of here

      // awesome we made it to the end. Respond with 204
      // Since we wait for the login with the magic link
      // we dont __have__ to send anything. We still do
      const payload = buildReplyPayload<string>({
        url: `${request.url}`,
        payload: email,
      });
      reply.status(204).send(payload);
    },
  });
};

export default fp(signinPlugin);
