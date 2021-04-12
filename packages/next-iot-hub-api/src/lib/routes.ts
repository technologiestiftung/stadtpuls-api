import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
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

  fastify.route<{ Querystring: { userId: string } }>({
    url: "/api/v2/auth",
    method: "GET",
    schema: {
      querystring: getTokenQuerySchema,
    },
    handler: getHandler,
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
};

export default fp(server);
