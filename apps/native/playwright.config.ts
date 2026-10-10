import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8082',
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
  },
  webServer: {
    command: 'python3 -m http.server 8082 --bind 127.0.0.1 --directory dist',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
  },
});
