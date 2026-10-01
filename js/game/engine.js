// Sea Lion Splash — game rules, independent of drawing so they can be tested.
//
// The world scrolls right-to-left. x is a fraction of the stage width; the sea lion swims at
// PLAYER_X in one of three lanes (0 = top). Each question arrives as a set of rings, one per answer;
// when the rings reach the sea lion, the lane she is in is her answer.

export const LANES = 3;
export const PLAYER_X = 0.24;
export const SPAWN_X = 1.08;
export const CRUISE = 1.5; // seconds of fish-collecting between questions
export const MAX_LIVES = 3;
export const SPEEDS = { chill: 1.5, normal: 1, fast: 0.72 };

const CATCH = 0.045; // how close (in x) a fish must be to be caught
const MIN_TIME = 2.6; // fastest a question can arrive, in seconds

// next(): returns the next game question ({ options, answer, time, ... }) or null.
export function createRun({ rng, next, speed = 'normal', lives = MAX_LIVES }) {
  const run = {
    rng, next,
    speedMul: SPEEDS[speed] || 1,
    phase: 'play', // play | crash | over
    t: 0,
    lane: 1,
    lives,
    shield: false,
    magnet: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    fish: 0,
    correct: 0,
    pace: 1, // shrinks as she gets questions right, so the run speeds up
    speed: (SPAWN_X - PLAYER_X) / 6,
    dist: 0,
    gate: null,
    nextGateIn: 1.6,
    items: [],
    answers: [],
    lastResult: null,
  };
  spawnCruise(run);
  return run;
}

export const multiplier = (streak) => 1 + Math.min(4, Math.floor(streak / 5));

export function setLane(run, lane) {
  const l = Math.max(0, Math.min(LANES - 1, lane));
  if (l === run.lane || run.phase !== 'play') return false;
  run.lane = l;
  return true;
}
export const moveLane = (run, dir) => setLane(run, run.lane + dir);

// "I know this one": the rings rush in. Answering early earns a speed bonus.
export const DASH_TIME = 0.4;
export function dash(run) {
  const g = run.gate;
  if (!g || run.phase !== 'play' || g.dashed) return false;
  const elapsed = run.t - g.spawnT;
  if (g.time - elapsed <= DASH_TIME) return false;
  const progress = elapsed / g.time;
  g.dashed = true;
  g.bonusFrac = 1 - progress; // how much of the reading time was left
  // keep the rings where they are, then cover the rest of the way in DASH_TIME
  g.time = DASH_TIME / (1 - progress);
  g.spawnT = run.t - progress * g.time;
  g.speed = (SPAWN_X - PLAYER_X) / g.time;
  return true;
}

// Continue after the crash explanation. Returns the new phase.
export function resume(run) {
  if (run.phase === 'crash') run.phase = run.lives > 0 ? 'play' : 'over';
  return run.phase;
}

// End early (quit). Answers so far are kept.
export function endRun(run) { run.phase = 'over'; }

// Advance the world by dt seconds. Returns a list of events for sound, haptics and the UI.
export function step(run, dt) {
  const ev = [];
  if (run.phase !== 'play') return ev;
  dt = Math.min(dt, 0.05);
  run.t += dt;

  // Smoothly approach the target scroll speed (the current question's pace).
  const target = run.gate ? run.gate.speed : run.speed;
  run.speed += (target - run.speed) * Math.min(1, dt * 3);
  const dx = run.speed * dt;
  run.dist += dx;
  if (run.magnet > 0) run.magnet = Math.max(0, run.magnet - dt);

  // Fish and power-ups drift toward the sea lion.
  for (const it of run.items) {
    if (it.taken) continue;
    it.x -= dx;
    const near = Math.abs(it.x - PLAYER_X) < CATCH;
    const pulled = run.magnet > 0 && it.kind === 'fish' && it.x < PLAYER_X + 0.16 && it.x > PLAYER_X - 0.02;
    if ((near && it.lane === run.lane) || pulled) {
      it.taken = true;
      if (it.kind === 'fish') {
        run.fish++;
        run.score += 10;
        ev.push({ type: 'fish', item: it });
      } else {
        if (it.kind === 'shield') run.shield = true;
        if (it.kind === 'magnet') run.magnet = 8;
        ev.push({ type: 'pickup', item: it });
      }
    }
  }
  run.items = run.items.filter((it) => !it.taken && it.x > -0.1);

  // Questions
  if (!run.gate) {
    run.nextGateIn -= dt;
    if (run.nextGateIn <= 0) {
      const q = run.next(run.rng);
      if (!q) { run.phase = 'over'; ev.push({ type: 'over', reason: 'empty' }); return ev; }
      const lanes = assignLanes(q.options.length, run.rng);
      const time = Math.max(MIN_TIME, q.time * run.speedMul * run.pace);
      run.gate = { q, lanes, answerLane: lanes.indexOf(q.answer), spawnT: run.t, time, x: SPAWN_X, speed: (SPAWN_X - PLAYER_X) / time, baseSpeed: (SPAWN_X - PLAYER_X) / time };
      ev.push({ type: 'spawn', gate: run.gate });
    }
  } else {
    const g = run.gate;
    g.x = SPAWN_X - ((run.t - g.spawnT) / g.time) * (SPAWN_X - PLAYER_X);
    if (g.x <= PLAYER_X) decide(run, ev);
  }
  return ev;
}

function decide(run, ev) {
  const g = run.gate;
  const choice = g.lanes[run.lane]; // option index, or -1 for the blocked lane
  const ok = run.lane === g.answerLane;
  run.answers.push({ q: g.q, choice, ok, t: run.t });
  run.gate = null;
  run.speed = g.baseSpeed || g.speed; // a dash only speeds up this question
  run.nextGateIn = CRUISE;
  if (ok) {
    run.streak++;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    run.correct++;
    const mult = multiplier(run.streak);
    const bonus = g.dashed ? Math.round(g.bonusFrac * 100) : 0;
    const points = 100 * mult + bonus;
    run.score += points;
    run.pace = Math.max(0.5, run.pace * 0.955);
    run.lastResult = { ok: true, gate: g, choice };
    ev.push({ type: 'correct', gate: g, points, mult, bonus, streak: run.streak });
    spawnCruise(run);
  } else {
    run.streak = 0;
    run.pace = Math.min(1, run.pace * 1.12);
    const shielded = run.shield;
    if (shielded) run.shield = false;
    else run.lives--;
    run.lastResult = { ok: false, gate: g, choice, shielded };
    run.phase = 'crash';
    ev.push({ type: 'wrong', gate: g, choice, shielded, lives: run.lives });
    spawnCruise(run);
  }
}

// Lanes for 2 or 3 options: lanes[i] = option index in lane i, or -1 (blocked by rocks).
export function assignLanes(n, rng) {
  if (n >= LANES) return rng.shuffle([0, 1, 2]);
  const lanes = [-1, -1, -1];
  const free = rng.shuffle([0, 1, 2]).slice(0, n).sort((a, b) => a - b);
  const order = rng.shuffle([...Array(n).keys()]);
  free.forEach((lane, i) => { lanes[lane] = order[i]; });
  return lanes;
}

// A trail of fish (sometimes changing lanes) and now and then a power-up after each question.
// Fish are spaced by distance so they never bunch up, whatever the speed.
export const FISH_GAP = 0.085;
export function spawnCruise(run) {
  const r = run.rng;
  let lane = r.int(0, LANES - 1);
  const count = r.int(4, 6);
  const start = PLAYER_X + Math.max(0.12, run.speed * 0.35);
  for (let i = 0; i < count; i++) {
    if (i === Math.floor(count / 2) && r.chance(0.5)) lane = Math.max(0, Math.min(LANES - 1, lane + (r.chance(0.5) ? 1 : -1)));
    run.items.push({ kind: 'fish', x: start + i * FISH_GAP, lane, taken: false, born: run.t });
  }
  if (r.chance(0.16)) {
    const kind = !run.shield && r.chance(0.6) ? 'shield' : 'magnet';
    const pl = (lane + r.int(1, LANES - 1)) % LANES;
    run.items.push({ kind, x: start + FISH_GAP * 2, lane: pl, taken: false, born: run.t });
  }
}

// Summary for the results screen and for saving.
export function summarizeRun(run) {
  const answered = run.answers.length;
  return {
    score: run.score,
    answered,
    correct: run.correct,
    accuracy: answered ? run.correct / answered : 0,
    bestStreak: run.bestStreak,
    fish: run.fish,
    missed: run.answers.filter((a) => !a.ok),
  };
}
