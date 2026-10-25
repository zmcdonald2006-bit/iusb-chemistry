// Lectures 13–15: lipids (fatty acids, triacylglycerols, soap, phospholipids), lipids in the body
// (membranes, cholesterol and lipoproteins, steroid hormones, fat-soluble vitamins, prostaglandins)
// and carbohydrates (classifying monosaccharides, Fischer projections, D/L, anomers).
// Most of these are fact drills built from small tables of slide facts; the sugar generators build
// random Fischer projections, so their questions never run out.
import { mcq } from './common.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---- Lecture 13 -------------------------------------------------------------------------------

// Table 19.2 (C atoms, C=C, mp in °C)
const FATTY = [
  { name: 'lauric acid', c: 12, db: 0, mp: 44 }, { name: 'myristic acid', c: 14, db: 0, mp: 58 },
  { name: 'palmitic acid', c: 16, db: 0, mp: 63 }, { name: 'stearic acid', c: 18, db: 0, mp: 71 },
  { name: 'arachidic acid', c: 20, db: 0, mp: 77 }, { name: 'palmitoleic acid', c: 16, db: 1, mp: 1 },
  { name: 'oleic acid', c: 18, db: 1, mp: 16 }, { name: 'linoleic acid', c: 18, db: 2, mp: -5 },
  { name: 'linolenic acid', c: 18, db: 3, mp: -11 }, { name: 'arachidonic acid', c: 20, db: 4, mp: -49 },
];
const FA_SMILES = {
  'stearic acid': 'CCCCCCCCCCCCCCCCCC(=O)O', 'palmitic acid': 'CCCCCCCCCCCCCCCC(=O)O', 'lauric acid': 'CCCCCCCCCCCC(=O)O',
  'oleic acid': 'CCCCCCCC/C=C\\CCCCCCCC(=O)O', 'linoleic acid': 'CCCCC/C=C\\C/C=C\\CCCCCCCC(=O)O',
  'linolenic acid': 'CC/C=C\\C/C=C\\C/C=C\\CCCCCCCC(=O)O', 'palmitoleic acid': 'CCCCCC/C=C\\CCCCCCCC(=O)O',
};
const fa = (f) => `${f.name} (${f.c} C, ${f.db} C=C)`;
const deg = (t) => `${String(t).replace('-', '−')} °C`; // a real minus sign
const an = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

const LIPID_KINDS = [
  { name: 'waxes', hyd: true }, { name: 'triacylglycerols', hyd: true }, { name: 'phospholipids', hyd: true },
  { name: 'steroids', hyd: false }, { name: 'fat-soluble vitamins', hyd: false }, { name: 'eicosanoids', hyd: false },
];

const FOODS = [
  { food: 'butter', kind: 'saturated' }, { food: 'fatty red meat', kind: 'saturated' }, { food: 'cheese', kind: 'saturated' },
  { food: 'ice cream', kind: 'saturated' }, { food: 'olive oil', kind: 'unsaturated (cis)' }, { food: 'nuts', kind: 'unsaturated (cis)' },
  { food: 'salmon', kind: 'unsaturated (cis)' }, { food: 'soybeans', kind: 'unsaturated (cis)' }, { food: 'margarine', kind: 'trans' },
  { food: 'processed foods', kind: 'trans' },
];
const FOOD_KINDS = ['saturated', 'unsaturated (cis)', 'trans'];
const FOOD_WHY = { saturated: 'Saturated fats (no C=C) are solid and **raise** blood cholesterol.', 'unsaturated (cis)': 'Cis-unsaturated fats (plant oils, nuts, soybeans, fish) are liquid and **lower** blood cholesterol.', trans: 'Trans fats (margarine, processed and fried foods) are mostly **synthesized** and **raise** blood cholesterol, like saturated fats.' };

// ---- Lecture 14 -------------------------------------------------------------------------------

const TRANSPORT = [
  { what: 'O₂', how: 'simple diffusion' }, { what: 'CO₂', how: 'simple diffusion' }, { what: 'glucose', how: 'facilitated transport' },
  { what: 'Cl⁻', how: 'integral protein channel' }, { what: 'HCO₃⁻', how: 'integral protein channel' },
  { what: 'Na⁺ (against its gradient)', how: 'active transport' }, { what: 'K⁺ (against its gradient)', how: 'active transport' },
  { what: 'Ca²⁺ (against its gradient)', how: 'active transport' },
];
const HOWS = ['simple diffusion', 'facilitated transport', 'integral protein channel', 'active transport'];

const LIPO = [
  { s: 'carries cholesterol from the liver to the tissues', a: 'LDL' }, { s: 'carries cholesterol from the tissues back to the liver', a: 'HDL' },
  { s: 'is called "bad" cholesterol', a: 'LDL' }, { s: 'is called "good" cholesterol', a: 'HDL' },
  { s: 'deposits cholesterol on artery walls as plaque', a: 'LDL' }, { s: 'has more protein and less fat', a: 'HDL' },
  { s: 'has more fat and less protein', a: 'LDL' }, { s: 'should be above 40 mg/dL', a: 'HDL' }, { s: 'should be below 100 mg/dL', a: 'LDL' },
];

const HORMONES = [
  { name: 'estradiol', cls: 'estrogen', job: 'It regulates the menstrual cycle and is made in the ovaries.' },
  { name: 'estrone', cls: 'estrogen', job: 'It controls female secondary sex characteristics and is made in the ovaries.' },
  { name: 'progesterone', cls: 'progestin', job: 'It is the "pregnancy hormone": it prepares the uterus for a fertilized egg.', clue: 'is the "pregnancy hormone" that prepares the uterus' },
  { name: 'testosterone', cls: 'androgen', job: 'It controls male secondary sex characteristics and is made in the testes.', clue: 'controls male secondary sex characteristics and is made in the testes' },
  { name: 'androsterone', cls: 'androgen', job: 'It controls male secondary sex characteristics and is made in the testes.' },
  { name: 'aldosterone', cls: 'adrenal cortical steroid', job: 'It regulates blood pressure and volume by controlling Na⁺ and K⁺.', clue: 'regulates blood pressure and volume by controlling Na⁺ and K⁺' },
  { name: 'cortisol', cls: 'adrenal cortical steroid', job: 'It is anti-inflammatory and regulates carbohydrate metabolism.', clue: 'is anti-inflammatory and regulates carbohydrate metabolism' },
  { name: 'cortisone', cls: 'adrenal cortical steroid', job: 'It is anti-inflammatory and regulates carbohydrate metabolism.' },
];
const H_CLASSES = ['estrogen', 'progestin', 'androgen', 'adrenal cortical steroid'];

const VITAMINS = [
  { v: 'vitamin A', fact: 'is made from β-carotene and is needed for vision' }, { v: 'vitamin A', fact: 'causes night blindness when it\'s lacking' },
  { v: 'vitamin D', fact: 'can be made from cholesterol and regulates calcium' }, { v: 'vitamin D', fact: 'causes rickets when it\'s lacking' },
  { v: 'vitamin E', fact: 'is an antioxidant that protects unsaturated fatty acids' }, { v: 'vitamin E', fact: 'causes neurological problems (rarely) when it\'s lacking' },
  { v: 'vitamin K', fact: 'regulates synthesis of clotting proteins (prothrombin)' }, { v: 'vitamin K', fact: 'causes excessive or fatal bleeding when it\'s lacking' },
];
const V_NAMES = ['vitamin A', 'vitamin D', 'vitamin E', 'vitamin K'];

// ---- Lecture 15: random Fischer projections ---------------------------------------------------

const PREFIX = { 3: 'tri', 4: 'tetr', 5: 'pent', 6: 'hex' };
// A random monosaccharide: aldose (C=O at C1) or ketose (C=O at C2) with 3–6 carbons.
function randomSugar(r, { minCenters = 0 } = {}) {
  for (let tries = 0; tries < 20; tries++) {
    const ketose = r.chance(0.4);
    const n = r.int(3, 6);
    const centers = ketose ? n - 3 : n - 2;
    if (centers < minCenters) continue;
    const rows = [];
    if (ketose) rows.push('C=O');
    for (let i = 0; i < centers; i++) rows.push(r.chance(0.5) ? ['H', 'OH'] : ['HO', 'H']);
    const spec = { top: ketose ? 'CH2OH' : 'CHO', rows, bottom: 'CH2OH' };
    const last = rows[rows.length - 1];
    const dl = centers === 0 ? null : (Array.isArray(last) && last[1] === 'OH' ? 'D' : 'L');
    return { spec, n, ketose, centers, dl, kind: `${ketose ? 'keto' : 'aldo'}${PREFIX[n]}ose` };
  }
  return null;
}

const SUGAR_FACTS = [
  { s: 'is blood sugar (dextrose)', a: 'glucose' }, { s: 'is stored as glycogen', a: 'glucose' },
  { s: 'is a ketohexose found in honey', a: 'fructose' }, { s: 'is almost twice as sweet as table sugar', a: 'fructose' },
  { s: 'is one of the two units of sucrose besides glucose', a: 'fructose' }, { s: 'is one of the two units of lactose besides glucose', a: 'galactose' },
  { s: 'builds up in galactosemia', a: 'galactose' }, { s: 'differs from glucose only at C4', a: 'galactose' },
];
const SUGARS3 = ['glucose', 'fructose', 'galactose'];

export const biomoleculeGenerators = [
  // ----- L13 -----
  {
    id: 'l13-mp', skill: 'l13.fatty-acids', title: 'Which fatty acid melts higher?',
    make(r) {
      const [a, b] = r.shuffle(FATTY).slice(0, 2);
      if (a.mp === b.mp) return null;
      const hi = a.mp > b.mp ? a : b, lo = hi === a ? b : a;
      const why = hi.db !== lo.db ? `${cap(hi.name)} has **fewer C=C** (${hi.db} vs ${lo.db}); each C=C lowers the melting point.` : `Both have ${hi.db} C=C, so the **longer chain** (${hi.c} C vs ${lo.c} C) melts higher.`;
      return mcq('Which fatty acid has the **higher** melting point?', [fa(a), fa(b)], a === hi ? 0 : 1, {
        skill: 'l13.fatty-acids', shuffle: false,
        explain: `${why} (${cap(hi.name)} ${deg(hi.mp)}, ${lo.name} ${deg(lo.mp)}.)`,
      });
    },
  },
  {
    id: 'l13-sat', skill: 'l13.fatty-acids', title: 'Saturated or unsaturated?',
    make(r) {
      const name = r.pick(Object.keys(FA_SMILES));
      const f = FATTY.find((x) => x.name === name);
      const sat = f.db === 0;
      return mcq(`Is ${name} saturated or unsaturated?`, ['saturated', 'unsaturated'], sat ? 0 : 1, {
        skill: 'l13.fatty-acids', shuffle: false, figure: { smiles: FA_SMILES[name] },
        explain: sat ? `**Saturated**: no C=C in the chain (mp ${deg(f.mp)}).` : `**Unsaturated**: ${f.db} cis C=C in the chain (mp ${deg(f.mp)}). More C=C → lower melting point.`,
      });
    },
  },
  {
    id: 'l13-omega', skill: 'l13.fatty-acids', title: 'Omega-3 or omega-6?',
    make(r) {
      const lin = r.chance(0.5);
      const name = lin ? 'linolenic acid' : 'linoleic acid';
      return mcq(`Counting from the CH₃ end, is ${name} an omega-3 or omega-6 fatty acid?`, ['omega-3', 'omega-6'], lin ? 0 : 1, {
        skill: 'l13.fatty-acids', shuffle: false, figure: { smiles: FA_SMILES[name] },
        explain: lin ? 'Linolenic acid\'s first C=C starts at **C3** from the CH₃ end → **omega-3**.' : 'Linoleic acid\'s first C=C starts at **C6** from the CH₃ end → **omega-6**.',
      });
    },
  },
  {
    id: 'l13-hydrolyzable', skill: 'l13.lipids', title: 'Hydrolyzable lipid?',
    make(r) {
      const k = r.pick(LIPID_KINDS);
      return {
        type: 'tf', skill: 'l13.lipids', answer: k.hyd,
        prompt: `True or false: **${k.name}** are hydrolyzable lipids.`,
        explain: k.hyd ? `**True.** ${cap(k.name)} contain ester bonds that water can split. Hydrolyzable: waxes, triacylglycerols, phospholipids.` : `**False.** ${cap(k.name)} are **nonhydrolyzable**: water can\'t split them into smaller molecules. Nonhydrolyzable lipids: steroids, fat-soluble vitamins, eicosanoids.`,
      };
    },
  },
  {
    id: 'l13-fat-oil', skill: 'l13.tags', title: 'Fat or oil?',
    make(r) {
      const clues = [
        { c: 'a triacylglycerol made mostly of saturated fatty acids', fat: true }, { c: 'a triacylglycerol made from fatty acids with many C=C', fat: false },
        { c: 'most animal fats', fat: true }, { c: 'most vegetable oils', fat: false },
        { c: 'a polyunsaturated triacylglycerol', fat: false }, { c: 'a triacylglycerol of three stearic acids', fat: true },
      ];
      const x = r.pick(clues);
      return mcq(`At room temperature, which describes ${x.c}?`, ['solid (a fat)', 'liquid (an oil)'], x.fat ? 0 : 1, {
        skill: 'l13.tags', shuffle: false,
        explain: x.fat ? 'Saturated chains pack well → higher melting point → **solid fat**.' : 'C=C bonds (cis kinks) lower the melting point → **liquid oil**.',
      });
    },
  },
  {
    id: 'l13-food', skill: 'l13.health', title: 'What kind of fat is in this food?',
    make(r) {
      const f = r.pick(FOODS);
      return mcq(`Which kind of triacylglycerol is **${f.food}** rich in?`, FOOD_KINDS, FOOD_KINDS.indexOf(f.kind), {
        skill: 'l13.health', shuffle: false, explain: FOOD_WHY[f.kind],
      });
    },
  },
  {
    id: 'l13-phospho', skill: 'l13.phospholipids', title: 'Phospholipid facts',
    make(r) {
      const items = [
        { q: 'The alcohol on the phosphate of **lecithin** is…', a: 'choline', o: ['ethanolamine', 'glycerol'], e: 'Lecithin = phosphatidyl**choline**.' },
        { q: 'The alcohol on the phosphate of **cephalin** is…', a: 'ethanolamine', o: ['choline', 'glycerol'], e: 'Cephalin = phosphatidyl**ethanolamine**.' },
        { q: 'In a cell membrane, phospholipid **tails** point…', a: 'inward, away from water', o: ['outward, toward water', 'into the cytoplasm'], e: 'Nonpolar tails hide **inside** the bilayer; polar heads face water.' },
        { q: 'The polar head of a phospholipid is the…', a: 'charged phosphodiester end', o: ['fatty acid chains', 'C=C bonds'], e: 'The **phosphodiester** end is charged/polar; the two fatty acid chains are nonpolar tails.' },
        { q: 'Every phospholipid contains an atom of…', a: 'phosphorus', o: ['sulfur', 'nitrogen'], e: 'Phospholipids contain a **P** atom.' },
      ];
      const x = r.pick(items);
      return mcq(x.q, [x.a, ...x.o], 0, { skill: 'l13.phospholipids', explain: x.e });
    },
  },
  // ----- L14 -----
  {
    id: 'l14-transport', skill: 'l14.membranes', title: 'How does it cross the membrane?',
    make(r) {
      const t = r.pick(TRANSPORT);
      return mcq(`How does **${t.what}** cross the cell membrane?`, HOWS, HOWS.indexOf(t.how), {
        skill: 'l14.membranes', shuffle: false,
        explain: 'Small molecules (O₂, CO₂) → **simple diffusion**; larger polar molecules (glucose) → **facilitated transport**; Cl⁻ and HCO₃⁻ → **integral protein channels**; Na⁺, K⁺, Ca²⁺ against their gradient → **active transport** (needs energy).',
      });
    },
  },
  {
    id: 'l14-lipo', skill: 'l14.cholesterol', title: 'LDL or HDL?',
    make(r) {
      const x = r.pick(LIPO);
      return mcq(`Which lipoprotein **${x.s}**?`, ['LDL', 'HDL'], x.a === 'LDL' ? 0 : 1, {
        skill: 'l14.cholesterol', shuffle: false,
        explain: '**LDL** ("bad"): liver → tissues, deposits plaque, more fat; keep **< 100 mg/dL**. **HDL** ("good"): tissues → liver, more protein; keep **> 40 mg/dL**.',
      });
    },
  },
  {
    id: 'l14-hormone', skill: 'l14.hormones', title: 'Which class of steroid hormone?',
    make(r) {
      const h = r.pick(HORMONES);
      return mcq(`What kind of steroid hormone is **${h.name}**?`, H_CLASSES, H_CLASSES.indexOf(h.cls), {
        skill: 'l14.hormones', shuffle: false, explain: `${cap(h.name)} is ${an(h.cls)} **${h.cls}**. ${h.job}`,
      });
    },
  },
  {
    id: 'l14-hormone-job', skill: 'l14.hormones', title: 'Which hormone does this?',
    make(r) {
      const picks = HORMONES.filter((x) => x.clue);
      const h = r.pick(picks);
      const opts = picks.map((x) => x.name);
      return mcq(`Which hormone **${h.clue}**?`, opts, opts.indexOf(h.name), { skill: 'l14.hormones', shuffle: false, explain: `**${cap(h.name)}**, ${an(h.cls)} ${h.cls}. ${h.job}` });
    },
  },
  {
    id: 'l14-vitamin', skill: 'l14.vitamins', title: 'Which vitamin?',
    make(r) {
      const x = r.pick(VITAMINS);
      return mcq(`Which fat-soluble vitamin **${x.fact}**?`, V_NAMES, V_NAMES.indexOf(x.v), {
        skill: 'l14.vitamins', shuffle: false,
        explain: '**A**: β-carotene, vision (night blindness). **D**: from cholesterol, calcium (rickets). **E**: antioxidant (neurological problems). **K**: clotting proteins (bleeding).',
      });
    },
  },
  {
    id: 'l14-cox', skill: 'l14.eicosanoids', title: 'COX-1, COX-2 and NSAIDs',
    make(r) {
      const items = [
        { q: 'Aspirin and ibuprofen block…', a: 'both COX-1 and COX-2', o: ['only COX-2', 'only COX-1'], e: 'NSAIDs inactivate **both** enzymes, which raises the risk of stomach ulcers.' },
        { q: 'Celebrex, Vioxx and Bextra block…', a: 'only COX-2', o: ['both COX-1 and COX-2', 'only COX-1'], e: 'They block **only COX-2**, so gastric secretions aren\'t affected.' },
        { q: 'The everyday production of prostaglandins uses…', a: 'COX-1', o: ['COX-2', 'lipase'], e: '**COX-1** makes the usual prostaglandins; COX-2 makes extra ones in inflammation.' },
        { q: 'Extra prostaglandins in arthritis are made by…', a: 'COX-2', o: ['COX-1', 'insulin'], e: '**COX-2** makes the additional prostaglandins in inflammatory diseases like arthritis.' },
        { q: 'Prostaglandins are carboxylic acids with a…', a: 'five-membered ring', o: ['steroid ring system', 'phosphate head'], e: 'Prostaglandins: **carboxylic acids with a 5-membered ring**.' },
        { q: 'Eicosanoids act…', a: 'locally, where they are made', o: ['far away, like hormones', 'only in the liver'], e: 'Eicosanoids are **local mediators**, made on demand and not stored.' },
      ];
      const x = r.pick(items);
      return mcq(x.q, [x.a, ...x.o], 0, { skill: 'l14.eicosanoids', explain: x.e });
    },
  },
  // ----- L15 -----
  {
    id: 'l15-classify', skill: 'l15.classify', title: 'Classify the sugar',
    make(r) {
      const s = randomSugar(r);
      if (!s) return null;
      const wrongs = new Set();
      wrongs.add(`${s.ketose ? 'aldo' : 'keto'}${PREFIX[s.n]}ose`);
      const otherN = r.pick([3, 4, 5, 6].filter((k) => k !== s.n));
      wrongs.add(`${s.ketose ? 'keto' : 'aldo'}${PREFIX[otherN]}ose`);
      return mcq('Classify this monosaccharide.', [s.kind, ...wrongs], 0, {
        skill: 'l15.classify', figure: { sugars: [s.spec] },
        explain: `The C=O is at **${s.ketose ? 'C2 (ketone)' : 'C1 (CHO, aldehyde)'}** → **${s.ketose ? 'keto' : 'aldo'}**; it has **${s.n} carbons** → **${PREFIX[s.n]}ose**. So it\'s ${an(s.kind)} **${s.kind}**.`,
      });
    },
  },
  {
    id: 'l15-dl', skill: 'l15.fischer', title: 'D or L?',
    make(r) {
      const s = randomSugar(r, { minCenters: 1 });
      if (!s) return null;
      const spec = { ...s.spec, mark: [s.spec.rows.length - 1] };
      return mcq('Is this a D or an L sugar?', ['D', 'L'], s.dl === 'D' ? 0 : 1, {
        skill: 'l15.fischer', shuffle: false, figure: { sugars: [spec] },
        explain: `Look only at the chirality center **farthest from the C=O** (highlighted, just above the bottom CH₂OH): its OH is on the **${s.dl === 'D' ? 'right' : 'left'}** → **${s.dl}**.`,
      });
    },
  },
  {
    id: 'l15-centers', skill: 'l15.fischer', title: 'Count the chirality centers',
    make(r) {
      const s = randomSugar(r);
      if (!s) return null;
      const opts = [...new Set([s.centers, s.centers + 1, Math.max(0, s.centers - 1), s.centers + 2])].slice(0, 3);
      return mcq('How many chirality centers does this sugar have?', opts.map(String), 0, {
        skill: 'l15.fischer', figure: { sugars: [s.spec] },
        explain: `Count only the carbons drawn as a **cross** (H on one side, OH on the other): **${s.centers}**. The C=O carbon and the CH₂OH ends are never chirality centers.`,
      });
    },
  },
  {
    id: 'l15-anomer', skill: 'l15.cyclic', title: 'α or β anomer?',
    make(r) {
      const sugar = r.pick(['α-D-glucose', 'β-D-glucose', 'α-D-fructose', 'β-D-fructose']);
      const alpha = sugar.startsWith('α');
      return mcq(`Is this the α or the β anomer of ${sugar.includes('glucose') ? 'glucose' : 'fructose'}?`, ['α (OH down)', 'β (OH up)'], alpha ? 0 : 1, {
        skill: 'l15.cyclic', shuffle: false, figure: { sugars: [{ sugar, mark: [0] }] },
        explain: `The anomeric carbon (highlighted, next to the ring O) has its OH **${alpha ? 'down → α' : 'up → β'}**.`,
      });
    },
  },
  {
    id: 'l15-which-sugar', skill: 'l15.common', title: 'Glucose, fructose or galactose?',
    make(r) {
      const x = r.pick(SUGAR_FACTS);
      return mcq(`Which monosaccharide **${x.s}**?`, SUGARS3, SUGARS3.indexOf(x.a), {
        skill: 'l15.common', shuffle: false,
        explain: '**Glucose**: blood sugar (dextrose), stored as glycogen. **Fructose**: ketohexose in honey, part of sucrose, ~twice as sweet. **Galactose**: part of lactose, differs from glucose at C4; builds up in galactosemia.',
      });
    },
  },
];
