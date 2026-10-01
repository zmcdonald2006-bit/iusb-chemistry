// Condensed structural formulas (CH3CH2CH(CH3)OH style) for acyclic molecules.
import { toMol } from './analyze.js';
import { neighbors, bondBetween } from './smiles.js';
import { findRings } from './graph.js';

const HALO = new Set(['F', 'Cl', 'Br', 'I']);

function hText(n) { return n === 0 ? '' : n === 1 ? 'H' : `H${n}`; }

// Returns a plain-text condensed formula (digits are subscripts when displayed), or null.
export function condensedFormula(input, { compress = true } = {}) {
  let mol;
  try { mol = toMol(input); } catch { return null; }
  if (findRings(mol).length) return null;
  if (mol.atoms.some((a) => a.charge || a.aromatic)) return null;
  const carbons = mol.atoms.filter((a) => a.el === 'C').map((a) => a.id);
  if (!carbons.length) return null;
  if (mol.atoms.some((a) => a.el === 'O' && neighbors(mol, a.id).filter((n) => mol.atoms[n].el === 'C').length === 2)) {
    return etherCondensed(mol, compress);
  }
  const cSet = new Set(carbons);
  const chain = longestCarbonChain(mol, cSet);
  // orient: put CHO / COOH at the right end, otherwise keep the heteroatom-bearing end right
  const score = (c) => {
    const o = neighbors(mol, c).filter((n) => mol.atoms[n].el === 'O');
    return o.length ? 2 : neighbors(mol, c).some((n) => !cSet.has(n)) ? 1 : 0;
  };
  if (chain.length > 1 && score(chain[0]) > score(chain[chain.length - 1])) chain.reverse();
  const onChain = new Set(chain);
  const parts = chain.map((c, idx) => atomText(mol, c, onChain, idx === chain.length - 1, idx === 0));
  let s = '';
  chain.forEach((c, i) => {
    s += parts[i];
    if (i < chain.length - 1) {
      const b = bondBetween(mol, c, chain[i + 1]);
      s += b.order === 2 ? '=' : b.order === 3 ? '≡' : '';
    }
  });
  return compress ? compressCH2(s) : s;
}

function longestCarbonChain(mol, cSet) {
  const far = (from) => {
    const d = new Map([[from, 0]]); const par = new Map(); const q = [from]; let last = from;
    while (q.length) {
      const u = q.shift(); last = u;
      for (const v of neighbors(mol, u)) if (cSet.has(v) && !d.has(v)) { d.set(v, d.get(u) + 1); par.set(v, u); q.push(v); }
    }
    return { last, par };
  };
  const first = [...cSet][0];
  const a = far(first).last;
  const { last: b, par } = far(a);
  const path = [b];
  while (path[path.length - 1] !== a) path.push(par.get(path[path.length - 1]));
  return path.reverse();
}

function branchText(mol, root, from) {
  // Carbon branch written root-first: CH3, CH2CH3, CH(CH3)2 ...
  const kids = neighbors(mol, root).filter((n) => n !== from);
  const a = mol.atoms[root];
  let s = 'C' + hText(a.h);
  const cKids = kids.filter((k) => mol.atoms[k].el === 'C');
  const other = kids.filter((k) => mol.atoms[k].el !== 'C');
  for (const o of other) s += heteroText(mol, o, root, true);
  if (cKids.length === 1) s += branchText(mol, cKids[0], root);
  else if (cKids.length > 1) {
    const texts = cKids.map((k) => branchText(mol, k, root));
    s += groupRepeats(texts);
  }
  return s;
}

function groupRepeats(texts) {
  const counts = new Map();
  for (const t of texts) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts.entries()].map(([t, n]) => `(${t})${n > 1 ? n : ''}`).join('');
}

function heteroText(mol, x, from, inParens) {
  const a = mol.atoms[x];
  const b = bondBetween(mol, x, from);
  if (a.el === 'O' && b.order === 2) return inParens ? '(=O)' : 'O';
  const t = a.el + hText(a.h);
  return inParens ? `(${t})` : t;
}

function atomText(mol, c, onChain, isLast, isFirst) {
  const a = mol.atoms[c];
  const nb = neighbors(mol, c).filter((n) => !onChain.has(n));
  const carbonBranches = nb.filter((n) => mol.atoms[n].el === 'C').map((n) => branchText(mol, n, c));
  const hetero = nb.filter((n) => mol.atoms[n].el !== 'C');
  const dblO = hetero.find((n) => mol.atoms[n].el === 'O' && bondBetween(mol, n, c).order === 2);
  const singleO = hetero.filter((n) => mol.atoms[n].el === 'O' && bondBetween(mol, n, c).order === 1);
  const others = hetero.filter((n) => n !== dblO && !singleO.includes(n));
  const H = hText(a.h);
  // carboxylic acid / aldehyde / ketone
  if (dblO != null && singleO.length === 1 && mol.atoms[singleO[0]].h === 1 && (isLast || isFirst)) return a.h ? 'HCOOH' : isLast ? 'COOH' : 'HOOC';
  if (dblO != null && a.h >= 1 && (isLast || isFirst) && !carbonBranches.length) return isLast ? 'C' + H + 'O' : 'O' + 'C' + H;
  let s = 'C' + H;
  if (dblO != null) s = 'CO' + (a.h ? H : '');
  const terminalHetero = (isLast || (isFirst && false)) && carbonBranches.length === 0 && others.length + singleO.length === 1;
  const hs = [...singleO, ...others].map((n) => heteroText(mol, n, c, !terminalHetero));
  if (isFirst && !isLast && carbonBranches.length === 0 && hs.length === 1 && !dblO) {
    // e.g. HOCH2CH3 / ClCH2CH3 : put the group before the carbon
    const t = hs[0].replace(/[()]/g, '');
    return (t === 'OH' ? 'HO' : t === 'SH' ? 'HS' : t) + s;
  }
  s += hs.join('');
  s += groupRepeats(carbonBranches);
  return s;
}

function etherCondensed(mol, compress) {
  const o = mol.atoms.find((a) => a.el === 'O' && neighbors(mol, a.id).length === 2);
  const [c1, c2] = neighbors(mol, o.id);
  const left = reverseBranch(mol, c1, o.id);
  const right = branchText(mol, c2, o.id);
  if (!left || !right) return null;
  const s = `${left}O${right}`;
  return compress ? compressCH2(s) : s;
}

function reverseBranch(mol, root, from) {
  // Write a simple alkyl group ending at the attachment carbon: CH3CH2– , (CH3)2CH–
  const kids = neighbors(mol, root).filter((n) => n !== from);
  if (kids.some((k) => mol.atoms[k].el !== 'C')) return null;
  const a = mol.atoms[root];
  const me = 'C' + hText(a.h);
  if (!kids.length) return me;
  if (kids.length === 1) {
    const inner = reverseBranch(mol, kids[0], root);
    return inner ? inner + me : null;
  }
  const texts = kids.map((k) => branchText(mol, k, root));
  return groupRepeats(texts) + me;
}

function compressCH2(s) {
  return s.replace(/(?:CH2){3,}/g, (m) => `(CH2)${m.length / 3}`);
}

// Make digits subscripts for display (returns HTML-safe string with <sub>).
export function formulaHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
}
