import "make-promises-safe";
import fastify, { FastifyInstance } from "fastify";
import fastifyBlipp from "fastify-blipp";
import fastifyJwt from "fastify-jwt";
import fastifyHelmet from "fastify-helmet";
import fastifyCors from "fastify-cors";
import fastifySensible from "fastify-sensible";
import fastifySupabase from "@technologiestiftung/fastify-supabase";

import routes from "./routes";

export const buildServer: (options: {
  jwtSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}) => FastifyInstance = ({
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
}) => {
  const server = fastify({ logger: true });

  server.register(fastifyHelmet);
  server.register(fastifyCors);
  server.register(fastifySensible);
  server.register(fastifyJwt, {
    secret: jwtSecret,
  });
  server.register(fastifyBlipp);
  server.register(fastifySupabase, { supabaseUrl, supabaseServiceRoleKey });
  server.register(routes);
  return server;
};

export default buildServer;
