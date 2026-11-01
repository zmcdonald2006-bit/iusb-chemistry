import { describe, it, expect } from './harness.js';
import { validateQuestion } from './helpers.js';
import { GENERATORS, makeGenerated } from '../js/quiz/generators.js';
import { checkAnswer, parseNumber, normalizeText, answerText } from '../js/quiz/checkers.js';
import { parseSmiles, neighbors } from '../js/chem/smiles.js';
import { canonicalKey, molecularFormula, elementCounts, chiralityCenters } from '../js/chem/analyze.js';
import { AMINO_ACIDS, aaSmiles, aaSideAtoms, peptideSmiles } from '../js/chem/aminoacids.js';
import { renderPeptide } from '../js/chem/peptides.js';
import { renderSugar, SUGARS } from '../js/chem/sugars.js';
import { acetalCarbons, canReceive } from '../js/quiz/gen/sugars-proteins.js';
import { renderMolecule } from '../js/chem/render.js';
import { condensedFormula } from '../js/chem/condensed.js';

describe('Checkers', () => {
  it('parses numbers in every common format', () => {
    const cases = [['4.92', 4.92], ['3.2e-5', 3.2e-5], ['3.2 x 10^-5', 3.2e-5], ['3.2×10⁻⁵', 3.2e-5], ['3.2*10-5', 3.2e-5],
      ['1.5 X 10 ^ -4', 1.5e-4], ['10^-7', 1e-7], ['-2', -2], ['7', 7], ['3.2 × 10^−5 M', 3.2e-5], ['1,000', 1000]];
    for (const [s, v] of cases) {
      const x = parseNumber(s);
      if (x == null || Math.abs(x - v) > Math.abs(v) * 1e-9) throw new Error(`${s} -> ${x}`);
    }
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });
  it('normalizes text answers', () => {
    expect(normalizeText('  Trigonal   Planar! ')).toBe('trigonal planar');
    expect(normalizeText('109.5°')).toBe('109.5');
  });
  it('checks each type', () => {
    expect(checkAnswer({ type: 'mc', answer: 2 }, 2).correct).toBe(true);
    expect(checkAnswer({ type: 'multi', answer: [0, 2] }, [2, 0]).correct).toBe(true);
    expect(checkAnswer({ type: 'multi', answer: [0, 2] }, [0]).message).toContain('missed 1');
    expect(checkAnswer({ type: 'num', answer: 4.92, tol: 0.011, decimals: 2 }, '4.92').correct).toBe(true);
    expect(checkAnswer({ type: 'num', answer: 4.92, tol: 0.011, decimals: 2 }, '4.9').correct).toBe(false);
    expect(checkAnswer({ type: 'num', answer: 4.92, tol: 0.011, decimals: 2 }, '4.920').message).toContain('Sig-fig');
    expect(checkAnswer({ type: 'num', answer: 3.2e-5, rel: 0.04 }, '3.16 x 10^-5').correct).toBe(true);
    expect(checkAnswer({ type: 'formula', answer: 'C4H10' }, 'c4h10').correct).toBe(false);
    expect(checkAnswer({ type: 'formula', answer: 'C4H10' }, 'H10C4').message).toContain('Usually written');
    expect(checkAnswer({ type: 'formula', answer: 'C4H10' }, 'C4H8').message).toContain('hydrogens');
    expect(checkAnswer({ type: 'text', answer: 'trigonal pyramidal' }, 'Trigonal-Pyramidal').correct).toBe(true);
    expect(checkAnswer({ type: 'order', answer: [2, 0, 1] }, [2, 0, 1]).correct).toBe(true);
    expect(checkAnswer({ type: 'atoms', answer: [], allowNone: true }, []).correct).toBe(true);
    expect(checkAnswer({ type: 'atoms', answer: [3] }, [3, 4]).message).toContain("shouldn't");
    expect(checkAnswer({ type: 'name', name: { smiles: 'CC(C)CCCC' } }, '2-methylhexane').correct).toBe(true);
  });
});

describe('Condensed formulas', () => {
  const cases = [
    ['CCCC', 'CH3CH2CH2CH3'], ['CC(C)C', 'CH3CH(CH3)CH3'], ['CCO', 'CH3CH2OH'], ['CC(O)C', 'CH3CH(OH)CH3'],
    ['CC(C)=O', 'CH3COCH3'], ['CCC=O', 'CH3CH2CHO'], ['CC(=O)O', 'CH3COOH'], ['OC=O', 'HCOOH'], ['CCOCC', 'CH3CH2OCH2CH3'],
    ['CCCCCC', 'CH3(CH2)4CH3'], ['CC(C)(C)C', 'CH3C(CH3)2CH3'], ['CCCl', 'CH3CH2Cl'], ['C=CC', 'CH2=CHCH3'], ['OCCO', 'HOCH2CH2OH'],
  ];
  for (const [s, exp] of cases) {
    it(`${s} -> ${exp}`, () => {
      const got = condensedFormula(s);
      // either direction of writing is acceptable for symmetric/unfunctionalized chains
      const rev = exp === 'CH2=CHCH3' ? 'CH3CH=CH2' : exp;
      if (got !== exp && got !== rev) throw new Error(`got ${got}`);
    });
  }
  it('returns null for rings', () => expect(condensedFormula('C1CCCCC1')).toBeNull());
});

describe('Question generators', () => {
  for (const g of GENERATORS) {
    it(`${g.id}: 150 seeds produce valid, self-consistent questions`, () => {
      let made = 0;
      for (let i = 0; i < 150; i++) {
        const q = makeGenerated(g.id, `${g.id}#${i}`);
        if (!q) continue;
        made++;
        validateQuestion(q);
      }
      if (made < 140) throw new Error(`only ${made}/150 generated`);
    });
  }
  it('is reproducible from the saved seed', () => {
    const a = makeGenerated('l03-name', 'seed-1');
    const b = makeGenerated(a.ref.gen, a.ref.seed);
    expect(a.prompt).toBe(b.prompt);
    expect(a.name.smiles).toBe(b.name.smiles);
  });
});

// Independent re-derivations of the Lecture 13 and 15 answers, from the figure alone.
describe('Biomolecule answers', () => {
  const up = (row) => (row[0] === 'HO' ? 'OH' : 'H'); // a group on the left of a Fischer projection points up
  const down = (row) => (row[1] === 'OH' ? 'OH' : 'H');
  it('Fischer → Haworth: right = down, left = up, CH₂OH up, α = OH down', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l15-haworth', `chk${i}`);
      const f = q.figure.sugars[0];
      const ketose = f.top === 'CH2OH';
      const centers = f.rows.filter((x) => Array.isArray(x));
      const last = centers[centers.length - 1];
      expect(last[1]).toBe('OH'); // always a D sugar
      const alpha = /α ring/.test(q.prompt);
      if (!alpha && !/β ring/.test(q.prompt)) throw new Error(`no anomer in "${q.prompt}"`);
      const anomer = ketose ? (alpha ? ['CH2OH', 'OH'] : ['OH', 'CH2OH']) : (alpha ? ['H', 'OH'] : ['OH', 'H']);
      const want = JSON.stringify([anomer, ...centers.slice(0, -1).map((r) => [up(r), down(r)]), ['CH2OH', 'H']]);
      const hits = q.choices.map((c, k) => (JSON.stringify(c.sugar.subs) === want ? k : -1)).filter((k) => k >= 0);
      expect(hits.length).toBe(1);
      expect(hits[0]).toBe(q.answer);
      expect(q.choices[q.answer].sugar.ring).toBe(ketose ? 5 : 6);
    }
  });
  it('Haworth → Fischer: down = right, up = left, and a D sugar', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l15-ring-to-fischer', `chk${i}`);
      const ring = q.figure.sugars[0];
      const ketose = ring.ring === 5;
      const inner = ring.subs.slice(1, -1).map(([u]) => (u === 'OH' ? ['HO', 'H'] : ['H', 'OH']));
      const want = JSON.stringify([...(ketose ? ['C=O'] : []), ...inner, ['H', 'OH']]);
      const hits = q.choices.map((c, k) => (JSON.stringify(c.sugar.rows) === want ? k : -1)).filter((k) => k >= 0);
      expect(hits.length).toBe(1);
      expect(hits[0]).toBe(q.answer);
      expect(q.choices[q.answer].sugar.top).toBe(ketose ? 'CH2OH' : 'CHO');
    }
  });
  it('triacylglycerol products: acid or lipase → fatty acids, NaOH → salts', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l13-tag-products', `chk${i}`);
      const soap = /NaOH/.test(q.prompt);
      const right = q.choices[q.answer];
      expect(right.startsWith('glycerol + ')).toBe(true);
      expect(/sodium/.test(right)).toBe(soap);
      expect(/ acid/.test(right)).toBe(!soap);
      // three chains in, three chains out
      const n = right.replace('glycerol + ', '').split(' + ').reduce((a, p) => a + (/^\d /.test(p) ? +p[0] : 1), 0);
      expect(n).toBe(3);
      expect((q.figure.smiles.match(/C\(=O\)O/g) || []).length + (q.figure.smiles.match(/OC\(=O\)/g) || []).length).toBeGreaterThan(2);
      const f = makeGenerated('l13-soap-formula', `chk${i}`);
      expect(/COO⁻ Na⁺$/.test(f.choices[f.answer])).toBe(/NaOH/.test(f.prompt));
      expect(/COOH$/.test(f.choices[f.answer])).toBe(!/NaOH/.test(f.prompt));
    }
  });
});

// Independent checks of the Lecture 16 and 17 answers and data.
describe('Amino acid data', () => {
  // Molecular formulas in the charge state the slide draws (–NH₃⁺, –COO⁻, charged side chains).
  const FORMULAS = {
    Gly: 'C2H5NO2', Ala: 'C3H7NO2', Val: 'C5H11NO2', Leu: 'C6H13NO2', Ile: 'C6H13NO2', Met: 'C5H11NO2S', Phe: 'C9H11NO2', Trp: 'C11H12N2O2', Pro: 'C5H9NO2',
    Ser: 'C3H7NO3', Thr: 'C4H9NO3', Cys: 'C3H7NO2S', Tyr: 'C9H11NO3', Asn: 'C4H8N2O3', Gln: 'C5H10N2O3',
    Asp: 'C4H6NO4-', Glu: 'C5H8NO4-', Lys: 'C6H15N2O2+', Arg: 'C6H15N4O2+', His: 'C6H10N3O2+',
  };
  const counts = (f) => { const o = {}; for (const [, el, n] of f.replace(/[+-]$/, '').matchAll(/([A-Z][a-z]?)(\d*)/g)) o[el] = (o[el] || 0) + (n ? +n : 1); return o; };
  // a side chain written as text, e.g. CH(CH3)CH2CH3 → { C: 4, H: 9 }
  const textCounts = (t) => {
    const s = t.replace(/[⁺⁻=]/g, '');
    const parse = (i) => {
      const o = {};
      const add = (el, n) => { o[el] = (o[el] || 0) + n; };
      while (i < s.length && s[i] !== ')') {
        if (s[i] === '(') {
          const [inner, j] = parse(i + 1);
          let k = j + 1, num = '';
          while (/\d/.test(s[k] || '')) num += s[k++];
          for (const [el, n] of Object.entries(inner)) add(el, n * (num ? +num : 1));
          i = k;
        } else {
          const m = s.slice(i).match(/^([A-Z][a-z]?)(\d*)/);
          add(m[1], m[2] ? +m[2] : 1);
          i += m[0].length;
        }
      }
      return [o, i];
    };
    return parse(0)[0];
  };
  it('has all 20, unique names and abbreviations, in the right groups', () => {
    expect(AMINO_ACIDS.length).toBe(20);
    expect(new Set(AMINO_ACIDS.map((a) => a.three)).size).toBe(20);
    expect(new Set(AMINO_ACIDS.map((a) => a.one)).size).toBe(20);
    const group = (c) => AMINO_ACIDS.filter((a) => a.cls === c).map((a) => a.three).join(' ');
    expect(group('nonpolar')).toBe('Gly Ala Val Leu Ile Met Phe Trp Pro');
    expect(group('polar')).toBe('Ser Thr Cys Tyr Asn Gln');
    expect(group('acidic')).toBe('Asp Glu');
    expect(group('basic')).toBe('Lys Arg His');
  });
  for (const a of AMINO_ACIDS) {
    it(`${a.three}: structure, side-chain text and shading agree`, () => {
      const smiles = aaSmiles(a);
      expect(molecularFormula(smiles)).toBe(FORMULAS[a.three]);
      renderMolecule(smiles, { highlight: aaSideAtoms(a) });
      const mol = parseSmiles(smiles);
      for (const i of aaSideAtoms(a)) if (!(i >= 0 && i < mol.atoms.length)) throw new Error(`bad side-chain atom ${i}`);
      if (a.r) {
        // the formula minus the backbone (H₃N⁺, CH, COO⁻) is the side chain
        const total = counts(FORMULAS[a.three]);
        const back = { C: 2, H: 4, N: 1, O: 2 };
        const want = {};
        for (const el of Object.keys(total)) { const n = total[el] - (back[el] || 0); if (n) want[el] = n; }
        expect(JSON.stringify(Object.entries(textCounts(a.r)).sort())).toBe(JSON.stringify(Object.entries(want).sort()));
      }
    });
    it(`${a.three}: α carbon is a chirality center unless it is glycine`, () => {
      const alpha = a.three === 'Pro' ? 4 : 1;
      expect(chiralityCenters(aaSmiles(a)).includes(alpha)).toBe(a.three !== 'Gly');
    });
  }
  it('a dipeptide is two amino acids minus H₂O', () => {
    const drawable = AMINO_ACIDS.filter((a) => a.side);
    for (const a of drawable) for (const b of drawable) {
      const ca = elementCounts(aaSmiles(a)).counts, cb = elementCounts(aaSmiles(b)).counts;
      const d = elementCounts(peptideSmiles([a.three, b.three])).counts;
      for (const el of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
        const want = (ca[el] || 0) + (cb[el] || 0) - (el === 'H' ? 2 : el === 'O' ? 1 : 0);
        if ((d[el] || 0) !== want) throw new Error(`${a.three}-${b.three}: ${el} ${d[el]} ≠ ${want}`);
      }
    }
  });
  it('draws every drawable amino acid into a peptide, and refuses the rest', () => {
    for (const a of AMINO_ACIDS) {
      if (a.noDraw) { let threw = false; try { renderPeptide({ seq: [a.three] }); } catch { threw = true; } expect(threw).toBe(true); } else expect(renderPeptide({ seq: [a.three, 'Gly'] }).includes('<svg')).toBe(true);
    }
  });
});

describe('Lecture 16 answers', () => {
  it('finds hemiacetal and acetal carbons by counting oxygens', () => {
    const n = (s) => { const x = acetalCarbons(s); return [x.hemiacetal.length, x.acetal.length]; };
    expect(n('OCC1OC(O)C(O)C(O)C1O')).toEqual([1, 0]); // glucose ring
    expect(n('OCC1OC(O)(CO)C(O)C1O')).toEqual([1, 0]); // fructose ring
    expect(n('OCC1OC(OC2C(CO)OC(O)C(O)C2O)C(O)C(O)C1O')).toEqual([1, 1]); // maltose or lactose: one of each
    expect(n('OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O')).toEqual([0, 2]); // sucrose: joined at both anomeric carbons
    expect(acetalCarbons('OCC1OC(O)C(O)C(O)C1O').hemiacetal).toEqual([4]); // C1, as highlighted in the notes
  });
  it('blood compatibility matches the table in the notes', () => {
    const table = { O: ['O'], A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B', 'AB', 'O'] };
    for (const p of Object.keys(table)) for (const d of Object.keys(table)) expect(canReceive(p, d)).toBe(table[p].includes(d));
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l16-blood-compat', `chk${i}`);
      const types = q.prompt.match(/type (AB|A|B|O)/g).map((t) => t.split(' ')[1]);
      if (q.type === 'tf') expect(q.answer).toBe(canReceive(types[0], types[1]));
      else {
        const good = q.choices.filter((c) => canReceive(types[0], c.split(' ')[1]));
        expect(good.length).toBe(1);
        expect(q.choices[q.answer]).toBe(good[0]);
      }
    }
  });
  it('the α and β drawings really point the way their names say', () => {
    const c1 = (s, ring = 0) => SUGARS[s].rings[ring].subs[0]; // [up, down] on the anomeric carbon of the left ring
    for (const s of ['α-glycoside', 'maltose', 'amylose', 'amylopectin']) { expect(c1(s)[1]).toBe(null); expect(SUGARS[s].links[0].o[1]).toBeGreaterThan(0.1); }
    for (const s of ['β-glycoside', 'lactose', 'cellulose', 'chitin']) { expect(c1(s)[0]).toBe(null); expect(0.1).toBeGreaterThan(SUGARS[s].links[0].o[1]); }
    // lactose: galactose on the left (C4 OH up), glucose on the right (C4 carries the link)
    expect(SUGARS.lactose.rings[0].subs[3][0]).toBe('OH');
    expect(SUGARS.lactose.rings[1].subs[3][1]).toBe(null);
    // every link leaves an open valence: a carbon with a link has exactly one drawn group
    for (const s of ['maltose', 'lactose', 'sucrose', 'sucralose', 'cellulose', 'amylose', 'amylopectin', 'chitin']) {
      const sp = SUGARS[s];
      for (const l of sp.links) {
        const idx = (r, name) => Number(name.slice(1)) - 1;
        const pair = sp.rings[l.from[0]].subs[idx(0, l.from[1])];
        if (pair.filter(Boolean).length !== 1) throw new Error(`${s}: link carbon should have one other group, has ${JSON.stringify(pair)}`);
      }
    }
    for (const s of ['maltose', 'lactose', 'sucrose', 'sucralose', 'cellulose', 'amylose', 'amylopectin', 'chitin', 'α-glycoside', 'β-glycoside', 'L-fucose', 'N-acetyl-D-glucosamine', 'N-acetyl-D-galactosamine', 'glucuronate']) {
      expect(renderSugar({ sugar: s }).includes('<svg')).toBe(true);
    }
  });
  it('α/β questions agree with the drawing', () => {
    for (let i = 0; i < 100; i++) {
      const q = makeGenerated('l16-linkage-drawn', `chk${i}`);
      const down = SUGARS[q.figure.sugars[0].sugar].rings[0].subs[0][1] === null;
      expect(q.answer).toBe(down ? 0 : 1);
    }
  });
});

describe('Lecture 17 answers', () => {
  it('net charge follows the pH', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l17-charge', `chk${i}`);
      const pH = parseFloat(q.prompt.match(/pH (\d+(?:\.\d+)?)\*\*/)[1]);
      expect(q.choices[q.answer]).toBe(pH < 6 ? '+1' : pH > 6 ? '−1' : '0');
    }
  });
  it('the form at each pH has the right ends', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l17-form', `chk${i}`);
      const pH = parseFloat(q.prompt.match(/pH (\d+(?:\.\d+)?)\*\*/)[1]);
      const p = q.choices[q.answer].peptide;
      expect(p.n).toBe(pH > 6 ? 'H2N' : 'H3N⁺');
      expect(p.c).toBe(pH < 6 ? 'OH' : 'O⁻');
    }
  });
  it('the dipeptide answer has the first-named amino acid on the left', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeGenerated('l17-draw', `chk${i}`);
      const want = q.prompt.match(/\*\*([A-Z][a-z]{2}–[A-Z][a-z]{2})\*\*/)[1];
      const p = q.choices[q.answer].peptide;
      expect(p.seq.join('–')).toBe(want);
      expect(p.n === undefined && p.c === undefined).toBe(true); // keeps –NH₃⁺ and –COO⁻
      const r = makeGenerated('l17-read', `chk${i}`);
      expect(r.choices[r.answer]).toBe(r.figure.peptides[0].seq.join('–'));
    }
  });
  it('terminal questions read the sequence the right way', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeGenerated('l17-terminal', `chk${i}`);
      const seq = q.prompt.match(/\*\*([A-Za-z–]+)\*\*/)[1].split('–');
      expect(q.choices[q.answer]).toBe(/\*\*N-terminal/.test(q.prompt) ? seq[0] : seq[seq.length - 1]);
    }
  });
  it('the D or L answer matches the side the –NH₃⁺ is on', () => {
    for (let i = 0; i < 100; i++) {
      const q = makeGenerated('l17-dl', `chk${i}`);
      const [left] = q.figure.sugars[0].rows[0];
      expect(q.choices[q.answer]).toBe(left === 'H3N⁺' ? 'L' : 'D');
    }
  });
  it('the α carbon is the one bonded to N and to the COO⁻ carbon', () => {
    for (let i = 0; i < 100; i++) {
      const q = makeGenerated('l17-alpha-carbon', `chk${i}`);
      const mol = parseSmiles(q.figure.smiles);
      const nbrs = neighbors(mol, q.answer[0]).map((x) => mol.atoms[x]);
      expect(nbrs.some((a) => a.el === 'N')).toBe(true);
      expect(nbrs.some((a) => a.el === 'C' && neighbors(mol, a.id).filter((x) => mol.atoms[x].el === 'O').length === 2)).toBe(true);
    }
  });
});
