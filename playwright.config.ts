import { defineConfig, devices } from '@playwright/test';

// Where the suite points. Set E2E_BASE_URL to test against an already-running
// server (local dev, a preview deployment) and skip the managed webServer.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const useManagedServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  // Kept out of src/ so Vitest (src/**) never picks these up.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Build + start the real app unless we were pointed at an external URL.
  webServer: useManagedServer
    ? {
        command: process.env.E2E_WEBSERVER_CMD ?? 'pnpm build && pnpm start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
