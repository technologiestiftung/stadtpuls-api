import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { definitions } from "../common/supabase";
import { compare } from "./crypto";
import * as bycrypt from "bcrypt";
type CheckAuthtokenExistsType = (
  token: string,
  userId: string
) => Promise<boolean>;
declare module "fastify" {
  export interface FastifyInstance {
    supabase: SupabaseClient;
    checkAuthtokenExists: CheckAuthtokenExistsType;
  }
}

export interface SupabasePluginOptions {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

const FastifySupabase = async (
  fastify: FastifyInstance,
  opts: SupabasePluginOptions
) => {
  const checkAuthtokenExists: CheckAuthtokenExistsType = async (
    token,
    userId
  ) => {
    // get all tokens from user
    const { data: authtokens, error } = await fastify.supabase
      .from<definitions["auth_tokens"]>("auth_tokens")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      fastify.log.error("postgres error");
      throw fastify.httpErrors.internalServerError(error.hint);
    }
    if (!authtokens || authtokens.length === 0) {
      fastify.log.warn("no token found");
      throw fastify.httpErrors.unauthorized();
    }
    // compare all tokens ids with actual token
    let authtoken: definitions["auth_tokens"] | null = null;
    let foundOldToken = false;
    for (const at of authtokens) {
      if (at.salt.length === 0) {
        // we have one of our old tokens and we actually cant
        // verify which is which. So we at least checked that the
        // user exisits.
        const comparedOld = await bycrypt.compare(token, at.id);
        if (comparedOld) {
          foundOldToken = true;
          fastify.log.warn(
            `old token was used, token nice id ${at.nice_id} user ${userId}`
          );
        }
      } else {
        const compared = await compare({
          provided: token,
          stored: at.id,
          salt: at.salt,
        });
        if (compared === true) {
          authtoken = at;
          break;
        }
      }
    }

    if (foundOldToken) {
      return true;
    }
    return authtoken !== null ? true : false;
  };

  const supabaseAdmin = createClient(
    opts.supabaseUrl,
    opts.supabaseServiceRoleKey,
    {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      realtime: {
        timeout: 1,
      },
    }
  );
  if (!fastify.supabase) {
    fastify.decorate("supabase", supabaseAdmin);
    fastify.decorate("checkAuthtokenExists", checkAuthtokenExists);
  }
};
export default fp(FastifySupabase);
