// Lecture 2 — Functional Groups & Properties (Smith Ch. 11.5–11.7)
export default {
  id: 'l02',
  number: 2,
  title: 'Functional Groups',
  subtitle: 'Families of compounds, polarity, H-bonding & solubility',
  chapter: 'Ch. 11.5–11.7',
  tested: true,
  summary: 'Learn to spot every functional group on sight, and use polarity and hydrogen bonding to predict boiling points and water solubility.',
  skills: [
    { id: 'l02.fg-id', title: 'Identify functional groups', desc: 'Spot alkenes, alcohols, ethers, amines, carbonyl groups and more.' },
    { id: 'l02.carbonyl', title: 'Carbonyl families', desc: 'Aldehyde vs ketone vs acid vs ester vs amide.' },
    { id: 'l02.polarity', title: 'Polar bonds & molecules', desc: 'Electronegativity, dipoles, and when they cancel.' },
    { id: 'l02.imf', title: 'H-bonding & boiling points', desc: 'Which molecules hydrogen bond; ranking boiling points.' },
    { id: 'l02.solubility', title: 'Water solubility', desc: '"Like dissolves like" — small + O/N = soluble.' },
    { id: 'l02.vitamins', title: 'Vitamins', desc: 'Fat-soluble (A, D, E, K) vs water-soluble (B, C).' },
  ],
  sections: [
    {
      id: 'fg-intro',
      title: 'What is a functional group?',
      minutes: 3,
      blocks: [
        { t: 'p', text: 'A **functional group** is an atom or group of atoms with characteristic chemical and physical properties. It contains a **heteroatom**, a **multiple bond**, or both. The functional group is the "business end" of a molecule — it decides how the molecule behaves.' },
        { t: 'p', text: 'Chemists use **R** as shorthand for "the rest of the molecule" — the carbon and hydrogen part. So R–OH means "any alcohol".' },
        { t: 'callout', kind: 'life', title: 'Why this matters', text: 'Lectures 4–10 are each about one family of functional groups. Recognizing them instantly is the single most useful skill in this course.' },
      ],
    },
    {
      id: 'hydrocarbons',
      title: 'A. Hydrocarbons',
      minutes: 4,
      blocks: [
        { t: 'p', text: '**Hydrocarbons** contain only carbon and hydrogen.' },
        {
          t: 'table', head: ['Family', 'Functional group', 'Bond angle', 'Example'],
          rows: [
            ['**Alkane**', 'none (only C–C single bonds)', '109.5°', 'ethane $CH_3CH_3$'],
            ['**Alkene**', 'C=C double bond', '120°', 'ethylene $CH_2=CH_2$'],
            ['**Alkyne**', 'C≡C triple bond', '180°', 'acetylene $HC≡CH$'],
            ['**Aromatic**', 'benzene ring (6-membered ring, 3 double bonds)', '120°', 'benzene $C_6H_6$'],
          ],
        },
        {
          t: 'mols', items: [
            { smiles: 'CC', caption: 'alkane' }, { smiles: 'C=C', caption: 'alkene' }, { smiles: 'C#C', caption: 'alkyne' }, { smiles: 'c1ccccc1', caption: 'aromatic (benzene)' },
          ],
        },
      ],
    },
    {
      id: 'single',
      title: 'B. Single bonds to a heteroatom',
      minutes: 5,
      blocks: [
        {
          t: 'table', head: ['Family', 'General structure', 'Group name', 'Example'],
          rows: [
            ['**Alkyl halide**', 'R–X (X = F, Cl, Br, I)', 'halo group', '$CH_3Br$'],
            ['**Alcohol**', 'R–OH', 'hydroxyl group', '$CH_3OH$'],
            ['**Ether**', 'R–O–R', 'alkoxy group', '$CH_3OCH_3$'],
            ['**Amine**', 'R–NH₂, R₂NH or R₃N', 'amino group', '$CH_3NH_2$'],
            ['**Thiol**', 'R–SH', 'sulfhydryl group', '$CH_3SH$'],
          ],
        },
        {
          t: 'mols', items: [
            { smiles: 'CBr', caption: 'alkyl halide' }, { smiles: 'CCO', caption: 'alcohol' }, { smiles: 'CCOCC', caption: 'ether' }, { smiles: 'CCN', caption: 'amine' }, { smiles: 'CCS', caption: 'thiol' },
          ],
        },
        { t: 'callout', kind: 'warn', title: 'Alcohol or ether?', text: 'Look at the oxygen. **O–H** → alcohol. **O between two carbons** (no H) → ether.' },
        {
          t: 'check', q: {
            id: 'l02-c-thc', skill: 'l02.fg-id', type: 'multi', prompt: 'THC (from marijuana) contains an ether. Which **other** functional groups are present?',
            figure: { smiles: 'CCCCCc1cc(O)c2c(c1)OC(C)(C)C1CCC(C)=CC21' },
            choices: ['Alcohol/phenol –OH', 'Alkene', 'Aromatic ring', 'Aldehyde', 'Amine', 'Carboxylic acid'], answer: [0, 1, 2], shuffle: false,
            explain: 'THC has an **–OH on the benzene ring** (a phenol, a type of hydroxyl group), a **C=C in the upper ring**, and an **aromatic ring** — plus the ether O.',
          },
        },
      ],
    },
    {
      id: 'carbonyl',
      title: 'C. Compounds with a C=O (carbonyl) group',
      minutes: 7,
      blocks: [
        { t: 'p', text: 'A **carbonyl group** is a carbon–oxygen double bond, C=O. Five families contain it — tell them apart by **what else is attached to the carbonyl carbon**.' },
        {
          t: 'table', head: ['Family', 'Attached to the C=O carbon', 'Condensed', 'Example'],
          rows: [
            ['**Aldehyde**', 'at least one **H**', 'RCHO', 'acetaldehyde $CH_3CHO$'],
            ['**Ketone**', '**two carbons**', 'RCOR', 'acetone $CH_3COCH_3$'],
            ['**Carboxylic acid**', 'an **OH**', 'RCOOH', 'acetic acid $CH_3COOH$'],
            ['**Ester**', 'an **OR**', 'RCOOR', 'methyl acetate $CH_3COOCH_3$'],
            ['**Amide**', 'a **N**', 'RCONH₂', 'acetamide $CH_3CONH_2$'],
          ],
        },
        {
          t: 'mols', items: [
            { smiles: 'CC=O', caption: 'aldehyde' }, { smiles: 'CC(C)=O', caption: 'ketone' }, { smiles: 'CC(=O)O', caption: 'carboxylic acid' }, { smiles: 'CC(=O)OC', caption: 'ester' }, { smiles: 'CC(N)=O', caption: 'amide' },
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Acid vs alcohol', text: 'A carboxylic acid has an OH **on the carbonyl carbon** (C(=O)–OH). An OH on any other carbon is an **alcohol**.' },
        { t: 'callout', kind: 'life', title: 'In real life', text: 'Benzaldehyde smells like cherries and almonds, isoamyl acetate (an ester) like banana, ethyl butanoate like pineapple, and citric acid makes citrus sour.' },
        { t: 'h', text: 'Practice from class' },
        {
          t: 'mols', items: [
            { smiles: 'NC(Cc1ccc(O)cc1)C(=O)O', caption: 'tyrosine: amine, phenol –OH, aromatic ring, carboxylic acid' },
            { smiles: 'CC(=O)OCCC(C)C', caption: 'isoamyl acetate (banana): ester' },
            { smiles: 'O=CCCCC=O', caption: 'glutaraldehyde: two aldehydes' },
            { smiles: 'OCC(O)C(O)C(O)C(O)C=O', caption: 'glucose: five alcohols + an aldehyde' },
          ],
        },
      ],
    },
    {
      id: 'polarity',
      title: 'Polarity',
      minutes: 7,
      blocks: [
        { t: 'p', text: '**Electronegativity** is an atom\'s pull on the electrons in a bond. When two atoms with different electronegativities bond, the electrons are shared unevenly.' },
        { t: 'callout', kind: 'key', title: 'Electronegativity ranking you need', text: '**F, O, Cl, N > C ≈ H**' },
        { t: 'list', items: ['**Nonpolar bonds:** C–C and C–H (C and H have about the same electronegativity).', '**Polar bonds:** C–O, C–N, C–X (halogen), O–H, N–H. The more electronegative atom gets a partial negative charge (δ−); the other gets δ+.'] },
        { t: 'h', text: 'Polar molecules' },
        { t: 'list', items: ['**Hydrocarbons** have only nonpolar bonds → **nonpolar molecules**.', 'A molecule with **one polar bond** is polar (it has a net dipole), e.g. $CH_3Cl$.', 'With several polar bonds, look at the **shape**: if the dipoles **cancel**, the molecule is **nonpolar** ($CO_2$, $CCl_4$); if they don\'t, it\'s **polar** ($H_2O$, $CH_2Cl_2$).'] },
        {
          t: 'example', title: 'Sample Problem 11.10', prompt: 'Explain why $CH_2Cl_2$ is a polar molecule.',
          mol: { smiles: 'ClCCl', mode: 'full' },
          steps: ['Each C–Cl bond is polar (Cl is more electronegative).', 'C is tetrahedral, and the two C–Cl bonds point in similar directions.', 'The two C–H bonds are nonpolar, so nothing balances the C–Cl dipoles.'],
          answer: 'The dipoles **do not cancel** → $CH_2Cl_2$ has a net dipole → **polar**.',
        },
      ],
    },
    {
      id: 'imf',
      title: 'Intermolecular forces & boiling points',
      minutes: 7,
      blocks: [
        { t: 'p', text: 'Polar bonds make molecules stick to each other ("opposites attract"). **Stronger intermolecular forces → higher melting and boiling points.**' },
        {
          t: 'table', head: ['Force', 'Who has it', 'Strength'],
          rows: [
            ['London dispersion', 'all molecules (only force in nonpolar ones)', 'weakest'],
            ['Dipole–dipole', 'polar molecules', 'medium'],
            ['**Hydrogen bonding**', 'molecules with **H bonded to O, N or F**', 'strongest'],
          ],
        },
        { t: 'callout', kind: 'key', title: 'Hydrogen bond', text: 'A **hydrogen bond** forms when an H **covalently bonded to O, N or F** is attracted to a lone pair on an O, N or F of **another** molecule. Alcohols (R–O–H) hydrogen bond with each other; aldehydes, ketones and ethers (no O–H) **cannot** H-bond with each other.' },
        { t: 'p', text: 'Nonpolar organic compounds have weak forces, so they have **low boiling points** and are often liquids or gases at room temperature.' },
        {
          t: 'check', q: {
            id: 'l02-c-hb', skill: 'l02.imf', type: 'mc', prompt: 'Which compound can form hydrogen bonds with itself?',
            choices: ['$CH_3CH_2OH$', '$CH_3OCH_3$', '$CH_3CHO$', '$CH_3CH_2CH_3$'], answer: 0,
            explain: 'Only ethanol has an **H on an O**. Dimethyl ether and acetaldehyde have O atoms but no O–H.',
          },
        },
      ],
    },
    {
      id: 'solubility',
      title: 'Solubility: like dissolves like',
      minutes: 6,
      blocks: [
        { t: 'callout', kind: 'key', title: 'The rule', text: '"**Like dissolves like.**" Most organic compounds dissolve in organic solvents. **Hydrocarbons and other nonpolar compounds are insoluble in water.** Polar organic compounds are water soluble only if they are **small** and contain an **N or O** that can hydrogen bond with water.' },
        {
          t: 'compare', items: [
            { title: 'Hexane $CH_3(CH_2)_4CH_3$', text: 'Nonpolar, no O or N → **insoluble** in water.' },
            { title: 'Ethanol $CH_3CH_2OH$', text: 'Small, has an O–H that H-bonds with water → **soluble**.' },
            { title: 'Cholesterol', text: 'Has one O–H, but ~27 carbons of nonpolar C–C/C–H → **insoluble**.' },
          ],
        },
        { t: 'mol', smiles: 'CC(C)CCCC(C)C1CCC2C1(C)CCC1C2CC=C2CC(O)CCC12C', caption: 'cholesterol: one OH can\'t make this huge nonpolar molecule dissolve' },
      ],
    },
    {
      id: 'vitamins',
      title: 'Focus on health: vitamins',
      minutes: 5,
      blocks: [
        { t: 'p', text: '**Vitamins** are organic compounds needed in small amounts for normal cell function. The body cannot make them, so they must come from the diet.' },
        {
          t: 'compare', items: [
            { title: 'Fat-soluble: A, D, E, K', text: 'Many nonpolar C–C and C–H bonds, few polar groups. Dissolve in fat, insoluble in water (stored in the body).' },
            { title: 'Water-soluble: B vitamins and C', text: 'Many polar bonds (lots of O–H, N–H). Dissolve in water (excess is excreted).' },
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Fat-soluble vitamins are **A, D, E, K** — "**ADEK**" sounds like "a deck" of fat cards.' },
        { t: 'list', items: ['**Vitamin A (retinol)**: vision receptors in the eye; healthy skin and mucous membranes. A large, mostly nonpolar molecule with only **one OH** → fat soluble.', '**Vitamin C (ascorbic acid)**: needed to form collagen (connective tissue). Deficiency causes **scurvy** (sailors in the 1600s without fresh fruit). Many polar bonds and O atoms → water soluble.'] },
        {
          t: 'mols', items: [
            { smiles: 'CC1=C(/C=C/C(C)=C/C=C/C(C)=C/CO)C(C)(C)CCC1', caption: 'vitamin A (retinol) — fat soluble' },
            { smiles: 'OCC(O)C1OC(=O)C(O)=C1O', caption: 'vitamin C (ascorbic acid) — water soluble' },
          ],
        },
      ],
    },
  ],
  questions: [
    { id: 'l02-q01', skill: 'l02.fg-id', type: 'mc', prompt: 'What does the symbol **R** stand for in a general formula like R–OH?', choices: ['the carbon and hydrogen part of the molecule', 'a radical', 'a ring', 'any heteroatom'], answer: 0, explain: 'R = the rest of the molecule — the C and H portion.' },
    { id: 'l02-q02', skill: 'l02.fg-id', type: 'mc', prompt: 'Which family has an oxygen bonded to **two carbons** and no H on the oxygen?', choices: ['ether', 'alcohol', 'ketone', 'aldehyde'], answer: 0, explain: 'R–O–R is an **ether**.' },
    { id: 'l02-q03', skill: 'l02.fg-id', type: 'mc', prompt: 'A six-membered ring with three alternating double bonds is called…', choices: ['an aromatic (benzene) ring', 'a cycloalkene', 'a cycloalkane', 'a diene'], answer: 0, explain: 'That is **benzene** — the aromatic ring.' },
    { id: 'l02-q04', skill: 'l02.carbonyl', type: 'mc', prompt: 'A C=O group with an **–OR** group on the same carbon is a(n)…', choices: ['ester', 'ether', 'ketone', 'carboxylic acid'], answer: 0, explain: 'RCOOR is an **ester** (e.g. banana-flavored isoamyl acetate).' },
    { id: 'l02-q05', skill: 'l02.carbonyl', type: 'mc', prompt: 'Which condensed formula is a **ketone**?', choices: ['$CH_3COCH_2CH_3$', '$CH_3CH_2CHO$', '$CH_3CH_2COOH$', '$CH_3COOCH_3$'], answer: 0, explain: '$CH_3COCH_2CH_3$ has the C=O between two carbons → ketone (2-butanone). CHO = aldehyde, COOH = acid, COOCH₃ = ester.' },
    { id: 'l02-q06', skill: 'l02.carbonyl', type: 'tf', prompt: 'True or false: an aldehyde\'s C=O can be in the middle of a carbon chain.', answer: false, explain: '**False.** An aldehyde carbonyl carbon must carry an H, so it is always at the **end** of a chain (–CHO). A C=O in the middle is a ketone.' },
    { id: 'l02-q07', skill: 'l02.polarity', type: 'multi', prompt: 'Select all the **polar** bonds.', choices: ['C–O', 'C–H', 'O–H', 'C–C', 'C–Cl', 'N–H'], answer: [0, 2, 4, 5], shuffle: false, explain: 'Bonds between atoms with different electronegativity are polar: **C–O, O–H, C–Cl, N–H**. C–C and C–H are nonpolar.' },
    { id: 'l02-q08', skill: 'l02.polarity', type: 'mc', prompt: 'Why is carbon tetrachloride ($CCl_4$) nonpolar even though C–Cl bonds are polar?', choices: ['The four dipoles point to the corners of a tetrahedron and cancel', 'Cl and C have the same electronegativity', 'It has no lone pairs', 'Carbon cannot be polar'], answer: 0, explain: 'Symmetric tetrahedral shape → the four equal dipoles **cancel**.' },
    { id: 'l02-q09', skill: 'l02.imf', type: 'mc', prompt: 'Which has the **highest** boiling point? (All have similar size.)', choices: ['$CH_3CH_2CH_2OH$', '$CH_3CH_2CH_2CH_3$', '$CH_3OCH_2CH_3$', '$CH_3CH_2CHO$'], answer: 0, explain: 'The alcohol can **hydrogen bond** with itself (O–H), the strongest intermolecular force → highest bp.' },
    { id: 'l02-q10', skill: 'l02.imf', type: 'tf', prompt: 'True or false: stronger intermolecular forces mean a higher boiling point.', answer: true, explain: '**True.** More energy is needed to pull the molecules apart.' },
    { id: 'l02-q11', skill: 'l02.solubility', type: 'mc', prompt: 'Why is cholesterol **insoluble** in water even though it has an OH group?', choices: ['Too many nonpolar C–C and C–H bonds for one OH', 'It has no oxygen', 'It is an ionic compound', 'It is too small'], answer: 0, explain: 'One polar OH can\'t outweigh ~27 carbons of nonpolar hydrocarbon.' },
    { id: 'l02-q12', skill: 'l02.solubility', type: 'mc', prompt: 'Which compound is most soluble in water?', choices: ['$CH_3OH$', '$CH_3CH_2CH_2CH_2CH_2CH_3$', '$CH_3CH_2Cl$', '$CH_3(CH_2)_8OH$'], answer: 0, explain: 'Methanol is **small** and has an O–H to H-bond with water.' },
    { id: 'l02-q13', skill: 'l02.vitamins', type: 'multi', prompt: 'Select all the **fat-soluble** vitamins.', choices: ['A', 'B₁', 'C', 'D', 'E', 'K'], answer: [0, 3, 4, 5], shuffle: false, explain: 'Fat-soluble: **A, D, E, K** ("ADEK"). B vitamins and C are water-soluble.' },
    { id: 'l02-q14', skill: 'l02.vitamins', type: 'mc', prompt: 'A deficiency of vitamin C causes…', choices: ['scurvy', 'night blindness', 'rickets', 'anemia'], answer: 0, explain: 'Vitamin C is needed for collagen; without it you get **scurvy** — historically a disease of sailors.' },
    { id: 'l02-q15', skill: 'l02.vitamins', type: 'mc', prompt: 'Why is vitamin A fat-soluble?', choices: ['It is large and mostly nonpolar with only one OH', 'It has many OH groups', 'It is ionic', 'It contains nitrogen'], answer: 0, explain: 'Vitamin A (retinol) is a big hydrocarbon with just **one OH**, so it dissolves in fat, not water.' },
    { id: 'l02-q16', skill: 'l02.fg-id', type: 'match', prompt: 'Match each group to its family.', left: ['–OH on an sp³ carbon', '–SH', 'C=O with H on the carbonyl carbon', 'C≡C'], right: ['alcohol', 'thiol', 'aldehyde', 'alkyne'], answer: [0, 1, 2, 3], explain: '–OH → alcohol · –SH → thiol · –CHO → aldehyde · C≡C → alkyne.' },
  ],
  cards: [
    { id: 'l02-k01', front: 'Functional group', back: 'An atom or group of atoms with characteristic properties; contains a heteroatom and/or a multiple bond.' },
    { id: 'l02-k02', front: 'Name this functional group', mol: 'CC(=O)O', back: '**Carboxylic acid** (–COOH): OH on the carbonyl carbon.' },
    { id: 'l02-k03', front: 'Name this functional group', mol: 'CC(=O)OC', back: '**Ester** (–COOR): OR on the carbonyl carbon.' },
    { id: 'l02-k04', front: 'Name this functional group', mol: 'CC(N)=O', back: '**Amide**: N on the carbonyl carbon.' },
    { id: 'l02-k05', front: 'Name this functional group', mol: 'CC=O', back: '**Aldehyde** (–CHO): H on the carbonyl carbon; always at a chain end.' },
    { id: 'l02-k06', front: 'Name this functional group', mol: 'CC(C)=O', back: '**Ketone**: C=O between two carbons.' },
    { id: 'l02-k07', front: 'Name this functional group', mol: 'COC', back: '**Ether**: O bonded to two carbons.' },
    { id: 'l02-k08', front: 'Name this functional group', mol: 'CCN', back: '**Amine**: N bonded to carbon.' },
    { id: 'l02-k09', front: 'Name this functional group', mol: 'CCS', back: '**Thiol**: –SH (sulfhydryl group).' },
    { id: 'l02-k10', front: 'Electronegativity order to know', back: '**F, O, Cl, N > C ≈ H**. C–C and C–H bonds are nonpolar.' },
    { id: 'l02-k11', front: 'Hydrogen bonding requirement', back: 'An **H bonded to O, N or F** attracted to a lone pair on O, N or F of another molecule.' },
    { id: 'l02-k12', front: 'When is a molecule with polar bonds still nonpolar?', back: 'When the bond dipoles **cancel** by symmetry (CO₂, CCl₄).' },
    { id: 'l02-k13', front: 'Water-solubility rule for organic compounds', back: 'Soluble only if **small** and has an **O or N** to hydrogen bond with water. Hydrocarbons are insoluble.' },
    { id: 'l02-k14', front: 'Fat-soluble vitamins', back: '**A, D, E, K** — mostly nonpolar.' },
    { id: 'l02-k15', front: 'Water-soluble vitamins', back: '**B vitamins and C** — many polar bonds.' },
    { id: 'l02-k16', front: 'Vitamin C deficiency', back: '**Scurvy**; vitamin C is needed to make collagen.' },
  ],
  keyTerms: [
    { term: 'functional group', def: 'An atom or group of atoms with characteristic chemical and physical properties.' },
    { term: 'carbonyl group', def: 'A carbon–oxygen double bond, C=O.' },
    { term: 'electronegativity', def: 'An atom\'s attraction for the electrons in a bond.' },
    { term: 'polar bond', def: 'A covalent bond between atoms of different electronegativity; electrons are shared unevenly.' },
    { term: 'hydrogen bond', def: 'Attraction between an H bonded to O/N/F and a lone pair on another O/N/F.' },
    { term: 'fat-soluble vitamin', def: 'A vitamin that dissolves in fats but not water (A, D, E, K).' },
  ],
};
