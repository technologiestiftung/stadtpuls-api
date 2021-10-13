// TODO: [STADTPULS-399] There are to many places where .env files area read from. Need unification
// TODO: [STADTPULS-403] Could we make postgrest accept our tokens so we can pass requests through?
import { FastifyLoggerOptions } from "fastify";
import {
  port,
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  issuer,
} from "./lib/env";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import pino from "pino";

const transport = pino.transport({
  target: "pino-syslog",

  options: {
    redact: ["req.headers.authorization"],
    enablePipelining: false, // optional (default: true)
    destination: 2, // optional (default: stdout)
    modern: true,
    newlines: true,
    appname: "stadtpuls.com",
  },
});
const pinoLogger = pino(transport);

import buildServer from "./lib/server";

const logger: FastifyLoggerOptions = {
  prettyPrint: true,
};
const server = buildServer({
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: pinoLogger,
  issuer,
});
async function main(): Promise<void> {
  try {
    await server.listen(port, "0.0.0.0");
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

// need this in docker container to properly exit since node doesn't handle SIGINT/EGIMRST;
// this also won't work on using npm start since:
// https://github.com/npm/npm/issues/4603
// https://github.com/npm/npm/pull/10868
// https://github.com/RisingStack/kubernetes-graceful-shutdown-example/blob/master/src/index.js
// if you want to use npm then start with `docker run --init` to help, but I still don't think it's
// a graceful shutdown of node process
//

// quit on ctrl-c when running docker in terminal
// process.on("SIGINT", function onSigint() {
//   console.info(
//     "Got SIGINT (aka ctrl-c in docker). Graceful shutdown ",
//     new Date().toISOString()
//   );
//   shutdown();
// });

// // quit properly on docker stop
// process.on("SIGTERM", function onSigterm() {
//   console.info(
//     "Got SIGTERM (docker container stop). Graceful shutdown ",
//     new Date().toISOString()
//   );
//   shutdown();
// });

// // shut down server
// function shutdown() {
//   waitForSocketsToClose(10);
//   server.close(() => {
//     process.exit();
//   });
// }

// function waitForSocketsToClose(counter: number) {
//   if (counter > 0) {
//     console.log(
//       `Waiting ${counter} more ${
//         counter !== 1 ? "seconds" : "second"
//       } for all connections to close...`
//     );
//     return setTimeout(waitForSocketsToClose, 1000, counter - 1);
//   }
// }
export default server;
