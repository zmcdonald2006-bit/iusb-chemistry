// Saving Word Splash: the daily word (one per day, finishable on any device), the current practice
// word, stats, and fish (paid into the same wallet as Sea Lion Splash).
import { deviceId, earnFish } from './store.js';
import { gameState } from './game.js';
import { MAX_GUESSES, dailyWord, dailyStreak, fishFor, practiceWord } from '../game/words.js';

export function wordsState(st) {
  const g = gameState(st);
  if (!g.words) g.words = { days: {}, stats: {}, best: 0 };
  g.words.days = g.words.days || {};
  g.words.stats = g.words.stats || {};
  return g.words;
}

const blank = (word, ts) => ({ w: word, g: [], clue: false, done: false, won: false, ts });

// Today's record, or a fresh one (not saved until the first guess).
export function dailyRecord(st, day) {
  const ws = (st.game && st.game.words) || {};
  return (ws.days && ws.days[day]) || blank(dailyWord(day).word, 0);
}

export function practiceRecord(st) {
  const ws = (st.game && st.game.words) || {};
  return ws.practice || null;
}

export function startPractice(st, { seed, lectures = null, day, ts }) {
  const ws = wordsState(st);
  const avoid = [dailyWord(day).word, ws.practice && ws.practice.w].filter(Boolean);
  const w = practiceWord({ seed, lectures, avoid });
  ws.practice = { ...blank(w.word, ts), lectures: lectures && lectures.length ? lectures : null };
  return ws.practice;
}

export function useClue(st, { mode, day, ts }) {
  const ws = wordsState(st);
  const rec = mode === 'daily' ? (ws.days[day] || (ws.days[day] = dailyRecord(st, day))) : ws.practice;
  if (rec && !rec.done) { rec.clue = true; rec.ts = ts; }
  return rec;
}

// Add a guess. When the word is finished, counts the game and pays the fish.
// Returns { rec, finished, won, fish, streak }.
export function addGuess(st, { mode, day, guess, ts }) {
  const ws = wordsState(st);
  const rec = mode === 'daily' ? (ws.days[day] || (ws.days[day] = dailyRecord(st, day))) : ws.practice;
  if (!rec || rec.done || guess.length !== rec.w.length) return { rec, finished: false };
  rec.g = [...rec.g, guess];
  rec.ts = ts;
  const won = guess === rec.w;
  if (!won && rec.g.length < MAX_GUESSES) return { rec, finished: false };
  rec.done = true;
  rec.won = won;
  // stats, counted per device so two devices add up
  const dev = deviceId(st);
  const s = ws.stats[dev] || (ws.stats[dev] = { p: 0, w: 0, d: [0, 0, 0, 0, 0, 0] });
  s.p++;
  if (won) { s.w++; s.d[rec.g.length - 1]++; }
  const streak = mode === 'daily' ? dailyStreak(ws.days, day) : 0;
  if (mode === 'daily') ws.best = Math.max(ws.best || 0, streak);
  rec.fish = earnFish(st, fishFor({ won, guesses: rec.g.length, clue: rec.clue, daily: mode === 'daily', streak }));
  return { rec, finished: true, won, fish: rec.fish, streak };
}
