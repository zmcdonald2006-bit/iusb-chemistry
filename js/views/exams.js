import { h, icon, clear } from '../ui/dom.js';
import { pageHead, modal, emptyState, sectionTitle } from '../ui/components.js';
import { upcomingExams, lectureProgress } from '../state/progress.js';
import { dayKey, daysBetween } from '../state/store.js';
import { lectureById } from '../../content/course.js';

export default function exams({ app, main }) {
  const st = app.state;
  const today = dayKey();
  main.appendChild(pageHead({ title: 'Exams', sub: 'Add your exam dates for a countdown, a focused plan, and practice exams that cover exactly the right lectures.' }));
  main.appendChild(h('button', { type: 'button', class: 'btn', onclick: () => editExam(app, null) }, icon('plus'), 'Add an exam'));

  const up = upcomingExams(st, today);
  const past = st.exams.filter((e) => !up.some((u) => u.id === e.id)).sort((a, b) => (a.date < b.date ? 1 : -1));
  main.appendChild(sectionTitle('Upcoming'));
  if (!up.length) main.appendChild(emptyState('calendar', 'No upcoming exams', 'Add one to get a countdown on your home screen.'));
  for (const e of up) main.appendChild(examCard(app, e, today));
  if (past.length) {
    main.appendChild(sectionTitle('Past'));
    for (const e of past) main.appendChild(examCard(app, e, today, true));
  }
}

function examCard(app, e, today, past = false) {
  const lecs = (e.lectures || []).map(lectureById).filter(Boolean);
  const mastery = lecs.length ? lecs.reduce((a, l) => a + lectureProgress(app.state, l).mastery, 0) / lecs.length : 0;
  const days = daysBetween(today, e.date);
  return h('div', { class: 'card', style: { marginBottom: '10px' } },
    h('div', { class: 'row between wrap' },
      h('div', {}, h('div', { class: 'li-title' }, e.title), h('div', { class: 'muted small' }, `${new Date(`${e.date}T12:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${past ? '' : days === 0 ? ' · today!' : ` · in ${days} day${days === 1 ? '' : 's'}`}`)),
      h('div', { class: 'row', style: { gap: '6px' } },
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Edit exam', onclick: () => editExam(app, e) }, icon('pencil')))),
    h('div', { class: 'row wrap', style: { gap: '6px', margin: '10px 0' } }, lecs.map((l) => h('span', { class: 'chip' }, `L${l.number} ${l.title}`))),
    past ? null : h('div', { class: 'muted small', style: { marginBottom: '10px' } }, `Average mastery of these lectures: ${Math.round(mastery * 100)}%`),
    past ? null : h('div', { class: 'btn-row' },
      h('a', { class: 'btn small', href: `#/practice/exam?lectures=${lecs.map((l) => l.id).join(',')}` }, icon('target'), 'Practice exam'),
      h('a', { class: 'btn small secondary', href: `#/practice/custom?lectures=${lecs.map((l) => l.id).join(',')}&count=15` }, icon('play'), 'Practice set'),
      h('a', { class: 'btn small secondary', href: `#/cards/review?deck=${lecs.map((l) => l.id).join(',')}&cram=1` }, icon('cards'), 'Cram cards')));
}

export function editExam(app, exam) {
  const e = exam ? { ...exam } : { id: `e${Date.now().toString(36)}`, title: '', date: '', lectures: app.course.lectures.filter((l) => !l.tested).map((l) => l.id) };
  const title = h('input', { class: 'input', value: e.title, placeholder: 'e.g. Exam 2', 'aria-label': 'Exam name' });
  const date = h('input', { class: 'input', type: 'date', value: e.date, 'aria-label': 'Exam date' });
  const sel = new Set(e.lectures || []);
  const chips = h('div', { class: 'row wrap', style: { gap: '6px' } });
  const draw = () => {
    clear(chips);
    for (const l of app.course.lectures) {
      chips.appendChild(h('button', { type: 'button', class: 'chip chip-select', 'aria-pressed': String(sel.has(l.id)), onclick: () => { if (sel.has(l.id)) sel.delete(l.id); else sel.add(l.id); draw(); } }, `L${l.number}`));
    }
  };
  draw();
  const actions = [{ label: 'Cancel', kind: 'secondary', value: null }];
  if (exam) actions.unshift({ label: 'Delete', kind: 'secondary', value: 'delete' });
  actions.push({ label: 'Save', onClick: () => {
    if (!date.value) { app.toast('Pick a date.'); return false; }
    return 'save';
  } });
  modal({
    title: exam ? 'Edit exam' : 'Add an exam',
    body: h('div', {}, h('div', { class: 'field' }, h('label', {}, 'Name'), title), h('div', { class: 'field' }, h('label', {}, 'Date'), date), h('div', { class: 'field' }, h('label', {}, 'Lectures covered'), chips)),
    actions,
    onClose: (r) => {
      if (r === 'save') {
        app.store.update((s) => {
          const rec = { ...e, title: title.value.trim() || 'Exam', date: date.value, lectures: app.course.lectures.map((l) => l.id).filter((id) => sel.has(id)), updatedAt: Date.now() };
          const i = s.exams.findIndex((x) => x.id === e.id);
          if (i >= 0) s.exams[i] = rec; else s.exams.push(rec);
        });
        app.toast('Exam saved.');
      } else if (r === 'delete') {
        app.store.update((s) => { s.exams = s.exams.filter((x) => x.id !== e.id); });
      } else return;
      if (location.hash.startsWith('#/exams')) app.navigate('#/exams', { replace: true });
    },
  });
}
