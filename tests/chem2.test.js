import { describe, it, expect } from './harness.js';
import { parseSmiles } from '../js/chem/smiles.js';
import { sameMolecule, canonicalKey } from '../js/chem/analyze.js';
import { iupacName } from '../js/chem/namer.js';
import { parseName } from '../js/chem/nameparse.js';
import {
  hydrogenate, halogenate, hydrohalogenate, hydrate, dehydrate, oxidizeAlcohol,
  oxidizeAldehyde, reduceCarbonyl, neutralizeAcid, oxidizeThiol, alcoholClass,
} from '../js/chem/reactions.js';
import { KINDS, randomMolecule } from '../js/chem/generator.js';
import { layoutMolecule } from '../js/chem/layout.js';
import { renderMolecule, renderTetrahedral } from '../js/chem/render.js';
import { makeRng } from '../js/lib/random.js';

const same = (a, b) => expect(a && b ? sameMolecule(a, b) : a === b).toBeTruthy();

describe('Alkene reactions (Lecture 4)', () => {
  it('hydrogenation gives the alkane', () => {
    same(hydrogenate('CC=CC'), 'CCCC');
    same(hydrogenate('C1=CCCCC1'), 'C1CCCCC1');
    expect(hydrogenate('CCCC')).toBeNull();
  });
  it('halogenation gives a vicinal dihalide', () => {
    same(halogenate('C=C', 'Cl'), 'ClCCCl');
    same(halogenate('C1=CCCCC1', 'Br'), 'BrC1CCCCC1Br');
  });
  it('hydrohalogenation follows Markovnikov', () => {
    const r = hydrohalogenate('C=CC', 'Cl'); // propene
    same(r.major, 'CC(Cl)C');
    same(r.minor, 'ClCCC');
    same(hydrohalogenate('CC(C)=CC', 'Br').major, 'CC(C)(Br)CC');
    expect(hydrohalogenate('CC=CC', 'Br').symmetric).toBeTruthy();
    expect(hydrohalogenate('CC=CCC', 'Br').tie).toBeTruthy();
  });
  it('hydration follows Markovnikov', () => {
    same(hydrate('C=CC').major, 'CC(O)C');
    same(hydrate('C=C').major, 'CCO');
    same(hydrate('CC1=CCCCC1').major, 'CC1(O)CCCCC1');
  });
});

describe('Alcohol reactions (Lecture 5)', () => {
  it('classifies alcohols', () => {
    expect(alcoholClass('CCO')).toBe(1);
    expect(alcoholClass('CC(O)C')).toBe(2);
    expect(alcoholClass('CC(C)(C)O')).toBe(3);
  });
  it('dehydration follows Zaitsev', () => {
    const r = dehydrate('CC(O)CC'); // 2-butanol
    same(r.major, 'CC=CC');
    expect(r.products.length).toBe(2);
    same(dehydrate('CCO').major, 'C=C');
    same(dehydrate('CC(C)(O)CC').major, 'CC(C)=CC');
  });
  it('oxidation depends on alcohol class', () => {
    const p = oxidizeAlcohol('CCCO');
    same(p.first, 'CCC=O');
    same(p.final, 'CCC(=O)O');
    same(oxidizeAlcohol('CC(O)C').first, 'CC(C)=O');
    expect(oxidizeAlcohol('CC(C)(C)O').first).toBeNull();
    same(oxidizeAlcohol('CO').first, 'C=O');
    same(oxidizeAlcohol('CCO').final, 'CC(=O)O');
  });
});

describe('Carbonyl, acid and thiol reactions', () => {
  it('oxidizes aldehydes but not ketones', () => {
    same(oxidizeAldehyde('CCC=O'), 'CCC(=O)O');
    expect(oxidizeAldehyde('CC(C)=O')).toBeNull();
  });
  it('reduces aldehydes to 1° and ketones to 2° alcohols', () => {
    same(reduceCarbonyl('CCC=O'), 'CCCO');
    same(reduceCarbonyl('CCC(C)=O'), 'CCC(C)O');
    same(reduceCarbonyl('O=C1CCCCC1'), 'OC1CCCCC1');
  });
  it('neutralizes carboxylic acids to salts', () => {
    same(neutralizeAcid('CC(=O)O'), 'CC(=O)[O-].[Na+]');
    expect(iupacName(neutralizeAcid('CCCCCCCC(=O)O'))).toBe('sodium octanoate');
  });
  it('oxidizes thiols to disulfides', () => {
    same(oxidizeThiol('CCS'), 'CCSSCC');
  });
});

describe('Random molecule generator', () => {
  for (const kind of Object.keys(KINDS)) {
    it(`${kind}: 120 molecules are named and round-trip through the name parser`, () => {
      const r = makeRng(`gen-${kind}`);
      let made = 0;
      for (let i = 0; i < 120; i++) {
        const m = randomMolecule(r, kind);
        if (!m) continue;
        made++;
        const p = parseName(m.name);
        if (!p.ok || canonicalKey(p.mol) !== canonicalKey(m.smiles)) {
          throw new Error(`${kind}: ${m.smiles} named "${m.name}" does not round-trip (${p.ok ? 'different structure' : p.issues.map((x) => x.msg).join(' ')})`);
        }
      }
      expect(made).toBeGreaterThan(100);
    });
  }
  it('is deterministic for a seed', () => {
    const a = randomMolecule(makeRng(42), 'alkane');
    const b = randomMolecule(makeRng(42), 'alkane');
    expect(a.smiles).toBe(b.smiles);
  });
});

describe('Layout and rendering', () => {
  const minDistance = (smiles) => {
    const mol = parseSmiles(smiles);
    const c = layoutMolecule(mol);
    let m = Infinity;
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) m = Math.min(m, Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y));
    return { m, c };
  };
  it('never places two atoms on top of each other (generated molecules)', () => {
    const r = makeRng('layout');
    for (const kind of Object.keys(KINDS)) {
      for (let i = 0; i < 40; i++) {
        const mol = randomMolecule(r, kind);
        if (!mol) continue;
        const { m, c } = minDistance(mol.smiles);
        if (!c.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) throw new Error(`non-finite coords for ${mol.smiles}`);
        if (m < 0.45) throw new Error(`atoms overlap (${m.toFixed(2)}) in ${mol.smiles}`);
      }
    }
  });
  it('keeps bond lengths at 1 for chains and rings', () => {
    for (const s of ['CCCCCC', 'C1CCCCC1', 'CC(C)(C)CC', 'c1ccccc1CC=O']) {
      const mol = parseSmiles(s);
      const c = layoutMolecule(mol);
      for (const b of mol.bonds) expect(Math.hypot(c[b.a].x - c[b.b].x, c[b.a].y - c[b.b].y)).toBeCloseTo(1, 1e-6);
    }
  });
  it('draws cis and trans correctly', () => {
    const side = (s) => {
      const mol = parseSmiles(s);
      const c = layoutMolecule(mol);
      const st = mol.stereo[0];
      const f = (p) => Math.sign((c[st.v].x - c[st.u].x) * (c[p].y - c[st.u].y) - (c[st.v].y - c[st.u].y) * (c[p].x - c[st.u].x));
      return f(st.x) === f(st.y);
    };
    expect(side('C/C=C\\C')).toBe(true);
    expect(side('C/C=C/C')).toBe(false);
    expect(side('CCCCCCCC/C=C\\CCCCCCCC(=O)O')).toBe(true);
  });
  it('renders SVG for every mode', () => {
    for (const mode of ['skeletal', 'condensed', 'full']) {
      const svg = renderMolecule('CC(C)CO', { mode, numbers: { 0: '1' }, selectable: true, highlight: [1] });
      expect(svg.startsWith('<svg')).toBeTruthy();
      expect(svg).toContain('</svg>');
    }
    expect(renderMolecule('CCCO', { mode: 'full' })).toContain('class="lp"');
    expect(renderTetrahedral(['OH', 'CH3', 'H', 'CH2CH3'])).toContain('polygon');
  });
});
