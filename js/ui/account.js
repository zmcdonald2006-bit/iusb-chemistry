// "Sign in with Google" button and the account card (Settings, onboarding, home).
import { h, icon, clear } from './dom.js';
import { modal } from './components.js';

const G_LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

export function googleButton(app, { label = 'Sign in with Google', block = false } = {}) {
  const btn = h('button', { type: 'button', class: `btn-google ${block ? 'block' : ''}` }, h('span', { class: 'g-logo', html: G_LOGO }), h('span', {}, label));
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try { await app.cloud.signIn(); } finally { btn.disabled = false; }
  });
  return btn;
}

export function ago(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function avatar(user) {
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  const el = h('div', { class: 'acct-avatar', 'aria-hidden': 'true' }, initial);
  if (user.photo && /^https:\/\//.test(user.photo)) {
    const img = h('img', { src: user.photo, alt: '', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => img.remove());
    el.appendChild(img);
  }
  return el;
}

const STATUS = {
  loading: ['', 'Loading…'],
  syncing: ['', 'Syncing…'],
  synced: ['ok', null],
  offline: ['warn', 'Offline. Changes are saved here and will sync when you\'re back online.'],
  error: ['bad', null],
  'signing-in': ['', 'Waiting for Google…'],
};

// A live card: sign-in when signed out, account + sync status when signed in.
export function accountCard(app) {
  const el = h('div', { class: 'card acct' });
  const render = (s) => {
    clear(el);
    if (s.user) {
      const [cls, text] = STATUS[s.status] || ['', ''];
      const line = s.status === 'synced' ? `Saved to your account · ${ago(s.lastSyncAt)}` : s.status === 'error' ? (s.error || 'Couldn\'t sync. Your progress is safe on this device.') : text;
      el.append(
        h('div', { class: 'row' }, avatar(s.user),
          h('div', { class: 'grow', style: { minWidth: 0 } },
            h('div', { class: 'li-title acct-name' }, s.user.name || 'Signed in'),
            h('div', { class: 'muted small acct-email' }, s.user.email))),
        h('div', { class: `acct-status ${cls}` }, s.status === 'synced' ? icon('check') : s.status === 'syncing' ? h('span', { class: 'spin', 'aria-hidden': 'true' }) : null, h('span', {}, line)),
        h('div', { class: 'btn-row', style: { marginTop: '12px' } },
          h('button', { type: 'button', class: 'btn small secondary', disabled: s.status === 'syncing', onclick: () => app.cloud.syncNow() }, icon('redo'), 'Sync now'),
          h('button', { type: 'button', class: 'btn small secondary', onclick: () => signOutFlow(app) }, 'Sign out'),
          h('button', { type: 'button', class: 'btn small ghost', onclick: () => deleteFlow(app) }, 'Delete cloud copy')));
    } else {
      el.append(
        h('div', { class: 'li-title' }, 'Save your progress to your Google account'),
        h('p', { class: 'muted small', style: { margin: '4px 0 12px' } }, 'Sign in and your progress is saved to your account: it follows you to any phone or computer, and it\'s safe even if you lose your phone or clear your browser.'),
        s.status === 'loading' ? h('div', { class: 'muted small' }, 'Loading…') : googleButton(app),
        s.error ? h('p', { class: 'acct-error small' }, s.error) : null,
        h('p', { class: 'hint', style: { marginTop: '10px' } }, 'Only your study progress is saved, nothing else from your Google account. Not signed in? Progress is still saved on this device.'));
    }
  };
  const off = app.cloud.subscribe(render);
  // keep "· 2 min ago" fresh
  const timer = setInterval(() => render(app.cloud.state), 30000);
  return { el, destroy: () => { off(); clearInterval(timer); } };
}

export function signOutFlow(app) {
  modal({
    title: 'Sign out?',
    body: h('div', {},
      h('p', {}, 'Your progress stays saved in your Google account.'),
      h('p', { class: 'muted small' }, 'On a shared or school computer, also remove it from this device.')),
    actions: [
      { label: 'Cancel', kind: 'secondary', value: null },
      { label: 'Sign out & remove from this device', kind: 'secondary', value: 'wipe' },
      { label: 'Sign out', value: 'keep' },
    ],
    onClose: async (r) => {
      if (!r) return;
      await app.cloud.signOut({ keepOnDevice: r === 'keep' });
      app.toast(r === 'wipe' ? 'Signed out and removed from this device.' : 'Signed out.');
      if (r === 'wipe') { app.applyTheme(); app.navigate('#/', { replace: true }); location.reload(); }
    },
  });
}

function deleteFlow(app) {
  modal({
    title: 'Delete your cloud copy?',
    body: h('p', {}, 'This permanently deletes the progress saved in your Google account and signs you out. The copy on this device stays, and you can sign in again later to save it again.'),
    actions: [
      { label: 'Cancel', kind: 'secondary', value: false },
      { label: 'Delete cloud copy', kind: 'danger', value: true },
    ],
    onClose: async (ok) => {
      if (!ok) return;
      try {
        await app.cloud.deleteCloudData();
        app.toast('Cloud copy deleted. You\'re signed out.');
      } catch {
        app.toast('Couldn\'t delete it right now. Check your connection and try again.');
      }
    },
  });
}
