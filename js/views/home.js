import { h, icon } from '../ui/dom.js';
import { ring, sectionTitle } from '../ui/components.js';
import { recommendations, streak, todayStats, upcomingExams, lectureProgress } from '../state/progress.js';
import { dayKey } from '../state/store.js';

function greeting() {
  const hr = new Date().getHours();
  if (hr < 5) return 'Up late';
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function home({ app, main }) {
  const st = app.state;
  const name = st.profile.name ? `, ${st.profile.name}` : '';
  const today = dayKey();
  const sk = streak(st, today);
  const t = todayStats(st, today);
  const goal = st.profile.dailyGoal || 20;

  main.appendChild(h('section', { class: 'hero' },
    h('div', {},
      h('div', { class: 'date' }, new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })),
      h('h1', {}, `${greeting()}${name}!`)),
    sk.current ? h('div', { class: 'streak', title: `Best streak: ${sk.best} days` }, icon('flame'), `${sk.current}`, h('span', { class: 'sr-only' }, 'day streak')) : null));

  // Resume an unfinished session
  if (st.active && st.active.answers.length < st.active.items.length) {
    const a = st.active;
    main.appendChild(h('a', { class: 'card card-link plan-item', href: '#/quiz', style: { marginTop: '14px' } },
      h('div', { class: 'pi-icon' }, icon('play')),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, `Resume: ${a.title}`), h('div', { class: 'li-sub muted small' }, `${a.answers.length} of ${a.items.length} answered`)),
      h('span', { class: 'chev' }, icon('chevRight'))));
  }

  // Daily goal + exam
  const goalCard = h('div', { class: 'card goal-card' },
    ring(Math.min(1, t.q / goal), { size: 68, stroke: 7, label: `${t.q}/${goal}`, cls: t.q >= goal ? 'ok' : '' }),
    h('div', { class: 'grow' },
      h('h3', { style: { margin: 0 } }, t.q >= goal ? 'Daily goal reached! 🎉' : 'Today\'s goal'),
      h('div', { class: 'muted small' }, `${t.q} questions · ${t.cards} cards · ${t.minutes} min studied`),
      h('div', { class: 'muted small' }, sk.activeToday ? 'Streak safe for today.' : sk.current ? 'Answer a few questions to keep your streak.' : 'Answer a few questions to start a streak.')));
  const grid = h('div', { class: 'grid two', style: { marginTop: '14px' } }, goalCard);

  const exams = upcomingExams(st, today);
  if (exams.length) {
    const e = exams[0];
    grid.appendChild(h('a', { class: 'card card-link exam-count', href: '#/exams' },
      h('div', { class: 'days' }, String(e.daysLeft)),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, e.daysLeft === 1 ? 'day until' : e.daysLeft === 0 ? 'Today:' : 'days until'), h('div', { style: { fontWeight: 750 } }, e.title), h('div', { class: 'muted small' }, new Date(`${e.date}T12:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })))));
  } else {
    grid.appendChild(h('a', { class: 'card card-link exam-count', href: '#/exams' },
      h('div', { class: 'pi-icon', style: { width: '44px', height: '44px', borderRadius: '13px', display: 'grid', placeItems: 'center', background: 'var(--bad-soft)', color: 'var(--bad)' } }, icon('calendar')),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, 'Add your next exam'), h('div', { class: 'muted small' }, 'Get a countdown and a focused study plan.'))));
  }
  main.appendChild(grid);

  // Today's plan
  main.appendChild(sectionTitle('Today\'s plan'));
  const recs = recommendations(st, app.course, app.cards, { today });
  const list = h('div', { class: 'stack' });
  for (const r of recs) {
    list.appendChild(h('a', { class: `card card-link plan-item ${r.kind}`, href: r.href },
      h('div', { class: 'pi-icon' }, icon(r.icon)),
      h('div', { class: 'grow' }, h('div', { class: 'li-title' }, r.title), h('div', { class: 'muted small' }, r.subtitle)),
      h('span', { class: 'chev' }, icon('chevRight'))));
  }
  main.appendChild(list);

  // Lectures at a glance
  main.appendChild(sectionTitle('Lectures', { href: '#/learn', label: 'See all' }));
  const strip = h('div', { class: 'card lecture-strip' });
  for (const l of app.course.lectures) {
    const p = lectureProgress(st, l);
    strip.appendChild(h('a', { href: `#/learn/${l.id}`, title: l.title }, ring(p.mastery, { size: 50, stroke: 5, label: `L${l.number}`, cls: p.mastery >= 0.9 ? 'ok' : '' }), h('span', {}, `${Math.round(p.mastery * 100)}%`)));
  }
  main.appendChild(strip);

  // Quick tools
  main.appendChild(sectionTitle('Tools'));
  main.appendChild(h('div', { class: 'grid tiles' },
    tile('#/lab', 'lab', 'Name Lab', 'Type a name, see it drawn'),
    tile('#/reactions', 'map', 'Reaction map', 'Every reaction in one place'),
    tile('#/reference', 'list', 'Reference', 'Tables & glossary'),
    tile('#/tools/ph', 'flask', 'pH calculator', 'With the sig-fig rule')));

  // A little encouragement
  if (sk.current >= 2 || t.q >= goal) {
    main.appendChild(h('div', { class: 'card note-card', style: { marginTop: '18px' } }, icon('heart'), h('div', {}, app.cheer(true))));
  }
}

function tile(href, ic, title, sub) {
  return h('a', { class: 'card card-link', href }, h('div', { class: 'li-icon', style: { width: '38px', height: '38px', borderRadius: '11px', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent)', marginBottom: '8px' } }, icon(ic)), h('div', { class: 'li-title' }, title), h('div', { class: 'muted tiny' }, sub));
}
