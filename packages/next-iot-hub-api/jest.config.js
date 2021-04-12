const { merge } = require("@inpyjamas/scripts/dist/utlities");
const inPjsConfig = require("@inpyjamas/scripts/jest");
module.exports = merge(inPjsConfig, {
  testPathIgnorePatterns: ["<rootDir>/src/__test-utils"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/__test-utils/*"],
});
