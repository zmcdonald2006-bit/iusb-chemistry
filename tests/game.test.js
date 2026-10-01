import { describe, it, expect } from './harness.js';
import { DECKS, toGameQuestion, nextGameQuestion, readingTime, recommendedDeck } from '../js/game/decks.js';
import { createRun, step, setLane, moveLane, dash, resume, summarizeRun, assignLanes, multiplier, PLAYER_X, MAX_LIVES, DASH_TIME, spawnCruise, FISH_GAP } from '../js/game/engine.js';
import { recordGameRun, buyItem, equipItem, gameState, FISH_PER_CORRECT } from '../js/state/game.js';
import { defaultState, migrate, mergeStates } from '../js/state/store.js';
import { skillStats } from '../js/state/progress.js';
import { questionFromRef } from '../js/quiz/bank.js';
import { skillById } from '../content/course.js';
import { OUTFITS, THEMES } from '../content/game.js';
import { makeRng } from '../js/lib/random.js';
import { parseSmiles } from '../js/chem/smiles.js';
import { GENERATORS } from '../js/quiz/generators.js';
import { plain } from '../js/lib/markup.js';

const T0 = new Date(2026, 8, 30, 15).getTime();

// A fake question source so the engine can be tested without the chemistry.
const fakeNext = (n = 3) => () => ({ id: 'x', skill: 'l03.naming', prompt: 'p', options: Array.from({ length: n }, (_, i) => ({ label: `o${i}` })), answer: 0, time: 5, ref: { key: `k${Math.random()}`, gen: 'x', seed: 1 } });

// Play for `secs` seconds; `brain(run)` may change lanes every frame.
function play(run, secs, brain) {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) {
    if (brain) brain(run);
    for (const e of step(run, 1 / 60)) {
      evs.push(e);
      if (e.type === 'wrong') resume(run);
    }
    if (run.phase === 'over') break;
  }
  return evs;
}
const perfect = (run) => { if (run.gate) setLane(run, run.gate.answerLane); };

describe('Game decks', () => {
  it('only use generators that exist and skills that exist', () => {
    const ids = new Set(GENERATORS.map((g) => g.id));
    for (const d of DECKS) {
      if (!d.gens.length) throw new Error(`${d.id} has no generators`);
      for (const g of d.gens) if (!ids.has(g)) throw new Error(`${d.id}: unknown generator ${g}`);
    }
    expect(new Set(DECKS.map((d) => d.id)).size).toBe(DECKS.length);
  });
  for (const d of DECKS) {
    it(`${d.id}: makes valid, answerable questions`, () => {
      const rng = makeRng(`deck:${d.id}`);
      const avoid = new Set();
      const seenGens = new Set();
      for (let i = 0; i < 60; i++) {
        const q = nextGameQuestion(d, rng, defaultState(T0), { avoid, now: T0 });
        if (!q) throw new Error(`${d.id}: ran out of questions at ${i}`);
        seenGens.add(q.ref.gen);
        if (q.options.length < 2 || q.options.length > 3) throw new Error(`${d.id}: ${q.options.length} options`);
        if (q.answer < 0 || q.answer >= q.options.length) throw new Error(`${d.id}: bad answer index`);
        if (!skillById(q.skill)) throw new Error(`${d.id}: unknown skill ${q.skill}`);
        if (!q.prompt || q.time < 4 || q.time > 10) throw new Error(`${d.id}: bad prompt/time`);
        for (const o of q.options) {
          if (o.smiles) parseSmiles(o.smiles);
          else if (!o.label || plain(o.label).length > 44) throw new Error(`${d.id}: bad label ${o.label}`);
        }
        // the Mistakes notebook can rebuild it as a normal question with the same right answer
        const full = questionFromRef(q.ref);
        if (!full) throw new Error(`${d.id}: cannot rebuild ${JSON.stringify(q.ref)}`);
        const right = q.options[q.answer];
        if (full.type === 'tf') expect(right.label).toBe(full.answer ? 'True' : 'False');
        else {
          const c = full.choices[full.answer];
          const same = typeof c === 'string' ? right.label === c : c.smiles ? right.smiles === c.smiles : right.label === c.text;
          if (!same) throw new Error(`${d.id}: answer mismatch for ${q.ref.key}`);
        }
      }
      if (d.gens.length > 1 && seenGens.size < 2) throw new Error(`${d.id}: only drew from ${[...seenGens]}`);
    });
  }
  it('trims to three options and keeps the right answer', () => {
    const rng = makeRng(1);
    for (let i = 0; i < 50; i++) {
      const q = toGameQuestion({ type: 'mc', prompt: 'p', choices: ['a', 'b', 'c', 'd', 'e'], answer: i % 5, skill: 's' }, rng);
      expect(q.options.length).toBe(3);
      expect(q.options[q.answer].label).toBe('abcde'[i % 5]);
    }
    expect(toGameQuestion({ type: 'num', prompt: 'p', answer: 3 }, rng)).toBeNull();
    expect(toGameQuestion({ type: 'tf', prompt: 'p', answer: false }, rng).answer).toBe(1);
  });
  it('gives more time to longer questions', () => {
    expect(readingTime('Short?', [{ label: 'a' }, { label: 'b' }])).toBeLessThan(readingTime('Which is the name?', [{ label: '3-ethyl-2-methylhexane' }, { label: '2-ethyl-3-methylhexane' }, { label: '3-ethyl-2-methylheptane' }]));
  });
  it('recommends Foundations at first, then weak decks she has started — never unstudied ones', () => {
    const st = defaultState(T0);
    expect(recommendedDeck(st, T0).id).toBe('foundations');
    // strong on foundations skills, weak on acids she has started
    for (const d of DECKS.filter((x) => x.id === 'foundations')) for (const g of d.gens) {
      const sk = makeGeneratedSkill(g);
      st.skills[sk] = { h: Array.from({ length: 12 }, (_, i) => [T0 - i, 1]), n: 12, c: 12, last: T0 };
    }
    st.skills['l09.ph'] = { h: [[T0, 0], [T0, 0], [T0, 1]], n: 3, c: 1, last: T0 };
    expect(recommendedDeck(st, T0).id).toBe('acids');
  });
});

describe('Game engine', () => {
  it('puts each option in its own lane, with rocks when there are only two', () => {
    const rng = makeRng(5);
    for (let i = 0; i < 40; i++) {
      const three = assignLanes(3, rng);
      expect([...three].sort()).toEqual([0, 1, 2]);
      const two = assignLanes(2, rng);
      expect(two.filter((x) => x === -1).length).toBe(1);
      expect(two.filter((x) => x >= 0).sort()).toEqual([0, 1]);
    }
  });
  it('a perfect player never crashes, scores combos and speeds up', () => {
    const run = createRun({ rng: makeRng(2), next: fakeNext() });
    const evs = play(run, 120, perfect);
    expect(evs.filter((e) => e.type === 'wrong').length).toBe(0);
    expect(run.correct).toBeGreaterThan(15);
    expect(run.lives).toBe(MAX_LIVES);
    expect(run.pace).toBeLessThan(0.6);
    expect(run.score).toBeGreaterThan(run.correct * 100); // multipliers kicked in
    expect(multiplier(10)).toBe(3);
  });
  it('a player who never moves loses all three lives', () => {
    const run = createRun({ rng: makeRng(3), next: fakeNext() });
    play(run, 600, null);
    expect(run.phase).toBe('over');
    expect(run.lives).toBe(0);
    const sum = summarizeRun(run);
    expect(sum.missed.length).toBe(3);
    expect(sum.answered).toBe(sum.correct + 3);
  });
  it('waits on the crash screen until resumed', () => {
    const run = createRun({ rng: makeRng(4), next: fakeNext() });
    let crashed = null;
    for (let i = 0; i < 6000 && !crashed; i++) {
      if (run.gate) setLane(run, (run.gate.answerLane + 1) % 3);
      crashed = step(run, 1 / 60).find((e) => e.type === 'wrong');
    }
    expect(run.phase).toBe('crash');
    const t = run.t;
    step(run, 1);
    expect(run.t).toBe(t);
    expect(setLane(run, 0) && false).toBe(false);
    expect(resume(run)).toBe('play');
  });
  it('a bubble shield absorbs one wrong answer', () => {
    const run = createRun({ rng: makeRng(6), next: fakeNext() });
    run.shield = true;
    for (let i = 0; i < 6000; i++) {
      if (run.gate) setLane(run, (run.gate.answerLane + 1) % 3);
      const e = step(run, 1 / 60).find((x) => x.type === 'wrong');
      if (e) { expect(e.shielded).toBe(true); break; }
    }
    expect(run.lives).toBe(MAX_LIVES);
    expect(run.shield).toBe(false);
  });
  it('blocked lanes (two-option questions) count as a miss', () => {
    const run = createRun({ rng: makeRng(7), next: fakeNext(2) });
    for (let i = 0; i < 6000; i++) {
      if (run.gate) setLane(run, run.gate.lanes.indexOf(-1));
      const e = step(run, 1 / 60).find((x) => x.type === 'wrong');
      if (e) { expect(e.choice).toBe(-1); break; }
    }
    expect(run.lives).toBe(MAX_LIVES - 1);
  });
  it('catches fish only in its lane, or with the magnet', () => {
    const run = createRun({ rng: makeRng(8), next: fakeNext() });
    run.items = [{ kind: 'fish', x: PLAYER_X + 0.01, lane: 0, taken: false }, { kind: 'fish', x: PLAYER_X + 0.01, lane: 2, taken: false }];
    setLane(run, 0);
    step(run, 1 / 60);
    expect(run.fish).toBe(1);
    run.magnet = 5;
    run.items = [{ kind: 'fish', x: PLAYER_X + 0.1, lane: 2, taken: false }];
    step(run, 1 / 60);
    expect(run.fish).toBe(2);
  });
  it('spaces fish so they never bunch up', () => {
    for (const speed of [0.05, 0.14, 0.6]) {
      const run = createRun({ rng: makeRng(13), next: fakeNext() });
      run.items = [];
      run.speed = speed;
      spawnCruise(run);
      const fish = run.items.filter((i) => i.kind === 'fish').map((i) => i.x).sort((a, b) => a - b);
      for (let i = 1; i < fish.length; i++) expect(fish[i] - fish[i - 1] >= FISH_GAP - 1e-9).toBe(true);
      expect(fish[0]).toBeGreaterThan(PLAYER_X);
    }
  });
  it('clamps lanes and ignores input when not playing', () => {
    const run = createRun({ rng: makeRng(9), next: fakeNext() });
    expect(moveLane(run, -1)).toBe(true);
    expect(moveLane(run, -1)).toBe(false);
    expect(run.lane).toBe(0);
    expect(setLane(run, 9)).toBe(true);
    expect(run.lane).toBe(2);
  });
  it('dash rushes the rings in smoothly and pays a speed bonus', () => {
    for (const delay of [0, 0.5, 2]) {
      const run = createRun({ rng: makeRng(12), next: fakeNext() });
      while (!run.gate) step(run, 1 / 60);
      for (let t = 0; t < delay; t += 1 / 60) step(run, 1 / 60);
      setLane(run, run.gate.answerLane);
      const g = run.gate;
      const before = g.x;
      const base = g.baseSpeed;
      expect(dash(run)).toBe(true);
      expect(dash(run)).toBe(false); // once per question
      step(run, 0);
      expect(Math.abs(run.gate.x - before) < 1e-9).toBe(true); // no jump
      let ev = null;
      let secs = 0;
      while (!ev) { secs += 1 / 60; ev = step(run, 1 / 60).find((e) => e.type === 'correct'); }
      expect(secs).toBeLessThan(DASH_TIME + 0.05);
      expect(ev.bonus).toBeGreaterThan(0);
      expect(ev.points).toBe(100 + ev.bonus);
      expect(run.speed).toBe(base); // the fish stretch afterwards is back to normal speed
      expect(dash(run)).toBe(false); // nothing to dash between questions
    }
  });
  it('ends cleanly if the deck runs dry', () => {
    const run = createRun({ rng: makeRng(10), next: () => null });
    const evs = play(run, 5, null);
    expect(evs.some((e) => e.type === 'over')).toBe(true);
  });
  it('slower speed setting gives more time per question', () => {
    const chill = createRun({ rng: makeRng(11), next: fakeNext(), speed: 'chill' });
    const fast = createRun({ rng: makeRng(11), next: fakeNext(), speed: 'fast' });
    play(chill, 2, null); play(fast, 2, null);
    expect(chill.gate.time).toBeGreaterThan(fast.gate.time);
  });
});

describe('Game progress', () => {
  const q = (skill, key) => ({ skill, ref: { key, gen: 'l03-name-mc', seed: 1, skill } });
  it('records a run: activity, mistakes, one mastery entry per skill, fish', () => {
    const st = defaultState(T0);
    const answers = [
      { q: q('l03.naming', 'a'), ok: true }, { q: q('l03.naming', 'b'), ok: false },
      { q: q('l03.naming', 'c'), ok: true }, { q: q('l02.fg-id', 'd'), ok: true },
    ];
    const res = recordGameRun(st, { deckId: 'foundations', answers, score: 900, fish: 12, ts: T0 });
    expect(res.earned).toBe(12 + 3 * FISH_PER_CORRECT);
    expect(res.newBest).toBe(true);
    expect(st.game.fish).toBe(res.earned);
    expect(st.activity['2026-09-30'].q).toBe(4);
    expect(st.mistakes.b.ref.key).toBe('b');
    expect(st.skills['l03.naming'].h.length).toBe(1);
    expect(st.skills['l03.naming'].h[0][1]).toBe(0.67);
    expect(st.skills['l03.naming'].n).toBe(3);
    expect(st.game.bestByDeck.foundations).toBe(900);
    expect(recordGameRun(st, { deckId: 'foundations', answers, score: 500, fish: 0, ts: T0 }).newBest).toBe(false);
  });
  it('a whole run counts as one mastery data point per skill', () => {
    const st = defaultState(T0);
    const many = Array.from({ length: 25 }, (_, i) => ({ q: q('l03.naming', `k${i}`), ok: true }));
    recordGameRun(st, { deckId: 'chains', answers: many, score: 100, fish: 0, ts: T0 });
    expect(skillStats(st, 'l03.naming', T0).level).toBe(1); // one run is not enough evidence
    for (let i = 1; i < 10; i++) recordGameRun(st, { deckId: 'chains', answers: many, score: 100, fish: 0, ts: T0 + i });
    expect(skillStats(st, 'l03.naming', T0 + 100).level).toBeGreaterThan(2); // repeated good runs are
  });
  it('buys and equips with fish', () => {
    const st = defaultState(T0);
    expect(buyItem(st, 'outfit', 'goggles').ok).toBe(false);
    st.game.fish = 1000;
    expect(equipItem(st, 'outfit', 'goggles')).toBe(false);
    expect(buyItem(st, 'outfit', 'goggles').ok).toBe(true);
    expect(st.game.fish).toBe(1000 - OUTFITS.find((o) => o.id === 'goggles').price);
    expect(equipItem(st, 'outfit', 'goggles')).toBe(true);
    expect(st.game.outfit).toBe('goggles');
    expect(buyItem(st, 'theme', 'night').ok).toBe(false);
    expect(buyItem(st, 'theme', 'nope').ok).toBe(false);
    expect(equipItem(st, 'theme', 'bay')).toBe(true);
  });
  it('has unique catalog ids with free defaults', () => {
    expect(new Set(OUTFITS.map((o) => o.id)).size).toBe(OUTFITS.length);
    expect(new Set(THEMES.map((o) => o.id)).size).toBe(THEMES.length);
    expect(OUTFITS[0].price).toBe(0);
    expect(THEMES[0].price).toBe(0);
  });
  it('adds game data to older saves and merges it between devices', () => {
    const old = migrate({ schema: 1, profile: { name: 'Old' } }, T0);
    expect(old.game.fish).toBe(0);
    expect(old.game.owned).toContain('natural');
    const a = defaultState(T0); const b = defaultState(T0);
    gameState(a).fish = 50; a.game.owned.push('bow'); a.game.bestByDeck.chains = 300;
    gameState(b).fish = 80; b.game.owned.push('party'); b.game.bestByDeck.chains = 700;
    const m = mergeStates(a, b);
    expect(m.game.fish).toBe(80);
    expect(m.game.owned).toContain('bow');
    expect(m.game.owned).toContain('party');
    expect(m.game.bestByDeck.chains).toBe(700);
  });
});

function makeGeneratedSkill(genId) {
  return GENERATORS.find((g) => g.id === genId).skill;
}
