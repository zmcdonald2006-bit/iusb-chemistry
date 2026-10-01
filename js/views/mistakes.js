import { h, icon } from '../ui/dom.js';
import { pageHead, emptyState } from '../ui/components.js';
import { openMistakes } from '../state/progress.js';
import { questionFromRef } from '../quiz/bank.js';
import { skillById } from '../../content/course.js';
import { plain } from '../lib/markup.js';

export default function mistakes({ app, main }) {
  const st = app.state;
  const open = openMistakes(st).sort((a, b) => b.lastWrong - a.lastWrong);
  const cleared = Object.values(st.mistakes).filter((m) => m.cleared).length;
  main.appendChild(pageHead({ title: 'Mistake notebook', sub: 'Every question you miss is saved here. Get it right twice in a row and it clears itself.' }));
  if (!open.length) {
    main.appendChild(emptyState('check', 'Nothing to fix right now', cleared ? `You've already cleared ${cleared} mistake${cleared === 1 ? '' : 's'}. 🎉` : 'Missed questions will show up here.', h('a', { class: 'btn', href: '#/practice' }, 'Practice')));
    return;
  }
  main.appendChild(h('div', { class: 'card row wrap', style: { gap: '12px' } },
    h('div', { class: 'grow' }, h('div', { class: 'li-title' }, `${open.length} open mistake${open.length === 1 ? '' : 's'}`), h('div', { class: 'muted small' }, `${cleared} cleared so far`)),
    h('a', { class: 'btn', href: '#/practice/mistakes' }, icon('redo'), 'Review them')));

  const groups = new Map();
  for (const m of open) {
    const sk = skillById(m.skill);
    const key = sk ? sk.lecture.id : 'other';
    if (!groups.has(key)) groups.set(key, { lecture: sk && sk.lecture, items: [] });
    groups.get(key).items.push({ ...m, sk });
  }
  for (const g of [...groups.values()].sort((a, b) => (a.lecture ? a.lecture.number : 99) - (b.lecture ? b.lecture.number : 99))) {
    main.appendChild(h('div', { class: 'section-title' }, h('h3', {}, g.lecture ? `Lecture ${g.lecture.number}: ${g.lecture.title}` : 'Other')));
    const list = h('div', { class: 'card list' });
    for (const m of g.items) {
      const q = questionFromRef(m.ref);
      list.appendChild(h('div', { class: 'list-item' },
        h('div', { class: 'li-icon', style: { background: 'var(--bad-soft)', color: 'var(--bad)' } }, icon('x')),
        h('div', { class: 'grow' },
          h('div', { class: 'small', style: { fontWeight: 600 } }, q ? truncate(plain(q.prompt), 100) : 'Question no longer available'),
          h('div', { class: 'li-sub' }, `${m.sk ? m.sk.title : m.skill} · missed ${m.count}×${m.streak ? ` · ${m.streak}/2 right since` : ''}`)),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Remove from notebook', title: 'Remove', onclick: () => { app.store.update((s) => { if (s.mistakes[m.key]) s.mistakes[m.key].cleared = true; }); app.navigate('#/mistakes', { replace: true }); } }, icon('trash'))));
    }
    main.appendChild(list);
  }
}

function truncate(s, n) { return s.length > n ? `${s.slice(0, n - 1)}…` : s; }
