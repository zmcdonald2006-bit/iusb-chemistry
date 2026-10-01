import { h, icon, mdi } from '../ui/dom.js';
import { pageHead, ring, bar, levelChip } from '../ui/components.js';
import { skillStats } from '../state/progress.js';
import { skillById } from '../../content/course.js';
import { BOOTCAMP } from '../../content/bootcamp.js';

export default function bootcamp({ app, main }) {
  const st = app.state;
  const steps = BOOTCAMP.map((b) => ({ ...b, sk: skillById(b.skill), stats: skillStats(st, b.skill) })).filter((s) => s.sk);
  const avg = steps.reduce((a, s) => a + s.stats.p, 0) / Math.max(1, steps.length);
  const mastered = steps.filter((s) => s.stats.p >= 0.8).length;
  const next = steps.find((s) => s.stats.p < 0.8);

  main.appendChild(pageHead({ eyebrow: 'Lectures 1–4', title: 'Foundations Bootcamp', sub: 'Those first tests are behind you — this path rebuilds the basics one skill at a time. Everything in Lectures 5–10 sits on top of these.' }));
  main.appendChild(h('div', { class: 'card row wrap', style: { gap: '16px' } },
    ring(avg, { size: 76, stroke: 8, cls: avg >= 0.8 ? 'ok' : '' }),
    h('div', { class: 'grow' },
      h('div', { class: 'li-title' }, `${mastered} of ${steps.length} skills at 80%+`),
      h('div', { class: 'muted small' }, next ? `Next up: ${next.sk.title}` : 'Every foundation skill is strong. Amazing work! 💪'),
      next ? h('div', { class: 'btn-row', style: { marginTop: '10px' } }, h('a', { class: 'btn', href: `#/practice/skill/${next.skill}?from=%23%2Fbootcamp` }, icon('play'), 'Continue the path')) : null)));

  const list = h('div', { class: 'stack', style: { marginTop: '16px' } });
  steps.forEach((s, i) => {
    const done = s.stats.p >= 0.8;
    const isNext = next && next.skill === s.skill;
    list.appendChild(h('div', { class: 'card', style: isNext ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' } : {} },
      h('div', { class: 'row', style: { alignItems: 'flex-start' } },
        h('div', { class: 'lec-num', style: done ? { background: 'var(--ok-soft)', color: 'var(--ok)' } : {} }, done ? icon('check') : String(i + 1)),
        h('div', { class: 'grow' },
          h('div', { class: 'row between wrap', style: { gap: '6px' } }, h('div', { class: 'li-title' }, s.sk.title), levelChip(s.stats)),
          h('div', { class: 'muted tiny' }, `Lecture ${s.sk.lecture.number}`),
          h('p', { class: 'small', style: { margin: '6px 0 8px' } }, mdi(s.recap)),
          bar(s.stats.p, done ? 'thin ok' : 'thin'),
          h('div', { class: 'btn-row', style: { marginTop: '10px' } },
            h('a', { class: `btn small ${isNext ? '' : 'secondary'}`, href: `#/practice/skill/${s.skill}?from=%23%2Fbootcamp` }, icon('target'), 'Drill'),
            h('a', { class: 'btn small ghost', href: `#/learn/${s.section}` }, icon('book'), 'Notes'))))));
  });
  main.appendChild(list);
}
