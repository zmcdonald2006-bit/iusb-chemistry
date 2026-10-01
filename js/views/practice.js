import { h, icon } from '../ui/dom.js';
import { pageHead, sectionTitle, emptyState } from '../ui/components.js';
import { lectureProgress, weakSkills, openMistakes, upcomingExams } from '../state/progress.js';
import { lectureById, skillById } from '../../content/course.js';

export function practiceHub({ app, main }) {
  const st = app.state;
  main.appendChild(pageHead({ title: 'Practice', sub: 'Every question has a full explanation. Many are generated fresh each time, so you can never run out.' }));
  if (st.active && st.active.answers.length < st.active.items.length) {
    main.appendChild(h('a', { class: 'card card-link plan-item', href: '#/quiz', style: { marginBottom: '12px' } },
      h('div', { class: 'pi-icon' }, icon('play')),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, `Resume: ${st.active.title}`), h('div', { class: 'muted small' }, `${st.active.answers.length} of ${st.active.items.length} answered`)),
      h('span', { class: 'chev' }, icon('chevRight'))));
  }
  const mistakes = openMistakes(st).length;
  const weak = weakSkills(st, app.course, { limit: 3 });
  main.appendChild(h('div', { class: 'grid two' },
    quick('#/practice/mixed', 'shuffle', 'Mixed review', 'A little of everything you\'ve studied', ''),
    quick('#/practice/weak', 'bolt', 'Weak spots', weak.length ? weak.map((w) => w.skill.title).join(' · ') : 'Practice a bit first to find them', 'weak'),
    quick('#/practice/mistakes', 'redo', 'Fix mistakes', mistakes ? `${mistakes} to review — get each right twice` : 'No open mistakes 🎉', 'mistakes'),
    quick('#/practice/exam', 'target', 'Practice exam', 'Timed, no hints, results at the end', 'exam'),
    quick('#/bootcamp', 'spark', 'Foundations Bootcamp', 'Rebuild Lectures 1–4', 'bootcamp'),
    quick('#/game', 'wave', 'Sea Lion Splash', 'Practice as a game: swim through the right answers', 'game'),
    quick('#/lab', 'lab', 'Name Lab', 'Check any name by drawing it', 'read')));

  main.appendChild(sectionTitle('By lecture'));
  const list = h('div', { class: 'stack' });
  for (const l of app.course.lectures) {
    const p = lectureProgress(st, l);
    const card = h('div', { class: 'card' },
      h('div', { class: 'row between' },
        h('div', { class: 'row' }, h('div', { class: 'lec-num', style: { width: '38px', height: '38px', fontSize: '1rem', borderRadius: '11px' } }, String(l.number)), h('div', {}, h('div', { class: 'li-title' }, l.title), h('div', { class: 'muted tiny' }, `${Math.round(p.mastery * 100)}% mastery`))),
        h('a', { class: 'btn small', href: `#/practice/lecture/${l.id}` }, icon('play'), 'Practice')),
      h('div', { class: 'row wrap', style: { gap: '6px', marginTop: '10px' } },
        p.skills.map((sk) => h('a', { class: `chip ${['', 'bad', 'warn', 'info', 'ok'][sk.stats.level]}`, href: `#/practice/skill/${sk.id}`, title: `${sk.stats.label} — drill this skill` }, sk.title))));
    list.appendChild(card);
  }
  main.appendChild(list);
}

function quick(href, ic, title, sub, kind) {
  return h('a', { class: `card card-link plan-item ${kind}`, href }, h('div', { class: 'pi-icon' }, icon(ic)), h('div', { class: 'grow' }, h('div', { class: 'li-title' }, title), h('div', { class: 'muted small' }, sub)), h('span', { class: 'chev' }, icon('chevRight')));
}

function touchedLectures(st, course) {
  const out = course.lectures.filter((l) => {
    const read = Object.keys((st.lessons[l.id] || {}).read || {}).length;
    return read > 0 || l.skills.some((s) => (st.skills[s.id] || {}).n) || l.tested;
  });
  return out.length ? out : course.lectures;
}

export function practiceStart({ app, main, params, query }) {
  const st = app.state;
  const mode = params.mode;
  const begin = async (opts) => {
    const a = app.state.active;
    if (a && a.answers.length && a.answers.length < a.items.length) {
      const ok = await app.confirm({ title: 'Start a new set?', text: `You have an unfinished set (**${a.title}**, ${a.answers.length}/${a.items.length}). Starting a new one will replace it. (Your answers so far are already saved.)`, ok: 'Start new' });
      if (!ok) { app.navigate('#/quiz', { replace: true }); return; }
    }
    app.startSession(opts);
  };

  if (mode === 'lecture') {
    const l = lectureById(params.arg);
    if (!l) return missing(main);
    begin({ mode: 'practice', title: `Lecture ${l.number}: ${l.title}`, skills: l.skills.map((s) => s.id), lectures: [l.id], count: +(query.count || 10), origin: `#/learn/${l.id}` });
  } else if (mode === 'skill') {
    const sk = skillById(params.arg);
    if (!sk) return missing(main);
    begin({ mode: 'drill', title: sk.title, subtitle: `Lecture ${sk.lecture.number}`, skills: [sk.id], lectures: [sk.lecture.id], count: +(query.count || 8), origin: query.from || `#/learn/${sk.lecture.id}` });
  } else if (mode === 'mixed') {
    const lecs = touchedLectures(st, app.course);
    begin({ mode: 'mixed', title: 'Mixed review', skills: lecs.flatMap((l) => l.skills.map((s) => s.id)), lectures: lecs.map((l) => l.id), count: +(query.count || 12) });
  } else if (mode === 'weak') {
    const weak = weakSkills(st, app.course, { limit: 4 });
    if (!weak.length) {
      main.appendChild(emptyState('bolt', 'No weak spots yet', 'Do some practice first — the app learns where you need help.', h('a', { class: 'btn', href: '#/practice/mixed' }, 'Start mixed review')));
      return;
    }
    begin({ mode: 'practice', title: 'Weak spots', skills: weak.map((w) => w.skill.id), lectures: [...new Set(weak.map((w) => w.lecture.id))], count: 10 });
  } else if (mode === 'mistakes') {
    if (!openMistakes(st).length) {
      main.appendChild(emptyState('check', 'No mistakes to fix', 'When you miss a question it lands here. Get it right twice to clear it.', h('a', { class: 'btn', href: '#/practice' }, 'Back to practice')));
      return;
    }
    begin({ mode: 'mistakes', title: 'Fix mistakes', count: +(query.count || 15) });
  } else if (mode === 'custom') {
    const lecs = (query.lectures || '').split(',').map(lectureById).filter(Boolean);
    if (!lecs.length) return missing(main);
    begin({ mode: 'practice', title: 'Custom practice', skills: lecs.flatMap((l) => l.skills.map((s) => s.id)), lectures: lecs.map((l) => l.id), count: +(query.count || 15) });
  } else if (mode === 'exam') {
    examBuilder({ app, main, query });
  } else missing(main);
}

function missing(main) {
  main.appendChild(emptyState('info', 'Not found', 'That practice set doesn\'t exist.', h('a', { class: 'btn', href: '#/practice' }, 'Back to practice')));
}

function examBuilder({ app, main, query }) {
  app.setTitle('Practice exam');
  const st = app.state;
  const upcoming = upcomingExams(st)[0];
  let selected = new Set((query.lectures ? query.lectures.split(',') : upcoming && upcoming.lectures && upcoming.lectures.length ? upcoming.lectures : app.course.lectures.filter((l) => !l.tested).map((l) => l.id)).filter((id) => lectureById(id)));
  if (!selected.size) selected = new Set(app.course.lectures.map((l) => l.id));
  let count = 20;
  let timed = true;
  main.appendChild(pageHead({ back: { href: '#/practice', label: 'Practice' }, title: 'Practice exam', sub: 'Simulate the real thing: questions from the lectures you pick, no hints or feedback until the end.' }));
  const card = h('div', { class: 'card' });
  const chips = h('div', { class: 'row wrap', style: { gap: '8px' } });
  const draw = () => {
    chips.innerHTML = '';
    for (const l of app.course.lectures) {
      const b = h('button', { type: 'button', class: 'chip chip-select', 'aria-pressed': String(selected.has(l.id)) }, `L${l.number} ${l.title}`);
      b.addEventListener('click', () => { if (selected.has(l.id)) selected.delete(l.id); else selected.add(l.id); draw(); });
      chips.appendChild(b);
    }
  };
  draw();
  card.appendChild(h('div', { class: 'label', style: { marginBottom: '8px' } }, 'Lectures on the exam'));
  card.appendChild(chips);
  if (upcoming) card.appendChild(h('p', { class: 'hint', style: { marginTop: '8px' } }, `Pre-selected from your upcoming exam: ${upcoming.title}.`));
  const countSel = h('select', { class: 'input' }, [10, 20, 30, 40].map((n) => h('option', { value: String(n), selected: n === count }, `${n} questions`)));
  countSel.addEventListener('change', () => { count = +countSel.value; });
  const timedBox = h('input', { type: 'checkbox', checked: true, id: 'timed' });
  timedBox.addEventListener('change', () => { timed = timedBox.checked; });
  card.appendChild(h('div', { class: 'grid two', style: { marginTop: '16px' } },
    h('div', { class: 'field' }, h('label', {}, 'Length'), countSel),
    h('div', { class: 'field' }, h('label', { for: 'timed' }, 'Timer'), h('label', { class: 'check-row' }, timedBox, '90 seconds per question'))));
  const start = h('button', { type: 'button', class: 'btn block' }, icon('play'), 'Start exam');
  start.addEventListener('click', () => {
    if (!selected.size) { app.toast('Pick at least one lecture.'); return; }
    const lecs = app.course.lectures.filter((l) => selected.has(l.id));
    app.startSession({ mode: 'exam', title: 'Practice exam', subtitle: lecs.map((l) => `L${l.number}`).join(', '), skills: lecs.flatMap((l) => l.skills.map((s) => s.id)), lectures: lecs.map((l) => l.id), count, timeLimit: timed ? count * 90 : null, origin: '#/practice' });
  });
  card.appendChild(start);
  main.appendChild(card);
}
