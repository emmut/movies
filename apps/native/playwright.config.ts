import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8083',
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
  },
  webServer: {
    command: 'python3 e2e/serve.py',
    url: 'http://localhost:8083',
    reuseExistingServer: !process.env.CI,
  },
});
