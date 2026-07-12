import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const releaseChannel = process.env.PLAYWRIGHT_RELEASE_CHANNEL || "e2e";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `EXPO_PUBLIC_RELEASE_CHANNEL=${releaseChannel} npm run web:build && node scripts/serve-static.js dist ${port}`,
    url: `http://127.0.0.1:${port}`,
    // Release-channel values are compiled into the Expo bundle. Reusing a
    // server can silently test a bundle produced for a different channel.
    reuseExistingServer: false,
    // A cache-cleared Expo export is intentionally used to prevent release
    // channel leakage. Cold CI runners can need more than two minutes.
    timeout: 240_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
