// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import { getIdByEmail, checkEmail } from "./db-utils";
import { logLevel } from "./env";
import { buildReplyPayload } from "./reply-utils";

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

const signupPlugin: FastifyPluginAsync<SignupPluginOptions> = async (
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
        timeWindow: "1 minute",
        allowList: ["127.0.0.1"],
      },
    },
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
        .eq("name", name.toLowerCase());

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
        fastify.log.error(error, "pg db request error");
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
      // and afterwards change his username
      // send magic link first

      const { error: signupError } = await fastify.supabase.auth.signIn({
        email,
      });

      // was there an error sending the magic link?
      // if so we have an signupError is not null here
      if (signupError) {
        fastify.log.error(signupError);
        throw fastify.httpErrors.internalServerError(signupError.message);
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
      // yay everything is fine. We have an id
      // now we can update the user profile and add the username
      const id = idData.id;
      const { data: _profile, error: nameUpsertError } = await fastify.supabase
        .from<UserProfile>("user_profiles")
        .update({
          id,
          name,
        })
        .eq("id", id);
      // is there an error adding the username to the profile?
      // if so nameUpsertError is not null here
      if (nameUpsertError) {
        fastify.log.error(nameUpsertError);
        throw fastify.httpErrors.internalServerError();
      }
      // awesome we made it to the end. Respond with 204
      // Since we wait for the login with the magic link
      // we dont have to send anything. But we do
      const payload = buildReplyPayload({
        url: `${request.url}`,
        payload: { email, name },
      });
      reply.status(204).send(payload);
    },
  });
};

export default fp(signupPlugin);
