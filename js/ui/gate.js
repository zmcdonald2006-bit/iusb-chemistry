// The sign-in screen: shown whenever the app is open and nobody is signed in (when sign-in is set up),
// so progress is always saved to a Google account. Once signed in, she stays signed in on that device;
// it only comes back after signing out. See js/cloud/gate.js for exactly when it appears.
import { h, md, clear } from './dom.js';
import { modal } from './components.js';
import { googleButton } from './account.js';
import { gateMode, gateSettled } from '../cloud/gate.js';
import { FIREBASE_CONFIG } from '../cloud/config.js';

const BRAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z"/><path d="M12 7.2v4.8M12 12l4.2 2.4M12 12l-4.2 2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>';

let skipped = false; // "Not now" lasts until the app is closed; it asks again next time

// Starts watching (for the whole session). Resolves once sign-in is settled, so first-run screens can follow.
export function signInGate(app) {
  if (!app.cloud.enabled) return Promise.resolve();
  return new Promise((resolve) => {
    let dlg = null;
    let body = null;
    let tried = false; // a sign-in attempt didn't work (cancelled or failed): offer "Not now"
    let prevStatus = null;
    let resolved = false;
    const online = () => navigator.onLine !== false;

    const draw = (v, mode) => {
      clear(body);
      body.append(
        h('div', { class: 'big-icon', html: BRAND }),
        h('h2', {}, 'Sign in to Chem Companion'),
        md('Your progress saves **automatically** to your Google account, so it\'s on every phone and computer you use, and it\'s never lost.'));
      if (mode === 'offline') {
        body.append(
          h('div', { class: 'acct-status warn', style: { justifyContent: 'center' } }, 'You\'re offline right now.'),
          md('You can study now. Progress is saved on this device and goes to your account once you\'re online and signed in.', 'div', 'small muted'),
          h('button', { type: 'button', class: 'btn block', style: { marginTop: '12px' }, onclick: skip }, 'Continue offline'));
      } else {
        const btn = googleButton(app, { block: true });
        btn.disabled = v.status === 'signing-in';
        body.append(h('div', { style: { margin: '16px 0 8px' } }, btn));
        if (v.status === 'signing-in') body.append(h('div', { class: 'muted small' }, 'Finish signing in with Google in the window that opened.'));
        if (v.error) body.append(h('p', { class: 'acct-error small' }, v.error));
        if (tried || v.error) body.append(h('button', { type: 'button', class: 'btn ghost block', style: { marginTop: '4px' }, onclick: skip }, 'Not now: study without saving to my account'));
      }
      if (betterSite) body.append(h('div', { class: 'callout tip', style: { marginTop: '12px', textAlign: 'left' } },
        md(`**On a phone?** Google sign-in works best at **${betterSite.host}** (the same app, on Firebase's own address). Open it in Safari or Chrome, and add that one to your Home Screen.`),
        h('a', { class: 'btn small', href: betterSite.href, style: { marginTop: '8px' } }, 'Open the app there')));
      body.append(h('p', { class: 'hint', style: { marginTop: '12px' } }, 'You\'ll stay signed in on this device. Only your study progress is saved, nothing else from your Google account.'));
    };

    // On phones, sign-in can't finish from a site other than Firebase's own address (iPhones keep the
    // two sites' storage apart). If the app is also published there, point to it.
    let betterSite = null;
    const authHost = FIREBASE_CONFIG && FIREBASE_CONFIG.authDomain;
    const phone = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (authHost && location.hostname !== authHost && phone) {
      const href = `https://${authHost}/`;
      fetch(`${href}manifest.webmanifest`, { cache: 'no-store' })
        .then((r) => { if (r.ok) { betterSite = { host: authHost, href }; if (dlg) update(app.cloud.state); } })
        .catch(() => {}); // not published there (yet)
    }

    function skip() {
      skipped = true;
      update(app.cloud.state);
    }

    function update(v) {
      if (prevStatus === 'signing-in' && v.status === 'signed-out' && !v.user) tried = true;
      prevStatus = v.status;
      const mode = gateMode(v, { online: online(), skipped });
      if (mode === 'none') {
        if (dlg) { dlg.close(); dlg = null; }
      } else {
        if (!dlg) {
          body = h('div', { class: 'onboard gate' });
          dlg = modal({ body, dismissible: false, label: 'Sign in' });
          dlg.dialog.closest('.modal-backdrop').classList.add('gate-backdrop');
        }
        draw(v, mode);
      }
      if (!resolved && gateSettled(v, { skipped })) { resolved = true; resolve(); }
    }

    app.cloud.subscribe(update);
    window.addEventListener('online', () => update(app.cloud.state));
    window.addEventListener('offline', () => update(app.cloud.state));
  });
}
