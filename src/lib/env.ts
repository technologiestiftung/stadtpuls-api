import { Env } from "@humanwhocodes/env";
import { LogLevel } from "fastify";
const env = new Env();
const jwtSecret = env.require("JWT_SECRET");

const port = parseInt(env.require("PORT"));
const databaseUrl = env.require("DATABASE_URL");
const supabaseUrl = env.require("SUPABASE_URL");
const supabaseServiceRoleKey = env.require("SUPABASE_SERVICE_ROLE_KEY");
const issuer = env.require("ISSUER");
const logLevel = env.require("LOG_LEVEL") as LogLevel;
const logLevels = ["info", "error", "debug", "fatal", "warn", "trace"];
if (!logLevels.includes(logLevel)) {
  throw new Error(
    `Environment variable LOG_LEVEL must be one of ${logLevels.join(", ")}`
  );
}

export {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  port,
  issuer,
  databaseUrl,
  logLevel,
};
