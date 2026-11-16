// Lecture 18 — Proteins (Smith Ch. 21.6–21.8)
import { aminoAcid, aaSmiles, aaSideAtoms } from '../../js/chem/aminoacids.js';

const aa = (three, caption) => { const a = aminoAcid(three); return { smiles: aaSmiles(a), highlight: aaSideAtoms(a), caption, scale: 28 }; };

export default {
  id: 'l18',
  number: 18,
  title: 'Proteins',
  subtitle: 'Protein structure, common proteins, hydrolysis & denaturation',
  chapter: 'Ch. 21.6–21.8',
  tested: false,
  summary: 'How a chain of amino acids becomes a working protein. Learn the four levels of structure (primary, secondary, tertiary, quaternary), the forces that hold a protein in shape, how to predict what a side chain does, fibrous vs globular proteins (keratin, collagen, hemoglobin, myoglobin), carbon monoxide and sickle cell anemia, and what hydrolysis and denaturation do to a protein.',
  skills: [
    { id: 'l18.levels', title: 'Primary & secondary structure', desc: 'The amino acid sequence; the α-helix and β-pleated sheet and the H-bonds behind them.' },
    { id: 'l18.tertiary', title: 'Tertiary structure', desc: 'H-bonds, London dispersion, electrostatic attraction and disulfide bonds; predict a side chain\'s role.' },
    { id: 'l18.quaternary', title: 'Quaternary structure', desc: 'Subunits, myoglobin vs hemoglobin, insulin, and all four levels together.' },
    { id: 'l18.common', title: 'Fibrous & globular proteins', desc: 'What proteins do; α-keratin, collagen and vitamin C.' },
    { id: 'l18.hemoglobin', title: 'Hemoglobin & myoglobin', desc: 'Heme and Fe²⁺, carbon monoxide poisoning, sickle cell anemia.' },
    { id: 'l18.hydrolysis', title: 'Protein hydrolysis', desc: 'Breaking peptide bonds with water; pepsin, trypsin and chymotrypsin; drawing the products.' },
    { id: 'l18.denature', title: 'Denaturation', desc: 'Changing a protein\'s shape without breaking its peptide bonds.' },
  ],
  sections: [
    {
      id: 'primary',
      title: 'Proteins & primary structure',
      minutes: 4,
      blocks: [
        { t: 'list', items: ['**Proteins** are biomolecules that contain many **amino acids** connected in a chain, joined by **amide (peptide) bonds**.', 'Amino acids are the **building blocks** of proteins.', 'An **amide bond** connects a **carbonyl** to a **nitrogen**.', 'Proteins have **3D structures that determine their function**.'] },
        { t: 'callout', kind: 'tip', title: 'Picking up from Lecture 17', text: 'Same chain, now bigger. Lecture 17 built dipeptides one bond at a time; a protein is the same backbone with more than 40 amino acids, folded into a shape.' },
        { t: 'h', text: 'A. Primary structure' },
        { t: 'list', items: ['The **primary structure** of a protein is the **sequence of amino acids** joined together by **peptide bonds**.', 'The primary structure **does not** provide information about the **3D structure** of the protein.'] },
        { t: 'peptides', items: [{ seq: ['Phe', 'Leu', 'Ser', 'Cys'], caption: 'A stretch of primary structure: **Phe–Leu–Ser–Cys**, read from the N-terminal end' }] },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: '**P**rimary = the **p**lain list of amino acids, like letters spelling a word. The next three levels are about how that word folds up.' },
        {
          t: 'check', q: {
            id: 'l18-c-primary', skill: 'l18.levels', type: 'mc', prompt: 'The primary structure of a protein is…',
            choices: ['its sequence of amino acids', 'its α-helix and β-pleated sheet regions', 'its overall 3D shape', 'the way its subunits fit together'], answer: 0, shuffle: false,
            explain: 'Primary = the **sequence of amino acids**, joined by peptide bonds. It says nothing about the 3D shape.',
          },
        },
      ],
    },
    {
      id: 'secondary',
      title: 'Secondary structure: α-helix & β-sheet',
      minutes: 6,
      blocks: [
        { t: 'list', items: ['The **secondary structure** is the arrangement of **localized regions** of a protein.', 'These regions arise from **hydrogen bonding** between the **N–H** group of one amide and the **C=O** group of another.', 'Two stable arrangements are the **α-helix** and the **β-pleated sheet**.', 'Most proteins have regions of α-helix and β-pleated sheet, and other regions that are **random** arrangements.'] },
        {
          t: 'compare', items: [
            { title: 'α-Helix', text: 'The chain **coils** like a spring.\n\nH-bonds run **along the axis of the helix**: each C=O bonds to an N–H a few amino acids farther along the **same stretch** of chain (about 3.6 amino acids per turn).' },
            { title: 'β-Pleated sheet', text: 'Stretched-out **β-strands** line up side by side; **multiple strands form one sheet**.\n\nH-bonds run **across the sheet**, between **different strands**.' },
          ],
        },
        {
          t: 'table', head: ['Ribbon diagram shorthand', 'Drawn as'],
          rows: [['α-helix', 'a **coiled ribbon**'], ['β-sheet', 'flat **arrows** side by side'], ['random region', 'a thin **loop**']],
          caption: 'Ribbon diagrams simplify the way we view protein structure, compared with ball-and-stick models of every atom.',
        },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: '**α** = **a**xis: H-bonds go along the helix axis. **β** = **b**etween: H-bonds go between strands.' },
        { t: 'callout', kind: 'life', title: 'When secondary structure goes wrong: Creutzfeldt–Jakob disease', text: 'Caused by a **prion protein**: the **α-helical regions are replaced by pathogenic β-pleated sheets** in the neurons. Same amino acids, different fold.\n\nSymptoms: **rapidly progressive dementia**, personality changes and hallucinations, speech impairment, jerky movements, and balance and coordination dysfunction (**ataxia**).' },
        {
          t: 'check', q: {
            id: 'l18-c-hbond', skill: 'l18.levels', type: 'mc', prompt: 'The hydrogen bonds that make an α-helix or β-sheet form between…',
            choices: ['the N–H of one amide and the C=O of another', 'two cysteine side chains', 'a –COO⁻ and an –NH₃⁺ side chain', 'nonpolar side chains'], answer: 0,
            explain: 'Secondary structure comes from the **backbone**: an amide **N–H** hydrogen bonds to another amide\'s **C=O**. Side chains matter in tertiary structure.',
          },
        },
      ],
    },
    {
      id: 'tertiary',
      title: 'Tertiary structure: what holds the 3D shape',
      minutes: 9,
      blocks: [
        { t: 'list', items: ['The **tertiary structure** is the **3D shape adopted by the entire peptide chain**.', 'It **combines secondary structure elements** (α-helices and β-sheets) to form different 3D structures.'] },
        { t: 'h', text: 'How is the tertiary structure held together?' },
        {
          t: 'table', head: ['Interaction', 'Between', 'Where in the protein'],
          rows: [
            ['**Hydrogen bonding**', '**polar** groups (OH, NH, C=O) with each other or with **water**', '**exterior** (surface)'],
            ['**London dispersion forces** (hydrophobic interactions)', '**nonpolar** side chains', '**interior** of the structure'],
            ['**Electrostatic interactions**', 'side chains with **opposite charges** (–NH₃⁺ and –COO⁻)', 'charged side chains'],
            ['**Disulfide bonds**', 'two **cysteine** side chains (S–S)', 'the only **covalent** bond of the four'],
          ],
        },
        { t: 'callout', kind: 'key', title: 'Predict a side chain\'s job from its R group', text: '**Nonpolar** (Gly, Ala, Val, Leu, Ile, Met, Phe, Trp, Pro) → **interior**, London dispersion.\n**Polar** OH or amide (Ser, Thr, Tyr, Asn, Gln) → **hydrogen bonding**, often on the **surface** near water.\n**Charged** (Asp, Glu, Lys, Arg, His) → **electrostatic (ionic)** attraction.\n**Cysteine** → **disulfide bond**.' },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Oil hides from water: **nonpolar goes inside**, like the tails of a membrane. Water-loving polar groups stay **outside**, where the water is.' },
        { t: 'h', text: 'Forming disulfide bonds' },
        { t: 'p', text: 'Two SH groups are **oxidized ([O])** to an S–S bond, the same thiol → disulfide reaction as Lecture 6. Disulfide bonds can form in **two ways**:' },
        {
          t: 'compare', items: [
            { title: 'Intramolecular disulfide bond', text: 'Between two SH groups on the **same chain**. It holds one chain in its folded shape: **tertiary** structure.' },
            { title: 'Intermolecular disulfide bond', text: 'Between two SH groups on **different chains**. It links two chains together, as in **insulin**.' },
          ],
        },
        { t: 'mols', items: [{ smiles: '[NH3+]C(CS)C(=O)[O-]', highlight: [3], caption: 'cysteine: the SH that forms the bond' }, { smiles: '[NH3+]C(CSSCC([NH3+])C(=O)[O-])C(=O)[O-]', highlight: [3, 4], caption: 'two cysteines joined S–S', scale: 28 }] },
        { t: 'h', text: 'Practice problems from the slides' },
        { t: 'mols', items: [aa('Val', '**Valine**: side chain CH(CH₃)₂'), aa('Ser', '**Serine**: side chain CH₂OH')] },
        {
          t: 'example', title: 'Practice: valine\'s role', prompt: 'Choose the correct statement about the role of **valine** in stabilizing the tertiary structure of a protein.\n\nA. It is most likely involved in hydrogen bonding\nB. It is most likely on the surface of the protein\nC. It forms a disulfide bond\nD. It is most likely involved in ionic interactions\nE. It is most likely in the interior of the protein',
          steps: ['Look at the R group: CH(CH₃)₂, only C and H, so it is **nonpolar**.', 'Nonpolar side chains avoid water and pack together by **London dispersion forces** in the **interior**.', 'No OH (not A), not charged (not D), not cysteine (not C).'],
          answer: '**E**: it is most likely in the interior of the protein',
        },
        {
          t: 'example', title: 'Practice: serine\'s role', prompt: 'Choose the correct statement about the role of **serine** in stabilizing the tertiary structure of a protein.\n\nA. It is most likely involved in hydrogen bonding\nB. It is not likely to be on the surface of the protein\nC. It forms a disulfide bond\nD. It is most likely involved in ionic interactions\nE. It is most likely in the interior of the protein',
          steps: ['Look at the R group: CH₂**OH**, a **polar** group.', 'An OH can **hydrogen bond** with other polar groups or with water on the surface.', 'It is not charged (not D) and has no SH (not C).'],
          answer: '**A**: it is most likely involved in hydrogen bonding',
        },
        {
          t: 'check', q: {
            id: 'l18-c-covalent', skill: 'l18.tertiary', type: 'mc', prompt: 'Which interaction holding a tertiary structure together is a covalent bond?',
            choices: ['disulfide bond', 'hydrogen bond', 'London dispersion forces', 'electrostatic interaction'], answer: 0,
            explain: 'The **disulfide bond** (S–S between two cysteines) is a real covalent bond. The other three are noncovalent attractions.',
          },
        },
      ],
    },
    {
      id: 'quaternary',
      title: 'Quaternary structure & the four levels',
      minutes: 5,
      blocks: [
        { t: 'list', items: ['The **quaternary structure** is the shape adopted when **two or more folded polypeptide chains (subunits)** come together into **one complex**.', 'A protein made of only one chain has **no quaternary structure**.'] },
        {
          t: 'compare', items: [
            { title: 'Myoglobin', text: 'Only **1 subunit**. Has **no quaternary structure**.' },
            { title: 'Hemoglobin', text: '**4 subunits**. Has a **quaternary structure**.' },
          ],
        },
        { t: 'p', text: '**Insulin** consists of **two separate polypeptide chains** linked by **intermolecular disulfide bonds**: the **A chain** (21 amino acids) and the **B chain** (30 amino acids). One more disulfide bond sits inside the A chain itself.' },
        { t: 'table', head: ['Chain', 'Sequence (N-terminal first)'], rows: [['A (21)', 'Gly–Ile–Val–Glu–Gln–**Cys**–**Cys**–Thr–Ser–Ile–**Cys**–Ser–Leu–Tyr–Gln–Leu–Glu–Asn–Tyr–**Cys**–Asn'], ['B (30)', 'Phe–Val–Asn–Gln–His–Leu–**Cys**–Gly–Ser–His–Leu–Val–Glu–Ala–Leu–Tyr–Leu–Val–**Cys**–Gly–Glu–Arg–Gly–Phe–Phe–Tyr–Thr–Pro–Lys–Thr']], caption: 'Insulin, from the slide. The cysteines (bold) form the disulfide bonds: two link the A and B chains, one is inside the A chain.' },
        { t: 'h', text: 'All four levels' },
        {
          t: 'table', head: ['Level', 'What it is', 'Held by'],
          rows: [
            ['**Primary**', 'the **amino acid sequence**', 'peptide (amide) bonds'],
            ['**Secondary**', '**α-helix** and **β-sheets**', 'H-bonds between backbone N–H and C=O'],
            ['**Tertiary**', 'the **3D structure** of one chain, combining α-helices and β-sheets', 'H-bonds, London dispersion, electrostatic, disulfide bonds'],
            ['**Quaternary**', '**multiple subunits** combined', 'the same side-chain interactions, between chains'],
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Think of a phone cord. **1°** the beads on the string. **2°** the string coils into a spring. **3°** the coiled cord tangles into a ball. **4°** several balls stuck together.' },
        {
          t: 'check', q: {
            id: 'l18-c-quat', skill: 'l18.quaternary', type: 'mc', prompt: 'Which protein has a quaternary structure?',
            choices: ['hemoglobin', 'myoglobin', 'neither', 'both'], answer: 0, shuffle: false,
            explain: '**Hemoglobin** has 4 subunits. Myoglobin is a single chain, so it has no quaternary structure.',
          },
        },
      ],
    },
    {
      id: 'common',
      title: 'Common proteins: fibrous & globular',
      minutes: 6,
      blocks: [
        { t: 'h', text: 'Some functions of proteins' },
        {
          t: 'table', head: ['Function', 'What it means', 'Example'],
          rows: [
            ['**Structural**', 'maintain cellular structure', 'collagen, keratin'],
            ['**Enzymatic**', 'carry out chemical reactions', 'pepsin, lactase'],
            ['**Signaling**', 'hormones and receptors', 'insulin'],
            ['**Transport**', 'bind to small molecules', 'hemoglobin'],
            ['**Immune response**', 'defend the body', 'antibodies, clotting factors'],
          ],
        },
        { t: 'p', text: 'Proteins are generally classified according to their **3D shapes**:' },
        {
          t: 'compare', items: [
            { title: 'Fibrous proteins', text: 'Long **linear** polypeptide chains **bundled together** to form **rods or sheets**.\n\nThey have **structural** roles. Examples: **α-keratin**, **collagen**.' },
            { title: 'Globular proteins', text: 'Coiled into **compact** shapes that are **water soluble**.\n\n**Most enzymes and transport proteins** are globular. Examples: **hemoglobin**, **myoglobin**.' },
          ],
        },
        { t: 'h', text: 'A. α-Keratins' },
        { t: 'list', items: ['**α-Keratins** are the proteins found in **hair, hooves, nails, skin and wool**.', 'They are made of **two** mainly **α-helix** chains coiled around each other in a **superhelix** (a supercoil).', 'These coils wind around other coils, making larger and stronger structures, like **hair**.'] },
        { t: 'h', text: 'B. Collagen' },
        { t: 'list', items: ['**Collagen** requires **three chains** in a superhelix: collagen\'s **triple helix**.', 'Collagen is a main component of the **extracellular matrix**.', '**Vitamin C** is required for proper formation of collagen fibers.'] },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: '**K**eratin: **two** chains, like a **k**not in two strands of hair. **Coll**agen: **three** chains, a braid. Vitamin **C** builds **C**ollagen.' },
        {
          t: 'check', q: {
            id: 'l18-c-collagen', skill: 'l18.common', type: 'mc', prompt: 'Which vitamin is required to form collagen fibers properly?',
            choices: ['vitamin C', 'vitamin A', 'vitamin D', 'vitamin K'], answer: 0,
            explain: '**Vitamin C**. Collagen is a triple helix of three chains, the main protein of the extracellular matrix.',
          },
        },
      ],
    },
    {
      id: 'hemoglobin',
      title: 'Hemoglobin, myoglobin & sickle cell',
      minutes: 6,
      blocks: [
        { t: 'list', items: ['Both **hemoglobin** and **myoglobin** are **globular** and **conjugated proteins**: they contain both a **protein** and a **non-protein** component.', 'Their non-protein unit is a **heme**: an organic complex surrounding an **Fe²⁺ ion**.', 'The **Fe²⁺ ion binds to O₂** gas in the bloodstream.', '**Hemoglobin transports** the O₂ to wherever it is needed in the body; **myoglobin stores** O₂ in tissues.'] },
        {
          t: 'compare', items: [
            { title: 'Myoglobin', text: '**153 amino acids** in **1 polypeptide chain**, holding **1 heme**. Stores O₂ in tissues.' },
            { title: 'Hemoglobin', text: '**4 polypeptide chains**, **each carrying a heme**: **4 heme units**. Carries O₂ in the blood.' },
          ],
        },
        { t: 'callout', kind: 'tip', title: 'Picture the heme', text: 'A flat ring of four small N-containing rings, with the four N atoms all pointing in at one **Fe²⁺** in the middle. O₂ binds to that iron.' },
        { t: 'h', text: 'Carbon monoxide' },
        { t: 'list', items: ['**Carbon monoxide (CO)** is poisonous because it binds **200 times more strongly** to the Fe²⁺ than O₂ does.', 'Hemoglobin complexed with CO **cannot carry O₂**, and cells die from lack of O₂.'] },
        { t: 'h', text: 'Sickle cell anemia' },
        { t: 'list', items: ['A change in the normal amino acid sequence of a protein is a **mutation**, which can result in disease.', '**Sickle cell anemia** is a disease where a **single amino acid** is different in hemoglobin. (The textbook names it: **valine** replaces glutamate in two of the four chains.)', 'Red blood cells containing the mutated hemoglobin become **elongated** and **crescent (sickle) shaped**.', 'These red blood cells **rupture capillaries**, causing pain and inflammation, leading to organ damage, and eventually a painful death.'] },
        { t: 'callout', kind: 'exam', title: 'Why one amino acid matters', text: 'One change in the **primary structure** changes how the protein folds and packs. **Structure determines function**: that is the whole lecture in one disease.' },
        {
          t: 'check', q: {
            id: 'l18-c-co', skill: 'l18.hemoglobin', type: 'mc', prompt: 'Why is carbon monoxide poisonous?',
            choices: ['It binds Fe²⁺ in heme about 200 times more strongly than O₂', 'It breaks the peptide bonds of hemoglobin', 'It turns Fe²⁺ into a sickle shape', 'It denatures myoglobin by heating it'], answer: 0,
            explain: 'CO binds the **Fe²⁺ of heme 200× more strongly** than O₂, so hemoglobin can no longer carry O₂.',
          },
        },
      ],
    },
    {
      id: 'hydrolysis',
      title: 'Protein hydrolysis',
      minutes: 6,
      blocks: [
        { t: 'list', items: ['Protein **hydrolysis** breaks the **peptide bonds** by treatment with **aqueous acid, base, or certain enzymes**.', 'In the body, the enzyme **pepsin** in **gastric juice** cleaves **some** of the peptide bonds of large proteins to make **smaller peptide chains**.', 'In the **intestines**, the enzymes **trypsin** and **chymotrypsin** hydrolyze the **remainder** of the amide bonds, resulting in **individual amino acids**.'] },
        { t: 'callout', kind: 'tip', title: 'The reverse of Lecture 17', text: 'Forming a peptide bond **lost H₂O**. Hydrolysis **adds H₂O** back across each bond: the C=O gets an OH (becoming –COO⁻ again) and the N gets its H back (becoming –NH₃⁺).' },
        {
          t: 'steps', title: 'HOW TO draw the products of hydrolysis', items: [
            '**First: identify the peptide bonds**, the bonds between a **carbonyl C** and a **nitrogen**.',
            '**Second: break those bonds by adding water.** Each C=O gets an O (–COO⁻) and each N gets an H (–NH₃⁺).',
            '**Draw each amino acid** with its own side chain. A chain of n amino acids gives **n amino acids** and uses **n − 1 H₂O**.',
          ],
        },
        { t: 'peptides', items: [{ seq: ['Ile', 'Gly', 'Phe'], caption: '**Ile–Gly–Phe**. Break the two peptide bonds (in color)' }] },
        { t: 'peptides', items: [{ seq: ['Ile'], caption: 'Ile' }, { seq: ['Gly'], caption: 'Gly' }, { seq: ['Phe'], caption: 'Phe' }], caption: 'Ile–Gly–Phe + 2 H₂O → isoleucine + glycine + phenylalanine' },
        {
          t: 'example', title: 'Practice from the slides: a peptide drawn backwards', prompt: 'Draw the products of the hydrolysis of this peptide. The slide draws it with the **COO⁻ on the left** and the **NH₃⁺ on the right**, and its side chains are, left to right: CH₂CH(CH₃)₂, CH₃ and H.',
          steps: ['Find the two peptide bonds (C=O next to N–H) and break each with water.', 'Name each piece by its side chain: CH₂CH(CH₃)₂ = **leucine**, CH₃ = **alanine**, H = **glycine**.', 'To name the peptide, start from the **NH₃⁺** end (here, the right): **Gly–Ala–Leu**.'],
          answer: '**Leucine, alanine and glycine** (the slide\'s answer draws them un-ionized, as COOH and NH₂; same three amino acids)',
          answerMols: [aa('Leu', 'leucine'), aa('Ala', 'alanine'), aa('Gly', 'glycine')],
        },
        { t: 'peptides', items: [{ seq: ['Gly', 'Ala', 'Leu'], caption: 'The same peptide drawn the usual way: **Gly–Ala–Leu**' }] },
        { t: 'callout', kind: 'warn', title: 'Read from the NH₃⁺ end', text: 'A peptide can be drawn either way round on an exam. The N-terminal amino acid is always the one with the free **–NH₃⁺**, wherever it sits on the page.' },
        {
          t: 'check', q: {
            id: 'l18-c-water', skill: 'l18.hydrolysis', type: 'num', prompt: 'How many water molecules does it take to hydrolyze a tetrapeptide completely into amino acids?',
            answer: 3, tol: 0, explain: 'A tetrapeptide has **4 − 1 = 3** peptide bonds, and each one takes one H₂O.',
          },
        },
      ],
    },
    {
      id: 'denaturation',
      title: 'Denaturation',
      minutes: 4,
      blocks: [
        { t: 'list', items: ['**Denaturation** is the process of **altering the shape** of a protein **without breaking the amide bonds** that form the primary structure.', '**High temperature, acid, base**, and even **agitation** can disrupt the **noncovalent interactions** that hold a protein in a specific shape.', 'Denaturation often makes globular proteins **less water soluble**.', '**Ovalbumin**, the major protein in egg white, is denatured when an egg is cooked, changing from **clear and colorless** to **opaque and white**.'] },
        {
          t: 'compare', items: [
            { title: 'Denaturation', text: 'Shape is lost: secondary, tertiary and quaternary structure unravel into **loose coils and loops**.\n\n**Primary structure stays**: no peptide bonds break.' },
            { title: 'Hydrolysis', text: '**Peptide bonds break**: the primary structure is destroyed.\n\nThe products are smaller peptides and **amino acids**.' },
          ],
        },
        { t: 'callout', kind: 'exam', title: 'The classic trap', text: 'Denaturation does **not** break peptide bonds. If the amide bonds break, that is **hydrolysis**.' },
        { t: 'h', text: 'What you need to know (from the last slide)' },
        { t: 'list', items: ['Primary, secondary (alpha helix, beta sheets), tertiary and quaternary structures.', 'Interactions that stabilize the 3D structure of a protein.', 'Predict the function of an amino acid based on its R group.', 'Examples of structural proteins (keratin and collagen): structure and function.', 'Myoglobin and hemoglobin, sickle cell anemia.'] },
        {
          t: 'check', q: {
            id: 'l18-c-denat', skill: 'l18.denature', type: 'tf', prompt: 'True or false: cooking an egg breaks the peptide bonds of ovalbumin.',
            answer: false, explain: '**False.** Heat **denatures** ovalbumin: it changes shape (clear → opaque white) but its peptide bonds stay intact.',
          },
        },
      ],
    },
  ],
  questions: [
    // primary & secondary
    { id: 'l18-q01', skill: 'l18.levels', type: 'tf', prompt: 'True or false: a protein\'s primary structure tells you its 3D shape.', answer: false, explain: '**False.** The primary structure is only the **sequence**; it gives no information about the 3D structure.' },
    { id: 'l18-q02', skill: 'l18.levels', type: 'mc', prompt: 'What bonds join the amino acids in the primary structure?', choices: ['peptide (amide) bonds', 'hydrogen bonds', 'disulfide bonds', 'glycosidic bonds'], answer: 0, explain: 'The sequence is held together by **peptide bonds**: carbonyl C to N.' },
    { id: 'l18-q03', skill: 'l18.levels', type: 'multi', prompt: 'Select the two stable secondary structures.', choices: ['α-helix', 'β-pleated sheet', 'triple helix', 'random coil', 'superhelix'], answer: [0, 1], explain: 'The **α-helix** and the **β-pleated sheet**. Other regions are random arrangements.' },
    { id: 'l18-q04', skill: 'l18.levels', type: 'mc', prompt: 'In an α-helix, the hydrogen bonds run…', choices: ['along the axis of the helix', 'between different strands of a sheet', 'between two cysteine side chains', 'between separate subunits'], answer: 0, explain: 'α-helix: H-bonds run **along the axis**. β-sheet: H-bonds run **across** the sheet, between strands.' },
    { id: 'l18-q05', skill: 'l18.levels', type: 'mc', prompt: 'In a β-pleated sheet, the hydrogen bonds run…', choices: ['across the sheet, between different strands', 'along the axis of a helix', 'only to water on the surface', 'between heme groups'], answer: 0, explain: '**Multiple strands form one sheet**, held by H-bonds **between** the strands.' },
    { id: 'l18-q06', skill: 'l18.levels', type: 'mc', prompt: 'Creutzfeldt–Jakob disease is caused by a prion protein that…', choices: ['replaces α-helical regions with β-pleated sheets in neurons', 'replaces one amino acid in hemoglobin', 'breaks every peptide bond in the brain', 'blocks collagen from forming'], answer: 0, explain: 'A prion converts **α-helices into pathogenic β-pleated sheets** in the neurons.' },
    { id: 'l18-q07', skill: 'l18.levels', type: 'multi', prompt: 'Select symptoms of Creutzfeldt–Jakob disease.', choices: ['rapidly progressive dementia', 'jerky movements and ataxia', 'personality changes and hallucinations', 'sickle-shaped red blood cells', 'opaque white skin'], answer: [0, 1, 2], explain: 'Dementia, personality changes, hallucinations, speech problems, jerky movements and **ataxia**. Sickle cells belong to sickle cell anemia.' },
    // tertiary
    { id: 'l18-q08', skill: 'l18.tertiary', type: 'mc', prompt: 'The tertiary structure of a protein is…', choices: ['the 3D shape of the entire peptide chain', 'its amino acid sequence', 'a localized α-helix', 'two or more chains in one complex'], answer: 0, explain: 'Tertiary = the **3D shape of the whole chain**, combining its α-helices and β-sheets.' },
    { id: 'l18-q09', skill: 'l18.tertiary', type: 'mc', prompt: 'Where are nonpolar side chains usually found in a globular protein?', choices: ['in the interior', 'on the surface, touching water', 'bonded to heme', 'at the N-terminal end only'], answer: 0, explain: 'They pack together in the **interior**, held by **London dispersion forces** (hydrophobic interactions).' },
    { id: 'l18-q10', skill: 'l18.tertiary', type: 'mc', prompt: 'What attracts a lysine side chain (–NH₃⁺) to a glutamate side chain (–COO⁻)?', figure: { mols: [aa('Lys', 'lysine'), aa('Glu', 'glutamate')] }, choices: ['electrostatic interaction', 'a disulfide bond', 'London dispersion forces', 'a peptide bond'], answer: 0, explain: 'Opposite charges attract: an **electrostatic (ionic) interaction**.' },
    { id: 'l18-q11', skill: 'l18.tertiary', type: 'mc', prompt: 'Practice from the slides: what is valine\'s most likely role in a protein\'s tertiary structure?', figure: { smiles: aaSmiles(aminoAcid('Val')), highlight: aaSideAtoms(aminoAcid('Val')) }, choices: ['It is most likely in the interior of the protein', 'It is most likely involved in hydrogen bonding', 'It forms a disulfide bond', 'It is most likely involved in ionic interactions'], answer: 0, explain: 'Valine\'s side chain is **nonpolar** (only C and H), so it sits in the **interior**.' },
    { id: 'l18-q12', skill: 'l18.tertiary', type: 'mc', prompt: 'Practice from the slides: what is serine\'s most likely role in a protein\'s tertiary structure?', figure: { smiles: aaSmiles(aminoAcid('Ser')), highlight: aaSideAtoms(aminoAcid('Ser')) }, choices: ['It is most likely involved in hydrogen bonding', 'It is most likely in the interior of the protein', 'It forms a disulfide bond', 'It is most likely involved in ionic interactions'], answer: 0, explain: 'Serine\'s CH₂**OH** is polar, so it **hydrogen bonds**.' },
    { id: 'l18-q13', skill: 'l18.tertiary', type: 'mc', prompt: 'Which amino acid forms disulfide bonds?', choices: ['cysteine', 'methionine', 'serine', 'valine'], answer: 0, explain: '**Cysteine**: two SH groups are oxidized to S–S.' },
    { id: 'l18-q14', skill: 'l18.tertiary', type: 'mc', prompt: 'A disulfide bond between two SH groups on the same chain is…', choices: ['intramolecular', 'intermolecular', 'a peptide bond', 'a hydrogen bond'], answer: 0, shuffle: false, explain: '**Intra**molecular = within one chain. **Inter**molecular = between different chains, as in insulin.' },
    { id: 'l18-q15', skill: 'l18.tertiary', type: 'match', prompt: 'Match each interaction with what it joins.', left: ['hydrogen bonding', 'London dispersion forces', 'electrostatic interaction', 'disulfide bond'], right: ['polar groups, or polar groups and water', 'nonpolar side chains in the interior', 'oppositely charged side chains', 'two cysteines, covalently'], answer: [0, 1, 2, 3], explain: 'H-bonds: polar groups. London: nonpolar, inside. Electrostatic: + and −. Disulfide: Cys–Cys, covalent.' },
    // quaternary
    { id: 'l18-q16', skill: 'l18.quaternary', type: 'mc', prompt: 'The quaternary structure of a protein is the shape formed when…', choices: ['two or more folded polypeptide chains come together', 'one chain folds into a helix', 'amino acids are joined in sequence', 'a protein is denatured'], answer: 0, explain: 'Quaternary = **two or more subunits** in one complex.' },
    { id: 'l18-q17', skill: 'l18.quaternary', type: 'num', prompt: 'How many subunits (polypeptide chains) does hemoglobin have?', answer: 4, tol: 0, explain: '**4**, each carrying a heme.' },
    { id: 'l18-q18', skill: 'l18.quaternary', type: 'tf', prompt: 'True or false: myoglobin has a quaternary structure.', answer: false, explain: '**False.** Myoglobin has only **1** subunit, so there is no quaternary structure.' },
    { id: 'l18-q19', skill: 'l18.quaternary', type: 'mc', prompt: 'How are the two chains of insulin held together?', choices: ['intermolecular disulfide bonds', 'peptide bonds', 'a heme group', 'glycosidic linkages'], answer: 0, explain: 'Insulin\'s A and B chains are linked by **intermolecular disulfide bonds** between cysteines.' },
    { id: 'l18-q20', skill: 'l18.quaternary', type: 'order', prompt: 'Put the levels of protein structure in order, from first to last.', items: ['quaternary: subunits combined', 'primary: the sequence', 'tertiary: the whole chain\'s 3D shape', 'secondary: α-helix and β-sheet'], answer: [1, 3, 2, 0], explain: '**Primary → secondary → tertiary → quaternary.**' },
    { id: 'l18-q21', skill: 'l18.quaternary', type: 'match', prompt: 'Match each level of structure with its description.', left: ['primary', 'secondary', 'tertiary', 'quaternary'], right: ['amino acid sequence', 'α-helix and β-sheets', '3D structure of one whole chain', 'multiple subunits combined'], answer: [0, 1, 2, 3], explain: 'Sequence; helices and sheets; whole-chain 3D shape; subunits together.' },
    // common proteins
    { id: 'l18-q22', skill: 'l18.common', type: 'mc', prompt: 'Fibrous proteins are…', choices: ['long linear chains bundled into rods or sheets, with structural roles', 'compact, water-soluble coils', 'always enzymes', 'single amino acids'], answer: 0, explain: 'Fibrous: long chains bundled into **rods or sheets**; **structural**. Globular: compact and water soluble.' },
    { id: 'l18-q23', skill: 'l18.common', type: 'multi', prompt: 'Select the globular proteins.', choices: ['hemoglobin', 'myoglobin', 'α-keratin', 'collagen'], answer: [0, 1], explain: '**Hemoglobin and myoglobin** are globular. α-Keratin and collagen are fibrous.' },
    { id: 'l18-q24', skill: 'l18.common', type: 'mc', prompt: 'Where are α-keratins found?', choices: ['hair, hooves, nails, skin and wool', 'tendons and the extracellular matrix', 'red blood cells', 'gastric juice'], answer: 0, explain: '**α-Keratins**: hair, hooves, nails, skin and wool.' },
    { id: 'l18-q25', skill: 'l18.common', type: 'mc', prompt: 'How many chains coil together in collagen\'s superhelix?', choices: ['3', '2', '4', '1'], answer: 0, shuffle: false, explain: 'Collagen is a **triple** helix: **three** chains. α-Keratin uses **two**.' },
    { id: 'l18-q26', skill: 'l18.common', type: 'match', prompt: 'Match each protein function with an example from the slides.', left: ['transport', 'signaling', 'immune response', 'structural'], right: ['hemoglobin', 'insulin', 'antibodies', 'collagen'], answer: [0, 1, 2, 3], explain: 'Transport: hemoglobin. Signaling: hormones like insulin. Immune: antibodies and clotting factors. Structural: collagen, keratin.' },
    { id: 'l18-q27', skill: 'l18.common', type: 'mc', prompt: 'Most enzymes and transport proteins are…', choices: ['globular', 'fibrous', 'denatured', 'carbohydrates'], answer: 0, explain: '**Globular**: compact and water soluble.' },
    // hemoglobin
    { id: 'l18-q28', skill: 'l18.hemoglobin', type: 'mc', prompt: 'A conjugated protein contains…', choices: ['a protein part and a non-protein part', 'only α-helices', 'two identical chains', 'no amino acids'], answer: 0, explain: 'Conjugated = **protein + non-protein** component. For hemoglobin and myoglobin, the non-protein unit is **heme**.' },
    { id: 'l18-q29', skill: 'l18.hemoglobin', type: 'mc', prompt: 'Which ion is at the center of heme, binding O₂?', choices: ['Fe²⁺', 'Fe³⁺', 'Mg²⁺', 'Ca²⁺'], answer: 0, explain: 'Heme is an organic complex around an **Fe²⁺** ion, which binds O₂.' },
    { id: 'l18-q30', skill: 'l18.hemoglobin', type: 'num', prompt: 'How many amino acids does myoglobin have?', answer: 153, tol: 0, explain: '**153 amino acids** in **1** polypeptide chain.' },
    { id: 'l18-q31', skill: 'l18.hemoglobin', type: 'num', prompt: 'How many heme units does one hemoglobin molecule carry?', answer: 4, tol: 0, explain: '**4**: one on each of its 4 chains.' },
    { id: 'l18-q32', skill: 'l18.hemoglobin', type: 'num', prompt: 'About how many times more strongly does CO bind to Fe²⁺ than O₂ does?', answer: 200, tol: 0, explain: '**200 times**, so hemoglobin bound to CO cannot carry O₂.' },
    { id: 'l18-q33', skill: 'l18.hemoglobin', type: 'mc', prompt: 'In sickle cell anemia, how much of hemoglobin\'s sequence is changed?', choices: ['a single amino acid', 'every amino acid', 'the heme group only', 'all four chains are missing'], answer: 0, explain: 'A **single amino acid** is different: a mutation in the primary structure.' },
    { id: 'l18-q34', skill: 'l18.hemoglobin', type: 'mc', prompt: 'What happens to red blood cells in sickle cell anemia?', choices: ['They become elongated and crescent shaped, and can rupture capillaries', 'They become round and carry extra O₂', 'They lose all their heme', 'They turn opaque white like a cooked egg'], answer: 0, explain: 'They become **elongated, sickle shaped** cells that **rupture capillaries**, causing pain, inflammation and organ damage.' },
    { id: 'l18-q35', skill: 'l18.hemoglobin', type: 'mc', prompt: 'Which protein stores O₂ in tissues?', choices: ['myoglobin', 'hemoglobin', 'collagen', 'α-keratin'], answer: 0, explain: '**Myoglobin** stores O₂; **hemoglobin** transports it.' },
    // hydrolysis
    { id: 'l18-q36', skill: 'l18.hydrolysis', type: 'mc', prompt: 'Protein hydrolysis breaks…', choices: ['peptide bonds', 'only hydrogen bonds', 'only disulfide bonds', 'the heme group'], answer: 0, explain: 'Hydrolysis breaks the **peptide (amide) bonds** using water.' },
    { id: 'l18-q37', skill: 'l18.hydrolysis', type: 'mc', prompt: 'Which enzyme in gastric juice cleaves some peptide bonds of large proteins?', choices: ['pepsin', 'trypsin', 'chymotrypsin', 'lactase'], answer: 0, explain: '**Pepsin**, in the stomach. Trypsin and chymotrypsin finish the job in the intestines.' },
    { id: 'l18-q38', skill: 'l18.hydrolysis', type: 'multi', prompt: 'Select the enzymes that hydrolyze the remaining amide bonds in the intestines, giving individual amino acids.', choices: ['trypsin', 'chymotrypsin', 'pepsin', 'amylase'], answer: [0, 1], explain: '**Trypsin and chymotrypsin**. Pepsin works earlier, in the stomach.' },
    { id: 'l18-q39', skill: 'l18.hydrolysis', type: 'mc', prompt: 'What does complete hydrolysis of Ile–Gly–Phe give?', figure: { peptides: [{ seq: ['Ile', 'Gly', 'Phe'] }] }, choices: ['isoleucine, glycine and phenylalanine', 'Ile–Gly and phenylalanine only', 'isoleucine and phenylalanine only', 'three dipeptides'], answer: 0, explain: 'Both peptide bonds break, giving the **three amino acids**: Ile, Gly and Phe.' },
    { id: 'l18-q40', skill: 'l18.hydrolysis', type: 'mc', prompt: 'A peptide is drawn with its –COO⁻ on the left and its –NH₃⁺ on the right. Its side chains, left to right, are CH₂CH(CH₃)₂, CH₃ and H. What is its name?', choices: ['Gly–Ala–Leu', 'Leu–Ala–Gly', 'Ala–Gly–Leu', 'Leu–Gly–Ala'], answer: 0, explain: 'Start from the free **–NH₃⁺** (here on the right): H = Gly, CH₃ = Ala, CH₂CH(CH₃)₂ = Leu. **Gly–Ala–Leu**.' },
    // denaturation
    { id: 'l18-q41', skill: 'l18.denature', type: 'mc', prompt: 'Denaturation changes a protein\'s shape without breaking its…', choices: ['amide (peptide) bonds', 'hydrogen bonds', 'electrostatic attractions', 'London dispersion forces'], answer: 0, explain: 'The **amide bonds of the primary structure** stay; the noncovalent interactions are disrupted.' },
    { id: 'l18-q42', skill: 'l18.denature', type: 'multi', prompt: 'Select what can denature a protein.', choices: ['high temperature', 'acid', 'base', 'agitation', 'cold storage'], answer: [0, 1, 2, 3], explain: '**Heat, acid, base and even agitation** disrupt the noncovalent interactions.' },
    { id: 'l18-q43', skill: 'l18.denature', type: 'mc', prompt: 'What usually happens to the water solubility of a globular protein when it is denatured?', choices: ['it decreases', 'it increases', 'it stays the same', 'the protein dissolves into amino acids'], answer: 0, shuffle: false, explain: 'Denaturation often makes globular proteins **less water soluble**, like egg white turning solid.' },
    { id: 'l18-q44', skill: 'l18.denature', type: 'mc', prompt: 'Ovalbumin changes from clear to opaque white when an egg is cooked. This is…', choices: ['denaturation', 'hydrolysis', 'a mutation', 'saponification'], answer: 0, explain: 'Heat **denatures** ovalbumin, the major protein in egg white. No peptide bonds break.' },
  ],
  cards: [
    { id: 'l18-k01', front: 'Primary structure', back: 'The **sequence of amino acids**, joined by peptide bonds. Says nothing about the 3D shape.' },
    { id: 'l18-k02', front: 'Secondary structure', back: 'Localized regions: **α-helix** and **β-pleated sheet**, from H-bonds between an amide **N–H** and another **C=O**. Other regions are random.' },
    { id: 'l18-k03', front: 'α-Helix vs β-pleated sheet', back: 'α-helix: coiled; H-bonds **along the axis**. β-sheet: strands side by side; H-bonds **across the sheet, between strands**.' },
    { id: 'l18-k04', front: 'Creutzfeldt–Jakob disease', back: 'A **prion** protein replaces **α-helical** regions with pathogenic **β-pleated sheets** in neurons. Rapid dementia, ataxia, jerky movements.' },
    { id: 'l18-k05', front: 'Tertiary structure', back: 'The **3D shape of the entire chain**, combining α-helices and β-sheets.' },
    { id: 'l18-k06', front: 'Four forces holding a tertiary structure', back: '**H-bonding** (polar, surface), **London dispersion** (nonpolar, interior), **electrostatic** (charged side chains), **disulfide bonds** (Cys–Cys, covalent).' },
    { id: 'l18-k07', front: 'Predict a side chain\'s role', back: 'Nonpolar → **interior**. Polar OH/amide → **H-bonding**. Charged → **ionic**. Cysteine → **disulfide**.' },
    { id: 'l18-k08', front: 'Intra- vs intermolecular disulfide bond', back: 'Intra: two SH on the **same chain**. Inter: SH groups on **different chains** (insulin). Both form by oxidation [O].' },
    { id: 'l18-k09', front: 'Quaternary structure', back: '**Two or more folded chains (subunits)** in one complex. Hemoglobin (4) has one; myoglobin (1) does not.' },
    { id: 'l18-k10', front: 'Insulin\'s structure', back: 'Two chains, **A (21)** and **B (30)**, linked by **intermolecular disulfide bonds**.' },
    { id: 'l18-k11', front: 'Functions of proteins', back: '**Structural**, **enzymatic**, **signaling** (insulin, receptors), **transport** (hemoglobin), **immune** (antibodies, clotting factors).' },
    { id: 'l18-k12', front: 'Fibrous vs globular', back: 'Fibrous: long chains bundled into **rods or sheets**; **structural**. Globular: **compact**, **water soluble**; most enzymes and transport proteins.' },
    { id: 'l18-k13', front: 'α-Keratin', back: 'Hair, hooves, nails, skin, wool. **Two** α-helix chains in a **superhelix**; coils wind into bigger coils.' },
    { id: 'l18-k14', front: 'Collagen', back: '**Three** chains in a superhelix (triple helix). Main protein of the **extracellular matrix**. Needs **vitamin C**.' },
    { id: 'l18-k15', front: 'Conjugated protein', back: 'Has a **protein** and a **non-protein** part. Hemoglobin and myoglobin: the non-protein part is **heme**.' },
    { id: 'l18-k16', front: 'Heme', back: 'An organic complex around **Fe²⁺**. The Fe²⁺ binds **O₂**.' },
    { id: 'l18-k17', front: 'Myoglobin vs hemoglobin', back: 'Myoglobin: **153 amino acids, 1 chain, 1 heme**; stores O₂ in tissue. Hemoglobin: **4 chains, 4 hemes**; transports O₂ in blood.' },
    { id: 'l18-k18', front: 'Carbon monoxide poisoning', back: 'CO binds Fe²⁺ **200× more strongly** than O₂. Hemoglobin with CO **cannot carry O₂**.' },
    { id: 'l18-k19', front: 'Sickle cell anemia', back: '**One amino acid** changed in hemoglobin. Red cells become **elongated, crescent (sickle)** shaped and **rupture capillaries**.' },
    { id: 'l18-k20', front: 'Protein hydrolysis', back: 'Water breaks the **peptide bonds** (acid, base or enzymes). n amino acids need **n − 1 H₂O**.' },
    { id: 'l18-k21', front: 'Digesting protein', back: '**Pepsin** (stomach, gastric juice) cleaves some bonds → smaller peptides. **Trypsin** and **chymotrypsin** (intestines) finish → amino acids.' },
    { id: 'l18-k22', front: 'Drawing hydrolysis products', back: '1. Find each C(=O)–N bond. 2. Add water: C=O gets O⁻, N gets H. 3. Draw each amino acid. Read the name from the **–NH₃⁺** end.' },
    { id: 'l18-k23', front: 'Denaturation', back: 'Changing the **shape** without breaking **amide bonds**. Heat, acid, base, agitation. Globular proteins become **less soluble**.' },
    { id: 'l18-k24', front: 'Denaturation vs hydrolysis', back: 'Denaturation: shape lost, **primary structure stays**. Hydrolysis: **peptide bonds break** into amino acids.' },
    { id: 'l18-k25', front: 'Ovalbumin', back: 'Main protein of **egg white**. Cooking denatures it: **clear and colorless → opaque and white**.' },
  ],
  keyTerms: [
    { term: 'primary structure', def: 'The sequence of amino acids in a protein, joined by peptide bonds.' },
    { term: 'secondary structure', def: 'The arrangement of localized regions of a protein, such as the α-helix and β-pleated sheet.' },
    { term: 'α-helix', def: 'A coiled secondary structure held by hydrogen bonds running along the axis of the helix.' },
    { term: 'β-pleated sheet', def: 'A secondary structure of strands side by side, held by hydrogen bonds between the strands.' },
    { term: 'tertiary structure', def: 'The three-dimensional shape adopted by an entire peptide chain.' },
    { term: 'quaternary structure', def: 'The shape formed when two or more folded polypeptide chains come together into one complex.' },
    { term: 'subunit', def: 'One folded polypeptide chain of a protein with quaternary structure.' },
    { term: 'fibrous protein', def: 'A protein of long linear chains bundled into rods or sheets, with a structural role.' },
    { term: 'globular protein', def: 'A protein coiled into a compact, water-soluble shape, such as most enzymes.' },
    { term: 'conjugated protein', def: 'A protein with both a protein and a non-protein component.' },
    { term: 'heme', def: 'The non-protein unit of hemoglobin and myoglobin: an organic complex around an Fe²⁺ ion.' },
    { term: 'mutation', def: 'A change in the normal amino acid sequence of a protein, which can cause disease.' },
    { term: 'prion', def: 'A protein that changes α-helical regions into β-pleated sheets, as in Creutzfeldt–Jakob disease.' },
    { term: 'protein hydrolysis', def: 'Breaking a protein\'s peptide bonds with water, using acid, base or enzymes.' },
    { term: 'denaturation', def: 'Altering a protein\'s shape without breaking the amide bonds of its primary structure.' },
  ],
};
