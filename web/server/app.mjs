import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { AiError, createAiService } from './ai.mjs';
import { openStudyDatabase } from './database.mjs';

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const publicFiles = new Set(['index.html', 'app.js', 'account.js', 'state.js', 'styles.css', 'tokens.css', 'icon.svg', 'data/lessons.json']);

function jsonResponse(res, status, value) {
  if (res.destroyed) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function readJson(req, maxBytes = 4096) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new AiError(415, 'JSON_REQUIRED', 'Yêu cầu cần được gửi dưới dạng JSON.');
  if (Number(req.headers['content-length']) > maxBytes) {
    req.resume();
    throw new AiError(413, 'BODY_TOO_LARGE', 'Nội dung gửi lên quá dài.');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new AiError(413, 'BODY_TOO_LARGE', 'Nội dung gửi lên quá dài.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new AiError(400, 'INVALID_JSON', 'Nội dung gửi lên không hợp lệ.'); }
}

export async function createStudyServer({ webRoot, config, fetchImpl, writeLog }) {
  const database = openStudyDatabase(config.databasePath);
  const catalog = async () => JSON.parse(await readFile(path.join(webRoot, 'data', 'lessons.json'), 'utf8'));
  const tokens = req => req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('study_session='))?.slice('study_session='.length);
  const setSession = (req, res, token) => {
    const secure = req.socket.encrypted || req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https';
    res.setHeader('Set-Cookie', `study_session=${token || ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? 2592000 : 0}${secure ? '; Secure' : ''}`);
  };
  const authAttempts = new Map();
  function rateLimitAuth(req) {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    const attempts = (authAttempts.get(key) || []).filter(time => time > now - 60000);
    if (attempts.length >= 60) throw new AiError(429, 'AUTH_LIMIT', 'Bạn thử đăng nhập quá nhiều lần. Hãy đợi một phút.');
    attempts.push(now); authAttempts.set(key, attempts);
  }
  const explain = await createAiService({
    config, fetchImpl,
    writeLog: async record => {
      if (writeLog) await writeLog(record);
      database.addAiLog(record);
    },
    getContext: async (lessonId, segmentId) => {
      const catalog = JSON.parse(await readFile(path.join(webRoot, 'data', 'lessons.json'), 'utf8'));
      return catalog.lessons.find(lesson => lesson.id === lessonId)?.segments.find(segment => segment.id === segmentId);
    },
  });
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin) {
          let originHost;
          try { originHost = new URL(req.headers.origin).host; } catch { originHost = null; }
          if (originHost !== req.headers.host) return jsonResponse(res, 403, { error: 'Yêu cầu cần được gửi từ chính trang học.' });
        }
        const user = database.session(tokens(req));
        if (pathname === '/api/auth/me' && req.method === 'GET') return jsonResponse(res, 200, { user });
        if (['/api/auth/register', '/api/auth/login'].includes(pathname) && req.method === 'POST') {
          rateLimitAuth(req);
          const input = await readJson(req);
          if (!input || typeof input !== 'object') throw new AiError(400, 'INVALID_CREDENTIALS', 'Nhập tên đăng nhập và mật khẩu.');
          const result = pathname.endsWith('/register')
            ? await database.register(input.username, input.password, input.confirmPassword)
            : await database.login(input.username, input.password);
          if (tokens(req)) database.logout(tokens(req));
          setSession(req, res, result.token);
          return jsonResponse(res, pathname.endsWith('/register') ? 201 : 200, { user: result.user });
        }
        if (!user) throw new AiError(401, 'LOGIN_REQUIRED', 'Bạn cần đăng nhập để tiếp tục.');
        if (req.headers['x-study-user'] && req.headers['x-study-user'] !== user.id) throw new AiError(409, 'ACCOUNT_CHANGED', 'Tài khoản đã đổi ở tab khác. Vui lòng tải lại phiên đăng nhập.');
        if (pathname === '/api/auth/logout' && req.method === 'POST') {
          database.logout(tokens(req)); setSession(req, res, null);
          return jsonResponse(res, 200, { success: true });
        }
        if (pathname === '/api/progress') {
          const total = (await catalog()).lessons.length;
          if (req.method === 'GET') return jsonResponse(res, 200, database.getProgress(user.id, total));
          if (req.method === 'POST') return jsonResponse(res, 200, database.changeProgress(user.id, await readJson(req, 5 * 1024 * 1024), total));
          throw new AiError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
        }
        if (pathname === '/api/ai/logs' && req.method === 'GET') {
          const beforeValue = new URL(req.url, 'http://localhost').searchParams.get('before');
          const before = beforeValue === null ? null : Number(beforeValue);
          if (before !== null && (!Number.isSafeInteger(before) || before < 1)) throw new AiError(400, 'INVALID_CURSOR', 'Mốc nhật ký không hợp lệ.');
          return jsonResponse(res, 200, database.aiLogs(user.id, before));
        }
        if (pathname !== '/api/ai/explain') return jsonResponse(res, 404, { error: 'Không tìm thấy chức năng này.' });
        req.studyUser = user;
      }
      if (pathname === '/api/ai/explain') {
        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST');
          return jsonResponse(res, 405, { error: 'Chức năng này chỉ nhận câu hỏi gửi bằng POST.' });
        }
        // Keep the public ngrok Host unchanged: same-origin requests continue
        // to work on localhost, LAN addresses and the user's ngrok domain.
        if (req.headers.origin) {
          let originHost;
          try { originHost = new URL(req.headers.origin).host; } catch { originHost = null; }
          if (originHost !== req.headers.host) return jsonResponse(res, 403, { error: 'Yêu cầu cần được gửi từ chính trang học.' });
        }
        const input = await readJson(req);
        const controller = new AbortController();
        const cancel = () => { if (!res.writableEnded) controller.abort(); };
        res.once('close', cancel);
        try { return jsonResponse(res, 200, await explain(input, controller.signal, req.studyUser)); }
        finally { res.off('close', cancel); }
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
      }
      const relativeUrl = pathname === '/' ? 'index.html' : pathname.slice(1);
      const target = path.resolve(webRoot, relativeUrl);
      const relative = path.relative(webRoot, target);
      if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.startsWith('.'))) {
        res.writeHead(403).end(); return;
      }
      // Serve browser assets only; .env, server code, tests and logs stay private.
      if (!publicFiles.has(relativeUrl) || !(await stat(target)).isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] + '; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(target));
    } catch (error) {
      if (error instanceof AiError) return jsonResponse(res, error.status, { error: error.message, code: error.code });
      if (req.url?.startsWith('/api/')) return jsonResponse(res, 500, { error: 'Không xử lý được yêu cầu. Bạn thử lại nhé.', code: 'SERVER_ERROR' });
      res.writeHead(404).end('Not found');
    }
  });
  server.once('close', () => database.close());
  return server;
}
