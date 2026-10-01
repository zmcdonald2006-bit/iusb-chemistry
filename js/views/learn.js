import { h, icon, md, mdi } from '../ui/dom.js';
import { ring, bar, levelChip, molView, molsView, rxnView, tetraView, pageHead, sectionTitle, emptyState, autoNumbers, nursingNote } from '../ui/components.js';
import { questionView } from '../ui/question.js';
import { lectureProgress } from '../state/progress.js';
import { markSectionRead, recordAttempt, overrideAttempt } from '../state/store.js';
import { lectureById } from '../../content/course.js';
import { nursingFor } from '../../content/nursing.js';
import { confusedButton } from '../ui/confused.js';
import { normalizeQuestion } from '../quiz/bank.js';

// ---- Lecture list ---------------------------------------------------------------------------------
export function learnList({ app, main }) {
  const st = app.state;
  main.appendChild(pageHead({ eyebrow: `${app.course.code} · ${app.course.school}`, title: 'Lectures', sub: `${app.course.title}. Tap a lecture for notes, worked examples and practice.` }));
  const tested = app.course.lectures.filter((l) => l.tested);
  if (tested.length) {
    main.appendChild(h('a', { class: 'card card-link plan-item bootcamp', href: '#/bootcamp', style: { marginBottom: '14px' } },
      h('div', { class: 'pi-icon' }, icon('spark')),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, 'Foundations Bootcamp'), h('div', { class: 'muted small' }, `Rebuild Lectures 1–${tested[tested.length - 1].number} step by step — everything later builds on them.`)),
      h('span', { class: 'chev' }, icon('chevRight'))));
  }
  const list = h('div', { class: 'stack' });
  for (const l of app.course.lectures) {
    const p = lectureProgress(st, l);
    list.appendChild(h('a', { class: 'card card-link lec-card', href: `#/learn/${l.id}` },
      h('div', { class: 'lec-num' }, String(l.number)),
      h('div', { class: 'grow' },
        h('div', { class: 'meta' }, l.chapter, l.tested ? h('span', { class: 'chip heart', style: { marginLeft: '8px' } }, 'Rebuild') : null),
        h('h3', {}, l.title),
        h('div', { class: 'muted small' }, l.subtitle),
        h('div', { class: 'row', style: { marginTop: '8px', gap: '8px' } }, bar(p.readPct, 'thin ok'), h('span', { class: 'tiny faint nowrap' }, `${p.read}/${p.totalSections} read`))),
      ring(p.mastery, { size: 50, stroke: 5, cls: p.mastery >= 0.9 ? 'ok' : '' })));
  }
  main.appendChild(list);
}

// ---- Lecture overview ------------------------------------------------------------------------------
export function lectureOverview({ app, main, params }) {
  const l = lectureById(params.lid);
  if (!l) { main.appendChild(emptyState('book', 'Lecture not found', '', h('a', { class: 'btn', href: '#/learn' }, 'All lectures'))); return; }
  app.setTitle(`Lecture ${l.number}`);
  const st = app.state;
  const p = lectureProgress(st, l);
  const read = (st.lessons[l.id] || {}).read || {};
  main.appendChild(pageHead({ back: { href: '#/learn', label: 'Lectures' }, eyebrow: `Lecture ${l.number} · ${l.chapter}`, title: l.title, sub: l.summary }));

  const next = l.sections.find((s) => !read[s.id]) || l.sections[0];
  main.appendChild(h('div', { class: 'card row wrap', style: { gap: '16px' } },
    ring(p.mastery, { size: 70, stroke: 7, cls: p.mastery >= 0.9 ? 'ok' : '' }),
    h('div', { class: 'grow' }, h('div', { class: 'li-title' }, 'Mastery'), h('div', { class: 'muted small' }, `${p.read} of ${p.totalSections} sections read · practice builds mastery`)),
    h('div', { class: 'btn-row' },
      h('a', { class: 'btn', href: `#/learn/${l.id}/${next.id}` }, icon('book'), p.read ? (p.read === p.totalSections ? 'Review notes' : 'Continue reading') : 'Start reading'),
      h('a', { class: 'btn secondary', href: `#/practice/lecture/${l.id}` }, icon('target'), 'Practice'),
      h('a', { class: 'btn secondary', href: `#/cards/review?deck=${l.id}` }, icon('cards'), 'Cards'))));

  if (l.tested) {
    main.appendChild(h('div', { class: 'callout memory', style: { marginTop: '12px' } }, h('div', { class: 'co-title' }, icon('heart'), 'You\'ve already been tested on this'), md('Great time to **rebuild** it: these ideas come back in every later lecture (and on the final). Look for the **"Where students lose points"** boxes, then drill your weakest skill below.')));
  }

  main.appendChild(sectionTitle('Sections'));
  const secList = h('div', { class: 'card list section-list' });
  l.sections.forEach((s, i) => {
    const done = !!read[s.id];
    secList.appendChild(h('a', { class: 'list-item', href: `#/learn/${l.id}/${s.id}` },
      h('div', { class: `li-icon ${done ? 'done' : ''}` }, done ? icon('check') : h('b', {}, String(i + 1))),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, s.title), h('div', { class: 'li-sub' }, `${s.minutes || 5} min`)),
      h('span', { class: 'chev' }, icon('chevRight'))));
  });
  main.appendChild(secList);

  main.appendChild(sectionTitle('Skills'));
  const skills = h('div', { class: 'card' });
  for (const sk of p.skills) {
    skills.appendChild(h('div', { class: 'skill-row' },
      h('div', {}, h('div', { class: 'li-title' }, sk.title), h('div', { class: 'muted small' }, sk.desc)),
      h('div', { class: 'row', style: { gap: '8px' } }, levelChip(sk.stats), h('a', { class: 'btn small secondary', href: `#/practice/skill/${sk.id}` }, 'Drill')),
      bar(sk.stats.p, sk.stats.level === 4 ? 'thin ok' : 'thin')));
  }
  main.appendChild(skills);

  if (l.keyTerms && l.keyTerms.length) {
    main.appendChild(sectionTitle('Key terms'));
    main.appendChild(h('div', { class: 'card' }, h('dl', { class: 'glossary', style: { margin: 0 } }, l.keyTerms.flatMap((k) => [h('dt', {}, k.term), h('dd', {}, mdi(k.def))]))));
  }
}

// ---- Section reader ----------------------------------------------------------------------------------
export function sectionReader({ app, main, params }) {
  const l = lectureById(params.lid);
  const idx = l ? l.sections.findIndex((s) => s.id === params.sid) : -1;
  if (!l || idx < 0) { main.appendChild(emptyState('book', 'Section not found', '', h('a', { class: 'btn', href: '#/learn' }, 'All lectures'))); return; }
  const s = l.sections[idx];
  app.setTitle(`L${l.number} · ${s.title}`);
  const read = (app.state.lessons[l.id] || {}).read || {};
  app.store.update((st) => { const x = st.lessons[l.id] || (st.lessons[l.id] = { read: {} }); x.lastVisit = Date.now(); x.lastSection = s.id; }, { silent: true });

  const art = h('article', { class: 'reader' });
  art.appendChild(h('a', { class: 'back-link', href: `#/learn/${l.id}` }, icon('chevLeft'), `Lecture ${l.number}: ${l.title}`));
  art.appendChild(h('div', { class: 'progress-dots', 'aria-hidden': 'true' }, l.sections.map((x, i) => h('span', { class: i === idx ? 'cur' : read[x.id] ? 'done' : '' }))));
  art.appendChild(h('h1', { class: 'sec-title' }, s.title));
  const views = [];
  for (const b of s.blocks) {
    const el = renderBlock(b, { app, lecture: l, views });
    if (el) art.appendChild(h('div', { class: 'blk' }, el));
  }
  for (const n of nursingFor(l.id, s.id)) art.appendChild(h('div', { class: 'blk' }, nursingNote(n)));
  const confused = confusedButton({ where: `Lecture ${l.number} › ${s.title}`, item: `${l.id}/${s.id}` }, { label: 'Something here confused me' });
  if (confused) art.appendChild(h('div', { class: 'q-foot reader-foot' }, confused));
  const markRead = () => app.store.update((st) => markSectionRead(st, l.id, s.id, Date.now()), { silent: true });
  const prev = l.sections[idx - 1];
  const next = l.sections[idx + 1];
  art.appendChild(h('div', { class: 'reader-nav' },
    prev ? h('a', { class: 'btn secondary', href: `#/learn/${l.id}/${prev.id}` }, icon('chevLeft'), 'Previous') : h('span'),
    next
      ? h('a', { class: 'btn', href: `#/learn/${l.id}/${next.id}`, onclick: markRead }, 'Done — next', icon('chevRight'))
      : h('a', { class: 'btn', href: `#/practice/lecture/${l.id}`, onclick: markRead }, icon('target'), 'Done — practice this lecture')));
  main.appendChild(art);

  // Mark as read after reaching the end of the page for a moment
  const sentinel = h('div', { style: { height: '1px' } });
  main.appendChild(sentinel);
  let timer = null;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) timer = setTimeout(markRead, 1500);
    else clearTimeout(timer);
  }) : null;
  if (io) io.observe(sentinel);
  return () => { if (io) io.disconnect(); clearTimeout(timer); views.forEach((v) => v.destroy && v.destroy()); };
}

// ---- Content blocks ----------------------------------------------------------------------------------
const CALLOUT_ICON = { key: 'key', tip: 'bulb', warn: 'warn', exam: 'target', memory: 'heart', life: 'sparkle' };

export function renderBlock(b, ctx) {
  switch (b.t) {
    case 'p': return md(b.text);
    case 'h': return h('h3', {}, mdi(b.text));
    case 'list': return h(b.ordered ? 'ol' : 'ul', {}, b.items.map((it) => h('li', {}, mdi(it))));
    case 'callout':
      return h('div', { class: `callout ${b.kind}` }, b.title ? h('div', { class: 'co-title' }, icon(CALLOUT_ICON[b.kind] || 'info'), mdi(b.title)) : null, md(b.text));
    case 'mol': return h('div', { class: 'mols' }, molView(b));
    case 'mols': return molsView(b.items);
    case 'table': {
      const t = h('table', { class: 't' },
        h('thead', {}, h('tr', {}, b.head.map((x) => h('th', {}, mdi(x))))),
        h('tbody', {}, b.rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, mdi(c)))))));
      return h('div', {}, h('div', { class: 'table-wrap' }, t), b.caption ? mdi(b.caption, 'div', 'caption') : null);
    }
    case 'steps': return h('div', {}, b.title ? h('div', { class: 'steps-title' }, mdi(b.title)) : null, h('ol', { class: 'steps' }, b.items.map((it) => h('li', {}, mdi(it)))));
    case 'compare': return h('div', { class: 'compare' }, b.items.map((it) => h('div', {}, h('h4', {}, mdi(it.title)), md(it.text, 'div'))));
    case 'rxn': return h('div', {}, rxnView({ from: b.from, reagent: b.reagent, to: b.to }), b.caption ? mdi(b.caption, 'div', 'caption') : null);
    case 'tetra': return tetraView(b.items, b.caption);
    case 'link': return h('a', { class: 'btn secondary', href: b.href }, mdi(b.text));
    case 'example': return exampleBlock(b);
    case 'check': return checkBlock(b, ctx);
    default: return null;
  }
}

function exampleBlock(b) {
  const wrap = h('div', { class: 'example' });
  wrap.appendChild(h('div', { class: 'ex-head' }, icon('pencil'), mdi(b.title || 'Worked example')));
  if (b.prompt) wrap.appendChild(md(b.prompt));
  // Chain numbering would give the answer away, so it only appears with the solution.
  let box = null;
  const solutionNumbers = b.mol && b.mol.numbers ? (b.mol.numbers === 'auto' ? autoNumbers(b.mol.smiles) : b.mol.numbers) : null;
  if (b.mol) {
    box = molView({ toggleH: true, ...b.mol, numbers: null });
    wrap.appendChild(h('div', { class: 'mols' }, box));
  }
  const sol = h('div', { class: 'hidden' },
    h('ol', {}, b.steps.map((s) => h('li', {}, mdi(s)))),
    b.answer ? h('div', { class: 'answer' }, h('b', {}, 'Answer: '), mdi(b.answer)) : null);
  const btn = h('button', { type: 'button', class: 'btn secondary small reveal-btn', 'aria-expanded': 'false' }, icon('eye'), 'Show solution');
  btn.addEventListener('click', () => {
    const open = sol.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(open));
    btn.lastChild.textContent = open ? 'Hide solution' : 'Show solution';
    if (box && solutionNumbers) box.redraw({ numbers: open ? solutionNumbers : null });
  });
  wrap.appendChild(btn);
  wrap.appendChild(sol);
  return wrap;
}

function checkBlock(b, { app, lecture, views }) {
  const q = normalizeQuestion({ ...b.q, lecture: lecture.id });
  const wrap = h('div', { class: 'check-block' }, h('div', { class: 'cb-head' }, icon('target'), 'Quick check'));
  let ts = 0;
  const v = questionView(q, {
    mode: 'practice', showSkill: false, nextLabel: 'Try another like this',
    onSubmit: ({ result, ms }) => {
      ts = Date.now();
      app.store.update((st) => recordAttempt(st, { skill: q.skill, qid: q.id, ok: result.correct, ts, ref: q.ref, ms }), { silent: true });
    },
    onOverride: () => app.store.update((st) => overrideAttempt(st, { skill: q.skill, qid: q.id, ts, ref: q.ref }), { silent: true }),
    onNext: () => app.navigate(`#/practice/skill/${q.skill}`),
  });
  views.push(v);
  v.el.classList.remove('card');
  v.el.style.padding = '0';
  wrap.appendChild(v.el);
  return wrap;
}
