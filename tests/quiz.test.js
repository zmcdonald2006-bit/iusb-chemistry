import { describe, it, expect } from './harness.js';
import { validateQuestion } from './helpers.js';
import { GENERATORS, makeGenerated } from '../js/quiz/generators.js';
import { checkAnswer, parseNumber, normalizeText, answerText } from '../js/quiz/checkers.js';
import { parseSmiles } from '../js/chem/smiles.js';
import { canonicalKey } from '../js/chem/analyze.js';
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
