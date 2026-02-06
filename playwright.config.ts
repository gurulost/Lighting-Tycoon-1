import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const isCI = !!process.env.CI;
const runFullMatrix = process.env.PLAYWRIGHT_FULL_MATRIX === "1";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `EXPO_PUBLIC_E2E=1 npm run web:build && node scripts/serve-static.js dist ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    ...(runFullMatrix
      ? [
          {
            name: "firefox",
            use: { browserName: "firefox" as const },
          },
          {
            name: "webkit",
            use: { browserName: "webkit" as const },
          },
        ]
      : []),
  ],
});
