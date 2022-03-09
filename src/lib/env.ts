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
const redisUrl = env.require("REDIS_URL");
const stage = env.require("STAGE");

const logFlareApiKey = env.get("LOG_FLARE_API_KEY");
const logFlareSourceToken = env.get("LOG_FLARE_SOURCE_TOKEN");

const logLevels = ["info", "error", "debug", "fatal", "warn", "trace"];
const supabaseMaxRows = parseInt(env.require("SUPABASE_MAX_ROWS"), 10);
if (isNaN(supabaseMaxRows)) {
  throw new Error(
    "Environment variable 'SUPBASE_MAX_ROWS' could not be parsed to int"
  );
}

if (!logLevels.includes(logLevel)) {
  throw new Error(
    `Environment variable LOG_LEVEL must be one of ${logLevels.join(", ")}`
  );
}

export {
  databaseUrl,
  issuer,
  jwtSecret,
  logLevel,
  logFlareApiKey,
  logFlareSourceToken,
  port,
  redisUrl,
  stage,
  supabaseMaxRows,
  supabaseServiceRoleKey,
  supabaseUrl,
};
