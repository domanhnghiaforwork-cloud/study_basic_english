import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStudyServer } from '../server/app.mjs';
import { webRoot } from '../server/config.mjs';

const password = 'Test-password-123';
const catalog = JSON.parse(await readFile(path.join(webRoot, 'data/lessons.json'), 'utf8'));
const question = { lessonId: 1, segmentId: catalog.lessons[0].segments[0].id, question: 'next to' };

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'english-auth-test-'));
  const databasePath = path.join(directory, 'study.sqlite');
  let server;
  let url;
  const start = async () => {
    server = await createStudyServer({
      webRoot, config: { databasePath, apiKey: 'test-only', model: 'gemini-3.5-flash-lite', maxChars: 400, timeoutMs: 1000 },
      fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Bên cạnh, chỉ vị trí hai ngôi nhà.' }] } }] })),
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}`;
  };
  const stop = async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); };
  await start();
  t.after(async () => {
    await stop();
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(directory).startsWith('english-auth-test-'));
    await rm(directory, { recursive: true });
  });
  const request = (pathname, body, cookie, headers = {}) => fetch(url + pathname, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  async function register(username) {
    const response = await request('/api/auth/register', { username, password, confirmPassword: password });
    assert.equal(response.status, 201);
    return { user: (await response.json()).user, cookie: response.headers.get('set-cookie').split(';')[0], cookieHeader: response.headers.get('set-cookie') };
  }
  return { request, register, databasePath, restart: async () => { await stop(); await start(); } };
}

test('registration validates confirmation and usernames, hashes passwords, and login is case insensitive', async t => {
  const app = await fixture(t);
  assert.equal((await app.request('/api/auth/register', { username: 'Alice', password, confirmPassword: 'wrong' })).status, 400);
  assert.equal((await app.request('/api/auth/register', { username: '../bad', password, confirmPassword: password })).status, 400);
  assert.equal((await app.request('/api/auth/register', null)).status, 400);
  const alice = await app.register('Alice');
  assert.match(alice.cookieHeader, /HttpOnly; SameSite=Lax/);
  assert.equal((await app.request('/api/auth/register', { username: 'ALICE', password, confirmPassword: password })).status, 409);
  assert.equal((await app.request('/api/auth/login', { username: 'alice', password: 'incorrect-password' })).status, 401);
  assert.equal((await app.request('/api/auth/login', { username: 'unknown', password })).status, 401);
  const response = await app.request('/api/auth/login', { username: 'aLiCe', password }, undefined, { 'X-Forwarded-Proto': 'https' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.id, alice.user.id);
  assert.match(response.headers.get('set-cookie'), /; Secure/);
  const db = new DatabaseSync(app.databasePath);
  try {
    const row = db.prepare('SELECT * FROM users').get();
    assert.match(row.password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
    assert.ok(!JSON.stringify(row).includes(password));
    assert.ok(!JSON.stringify(db.prepare('SELECT * FROM sessions').all()).includes(alice.cookie.split('=')[1]));
  } finally { db.close(); }
});

test('private APIs require a live session; logout revokes it and cross-origin writes fail', async t => {
  const app = await fixture(t);
  assert.deepEqual(await (await app.request('/api/auth/me')).json(), { user: null });
  for (const pathname of ['/api/progress', '/api/ai/logs']) assert.equal((await app.request(pathname)).status, 401);
  assert.equal((await app.request('/api/ai/explain', question)).status, 401);
  const alice = await app.register('Alice');
  assert.equal((await app.request('/api/progress', { type: 'font', fontSize: 24 }, alice.cookie, { Origin: 'https://other.invalid' })).status, 403);
  assert.equal((await app.request('/api/progress', undefined, alice.cookie, { 'X-Study-User': 'another-user' })).status, 409);
  const logout = await app.request('/api/auth/logout', {}, alice.cookie);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await app.request('/api/progress', undefined, alice.cookie)).status, 401);
});

test('two users keep reading, calendar records, settings and AI logs separate across server restarts', async t => {
  const app = await fixture(t);
  const alice = await app.register('Alice');
  const bob = await app.register('Bob');
  await app.request('/api/progress', { type: 'complete', lessonId: 1, date: '2026-11-03', userId: bob.user.id }, alice.cookie);
  await app.request('/api/progress', { type: 'open', lessonId: 2 }, alice.cookie);
  await app.request('/api/progress', { type: 'font', fontSize: 26 }, alice.cookie);
  await app.request('/api/progress', { type: 'complete', lessonId: 1, date: '2026-11-04' }, bob.cookie);
  assert.equal((await app.request('/api/ai/explain', { ...question, userId: bob.user.id }, alice.cookie)).status, 200);
  await app.restart();
  const a = (await (await app.request('/api/progress', undefined, alice.cookie)).json()).state;
  const b = (await (await app.request('/api/progress', undefined, bob.cookie)).json()).state;
  assert.equal(a.currentLesson, 2); assert.equal(a.fontSize, 26);
  assert.deepEqual(a.records, [{ lessonId: 1, date: '2026-11-03' }]);
  assert.equal(b.currentLesson, 1); assert.equal(b.fontSize, 22);
  assert.deepEqual(b.records, [{ lessonId: 1, date: '2026-11-04' }]);
  const logs = await (await app.request('/api/ai/logs', undefined, alice.cookie)).json();
  assert.equal(logs.items.length, 1);
  assert.equal(logs.items[0].userId, alice.user.id);
  assert.equal(logs.items[0].userInput, 'next to');
  assert.equal(logs.items[0].sourceEnglish, catalog.lessons[0].segments[0].en);
  assert.ok(logs.items[0].answer);
  assert.deepEqual((await (await app.request('/api/ai/logs', undefined, bob.cookie)).json()).items, []);
});

test('concurrent device operations merge records, targeted undo preserves the other day, invalid mutations roll back', async t => {
  const app = await fixture(t);
  const { cookie } = await app.register('Alice');
  const results = await Promise.all(['2026-11-03', '2026-11-04'].map(date => app.request('/api/progress', { type: 'complete', lessonId: 1, date }, cookie)));
  assert.ok(results.every(response => response.status === 200));
  await app.request('/api/progress', { type: 'undo', lessonId: 1, date: '2026-11-03' }, cookie);
  for (const body of [{ type: 'open', lessonId: 50 }, { type: 'font', fontSize: 90 }, { type: 'complete', lessonId: 1 }, { type: 'complete', lessonId: 1, date: '2026-02-31' }]) {
    assert.equal((await app.request('/api/progress', body, cookie)).status, 400);
  }
  const { state } = await (await app.request('/api/progress', undefined, cookie)).json();
  assert.deepEqual(state.records, [{ lessonId: 1, date: '2026-11-04' }]);
  assert.equal(state.currentLesson, 1);
  assert.equal(state.fontSize, 22);
});

test('expired sessions cannot access progress; logs paginate within the current account', async t => {
  const app = await fixture(t);
  const alice = await app.register('Alice');
  const bob = await app.register('Bob');
  const db = new DatabaseSync(app.databasePath);
  try {
    const insert = db.prepare('INSERT INTO ai_logs(user_id, request_id, timestamp, record_json) VALUES (?, ?, ?, ?)');
    for (let i = 1; i <= 25; i++) insert.run(alice.user.id, `a${i}`, new Date().toISOString(), JSON.stringify({ userInput: `a${i}` }));
    insert.run(bob.user.id, 'b', new Date().toISOString(), JSON.stringify({ userInput: 'private-b' }));
    const first = await (await app.request('/api/ai/logs', undefined, alice.cookie)).json();
    assert.equal(first.items.length, 20);
    const second = await (await app.request(`/api/ai/logs?before=${first.nextCursor}`, undefined, alice.cookie)).json();
    assert.equal(second.items.length, 5); assert.equal(second.nextCursor, null);
    assert.ok(!JSON.stringify([first, second]).includes('private-b'));
    db.prepare('UPDATE sessions SET expires_at = 0 WHERE user_id = ?').run(alice.user.id);
    assert.equal((await app.request('/api/progress', undefined, alice.cookie)).status, 401);
  } finally { db.close(); }
});
