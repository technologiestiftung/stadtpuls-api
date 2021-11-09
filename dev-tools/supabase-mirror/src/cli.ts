#!/usr/bin/env node
import yargs from "yargs/yargs";
import execa from "execa";
import process from "process";

const parser = yargs(process.argv.slice(2))
  .usage("usage: $0 <command>")
  .group(["i", "o"], "Input/Output:")
  .group(["p", "h", "d", "u", "W"], "Environment Variables:")
  .env("STADTPULS")
  .epilogue(
    `All values in group "Environment Variables" can be overwritten with environment variables prefixed by STADTPULS_e.g. STADTPULS_PGPORT\n\n`
  )
  .options({
    o: {
      type: "string",
      alias: "output",
      default: "./stadtpuls.dump",
      describe: "output file for the custom archive",
    },
    i: {
      type: "string",
      alias: "input",
      default: "./stadtpuls.dump",
      describe: "input file for the custom archive",
    },
    p: {
      type: "number",
      alias: "pgport",
      default: 5432,
      describe: "postgres port",
    },
    h: {
      type: "string",
      alias: "pghost",
      default: "localhost",
      describe: "postgres host",
    },
    d: {
      type: "string",
      alias: "pgdatabase",
      default: "postgres",
      describe: "postgres database",
    },
    u: {
      type: "string",
      alias: "pguser",
      default: "postgres",
      describe: "postgres user",
    },
    W: {
      type: "string",
      alias: "pgpassword",
      default: "postgres",
      describe: "postgres password",
    },
  })
  // .middleware((argv) => {
  //   inquirer
  //     .prompt([
  //       {
  //         type: "input",
  //         name: "apply",
  //         message: `the command ${argv} will be applied with the following env variables:

  //     Are you sure? yes/NO. Only yes will proceed.
  //       `,
  //       },
  //     ])
  //     /* Pass your questions in here */

  //     .then((answers) => {
  //       if (answers.apply !== "yes") {
  //         process.exit(0);
  //       }
  //     })
  //     .catch((error) => {
  //       if (error.isTtyError) {
  //         console.error(
  //           "Prompt couldn't be rendered in the current environment"
  //         );
  //         process.exit(1);
  //         // Prompt couldn't be rendered in the current environment
  //       } else {
  //         console.error(error);
  //         process.exit(1);
  //         // Something else went wrong
  //       }
  //     });
  // })
  .command(
    "dump",
    "dumps some tables into custom postgres archive",
    async function (yargs) {
      const args = await yargs.argv;
      const opts: execa.Options = {
        env: {
          PGPORT: args.pgport as string,
          PGHOST: args.pghost as string,
          PGUSER: args.pguser as string,
          PGPASSWORD: args.pgpassword as string,
          PGDATABASE: args.pgdatabase as string,
          STADTPULS_DUMP_PATH: args.output as string,
        },
      };
      try {
        await execa("./dump.sh", [], opts);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
  )
  .command(
    "restore",
    "restores tables from custom postgres archive",
    async function (yargs) {
      const args = await yargs.argv;
      const opts: execa.Options = {
        env: {
          PGPORT: args.pgport as string,
          PGHOST: args.pghost as string,
          PGUSER: args.pguser as string,
          PGPASSWORD: args.pgpassword as string,
          PGDATABASE: args.pgdatabase as string,
          STADTPULS_DUMP_PATH: args.input as string,
        },
      };
      try {
        await execa("./restore.sh", [], opts);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
  );
async function main() {
  try {
    await execa("command", ["docker"]);
  } catch (e) {
    console.error("docker executable not found. Abort!");
    process.exit(1);
  }
  await parser.argv;
  // execute shell script using execa with subcommands dump and restore
  // console.log("supabase-mirror", argv);
}

main().catch(console.error);
