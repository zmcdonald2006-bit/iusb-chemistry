// Saving Sea Lion Splash runs, and the wardrobe (bought with the shared fish wallet, see store.js).
import { dayKey, noteMistake, defaultGame, earnFish, fishBalance } from './store.js';
import { OUTFITS, THEMES } from '../../content/game.js';

const HISTORY_LIMIT = 40;
export const FISH_PER_CORRECT = 3;

export function gameState(st) {
  if (!st.game) st.game = defaultGame();
  return st.game;
}

// Fish earned for a run: every fish caught, plus a few per correct answer.
export const fishEarned = (sum) => sum.fish + sum.correct * FISH_PER_CORRECT;

// Save a finished (or quit) run. Each answer counts toward today's goal and the Mistakes notebook.
// For mastery, a run counts once per skill, scored by accuracy — so quick game answers count, but
// can't outweigh careful quiz answers.
export function recordGameRun(st, { deckId, answers, score, fish, ts }) {
  const g = gameState(st);
  const day = dayKey(ts);
  const act = st.activity[day] || (st.activity[day] = {});
  const bySkill = new Map();
  for (const a of answers) {
    act.q = (act.q || 0) + 1;
    if (a.ok) act.c = (act.c || 0) + 1;
    if (a.q.ref) noteMistake(st, { ref: a.q.ref, skill: a.q.skill, ok: a.ok, ts });
    const s = bySkill.get(a.q.skill) || { n: 0, c: 0 };
    s.n++;
    if (a.ok) s.c++;
    bySkill.set(a.q.skill, s);
  }
  for (const [skill, { n, c }] of bySkill) {
    const sk = st.skills[skill] || (st.skills[skill] = { h: [], n: 0, c: 0, last: 0 });
    sk.h.push([ts, Math.round((c / n) * 100) / 100]);
    if (sk.h.length > HISTORY_LIMIT) sk.h.splice(0, sk.h.length - HISTORY_LIMIT);
    sk.n += n;
    sk.c += c;
    sk.last = ts;
  }
  const correct = answers.filter((a) => a.ok).length;
  const earned = answers.length ? fish + correct * FISH_PER_CORRECT : fish;
  const newBest = score > (g.bestByDeck[deckId] || 0) && score > 0;
  earnFish(st, earned);
  g.runs++;
  g.answered += answers.length;
  g.correct += correct;
  g.best = Math.max(g.best, score);
  g.bestByDeck[deckId] = Math.max(g.bestByDeck[deckId] || 0, score);
  g.lastDeck = deckId;
  return { earned, newBest };
}

const catalog = (kind) => (kind === 'theme' ? THEMES : OUTFITS);

export function buyItem(st, kind, id) {
  const g = gameState(st);
  const item = catalog(kind).find((x) => x.id === id);
  if (!item) return { ok: false, error: 'Unknown item.' };
  if (g.owned.includes(id)) return { ok: true, already: true };
  g.fish = fishBalance(g);
  if (g.fish < item.price) return { ok: false, error: `You need ${item.price - g.fish} more fish.` };
  g.owned.push(id);
  g.owned.sort();
  g.fish = fishBalance(g); // spending is the price of what's owned
  return { ok: true };
}

export function equipItem(st, kind, id) {
  const g = gameState(st);
  if (!g.owned.includes(id) || !catalog(kind).some((x) => x.id === id)) return false;
  if (kind === 'theme') g.theme = id;
  else g.outfit = id;
  return true;
}
