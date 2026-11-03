import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, dateKey, validDate, validateState, completeLesson, undoCompletion, recordsOn, completedIds, streak, monthCells, mergeBackup, history, loadState, canOpenLesson, openLesson, openedIds } from '../state.js';

test('completion counts each lesson once per local day, with separate rereads on later days', () => {
  let state = completeLesson(freshState(), 1, '2026-11-03');
  state = completeLesson(state, 1, '2026-11-03');
  state = completeLesson(state, 2, '2026-11-03');
  state = completeLesson(state, 1, '2026-11-04');
  assert.equal(recordsOn(state, '2026-11-03').length, 2);
  assert.equal(recordsOn(state, '2026-11-04').length, 1);
  assert.equal(completedIds(state).size, 2);
  assert.deepEqual(history(state)[0], { lessonId: 1, lastRead: '2026-11-04', days: 2 });
  state = undoCompletion(state, 1, '2026-11-04');
  assert.equal(completedIds(state).size, 2);
  assert.equal(recordsOn(state, '2026-11-04').length, 0);
});

test('local day formatting respects timezone near midnight and rejects impossible dates', () => {
  assert.equal(dateKey(new Date(2026, 10, 3, 0, 1)), '2026-11-03');
  assert.equal(dateKey(new Date(2026, 10, 3, 23, 59)), '2026-11-03');
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('2026-13-03'), false);
});

test('month grids are Monday-first and cover leap years and month boundaries', () => {
  const november = monthCells(2026, 10);
  assert.deepEqual(november.slice(0, 7), [null, null, null, null, null, null, 1]);
  assert.equal(november.filter(Boolean).length, 30);
  assert.equal(monthCells(2028, 1).filter(Boolean).length, 29);
  assert.equal(monthCells(2026, 11).filter(Boolean).length, 31);
});

test('streak survives today not yet being read and crosses month/year boundaries', () => {
  let state = freshState();
  for (const day of ['2025-12-30', '2025-12-31', '2026-01-01']) state = completeLesson(state, 1, day);
  assert.equal(streak(state, new Date(2026, 0, 1, 12)), 3);
  assert.equal(streak(state, new Date(2026, 0, 2, 12)), 3);
  assert.equal(streak(state, new Date(2026, 0, 3, 12)), 0);
});

test('backup merge preserves current settings and deduplicates records without losing either device history', () => {
  const local = completeLesson({ ...freshState(), currentLesson: 12, fontSize: 26 }, 1, '2026-11-03');
  let imported = completeLesson(freshState(), 1, '2026-11-03');
  imported = completeLesson(imported, 2, '2026-11-04');
  const merged = mergeBackup(local, imported);
  assert.equal(merged.records.length, 2);
  assert.equal(merged.currentLesson, 12);
  assert.equal(merged.fontSize, 26);
  assert.throws(() => validateState({ ...imported, records: [{ date: '2026-02-30', lessonId: 1 }] }));
  assert.throws(() => validateState({ ...imported, records: [{ date: '2026-11-03', lessonId: 51 }] }, 50));
  assert.throws(() => validateState({ ...imported, version: 2 }));
});

test('only a completed previous lesson unlocks a new lesson; opening remembers visits without revealing the next', () => {
  let state = freshState();
  assert.equal(canOpenLesson(state, 2, 50), false);
  assert.equal(openLesson(state, 50, 50), null);
  assert.throws(() => completeLesson(state, 3, '2026-11-03', 50));
  state = completeLesson(state, 1, '2026-11-03', 50);
  assert.equal(canOpenLesson(state, 2, 50), true);
  assert.deepEqual([...openedIds(state)], [1]);
  state = openLesson(state, 2, 50);
  assert.deepEqual([...openedIds(state)].sort(), [1, 2]);
  assert.equal(canOpenLesson(state, 3, 50), false);
  state = undoCompletion(state, 1, '2026-11-03');
  assert.equal(canOpenLesson(state, 2, 50), true);
});

test('old progress and backups preserve known visits, without revealing the skipped gaps', () => {
  const migrated = validateState({ version: 1, currentLesson: 12, fontSize: 22, records: [{ lessonId: 5, date: '2026-11-03' }] }, 50);
  assert.deepEqual(migrated.openedLessons, [1, 5, 12]);
  assert.equal(canOpenLesson(migrated, 10, 50), false);
  assert.equal(canOpenLesson(migrated, 12, 50), true);
  const merged = mergeBackup(freshState(), migrated, 50);
  assert.deepEqual(merged.openedLessons, [1, 5, 12]);
  assert.equal(merged.currentLesson, 1);
});

test('the last completed lesson continues into appended content without resetting progress', () => {
  const old = validateState({ version: 1, currentLesson: 50, fontSize: 22, records: [{ lessonId: 50, date: '2026-11-03' }] }, 50);
  assert.equal(canOpenLesson(old, 51, 50), false);
  assert.equal(canOpenLesson(old, 51, 100), true);
  const next = openLesson(old, 51, 100);
  assert.equal(next.currentLesson, 51);
  assert.equal(completedIds(next).size, 1);
  assert.equal(canOpenLesson(next, 52, 100), false);
  assert.deepEqual(validateState(next, 100).openedLessons, [1, 50, 51]);
});

test('corrupt or inaccessible browser storage returns a usable initial state and a visible error', () => {
  for (const storage of [{ getItem: () => '{broken' }, { getItem() { throw new Error('Blocked'); } }]) {
    const loaded = loadState(storage);
    assert.deepEqual(loaded.state, freshState());
    assert.ok(loaded.error);
  }
});
