import { h, md } from '../ui/dom.js';
import { pageHead, modal } from '../ui/components.js';
import { CHANGELOG, changeDate } from '../../content/course.js';
import { APP_VERSION } from '../version.js';

export default function about({ app, main }) {
  main.appendChild(pageHead({ back: { href: '#/settings', label: 'Settings' }, title: 'What\'s new', sub: `App v${APP_VERSION} · content ${app.course.contentVersion}` }));
  for (const c of CHANGELOG) {
    main.appendChild(h('div', { class: 'card', style: { marginBottom: '12px' } }, changeBody(c)));
  }
  main.appendChild(h('div', { class: 'card' }, md(`Made with ❤️ for ${app.state.profile.name || 'you'} — ${app.course.code} ${app.course.title}, ${app.course.school}.\n\nThe notes follow the lecture slides and *${app.course.textbook}*. Structures are drawn by the app itself, and generated questions are checked by a built-in naming and reaction engine.`)));
}

function changeBody(c) {
  return [
    h('div', { class: 'row between wrap', style: { gap: '6px' } }, h('h3', { style: { margin: 0 } }, c.title), h('span', { class: 'chip' }, changeDate(c.version))),
    h('ul', {}, c.items.map((i) => h('li', {}, i))),
  ];
}

// Shown once after the app updates: what changed since this device last opened it. The newest
// update in full; any older ones she missed by title (all of them are on the What's new page).
// The list scrolls and the buttons stay in view.
export function whatsNewPopup(app, entries) {
  const [latest, ...older] = entries;
  let m = null;
  const body = h('div', {},
    h('div', { class: 'whats-new' },
      h('div', { class: 'whats-new-entry' }, changeBody(latest)),
      older.length ? h('div', { class: 'whats-new-entry' },
        h('div', { class: 'muted small' }, 'Also new since you last opened the app:'),
        h('ul', {}, older.map((c) => h('li', {}, `${c.title} (${changeDate(c.version)})`)))) : null),
    h('div', { class: 'btn-row end' },
      h('button', { type: 'button', class: 'btn secondary', onclick: () => m.close('all') }, 'All updates'),
      h('button', { type: 'button', class: 'btn', onclick: () => m.close('ok') }, 'Got it')));
  m = modal({
    title: '✨ The app just updated',
    label: 'What\'s new',
    body,
    onClose: (r) => { if (r === 'all') app.navigate('#/about'); },
  });
  return m;
}
