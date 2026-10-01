// Registry of all question generators. Each generator makes a fresh, auto-graded question
// from a seeded random number generator, so the same seed always recreates the same question.
import { makeRng } from '../lib/random.js';
import { structureGenerators } from './gen/structure.js';
import { reactionGenerators } from './gen/reactions.js';
import { propertyGenerators } from './gen/properties.js';
import { acidBaseGenerators } from './gen/acidbase.js';
import { moleculeOf, nameTyped, nameMcq, drawMcq, mcq } from './gen/common.js';
import { parseSmiles, neighbors } from '../chem/smiles.js';
import { functionalGroups } from '../chem/analyze.js';

const naming = (id, skill, kinds, fallback, placeholder) => [
  { id: `${id}-name`, skill, title: 'Name it (typed)', make(r) { const m = moleculeOf(r, kinds); return m && nameTyped(m, skill, null, placeholder ? { placeholder } : {}); } },
  { id: `${id}-name-mc`, skill, title: 'Name it', make(r) { const m = moleculeOf(r, kinds); return m && nameMcq(m, r, skill, null, fallback); } },
  { id: `${id}-draw`, skill, title: 'Pick the structure', make(r) { const m = moleculeOf(r, kinds); return m && drawMcq(m, r, skill, fallback); } },
];

const extra = [
  ...naming('l05', 'l05.naming', ['alcohol', 'alcohol', 'diol', 'cycloalcohol'], 'alcohol', 'e.g. 4-methyl-2-pentanol'),
  ...naming('l06e', 'l06.ether-naming', ['ether', 'ether', 'simpleEther'], 'ether', 'e.g. 1-methoxybutane'),
  ...naming('l06h', 'l06.halide-naming', ['haloalkane'], 'haloalkane', 'e.g. 2-bromo-3-methylpentane'),
  ...naming('l06t', 'l06.thiol-naming', ['thiol'], 'thiol', 'e.g. 2-butanethiol'),
  ...naming('l08', 'l08.naming', ['aldehyde', 'ketone', 'ketone', 'cycloketone'], 'ketone', 'e.g. 3-methylbutanal'),
  ...naming('l10', 'l10.naming', ['acid'], 'acid', 'e.g. 3-methylpentanoic acid'),
  {
    id: 'l06-common-ether', skill: 'l06.ether-naming', title: 'Common ether names',
    make(r) {
      const m = moleculeOf(r, ['simpleEther']);
      if (!m || !m.info.common.length) return null;
      const common = m.info.common.find((c) => /ether$/.test(c));
      if (!common) return null;
      return {
        type: 'name', skill: 'l06.ether-naming',
        prompt: 'Give the **common name** of this ether.',
        figure: { smiles: m.smiles },
        name: { smiles: m.smiles, name: common, accept: [m.name] },
        explain: `Common names: name **both alkyl groups** on the O, in **alphabetical order**, then add "ether" → **${common}**. (IUPAC: ${m.name}.)`,
        placeholder: 'e.g. ethyl methyl ether',
      };
    },
  },
  {
    id: 'l06-halide-class', skill: 'l06.halide-class', title: '1°, 2° or 3° alkyl halide?',
    make(r) {
      const m = moleculeOf(r, ['haloalkane']);
      const mol = parseSmiles(m.smiles);
      const g = functionalGroups(mol).filter((f) => f.type === 'halide');
      if (g.length !== 1) return null;
      const c = g[0].atoms[1];
      const k = neighbors(mol, c).filter((x) => mol.atoms[x].el === 'C').length;
      if (k < 1) return null;
      return mcq('Classify this alkyl halide.', ['1° (primary)', '2° (secondary)', '3° (tertiary)'], k - 1, {
        skill: 'l06.halide-class', shuffle: false,
        figure: { smiles: m.smiles, highlight: [c] },
        explain: `Look at the carbon holding the halogen (highlighted) and count its **carbon** neighbours: ${k} → **${['', '1°', '2°', '3°'][k]}**.`,
      });
    },
  },
  {
    id: 'l10-alpha', skill: 'l10.structure', title: 'Find the α carbon',
    make(r) {
      const m = moleculeOf(r, ['acid']);
      const mol = parseSmiles(m.smiles);
      const acid = functionalGroups(mol).find((f) => f.type === 'acid');
      if (!acid) return null;
      const cooh = acid.atoms[0];
      const alpha = neighbors(mol, cooh).filter((x) => mol.atoms[x].el === 'C');
      if (!alpha.length) return null;
      const wantBeta = r.chance(0.35);
      let answer = alpha;
      if (wantBeta) answer = neighbors(mol, alpha[0]).filter((x) => x !== cooh && mol.atoms[x].el === 'C');
      if (!answer.length) return null;
      return {
        type: 'atoms', skill: 'l10.structure',
        prompt: `Tap the **${wantBeta ? 'β (beta)' : 'α (alpha)'} carbon**${answer.length > 1 ? 's' : ''}.`,
        figure: { smiles: m.smiles },
        selectable: mol.atoms.filter((a) => a.el === 'C').map((a) => a.id),
        answer,
        explain: `The **α carbon** is bonded directly to the COOH carbon; the **β carbon** is the next one out. (The COOH carbon itself is not α.)`,
      };
    },
  },
];

export const GENERATORS = [...structureGenerators, ...reactionGenerators, ...propertyGenerators, ...acidBaseGenerators, ...extra];

const BY_ID = new Map(GENERATORS.map((g) => [g.id, g]));

export function getGenerator(id) {
  return BY_ID.get(id) || null;
}

export function generatorsForSkill(skillId) {
  return GENERATORS.filter((g) => g.skill === skillId || (g.skills && g.skills.includes(skillId)));
}

// Build a question from a generator + seed. Retries a few seeds if the generator declines.
export function makeGenerated(genId, seed, forSkill = null) {
  const g = getGenerator(genId);
  if (!g) return null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const s = attempt === 0 ? seed : `${seed}:${attempt}`;
    let q = null;
    try { q = g.make(makeRng(s)); } catch (e) { q = null; if (typeof console !== 'undefined' && globalThis.__CC_DEBUG__) console.warn(genId, e); }
    if (!q) continue;
    const skill = forSkill && (g.skill === forSkill || (g.skills || []).includes(forSkill)) ? forSkill : q.skill || g.skill;
    return {
      ...q,
      skill,
      lecture: skill.split('.')[0],
      id: `gen:${genId}:${s}`,
      ref: { key: `g:${genId}:${s}:${skill}`, gen: genId, seed: s, skill },
      generated: true,
    };
  }
  return null;
}
