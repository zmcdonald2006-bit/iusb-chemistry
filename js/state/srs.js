// Spaced repetition (a gentle SM-2 variant) for flashcards.
// Grades: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy. Intervals are whole days.
import { addDays, daysBetween } from './store.js';

export const GRADES = [
  { id: 0, label: 'Again', key: '1' },
  { id: 1, label: 'Hard', key: '2' },
  { id: 2, label: 'Good', key: '3' },
  { id: 3, label: 'Easy', key: '4' },
];

const MAX_IVL = 180;
const MIN_EASE = 1.3;

export function newCard() {
  return { due: null, ivl: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 };
}

// Returns the updated card (does not mutate).
export function schedule(card, grade, today, ts = Date.now()) {
  const c = { ...(card || newCard()) };
  let ivl;
  if (grade === 0) {
    c.lapses += c.reps > 0 ? 1 : 0;
    c.reps = 0;
    c.ease = Math.max(MIN_EASE, c.ease - 0.2);
    ivl = 0; // show again this session, then tomorrow
  } else if (c.reps === 0) {
    ivl = grade === 1 ? 1 : grade === 2 ? 1 : 3;
    if (grade === 3) c.ease += 0.15;
    c.reps = 1;
  } else {
    const prev = Math.max(1, c.ivl);
    if (grade === 1) { c.ease = Math.max(MIN_EASE, c.ease - 0.15); ivl = Math.max(prev + 0, Math.round(prev * 1.2)); }
    else if (grade === 2) ivl = c.reps === 1 ? 3 : Math.round(prev * c.ease);
    else { c.ease += 0.15; ivl = Math.round(prev * c.ease * 1.3); }
    ivl = Math.max(ivl, prev + (grade >= 2 ? 1 : 0));
    c.reps++;
  }
  c.ivl = Math.min(MAX_IVL, ivl);
  c.due = addDays(today, Math.max(c.ivl, grade === 0 ? 0 : 1));
  c.last = ts;
  return c;
}

// Human-friendly preview of the next interval for each button.
export function previewIntervals(card, today) {
  return GRADES.map((g) => {
    const next = schedule(card, g.id, today, 0);
    const d = daysBetween(today, next.due);
    return { ...g, days: d, text: d <= 0 ? 'now' : d === 1 ? '1 day' : d < 30 ? `${d} days` : d < 365 ? `${Math.round(d / 30)} mo` : '1 yr+' };
  });
}

export function isDue(card, today) {
  return !!card && !!card.due && daysBetween(card.due, today) >= 0;
}

// Build today's review queue: due cards first (most overdue first), then new cards up to the limit.
export function buildQueue(allCards, state, today, { deck = null, newLimit = 15, cram = false } = {}) {
  const pool = deck ? allCards.filter((c) => deck.includes(c.lecture)) : allCards;
  const introducedToday = state.cardsIntroduced[today] || 0;
  const due = [], fresh = [];
  for (const c of pool) {
    const cs = state.cards[c.id];
    if (cram) { due.push({ card: c, over: cs && cs.due ? daysBetween(cs.due, today) : 999 }); continue; }
    if (!cs || !cs.due) fresh.push(c);
    else if (isDue(cs, today)) due.push({ card: c, over: daysBetween(cs.due, today) });
  }
  due.sort((a, b) => b.over - a.over);
  const room = Math.max(0, newLimit - introducedToday);
  return { due: due.map((d) => d.card), fresh: fresh.slice(0, cram ? 0 : room), newRemaining: Math.max(0, fresh.length - room) };
}

export function deckCounts(allCards, state, today, lectures) {
  const out = {};
  for (const c of allCards) {
    if (lectures && !lectures.includes(c.lecture)) continue;
    const o = out[c.lecture] || (out[c.lecture] = { total: 0, due: 0, fresh: 0, learned: 0 });
    o.total++;
    const cs = state.cards[c.id];
    if (!cs || !cs.due) o.fresh++;
    else {
      o.learned++;
      if (isDue(cs, today)) o.due++;
    }
  }
  return out;
}
