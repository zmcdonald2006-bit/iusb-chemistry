// Shared helpers for question generators.
import { parseSmiles, cloneMol, addAtomTo, neighbors, computeHydrogens, toSmiles, removeAtoms } from '../../chem/smiles.js';
import { canonicalKey } from '../../chem/analyze.js';
import { nameCompound } from '../../chem/namer.js';
import { normalizeName } from '../../chem/nameparse.js';
import { randomMolecule, nearMisses } from '../../chem/generator.js';

export const NR = { text: 'No reaction' };

export function mcq(prompt, choices, answer, extra = {}) {
  return { type: 'mc', prompt, choices, answer, shuffle: true, ...extra };
}

// Structure multiple choice. choices: array of SMILES strings or {text}. answer index.
export function structq(prompt, choices, answer, extra = {}) {
  return { type: 'struct', prompt, choices: choices.map((c) => (typeof c === 'string' ? { smiles: c } : c)), answer, shuffle: true, ...extra };
}

export function distinctByKey(list) {
  const seen = new Set();
  const out = [];
  for (const s of list) {
    if (!s) continue;
    const k = typeof s === 'string' ? canonicalKey(s) : `text:${s.text}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

// Move one atom of element `el` (with its hydrogens) to a different carbon.
// Produces "right formula, wrong position" distractors.
export function relocate(smiles, el, r) {
  const mol = parseSmiles(smiles);
  const xs = mol.atoms.filter((a) => a.el === el && neighbors(mol, a.id).length === 1);
  if (!xs.length) return null;
  const x = r.pick(xs);
  const from = neighbors(mol, x.id)[0];
  const order = mol.bonds[x.bonds[0]].order;
  const carbons = mol.atoms.filter((a) => a.el === 'C' && a.id !== from && a.h >= order);
  if (!carbons.length) return null;
  const to = r.pick(carbons).id;
  const m = removeAtoms(cloneMol(mol), [x.id]);
  const target = to > x.id ? to - 1 : to;
  addAtomTo(m, el, target, order);
  computeHydrogens(m);
  try { return toSmiles(m); } catch { return null; }
}

// Plausible wrong names for a molecule: renumbered-from-the-other-end, reordered prefixes,
// and correct names of near-miss structures.
export function nameDistractors(mol, r, count = 3, fallbackKind = null) {
  const correct = normalizeName(mol.name);
  const out = [];
  const add = (n) => {
    if (!n) return;
    const k = normalizeName(n);
    if (k === correct || out.some((o) => normalizeName(o) === k)) return;
    out.push(n);
  };
  const info = mol.info;
  if (info && info.parts && !info.parts.parent.cyclic) {
    const n = info.parts.parent.n;
    const flipped = mol.name.replace(/\d+(?:,\d+)*/g, (grp) => grp.split(',').map((x) => n + 1 - Number(x)).sort((a, b) => a - b).join(','));
    if (/\d/.test(mol.name)) add(flipped);
  }
  if (info && info.parts && info.parts.prefixes.length >= 2) {
    const ps = info.parts.prefixes;
    const prefixStr = ps.map((p) => `${p.locants.join(',')}-${['', '', 'di', 'tri', 'tetra'][p.locants.length] || ''}${p.name}`);
    const idx = mol.name.indexOf(prefixStr[prefixStr.length - 1]);
    if (idx >= 0) {
      const tail = mol.name.slice(idx + prefixStr[prefixStr.length - 1].length);
      add([...prefixStr].reverse().join('-') + tail);
    }
  }
  for (const nm of nearMisses(mol, r, 6, fallbackKind)) add(nm.name);
  return r.shuffle(out).slice(0, count);
}

export function nameMcq(mol, r, skill, prompt, fallbackKind) {
  const wrong = nameDistractors(mol, r, 3, fallbackKind);
  if (wrong.length < 3) return null;
  return mcq(prompt || 'What is the IUPAC name of this compound?', [mol.name, ...wrong], 0, {
    skill,
    figure: { smiles: mol.smiles },
    explain: explainName(mol),
  });
}

export function drawMcq(mol, r, skill, fallbackKind) {
  const wrong = nearMisses(mol, r, 3, fallbackKind);
  if (wrong.length < 3) return null;
  return structq(`Which structure is **${mol.name}**?`, [mol.smiles, ...wrong.map((w) => w.smiles)], 0, {
    skill,
    explain: `${explainName(mol)}\n\nThe other choices are *${wrong.map((w) => w.name).join('*, *')}*.`,
  });
}

export function nameTyped(mol, skill, prompt, extra = {}) {
  return {
    type: 'name',
    skill,
    prompt: prompt || 'Name this compound (IUPAC).',
    figure: { smiles: mol.smiles },
    name: { smiles: mol.smiles, name: mol.name },
    explain: explainName(mol),
    placeholder: 'e.g. 3-ethyl-2-methylhexane',
    ...extra,
  };
}

// Short step-by-step explanation of how the name was built.
export function explainName(mol) {
  const info = mol.info || nameCompound(mol.smiles);
  if (!info || !info.parts) return `The name is **${mol.name}**.`;
  const p = info.parts;
  const cyc = p.parent.cyclic ? 'cyclo' : '';
  const kindWord = { ane: `${cyc}alkane (-ane)`, ene: `${cyc}alkene (-ene)`, yne: 'alkyne (-yne)', alcohol: 'alcohol (-ol)', thiol: 'thiol (-thiol)', aldehyde: 'aldehyde (-al)', ketone: 'ketone (-one)', acid: 'carboxylic acid (-oic acid)' }[p.parent.kind] || p.parent.kind;
  const lines = [];
  lines.push(`**Parent:** ${p.parent.cyclic ? `a ${p.parent.n}-carbon ring` : `the longest chain has ${p.parent.n} carbons`}${p.parent.kind !== 'ane' && !p.parent.cyclic ? ' (it must include the functional group)' : ''} → ${kindWord}.`);
  if (p.parent.locants.length && !['acid', 'aldehyde'].includes(p.parent.kind)) {
    lines.push(`**Number** so the ${p.parent.kind === 'ene' ? 'C=C' : p.parent.kind === 'yne' ? 'C≡C' : 'functional group'} gets the lowest number: ${p.parent.locants.join(',')}.`);
  } else if (['acid', 'aldehyde'].includes(p.parent.kind)) {
    lines.push(`The ${p.parent.kind === 'acid' ? 'COOH' : 'CHO'} carbon is always **C1**.`);
  }
  if (p.prefixes.length) {
    lines.push(`**Substituents:** ${p.prefixes.map((x) => `${x.name} at ${x.locants.join(', ')}`).join('; ')}${p.prefixes.length > 1 ? ' — listed alphabetically' : ''}.`);
  }
  lines.push(`→ **${mol.name}**`);
  return lines.join('\n');
}

export function moleculeOf(r, kinds) {
  for (let i = 0; i < 10; i++) {
    const m = randomMolecule(r, r.pick(kinds));
    if (m) return m;
  }
  return null;
}

export { randomMolecule, nearMisses, canonicalKey };
