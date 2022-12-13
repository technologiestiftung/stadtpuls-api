import "make-promises-safe";
import config from "config";
import fastify, {
  FastifyInstance,
  FastifyLoggerOptions,
  FastifyReply,
  FastifyRequest,
  HTTPMethods,
} from "fastify";
import fastifyBlipp from "fastify-blipp";
import fastifyJwt from "@fastify/jwt";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifySensible from "fastify-sensible";
import fastifyAuth from "@fastify/auth";
import fastifyRateLimit from "@fastify/rate-limit";
import ajvError from "ajv-errors";
// TODO: [BA-70] Add useful formats for validation once we are in fastify 4
// import ajvFormats from "ajv-formats";

import fastifySupabase from "./supabase";
import routesAuth from "./authtokens";
import signup from "./signup";
import signin from "./signin";
import sensorsRecordsRoutes from "./sensors-records";

import ttn from "../integrations/ttn";
import http from "../integrations/http";
import { getResponseDefaultSchema } from "../common/schemas";
import pino from "pino";
import Redis from "ioredis";
import { redisUrl, ShutdownLevels, stage } from "./env";
const apiVersion = config.get<number>("apiVersion");
const mountPoint = config.get<string>("mountPoint");

export const buildServer: (options: {
  jwtSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  logger: boolean | FastifyLoggerOptions | pino.Logger;
  issuer: string;
  shutdownLevel?: ShutdownLevels;
}) => FastifyInstance = ({
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger,
  issuer,
  shutdownLevel = 0,
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
    // TODO: [BA-71] Update ajvError to latests once we are in fastify 4
    ajv: {
      plugins: [ajvError /*,[ajvFormats, { formats: ["iso-date-time"] }]*/],
      customOptions: {
        // jsonPointers: true,
        allErrors: true,
        removeAdditional: false,
      },
    },
  });
  let redis: Redis.Redis | undefined;

  // eslint-disable-next-line prefer-const
  redis = new Redis(redisUrl, {
    connectionName: `stadtpuls-api-${stage}`,

    autoResubscribe: false,
    // lazyConnect: true,
    connectTimeout: 500,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
  });
  redis.on("error", (err) => {
    server.log.error(err);
  });

  server.register(fastifyBlipp);

  server.register(fastifyRateLimit, {
    allowList: ["127.0.0.1"],
    redis,
  });
  server.register(fastifyHelmet);
  server.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  });
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

  // disable singup when we go into grace period
  if (shutdownLevel === ShutdownLevels.none) {
    server.register(signup, singupRouteOptoins);
  } else {
    server.route({
      method: "POST",
      url: `/${singupRouteOptoins.mount}/${singupRouteOptoins.apiVersion}/${singupRouteOptoins.endpoint}`,
      handler: (_request, reply) => {
        reply.code(404).send({
          error: "Not Found",
          statusCode: 404,
          message:
            "Signup is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        });
      },
    });
  }
  // Disable all actionable routes when we are in shutdown
  // This means we can also pause the project on render.com
  if (shutdownLevel !== ShutdownLevels.shutdown) {
    server.register(signin, singinRouteOptoins);
    server.register(routesAuth, authtokensRouteOptions);
    server.register(sensorsRecordsRoutes, sensorsRouteOptions);
    server.register(ttn);
    server.register(http);
  } else {
    server.route({
      url: `/${singinRouteOptoins.mount}/${singinRouteOptoins.apiVersion}/${singinRouteOptoins.endpoint}`,
      method: "POST",

      handler: (_request, reply) => {
        reply.code(404).send({
          error: "Not Found",
          statusCode: 404,
          message:
            "Signin is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        });
      },
    });
    server.route({
      url: `/${authtokensRouteOptions.mount}/${authtokensRouteOptions.apiVersion}/${authtokensRouteOptions.endpoint}`,
      method: ["POST", "GET", "DELETE", "PUT"],
      handler: (_request, reply) => {
        reply.code(404).send({
          error: "Not Found",
          statusCode: 404,
          message:
            "Authtoken retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        });
      },
    });
    const apiVersion = config.get<number>("apiVersion");
    const mountPoint = config.get<string>("mountPoint");
    const sensorRoutes: {
      url: string;
      method: HTTPMethods[];
      message?: string;
    }[] = [
      {
        url: `/${mountPoint}/v${apiVersion}/integrations/ttn/v3`,
        method: ["POST"],
        message:
          "TTN integration is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
      },
      {
        method: ["GET", "HEAD", "POST"],
        url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId/records`,
      },
      {
        method: ["GET", "HEAD"],
        url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId/records/recordId`,
      },
      {
        method: ["GET", "HEAD"],
        url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId`,
      },
      {
        method: ["GET", "HEAD"],
        url: `/${mountPoint}/v${apiVersion}/sensors/`,
      },
    ];
    sensorRoutes.forEach((item) => {
      server.route({
        url: item.url,
        method: item.method,
        handler: (_request, reply) => {
          reply.code(404).send({
            error: "Not Found",
            statusCode: 404,
            message: item.message
              ? item.message
              : "Sensors and records creation and retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
          });
        },
      });
    });
  }

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
