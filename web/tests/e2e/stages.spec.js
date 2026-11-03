import { test, expect, seedProgress } from './fixtures.js';

for (const lesson of [
  { previous: 50, id: 51, title: 'My First Week at Work', word: 'job', translation: 'Thứ Hai, tôi bắt đầu công việc mới ở một công ty nội thất nhỏ.' },
  { previous: 100, id: 101, title: 'Opening the Workshop Doors', word: 'access', translation: 'Xưởng học tập của thị trấn trước đây chỉ mở trong giờ học.' },
]) {
  test(`existing progress unlocks lesson ${lesson.id} with its real vocabulary and translations`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await seedProgress(page, { version: 1, currentLesson: lesson.previous, fontSize: 22, records: [{ lessonId: lesson.previous, date: '2026-11-03' }] });
    await page.goto('/');
    await expect(page.locator('#lesson-number')).toHaveText(String(lesson.previous));
    await expect(page.locator('#lesson-total')).toHaveText('/ 200');
    await expect(page.locator('#next-lesson')).toBeEnabled();
    await page.locator('#next-lesson').click();
    await expect(page.locator('#lesson-title')).toHaveText(lesson.title);
    await expect(page.locator('#lesson-number')).toHaveText(String(lesson.id));
    await expect(page.locator('#next-lesson')).toBeDisabled();
    const first = page.locator('.segment').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#translation-text')).toHaveText(lesson.translation);
    await page.keyboard.press('Escape');
    await page.locator('#vocabulary-toggle').click();
    await expect(page.locator('.word-row')).toHaveCount(10);
    await expect(page.locator('.word-term').first()).toHaveText(lesson.word);
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.locator('#lesson-title')).toHaveText(lesson.title);
    const { state } = await (await page.request.get('/api/progress')).json();
    expect(state.records).toEqual([{ lessonId: lesson.previous, date: '2026-11-03' }]);
    expect(errors).toEqual([]);
  });
}

test('the final stage 3 lesson renders and translates at the end of the catalog', async ({ page }) => {
  await seedProgress(page, { version: 1, currentLesson: 200, fontSize: 22, openedLessons: [1, 200], records: [] });
  await page.goto('/#read/200');
  await expect(page.locator('#lesson-number')).toHaveText('200');
  await expect(page.locator('#lesson-title')).toHaveText('The Winter Show on Wheels');
  await expect(page.locator('#next-lesson')).toBeDisabled();
  await page.locator('.segment').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#translation-text')).toHaveText('Buổi diễn mùa đông kết hợp học may với cảnh tập trượt băng.');
});
