import {
  port,
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
} from "./lib/env";

import buildServer from "./lib/server";

const server = buildServer({ jwtSecret, supabaseUrl, supabaseServiceRoleKey });
async function main(): Promise<void> {
  try {
    await server.listen(port);
    server.log.info(`Server listening on http://localhost:${port}`);
    server.blipp();
  } catch (error) {
    console.error(error);
    server.log.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("called directly");
  main().catch((error) => {
    console.error(error);
    server.log.error(error);
    process.exit(1);
  });
}

export default server;
