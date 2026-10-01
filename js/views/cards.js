import { h, icon, md, clear } from '../ui/dom.js';
import { pageHead, bar, molView, emptyState, sectionTitle } from '../ui/components.js';
import { buildQueue, deckCounts, schedule, previewIntervals } from '../state/srs.js';
import { dayKey } from '../state/store.js';
import { lectureById } from '../../content/course.js';

export function cardsHub({ app, main }) {
  const st = app.state;
  const today = dayKey();
  const counts = deckCounts(app.cards, st, today);
  const totalDue = Object.values(counts).reduce((a, c) => a + c.due, 0);
  const totalNew = Object.values(counts).reduce((a, c) => a + c.fresh, 0);
  const introduced = st.cardsIntroduced[today] || 0;
  const newToday = Math.min(totalNew, Math.max(0, (st.profile.newCardsPerDay || 15) - introduced));
  main.appendChild(pageHead({ title: 'Flashcards', sub: 'Spaced repetition: cards come back right before you\'d forget them. A few minutes a day beats cramming.' }));
  main.appendChild(h('div', { class: 'card row wrap', style: { gap: '16px' } },
    h('div', { class: 'grow' },
      h('div', { class: 'stat' }, h('div', { class: 'v' }, String(totalDue + newToday)), h('div', { class: 'k' }, `cards for today · ${totalDue} due + ${newToday} new`))),
    h('a', { class: `btn ${totalDue + newToday ? '' : 'secondary'}`, href: '#/cards/review' }, icon('play'), totalDue + newToday ? 'Review now' : 'Nothing due — study ahead')));

  main.appendChild(sectionTitle('Decks'));
  const list = h('div', { class: 'card list' });
  for (const l of app.course.lectures) {
    const c = counts[l.id] || { total: 0, due: 0, fresh: 0, learned: 0 };
    list.appendChild(h('div', { class: 'list-item deck-row' },
      h('div', { class: 'lec-num', style: { width: '38px', height: '38px', fontSize: '1rem', borderRadius: '11px' } }, String(l.number)),
      h('div', { class: 'grow' },
        h('div', { class: 'li-title' }, l.title),
        h('div', { class: 'li-sub' }, `${c.due} due · ${c.fresh} new · ${c.learned}/${c.total} learned`),
        h('div', { style: { marginTop: '6px' } }, bar(c.total ? c.learned / c.total : 0, 'thin ok'))),
      h('a', { class: 'btn small secondary', href: `#/cards/review?deck=${l.id}` }, 'Review')));
  }
  main.appendChild(list);

  main.appendChild(sectionTitle('Exam tomorrow?'));
  main.appendChild(h('div', { class: 'card' },
    md('**Cram mode** runs through every card in the lectures you choose, without changing your spaced-repetition schedule.'),
    h('div', { class: 'btn-row' }, app.course.lectures.map((l) => h('a', { class: 'chip chip-select', href: `#/cards/review?deck=${l.id}&cram=1` }, `L${l.number}`)))));
}

export function cardsReview({ app, main, query }) {
  const today = dayKey();
  const deck = query.deck ? query.deck.split(',').filter((d) => lectureById(d)) : null;
  const cram = query.cram === '1';
  const st = app.state;
  const q0 = buildQueue(app.cards, st, today, { deck, newLimit: st.profile.newCardsPerDay || 15, cram });
  let queue = [...q0.due, ...q0.fresh];
  let studyAhead = false;
  if (!queue.length && !cram) {
    // nothing due: offer to study ahead with the soonest cards
    const pool = app.cards.filter((c) => !deck || deck.includes(c.lecture)).filter((c) => st.cards[c.id]);
    pool.sort((a, b) => (st.cards[a.id].due < st.cards[b.id].due ? -1 : 1));
    queue = pool.slice(0, 10);
    studyAhead = true;
  }
  const title = cram ? 'Cram mode' : deck ? `Lecture ${deck.map((d) => lectureById(d).number).join(', ')} cards` : 'Today\'s cards';
  app.setTitle(title);
  if (!queue.length) {
    main.appendChild(emptyState('cards', 'All caught up!', 'No cards are due. Come back tomorrow, or learn new cards in a lecture deck.', h('a', { class: 'btn', href: '#/cards' }, 'Back to decks')));
    return;
  }
  const repeats = new Map();
  const total = queue.length;
  let done = 0;
  let reviewed = 0;
  const top = h('div', { class: 'quiz-top' });
  const host = h('div', { class: 'flash' });
  main.appendChild(top);
  if (studyAhead) main.appendChild(h('div', { class: 'banner' }, icon('info'), 'Nothing is due — you\'re studying ahead. These won\'t change your schedule much.'));
  main.appendChild(host);

  let showing = false;
  let current = null;

  function drawTop() {
    clear(top);
    top.appendChild(h('a', { class: 'icon-btn', href: '#/cards', 'aria-label': 'Exit' }, icon('x')));
    top.appendChild(bar(done / total));
    top.appendChild(h('span', { class: 'count' }, `${Math.min(done + 1, total)} / ${total}`));
  }

  function show() {
    drawTop();
    clear(host);
    current = queue.shift();
    if (!current) return finish();
    showing = false;
    const lec = lectureById(current.lecture);
    const face = h('div', { class: 'flash-card', role: 'button', tabindex: '0', 'aria-label': 'Flashcard. Press space to reveal the answer.' },
      h('div', { class: 'side-label' }, `Lecture ${lec ? lec.number : ''}`),
      md(current.front, 'div', 'front'),
      current.mol ? h('div', { style: { marginTop: '10px' } }, molView({ smiles: current.mol, plain: true })) : null);
    const back = md(current.back, 'div', 'back');
    const reveal = h('button', { type: 'button', class: 'btn block', style: { marginTop: '14px' } }, icon('eye'), 'Show answer');
    const grades = h('div', { class: 'grade-row hidden' });
    const prev = previewIntervals(app.state.cards[current.id], today);
    prev.forEach((g) => {
      const b = h('button', { type: 'button', class: `grade-btn g${g.id}` }, g.label, h('small', {}, cram ? `key ${g.key}` : g.text));
      b.addEventListener('click', () => grade(g.id));
      grades.appendChild(b);
    });
    const flip = () => {
      if (showing) return;
      showing = true;
      face.appendChild(back);
      reveal.classList.add('hidden');
      grades.classList.remove('hidden');
      const first = grades.querySelector('.g2');
      if (first) first.focus({ preventScroll: true });
    };
    face.addEventListener('click', flip);
    reveal.addEventListener('click', flip);
    host.append(face, reveal, grades, h('p', { class: 'hint center', style: { marginTop: '12px' } }, 'Keys: ', h('span', { class: 'kbd' }, 'Space'), ' flip · ', h('span', { class: 'kbd' }, '1'), '–', h('span', { class: 'kbd' }, '4'), ' grade'));
    host.flip = flip;
  }

  function grade(g) {
    const card = current;
    const isNew = !app.state.cards[card.id];
    app.store.update((s) => {
      if (!cram && !studyAhead) {
        s.cards[card.id] = schedule(s.cards[card.id], g, today);
        if (isNew) s.cardsIntroduced[today] = (s.cardsIntroduced[today] || 0) + 1;
      } else if (studyAhead && g === 0) {
        s.cards[card.id] = schedule(s.cards[card.id], 0, today);
      }
      const act = s.activity[today] || (s.activity[today] = {});
      act.cards = (act.cards || 0) + 1;
    }, { silent: true });
    reviewed++;
    const r = repeats.get(card.id) || 0;
    if (g === 0 && r < 2) { repeats.set(card.id, r + 1); queue.push(card); }
    else done++;
    show();
  }

  function finish() {
    clear(top);
    clear(host);
    app.refreshNav();
    host.appendChild(h('div', { class: 'card center', style: { padding: '30px 18px' } },
      h('div', { class: 'onboard' }, h('div', { class: 'big-icon', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' })),
      h('h2', {}, 'Session complete!'),
      h('p', { class: 'muted' }, `${reviewed} review${reviewed === 1 ? '' : 's'} done. ${app.cheer(true)}`),
      h('div', { class: 'btn-row', style: { justifyContent: 'center' } }, h('a', { class: 'btn', href: '#/' }, 'Home'), h('a', { class: 'btn secondary', href: '#/cards' }, 'Decks'))));
  }

  const onKey = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (!current) return;
    if ((e.key === ' ' || e.key === 'Enter') && !showing) { e.preventDefault(); host.flip && host.flip(); }
    else if (showing && /^[1-4]$/.test(e.key)) { e.preventDefault(); grade(+e.key - 1); }
  };
  document.addEventListener('keydown', onKey);
  show();
  return () => document.removeEventListener('keydown', onKey);
}
