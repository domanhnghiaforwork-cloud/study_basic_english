import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export const test = base.extend({
  authenticated: [async ({ page }, use) => {
    const username = `qa_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
    const response = await page.request.post('/api/auth/register', { data: { username, password: 'Test-password-123', confirmPassword: 'Test-password-123' } });
    expect(response.status()).toBe(201);
    await use({ username });
  }, { auto: true }],
});
export { expect };

export async function seedProgress(page, state) {
  const response = await page.request.post('/api/progress', { data: { type: 'import', state } });
  expect(response.ok()).toBeTruthy();
  expect((await page.request.post('/api/progress', { data: { type: 'open', lessonId: state.currentLesson } })).ok()).toBeTruthy();
  expect((await page.request.post('/api/progress', { data: { type: 'font', fontSize: state.fontSize } })).ok()).toBeTruthy();
}
