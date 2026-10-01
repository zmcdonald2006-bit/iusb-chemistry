// Structural analysis: formulas, carbon classification, chirality centers,
// functional groups, VSEPR shapes, and a canonical key for comparing molecules.
import { parseSmiles, neighbors, bondBetween, otherAtom, components } from './smiles.js';
import { ringAtomSet } from './graph.js';

export function toMol(x) {
  return typeof x === 'string' ? parseSmiles(x) : x;
}

// ---- Formula ----------------------------------------------------------------

export function elementCounts(molIn) {
  const mol = toMol(molIn);
  const counts = {};
  let charge = 0;
  for (const a of mol.atoms) {
    counts[a.el] = (counts[a.el] || 0) + 1;
    if (a.h) counts.H = (counts.H || 0) + a.h;
    charge += a.charge || 0;
  }
  return { counts, charge };
}

// Hill-order molecular formula, e.g. "C4H10O". Use formatFormula() for display.
export function molecularFormula(molIn) {
  const { counts, charge } = elementCounts(molIn);
  const keys = Object.keys(counts);
  let order;
  if (counts.C) {
    order = ['C', 'H', ...keys.filter((k) => k !== 'C' && k !== 'H').sort()];
  } else {
    order = keys.sort();
  }
  let s = '';
  for (const k of order) {
    if (!counts[k]) continue;
    s += k + (counts[k] > 1 ? counts[k] : '');
  }
  if (charge) s += (Math.abs(charge) > 1 ? Math.abs(charge) : '') + (charge > 0 ? '+' : '-');
  return s;
}

export function parseFormula(str) {
  const clean = String(str)
    .replace(/[₀-₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)))
    .replace(/\s+/g, '');
  const counts = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let m;
  let consumed = 0;
  while ((m = re.exec(clean))) {
    if (!m[0]) break;
    counts[m[1]] = (counts[m[1]] || 0) + (m[2] ? +m[2] : 1);
    consumed += m[0].length;
  }
  if (consumed !== clean.length) return null;
  return counts;
}

export function sameFormula(a, b) {
  const ca = typeof a === 'string' ? parseFormula(a) : a;
  const cb = typeof b === 'string' ? parseFormula(b) : b;
  if (!ca || !cb) return false;
  const keys = new Set([...Object.keys(ca), ...Object.keys(cb)]);
  for (const k of keys) if ((ca[k] || 0) !== (cb[k] || 0)) return false;
  return true;
}

// ---- Atom-level helpers -------------------------------------------------------

export function carbonNeighborCount(mol, i) {
  return neighbors(mol, i).filter((n) => mol.atoms[n].el === 'C').length;
}

// 1°, 2°, 3°, 4° classification of a carbon (number of carbons bonded to it).
export function carbonClass(molIn, i) {
  const mol = toMol(molIn);
  return carbonNeighborCount(mol, i);
}

export function isSp3(mol, i) {
  return mol.atoms[i].bonds.every((bid) => mol.bonds[bid].order === 1 && !mol.bonds[bid].aromatic);
}

export function lonePairs(mol, i) {
  const a = mol.atoms[i];
  const valenceElectrons = { C: 4, N: 5, O: 6, S: 6, F: 7, Cl: 7, Br: 7, I: 7, B: 3, P: 5 }[a.el];
  if (valenceElectrons == null) return 0;
  const bondOrderSum = a.bonds.reduce((s, bid) => s + mol.bonds[bid].order, 0) + (a.h || 0);
  const nonbonding = valenceElectrons - (a.charge || 0) - bondOrderSum;
  return Math.max(0, Math.round(nonbonding / 2));
}

// VSEPR shape around an atom using the course's conventions.
export function shapeOf(molIn, i) {
  const mol = toMol(molIn);
  const a = mol.atoms[i];
  const bonded = a.bonds.length + (a.h || 0);
  const lp = lonePairs(mol, i);
  const groups = bonded + lp;
  if (groups === 2 && lp === 0) return { name: 'linear', angle: 180, groups, bonded, lp };
  if (groups === 3 && lp === 0) return { name: 'trigonal planar', angle: 120, groups, bonded, lp };
  if (groups === 4 && lp === 0) return { name: 'tetrahedral', angle: 109.5, groups, bonded, lp };
  if (groups === 4 && lp === 1) return { name: 'trigonal pyramidal', angle: 109.5, groups, bonded, lp };
  if (groups === 4 && lp === 2) return { name: 'bent', angle: 109.5, groups, bonded, lp };
  if (groups === 3 && lp === 1) return { name: 'bent', angle: 120, groups, bonded, lp };
  return { name: 'other', angle: null, groups, bonded, lp };
}

// ---- Chirality ------------------------------------------------------------------

function branchKey(mol, from, to, path, depth) {
  const a = mol.atoms[to];
  let key = a.el + (a.charge ? `(${a.charge})` : '') + 'h' + (a.h || 0);
  if (depth > 40) return key;
  const kids = [];
  path.add(to);
  for (const bid of a.bonds) {
    const b = mol.bonds[bid];
    const v = otherAtom(b, to);
    if (v === from) continue;
    if (path.has(v)) { kids.push(b.order + '*'); continue; }
    kids.push(b.order + branchKey(mol, to, v, path, depth + 1));
  }
  path.delete(to);
  kids.sort();
  return key + '[' + kids.join(',') + ']';
}

export function isChiralityCenter(molIn, i) {
  const mol = toMol(molIn);
  const a = mol.atoms[i];
  if (a.el !== 'C') return false;
  if (!isSp3(mol, i)) return false;
  const heavy = neighbors(mol, i);
  if (heavy.length + (a.h || 0) !== 4) return false;
  if ((a.h || 0) > 1) return false;
  const keys = heavy.map((n) => branchKey(mol, i, n, new Set([i]), 0));
  if (a.h === 1) keys.push('H');
  return new Set(keys).size === 4;
}

export function chiralityCenters(molIn) {
  const mol = toMol(molIn);
  const out = [];
  for (let i = 0; i < mol.atoms.length; i++) if (isChiralityCenter(mol, i)) out.push(i);
  return out;
}

// ---- Canonical key -----------------------------------------------------------------

// A canonical string for comparing whether two structures are the same compound.
// Exact for acyclic molecules (tree canonical form); very strong invariant for rings.
export function canonicalKey(molIn) {
  const mol = toMol(molIn);
  const comps = components(mol).map((comp) => {
    let best = null;
    for (const root of comp) {
      const a = mol.atoms[root];
      const k = branchKey(mol, -1, root, new Set(), 0) + (a.charge ? '' : '');
      if (best === null || k < best) best = k;
    }
    return best;
  });
  return comps.sort().join('.');
}

export function sameMolecule(a, b) {
  return canonicalKey(a) === canonicalKey(b);
}

// ---- Functional groups -------------------------------------------------------------

export const FG_LABELS = {
  alkene: 'Alkene (C=C)',
  alkyne: 'Alkyne (C≡C)',
  aromatic: 'Aromatic ring (benzene)',
  alcohol: 'Alcohol (–OH)',
  phenol: 'Phenol (–OH on a benzene ring)',
  ether: 'Ether (C–O–C)',
  amine: 'Amine (–NH₂, –NHR, –NR₂)',
  thiol: 'Thiol (–SH)',
  sulfide: 'Sulfide (C–S–C)',
  disulfide: 'Disulfide (–S–S–)',
  halide: 'Alkyl halide (C–X)',
  aldehyde: 'Aldehyde (–CHO)',
  ketone: 'Ketone (C=O between two C)',
  acid: 'Carboxylic acid (–COOH)',
  carboxylate: 'Carboxylate ion (–COO⁻)',
  ester: 'Ester (–COOR)',
  amide: 'Amide (–CONH₂, –CONHR…)',
};

function carbonylO(mol, c) {
  for (const bid of mol.atoms[c].bonds) {
    const b = mol.bonds[bid];
    const o = otherAtom(b, c);
    if (b.order === 2 && mol.atoms[o].el === 'O') return o;
  }
  return -1;
}

export function functionalGroups(molIn) {
  const mol = toMol(molIn);
  const found = [];
  const used = new Set();
  const add = (type, atoms) => { found.push({ type, atoms }); atoms.forEach((x) => used.add(`${type}:${x}`)); };
  const A = mol.atoms;
  const isC = (i) => A[i].el === 'C';

  // Carbonyl families
  for (const c of A.map((a) => a.id).filter(isC)) {
    const o = carbonylO(mol, c);
    if (o < 0) continue;
    const others = neighbors(mol, c).filter((n) => n !== o);
    const singleO = others.filter((n) => A[n].el === 'O');
    const singleN = others.filter((n) => A[n].el === 'N');
    if (singleO.length) {
      const o2 = singleO[0];
      if (A[o2].charge === -1) add('carboxylate', [c, o, o2]);
      else if (A[o2].h >= 1) add('acid', [c, o, o2]);
      else if (neighbors(mol, o2).some((n) => n !== c && isC(n))) add('ester', [c, o, o2]);
      continue;
    }
    if (singleN.length) { add('amide', [c, o, singleN[0]]); continue; }
    const carbonNbrs = others.filter(isC).length;
    if (A[c].h >= 1) add('aldehyde', [c, o]);
    else if (carbonNbrs === 2) add('ketone', [c, o]);
  }
  const inCarbonylFamily = (atom) => found.some((f) => ['acid', 'ester', 'amide', 'carboxylate'].includes(f.type) && f.atoms.includes(atom));
  const isCarbonylC = (c) => isC(c) && carbonylO(mol, c) >= 0;

  // O, N, S, halogens
  for (const a of A) {
    if (a.el === 'O' && !inCarbonylFamily(a.id)) {
      const nb = neighbors(mol, a.id);
      if (nb.length === 1 && a.h >= 1 && isC(nb[0]) && !isCarbonylC(nb[0])) {
        if (A[nb[0]].aromatic) add('phenol', [a.id, nb[0]]);
        else add('alcohol', [a.id, nb[0]]);
      } else if (nb.length === 2 && nb.every(isC) && nb.every((c) => !isCarbonylC(c))) {
        add('ether', [a.id, ...nb]);
      }
    } else if (a.el === 'N' && !inCarbonylFamily(a.id)) {
      const nb = neighbors(mol, a.id);
      if (!a.aromatic && nb.some(isC) && nb.every((c) => !isCarbonylC(c)) && a.bonds.every((bid) => mol.bonds[bid].order === 1)) {
        add('amine', [a.id, ...nb.filter(isC)]);
      }
    } else if (a.el === 'S') {
      const nb = neighbors(mol, a.id);
      const sNbr = nb.find((n) => A[n].el === 'S');
      if (sNbr != null) {
        if (a.id < sNbr) add('disulfide', [a.id, sNbr]);
      } else if (a.h >= 1 && nb.length === 1 && isC(nb[0])) add('thiol', [a.id, nb[0]]);
      else if (nb.length === 2 && nb.every(isC)) add('sulfide', [a.id, ...nb]);
    } else if (['F', 'Cl', 'Br', 'I'].includes(a.el)) {
      const nb = neighbors(mol, a.id);
      if (nb.length === 1 && isC(nb[0])) add('halide', [a.id, nb[0]]);
    }
  }
  // C=C, C#C, aromatic
  const aromaticAtoms = new Set();
  for (const b of mol.bonds) {
    if (!isC(b.a) || !isC(b.b)) continue;
    if (b.aromatic) { aromaticAtoms.add(b.a); aromaticAtoms.add(b.b); continue; }
    if (b.order === 2) add('alkene', [b.a, b.b]);
    if (b.order === 3) add('alkyne', [b.a, b.b]);
  }
  if (aromaticAtoms.size) {
    // count benzene-like rings
    const ringAtoms = ringAtomSet(mol);
    const arom = [...aromaticAtoms].filter((x) => ringAtoms.has(x));
    if (arom.length) add('aromatic', arom);
  }
  return found;
}

export function functionalGroupTypes(molIn) {
  return [...new Set(functionalGroups(molIn).map((f) => f.type))];
}

// ---- Classification of alcohols / alkyl halides -----------------------------------

// Returns 1, 2, 3 for the carbon bearing an OH (or halogen); null if not found.
export function substitutionClass(molIn, groupType = 'alcohol') {
  const mol = toMol(molIn);
  const g = functionalGroups(mol).find((f) => f.type === groupType);
  if (!g) return null;
  const carbon = g.atoms[1];
  return carbonNeighborCount(mol, carbon);
}

export function hasHBondDonor(molIn) {
  const mol = toMol(molIn);
  return mol.atoms.some((a) => ['O', 'N', 'F'].includes(a.el) && a.h > 0);
}

export function hasHBondAcceptor(molIn) {
  const mol = toMol(molIn);
  return mol.atoms.some((a) => ['O', 'N', 'F'].includes(a.el));
}

export function carbonCount(molIn) {
  const mol = toMol(molIn);
  return mol.atoms.filter((a) => a.el === 'C').length;
}

export { bondBetween };
