/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
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
