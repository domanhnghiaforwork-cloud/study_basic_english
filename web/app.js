import {
  STORAGE_KEY, FONT_SIZES, freshState, loadState, dateKey, completeLesson,
  undoCompletion, completedIds, recordsOn, history, streak, monthCells, mergeBackup,
  openedIds, canOpenLesson, openLesson, validateState,
} from './state.js';
import { createAccount } from './account.js';

const $ = id => document.getElementById(id);
const ICONS = {
  book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m-8 3h2"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6m3-4v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  touch: '<path d="M9 12V5a2 2 0 0 1 4 0v6l2-1 5 3-2 8H9l-5-7a2 2 0 0 1 3-2l2 2m-3-9a5 5 0 0 1 10 0"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'chevron-left': '<path d="m15 5-7 7 7 7"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
const fullDate = key => new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${key}T12:00:00`));
const shortDate = key => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(`${key}T12:00:00`));
const announce = text => { $('announcement').textContent = text; };
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage unavailable'); } }; }
let state = freshState();
let lessons = [];
let view = 'read';
let today = dateKey();
let selectedDay = today;
let month = new Date().getMonth();
let year = new Date().getFullYear();
let historyFilter = 'read';
let activeSegment = null;
let hold = null;
let loading = false;
let aiController = null;
let aiVersion = 0;
let aiAnimationFrame = null;
const account = createAccount({
  onReady: async next => {
    state = next;
    $('lesson-search').value = '';
    historyFilter = 'read';
    selectedDay = dateKey();
    if (lessons.length) route(); else await loadLessons();
  },
  onSignedOut: () => {
    closeTranslation(); cancelHold();
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    state = freshState();
    $('passage').replaceChildren();
    $('history-list').replaceChildren();
    $('day-lessons').replaceChildren();
    $('ai-logs-list').replaceChildren();
    $('lesson-title').textContent = '';
    $('account-username').textContent = '';
    $('storage-warning').hidden = true;
  },
  onUpdate: next => {
    const changed = next.currentLesson !== state.currentLesson || next.fontSize !== state.fontSize;
    state = next;
    updateSummary();
    if (view === 'read') { if (changed) renderReader(); else updateCompletion(); }
    if (view === 'calendar') renderCalendar();
    if (view === 'history') renderHistory();
  },
  onWarning: message => { if (message) showStorageWarning(message); else $('storage-warning').hidden = true; },
});

function showStorageWarning(message) {
  $('storage-warning').textContent = message;
  $('storage-warning').hidden = false;
}

function save(operation) {
  account.save(operation, state);
}

function currentLesson() { return lessons.find(lesson => lesson.id === state.currentLesson) || lessons[0]; }

function updateSummary() {
  const done = completedIds(state);
  $('sidebar-count').textContent = done.size;
  $('overall-progress').value = done.size;
  $('overall-progress').max = lessons.length;
  $('sidebar-total').textContent = `/ ${lessons.length} bài đọc`;
  $('lesson-total').textContent = `/ ${lessons.length}`;
  $('opened-count').textContent = openedIds(state).size;
  $('today-count').textContent = `Hôm nay · ${recordsOn(state, today).length} bài`;
  $('history-count').textContent = done.size;
}

function renderReader() {
  const lesson = currentLesson();
  if (!lesson) return;
  closeTranslation();
  $('lesson-title').textContent = lesson.title;
  $('lesson-number').textContent = String(lesson.id).padStart(2, '0');
  $('lesson-progress-bar').style.width = `${lesson.id / lessons.length * 100}%`;
  $('lesson-picker').setAttribute('aria-label', `Bài ${lesson.id} trên ${lessons.length}. Chọn bài đọc`);
  document.documentElement.style.setProperty('--reading-size', `${state.fontSize}px`);
  $('passage').replaceChildren();
  for (const segment of lesson.segments) {
    const span = document.createElement('span');
    span.className = 'segment';
    span.dataset.segmentId = segment.id;
    span.tabIndex = 0;
    span.setAttribute('role', 'button');
    span.setAttribute('aria-pressed', 'false');
    span.setAttribute('aria-label', `${segment.en} — Giữ hoặc nhấn Enter để xem bản dịch`);
    span.setAttribute('aria-controls', 'translation-card');
    span.textContent = segment.en;
    $('passage').append(span, document.createTextNode(' '));
  }
  $('previous-lesson').disabled = !canOpenLesson(state, lesson.id - 1, lessons.length);
  $('next-lesson').disabled = !canOpenLesson(state, lesson.id + 1, lessons.length);
  $('next-lesson-hint').hidden = lesson.id === lessons.length || canOpenLesson(state, lesson.id + 1, lessons.length);
  $('font-down').disabled = state.fontSize === FONT_SIZES[0];
  $('font-up').disabled = state.fontSize === FONT_SIZES.at(-1);
  updateCompletion();
  renderVocabulary();
}

function updateCompletion() {
  const lesson = currentLesson();
  if (!lesson) return;
  const doneToday = recordsOn(state, today).some(record => record.lessonId === lesson.id);
  const hasRead = completedIds(state).has(lesson.id);
  $('read-status').textContent = doneToday ? '✓ Đã đọc hôm nay' : hasRead ? '✓ Đã đọc · Thêm một lần ôn lại' : '';
  $('complete-button').disabled = doneToday;
  $('complete-button').innerHTML = `${icon('check')}<span>${doneToday ? 'Đã đọc hôm nay' : 'Đã đọc xong'}</span>`;
  $('undo-button').hidden = !doneToday;
  $('next-lesson').disabled = !canOpenLesson(state, lesson.id + 1, lessons.length);
  $('next-lesson-hint').hidden = lesson.id === lessons.length || canOpenLesson(state, lesson.id + 1, lessons.length);
}

function renderVocabulary() {
  const lesson = currentLesson();
  $('vocabulary-lesson').textContent = `Bài ${String(lesson.id).padStart(2, '0')} · ${lesson.title}`;
  $('words-panel').innerHTML = lesson.vocabulary.map((entry, i) => `<div class="word-row"><span class="word-index">${String(i + 1).padStart(2, '0')}</span><span class="word-term" lang="en">${escapeHTML(entry.word)}</span><span class="word-meaning">${escapeHTML(entry.meaning)}</span></div>`).join('');
  $('phrases-panel').innerHTML = lesson.segments.map(segment => `<div class="phrase-row">${segment.kind === 'group' ? '<span class="small-label">Dịch theo cụm câu để trọn nghĩa</span>' : ''}<p lang="en">${escapeHTML(segment.en)}</p><p lang="vi">${escapeHTML(segment.vi)}</p></div>`).join('');
}

function lessonRow(lesson, subtitle, done = false) {
  return `<button class="lesson-row" data-lesson="${lesson.id}" aria-label="Đọc bài ${lesson.id}: ${escapeHTML(lesson.title)}"><span class="row-number">${String(lesson.id).padStart(2, '0')}</span><span class="row-body"><span class="row-title" lang="en">${escapeHTML(lesson.title)}</span><span class="row-description">${escapeHTML(subtitle)}</span></span><span class="row-meta">${done ? icon('check') : icon('arrow-up-right')}</span></button>`;
}

function emptyState(title, description, action = false) {
  return `<div class="empty-state"><span data-icon="book">${icon('book')}</span><h2>${title}</h2><p>${description}</p>${action ? '<button class="button secondary" data-go-read>Đọc một bài nhé</button>' : ''}</div>`;
}

function renderPicker() {
  const done = completedIds(state);
  $('picker-list').innerHTML = lessons.filter(lesson => openedIds(state).has(lesson.id)).map(lesson => lessonRow(lesson, lesson.titleVi, done.has(lesson.id))).join('');
}

function renderCalendar() {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const inMonth = state.records.filter(record => record.date.startsWith(monthPrefix));
  $('calendar-stats').innerHTML = `<div><strong>${inMonth.length}</strong><span>Bài trong tháng</span></div><div><strong>${new Set(inMonth.map(record => record.date)).size}</strong><span>Ngày có đọc</span></div><div><strong>${streak(state)}</strong><span>Ngày liên tiếp</span></div>`;
  $('month-label').textContent = `Tháng ${month + 1}, ${year}`;
  $('calendar-grid').innerHTML = monthCells(year, month).map(day => {
    if (!day) return '<span aria-hidden="true"></span>';
    const key = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const count = recordsOn(state, key).length;
    return `<button class="calendar-day ${count ? 'has-read' : ''} ${key === today ? 'is-today' : ''}" data-day="${key}" aria-label="${fullDate(key)}: ${count} bài đã đọc${key === today ? ', hôm nay' : ''}" aria-pressed="${selectedDay === key}"><span class="day-number">${day}</span>${count ? `<span class="day-count">${count} bài</span>` : '<span class="day-count" aria-hidden="true">&nbsp;</span>'}</button>`;
  }).join('');
  const dayRecords = recordsOn(state, selectedDay);
  $('selected-day-label').textContent = selectedDay === today ? `Hôm nay, ${shortDate(selectedDay)}` : fullDate(selectedDay);
  $('selected-day-count').textContent = `${dayRecords.length} bài đã đọc`;
  $('day-lessons').innerHTML = dayRecords.length ? dayRecords.map(record => {
    const lesson = lessons.find(item => item.id === record.lessonId);
    return lessonRow(lesson, lesson.titleVi, true);
  }).join('') : emptyState('Một trang sách đang đợi.', selectedDay === today ? 'Đọc xong một bài rồi đánh dấu, bài sẽ xuất hiện ở đây.' : 'Ngày này chưa có bài đọc nào được ghi lại.', selectedDay === today);
}

function renderHistory() {
  const read = history(state);
  const records = new Map(read.map(item => [item.lessonId, item]));
  const query = normalize($('lesson-search').value.trim());
  const base = historyFilter === 'read' ? read.map(item => lessons.find(lesson => lesson.id === item.lessonId)) : lessons.filter(lesson => openedIds(state).has(lesson.id));
  const filtered = base.filter(lesson => normalize(`${lesson.id} ${String(lesson.id).padStart(2, '0')} ${lesson.title} ${lesson.titleVi}`).includes(query));
  $('filter-read').setAttribute('aria-pressed', historyFilter === 'read');
  $('filter-all').setAttribute('aria-pressed', historyFilter === 'all');
  $('history-summary').textContent = query ? `${filtered.length} bài phù hợp` : historyFilter === 'read' ? `${read.length} / ${lessons.length} bài đã đọc · Gần đây nhất ở trên` : `${base.length} bài đã mở · Những bài mới sẽ xuất hiện khi bạn đọc đến`;
  $('history-list').innerHTML = filtered.length ? filtered.map(lesson => {
    const record = records.get(lesson.id);
    return lessonRow(lesson, record ? `Đọc gần nhất ${shortDate(record.lastRead)} · ${record.days} ngày đã đọc` : lesson.titleVi, !!record);
  }).join('') : emptyState(query ? 'Chưa tìm thấy bài này.' : 'Bắt đầu từ một bài đọc.', query ? 'Thử tìm bằng tên tiếng Anh, tiếng Việt hoặc số bài.' : 'Đọc xong một bài, bạn sẽ thấy nó ở đây để ôn lại.', !query);
}

function route() {
  if (!lessons.length || !account.user) return;
  closeTranslation();
  cancelHold();
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  const match = location.hash.match(/^#(read|calendar|history)(?:\/(\d+))?$/);
  view = match?.[1] || 'read';
  const requested = Number(match?.[2]);
  if (view === 'read') {
    const target = match?.[2] ? requested : state.currentLesson;
    const next = openLesson(state, target, lessons.length);
    if (next) { state = next; save({ type: 'open', lessonId: target }); }
    else {
      window.history.replaceState(null, '', `#read/${state.currentLesson}`);
      announce('Hãy đọc xong bài hiện tại để mở bài tiếp theo.');
    }
  }
  document.querySelectorAll('main > .view').forEach(section => { section.hidden = section.id !== `${view === 'read' ? 'reader' : view}-view`; });
  document.querySelectorAll('.main-nav a').forEach(link => {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (view === 'read') renderReader();
  if (view === 'calendar') renderCalendar();
  if (view === 'history') renderHistory();
  updateSummary();
  document.title = `${view === 'read' ? currentLesson().title : view === 'calendar' ? 'Lịch học' : 'Những bài đã đọc'} — Mỗi ngày`;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function goToLesson(id) {
  if (!canOpenLesson(state, id, lessons.length)) {
    announce('Hãy đọc xong bài hiện tại để mở bài tiếp theo.');
    return;
  }
  const hash = `#read/${id}`;
  if (location.hash === hash) route(); else location.hash = hash;
}

function closeTranslation() {
  resetAiQuestion();
  if (activeSegment) {
    activeSegment.classList.remove('selected');
    activeSegment.setAttribute('aria-pressed', 'false');
    activeSegment = null;
  }
  $('translation-card').hidden = true;
}

function translate(span) {
  const segment = currentLesson()?.segments.find(item => item.id === span.dataset.segmentId);
  if (!segment) return;
  closeTranslation();
  activeSegment = span;
  span.classList.add('selected');
  span.setAttribute('aria-pressed', 'true');
  $('translation-kind').textContent = segment.kind === 'group' ? 'Nghĩa tiếng Việt · Cụm câu' : 'Nghĩa tiếng Việt';
  $('translation-text').textContent = segment.vi;
  $('translation-card').hidden = false;
  positionTranslationCard();
  requestAnimationFrame(() => {
    const rect = span.getBoundingClientRect();
    const cardRect = $('translation-card').getBoundingClientRect();
    if (rect.bottom > cardRect.top - 20) span.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}

function setAiBusy(busy) {
  $('ai-form').setAttribute('aria-busy', String(busy));
  $('ai-submit').disabled = busy;
  $('ai-question').readOnly = busy;
}

function resetAiQuestion() {
  aiVersion++;
  aiController?.abort();
  aiController = null;
  if (aiAnimationFrame !== null) cancelAnimationFrame(aiAnimationFrame);
  aiAnimationFrame = null;
  $('ai-question').value = '';
  $('ai-status').hidden = true;
  $('ai-status').classList.remove('is-error');
  $('ai-status').textContent = '';
  $('ai-answer').hidden = true;
  $('ai-answer').textContent = '';
  $('ai-announcement').textContent = '';
  setAiBusy(false);
}

function positionTranslationCard() {
  const viewport = window.visualViewport;
  const height = viewport?.height || window.innerHeight;
  const keyboardInset = Math.max(0, window.innerHeight - height - (viewport?.offsetTop || 0));
  $('translation-card').style.setProperty('--keyboard-inset', `${keyboardInset}px`);
  $('translation-card').style.setProperty('--translation-viewport-height', `${height}px`);
}

function showAiAnswer(answer, version) {
  if (aiAnimationFrame !== null) cancelAnimationFrame(aiAnimationFrame);
  const paragraph = $('ai-answer');
  paragraph.hidden = false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paragraph.textContent = answer;
    $('ai-announcement').textContent = answer;
    return;
  }
  // Reveal text progressively; the fixed-bottom box naturally grows upward
  // with each line, without animating layout height or stretching the text.
  const points = Array.from(answer);
  const start = performance.now();
  const duration = Math.min(850, Math.max(220, points.length * 2));
  const frame = now => {
    if (version !== aiVersion) return;
    const count = Math.min(points.length, Math.ceil((now - start) / duration * points.length));
    paragraph.textContent = points.slice(0, count).join('');
    if (count < points.length) aiAnimationFrame = requestAnimationFrame(frame);
    else { aiAnimationFrame = null; $('ai-announcement').textContent = answer; }
  };
  aiAnimationFrame = requestAnimationFrame(frame);
}

$('ai-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (aiController || !activeSegment) return;
  const question = $('ai-question').value.trim();
  if (!question) {
    $('ai-status').textContent = 'Nhập từ hoặc cụm từ bạn muốn hỏi.';
    $('ai-status').classList.add('is-error');
    $('ai-status').hidden = false;
    $('ai-question').focus();
    return;
  }
  const lesson = currentLesson();
  const segmentId = activeSegment.dataset.segmentId;
  const version = ++aiVersion;
  if (aiAnimationFrame !== null) cancelAnimationFrame(aiAnimationFrame);
  aiAnimationFrame = null;
  const controller = new AbortController();
  aiController = controller;
  $('ai-answer').hidden = true;
  $('ai-answer').textContent = '';
  $('ai-status').classList.remove('is-error');
  $('ai-status').textContent = 'AI đang suy nghĩ...';
  $('ai-status').hidden = false;
  setAiBusy(true);
  positionTranslationCard();
  try {
    const data = await account.api('./api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, segmentId, question }),
      signal: controller.signal,
    });
    if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('AI chưa có câu trả lời. Bạn thử lại nhé.');
    if (version !== aiVersion) return;
    $('ai-status').hidden = true;
    showAiAnswer(data.answer, version);
  } catch (error) {
    if (version !== aiVersion || error.name === 'AbortError') return;
    $('ai-status').textContent = error instanceof TypeError ? 'Mất kết nối. Bạn thử gửi lại câu hỏi nhé.' : error.message;
    $('ai-status').classList.add('is-error');
    $('ai-status').hidden = false;
  } finally {
    if (version === aiVersion) { aiController = null; setAiBusy(false); }
  }
});
window.visualViewport?.addEventListener('resize', positionTranslationCard);
window.visualViewport?.addEventListener('scroll', positionTranslationCard);
window.addEventListener('resize', positionTranslationCard);

function cancelHold() {
  if (hold) window.clearTimeout(hold.timer);
  hold = null;
}

function openDialog(id) {
  closeTranslation();
  cancelHold();
  $(id).showModal();
  document.body.classList.add('modal-open');
  if (id === 'vocabulary-dialog') $('vocabulary-toggle').setAttribute('aria-expanded', 'true');
}

function switchVocabTab(which) {
  const words = which === 'words';
  $('words-tab').setAttribute('aria-selected', words);
  $('phrases-tab').setAttribute('aria-selected', !words);
  $('words-tab').tabIndex = words ? 0 : -1;
  $('phrases-tab').tabIndex = words ? -1 : 0;
  $('words-panel').hidden = !words;
  $('phrases-panel').hidden = words;
  $('vocabulary-dialog').querySelector('.sheet-scroll').scrollTop = 0;
}

document.addEventListener('pointerdown', event => {
  if (activeSegment && !activeSegment.contains(event.target) && !$('translation-card').contains(event.target)) closeTranslation();
});
$('passage').addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  const span = event.target.closest('.segment');
  if (!span) return;
  cancelHold();
  hold = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, timer: window.setTimeout(() => {
    translate(span);
    hold = null;
  }, 450) };
});
document.addEventListener('pointermove', event => {
  if (hold && event.pointerId === hold.pointerId && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > 10) cancelHold();
}, { passive: true });
document.addEventListener('pointerup', cancelHold);
document.addEventListener('pointercancel', cancelHold);
window.addEventListener('blur', cancelHold);
$('passage').addEventListener('contextmenu', event => event.preventDefault());
$('passage').addEventListener('dblclick', event => { const span = event.target.closest('.segment'); if (span) translate(span); });
$('passage').addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    const span = event.target.closest('.segment');
    if (span) { event.preventDefault(); activeSegment === span ? closeTranslation() : translate(span); }
  }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { cancelHold(); closeTranslation(); } });
$('close-translation').addEventListener('click', closeTranslation);
window.addEventListener('hashchange', route);
$('previous-lesson').addEventListener('click', () => goToLesson(Math.max(1, state.currentLesson - 1)));
$('next-lesson').addEventListener('click', () => goToLesson(Math.min(lessons.length, state.currentLesson + 1)));
$('complete-button').addEventListener('click', () => {
  today = dateKey();
  state = completeLesson(state, state.currentLesson, today, lessons.length);
  save({ type: 'complete', lessonId: state.currentLesson, date: today }); updateCompletion(); updateSummary();
  announce(`Đã ghi lại bài ${state.currentLesson} vào lịch hôm nay.`);
});
$('undo-button').addEventListener('click', () => {
  today = dateKey();
  state = undoCompletion(state, state.currentLesson, today);
  save({ type: 'undo', lessonId: state.currentLesson, date: today }); updateCompletion(); updateSummary(); announce('Đã hoàn tác đánh dấu đọc hôm nay.');
});
for (const [id, step] of [['font-down', -1], ['font-up', 1]]) {
  $(id).addEventListener('click', () => {
    const size = FONT_SIZES[FONT_SIZES.indexOf(state.fontSize) + step];
    if (size) { state = { ...state, fontSize: size }; save({ type: 'font', fontSize: size }); renderReader(); announce(`Cỡ chữ ${size}.`); }
  });
}
$('vocabulary-toggle').addEventListener('click', () => openDialog('vocabulary-dialog'));
$('lesson-picker').addEventListener('click', () => { renderPicker(); openDialog('picker-dialog'); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    if (dialog.id === 'vocabulary-dialog') $('vocabulary-toggle').setAttribute('aria-expanded', 'false');
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
});
$('words-tab').addEventListener('click', () => switchVocabTab('words'));
$('phrases-tab').addEventListener('click', () => switchVocabTab('phrases'));
for (const id of ['words-tab', 'phrases-tab']) $(id).addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const words = event.key === 'Home' || (event.key !== 'End' && id === 'phrases-tab');
    switchVocabTab(words ? 'words' : 'phrases');
    $(words ? 'words-tab' : 'phrases-tab').focus();
  }
});
document.addEventListener('click', event => {
  const lessonButton = event.target.closest('[data-lesson]');
  if (lessonButton) goToLesson(Number(lessonButton.dataset.lesson));
  if (event.target.closest('[data-go-read]')) location.hash = '#read';
  const dayButton = event.target.closest('[data-day]');
  if (dayButton) { selectedDay = dayButton.dataset.day; renderCalendar(); $('calendar-grid').querySelector(`[data-day="${selectedDay}"]`)?.focus({ preventScroll: true }); }
});
function showToday() {
  const now = new Date(); today = dateKey(now); selectedDay = today; year = now.getFullYear(); month = now.getMonth();
  if (location.hash === '#calendar') renderCalendar(); else location.hash = '#calendar';
}
$('today-button').addEventListener('click', showToday);
$('current-month').addEventListener('click', showToday);
for (const [id, step] of [['previous-month', -1], ['next-month', 1]]) $(id).addEventListener('click', () => {
  const next = new Date(year, month + step, 1, 12);
  year = next.getFullYear(); month = next.getMonth(); selectedDay = dateKey(next); renderCalendar();
});
for (const type of ['read', 'all']) $(`filter-${type}`).addEventListener('click', () => { historyFilter = type; renderHistory(); });
$('lesson-search').addEventListener('input', renderHistory);
$('backup-toggle').addEventListener('click', () => {
  $('backup-message').textContent = '';
  const legacy = loadState(storage, lessons.length);
  let legacyOwner;
  try { legacyOwner = storage.getItem(`${STORAGE_KEY}:legacy-owner`); } catch {}
  $('import-legacy').hidden = !!legacy.error || (legacyOwner && legacyOwner !== account.user.id) || (!legacy.state.records.length && legacy.state.currentLesson === 1);
  openDialog('backup-dialog');
});
$('import-legacy').addEventListener('click', async () => {
  const legacy = loadState(storage, lessons.length);
  if (legacy.error) { $('backup-message').textContent = legacy.error; return; }
  state = mergeBackup(state, legacy.state, lessons.length);
  save({ type: 'import', state: legacy.state }); updateSummary(); renderHistory();
  if (await account.flush()) {
    try { storage.setItem(`${STORAGE_KEY}:legacy-owner`, account.user.id); } catch {}
    $('import-legacy').hidden = true;
    $('backup-message').textContent = 'Đã nhập tiến độ cũ vào tài khoản này.';
  }
});
let aiLogCursor = null;
let aiLogsBusy = false;
async function loadAiLogs(append = false) {
  if (aiLogsBusy) return;
  aiLogsBusy = true;
  const userId = account.user?.id;
  $('ai-logs-status').textContent = 'Đang mở nhật ký…';
  $('ai-logs-more').disabled = true;
  try {
    const data = await account.api(`./api/ai/logs${append && aiLogCursor ? `?before=${aiLogCursor}` : ''}`);
    if (account.user?.id !== userId) return;
    if (!append) $('ai-logs-list').replaceChildren();
    for (const entry of data.items) {
      const row = document.createElement('article');
      row.className = 'ai-log-row';
      const when = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.timestamp));
      row.innerHTML = `<span class="small-label">${escapeHTML(when)} · Bài ${entry.lessonId}</span><h3>${escapeHTML(entry.userInput)}</h3><p>${escapeHTML(entry.answer || 'Lượt hỏi chưa có câu trả lời.')}</p><details><summary>Xem câu đã hỏi</summary><p lang="en">${escapeHTML(entry.sourceEnglish)}</p><p>${escapeHTML(entry.translationVietnamese)}</p></details>`;
      $('ai-logs-list').append(row);
    }
    aiLogCursor = data.nextCursor;
    $('ai-logs-more').hidden = !aiLogCursor;
    $('ai-logs-status').textContent = $('ai-logs-list').childElementCount ? '' : 'Chưa có câu hỏi AI nào trong tài khoản này.';
  } catch (error) { $('ai-logs-status').textContent = error.message; }
  finally { aiLogsBusy = false; $('ai-logs-more').disabled = false; }
}
$('ai-logs-toggle').addEventListener('click', () => { aiLogCursor = null; $('ai-logs-list').replaceChildren(); openDialog('ai-logs-dialog'); void loadAiLogs(); });
$('ai-logs-more').addEventListener('click', () => void loadAiLogs(true));
$('import-button').addEventListener('click', () => $('import-backup').click());
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); $('main').focus(); });
$('export-backup').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `moi-ngay-tien-do-${dateKey()}.json`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('backup-message').classList.remove('is-error');
  $('backup-message').textContent = 'Bản sao lưu đã được tạo. Hãy giữ tệp ở nơi bạn dễ tìm lại.';
});
$('import-backup').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Tệp quá lớn. Hãy chọn bản sao lưu nhỏ hơn 5 MB.');
    const imported = JSON.parse(await file.text());
    state = mergeBackup(state, imported, lessons.length);
    save({ type: 'import', state: imported }); updateSummary(); renderHistory();
    $('backup-message').classList.remove('is-error');
    $('backup-message').textContent = 'Đã gộp bản sao lưu vào tiến độ của bạn.';
  } catch (error) {
    $('backup-message').classList.add('is-error');
    $('backup-message').textContent = error instanceof SyntaxError ? 'Tệp không phải JSON hợp lệ. Hãy chọn đúng bản sao lưu.' : error.message;
  } finally { event.target.value = ''; }
});
function refreshDate() {
  if (!account.user) return;
  const now = dateKey();
  if (today === now) return;
  today = now; updateSummary();
  if (view === 'read') updateCompletion();
  if (view === 'calendar') renderCalendar();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); else cancelHold(); });
setInterval(refreshDate, 30000);

async function loadLessons() {
  if (loading) return;
  loading = true;
  $('loading').hidden = false; $('error-view').hidden = true;
  try {
    const response = await fetch('./data/lessons.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.lessons) || !data.lessons.length) throw new Error('Invalid catalog');
    for (const [index, lesson] of data.lessons.entries()) {
      if (lesson.id !== index + 1 || !lesson.segments?.length || lesson.vocabulary?.length !== 10) throw new Error('Incomplete lesson');
    }
    lessons = data.lessons;
    try { state = validateState(state, lessons.length); }
    catch { state = freshState(); showStorageWarning('Tiến độ không khớp với danh sách bài. Bạn có thể khôi phục bằng bản sao lưu.'); }
    $('loading').hidden = true; route();
  } catch (error) {
    console.error('Could not load lesson catalog:', error);
    $('loading').hidden = true; $('error-view').hidden = false;
  } finally { loading = false; }
}
$('retry-button').addEventListener('click', loadLessons);
hydrateIcons();
account.bootstrap();
