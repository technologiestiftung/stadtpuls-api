import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
declare module "fastify" {
  export interface FastifyInstance {
    supabase: SupabaseClient;
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
  }
};

export default fp(FastifySupabase);
