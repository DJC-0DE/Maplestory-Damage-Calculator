import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js', // Only run .spec.js files, exclude .test.js files
  fullyParallel: true, // Run tests in parallel
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4, // Run up to 4 tests in parallel (adjust based on your CPU)
  reporter: 'line',
  timeout: 60000, // 60 second timeout per test
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start local server before tests
  webServer: {
    command: 'npx http-server -p 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
