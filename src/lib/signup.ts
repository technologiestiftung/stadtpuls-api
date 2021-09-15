// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { Client } from "pg";

import { definitions } from "../common/supabase";
import { databaseUrl } from "./env";

const client = new Client(databaseUrl);

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
      // const {
      //   rows,
      // } = await client.query("SELECT id FROM auth.users WHERE email=$1", [
      //   email,
      // ]);

      // client.release();
      // console.log(rows);

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

      // so what do we have in the session and user when there was no conflict?
      await client.connect();
      const {
        rows,
      } = await client.query("select id FROM auth.users WHERE email=$1", [
        email,
      ]);

      // const {
      //   data: profile,
      //   error,
      // } = await fastify.supabase.from<UserProfile>("user_profiles").insert({
      //   name: username,
      // });
      // if (error) {
      //   throw fastify.httpErrors.internalServerError(error.hint);
      // }
      await client.end();

      reply.status(201).send({
        method: `${request.method}`,
        url: `${request.url}`,
        data: { user, session },
      });
    },
  });
};

export default fp(server);
