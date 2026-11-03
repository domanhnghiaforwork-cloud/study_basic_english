import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createStudyServer } from '../server/app.mjs';
import { webRoot } from '../server/config.mjs';
import { shortenAnswer } from '../server/ai.mjs';

const catalog = JSON.parse(await readFile(path.join(webRoot, 'data', 'lessons.json'), 'utf8'));
const segment = catalog.lessons[0].segments[0];
const input = question => ({ lessonId: 1, segmentId: segment.id, question });
const providerReply = text => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }), { headers: { 'Content-Type': 'application/json' } });

async function fixture(t, overrides = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'english-ai-test-'));
  const config = { databasePath: path.join(directory, 'study.sqlite'), apiKey: 'private-test-key', model: 'gemini-3.5-flash-lite', maxChars: 400, timeoutMs: 1000, ...overrides.config };
  const server = await createStudyServer({ webRoot, config, fetchImpl: overrides.fetchImpl || (async () => providerReply('Một nghĩa ngắn theo ngữ cảnh.')), ...(overrides.writeLog ? { writeLog: overrides.writeLog } : {}) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(directory);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(resolved).startsWith('english-ai-test-'));
    await rm(resolved, { recursive: true });
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  const registration = await fetch(url + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'ai_tester', password: 'Test-password-123', confirmPassword: 'Test-password-123' }) });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  return {
    url, cookie,
    port: server.address().port,
    post: (body, extra = {}) => fetch(url + '/api/ai/explain', { method: 'POST', body: JSON.stringify(body), ...extra, headers: { 'Content-Type': 'application/json', Cookie: cookie, ...extra.headers } }),
    logs: async () => (await (await fetch(url + '/api/ai/logs', { headers: { Cookie: cookie } })).json()).items,
  };
}

test('English query sends the canonical English/Vietnamese pair and system prompt, then logs the displayed answer', async t => {
  let providerCall;
  const app = await fixture(t, { fetchImpl: async (url, options) => {
    providerCall = { url, options, body: JSON.parse(options.body) };
    return providerReply('“next to” nghĩa là “bên cạnh”, chỉ vị trí của hai ngôi nhà trong câu.');
  } });
  const response = await app.post({ ...input('next to'), sourceEnglish: 'forged context', translationVietnamese: 'forged translation' });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(providerCall.url, /\/gemini-3\.5-flash-lite:generateContent$/);
  assert.equal(providerCall.options.headers['x-goog-api-key'], 'private-test-key');
  assert.ok(!providerCall.url.includes('private-test-key'));
  const sent = JSON.parse(providerCall.body.contents[0].parts[0].text);
  assert.deepEqual(sent, { question: 'next to', sourceEnglish: segment.en, translationVietnamese: segment.vi });
  assert.match(providerCall.body.systemInstruction.parts[0].text, /từ\/cụm tiếng Anh/);
  assert.match(providerCall.body.systemInstruction.parts[0].text, /từ\/cụm tiếng Việt/);
  assert.match(providerCall.body.systemInstruction.parts[0].text, /400 ký tự/);
  const logs = await app.logs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].userInput, 'next to');
  assert.equal(logs[0].sourceEnglish, segment.en);
  assert.equal(logs[0].translationVietnamese, segment.vi);
  assert.equal(logs[0].answer, data.answer);
  assert.equal(logs[0].status, 'success');
  assert.ok(!JSON.stringify(logs).includes('private-test-key'));
});

test('Vietnamese query is preserved and the entire selected group is sent together', async t => {
  const selected = catalog.lessons.find(lesson => lesson.id === 11).segments[0];
  let sent;
  const app = await fixture(t, { fetchImpl: async (_, options) => {
    sent = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
    return providerReply('“được” tương ứng với “may”, diễn tả việc bố cho phép các con ra ngoài chơi.');
  } });
  const response = await app.post({ lessonId: 11, segmentId: selected.id, question: 'được' });
  assert.equal(response.status, 200);
  assert.equal(sent.question, 'được');
  assert.equal(sent.sourceEnglish, selected.en);
  assert.equal(sent.translationVietnamese, selected.vi);
  assert.match(sent.sourceEnglish, /Could you help me/);
  assert.match((await response.json()).answer, /may/);
});

test('the response is hard-limited in Unicode characters even when the provider ignores the prompt', async t => {
  const app = await fixture(t, { config: { maxChars: 100 }, fetchImpl: async () => providerReply('Đây là một cách giải thích quá dài theo ngữ cảnh. '.repeat(30)) });
  const response = await app.post(input('meet'));
  const { answer } = await response.json();
  assert.ok(Array.from(answer).length <= 100);
  assert.ok(answer.length > 40);
  assert.equal((await app.logs())[0].answer, answer);
  assert.ok(Array.from(shortenAnswer(('a\u0301 🙂 ').repeat(100), 100)).length <= 100);
  assert.equal(shortenAnswer('  câu ngắn  ', 100), 'câu ngắn');
});

test('missing key returns an actionable message and records the request without calling Gemini', async t => {
  const app = await fixture(t, { config: { apiKey: '' }, fetchImpl: async () => assert.fail('Provider must not be called') });
  const response = await app.post(input('meet'));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'AI_NOT_CONFIGURED');
  const record = (await app.logs())[0];
  assert.equal(record.userInput, 'meet');
  assert.equal(record.answer, null);
  assert.equal(record.errorCode, 'AI_NOT_CONFIGURED');
});

test('invalid input, missing context and cross-origin requests never call the provider', async t => {
  const app = await fixture(t, { fetchImpl: async () => assert.fail('Provider must not be called') });
  assert.equal((await app.post(input(''))).status, 400);
  assert.equal((await app.post(input('a'.repeat(201)))).status, 400);
  assert.equal((await app.post({ ...input('word'), extra: 'a'.repeat(5000) })).status, 413);
  assert.equal((await app.post({ ...input('word'), segmentId: 'missing' })).status, 404);
  assert.equal((await app.post(input('word'), { headers: { 'Content-Type': 'application/json', Origin: 'https://other-site.invalid' } })).status, 403);
  const malformed = await fetch(app.url + '/api/ai/explain', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: app.cookie }, body: '{bad' });
  assert.equal(malformed.status, 400);
});

test('the ngrok Host is accepted while .env, server modules, logs and dependency metadata stay private', async t => {
  const app = await fixture(t);
  const host = 'larcher-brecken-palynologically.ngrok-free.dev';
  const result = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: app.port, path: '/api/ai/explain', method: 'POST', headers: { Host: host, Origin: `https://${host}`, 'Content-Type': 'application/json', Cookie: app.cookie } }, res => {
      res.resume(); res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject); req.end(JSON.stringify(input('meet')));
  });
  assert.equal(result, 200);
  for (const url of ['/.env', '/server/config.mjs', '/server/prompts/explain-translation.txt', '/logs/ai/today.jsonl', '/storage/study.sqlite', '/data/study.sqlite', '/package.json']) {
    const response = await fetch(app.url + url);
    assert.ok([403, 404].includes(response.status), url);
  }
  assert.equal((await fetch(app.url + '/app.js')).status, 200);
  assert.equal((await fetch(app.url + '/data/lessons.json')).status, 200);
});

test('provider errors and timeouts are logged without leaking provider response bodies', async t => {
  const denied = await fixture(t, { fetchImpl: async () => new Response('private-test-key should not be leaked', { status: 403 }) });
  const response = await denied.post(input('meet'));
  const body = await response.text();
  assert.equal(response.status, 502);
  assert.ok(!body.includes('private-test-key'));
  assert.ok(!JSON.stringify(await denied.logs()).includes('private-test-key'));
  const slow = await fixture(t, { config: { timeoutMs: 20 }, fetchImpl: (_, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })) });
  const timeout = await slow.post(input('meet'));
  assert.equal(timeout.status, 504);
  assert.equal((await timeout.json()).code, 'AI_TIMEOUT');
  assert.equal((await slow.logs())[0].errorCode, 'AI_TIMEOUT');
});

test('no-answer and log-write failures are surfaced instead of silently claiming success', async t => {
  const empty = await fixture(t, { fetchImpl: async () => new Response(JSON.stringify({ candidates: [] })) });
  assert.equal((await empty.post(input('meet'))).status, 502);
  const brokenLog = await fixture(t, { writeLog: async () => { throw new Error('Disk full'); } });
  const response = await brokenLog.post(input('meet'));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'AI_LOG_FAILED');
});
