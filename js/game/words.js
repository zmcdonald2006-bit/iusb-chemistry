// Word Splash rules: scoring guesses, picking words, streaks and fish. No drawing here (fully tested).
import { WORDS } from '../../content/words.js';
import { makeRng } from '../lib/random.js';
import { addDays, daysBetween } from '../state/store.js';

export const MAX_GUESSES = 6;
const EPOCH = '2026-09-01'; // day 1 of the daily words

// Wordle-style marks for each letter: 'hit' (right spot), 'near' (in the word, elsewhere), 'miss'.
// Repeated letters are only marked as often as they appear in the answer, hits first.
export function scoreGuess(guess, answer) {
  const g = guess.toUpperCase().split('');
  const a = answer.toUpperCase().split('');
  const marks = g.map(() => 'miss');
  const left = {};
  a.forEach((ch, i) => { if (g[i] === ch) marks[i] = 'hit'; else left[ch] = (left[ch] || 0) + 1; });
  g.forEach((ch, i) => {
    if (marks[i] !== 'hit' && left[ch] > 0) { marks[i] = 'near'; left[ch]--; }
  });
  return marks;
}

// The best thing known about each letter so far (for coloring the keyboard).
export function keyStates(guesses, answer) {
  const rank = { miss: 1, near: 2, hit: 3 };
  const out = {};
  for (const gs of guesses) {
    scoreGuess(gs, answer).forEach((m, i) => {
      const ch = gs[i].toUpperCase();
      if (!out[ch] || rank[m] > rank[out[ch]]) out[ch] = m;
    });
  }
  return out;
}

export const cleanGuess = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');

export function checkGuess(guess, answer) {
  if (guess.length < answer.length) return 'Not enough letters';
  if (guess.length > answer.length) return 'Too many letters';
  return null;
}

// Same word for everyone on a given day: a fixed shuffle of the list, one word per day.
const ORDER = makeRng('word-splash:v1').shuffle(WORDS.map((_, i) => i));
export function dayNumber(day) { return daysBetween(EPOCH, day) + 1; }
export function dailyWord(day) {
  const n = dayNumber(day);
  const i = ((n - 1) % ORDER.length + ORDER.length) % ORDER.length;
  return WORDS[ORDER[i]];
}

export const wordInfo = (w) => WORDS.find((x) => x.word === w) || null;

// A practice word: from the chosen lectures, avoiding today's daily word and recent ones.
export function practiceWord({ seed, lectures = null, avoid = [] } = {}) {
  const pool = WORDS.filter((w) => !lectures || !lectures.length || lectures.includes(w.lecture));
  const fresh = pool.filter((w) => !avoid.includes(w.word));
  const list = fresh.length ? fresh : pool;
  return makeRng(seed).pick(list);
}

// Fish for a finished word. Fewer guesses pay more; solving without the clue and the daily word pay extra.
export function fishFor({ won, guesses, clue, daily, streak = 0 }) {
  if (!won) return daily ? 5 : 2;
  let f = 10 + (MAX_GUESSES + 1 - guesses) * 5; // 15 (6 guesses) … 40 (1 guess)
  if (!clue) f += 10;
  if (daily) f += 15 + 5 * Math.min(Math.max(streak - 1, 0), 6); // up to +30 for a week-long streak
  return f;
}

// Daily streak: days in a row with the daily word solved, up to today (or yesterday, if today's
// isn't done yet, so the streak doesn't look broken first thing in the morning).
export function dailyStreak(days, today) {
  const won = (d) => days[d] && days[d].done && days[d].won;
  let d = won(today) ? today : addDays(today, -1);
  let n = 0;
  while (won(d)) { n++; d = addDays(d, -1); }
  return n;
}

// Totals across devices (each device counts its own games; see mergeWords in store.js).
export function totals(words) {
  const t = { p: 0, w: 0, d: [0, 0, 0, 0, 0, 0] };
  for (const s of Object.values((words && words.stats) || {})) {
    t.p += s.p || 0;
    t.w += s.w || 0;
    (s.d || []).forEach((v, i) => { t.d[i] += v || 0; });
  }
  return t;
}

// The emoji grid people paste into a text.
export function shareText(rec, { day = null } = {}) {
  const icons = { hit: '🟩', near: '🟨', miss: '⬜' };
  const head = `Word Splash${day ? ` #${dayNumber(day)}` : ''} ${rec.won ? rec.g.length : 'X'}/${MAX_GUESSES}${rec.clue ? ' (clue)' : ''} 🦭`;
  return [head, '', ...rec.g.map((gs) => scoreGuess(gs, rec.w).map((m) => icons[m]).join(''))].join('\n');
}
