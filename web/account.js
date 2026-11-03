import { STORAGE_KEY, freshState, validateState, applyProgressOperation } from './state.js';

const $ = id => document.getElementById(id);
const AUTH_EVENT = `${STORAGE_KEY}:auth-change`;

export function createAccount({ onReady, onSignedOut, onUpdate, onWarning }) {
  let current = null;
  let epoch = 0;
  let mode = 'login';
  let authBusy = false;
  let storage;
  try { storage = localStorage; } catch { storage = null; }
  const key = user => `${STORAGE_KEY}:user:${user.id}`;
  const notifyTabs = () => { try { storage?.setItem(AUTH_EVENT, crypto.randomUUID()); } catch {} };
  const persist = session => {
    try {
      const value = JSON.stringify({ state: session.state, pending: session.pending });
      if (storage?.getItem(key(session.user)) !== value) storage?.setItem(key(session.user), value);
    }
    catch { /* SQLite is authoritative; this cache is only for offline retries. */ }
  };

  async function raw(url, options = {}, user = current?.user) {
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(user ? { 'X-Study-User': user.id } : {}), ...options.headers },
    });
    let data;
    try { data = await response.json(); } catch { throw new Error('Không kết nối được máy chủ. Hãy thử lại.'); }
    if (!response.ok) {
      const error = new Error(data.error || 'Không xử lý được yêu cầu.');
      error.code = data.code;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function showLogin() {
    current = null;
    switchMode('login');
    onSignedOut();
    $('app-shell').hidden = true;
    $('auth-view').hidden = false;
    $('auth-loading').hidden = true;
    document.querySelector('.skip-link').hidden = true;
    $('auth-password').value = '';
    $('auth-confirm').value = '';
  }

  async function api(url, options) {
    try { return await raw(url, options); }
    catch (error) {
      if (error.status === 401 || error.code === 'ACCOUNT_CHANGED') {
        epoch++; showLogin();
        $('auth-message').textContent = error.code === 'ACCOUNT_CHANGED' ? 'Tài khoản đã đổi ở tab khác. Đăng nhập lại để tiếp tục.' : 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.';
      }
      throw error;
    }
  }

  async function drain(session = current) {
    if (!session || session !== current) return false;
    if (session.flushing) return session.flushing;
    session.flushing = (async () => {
      while (session === current && session.pending.length) {
        try {
          const result = await raw('./api/progress', { method: 'POST', body: JSON.stringify(session.pending[0]) }, session.user);
          session.pending.shift();
          session.state = session.pending.reduce((state, op) => applyProgressOperation(state, op, Number.MAX_SAFE_INTEGER), result.state);
          persist(session);
          if (session === current) { onWarning(null); onUpdate(session.state); }
        } catch (error) {
          if (session !== current) return false;
          if (error.status === 401 || error.code === 'ACCOUNT_CHANGED') { epoch++; showLogin(); return false; }
          if (error.status === 400) {
            session.pending.shift(); persist(session);
            onWarning(error.message); continue;
          }
          onWarning('Chưa lưu được tiến độ lên tài khoản. Giữ trang này mở; web sẽ thử lại khi có kết nối.');
          return false;
        }
      }
      return session === current && session.pending.length === 0;
    })();
    try { return await session.flushing; }
    finally { session.flushing = null; }
  }

  async function activate(user, stamp = ++epoch) {
    const result = await raw('./api/progress', {}, user);
    if (stamp !== epoch) return;
    let pending = [];
    try {
      const saved = JSON.parse(storage?.getItem(key(user)) || 'null');
      if (Array.isArray(saved?.pending) && saved.pending.length <= 10000) pending = saved.pending;
    } catch {}
    let state = validateState(result.state);
    try { state = pending.reduce((value, op) => applyProgressOperation(value, op, Number.MAX_SAFE_INTEGER), state); }
    catch { pending = []; state = validateState(result.state); }
    current = { user, state, pending, flushing: null };
    $('auth-loading').hidden = true;
    $('auth-view').hidden = true;
    $('app-shell').hidden = false;
    document.querySelector('.skip-link').hidden = false;
    $('account-username').textContent = user.username;
    $('account-username').title = user.username;
    $('auth-password').value = '';
    $('auth-confirm').value = '';
    persist(current);
    await onReady(state);
    if (pending.length) void drain();
  }

  async function bootstrap() {
    const stamp = ++epoch;
    $('app-shell').hidden = true;
    $('auth-view').hidden = true;
    $('auth-loading').hidden = false;
    try {
      const { user } = await raw('./api/auth/me', {}, null);
      if (stamp !== epoch) return;
      if (user) await activate(user, stamp); else showLogin();
    } catch {
      if (stamp !== epoch) return;
      showLogin();
      $('auth-message').textContent = 'Không kết nối được máy chủ. Hãy thử đăng nhập lại.';
    }
  }

  function switchMode(next) {
    mode = next;
    $('auth-title').textContent = mode === 'login' ? 'Đăng nhập' : 'Đăng ký';
    $('auth-submit').textContent = mode === 'login' ? 'Đăng nhập' : 'Đăng ký';
    $('auth-toggle').textContent = mode === 'login' ? 'Đăng ký' : 'Đăng nhập';
    $('auth-switch-copy').textContent = mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';
    $('auth-confirm-group').hidden = mode !== 'register';
    $('auth-confirm').required = mode === 'register';
    $('auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    $('auth-message').textContent = '';
    $('auth-confirm').value = '';
  }

  $('auth-toggle').addEventListener('click', () => { if (!authBusy) switchMode(mode === 'login' ? 'register' : 'login'); });
  $('auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (authBusy) return;
    authBusy = true;
    $('auth-submit').disabled = true;
    $('auth-toggle').disabled = true;
    $('auth-message').textContent = '';
    $('auth-submit').textContent = 'Đang mở…';
    try {
      const { user } = await raw(`./api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ username: $('auth-username').value, password: $('auth-password').value, confirmPassword: $('auth-confirm').value }) }, null);
      await activate(user); notifyTabs();
    } catch (error) { $('auth-message').textContent = error.message; }
    finally {
      authBusy = false;
      $('auth-submit').disabled = false;
      $('auth-toggle').disabled = false;
      $('auth-submit').textContent = mode === 'login' ? 'Đăng nhập' : 'Đăng ký';
    }
  });
  $('logout-button').addEventListener('click', async () => {
    if (!current) return;
    $('logout-button').disabled = true;
    try {
      if (!await drain()) return;
      await api('./api/auth/logout', { method: 'POST' });
      epoch++; showLogin(); notifyTabs();
      $('auth-message').textContent = '';
    } catch (error) { onWarning(error.message); }
    finally { $('logout-button').disabled = false; }
  });
  async function sync() {
    const session = current;
    if (!session || !await drain(session) || session !== current) return;
    try {
      const data = await api('./api/progress');
      if (session !== current) return;
      session.state = session.pending.reduce((value, op) => applyProgressOperation(value, op, Number.MAX_SAFE_INTEGER), data.state);
      persist(session); onUpdate(session.state);
    } catch (error) { if (current) onWarning(error.message); }
  }
  window.addEventListener('online', () => void drain());
  window.addEventListener('focus', () => void sync());
  window.addEventListener('storage', event => {
    if (event.key === AUTH_EVENT) { epoch++; showLogin(); void bootstrap(); }
    else if (current && event.key === key(current.user)) void sync();
  });
  switchMode('login');
  return {
    get user() { return current?.user || null; },
    api, bootstrap, sync,
    save(operation, optimisticState) {
      if (!current) return;
      current.state = optimisticState;
      current.pending.push(operation);
      persist(current); void drain();
    },
    flush: drain,
  };
}
