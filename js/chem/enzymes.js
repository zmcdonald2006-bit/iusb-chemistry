// The six enzyme classes (Lecture 19) and the slides' example reaction for each, as SMILES.
// `clue` is what a question may show over the arrow (the coenzyme, water or ATP: never the enzyme's
// name, which would give the class away); `enzyme` is shown in the notes.

export const ENZYME_CLASSES = ['oxidoreductase', 'transferase', 'hydrolase', 'isomerase', 'lyase', 'ligase'];

export const CLASS_KEYS = {
  oxidoreductase: { does: 'catalyzes oxidation–reduction reactions', key: 'NAD⁺ is converted to NADH, or the reverse' },
  transferase: { does: 'transfers a group from one molecule to another', key: 'a group moves from one molecule to another' },
  hydrolase: { does: 'breaks bonds using water (hydrolysis)', key: 'water is used to break a bond' },
  isomerase: { does: 'converts one isomer into another', key: 'the reactant and product are isomers' },
  lyase: { does: 'adds to a double bond, or eliminates to make one', key: 'a single bond becomes a double bond, or the reverse' },
  ligase: { does: 'joins two molecules, using energy from ATP', key: 'two molecules join and ATP → ADP + phosphate' },
};

export const ENZYME_REACTIONS = [
  { id: 'ldh', cls: 'oxidoreductase', enzyme: 'lactate dehydrogenase', from: 'CC(O)C(=O)[O-]', to: 'CC(=O)C(=O)[O-]', clue: 'NAD⁺ → NADH', what: 'lactate → pyruvate', why: '**NAD⁺ is converted to NADH**: lactate is oxidized. A redox reaction → **oxidoreductase**.' },
  { id: 'ldh-back', cls: 'oxidoreductase', enzyme: 'lactate dehydrogenase', from: 'CC(=O)C(=O)[O-]', to: 'CC(O)C(=O)[O-]', clue: 'NADH → NAD⁺', what: 'pyruvate → lactate', why: '**NADH is converted to NAD⁺**: pyruvate is reduced. A redox reaction → **oxidoreductase**.' },
  { id: 'idh', cls: 'oxidoreductase', enzyme: 'isocitrate dehydrogenase', from: '[O-]C(=O)CC(C(O)C(=O)[O-])C(=O)[O-]', to: ['[O-]C(=O)CCC(=O)C(=O)[O-]', 'O=C=O'], clue: 'NAD⁺ → NADH', what: 'isocitrate → α-ketoglutarate + CO₂', why: '**NAD⁺ is converted to NADH** → **oxidoreductase**.' },
  { id: 'transaminase', cls: 'transferase', enzyme: 'alanine transaminase', from: '[NH3+]C(C)C(=O)[O-].[O-]C(=O)CCC(=O)C(=O)[O-]', to: ['CC(=O)C(=O)[O-]', '[NH3+]C(CCC(=O)[O-])C(=O)[O-]'], clue: '', what: 'alanine + α-ketoglutarate → pyruvate + glutamate', why: 'The **NH₃⁺ group moves** from alanine to α-ketoglutarate: a group transferred between molecules → **transferase**.' },
  { id: 'lipase', cls: 'hydrolase', enzyme: 'lipase', from: 'CCCC(=O)OCC(COC(=O)CCC)OC(=O)CCC', to: ['OCC(O)CO', 'CCCC(=O)O'], clue: '3 H₂O', what: 'a triacylglycerol → glycerol + 3 fatty acids', why: '**Water breaks** the three ester bonds → **hydrolase**.' },
  { id: 'maltase', cls: 'hydrolase', enzyme: 'maltase', from: 'OCC1OC(OC2C(CO)OC(O)C(O)C2O)C(O)C(O)C1O', to: 'OCC1OC(O)C(O)C(O)C1O', clue: 'H₂O', what: 'maltose → 2 glucose', why: '**Water breaks** the glycosidic linkage, splitting one molecule into two → **hydrolase**.' },
  { id: 'peptidase', cls: 'hydrolase', enzyme: 'a peptidase', from: '[NH3+]C(C)C(=O)NC(CO)C(=O)[O-]', to: ['[NH3+]C(C)C(=O)[O-]', '[NH3+]C(CO)C(=O)[O-]'], clue: 'H₂O', what: 'Ala–Ser → alanine + serine', why: '**Water breaks** the peptide bond → **hydrolase** (like pepsin).' },
  { id: 'tpi', cls: 'isomerase', enzyme: 'triose phosphate isomerase', from: 'OCC(=O)COP(=O)([O-])[O-]', to: 'O=CC(O)COP(=O)([O-])[O-]', clue: '', what: 'dihydroxyacetone phosphate → glyceraldehyde 3-phosphate', why: 'Same formula, different structure: the reactant and product are **isomers** → **isomerase**.' },
  { id: 'cis-trans', cls: 'isomerase', enzyme: 'maleate isomerase', from: '[O-]C(=O)/C=C\\C(=O)[O-]', to: '[O-]C(=O)/C=C/C(=O)[O-]', clue: '', what: 'maleate (cis) → fumarate (trans)', why: 'Cis turns into trans: same atoms, so the two are **isomers** → **isomerase**.' },
  { id: 'fumarase', cls: 'lyase', enzyme: 'fumarase', from: '[O-]C(=O)/C=C/C(=O)[O-]', to: '[O-]C(=O)CC(O)C(=O)[O-]', clue: '+ H₂O', what: 'fumarate + H₂O → malate', why: 'Water **adds across the C=C**: a double bond becomes a single bond, and one product forms → **lyase** (not a hydrolase, which would split a molecule in two).' },
  { id: 'hal', cls: 'lyase', enzyme: 'histidine ammonia-lyase', from: '[NH3+]C(Cc1c[nH]cn1)C(=O)[O-]', to: ['[O-]C(=O)/C=C/c1c[nH]cn1', '[NH4+]'], clue: '', what: 'histidine → urocanate + NH₄⁺', why: 'NH₄⁺ is eliminated and a **single bond becomes a double bond** → **lyase**.' },
  { id: 'carboxylase', cls: 'ligase', enzyme: 'pyruvate carboxylase', from: 'CC(=O)C(=O)[O-]', to: '[O-]C(=O)CC(=O)C(=O)[O-]', clue: '+ CO₂, ATP → ADP + HPO₄²⁻', what: 'pyruvate + CO₂ → oxaloacetate', why: 'Two molecules join **and ATP is used** → **ligase**.' },
  { id: 'gss', cls: 'ligase', enzyme: 'glutathione synthetase', from: '[NH3+]C(CCC(=O)NC(CS)C(=O)[O-])C(=O)[O-].[NH3+]CC(=O)[O-]', to: '[NH3+]C(CCC(=O)NC(CS)C(=O)NCC(=O)[O-])C(=O)[O-]', clue: 'ATP → ADP + H₂PO₄⁻', what: 'two molecules joined into glutathione', why: 'Two molecules are combined **and ATP is broken down** into ADP + phosphate → **ligase**.' },
];

export const enzymeReaction = (id) => ENZYME_REACTIONS.find((r) => r.id === id);
// For a question: only the clue over the arrow. For the notes: the clue and the enzyme's name.
export const quizRxn = (r) => ({ from: r.from, reagent: r.clue, to: r.to });
export const noteRxn = (r) => ({ from: r.from, reagent: [r.clue, r.enzyme].filter(Boolean).join(', '), to: r.to });
