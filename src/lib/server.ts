import "make-promises-safe";
import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fastifyBlipp from "fastify-blipp";
import fastifyJwt from "fastify-jwt";
import fastifyHelmet from "fastify-helmet";
import fastifyCors from "fastify-cors";
import fastifySensible from "fastify-sensible";
import fastifyAuth from "fastify-auth";

import fastifySupabase from "@technologiestiftung/fastify-supabase";

import routes from "./authtokens";
import ttn from "../integrations/ttn";

export const buildServer: (options: {
  jwtSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  logger: boolean;
  issuer: string;
}) => FastifyInstance = ({
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger,
  issuer,
}) => {
  const routeOptions = {
    endpoint: "authtokens",
    mount: "api",
    apiVersion: "v2",
    issuer,
  };
  const server = fastify({ logger });

  server.register(fastifyBlipp);
  server.register(fastifyHelmet);
  server.register(fastifyCors);
  server.register(fastifySensible);
  server.register(fastifyAuth);
  server.register(fastifyJwt, {
    secret: jwtSecret,
  });
  server.register(fastifySupabase, {
    supabaseUrl,
    supabaseServiceRoleKey,
  });
  server.decorate(
    "verifyJWT",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      await request.jwtVerify();
    }
  );
  server.register(routes, routeOptions);
  server.register(ttn);

  [
    "/",
    `/${routeOptions.mount}`,
    `/${routeOptions.mount}/${routeOptions.apiVersion}`,
  ].forEach((path) => {
    server.route({
      method: ["GET"],
      url: path,
      handler: async (request, reply) => {
        reply.send({
          comment: "healthcheck",
          method: `${request.method}`,
          url: `${request.url}`,
        });
      },
    });
  });
  return server;
};

export default buildServer;
