import { defineConfig, devices } from '@playwright/test';

const e2eBaseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5175';

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [['list']],
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: e2eBaseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'pnpm run dev --host 127.0.0.1 --port 5175 --strictPort',
        reuseExistingServer: true,
        timeout: 120_000,
        url: e2eBaseURL,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
