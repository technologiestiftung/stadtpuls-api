import "make-promises-safe";
import fastify, { FastifyInstance } from "fastify";
import fastifyBlipp from "fastify-blipp";
import fastifyJwt from "fastify-jwt";
import fastifyHelmet from "fastify-helmet";
import fastifyCors from "fastify-cors";
import fastifySensible from "fastify-sensible";
import fastifyAuth from "fastify-auth";

import fastifySupabase from "@technologiestiftung/fastify-supabase";

import routes from "./routes";

export const buildServer: (options: {
  jwtSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  logger: boolean;
}) => FastifyInstance = ({
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger,
}) => {
  const server = fastify({ logger });

  server.register(fastifyBlipp);
  server.register(fastifyHelmet);
  server.register(fastifyCors);
  server.register(fastifySensible);
  server.register(fastifyAuth);
  server.register(fastifyJwt, {
    secret: jwtSecret,
  });
  server.register(fastifySupabase, { supabaseUrl, supabaseServiceRoleKey });
  server.register(routes);
  return server;
};

export default buildServer;
