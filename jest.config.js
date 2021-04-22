/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "./dev-tools/local-supabase/.env"),
});
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log(process.env.SUPABASE_ANON_KEY);
const { merge } = require("@inpyjamas/scripts/dist/utlities");
const inPjsConfig = require("@inpyjamas/scripts/jest");
module.exports = merge(inPjsConfig, {
  testPathIgnorePatterns: [
    "<rootDir>/src/__test-utils/*",
    "<rootDir>/dev-tools/*",
  ],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/__test-utils/*"],
  setupFilesAfterEnv: ["./jest.setup.js"],
});
