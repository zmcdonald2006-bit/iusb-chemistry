// Persistent app state (progress, flashcards, settings) with versioned schema,
// debounced saving, export/import and multi-device merge.
//
// Data lives in the browser's localStorage under one key. Everything is plain JSON so a
// backup file can be opened and inspected by hand.

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'chem-companion:v1';
export const APP_ID = 'chem-companion';

const HISTORY_LIMIT = 40;
const SESSION_LIMIT = 150;

export function defaultState(now = Date.now()) {
  return {
    schema: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    profile: {
      name: '',
      onboarded: false,
      theme: 'auto',
      accent: 'violet',
      dailyGoal: 20,
      newCardsPerDay: 15,
      showHints: true,
    },
    exams: [],
    lessons: {},
    skills: {},
    questions: {},
    mistakes: {},
    cards: {},
    cardsIntroduced: {},
    activity: {},
    sessions: [],
    active: null,
    lastResult: null,
    unlocked: {},
    game: defaultGame(),
    meta: { lastBackupAt: 0, lastSeenVersion: '', persistAsked: false, installDismissed: false, epoch: 0, cloudUid: null, pt: {} },
  };
}

// ---- Date helpers (local time) -------------------------------------------------------

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n, 12);
  return dayKey(dt.getTime());
}

export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// ---- Migrations ------------------------------------------------------------------------

const MIGRATIONS = {
  // Example for the future:
  // 2: (s) => { s.newField = ...; return s; },
};

export function migrate(data, now = Date.now()) {
  if (!data || typeof data !== 'object') return defaultState(now);
  let s = data;
  let v = typeof s.schema === 'number' ? s.schema : 1;
  if (v > SCHEMA_VERSION) throw new Error(`This backup was made by a newer version of the app (schema ${v}). Refresh the page to update first.`);
  while (v < SCHEMA_VERSION) {
    v++;
    if (MIGRATIONS[v]) s = MIGRATIONS[v](s);
    s.schema = v;
  }
  // Fill in any missing fields (forward-compatible defaults).
  const base = defaultState(now);
  for (const k of Object.keys(base)) {
    if (s[k] === undefined) s[k] = base[k];
  }
  s.profile = { ...base.profile, ...(s.profile || {}) };
  s.meta = { ...base.meta, ...(s.meta || {}) };
  s.game = { ...base.game, ...(s.game || {}) };
  s.game.owned = [...new Set([...base.game.owned, ...(Array.isArray(s.game.owned) ? s.game.owned : [])])].sort(); // sorted, like merges
  if (!Array.isArray(s.sessions)) s.sessions = [];
  if (!Array.isArray(s.exams)) s.exams = [];
  return s;
}

export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object') return 'That file is not a backup.';
  const data = obj.app === APP_ID ? obj.data : obj;
  if (!data || typeof data !== 'object') return 'That file does not contain progress data.';
  if (typeof data.schema !== 'number') return "That file doesn't look like a Chem Companion backup.";
  for (const k of ['skills', 'cards', 'activity']) {
    if (data[k] != null && typeof data[k] !== 'object') return `Backup field "${k}" is damaged.`;
  }
  return null;
}

// ---- Merge (combine two devices) ---------------------------------------------------------

export function mergeStates(a, b) {
  // The result has the same progress whichever copy comes first, so synced devices settle on one
  // version. Device-only bits (an unfinished quiz, "what's new" seen…) are kept from `a`.
  const out = JSON.parse(JSON.stringify(a));
  b = JSON.parse(JSON.stringify(b));
  // profile: each setting from whichever side changed it last; blanks are filled in
  out.meta.pt = mergeFields(out.profile, b.profile || {}, (a.meta && a.meta.pt) || {}, (b.meta && b.meta.pt) || {});
  out.profile.onboarded = !!(out.profile.onboarded || (b.profile && b.profile.onboarded));
  // exams: union by id, newer edit wins (deleted exams stay as markers)
  out.exams = unionBy(out.exams || [], b.exams || [], (e) => e.id, (e) => [e.updatedAt || 0]).sort(byKey((e) => String(e.id)));
  // lessons: union of read sections (earliest time), latest visit
  for (const [lid, l] of Object.entries(b.lessons || {})) {
    const mine = out.lessons[lid] || (out.lessons[lid] = { read: {} });
    mine.read = mine.read || {};
    for (const [sid, ts] of Object.entries(l.read || {})) mine.read[sid] = Math.min(mine.read[sid] ?? Infinity, ts);
    const visit = winner({ lastVisit: mine.lastVisit, lastSection: mine.lastSection }, { lastVisit: l.lastVisit, lastSection: l.lastSection }, (x) => [x.lastVisit || 0]);
    if (visit.lastVisit !== undefined) { mine.lastVisit = visit.lastVisit; mine.lastSection = visit.lastSection; }
  }
  // skills: union of answer histories (always sorted the same way)
  for (const sid of new Set([...Object.keys(out.skills), ...Object.keys(b.skills || {})])) {
    const mine = out.skills[sid] || { h: [], n: 0, c: 0, last: 0 };
    const s = (b.skills && b.skills[sid]) || { h: [], n: 0, c: 0, last: 0 };
    const seen = new Set();
    const hist = [...(mine.h || []), ...(s.h || [])].filter((e) => { const k = e.join(':'); if (seen.has(k)) return false; seen.add(k); return true; });
    hist.sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]));
    out.skills[sid] = {
      ...mine,
      h: hist.slice(-HISTORY_LIMIT),
      n: Math.max(mine.n || 0, s.n || 0),
      c: Math.max(mine.c || 0, s.c || 0),
      last: Math.max(mine.last || 0, s.last || 0),
    };
  }
  for (const [qid, q] of Object.entries(b.questions || {})) {
    const mine = out.questions[qid];
    if (!mine) { out.questions[qid] = q; continue; }
    const latest = winner(mine, q, (x) => [x.last || 0]);
    out.questions[qid] = { n: Math.max(mine.n || 0, q.n || 0), c: Math.max(mine.c || 0, q.c || 0), last: latest.last || 0, lastOk: latest.lastOk || 0 };
  }
  // mistakes: the newest miss; for the same miss, the copy that got further clearing it
  for (const [k, m] of Object.entries(b.mistakes || {})) {
    out.mistakes[k] = out.mistakes[k] ? winner(out.mistakes[k], m, (x) => [x.lastWrong || 0, x.cleared ? 1 : 0, x.streak || 0, -(x.count || 0)]) : m;
  }
  for (const [cid, c] of Object.entries(b.cards || {})) {
    out.cards[cid] = out.cards[cid] ? winner(out.cards[cid], c, (x) => [x.last || 0, x.reps || 0]) : c;
  }
  for (const [d, n] of Object.entries(b.cardsIntroduced || {})) out.cardsIntroduced[d] = Math.max(out.cardsIntroduced[d] || 0, n);
  for (const [d, act] of Object.entries(b.activity || {})) {
    const mine = out.activity[d] || (out.activity[d] = {});
    for (const [f, v] of Object.entries(act)) mine[f] = Math.max(mine[f] || 0, v);
  }
  out.sessions = unionBy(out.sessions || [], b.sessions || [], (s) => s.id, (s) => [s.endedAt || 0])
    .sort((x, y) => ((x.startedAt || 0) - (y.startedAt || 0)) || cmp(String(x.id), String(y.id)))
    .slice(-SESSION_LIMIT);
  for (const [k, v] of Object.entries(b.unlocked || {})) out.unlocked[k] = out.unlocked[k] ? Math.min(out.unlocked[k], v) : v;
  out.meta.lastBackupAt = Math.max(out.meta.lastBackupAt || 0, (b.meta && b.meta.lastBackupAt) || 0);
  // game: wallet and settings from whichever side changed them last (the bigger wallet if
  // unknown); best scores are maxed and everything bought on either device is kept
  const ga = out.game || defaultGame();
  const gb = b.game || {};
  const unknown = !(ga.pt && ga.pt.fish) && !(gb.pt && gb.pt.fish);
  const bigger = Math.max(ga.fish || 0, gb.fish || 0);
  ga.pt = mergeFields(ga, gb, ga.pt || {}, gb.pt || {}, GAME_FIELDS);
  if (unknown) ga.fish = bigger;
  for (const k of ['best', 'runs', 'answered', 'correct']) ga[k] = Math.max(ga[k] || 0, gb[k] || 0);
  ga.bestByDeck = { ...(ga.bestByDeck || {}) };
  for (const [d, v] of Object.entries(gb.bestByDeck || {})) ga.bestByDeck[d] = Math.max(ga.bestByDeck[d] || 0, v);
  ga.owned = [...new Set([...(ga.owned || []), ...(gb.owned || [])])].sort();
  out.game = ga;
  out.createdAt = Math.min(out.createdAt || Infinity, b.createdAt || Infinity);
  return out;
}

// Same JSON for the same data, whatever order keys were added in.
export function stableStringify(v) {
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? 'null' : stableStringify(x))).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}
const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
const byKey = (f) => (x, y) => cmp(f(x), f(y));
// Pick the copy with the bigger rank; ties are broken by content, so both sides choose the same one.
function winner(x, y, rank) {
  const rx = rank(x), ry = rank(y);
  for (let i = 0; i < rx.length; i++) if (rx[i] !== ry[i]) return ry[i] > rx[i] ? y : x;
  return stableStringify(y) > stableStringify(x) ? y : x;
}
function unionBy(xs, ys, id, rank) {
  const m = new Map();
  for (const y of [...xs, ...ys]) { const x = m.get(id(y)); m.set(id(y), x ? winner(x, y, rank) : y); }
  return [...m.values()];
}

// Simple settings that sync "last change wins", with a change time per field.
export const GAME_FIELDS = ['fish', 'outfit', 'theme', 'speed', 'sound', 'haptics', 'lastDeck'];

// Merge flat fields of `theirs` into `mine` (in place). For each field: a filled-in value beats a
// blank one, then the more recent change wins, then (exact tie) the content decides, so both
// devices pick the same value. Returns the merged change times.
function mergeFields(mine, theirs, myTimes, theirTimes, keys = [...new Set([...Object.keys(mine), ...Object.keys(theirs)])]) {
  const blank = (v) => v === '' || v == null;
  for (const k of keys) {
    if (theirs[k] === undefined) continue;
    const m = [mine[k], myTimes[k] || 0];
    const t = [theirs[k], theirTimes[k] || 0];
    const takeTheirs = mine[k] === undefined
      || (blank(m[0]) !== blank(t[0]) ? blank(m[0]) : t[1] !== m[1] ? t[1] > m[1] : stableStringify(t[0]) > stableStringify(m[0]));
    if (takeTheirs) mine[k] = theirs[k];
  }
  const times = {};
  for (const k of new Set([...Object.keys(myTimes), ...Object.keys(theirTimes)])) times[k] = Math.max(myTimes[k] || 0, theirTimes[k] || 0);
  return times;
}

// Record when flat fields changed (compares a shallow copy taken before an update).
function stampChanges(before, after, times, t, keys = Object.keys(after)) {
  let out = times;
  for (const k of keys) {
    if (before[k] !== after[k]) { out = out === times ? { ...times } : out; out[k] = t; }
  }
  return out;
}

// ---- Store -------------------------------------------------------------------------------------

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

export function createStore({ storage, key = STORAGE_KEY, now = () => Date.now(), debounceMs = 250, schedule } = {}) {
  let storageOk = true;
  let lastError = null;
  let st;
  let dirty = false; // unsaved changes in memory
  let lastRaw = null; // what we last read or wrote, to notice saves from other tabs
  const backend = storage || safeLocalStorage();
  try {
    const raw = backend.getItem(key);
    lastRaw = raw;
    st = raw ? migrate(JSON.parse(raw), now()) : defaultState(now());
  } catch (e) {
    lastError = e;
    // Keep the unreadable data aside so nothing is lost silently.
    try { const raw = backend.getItem(key); if (raw) backend.setItem(`${key}:corrupt:${now()}`, raw); } catch { /* ignore */ }
    st = defaultState(now());
  }
  const listeners = new Set();
  let timer = null;
  const later = schedule || ((fn, ms) => setTimeout(fn, ms));
  const cancel = (t) => { if (t && typeof clearTimeout === 'function') clearTimeout(t); };

  function save() {
    cancel(timer);
    timer = null;
    try {
      const raw = JSON.stringify(st);
      backend.setItem(key, raw);
      lastRaw = raw;
      dirty = false;
      storageOk = true;
    } catch (e) {
      storageOk = false;
      lastError = e;
    }
    for (const fn of saveHooks) { try { fn(st); } catch { /* a hook must never break saving */ } }
  }
  const saveHooks = new Set();

  const store = {
    get: () => st,
    get storageOk() { return storageOk; },
    get lastError() { return lastError; },
    update(fn, { silent = false } = {}) {
      const profileBefore = { ...st.profile };
      const gameBefore = st.game ? { ...st.game } : null;
      fn(st);
      const t = now();
      st.updatedAt = t;
      // remember when each setting changed, so syncing devices keeps the latest one
      st.meta.pt = stampChanges(profileBefore, st.profile, st.meta.pt || {}, t);
      if (st.game && gameBefore) st.game.pt = stampChanges(gameBefore, st.game, st.game.pt || {}, t, GAME_FIELDS);
      dirty = true;
      if (debounceMs <= 0) save();
      else if (!timer) timer = later(save, debounceMs);
      if (!silent) listeners.forEach((l) => l(st));
      return st;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // Called after every save (cloud sync uses this to notice new progress).
    onSaved(fn) { saveHooks.add(fn); return () => saveHooks.delete(fn); },
    // Swap in a whole new state (e.g. progress merged from the cloud) and save it.
    replace(next) {
      st = migrate(JSON.parse(JSON.stringify(next)), now());
      save();
      listeners.forEach((l) => l(st));
    },
    // Only writes when something changed, so an idle tab never overwrites progress saved by another tab.
    flush() { if (dirty) save(); },
    // Another tab or window saved progress: adopt it (merging in any unsaved changes of our own).
    // Returns true when the state changed.
    reload() {
      let raw;
      try { raw = backend.getItem(key); } catch { return false; }
      if (!raw || raw === lastRaw) return false;
      let incoming;
      try { incoming = migrate(JSON.parse(raw), now()); } catch { return false; }
      lastRaw = raw;
      if (dirty) {
        st = mergeStates(st, incoming);
        save();
      } else {
        st = incoming;
      }
      listeners.forEach((l) => l(st));
      return true;
    },
    exportData() {
      return JSON.stringify({ app: APP_ID, schema: SCHEMA_VERSION, exportedAt: new Date(now()).toISOString(), data: st }, null, 1);
    },
    importData(text, { mode = 'replace' } = {}) {
      let obj;
      try { obj = typeof text === 'string' ? JSON.parse(text) : text; } catch { return { ok: false, error: "That file isn't valid JSON." }; }
      const err = validateBackup(obj);
      if (err) return { ok: false, error: err };
      let incoming;
      try { incoming = migrate(JSON.parse(JSON.stringify(obj.app === APP_ID ? obj.data : obj)), now()); } catch (e) { return { ok: false, error: e.message }; }
      const cloudUid = st.meta.cloudUid;
      if (mode === 'merge') {
        st = mergeStates(st, incoming);
      } else {
        st = incoming;
        st.meta.epoch = now(); // "Replace" also replaces the cloud copy when signed in
      }
      st.meta.cloudUid = cloudUid; // which account this device syncs with doesn't come from the file
      st.updatedAt = now();
      save();
      listeners.forEach((l) => l(st));
      return { ok: true };
    },
    // everywhere: also wipe the signed-in account's cloud copy (a newer reset "epoch" wins on sync).
    reset({ everywhere = false } = {}) {
      const cloudUid = st.meta.cloudUid;
      st = defaultState(now());
      if (everywhere) { st.meta.epoch = now(); st.meta.cloudUid = cloudUid; }
      save();
      listeners.forEach((l) => l(st));
    },
  };
  return store;
}

function safeLocalStorage() {
  try {
    const ls = globalThis.localStorage;
    const probe = '__cc_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryStorage();
  }
}

// ---- Recording helpers (pure functions on state) ------------------------------------------

export function recordAttempt(s, { skill, qid, ok, ts, ref, ms }) {
  const day = dayKey(ts);
  const sk = s.skills[skill] || (s.skills[skill] = { h: [], n: 0, c: 0, last: 0 });
  sk.h.push([ts, ok ? 1 : 0]);
  if (sk.h.length > HISTORY_LIMIT) sk.h.splice(0, sk.h.length - HISTORY_LIMIT);
  sk.n++;
  if (ok) sk.c++;
  sk.last = ts;
  if (qid) {
    const q = s.questions[qid] || (s.questions[qid] = { n: 0, c: 0, last: 0, lastOk: 0 });
    q.n++;
    if (ok) q.c++;
    q.last = ts;
    q.lastOk = ok ? 1 : 0;
  }
  const act = s.activity[day] || (s.activity[day] = {});
  act.q = (act.q || 0) + 1;
  if (ok) act.c = (act.c || 0) + 1;
  if (ms) act.secs = (act.secs || 0) + Math.min(Math.round(ms / 1000), 180);
  if (ref) noteMistake(s, { ref, skill, ok, ts });
}

// Mistake notebook: a miss is added; two correct answers in a row clear it.
export function noteMistake(s, { ref, skill, ok, ts }) {
  const key = ref.key;
  const m = s.mistakes[key];
  if (!ok) {
    s.mistakes[key] = { ref, skill, count: (m ? m.count : 0) + 1, lastWrong: ts, streak: 0, cleared: false };
  } else if (m && !m.cleared) {
    m.streak = (m.streak || 0) + 1;
    if (m.streak >= 2) { m.cleared = true; m.clearedAt = ts; }
  }
}

export function defaultGame() {
  return {
    fish: 0, owned: ['bay', 'natural'], outfit: 'natural', theme: 'bay',
    best: 0, bestByDeck: {}, runs: 0, answered: 0, correct: 0,
    speed: 'normal', sound: true, haptics: true, lastDeck: 'foundations',
  };
}

// The student says a typed answer that was marked wrong is actually right.
export function overrideAttempt(s, { skill, qid, ts, ref }) {
  const sk = s.skills[skill];
  if (sk) {
    const entry = sk.h.find((e) => e[0] === ts) || [...sk.h].reverse().find((e) => e[1] === 0);
    if (entry && entry[1] === 0) { entry[1] = 1; sk.c++; }
  }
  if (qid && s.questions[qid]) { s.questions[qid].c++; s.questions[qid].lastOk = 1; }
  const act = s.activity[dayKey(ts)];
  if (act) act.c = (act.c || 0) + 1;
  if (ref && s.mistakes[ref.key]) {
    const m = s.mistakes[ref.key];
    m.count--;
    if (m.count <= 0) { m.cleared = true; m.clearedAt = ts; } // (kept, so a synced device clears it too)
  }
}

export function recordStudyTime(s, secs, ts) {
  const day = dayKey(ts);
  const act = s.activity[day] || (s.activity[day] = {});
  act.secs = (act.secs || 0) + secs;
}

export function markSectionRead(s, lectureId, sectionId, ts) {
  const l = s.lessons[lectureId] || (s.lessons[lectureId] = { read: {} });
  l.read = l.read || {};
  if (!l.read[sectionId]) {
    l.read[sectionId] = ts;
    const act = s.activity[dayKey(ts)] || (s.activity[dayKey(ts)] = {});
    act.read = (act.read || 0) + 1;
  }
  l.lastSection = sectionId;
  l.lastVisit = ts;
}

export function addSession(s, session) {
  s.sessions.push(session);
  if (s.sessions.length > SESSION_LIMIT) s.sessions.splice(0, s.sessions.length - SESSION_LIMIT);
}
