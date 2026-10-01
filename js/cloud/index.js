// Starts "Sign in with Google" + cloud sync when it's configured (js/cloud/config.js), and gives the
// screens one small API: app.cloud. When it isn't configured, app.cloud.enabled is false and the
// app saves progress on each device only, exactly as before.
import { FIREBASE_CONFIG } from './config.js';
import { createSync } from './sync.js';

const FAKE_FLAG = 'cc-fake-cloud';
// On localhost, `localStorage.setItem('cc-fake-cloud', '1')` tries the screens with a pretend account.
export function fakeMode() {
  try { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && localStorage.getItem(FAKE_FLAG) === '1'; } catch { return false; }
}

export function initCloud({ store, toast, onRemote }) {
  const enabled = !!FIREBASE_CONFIG || fakeMode();
  let view = { enabled, status: enabled ? 'loading' : 'off', user: null, lastSyncAt: 0, error: null };
  const listeners = new Set();
  const emit = () => { for (const fn of listeners) { try { fn(view); } catch { /* ignore */ } } };
  let sync = null;
  let ready = Promise.resolve();

  const api = {
    enabled,
    get state() { return view; },
    subscribe(fn) { listeners.add(fn); fn(view); return () => listeners.delete(fn); },
    async signIn() { await ready; if (sync) { welcome = true; await sync.signIn(); } },
    async signOut(opts) { await ready; if (sync) await sync.signOut(opts); },
    async syncNow() { await ready; if (sync) await sync.syncNow(); },
    async deleteCloudData() { await ready; if (sync) await sync.deleteCloudData(); },
    // Deliver a "This confused me" report; false when not signed in (the caller keeps it for later).
    async sendFeedback(report) {
      await ready;
      if (!sync) return false;
      return sync.sendFeedback({ ...report, who: String(store.get().profile.name || '').slice(0, 60) });
    },
    // Reset here, and in the cloud when signed in.
    async resetEverywhere() { await ready; if (sync && view.user) await sync.resetEverywhere(); else store.reset(); },
  };
  if (!enabled) return api;

  let welcome = false; // show "signed in" once, right after she taps Sign in
  const load = async () => {
    try {
      const adapter = fakeMode() ? await fakeAdapter() : await (await import('./firebase.js')).createFirebaseAdapter(FIREBASE_CONFIG);
      sync = createSync({ store, adapter, onRemote });
      sync.subscribe((s) => {
        view = { ...view, ...s };
        if (s.user && s.status === 'synced') {
          const first = (s.user.name || '').split(' ')[0];
          if (!store.get().profile.name && first) store.update((st) => { st.profile.name = first.slice(0, 40); });
          if (welcome) { welcome = false; toast(`Signed in as ${s.user.email || s.user.name}. Your progress is saved to your Google account.`); }
        }
        if (s.status === 'signed-out' && s.error) welcome = false;
        emit();
      });
      if (adapter.redirectError) adapter.redirectError().then((e) => { if (e && e.code !== 'auth/popup-closed-by-user') { view = { ...view, error: 'Google sign-in didn\'t finish. Please try again.' }; emit(); } });
    } catch {
      // Couldn't load Google sign-in (usually offline). Progress is still saved here; try again later.
      view = { ...view, status: navigator.onLine === false ? 'offline' : 'error', error: navigator.onLine === false ? null : 'Couldn\'t load Google sign-in. Check your connection and reload.' };
      emit();
      window.addEventListener('online', () => { ready = load(); }, { once: true });
    }
  };
  ready = load();
  document.addEventListener('visibilitychange', () => { if (document.hidden && sync) sync.flush(); });
  window.addEventListener('online', () => { if (sync && view.user) sync.syncNow(); });
  return api;
}

async function fakeAdapter() {
  const { createFakeCloud } = await import('./fake.js');
  const cloud = createFakeCloud({ persistKey: 'cc-fake-cloud-db' });
  const user = { uid: 'fake-student', name: 'Test Student', email: 'test.student@example.com', photo: '' };
  const key = 'cc-fake-cloud-signed-in';
  let signedIn = false;
  try { signedIn = localStorage.getItem(key) === '1'; } catch { /* ignore */ }
  return cloud.adapter(user, { signedIn, onSignedIn: (on) => { try { localStorage.setItem(key, on ? '1' : '0'); } catch { /* ignore */ } } });
}
