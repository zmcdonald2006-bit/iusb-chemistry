import { h, icon, md, clear } from '../ui/dom.js';
import { ring, bar, sectionTitle, emptyState } from '../ui/components.js';
import { questionView } from '../ui/question.js';
import { summarize } from '../quiz/session.js';
import { questionFromRef } from '../quiz/bank.js';
import { skillById } from '../../content/course.js';
import { plain } from '../lib/markup.js';

export default function results({ app, main }) {
  const s = app.state.lastResult;
  if (!s) {
    main.appendChild(emptyState('chart', 'No results yet', 'Finish a practice set to see your results here.', h('a', { class: 'btn', href: '#/practice' }, 'Practice')));
    return;
  }
  const sum = summarize(s);
  const good = sum.pct >= 0.7;
  if (sum.pct >= 0.9 && sum.total >= 5) setTimeout(() => app.confetti(), 250);
  main.appendChild(h('div', { class: 'card score-hero' },
    h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: '10px' } }, ring(sum.pct, { size: 110, stroke: 10, cls: good ? 'ok' : '', label: `${Math.round(sum.pct * 100)}%` })),
    h('h1', { style: { margin: '6px 0 2px' } }, `${sum.correct} of ${sum.total} correct`),
    h('div', { class: 'muted' }, `${s.title}${s.subtitle ? ` · ${s.subtitle}` : ''} · ${Math.max(1, Math.round(sum.secs / 60))} min`),
    h('p', { style: { marginTop: '12px', fontWeight: 600 } }, app.cheer(good))));

  const wrong = s.answers.filter((a) => !a.ok);
  main.appendChild(h('div', { class: 'btn-row', style: { marginTop: '14px' } },
    wrong.length ? h('button', { type: 'button', class: 'btn', onclick: () => retry(app, s, wrong) }, icon('redo'), `Retry the ${wrong.length} missed`) : null,
    h('a', { class: 'btn secondary', href: s.origin || '#/practice' }, 'Done'),
    h('a', { class: 'btn ghost', href: '#/' }, 'Home')));

  if (sum.bySkill.length) {
    main.appendChild(sectionTitle('By skill'));
    const card = h('div', { class: 'card' });
    for (const b of sum.bySkill) {
      const sk = skillById(b.skill);
      card.appendChild(h('div', { class: 'skill-row' },
        h('div', {}, h('div', { class: 'li-title' }, sk ? sk.title : b.skill), h('div', { class: 'muted small' }, sk ? `Lecture ${sk.lecture.number}` : '')),
        h('div', { class: 'row', style: { gap: '8px' } }, h('span', { class: `chip ${b.correct === b.total ? 'ok' : b.correct / b.total >= 0.5 ? 'warn' : 'bad'}` }, `${b.correct}/${b.total}`), h('a', { class: 'btn small secondary', href: `#/practice/skill/${b.skill}` }, 'Drill')),
        bar(b.correct / b.total, b.correct === b.total ? 'thin ok' : 'thin')));
    }
    main.appendChild(card);
  }

  main.appendChild(sectionTitle('Review your answers'));
  const list = h('div', { class: 'card list' });
  s.answers.forEach((a, i) => {
    const q = questionFromRef(a.ref);
    if (!q) return;
    const row = h('div', {});
    const head = h('button', { type: 'button', class: 'review-item', style: { width: '100%', background: 'none', border: 0, textAlign: 'left', padding: '10px 0' }, 'aria-expanded': 'false' },
      h('span', { class: `ri-icon ${a.ok ? 'ok' : 'bad'}` }, icon(a.ok ? 'check' : 'x')),
      h('div', { class: 'grow' }, h('div', { class: 'small', style: { fontWeight: 600 } }, `${i + 1}. ${truncate(plain(q.prompt), 110)}`)),
      h('span', { class: 'chev' }, icon('chevRight')));
    const detail = h('div', { class: 'hidden', style: { padding: '0 0 12px' } });
    let view = null;
    head.addEventListener('click', () => {
      const open = detail.classList.toggle('hidden') === false;
      head.setAttribute('aria-expanded', String(open));
      if (open && !view) {
        view = questionView(q, { mode: 'review', review: { response: a.response, result: { correct: a.ok, status: a.status || (a.ok ? 'correct' : 'wrong'), message: a.ok ? 'Correct!' : 'Not quite.' } } });
        view.el.classList.add('flat');
        detail.appendChild(view.el);
      }
    });
    row.append(head, detail);
    list.appendChild(row);
  });
  main.appendChild(list);
  if (!s.answers.length) clear(list).appendChild(md('No questions were answered.'));
}

function truncate(s, n) { return s.length > n ? `${s.slice(0, n - 1)}…` : s; }

function retry(app, s, wrong) {
  const session = {
    id: `s${Date.now().toString(36)}r`, mode: 'practice', title: 'Retry missed questions', subtitle: s.title, skills: [...new Set(wrong.map((w) => w.skill))], lectures: s.lectures || [],
    items: wrong.map((w) => ({ ref: w.ref, skill: w.skill })), index: 0, answers: [], startedAt: Date.now(), endedAt: null, timeLimit: null, target: wrong.length, origin: s.origin || '#/practice',
  };
  app.store.update((st) => { st.active = session; });
  app.navigate('#/quiz');
}
