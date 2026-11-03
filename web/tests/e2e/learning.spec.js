import { test, expect } from '@playwright/test';

const fixedTime = new Date('2026-11-03T12:00:00+07:00');
async function openApp(page, hash = '', previouslyOpened = []) {
  await page.clock.setFixedTime(fixedTime);
  if (previouslyOpened.length) await page.addInitScript(ids => {
    localStorage.setItem('moi-ngay-english:v1', JSON.stringify({ version: 1, currentLesson: 1, fontSize: 22, openedLessons: [1, ...ids], records: [] }));
  }, previouslyOpened);
  await page.goto(`/${hash}`);
  await expect(page.locator('#passage')).toBeVisible();
}

test('loads original content and translates a held sentence, dismissing on outside tap', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openApp(page);
  await expect(page.locator('#lesson-title')).toHaveText('A New Friend');
  await expect(page.locator('#lesson-number')).toHaveText('01');
  const first = page.locator('.segment').first();
  await first.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: 50, clientY: 300 });
  await expect(page.locator('#translation-card')).toBeVisible();
  await expect(first).toHaveClass(/selected/);
  await expect(page.locator('#translation-text')).toHaveText('Tôi làm quen với một gia đình mới ở ngôi nhà bên cạnh nhà mình.');
  await page.dispatchEvent('body', 'pointerup', { pointerId: 1 });
  await page.locator('#lesson-title').tap();
  await expect(page.locator('#translation-card')).toBeHidden();
  await expect(first).not.toHaveClass(/selected/);
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#translation-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#translation-card')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a real touch long press works and moving or cancelling a touch does not translate', async ({ page, context }) => {
  await openApp(page);
  const cdp = await context.newCDPSession(page);
  const first = page.locator('.segment').first();
  const bounds = await first.boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + 30, y: bounds.y + 15 }] });
  await expect(page.locator('#translation-card')).toBeVisible();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.locator('#close-translation').tap();
  await first.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: 60, clientY: 300 });
  await page.dispatchEvent('body', 'pointermove', { pointerId: 1, clientX: 60, clientY: 330 });
  await page.waitForTimeout(550);
  await expect(page.locator('#translation-card')).toBeHidden();
  await first.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 });
  await page.dispatchEvent('body', 'pointercancel', { pointerId: 1 });
  await page.waitForTimeout(550);
  await expect(page.locator('#translation-card')).toBeHidden();
});

test('context groups highlight and translate the entire mapped group', async ({ page }) => {
  await openApp(page, '#read/11', [11]);
  const note = page.locator('.segment').first();
  await expect(note).toContainText('Could you help me this afternoon?');
  await expect(note).toContainText('You may play outside when you finish.');
  await note.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#translation-kind')).toContainText('Cụm câu');
  await expect(page.locator('#translation-text')).toContainText('Các con nên rửa cốc');
  await expect(page.locator('#translation-text')).toContainText('em trai cũng muốn giúp');
});

test('vocabulary sheet has all ten words, phrase maps, keyboard tabs, and closes accessibly', async ({ page }) => {
  await openApp(page);
  await page.locator('#vocabulary-toggle').tap();
  await expect(page.locator('#vocabulary-dialog')).toBeVisible();
  await expect(page.locator('#vocabulary-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.word-row')).toHaveCount(10);
  await expect(page.locator('.word-term').first()).toHaveText('I');
  await page.locator('#words-tab').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#phrases-tab')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#phrases-panel')).toBeVisible();
  await expect(page.locator('#phrases-panel')).toContainText('Tôi làm quen');
  await page.keyboard.press('Escape');
  await expect(page.locator('#vocabulary-dialog')).toBeHidden();
  await expect(page.locator('#vocabulary-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('completion persists, calendar and history agree, duplicate completion and undo stay correct', async ({ page }) => {
  await openApp(page);
  await page.locator('#complete-button').tap();
  await expect(page.locator('#today-count')).toHaveText('Hôm nay · 1 bài');
  await expect(page.locator('#complete-button')).toBeDisabled();
  await page.reload();
  await expect(page.locator('#complete-button')).toHaveText('Đã đọc hôm nay');
  await page.locator('#next-lesson').tap();
  await expect(page.locator('#lesson-number')).toHaveText('02');
  await page.locator('#complete-button').tap();
  await page.locator('[data-view="calendar"]').tap();
  await expect(page.locator('[data-day="2026-11-03"]')).toContainText('2 bài');
  await expect(page.locator('#day-lessons .lesson-row')).toHaveCount(2);
  await expect(page.locator('#calendar-stats strong').first()).toHaveText('2');
  await page.locator('#previous-month').tap();
  await expect(page.locator('#month-label')).toHaveText('Tháng 10, 2026');
  await page.locator('#current-month').tap();
  await expect(page.locator('#month-label')).toHaveText('Tháng 11, 2026');
  await page.locator('[data-view="history"]').tap();
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(2);
  await page.locator('#history-list [data-lesson="2"]').tap();
  await page.locator('#undo-button').tap();
  await expect(page.locator('#today-count')).toHaveText('Hôm nay · 1 bài');
  await page.locator('[data-view="history"]').tap();
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(1);
});

test('rereading on another local date adds one daily count, retaining unique history', async ({ page }) => {
  await openApp(page);
  await page.locator('#complete-button').tap();
  await page.clock.setFixedTime(new Date('2026-11-04T00:01:00+07:00'));
  await page.reload();
  await expect(page.locator('#today-count')).toHaveText('Hôm nay · 0 bài');
  await page.locator('#complete-button').tap();
  await page.locator('[data-view="history"]').tap();
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('2 ngày đã đọc');
});

test('lesson selection, Vietnamese search, font sizes and boundaries work', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#previous-lesson')).toBeDisabled();
  await page.locator('#lesson-picker').tap();
  await expect(page.locator('#picker-list .lesson-row')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.locator('#complete-button').tap();
  await page.locator('#next-lesson').tap();
  await expect(page.locator('#lesson-number')).toHaveText('02');
  await page.goto('/#read/50');
  await expect(page.locator('#lesson-number')).toHaveText('02');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('moi-ngay-english:v1'));
    state.openedLessons.push(50);
    localStorage.setItem('moi-ngay-english:v1', JSON.stringify(state));
  });
  await page.reload();
  await page.goto('/#read/50');
  await expect(page.locator('#lesson-number')).toHaveText('50');
  await expect(page.locator('#next-lesson')).toBeDisabled();
  await page.locator('#font-up').tap();
  await page.locator('#font-up').tap();
  await expect(page.locator('#font-up')).toBeDisabled();
  await expect(page.locator('#passage')).toHaveCSS('font-size', '26px');
  await page.reload();
  await expect(page.locator('#passage')).toHaveCSS('font-size', '26px');
  await page.locator('[data-view="history"]').tap();
  await page.locator('#filter-all').tap();
  await page.locator('#lesson-search').fill('hoc sinh moi');
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('Lunch for a New Student');
});

test('backup exports real progress, merges valid files and rejects invalid data without losing records', async ({ page }) => {
  await openApp(page);
  await page.locator('#complete-button').tap();
  await page.locator('[data-view="history"]').tap();
  await page.locator('#backup-toggle').tap();
  const download = page.waitForEvent('download');
  await page.locator('#export-backup').tap();
  const file = await download;
  expect(file.suggestedFilename()).toBe('moi-ngay-tien-do-2026-11-03.json');
  await page.locator('#import-backup').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, currentLesson: 1, fontSize: 22, records: [{ lessonId: 1, date: '2026-11-03' }, { lessonId: 2, date: '2026-11-03' }] })) });
  await expect(page.locator('#backup-message')).toContainText('Đã gộp');
  await page.locator('#import-backup').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"records":[{"lessonId":51,"date":"2026-11-03"}]}') });
  await expect(page.locator('#backup-message')).toHaveClass('is-error');
  await page.locator('[data-close="backup-dialog"]').tap();
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(2);
});

test('unavailable storage and a failed data request have recoverable visible states', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Unavailable'); } }));
  await page.route('**/data/lessons.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/');
  await expect(page.locator('#error-view')).toBeVisible();
  await expect(page.locator('#storage-warning')).toBeVisible();
  await page.unroute('**/data/lessons.json');
  await page.locator('#retry-button').tap();
  await expect(page.locator('#passage')).toBeVisible();
  await page.locator('#complete-button').tap();
  await expect(page.locator('#today-count')).toHaveText('Hôm nay · 1 bài');
  await expect(page.locator('#storage-warning')).toContainText('chưa lưu được');
});

test('future titles stay hidden in the picker and search, and direct links cannot skip ahead', async ({ page }) => {
  await openApp(page, '#read/50');
  await expect(page.locator('#lesson-number')).toHaveText('01');
  await expect(page).toHaveURL(/#read\/1$/);
  await expect(page.locator('body')).not.toContainText('Giai đoạn');
  await expect(page.locator('#next-lesson')).toBeDisabled();
  await expect(page.locator('#next-lesson-hint')).toBeVisible();
  await page.locator('#lesson-picker').tap();
  await expect(page.locator('#picker-list .lesson-row')).toHaveCount(1);
  await expect(page.locator('#picker-dialog')).not.toContainText('Two Bags');
  await page.keyboard.press('Escape');
  await page.locator('[data-view="history"]').tap();
  await page.locator('#filter-all').tap();
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(1);
  await page.locator('#lesson-search').fill('Lunch for a New Student');
  await expect(page.locator('#history-list .lesson-row')).toHaveCount(0);
  await page.locator('[data-view="read"]').tap();
  await page.locator('#complete-button').tap();
  await expect(page.locator('#next-lesson')).toBeEnabled();
  await page.locator('#lesson-picker').tap();
  await expect(page.locator('#picker-list .lesson-row')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.locator('#next-lesson').tap();
  await expect(page.locator('#lesson-title')).toHaveText('Two Bags at the Door');
  await expect(page.locator('#next-lesson')).toBeDisabled();
  await page.reload();
  await expect(page.locator('#lesson-number')).toHaveText('02');
  await page.locator('#lesson-picker').tap();
  await expect(page.locator('#picker-list .lesson-row')).toHaveCount(2);
  await expect(page.locator('#picker-dialog')).not.toContainText('The Picture on the Table');
  await page.keyboard.press('Escape');
  await page.goto('/#read/4');
  await expect(page.locator('#lesson-number')).toHaveText('02');
});

test('existing progress migrates without exposing titles of skipped lessons', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('moi-ngay-english:v1', JSON.stringify({ version: 1, currentLesson: 12, fontSize: 24, records: [{ lessonId: 5, date: '2026-11-02' }] })));
  await openApp(page);
  await expect(page.locator('#lesson-number')).toHaveText('12');
  await expect(page.locator('#passage')).toHaveCSS('font-size', '24px');
  await expect(page.locator('#previous-lesson')).toBeDisabled();
  await page.locator('#lesson-picker').tap();
  await expect(page.locator('#picker-list .lesson-row')).toHaveCount(3);
  await expect(page.locator('#picker-list [data-lesson="11"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('[data-view="history"]').tap();
  await expect(page.locator('#history-list [data-lesson="5"]')).toBeVisible();
});

test('appended lessons form one list and unlock after the previous final lesson', async ({ page }) => {
  await page.route('**/data/lessons.json', async route => {
    const response = await route.fetch();
    const data = await response.json();
    data.lessons.push({ ...data.lessons[0], id: 51, title: 'A Secret New Chapter', titleVi: 'Một trang mới bí mật' });
    await route.fulfill({ json: data });
  });
  await page.addInitScript(() => localStorage.setItem('moi-ngay-english:v1', JSON.stringify({ version: 1, currentLesson: 50, fontSize: 22, records: [{ lessonId: 50, date: '2026-11-02' }] })));
  await openApp(page);
  await expect(page.locator('#lesson-total')).toHaveText('/ 51');
  await expect(page.locator('#lesson-title')).toHaveText('Lunch for a New Student');
  await page.locator('#lesson-picker').tap();
  await expect(page.locator('#picker-dialog')).not.toContainText('A Secret New Chapter');
  await page.keyboard.press('Escape');
  await page.locator('#next-lesson').tap();
  await expect(page.locator('#lesson-number')).toHaveText('51');
  await expect(page.locator('#lesson-title')).toHaveText('A Secret New Chapter');
  await expect(page.locator('#next-lesson')).toBeDisabled();
});

for (const width of [320, 375, 414, 768, 1365]) {
  test(`responsive reader, calendar, history and sheet fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openApp(page, '#read/45', [45]);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(await overflow()).toBe(false);
    await page.locator('#vocabulary-toggle').click();
    expect(await overflow()).toBe(false);
    await page.locator('[data-close="vocabulary-dialog"]').click();
    await page.locator('[data-view="calendar"]').click();
    expect(await overflow()).toBe(false);
    await page.locator('[data-view="history"]').click();
    await page.locator('#filter-all').click();
    expect(await overflow()).toBe(false);
  });
}
