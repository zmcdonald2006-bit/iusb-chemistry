// Practice-session planning. Pure functions over the saved state, so they're unit tested.
import { questionsForSkill, questionFromRef } from './bank.js';
import { generatorsForSkill } from './generators.js';
import { skillStats, openMistakes } from '../state/progress.js';
import { makeRng } from '../lib/random.js';
import { dayKey } from '../state/store.js';

export const MODES = {
  practice: { label: 'Practice', feedback: true },
  drill: { label: 'Skill drill', feedback: true },
  mixed: { label: 'Mixed review', feedback: true },
  mistakes: { label: 'Fix mistakes', feedback: true },
  exam: { label: 'Practice exam', feedback: false },
};

function newId(now) {
  return `s${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// Choose `count` question references for the given skills.
export function pickItems(state, skills, count, { seed = Date.now(), now = Date.now(), avoid = [], spread = false } = {}) {
  const rng = makeRng(`plan:${seed}`);
  const used = new Set(avoid);
  const recentBySkill = new Map();
  const weights = new Map(skills.map((sid) => {
    const st = skillStats(state, sid, now);
    return [sid, st.n === 0 ? 1 : Math.max(0.25, 1.15 - st.p)];
  }));
  const items = [];
  let lastSkill = null;
  let lastGen = null;
  for (let i = 0; i < count; i++) {
    let sid;
    if (spread) sid = skills[i % skills.length];
    else {
      const pairs = skills.map((s) => [s, (weights.get(s) || 0.3) * (s === lastSkill && skills.length > 1 ? 0.25 : 1) / (1 + (recentBySkill.get(s) || 0) * 0.35)]);
      sid = rng.weighted(pairs);
    }
    recentBySkill.set(sid, (recentBySkill.get(sid) || 0) + 1);
    lastSkill = sid;
    const authored = questionsForSkill(sid).filter((q) => !used.has(q.id));
    const gens = generatorsForSkill(sid);
    const unseen = authored.filter((q) => !state.questions[q.id]);
    const pAuthored = !gens.length ? 1 : unseen.length ? 0.55 : authored.length ? 0.3 : 0;
    let ref = null;
    if (authored.length && rng.next() < pAuthored) {
      const rank = (q) => {
        const qs = state.questions[q.id];
        if (!qs) return 0;
        if (!qs.lastOk) return 1;
        return 2 + Math.min(1, (qs.last || 0) / now);
      };
      const sorted = [...authored].sort((a, b) => rank(a) - rank(b));
      const bestRank = Math.floor(rank(sorted[0]));
      const top = sorted.filter((q) => Math.floor(rank(q)) === bestRank);
      const q = rng.pick(top);
      used.add(q.id);
      ref = { key: `q:${q.id}`, id: q.id };
    } else if (gens.length) {
      let g = rng.pick(gens);
      if (gens.length > 1 && g.id === lastGen) g = rng.pick(gens.filter((x) => x.id !== lastGen));
      lastGen = g.id;
      const s = `${seed}:${i}:${rng.int(0, 1e9)}`;
      ref = { key: `g:${g.id}:${s}:${sid}`, gen: g.id, seed: s, skill: sid };
    } else if (authored.length === 0 && questionsForSkill(sid).length) {
      // everything used already: allow repeats
      const q = rng.pick(questionsForSkill(sid));
      ref = { key: `q:${q.id}`, id: q.id };
    }
    if (ref) items.push({ ref, skill: sid });
  }
  return items;
}

export function createSession(state, { mode, title, subtitle = '', skills = [], lectures = [], count = 10, timeLimit = null, origin = '#/practice', now = Date.now(), seed = now }) {
  let items;
  if (mode === 'mistakes') {
    items = openMistakes(state).sort((a, b) => (a.lastWrong || 0) - (b.lastWrong || 0)).slice(0, count).map((m) => ({ ref: m.ref, skill: m.skill }));
  } else {
    items = pickItems(state, skills, count, { seed, now, spread: mode === 'exam' });
  }
  return {
    id: newId(now), mode, title, subtitle, skills, lectures, items, index: 0, answers: [],
    startedAt: now, endedAt: null, timeLimit, target: count, origin, day: dayKey(now),
  };
}

// Add more questions to an open-ended drill.
export function extendSession(state, session, more = 5, now = Date.now()) {
  const avoid = session.items.filter((it) => it.ref.id).map((it) => it.ref.id);
  const extra = pickItems(state, session.skills, more, { seed: now, now, avoid });
  session.items.push(...extra);
  session.target += extra.length;
  return session;
}

export function currentQuestion(session) {
  while (session.index < session.items.length) {
    const it = session.items[session.index];
    const q = questionFromRef(it.ref);
    if (q) return q;
    session.items.splice(session.index, 1); // content changed and the question no longer exists
  }
  return null;
}

export function summarize(session) {
  const total = session.answers.length;
  const correct = session.answers.filter((a) => a.ok).length;
  const bySkill = new Map();
  for (const a of session.answers) {
    const s = bySkill.get(a.skill) || { skill: a.skill, total: 0, correct: 0 };
    s.total++;
    if (a.ok) s.correct++;
    bySkill.set(a.skill, s);
  }
  const secs = Math.round(session.answers.reduce((acc, a) => acc + Math.min(a.ms || 0, 300000), 0) / 1000);
  return { total, correct, pct: total ? correct / total : 0, bySkill: [...bySkill.values()].sort((a, b) => a.correct / a.total - b.correct / b.total), secs };
}

// Compact record for history (no raw responses).
export function sessionRecord(session) {
  const s = summarize(session);
  return {
    id: session.id, mode: session.mode, title: session.title, startedAt: session.startedAt, endedAt: session.endedAt || Date.now(),
    lectures: session.lectures, total: s.total, correct: s.correct, secs: s.secs,
    results: session.answers.map((a) => ({ k: a.ref.key, s: a.skill, ok: a.ok ? 1 : 0 })),
  };
}
