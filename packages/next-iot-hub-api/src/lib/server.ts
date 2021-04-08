import "make-promises-safe";
import fastify from "fastify";
import fastifyBlipp from "fastify-blipp";
import fastifyJwt from "fastify-jwt";
import fastifyHelmet from "fastify-helmet";
import fastifyCors from "fastify-cors";
import fastifySensible from "fastify-sensible";
import fastifySupabase from "@technologiestiftung/fastify-supabase";
import { jwtSecret, supabaseUrl, supabaseServiceRoleKey } from "./env";

import routes from "./routes";
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

export default server;
