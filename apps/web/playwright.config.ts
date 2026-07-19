import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end configuration.
 * - Uses a dedicated port (3100) so a developer's own app on 3000 is never
 *   reused by mistake.
 * - Requires the API on http://localhost:8000 with the docker-compose
 *   database seeded (scripts/db-reset.sh) — see TESTING_STRATEGY.md.
 * - Auth-dependent specs are skipped automatically when Supabase env is
 *   absent.
 */
const E2E_PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${E2E_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next dev --port ${E2E_PORT}`,
        url: `http://localhost:${E2E_PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
        },
      },
});
