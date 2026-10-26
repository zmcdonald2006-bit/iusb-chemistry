// Review sheets: a lecture (or all the lectures on an exam) boiled down to the rules, memory tricks,
// traps and key terms from its notes. For the night before or right before walking in; prints cleanly.
import { h, icon, md, mdi } from '../ui/dom.js';
import { pageHead, sectionTitle, emptyState } from '../ui/components.js';
import { renderBlock } from './learn.js';
import { sheetParts } from '../lib/review.js';
import { lectureById } from '../../content/course.js';
import { upcomingExams } from '../state/progress.js';
import { dayKey } from '../state/store.js';

export default function review({ app, main, params }) {
  if (!params.lids) return picker(app, main);
  const lecs = params.lids.split(',').map(lectureById).filter(Boolean);
  if (!lecs.length) { main.appendChild(emptyState('sheet', 'Review sheet not found', '', h('a', { class: 'btn', href: '#/review' }, 'All review sheets'))); return null; }
  const one = lecs.length === 1 ? lecs[0] : null;
  const ids = lecs.map((l) => l.id).join(',');
  app.setTitle(one ? `L${one.number} review sheet` : 'Review sheet');
  main.appendChild(pageHead({
    back: one ? { href: `#/learn/${one.id}`, label: `Lecture ${one.number}` } : { href: '#/review', label: 'Review sheets' },
    eyebrow: one ? `Review sheet · Lecture ${one.number}` : 'Review sheet',
    title: one ? one.title : `Lectures ${lecs.map((l) => l.number).join(', ')}`,
    sub: 'The rules, memory tricks, traps and key terms from the notes. Each box links back to its part of the notes.',
  }));
  main.appendChild(h('div', { class: 'btn-row sheet-actions' },
    h('button', { type: 'button', class: 'btn secondary small', onclick: () => window.print() }, icon('printer'), 'Print'),
    h('a', { class: 'btn secondary small', href: one ? `#/practice/lecture/${one.id}` : `#/practice/exam?lectures=${ids}` }, icon('target'), one ? 'Practice' : 'Practice exam'),
    h('a', { class: 'btn secondary small', href: `#/cards/review?deck=${ids}&cram=1` }, icon('cards'), 'Cram cards')));
  for (const l of lecs) main.appendChild(sheet(l, !one));

  // Printing opens the collapsed "methods and tables" parts, then puts them back.
  const opened = [];
  const before = () => main.querySelectorAll('details.sheet-more:not([open])').forEach((d) => { d.open = true; opened.push(d); });
  const after = () => { opened.forEach((d) => { d.open = false; }); opened.length = 0; };
  window.addEventListener('beforeprint', before);
  window.addEventListener('afterprint', after);
  return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
}

function sheet(l, multi) {
  const { groups, extras, terms } = sheetParts(l);
  const wrap = h('section', { class: 'sheet' });
  if (multi) wrap.appendChild(h('h2', { class: 'sheet-lec' }, `Lecture ${l.number} · ${l.title}`));
  for (const g of groups) {
    wrap.appendChild(h('h3', { class: `sheet-h ${g.id}` }, icon(g.icon), g.title));
    wrap.appendChild(h('div', { class: 'sheet-grid' }, g.items.map(({ block, section }) => h('div', { class: `callout ${block.kind} sheet-item` },
      block.title ? h('div', { class: 'co-title' }, mdi(block.title)) : null,
      md(block.text),
      h('a', { class: 'sheet-src', href: `#/learn/${l.id}/${section.id}` }, section.title, icon('chevRight'))))));
  }
  if (terms.length) {
    wrap.appendChild(h('h3', { class: 'sheet-h terms' }, icon('book'), 'Key terms'));
    wrap.appendChild(h('dl', { class: 'sheet-terms' }, terms.map((k) => h('div', { class: 'sheet-term' }, h('dt', {}, k.term), h('dd', {}, mdi(k.def))))));
  }
  if (extras.length) {
    const more = h('details', { class: 'sheet-more' }, h('summary', {}, `Methods, tables and comparisons (${extras.length})`));
    for (const { block, section } of extras) {
      const el = renderBlock(block, {});
      if (el) more.appendChild(h('div', { class: 'sheet-extra' }, h('a', { class: 'sheet-src', href: `#/learn/${l.id}/${section.id}` }, section.title, icon('chevRight')), el));
    }
    wrap.appendChild(more);
  }
  return wrap;
}

function picker(app, main) {
  main.appendChild(pageHead({ title: 'Review sheets', sub: 'Each lecture on one page: the rules, memory tricks, traps and key terms from the notes. For the night before, or right before you walk in.' }));
  const exams = upcomingExams(app.state, dayKey()).filter((e) => (e.lectures || []).length);
  if (exams.length) {
    main.appendChild(sectionTitle('For your exams'));
    main.appendChild(h('div', { class: 'card list' }, exams.map((e) => h('a', { class: 'list-item', href: `#/review/${e.lectures.join(',')}` },
      h('div', { class: 'li-icon' }, icon('calendar')),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, e.title), h('div', { class: 'li-sub' }, `Lectures ${e.lectures.map((id) => (lectureById(id) || {}).number).filter(Boolean).join(', ')}`)),
      h('span', { class: 'chev' }, icon('chevRight'))))));
  }
  main.appendChild(sectionTitle('By lecture'));
  main.appendChild(h('div', { class: 'card list' }, app.course.lectures.map((l) => h('a', { class: 'list-item', href: `#/review/${l.id}` },
    h('div', { class: 'li-icon' }, h('b', {}, String(l.number))),
    h('div', { class: 'grow' }, h('div', { class: 'li-title' }, l.title), h('div', { class: 'li-sub' }, l.subtitle)),
    h('span', { class: 'chev' }, icon('chevRight'))))));
  return null;
}
