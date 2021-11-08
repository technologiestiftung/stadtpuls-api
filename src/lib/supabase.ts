import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
declare module "fastify" {
  export interface FastifyInstance {
    supabase: SupabaseClient;
  }
  // interface FastifyRequest {
  //   usersPluginProp: string;
  // }
  // interface FastifyReply {
  //   usersPluginProp: number;
  // }
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

// async function main(): Promise<void> {
//   try {
//     const { fastify } = await import("fastify");
//     const server = fastify({ logger: true });
//     const supabaseServiceRoleKey = process.env.supabaseServiceRoleKey;
//     const supabaseUrl = process.env.supabaseUrl;
//     const PORT = process.env.PORT || 3000;
//     if (!supabaseUrl || !supabaseServiceRoleKey) {
//       throw new Error("Env not defined.");
//     }
//     server.register(fp(FastifySupabase), {
//       supabaseServiceRoleKey,
//       supabaseUrl,
//     });
//     await server.listen(PORT);
//     server.log.info(`Server listening on http://localhost:${PORT}`);
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
// }

// if (require.main === module) {
//   console.log("called directly");
//   main().catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
// }
export default fp(FastifySupabase);
