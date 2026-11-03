import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'Test-password-123';
const uniqueName = () => `user_${randomUUID().replaceAll('-', '').slice(0, 15)}`;
async function credentials(page, username) {
  await page.locator('#auth-username').fill(username);
  await page.locator('#auth-password').fill(password);
}
async function register(page, username) {
  await page.goto('/');
  await expect(page.locator('#auth-view')).toBeVisible();
  await page.locator('#auth-toggle').click();
  await credentials(page, username);
  await page.locator('#auth-confirm').fill(password);
  await page.locator('#auth-submit').click();
  await expect(page.locator('#passage')).toBeVisible();
}
async function login(page, username) {
  await page.goto('/');
  await credentials(page, username);
  await page.locator('#auth-submit').click();
  await expect(page.locator('#passage')).toBeVisible();
}

test('simple registration validates repeat password, login errors are recoverable and sessions survive reload', async ({ page }) => {
  const username = uniqueName();
  await page.goto('/#read/50');
  await expect(page.locator('#app-shell')).toBeHidden();
  await expect(page.locator('#auth-confirm')).toBeHidden();
  await page.locator('#auth-toggle').click();
  await credentials(page, username);
  await page.locator('#auth-confirm').fill('mismatch-password');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#auth-message')).toContainText('chưa khớp');
  await page.locator('#auth-confirm').fill(password);
  await page.locator('#auth-submit').click();
  await expect(page.locator('#account-username')).toHaveText(username);
  await expect(page.locator('#lesson-number')).toHaveText('01');
  await page.reload();
  await expect(page.locator('#passage')).toBeVisible();
  await page.locator('#logout-button').click();
  await expect(page.locator('#auth-view')).toBeVisible();
  await credentials(page, username);
  await page.locator('#auth-password').fill('incorrect-password');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#auth-message')).toContainText('không đúng');
  await page.locator('#auth-password').fill(password);
  await page.locator('#auth-submit').click();
  await expect(page.locator('#passage')).toBeVisible();
});

test('switching users isolates reading, calendar and real SQLite AI logs; another device restores them', async ({ page, browser }) => {
  const alice = uniqueName(), bob = uniqueName();
  await register(page, alice);
  await page.locator('#complete-button').click();
  await page.locator('#next-lesson').click();
  await expect(page.locator('#lesson-number')).toHaveText('02');
  await page.locator('.segment').first().focus();
  await page.keyboard.press('Enter');
  await page.locator('#ai-question').fill('my question');
  await page.locator('#ai-submit').click();
  await expect(page.locator('#ai-answer')).toContainText('my question');
  await page.locator('#close-translation').click();
  await page.locator('[data-view="history"]').click();
  await page.locator('#ai-logs-toggle').click();
  await expect(page.locator('.ai-log-row')).toHaveCount(1);
  await expect(page.locator('.ai-log-row')).toContainText('my question');
  await page.locator('.ai-log-row summary').click();
  await expect(page.locator('.ai-log-row [lang="en"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#logout-button').click();
  await expect(page.locator('#auth-title')).toHaveText('Đăng nhập');
  await register(page, bob);
  await expect(page.locator('#lesson-number')).toHaveText('01');
  await expect(page.locator('#complete-button')).toBeEnabled();
  await page.locator('[data-view="calendar"]').click();
  await expect(page.locator('#calendar-stats strong').first()).toHaveText('0');
  await page.locator('[data-view="history"]').click();
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(0);
  await page.locator('#ai-logs-toggle').click();
  await expect(page.locator('.ai-log-row')).toHaveCount(0);
  await expect(page.locator('#ai-logs-status')).toContainText('Chưa có');
  await page.keyboard.press('Escape');
  const device = await browser.newContext({ baseURL: new URL(page.url()).origin, viewport: { width: 375, height: 812 } });
  try {
    const other = await device.newPage();
    await login(other, alice);
    await expect(other.locator('#lesson-number')).toHaveText('02');
    await other.locator('[data-view="history"]').click();
    await expect(other.locator('#history-list .lesson-row')).toHaveCount(1);
    await other.locator('#ai-logs-toggle').click();
    await expect(other.locator('.ai-log-row')).toHaveCount(1);
  } finally { await device.close(); }
});

test('a cookie changed in another tab cannot save the previous user progress into the new account', async ({ page }) => {
  await register(page, uniqueName());
  const alice = (await (await page.request.get('/api/auth/me')).json()).user;
  const response = await page.request.post('/api/auth/register', { data: { username: uniqueName(), password, confirmPassword: password } });
  expect(response.status()).toBe(201);
  const bob = (await response.json()).user;
  expect(bob.id).not.toBe(alice.id);
  await page.locator('#complete-button').click();
  await expect(page.locator('#auth-view')).toBeVisible();
  const { state } = await (await page.request.get('/api/progress')).json();
  expect(state.records).toEqual([]);
});

test('failed saves retry after reconnect and survive page reload without leaking into another account', async ({ page }) => {
  await register(page, uniqueName());
  await page.route('**/api/progress', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, json: { error: 'Offline' } }) : route.continue());
  await page.locator('#complete-button').click();
  await expect(page.locator('#storage-warning')).toContainText('Chưa lưu');
  await page.locator('#logout-button').click();
  await expect(page.locator('#app-shell')).toBeVisible();
  await page.unroute('**/api/progress');
  await page.reload();
  await expect(page.locator('#complete-button')).toBeDisabled();
  await expect.poll(async () => (await (await page.request.get('/api/progress')).json()).state.records.length).toBe(1);
  await expect(page.locator('#storage-warning')).toBeHidden();
});

test('an unavailable account progress request shows a recoverable login screen', async ({ page }) => {
  const username = uniqueName();
  await register(page, username);
  await page.route('**/api/progress', route => route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } }));
  await page.reload();
  await expect(page.locator('#auth-loading')).toBeHidden();
  await expect(page.locator('#auth-view')).toBeVisible();
  await expect(page.locator('#auth-message')).toContainText('Không kết nối');
  await page.unroute('**/api/progress');
  await credentials(page, username);
  await page.locator('#auth-submit').click();
  await expect(page.locator('#passage')).toBeVisible();
});

test('another tab follows logout and progress updates without repeatedly requesting sync', async ({ page, context }) => {
  await register(page, uniqueName());
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.locator('#passage')).toBeVisible();
  let requests = 0;
  context.on('request', request => { if (request.url().endsWith('/api/progress')) requests++; });
  await page.locator('#complete-button').click();
  await expect(other.locator('#complete-button')).toBeDisabled();
  await page.waitForTimeout(500);
  expect(requests).toBeLessThan(10);
  await other.locator('#logout-button').click();
  await expect(page.locator('#auth-view')).toBeVisible();
  await expect(other.locator('#auth-view')).toBeVisible();
});

for (const width of [320, 375, 414, 1365]) {
  test(`minimal login and registration fit ${width}px and account controls fit after login`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    await expect(page.locator('#auth-view')).toBeVisible();
    const overflows = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(await overflows()).toBe(false);
    await page.locator('#auth-toggle').click();
    await credentials(page, 'a'.repeat(12) + uniqueName());
    await page.locator('#auth-confirm').fill(password);
    await expect(page.locator('#auth-form input:visible')).toHaveCount(3);
    expect(await overflows()).toBe(false);
    await page.screenshot({ path: `../outputs/auth-register-${width}.png`, fullPage: true });
    await page.locator('#auth-submit').click();
    await expect(page.locator('#passage')).toBeVisible();
    expect(await overflows()).toBe(false);
    await page.locator('[data-view="history"]').click();
    expect(await overflows()).toBe(false);
    await page.screenshot({ path: `../outputs/account-history-${width}.png`, fullPage: true });
  });
}
