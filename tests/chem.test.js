import { describe, it, expect } from './harness.js';
import { parseSmiles, toSmiles } from '../js/chem/smiles.js';
import { findRings } from '../js/chem/graph.js';
import {
  molecularFormula, carbonClass, chiralityCenters, functionalGroupTypes, shapeOf,
  canonicalKey, sameMolecule, substitutionClass, sameFormula,
} from '../js/chem/analyze.js';
import { iupacName, nameCompound } from '../js/chem/namer.js';
import { parseName } from '../js/chem/nameparse.js';
import { checkName } from '../js/chem/namecheck.js';

describe('SMILES parser', () => {
  it('parses simple chains with implicit hydrogens', () => {
    const m = parseSmiles('CCO');
    expect(m.atoms.length).toBe(3);
    expect(m.atoms.map((a) => a.h)).toEqual([3, 2, 1]);
  });
  it('handles double and triple bonds', () => {
    expect(parseSmiles('C=C').atoms.map((a) => a.h)).toEqual([2, 2]);
    expect(parseSmiles('C#C').atoms.map((a) => a.h)).toEqual([1, 1]);
  });
  it('handles branches and rings', () => {
    const m = parseSmiles('CC(C)C1CCCCC1');
    expect(m.atoms.length).toBe(9);
    expect(findRings(m).length).toBe(1);
    expect(findRings(m)[0].length).toBe(6);
  });
  it('kekulizes benzene', () => {
    const m = parseSmiles('c1ccccc1');
    expect(m.bonds.filter((b) => b.order === 2).length).toBe(3);
    expect(m.atoms.every((a) => a.h === 1)).toBeTruthy();
  });
  it('parses charged bracket atoms and salts', () => {
    const m = parseSmiles('CC(=O)[O-].[Na+]');
    expect(m.atoms[3].charge).toBe(-1);
    expect(m.atoms[4].el).toBe('Na');
    expect(m.atoms[4].charge).toBe(1);
  });
  it('reads cis/trans markers', () => {
    expect(parseSmiles('C/C=C/C').stereo[0].cis).toBe(false);
    expect(parseSmiles('C/C=C\\C').stereo[0].cis).toBe(true);
    expect(parseSmiles('C(/C)=C/C').stereo[0].cis).toBe(true);
  });
  it('finds both rings in a fused system', () => {
    const rings = findRings(parseSmiles('c1ccc2ccccc2c1'));
    expect(rings.length).toBe(2);
    expect(rings.map((r) => r.length)).toEqual([6, 6]);
  });
  it('rejects malformed input', () => {
    expect(() => parseSmiles('CC(')).toThrow();
    expect(() => parseSmiles('C1CC')).toThrow();
    expect(() => parseSmiles('')).toThrow();
    expect(() => parseSmiles('CXC')).toThrow();
  });
  it('round-trips through the writer', () => {
    for (const s of ['CC(C)CC(=O)O', 'C1CCCCC1O', 'CC(=O)[O-].[Na+]', 'C#CC(C)(C)C', 'c1ccccc1C=O', 'OCC(O)CO']) {
      expect(sameMolecule(toSmiles(parseSmiles(s)), s)).toBeTruthy();
    }
  });
});

describe('Formulas', () => {
  const cases = [
    ['C', 'CH4'], ['CCCC', 'C4H10'], ['CC=CC', 'C4H8'], ['CC#CC', 'C4H6'], ['C1CCCCC1', 'C6H12'],
    ['CCO', 'C2H6O'], ['COC', 'C2H6O'], ['CC(=O)O', 'C2H4O2'], ['ClC(Cl)Cl', 'CHCl3'],
    ['c1ccccc1', 'C6H6'], ['CC(=O)[O-].[Na+]', 'C2H3NaO2'], ['O', 'H2O'], ['[NH4+]', 'H4N+'],
  ];
  for (const [smi, f] of cases) it(`${smi} -> ${f}`, () => expect(molecularFormula(smi)).toBe(f));
  it('compares formulas regardless of order', () => {
    expect(sameFormula('C2H6O', 'H6C2O')).toBeTruthy();
    expect(sameFormula('C₂H₆O', 'C2H6O')).toBeTruthy();
    expect(sameFormula('C2H6O', 'C2H5O')).toBeFalsy();
  });
});

describe('Carbon classification', () => {
  it('classifies 1°, 2°, 3°, 4° carbons in 2,2,4-trimethylpentane', () => {
    // CC(C)(C)CC(C)C : atoms 0..7
    const smi = 'CC(C)(C)CC(C)C';
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((i) => carbonClass(smi, i))).toEqual([1, 4, 1, 1, 2, 3, 1, 1]);
  });
  it('classifies alcohols', () => {
    expect(substitutionClass('CCCO')).toBe(1);
    expect(substitutionClass('CC(O)C')).toBe(2);
    expect(substitutionClass('CC(C)(C)O')).toBe(3);
    expect(substitutionClass('CC(Br)C', 'halide')).toBe(2);
  });
});

describe('VSEPR shapes', () => {
  it('matches the course conventions', () => {
    expect(shapeOf('C', 0).name).toBe('tetrahedral');
    expect(shapeOf('O=C=O', 1).name).toBe('linear');
    expect(shapeOf('O', 0).name).toBe('bent');
    expect(shapeOf('N', 0).name).toBe('trigonal pyramidal');
    expect(shapeOf('C=C', 0).name).toBe('trigonal planar');
    expect(shapeOf('CC=O', 1).angle).toBe(120);
    expect(shapeOf('C#C', 0).angle).toBe(180);
    expect(shapeOf('COC', 1).name).toBe('bent');
  });
});

describe('Chirality centers', () => {
  const cases = [
    ['CC(O)CC', [1]], // 2-butanol
    ['CCC(O)CC', []], // 3-pentanol
    ['CC(Br)CCC', [1]], // 2-bromopentane
    ['CCC(Br)CC', []], // 3-bromopentane
    ['CC1CCCCC1', []], // methylcyclohexane
    ['CC1CCCCC1Cl', [1, 6]], // 1-chloro-2-methylcyclohexane
    ['ClC1CCCC1', []], // chlorocyclopentane
    ['CCC(C)CC', []], // 3-methylpentane
    ['CCC(O)C(C)Cl', [2, 4]],
    ['BrC(Cl)F', [1]], // CHBrClF
    ['ClCBr', []],
    ['CC(C)C=O', []],
    ['CC(N)C(=O)O', [1]], // alanine
    ['CC1CCC(C)CC1', []], // 1,4-dimethylcyclohexane (achiral centers)
    ['CC1CCCC(C)C1', [1, 5]], // 1,3-dimethylcyclohexane: two stereocenters
  ];
  for (const [smi, exp] of cases) it(smi, () => expect(chiralityCenters(smi)).toEqual(exp));
});

describe('Functional groups', () => {
  const cases = [
    ['CCO', ['alcohol']], ['COC', ['ether']], ['CC=O', ['aldehyde']], ['CC(C)=O', ['ketone']],
    ['CC(=O)O', ['acid']], ['CC(=O)OC', ['ester']], ['CC(N)=O', ['amide']], ['CCN', ['amine']],
    ['CCS', ['thiol']], ['CSSC', ['disulfide']], ['CCCl', ['halide']], ['C=C', ['alkene']], ['C#C', ['alkyne']],
    ['c1ccccc1', ['aromatic']], ['Oc1ccccc1', ['phenol', 'aromatic']], ['CC(=O)[O-]', ['carboxylate']],
  ];
  for (const [smi, exp] of cases) it(smi, () => expect(functionalGroupTypes(smi).sort()).toEqual([...exp].sort()));
  it('finds all groups in tyrosine', () => {
    expect(functionalGroupTypes('NC(Cc1ccc(O)cc1)C(=O)O').sort()).toEqual(['acid', 'amine', 'aromatic', 'phenol']);
  });
  it('finds groups in isoamyl acetate and glucose', () => {
    expect(functionalGroupTypes('CC(=O)OCCC(C)C')).toEqual(['ester']);
    expect(functionalGroupTypes('OCC(O)C(O)C(O)C(O)C=O').sort()).toEqual(['alcohol', 'aldehyde']);
  });
});

describe('Canonical comparison', () => {
  it('treats different SMILES of the same compound as equal', () => {
    expect(sameMolecule('CCCC(C)C', 'CC(C)CCC')).toBeTruthy();
    expect(sameMolecule('OCC', 'CCO')).toBeTruthy();
    expect(sameMolecule('C1CCCCC1C', 'CC1CCCCC1')).toBeTruthy();
  });
  it('distinguishes isomers', () => {
    expect(sameMolecule('CCO', 'COC')).toBeFalsy();
    expect(sameMolecule('CC(C)CC', 'CCCCC')).toBeFalsy();
    expect(sameMolecule('CC1CCCC(C)C1', 'CC1CCC(C)CC1')).toBeFalsy();
    expect(canonicalKey('C=CCC') === canonicalKey('CC=CC')).toBeFalsy();
  });
});

// [SMILES, expected IUPAC name, optional common name]
export const NAME_CASES = [
  ['C', 'methane'], ['CC', 'ethane'], ['CCC', 'propane'], ['CCCC', 'butane'], ['CCCCCCCCCC', 'decane'],
  ['CC(C)C', '2-methylpropane', 'isobutane'],
  ['CC(C)CCCC', '2-methylhexane'],
  ['CC(C)C(C)CCC', '2,3-dimethylhexane'],
  ['CC(C)CCC(CC)C(C)CC', '5-ethyl-2,6-dimethyloctane'],
  ['CC(C)CC(C)C(CC)CCC', '5-ethyl-2,4-dimethyloctane'],
  ['CC(C)CC(C)(C(C)C)CCC', '4-isopropyl-2,4-dimethylheptane'],
  ['CCC(C)CCC', '3-methylhexane'],
  ['CCC(CC)(CC)CC', '3,3-diethylpentane'],
  ['CC(C)(C)CC(C)C', '2,2,4-trimethylpentane'],
  ['CC(C)C(CC)CCC', '3-ethyl-2-methylhexane'],
  ['CCC(C)C(C)(C)C', '2,2,3-trimethylpentane'],
  ['CCCC(C(C)C)CCC', '4-isopropylheptane'],
  ['CCC(CC)C(C)(C)C', '3-ethyl-2,2-dimethylpentane'],
  ['C1CCCCC1', 'cyclohexane'], ['C1CC1', 'cyclopropane'], ['CC1CCCCC1', 'methylcyclohexane'],
  ['CCC1CCCC(C)C1', '1-ethyl-3-methylcyclohexane'], ['ClC1CCCC1', 'chlorocyclopentane'],
  ['BrC1CCCCC1', 'bromocyclohexane'], ['CC1(C)CCCCC1', '1,1-dimethylcyclohexane'],
  ['CC(C)C1CCCCC1', 'isopropylcyclohexane'],
  ['C=C', 'ethene', 'ethylene'], ['CC=C', 'propene', 'propylene'], ['C=CCC', '1-butene'], ['CC=CC', '2-butene'],
  ['C/C=C/C', 'trans-2-butene'], ['C/C=C\\C', 'cis-2-butene'], ['CC/C=C\\CC', 'cis-3-hexene'],
  ['C#C', 'ethyne', 'acetylene'], ['C#CCC', '1-butyne'], ['CC#CCCC', '2-hexyne'], ['CC#CC(C)(C)C', '4,4-dimethyl-2-pentyne'],
  ['C=CC=C', '1,3-butadiene'], ['C=CCC=C(C)C', '5-methyl-1,4-hexadiene'], ['CC=C(CCC)CCC', '3-propyl-2-hexene'],
  ['C=C(C)C', '2-methylpropene'], ['CC(C)C=C', '3-methyl-1-butene'],
  ['CC1=CCCC1', '1-methylcyclopentene'], ['C1=CCCCC1', 'cyclohexene'], ['CC1=CCCCC1C', '1,6-dimethylcyclohexene'],
  ['CC1CCCC=C1', '3-methylcyclohexene'],
  ['CO', 'methanol', 'methyl alcohol'], ['CCO', 'ethanol', 'ethyl alcohol'], ['CCCO', '1-propanol'], ['CC(C)O', '2-propanol', 'isopropyl alcohol'],
  ['CC(O)CCCCC', '2-heptanol'], ['CC(C)(C)C(O)CCCCCCC', '2,2-dimethyl-3-decanol'],
  ['OC1CCCCC1', 'cyclohexanol'], ['CC1CCCCC1O', '2-methylcyclohexanol'], ['OCCO', '1,2-ethanediol', 'ethylene glycol'],
  ['OC1CCCC1O', '1,2-cyclopentanediol'], ['OCC(O)CO', '1,2,3-propanetriol', 'glycerol'], ['CC(C)(C)O', '2-methyl-2-propanol', 'tert-butyl alcohol'],
  ['CCC(C)(O)CC', '3-methyl-3-pentanol'], ['CCC(O)CC', '3-pentanol'], ['CC(O)C(C)C', '3-methyl-2-butanol'],
  ['CCOCC', 'ethoxyethane', 'diethyl ether'], ['COCC', 'methoxyethane', 'ethyl methyl ether'], ['CCC(OC)CCCC', '3-methoxyheptane'],
  ['CCOCCC', '1-ethoxypropane', 'ethyl propyl ether'], ['COC', 'methoxymethane', 'dimethyl ether'],
  ['CS', 'methanethiol'], ['CCS', 'ethanethiol'], ['CCCS', '1-propanethiol'], ['CCC(S)CCC', '3-hexanethiol'],
  ['CC(C)C(S)CCCCC', '2-methyl-3-octanethiol'],
  ['CCCl', 'chloroethane'], ['ClCCCl', '1,2-dichloroethane'], ['CC(Cl)CCC(C)CC', '2-chloro-5-methylheptane'],
  ['CC(Br)CCC(C)C', '2-bromo-5-methylhexane'], ['ClC(Cl)Cl', 'trichloromethane', 'chloroform'], ['ClCCl', 'dichloromethane'],
  ['CC(C)CBr', '1-bromo-2-methylpropane'], ['CC(C)(C)Br', '2-bromo-2-methylpropane'], ['FC(F)(F)C(Cl)Br', '2-bromo-2-chloro-1,1,1-trifluoroethane'],
  ['C=O', 'methanal', 'formaldehyde'], ['CC=O', 'ethanal', 'acetaldehyde'], ['CCCC=O', 'butanal'], ['CCCCC(C)C=O', '2-methylhexanal'],
  ['CCC(C=O)C(C)C', '2-ethyl-3-methylbutanal'], ['O=CCCCC=O', 'pentanedial', 'glutaraldehyde'],
  ['CC(C)=O', '2-propanone', 'acetone'], ['CCC(C)=O', '2-butanone', 'ethyl methyl ketone'], ['CCC(=O)CC', '3-pentanone', 'diethyl ketone'],
  ['O=C1CCCCC1', 'cyclohexanone'], ['CC1CCCCC1=O', '2-methylcyclohexanone'], ['O=C1C(C)C(CC)CC1', '3-ethyl-2-methylcyclopentanone'],
  ['CC(=O)CC(C)=O', '2,4-pentanedione'], ['CC(C)CC(C)=O', '4-methyl-2-pentanone'],
  ['OC=O', 'methanoic acid', 'formic acid'], ['CC(=O)O', 'ethanoic acid', 'acetic acid'], ['CCCC(=O)O', 'butanoic acid', 'butyric acid'],
  ['CCC(C)C(=O)O', '2-methylbutanoic acid'], ['CCCCC(CC)C(=O)O', '2-ethylhexanoic acid'], ['CC(O)C(=O)O', '2-hydroxypropanoic acid', 'lactic acid'],
  ['OCC(=O)O', '2-hydroxyethanoic acid', 'glycolic acid'], ['CCCCCCCC(=O)O', 'octanoic acid'], ['OC(=O)CCC(=O)O', 'butanedioic acid'],
  ['CC(=O)C(=O)O', '2-oxopropanoic acid'], ['CC(O)CC=O', '3-hydroxybutanal'],
  ['CC(=O)[O-].[Na+]', 'sodium acetate'], ['CCC(=O)[O-].[K+]', 'potassium propanoate'], ['CCCCCCCC(=O)[O-].[Na+]', 'sodium octanoate'],
  ['[O-]C=O.[Na+]', 'sodium formate'],
];

describe('IUPAC namer', () => {
  for (const [smi, name, common] of NAME_CASES) {
    it(`${smi} -> ${name}`, () => {
      const r = nameCompound(smi);
      expect(r && r.name).toBe(name);
      if (common) expect(r.common.concat(r.alternates)).toContain(common);
    });
  }
  it('returns null for compounds outside the course scope', () => {
    for (const smi of ['c1ccccc1', 'CC(=O)OC', 'CCN', 'CC(N)=O', 'C1CCC2CCCCC2C1', 'CCCCCCCCC1CC1', 'C=CCO']) {
      expect(iupacName(smi)).toBeNull();
    }
  });
  it('provides numbering in chain order (C1 first)', () => {
    const r = nameCompound('CC(C)CCCC'); // 2-methylhexane
    expect(r.numbering.length).toBe(6);
    expect(r.numbering[1]).toBe(1); // C2 is the branch point
  });
});

describe('Name parser (name -> structure)', () => {
  for (const [smi, name, common] of NAME_CASES) {
    it(`round-trips ${name}`, () => {
      const p = parseName(name);
      expect(p.ok).toBeTruthy();
      expect(canonicalKey(p.mol)).toBe(canonicalKey(smi));
      if (common) {
        const c = parseName(common);
        expect(c.ok && canonicalKey(c.mol) === canonicalKey(smi)).toBeTruthy();
      }
    });
  }
  it('reads new-style IUPAC names', () => {
    const pairs = [['butan-2-ol', 'CC(O)CC'], ['but-2-ene', 'CC=CC'], ['buta-1,3-diene', 'C=CC=C'], ['propan-2-one', 'CC(C)=O'],
      ['ethane-1,2-diol', 'OCCO'], ['2-methylbutan-2-ol', 'CCC(C)(C)O'], ['hex-1-yne', 'C#CCCCC'], ['pentane-2,4-dione', 'CC(=O)CC(C)=O']];
    for (const [n, s] of pairs) {
      const p = parseName(n);
      expect(p.ok && sameMolecule(p.mol, s)).toBeTruthy();
      expect(p.parsed.newStyle).toBeTruthy();
    }
  });
  it('reports specific problems', () => {
    expect(parseName('1-propanone').issues[0].code).toBe('ketoneEnd');
    expect(parseName('2-dimethylhexane').ok).toBeFalsy();
    expect(parseName('2-methyl-3-methylhexane').issues.map((i) => i.code)).toContain('duplicatePrefix');
    expect(parseName('3-methyl-2-ethylhexane').issues.map((i) => i.code)).toContain('alphabetical');
    expect(parseName('trans-1-butene').issues.map((i) => i.code)).toContain('noCisTrans');
    expect(parseName('7-methyloctane').ok).toBeTruthy();
    expect(parseName('9-methyloctane').ok).toBeFalsy();
    expect(parseName('2,2,2-trimethylpropane').ok).toBeFalsy(); // pentavalent carbon
    expect(parseName('gibberish').ok).toBeFalsy();
  });
  it('accepts the professor\'s comma style', () => {
    const p = parseName('2-bromo, 5-methylhexane');
    expect(p.ok).toBeTruthy();
    expect(sameMolecule(p.mol, 'CC(Br)CCC(C)C')).toBeTruthy();
  });
});

describe('Name checker', () => {
  const chk = (input, smiles, extra = {}) => checkName(input, { smiles, ...extra });
  it('accepts exact and case-insensitive answers', () => {
    expect(chk('2,2-dimethyl-3-decanol', 'CC(C)(C)C(O)CCCCCCC').status).toBe('correct');
    expect(chk('2,2-Dimethyl-3-Decanol', 'CC(C)(C)C(O)CCCCCCC').status).toBe('correct');
  });
  it('accepts alternates and common names', () => {
    expect(chk('propanone', 'CC(C)=O').status).toBe('correct');
    expect(chk('acetone', 'CC(C)=O').status).toBe('correct');
    expect(chk('acetone', 'CC(C)=O', { iupacOnly: true }).status).toBe('close');
    expect(chk('diethyl ether', 'CCOCC').status).toBe('correct');
    expect(chk('methyl ethyl ketone', 'CCC(C)=O').status).toBe('correct');
  });
  it('accepts comma style and new IUPAC style with a tip', () => {
    const r = chk('2-bromo, 5-methylhexane', 'CC(Br)CCC(C)C');
    expect(r.status).toBe('correct');
    expect(r.message).toContain('Formatting');
    const r2 = chk('hexan-2-ol', 'CC(O)CCCC');
    expect(r2.status).toBe('correct');
    expect(r2.message).toContain('2-hexanol');
  });
  it('explains a wrong parent chain', () => {
    const r = chk('2-ethylpentane', 'CCC(C)CCC');
    expect(r.status).toBe('close');
    expect(r.message).toContain('longest chain');
  });
  it('explains wrong numbering', () => {
    const r = chk('5-methyl-2-hexanol', 'CC(C)CCC(C)O'); // 5-methyl-2-hexanol is correct; test wrong one:
    expect(r.status).toBe('correct');
    const w = chk('6-methylheptane', 'CC(C)CCCCC');
    expect(w.status).toBe('close');
    expect(w.message).toContain('Numbering');
    const tie = chk('5-bromo-2-methylhexane', 'CC(Br)CCC(C)C');
    expect(tie.status).toBe('close');
    expect(tie.message).toContain('alphabetically');
    const oh = chk('4-hexanol', 'CCC(O)CCC'.replace('CCC(O)CCC', 'CCCC(O)CC'));
    expect(oh.status).toBe('close');
    expect(oh.message).toContain('–OH');
  });
  it('explains alphabetical order and duplicate prefixes', () => {
    expect(chk('2-methyl-3-ethylhexane', 'CC(C)C(CC)CCC').message).toContain('Alphabetical');
    expect(chk('2-methyl-3-methylhexane', 'CC(C)C(C)CCC').status).toBe('close');
  });
  it('flags a different compound and returns its structure', () => {
    const r = chk('2-methylhexane', 'CCC(C)CCC');
    expect(r.status).toBe('wrong');
    expect(sameMolecule(r.userSmiles, 'CC(C)CCCC')).toBeTruthy();
  });
  it('handles cis/trans', () => {
    expect(chk('cis-2-butene', 'C/C=C\\C').status).toBe('correct');
    expect(chk('2-butene', 'C/C=C\\C').status).toBe('close');
    expect(chk('trans-2-butene', 'C/C=C\\C').status).toBe('close');
  });
  it('flags missing locants as close', () => {
    expect(chk('butanol', 'CCCCO').status).toBe('close');
    expect(chk('butanone', 'CCC(C)=O').status).toBe('correct');
  });
  it('handles unreadable input', () => {
    expect(chk('asdf', 'CCC').status).toBe('unreadable');
    expect(chk('', 'CCC').status).toBe('wrong');
  });
});
