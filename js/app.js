// App bootstrap: shell, navigation, routing, shared services.
import { h, icon, clear } from './ui/dom.js';
import { toast, modal, confirmDialog, confetti } from './ui/components.js';
import { createRouter } from './router.js';
import { createStore, recordAttempt, overrideAttempt, addSession, recordStudyTime, dayKey, STORAGE_KEY, memoryStorage } from './state/store.js';
import { deckCounts } from './state/srs.js';
import { openMistakes } from './state/progress.js';
import { newMilestones } from './state/milestones.js';
import { createSession, sessionRecord } from './quiz/session.js';
import { COURSE, CHANGELOG, allCards } from '../content/course.js';
import * as messages from '../content/messages.js';
import { APP_VERSION } from './version.js';
import { ROUTES } from './routes.js';
import { initCloud } from './cloud/index.js';
import { createFeedback } from './state/feedback.js';
import { setFeedbackService } from './ui/confused.js';

const store = createStore();
const cards = allCards();

// ---- Theme ----------------------------------------------------------------------------------
function applyTheme() {
  const p = store.get().profile;
  const root = document.documentElement;
  if (p.theme === 'light' || p.theme === 'dark') root.setAttribute('data-theme', p.theme);
  else root.removeAttribute('data-theme');
  root.setAttribute('data-accent', p.accent || 'violet');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const dark = p.theme === 'dark' || (p.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    meta.setAttribute('content', dark ? '#0e1016' : '#f4f5fa');
  }
}
applyTheme();

// ---- Shell ----------------------------------------------------------------------------------
const NAV_MAIN = [
  { href: '#/', label: 'Home', icon: 'home', match: (p) => p === '/' },
  { href: '#/learn', label: 'Learn', icon: 'book', match: (p) => p.startsWith('/learn') || p.startsWith('/bootcamp') },
  { href: '#/practice', label: 'Practice', icon: 'target', match: (p) => /^\/(practice|quiz|results|mistakes|game)/.test(p) },
  { href: '#/cards', label: 'Cards', icon: 'cards', match: (p) => p.startsWith('/cards'), badge: () => dueCount() },
  { href: '#/more', label: 'More', icon: 'more', match: (p) => /^\/(more|reactions|lab|reference|tools|progress|settings|about|exams)/.test(p) },
];
const NAV_SIDE = [
  { group: 'Study' },
  { href: '#/', label: 'Home', icon: 'home', match: (p) => p === '/' },
  { href: '#/learn', label: 'Lectures', icon: 'book', match: (p) => p.startsWith('/learn') },
  { href: '#/bootcamp', label: 'Foundations Bootcamp', icon: 'spark', match: (p) => p.startsWith('/bootcamp') },
  { href: '#/practice', label: 'Practice', icon: 'target', match: (p) => /^\/(practice|quiz|results)/.test(p) },
  { href: '#/cards', label: 'Flashcards', icon: 'cards', match: (p) => p.startsWith('/cards'), badge: () => dueCount() },
  { href: '#/mistakes', label: 'Mistakes', icon: 'redo', match: (p) => p.startsWith('/mistakes'), badge: () => openMistakes(store.get()).length },
  { href: '#/game', label: 'Sea Lion Splash', icon: 'wave', match: (p) => p.startsWith('/game') },
  { group: 'Tools' },
  { href: '#/reactions', label: 'Reaction map', icon: 'map', match: (p) => p.startsWith('/reactions') },
  { href: '#/lab', label: 'Name Lab', icon: 'lab', match: (p) => p.startsWith('/lab') },
  { href: '#/reference', label: 'Reference', icon: 'list', match: (p) => p.startsWith('/reference') },
  { href: '#/tools/ph', label: 'pH calculator', icon: 'flask', match: (p) => p.startsWith('/tools') },
  { group: 'You' },
  { href: '#/progress', label: 'Progress', icon: 'chart', match: (p) => p.startsWith('/progress') },
  { href: '#/exams', label: 'Exams', icon: 'calendar', match: (p) => p.startsWith('/exams') },
  { href: '#/settings', label: 'Settings & backup', icon: 'settings', match: (p) => p.startsWith('/settings') || p.startsWith('/about') },
];

const root = document.getElementById('app');
clear(root);
const titleEl = h('div', { class: 'title' });
const topbar = h('header', { class: 'topbar' },
  h('a', { class: 'brand', href: '#/', 'aria-label': 'Home' }, h('span', { class: 'brand-mark', html: brandSvg() })),
  titleEl,
  h('a', { class: 'icon-btn', href: '#/progress', 'aria-label': 'Progress', title: 'Progress' }, icon('chart')),
  h('a', { class: 'icon-btn', href: '#/settings', 'aria-label': 'Settings', title: 'Settings' }, icon('settings')));
const side = h('aside', { class: 'sidenav', 'aria-label': 'Main navigation' },
  h('div', { class: 'brand' }, h('span', { class: 'brand-mark', html: brandSvg() }), h('div', {}, 'Chem Companion', h('small', {}, `${COURSE.code} · ${COURSE.title}`))),
  h('nav', {}),
  h('div', { class: 'foot' }, `v${APP_VERSION} · content ${COURSE.contentVersion}`));
const main = h('main', { class: 'main', id: 'main', tabindex: '-1' });
const bottom = h('nav', { class: 'bottomnav', 'aria-label': 'Main navigation' });
root.append(side, topbar, main, bottom);

function renderNav(path) {
  const sn = side.querySelector('nav');
  clear(sn);
  for (const item of NAV_SIDE) {
    if (item.group) { sn.appendChild(h('div', { class: 'group-label' }, item.group)); continue; }
    const b = item.badge ? item.badge() : 0;
    sn.appendChild(h('a', { href: item.href, class: item.match(path) ? 'active' : null, 'aria-current': item.match(path) ? 'page' : null }, icon(item.icon), item.label, b ? h('span', { class: 'badge' }, String(b > 99 ? '99+' : b)) : null));
  }
  clear(bottom);
  for (const item of NAV_MAIN) {
    const b = item.badge ? item.badge() : 0;
    bottom.appendChild(h('a', { href: item.href, class: item.match(path) ? 'active' : null, 'aria-current': item.match(path) ? 'page' : null }, icon(item.icon), item.label, b ? h('span', { class: 'badge' }, String(b > 99 ? '99+' : b)) : null));
  }
}

function dueCount() {
  const counts = deckCounts(cards, store.get(), dayKey());
  return Object.values(counts).reduce((a, c) => a + c.due, 0);
}

function brandSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z"/><path d="M12 7.2v4.8M12 12l4.2 2.4M12 12l-4.2 2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>';
}

// ---- App services (shared with views) ---------------------------------------------------------
const app = {
  store,
  course: COURSE,
  cards,
  get state() { return store.get(); },
  navigate: (href, opts) => router.navigate(href, opts),
  toast, modal, confirm: confirmDialog, confetti,
  setTitle(t) { titleEl.textContent = t || 'Chem Companion'; document.title = t ? `${t} · Chem Companion` : 'Chem Companion'; },
  applyTheme,
  dueCount,
  refreshNav() { renderNav(currentPath); },

  startSession(opts) {
    const s = createSession(store.get(), opts);
    if (!s.items.length) { toast('Nothing to practice here yet.'); return; }
    store.update((st) => { st.active = s; });
    router.navigate('#/quiz');
  },
  recordAnswer(session, item, q, { result, response, ms }) {
    const ts = Date.now();
    store.update((st) => {
      recordAttempt(st, { skill: item.skill, qid: q.generated ? null : q.id, ok: result.correct, ts, ref: item.ref, ms });
      const s = st.active && st.active.id === session.id ? st.active : session;
      s.answers.push({ ref: item.ref, skill: item.skill, ok: result.correct, status: result.status, response, ms, ts });
    }, { silent: true });
    return ts;
  },
  overrideAnswer(session, item, q, ts) {
    store.update((st) => {
      overrideAttempt(st, { skill: item.skill, qid: q.generated ? null : q.id, ts, ref: item.ref });
      const s = st.active && st.active.id === session.id ? st.active : session;
      const a = s.answers.find((x) => x.ts === ts);
      if (a) { a.ok = true; a.status = 'correct'; a.overridden = true; }
    }, { silent: true });
  },
  finishSession(session) {
    store.update((st) => {
      const s = st.active && st.active.id === session.id ? st.active : session;
      s.endedAt = Date.now();
      addSession(st, sessionRecord(s));
      st.lastResult = s;
      if (st.active === s) st.active = null; // leave a quiz running in another tab alone
    }, { silent: true });
    store.flush();
    router.navigate('#/results');
    setTimeout(checkMilestones, 900);
  },
  checkMilestones: () => checkMilestones(),
  cheer(good) {
    const pool = good ? messages.cheers : messages.comfort;
    return pool[Math.floor(Math.random() * pool.length)];
  },
};

function checkMilestones() {
  const fresh = newMilestones(store.get(), COURSE);
  if (!fresh.length) return;
  const id = fresh[0];
  store.update((st) => { for (const f of fresh) st.unlocked[f] = Date.now(); }, { silent: true });
  const text = messages.milestones[id];
  if (!text) return;
  confetti();
  modal({
    title: 'Milestone unlocked!',
    body: h('div', { class: 'onboard' }, h('div', { class: 'big-icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>` }), h('p', { style: { fontSize: '1.1rem' } }, text), messages.signature ? h('p', { class: 'muted' }, messages.signature) : null),
    actions: [{ label: 'Yay!', value: true }],
  });
}

// ---- Routing --------------------------------------------------------------------------------------
let currentPath = '/';
let cleanup = null;
const router = createRouter(ROUTES, async ({ route, params, query, path }) => {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  currentPath = path;
  renderNav(path);
  clear(main);
  main.className = `main ${route.wide ? 'wide' : ''}`;
  app.setTitle(route.title || '');
  window.scrollTo(0, 0);
  try {
    const result = route.view({ app, main, params, query, path });
    cleanup = typeof result === 'function' ? result : null;
  } catch (e) {
    console.error(e);
    main.appendChild(h('div', { class: 'card' }, h('h2', {}, 'Something went wrong'), h('p', { class: 'muted' }, 'This page hit an error. Your progress is safe.'), h('pre', { class: 'small', style: { whiteSpace: 'pre-wrap' } }, String(e && e.message)), h('a', { class: 'btn', href: '#/' }, 'Go home')));
  }
  const h1 = main.querySelector('h1');
  if (h1 && document.activeElement === document.body) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  studyRoute = /^\/(learn\/[^/]+\/[^/]+|quiz|cards\/review|bootcamp|game\/play)/.test(path);
});

// Keep nav badges fresh when data changes.
store.subscribe(() => renderNav(currentPath));

// ---- Study timer (counts only active, visible time on study pages) -----------------------------
let studyRoute = false;
let lastInteraction = Date.now();
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { lastInteraction = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!studyRoute || document.hidden) return;
  if (Date.now() - lastInteraction > 90_000) return;
  store.update((st) => recordStudyTime(st, 20, Date.now()), { silent: true });
}, 20_000);
window.addEventListener('pagehide', () => store.flush());

// ---- Several tabs/windows open at once ------------------------------------------------------------
// Pick up progress saved by another tab instead of overwriting it, and redraw overview pages
// (never a quiz or lesson in progress) when coming back to this tab.
const PASSIVE_ROUTE = /^\/(progress|learn(\/[^/]+)?|practice|mistakes|cards|bootcamp|exams|more|game)?$/;
let viewStale = false;
function pickUpOtherTabs() {
  if (store.reload()) viewStale = true;
  refreshStaleView();
}
function refreshStaleView() {
  if (viewStale && document.hidden === false && PASSIVE_ROUTE.test(currentPath) && !document.querySelector('.modal-backdrop')) {
    viewStale = false;
    router.start();
  }
}

// ---- Sign in with Google (cloud sync), when configured in js/cloud/config.js ----------------------
app.cloud = initCloud({
  store,
  toast,
  // progress arrived from another device: refresh overview pages (never a quiz in progress)
  onRemote: () => { viewStale = true; refreshStaleView(); applyTheme(); },
});

// "This confused me" reports: kept on the device, delivered to the database when signed in.
if (app.cloud.enabled) {
  let storage;
  try { storage = window.localStorage; storage.getItem('x'); } catch { storage = memoryStorage(); }
  app.feedback = createFeedback({ storage, send: (r) => app.cloud.sendFeedback(r) });
  setFeedbackService({ add: (r) => app.feedback.add(r), signedIn: () => !!app.cloud.state.user });
  app.cloud.subscribe((s) => { if (s.user && s.status === 'synced' && app.feedback.pending) app.feedback.flush(); });
}
window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY || e.key === null) pickUpOtherTabs(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) store.flush();
  else pickUpOtherTabs();
});
window.addEventListener('pageshow', (e) => { if (e.persisted) pickUpOtherTabs(); });

// ---- First run, what's new, storage ------------------------------------------------------------------
async function afterStart() {
  const st = store.get();
  if (!store.storageOk) {
    toast('Heads up: this browser is blocking storage (private mode?). Progress won\'t be saved.', { timeout: 9000 });
  }
  if (!st.profile.onboarded) {
    const { runOnboarding } = await import('./views/onboarding.js');
    runOnboarding(app);
    return;
  }
  if (st.meta.lastSeenVersion && st.meta.lastSeenVersion !== COURSE.contentVersion) {
    const latest = CHANGELOG[0];
    toast(`Updated: ${latest.title}`, { action: "What's new", onAction: () => router.navigate('#/about'), timeout: 8000 });
  }
  if (st.meta.lastSeenVersion !== COURSE.contentVersion) store.update((s) => { s.meta.lastSeenVersion = COURSE.contentVersion; }, { silent: true });
  requestPersistence();
  backupReminder();
}

async function requestPersistence() {
  const st = store.get();
  if (st.meta.persistAsked || !navigator.storage || !navigator.storage.persist) return;
  if (st.sessions.length < 1) return;
  try { await navigator.storage.persist(); } catch { /* ignore */ }
  store.update((s) => { s.meta.persistAsked = true; }, { silent: true });
}

function backupReminder() {
  const st = store.get();
  const since = Date.now() - (st.meta.lastBackupAt || st.createdAt);
  const q = Object.values(st.activity).reduce((a, x) => a + (x.q || 0), 0);
  if (q >= 40 && since > 14 * 86400000) {
    toast('It\'s been a while since your last backup.', { action: 'Back up', onAction: () => router.navigate('#/settings'), timeout: 9000 });
  }
}

// ---- Service worker (offline + updates) --------------------------------------------------------------
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !localStorage.getItem('cc-sw-dev')) return; // keep dev reloads simple
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const promptUpdate = (worker) => {
      toast('A new version is ready.', { action: 'Refresh', onAction: () => worker.postMessage({ type: 'SKIP_WAITING' }), timeout: 0 });
    };
    if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(w);
      });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    store.flush();
    location.reload();
  });
}

window.addEventListener('error', (e) => { console.error(e.error || e.message); });
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); });

router.start();
afterStart();
registerSW();
window.__app = app; // handy for debugging in the console
