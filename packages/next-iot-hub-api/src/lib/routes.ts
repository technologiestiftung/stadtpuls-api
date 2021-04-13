import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { definitions } from "../common/supabase";
import {
  postHandler,
  deleteHandler,
  postTokenBodySchema,
  deleteTokenBodySchema,
  getHandler,
  getTokenQuerySchema,
} from "./request-handlers/auth";

interface AuthBody {
  userId: number;
  tokenId: number;
}
declare module "fastify" {
  // interface FastifyRequest {
  //   usersPluginProp: string;
  // }
  // interface FastifyReply {
  //   usersPluginProp: number;
  // }
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
// export interface UsersPluginOptions {
//   usersOption: string;
// }
const server: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.route({
    url: "/api/v2",
    method: "GET",
    handler: async (request, reply) => {
      reply.send({
        comment: "Should do healthcheck",
        method: `${request.method}`,
        url: `${request.url}`,
      });
    },
  });

  fastify.route({
    url: "/api",
    method: "GET",

    handler: async (request, reply) => {
      reply.send({
        comment: "Should do healthcheck",
        method: `${request.method}`,
        url: `${request.url}`,
      });
    },
  });
  fastify
    .decorate(
      "verifyJWT",
      async (request: FastifyRequest, _reply: FastifyReply) => {
        await request.jwtVerify();
      }
    )
    .after(() => {
      fastify.route<{ Querystring: { userId: string } }>({
        url: "/api/v2/auth",
        method: "GET",
        schema: {
          querystring: getTokenQuerySchema,
        },
        preHandler: fastify.auth([fastify.verifyJWT]),
        handler: async (request, reply) => {
          const decoded = (await request.jwtVerify()) as {
            aud: "authenticated" | "anon";
            exp: number;
            sub: string;
            email: string;
            app_metadata: { provider: "email"; [key: string]: any };
            user_metadata: Record<string, any>;
            role: "authenticated" | "anon";
          };
          // console.log(decoded);
          // get jwt from request
          // only get tokens that belong to the user
          let { data: authtokens, error } = await fastify.supabase
            .from<
              Pick<definitions["authtokens"], "id" | "userId" | "projectId">
            >("authtokens")
            .select("id, projectId, userId")
            .eq("userId", decoded.sub);
          if (error) {
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
      fastify.route<{ Body: Omit<AuthBody, "tokenId"> }>({
        url: "/api/v2/auth",
        method: "POST",
        schema: { body: postTokenBodySchema },
        handler: postHandler,
      });
      fastify.route<{ Body: AuthBody }>({
        url: "/api/v2/auth",
        method: "DELETE",
        schema: { body: deleteTokenBodySchema },
        handler: deleteHandler,
      });
    });
};

export default fp(server);
