import { h, icon } from '../ui/dom.js';
import { pageHead } from '../ui/components.js';
import { openMistakes } from '../state/progress.js';

export default function more({ app, main }) {
  main.appendChild(pageHead({ title: 'More' }));
  const n = openMistakes(app.state).length;
  const item = (href, ic, title, sub, badge = 0) => h('a', { class: 'list-item', href },
    h('div', { class: 'li-icon' }, icon(ic)),
    h('div', { class: 'grow' }, h('div', { class: 'li-title' }, title), h('div', { class: 'li-sub' }, sub)),
    badge ? h('span', { class: 'badge' }, String(badge)) : null,
    h('span', { class: 'chev' }, icon('chevRight')));
  main.appendChild(h('div', { class: 'card list' },
    item('#/bootcamp', 'spark', 'Foundations Bootcamp', 'Rebuild Lectures 1–4'),
    item('#/games', 'wave', 'Games', 'Word Splash & Sea Lion Splash'),
    item('#/mistakes', 'redo', 'Mistake notebook', 'Questions you missed', n),
    item('#/reactions', 'map', 'Reaction map', 'Every reaction in one place'),
    item('#/lab', 'lab', 'Name Lab', 'Type a name, see the structure'),
    item('#/reference', 'list', 'Reference', 'Tables, rules & glossary'),
    item('#/reference/nursing', 'nurse', 'Nursing connections', 'Where this class shows up in nursing'),
    item('#/tools/ph', 'flask', 'pH calculator', 'With the sig-fig rule')));
  main.appendChild(h('div', { class: 'card list', style: { marginTop: '12px' } },
    item('#/progress', 'chart', 'Progress', 'Mastery, streaks & history'),
    item('#/exams', 'calendar', 'Exams', 'Dates, countdowns & practice exams'),
    item('#/settings', 'settings', 'Settings & backup', 'Theme, goals, backups'),
    item('#/about', 'sparkle', 'What\'s new', 'Latest updates')));
}
