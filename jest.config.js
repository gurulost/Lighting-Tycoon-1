module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/client/$1",
  },
  testMatch: ["**/?(*.)+(test).+(ts|tsx|js)", "**/__tests__/**/*.(ts|tsx|js)"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/static-build/",
    "/server_dist/",
    "/tests/e2e/",
  ],
};
