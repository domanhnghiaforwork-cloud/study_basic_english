import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 30000,
  workers: 3,
  use: { baseURL: 'http://127.0.0.1:5174', timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'node tests/e2e/server.mjs', url: 'http://127.0.0.1:5174', reuseExistingServer: false,
    env: { STUDY_DB_PATH: `outputs/e2e-${process.pid}.sqlite` },
  },
});
