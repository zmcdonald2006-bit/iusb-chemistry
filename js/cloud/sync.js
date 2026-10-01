// Cloud sync: keeps this device's progress and the signed-in account's cloud copy in step.
//
// Progress is still saved on the device first (so the app works offline); when signed in, every
// change is merged into the account's cloud copy, and changes made on other devices are merged in
// live. Merging is the same order-independent merge used for backups, so devices always agree.
//
// The cloud connection is passed in as an "adapter" (Firebase in the app, an in-memory fake in tests):
//   onAuth(cb) → unsubscribe        cb(user | null); user = { uid, name, email, photo }
//   signIn(), signOut()             Promises
//   transact(uid, fn)               fn(doc | null) → { doc | null, ...extra }; writes doc atomically
//                                   when not null and resolves to fn's result
//   subscribe(uid, cb, onError)     cb(doc | null) when the cloud copy changes → unsubscribe
//   remove(uid)                     deletes the cloud copy
//   addFeedback(uid, report)        stores a "This confused me" report (feedback collection)
// A cloud doc looks like { data, enc, rev, schema, app }; rev goes up by one on every write.
import { mergeStates, migrate, defaultState, SCHEMA_VERSION, APP_ID } from '../state/store.js';
import { encodeState, decodeState, fingerprint, DEVICE_META } from './codec.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

// Merge for syncing. A reset ("epoch") is respected: progress from before a reset never comes back.
export function syncMerge(local, remote) {
  const el = (local.meta && local.meta.epoch) || 0;
  const er = (remote.meta && remote.meta.epoch) || 0;
  if (er > el) return keepDeviceBits(clone(remote), local);
  if (el > er) return clone(local);
  return mergeStates(local, remote);
}

// Put this device's own settings (and any unfinished quiz) onto a copy of synced progress.
function keepDeviceBits(state, device) {
  state.active = device.active || null;
  state.lastResult = device.lastResult || null;
  state.meta = state.meta || {};
  for (const k of DEVICE_META) if (device.meta && device.meta[k] !== undefined) state.meta[k] = device.meta[k];
  return state;
}

// This device had another account's progress: start from the new account's own cloud copy.
function takeOver(device, remote, now) {
  const base = remote ? clone(remote) : defaultState(now);
  const out = keepDeviceBits(base, { meta: device.meta });
  out.active = null;
  out.lastResult = null;
  out.profile.onboarded = true;
  return out;
}

export function friendlyError(e) {
  const code = (e && e.code) || '';
  const map = {
    'auth/unauthorized-domain': 'Google sign-in isn\'t set up for this web address yet. (Firebase → Authentication → Settings → Authorized domains.)',
    'auth/operation-not-allowed': 'Google sign-in isn\'t switched on yet. (Firebase → Authentication → Sign-in method → Google.)',
    'auth/configuration-not-found': 'Google sign-in isn\'t switched on yet. (Firebase → Authentication → Sign-in method → Google.)',
    'auth/popup-blocked': 'The sign-in window was blocked. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'You\'re offline. Connect to the internet and try again.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'permission-denied': 'The cloud database refused to save (check the Firestore rules in docs/GOOGLE_SIGN_IN.md).',
    'failed-precondition': 'The cloud database isn\'t set up yet (create a Firestore database in Firebase).',
    'not-found': 'The cloud database isn\'t set up yet (Firebase → Firestore → Create database). Your progress is safe on this device.',
    'unavailable': 'Can\'t reach the cloud right now. Your progress is safe on this device and will sync later.',
    'resource-exhausted': 'The free cloud quota is used up for today. Progress will sync tomorrow.',
  };
  if (map[code]) return map[code];
  if (/^auth\/(invalid-api-key|api-key-not-valid)/.test(code)) return 'The Firebase settings in js/cloud/config.js don\'t look right. Copy them again from Firebase → Project settings.';
  if (e && e.message && /^cc\//.test(code)) return e.message;
  return 'Something went wrong while syncing. Your progress is safe on this device.';
}

const isOffline = (e) => (typeof navigator !== 'undefined' && navigator.onLine === false) || ['unavailable', 'auth/network-request-failed', 'deadline-exceeded'].includes(e && e.code);
const isUserCancel = (e) => ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(e && e.code);

// onRemote(): called after progress from the cloud (another device) was merged in.
export function createSync({ store, adapter, now = () => Date.now(), debounceMs = 3000, schedule, cancel, onRemote } = {}) {
  // authReady: the sign-in state is known (until then, "signed-out" may just mean "still checking").
  const st = { status: 'signed-out', user: null, lastSyncAt: 0, error: null, authReady: false };
  const listeners = new Set();
  const later = schedule || ((fn, ms) => setTimeout(fn, ms));
  const clearT = cancel || ((t) => clearTimeout(t));
  let lastRev = 0; // newest cloud revision this device has merged
  let lastFp = null; // fingerprint of the cloud copy as of lastRev
  let unwatch = null;
  let timer = null;
  let retryTimer = null;
  let retryMs = 5000;
  let running = null;
  let again = false;
  let applying = false;
  let lastResent = null;
  let watchBroken = false; // the live listener stopped (e.g. the database wasn't ready); restart it after a good sync
  let generation = 0; // bumps on every sign-in/out so stale async work is ignored

  const set = (patch) => {
    Object.assign(st, patch);
    const snap = { ...st };
    for (const fn of listeners) { try { fn(snap); } catch { /* ignore */ } }
  };

  function schedulePush(ms = debounceMs) {
    if (!st.user) return;
    if (timer) clearT(timer);
    timer = later(() => { timer = null; maybePush(); }, ms);
  }

  function maybePush() {
    if (!st.user) return Promise.resolve();
    const cur = store.get();
    if (!watchBroken && lastFp !== null && cur.meta.cloudUid === st.user.uid && fingerprint(cur) === lastFp) return Promise.resolve();
    return push();
  }

  // Merge this device into the cloud copy (and the cloud copy into this device).
  function push() {
    if (running) { again = true; return running; }
    const user = st.user;
    if (!user) return Promise.resolve();
    const gen = generation;
    running = (async () => {
      set({ status: 'syncing' });
      const snap = clone(store.get());
      const snapFp = fingerprint(snap);
      // Progress on this device that belongs to another account is never merged into this one.
      const adopt = !!snap.meta.cloudUid && snap.meta.cloudUid !== user.uid;
      try {
        const res = await adapter.transact(user.uid, async (doc) => {
          const remote = doc ? migrate(await decodeState(doc), now()) : null;
          let merged;
          if (adopt) merged = takeOver(snap, remote, now());
          else merged = remote ? syncMerge(snap, remote) : clone(snap);
          merged = canonical(merged);
          merged.meta.cloudUid = user.uid;
          const fp = fingerprint(merged);
          if (remote && fp === fingerprint(remote)) return { doc: null, merged, fp, rev: doc.rev || 0 };
          const enc = await encodeState(merged);
          const rev = ((doc && doc.rev) || 0) + 1;
          return { doc: { ...enc, rev, schema: SCHEMA_VERSION, app: APP_ID }, merged, fp, rev };
        });
        if (gen !== generation) return;
        lastRev = Math.max(lastRev, res.rev);
        lastFp = res.fp;
        apply(res.merged, snapFp, adopt);
        retryMs = 5000;
        set({ status: 'synced', lastSyncAt: now(), error: null });
        if (watchBroken && st.user && st.user.uid === user.uid) watch(user.uid);
      } catch (e) {
        if (gen !== generation) return;
        const offline = isOffline(e);
        set({ status: offline ? 'offline' : 'error', error: offline ? null : friendlyError(e) });
        if (retryTimer) clearT(retryTimer);
        retryTimer = later(() => { retryTimer = null; maybePush(); }, retryMs);
        retryMs = Math.min(retryMs * 2, 5 * 60 * 1000);
      }
    })().finally(() => {
      running = null;
      if (again) { again = false; schedulePush(300); }
    });
    return running;
  }

  // Bring merged progress onto this device, keeping anything that changed here meanwhile.
  function apply(merged, snapFp, replaceAll) {
    const cur = store.get();
    let next;
    if (replaceAll) next = clone(merged);
    else if (fingerprint(cur) === snapFp) next = keepDeviceBits(clone(merged), cur);
    else next = canonical(syncMerge(cur, merged));
    next.meta.cloudUid = st.user.uid;
    if (fingerprint(next) !== fingerprint(cur) || cur.meta.cloudUid !== st.user.uid) {
      applying = true;
      try { store.replace(next); } finally { applying = false; }
      if (onRemote) { try { onRemote(); } catch { /* ignore */ } }
    }
    // Something here isn't in the cloud yet: send it (never the same content twice in a row,
    // so a quirk in the data can't make devices sync back and forth forever).
    const fp = fingerprint(store.get());
    if (fp !== lastFp && fp !== lastResent) { lastResent = fp; schedulePush(500); }
  }
  // The same shape the store gives data when loading it, so fingerprints compare like for like.
  const canonical = (s) => migrate(clone(s), now());

  function watch(uid) {
    stopWatching();
    watchBroken = false;
    const gen = generation;
    unwatch = adapter.subscribe(uid, async (doc) => {
      if (gen !== generation || !st.user || !doc || (doc.rev || 0) <= lastRev) return;
      try {
        const remote = migrate(await decodeState(doc), now());
        if (gen !== generation || (doc.rev || 0) <= lastRev) return;
        lastRev = doc.rev;
        lastFp = fingerprint(remote);
        const cur = store.get();
        apply(syncMerge(cur, remote), fingerprint(cur), false);
        set({ status: 'synced', lastSyncAt: now(), error: null });
      } catch { /* a bad snapshot is ignored; the next push repairs it */ }
    }, (e) => {
      if (gen !== generation) return;
      watchBroken = true;
      set({ status: isOffline(e) ? 'offline' : 'error', error: isOffline(e) ? null : friendlyError(e) });
      // The next sync attempt retries, and restarts the listener once it works.
      if (!retryTimer) { retryTimer = later(() => { retryTimer = null; maybePush(); }, retryMs); retryMs = Math.min(retryMs * 2, 5 * 60 * 1000); }
    });
  }

  function stopWatching() {
    if (unwatch) { try { unwatch(); } catch { /* ignore */ } unwatch = null; }
  }

  async function onUser(user) {
    const first = !st.authReady;
    // Auth can report the same sign-in more than once; only real changes matter.
    if ((user && st.user && st.user.uid === user.uid) || (!user && !st.user && st.status === 'signed-out')) {
      if (first) set({ authReady: true });
      return;
    }
    if (first) st.authReady = true;
    generation++;
    stopWatching();
    if (timer) { clearT(timer); timer = null; }
    if (retryTimer) { clearT(retryTimer); retryTimer = null; }
    lastRev = 0;
    lastFp = null;
    watchBroken = false;
    if (!user) { set({ user: null, status: 'signed-out', error: null }); return; }
    set({ user, status: 'syncing', error: null });
    await push();
    if (st.user && st.user.uid === user.uid) watch(user.uid);
  }

  store.onSaved(() => { if (st.user && !applying) schedulePush(); });
  const unAuth = adapter.onAuth((user) => { onUser(user); });

  return {
    get state() { return { ...st }; },
    subscribe(fn) { listeners.add(fn); fn({ ...st }); return () => listeners.delete(fn); },
    async signIn() {
      set({ status: 'signing-in', error: null });
      try {
        await adapter.signIn();
      } catch (e) {
        set({ status: st.user ? st.status : 'signed-out', error: isUserCancel(e) ? null : friendlyError(e) });
      }
    },
    // keepOnDevice: leave a copy of the progress here (it stays tied to this account).
    async signOut({ keepOnDevice = true } = {}) {
      if (st.user) { try { await maybePush(); } catch { /* ignore */ } }
      await adapter.signOut();
      if (!keepOnDevice) store.reset();
    },
    syncNow: () => (st.user ? push() : Promise.resolve()),
    // Push now if anything changed (used when the app is closing or going to the background).
    flush: () => maybePush(),
    // Delete the cloud copy, then sign out. The copy on this device is kept as unsynced progress.
    async deleteCloudData() {
      if (!st.user) return;
      const uid = st.user.uid;
      // detach first, so nothing re-uploads the copy being deleted
      generation++;
      stopWatching();
      if (timer) { clearT(timer); timer = null; }
      if (retryTimer) { clearT(retryTimer); retryTimer = null; }
      set({ user: null, status: 'signed-out', error: null });
      await adapter.remove(uid);
      store.update((s) => { s.meta.cloudUid = null; });
      await adapter.signOut();
    },
    // Deliver a "This confused me" report. Resolves false when nobody is signed in (it's kept for later).
    async sendFeedback(report) {
      if (!st.user || !adapter.addFeedback) return false;
      const { id, ...fields } = report;
      void id;
      await adapter.addFeedback(st.user.uid, { ...fields, uid: st.user.uid });
      return true;
    },
    // Reset progress here and in the cloud, so every signed-in device starts fresh.
    async resetEverywhere() {
      store.reset({ everywhere: true });
      if (st.user) await push();
    },
    // Wait for any sync in progress (tests).
    async idle() { while (running) await running; },
    stop() { generation++; stopWatching(); if (unAuth) unAuth(); },
  };
}
