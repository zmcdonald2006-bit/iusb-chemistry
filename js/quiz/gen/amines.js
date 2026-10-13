// Lectures 11–12: amines (classifying, shape, naming, properties, alkaloids, amines as bases) and
// amines in the body (ammonium-salt drugs, the nervous system, neurotransmitters, agonists and
// antagonists, epinephrine and related drugs, histamine and antihistamines).
import { mcq, structq, moleculeOf, distinctByKey, nameTyped } from './common.js';
import { parseSmiles, neighbors, cloneMol, addAtomTo, computeHydrogens, toSmiles, removeAtoms } from '../../chem/smiles.js';
import { shapeOf, canonicalKey } from '../../chem/analyze.js';
import { nameCompound } from '../../chem/namer.js';
import { protonateAmine, deprotonateAmmonium, amineSite } from '../../chem/reactions.js';
import { randomMolecule } from '../../chem/generator.js';

const AMINE_KINDS = ['amine1', 'amine1', 'amine2', 'amine3', 'cycloAmine', 'simpleAmine'];
const CLASS = ['1° (primary)', '2° (secondary)', '3° (tertiary)', '4° (quaternary ammonium ion)'];

// How many carbons are bonded to the N (the classification), and the N's index.
function nInfo(smiles) {
  const mol = parseSmiles(smiles);
  const n = mol.atoms.find((a) => a.el === 'N');
  const carbons = neighbors(mol, n.id).filter((x) => mol.atoms[x].el === 'C').length;
  return { mol, n: n.id, carbons };
}

// A random amine, or (sometimes) a quaternary ammonium ion like tetramethylammonium.
function amineOrQuat(r) {
  if (r.chance(0.2)) {
    const g = ['C', 'CC', 'CCC'];
    const smi = `[N+](${r.pick(g)})(${r.pick(g)})(${r.pick(g)})${r.pick(g)}`;
    return { smiles: smi, name: null, quat: true };
  }
  return moleculeOf(r, AMINE_KINDS);
}

// Alkaloids from Lecture 11 (sources and uses straight from the slides).
export const ALKALOIDS = [
  { name: 'caffeine', smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', source: 'coffee, tea, soft drinks and chocolate', use: 'a mild stimulant that raises the heart rate' },
  { name: 'nicotine', smiles: 'CN1CCCC1c1cccnc1', source: 'tobacco', use: 'the addictive compound in tobacco smoke' },
  { name: 'morphine', smiles: 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O', source: 'the opium poppy', use: 'a strong pain reliever that is very addictive' },
  { name: 'codeine', smiles: 'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(C=C4)O', source: 'the opium poppy, in smaller amounts', use: 'treats less severe pain' },
  { name: 'quinine', smiles: 'COC1=CC2=C(C=CN=C2C=C1)C(C3CC4CCN3CC4C=C)O', source: 'the bark of the cinchona tree', use: 'treats malaria; tonic water\'s bitter taste' },
  { name: 'atropine', smiles: 'CN1C2CCC1CC(C2)OC(=O)C(CO)c1ccccc1', source: 'deadly nightshade (Atropa belladonna)', use: 'enlarges the pupils; toxic in high doses' },
  { name: 'coniine', smiles: 'CCCC1CCCCN1', source: 'hemlock', use: 'a poisonous amine heterocycle' },
];

// Neurotransmitters and the hormone epinephrine (Lecture 12).
export const MESSENGERS = [
  { name: 'acetylcholine', smiles: 'CC(=O)OCC[N+](C)(C)C', does: 'carries signals between neurons and muscle cells', from: null },
  { name: 'dopamine', smiles: 'NCCc1ccc(O)c(O)c1', does: 'controls movement, emotions and pleasure (low in Parkinson\'s)', from: 'tyrosine' },
  { name: 'norepinephrine', smiles: 'NCC(O)c1ccc(O)c(O)c1', does: 'too much makes a person elated, then manic', from: 'tyrosine' },
  { name: 'serotonin', smiles: 'NCCc1c[nH]c2ccc(O)cc12', does: 'mood, sleep, perception, temperature (too little: depression)', from: 'tryptophan' },
  { name: 'histamine', smiles: 'NCCc1c[nH]cn1', does: 'dilates capillaries: allergy symptoms, stomach acid', from: null },
  { name: 'epinephrine', smiles: 'CNCC(O)c1ccc(O)c(O)c1', does: 'a hormone: the "fight or flight" rush of adrenaline', from: 'norepinephrine' },
];

// What a drug or toxin does, and whether that makes it an agonist or an antagonist (Lecture 12).
export const AGENTS = [
  { who: 'Atropine', does: 'blocks the acetylcholine receptor', kind: 'antagonist' },
  { who: 'Botulinum toxin (Botox)', does: 'blocks the release of acetylcholine from its vesicles', kind: 'antagonist' },
  { who: 'Sarin and organophosphate pesticides', does: 'block the breakdown of acetylcholine, so the signal persists', kind: 'agonist' },
  { who: 'SSRIs such as fluoxetine (Prozac)', does: 'block the reuptake of serotonin, raising its concentration', kind: 'agonist' },
  { who: 'Nicotine', does: 'binds to acetylcholine receptors in place of acetylcholine', kind: 'agonist' },
  { who: 'Heroin, cocaine and alcohol', does: 'increase dopamine levels', kind: 'agonist' },
  { who: 'Antihistamines such as Benadryl', does: 'block histamine from binding the H1 receptor', kind: 'antagonist' },
  { who: 'Sertraline (Zoloft)', does: 'inhibits the reuptake of serotonin', kind: 'agonist' },
  { who: 'Fexofenadine (Allegra)', does: 'blocks the H1 histamine receptor', kind: 'antagonist' },
];

// "Which one is a … ?" questions: [target, right answers, wrong answers]
const WHICH = [
  ['an acetylcholine antagonist', ['atropine', 'botulinum toxin'], ['sarin', 'nicotine', 'fluoxetine']],
  ['an acetylcholine agonist', ['sarin', 'nicotine'], ['atropine', 'botulinum toxin', 'fexofenadine']],
  ['a serotonin agonist (SSRI)', ['fluoxetine (Prozac)', 'sertraline (Zoloft)'], ['atropine', 'diphenhydramine', 'sarin']],
  ['a histamine antagonist', ['diphenhydramine', 'chlorpheniramine', 'fexofenadine'], ['histamine', 'sarin', 'serotonin']],
];

// Compounds with (and without) the 2-phenylethylamine skeleton: a benzene ring, two carbons, then N.
export const PEA_YES = [
  ['amphetamine', 'CC(N)Cc1ccccc1'], ['methamphetamine', 'CNC(C)Cc1ccccc1'], ['dopamine', 'NCCc1ccc(O)c(O)c1'],
  ['norepinephrine', 'NCC(O)c1ccc(O)c(O)c1'], ['epinephrine', 'CNCC(O)c1ccc(O)c(O)c1'], ['pseudoephedrine', 'CNC(C)C(O)c1ccccc1'],
  ['phenylephrine', 'CNCC(O)c1cccc(O)c1'], ['albuterol', 'CC(C)(C)NCC(O)c1ccc(O)c(CO)c1'],
];
export const PEA_NO = [
  ['serotonin', 'NCCc1c[nH]c2ccc(O)cc12'], ['histamine', 'NCCc1c[nH]cn1'], ['nicotine', 'CN1CCCC1c1cccnc1'],
  ['diphenhydramine', 'CN(C)CCOC(c1ccccc1)c1ccccc1'], ['fluoxetine', 'CNCCC(Oc1ccc(cc1)C(F)(F)F)c1ccccc1'], ['caffeine', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C'],
];

// Ammonium-salt drugs from Lecture 12.
export const SALT_DRUGS = [
  { name: 'phenylephrine hydrochloride (Sudafed PE)', salt: 'C[NH2+]CC(O)c1cccc(O)c1.[Cl-]' },
  { name: 'diphenhydramine hydrochloride (Benadryl)', salt: 'C[NH+](C)CCOC(c1ccccc1)c1ccccc1.[Cl-]' },
  { name: 'benzalkonium chloride', salt: 'CCCCCCCCCCCCCCCCCC[N+](C)(C)Cc1ccccc1.[Cl-]' },
];

const NERVOUS = [
  ['The **central nervous system (CNS)** is made of…', 'the brain and spinal cord', ['the nerves in the arms and legs', 'the heart and lungs', 'the autonomic and somatic systems']],
  ['Neurons that carry signals **to** the CNS are…', 'afferent neurons', ['efferent neurons', 'somatic neurons', 'sympathetic neurons']],
  ['Neurons that carry signals **from** the CNS are…', 'efferent neurons', ['afferent neurons', 'sensory receptors', 'synapses']],
  ['The **sympathetic** nervous system controls…', '"fight or flight"', ['"rest and digest"', 'voluntary muscle movement', 'signals to the CNS']],
  ['The **parasympathetic** nervous system controls…', '"rest and digest"', ['"fight or flight"', 'signals to the CNS', 'the release of adrenaline']],
  ['The space between two neurons is called the…', 'synapse (synaptic cleft)', ['vesicle', 'receptor', 'axon']],
  ['Which neuron **releases** the neurotransmitter?', 'the presynaptic neuron', ['the postsynaptic neuron', 'the afferent neuron only', 'the muscle cell']],
  ['Which neuron has the **receptors** that bind the neurotransmitter?', 'the postsynaptic neuron', ['the presynaptic neuron', 'the vesicle', 'the synaptic cleft']],
  ['After delivering its message, a neurotransmitter is…', 'degraded, or taken back up (reuptake)', ['stored in the receptor permanently', 'turned into a hormone', 'excreted by the kidneys at once']],
];

const amineGenerators = [
  {
    id: 'l11-classify', skill: 'l11.classify', title: '1°, 2°, 3° or 4° amine?',
    make(r) {
      const m = amineOrQuat(r);
      if (!m) return null;
      const { n, carbons, mol } = nInfo(m.smiles);
      const quat = mol.atoms[n].charge === 1;
      const k = quat ? 3 : carbons - 1;
      if (k < 0 || k > 3) return null;
      return mcq('Classify this amine.', CLASS, k, {
        skill: 'l11.classify', shuffle: false,
        figure: { smiles: m.smiles, highlight: [n] },
        explain: quat
          ? `The N (highlighted) has **4 carbon groups** and a + charge, and no lone pair → a **quaternary (4°) ammonium ion**.`
          : `Count the **carbons bonded to the N** (highlighted): ${carbons} → **${CLASS[k].split(' ')[0]}**. (For amines you count groups on the N, unlike alcohols, where you count carbons on the OH carbon.)`,
      });
    },
  },
  {
    id: 'l11-vs-alcohol', skill: 'l11.classify', title: 'Amine vs alcohol classification',
    make(r) {
      const n = r.int(4, 7);
      const pos = r.int(2, Math.ceil(n / 2));
      const chain = (frag) => Array.from({ length: n }, (_, i) => (i + 1 === pos ? `C(${frag})` : 'C')).join('');
      const amine = chain('N');
      const alcohol = chain('O');
      const amineName = nameCompound(amine).name;
      const alcName = nameCompound(alcohol).name;
      const askAmine = r.chance(0.5);
      const choices = ['1° (primary)', '2° (secondary)', '3° (tertiary)'];
      return mcq(`How is **${askAmine ? amineName : alcName}** classified?`, choices, askAmine ? 0 : 1, {
        skill: 'l11.classify', shuffle: false,
        figure: { smiles: askAmine ? amine : alcohol },
        explain: `Same carbon skeleton, different rules. An **amine** is classified by the carbons on the **N**: the N here is bonded to 1 C → **1° amine** (${amineName}). An **alcohol** is classified by the carbons on the **carbon holding the OH**: that carbon is bonded to 2 C → **2° alcohol** (${alcName}).`,
      });
    },
  },
  {
    id: 'l11-shape', skill: 'l11.structure', title: 'Shape of the amine N',
    make(r) {
      const m = amineOrQuat(r);
      if (!m) return null;
      const { mol, n } = nInfo(m.smiles);
      const sh = shapeOf(mol, n);
      const opts = ['trigonal pyramidal, ~109.5°', 'tetrahedral, 109.5°', 'trigonal planar, 120°', 'bent, ~109.5°'];
      const ans = sh.name === 'trigonal pyramidal' ? 0 : sh.name === 'tetrahedral' ? 1 : -1;
      if (ans < 0) return null;
      return mcq('What is the shape around the N (highlighted)?', opts, ans, {
        skill: 'l11.structure', shuffle: false,
        figure: { smiles: m.smiles, highlight: [n] },
        explain: ans === 0
          ? 'The N has **3 bonds + 1 lone pair** = 4 electron groups → **trigonal pyramidal**, bond angles ~109.5° (the lone pair isn\'t drawn in condensed structures, but it\'s there).'
          : 'In a quaternary ammonium ion the N has **4 bonds and no lone pair** → **tetrahedral**, 109.5°.',
      });
    },
  },
  {
    id: 'l11-hbond', skill: 'l11.properties', title: 'Can amine molecules H-bond to each other?',
    make(r) {
      const m = moleculeOf(r, ['amine1', 'amine2', 'amine3', 'simpleAmine', 'cycloAmine']);
      if (!m) return null;
      const { carbons } = nInfo(m.smiles);
      const yes = carbons < 3;
      return {
        type: 'tf', skill: 'l11.properties', answer: yes,
        prompt: `True or false: molecules of **${m.name}** can hydrogen bond to each other.`,
        figure: { smiles: m.smiles, toggleH: true },
        explain: yes
          ? `**True.** It's a ${carbons === 1 ? '1°' : '2°'} amine, so it has an **N–H** bond to donate, plus the N lone pair to accept.`
          : '**False.** It\'s a **3° amine**: there\'s **no N–H** bond, so it can\'t hydrogen bond to itself (it can still accept an H-bond from water).',
      };
    },
  },
  {
    id: 'l11-bp', skill: 'l11.properties', title: 'Boiling point order with amines',
    make(r) {
      const n = r.int(3, 5);
      const alkane = 'C'.repeat(n);
      const prim = 'C'.repeat(n) + 'N';
      const tert = n === 3 ? 'CN(C)C' : n === 4 ? 'CCN(C)C' : 'CCCN(C)C';
      const alcohol = 'C'.repeat(n) + 'O';
      const items = [
        [nameCompound(alkane).name, 0], [nameCompound(tert).name, 1], [nameCompound(prim).name, 2], [nameCompound(alcohol).name, 3],
      ];
      const pickK = r.chance(0.5) ? 4 : 3;
      const chosen = r.shuffle(items).slice(0, pickK);
      const order = [...chosen].sort((a, b) => a[1] - b[1]);
      const answer = order.map((x) => chosen.indexOf(x));
      return {
        type: 'order', skill: 'l11.properties',
        prompt: `Rank by boiling point, **lowest → highest** (all have ${n} carbons).`,
        items: chosen.map((x) => x[0]), answer,
        explain: 'No polar bonds (alkane) < polar but **no N–H** (3° amine) < **N–H hydrogen bonding** (1° or 2° amine) < **O–H hydrogen bonding** (alcohol, the strongest).\n\nSo: ' + order.map((x) => x[0]).join(' < ') + '.',
      };
    },
  },
  {
    id: 'l11-salt', skill: 'l11.bases', title: 'Amine + HCl → ?',
    make(r) {
      const m = moleculeOf(r, ['amine1', 'amine1', 'amine2', 'amine3', 'simpleAmine', 'cycloAmine']);
      if (!m) return null;
      const salt = protonateAmine(m.smiles, 'Cl');
      if (!salt) return null;
      // wrong answers: Cl bonded to the N, Cl in place of the N, the wrong anion (OH⁻)
      const wrong = distinctByKey([edit(m.smiles, 'clOnN'), edit(m.smiles, 'clForN'), protonateAmine(m.smiles, 'OH')].filter(Boolean));
      const choices = distinctByKey([salt, ...wrong]);
      if (choices.length < 3 || canonicalKey(choices[0]) !== canonicalKey(salt)) return null;
      return structq(`What forms when **${m.name}** reacts with **HCl**?`, [...choices.slice(0, 3), { text: 'No reaction' }], 0, {
        skill: 'l11.bases',
        figure: { rxn: { from: m.smiles, reagent: 'HCl' } },
        explain: `Amines are **bases**: the N's lone pair accepts the H⁺ from HCl. The product is an **ammonium salt**: the N gains an H and a + charge, and Cl⁻ is the counter-ion → **${nameCompound(salt).name}**, which is **water soluble**.`,
      });
    },
  },
  {
    id: 'l11-salt-name', skill: 'l11.bases', title: 'Name the ammonium salt',
    make(r) {
      const m = moleculeOf(r, ['simpleAmine', 'simpleAmine', 'amine1']);
      if (!m) return null;
      const anion = r.weighted([['Cl', 6], ['Br', 1], ['OH', 1], ['F', 1]]);
      const salt = protonateAmine(m.smiles, anion);
      const info = salt && nameCompound(salt);
      if (!info) return null;
      return {
        type: 'name', skill: 'l11.bases',
        prompt: 'Name this ammonium salt.',
        figure: { smiles: salt },
        name: { smiles: salt, name: info.name },
        explain: `Name the groups on the N (alphabetical, with di-/tri-), then **ammonium**, then the anion → **${info.name}**.`,
        placeholder: 'e.g. propylammonium chloride',
      };
    },
  },
  {
    id: 'l11-conjugate', skill: 'l11.bases', title: 'Acid, base and their conjugates',
    make(r) {
      const m = moleculeOf(r, ['simpleAmine', 'amine1']);
      if (!m) return null;
      const salt = protonateAmine(m.smiles, 'Cl');
      if (!salt) return null;
      const cation = salt.split('.').find((p) => p.includes('+'));
      const roles = [
        ['the base', m.name, 'it accepts the H⁺ with its lone pair'],
        ['the acid', 'HCl', 'it donates the H⁺'],
        ['the conjugate acid', `the ${nameCompound(salt).name.replace(/ \w+$/, '')} ion`, 'the base after gaining H⁺'],
        ['the conjugate base', 'Cl⁻', 'the acid after losing H⁺'],
      ];
      const k = r.int(0, 3);
      const [role, answer, why] = roles[k];
      return mcq(`In this reaction, which is **${role}**?`, roles.map((x) => x[1]), k, {
        skill: 'l11.bases',
        figure: { rxn: { from: m.smiles, reagent: 'HCl', to: cation } },
        explain: `**${answer}** is ${role}: ${why}. (Base + acid ⇌ conjugate acid + conjugate base.)`,
      });
    },
  },
  {
    id: 'l11-alkaloid', skill: 'l11.alkaloids', title: 'Alkaloids',
    make(r) {
      const a = r.pick(ALKALOIDS);
      const others = r.shuffle(ALKALOIDS.filter((x) => x !== a)).slice(0, 3);
      if (r.chance(0.5)) {
        return mcq(`Which amine comes from **${a.source}**?`, [a.name, ...others.map((x) => x.name)], 0, {
          skill: 'l11.alkaloids',
          explain: `**${a.name[0].toUpperCase() + a.name.slice(1)}** comes from ${a.source}: ${a.use}.`,
        });
      }
      return mcq(`Which amine is described: **${a.use}**?`, [a.name, ...others.map((x) => x.name)], 0, {
        skill: 'l11.alkaloids', figure: { smiles: a.smiles },
        explain: `**${a.name[0].toUpperCase() + a.name.slice(1)}** (from ${a.source}): ${a.use}.`,
      });
    },
  },
  {
    id: 'l12-amine-form', skill: 'l12.salts', title: 'The amine form of an ammonium salt',
    make(r) {
      let salt, label;
      if (r.chance(0.4)) { const d = r.pick(SALT_DRUGS); salt = d.salt; label = d.name; } else {
        const m = moleculeOf(r, ['amine1', 'amine2', 'amine3', 'simpleAmine']);
        salt = m && protonateAmine(m.smiles, 'Cl');
        label = salt && nameCompound(salt) ? nameCompound(salt).name : 'this ammonium salt';
      }
      if (!salt) return null;
      const amine = deprotonateAmmonium(salt);
      const none = { text: 'None: it\'s a quaternary ammonium ion' };
      if (!amine) {
        return structq(`What is the neutral **amine form** of **${label}**?`, [none, ...['CCCCCCCCCCCCCCCCCCN(C)Cc1ccccc1', 'CCCCCCCCCCCCCCCCCCN(C)C', 'CN(C)Cc1ccccc1']], 0, {
          skill: 'l12.salts', figure: { smiles: salt },
          explain: 'The N has **four carbon groups and no N–H**. There\'s no H⁺ to give back, so a **quaternary ammonium** salt has no neutral amine form. (That\'s the point of the slide\'s question about benzalkonium chloride.)',
        });
      }
      const wrong = distinctByKey([edit(amine, 'oForN'), edit(amine, 'dropNMethyl'), edit(amine, 'addNMethyl')].filter((x) => x && canonicalKey(x) !== canonicalKey(amine)));
      const choices = distinctByKey([amine, ...wrong]);
      if (choices.length < 3) return null;
      return structq(`What is the neutral **amine form** of **${label}**?`, [...choices.slice(0, 3), none], 0, {
        skill: 'l12.salts', figure: { smiles: salt },
        explain: 'Take away the extra **H⁺ on the N** (and the Cl⁻): the N goes back to having a lone pair and no charge. Drugs are sold as ammonium salts because the salts are **water soluble** and travel through the bloodstream.',
      });
    },
  },
  {
    id: 'l12-agonist', skill: 'l12.agonists', title: 'Agonist or antagonist?',
    make(r) {
      if (r.chance(0.35)) {
        const [target, rights, wrongs] = r.pick(WHICH);
        const right = r.pick(rights);
        return mcq(`Which one acts as **${target}**?`, [right, ...r.shuffle(wrongs).slice(0, 2)], 0, {
          skill: 'l12.agonists',
          explain: `**${right[0].toUpperCase() + right.slice(1)}**. Agonists mimic or boost a neurotransmitter (or block its breakdown or reuptake); antagonists block its release or its receptor.`,
        });
      }
      const a = r.pick(AGENTS);
      return mcq(`${a.who} ${a.does}. Is that an **agonist** or an **antagonist** effect?`, ['agonist', 'antagonist'], a.kind === 'agonist' ? 0 : 1, {
        skill: 'l12.agonists', shuffle: false,
        explain: a.kind === 'agonist'
          ? `**Agonist**: it ${a.does}, which **increases or mimics** the neurotransmitter's effect. (Agonists mimic the neurotransmitter, increase how much is released, or block its breakdown or reuptake.)`
          : `**Antagonist**: it ${a.does}, which **decreases** the neurotransmitter's effect. (Antagonists prevent its release or block it from binding its receptor.)`,
      });
    },
  },
  {
    id: 'l12-messenger', skill: 'l12.neurotransmitters', title: 'Which messenger?',
    make(r) {
      const m = r.pick(MESSENGERS);
      const others = r.shuffle(MESSENGERS.filter((x) => x !== m)).slice(0, 3);
      return mcq(`Which compound: **${m.does}**?`, [m.name, ...others.map((x) => x.name)], 0, {
        skill: 'l12.neurotransmitters', figure: r.chance(0.5) ? { smiles: m.smiles } : undefined,
        explain: `**${m.name[0].toUpperCase() + m.name.slice(1)}** ${m.does}.${m.name === 'epinephrine' ? ' It\'s a **hormone** (made in the adrenal glands from norepinephrine), not a neurotransmitter.' : ''}`,
      });
    },
  },
  {
    id: 'l12-precursor', skill: 'l12.neurotransmitters', title: 'Made from which amino acid?',
    make(r) {
      const m = r.pick(MESSENGERS.filter((x) => x.from));
      const opts = ['tyrosine', 'tryptophan', 'norepinephrine', 'acetylcholine'];
      return mcq(`**${m.name[0].toUpperCase() + m.name.slice(1)}** is made from…`, opts, opts.indexOf(m.from), {
        skill: 'l12.neurotransmitters', shuffle: false, figure: { smiles: m.smiles },
        explain: 'Dopamine and norepinephrine are both made from the amino acid **tyrosine**. Serotonin is made from **tryptophan**. Epinephrine (adrenaline) is made from **norepinephrine**.',
      });
    },
  },
  {
    id: 'l12-pea', skill: 'l12.epinephrine', title: 'Spot the 2-phenylethylamine skeleton',
    make(r) {
      if (r.chance(0.5)) {
        const isYes = r.chance(0.5);
        const [name, smi] = r.pick(isYes ? PEA_YES : PEA_NO);
        return {
          type: 'tf', skill: 'l12.epinephrine', answer: isYes,
          prompt: `True or false: **${name}** contains the 2-phenylethylamine skeleton (benzene ring–C–C–N).`,
          figure: { smiles: smi },
          explain: isYes ? `**True.** ${name[0].toUpperCase() + name.slice(1)} has a benzene ring, then **two carbons**, then the N.` : `**False.** ${PEA_WHY[name][0].toUpperCase() + PEA_WHY[name].slice(1)}.`,
        };
      }
      const yes = r.pick(PEA_YES);
      const no = r.shuffle(PEA_NO).slice(0, 2);
      return structq('Which compound contains the **2-phenylethylamine** skeleton (benzene ring–C–C–N)?', [yes[1], ...no.map((x) => x[1])], 0, {
        skill: 'l12.epinephrine',
        explain: `**${yes[0]}** has a benzene ring, then **two carbons**, then the N. ${no.map((x) => x[0]).join(' and ')} don't: ${no.map((x) => PEA_WHY[x[0]]).join('; ')}.`,
      });
    },
  },
  {
    id: 'l12-nervous', skill: 'l12.nervous', title: 'The nervous system',
    make(r) {
      const [q, a, wrong] = r.pick(NERVOUS);
      return mcq(q, [a, ...wrong], 0, { skill: 'l12.nervous', explain: `**${a[0].toUpperCase() + a.slice(1)}.** ${NERVOUS_WHY}` });
    },
  },
];

// Drugs from Lecture 12 and what they are (answers kept short for the game's lane signs).
const DRUGS = [
  { name: 'albuterol (Ventolin)', smiles: 'CC(C)(C)NCC(O)c1ccc(O)c(CO)c1', is: 'a bronchodilator for asthma', skill: 'l12.epinephrine' },
  { name: 'salmeterol (Serevent)', smiles: 'OCc1cc(C(O)CNCCCCCCOCCCCc2ccccc2)ccc1O', is: 'a bronchodilator for asthma', skill: 'l12.epinephrine' },
  { name: 'amphetamine', smiles: 'CC(N)Cc1ccccc1', is: 'a CNS stimulant (used for ADHD)', skill: 'l12.epinephrine' },
  { name: 'pseudoephedrine (Sudafed)', smiles: 'CNC(C)C(O)c1ccccc1', is: 'a decongestant', skill: 'l12.epinephrine' },
  { name: 'fluoxetine (Prozac)', smiles: 'CNCCC(Oc1ccc(cc1)C(F)(F)F)c1ccccc1', is: 'an SSRI antidepressant', skill: 'l12.neurotransmitters' },
  { name: 'sertraline (Zoloft)', smiles: 'CNC1CCC(c2ccc(Cl)c(Cl)c2)c2ccccc12', is: 'an SSRI antidepressant', skill: 'l12.neurotransmitters' },
  { name: 'diphenhydramine (Benadryl)', smiles: 'CN(C)CCOC(c1ccccc1)c1ccccc1', is: 'an antihistamine that causes drowsiness', skill: 'l12.histamine' },
  { name: 'chlorpheniramine', smiles: 'CN(C)CCC(c1ccc(Cl)cc1)c1ccccn1', is: 'an antihistamine that causes drowsiness', skill: 'l12.histamine' },
  { name: 'fexofenadine (Allegra)', smiles: 'CC(C)(C(=O)O)c1ccc(cc1)C(O)CCCN1CCC(CC1)C(O)(c1ccccc1)c1ccccc1', is: 'a nonsedating antihistamine', skill: 'l12.histamine' },
  { name: 'benzalkonium chloride', smiles: 'CCCCCCCCCCCCCCCCCC[N+](C)(C)Cc1ccccc1.[Cl-]', is: 'an antiseptic (disinfectant, mouthwash)', skill: 'l12.salts' },
];

const PEA_WHY = {
  serotonin: 'serotonin\'s ring is an indole, not a plain benzene ring',
  histamine: 'histamine\'s ring is an imidazole (it has N atoms)',
  nicotine: 'nicotine has no C–C–N chain off a benzene ring',
  diphenhydramine: 'diphenhydramine has an O in the chain',
  fluoxetine: 'fluoxetine has three carbons between the ring and the N',
  caffeine: 'caffeine has no benzene ring at all',
};
const NERVOUS_WHY = 'CNS = brain and spinal cord. The peripheral system has **afferent** neurons (to the CNS) and **efferent** neurons (from the CNS). Efferent → somatic and autonomic; autonomic → **sympathetic** (fight or flight) and **parasympathetic** (rest and digest).';

// Believable wrong structures, made by editing the molecule around its amine N. null if not possible.
function edit(smiles, how) {
  let m;
  try { m = cloneMol(parseSmiles(smiles)); } catch { return null; }
  computeHydrogens(m);
  const n = amineSite(m);
  if (n == null) return null;
  const N = m.atoms[n];
  const nb = neighbors(m, n);
  if (how === 'clOnN') { if (!(N.h > 0)) return null; addAtomTo(m, 'Cl', n); }
  else if (how === 'clForN') { if (nb.length !== 1) return null; N.el = 'Cl'; }
  else if (how === 'oForN') { if (nb.length > 2) return null; N.el = 'O'; }
  else if (how === 'addNMethyl') { if (!(N.h > 0)) return null; addAtomTo(m, 'C', n); }
  else if (how === 'dropNMethyl') {
    const me = nb.find((c) => m.atoms[c].el === 'C' && m.atoms[c].bonds.length === 1);
    if (me == null || nb.length < 2) return null;
    m = removeAtoms(m, [me]);
  } else return null;
  for (const a of m.atoms) a.hExplicit = a.bracket ? a.hExplicit : null;
  computeHydrogens(m);
  try { return toSmiles(m); } catch { return null; }
}

// "What is this drug?", one generator per skill so drilling a skill only shows its own drugs.
for (const [id, skill] of [['l12-drug-ep', 'l12.epinephrine'], ['l12-drug-ssri', 'l12.neurotransmitters'], ['l12-drug-hist', 'l12.histamine'], ['l12-drug-salt', 'l12.salts']]) {
  amineGenerators.push({
    id, skill, title: 'What is this drug?',
    make(r) {
      const d = r.pick(DRUGS.filter((x) => x.skill === skill));
      const kinds = [...new Set(DRUGS.map((x) => x.is))].filter((x) => x !== d.is);
      return mcq(`**${d.name[0].toUpperCase() + d.name.slice(1)}** is…`, [d.is, ...r.shuffle(kinds).slice(0, 3)], 0, {
        skill, figure: r.chance(0.6) ? { smiles: d.smiles } : undefined,
        explain: `**${d.name[0].toUpperCase() + d.name.slice(1)}** is ${d.is}.`,
      });
    },
  });
}

// Typed common names for simple amines ("ethylmethylamine")
amineGenerators.push({
  id: 'l11-common', skill: 'l11.naming', title: 'Common names of amines',
  make(r) {
    const m = randomMolecule(r, 'simpleAmine');
    if (!m || !m.info.common.length) return null;
    const common = m.info.common.find((c) => /amine$/.test(c));
    if (!common) return null;
    return {
      ...nameTyped(m, 'l11.naming', 'Give the **common name** of this amine.'),
      name: { smiles: m.smiles, name: common, accept: [m.name, ...m.info.alternates] },
      explain: `Common names: name **each group on the N** in **alphabetical order** (use di- or tri- for identical groups), then add **-amine** → **${common}**. (IUPAC: ${m.name}.)`,
      placeholder: 'e.g. ethylmethylamine',
    };
  },
});

export { amineGenerators };
