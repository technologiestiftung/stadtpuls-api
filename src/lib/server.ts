import "make-promises-safe";
import config from "config";
import fastify, {
  FastifyInstance,
  FastifyLoggerOptions,
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
import signin from "./signin";
import sensorsRecordsRoutes from "./sensors-records";

import ttn from "../integrations/ttn";
import http from "../integrations/http";
import { getResponseDefaultSchema } from "../common/schemas";
import pino from "pino";

const apiVersion = config.get<number>("apiVersion");
const mountPoint = config.get<string>("mountPoint");
export const buildServer: (options: {
  jwtSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  logger: boolean | FastifyLoggerOptions | pino.Logger;
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
  const singinRouteOptoins = {
    endpoint: "signin",
    mount: mountPoint,
    apiVersion: `v${apiVersion}`,
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
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
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

  // TODO: [STADTPULS-398] Write Schemas for all responses
  // https://www.fastify.io/docs/latest/Validation-and-Serialization/#adding-a-shared-schema
  server.addSchema(getResponseDefaultSchema);

  server.register(signin, singinRouteOptoins);
  server.register(signup, singupRouteOptoins);
  server.register(routesAuth, authtokensRouteOptions);
  server.register(sensorsRecordsRoutes, sensorsRouteOptions);
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
      logLevel: process.env.NODE_ENV === "production" ? "warn" : "info",
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
