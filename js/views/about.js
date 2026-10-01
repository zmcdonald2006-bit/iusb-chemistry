import { h, md } from '../ui/dom.js';
import { pageHead } from '../ui/components.js';
import { CHANGELOG } from '../../content/course.js';
import { APP_VERSION } from '../version.js';

export default function about({ app, main }) {
  main.appendChild(pageHead({ back: { href: '#/settings', label: 'Settings' }, title: 'What\'s new', sub: `App v${APP_VERSION} · content ${app.course.contentVersion}` }));
  for (const c of CHANGELOG) {
    main.appendChild(h('div', { class: 'card', style: { marginBottom: '12px' } },
      h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, c.title), h('span', { class: 'chip' }, c.version)),
      h('ul', {}, c.items.map((i) => h('li', {}, i)))));
  }
  main.appendChild(h('div', { class: 'card' }, md(`Made with ❤️ for ${app.state.profile.name || 'you'} — ${app.course.code} ${app.course.title}, ${app.course.school}.\n\nThe notes follow the lecture slides and *${app.course.textbook}*. Structures are drawn by the app itself, and generated questions are checked by a built-in naming and reaction engine.`)));
}
