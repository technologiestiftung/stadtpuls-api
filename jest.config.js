/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "./dev-tools/local-supabase/.env"),
});
const { merge } = require("@inpyjamas/scripts/dist/utlities");
const inPjsConfig = require("@inpyjamas/scripts/jest");
module.exports = merge(inPjsConfig, {
  testPathIgnorePatterns: [
    "<rootDir>/src/__test-utils/*",
    "<rootDir>/dev-tools/*",
    "<rootDir>/dist/*",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/__test-utils/*",
    "!src/mocks/*",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
});
