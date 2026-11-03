import { test, expect, seedProgress } from './fixtures.js';

async function selectFirst(page) {
  await page.goto('/');
  await expect(page.locator('#passage')).toBeVisible();
  await page.locator('.segment').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#translation-card')).toBeVisible();
}

test('minimal input sends the selected context ID, shows thinking, and grows the box for the answer', async ({ page }) => {
  let release;
  let submitted;
  const gate = new Promise(resolve => { release = resolve; });
  const answer = '“next to” nghĩa là “bên cạnh”. Trong câu này, cụm ấy chỉ vị trí ngôi nhà của gia đình mới so với nhà người kể chuyện.';
  await page.route('**/api/ai/explain', async route => {
    submitted = route.request().postDataJSON();
    await gate;
    await route.fulfill({ json: { answer, maxChars: 400, requestId: 'test' } });
  });
  await selectFirst(page);
  await expect(page.locator('#ai-question')).toHaveAttribute('placeholder', 'Hỏi AI...');
  const initial = await page.locator('#translation-card').boundingBox();
  await page.locator('#ai-question').fill('next to');
  await page.locator('#ai-submit').tap();
  await expect(page.locator('#ai-status')).toHaveText('AI đang suy nghĩ...');
  await expect(page.locator('#ai-submit')).toBeDisabled();
  expect(submitted).toEqual({ lessonId: 1, segmentId: 's1-01-01', question: 'next to' });
  release();
  await expect(page.locator('#ai-answer')).toHaveText(answer);
  await expect(page.locator('#ai-status')).toBeHidden();
  await expect(page.locator('#ai-submit')).toBeEnabled();
  const expanded = await page.locator('#translation-card').boundingBox();
  expect(expanded.height).toBeGreaterThan(initial.height);
  expect(expanded.y).toBeLessThan(initial.y);
  await expect(page.locator('.segment').first()).toHaveClass(/selected/);
});

test('Vietnamese questions work, and errors are visible and retryable without closing the translation', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/ai/explain', async route => {
    attempts++;
    expect(route.request().postDataJSON().question).toBe('làm quen');
    await route.fulfill(attempts === 1
      ? { status: 503, json: { error: 'Hỏi AI chưa được bật. Điền GEMINI_API_KEY trong .env rồi khởi động lại web.' } }
      : { json: { answer: '“làm quen” diễn đạt tự nhiên việc gặp một gia đình mới trong ngữ cảnh này.', maxChars: 400 } });
  });
  await selectFirst(page);
  await page.locator('#ai-question').fill('làm quen');
  await page.locator('#ai-question').press('Enter');
  await expect(page.locator('#ai-status')).toContainText('GEMINI_API_KEY');
  await expect(page.locator('#ai-submit')).toBeEnabled();
  await expect(page.locator('#translation-card')).toBeVisible();
  await page.locator('#ai-submit').tap();
  await expect(page.locator('#ai-answer')).toContainText('diễn đạt tự nhiên');
});

test('changing selection cancels an in-flight question and cannot display a stale reply', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/ai/explain', async route => {
    await gate;
    await route.fulfill({ json: { answer: 'Old answer that must not appear.' } }).catch(() => {});
  });
  await selectFirst(page);
  await page.locator('#ai-question').fill('family');
  await page.locator('#ai-submit').tap();
  await expect(page.locator('#ai-status')).toBeVisible();
  await page.locator('.segment').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#ai-question')).toHaveValue('');
  release();
  await expect(page.locator('#ai-answer')).toBeHidden();
  await expect(page.locator('#ai-status')).toBeHidden();
  await expect(page.locator('#translation-text')).not.toContainText('Old answer');
  await page.locator('#lesson-title').tap();
  await expect(page.locator('#translation-card')).toBeHidden();
});

test('AI content is rendered as text and reduced-motion users get the complete reply immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const answer = '<img src=x onerror="window.aiInjected=true"> chỉ là chuỗi văn bản.';
  await page.route('**/api/ai/explain', route => route.fulfill({ json: { answer, maxChars: 400 } }));
  await selectFirst(page);
  await page.locator('#ai-question').fill('meet');
  await page.locator('#ai-submit').tap();
  await expect(page.locator('#ai-answer')).toHaveText(answer);
  await expect(page.locator('#ai-answer img')).toHaveCount(0);
  expect(await page.evaluate(() => window.aiInjected)).toBeUndefined();
});

for (const width of [320, 375, 414]) {
  test(`long context and AI input fit the ${width}px phone, including an open keyboard`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await seedProgress(page, { version: 1, currentLesson: 11, fontSize: 22, records: [] });
    await page.route('**/api/ai/explain', route => route.fulfill({ json: { answer: 'Đây là phần giải thích ngắn, bám sát câu tiếng Anh và cách diễn đạt tự nhiên trong bản dịch tiếng Việt. '.repeat(3), maxChars: 400 } }));
    await selectFirst(page);
    await page.locator('#ai-question').fill('được');
    await page.locator('#ai-submit').tap();
    await expect(page.locator('#ai-answer')).toContainText('giải thích ngắn');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 400 });
      window.dispatchEvent(new Event('resize'));
    });
    await page.locator('#ai-question').scrollIntoViewIfNeeded();
    const input = await page.locator('#ai-question').boundingBox();
    expect(input.y + input.height).toBeLessThan(400);
    const box = await page.locator('#translation-card').boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
  });
}
