// Reaction map data: every reaction in the course.
// Each reaction: how to recognize it, how to draw the product, the classic trap, and where it shows up
// in the body or in health care. `practice` is a generator id (js/quiz/gen/), `skill` the drill to open,
// `section` the lecture section with the full notes. Examples are checked against the reaction engine
// in tests/content.test.js.
export const FAMILIES = [
  { id: 'alkane', label: 'Alkane', smiles: 'CCCC', lecture: 'l03' },
  { id: 'alkene', label: 'Alkene', smiles: 'CC=CC', lecture: 'l04' },
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

// Reaction types, with the one-line idea behind each.
export const TYPES = {
  addition: { label: 'Addition', text: 'Atoms **add to the two carbons of a C=C**. The double bond becomes a single bond.' },
  elimination: { label: 'Elimination', text: 'Atoms are **removed from two neighboring carbons**, making a C=C.' },
  oxidation: { label: 'Oxidation', text: '**More C–O bonds or fewer C–H bonds** (for sulfur: S–H → S–S). Shown as **[O]**.' },
  reduction: { label: 'Reduction', text: '**Fewer C–O bonds or more C–H bonds**: the reverse of oxidation. Shown as **[H]** or **H₂, Pd** on a C=O.' },
  acidbase: { label: 'Acid–base', text: 'An acid **gives its H⁺** to a base.' },
};

export const REACTIONS = [
  {
    id: 'hydrogenation', name: 'Hydrogenation', type: 'addition', from: 'alkene', to: 'alkane', reagent: 'H₂, Pd',
    lecture: 'l04', section: 'addition', skill: 'l04.addition', practice: 'l04-hydrogenation', example: ['CC=CC', 'CCCC'],
    rule: 'Adds an **H to each carbon** of the C=C. Pd is a catalyst.',
    steps: ['Find the C=C.', 'Put one **H** on each of its two carbons.', 'Make it a **single** bond. Everything else stays the same.'],
    trap: 'The carbon skeleton never changes: same number of carbons, same branches.',
    body: 'Partially hydrogenating vegetable oil made margarine and shortening, and created **trans fats** that raise LDL ("bad") cholesterol. The FDA has since banned partially hydrogenated oils from US foods.',
  },
  {
    id: 'halogenation', name: 'Halogenation', type: 'addition', from: 'alkene', to: 'dihalide', reagent: 'X₂ (Cl₂ or Br₂)',
    lecture: 'l04', section: 'addition', skill: 'l04.addition', practice: 'l04-halogenation', example: ['CC=CC', 'CC(Br)C(Br)C'],
    rule: 'Adds **one X to each carbon** of the C=C. No catalyst needed.',
    steps: ['Find the C=C.', 'Put one **X** (Cl or Br) on **each** of its two carbons.', 'Make it a single bond.'],
    trap: 'The two halogens go on **neighboring** carbons (a 1,2-dihalide), never both on the same carbon.',
    body: 'Red-brown Br₂ loses its color as it adds to a C=C, a quick lab test for unsaturation (C=C bonds) in fats and oils.',
  },
  {
    id: 'hydrohalogenation', name: 'Hydrohalogenation', type: 'addition', from: 'alkene', to: 'halide', reagent: 'HX (HCl or HBr)',
    lecture: 'l04', section: 'addition', skill: 'l04.markovnikov', practice: 'l04-hydrohalogenation', example: ['C=CCC', 'CC(Br)CC'],
    rule: '**Markovnikov:** the H goes to the C=C carbon that already has **more H\'s**, and the X to the other carbon.',
    steps: ['Find the C=C and count the H\'s on each of its carbons.', 'Put the **H** on the carbon with **more H\'s**.', 'Put the **X** on the other carbon. Make it a single bond.'],
    trap: 'If both C=C carbons have the same number of H\'s (like 2-butene), there\'s only one product, so Markovnikov doesn\'t matter.',
  },
  {
    id: 'hydration', name: 'Hydration', type: 'addition', from: 'alkene', to: 'alcohol2', reagent: 'H₂O, H₂SO₄',
    lecture: 'l04', section: 'addition', skill: 'l04.markovnikov', practice: 'l04-hydration', example: ['C=CC', 'CC(O)C'],
    rule: 'Adds **H and OH** (Markovnikov, like HX). $H_2SO_4$ is only a catalyst.',
    steps: ['Find the C=C and count the H\'s on each of its carbons.', 'Put the **H** on the carbon with **more H\'s**.', 'Put the **OH** on the other carbon. Make it a single bond.'],
    trap: 'Water **and** acid = hydration (adds water to an alkene). Acid **alone** on an alcohol = dehydration. Check the starting material!',
    body: 'Your cells do it too: in the citric acid cycle, the enzyme **fumarase** adds water across a C=C (fumarate → malate).',
  },
  {
    id: 'dehydration', name: 'Dehydration', type: 'elimination', from: 'alcohol2', to: 'alkene', reagent: 'H₂SO₄',
    lecture: 'l05', section: 'dehydration', skill: 'l05.dehydration', practice: 'l05-dehydration', example: ['CC(O)CC', 'CC=CC'],
    rule: 'Removes the **OH and an H from a neighboring carbon** (loses $H_2O$). **Zaitsev:** the major alkene has **more carbon groups** on the C=C.',
    steps: ['Find the carbon with the OH.', 'Remove the **OH** and an **H** from a carbon **next to it**.', 'Draw a **C=C** between those two carbons.', 'More than one choice? The **major** product has more carbons attached to the C=C.'],
    trap: 'The new C=C always involves the carbon that **had** the OH. It can\'t appear anywhere else in the chain.',
    body: 'The reverse of hydration. The citric acid cycle uses it too: **aconitase** removes water from citrate to make a C=C.',
  },
  {
    id: 'ox1', name: 'Oxidation of a 1° alcohol', type: 'oxidation', from: 'alcohol1', to: 'aldehyde', reagent: '[O] (K₂Cr₂O₇)',
    lecture: 'l05', section: 'oxidation', skill: 'l05.oxidation', practice: 'l05-oxidation', example: ['CCCO', 'CCC=O'],
    rule: 'A 1° alcohol first becomes an **aldehyde**. With more [O], the aldehyde keeps going to a carboxylic acid.',
    steps: ['Check the OH carbon has at least one **H** (1° alcohols have two).', 'Turn **C–OH into C=O** at the end of the chain (an aldehyde).', 'Asked for the final product? Oxidize again to **–COOH**.'],
    trap: 'Read whether the question wants the **first** product (aldehyde) or the **final** one (carboxylic acid).',
    body: 'The liver\'s **alcohol dehydrogenase** oxidizes ethanol to acetaldehyde, and methanol to toxic formaldehyde. The antidote **fomepizole** blocks this enzyme.',
  },
  {
    id: 'oxald', name: 'Oxidation of an aldehyde', type: 'oxidation', from: 'aldehyde', to: 'acid', reagent: '[O]',
    lecture: 'l08', section: 'oxidation', skill: 'l08.reactions', practice: 'l08-oxidation', example: ['CCC=O', 'CCC(=O)O'],
    rule: 'The **H on the C=O carbon becomes OH**: aldehyde → carboxylic acid.',
    steps: ['Find the –CHO at the end of the chain.', 'Replace its **H** with **OH**: –CHO becomes **–COOH**.'],
    trap: 'Ketones can\'t do this: there\'s **no H** on a ketone\'s C=O carbon.',
    body: '**Aldehyde dehydrogenase** turns acetaldehyde into acetic acid. **Disulfiram** (Antabuse) blocks it, so acetaldehyde builds up and causes flushing and vomiting.',
  },
  {
    id: 'ox2', name: 'Oxidation of a 2° alcohol', type: 'oxidation', from: 'alcohol2', to: 'ketone', reagent: '[O]',
    lecture: 'l05', section: 'oxidation', skill: 'l05.oxidation', practice: 'l05-oxidation', example: ['CC(O)C', 'CC(C)=O'],
    rule: 'A 2° alcohol becomes a **ketone**, and stops there.',
    steps: ['Find the OH carbon (it has one H).', 'Turn **C–OH into C=O** in the same position. Nothing else changes.'],
    trap: 'It stops at the ketone. Ketones don\'t oxidize further.',
    body: 'Rubbing alcohol (2-propanol) is oxidized in the body to **acetone**, so poisoned patients have ketones without severe acidosis.',
  },
  {
    id: 'ox3', name: '3° alcohol + [O]', type: 'oxidation', from: 'alcohol3', to: null, reagent: '[O]',
    lecture: 'l05', section: 'oxidation', skill: 'l05.oxidation', practice: 'l05-oxidation', example: ['CC(C)(C)O', null],
    rule: '**No reaction:** the OH carbon has **no H** to lose.',
    steps: ['Find the OH carbon.', 'Count its H\'s. None → **no reaction**.'],
    trap: 'Count H\'s on the **carbon**, not the H of the OH group.',
  },
  {
    id: 'ket-ox', name: 'Ketone + [O]', type: 'oxidation', from: 'ketone', to: null, reagent: '[O]',
    lecture: 'l08', section: 'oxidation', skill: 'l08.reactions', practice: 'l08-oxidation', example: ['CC(C)=O', null],
    rule: '**No reaction:** a ketone has no H on its C=O carbon.',
    steps: ['Is the C=O carbon bonded to **two carbons**? Then it\'s a ketone → **no reaction**.'],
    trap: 'Aldehyde vs ketone is the whole question: check for the **H** on the C=O carbon.',
    body: 'Acetone isn\'t oxidized further like this. In DKA much of it is **breathed out**, giving the breath a fruity smell.',
  },
  {
    id: 'red-ald', name: 'Reduction of an aldehyde', type: 'reduction', from: 'aldehyde', to: 'alcohol1', reagent: 'H₂, Pd (NADH in the body)',
    lecture: 'l08', section: 'reduction', skill: 'l08.reactions', practice: 'l08-reduction', example: ['CCC=O', 'CCCO'],
    rule: 'H₂ adds across the C=O: aldehyde → **1° alcohol** (the reverse of oxidation).',
    steps: ['Find the C=O.', 'Add an **H to the C** and an **H to the O**: C=O becomes **CH–OH**.'],
    trap: '**H₂, Pd** on a C=O is a **reduction** (gives an alcohol). On a C=C it\'s hydrogenation (gives an alkane).',
  },
  {
    id: 'red-ket', name: 'Reduction of a ketone', type: 'reduction', from: 'ketone', to: 'alcohol2', reagent: 'H₂, Pd (NADH in the body)',
    lecture: 'l08', section: 'reduction', skill: 'l08.reactions', practice: 'l08-reduction', example: ['CC(C)=O', 'CC(C)O'],
    rule: 'Ketone → **2° alcohol**.',
    steps: ['Find the C=O (inside the chain).', 'Add an **H to the C** and an **H to the O**: C=O becomes **CH–OH**.'],
    trap: 'Aldehydes give **1°** alcohols, ketones give **2°** alcohols. The OH stays where the C=O was.',
    body: 'When muscles are short of oxygen, NADH reduces the ketone group of **pyruvate** to **lactate**. High lactate is a warning sign in shock and sepsis.',
  },
  {
    id: 'neutralize', name: 'Acid + base', type: 'acidbase', from: 'acid', to: 'salt', reagent: 'NaOH',
    lecture: 'l10', section: 'acidity', skill: 'l10.salts', practice: 'l10-neutralize', example: ['CCC(=O)O', 'CCC(=O)[O-].[Na+]'],
    rule: '**RCOOH + NaOH → RCOO⁻ Na⁺ + H₂O**. The salt is **water soluble**.',
    steps: ['Remove the **H** from –COOH.', 'Write **–COO⁻ Na⁺**, plus $H_2O$.', 'Name it: metal first, then **-ic acid → -ate** (sodium propanoate).'],
    trap: 'Only the **acidic H on the O** reacts. The C–H\'s stay.',
    body: 'Drugs are often made into sodium salts so they dissolve, for example **naproxen sodium** (Aleve).',
  },
  {
    id: 'thiol-ox', name: 'Thiol oxidation', type: 'oxidation', from: 'thiol', to: 'disulfide', reagent: '[O]',
    lecture: 'l06', section: 'thiols', skill: 'l06.thiols', practice: 'l06-disulfide', example: ['CCS', 'CCSSCC'],
    rule: '**2 R–SH → R–S–S–R**: each S loses its H, and the two S atoms join.',
    steps: ['Draw **two** copies of the thiol.', 'Remove the **H from each S**.', 'Join the two S atoms: **R–S–S–R**.'],
    trap: 'The product has **twice the carbons**, because two molecules join.',
    body: '**Disulfide bonds** hold proteins in shape. Insulin\'s two chains are linked by them.',
  },
  {
    id: 'disulfide-red', name: 'Disulfide reduction', type: 'reduction', from: 'disulfide', to: 'thiol', reagent: '[H]',
    lecture: 'l06', section: 'thiols', skill: 'l06.thiols', practice: 'l06-disulfide', example: ['CCSSCC', 'CCS'],
    rule: '**R–S–S–R → 2 R–SH**: the reverse of thiol oxidation.',
    steps: ['Break the **S–S** bond.', 'Add an **H to each S**. You get **two** thiols.'],
    trap: 'You get two molecules back, each with half the carbons.',
    body: 'A perm uses a reducing agent to break hair\'s disulfide bonds, reshapes the hair, then re-forms them with an oxidizer.',
  },
];

// "See this reagent? Think this reaction." For the reagent decoder table.
export const REAGENTS = [
  { reagent: 'H₂, Pd', on: 'alkene', does: 'hydrogenation', gives: 'alkane', ids: ['hydrogenation'] },
  { reagent: 'H₂, Pd (or NADH)', on: 'aldehyde / ketone', does: 'reduction', gives: '1° / 2° alcohol', ids: ['red-ald', 'red-ket'] },
  { reagent: 'X₂ (Cl₂, Br₂)', on: 'alkene', does: 'halogenation', gives: '1,2-dihalide', ids: ['halogenation'] },
  { reagent: 'HX (HCl, HBr)', on: 'alkene', does: 'hydrohalogenation', gives: 'alkyl halide (Markovnikov)', ids: ['hydrohalogenation'] },
  { reagent: 'H₂O + H₂SO₄', on: 'alkene', does: 'hydration', gives: 'alcohol (Markovnikov)', ids: ['hydration'] },
  { reagent: 'H₂SO₄ alone', on: 'alcohol', does: 'dehydration', gives: 'alkene (Zaitsev)', ids: ['dehydration'] },
  { reagent: '[O] (K₂Cr₂O₇)', on: '1° / 2° / 3° alcohol', does: 'oxidation', gives: 'aldehyde (then acid) / ketone / no reaction', ids: ['ox1', 'ox2', 'ox3'] },
  { reagent: '[O]', on: 'aldehyde / ketone', does: 'oxidation', gives: 'carboxylic acid / no reaction', ids: ['oxald', 'ket-ox'] },
  { reagent: '[O] / [H]', on: 'thiol / disulfide', does: 'oxidation / reduction', gives: 'disulfide / 2 thiols', ids: ['thiol-ox', 'disulfide-red'] },
  { reagent: 'NaOH', on: 'carboxylic acid', does: 'acid–base', gives: 'carboxylate salt + H₂O', ids: ['neutralize'] },
];
