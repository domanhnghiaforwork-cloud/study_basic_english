export const STORAGE_KEY = 'moi-ngay-english:v1';
export const FONT_SIZES = [18, 20, 22, 24, 26];
const validLesson = (id, total) => Number.isSafeInteger(id) && id >= 1 && id <= total;

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d, 12);
  return y >= 2000 && y <= 2100 && dateKey(parsed) === value;
}

export function freshState() {
  return { version: 1, currentLesson: 1, fontSize: 22, openedLessons: [1], records: [] };
}

export function validateState(input, total = Number.MAX_SAFE_INTEGER) {
  if (!input || input.version !== 1 || !Array.isArray(input.records) || input.records.length > 50000) {
    throw new Error('Tệp không đúng định dạng sao lưu của Mỗi ngày.');
  }
  if (!validLesson(input.currentLesson, total) || !FONT_SIZES.includes(input.fontSize)) {
    throw new Error('Bài đọc hoặc cỡ chữ trong tệp không hợp lệ.');
  }
  const unique = new Map();
  for (const record of input.records) {
    if (!record || !validLesson(record.lessonId, total) || !validDate(record.date)) {
      throw new Error('Có bản ghi ngày đọc hoặc số bài không hợp lệ.');
    }
    unique.set(`${record.date}:${record.lessonId}`, { lessonId: record.lessonId, date: record.date });
  }
  if (input.openedLessons !== undefined && (!Array.isArray(input.openedLessons) || input.openedLessons.length > 50000 || input.openedLessons.some(id => !validLesson(id, total)))) {
    throw new Error('Danh sách bài đã mở trong tệp không hợp lệ.');
  }
  // Older saves tracked only the current lesson and completed lessons. Preserve
  // exactly those known visits, without revealing the titles of any gaps.
  const openedLessons = [...new Set([1, input.currentLesson, ...[...unique.values()].map(record => record.lessonId), ...(input.openedLessons || [])])].sort((a, b) => a - b);
  return { version: 1, currentLesson: input.currentLesson, fontSize: input.fontSize, openedLessons, records: [...unique.values()] };
}

export function loadState(storage, total = Number.MAX_SAFE_INTEGER) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { state: raw ? validateState(JSON.parse(raw), total) : freshState(), error: null };
  } catch {
    return { state: freshState(), error: 'Không đọc được tiến độ đã lưu. Bạn vẫn có thể học và khôi phục từ bản sao lưu.' };
  }
}

export function openedIds(state) {
  return new Set([1, state.currentLesson, ...(state.openedLessons || []), ...state.records.map(record => record.lessonId)]);
}

export function canOpenLesson(state, lessonId, total) {
  return validLesson(lessonId, total) && (openedIds(state).has(lessonId) || state.records.some(record => record.lessonId === lessonId - 1));
}

export function openLesson(state, lessonId, total) {
  if (!canOpenLesson(state, lessonId, total)) return null;
  return { ...state, currentLesson: lessonId, openedLessons: [...new Set([...openedIds(state), lessonId])].sort((a, b) => a - b) };
}

export function completeLesson(state, lessonId, date = dateKey(), total = Number.MAX_SAFE_INTEGER) {
  if (!canOpenLesson(state, lessonId, total) || !validDate(date)) throw new Error('Invalid completion');
  if (state.records.some(record => record.lessonId === lessonId && record.date === date)) return state;
  return { ...state, openedLessons: [...new Set([...openedIds(state), lessonId])].sort((a, b) => a - b), records: [...state.records, { lessonId, date }] };
}

export function undoCompletion(state, lessonId, date = dateKey()) {
  return { ...state, records: state.records.filter(record => record.lessonId !== lessonId || record.date !== date) };
}

export function mergeBackup(state, imported, total = Number.MAX_SAFE_INTEGER) {
  const backup = validateState(imported, total);
  return validateState({ ...state, openedLessons: [...new Set([...openedIds(state), ...backup.openedLessons])], records: [...state.records, ...backup.records] }, total);
}

export function completedIds(state) {
  return new Set(state.records.map(record => record.lessonId));
}

export function recordsOn(state, day) {
  return state.records.filter(record => record.date === day);
}

export function history(state) {
  const rows = new Map();
  for (const record of state.records) {
    const previous = rows.get(record.lessonId);
    rows.set(record.lessonId, {
      lessonId: record.lessonId,
      lastRead: previous && previous.lastRead > record.date ? previous.lastRead : record.date,
      days: (previous?.days || 0) + 1,
    });
  }
  return [...rows.values()].sort((a, b) => b.lastRead.localeCompare(a.lastRead) || a.lessonId - b.lessonId);
}

export function streak(state, now = new Date()) {
  const days = new Set(state.records.map(record => record.date));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dateKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function monthCells(year, month) {
  const offset = (new Date(year, month, 1, 12).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0, 12).getDate();
  const size = Math.ceil((offset + days) / 7) * 7;
  return Array.from({ length: size }, (_, i) => i >= offset && i < offset + days ? i - offset + 1 : null);
}
