// Reaction map data: every reaction in the course, grouped by starting family.
// `practice` links to a generator id (see js/quiz/generators.js).
export const FAMILIES = [
  { id: 'alkene', label: 'Alkene', smiles: 'CC=CC', lecture: 'l04' },
  { id: 'alkane', label: 'Alkane', smiles: 'CCCC', lecture: 'l03' },
  { id: 'dihalide', label: 'Dihalide', smiles: 'CC(Br)C(Br)C', lecture: 'l04' },
  { id: 'halide', label: 'Alkyl halide', smiles: 'CCC(Br)C', lecture: 'l06' },
  { id: 'alcohol1', label: '1° alcohol', smiles: 'CCCO', lecture: 'l05' },
  { id: 'alcohol2', label: '2° alcohol', smiles: 'CC(O)C', lecture: 'l05' },
  { id: 'alcohol3', label: '3° alcohol', smiles: 'CC(C)(C)O', lecture: 'l05' },
  { id: 'aldehyde', label: 'Aldehyde', smiles: 'CCC=O', lecture: 'l08' },
  { id: 'ketone', label: 'Ketone', smiles: 'CC(C)=O', lecture: 'l08' },
  { id: 'acid', label: 'Carboxylic acid', smiles: 'CCC(=O)O', lecture: 'l10' },
  { id: 'salt', label: 'Carboxylate salt', smiles: 'CCC(=O)[O-].[Na+]', lecture: 'l10' },
  { id: 'thiol', label: 'Thiol', smiles: 'CCS', lecture: 'l06' },
  { id: 'disulfide', label: 'Disulfide', smiles: 'CCSSCC', lecture: 'l06' },
];

export const REACTIONS = [
  { id: 'hydrogenation', name: 'Hydrogenation', from: 'alkene', to: 'alkane', reagent: 'H₂, Pd', lecture: 'l04', practice: 'l04-hydrogenation', example: ['CC=CC', 'CCCC'], rule: 'Adds H to each carbon of the C=C. Pd is a catalyst. Used to make margarine from oils.' },
  { id: 'halogenation', name: 'Halogenation', from: 'alkene', to: 'dihalide', reagent: 'X₂ (Cl₂ or Br₂)', lecture: 'l04', practice: 'l04-halogenation', example: ['CC=CC', 'CC(Br)C(Br)C'], rule: 'Adds one X to each carbon of the C=C. No catalyst needed.' },
  { id: 'hydrohalogenation', name: 'Hydrohalogenation', from: 'alkene', to: 'halide', reagent: 'HX (HCl or HBr)', lecture: 'l04', practice: 'l04-hydrohalogenation', example: ['C=CCC', 'CC(Br)CC'], rule: 'Markovnikov: H goes to the C=C carbon with more H\'s; X goes to the more substituted carbon.' },
  { id: 'hydration', name: 'Hydration', from: 'alkene', to: 'alcohol2', reagent: 'H₂O, H₂SO₄', lecture: 'l04', practice: 'l04-hydration', example: ['C=CC', 'CC(O)C'], rule: 'Adds H and OH (Markovnikov). Needs a strong acid.' },
  { id: 'dehydration', name: 'Dehydration', from: 'alcohol2', to: 'alkene', reagent: 'H₂SO₄', lecture: 'l05', practice: 'l05-dehydration', example: ['CC(O)CC', 'CC=CC'], rule: 'Removes OH and a neighbouring H (loses H₂O). Zaitsev: the major alkene has more carbon groups on the C=C.' },
  { id: 'ox1', name: 'Oxidation of 1° alcohol', from: 'alcohol1', to: 'aldehyde', reagent: '[O] (K₂Cr₂O₇)', lecture: 'l05', practice: 'l05-oxidation', example: ['CCCO', 'CCC=O'], rule: 'A 1° alcohol first becomes an aldehyde…' },
  { id: 'oxald', name: 'Oxidation of aldehyde', from: 'aldehyde', to: 'acid', reagent: '[O]', lecture: 'l08', practice: 'l08-oxidation', example: ['CCC=O', 'CCC(=O)O'], rule: '…and the aldehyde is oxidized further to a carboxylic acid (C–H → C–OH).' },
  { id: 'ox2', name: 'Oxidation of 2° alcohol', from: 'alcohol2', to: 'ketone', reagent: '[O]', lecture: 'l05', practice: 'l05-oxidation', example: ['CC(O)C', 'CC(C)=O'], rule: 'A 2° alcohol becomes a ketone, and stops there (ketones don\'t oxidize).' },
  { id: 'ox3', name: '3° alcohol + [O]', from: 'alcohol3', to: null, reagent: '[O]', lecture: 'l05', practice: 'l05-oxidation', example: ['CC(C)(C)O', null], rule: 'No reaction: the OH carbon has no H.' },
  { id: 'red-ald', name: 'Reduction of aldehyde', from: 'aldehyde', to: 'alcohol1', reagent: 'H₂, Pd (NADH in the body)', lecture: 'l08', practice: 'l08-reduction', example: ['CCC=O', 'CCCO'], rule: 'Aldehyde → 1° alcohol (the reverse of oxidation).' },
  { id: 'red-ket', name: 'Reduction of ketone', from: 'ketone', to: 'alcohol2', reagent: 'H₂, Pd (NADH in the body)', lecture: 'l08', practice: 'l08-reduction', example: ['CC(C)=O', 'CC(C)O'], rule: 'Ketone → 2° alcohol.' },
  { id: 'neutralize', name: 'Acid + base', from: 'acid', to: 'salt', reagent: 'NaOH', lecture: 'l10', practice: 'l10-neutralize', example: ['CCC(=O)O', 'CCC(=O)[O-].[Na+]'], rule: 'RCOOH + NaOH → RCOO⁻Na⁺ + H₂O. The salt is water soluble.' },
  { id: 'thiol-ox', name: 'Thiol oxidation', from: 'thiol', to: 'disulfide', reagent: '[O]', lecture: 'l06', practice: 'l06-disulfide', example: ['CCS', 'CCSSCC'], rule: '2 R–SH → R–S–S–R. Reduction [H] turns it back.' },
];
