import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  reporter: "list",
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://localhost:3000"
  }
});
