// Random (seeded) molecule generator for unlimited practice. Every molecule it returns
// has been named by the namer, so answers are always computed, never guessed.
//
// Molecules are described by a small "spec" { n, subs, bonds, ring } that can be mutated to
// make believable wrong answers (moved substituent, chain one carbon longer, ...).
import { nameCompound } from './namer.js';
import { canonicalKey } from './analyze.js';

// Build a chain (or ring) SMILES. subs[i] (1-based) = list of fragments; bonds[i] = order of i–(i+1).
export function chainSmiles(n, subs = {}, bonds = {}, ring = false) {
  let s = '';
  for (let i = 1; i <= n; i++) {
    s += 'C';
    if (ring && i === 1) s += '1';
    for (const f of subs[i] || []) s += `(${f})`;
    if (i < n) s += bonds[i] === 2 ? '=' : bonds[i] === 3 ? '#' : '';
    if (ring && i === n) s += (bonds[n] === 2 ? '=' : '') + '1';
  }
  return s;
}

export function specSmiles(spec) {
  return spec.smiles || chainSmiles(spec.n, spec.subs, spec.bonds, spec.ring);
}

const ALKYL = { methyl: 'C', ethyl: 'CC', propyl: 'CCC', isopropyl: 'C(C)C' };
const HALOGEN = ['Cl', 'Br', 'F', 'I'];

function addSub(subs, pos, frag) {
  (subs[pos] = subs[pos] || []).push(frag);
}

function subCount(subs, pos) { return (subs[pos] || []).length; }

function alkylSubs(r, n, subs, count, { avoid = [], allowTrap = false, maxPerCarbon = 2 } = {}) {
  let tries = 0;
  let placed = 0;
  while (placed < count && tries++ < 40) {
    let pos = r.int(2, n - 1);
    let type = r.weighted([['methyl', 6], ['ethyl', 3], ['isopropyl', n >= 7 ? 1 : 0]]);
    if (allowTrap && r.chance(0.15)) { pos = r.pick([2, n - 1]); type = 'ethyl'; }
    if (type !== 'methyl' && (pos < 3 || pos > n - 2) && !allowTrap) type = 'methyl';
    if (type === 'isopropyl' && (pos < 4 || pos > n - 3)) type = 'methyl';
    if (avoid.includes(pos) || subCount(subs, pos) >= maxPerCarbon) continue;
    addSub(subs, pos, ALKYL[type]);
    placed++;
  }
}

export function named(spec) {
  const smiles = specSmiles(spec);
  const r = nameCompound(smiles);
  return r ? { smiles, name: r.name, info: r, spec } : null;
}

const S = (n, subs = {}, bonds = {}, ring = false) => named({ n, subs, bonds, ring });

// Each kind returns { smiles, name, info, spec } or null (caller retries).
export const KINDS = {
  alkane(r) {
    const n = r.int(4, 8);
    const subs = {};
    alkylSubs(r, n, subs, r.weighted([[1, 5], [2, 4], [3, 2]]), { allowTrap: true });
    return S(n, subs);
  },
  cycloalkane(r) {
    const n = r.weighted([[5, 4], [6, 5], [4, 1], [3, 1], [7, 1]]);
    const subs = {};
    const k = r.weighted([[1, 3], [2, 4]]);
    const types = ['C', 'CC', 'Cl', 'Br'];
    addSub(subs, 1, r.pick(types));
    if (k === 2) addSub(subs, r.int(2, Math.floor(n / 2) + 1), r.pick(types));
    return S(n, subs, {}, true);
  },
  haloalkane(r) {
    const n = r.int(2, 7);
    const subs = {};
    const xs = r.weighted([[1, 5], [2, 3]]);
    for (let i = 0; i < xs; i++) addSub(subs, r.int(1, n), r.pick(HALOGEN));
    if (n >= 4 && r.chance(0.6)) alkylSubs(r, n, subs, 1);
    return S(n, subs);
  },
  alkene(r) {
    const n = r.int(3, 7);
    const pos = r.int(1, n - 1);
    const subs = {};
    if (n >= 4) alkylSubs(r, n, subs, r.int(0, 2));
    return S(n, subs, { [pos]: 2 });
  },
  diene(r) {
    const n = r.int(4, 7);
    const p1 = r.int(1, n - 3);
    const p2 = r.int(p1 + 2, n - 1);
    const subs = {};
    if (n >= 5 && r.chance(0.5)) alkylSubs(r, n, subs, 1);
    return S(n, subs, { [p1]: 2, [p2]: 2 });
  },
  alkyne(r) {
    const n = r.int(3, 8);
    const pos = r.int(1, n - 1);
    const subs = {};
    if (n >= 5) alkylSubs(r, n, subs, r.int(0, 2), { avoid: [pos, pos + 1] });
    return S(n, subs, { [pos]: 3 });
  },
  cycloalkene(r) {
    const n = r.weighted([[5, 4], [6, 5]]);
    const subs = {};
    const k = r.int(0, 2);
    for (let i = 0; i < k; i++) addSub(subs, r.int(1, n), r.pick(['C', 'C', 'CC', 'Cl']));
    return S(n, subs, { 1: 2 }, true);
  },
  alcohol(r) {
    const n = r.int(2, 8);
    const pos = r.int(1, Math.max(1, Math.ceil(n / 2)));
    const subs = {};
    addSub(subs, pos, 'O');
    if (n >= 4) alkylSubs(r, n, subs, r.int(0, 2));
    if (pos > 1 && r.chance(0.2)) addSub(subs, pos, 'C'); // occasional 3° alcohol
    return S(n, subs);
  },
  diol(r) {
    const n = r.int(2, 5);
    const subs = {};
    const a = r.int(1, n - 1);
    const b = r.int(a + 1, n);
    addSub(subs, a, 'O');
    addSub(subs, b, 'O');
    return S(n, subs);
  },
  cycloalcohol(r) {
    const n = r.weighted([[5, 4], [6, 5], [4, 1]]);
    const subs = { 1: ['O'] };
    if (r.chance(0.7)) addSub(subs, r.int(2, 3), r.pick(['C', 'CC', 'Cl', 'Br']));
    return S(n, subs, {}, true);
  },
  ether(r) {
    const r1 = r.pick(['C', 'CC', 'CCC', 'C(C)C']);
    const n = r.int(2, 7);
    const pos = n <= 2 ? 1 : r.int(1, Math.ceil(n / 2));
    const subs = {};
    addSub(subs, pos, 'O' + r1);
    if (n >= 5 && r.chance(0.4)) alkylSubs(r, n, subs, 1, { avoid: [pos] });
    return S(n, subs);
  },
  simpleEther(r) {
    const groups = ['C', 'CC', 'CCC', 'C(C)C', 'CCCC'];
    // fragments are written root-first, so hang both groups off the oxygen
    return named({ smiles: `O(${r.pick(groups)})${r.pick(groups)}` });
  },
  thiol(r) {
    const n = r.int(1, 8);
    const pos = r.int(1, Math.max(1, Math.ceil(n / 2)));
    const subs = {};
    addSub(subs, pos, 'S');
    if (n >= 4) alkylSubs(r, n, subs, r.int(0, 1), { avoid: [pos] });
    return S(n, subs);
  },
  aldehyde(r) {
    const n = r.int(1, 8);
    const subs = { 1: ['=O'] };
    if (n >= 4) alkylSubs(r, n, subs, r.int(0, 2));
    return S(n, subs);
  },
  ketone(r) {
    const n = r.int(3, 8);
    const pos = r.int(2, n - 1);
    const subs = { [pos]: ['=O'] };
    if (n >= 5) alkylSubs(r, n, subs, r.int(0, 2), { avoid: [pos] });
    return S(n, subs);
  },
  cycloketone(r) {
    const n = r.weighted([[5, 4], [6, 5]]);
    const subs = { 1: ['=O'] };
    if (r.chance(0.7)) addSub(subs, r.int(2, 3), r.pick(['C', 'CC']));
    if (r.chance(0.3)) addSub(subs, r.int(3, 4), r.pick(['C', 'Cl']));
    return S(n, subs, {}, true);
  },
  acid(r) {
    const n = r.int(1, 8);
    const subs = { 1: ['=O', 'O'] };
    if (n >= 3) alkylSubs(r, n, subs, r.int(0, 2), { avoid: [1] });
    if (n >= 3 && r.chance(0.15)) addSub(subs, 2, 'O'); // alpha-hydroxy acid
    return S(n, subs);
  },
};

// Groups of kinds by lecture topic
export const KIND_SETS = {
  alkanes: ['alkane', 'alkane', 'alkane', 'cycloalkane'],
  unsaturated: ['alkene', 'alkene', 'alkyne', 'diene', 'cycloalkene'],
  alcohols: ['alcohol', 'alcohol', 'alcohol', 'diol', 'cycloalcohol'],
  l6: ['ether', 'haloalkane', 'haloalkane', 'thiol'],
  carbonyl: ['aldehyde', 'ketone', 'ketone', 'cycloketone'],
  acids: ['acid'],
};

export function randomMolecule(r, kind, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    const m = KINDS[kind](r);
    if (m) return m;
  }
  return null;
}

// ---- Mutations for believable wrong answers ------------------------------------------------

function cloneSpec(spec) {
  const subs = {};
  for (const [k, v] of Object.entries(spec.subs || {})) subs[k] = [...v];
  return { n: spec.n, subs, bonds: { ...(spec.bonds || {}) }, ring: !!spec.ring };
}

const SWAPS = { C: ['CC'], CC: ['C', 'CCC'], CCC: ['CC', 'C(C)C'], 'C(C)C': ['CCC'], Cl: ['Br'], Br: ['Cl'], F: ['Cl'], I: ['Br'], O: ['S'], S: ['O'] };

export function mutateSpec(spec, r) {
  const m = cloneSpec(spec);
  const positions = Object.keys(m.subs).map(Number).filter((p) => m.subs[p].length);
  const op = r.pick(['move', 'move', 'length', 'swap', 'bond']);
  if (op === 'move' && positions.length) {
    const from = r.pick(positions);
    const idx = r.int(0, m.subs[from].length - 1);
    const frag = m.subs[from][idx];
    if (frag === '=O' && m.subs[from].includes('O') && m.subs[from].length === 2 && from === 1) return null; // don't split COOH
    const to = r.int(1, m.n);
    if (to === from) return null;
    m.subs[from].splice(idx, 1);
    addSub(m.subs, to, frag);
  } else if (op === 'length') {
    const delta = r.pick([-1, 1]);
    if (m.n + delta < 2) return null;
    if (delta < 0 && (m.subs[m.n] || []).length) return null;
    if (delta < 0 && m.bonds[m.n - 1]) return null;
    m.n += delta;
  } else if (op === 'swap' && positions.length) {
    const p = r.pick(positions);
    const idx = r.int(0, m.subs[p].length - 1);
    const opts = SWAPS[m.subs[p][idx]];
    if (!opts) return null;
    m.subs[p][idx] = r.pick(opts);
  } else if (op === 'bond') {
    const keys = Object.keys(m.bonds).map(Number);
    if (!keys.length) return null;
    const k = r.pick(keys);
    const order = m.bonds[k];
    delete m.bonds[k];
    const to = r.int(1, m.ring ? m.n : m.n - 1);
    m.bonds[to] = order;
  } else return null;
  return named(m);
}

// Up to `count` distinct molecules that differ from `base` (a generated molecule).
export function nearMisses(base, r, count = 3, fallbackKind = null) {
  const seen = new Set([canonicalKey(base.smiles)]);
  const out = [];
  for (let tries = 0; tries < 80 && out.length < count; tries++) {
    let cand = base.spec && !base.spec.smiles ? mutateSpec(base.spec, r) : null;
    if (!cand && fallbackKind) cand = randomMolecule(r, fallbackKind, 5);
    if (!cand) continue;
    const k = canonicalKey(cand.smiles);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(cand);
  }
  return out;
}
