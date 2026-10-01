// First-run welcome flow.
import { h, icon, md, clear } from '../ui/dom.js';
import { modal } from '../ui/components.js';
import { editExam } from './exams.js';
import { googleButton } from '../ui/account.js';

export function runOnboarding(app) {
  let step = 0;
  const body = h('div', { class: 'onboard' });
  const nameIn = h('input', { class: 'input', placeholder: 'Your first name', autocomplete: 'given-name', 'aria-label': 'Your first name', value: app.state.profile.name || '' });
  const next = h('button', { type: 'button', class: 'btn block' });
  const back = h('button', { type: 'button', class: 'btn ghost block', style: { marginTop: '6px' } }, 'Back');
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const cloud = app.cloud.enabled;
  const signedIn = () => (app.cloud.state.status === 'synced' ? app.cloud.state.user : null);
  const signedInNote = () => h('div', { class: 'acct-status ok', style: { justifyContent: 'center' } }, icon('check'), `Signed in as ${signedIn().email}`);

  const steps = [
    () => [
      h('div', { class: 'big-icon', html: brand() }),
      h('h2', {}, 'Welcome to Chem Companion'),
      md('Your study guide for **C102: Elementary Chemistry II** — notes for every lecture, unlimited practice, flashcards and progress tracking.'),
      h('div', { class: 'field', style: { marginTop: '14px' } }, h('label', {}, 'What should I call you?'), nameIn),
      cloud ? h('div', { class: 'onboard-signin' },
        h('div', { class: 'muted small' }, 'Used Chem Companion before?'),
        signedIn() ? signedInNote() : googleButton(app, { label: 'Sign in to get your progress back' })) : null,
    ],
    () => [
      h('div', { class: 'big-icon', html: svg('spark') }),
      h('h2', {}, 'Let\'s rebuild the foundations'),
      md('Lectures 1–4 already had their test. That\'s okay — those ideas (bonding, functional groups, naming, reactions) come back **all semester and on the final**.\n\nThe **Foundations Bootcamp** walks through them one skill at a time, and the app keeps nudging you toward whatever needs work.'),
    ],
    () => [
      h('div', { class: 'big-icon', html: svg('target') }),
      h('h2', {}, 'How it works'),
      h('ul', { style: { textAlign: 'left' } },
        h('li', {}, md('**Learn**: short notes with worked examples and quick checks.', 'span')),
        h('li', {}, md('**Practice**: every answer is explained. Many questions are generated fresh, so you can\'t run out.', 'span')),
        h('li', {}, md('**Cards**: a few minutes a day of spaced repetition.', 'span')),
        h('li', {}, md('**Name Lab**: type any name and see the structure it describes.', 'span'))),
    ],
    () => (cloud ? [
      h('div', { class: 'big-icon', html: svg('heart') }),
      h('h2', {}, 'Keep your progress safe'),
      signedIn()
        ? h('div', {}, signedInNote(), md('Your progress is saved to your Google account, so it\'s on any phone or computer you sign in on.'))
        : h('div', {},
          md('Sign in with Google and your progress is saved to your account: it\'s on any phone or computer you sign in on, and safe if you lose your phone.'),
          h('div', { style: { margin: '12px 0 6px' } }, googleButton(app, { block: true })),
          h('div', { class: 'hint' }, 'Or skip this: progress is saved on this device, and you can sign in later in Settings.')),
    ] : [
      h('div', { class: 'big-icon', html: svg('heart') }),
      h('h2', {}, 'Keep your progress safe'),
      md(ios
        ? 'Your progress is saved on this device. For the best experience, tap **Share → Add to Home Screen** in Safari — it works offline and keeps your data safer.\n\nYou can download a backup anytime in **Settings**.'
        : 'Your progress is saved on this device. Install the app (browser menu → **Install** / **Add to Home Screen**) so it works offline and keeps your data safer.\n\nYou can download a backup anytime in **Settings**.'),
    ]),
  ];

  function draw() {
    clear(body);
    for (const el of steps[step]()) body.appendChild(el);
    body.appendChild(h('div', { class: 'dots', 'aria-hidden': 'true' }, steps.map((_, i) => h('span', { class: i === step ? 'on' : '' }))));
    const foot = h('div', { style: { marginTop: '16px' } }, next, step > 0 ? back : null);
    next.textContent = step === steps.length - 1 ? 'Let\'s go!' : 'Next';
    body.appendChild(foot);
    if (step === 0) setTimeout(() => nameIn.focus(), 50);
  }

  const dlg = modal({ body, dismissible: false, label: 'Welcome' });
  // Signing in to an account that already has progress skips the rest of the welcome.
  let offCloud = () => {};
  if (cloud) {
    let wasIn = !!signedIn();
    offCloud = app.cloud.subscribe((s) => {
      const nowIn = s.status === 'synced' && !!s.user;
      if (nowIn === wasIn) return;
      wasIn = nowIn;
      if (nowIn && app.state.profile.onboarded) {
        offCloud();
        dlg.close();
        app.navigate('#/', { replace: true }); // (the "signed in" message says the rest)
        return;
      }
      if (nowIn && !nameIn.value.trim() && app.state.profile.name) nameIn.value = app.state.profile.name;
      draw();
    });
  }
  next.addEventListener('click', () => {
    if (step === 0) app.store.update((s) => { s.profile.name = nameIn.value.trim().slice(0, 40); }, { silent: true });
    if (step < steps.length - 1) { step++; draw(); return; }
    app.store.update((s) => { s.profile.onboarded = true; s.meta.lastSeenVersion = app.course.contentVersion; });
    offCloud();
    dlg.close();
    app.navigate('#/', { replace: true });
    setTimeout(() => {
      app.toast('Got an exam coming up? Add it for a countdown.', { action: 'Add exam', onAction: () => editExam(app, null), timeout: 9000 });
    }, 700);
  });
  back.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') next.click(); });
  draw();
}

function svg(name) {
  const icons = {
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function brand() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z"/><path d="M12 7.2v4.8M12 12l4.2 2.4M12 12l-4.2 2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>';
}

export { icon };
