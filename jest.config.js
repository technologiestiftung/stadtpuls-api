/* eslint-disable @typescript-eslint/no-var-requires */
//@ts-check
const path = require("path");
const fs = require("fs");
const isCi = require("is-ci");
if (!isCi) {
  const envFilePath = path.resolve(__dirname, "./.env.test");

  if (!fs.existsSync(envFilePath)) {
    console.error(
      `Please create the file ${envFilePath} with the following variables:


      SUPABASE_URL=
      SUPABASE_ANON_KEY=
      SUPABASE_SERVICE_ROLE_KEY=
      Database_URL=postgres://postgres:postgres@localhost:5432/postgres
      JWT_SECRET=
      PORT=4000
      ISSUER=

You can find them all in
dev-tools/local-supabase/docker/kong/kong.yml
and
dev-tools/local-supabase/docker/docker-compose.yml

      `
    );
    process.exit(1);
  }

  require("dotenv").config({
    path: envFilePath,
  });
}

const { merge } = require("@inpyjamas/scripts/dist/utlities");
const inPjsConfig = require("@inpyjamas/scripts/jest");
module.exports = merge(inPjsConfig, {
  testPathIgnorePatterns: [
    "<rootDir>/src/__test-utils/*",
    "<rootDir>/dev-tools/*",
    "<rootDir>/dist/*",
    "<rootDir>/supabase/*",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/__test-utils/*",
    "!src/mocks/*",
    "!src/common/supabase.ts",
    "!src/index.ts",
    "!src/common/jwt.ts",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  globalTeardown: "./jest.teardown.js",
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
});
