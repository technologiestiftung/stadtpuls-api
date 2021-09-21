import "make-promises-safe";
import config from "config";
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
import fastifyRateLimit from "fastify-rate-limit";
// import fastifyPostgres from "fastify-postgres";

import fastifySupabase from "@technologiestiftung/fastify-supabase";

import routesAuth from "./authtokens";
import signup from "./signup";
import sensors from "./sensors";

import ttn from "../integrations/ttn";
import http from "../integrations/http";

const apiVersion = config.get<number>("apiVersion");
const mountPoint = config.get<string>("mountPoint");
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
  const authtokensRouteOptions = {
    endpoint: "authtokens",
    mount: mountPoint,
    apiVersion: `v${apiVersion}`,
    issuer,
  };
  const singupRouteOptoins = {
    endpoint: "signup",
    mount: mountPoint,
    apiVersion: `v${apiVersion}`,
  };
  const sensorsRouteOptions = {
    endpoint: "sensors",
    mount: mountPoint,
    apiVersion: `v${apiVersion}`,
  };

  const server = fastify({
    logger,
    ignoreTrailingSlash: true,
    exposeHeadRoutes: true,
  });

  server.register(fastifyBlipp);
  server.register(fastifyRateLimit, {
    allowList: ["127.0.0.1"],
  });
  server.register(fastifyHelmet);
  server.register(fastifyCors);
  server.register(fastifySensible);
  server.register(fastifyAuth);
  // server.register(fastifyPostgres, {
  //   connectionString: databaseUrl,
  // });
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
  server.register(signup, singupRouteOptoins);
  server.register(routesAuth, authtokensRouteOptions);
  server.register(sensors, sensorsRouteOptions);
  server.register(ttn);
  server.register(http);

  [
    "/",
    `/${authtokensRouteOptions.mount}`,
    `/${authtokensRouteOptions.mount}/${authtokensRouteOptions.apiVersion}`,
  ].forEach((path) => {
    server.route({
      method: ["GET", "HEAD"],
      url: path,
      logLevel: "warn",
      exposeHeadRoute: true,
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
