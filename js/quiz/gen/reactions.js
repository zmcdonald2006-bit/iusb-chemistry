// Reaction questions. Correct products come from the reaction engine; distractors are
// the classic mistakes (anti-Markovnikov, wrong oxidation level, wrong alkene, ...).
import { parseSmiles, neighbors } from '../../chem/smiles.js';
import { molecularFormula, canonicalKey, carbonNeighborCount, functionalGroups } from '../../chem/analyze.js';
import { nameCompound } from '../../chem/namer.js';
import {
  hydrogenate, halogenate, hydrohalogenate, hydrate, dehydrate, oxidizeAlcohol,
  oxidizeAldehyde, reduceCarbonyl, neutralizeAcid, oxidizeThiol,
} from '../../chem/reactions.js';
import { chainSmiles } from '../../chem/generator.js';
import { structq, mcq, distinctByKey, relocate, NR, moleculeOf } from './common.js';

const nm = (s) => { const r = nameCompound(s); return r ? r.name : null; };
const label = (s) => nm(s) || `$${molecularFormula(s)}$`;

// Simple alkene with exactly one C=C
function alkene(r, { asymmetric = null } = {}) {
  for (let i = 0; i < 30; i++) {
    const ring = r.chance(0.25);
    const n = ring ? r.pick([5, 6]) : r.int(3, 6);
    const pos = ring ? 1 : r.int(1, n - 1);
    const subs = {};
    if (r.chance(0.5)) {
      const at = ring ? r.pick([1, 2, 3]) : r.int(1, n);
      (subs[at] = subs[at] || []).push('C');
    }
    let smi;
    try { smi = chainSmiles(n, subs, { [pos]: 2 }, ring); parseSmiles(smi); } catch { continue; }
    const hh = hydrohalogenate(smi, 'Cl');
    if (!hh) continue;
    if (hh.tie) continue; // Markovnikov can't decide: skip
    if (asymmetric === true && hh.symmetric) continue;
    if (asymmetric === false && !hh.symmetric) continue;
    if (!nm(smi)) continue;
    return smi;
  }
  return null;
}

function simpleAlcohol(r, klass = null) {
  for (let i = 0; i < 40; i++) {
    const n = r.int(2, 6);
    const pos = r.int(1, Math.ceil(n / 2));
    const subs = { [pos]: ['O'] };
    if (klass === 3 || (klass == null && r.chance(0.2))) {
      if (pos === 1) continue;
      subs[pos].push('C');
    } else if (r.chance(0.3) && n >= 4) {
      const at = r.int(2, n - 1);
      if (at !== pos) (subs[at] = subs[at] || []).push('C');
    }
    let smi;
    try { smi = chainSmiles(n, subs); parseSmiles(smi); } catch { continue; }
    const mol = parseSmiles(smi);
    const g = functionalGroups(mol).find((f) => f.type === 'alcohol');
    const k = carbonNeighborCount(mol, g.atoms[1]);
    if (klass != null && Math.max(1, k) !== klass) continue;
    if (!nm(smi)) continue;
    return smi;
  }
  return null;
}

function finishStruct(prompt, correct, distractors, extra) {
  const all = distinctByKey([correct, ...distractors]);
  if (all.length < 4 || (typeof correct === 'string' && canonicalKey(all[0]) !== canonicalKey(correct))) return null;
  return structq(prompt, all.slice(0, 4), 0, extra);
}

const RXN_TEXT = {
  h2: 'H₂, Pd', br2: 'Br₂', cl2: 'Cl₂', hbr: 'HBr', hcl: 'HCl', water: 'H₂O, H₂SO₄',
};

export const reactionGenerators = [
  // ---------------- Lecture 4: addition reactions ----------------
  {
    id: 'l04-hydrogenation', skill: 'l04.addition', title: 'Hydrogenation product',
    make(r) {
      const a = alkene(r); if (!a) return null;
      const p = hydrogenate(a);
      const d = [halogenate(a, 'Br'), hydrate(a).major || hydrate(a).both?.[0], a, relocate(p, 'C', r)];
      return finishStruct('What is the product?', p, d, {
        skill: 'l04.addition',
        figure: { rxn: { from: a, reagent: RXN_TEXT.h2 } },
        explain: `**Hydrogenation** adds H–H across the C=C (Pd is a catalyst). Both carbons each gain one H → the **alkane**, ${label(p)}.`,
      });
    },
  },
  {
    id: 'l04-halogenation', skill: 'l04.addition', title: 'Halogenation product',
    make(r) {
      const a = alkene(r); if (!a) return null;
      const X = r.pick(['Br', 'Cl']);
      const p = halogenate(a, X);
      const hx = hydrohalogenate(a, X);
      const d = [hx.major || hx.both?.[0], relocate(p, X, r), hydrogenate(a), relocate(p, X, r)];
      return finishStruct('What is the product?', p, d, {
        skill: 'l04.addition',
        figure: { rxn: { from: a, reagent: X === 'Br' ? RXN_TEXT.br2 : RXN_TEXT.cl2 } },
        explain: `**Halogenation** adds one ${X} to **each** carbon of the C=C (no catalyst needed) → a dihalide on neighbouring carbons: ${label(p)}.`,
      });
    },
  },
  {
    id: 'l04-hydrohalogenation', skill: 'l04.markovnikov', title: 'HX addition (Markovnikov)',
    make(r) {
      const a = alkene(r, { asymmetric: r.chance(0.8) }); if (!a) return null;
      const X = r.pick(['Br', 'Cl']);
      const res = hydrohalogenate(a, X);
      const p = res.major;
      const d = [res.minor, halogenate(a, X), hydrogenate(a), relocate(p, X, r)];
      const asym = !res.symmetric;
      return finishStruct(asym ? 'What is the **major** product?' : 'What is the product?', p, d, {
        skill: 'l04.markovnikov',
        figure: { rxn: { from: a, reagent: X === 'Br' ? RXN_TEXT.hbr : RXN_TEXT.hcl } },
        explain: asym
          ? `**Markovnikov's rule:** the H of H–${X} goes to the C=C carbon that already has **more H's**; ${X} goes to the more substituted carbon ("the rich get richer"). Major product: ${label(p)}.`
          : `The alkene is symmetric, so H and ${X} add the same way either direction: ${label(p)}.`,
      });
    },
  },
  {
    id: 'l04-hydration', skill: 'l04.markovnikov', title: 'Hydration (Markovnikov)',
    make(r) {
      const a = alkene(r, { asymmetric: r.chance(0.75) }); if (!a) return null;
      const res = hydrate(a);
      const p = res.major;
      const d = [res.minor, hydrogenate(a), relocate(p, 'O', r), halogenate(a, 'Br')];
      return finishStruct(res.symmetric ? 'What is the product?' : 'What is the **major** product?', p, d, {
        skill: 'l04.markovnikov',
        figure: { rxn: { from: a, reagent: RXN_TEXT.water } },
        explain: `**Hydration** adds H–OH across the C=C (needs strong acid, $H_2SO_4$) → an **alcohol**. ${res.symmetric ? '' : 'By Markovnikov, H goes to the carbon with more H\'s and OH goes to the more substituted carbon. '}Product: ${label(p)}.`,
      });
    },
  },
  {
    id: 'l04-reagent', skill: 'l04.addition', title: 'Which reagent?',
    make(r) {
      const a = alkene(r, { asymmetric: true }); if (!a) return null;
      const opts = [
        ['H₂, Pd', hydrogenate(a)],
        ['Br₂', halogenate(a, 'Br')],
        ['HBr', hydrohalogenate(a, 'Br').major],
        ['H₂O, H₂SO₄', hydrate(a).major],
      ];
      const k = r.int(0, 3);
      return mcq('Which reagent carries out this reaction?', opts.map((o) => o[0]), k, {
        skill: 'l04.addition', shuffle: false,
        figure: { rxn: { from: a, reagent: '?', to: opts[k][1] } },
        explain: `Look at what was added across the C=C: ${['two H atoms → H₂ (Pd catalyst): hydrogenation', 'a Br on each carbon → Br₂: halogenation', 'H and Br → HBr: hydrohalogenation (Markovnikov)', 'H and OH → water with H₂SO₄: hydration (Markovnikov)'][k]}.`,
      });
    },
  },

  // ---------------- Lecture 5: alcohol reactions ----------------
  {
    id: 'l05-dehydration', skill: 'l05.dehydration', title: 'Dehydration (Zaitsev)',
    make(r) {
      const alc = simpleAlcohol(r, r.pick([2, 2, 3])); if (!alc) return null;
      const res = dehydrate(alc);
      if (!res || !res.major) return null;
      const minor = res.products.find((p) => canonicalKey(p) !== canonicalKey(res.major));
      const ox = oxidizeAlcohol(alc);
      const d = [minor, hydrogenate(res.major), ox && ox.first, relocate(res.major, 'C', r)];
      return finishStruct('What is the **major** product?', res.major, d, {
        skill: 'l05.dehydration',
        figure: { rxn: { from: alc, reagent: 'H₂SO₄' } },
        explain: `**Dehydration** removes the OH and an H from a neighbouring carbon (loses $H_2O$) to make a C=C. ${minor ? `Two alkenes are possible; **Zaitsev's rule** says the major one has **more carbon groups on the C=C**: ${label(res.major)} (not ${label(minor)}).` : `Product: ${label(res.major)}.`}`,
      });
    },
  },
  {
    id: 'l05-oxidation', skill: 'l05.oxidation', title: 'Oxidation of alcohols',
    make(r) {
      const klass = r.pick([1, 1, 2, 2, 3]);
      const alc = simpleAlcohol(r, klass); if (!alc) return null;
      const ox = oxidizeAlcohol(alc);
      const stage = klass === 1 ? r.pick(['first', 'final']) : 'first';
      if (klass === 3) {
        const d = [relocate(alc, 'O', r), dehydrate(alc)?.major, hydrogenate(dehydrate(alc)?.major || alc)];
        const all = distinctByKey([NR, ...d.filter(Boolean)]);
        if (all.length < 3) return null;
        return structq('What forms when this alcohol is treated with $[O]$ ($K_2Cr_2O_7$)?', all.slice(0, 4), 0, {
          skill: 'l05.oxidation',
          figure: { rxn: { from: alc, reagent: '[O]' } },
          explain: 'This is a **3° alcohol**: the carbon holding the OH has **no H** to lose, so it **cannot be oxidized** → no reaction.',
        });
      }
      const correct = stage === 'first' ? ox.first : ox.final;
      const other = stage === 'first' ? ox.final : ox.first;
      const d = [other !== correct ? other : null, dehydrate(alc)?.major, relocate(ox.first, 'O', r), NR];
      const res = finishStruct(klass === 1 ? (stage === 'first' ? 'What is the **first** oxidation product?' : 'What is the product after **complete** oxidation?') : 'What is the oxidation product?', correct, d, {
        skill: 'l05.oxidation',
        figure: { rxn: { from: alc, reagent: '[O]' } },
        explain: klass === 1
          ? `**1° alcohol** → first an **aldehyde** (${label(ox.first)}), which is oxidized further to a **carboxylic acid** (${label(ox.final)}). Each step trades a C–H bond for a C–O bond.`
          : `**2° alcohol** → **ketone** (${label(ox.first)}). The OH carbon loses its one H and becomes C=O. Ketones can't be oxidized further.`,
      });
      return res;
    },
  },
  {
    id: 'l05-classify', skill: 'l05.classify', title: '1°, 2° or 3° alcohol?',
    make(r) {
      const klass = r.int(1, 3);
      const alc = simpleAlcohol(r, klass) || (klass === 1 ? 'CCCO' : klass === 2 ? 'CC(O)CC' : 'CC(C)(O)C');
      return mcq('Classify this alcohol.', ['1° (primary)', '2° (secondary)', '3° (tertiary)'], klass - 1, {
        skill: 'l05.classify', shuffle: false,
        figure: { smiles: alc },
        explain: `Find the carbon holding the OH and count the **carbons** bonded to it: ${klass} → **${['', '1°', '2°', '3°'][klass]} alcohol**. (${klass === 3 ? '3° alcohols do not oxidize.' : klass === 2 ? '2° alcohols oxidize to ketones.' : '1° alcohols oxidize to aldehydes, then carboxylic acids.'})`,
      });
    },
  },

  // ---------------- Lecture 6: thiols ----------------
  {
    id: 'l06-disulfide', skill: 'l06.thiols', title: 'Thiol oxidation',
    make(r) {
      const n = r.int(1, 4);
      const pos = n > 2 ? r.int(1, 2) : 1;
      const thiol = chainSmiles(n, { [pos]: ['S'] });
      const p = oxidizeThiol(thiol);
      const alcAnalog = oxidizeThiol(thiol).replace(/S/g, 'O');
      const d = [alcAnalog, thiol.replace('S', 'O'), `${chainSmiles(n)}S${chainSmiles(n)}`, NR];
      return finishStruct('What forms when this thiol is **oxidized**?', p, d, {
        skill: 'l06.thiols',
        figure: { rxn: { from: thiol, reagent: '[O]' } },
        explain: 'Two thiol molecules each lose the H from S–H and the sulfurs bond together: 2 R–SH → **R–S–S–R (a disulfide)**. Reduction ($[H]$) turns it back into two thiols — this is how perms reshape hair.',
      });
    },
  },

  // ---------------- Lecture 8: aldehydes & ketones ----------------
  {
    id: 'l08-oxidation', skill: 'l08.reactions', title: 'Oxidizing aldehydes & ketones',
    make(r) {
      const isAld = r.chance(0.6);
      const n = r.int(3, 6);
      const subs = isAld ? { 1: ['=O'] } : { [r.int(2, n - 1)]: ['=O'] };
      if (n >= 4 && r.chance(0.4)) { const at = r.int(2, n - 1); if (!subs[at]) subs[at] = ['C']; }
      const s = chainSmiles(n, subs);
      if (!nm(s)) return null;
      if (!isAld) {
        const d = [reduceCarbonyl(s), relocate(s, 'O', r), `${chainSmiles(n - 1)}C(=O)O`];
        const all = distinctByKey([NR, ...d]);
        if (all.length < 4) return null;
        return structq('What happens when this compound is treated with $[O]$?', all.slice(0, 4), 0, {
          skill: 'l08.reactions',
          figure: { rxn: { from: s, reagent: '[O]' } },
          explain: `This is a **ketone** (${label(s)}). Ketones have no H on the carbonyl carbon, so they **cannot be oxidized** → no reaction.`,
        });
      }
      const p = oxidizeAldehyde(s);
      const d = [reduceCarbonyl(s), NR, relocate(s, 'O', r)];
      return finishStruct('What is the product?', p, d, {
        skill: 'l08.reactions',
        figure: { rxn: { from: s, reagent: '[O]' } },
        explain: `**Aldehydes are oxidized to carboxylic acids**: the aldehyde C–H becomes C–OH. ${label(s)} → ${label(p)}.`,
      });
    },
  },
  {
    id: 'l08-reduction', skill: 'l08.reactions', title: 'Reducing aldehydes & ketones',
    make(r) {
      const isAld = r.chance(0.5);
      const ring = !isAld && r.chance(0.25);
      const n = ring ? r.pick([5, 6]) : r.int(3, 6);
      const subs = isAld ? { 1: ['=O'] } : ring ? { 1: ['=O'] } : { [r.int(2, n - 1)]: ['=O'] };
      if (r.chance(0.35)) { const at = ring ? r.int(2, 3) : r.int(2, n - 1); if (!subs[at]) subs[at] = ['C']; }
      const s = chainSmiles(n, subs, {}, ring);
      if (!nm(s)) return null;
      const p = reduceCarbonyl(s);
      const d = [isAld ? oxidizeAldehyde(s) : NR, hydrogenate(dehydrate(p)?.major || s), relocate(p, 'O', r), NR];
      return finishStruct('What is the product?', p, d, {
        skill: 'l08.reactions',
        figure: { rxn: { from: s, reagent: 'H₂, Pd' } },
        explain: `**Reduction** adds H₂ across the C=O: ${isAld ? 'an **aldehyde → 1° alcohol**' : 'a **ketone → 2° alcohol**'}. ${label(s)} → ${label(p)}. (In your body, NADH does this job.)`,
      });
    },
  },
  {
    id: 'l08-oxred-classify', skill: 'l08.reactions', title: 'Oxidation or reduction?',
    make(r) {
      const pairs = [
        ['CCO', 'CC=O', 'oxidation'], ['CC=O', 'CC(=O)O', 'oxidation'], ['CC(O)C', 'CC(C)=O', 'oxidation'],
        ['CCC=O', 'CCCO', 'reduction'], ['CC(C)=O', 'CC(C)O', 'reduction'], ['CSSC', 'CS', 'reduction'], ['CS', 'CSSC', 'oxidation'],
        ['O=C1CCCCC1', 'OC1CCCCC1', 'reduction'], ['CCCCO', 'CCCC(=O)O', 'oxidation'],
      ];
      const [a, b, kind] = r.pick(pairs);
      return mcq('Is this an **oxidation** or a **reduction**?', ['Oxidation', 'Reduction'], kind === 'oxidation' ? 0 : 1, {
        skill: 'l08.reactions', shuffle: false,
        figure: { rxn: { from: a, reagent: '', to: b } },
        explain: kind === 'oxidation'
          ? '**Oxidation**: more C–O bonds or fewer C–H bonds (for thiols, S–H → S–S).'
          : '**Reduction**: fewer C–O bonds or more C–H bonds (the opposite of oxidation).',
      });
    },
  },

  // ---------------- Lecture 10: acids + bases ----------------
  {
    id: 'l10-neutralize', skill: 'l10.salts', title: 'Acid + NaOH',
    make(r) {
      const n = r.int(1, 8);
      const metal = r.pick(['Na', 'K']);
      const acid = chainSmiles(n, { 1: ['=O', 'O'] });
      const salt = neutralizeAcid(acid, metal);
      const saltName = nm(salt);
      if (!saltName) return null;
      if (r.chance(0.5)) {
        return {
          type: 'name', skill: 'l10.salts',
          prompt: `Name the salt formed when **${nm(acid)}** reacts with **${metal === 'Na' ? 'NaOH' : 'KOH'}**.`,
          figure: { rxn: { from: acid, reagent: metal === 'Na' ? 'NaOH' : 'KOH', to: salt } },
          name: { smiles: salt, name: saltName },
          explain: `Carboxylic acid + base → carboxylate salt + water. Name = **metal** + acid name with **-ic acid → -ate**: **${saltName}**.`,
          placeholder: 'e.g. sodium propanoate',
        };
      }
      // classic wrong ideas: nothing happens, the acid gets reduced, or it becomes an aldehyde
      const d = [acid, chainSmiles(n, { 1: ['O'] }), chainSmiles(n, { 1: ['=O'] })];
      return finishStruct(`What is the organic product with ${metal === 'Na' ? 'NaOH' : 'KOH'}?`, salt, [...d, NR], {
        skill: 'l10.salts',
        figure: { rxn: { from: acid, reagent: metal === 'Na' ? 'NaOH' : 'KOH' } },
        explain: `The acid donates its H⁺ to OH⁻ (making water). What's left is the **carboxylate salt**: ${saltName}. These salts are ionic and **water soluble**.`,
      });
    },
  },
];

export { neighbors };
