// Lectures 16–17: carbohydrates in the body (acetals, glycosidic linkages, polysaccharides, glycogen,
// GAGs, blood types) and amino acids (side chains, D/L, charge vs pH, peptides, peptide hormones).
// Answers that can be worked out (blood compatibility, charge at a pH, peptide order, which carbon is
// an acetal) are computed here rather than looked up; the rest are drills on small tables of slide facts.
import { mcq } from './common.js';
import { parseSmiles, neighbors } from '../../chem/smiles.js';
import { AMINO_ACIDS, AA_CLASSES, aaSmiles, aaSideAtoms, aminoAcid } from '../../chem/aminoacids.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function matchq(prompt, pairs, { skill, why = '' } = {}) {
  return {
    type: 'match', skill, prompt, left: pairs.map((p) => p[0]), right: pairs.map((p) => p[1]), answer: pairs.map((_, i) => i),
    explain: `${pairs.map(([a, b]) => `**${a}** → ${b}`).join('; ')}.${why ? ` ${why}` : ''}`,
  };
}
const matchFrom = (r, pool, n, prompt, skill, why) => matchq(prompt, r.shuffle(pool).slice(0, n), { skill, why });

// Pick a right answer plus wrong answers from a pool of { a, ... } facts: wrong ones can't share its answer.
function factQ(r, facts, all, skill, extra = {}) {
  const x = r.pick(facts);
  const wrongs = r.shuffle(all.filter((o) => o !== x.a)).slice(0, 3);
  return mcq(x.q, [x.a, ...wrongs], 0, { skill, explain: x.e, ...extra });
}

// ---- Lecture 16 ------------------------------------------------------------------------------

// Sugars as SMILES, for tapping the carbon. Written so the rings draw cleanly.
const CARBON_HUNT = [
  { name: 'glucose', smiles: 'OCC1OC(O)C(O)C(O)C1O' },
  { name: 'galactose', smiles: 'OCC1OC(O)C(O)C(O)C1O' },
  { name: 'fructose', smiles: 'OCC1OC(O)(CO)C(O)C1O' },
  { name: 'maltose', smiles: 'OCC1OC(OC2C(CO)OC(O)C(O)C2O)C(O)C(O)C1O' },
  { name: 'lactose', smiles: 'OCC1OC(OC2C(CO)OC(O)C(O)C2O)C(O)C(O)C1O' },
  { name: 'sucrose', smiles: 'OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O' },
];

// For each carbon: how many OH and how many OR oxygens it holds by single bonds.
function oxygensOn(mol, c) {
  let oh = 0, or = 0;
  for (const n of neighbors(mol, c)) {
    if (mol.atoms[n].el !== 'O') continue;
    if (mol.atoms[n].h > 0) oh += 1; else or += 1;
  }
  return { oh, or };
}
export function acetalCarbons(smiles) {
  const mol = parseSmiles(smiles);
  const carbons = mol.atoms.filter((a) => a.el === 'C');
  return {
    mol, carbons: carbons.map((a) => a.id),
    hemiacetal: carbons.filter((a) => { const o = oxygensOn(mol, a.id); return o.oh === 1 && o.or === 1; }).map((a) => a.id),
    acetal: carbons.filter((a) => oxygensOn(mol, a.id).or === 2).map((a) => a.id),
  };
}

const KINDS = [
  { smiles: 'CC(O)OC', a: 'hemiacetal', c: 1 }, { smiles: 'CCC(O)OC', a: 'hemiacetal', c: 2 }, { smiles: 'CC(O)OCC', a: 'hemiacetal', c: 1 },
  { smiles: 'CC(OC)OC', a: 'acetal', c: 1 }, { smiles: 'CCC(OC)OC', a: 'acetal', c: 2 }, { smiles: 'CC(OCC)OCC', a: 'acetal', c: 1 },
  { smiles: 'CCOCC', a: 'neither', c: 1 }, { smiles: 'CC(O)C', a: 'neither', c: 1 }, { smiles: 'CCC(O)C', a: 'neither', c: 2 },
];
const KIND_WHY = { hemiacetal: 'The shaded carbon has **one OH and one OR**: a **hemiacetal**.', acetal: 'The shaded carbon has **two OR** groups: an **acetal**.', neither: 'The shaded carbon has only **one** oxygen on it, so it is **neither**. Acetals and hemiacetals have two.' };

const DISACCHARIDES = [
  { name: 'maltose', nick: 'malt sugar', parts: 'glucose + glucose', hyd: '2 glucose' },
  { name: 'lactose', nick: 'milk sugar', parts: 'glucose + galactose', hyd: 'glucose + galactose' },
  { name: 'sucrose', nick: 'table sugar', parts: 'glucose + fructose', hyd: 'glucose + fructose' },
];
const PART_OPTIONS = ['glucose + glucose', 'glucose + galactose', 'glucose + fructose', 'fructose + galactose'];

const LINKAGES = [
  { name: 'cellulose', a: '1→4-β', e: '**Cellulose**: unbranched glucose with **1→4-β** links.' },
  { name: 'amylose', a: '1→4-α', e: '**Amylose**, the linear form of starch: **1→4-α** links.' },
  { name: 'amylopectin', a: '1→4-α and 1→6-α', e: '**Amylopectin**, the branched form of starch: **1→4-α** links with **1→6-α** at the branches.' },
  { name: 'chitin', a: '1→4-β', e: '**Chitin**: N-acetyl-D-glucosamine with **1→4-β** links.' },
];
const LINK_OPTIONS = ['1→4-α', '1→4-β', '1→4-α and 1→6-α', '1→6-β'];

const HYDROLYSIS = [
  ...DISACCHARIDES.map((d) => ({ q: `Hydrolysis of **${d.name}** yields…`, a: d.hyd, e: `${cap(d.name)} (${d.nick}) is ${d.parts}. Hydrolysis adds water and cleaves the glycosidic linkage.` })),
  { q: 'Hydrolysis of **starch** yields…', a: 'many glucose units', e: 'Starch is a polymer of repeating **glucose** units.' },
  { q: 'Hydrolysis of **glycogen** yields…', a: 'many glucose units', e: 'Glucose units are hydrolyzed from the many ends of glycogen.' },
];
const HYD_OPTIONS = ['2 glucose', 'glucose + galactose', 'glucose + fructose', 'many glucose units', '2 fructose'];

const DIGEST = [
  { what: 'starch', yes: true, e: '**Amylase** digests both forms of starch (α links).' },
  { what: 'amylopectin', yes: true, e: '**Amylase** digests amylopectin.' },
  { what: 'amylose', yes: true, e: '**Amylase** digests amylose.' },
  { what: 'cellulose', yes: false, e: 'Humans lack **β-glycosidase**, so cellulose passes through as insoluble fiber.' },
];

const SWEET = [
  { q: 'Which artificial sweetener is sold as **Equal**?', a: 'aspartame', e: '**Aspartame** = Equal. It is not actually a sugar.' },
  { q: 'Which artificial sweetener is sold as **Sweet\'n Low**?', a: 'saccharin', e: '**Saccharin** = Sweet\'n Low, used extensively during World War I.' },
  { q: 'Which artificial sweetener is sold as **Splenda**?', a: 'sucralose', e: '**Sucralose** = Splenda: 500× sweeter than sucrose.' },
  { q: 'Which is **not actually a sugar** but has a very sweet taste?', a: 'aspartame', e: '**Aspartame** has no sugar rings.' },
  { q: 'Which was used extensively during **World War I**?', a: 'saccharin', e: '**Saccharin**.' },
  { q: 'Which is **500× sweeter** than sucrose?', a: 'sucralose', e: '**Sucralose**, which also cannot be broken down by the body.' },
  { q: 'Which has a structure very similar to **sucrose**?', a: 'sucralose', e: '**Sucralose**: sucrose with three OH groups replaced by Cl.' },
];
const SWEET_NAMES = ['aspartame', 'saccharin', 'sucralose'];

const FED_FAST = [
  { c: 'The liver is taking up glucose from the blood.', fed: true }, { c: 'Glucose is being converted into glycogen for short-term storage.', fed: true },
  { c: 'The liver is preventing a spike in blood glucose.', fed: true }, { c: 'Liver glycogen is being broken down into glucose.', fed: false },
  { c: 'The liver is releasing glucose into the blood.', fed: false }, { c: 'Muscle glycogen is being used locally by the muscles.', fed: false },
];

const GAGS = [
  { q: 'Which GAG lubricates joints and is in the vitreous humor of the eye?', a: 'hyaluronate', e: '**Hyaluronate**: extracellular fluids in joints and the eye.' },
  { q: 'Which GAG is a component of cartilage and tendons?', a: 'chondroitin', e: '**Chondroitin**: cartilage and tendons.' },
  { q: 'Which GAG is an anticoagulant?', a: 'heparin', e: '**Heparin** helps prevent blood clotting.' },
  { q: 'Which GAG is stored in the mast cells of the liver?', a: 'heparin', e: '**Heparin**, stored in the mast cells of the liver.' },
  { q: 'Which polysaccharide is in the exoskeleton of crustaceans and insects?', a: 'chitin', e: '**Chitin**, also in the cell wall of fungi.' },
  { q: 'Which polysaccharide is in the cell wall of fungi?', a: 'chitin', e: '**Chitin**: N-acetyl-D-glucosamine joined 1→4-β.' },
];
const GAG_NAMES = ['hyaluronate', 'chondroitin', 'heparin', 'chitin'];

// Blood compatibility from first principles: a patient can receive a type if it brings no antigen
// (A or B sugar) that their own cells lack.
const ANTIGENS = { O: [], A: ['A'], B: ['B'], AB: ['A', 'B'] };
const BLOOD = Object.keys(ANTIGENS);
export const canReceive = (patient, donor) => ANTIGENS[donor].every((x) => ANTIGENS[patient].includes(x));
const typeOf = (t) => `type ${t}`;
function bloodWhy(p, d) {
  if (p === 'AB') return 'Type **AB** is the **universal recipient**: no antibodies to A, B or O.';
  if (d === 'O') return 'Type **O** is the **universal donor**: no other type has antibodies to it.';
  if (p === d) return 'The same type is always safe: it brings nothing foreign.';
  return `Type ${p} blood lacks the sugar that type ${d} cells carry, so a type ${p} patient has antibodies against it.`;
}

const BLOOD_SUGAR = [
  { q: 'Which sugar does **type A** blood add to the three common ones?', a: 'N-acetyl-D-galactosamine', e: 'Type **A** adds a fourth monosaccharide: **N-acetyl-D-galactosamine**.' },
  { q: 'Which sugar does **type B** blood add to the three common ones?', a: 'D-galactose', e: 'Type **B** contains an additional **D-galactose** unit.' },
];
const BLOOD_SUGAR_NAMES = ['N-acetyl-D-galactosamine', 'D-galactose', 'L-fucose', 'N-acetyl-D-glucosamine'];

const M_DISACCH = [['maltose', 'glucose + glucose'], ['lactose', 'glucose + galactose'], ['sucrose', 'glucose + fructose']];
const M_ENZYME = [['lactase', 'cleaves the bond in lactose'], ['amylase', 'digests starch'], ['β-glycosidase', 'hydrolyzes cellulose; humans lack it'], ['lipase', 'hydrolyzes triacylglycerols']];
const M_SWEET = [['aspartame', 'Equal'], ['saccharin', 'Sweet\'n Low'], ['sucralose', 'Splenda']];
const M_POLY = [['cellulose', 'unbranched, 1→4-β, in plant cell walls'], ['amylose', 'unbranched, 1→4-α, starch'], ['amylopectin', 'branched, 1→4-α and 1→6-α, starch'], ['glycogen', 'highly branched, stored in liver and muscle'], ['chitin', 'N-acetyl-D-glucosamine, in exoskeletons']];
const M_GAG = [['hyaluronate', 'lubricates joints; vitreous humor of the eye'], ['chondroitin', 'cartilage and tendons'], ['heparin', 'anticoagulant in mast cells of the liver'], ['chitin', 'exoskeletons and fungal cell walls']];
const M_BLOOD = [['type O', 'no fourth sugar; universal donor'], ['type A', 'adds N-acetyl-D-galactosamine'], ['type B', 'adds an extra D-galactose'], ['type AB', 'both A and B sugars; universal recipient']];

// ---- Lecture 17 ------------------------------------------------------------------------------

const CLS_OPTIONS = Object.values(AA_CLASSES);
const CLS_WHY = {
  nonpolar: 'Its side chain is **nonpolar**: mostly C and H. Nonpolar: Gly, Ala, Val, Leu, Ile, Met, Phe, Trp, Pro.',
  polar: 'Its side chain is **polar** but uncharged. Polar: Ser, Thr, Cys, Tyr, Asn, Gln.',
  acidic: 'Its side chain has a second **COO⁻**: **acidic**. Only Asp and Glu.',
  basic: 'Its side chain has an **N with a + charge**: **basic**. Only Lys, Arg and His.',
};
// Side chains with no group of their own that gains or loses a proton in the pH ranges on the slides.
const NEUTRAL = AMINO_ACIDS.filter((a) => ['Gly', 'Ala', 'Val', 'Leu', 'Ile', 'Ser', 'Thr', 'Phe', 'Met', 'Asn', 'Gln'].includes(a.three));
const DRAWABLE = AMINO_ACIDS.filter((a) => !a.noDraw);
const SIMPLE_DRAW = DRAWABLE.filter((a) => !['Lys', 'Gln', 'Asn', 'Glu', 'Asp'].includes(a.three));
const forms = (a) => ({
  low: { rs: [a.ring ? { r: 'CH2', ring: a.ring } : a.r], n: 'H3N⁺', c: 'OH' },
  zwit: { rs: [a.ring ? { r: 'CH2', ring: a.ring } : a.r], n: 'H3N⁺', c: 'O⁻' },
  high: { rs: [a.ring ? { r: 'CH2', ring: a.ring } : a.r], n: 'H2N', c: 'O⁻' },
  none: { rs: [a.ring ? { r: 'CH2', ring: a.ring } : a.r], n: 'H2N', c: 'OH' },
});
// A pH clearly in one of the slide's three ranges, relative to an isoelectric pH of about 6.
function randomPh(r) {
  const zone = r.pick(['low', 'zwit', 'high']);
  const pH = zone === 'low' ? r.pick([1, 1.5, 2]) : zone === 'high' ? r.pick([10, 11, 12]) : 6;
  return { zone, pH };
}
const CHARGE = { low: '+1', zwit: '0', high: '−1' };
const ZONE_WHY = {
  low: 'pH below the isoelectric pH: **low pH = more acid**, so COO⁻ picks up a proton. –NH₃⁺ and –COOH → **+1**.',
  zwit: 'At the isoelectric pH (about 6), it is the **zwitterion**: –NH₃⁺ and –COO⁻ cancel → **0**.',
  high: 'pH above the isoelectric pH: **high pH = more base**, so –NH₃⁺ loses a proton. –NH₂ and –COO⁻ → **−1**.',
};
const dash = (seq) => seq.join('–');
const SIZES = [
  { name: 'dipeptide', n: 2 }, { name: 'tripeptide', n: 3 }, { name: 'tetrapeptide', n: 4 }, { name: 'pentapeptide', n: 5 }, { name: 'nonapeptide', n: 9 },
];

const PROTEINS = [
  { q: 'Which protein carries O₂ in the blood?', a: 'hemoglobin', e: '**Hemoglobin**: a transport protein.' },
  { q: 'Which protein stores O₂ in tissues?', a: 'myoglobin', e: '**Myoglobin** stores O₂; hemoglobin transports it.' },
  { q: 'Which fibrous protein is in tendons, bone, cartilage and blood vessels?', a: 'collagen', e: '**Collagen**, in connective tissue.' },
  { q: 'Which fibrous protein is in hair, skin and nails?', a: 'keratin', e: '**Keratin**.' },
  { q: 'Which protein stores iron in the liver?', a: 'ferritin', e: '**Ferritin** stores iron (Fe).' },
  { q: 'Which protein hormone from the pancreas controls blood glucose?', a: 'insulin', e: '**Insulin**.' },
];
const PROTEIN_NAMES = ['hemoglobin', 'myoglobin', 'collagen', 'keratin', 'ferritin', 'insulin'];
const M_PROTEIN = [['hemoglobin', 'carries O₂ in the blood'], ['myoglobin', 'stores O₂ in tissues'], ['collagen', 'fibrous; tendons, bone, cartilage'], ['keratin', 'fibrous; hair, skin, nails'], ['ferritin', 'stores iron in the liver'], ['actin and myosin', 'control muscle contractions'], ['insulin', 'controls blood glucose levels']];

const BODY = [
  { q: 'Enkephalins are…', a: 'pentapeptides made in the brain', o: ['nonapeptides made in the kidney', 'steroids made in the ovaries', 'polysaccharides made in the liver'], e: '**Pentapeptides** (five amino acids) **made in the brain**.' },
  { q: 'Morphine and heroin act like enkephalins because they…', a: 'bind the same pain receptors', o: ['are pentapeptides', 'contain disulfide bonds', 'are hydrolyzed to glycine'], e: 'They bind to the **same pain receptors**, with a longer lasting response.' },
  { q: 'Enkephalins belong to the family called…', a: 'endorphins', o: ['statins', 'lipoproteins', 'antibodies'], e: '**Endorphins**: pain reducing and mood enhancing.' },
  { q: 'The sequence of met-enkephalin is…', a: 'Tyr–Gly–Gly–Phe–Met', o: ['Met–Gly–Gly–Phe–Tyr', 'Tyr–Gly–Gly–Phe–Leu', 'Tyr–Ala–Ala–Phe–Met'], e: '**Tyr–Gly–Gly–Phe–Met**. Leu-enkephalin ends in Leu instead.' },
  { q: 'Which amino acid forms disulfide bonds?', a: 'cysteine', o: ['methionine', 'serine', 'tyrosine'], e: '**Cysteine**: its SH side chain joins another as S–S. (Methionine\'s sulfur has no S–H.)' },
  { q: 'Disulfide bonds in a protein…', a: 'connect parts that are far away', o: ['join amino acids end to end', 'carry oxygen', 'set the D or L form'], e: 'Two cysteines join **two far-apart parts of a protein**, as in insulin.' },
  { q: 'Oxytocin and vasopressin are…', a: 'cyclic nonapeptides', o: ['linear pentapeptides', 'steroid hormones', 'polysaccharides'], e: '**Cyclic nonapeptides**: nine amino acids.' },
  { q: 'Which hormone is often used to induce labor?', a: 'oxytocin', o: ['vasopressin', 'met-enkephalin', 'insulin'], e: '**Oxytocin** stimulates the contraction of uterine muscles.' },
  { q: 'Which hormone signals for milk production?', a: 'oxytocin', o: ['vasopressin', 'leu-enkephalin', 'ferritin'], e: '**Oxytocin** makes breast milk available to a nursing infant.' },
  { q: 'Antidiuretic hormone (ADH) is another name for…', a: 'vasopressin', o: ['oxytocin', 'insulin', 'enkephalin'], e: '**Vasopressin** targets the kidneys and limits urine production.' },
  { q: 'Vasopressin targets which organ?', a: 'the kidneys', o: ['the uterus', 'the liver', 'the pancreas'], e: '**The kidneys**: they retain fluid, so urine output decreases.' },
  { q: 'Compared with oxytocin, vasopressin has…', a: 'Phe and Arg instead of Ile and Leu', o: ['Ile and Leu instead of Phe and Arg', 'a completely different sequence', 'no disulfide bond'], e: 'Oxytocin: Cys–Tyr–**Ile**–Gln–Asn–Cys–Pro–**Leu**–GlyNH₂. Vasopressin: **Phe** and **Arg** in those spots.' },
];
const M_BODY = [['enkephalins', 'pentapeptides that bind pain receptors'], ['oxytocin', 'contracts the uterus; used to induce labor'], ['vasopressin', 'ADH: limits urine output'], ['cysteine', 'forms disulfide bonds'], ['morphine', 'binds the same pain receptors as enkephalins']];

export const sugarProteinGenerators = [
  // ----- L16 -----
  {
    id: 'l16-find-carbon', skill: 'l16.acetals', title: 'Tap the hemiacetal or acetal carbon',
    make(r) {
      const x = r.pick(CARBON_HUNT);
      const info = acetalCarbons(x.smiles);
      const options = [];
      if (info.hemiacetal.length) options.push('hemiacetal');
      if (info.acetal.length) options.push('acetal');
      const want = r.pick(options);
      const answer = info[want];
      return {
        type: 'atoms', skill: 'l16.acetals', figure: { smiles: x.smiles }, selectable: info.carbons, answer,
        prompt: `This is ${x.name} in skeletal form. Tap the **${want} carbon${answer.length > 1 ? 's' : ''}**.`,
        hint: 'Look for a carbon with **two oxygens** on it. One OH + one OR = hemiacetal; two OR = acetal.',
        explain: want === 'hemiacetal' ? 'The **hemiacetal** carbon has the ring O (an OR) and an **OH**.' : `An **acetal** carbon has **two OR** groups: the ring O and the bridging O of the glycosidic linkage.${x.name === 'sucrose' ? ' Sucrose joins at both anomeric carbons, so it has two.' : ''}`,
      };
    },
  },
  {
    id: 'l16-kind', skill: 'l16.acetals', title: 'Acetal, hemiacetal or neither?',
    make(r) {
      const x = r.pick(KINDS);
      return mcq('What is the shaded carbon?', ['hemiacetal', 'acetal', 'neither'], ['hemiacetal', 'acetal', 'neither'].indexOf(x.a), {
        skill: 'l16.acetals', shuffle: false, figure: { smiles: x.smiles, highlight: [x.c] }, explain: KIND_WHY[x.a],
      });
    },
  },
  {
    id: 'l16-composition', skill: 'l16.disaccharides', title: 'Which sugars make it?',
    make(r) {
      const d = r.pick(DISACCHARIDES);
      if (r.chance(0.5)) {
        return mcq(`**${cap(d.name)}** (${d.nick}) is made of…`, PART_OPTIONS, PART_OPTIONS.indexOf(d.parts), { skill: 'l16.disaccharides', explain: `${cap(d.name)}: **${d.parts}**.` });
      }
      const names = DISACCHARIDES.map((x) => x.name);
      return mcq(`Which disaccharide is **${d.parts}**?`, names, names.indexOf(d.name), { skill: 'l16.disaccharides', shuffle: false, explain: `**${cap(d.name)}** (${d.nick}) is ${d.parts}.` });
    },
  },
  {
    id: 'l16-glyco-form', skill: 'l16.disaccharides', title: 'What do these sugars make?',
    make(r) {
      const d = r.pick(DISACCHARIDES);
      const others = DISACCHARIDES.filter((x) => x !== d).map((x) => `${x.name} + H₂O`);
      return mcq(`**${cap(d.parts)}** join by a glycosidic linkage. What forms?`, [`${d.name} + H₂O`, ...others, `${d.name} + O₂`], 0, {
        skill: 'l16.disaccharides',
        explain: `${cap(d.parts)} make **${d.name}** (${d.nick}). An OH from each sugar lines up, and **H₂O is removed**.`,
      });
    },
  },
  {
    id: 'l16-linkage-drawn', skill: 'l16.disaccharides', title: 'α or β linkage?',
    make(r) {
      const sugar = r.pick(['α-glycoside', 'β-glycoside', 'maltose', 'lactose']);
      const alpha = sugar === 'α-glycoside' || sugar === 'maltose';
      return mcq('Is this glycosidic linkage α or β?', ['α (bond from C1 down)', 'β (bond from C1 up)'], alpha ? 0 : 1, {
        skill: 'l16.disaccharides', shuffle: false, figure: { sugars: [{ sugar }] },
        explain: `Follow the bond leaving **C1** (next to the ring O) of the left ring. It points **${alpha ? 'down → α' : 'up → β'}**, so this is a **1→4-${alpha ? 'α' : 'β'}** linkage.`,
      });
    },
  },
  {
    id: 'l16-linkage', skill: 'l16.polysaccharides', title: 'Which linkage?',
    make(r) {
      const x = r.pick(LINKAGES);
      return mcq(`Which linkages join the rings of **${x.name}**?`, LINK_OPTIONS, LINK_OPTIONS.indexOf(x.a), { skill: 'l16.polysaccharides', shuffle: false, explain: x.e });
    },
  },
  {
    id: 'l16-poly-drawn', skill: 'l16.polysaccharides', title: 'Name this polysaccharide',
    make(r) {
      const x = r.pick([
        { sugar: 'cellulose', e: 'The bonds from C1 point **up** (β), there is no branch, and the rings are plain glucose: **cellulose**.' },
        { sugar: 'amylose', e: 'The bonds from C1 point **down** (α) with no branch: **amylose**, the linear form of starch.' },
        { sugar: 'amylopectin', e: 'α links plus a **branch** through a CH₂ (a 1→6 link): **amylopectin**.' },
        { sugar: 'chitin', e: 'β links, and each ring carries an **NHCOCH₃**: **chitin**.' },
      ]);
      const names = ['cellulose', 'amylose', 'amylopectin', 'chitin'];
      return mcq('Which polysaccharide is shown here?', names, names.indexOf(x.sugar), { skill: 'l16.polysaccharides', shuffle: false, figure: { sugars: [{ sugar: x.sugar }] }, explain: x.e });
    },
  },
  {
    id: 'l16-hydrolysis', skill: 'l16.disaccharides', title: 'What does hydrolysis yield?',
    make(r) {
      const x = r.pick(HYDROLYSIS);
      const others = r.shuffle(HYD_OPTIONS.filter((o) => o !== x.a)).slice(0, 3);
      return mcq(x.q, [x.a, ...others], 0, { skill: 'l16.disaccharides', explain: x.e });
    },
  },
  {
    id: 'l16-digest', skill: 'l16.polysaccharides', title: 'Can humans digest it?',
    make(r) {
      const x = r.pick(DIGEST);
      return { type: 'tf', skill: 'l16.polysaccharides', prompt: `True or false: humans can digest **${x.what}**.`, answer: x.yes, explain: `**${x.yes ? 'True' : 'False'}.** ${x.e}` };
    },
  },
  {
    id: 'l16-sweetener', skill: 'l16.health', title: 'Which sweetener?',
    make(r) {
      const x = r.pick(SWEET);
      return mcq(x.q, SWEET_NAMES, SWEET_NAMES.indexOf(x.a), { skill: 'l16.health', shuffle: false, explain: x.e });
    },
  },
  {
    id: 'l16-fed-fast', skill: 'l16.glycogen', title: 'Fed or fasting?',
    make(r) {
      const x = r.pick(FED_FAST);
      return mcq(`${x.c} Which state is this?`, ['fed state', 'fasting state'], x.fed ? 0 : 1, {
        skill: 'l16.glycogen', shuffle: false,
        explain: x.fed ? '**Fed state** (right after a meal): the liver takes up glucose to prevent a spike, and glucose is stored as glycogen in muscle and liver.' : '**Fasting state** (6–12 h without food): muscle glycogen is used locally, and liver glycogen becomes glucose released into the blood.',
      });
    },
  },
  {
    id: 'l16-gag', skill: 'l16.gags', title: 'GAGs and chitin',
    make(r) {
      const x = r.pick(GAGS);
      return mcq(x.q, GAG_NAMES, GAG_NAMES.indexOf(x.a), { skill: 'l16.gags', shuffle: false, explain: x.e });
    },
  },
  {
    id: 'l16-blood-compat', skill: 'l16.blood', title: 'Who can receive what?',
    make(r) {
      const p = r.pick(BLOOD), d = r.pick(BLOOD);
      const ok = canReceive(p, d);
      if (p !== 'AB' && r.chance(0.5)) {
        const good = r.pick(BLOOD.filter((x) => canReceive(p, x)));
        const bad = BLOOD.filter((x) => !canReceive(p, x));
        return mcq(`A patient with **${typeOf(p)}** blood needs a transfusion. Which of these can they safely receive?`, [good, ...bad].map(typeOf), 0, { skill: 'l16.blood', explain: bloodWhy(p, good) });
      }
      return { type: 'tf', skill: 'l16.blood', prompt: `True or false: a patient with **${typeOf(p)}** blood can safely receive **${typeOf(d)}** blood.`, answer: ok, explain: `**${ok ? 'True' : 'False'}.** ${bloodWhy(p, d)}` };
    },
  },
  {
    id: 'l16-blood-sugar', skill: 'l16.blood', title: 'Blood-type sugars',
    make(r) {
      if (r.chance(0.35)) {
        const donor = r.chance(0.5);
        return mcq(`Which blood type is the **universal ${donor ? 'donor' : 'recipient'}**?`, ['O', 'A', 'B', 'AB'], donor ? 0 : 3, {
          skill: 'l16.blood', shuffle: false,
          explain: donor ? '**Type O**: people with any other blood type have no antibodies to it.' : '**Type AB**: its blood contains no antibodies to A, B or O.',
        });
      }
      const x = r.pick(BLOOD_SUGAR);
      return mcq(x.q, BLOOD_SUGAR_NAMES, BLOOD_SUGAR_NAMES.indexOf(x.a), { skill: 'l16.blood', shuffle: false, explain: x.e });
    },
  },
  { id: 'l16-match-disacch', skill: 'l16.disaccharides', title: 'Match the disaccharides', make(r) { return matchq('Match each disaccharide with its sugars.', r.shuffle(M_DISACCH), { skill: 'l16.disaccharides' }); } },
  { id: 'l16-match-enzyme', skill: 'l16.polysaccharides', title: 'Match the enzymes', make(r) { return matchFrom(r, M_ENZYME, 3, 'Match each enzyme with what it does.', 'l16.polysaccharides'); } },
  { id: 'l16-match-sweet', skill: 'l16.health', title: 'Match the sweeteners', make(r) { return matchq('Match each sweetener with its trade name.', r.shuffle(M_SWEET), { skill: 'l16.health' }); } },
  { id: 'l16-match-poly', skill: 'l16.polysaccharides', title: 'Match the polysaccharides', make(r) { return matchFrom(r, M_POLY, 4, 'Match each polysaccharide with its description.', 'l16.polysaccharides'); } },
  { id: 'l16-match-gag', skill: 'l16.gags', title: 'Match: GAGs and chitin', make(r) { return matchq('Match each molecule with its description.', r.shuffle(M_GAG), { skill: 'l16.gags' }); } },
  { id: 'l16-match-blood', skill: 'l16.blood', title: 'Match the blood types', make(r) { return matchq('Match each blood type with its description.', r.shuffle(M_BLOOD), { skill: 'l16.blood' }); } },

  // ----- L17 -----
  {
    id: 'l17-protein-job', skill: 'l17.proteins', title: 'Which protein?',
    make(r) { return factQ(r, PROTEINS, PROTEIN_NAMES, 'l17.proteins'); },
  },
  {
    id: 'l17-daily', skill: 'l17.proteins', title: 'Daily protein',
    make(r) {
      const kg = r.pick([40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100]);
      const g = Math.round(kg * 0.8 * 10) / 10;
      return { type: 'num', skill: 'l17.proteins', prompt: `At **0.8 g of protein per kg**, how many grams of protein per day does a ${kg}-kg adult need?`, answer: g, tol: 0.01, placeholder: 'grams', explain: `${kg} kg × 0.8 g/kg = **${g} g**.` };
    },
  },
  {
    id: 'l17-alpha-carbon', skill: 'l17.structure', title: 'Tap the α carbon',
    make(r) {
      const a = r.pick(AMINO_ACIDS.filter((x) => x.three !== 'Pro'));
      const smiles = aaSmiles(a);
      const mol = parseSmiles(smiles);
      return {
        type: 'atoms', skill: 'l17.structure', figure: { smiles }, selectable: mol.atoms.filter((x) => x.el === 'C').map((x) => x.id), answer: [1],
        prompt: `This is ${a.name}. Tap the **α carbon**.`,
        explain: 'The **α carbon** is bonded to both the nitrogen (–NH₃⁺) and the carboxylate carbon (–COO⁻). The side chain hangs off it.',
      };
    },
  },
  {
    id: 'l17-class', skill: 'l17.sidechains', title: 'What kind of side chain?',
    make(r) {
      const a = r.pick(AMINO_ACIDS);
      return mcq(`What kind of side chain does **${a.name}** (${a.three}) have?`, CLS_OPTIONS, CLS_OPTIONS.indexOf(AA_CLASSES[a.cls]), { skill: 'l17.sidechains', shuffle: false, figure: { smiles: aaSmiles(a), highlight: aaSideAtoms(a), scale: 28 }, explain: CLS_WHY[a.cls] });
    },
  },
  {
    id: 'l17-abbrev', skill: 'l17.sidechains', title: 'Names and abbreviations',
    make(r) {
      const a = r.pick(AMINO_ACIDS);
      const others = r.shuffle(AMINO_ACIDS.filter((x) => x !== a)).slice(0, 3);
      const mode = r.pick(['three', 'name', 'one']);
      if (mode === 'three') return mcq(`What is the three-letter abbreviation for **${a.name}**?`, [a, ...others].map((x) => x.three), 0, { skill: 'l17.sidechains', explain: `${cap(a.name)} = **${a.three}** (one letter: ${a.one}).` });
      if (mode === 'name') return mcq(`Which amino acid is **${a.three}**?`, [a, ...others].map((x) => x.name), 0, { skill: 'l17.sidechains', explain: `**${a.three}** = ${a.name} (one letter: ${a.one}).` });
      return mcq(`Which amino acid has the one-letter abbreviation **${a.one}**?`, [a, ...others].map((x) => x.name), 0, { skill: 'l17.sidechains', explain: `**${a.one}** = ${a.name} (${a.three}).` });
    },
  },
  {
    id: 'l17-identify', skill: 'l17.sidechains', title: 'Identify the amino acid',
    make(r) {
      const a = r.pick(AMINO_ACIDS);
      // wrong answers from the same group first: those are the ones that get confused
      const same = r.shuffle(AMINO_ACIDS.filter((x) => x !== a && x.cls === a.cls));
      const rest = r.shuffle(AMINO_ACIDS.filter((x) => x.cls !== a.cls));
      const picks = [a, ...[...same, ...rest].slice(0, 3)];
      return mcq('Identify this amino acid. Its side chain is shaded.', picks.map((x) => x.name), 0, { skill: 'l17.sidechains', figure: { smiles: aaSmiles(a), highlight: aaSideAtoms(a), scale: 28 }, explain: `This is **${a.name}** (${a.three}, ${a.one})${a.r ? `: its side chain is ${a.r.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])}` : ''}.` });
    },
  },
  {
    id: 'l17-chiral', skill: 'l17.stereo', title: 'Chirality center on the α carbon?',
    make(r) {
      const a = r.chance(0.35) ? aminoAcid('Gly') : r.pick(AMINO_ACIDS);
      const has = a.three !== 'Gly';
      return { type: 'tf', skill: 'l17.stereo', prompt: `True or false: the α carbon of **${a.name}** is a chirality center.`, answer: has, explain: has ? `**True.** All amino acids except glycine have a chirality center on the α carbon.` : '**False.** Glycine has R = H, so its α carbon has two H atoms. It is the only one with no chirality center.' };
    },
  },
  {
    id: 'l17-dl', skill: 'l17.stereo', title: 'D or L amino acid?',
    make(r) {
      const a = r.pick(DRAWABLE.filter((x) => x.three !== 'Gly' && !x.ring));
      const left = r.chance(0.5);
      const spec = { top: 'COO⁻', rows: [left ? ['H3N⁺', 'H'] : ['H', 'NH3⁺']], bottom: a.r };
      return mcq(`Is this ${a.name} the D or the L form?`, ['D', 'L'], left ? 1 : 0, { skill: 'l17.stereo', shuffle: false, figure: { sugars: [spec] }, explain: `The –NH₃⁺ is on the **${left ? 'left → L' : 'right → D'}**. Only **L** amino acids are found in humans${left ? '' : ', so this is not one of them'}.` });
    },
  },
  {
    id: 'l17-charge', skill: 'l17.acidbase', title: 'Net charge at this pH',
    make(r) {
      const a = r.pick(NEUTRAL);
      const { zone, pH } = randomPh(r);
      return mcq(`Taking its isoelectric pH to be about 6, what is the net charge of **${a.name}** at **pH ${pH}**?`, ['+1', '0', '−1'], ['low', 'zwit', 'high'].indexOf(zone), { skill: 'l17.acidbase', shuffle: false, explain: ZONE_WHY[zone] });
    },
  },
  {
    id: 'l17-form', skill: 'l17.acidbase', title: 'Which form at this pH?',
    make(r) {
      const a = r.pick(NEUTRAL.filter((x) => !x.noDraw));
      const f = forms(a);
      const { zone, pH } = randomPh(r);
      const order = ['low', 'zwit', 'high', 'none'];
      return {
        type: 'struct', skill: 'l17.acidbase', shuffle: true,
        prompt: `Which form of **${a.name}** is present at **pH ${pH}**? (Take its isoelectric pH to be about 6.)`,
        choices: order.map((k) => ({ peptide: f[k], desc: `${f[k].n}…${f[k].c === 'OH' ? 'COOH' : 'COO⁻'}` })), answer: order.indexOf(zone),
        hint: 'Low pH: everything has its H on. High pH: everything has lost it.',
        explain: `${ZONE_WHY[zone]} The form with **H₂N** and **COOH** does not exist.`,
      };
    },
  },
  {
    id: 'l17-acid-base-fact', skill: 'l17.acidbase', title: 'Zwitterions and pH',
    make(r) {
      const x = r.pick([
        { q: 'At a pH **below** the isoelectric pH, an amino acid has…', a: 'a net positive charge', e: 'COO⁻ gains a proton: –NH₃⁺ and –COOH.' },
        { q: 'At a pH **above** the isoelectric pH, an amino acid has…', a: 'a net negative charge', e: '–NH₃⁺ loses a proton: –NH₂ and –COO⁻.' },
        { q: 'At the **isoelectric pH**, an amino acid has…', a: 'no net charge', e: 'It is a neutrally charged **zwitterion**.' },
      ]);
      const opts = ['a net positive charge', 'a net negative charge', 'no net charge'];
      return mcq(x.q, opts, opts.indexOf(x.a), { skill: 'l17.acidbase', shuffle: false, explain: x.e });
    },
  },
  {
    id: 'l17-count', skill: 'l17.peptides', title: 'Count the amino acids and bonds',
    make(r) {
      const s = r.pick(SIZES);
      if (r.chance(0.5)) return { type: 'num', skill: 'l17.peptides', prompt: `How many **peptide bonds** join the amino acids of a ${s.name}?`, answer: s.n - 1, tol: 0, explain: `A ${s.name} has ${s.n} amino acids, and n amino acids have n − 1 peptide bonds: **${s.n - 1}**.` };
      return { type: 'num', skill: 'l17.peptides', prompt: `How many **amino acids** does a ${s.name} have?`, answer: s.n, tol: 0, explain: `The prefix says it: **${s.n}**.` };
    },
  },
  {
    id: 'l17-terminal', skill: 'l17.peptides', title: 'N-terminal or C-terminal?',
    make(r) {
      const seq = r.shuffle(AMINO_ACIDS).slice(0, r.int(2, 4)).map((a) => a.three);
      const wantN = r.chance(0.5);
      return mcq(`In **${dash(seq)}**, which is the **${wantN ? 'N' : 'C'}-terminal** amino acid?`, seq, wantN ? 0 : seq.length - 1, {
        skill: 'l17.peptides', shuffle: false,
        explain: wantN ? `The N-terminal amino acid has the free –NH₃⁺ and is written on the **left**: **${seq[0]}**.` : `The C-terminal amino acid has the free –COO⁻ and is written on the **right**: **${seq[seq.length - 1]}**.`,
      });
    },
  },
  {
    id: 'l17-dipeptide-name', skill: 'l17.peptides', title: 'Name the dipeptide',
    make(r) {
      const pool = SIMPLE_DRAW.filter((x) => x.cls === 'nonpolar' || x.cls === 'polar');
      const [a, b] = r.shuffle(pool).slice(0, 2);
      const fwd = r.chance(0.5);
      const right = `${a.yl}${b.name}`, wrong = `${b.yl}${a.name}`;
      if (fwd) return mcq(`What is the name of **${a.three}–${b.three}**?`, [right, wrong], 0, { skill: 'l17.peptides', explain: `The N-terminal amino acid comes first and ends in **-yl**: **${right}**.` });
      return mcq(`Which is **${right}**?`, [`${a.three}–${b.three}`, `${b.three}–${a.three}`], 0, { skill: 'l17.peptides', explain: `The first name, ${a.yl}, is the N-terminal amino acid, written on the left: **${a.three}–${b.three}**.` });
    },
  },
  {
    id: 'l17-draw', skill: 'l17.draw', title: 'Pick the dipeptide',
    make(r) {
      const [a, b, c] = r.shuffle(SIMPLE_DRAW).slice(0, 3);
      const right = { seq: [a.three, b.three] };
      const swapped = { seq: [b.three, a.three] };
      const noCharge = { seq: [a.three, b.three], n: 'H2N', c: 'OH' };
      const wrongR = { seq: [a.three, c.three] };
      return {
        type: 'struct', skill: 'l17.draw', shuffle: true,
        prompt: `**${a.name[0].toUpperCase()}${a.name.slice(1)}** and **${b.name}** are joined so that **${a.three}** comes first. Which is **${a.three}–${b.three}**?`,
        figure: { peptides: [{ seq: [a.three], caption: `${a.three}` }, { seq: [b.three], caption: `${b.three}` }] },
        choices: [right, swapped, noCharge, wrongR].map((p) => ({ peptide: p, desc: `${dash(p.seq)}${p.n ? ' (uncharged ends)' : ''}` })), answer: 0,
        hint: 'The first amino acid named goes on the **left** and keeps its free –NH₃⁺. Its –COO⁻ joins the –NH₃⁺ of the second.',
        explain: `**${a.three}** goes on the **left**, keeping its –NH₃⁺; **${b.three}** goes on the **right**, keeping its –COO⁻. Remove one O and two H (as H₂O) where they meet, and connect C to N. The swapped drawing is ${dash(swapped.seq)}, a different compound.`,
      };
    },
  },
  {
    id: 'l17-read', skill: 'l17.draw', title: 'Read the dipeptide',
    make(r) {
      const [a, b] = r.shuffle(SIMPLE_DRAW).slice(0, 2);
      return mcq('Name this dipeptide, using three-letter names.', [`${a.three}–${b.three}`, `${b.three}–${a.three}`], 0, {
        skill: 'l17.draw', figure: { peptides: [{ seq: [a.three, b.three] }] },
        explain: `The free –NH₃⁺ is on the left, so read from there: ${a.name}, then ${b.name}. **${a.three}–${b.three}**.`,
      });
    },
  },
  {
    id: 'l17-body', skill: 'l17.body', title: 'Enkephalins, disulfides & hormones',
    make(r) {
      const x = r.pick(BODY);
      return mcq(x.q, [x.a, ...x.o], 0, { skill: 'l17.body', explain: x.e });
    },
  },
  { id: 'l17-match-class', skill: 'l17.sidechains', title: 'Match: kinds of side chain', make(r) {
    const pairs = Object.keys(AA_CLASSES).map((k) => [r.pick(AMINO_ACIDS.filter((a) => a.cls === k)).name, AA_CLASSES[k]]);
    return matchq('Match each amino acid with its kind of side chain.', r.shuffle(pairs), { skill: 'l17.sidechains' });
  } },
  { id: 'l17-match-abbrev', skill: 'l17.sidechains', title: 'Match the abbreviations', make(r) {
    const picks = r.shuffle(AMINO_ACIDS).slice(0, 4);
    const one = r.chance(0.4);
    return matchq(`Match each amino acid with its ${one ? 'one' : 'three'}-letter abbreviation.`, picks.map((a) => [a.name, one ? a.one : a.three]), { skill: 'l17.sidechains' });
  } },
  { id: 'l17-match-protein', skill: 'l17.proteins', title: 'Match the proteins', make(r) { return matchFrom(r, M_PROTEIN, 4, 'Match each protein with its job.', 'l17.proteins'); } },
  { id: 'l17-match-charge', skill: 'l17.acidbase', title: 'Match: charge and pH', make(r) {
    return matchq('Match each form of an amino acid with its net charge.', r.shuffle([['–NH₃⁺ and –COOH (low pH)', '+1'], ['–NH₃⁺ and –COO⁻ (isoelectric pH)', '0'], ['–NH₂ and –COO⁻ (high pH)', '−1']]), { skill: 'l17.acidbase' });
  } },
  { id: 'l17-match-body', skill: 'l17.body', title: 'Match: peptides in the body', make(r) { return matchFrom(r, M_BODY, 4, 'Match each name with its description.', 'l17.body'); } },
];
