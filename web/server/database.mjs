import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { freshState, validateState, applyProgressOperation } from '../state.js';
import { AiError } from './ai.mjs';

const deriveKey = promisify(scrypt);
const hashToken = token => createHash('sha256').update(token).digest('hex');
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function credentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') throw new AiError(400, 'INVALID_CREDENTIALS', 'Nhập tên đăng nhập và mật khẩu.');
  const name = username.normalize('NFC').trim();
  if (!/^[\p{L}\p{N}_.-]{3,32}$/u.test(name)) throw new AiError(400, 'INVALID_USERNAME', 'Tên đăng nhập gồm 3–32 chữ, số hoặc dấu . _ -');
  if (Array.from(password).length < 8 || Array.from(password).length > 128) throw new AiError(400, 'INVALID_PASSWORD', 'Mật khẩu cần từ 8 đến 128 ký tự.');
  return { name, key: name.toLocaleLowerCase('vi'), password };
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await deriveKey(password, salt, 64, SCRYPT);
  return `${salt}:${hash.toString('hex')}`;
}

async function passwordMatches(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = await deriveKey(password, salt, 64, SCRYPT);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}

export function openStudyDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      username_key TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state_json TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_id TEXT NOT NULL UNIQUE,
      timestamp TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ai_logs_user ON ai_logs(user_id, id DESC);
  `);
  let closed = false;
  const publicUser = row => ({ id: row.id, username: row.username });

  function createSession(user) {
    const token = randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), user.id, Date.now() + SESSION_MS);
    return token;
  }

  function getProgress(userId, total) {
    const row = db.prepare('SELECT state_json, revision FROM progress WHERE user_id = ?').get(userId);
    if (!row) return { state: freshState(), revision: 0 };
    return { state: validateState(JSON.parse(row.state_json), total), revision: row.revision };
  }

  return {
    async register(username, password, confirmPassword) {
      const input = credentials(username, password);
      if (password !== confirmPassword) throw new AiError(400, 'PASSWORD_MISMATCH', 'Mật khẩu nhập lại chưa khớp.');
      if (db.prepare('SELECT id FROM users WHERE username_key = ?').get(input.key)) throw new AiError(409, 'USERNAME_TAKEN', 'Tên đăng nhập này đã được sử dụng.');
      const passwordHash = await hashPassword(input.password);
      const user = { id: randomUUID(), username: input.name };
      try {
        db.prepare('INSERT INTO users(id, username, username_key, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(user.id, user.username, input.key, passwordHash, new Date().toISOString());
      } catch (error) {
        if (db.prepare('SELECT id FROM users WHERE username_key = ?').get(input.key)) throw new AiError(409, 'USERNAME_TAKEN', 'Tên đăng nhập này đã được sử dụng.');
        throw error;
      }
      return { user, token: createSession(user) };
    },
    async login(username, password) {
      const input = credentials(username, password);
      const row = db.prepare('SELECT * FROM users WHERE username_key = ?').get(input.key);
      // A dummy derivation keeps unknown-user requests from returning early.
      const stored = row?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`;
      const valid = await passwordMatches(input.password, stored);
      if (!row || !valid) throw new AiError(401, 'LOGIN_FAILED', 'Tên đăng nhập hoặc mật khẩu không đúng.');
      const user = publicUser(row);
      return { user, token: createSession(user) };
    },
    session(token) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
      const row = db.prepare('SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?').get(hashToken(token), Date.now());
      return row ? publicUser(row) : null;
    },
    logout(token) {
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    },
    getProgress,
    changeProgress(userId, operation, total) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const before = getProgress(userId, total);
        let next;
        try { next = validateState(applyProgressOperation(before.state, operation, total), total); }
        catch (error) { throw new AiError(400, 'INVALID_PROGRESS', error.message); }
        const revision = before.revision + 1;
        db.prepare('INSERT INTO progress(user_id, state_json, revision, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, revision = excluded.revision, updated_at = excluded.updated_at').run(userId, JSON.stringify(next), revision, new Date().toISOString());
        db.exec('COMMIT');
        return { state: next, revision };
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    addAiLog(record) {
      if (!record.userId) throw new Error('AI log requires an authenticated user');
      db.prepare('INSERT INTO ai_logs(user_id, request_id, timestamp, record_json) VALUES (?, ?, ?, ?)').run(record.userId, record.requestId, record.timestamp, JSON.stringify(record));
    },
    aiLogs(userId, before = null) {
      const rows = before
        ? db.prepare('SELECT id, record_json FROM ai_logs WHERE user_id = ? AND id < ? ORDER BY id DESC LIMIT 21').all(userId, before)
        : db.prepare('SELECT id, record_json FROM ai_logs WHERE user_id = ? ORDER BY id DESC LIMIT 21').all(userId);
      const items = rows.slice(0, 20).map(row => ({ ...JSON.parse(row.record_json), id: row.id }));
      return { items, nextCursor: rows.length > 20 ? items.at(-1).id : null };
    },
    close() { if (!closed) { db.close(); closed = true; } },
  };
}
