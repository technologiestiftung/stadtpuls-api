module.exports = function (_w) {
  return {
    autoDetect: true,
    // files: ["src/**/*.ts"],
    filesWithNoCoverageCalculated: ["/src/__test-utils/*.ts"],
    // tests: ["src/lib/__tests__/*.test.ts"],
    runMode: "onsave",
    slowTestThreshold: 1000, // 200 ms
    env: {
      type: "node",
    },
    testFramework: "jest",
  };
};
