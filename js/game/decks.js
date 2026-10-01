// Question decks for Sea Lion Splash. Each deck draws from the practice generators, so questions
// are unlimited, always answer-checked, and a missed one can be rebuilt later in the Mistakes notebook.
import { makeGenerated } from '../quiz/generators.js';
import { skillStats } from '../state/progress.js';
import { plain } from '../lib/markup.js';

const NAMES_1 = ['l03-name-mc', 'l04-name-mc'];
const NAMES_2 = ['l05-name-mc', 'l06e-name-mc', 'l06h-name-mc', 'l06t-name-mc', 'l08-name-mc', 'l10-name-mc'];
const PRODUCTS = ['l04-hydrogenation', 'l04-halogenation', 'l04-hydrohalogenation', 'l04-hydration', 'l05-dehydration', 'l05-oxidation', 'l06-disulfide', 'l08-oxidation', 'l08-reduction', 'l10-neutralize'];

export const DECKS = [
  { id: 'foundations', name: 'Foundations Mix', desc: 'Lectures 1–4: the ones to rebuild', lectures: [1, 2, 3, 4], featured: true,
    gens: ['l02-fg-single', 'l02-carbonyl', 'l01-shape', 'l01-angle', ...NAMES_1, 'l03-cclass', 'l04-cistrans', 'l04-cistrans-possible', 'l02-polar', 'l02-hbond', 'l04-reagent'] },
  { id: 'families', name: 'Family Finder', desc: 'Spot the functional group', lectures: [2], gens: ['l02-fg-single', 'l02-carbonyl'] },
  { id: 'shapes', name: 'Shape Shifter', desc: 'Shapes and bond angles', lectures: [1], gens: ['l01-shape', 'l01-angle'] },
  { id: 'chains', name: 'Name That Chain', desc: 'Alkanes, alkenes and alkynes', lectures: [3, 4], gens: NAMES_1 },
  { id: 'dissolve', name: 'Like Dissolves Like', desc: 'Polarity, H-bonding, solubility', lectures: [2], gens: ['l02-polar', 'l02-hbond', 'l02-solubility'] },
  { id: 'class', name: '1°, 2° or 3°?', desc: 'Carbons, alcohols and halides', lectures: [3, 5, 6], gens: ['l03-cclass', 'l05-classify', 'l06-halide-class'] },
  { id: 'mirror', name: 'Mirror Lagoon', desc: 'Cis/trans and chirality', lectures: [4, 7], gens: ['l04-cistrans', 'l04-cistrans-possible', 'l07-chiral-yn'] },
  { id: 'names', name: 'Name Remix', desc: 'Alcohols, ethers, halides, thiols, carbonyls, acids', lectures: [5, 6, 8, 10], gens: NAMES_2 },
  { id: 'reactions', name: 'Reaction Rapids', desc: 'Predict the product or the reagent', lectures: [4, 5, 6, 8, 10], gens: [...PRODUCTS, 'l04-reagent', 'l08-oxred-classify'] },
  { id: 'acids', name: 'Acid Ocean', desc: 'pH, conjugates, acid strength, buffers', lectures: [9], gens: ['l09-acidic', 'l09-conjugate', 'l09-stronger', 'l09-identify', 'l09-buffer'] },
  { id: 'everything', name: 'Open Ocean', desc: 'Everything, tilted toward your weak spots', lectures: [],
    gens: ['l02-fg-single', 'l02-carbonyl', 'l01-shape', 'l01-angle', ...NAMES_1, ...NAMES_2, 'l03-cclass', 'l05-classify', 'l06-halide-class', 'l04-cistrans', 'l04-cistrans-possible', 'l07-chiral-yn', 'l02-polar', 'l02-hbond', 'l02-solubility', ...PRODUCTS, 'l04-reagent', 'l08-oxred-classify', 'l09-acidic', 'l09-conjugate', 'l09-stronger', 'l09-identify', 'l09-buffer'] },
];

export const deckById = (id) => DECKS.find((d) => d.id === id) || null;

const MAX_LABEL = 44; // characters; longer answers don't fit on a lane sign

// Convert a practice question into a game question with 2–3 options (one per lane), or null.
export function toGameQuestion(q, rng) {
  if (!q) return null;
  let options;
  let answer;
  if (q.type === 'tf') {
    options = [{ label: 'True' }, { label: 'False' }];
    answer = q.answer ? 0 : 1;
  } else if (q.type === 'mc' || q.type === 'struct') {
    const all = q.choices.map((c) => (typeof c === 'string' ? { label: c } : c.smiles ? { smiles: c.smiles } : { label: c.text || '' }));
    const others = rng.shuffle(all.map((_, i) => i).filter((i) => i !== q.answer)).slice(0, 2);
    const keep = q.shuffle === false && all.length <= 3 ? all.map((_, i) => i) : rng.shuffle([q.answer, ...others]);
    options = keep.map((i) => all[i]);
    answer = keep.indexOf(q.answer);
  } else {
    return null;
  }
  if (options.length < 2 || answer < 0) return null;
  const seen = new Set();
  for (const o of options) {
    const k = o.smiles ? `s:${o.smiles}` : `t:${plain(o.label)}`;
    if (seen.has(k) || (!o.smiles && (!o.label || plain(o.label).length > MAX_LABEL))) return null;
    seen.add(k);
  }
  return {
    id: q.id,
    ref: q.ref,
    skill: q.skill,
    prompt: q.prompt,
    figure: q.figure || null,
    options,
    answer,
    explain: q.explain || '',
    time: readingTime(q.prompt, options),
  };
}

// Seconds to give for a question at normal speed: longer prompts, names and structures need more.
export function readingTime(prompt, options) {
  const chars = options.reduce((s, o) => s + (o.smiles ? 18 : plain(o.label).length), 0);
  const structs = options.filter((o) => o.smiles).length;
  const t = 3.6 + chars * 0.04 + plain(prompt || '').length * 0.016 + structs * 1.0;
  return Math.max(4, Math.min(10, Math.round(t * 10) / 10));
}

// Pick the next question for a deck: weighted toward weak skills, never repeating within a run.
export function nextGameQuestion(deck, rng, state, { avoid = new Set(), now = Date.now() } = {}) {
  const weights = deck.gens.map((g) => {
    const skill = genSkill(g);
    const p = state && skill ? skillStats(state, skill, now).p : 0;
    return [g, 1 + 1.5 * (1 - p)];
  });
  for (let attempt = 0; attempt < 30; attempt++) {
    const genId = rng.weighted(weights);
    let q = null;
    try { q = makeGenerated(genId, rng.int(1, 2 ** 30)); } catch { q = null; }
    const gq = toGameQuestion(q, rng);
    if (!gq) continue;
    const sig = signature(gq);
    if (avoid.has(sig)) continue;
    avoid.add(sig);
    return gq;
  }
  return null;
}

function signature(gq) {
  const fig = gq.figure ? JSON.stringify(gq.figure) : '';
  return `${plain(gq.prompt)}|${fig}`;
}

const skillCache = new Map();
function genSkill(genId) {
  if (!skillCache.has(genId)) {
    let skill = null;
    try { const q = makeGenerated(genId, 1); skill = q && q.skill; } catch { /* ignore */ }
    skillCache.set(genId, skill);
  }
  return skillCache.get(genId);
}

// The deck that would help most right now: the lowest average mastery among decks she has
// started on (never a deck for lectures she hasn't studied yet). Foundations is always a candidate.
export function recommendedDeck(state, now = Date.now()) {
  let best = null;
  for (const d of DECKS) {
    if (d.id === 'everything') continue;
    const skills = [...new Set(d.gens.map(genSkill).filter(Boolean))];
    const touched = skills.filter((k) => state.skills[k]);
    if (!touched.length && !d.featured) continue;
    const avg = skills.reduce((s, k) => s + skillStats(state, k, now).p, 0) / skills.length;
    const score = avg - (d.featured ? 0.05 : 0);
    if (!best || score < best.score) best = { deck: d, score };
  }
  return best ? best.deck : DECKS[0];
}
