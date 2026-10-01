import { h, icon } from '../ui/dom.js';
import { pageHead, ring, bar, levelChip, sectionTitle } from '../ui/components.js';
import { overallProgress, streak, isActiveDay } from '../state/progress.js';
import { dayKey, addDays } from '../state/store.js';

export default function progress({ app, main }) {
  const st = app.state;
  const today = dayKey();
  const o = overallProgress(st, app.course);
  const sk = streak(st, today);
  const cardsDone = Object.values(st.activity).reduce((a, x) => a + (x.cards || 0), 0);

  main.appendChild(pageHead({ title: 'Progress', sub: 'Mastery is based on your recent answers for each skill — it rises as you get questions right and fades slowly if a skill isn\'t practiced.' }));
  main.appendChild(h('div', { class: 'card row wrap', style: { gap: '18px' } },
    ring(o.mastery, { size: 96, stroke: 9, cls: o.mastery >= 0.9 ? 'ok' : '' }),
    h('div', { class: 'grow' }, h('h2', { style: { margin: 0 } }, 'Course mastery'), h('div', { class: 'muted small' }, `${app.course.code} · Lectures 1–${app.course.lectures.length}`))));

  main.appendChild(h('div', { class: 'grid tiles', style: { marginTop: '12px' } },
    stat(o.questions, 'questions answered'),
    stat(`${Math.round(o.accuracy * 100)}%`, 'accuracy'),
    stat(formatMinutes(o.minutes), 'study time'),
    stat(`${sk.current}🔥`, `day streak (best ${sk.best})`),
    stat(cardsDone, 'card reviews'),
    stat(st.sessions.length, 'practice sets')));

  main.appendChild(sectionTitle('Activity (last 16 weeks)'));
  const heat = h('div', { class: 'heatmap', role: 'img', 'aria-label': 'Study activity calendar' });
  const start = addDays(today, -(7 * 16 - 1) - new Date().getDay());
  for (let i = 0; i < 7 * 16 + new Date().getDay() + 1; i++) {
    const d = addDays(start, i);
    const a = st.activity[d];
    const score = a ? (a.q || 0) + (a.cards || 0) * 0.5 + (a.read || 0) * 3 : 0;
    const lvl = !a ? 0 : score >= 40 ? 4 : score >= 20 ? 3 : score >= 8 ? 2 : isActiveDay(a) || score > 0 ? 1 : 0;
    heat.appendChild(h('span', { class: lvl ? `l${lvl}` : '', title: `${d}: ${a ? `${a.q || 0} questions, ${a.cards || 0} cards` : 'no activity'}` }));
  }
  main.appendChild(h('div', { class: 'card' }, heat));

  main.appendChild(sectionTitle('Last 30 days'));
  main.appendChild(h('div', { class: 'card' }, accuracyChart(st, today)));

  main.appendChild(sectionTitle('By lecture'));
  const list = h('div', { class: 'stack' });
  o.per.forEach((p, i) => {
    const l = app.course.lectures[i];
    const card = h('details', { class: 'card' },
      h('summary', { style: { cursor: 'pointer', listStyle: 'none' } },
        h('div', { class: 'row' }, ring(p.mastery, { size: 46, stroke: 5, cls: p.mastery >= 0.9 ? 'ok' : '' }),
          h('div', { class: 'grow' }, h('div', { class: 'li-title' }, `L${l.number} · ${l.title}`), h('div', { class: 'muted tiny' }, `${p.read}/${p.totalSections} sections read`)),
          h('span', { class: 'chev' }, icon('chevRight')))));
    for (const s of p.skills) {
      card.appendChild(h('div', { class: 'skill-row' },
        h('div', {}, h('div', { class: 'li-title small' }, s.title), h('div', { class: 'muted tiny' }, s.stats.n ? `${s.stats.n} answered · ${Math.round(s.stats.acc * 100)}% recent accuracy` : 'not practiced yet')),
        h('div', { class: 'row', style: { gap: '6px' } }, levelChip(s.stats), h('a', { class: 'btn small secondary', href: `#/practice/skill/${s.id}` }, 'Drill')),
        bar(s.stats.p, s.stats.level === 4 ? 'thin ok' : 'thin')));
    }
    list.appendChild(card);
  });
  main.appendChild(list);

  if (st.sessions.length) {
    main.appendChild(sectionTitle('Recent practice'));
    const rec = h('div', { class: 'card list' });
    for (const s of [...st.sessions].reverse().slice(0, 12)) {
      rec.appendChild(h('div', { class: 'list-item' },
        h('div', { class: 'li-icon' }, icon(s.mode === 'exam' ? 'target' : 'play')),
        h('div', { class: 'grow' }, h('div', { class: 'li-title small' }, s.title), h('div', { class: 'li-sub' }, new Date(s.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))),
        h('span', { class: `chip ${s.total && s.correct / s.total >= 0.8 ? 'ok' : s.total && s.correct / s.total >= 0.5 ? 'warn' : 'bad'}` }, `${s.correct}/${s.total}`)));
    }
    main.appendChild(rec);
  }
}

function stat(v, k) {
  return h('div', { class: 'card stat' }, h('div', { class: 'v' }, String(v)), h('div', { class: 'k' }, k));
}

function formatMinutes(m) {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function accuracyChart(st, today) {
  const days = [];
  for (let i = 29; i >= 0; i--) days.push(addDays(today, -i));
  const W = 600, H = 150, pad = 22;
  const max = Math.max(10, ...days.map((d) => (st.activity[d] || {}).q || 0));
  const bw = (W - pad * 2) / days.length;
  let bars = '';
  days.forEach((d, i) => {
    const a = st.activity[d] || {};
    const q = a.q || 0;
    const c = a.c || 0;
    const hq = ((H - pad * 2) * q) / max;
    const hc = ((H - pad * 2) * c) / max;
    const x = pad + i * bw + 2;
    bars += `<rect x="${x}" y="${H - pad - hq}" width="${bw - 4}" height="${hq}" rx="2" fill="var(--surface-3)"><title>${d}: ${c}/${q} correct</title></rect>`;
    bars += `<rect class="barv" x="${x}" y="${H - pad - hc}" width="${bw - 4}" height="${hc}" rx="2"><title>${d}: ${c}/${q} correct</title></rect>`;
  });
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Questions answered per day over the last 30 days"><line class="axis" x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}"/>${bars}<text class="lbl" x="${pad}" y="${H - 6}">30 days ago</text><text class="lbl" x="${W - pad}" y="${H - 6}" text-anchor="end">today</text><text class="lbl" x="${pad}" y="12">${max} questions</text></svg>`;
  const wrap = h('div', { html: svg });
  wrap.appendChild(h('div', { class: 'hint' }, 'Colored = correct, gray = total answered each day.'));
  return wrap;
}
