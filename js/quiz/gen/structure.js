// Generators for structure skills: reading skeletal structures, shapes, formulas,
// naming, carbon classification, isomers, cis/trans and chirality.
import { parseSmiles, neighbors, toSmiles } from '../../chem/smiles.js';
import {
  molecularFormula, carbonClass, shapeOf, chiralityCenters, canonicalKey,
} from '../../chem/analyze.js';
import { nameCompound } from '../../chem/namer.js';
import { condensedFormula } from '../../chem/condensed.js';
import { chainSmiles } from '../../chem/generator.js';
import {
  mcq, structq, nameMcq, drawMcq, nameTyped, moleculeOf, nearMisses, randomMolecule,
} from './common.js';

const ORD = ['', '1°', '2°', '3°', '4°'];
const ORD_WORD = ['', 'primary (1°)', 'secondary (2°)', 'tertiary (3°)', 'quaternary (4°)'];

const READ_KINDS = ['alkane', 'alkene', 'alcohol', 'ketone', 'aldehyde', 'acid', 'cycloalkane', 'ether', 'haloalkane', 'alkyne'];

export const structureGenerators = [
  // ---------------- Lecture 1 ----------------
  {
    id: 'l01-hcount', skill: 'l01.skeletal', title: 'Hidden hydrogens',
    make(r) {
      const m = moleculeOf(r, READ_KINDS);
      const mol = parseSmiles(m.smiles);
      const carbons = mol.atoms.filter((a) => a.el === 'C');
      const c = r.pick(carbons);
      const bonds = c.bonds.reduce((s, b) => s + mol.bonds[b].order, 0);
      return {
        type: 'num', skill: 'l01.skeletal', answer: c.h, tol: 0,
        prompt: 'In this skeletal structure, how many **hydrogen atoms** are bonded to the highlighted carbon?',
        figure: { smiles: m.smiles, highlight: [c.id] },
        explain: `Carbon always makes **4 bonds**. The highlighted carbon already shows ${bonds} bond${bonds === 1 ? '' : 's'} to other atoms (a double bond counts as 2), so it needs 4 − ${bonds} = **${c.h}** H.`,
        hint: 'Count the lines touching that carbon (double bond = 2). Hydrogens fill the rest up to 4.',
      };
    },
  },
  {
    id: 'l01-formula', skill: 'l01.skeletal', title: 'Formula from a skeletal structure',
    make(r) {
      const m = moleculeOf(r, READ_KINDS);
      const f = molecularFormula(m.smiles);
      const mol = parseSmiles(m.smiles);
      const nC = mol.atoms.filter((a) => a.el === 'C').length;
      return {
        type: 'formula', skill: 'l01.skeletal', answer: f,
        prompt: 'Write the **molecular formula** for this compound.',
        figure: { smiles: m.smiles, toggleH: true },
        explain: `Every corner and line end is a carbon (${nC} C). Add hydrogens so each C has 4 bonds, and count any heteroatoms and their H's. Formula: **$${f}$**.`,
        hint: 'Tap "Show H" under the drawing to see the hidden hydrogens.',
        placeholder: 'e.g. C5H12O',
      };
    },
  },
  {
    id: 'l01-shape', skill: 'l01.shapes', title: 'Shape around an atom',
    make(r) {
      const pool = ['CCO', 'COC', 'CC=O', 'CC(C)=O', 'C=CC', 'C#CC', 'CCN', 'CNC', 'CC(=O)O', 'CCC', 'CC=CC', 'CC#N', 'OCC=O', 'NCC(=O)O', 'CS', 'CC(C)(C)O'];
      const smi = r.pick(pool);
      const mol = parseSmiles(smi);
      const candidates = mol.atoms.filter((a) => {
        const sh = shapeOf(mol, a.id);
        return sh.name !== 'other' && sh.bonded >= 2 && ['C', 'O', 'N', 'S'].includes(a.el);
      });
      const atom = r.pick(candidates);
      const sh = shapeOf(mol, atom.id);
      const choices = ['tetrahedral', 'trigonal planar', 'linear', 'bent', 'trigonal pyramidal'];
      const lpText = sh.lp ? ` and **${sh.lp} lone pair${sh.lp > 1 ? 's' : ''}**` : '';
      return mcq('What is the **shape** around the highlighted atom?', choices, choices.indexOf(sh.name), {
        skill: 'l01.shapes', shuffle: false,
        figure: { smiles: smi, highlight: [atom.id], mode: 'condensed' },
        explain: `Count groups around the atom: ${sh.bonded} bonded atom${sh.bonded > 1 ? 's' : ''}${lpText} = ${sh.groups} groups. ${sh.groups === 4 ? '4 groups → tetrahedral arrangement' : sh.groups === 3 ? '3 groups → trigonal planar arrangement' : '2 groups → linear'}${sh.lp ? `; with lone pairs the *shape* is **${sh.name}**` : ` → **${sh.name}**`} (≈${sh.angle}°).`,
      });
    },
  },
  {
    id: 'l01-angle', skill: 'l01.shapes', title: 'Bond angles',
    make(r) {
      const pool = ['CCC', 'C=CC', 'C#CC', 'CC(C)=O', 'CCO', 'CC=O', 'C=C', 'CC#C'];
      const smi = r.pick(pool);
      const mol = parseSmiles(smi);
      const carbons = mol.atoms.filter((a) => a.el === 'C' && shapeOf(mol, a.id).bonded >= 2);
      const atom = r.pick(carbons);
      const sh = shapeOf(mol, atom.id);
      const choices = ['109.5°', '120°', '180°'];
      return mcq('What is the approximate **bond angle** around the highlighted carbon?', choices, choices.indexOf(`${sh.angle}°`), {
        skill: 'l01.shapes', shuffle: false,
        figure: { smiles: smi, highlight: [atom.id], mode: 'condensed' },
        explain: `The highlighted C has ${sh.groups} groups around it → **${sh.name}**, ${sh.angle}°. Quick rule: 4 single bonds → 109.5°; a double bond → 120°; a triple bond → 180°.`,
      });
    },
  },
  {
    id: 'l01-condensed', skill: 'l01.condensed', title: 'Condensed → skeletal',
    make(r) {
      const m = moleculeOf(r, ['alkane', 'alkene', 'alcohol', 'ketone', 'aldehyde', 'acid', 'haloalkane', 'simpleEther']);
      const cond = condensedFormula(m.smiles);
      if (!cond) return null;
      const wrong = nearMisses(m, r, 3, 'alkane');
      if (wrong.length < 3) return null;
      return structq(`Which skeletal structure matches the condensed formula **$${cond}$**?`, [m.smiles, ...wrong.map((w) => w.smiles)], 0, {
        skill: 'l01.condensed',
        explain: `Read the condensed formula left to right: each $CH_3$, $CH_2$ or $CH$ is one carbon; groups in parentheses are branches on the carbon just before them. This is **${m.name}**.`,
      });
    },
  },
  {
    id: 'l01-to-condensed', skill: 'l01.condensed', title: 'Skeletal → condensed',
    make(r) {
      const m = moleculeOf(r, ['alkane', 'alcohol', 'ketone', 'alkene', 'haloalkane']);
      const cond = condensedFormula(m.smiles);
      if (!cond) return null;
      const others = nearMisses(m, r, 5, 'alkane').map((w) => condensedFormula(w.smiles)).filter((c) => c && c !== cond);
      const uniq = [...new Set(others)].slice(0, 3);
      if (uniq.length < 3) return null;
      return mcq('Which **condensed formula** matches this skeletal structure?', [`$${cond}$`, ...uniq.map((u) => `$${u}$`)], 0, {
        skill: 'l01.condensed',
        figure: { smiles: m.smiles, toggleH: true },
        explain: `Walk along the longest chain writing each carbon with its hydrogens ($CH_3$, $CH_2$, $CH$), putting branches in parentheses right after the carbon they hang from: **$${cond}$**.`,
      });
    },
  },

  // ---------------- Lecture 3 ----------------
  {
    id: 'l03-cclass', skill: 'l03.carbon-class', title: 'Classify a carbon',
    make(r) {
      const m = moleculeOf(r, ['alkane', 'alkane', 'cycloalkane']);
      const mol = parseSmiles(m.smiles);
      const carbons = mol.atoms.filter((a) => a.el === 'C');
      // favour the more interesting classes
      const weighted = carbons.flatMap((c) => Array(carbonClass(mol, c.id) >= 3 ? 3 : carbonClass(mol, c.id) === 2 ? 2 : 1).fill(c));
      const c = r.pick(weighted);
      const k = carbonClass(mol, c.id);
      return mcq('Classify the highlighted carbon.', ORD.slice(1).map((o, i) => `${o} — bonded to ${i + 1} C`), k - 1, {
        skill: 'l03.carbon-class', shuffle: false,
        figure: { smiles: m.smiles, highlight: [c.id] },
        explain: `Count only the **carbons** attached to it (ignore H's). It is bonded to ${k} carbon${k > 1 ? 's' : ''} → **${ORD_WORD[k]}**.`,
      });
    },
  },
  {
    id: 'l03-cclass-tap', skill: 'l03.carbon-class', title: 'Find all carbons of a type',
    make(r) {
      const m = moleculeOf(r, ['alkane', 'alkane', 'cycloalkane']);
      const mol = parseSmiles(m.smiles);
      const classes = [2, 3, 4].filter((k) => mol.atoms.some((a) => a.el === 'C' && carbonClass(mol, a.id) === k));
      if (!classes.length) return null;
      const k = r.pick(classes.includes(3) ? [3, 3, ...classes] : classes);
      const ans = mol.atoms.filter((a) => a.el === 'C' && carbonClass(mol, a.id) === k).map((a) => a.id);
      return {
        type: 'atoms', skill: 'l03.carbon-class',
        prompt: `Tap **every ${ORD_WORD[k]}** carbon.`,
        figure: { smiles: m.smiles },
        selectable: mol.atoms.filter((a) => a.el === 'C').map((a) => a.id),
        answer: ans,
        explain: `A ${ORD[k]} carbon is bonded to exactly ${k} other carbons. There ${ans.length === 1 ? 'is **1**' : `are **${ans.length}**`} here (highlighted in the answer).`,
      };
    },
  },
  {
    id: 'l03-cclass-count', skill: 'l03.carbon-class', title: 'Count carbon types',
    make(r) {
      const m = moleculeOf(r, ['alkane']);
      const mol = parseSmiles(m.smiles);
      const k = r.pick([1, 2, 3]);
      const n = mol.atoms.filter((a) => a.el === 'C' && carbonClass(mol, a.id) === k).length;
      return {
        type: 'num', skill: 'l03.carbon-class', answer: n, tol: 0,
        prompt: `How many **${ORD_WORD[k]}** carbons are in this molecule?`,
        figure: { smiles: m.smiles },
        explain: `Go carbon by carbon and count its carbon neighbours. ${ORD[k]} carbons: **${n}**. (Chain ends are always 1°.)`,
      };
    },
  },
  {
    id: 'l03-name', skill: 'l03.naming', title: 'Name the alkane (typed)',
    make(r) { const m = moleculeOf(r, ['alkane', 'alkane', 'alkane', 'cycloalkane']); return nameTyped(m, 'l03.naming'); },
  },
  {
    id: 'l03-name-mc', skill: 'l03.naming', title: 'Name the alkane',
    make(r) { const m = moleculeOf(r, ['alkane', 'alkane', 'cycloalkane']); return nameMcq(m, r, 'l03.naming', null, 'alkane'); },
  },
  {
    id: 'l03-draw', skill: 'l03.drawing', title: 'Pick the structure',
    make(r) { const m = moleculeOf(r, ['alkane', 'alkane', 'cycloalkane']); return drawMcq(m, r, 'l03.drawing', 'alkane'); },
  },
  {
    id: 'l03-stem', skill: 'l03.names-1-10', title: 'Chain names 1–10',
    make(r) {
      const n = r.int(1, 10);
      const names = ['', 'methane', 'ethane', 'propane', 'butane', 'pentane', 'hexane', 'heptane', 'octane', 'nonane', 'decane'];
      if (r.chance(0.5)) {
        return {
          type: 'text', skill: 'l03.names-1-10', answer: names[n],
          prompt: `What is the name of the straight-chain alkane with **${n} carbon${n > 1 ? 's' : ''}**?`,
          figure: n > 1 ? { smiles: 'C'.repeat(n) } : null,
          explain: `Meth (1), eth (2), prop (3), but (4), pent (5), hex (6), hept (7), oct (8), non (9), dec (10) + **-ane** → **${names[n]}**.`,
          placeholder: 'e.g. pentane',
        };
      }
      return {
        type: 'num', skill: 'l03.names-1-10', answer: n, tol: 0,
        prompt: `How many carbons are in **${names[n]}**?`,
        explain: `Meth 1 · eth 2 · prop 3 · but 4 · pent 5 · hex 6 · hept 7 · oct 8 · non 9 · dec 10. So ${names[n]} has **${n}**.`,
      };
    },
  },
  {
    id: 'l03-formula-rule', skill: 'l03.formulas', title: 'CnH2n+2',
    make(r) {
      const n = r.int(3, 12);
      const cyclic = r.chance(0.35);
      const h = cyclic ? 2 * n : 2 * n + 2;
      const f = `C${n}H${h}`;
      if (r.chance(0.5)) {
        return {
          type: 'formula', skill: 'l03.formulas', answer: f,
          prompt: `What is the molecular formula of ${cyclic ? `a **cycloalkane** with ${n} carbons` : `an **acyclic alkane** with ${n} carbons`}?`,
          explain: cyclic ? `Cycloalkanes follow **$C_nH_{2n}$** (the ring closure uses up 2 H). With n = ${n}: **$${f}$**.` : `Acyclic alkanes follow **$C_nH_{2n+2}$**. With n = ${n}: 2(${n}) + 2 = ${h} → **$${f}$**.`,
        };
      }
      const choices = ['acyclic alkane ($C_nH_{2n+2}$)', 'cycloalkane or alkene ($C_nH_{2n}$)', 'alkyne ($C_nH_{2n-2}$)'];
      const kind = r.int(0, 2);
      const hh = [2 * n + 2, 2 * n, 2 * n - 2][kind];
      return mcq(`A hydrocarbon has formula **$C${n}H${hh}$**. Which family fits?`, choices, kind, {
        skill: 'l03.formulas', shuffle: false,
        explain: `Compare H to 2n + 2 = ${2 * n + 2}: ${hh === 2 * n + 2 ? 'equal → saturated acyclic alkane' : hh === 2 * n ? '2 fewer H → one ring **or** one C=C' : '4 fewer H → one C≡C (or two rings/double bonds)'}.`,
      });
    },
  },
  {
    id: 'l03-isomers', skill: 'l03.isomers', title: 'Same, isomers, or different?',
    make(r) {
      const m = moleculeOf(r, ['alkane', 'alkane', 'alcohol', 'haloalkane']);
      const kind = r.pick(['same', 'isomer', 'isomer', 'different']);
      let other;
      if (kind === 'same') {
        const mol = parseSmiles(m.smiles);
        const ends = mol.atoms.filter((a) => neighbors(mol, a.id).length === 1).map((a) => a.id);
        const root = r.pick(ends.length > 1 ? ends.slice(1) : ends);
        other = toSmiles(mol, { root });
      } else {
        const f = molecularFormula(m.smiles);
        const cands = nearMisses(m, r, 8, 'alkane').filter((c) => (molecularFormula(c.smiles) === f) === (kind === 'isomer'));
        if (!cands.length) return null;
        other = cands[0].smiles;
      }
      const choices = ['The same compound', 'Constitutional isomers', 'Different compounds (not isomers)'];
      const ans = kind === 'same' ? 0 : kind === 'isomer' ? 1 : 2;
      const f1 = molecularFormula(m.smiles), f2 = molecularFormula(other);
      return mcq('How are these two structures related?', choices, ans, {
        skill: 'l03.isomers', shuffle: false,
        figure: { mols: [{ smiles: m.smiles, caption: 'A' }, { smiles: other, caption: 'B' }] },
        explain: ans === 0
          ? `Both are **${m.name}** ($${f1}$) — just drawn differently. Bends and which end you start from don't matter.`
          : ans === 1
            ? `Both have formula **$${f1}$** but the atoms are connected differently (A is ${m.name}; B is ${nameCompound(other)?.name || 'a different arrangement'}) → **constitutional isomers**.`
            : `A is $${f1}$ and B is $${f2}$. Different formulas → **not isomers**.`,
      });
    },
  },

  // ---------------- Lecture 4 ----------------
  {
    id: 'l04-name', skill: 'l04.naming', title: 'Name the alkene/alkyne (typed)',
    make(r) { const m = moleculeOf(r, ['alkene', 'alkene', 'alkyne', 'diene', 'cycloalkene']); return nameTyped(m, 'l04.naming', null, { placeholder: 'e.g. 4-methyl-2-pentene' }); },
  },
  {
    id: 'l04-name-mc', skill: 'l04.naming', title: 'Name the alkene/alkyne',
    make(r) { const m = moleculeOf(r, ['alkene', 'alkene', 'alkyne', 'cycloalkene']); return nameMcq(m, r, 'l04.naming', null, 'alkene'); },
  },
  {
    id: 'l04-draw', skill: 'l04.naming', title: 'Pick the alkene/alkyne',
    make(r) { const m = moleculeOf(r, ['alkene', 'alkyne', 'diene']); return drawMcq(m, r, 'l04.naming', 'alkene'); },
  },
  {
    id: 'l04-cistrans', skill: 'l04.cis-trans', title: 'Cis or trans?',
    make(r) {
      const n = r.int(4, 7);
      const p = r.int(2, n - 2);
      const cis = r.chance(0.5);
      let smi = '';
      for (let i = 1; i <= n; i++) {
        if (i === p) smi += '/';
        if (i === p + 2) smi += cis ? '\\' : '/';
        smi += 'C';
        if (i === p) smi += '=';
      }
      const nm = nameCompound(smi);
      if (!nm) return null;
      return mcq('Is this alkene **cis** or **trans**?', ['cis', 'trans'], cis ? 0 : 1, {
        skill: 'l04.cis-trans', shuffle: false,
        figure: { smiles: smi },
        explain: `Look at the two carbon chains attached to the C=C. They are on ${cis ? 'the **same side**' : '**opposite sides**'} → **${cis ? 'cis' : 'trans'}**. Full name: **${nm.name}**.`,
      });
    },
  },
  {
    id: 'l04-cistrans-possible', skill: 'l04.cis-trans', title: 'Can it be cis/trans?',
    make(r) {
      const pool = [
        ['CC=CC', true, 'each C of the C=C has an H and a CH₃'],
        ['C=CCC', false, 'C1 has two H atoms'],
        ['CC(C)=CC', false, 'one carbon has two identical CH₃ groups'],
        ['CCC=CCC', true, 'each C of the C=C has an H and an ethyl group'],
        ['C=C', false, 'each carbon has two H atoms'],
        ['CC=CCC', true, 'each C has two different groups (H + a carbon chain)'],
        ['CC(C)=C(C)C', false, 'each carbon has two identical CH₃ groups'],
        ['C=C(C)CC', false, 'one carbon has two H atoms'],
        ['CCC(C)=CC', true, 'one C has CH₃ + ethyl, the other has CH₃ + H — both ends have two different groups'],
        ['ClC=CCl', true, 'each C has an H and a Cl'],
        ['ClC(Cl)=CC', false, 'one carbon has two identical Cl atoms'],
        ['CC=C(C)C', false, 'one carbon has two identical CH₃ groups'],
      ];
      const [smi, yes, why] = r.pick(pool);
      return {
        type: 'tf', skill: 'l04.cis-trans', answer: yes,
        prompt: 'True or false: this alkene can exist as **cis and trans** isomers.',
        figure: { smiles: smi, mode: 'condensed' },
        explain: `${yes ? '**True**' : '**False**'} — ${why}. Cis/trans isomers need **two different groups on each carbon** of the C=C.`,
      };
    },
  },
  {
    id: 'l04-formula', skill: 'l04.formulas', title: 'Alkene & alkyne formulas',
    make(r) {
      const n = r.int(2, 10);
      const kind = r.pick(['alkene', 'alkyne']);
      const h = kind === 'alkene' ? 2 * n : 2 * n - 2;
      return {
        type: 'formula', skill: 'l04.formulas', answer: `C${n}H${h}`,
        prompt: `What is the molecular formula of an acyclic **${kind}** with ${n} carbons and one ${kind === 'alkene' ? 'C=C' : 'C≡C'}?`,
        explain: kind === 'alkene' ? `Alkenes: **$C_nH_{2n}$** → $C${n}H${h}$.` : `Alkynes: **$C_nH_{2n-2}$** → $C${n}H${h}$.`,
      };
    },
  },

  // ---------------- Lecture 7 ----------------
  {
    id: 'l07-tap', skill: 'l07.find-centers', title: 'Tap the chirality centers',
    make(r) {
      const m = moleculeOf(r, ['alcohol', 'haloalkane', 'alkane', 'cycloalkane', 'cycloalcohol', 'ketone', 'acid', 'aldehyde']);
      const centers = chiralityCenters(m.smiles);
      const mol = parseSmiles(m.smiles);
      return {
        type: 'atoms', skill: 'l07.find-centers', allowNone: true,
        prompt: 'Tap **every chirality center** (a carbon with four different groups). If there are none, tap **None**.',
        figure: { smiles: m.smiles, toggleH: true },
        selectable: mol.atoms.filter((a) => a.el === 'C').map((a) => a.id),
        answer: centers,
        explain: centers.length
          ? `${centers.length === 1 ? 'One carbon has' : `${centers.length} carbons have`} four **different** groups (count the H as a group). CH₃ and CH₂ carbons and C=O / C=C carbons can never be chirality centers.`
          : 'No carbon here has four different groups. Remember: CH₃ and CH₂ carbons have two identical H\'s, and double-bond carbons have only three groups.',
      };
    },
  },
  {
    id: 'l07-count', skill: 'l07.find-centers', title: 'Count chirality centers',
    make(r) {
      const curated = [
        ['CC(N)C(=O)O', 'alanine'], ['CC(O)C(=O)O', 'lactic acid'], ['CC(C)Cc1ccc(cc1)C(C)C(=O)O', 'ibuprofen'],
        ['OCC(O)C(O)C(O)C(O)C=O', 'glucose (open chain)'], ['CC(O)CC', '2-butanol'], ['CCC(O)CC', '3-pentanol'],
        ['CC1CCCCC1Cl', '1-chloro-2-methylcyclohexane'], ['CC(Cl)C(C)Br', '2-bromo-3-chlorobutane'], ['OCC(O)CO', 'glycerol'],
        ['CC(C)C1CCC(C)CC1O', 'menthol'],
      ];
      let smi, label;
      if (r.chance(0.5)) [smi, label] = r.pick(curated);
      else { const m = moleculeOf(r, ['alcohol', 'haloalkane', 'cycloalkane', 'alkane']); smi = m.smiles; label = m.name; }
      const n = chiralityCenters(smi).length;
      return {
        type: 'num', skill: 'l07.find-centers', answer: n, tol: 0,
        prompt: `How many **chirality centers** are in ${label ? `*${label}*` : 'this molecule'}?`,
        figure: { smiles: smi, toggleH: true },
        explain: `Check each sp³ carbon for four different groups. Count: **${n}**.`,
      };
    },
  },
  {
    id: 'l07-chiral-yn', skill: 'l07.chiral-achiral', title: 'Chiral or achiral?',
    make(r) {
      const m = moleculeOf(r, ['alcohol', 'haloalkane', 'alkane', 'ketone', 'thiol']);
      const n = chiralityCenters(m.smiles).length;
      if (n > 1) return null; // avoid meso cases
      return mcq('Is this molecule **chiral** or **achiral**?', ['Chiral', 'Achiral'], n === 1 ? 0 : 1, {
        skill: 'l07.chiral-achiral', shuffle: false,
        figure: { smiles: m.smiles },
        explain: n === 1 ? 'It has **one chirality center** (a carbon with 4 different groups), so it is not superimposable on its mirror image → **chiral**.' : 'No carbon has four different groups, so the molecule is superimposable on its mirror image → **achiral**.',
      });
    },
  },
  {
    id: 'l07-relation', skill: 'l07.enantiomers', title: 'Enantiomers or identical?',
    make(r) {
      const sets = [['OH', 'CH3', 'H', 'CH2CH3'], ['Br', 'CH3', 'H', 'CH2CH2CH3'], ['NH2', 'CH3', 'H', 'COOH'], ['Cl', 'Br', 'H', 'F'], ['OH', 'H', 'CH3', 'COOH']];
      const g = r.pick(sets);
      const swaps = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
      let b = [...g];
      let mirror = false;
      const mode = r.pick(['mirror', 'swap1', 'swap2', 'mirror-swap']);
      let parity = 0;
      if (mode === 'mirror' || mode === 'mirror-swap') { mirror = true; parity ^= 1; }
      const nSwaps = mode === 'swap1' || mode === 'mirror-swap' ? 1 : mode === 'swap2' ? 2 : 0;
      let last = null;
      for (let i = 0; i < nSwaps; i++) {
        let sw;
        do { sw = r.pick(swaps); } while (last && sw[0] === last[0] && sw[1] === last[1]);
        last = sw;
        [b[sw[0]], b[sw[1]]] = [b[sw[1]], b[sw[0]]];
        parity ^= 1;
      }
      const enant = parity === 1;
      return mcq('How are these two drawings related?', ['Identical (same molecule)', 'Enantiomers'], enant ? 1 : 0, {
        skill: 'l07.enantiomers', shuffle: false,
        figure: { tetras: [{ groups: g, caption: 'A' }, { groups: b, mirror, caption: 'B' }] },
        explain: `${mode === 'mirror' ? 'B is the exact mirror image of A' : mode === 'mirror-swap' ? 'B is a mirror image *plus* one swap of two groups' : mode === 'swap1' ? 'B has exactly one pair of groups swapped' : 'B has two pairs of groups swapped'}. Each mirror or single swap flips the handedness${nSwaps + (mirror ? 1 : 0) > 1 ? ', and two flips cancel out' : ''} → **${enant ? 'enantiomers' : 'identical'}**.`,
      });
    },
  },
];

export { chainSmiles, canonicalKey, randomMolecule };
