import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { SignOptions } from "jsonwebtoken";
import fp from "fastify-plugin";
import { hash } from "bcrypt";
import { definitions } from "../common/supabase";
import { AuthToken } from "../common/jwt";
import S from "fluent-json-schema";

interface PostBody {
  projectId: number;
  description: string;
}
interface DeleteBody {
  tokenId: number;
  projectId: number;
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

const postTokenBodySchema = S.object()
  .id("/authtokens/oist")
  .title("for token generation")
  .prop("projectId", S.number().minimum(1).required())
  .prop("description", S.string().minLength(3).required());

const getTokenQuerySchema = S.object()
  .id("/auth?projectId=123")
  .title("get all project tokens")
  .prop("projectId", S.number().required());

const deleteTokenBodySchema = S.object()
  .id("/authtokens/delete")
  .title("for token deletion")
  .prop("tokenId", S.number().minimum(1).required())
  .prop("projectId", S.number().minimum(1).required());

const server: FastifyPluginAsync<AuthtokensPluginOptions> = async (
  fastify,
  { mount, apiVersion, endpoint, issuer }
) => {
  // fastify
  //   .decorate(
  //     "verifyJWT",
  //     async (request: FastifyRequest, _reply: FastifyReply) => {
  //       await request.jwtVerify();
  //     }
  //   )
  //   .after(() => {
  fastify.route<{ Querystring: { userId: string } }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "GET",
    schema: {
      querystring: getTokenQuerySchema,
    },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const decoded = (await request.jwtVerify()) as SupabaseJWTPayload;
      const { data: authtokens, error } = await fastify.supabase
        .from<
          Pick<
            definitions["authtokens"],
            "userId" | "projectId" | "description" | "niceId"
          >
        >("authtokens")
        .select("projectId,  description, niceId")
        .eq("userId", decoded.sub);

      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }

      reply.status(200).send({
        comment: "Should return array of tokenIds and description",
        method: `${request.method}`,
        url: `${request.url}`,
        data: authtokens,
      });
    },
  });
  fastify.route<{ Body: PostBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "POST",
    schema: { body: postTokenBodySchema },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const { projectId, description } = request.body;
      const decoded = (await request.jwtVerify()) as SupabaseJWTPayload;
      const options: SignOptions = { algorithm: "HS256" };
      const payload: AuthToken = {
        sub: decoded.sub,
        projectId,
        description,
        jti: uuidv4(),
        iss: issuer,
      };
      const token = fastify.jwt.sign(payload, options);
      const hashedToken = await hash(token, 10);
      const { data: projects, error: projError } = await fastify.supabase
        .from<definitions["projects"]>("projects")
        .select("id")
        .eq("id", projectId)
        .eq("userId", decoded.sub);
      if (projError) {
        throw fastify.httpErrors.internalServerError(
          "error while checking for existing project"
        );
      }
      if (!projects || projects.length === 0) {
        throw fastify.httpErrors.notFound("project not found");
      }

      const { data: existingToken, error } = await fastify.supabase
        .from<definitions["authtokens"]>("authtokens")
        .select("*")
        .eq("projectId", projectId)
        .eq("userId", decoded.sub);
      if (error) {
        console.error(error);
        throw fastify.httpErrors.internalServerError(
          "error while checking for existing tokens"
        );
      }
      if (!existingToken || existingToken.length === 0) {
        // no token found
        fastify.log.info(`inserting new token`);

        await fastify.supabase
          .from<definitions["authtokens"]>("authtokens")
          .insert([
            {
              id: hashedToken,
              description,
              projectId,
              userId: decoded.sub,
            },
          ]);
      } else {
        fastify.log.info(`removing existing token ${existingToken[0].id}`);
        // remove old token and insert new one
        await fastify.supabase
          .from<definitions["authtokens"]>("authtokens")
          .delete()
          .eq("id", existingToken[0].id);
        fastify.log.info(`inserting new token`);

        await fastify.supabase
          .from<definitions["authtokens"]>("authtokens")
          .insert([
            {
              id: hashedToken,
              description,
              projectId,
              userId: decoded.sub,
            },
          ]);
      }

      reply.status(201).send({
        comment: "Should do create a token",
        method: `${request.method}`,
        url: `${request.url}`,
        data: { token },
      });
    },
  });

  fastify.route<{ Body: DeleteBody }>({
    url: `/${mount}/${apiVersion}/${endpoint}`,
    method: "DELETE",
    schema: { body: deleteTokenBodySchema },
    preHandler: fastify.auth([fastify.verifyJWT]),

    handler: async (request, reply) => {
      const { tokenId: niceId } = request.body;
      const { data: authtoken, error } = await fastify.supabase
        .from<Pick<definitions["authtokens"], "id" | "niceId">>("authtokens")
        .select("niceId, id")
        .eq("niceId", niceId)
        .single();
      if (!authtoken) {
        throw fastify.httpErrors.notFound("token not found");
      }
      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      if (!authtoken) {
        throw fastify.httpErrors.notFound();
      }
      const success = await fastify.supabase
        .from("authtokens")
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
