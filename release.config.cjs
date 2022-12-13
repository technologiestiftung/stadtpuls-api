module.exports = {
  extends: "@technologiestiftung/semantic-release-config",
  branches: [
    { name: "main" },
    { name: "staging", channel: "pre/rc", prerelease: "rc" }, // `prerelease` is built with the template `${name.replace(/^pre\\//g, "")}`
    { name: "beta", channel: "beta", prerelease: true }, // `prerelease` is set to `beta` as it is the value of `name`
  ],
  npmPublish: false,
  dryRun: false,
  plugins: [
    [
      "@saithodev/semantic-release-backmerge",
      {
        branch: ["staging"],
        backmergeStrategy: "merge",
      },
    ],
  ],
};
