import { Env } from "@humanwhocodes/env";
const env = new Env();
const jwtSecret = env.get(
  "JWT_SECRET",
  "mysecretneedsatleast32characters"
) as string;
const port = parseInt(env.get("PORT", "4000") as string);
const supabaseUrl = env.require("SUPABASE_URL");
const supabaseServiceRoleKey = env.require("SUPABASE_SERVICE_ROLE_KEY");
const issuer = env.get(
  "TOKEN_ISSUER",
  "technologiestiftung-berlin.de"
) as string;

export { jwtSecret, supabaseUrl, supabaseServiceRoleKey, port, issuer };
