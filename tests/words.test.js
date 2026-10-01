import { describe, it, expect } from './harness.js';
import { WORDS } from '../content/words.js';
import { lectureById } from '../content/course.js';
import { scoreGuess, keyStates, checkGuess, dailyWord, dayNumber, practiceWord, fishFor, dailyStreak, shareText, totals, MAX_GUESSES } from '../js/game/words.js';
import { defaultState, mergeStates, migrate, addDays, stableStringify } from '../js/state/store.js';
import { addGuess, useClue, startPractice, dailyRecord, wordsState } from '../js/state/words.js';
import { parseSmiles } from '../js/chem/smiles.js';

const T0 = new Date(2026, 9, 1, 12).getTime();
const DAY = '2026-10-01';
const marks = (g, a) => scoreGuess(g, a).join(',');

describe('Word Splash: scoring', () => {
  it('marks right spot, wrong spot and not in the word', () => {
    expect(marks('THIOL', 'THIOL')).toBe('hit,hit,hit,hit,hit');
    expect(marks('TREES', 'ESTER')).toBe('near,near,near,hit,near');
    expect(marks('ETHER', 'ESTER')).toBe('hit,near,miss,hit,hit'); // T is in ESTER, just not 2nd
  });
  it('marks a repeated letter only as often as it\'s in the answer', () => {
    expect(marks('AAAA', 'ACID')).toBe('hit,miss,miss,miss');
    expect(marks('OOPS', 'SOAP')).toBe('miss,hit,near,near');
    expect(marks('EEEEE', 'ESTER')).toBe('hit,miss,miss,hit,miss');
    expect(marks('SEEDS', 'ESTER')).toBe('near,near,near,miss,miss'); // ESTER has two E's and one S
  });
  it('colors the keyboard with the best thing known about each letter', () => {
    const k = keyStates(['TREES', 'ETHER'], 'ESTER');
    expect(k.E).toBe('hit');
    expect(k.T).toBe('near');
    expect(k.H).toBe('miss');
  });
  it('needs the right number of letters', () => {
    expect(checkGuess('EST', 'ESTER')).toBe('Not enough letters');
    expect(checkGuess('ESTERS', 'ESTER')).toBe('Too many letters');
    expect(checkGuess('ETHER', 'ESTER')).toBeNull();
  });
});

describe('Word Splash: words', () => {
  it('has a clean word list', () => {
    const seen = new Set();
    for (const w of WORDS) {
      if (!/^[A-Z]{4,9}$/.test(w.word)) throw new Error(`${w.word}: 4–9 capital letters only`);
      if (seen.has(w.word)) throw new Error(`${w.word}: listed twice`);
      seen.add(w.word);
      const lec = lectureById(w.lecture);
      if (!lec) throw new Error(`${w.word}: no lecture ${w.lecture}`);
      if (w.section && !lec.sections.some((s) => s.id === w.section)) throw new Error(`${w.word}: no section ${w.section}`);
      if (!w.clue || w.clue.toUpperCase().replace(/[^A-Z]/g, '').includes(w.word)) throw new Error(`${w.word}: the clue gives it away`);
      if (w.smiles) parseSmiles(w.smiles);
    }
    expect(WORDS.length).toBeGreaterThan(120);
  });
  it('gives everyone the same daily word, without repeats until the list runs out', () => {
    expect(dailyWord(DAY).word).toBe(dailyWord(DAY).word);
    expect(dayNumber('2026-09-01')).toBe(1);
    const seen = new Set();
    let d = '2026-09-01';
    for (let i = 0; i < WORDS.length; i++) { seen.add(dailyWord(d).word); d = addDays(d, 1); }
    expect(seen.size).toBe(WORDS.length);
  });
  it('practice words come from the chosen lecture and avoid recent ones', () => {
    for (let i = 0; i < 40; i++) {
      const w = practiceWord({ seed: `s${i}`, lectures: ['l06'], avoid: ['THIOL'] });
      expect(w.lecture).toBe('l06');
      if (w.word === 'THIOL') throw new Error('avoided word came up');
    }
  });
});

describe('Word Splash: fish and streaks', () => {
  it('pays more for fewer guesses, no clue, and the daily word', () => {
    expect(fishFor({ won: true, guesses: 1, clue: true, daily: false })).toBe(40);
    expect(fishFor({ won: true, guesses: 6, clue: true, daily: false })).toBe(15);
    expect(fishFor({ won: true, guesses: 3, clue: false, daily: false })).toBe(40);
    expect(fishFor({ won: true, guesses: 3, clue: false, daily: true, streak: 1 })).toBe(55);
    expect(fishFor({ won: true, guesses: 3, clue: false, daily: true, streak: 30 })).toBe(85); // streak bonus caps at +30
    expect(fishFor({ won: false, guesses: 6, clue: true, daily: true })).toBe(5);
  });
  it('counts a daily streak up to today (or yesterday, before today is played)', () => {
    const days = {};
    for (const d of ['2026-09-28', '2026-09-29', '2026-09-30']) days[d] = { done: true, won: true };
    expect(dailyStreak(days, DAY)).toBe(3);
    days[DAY] = { done: true, won: true };
    expect(dailyStreak(days, DAY)).toBe(4);
    days['2026-09-29'] = { done: true, won: false };
    expect(dailyStreak(days, DAY)).toBe(2);
    expect(dailyStreak(days, '2026-10-03')).toBe(0);
  });
  it('shares an emoji grid', () => {
    const t = shareText({ w: 'ESTER', g: ['ETHER', 'ESTER'], won: true, clue: false }, { day: DAY });
    expect(t.split('\n')[0]).toBe(`Word Splash #${dayNumber(DAY)} 2/6 🦭`);
    expect(t.split('\n')[2]).toBe('🟩🟨⬜🟩🟩');
  });
});

describe('Word Splash: saving', () => {
  const solve = (st, mode, guesses, ts = T0) => { let r; for (const g of guesses) r = addGuess(st, { mode, day: DAY, guess: g, ts }); return r; };
  it('a daily win pays fish into the shared wallet and counts the game', () => {
    const st = defaultState(T0);
    st.meta.deviceId = 'phone';
    const word = dailyRecord(st, DAY).w;
    const r = solve(st, 'daily', ['X'.repeat(word.length), word]);
    expect(r.finished).toBe(true);
    expect(r.won).toBe(true);
    expect(st.game.fish).toBe(fishFor({ won: true, guesses: 2, clue: false, daily: true, streak: 1 }));
    expect(st.game.words.days[DAY].done).toBe(true);
    expect(totals(st.game.words).w).toBe(1);
    expect(totals(st.game.words).d[1]).toBe(1);
    // finished: more guesses are ignored and pay nothing
    const before = st.game.fish;
    expect(addGuess(st, { mode: 'daily', day: DAY, guess: word, ts: T0 }).finished).toBe(false);
    expect(st.game.fish).toBe(before);
  });
  it('six misses end the game; the clue lowers the reward; wrong lengths are ignored', () => {
    const st = defaultState(T0);
    const word = dailyRecord(st, DAY).w;
    useClue(st, { mode: 'daily', day: DAY, ts: T0 });
    expect(addGuess(st, { mode: 'daily', day: DAY, guess: 'AB', ts: T0 }).finished).toBe(false);
    expect((st.game.words.days[DAY].g || []).length).toBe(0);
    const r = solve(st, 'daily', Array(MAX_GUESSES).fill('Q'.repeat(word.length)));
    expect(r.finished).toBe(true);
    expect(r.won).toBe(false);
    expect(st.game.fish).toBe(5);
  });
  it('practice words: start, solve, start another', () => {
    const st = defaultState(T0);
    const p = startPractice(st, { seed: 'x', lectures: ['l09'], day: DAY, ts: T0 });
    expect(p.lectures[0]).toBe('l09');
    const r = solve(st, 'practice', [p.w]);
    expect(r.won).toBe(true);
    expect(st.game.fish).toBe(fishFor({ won: true, guesses: 1, clue: false, daily: false }));
    const q = startPractice(st, { seed: 'y', lectures: ['l09'], day: DAY, ts: T0 + 1 });
    if (q.w === p.w) throw new Error('same practice word twice in a row');
  });
  it('a daily word started on the phone can be finished on the laptop; stats from both add up', () => {
    const phone = defaultState(T0); phone.meta.deviceId = 'phone';
    const word = dailyRecord(phone, DAY).w;
    addGuess(phone, { mode: 'daily', day: DAY, guess: 'Z'.repeat(word.length), ts: T0 });
    const laptop = migrate(JSON.parse(JSON.stringify(phone)), T0); laptop.meta.deviceId = 'laptop';
    addGuess(laptop, { mode: 'daily', day: DAY, guess: word, ts: T0 + 5 });
    // the phone also finished a practice word meanwhile
    const p = startPractice(phone, { seed: 'p', day: DAY, ts: T0 + 1 });
    addGuess(phone, { mode: 'practice', day: DAY, guess: p.w, ts: T0 + 2 });
    const a = mergeStates(phone, laptop), b = mergeStates(laptop, phone);
    expect(a.game.words.days[DAY].done).toBe(true);
    expect(a.game.words.days[DAY].g.length).toBe(2);
    expect(totals(a.game.words).p).toBe(2);
    expect(a.game.fish).toBe(b.game.fish);
    expect(a.game.fish).toBe(phone.game.fish + laptop.game.fish);
    expect(stableStringify(wordsState(a))).toBe(stableStringify(wordsState(b)));
  });
});
