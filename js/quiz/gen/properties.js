// Functional groups and physical properties (polarity, H-bonding, solubility, boiling points).
import { functionalGroupTypes, hasHBondDonor, molecularFormula } from '../../chem/analyze.js';
import { condensedFormula } from '../../chem/condensed.js';
import { mcq, moleculeOf } from './common.js';

export const FG_OPTIONS = [
  ['alkene', 'Alkene (C=C)'], ['alkyne', 'Alkyne (C≡C)'], ['aromatic', 'Aromatic ring'], ['hydroxyl', 'Hydroxyl –OH (alcohol/phenol)'],
  ['ether', 'Ether (C–O–C)'], ['amine', 'Amine'], ['thiol', 'Thiol (–SH)'], ['halide', 'Alkyl halide (C–X)'],
  ['aldehyde', 'Aldehyde'], ['ketone', 'Ketone'], ['acid', 'Carboxylic acid'], ['ester', 'Ester'], ['amide', 'Amide'],
];
const FG_LABEL = Object.fromEntries(FG_OPTIONS);

export function fgKeys(smiles) {
  return [...new Set(functionalGroupTypes(smiles).map((t) => (t === 'alcohol' || t === 'phenol' ? 'hydroxyl' : t)))]
    .filter((t) => FG_LABEL[t]);
}

// Real molecules from the lectures (and a few everyday ones)
export const FG_MOLECULES = [
  ['NC(Cc1ccc(O)cc1)C(=O)O', 'tyrosine (an amino acid)'],
  ['CC(=O)OCCC(C)C', 'isoamyl acetate (banana flavor)'],
  ['O=CCCCC=O', 'glutaraldehyde (disinfectant)'],
  ['OCC(O)C(O)C(O)C(O)C=O', 'glucose (open-chain form)'],
  ['COc1cc(C=O)ccc1O', 'vanillin (vanilla)'],
  ['O=C/C=C/c1ccccc1', 'cinnamaldehyde (cinnamon)'],
  ['CC(=O)Oc1ccccc1C(=O)O', 'aspirin'],
  ['CC(C)Cc1ccc(cc1)C(C)C(=O)O', 'ibuprofen'],
  ['CC(=O)Nc1ccc(O)cc1', 'acetaminophen (Tylenol)'],
  ['CCCC(=O)OCC', 'ethyl butanoate (pineapple)'],
  ['OC(=O)CC(O)(CC(=O)O)C(=O)O', 'citric acid (citrus)'],
  ['CC(C)=CCCC(C)CC=O', 'citronellal (citronella candles)'],
  ['CC(C)=CCC/C(C)=C/C=O', 'citral (lemongrass)'],
  ['COC(=O)c1ccccc1O', 'methyl salicylate (wintergreen)'],
  ['NCCc1ccc(O)c(O)c1', 'dopamine'],
  ['CC(C)C1CCC(C)CC1O', 'menthol (mint)'],
  ['CC1=CCC(CC1=O)C(C)=C', 'carvone (spearmint)'],
  ['COC(C)(C)C', 'MTBE (gasoline additive)'],
  ['COc1cc(CNC(=O)CCCC/C=C/C(C)C)ccc1O', 'capsaicin (chili peppers)'],
  ['CC(N)C(=O)O', 'alanine'],
  ['C#CCO', 'propargyl alcohol'],
  ['CC(Cl)CCS', '3-chloro-1-butanethiol'],
  ['CC(C)CC(=O)N', '3-methylbutanamide'],
];

// Similar-size sets with measured boiling points (°C)
const BP_SETS = [
  { why: 'similar size (MW 44–46)', items: [['propane', 'CCC', -42], ['dimethyl ether', 'COC', -24], ['ethanol', 'CCO', 78]] },
  { why: 'similar size (MW 58–74)', items: [['butane', 'CCCC', -0.5], ['propanal', 'CCC=O', 48], ['1-propanol', 'CCCO', 97], ['propanoic acid', 'CCC(=O)O', 141]] },
  { why: 'from the lecture slides', items: [['pentane', 'CCCCC', 36], ['butanal', 'CCCC=O', 76], ['2-butanone', 'CCC(C)=O', 80], ['1-butanol', 'CCCCO', 118]] },
  { why: 'similar size (MW 86–88)', items: [['hexane', 'CCCCCC', 69], ['pentanal', 'CCCCC=O', 103], ['1-pentanol', 'CCCCCO', 138], ['butanoic acid', 'CCCC(=O)O', 164]] },
  { why: 'bigger alkyl group → higher bp', items: [['chloromethane', 'CCl', -24], ['chloroethane', 'CCCl', 12], ['1-chloropropane', 'CCCCl', 47]] },
  { why: 'bigger halogen → higher bp', items: [['fluoroethane', 'CCF', -38], ['chloroethane', 'CCCl', 12], ['bromoethane', 'CCBr', 38], ['iodoethane', 'CCI', 72]] },
  { why: 'straight-chain alkanes', items: [['methane', 'C', -162], ['ethane', 'CC', -89], ['propane', 'CCC', -42], ['butane', 'CCCC', -0.5]] },
  { why: 'thiol vs alcohol', items: [['ethanethiol', 'CCS', 35], ['ethanol', 'CCO', 78]] },
  { why: 'ether vs alcohol (same formula C4H10O)', items: [['diethyl ether', 'CCOCC', 35], ['1-butanol', 'CCCCO', 118]] },
  { why: 'alcohol vs carboxylic acid (MW 60)', items: [['1-propanol', 'CCCO', 97], ['acetic acid', 'CC(=O)O', 118]] },
  { why: 'alkane vs alkyl halide vs alcohol', items: [['propane', 'CCC', -42], ['chloroethane', 'CCCl', 12], ['ethanol', 'CCO', 78]] },
];

const SOLUBLE = [
  ['CO', 'methanol', true, 'small, with an O–H that hydrogen bonds to water'],
  ['CCO', 'ethanol', true, 'small alcohol — the O–H hydrogen bonds with water'],
  ['CCCO', '1-propanol', true, 'small alcohol (3 C) with an O–H'],
  ['CC(C)=O', 'acetone', true, 'small; water can hydrogen bond to the C=O oxygen'],
  ['CC(=O)O', 'acetic acid', true, 'small carboxylic acid — hydrogen bonds with water'],
  ['COC', 'dimethyl ether', true, 'small ether (≤5 C); water H-bonds to the ether O'],
  ['CCOCC', 'diethyl ether', true, 'ether with 4 C (≤5 C) — water H-bonds to its O'],
  ['OCCO', 'ethylene glycol', true, 'two O–H groups on only 2 C'],
  ['OCC(O)CO', 'glycerol', true, 'three O–H groups on 3 C'],
  ['CCC=O', 'propanal', true, 'aldehyde with ≤6 C'],
  ['CCC(C)=O', '2-butanone', true, 'ketone with ≤6 C'],
  ['OCC(O)C(O)C(O)C(O)C=O', 'glucose', true, 'lots of O–H groups for its size'],
  ['CCCCCC', 'hexane', false, 'hydrocarbon — only nonpolar C–C and C–H bonds'],
  ['CCCCCCCC', 'octane', false, 'hydrocarbon — nonpolar'],
  ['C1CCCCC1', 'cyclohexane', false, 'hydrocarbon — nonpolar'],
  ['CCCCCCCCO', '1-octanol', false, 'the long nonpolar chain (8 C) outweighs one O–H'],
  ['CCCCCl', '1-chlorobutane', false, 'alkyl halides are insoluble in water'],
  ['CCCl', 'chloroethane', false, 'alkyl halides are insoluble in water (no H-bonding with water)'],
  ['CCCCCCCC(=O)O', 'octanoic acid', false, 'the 8-carbon chain is too nonpolar'],
  ['CCCCCCCCCC=O', 'decanal', false, 'aldehydes with 7+ C are insoluble'],
  ['CCCOCCC', 'dipropyl ether', false, 'ethers with 6+ C are insoluble'],
  ['CCCCCCC(C)=O', '2-octanone', false, 'ketones with 7+ C are insoluble'],
  ['C=CCCCC', '1-hexene', false, 'alkenes are nonpolar hydrocarbons'],
];

const POLAR = [
  ['C', 'methane ($CH_4$)', false, 'only C–H bonds, which are nonpolar'],
  ['O=C=O', 'carbon dioxide ($CO_2$)', false, 'two polar C=O bonds, but the molecule is linear so the dipoles cancel'],
  ['ClC(Cl)(Cl)Cl', 'carbon tetrachloride ($CCl_4$)', false, 'four polar C–Cl bonds arranged tetrahedrally — the dipoles cancel'],
  ['ClCCl', 'dichloromethane ($CH_2Cl_2$)', true, 'two C–Cl dipoles and two C–H bonds — the dipoles do not cancel'],
  ['CCl', 'chloromethane ($CH_3Cl$)', true, 'one polar C–Cl bond gives a net dipole'],
  ['O', 'water ($H_2O$)', true, 'bent shape — the O–H dipoles do not cancel'],
  ['N', 'ammonia ($NH_3$)', true, 'trigonal pyramidal — N–H dipoles do not cancel'],
  ['CCO', 'ethanol', true, 'polar C–O and O–H bonds with a bent O'],
  ['CCCCCC', 'hexane', false, 'hydrocarbon: only nonpolar C–C and C–H bonds'],
  ['C=C', 'ethylene', false, 'hydrocarbon — nonpolar bonds only'],
  ['CC(C)=O', 'acetone', true, 'polar C=O bond gives a net dipole'],
  ['COC', 'dimethyl ether', true, 'two polar C–O bonds on a bent O — net dipole'],
];

export const propertyGenerators = [
  {
    id: 'l02-fg-multi', skill: 'l02.fg-id', title: 'Spot the functional groups',
    make(r) {
      const [smi, label] = r.pick(FG_MOLECULES);
      const keys = fgKeys(smi);
      const others = r.shuffle(FG_OPTIONS.map((o) => o[0]).filter((k) => !keys.includes(k)));
      const optionKeys = r.shuffle([...keys, ...others.slice(0, Math.max(2, 6 - keys.length))]);
      return {
        type: 'multi', skill: 'l02.fg-id', shuffle: false,
        prompt: `Select **all** functional groups present in *${label}*.`,
        figure: { smiles: smi },
        choices: optionKeys.map((k) => FG_LABEL[k]),
        answer: optionKeys.map((k, i) => (keys.includes(k) ? i : -1)).filter((i) => i >= 0),
        explain: `Present: **${keys.map((k) => FG_LABEL[k]).join(', ')}**. Tip: look at every heteroatom (O, N, S, halogen) and every multiple bond, then ask what's attached to it.`,
      };
    },
  },
  {
    id: 'l02-fg-single', skill: 'l02.fg-id', title: 'Name the family',
    make(r) {
      const pool = [
        ['alcohol', 'Alcohol'], ['ether', 'Ether'], ['aldehyde', 'Aldehyde'], ['ketone', 'Ketone'], ['acid', 'Carboxylic acid'],
        ['haloalkane', 'Alkyl halide'], ['thiol', 'Thiol'], ['alkene', 'Alkene'], ['alkyne', 'Alkyne'],
      ];
      const extra = [['CC(=O)OCC', 'Ester'], ['CCC(=O)OC', 'Ester'], ['CC(N)=O', 'Amide'], ['CCC(=O)NC', 'Amide'], ['CCN', 'Amine'], ['CCCNC', 'Amine']];
      let smi, answer;
      if (r.chance(0.3)) [smi, answer] = r.pick(extra);
      else {
        const [kind, lab] = r.pick(pool);
        const m = moleculeOf(r, [kind]);
        smi = m.smiles; answer = lab;
      }
      const all = ['Alcohol', 'Ether', 'Aldehyde', 'Ketone', 'Carboxylic acid', 'Ester', 'Amide', 'Amine', 'Alkyl halide', 'Thiol', 'Alkene', 'Alkyne'];
      const wrong = r.shuffle(all.filter((a) => a !== answer)).slice(0, 3);
      return mcq('Which family does this compound belong to?', [answer, ...wrong], 0, {
        skill: 'l02.fg-id',
        figure: { smiles: smi },
        explain: `It's an **${answer.toLowerCase()}**. ${FAMILY_TIPS[answer] || ''}`,
      });
    },
  },
  {
    id: 'l02-carbonyl', skill: 'l02.carbonyl', title: 'Which carbonyl compound?',
    make(r) {
      const pool = [
        ['CCC=O', 'Aldehyde'], ['CC=O', 'Aldehyde'], ['CCCCC=O', 'Aldehyde'], ['CC(C)=O', 'Ketone'], ['CCC(=O)CC', 'Ketone'], ['O=C1CCCCC1', 'Ketone'],
        ['CCC(=O)O', 'Carboxylic acid'], ['CC(=O)O', 'Carboxylic acid'], ['CC(=O)OC', 'Ester'], ['CCC(=O)OCC', 'Ester'],
        ['CC(N)=O', 'Amide'], ['CCC(=O)NC', 'Amide'], ['CCCC(=O)OC', 'Ester'], ['CCCC(=O)O', 'Carboxylic acid'],
      ];
      const [smi, ans] = r.pick(pool);
      const choices = ['Aldehyde', 'Ketone', 'Carboxylic acid', 'Ester', 'Amide'];
      return mcq('What type of carbonyl compound is this?', choices, choices.indexOf(ans), {
        skill: 'l02.carbonyl', shuffle: false,
        figure: { smiles: smi },
        explain: `Look at what's attached to the C=O carbon: **H** → aldehyde · **two C** → ketone · **OH** → carboxylic acid · **OR** → ester · **N** → amide. This one is a **${ans.toLowerCase()}**.`,
      });
    },
  },
  {
    id: 'l02-hbond', skill: 'l02.imf', title: 'Hydrogen bonding',
    make(r) {
      const m = moleculeOf(r, ['alcohol', 'ether', 'ketone', 'aldehyde', 'acid', 'haloalkane', 'alkane', 'thiol', 'simpleEther']);
      const yes = hasHBondDonor(m.smiles);
      return {
        type: 'tf', skill: 'l02.imf', answer: yes,
        prompt: 'True or false: molecules of this compound can **hydrogen bond to each other**.',
        figure: { smiles: m.smiles, toggleH: true },
        explain: yes
          ? '**True** — it has an H bonded directly to O (or N), and O/N lone pairs to accept it.'
          : "**False** — there's no H on O, N or F. (Ethers, aldehydes and ketones can *accept* an H-bond from water, but can't H-bond to each other. S–H is not polar enough.)",
      };
    },
  },
  {
    id: 'l02-solubility', skill: 'l02.solubility', title: 'Water soluble?',
    make(r) {
      const [smi, label, yes, why] = r.pick(SOLUBLE);
      return {
        type: 'tf', skill: 'l02.solubility', answer: yes,
        prompt: `True or false: *${label}* is **soluble in water**.`,
        figure: { smiles: smi },
        explain: `**${yes ? 'True' : 'False'}** — ${why}. Rule: "like dissolves like" — organic compounds dissolve in water only if they are **small** and have an **O or N** that can hydrogen bond with water.`,
      };
    },
  },
  {
    id: 'l02-polar', skill: 'l02.polarity', title: 'Polar or nonpolar?',
    make(r) {
      const [smi, label, polar, why] = r.pick(POLAR);
      return mcq(`Is ${label} a **polar** or **nonpolar** molecule?`, ['Polar', 'Nonpolar'], polar ? 0 : 1, {
        skill: 'l02.polarity', shuffle: false,
        figure: { smiles: smi, mode: 'full' },
        explain: `**${polar ? 'Polar' : 'Nonpolar'}** — ${why}.`,
      });
    },
  },
  {
    id: 'bp-order', skill: 'l02.imf', title: 'Rank boiling points',
    skills: ['l02.imf', 'l05.properties', 'l06.properties', 'l08.properties', 'l10.properties'],
    make(r) {
      const set = r.pick(BP_SETS);
      const items = r.shuffle(set.items);
      const order = [...items.keys()].sort((a, b) => items[a][2] - items[b][2]);
      return {
        type: 'order', skill: 'l02.imf',
        prompt: 'Put these in order from **lowest to highest boiling point**.',
        items: items.map(([n, s]) => `${n} ($${condensedFormula(s) || molecularFormula(s)}$)`),
        answer: order,
        explain: `Actual boiling points: ${[...items].sort((a, b) => a[2] - b[2]).map(([n, , bp]) => `${n} ${bp} °C`).join(' < ')}. (${set.why}.) Stronger intermolecular forces → higher bp: nonpolar (London only) < polar (dipole–dipole) < hydrogen bonding; carboxylic acids are highest.`,
      };
    },
  },
];

const FAMILY_TIPS = {
  Alcohol: 'An –OH on an sp³ carbon.',
  Ether: 'An O bonded to two carbons (C–O–C).',
  Aldehyde: 'A C=O with at least one H on the carbonyl carbon (–CHO), always at a chain end.',
  Ketone: 'A C=O bonded to two carbons.',
  'Carboxylic acid': 'A C=O with an –OH on the same carbon (–COOH).',
  Ester: 'A C=O with an –OR on the same carbon (–COOR).',
  Amide: 'A C=O with a nitrogen on the same carbon.',
  Amine: 'A nitrogen bonded to carbon (no C=O next to it).',
  'Alkyl halide': 'A halogen (F, Cl, Br, I) on a carbon.',
  Thiol: 'An –SH group.',
  Alkene: 'A C=C double bond.',
  Alkyne: 'A C≡C triple bond.',
};

export const BOILING_POINT_SETS = BP_SETS;
export const SOLUBILITY_LIST = SOLUBLE;
