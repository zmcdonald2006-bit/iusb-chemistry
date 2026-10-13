// IUPAC namer for the compound classes taught in C102 (Smith, GOB chapters 12–17).
// Uses the "old style" locant placement taught in class: 2-butanol, 1-butene, 2-pentanone.
//
// Supported: alkanes, alkenes, alkynes (acyclic + cyclo), alkyl halides, alcohols (incl. diols),
// thiols, ethers (alkoxy), aldehydes, ketones, carboxylic acids, carboxylate salts,
// hydroxy/oxo prefixes, amines (1°, 2°, 3°: 2-propanamine, N-methyl-2-propanamine; common names
// like triethylamine) and ammonium salts (octylammonium chloride). Returns null for anything outside
// that scope (aromatic compounds, esters, amides, amines with N in a ring, complex substituents),
// so callers can fall back to authored names.

import { toMol } from './analyze.js';
import { neighbors, otherAtom, bondBetween, components, cloneMol, computeHydrogens } from './smiles.js';
import { findRings } from './graph.js';

export const STEMS = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec',
  'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'icos'];
export const MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa'];

const HALO = { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' };
const PRIORITY = ['acid', 'aldehyde', 'ketone', 'alcohol', 'thiol', 'amine'];

const COMMON_BY_IUPAC = {
  methanal: ['formaldehyde'],
  ethanal: ['acetaldehyde'],
  '2-propanone': ['acetone', 'dimethyl ketone'],
  'methanoic acid': ['formic acid'],
  'ethanoic acid': ['acetic acid'],
  'butanoic acid': ['butyric acid'],
  '2-propanol': ['isopropyl alcohol'],
  ethene: ['ethylene'],
  ethyne: ['acetylene'],
  propene: ['propylene'],
  '1,2-ethanediol': ['ethylene glycol'],
  '1,2,3-propanetriol': ['glycerol', 'glycerin'],
  '2-methylpropane': ['isobutane'],
  trichloromethane: ['chloroform'],
  pentanedial: ['glutaraldehyde'],
  '2-hydroxypropanoic acid': ['lactic acid'],
  '2-hydroxyethanoic acid': ['glycolic acid'],
};

// Alphabetization key: ignore sec-/tert- (but not iso-), per IUPAC.
export function alphaKey(prefix) {
  return prefix.replace(/^(sec-|tert-)/, '');
}

function cmpArrays(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return a.length - b.length;
}

// ---- Group perception -----------------------------------------------------------

function carbonylOxygen(mol, c) {
  for (const bid of mol.atoms[c].bonds) {
    const b = mol.bonds[bid];
    const o = otherAtom(b, c);
    if (b.order === 2 && mol.atoms[o].el === 'O') return o;
  }
  return -1;
}

// Returns { groups, etherO } or null if something unsupported is present.
function perceive(mol) {
  const A = mol.atoms;
  const groups = []; // {kind, c, atoms}
  const claimed = new Set();
  let etherO = [];
  for (const a of A) {
    if (!['C', 'O', 'S', 'F', 'Cl', 'Br', 'I', 'N'].includes(a.el)) return null;
    if (a.charge || a.aromatic) return null;
  }
  // carbonyls first
  for (const a of A) {
    if (a.el !== 'C') continue;
    const o = carbonylOxygen(mol, a.id);
    if (o < 0) continue;
    if (neighbors(mol, o).length !== 1) return null;
    const others = neighbors(mol, a.id).filter((n) => n !== o);
    const hetero = others.filter((n) => A[n].el !== 'C');
    if (hetero.length) {
      if (hetero.length === 1 && A[hetero[0]].el === 'O' && A[hetero[0]].h === 1 && neighbors(mol, hetero[0]).length === 1) {
        groups.push({ kind: 'acid', c: a.id, atoms: [a.id, o, hetero[0]] });
        claimed.add(o); claimed.add(hetero[0]);
        continue;
      }
      return null; // esters, acid halides, amides, etc.
    }
    if (a.h >= 1) groups.push({ kind: 'aldehyde', c: a.id, atoms: [a.id, o] });
    else if (others.length === 2) groups.push({ kind: 'ketone', c: a.id, atoms: [a.id, o] });
    else return null;
    claimed.add(o);
  }
  for (const a of A) {
    if (a.el === 'C' || claimed.has(a.id)) continue;
    const nb = neighbors(mol, a.id);
    if (a.el === 'O') {
      if (nb.length === 1 && a.h === 1 && A[nb[0]].el === 'C') {
        groups.push({ kind: 'alcohol', c: nb[0], atoms: [a.id] });
      } else if (nb.length === 2 && nb.every((n) => A[n].el === 'C') && a.bonds.every((bid) => mol.bonds[bid].order === 1)) {
        etherO.push(a.id);
      } else return null;
    } else if (a.el === 'S') {
      if (nb.length === 1 && a.h === 1 && A[nb[0]].el === 'C') groups.push({ kind: 'thiol', c: nb[0], atoms: [a.id] });
      else return null;
    } else if (HALO[a.el]) {
      if (nb.length === 1 && A[nb[0]].el === 'C') groups.push({ kind: 'halo', c: nb[0], atoms: [a.id], sub: HALO[a.el] });
      else return null;
    } else if (a.el === 'N') {
      // only a 1° amine here (–NH₂); 2° and 3° amines are reduced to one first (see nameAmine)
      if (nb.length === 1 && A[nb[0]].el === 'C' && a.bonds.every((bid) => mol.bonds[bid].order === 1)) groups.push({ kind: 'amine', c: nb[0], atoms: [a.id] });
      else return null;
    }
  }
  if (etherO.length > 1) return null;
  return { groups, etherO: etherO[0] ?? null };
}

// ---- Alkyl substituent names -------------------------------------------------------

// Collect atoms of a branch starting at `root`, not crossing `from`.
function collectBranch(mol, root, from) {
  const seen = new Set([root]);
  const stack = [root];
  while (stack.length) {
    const u = stack.pop();
    for (const v of neighbors(mol, u)) {
      if (v === from || seen.has(v)) continue;
      seen.add(v);
      stack.push(v);
    }
  }
  return seen;
}

// Name a saturated, all-carbon branch attached through `root` (bonded to `from`).
export function alkylName(mol, root, from) {
  const atoms = collectBranch(mol, root, from);
  for (const i of atoms) {
    if (mol.atoms[i].el !== 'C') return null;
    for (const bid of mol.atoms[i].bonds) {
      const b = mol.bonds[bid];
      if (b.order !== 1) return null;
    }
  }
  const n = atoms.size;
  const inDeg = (i) => neighbors(mol, i).filter((x) => atoms.has(x)).length;
  const linear = [...atoms].every((i) => inDeg(i) <= 2) && inDeg(root) <= 1;
  if (linear && n < STEMS.length) return STEMS[n] + 'yl';
  const rootKids = neighbors(mol, root).filter((x) => atoms.has(x));
  if (n === 3 && rootKids.length === 2) return 'isopropyl';
  if (n === 4) {
    if (rootKids.length === 3) return 'tert-butyl';
    if (rootKids.length === 2) {
      const sizes = rootKids.map((k) => collectBranch(mol, k, root).size).sort();
      if (sizes[0] === 1 && sizes[1] === 2) return 'sec-butyl';
    }
    if (rootKids.length === 1) {
      const k = rootKids[0];
      const kk = neighbors(mol, k).filter((x) => atoms.has(x) && x !== root);
      if (kk.length === 2) return 'isobutyl';
    }
  }
  return null;
}

export function alkoxyName(alkyl) {
  if (!alkyl) return null;
  const short = { methyl: 'methoxy', ethyl: 'ethoxy', propyl: 'propoxy', butyl: 'butoxy', isopropyl: 'isopropoxy', 'sec-butyl': 'sec-butoxy', 'tert-butyl': 'tert-butoxy', isobutyl: 'isobutoxy' };
  return short[alkyl] || alkyl + 'oxy';
}

// ---- Shared assembly -------------------------------------------------------------------

// Locants are numbers, or "N" for a group on an amine nitrogen (N comes first: N,2-dimethyl).
export const locantSort = (a, b) => (a === b ? 0 : a === 'N' ? -1 : b === 'N' ? 1 : a - b);

function groupPrefixes(prefixes) {
  // prefixes: [{name, locant}] -> [{name, locants:[...]}] sorted alphabetically
  const map = new Map();
  for (const p of prefixes) {
    if (!map.has(p.name)) map.set(p.name, []);
    map.get(p.name).push(p.locant);
  }
  const out = [...map.entries()].map(([name, locants]) => ({ name, locants: locants.sort(locantSort) }));
  out.sort((a, b) => (alphaKey(a.name) < alphaKey(b.name) ? -1 : alphaKey(a.name) > alphaKey(b.name) ? 1 : 0));
  return out;
}

export function formatPrefixes(grouped, omitLocants) {
  return grouped.map((g) => {
    const mult = MULT[g.locants.length] || '';
    const needsParens = mult && /-/.test(g.name) && false;
    const body = mult + (needsParens ? `(${g.name})` : g.name);
    return omitLocants ? body : `${g.locants.join(',')}-${body}`;
  }).join('-');
}

function joinName(prefixStr, parentStr) {
  if (!prefixStr) return parentStr;
  return /^\d/.test(parentStr) ? `${prefixStr}-${parentStr}` : `${prefixStr}${parentStr}`;
}

// ---- Acyclic ------------------------------------------------------------------------

function pathBetween(parentMap, a, b) {
  // parentMap from BFS rooted at a
  const out = [b];
  let cur = b;
  while (cur !== a) { cur = parentMap.get(cur); out.push(cur); }
  return out.reverse();
}

function nameAcyclic(mol, perception) {
  const A = mol.atoms;
  const { groups, etherO } = perception;
  let carbonSet = new Set(A.filter((a) => a.el === 'C').map((a) => a.id));
  let alkoxy = null; // {name, attach}
  // Principal group
  const kinds = new Set(groups.map((g) => g.kind));
  const principalKind = PRIORITY.find((k) => kinds.has(k)) || null;
  if (etherO != null) {
    const [c1, c2] = neighbors(mol, etherO);
    const side1 = collectBranch(mol, c1, etherO);
    const side2 = collectBranch(mol, c2, etherO);
    const hasGroups = (side) => groups.some((g) => side.has(g.c));
    const hasUnsat = (side) => mol.bonds.some((b) => b.order > 1 && side.has(b.a) && side.has(b.b));
    const count = (side) => [...side].filter((x) => A[x].el === 'C').length;
    // Parent side: the one holding principal groups / other groups, else the larger side.
    let parentSide, otherRoot;
    const score = (side) => [principalKind && groups.some((g) => g.kind === principalKind && side.has(g.c)) ? 1 : 0, hasUnsat(side) ? 1 : 0, count(side), hasGroups(side) ? 1 : 0];
    const s1 = score(side1), s2 = score(side2);
    if (cmpArrays(s1, s2) >= 0) { parentSide = side1; otherRoot = c2; }
    else { parentSide = side2; otherRoot = c1; }
    const alk = alkylName(mol, otherRoot, etherO);
    if (!alk) return null;
    alkoxy = { name: alkoxyName(alk), attach: otherRoot === c2 ? c1 : c2, alkyl: alk };
    carbonSet = new Set([...parentSide].filter((x) => A[x].el === 'C'));
  }
  const cNbrs = (i) => neighbors(mol, i).filter((x) => carbonSet.has(x));
  const leaves = [...carbonSet].filter((i) => cNbrs(i).length <= 1);
  if (!leaves.length) return null;

  const principalCarbons = groups.filter((g) => g.kind === principalKind).map((g) => g.c);
  const multBonds = mol.bonds.filter((b) => b.order > 1 && carbonSet.has(b.a) && carbonSet.has(b.b));

  // All leaf-to-leaf paths (a tree => unique path per pair)
  const paths = [];
  for (const a of leaves) {
    const par = new Map([[a, a]]);
    const q = [a];
    while (q.length) {
      const u = q.shift();
      for (const v of cNbrs(u)) if (!par.has(v)) { par.set(v, u); q.push(v); }
    }
    for (const b of leaves) {
      if (b < a) continue;
      paths.push(pathBetween(par, a, b));
    }
  }
  const evalPath = (p) => {
    const set = new Set(p);
    const princ = principalCarbons.filter((c) => set.has(c)).length;
    const mult = multBonds.filter((b) => set.has(b.a) && set.has(b.b)).length;
    let nsub = 0;
    for (const c of p) {
      nsub += cNbrs(c).filter((x) => !set.has(x)).length;
      nsub += groups.filter((g) => g.c === c && g.kind !== principalKind).length;
      if (alkoxy && alkoxy.attach === c) nsub++;
    }
    return [princ, mult, p.length, nsub];
  };
  let best = [];
  let bestScore = null;
  for (const p of paths) {
    const sc = evalPath(p);
    const c = bestScore ? cmpArrays(sc, bestScore) : 1;
    if (c > 0) { best = [p]; bestScore = sc; }
    else if (c === 0) best.push(p);
  }
  // All multiple bonds must lie in the chain.
  if (bestScore[1] !== multBonds.length) return null;
  if (principalKind && bestScore[0] !== principalCarbons.length) return null;

  let bestNumbering = null;
  for (const p of best) {
    for (const chain of [p, [...p].reverse()]) {
      const r = numberChain(mol, chain, { groups, principalKind, alkoxy, carbonSet });
      if (!r) return null;
      if (!bestNumbering || cmpArrays(r.key, bestNumbering.key) < 0) bestNumbering = r;
    }
  }
  return assemble(mol, bestNumbering, { principalKind, cyclic: false, alkoxy, groups, etherO });
}

function numberChain(mol, chain, ctx) {
  const { groups, principalKind, alkoxy, carbonSet } = ctx;
  const pos = new Map(chain.map((c, i) => [c, i + 1]));
  const n = chain.length;
  const principalLocs = [];
  const prefixes = [];
  for (const g of groups) {
    const loc = pos.get(g.c);
    if (g.kind === principalKind) {
      if (loc == null) return null;
      principalLocs.push(loc);
      continue;
    }
    if (loc == null) return null; // group on a branch: unsupported
    const name = g.kind === 'halo' ? g.sub : g.kind === 'alcohol' ? 'hydroxy' : g.kind === 'ketone' ? 'oxo' : null;
    if (!name) return null;
    prefixes.push({ name, locant: loc });
  }
  if (alkoxy) {
    const loc = pos.get(alkoxy.attach);
    if (loc == null) return null;
    prefixes.push({ name: alkoxy.name, locant: loc });
  }
  for (const c of chain) {
    for (const v of neighbors(mol, c)) {
      if (!carbonSet.has(v) || pos.has(v)) continue;
      const alk = alkylName(mol, v, c);
      if (!alk) return null;
      prefixes.push({ name: alk, locant: pos.get(c) });
    }
  }
  const multLocs = [], doubleLocs = [];
  let nDouble = 0, nTriple = 0;
  for (let i = 0; i < n - 1; i++) {
    const b = bondBetween(mol, chain[i], chain[i + 1]);
    if (b.order === 2) { nDouble++; multLocs.push(i + 1); doubleLocs.push(i + 1); }
    if (b.order === 3) { nTriple++; multLocs.push(i + 1); }
  }
  principalLocs.sort((a, b) => a - b);
  const subLocs = prefixes.map((p) => p.locant).sort((a, b) => a - b);
  const alpha = [...prefixes].sort((a, b) => (alphaKey(a.name) < alphaKey(b.name) ? -1 : alphaKey(a.name) > alphaKey(b.name) ? 1 : a.locant - b.locant)).map((p) => p.locant);
  const pad = (arr) => arr.concat([99]);
  const key = [...pad(principalLocs), ...pad(multLocs), ...pad(doubleLocs), ...pad(subLocs), ...pad(alpha)];
  return { chain, n, principalLocs, multLocs, nDouble, nTriple, prefixes, key };
}

// ---- Cyclic -------------------------------------------------------------------------

function nameCyclic(mol, ring, perception) {
  const A = mol.atoms;
  const { groups, etherO } = perception;
  const ringSet = new Set(ring);
  const k = ring.length;
  if (k < 3 || k >= STEMS.length) return null;
  const kinds = new Set(groups.map((g) => g.kind));
  const principalKind = PRIORITY.find((kk) => kinds.has(kk)) || null;
  if (principalKind === 'acid' || principalKind === 'aldehyde') return null;
  // every group must sit on the ring
  for (const g of groups) if (!ringSet.has(g.c)) return null;
  let alkoxy = null;
  if (etherO != null) {
    const [c1, c2] = neighbors(mol, etherO);
    const ringSide = ringSet.has(c1) ? c1 : ringSet.has(c2) ? c2 : null;
    if (ringSide == null) return null;
    const other = ringSide === c1 ? c2 : c1;
    const alk = alkylName(mol, other, etherO);
    if (!alk) return null;
    alkoxy = { name: alkoxyName(alk), attach: ringSide };
  }
  // no exocyclic multiple bonds other than C=O in ring ketones
  for (const b of mol.bonds) {
    if (b.order === 1) continue;
    const inRing = ringSet.has(b.a) && ringSet.has(b.b);
    if (inRing) continue;
    const isKetoneO = groups.some((g) => g.kind === 'ketone' && g.atoms.includes(b.a) && g.atoms.includes(b.b));
    if (!isKetoneO) return null;
  }
  let best = null;
  for (let s = 0; s < k; s++) {
    for (const dir of [1, -1]) {
      const order = [];
      for (let j = 0; j < k; j++) order.push(ring[(s + dir * j + k * 2) % k]);
      const pos = new Map(order.map((a, i) => [a, i + 1]));
      const principalLocs = [];
      const prefixes = [];
      let ok = true;
      for (const g of groups) {
        const loc = pos.get(g.c);
        if (g.kind === principalKind) { principalLocs.push(loc); continue; }
        const name = g.kind === 'halo' ? g.sub : g.kind === 'alcohol' ? 'hydroxy' : g.kind === 'ketone' ? 'oxo' : null;
        if (!name) { ok = false; break; }
        prefixes.push({ name, locant: loc });
      }
      if (!ok) return null;
      if (alkoxy) prefixes.push({ name: alkoxy.name, locant: pos.get(alkoxy.attach) });
      for (const c of order) {
        for (const v of neighbors(mol, c)) {
          if (ringSet.has(v) || A[v].el !== 'C') continue;
          const alk = alkylName(mol, v, c);
          if (!alk) return null;
          const size = collectBranch(mol, v, c).size;
          if (size > k) return null; // a chain larger than the ring: out of scope
          prefixes.push({ name: alk, locant: pos.get(c) });
        }
      }
      const doubleLocs = [];
      for (let j = 0; j < k; j++) {
        const b = bondBetween(mol, order[j], order[(j + 1) % k]);
        if (b.order === 2) doubleLocs.push(j + 1);
        if (b.order === 3) return null;
      }
      principalLocs.sort((a, b) => a - b);
      doubleLocs.sort((a, b) => a - b);
      const subLocs = prefixes.map((p) => p.locant).sort((a, b) => a - b);
      const alpha = [...prefixes].sort((a, b) => (alphaKey(a.name) < alphaKey(b.name) ? -1 : alphaKey(a.name) > alphaKey(b.name) ? 1 : a.locant - b.locant)).map((p) => p.locant);
      const pad = (arr) => arr.concat([99]);
      const key = [...pad(principalLocs), ...pad(doubleLocs), ...pad(subLocs), ...pad(alpha)];
      const r = { chain: order, n: k, principalLocs, multLocs: doubleLocs, nDouble: doubleLocs.length, nTriple: 0, prefixes, key };
      if (!best || cmpArrays(key, best.key) < 0) best = r;
    }
  }
  return assemble(mol, best, { principalKind, cyclic: true, alkoxy, groups, etherO });
}

// ---- Name assembly ---------------------------------------------------------------------

function assemble(mol, num, ctx) {
  const { principalKind, cyclic, groups } = ctx;
  const { n, principalLocs, multLocs, nDouble, nTriple, prefixes } = num;
  if (n >= STEMS.length) return null;
  if (nDouble && nTriple) return null;
  if (principalKind && (nDouble || nTriple)) return null;
  const stem = (cyclic ? 'cyclo' : '') + STEMS[n];
  const grouped = groupPrefixes(prefixes);
  const totalPrefixes = prefixes.length;
  const pc = principalLocs.length;
  let parent;
  let parentLocs = [];
  let omitParentLocs = false;
  if (!principalKind) {
    if (!nDouble && !nTriple) parent = stem + 'ane';
    else {
      const count = nDouble || nTriple;
      const word = nDouble ? 'ene' : 'yne';
      parent = stem + (count > 1 ? 'a' + MULT[count] : '') + word;
      parentLocs = multLocs;
      omitParentLocs = cyclic ? count === 1 : n <= 3;
    }
  } else {
    parentLocs = principalLocs;
    const mult = pc > 1 ? MULT[pc] : '';
    switch (principalKind) {
      case 'acid': parent = stem + (pc > 1 ? 'anedioic acid' : 'anoic acid'); omitParentLocs = true; if (pc > 2 || cyclic) return null; break;
      case 'aldehyde': parent = stem + (pc > 1 ? 'anedial' : 'anal'); omitParentLocs = true; if (pc > 2) return null; break;
      case 'ketone': parent = stem + (pc > 1 ? 'ane' + mult + 'one' : 'anone'); omitParentLocs = cyclic && pc === 1; break;
      case 'alcohol': parent = stem + (pc > 1 ? 'ane' + mult + 'ol' : 'anol'); omitParentLocs = pc === 1 && (cyclic || n <= 2); break;
      case 'thiol': parent = stem + 'ane' + (pc > 1 ? mult : '') + 'thiol'; omitParentLocs = pc === 1 && (cyclic || n <= 2); break;
      case 'amine': parent = stem + (pc > 1 ? 'ane' + mult + 'amine' : 'anamine'); omitParentLocs = pc === 1 && (cyclic || n <= 2); break;
      default: return null;
    }
  }
  const parentStr = omitParentLocs || !parentLocs.length ? parent : `${parentLocs.join(',')}-${parent}`;
  let omitPrefixLocs = false;
  if (!cyclic && n === 1) omitPrefixLocs = true;
  if (!cyclic && n === 2 && totalPrefixes === 1 && !principalKind) omitPrefixLocs = true;
  if (cyclic && totalPrefixes === 1 && !principalKind && !nDouble) omitPrefixLocs = true;
  const prefixStr = formatPrefixes(grouped, omitPrefixLocs);
  let name = joinName(prefixStr, parentStr);

  // cis/trans for a single disubstituted chain double bond
  let stereo = null;
  if (!cyclic && mol.stereo && mol.stereo.length) {
    if (mol.stereo.length !== 1 || nDouble !== 1) return null;
    const st = mol.stereo[0];
    const heavyOthers = (atom, partner) => neighbors(mol, atom).filter((x) => x !== partner).length;
    if (heavyOthers(st.u, st.v) === 1 && heavyOthers(st.v, st.u) === 1 && mol.atoms[st.u].h === 1 && mol.atoms[st.v].h === 1) {
      stereo = st.cis ? 'cis' : 'trans';
      name = `${stereo}-${name}`;
    }
  }

  const alternates = [];
  const common = [...(COMMON_BY_IUPAC[name] || [])];
  if (principalKind === 'ketone' && !cyclic && pc === 1 && n <= 4 && !totalPrefixes) alternates.push(stem + 'anone');
  const extra = commonNames(mol, ctx, { principalKind, pc, n, nDouble, nTriple, totalPrefixes, cyclic });
  for (const c of extra) if (!common.includes(c)) common.push(c);

  return {
    name,
    alternates,
    common,
    parts: {
      stereo,
      prefixes: grouped,
      parent: {
        n, cyclic, kind: principalKind || (nDouble ? 'ene' : nTriple ? 'yne' : 'ane'),
        count: principalKind ? pc : (nDouble || nTriple || 0),
        locants: parentLocs,
      },
    },
    numbering: num.chain, // atom ids in chain/ring order (C1 first)
    parentStr, // e.g. "2-propanamine" (used to add N- prefixes to amines)
  };
}

function commonNames(mol, ctx, info) {
  const out = [];
  const { groups, etherO } = ctx;
  const A = mol.atoms;
  const onlyGroups = (kinds) => groups.every((g) => kinds.includes(g.kind));
  if (info.nDouble || info.nTriple || info.cyclic) return out;
  // Simple ethers: R-O-R'
  if (etherO != null && groups.length === 0) {
    const [c1, c2] = neighbors(mol, etherO);
    const r1 = alkylName(mol, c1, etherO), r2 = alkylName(mol, c2, etherO);
    if (r1 && r2) out.push(r1 === r2 ? `di${r1} ether` : [r1, r2].sort((a, b) => (alphaKey(a) < alphaKey(b) ? -1 : 1)).join(' ') + ' ether');
  }
  // Simple ketones: R-CO-R'
  if (etherO == null && groups.length === 1 && groups[0].kind === 'ketone') {
    const c = groups[0].c;
    const [r1root, r2root] = neighbors(mol, c).filter((x) => A[x].el === 'C');
    const r1 = alkylName(mol, r1root, c), r2 = alkylName(mol, r2root, c);
    if (r1 && r2) out.push(r1 === r2 ? `di${r1} ketone` : [r1, r2].sort((a, b) => (alphaKey(a) < alphaKey(b) ? -1 : 1)).join(' ') + ' ketone');
  }
  // Simple alcohols: R-OH
  if (etherO == null && groups.length === 1 && groups[0].kind === 'alcohol' && onlyGroups(['alcohol'])) {
    const o = groups[0].atoms[0];
    const r = alkylName(mol, groups[0].c, o);
    if (r) out.push(`${r} alcohol`);
  }
  return out;
}

// ---- Salts ---------------------------------------------------------------------------------

const METALS = { Na: 'sodium', K: 'potassium', Li: 'lithium' };
const ANION_COMMON = { 'methanoic acid': 'formate', 'ethanoic acid': 'acetate' };

function nameSalt(mol, comps) {
  const metalComp = comps.find((c) => c.length === 1 && METALS[mol.atoms[c[0]].el] && mol.atoms[c[0]].charge === 1);
  const anionComp = comps.find((c) => c !== metalComp);
  if (!metalComp || !anionComp) return null;
  const neg = anionComp.filter((i) => mol.atoms[i].charge === -1);
  if (neg.length !== 1 || mol.atoms[neg[0]].el !== 'O') return null;
  // Rebuild the neutral acid from the anion component.
  const acid = cloneMol(mol);
  const o = acid.atoms[neg[0]];
  o.charge = 0; o.bracket = false; o.hExplicit = null;
  const keep = new Set(anionComp);
  const sub = { atoms: [], bonds: [], stereo: [] };
  const map = new Map();
  for (const a of acid.atoms) if (keep.has(a.id)) { map.set(a.id, sub.atoms.length); sub.atoms.push({ ...a, id: sub.atoms.length, bonds: [] }); }
  for (const b of acid.bonds) {
    if (!keep.has(b.a)) continue;
    const nb = { ...b, id: sub.bonds.length, a: map.get(b.a), b: map.get(b.b) };
    sub.bonds.push(nb);
    sub.atoms[nb.a].bonds.push(nb.id);
    sub.atoms[nb.b].bonds.push(nb.id);
  }
  computeHydrogens(sub);
  const r = nameCompound(sub);
  if (!r || !/oic acid$/.test(r.name)) return null;
  const metal = METALS[mol.atoms[metalComp[0]].el];
  const iupacAnion = r.name.replace(/oic acid$/, 'oate');
  const commonAnion = ANION_COMMON[r.name];
  const name = `${metal} ${commonAnion || iupacAnion}`;
  const alternates = commonAnion ? [`${metal} ${iupacAnion}`] : [];
  return { name, alternates, common: [], parts: null, numbering: null, salt: { metal, acid: r } };
}

// ---- Amines (Lecture 11) ---------------------------------------------------------------------
// Smith's rules: the longest chain (or ring) bonded to the N is the parent "-amine"; any other groups
// on the N are "N-" prefixes (N-methyl-2-propanamine). Common names list the groups on the N
// alphabetically + "amine" (triethylamine, ethylmethylamine).

// A group on the N: a simple alkyl, or an unsubstituted cycloalkyl ring.
function nGroupName(mol, root, n) {
  const alk = alkylName(mol, root, n);
  if (alk) return alk;
  const branch = collectBranch(mol, root, n);
  const rings = findRings(mol).filter((r) => r.includes(root));
  if (rings.length === 1 && rings[0].length === branch.size && [...branch].every((i) => mol.atoms[i].el === 'C')
    && mol.bonds.every((b) => !(branch.has(b.a) && branch.has(b.b)) || b.order === 1) && rings[0].length < STEMS.length) {
    return `cyclo${STEMS[rings[0].length]}yl`;
  }
  return null;
}

// The single amine N of a molecule, with its carbon neighbours, or null if out of scope.
function amineNitrogen(mol) {
  const ns = mol.atoms.filter((a) => a.el === 'N');
  if (ns.length !== 1) return null;
  const N = ns[0];
  if (N.aromatic || N.bonds.some((bid) => mol.bonds[bid].order !== 1)) return null;
  const nb = neighbors(mol, N.id);
  if (nb.some((x) => mol.atoms[x].el !== 'C')) return null;
  if (findRings(mol).some((r) => r.includes(N.id))) return null; // N in a ring (piperidine…): authored names
  return { N: N.id, nb };
}

// "ethyl", "methyl", "methyl" -> "ethyldimethyl"
function joinGroupNames(names) {
  const counts = new Map();
  for (const g of names) counts.set(g, (counts.get(g) || 0) + 1);
  return [...counts.keys()].sort((a, b) => (alphaKey(a) < alphaKey(b) ? -1 : alphaKey(a) > alphaKey(b) ? 1 : 0))
    .map((g) => `${MULT[counts.get(g)] || ''}${g}`).join('');
}

function subMolWithout(mol, removeSet) {
  const keep = mol.atoms.filter((a) => !removeSet.has(a.id)).map((a) => a.id);
  const map = new Map(keep.map((id, i) => [id, i]));
  const sub = { atoms: [], bonds: [], stereo: [] };
  for (const id of keep) sub.atoms.push({ ...mol.atoms[id], id: map.get(id), bonds: [], hExplicit: null });
  for (const b of mol.bonds) {
    if (!map.has(b.a) || !map.has(b.b)) continue;
    const nb = { ...b, id: sub.bonds.length, a: map.get(b.a), b: map.get(b.b) };
    sub.bonds.push(nb);
    sub.atoms[nb.a].bonds.push(nb.id);
    sub.atoms[nb.b].bonds.push(nb.id);
  }
  computeHydrogens(sub);
  return sub;
}

function nameAmine(mol) {
  const am = amineNitrogen(mol);
  if (!am || !am.nb.length) return null;
  if (mol.atoms.some((a) => a.charge)) return null;
  const { N, nb } = am;
  // Common name: the groups on the N (all must be simple), alphabetical, + "amine"
  const groupNames = nb.map((c) => nGroupName(mol, c, N));
  const common = groupNames.every(Boolean) ? [`${joinGroupNames(groupNames)}amine`] : [];

  // Systematic name: try each group on the N as the parent; the longest parent wins.
  let best = null;
  for (const parentC of nb) {
    const others = nb.filter((c) => c !== parentC);
    const otherNames = others.map((c) => nGroupName(mol, c, N));
    if (otherNames.some((x) => !x)) continue;
    const remove = new Set();
    for (const c of others) for (const x of collectBranch(mol, c, N)) remove.add(x);
    const reduced = remove.size ? subMolWithout(mol, remove) : mol;
    const perception = perceive(reduced);
    if (!perception) continue;
    const rings = findRings(reduced);
    if (rings.length > 1) continue;
    let r;
    if (rings.length === 1) {
      if (rings[0].some((i) => reduced.atoms[i].el !== 'C')) continue;
      r = nameCyclic(reduced, rings[0], perception);
    } else r = nameAcyclic(reduced, perception);
    if (!r || r.parts.parent.kind !== 'amine') continue;
    const score = [r.parts.parent.n, r.parts.parent.cyclic ? 0 : 1];
    if (!best || cmpArrays(score, best.score) > 0) best = { r, otherNames, score, parentC };
  }
  if (!best) return null;
  const { r, otherNames, parentC } = best;
  if (!otherNames.length) {
    for (const c of common) if (!r.common.includes(c)) r.common.push(c);
    return r;
  }
  // add the N- groups to the prefixes, alphabetized with the rest
  const all = r.parts.prefixes.flatMap((p) => p.locants.map((l) => ({ name: p.name, locant: l })));
  for (const g of otherNames) all.push({ name: g, locant: 'N' });
  const grouped = groupPrefixes(all);
  const name = joinName(formatPrefixes(grouped, false), r.parentStr);
  // also accepted: the N- groups + the parent group's common name ("N,N-dimethylethylamine")
  const alternates = [];
  const own = nGroupName(mol, parentC, N);
  if (own && !r.parts.prefixes.length) alternates.push(`${formatPrefixes(groupPrefixes(otherNames.map((g) => ({ name: g, locant: 'N' }))), false)}${own}amine`);
  return { ...r, name, alternates, common, parts: { ...r.parts, prefixes: grouped } };
}

// Ammonium salts: the amine took an H⁺ from an acid. Named like the common amine name, with
// "ammonium" + the anion: octylammonium chloride, triethylammonium hydroxide.
const ANIONS = { Cl: 'chloride', Br: 'bromide', I: 'iodide', F: 'fluoride' };

function nameAmmoniumSalt(mol, comps) {
  const isAnion = (c) => c.length === 1 && mol.atoms[c[0]].charge === -1 && (ANIONS[mol.atoms[c[0]].el] || (mol.atoms[c[0]].el === 'O' && mol.atoms[c[0]].h === 1));
  const anionComp = comps.find(isAnion);
  const cationComp = comps.find((c) => c !== anionComp);
  if (!anionComp || !cationComp) return null;
  const nPlus = cationComp.filter((i) => mol.atoms[i].el === 'N');
  if (nPlus.length !== 1 || mol.atoms[nPlus[0]].charge !== 1) return null;
  if (cationComp.some((i) => mol.atoms[i].charge && i !== nPlus[0])) return null;
  const N = nPlus[0];
  if (mol.atoms[N].bonds.some((bid) => mol.bonds[bid].order !== 1)) return null;
  if (findRings(mol).some((r) => r.includes(N))) return null;
  const nb = neighbors(mol, N);
  if (nb.some((x) => mol.atoms[x].el !== 'C')) return null;
  // the rest of the cation: carbon and hydrogen only
  if (cationComp.some((i) => !['C', 'N'].includes(mol.atoms[i].el))) return null;
  const groups = nb.map((c) => nGroupName(mol, c, N));
  if (groups.some((g) => !g)) return null;
  const a = mol.atoms[anionComp[0]];
  const anion = a.el === 'O' ? 'hydroxide' : ANIONS[a.el];
  const name = `${joinGroupNames(groups)}ammonium ${anion}`;
  // drug-style name for amine + HCl: "octylamine hydrochloride" (not for 4° ions)
  const alternates = anion === 'chloride' && nb.length < 4 && groups.length ? [`${joinGroupNames(groups)}amine hydrochloride`] : [];
  return { name, alternates, common: [], parts: null, numbering: null, salt: { cation: 'ammonium', anion } };
}

// ---- Public -------------------------------------------------------------------------------

export function nameCompound(input) {
  let mol;
  try { mol = toMol(input); } catch { return null; }
  const comps = components(mol);
  if (comps.length === 2) return mol.atoms.some((a) => a.el === 'N') ? nameAmmoniumSalt(mol, comps) : nameSalt(mol, comps);
  if (comps.length === 1 && mol.atoms.some((a) => a.el === 'N')) return nameAmine(mol);
  if (comps.length !== 1) return null;
  if (!mol.atoms.some((a) => a.el === 'C')) return null;
  const perception = perceive(mol);
  if (!perception) return null;
  const rings = findRings(mol);
  if (rings.length > 1) return null;
  if (rings.length === 1) {
    if (rings[0].some((i) => mol.atoms[i].el !== 'C')) return null;
    return nameCyclic(mol, rings[0], perception);
  }
  return nameAcyclic(mol, perception);
}

export function iupacName(input) {
  const r = nameCompound(input);
  return r ? r.name : null;
}

// All acceptable names (IUPAC first).
export function acceptedNames(input) {
  const r = nameCompound(input);
  if (!r) return [];
  return [r.name, ...r.alternates, ...r.common];
}
