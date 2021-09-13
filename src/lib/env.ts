import { Env } from "@humanwhocodes/env";
const env = new Env();
const jwtSecret = env.require("JWT_SECRET");

const port = parseInt(env.require("PORT"));
const supabaseUrl = env.require("SUPABASE_URL");
const supabaseServiceRoleKey = env.require("SUPABASE_SERVICE_ROLE_KEY");
const issuer = env.require("ISSUER");

export { jwtSecret, supabaseUrl, supabaseServiceRoleKey, port, issuer };
