/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require("@inpyjamas/scripts/dist/utlities/index");
const inPjsConfig = require("@inpyjamas/scripts/eslint");
module.exports = merge(inPjsConfig, {
  root: true,
});
