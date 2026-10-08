import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.test.ts',
  testIgnore: '**/deployment.test.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 5_000 },
  reporter: 'list',
  outputDir: './test-results/e2e',
  tsconfig: './tsconfig.e2e.json',
  use: {
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
