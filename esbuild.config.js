/* eslint-disable @typescript-eslint/no-var-requires */
//@ts-check
// const fs = require("fs");
// const path = require("path");
// const cwd = process.cwd();
const glob = require("glob");
const entryPoints = glob.sync("src/**/*.ts", {
  ignore: ["**/__tests__/**/*.ts", "**/__test-utils/**/*.ts", "**/*.test.ts"],
});
// process.exit(0);
require("esbuild")
  .build({
    platform: "node",
    sourcemap: true,
    banner: {
      js: '"use strict";',
    },
    target: ["es2020", "node14"],
    format: "cjs",
    entryPoints,
    outdir: "dist",
    tsconfig: "tsconfig.build.json",
  })
  .then((result) => {
    console.info("Esbuild is processing these files:");
    console.info(entryPoints.join("\n"));
    if (result.outputFiles) console.info(result.outputFiles);
    if (result.warnings.length > 0) console.warn(result.warnings);
    if (result.errors.length > 0) console.error(result.errors);
    console.log("⚡ Esbuild is done");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
