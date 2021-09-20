// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { definitions } from "../common/supabase";
import { getIdByEmail, checkEmail } from "./db-utils";
import fastifyRateLimit from "fastify-rate-limit";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface PostBody {
  email: string;
  name: string;
}

export interface SignupPluginOptions {
  mount: string;
  apiVersion: string;
  endpoint: string;
}

type UserProfile = definitions["user_profiles"];
const postSignupBodySchema = S.object()
  .id("/signup")
  .title("Sign up body schema")
  .additionalProperties(false)
  .prop(
    "email",
    S.string()
      .format(S.FORMATS.EMAIL)
      .required()
      .description("The email address of the user")
  )
  .prop(
    "name",
    S.string()
      .minLength(3)
      .maxLength(20)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .description("The username")
  );

const server: FastifyPluginAsync<SignupPluginOptions> = async (
  fastify,
  { mount, apiVersion, endpoint }
) => {
  fastify.register(fastifyRateLimit, {
    max: 1,
    timeWindow: "1 minute",
    allowList: ["127.0.0.1"],
  });
  fastify.route<{ Body: PostBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "POST",
    schema: {
      body: postSignupBodySchema,
    },
    handler: async (request, reply) => {
      const { email, name } = request.body;
      // check if there is already a profile with that name
      // if there is data: userProfile should not be null
      const {
        data: userProfiles,
        error: userProfileError,
      } = await fastify.supabase
        .from<UserProfile>("user_profiles")
        .select("name")
        .eq("name", name);

      // we had some error with supabase
      // return 500 and log
      if (userProfileError) {
        fastify.log.error(userProfileError);
        throw fastify.httpErrors.internalServerError(userProfileError.hint);
      }
      // the username is taken response 409
      if (userProfiles !== null && userProfiles.length > 0) {
        throw fastify.httpErrors.conflict(
          `The username ${name} is already taken`
        );
      }
      // so the profile is null
      // now we need to check if the mail is already taken
      let isEmailTaken = true;
      try {
        isEmailTaken = await checkEmail(email);
      } catch (error) {
        fastify.log.error("pg db request error", error);
        throw fastify.httpErrors.internalServerError();
      }
      if (isEmailTaken === true) {
        fastify.log.info("Signup try with existing email. Aborting...");
        // TODO: [STADTPULS-394] Backend (User Signup Route) Should we respond with a hint if an email is taken?
        throw fastify.httpErrors.conflict(
          `The email ${email} is already taken`
        );
      }
      // me made it past the username test and the email test
      // so we can create the user and send him his magic link
      // and after wards change his username
      // send magic link first

      const {
        user,
        error: signupError,
        session,
      } = await fastify.supabase.auth.signIn({
        email,
      });

      if (signupError) {
        fastify.log.error(signupError);
        throw fastify.httpErrors.internalServerError(signupError.message);
      }
      // try {
        if (idError) {
          fastify.log.error(idError);
          throw fastify.httpErrors.internalServerError();
        }
        if (idData === null) {
          fastify.log.error(idData);
          throw fastify.httpErrors.internalServerError();
        }
        const id = idData.id;
        const {
          data: _profile,
          error: nameUpsertError,
        } = await fastify.supabase
          .from<UserProfile>("user_profiles")
          .update({
            id,
            name,
          })
          .eq("id", id);

        if (nameUpsertError) {
          throw fastify.httpErrors.internalServerError(nameUpsertError.hint);
        }

        reply.status(201).send({
          method: `${request.method}`,
          url: `${request.url}`,
          data: { user, session },
        });
      // } catch (error) {
      //   fastify.log.error("db error", error);
      //   throw fastify.httpErrors.internalServerError();
      // }
    },
  });
};

export default fp(server);
