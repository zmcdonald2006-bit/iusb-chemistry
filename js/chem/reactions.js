// Reaction engine for the reactions taught in C102. Every function takes SMILES and
// returns SMILES (or null when there is no reaction), so products can be drawn and compared.
import { parseSmiles, cloneMol, addAtomTo, neighbors, bondBetween, computeHydrogens, toSmiles, removeAtoms } from './smiles.js';
import { functionalGroups, canonicalKey } from './analyze.js';

function prep(input) {
  const m = cloneMol(typeof input === 'string' ? parseSmiles(input) : input);
  m.stereo = [];
  return m;
}

function finish(m) {
  computeHydrogens(m);
  return toSmiles(m);
}

function alkeneBonds(m) {
  return m.bonds.filter((b) => b.order === 2 && !b.aromatic && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C');
}

function uniqueSmiles(list) {
  const seen = new Set();
  const out = [];
  for (const s of list) {
    if (!s) continue;
    const k = canonicalKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

// ---- Alkene addition reactions (Lecture 4) --------------------------------------------

export function hydrogenate(smiles) {
  const m = prep(smiles);
  const targets = m.bonds.filter((b) => (b.order === 2 || b.order === 3) && !b.aromatic && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C');
  if (!targets.length) return null;
  targets.forEach((b) => { b.order = 1; });
  return finish(m);
}

export function halogenate(smiles, X = 'Br') {
  const m = prep(smiles);
  const [b] = alkeneBonds(m);
  if (!b) return null;
  b.order = 1;
  addAtomTo(m, X, b.a);
  addAtomTo(m, X, b.b);
  return finish(m);
}

// Adds H–Y across the first C=C. Markovnikov: H goes to the carbon that already has more
// H's, so Y bonds to the more substituted carbon.
function addHY(smiles, Y) {
  const m0 = prep(smiles);
  const [b0] = alkeneBonds(m0);
  if (!b0) return null;
  const hA = m0.atoms[b0.a].h, hB = m0.atoms[b0.b].h;
  const make = (yOn) => {
    const m = prep(smiles);
    const b = alkeneBonds(m)[0];
    b.order = 1;
    addAtomTo(m, Y, yOn === 'a' ? b.a : b.b);
    return finish(m);
  };
  const onA = make('a'), onB = make('b');
  const same = canonicalKey(onA) === canonicalKey(onB);
  if (same) return { major: onA, minor: null, symmetric: true };
  if (hA === hB) return { major: null, minor: null, both: [onA, onB], symmetric: false, tie: true };
  // Y on the carbon with fewer H's
  const major = hA < hB ? onA : onB;
  const minor = hA < hB ? onB : onA;
  return { major, minor, symmetric: false };
}

export function hydrohalogenate(smiles, X = 'Cl') { return addHY(smiles, X); }
export function hydrate(smiles) { return addHY(smiles, 'O'); }

// ---- Alcohol reactions (Lecture 5) ---------------------------------------------------------

function alcoholSite(m) {
  const g = functionalGroups(m).find((f) => f.type === 'alcohol');
  if (!g) return null;
  return { o: g.atoms[0], c: g.atoms[1] };
}

export function alcoholClass(smiles) {
  const m = prep(smiles);
  const s = alcoholSite(m);
  if (!s) return null;
  return neighbors(m, s.c).filter((x) => m.atoms[x].el === 'C').length;
}

// Dehydration (H2SO4): lose H2O, form C=C. Zaitsev: the major alkene has more alkyl groups on C=C.
export function dehydrate(smiles) {
  const m0 = prep(smiles);
  const s = alcoholSite(m0);
  if (!s) return null;
  const betas = neighbors(m0, s.c).filter((x) => m0.atoms[x].el === 'C' && m0.atoms[x].h >= 1);
  if (!betas.length) return null;
  const options = betas.map((beta) => {
    const m = prep(smiles);
    const bond = bondBetween(m, s.c, beta);
    bond.order = 2;
    const out = removeAtoms(m, [s.o]);
    const newC = s.c > s.o ? s.c - 1 : s.c;
    const newBeta = beta > s.o ? beta - 1 : beta;
    const subs = neighbors(out, newC).filter((x) => x !== newBeta && out.atoms[x].el === 'C').length
      + neighbors(out, newBeta).filter((x) => x !== newC && out.atoms[x].el === 'C').length;
    return { smiles: finish(out), subs };
  });
  const uniq = [];
  for (const o of options) if (!uniq.some((u) => canonicalKey(u.smiles) === canonicalKey(o.smiles))) uniq.push(o);
  uniq.sort((a, b) => b.subs - a.subs);
  const tie = uniq.length > 1 && uniq[0].subs === uniq[1].subs;
  return { major: tie ? null : uniq[0].smiles, products: uniq.map((u) => u.smiles), tie };
}

// Oxidation with [O] (e.g. K2Cr2O7). 1° -> aldehyde -> carboxylic acid; 2° -> ketone; 3° -> none.
export function oxidizeAlcohol(smiles) {
  const m = prep(smiles);
  const s = alcoholSite(m);
  if (!s) return null;
  const carbonNbrs = neighbors(m, s.c).filter((x) => m.atoms[x].el === 'C').length;
  if (m.atoms[s.c].h === 0) return { klass: 3, first: null, final: null };
  const klass = carbonNbrs <= 1 ? 1 : 2;
  bondBetween(m, s.c, s.o).order = 2;
  const first = finish(m);
  let final = first;
  if (klass === 1) final = oxidizeAldehyde(first);
  return { klass, first, final };
}

// ---- Aldehydes & ketones (Lecture 8) ---------------------------------------------------------

export function oxidizeAldehyde(smiles) {
  const m = prep(smiles);
  const g = functionalGroups(m).find((f) => f.type === 'aldehyde');
  if (!g) return null;
  addAtomTo(m, 'O', g.atoms[0]);
  return finish(m);
}

// Reduction with H2/Pd (or NADH in the body): aldehyde -> 1° alcohol, ketone -> 2° alcohol.
export function reduceCarbonyl(smiles) {
  const m = prep(smiles);
  const g = functionalGroups(m).find((f) => f.type === 'aldehyde' || f.type === 'ketone');
  if (!g) return null;
  bondBetween(m, g.atoms[0], g.atoms[1]).order = 1;
  return finish(m);
}

// ---- Carboxylic acids (Lecture 10) ----------------------------------------------------------

export function neutralizeAcid(smiles, metal = 'Na') {
  const m = prep(smiles);
  const g = functionalGroups(m).find((f) => f.type === 'acid');
  if (!g) return null;
  const o = m.atoms[g.atoms[2]];
  Object.assign(o, { charge: -1, bracket: true, hExplicit: 0 });
  addAtomTo(m, metal, null, 1, { charge: 1, bracket: true, hExplicit: 0 });
  return finish(m);
}

// ---- Thiols (Lecture 6) --------------------------------------------------------------------

export function oxidizeThiol(smiles) {
  const m = prep(smiles);
  const g = functionalGroups(m).find((f) => f.type === 'thiol');
  if (!g) return null;
  const n = m.atoms.length;
  // duplicate the molecule and join the two S atoms
  const copy = prep(smiles);
  const offset = n;
  for (const a of copy.atoms) m.atoms.push({ ...a, id: a.id + offset, bonds: [] });
  for (const b of copy.bonds) {
    const nb = { ...b, id: m.bonds.length, a: b.a + offset, b: b.b + offset };
    m.bonds.push(nb);
    m.atoms[nb.a].bonds.push(nb.id);
    m.atoms[nb.b].bonds.push(nb.id);
  }
  const s1 = g.atoms[0], s2 = g.atoms[0] + offset;
  const bond = { id: m.bonds.length, a: s1, b: s2, order: 1, aromatic: false, dir: null };
  m.bonds.push(bond);
  m.atoms[s1].bonds.push(bond.id);
  m.atoms[s2].bonds.push(bond.id);
  return finish(m);
}

export { uniqueSmiles };
