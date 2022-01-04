// TODO: [STADTPULS-531] Use unified buildReplyPayload function for responses
import { FastifyPluginAsync } from "fastify";

import { v4 as uuidv4 } from "uuid";
import fp from "fastify-plugin";
import { hash } from "./crypto";
import S from "fluent-json-schema";
import { definitions } from "../common/supabase";
import { AuthToken, jwtSignOptions } from "../common/jwt";
import { logLevel } from "./env";

interface PostBody {
  description: string;
  scope?: "sudo" | "read" | "write";
}
interface PutBody {
  description?: string;
  nice_id: number;
  scope?: "sudo" | "read" | "write";
}
interface DeleteBody {
  nice_id: number;
}
interface SupabaseJWTPayload {
  aud: "authenticated" | "anon";
  exp: number;
  sub: string;
  email: string;
  app_metadata: { provider: "email"; [key: string]: unknown };
  user_metadata: Record<string, unknown>;
  role: "authenticated" | "anon";
}
declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
export interface AuthtokensPluginOptions {
  mount: string;
  apiVersion: string;
  endpoint: string;
  issuer: string;
}

// const tokenHeaderSchema = S.object()
//   .id("/authtokens/headers")
//   .title("Auth Token Header")
//   .additionalProperties(true)
//   .prop("Authorization", S.string().required().description("Bearer <token>"))
//   .prop("Content-Type", S.string().required().description("application/json"));

const postTokenBodySchema = S.object()
  .id("/authtokens/post")
  .title("for token generation")
  .additionalProperties(false)
  .prop("description", S.string().minLength(3).required())
  .prop("scope", S.string().enum(["sudo", "read", "write"]));

const putTokenBodySchema = S.object()
  .id("/authtokens/put")
  .title("for token re-generation")
  .additionalProperties(false)
  .prop("description", S.string().minLength(3))
  .prop("nice_id", S.string().required())
  .prop("scope", S.string());

const getTokenQuerySchema = S.object()
  .id("/authtokens/get")
  .additionalProperties(false)
  .prop("nice_id", S.string())
  .title("get all project tokens or filter");

const deleteTokenBodySchema = S.object()
  .id("/authtokens/delete")
  .title("for token deletion")
  .additionalProperties(false)
  .prop("nice_id", S.number().minimum(1).required());

// TODO: [STADTPULS-400] authtokens GET is missing pagination
const server: FastifyPluginAsync<AuthtokensPluginOptions> = async (
  fastify,
  { mount, apiVersion, endpoint, issuer: _issuer }
) => {
  //   ▄████ ▓█████▄▄▄█████▓
  //  ██▒ ▀█▒▓█   ▀▓  ██▒ ▓▒
  // ▒██░▄▄▄░▒███  ▒ ▓██░ ▒░
  // ░▓█  ██▓▒▓█  ▄░ ▓██▓ ░
  // ░▒▓███▀▒░▒████▒ ▒██▒ ░
  //  ░▒   ▒ ░░ ▒░ ░ ▒ ░░
  //   ░   ░  ░ ░  ░   ░
  // ░ ░   ░    ░    ░
  //       ░    ░  ░

  fastify.route<{ Querystring: { nice_id?: string } }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "GET",
    logLevel,
    schema: {
      querystring: getTokenQuerySchema,
    },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      type PickedTokenProps = Pick<
        definitions["auth_tokens"],
        "description" | "scope" | "nice_id" | "user_id"
      >;
      const selection = "description, nice_id, scope";

      const decoded = (await request.jwtVerify()) as SupabaseJWTPayload;
      let res;
      if (request.query.nice_id !== undefined) {
        const nice_id = parseInt(request.query.nice_id, 10);
        res = fastify.supabase
          .from<PickedTokenProps>("auth_tokens")
          .select(selection)
          .eq("user_id", decoded.sub)
          .eq("nice_id", nice_id);
      } else {
        res = fastify.supabase
          .from<PickedTokenProps>("auth_tokens")
          .select(selection)
          .eq("user_id", decoded.sub);
      }
      const { data: authtokens, error } = await res;

      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError(error.hint);
      }

      reply.status(200).send({
        url: `${request.url}`,
        data: authtokens,
      });
    },
  });

  //  ██▓███   ▒█████    ██████ ▄▄▄█████▓
  // ▓██░  ██▒▒██▒  ██▒▒██    ▒ ▓  ██▒ ▓▒
  // ▓██░ ██▓▒▒██░  ██▒░ ▓██▄   ▒ ▓██░ ▒░
  // ▒██▄█▓▒ ▒▒██   ██░  ▒   ██▒░ ▓██▓ ░
  // ▒██▒ ░  ░░ ████▓▒░▒██████▒▒  ▒██▒ ░
  // ▒▓▒░ ░  ░░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░  ▒ ░░
  // ░▒ ░       ░ ▒ ▒░ ░ ░▒  ░ ░    ░
  // ░░       ░ ░ ░ ▒  ░  ░  ░    ░
  //              ░ ░        ░

  fastify.route<{ Body: PostBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "POST",
    logLevel,
    schema: {
      body: postTokenBodySchema,
      // headers: tokenHeaderSchema,
    },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const { description, scope } = request.body;

      const decoded = (await request.jwtVerify()) as SupabaseJWTPayload;
      // FIXME: [STADTPULS-636] Temporary fix until ttn allows more then 256 characters
      const payload: Omit<
        AuthToken,
        "iat" | "description" | "scope" | "iss"
      > = {
        sub: decoded.sub,
        // scope: "sudo",
        // description,
        jti: uuidv4(),
        // iss: issuer,
      };
      // TODO: [STADTPULS-417] Refactor authtokens.ts to allow the usage a different JWT secret.
      // means we need to use jwt.sign directly and not the fastify plugin
      const token = fastify.jwt.sign(payload, jwtSignOptions);
      const { computedHash: hashedToken, salt } = await hash({ token });

      const { data: authTokens, error } = await fastify.supabase
        .from<definitions["auth_tokens"]>("auth_tokens")
        .insert([
          {
            id: hashedToken,
            description,
            scope: scope ? scope : "sudo",
            user_id: decoded.sub,
            salt,
          },
        ]);

      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      if (authTokens === null || authTokens.length === 0) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      reply.status(201).send({
        method: `${request.method}`,
        url: `${request.url}`,
        data: { token, nice_id: authTokens[0].nice_id },
      });
    },
  });
  //  ██▓███   █    ██ ▄▄▄█████▓
  // ▓██░  ██▒ ██  ▓██▒▓  ██▒ ▓▒
  // ▓██░ ██▓▒▓██  ▒██░▒ ▓██░ ▒░
  // ▒██▄█▓▒ ▒▓▓█  ░██░░ ▓██▓ ░
  // ▒██▒ ░  ░▒▒█████▓   ▒██▒ ░
  // ▒▓▒░ ░  ░░▒▓▒ ▒ ▒   ▒ ░░
  // ░▒ ░     ░░▒░ ░ ░     ░
  // ░░        ░░░ ░ ░   ░
  //             ░

  fastify.route<{ Body: PutBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "PUT",
    logLevel,
    schema: {
      body: putTokenBodySchema,
    },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const decoded = (await request.jwtVerify()) as SupabaseJWTPayload;
      const { description, scope, nice_id } = request.body;

      const { data: currentTokens, error } = await fastify.supabase
        .from<definitions["auth_tokens"]>("auth_tokens")
        .select("description, nice_id, scope, user_id, salt")
        .eq("user_id", decoded.sub)
        .eq("nice_id", nice_id);
      if (currentTokens === null || currentTokens.length === 0) {
        throw fastify.httpErrors.notFound();
      }
      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      // FIXME:  [STADTPULS-636] add scope and maybe description again
      const payload: Omit<
        AuthToken,
        "iat" | "description" | "scope" | "iss"
      > = {
        sub: decoded.sub,
        // scope: scope ? scope : currentTokens[0].scope,
        // description: description ? description : currentTokens[0].description,
        jti: uuidv4(),
        // iss: issuer,
      };
      const token = fastify.jwt.sign(payload, jwtSignOptions);
      const { computedHash: hashedToken, salt } = await hash({
        token,
      });

      const { data: newTokens } = await fastify.supabase
        .from<definitions["auth_tokens"]>("auth_tokens")
        .update({
          id: hashedToken,
          description,
          scope: scope ? scope : "sudo",
          salt,
        })
        .eq("user_id", decoded.sub)
        .eq("nice_id", nice_id);

      if (newTokens === null || newTokens.length === 0) {
        throw fastify.httpErrors.internalServerError();
      }

      reply.status(201).send({
        method: `${request.method}`,
        url: `${request.url}`,
        data: { token, nice_id: newTokens[0].nice_id },
      });
    },
  });

  // ▓█████▄ ▓█████  ██▓
  // ▒██▀ ██▌▓█   ▀ ▓██▒
  // ░██   █▌▒███   ▒██░
  // ░▓█▄   ▌▒▓█  ▄ ▒██░
  // ░▒████▓ ░▒████▒░██████▒
  //  ▒▒▓  ▒ ░░ ▒░ ░░ ▒░▓  ░
  //  ░ ▒  ▒  ░ ░  ░░ ░ ▒  ░
  //  ░ ░  ░    ░     ░ ░
  //    ░       ░  ░    ░  ░
  //  ░
  fastify.route<{ Body: DeleteBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "DELETE",
    logLevel,
    schema: { body: deleteTokenBodySchema },
    preHandler: fastify.auth([fastify.verifyJWT]),

    handler: async (request, reply) => {
      const { nice_id } = request.body;
      const { data: authtoken, error } = await fastify.supabase
        .from<Pick<definitions["auth_tokens"], "id" | "nice_id">>("auth_tokens")
        .select("nice_id, id")
        .eq("nice_id", nice_id)
        .single();
      if (!authtoken) {
        throw fastify.httpErrors.notFound("token not found");
      }
      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      const success = await fastify.supabase
        .from("auth_tokens")
        .delete()
        .eq("id", authtoken.id);

      if (success) {
        reply.status(204).send();
      } else {
        fastify.log.error("Could not delete existing authtoken");
        throw fastify.httpErrors.internalServerError();
      }
    },
  });
  // });
};

export default fp(server);
