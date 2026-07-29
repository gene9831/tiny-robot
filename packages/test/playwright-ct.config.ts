import { defineConfig, devices } from '@playwright/experimental-ct-vue'

export default defineConfig({
  testDir: './component',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { open: 'never', outputFolder: 'component/playwright-report' }]],
  outputDir: 'component/test-results',
  use: {
    ctPort: 3100,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
