// Lecture 17 — Amino Acids (Smith Ch. 21.1–21.5)
import { AMINO_ACIDS, aaSmiles, aaSideAtoms } from '../../js/chem/aminoacids.js';

const chartOf = (cls) => AMINO_ACIDS.filter((a) => a.cls === cls).map((a) => ({ smiles: aaSmiles(a), highlight: aaSideAtoms(a), caption: `${a.name[0].toUpperCase()}${a.name.slice(1)} (${a.one}), ${a.three}`, scale: 26 }));

export default {
  id: 'l17',
  number: 17,
  title: 'Amino Acids',
  subtitle: 'Amino acids, zwitterions, peptides & peptide hormones',
  chapter: 'Ch. 21.1–21.5',
  tested: false,
  summary: 'The building blocks of proteins. Learn the α carbon and the 20 side chains, why only L amino acids matter, how charge changes with pH (zwitterions and the isoelectric point), how to draw a dipeptide and find its N- and C-terminal ends, and meet enkephalins, disulfide bonds, oxytocin and vasopressin.',
  skills: [
    { id: 'l17.proteins', title: 'What proteins do', desc: 'Daily protein needs and the jobs of hemoglobin, collagen, keratin, insulin and more.' },
    { id: 'l17.structure', title: 'Amino acid structure', desc: 'Amino group, carboxyl group, α carbon, R group; glycine and alanine.' },
    { id: 'l17.sidechains', title: 'The 20 side chains', desc: 'Nonpolar, polar, acidic and basic; names and abbreviations.' },
    { id: 'l17.stereo', title: 'D and L amino acids', desc: 'The chirality center, –NH₃⁺ left or right, only L in humans.' },
    { id: 'l17.acidbase', title: 'Zwitterions & pH', desc: 'Isoelectric pH; net charge at low and high pH.' },
    { id: 'l17.peptides', title: 'Peptides', desc: 'Dipeptide to protein, peptide bonds, N-terminal and C-terminal ends.' },
    { id: 'l17.draw', title: 'Drawing a dipeptide', desc: 'Join COO⁻ to NH₃⁺, lose water, and get the order right.' },
    { id: 'l17.body', title: 'Peptides in the body', desc: 'Enkephalins, disulfide bonds, oxytocin and vasopressin.' },
  ],
  sections: [
    {
      id: 'proteins',
      title: 'Proteins: what they are and do',
      minutes: 5,
      blocks: [
        { t: 'list', items: ['Proteins account for **50%** of the dry weight of the human body.', 'Unlike lipids and carbohydrates, proteins are **not stored**, so they **must be consumed daily**.', 'The recommended daily intake for adults is **0.8 grams of protein per kg of body weight** (more is needed for children).', 'Dietary protein comes from eating **meat and milk**.', 'Proteins carry out many biological functions.'] },
        {
          t: 'example', title: 'Worked example: daily protein', prompt: 'How much protein does a 70-kg adult need each day?',
          steps: ['Use the recommended intake: 0.8 g per kg of body weight.', '70 kg × 0.8 g/kg = 56 g.'],
          answer: '**56 g** of protein per day',
        },
        {
          t: 'table', head: ['Protein', 'What it does'],
          rows: [
            ['**Hemoglobin**', '**transport** protein that carries O₂ in the blood'],
            ['**Myoglobin**', 'protein that **stores O₂ in tissues**'],
            ['**Collagen**', '**fibrous** protein in connective tissue; found in tendons, bone, cartilage and blood vessels'],
            ['**Keratin**', '**fibrous** protein in hair, skin and nails'],
            ['**Ferritin**', 'protein that **stores iron** in the liver'],
            ['**Actin and myosin**', 'proteins that control **muscle contractions**'],
            ['**Insulin**', 'protein **hormone** synthesized in the pancreas; controls blood glucose levels'],
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Hemoglobin **h**auls O₂ through the blood; **m**yoglobin keeps it in the **m**uscle tissue. **Fe**rritin stores **Fe** (iron).' },
        { t: 'h', text: 'Chains of amino acids' },
        { t: 'list', items: ['**Proteins** are biomolecules that contain many **amino acids** connected in a chain. Amino acids are the **building blocks** of proteins.', 'The amino acids are joined by **amide (peptide) bonds**.', 'An **amide bond** connects a **carbonyl** to a **nitrogen**.'] },
        { t: 'peptides', items: [{ rs: ['R1', 'R2', 'R3', 'R4'], c: 'OH', n: 'H2N', caption: 'A stretch of protein. The amide bonds are shown in color.' }] },
        {
          t: 'check', q: {
            id: 'l17-c-store', skill: 'l17.proteins', type: 'mc', prompt: 'Why must protein be eaten every day?',
            choices: ['Unlike lipids and carbohydrates, proteins are not stored', 'Proteins are stored only in the liver', 'Proteins turn directly into glycogen', 'The body cannot make peptide bonds'], answer: 0,
            explain: 'Proteins are **not stored**, so they must be consumed daily: 0.8 g per kg of body weight for adults.',
          },
        },
      ],
    },
    {
      id: 'structure',
      title: 'General features of amino acids',
      minutes: 5,
      blocks: [
        { t: 'p', text: 'Amino acids contain two functional groups: an **amino group (NH₂)** and a **carboxyl group (COOH)**. Both are attached to the **α-carbon**. In humans there are **20 amino acids**, each with a unique **R group**.' },
        { t: 'peptides', items: [{ rs: ['R'], n: 'H2N', c: 'OH', caption: 'General amino acid: H₂N on one side of the α carbon (the CH), COOH on the other, R below' }] },
        { t: 'p', text: 'The R group, called the **side chain**, determines the **identity** of the amino acid and its **chemical properties**.' },
        {
          t: 'peptides', items: [
            { rs: ['H'], n: 'H2N', c: 'OH', caption: '**Glycine**, the simplest: R = H' },
            { rs: ['CH3'], n: 'H2N', c: 'OH', caption: '**Alanine**: R = CH₃' },
          ],
        },
        {
          t: 'compare', items: [
            { title: 'Is there a chiral center in glycine?', text: '**No.** The α carbon has **two H atoms** (its own H and R = H), so it does not have four different groups.' },
            { title: 'Is there a chiral center in alanine?', text: '**Yes.** The α carbon has four different groups: NH₂, COOH, H and CH₃.' },
          ],
        },
        {
          t: 'check', q: {
            id: 'l17-c-alpha', skill: 'l17.structure', type: 'mc', prompt: 'The amino group and the carboxyl group of an amino acid are attached to the…',
            choices: ['α carbon', 'R group', 'β carbon', 'carbonyl carbon'], answer: 0,
            explain: 'Both are attached to the **α carbon**, along with an H and the R group.',
          },
        },
      ],
    },
    {
      id: 'sidechains',
      title: 'The 20 amino acids',
      minutes: 10,
      blocks: [
        { t: 'p', text: 'The side chains sort the 20 amino acids into groups. Each is drawn here the way the slide draws it, with its side chain shaded. Learn each name with its three-letter and one-letter abbreviation.' },
        {
          t: 'table', head: ['Amino acid', '3-letter', '1-letter', 'Side chain'],
          rows: AMINO_ACIDS.map((a) => [a.name, `**${a.three}**`, a.one, { nonpolar: 'nonpolar', polar: 'polar', acidic: 'charged: **acidic**', basic: 'charged: **basic**' }[a.cls]]),
        },
        { t: 'h', text: 'Nonpolar side chains' },
        { t: 'mols', items: chartOf('nonpolar') },
        { t: 'callout', kind: 'tip', title: 'Spotting nonpolar', text: 'Only **C and H** in the side chain (with the sulfur of methionine, the ring NH of tryptophan and the ring of proline as the ones to memorize).' },
        { t: 'h', text: 'Polar side chains' },
        { t: 'mols', items: chartOf('polar') },
        { t: 'callout', kind: 'tip', title: 'Spotting polar', text: 'An **OH** (serine, threonine, tyrosine), an **SH** (cysteine) or an **amide CONH₂** (asparagine, glutamine), with no charge.' },
        { t: 'h', text: 'Electrically charged side chains' },
        { t: 'mols', items: [...chartOf('acidic'), ...chartOf('basic')] },
        { t: 'compare', items: [{ title: 'Acidic (−)', text: 'A second **COO⁻**: **aspartate** and **glutamate**.' }, { title: 'Basic (+)', text: 'A second **N with a + charge**: **lysine**, **arginine** and **histidine**.' }] },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Basic: "**L**ook **A**t **H**im": **L**ysine, **A**rginine, **H**istidine. Acidic: the two names ending in **-ate**, like other carboxylates: aspart**ate** and glutam**ate**.' },
        { t: 'callout', kind: 'warn', title: 'Easy abbreviations to mix up', text: '**Asp** (aspartate, acidic) vs **Asn** (asparagine, polar). **Glu** (glutamate, acidic) vs **Gln** (glutamine, polar). One-letter: **F** = Phe, **W** = Trp, **Y** = Tyr, **K** = Lys, **D** = Asp, **E** = Glu, **N** = Asn, **Q** = Gln, **R** = Arg.' },
        {
          t: 'check', q: {
            id: 'l17-c-class', skill: 'l17.sidechains', type: 'mc', prompt: 'What kind of side chain does this amino acid have?',
            figure: { smiles: '[NH3+]C(CCCC[NH3+])C(=O)[O-]', highlight: [2, 3, 4, 5, 6] }, choices: ['basic (charged +)', 'acidic (charged −)', 'polar', 'nonpolar'], answer: 0, shuffle: false,
            explain: 'This is **lysine**: its side chain ends in a charged **NH₃⁺**, so it is **basic**.',
          },
        },
      ],
    },
    {
      id: 'stereo',
      title: 'D and L amino acids',
      minutes: 4,
      blocks: [
        { t: 'p', text: 'All amino acids (save **glycine**) have a **chirality center on the α carbon**.' },
        {
          t: 'sugars', items: [
            { top: 'COO⁻', rows: [['H3N⁺', 'H']], bottom: 'CH3', caption: '**L**-alanine: –NH₃⁺ on the **left**. The naturally occurring enantiomer' },
            { top: 'COO⁻', rows: [['H', 'NH3⁺']], bottom: 'CH3', caption: '**D**-alanine: –NH₃⁺ on the **right**' },
          ],
        },
        { t: 'list', items: ['**L** amino acids have the –NH₃⁺ group on the **left**.', '**D** amino acids have the –NH₃⁺ group on the **right**.', '**Only L amino acids are found in humans.**'] },
        { t: 'callout', kind: 'memory', title: 'Compare with sugars', text: 'It is the same Fischer projection idea as Lecture 15, with the opposite everyday result: natural **sugars are D**, natural **amino acids are L**. L = **L**eft.' },
        {
          t: 'check', q: {
            id: 'l17-c-dl', skill: 'l17.stereo', type: 'mc', prompt: 'Is this amino acid D or L?',
            figure: { sugars: [{ top: 'COO⁻', rows: [['H', 'NH3⁺']], bottom: 'CH2OH' }] }, choices: ['D', 'L'], answer: 0, shuffle: false,
            explain: 'The –NH₃⁺ is on the **right** → **D**. (This is D-serine, which is not one of the amino acids found in humans.)',
          },
        },
      ],
    },
    {
      id: 'acid-base',
      title: 'Zwitterions & acid–base behavior',
      minutes: 7,
      blocks: [
        { t: 'p', text: 'Since amino acids contain a **base (NH₂)** and an **acid (COOH)**, a **proton transfers from the acid to the base** to form a **zwitterion**, which has a (+) and a (−) charge in the same compound.' },
        {
          t: 'peptides', items: [
            { rs: ['R'], n: 'H2N', c: 'OH', caption: 'This neutral form of an amino acid does **not** exist' },
            { rs: ['R'], caption: 'The **zwitterion**, a salt, is the neutral form of an amino acid' },
          ],
        },
        { t: 'p', text: 'An amino acid exists as a neutrally charged zwitterion at a certain pH, the **isoelectric pH**. It can exist in different forms, depending on the pH of the aqueous environment.' },
        {
          t: 'peptides', items: [
            { rs: ['CH3'], c: 'OH', caption: 'pH ≤ 2. **Overall +1**' },
            { rs: ['CH3'], caption: 'pH ≈ 6, the isoelectric pH of alanine. **No net charge**' },
            { rs: ['CH3'], n: 'H2N', caption: 'pH ≥ 10. **Overall −1**' },
          ],
          caption: 'Alanine at low, middle and high pH.',
        },
        {
          t: 'table', head: ['', 'pH < isoelectric pH', 'pH = isoelectric pH', 'pH > isoelectric pH'],
          rows: [
            ['What happened', 'adding acid: **COO⁻ gains a proton**', 'neither', 'adding base: **NH₃⁺ loses a proton**'],
            ['Amino end', '–NH₃⁺', '–NH₃⁺', '–NH₂'],
            ['Acid end', '–COOH', '–COO⁻', '–COO⁻'],
            ['Net charge', '**+1**', '**0**', '**−1**'],
          ],
        },
        { t: 'callout', kind: 'key', title: 'The rule from the slides', text: '**Low pH = more acid**: COO⁻ will be COOH and –NH₂ will be –NH₃⁺.\n**High pH = more base**: COOH will be COO⁻ and –NH₃⁺ will be –NH₂.' },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Acid is full of H⁺, so at low pH **everything has its H on**. Base grabs H⁺, so at high pH **everything has lost it**.' },
        {
          t: 'check', q: {
            id: 'l17-c-ph', skill: 'l17.acidbase', type: 'mc', prompt: 'What is the net charge of alanine at pH 1?',
            choices: ['+1', '0', '−1', '+2'], answer: 0, shuffle: false,
            explain: 'pH 1 is below the isoelectric pH, so the COO⁻ picks up a proton: –NH₃⁺ and –COOH → **+1**.',
          },
        },
      ],
    },
    {
      id: 'peptides',
      title: 'Peptides',
      minutes: 7,
      blocks: [
        { t: 'p', text: '**Peptides** and **proteins** are formed when amino acids are joined together by **amide (peptide) bonds**. The amide bond is called a **peptide bond**.' },
        {
          t: 'table', head: ['Name', 'Amino acids', 'Peptide bonds'],
          rows: [['**Dipeptide**', '2', '1'], ['**Tripeptide**', '3', '2'], ['**Polypeptide**', 'many', 'many'], ['**Protein**', '**more than 40** (proteins are large polypeptides)', 'one fewer than the amino acids']],
        },
        { t: 'peptides', items: [{ rs: ['R1', 'R2'], caption: 'A dipeptide' }, { rs: ['R1', 'R2', 'R3'], caption: 'A tripeptide' }] },
        { t: 'callout', kind: 'warn', title: 'Slide wording to watch', text: 'The tripeptide slide says "joined together by one amide bond", but its own drawing shows **two**. The rule: **n amino acids → n − 1 peptide bonds**.' },
        { t: 'h', text: 'N-terminal and C-terminal' },
        { t: 'list', items: ['The amino acid with the free **–NH₃⁺** group is the **N-terminal** amino acid and is written on the **left**.', 'The amino acid with the free **–COO⁻** group is the **C-terminal** amino acid and is written on the **right**.'] },
        {
          t: 'peptides', items: [
            { seq: ['Ala', 'Ser'], caption: '**alanylserine**, Ala–Ser. N-terminal: Ala. C-terminal: Ser' },
            { seq: ['Ser', 'Ala'], caption: '**serylalanine**, Ser–Ala. N-terminal: Ser. C-terminal: Ala' },
          ],
        },
        { t: 'callout', kind: 'exam', title: 'Order matters', text: 'Two amino acids can combine in **two ways**. Ala–Ser and Ser–Ala are **different compounds**. In the name, the N-terminal amino acid comes first and ends in **-yl**.' },
        {
          t: 'check', q: {
            id: 'l17-c-term', skill: 'l17.peptides', type: 'mc', prompt: 'In Tyr–Gly–Phe, which is the N-terminal amino acid?',
            choices: ['Tyr', 'Gly', 'Phe', 'none of them'], answer: 0, shuffle: false,
            explain: 'The sequence is written with the N-terminal amino acid on the **left**: **Tyr**. Phe, on the right, is the C-terminal amino acid.',
          },
        },
      ],
    },
    {
      id: 'draw',
      title: 'How to draw a dipeptide',
      minutes: 5,
      blocks: [
        { t: 'callout', kind: 'key', title: 'To form a peptide bond', text: 'Remove **one O** from COO⁻, remove **two H** from –NH₃⁺, and connect **C to N**. Those atoms leave as **H₂O**.' },
        {
          t: 'steps', title: 'HOW TO draw a dipeptide from two amino acids (Val + Gly → Val–Gly)', items: [
            '**Place the two groups next to each other.** Draw the first amino acid with its –COO⁻ facing the –NH₃⁺ of the second. The first one named goes on the **left**.',
            '**Join the adjacent –COO⁻ and –NH₃⁺ groups.** Remove one O and two H (they leave as H₂O), and connect the C to the N.',
            '**Check the ends.** The left end still has its free –NH₃⁺ (N-terminal) and the right end its free –COO⁻ (C-terminal). The new N keeps **one H**.',
          ],
        },
        { t: 'peptides', items: [{ seq: ['Val'], caption: 'Val' }, { seq: ['Gly'], caption: 'Gly' }], caption: 'Step 1: the –COO⁻ of Val sits next to the –NH₃⁺ of Gly.' },
        { t: 'peptides', items: [{ seq: ['Val', 'Gly'], caption: 'Val–Gly + H₂O' }], caption: 'The final answer. The new amide bond is in color.' },
        { t: 'callout', kind: 'tip', title: 'A slide typo', text: 'One slide writes "remove two H from NH4+". It means the **–NH₃⁺** group, as the other slide says.' },
        {
          t: 'example', title: 'Worked example: the other order', prompt: 'Ala and Ser are combined so that Ser comes first. What do you draw?',
          steps: ['Ser goes on the left, so it keeps the free –NH₃⁺.', 'Join the –COO⁻ of Ser to the –NH₃⁺ of Ala; H₂O leaves.', 'Ala is on the right, so it keeps the free –COO⁻.'],
          answer: '**Ser–Ala** (serylalanine): CH₂OH on the left residue, CH₃ on the right',
        },
        {
          t: 'check', q: {
            id: 'l17-c-draw', skill: 'l17.draw', type: 'mc', prompt: 'What leaves when a peptide bond forms?',
            choices: ['H₂O', 'CO₂', 'NH₃', 'H₂'], answer: 0,
            explain: 'One O from COO⁻ and two H from –NH₃⁺ leave together as **H₂O**.',
          },
        },
      ],
    },
    {
      id: 'enkephalins',
      title: 'Enkephalins & pain relief',
      minutes: 4,
      blocks: [
        { t: 'list', items: ['**Enkephalins** are **pentapeptides** made in the brain. They act as **pain killers and sedatives** by **binding to pain receptors**.', 'The addictive drugs **morphine and heroin** bind to these **same pain receptors**, producing a similar physiological response, though **longer lasting**.', 'Enkephalins belong to the family of polypeptides called **endorphins**, known for their **pain reducing and mood enhancing** effects.'] },
        { t: 'peptides', items: [{ seq: ['Tyr', 'Gly', 'Gly', 'Phe', 'Met'], caption: '**Met-enkephalin**: Tyr–Gly–Gly–Phe–**Met**. 5 amino acids' }, { seq: ['Tyr', 'Gly', 'Gly', 'Phe', 'Leu'], caption: '**Leu-enkephalin**: Tyr–Gly–Gly–Phe–**Leu**' }] },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'The two enkephalins differ only at the **C-terminal** amino acid, and the name tells you which one: **Met**-enkephalin ends in **Met**, **Leu**-enkephalin ends in **Leu**.' },
        {
          t: 'check', q: {
            id: 'l17-c-enk', skill: 'l17.body', type: 'num', prompt: 'How many amino acids are there in met-enkephalin?',
            answer: 5, tol: 0, explain: '**5**: Tyr–Gly–Gly–Phe–Met. *Penta*peptide = five.',
          },
        },
      ],
    },
    {
      id: 'disulfide',
      title: 'Cysteine & disulfide bonds',
      minutes: 3,
      blocks: [
        { t: 'list', items: ['**Cysteine** contains a **sulfhydryl group (SH)** in its side chain.', 'It can form **"disulfide" bonds**.', '**2 cysteines can join to connect two parts of a protein that are far away.**', 'Example: **insulin**.'] },
        { t: 'mols', items: [{ smiles: '[NH3+]C(CS)C(=O)[O-]', highlight: [3], caption: 'cysteine: SH in the side chain' }, { smiles: '[NH3+]C(CSSCC([NH3+])C(=O)[O-])C(=O)[O-]', highlight: [3, 4], caption: 'two cysteines joined by a disulfide bond', scale: 28 }] },
        { t: 'callout', kind: 'tip', title: 'You have seen this reaction', text: 'Lecture 6: two thiols (R–SH) are oxidized to a **disulfide (R–S–S–R)**. Here the two R groups are cysteine side chains in a protein.' },
        {
          t: 'check', q: {
            id: 'l17-c-ss', skill: 'l17.body', type: 'mc', prompt: 'Which amino acid forms disulfide bonds?',
            choices: ['cysteine', 'serine', 'glycine', 'lysine'], answer: 0,
            explain: '**Cysteine**: its sulfhydryl (SH) side chain can join another cysteine\'s, even from a far-away part of the protein.',
          },
        },
      ],
    },
    {
      id: 'hormones',
      title: 'Peptide hormones: oxytocin & vasopressin',
      minutes: 5,
      blocks: [
        { t: 'p', text: '**Oxytocin** and **vasopressin** are **cyclic nonapeptide** hormones (nine amino acids), with identical sequences **except for two amino acids**. A disulfide bond between the two cysteines closes each ring.' },
        {
          t: 'compare', items: [
            { title: 'Oxytocin', text: 'Cys–Tyr–**Ile**–Gln–Asn–Cys–Pro–**Leu**–GlyNH₂\n\nStimulates the **contraction of uterine muscles** and signals for **milk production**; it is often used to **induce labor**. After delivery it causes weak contractions that return the uterus to its normal size, and weak contractions in the breast that make milk available to a nursing infant.' },
            { title: 'Vasopressin', text: 'Cys–Tyr–**Phe**–Gln–Asn–Cys–Pro–**Arg**–GlyNH₂\n\nAlso called **antidiuretic hormone (ADH)**. It **targets the kidneys** and helps **limit urine production** to keep body fluids up during dehydration: the kidneys retain fluid, so urine output decreases.' },
          ],
        },
        { t: 'callout', kind: 'key', title: 'Small change, big effect', text: 'The slightly different sequence gives the two peptides **vastly different effects** on the body. Both are secreted by the **pituitary gland**.' },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'A **diuretic** makes you urinate; an **anti**diuretic (ADH) stops it. **Oxy**tocin: think **"o"** for **"obstetrics"**: labor and milk.' },
        {
          t: 'check', q: {
            id: 'l17-c-horm', skill: 'l17.body', type: 'mc', prompt: 'Which hormone limits urine production during dehydration?',
            choices: ['vasopressin (ADH)', 'oxytocin', 'met-enkephalin', 'insulin'], answer: 0,
            explain: '**Vasopressin**, antidiuretic hormone, targets the kidneys so they retain fluid.',
          },
        },
      ],
    },
  ],
  questions: [
    // proteins
    { id: 'l17-q01', skill: 'l17.proteins', type: 'mc', prompt: 'Proteins account for about what share of the dry weight of the human body?', choices: ['50%', '5%', '20%', '90%'], answer: 0, explain: '**50%** of the dry weight.' },
    { id: 'l17-q02', skill: 'l17.proteins', type: 'num', prompt: 'At 0.8 g of protein per kg, how many grams of protein per day does a 50-kg adult need?', answer: 40, tol: 0.01, placeholder: 'grams', explain: '50 kg × 0.8 g/kg = **40 g**.' },
    { id: 'l17-q03', skill: 'l17.proteins', type: 'match', prompt: 'Match each protein with its job.', left: ['hemoglobin', 'myoglobin', 'ferritin', 'keratin'], right: ['carries O₂ in the blood', 'stores O₂ in tissues', 'stores iron in the liver', 'fibrous protein in hair, skin and nails'], answer: [0, 1, 2, 3], explain: 'Hemoglobin transports O₂; myoglobin stores it; ferritin stores iron; keratin is in hair, skin and nails.' },
    { id: 'l17-q04', skill: 'l17.proteins', type: 'mc', prompt: 'Which proteins control muscle contractions?', choices: ['actin and myosin', 'collagen and keratin', 'ferritin and insulin', 'hemoglobin and myoglobin'], answer: 0, explain: '**Actin and myosin** control muscle contractions.' },
    { id: 'l17-q05', skill: 'l17.proteins', type: 'mc', prompt: 'An amide bond connects…', choices: ['a carbonyl to a nitrogen', 'a carbonyl to an oxygen', 'two nitrogens', 'two sulfurs'], answer: 0, explain: 'An **amide bond** connects a **carbonyl to a nitrogen**.' },
    // structure
    { id: 'l17-q06', skill: 'l17.structure', type: 'multi', prompt: 'Select what is attached to the α carbon of an amino acid.', choices: ['an amino group', 'a carboxyl group', 'an H', 'an R group', 'a phosphate'], answer: [0, 1, 2, 3], explain: 'NH₂, COOH, H and R. No phosphate: that is phospholipids.' },
    { id: 'l17-q07', skill: 'l17.structure', type: 'mc', prompt: 'What determines the identity of an amino acid?', choices: ['its R group (side chain)', 'its amino group', 'its carboxyl group', 'its α carbon'], answer: 0, explain: 'Every amino acid has the same backbone. The **R group** makes each one different.' },
    { id: 'l17-q08', skill: 'l17.structure', type: 'num', prompt: 'How many amino acids are there in humans?', answer: 20, tol: 0, explain: '**20**, each with a unique R group.' },
    { id: 'l17-q09', skill: 'l17.structure', type: 'tf', prompt: 'True or false: glycine has a chirality center.', figure: { peptides: [{ rs: ['H'], n: 'H2N', c: 'OH' }] }, answer: false, explain: '**False.** R = H, so the α carbon has two H atoms and is not a chirality center.' },
    { id: 'l17-q10', skill: 'l17.structure', type: 'mc', prompt: 'What is the side chain of alanine?', choices: ['CH₃', 'H', 'CH₂OH', 'CH₂SH'], answer: 0, explain: 'Alanine: R = **CH₃**. Glycine: R = H.' },
    // side chains
    { id: 'l17-q11', skill: 'l17.sidechains', type: 'multi', prompt: 'Select the amino acids with **acidic** side chains.', choices: ['aspartate', 'glutamate', 'lysine', 'asparagine', 'serine'], answer: [0, 1], explain: '**Aspartate** and **glutamate** have a second COO⁻. Asparagine is polar (an amide), lysine is basic.' },
    { id: 'l17-q12', skill: 'l17.sidechains', type: 'multi', prompt: 'Select the amino acids with **basic** side chains.', choices: ['lysine', 'arginine', 'histidine', 'glutamine', 'alanine'], answer: [0, 1, 2], explain: '**Lysine, arginine, histidine**. Glutamine is polar, alanine is nonpolar.' },
    { id: 'l17-q13', skill: 'l17.sidechains', type: 'match', prompt: 'Match each abbreviation with its amino acid.', left: ['Asp', 'Asn', 'Glu', 'Gln'], right: ['aspartate', 'asparagine', 'glutamate', 'glutamine'], answer: [0, 1, 2, 3], explain: 'The pairs to watch: Asp vs Asn; Glu vs Gln. The acidic ones are the -ate names.' },
    { id: 'l17-q14', skill: 'l17.sidechains', type: 'mc', prompt: 'Which amino acid has an SH in its side chain?', choices: ['cysteine', 'methionine', 'serine', 'threonine'], answer: 0, explain: '**Cysteine**: CH₂SH. Methionine has sulfur too, but as CH₂CH₂SCH₃, with no S–H.' },
    { id: 'l17-q15', skill: 'l17.sidechains', type: 'mc', prompt: 'Identify this amino acid.', figure: { smiles: '[NH3+]C(Cc1ccc(O)cc1)C(=O)[O-]', highlight: [2, 3, 4, 5, 6, 7, 8, 9] }, choices: ['tyrosine', 'phenylalanine', 'tryptophan', 'histidine'], answer: 0, explain: 'A benzene ring with an **OH** → **tyrosine**. Phenylalanine has the ring but no OH.' },
    { id: 'l17-q16', skill: 'l17.sidechains', type: 'tf', prompt: 'True or false: the R group determines the chemical properties of an amino acid.', answer: true, explain: '**True**, from the slides. The backbone is the same in all of them.' },
    // stereo
    { id: 'l17-q17', skill: 'l17.stereo', type: 'mc', prompt: 'Which amino acid has no chirality center on its α carbon?', choices: ['glycine', 'alanine', 'serine', 'valine'], answer: 0, explain: '**Glycine** (R = H). All the others have one.' },
    { id: 'l17-q18', skill: 'l17.stereo', type: 'mc', prompt: 'Which amino acids are found in humans?', choices: ['only L', 'only D', 'both D and L equally', 'neither'], answer: 0, shuffle: false, explain: '**Only L amino acids** are found in humans. (Natural sugars are the opposite: D.)' },
    { id: 'l17-q19', skill: 'l17.stereo', type: 'mc', prompt: 'Is this amino acid D or L?', figure: { sugars: [{ top: 'COO⁻', rows: [['H3N⁺', 'H']], bottom: 'CH3' }] }, choices: ['L', 'D'], answer: 0, shuffle: false, explain: '–NH₃⁺ on the **left** → **L**-alanine, the naturally occurring form.' },
    { id: 'l17-q20', skill: 'l17.stereo', type: 'tf', prompt: 'True or false: D-alanine and L-alanine are enantiomers.', answer: true, explain: '**True.** They are mirror images, as the slide shows.' },
    // acid-base
    { id: 'l17-q21', skill: 'l17.acidbase', type: 'mc', prompt: 'A zwitterion has…', choices: ['a + and a − charge in the same compound', 'only a + charge', 'only a − charge', 'no charged groups at all'], answer: 0, explain: '–NH₃⁺ and –COO⁻ in one molecule. The net charge is zero.' },
    { id: 'l17-q22', skill: 'l17.acidbase', type: 'mc', prompt: 'The isoelectric pH is the pH at which an amino acid…', choices: ['is a neutrally charged zwitterion', 'has a net + charge', 'has a net − charge', 'breaks down'], answer: 0, explain: 'At the isoelectric pH, the charges cancel: a **neutral zwitterion**.' },
    { id: 'l17-q23', skill: 'l17.acidbase', type: 'mc', prompt: 'When acid is added to a zwitterion, what picks up a proton?', choices: ['the carboxylate anion (COO⁻)', 'the ammonium cation (NH₃⁺)', 'the R group H', 'the α carbon'], answer: 0, explain: 'COO⁻ becomes COOH, which leaves a net **+1** charge.' },
    { id: 'l17-q24', skill: 'l17.acidbase', type: 'mc', prompt: 'When base is added to a zwitterion, what loses a proton?', choices: ['the ammonium cation (NH₃⁺)', 'the carboxylate anion (COO⁻)', 'the α carbon', 'nothing'], answer: 0, explain: 'NH₃⁺ becomes NH₂, which leaves a net **−1** charge.' },
    { id: 'l17-q25', skill: 'l17.acidbase', type: 'mc', prompt: 'What is the net charge of this form of alanine?', figure: { peptides: [{ rs: ['CH3'], n: 'H2N' }] }, choices: ['−1', '0', '+1', '−2'], answer: 0, shuffle: false, explain: 'NH₂ has no charge and COO⁻ is −1, so the net charge is **−1**. This is the form at pH ≥ 10.' },
    { id: 'l17-q26', skill: 'l17.acidbase', type: 'tf', prompt: 'True or false: the uncharged form H₂N–CHR–COOH is how an amino acid actually exists.', answer: false, explain: '**False.** The slide says that this neutral form does **not** exist. The zwitterion is the neutral form.' },
    // peptides
    { id: 'l17-q27', skill: 'l17.peptides', type: 'mc', prompt: 'How many amino acids does a dipeptide have?', choices: ['2', '1', '3', '40'], answer: 0, shuffle: false, explain: 'Two amino acids, joined by one peptide bond.' },
    { id: 'l17-q28', skill: 'l17.peptides', type: 'num', prompt: 'How many peptide bonds does a tripeptide have?', figure: { peptides: [{ rs: ['R1', 'R2', 'R3'] }] }, answer: 2, tol: 0, explain: 'n amino acids → n − 1 bonds: **2**. The drawing shows both.' },
    { id: 'l17-q29', skill: 'l17.peptides', type: 'mc', prompt: 'A protein has more than how many amino acids?', choices: ['40', '4', '10', '500'], answer: 0, shuffle: false, explain: 'Proteins are large polypeptides, with **more than 40** amino acids.' },
    { id: 'l17-q30', skill: 'l17.peptides', type: 'mc', prompt: 'The C-terminal amino acid has a free…', choices: ['–COO⁻ and is written on the right', '–COO⁻ and is written on the left', '–NH₃⁺ and is written on the right', '–NH₃⁺ and is written on the left'], answer: 0, explain: 'C-terminal: free –COO⁻, on the **right**. N-terminal: free –NH₃⁺, on the **left**.' },
    { id: 'l17-q31', skill: 'l17.peptides', type: 'tf', prompt: 'True or false: Ala–Ser and Ser–Ala are the same compound.', answer: false, explain: '**False.** Alanylserine has its free NH₃⁺ on Ala; serylalanine has it on Ser. They are different.' },
    { id: 'l17-q32', skill: 'l17.peptides', type: 'mc', prompt: 'What is the name of Ser–Ala?', choices: ['serylalanine', 'alanylserine', 'serinylalanine', 'alanineserine'], answer: 0, explain: 'The N-terminal amino acid comes first and ends in **-yl**: **seryl**alanine.' },
    // draw
    { id: 'l17-q33', skill: 'l17.draw', type: 'mc', prompt: 'To form a peptide bond, you remove…', choices: ['one O from COO⁻ and two H from –NH₃⁺', 'one H from COO⁻ and one O from –NH₃⁺', 'the whole COO⁻ group', 'the R groups'], answer: 0, explain: 'Remove **one O** from COO⁻ and **two H** from –NH₃⁺, then connect C to N. They leave as water.' },
    { id: 'l17-q34', skill: 'l17.draw', type: 'mc', prompt: 'Which group of the second amino acid joins the –COO⁻ of the first?', choices: ['–NH₃⁺', '–COO⁻', 'the R group', 'the α hydrogen'], answer: 0, explain: 'The –COO⁻ of one and the –NH₃⁺ of the other join to make the amide.' },
    { id: 'l17-q35', skill: 'l17.draw', type: 'mc', prompt: 'How many H atoms does the N of a peptide bond keep?', figure: { peptides: [{ seq: ['Val', 'Gly'] }] }, choices: ['1', '0', '2', '3'], answer: 0, shuffle: false, explain: '–NH₃⁺ loses **two** of its three H atoms, leaving **one** on the amide N.' },
    { id: 'l17-q36', skill: 'l17.draw', type: 'mc', prompt: 'Name this dipeptide, using three-letter names.', figure: { peptides: [{ seq: ['Val', 'Gly'] }] }, choices: ['Val–Gly', 'Gly–Val', 'Ala–Gly', 'Val–Ala'], answer: 0, explain: 'The free –NH₃⁺ is on the left with R = CH(CH₃)₂ (Val); the right residue has R = H (Gly). **Val–Gly**.' },
    // body
    { id: 'l17-q37', skill: 'l17.body', type: 'mc', prompt: 'Enkephalins relieve pain by…', choices: ['binding to pain receptors', 'hydrolyzing glycogen', 'blocking COX-2', 'forming disulfide bonds with morphine'], answer: 0, explain: 'These **pentapeptides** made in the brain bind to **pain receptors**.' },
    { id: 'l17-q38', skill: 'l17.body', type: 'mc', prompt: 'Why do morphine and heroin produce effects like enkephalins?', choices: ['They bind to the same pain receptors', 'They are pentapeptides', 'They are made in the brain', 'They break down into enkephalins'], answer: 0, explain: 'They bind to the **same pain receptors**, with a similar but **longer lasting** response.' },
    { id: 'l17-q39', skill: 'l17.body', type: 'mc', prompt: 'Met-enkephalin and leu-enkephalin differ in…', choices: ['the C-terminal amino acid', 'the N-terminal amino acid', 'the number of amino acids', 'nothing at all'], answer: 0, explain: 'Tyr–Gly–Gly–Phe–**Met** vs Tyr–Gly–Gly–Phe–**Leu**.' },
    { id: 'l17-q40', skill: 'l17.body', type: 'mc', prompt: 'Enkephalins belong to which family of polypeptides?', choices: ['endorphins', 'statins', 'eicosanoids', 'glycosaminoglycans'], answer: 0, explain: '**Endorphins**: known for pain reducing and mood enhancing effects.' },
    { id: 'l17-q41', skill: 'l17.body', type: 'mc', prompt: 'What do disulfide bonds do in a protein?', choices: ['Connect two parts of a protein that are far away', 'Join the N-terminal to the α carbon', 'Store iron', 'Carry oxygen'], answer: 0, explain: 'Two **cysteines** join through S–S, connecting distant parts of the chain, as in insulin.' },
    { id: 'l17-q42', skill: 'l17.body', type: 'mc', prompt: 'Oxytocin and vasopressin are nonapeptides. How many amino acids is that, and how many differ between them?', choices: ['9 amino acids; 2 differ', '9 amino acids; 1 differs', '5 amino acids; 2 differ', '19 amino acids; 9 differ'], answer: 0, explain: '**Nona** = 9. Their sequences are identical except for **two** amino acids.' },
    { id: 'l17-q43', skill: 'l17.body', type: 'multi', prompt: 'Which amino acids in oxytocin are different in vasopressin?', choices: ['Ile', 'Leu', 'Cys', 'Tyr', 'Gln'], answer: [0, 1], explain: 'Oxytocin has **Ile** and **Leu** where vasopressin has **Phe** and **Arg**.' },
    { id: 'l17-q44', skill: 'l17.body', type: 'match', prompt: 'Match each hormone with its effect.', left: ['oxytocin', 'vasopressin'], right: ['contracts uterine muscles and signals for milk production', 'makes the kidneys retain fluid, decreasing urine output'], answer: [0, 1], explain: 'Oxytocin: labor and milk. Vasopressin (ADH): kidneys, less urine.' },
  ],
  cards: [
    { id: 'l17-k01', front: 'Daily protein needs', back: 'Proteins are **not stored**. Adults: **0.8 g per kg** of body weight per day (more for children). From **meat and milk**.' },
    { id: 'l17-k02', front: 'Hemoglobin vs myoglobin', back: 'Hemoglobin **carries O₂ in the blood**. Myoglobin **stores O₂ in tissues**.' },
    { id: 'l17-k03', front: 'Collagen vs keratin', back: 'Both **fibrous**. Collagen: connective tissue (tendons, bone, cartilage, blood vessels). Keratin: hair, skin, nails.' },
    { id: 'l17-k04', front: 'Ferritin; actin and myosin; insulin', back: 'Ferritin **stores iron** in the liver. Actin and myosin control **muscle contractions**. Insulin: hormone from the **pancreas**; controls blood glucose.' },
    { id: 'l17-k05', front: 'Amino acid structure', back: 'An **amino group** and a **carboxyl group** on the **α carbon**, plus an H and an **R group (side chain)**.' },
    { id: 'l17-k06', front: 'Glycine and alanine', back: 'Glycine: R = **H**, no chirality center. Alanine: R = **CH₃**, has one.' },
    { id: 'l17-k07', front: 'Nonpolar amino acids', back: '**Gly, Ala, Val, Leu, Ile, Met, Phe, Trp, Pro**.' },
    { id: 'l17-k08', front: 'Polar amino acids', back: '**Ser, Thr, Cys, Tyr, Asn, Gln**.' },
    { id: 'l17-k09', front: 'Acidic amino acids', back: '**Aspartate (Asp, D)** and **glutamate (Glu, E)**: a second COO⁻.' },
    { id: 'l17-k10', front: 'Basic amino acids', back: '**Lysine (Lys, K), arginine (Arg, R), histidine (His, H)**: a side chain N with a + charge.' },
    { id: 'l17-k11', front: 'D vs L amino acids', back: '–NH₃⁺ on the **left = L**, **right = D**. **Only L** in humans. All but glycine have a chirality center.' },
    { id: 'l17-k12', front: 'Zwitterion', back: 'A (+) and a (−) charge in one compound: –NH₃⁺ and –COO⁻. Formed by proton transfer from acid to base.' },
    { id: 'l17-k13', front: 'Isoelectric pH', back: 'The pH at which an amino acid is a **neutrally charged zwitterion**.' },
    { id: 'l17-k14', front: 'pH below the isoelectric pH', back: 'COO⁻ gains H⁺: –NH₃⁺ and –COOH. **Net +1**.' },
    { id: 'l17-k15', front: 'pH above the isoelectric pH', back: 'NH₃⁺ loses H⁺: –NH₂ and –COO⁻. **Net −1**.' },
    { id: 'l17-k16', front: 'Peptide bond', back: 'The **amide bond** joining amino acids: carbonyl C to N. n amino acids → **n − 1** bonds.' },
    { id: 'l17-k17', front: 'Dipeptide, tripeptide, polypeptide, protein', back: '2 amino acids, 3 amino acids, many, and **more than 40**.' },
    { id: 'l17-k18', front: 'N-terminal vs C-terminal', back: 'N-terminal: free **–NH₃⁺**, written on the **left**. C-terminal: free **–COO⁻**, written on the **right**.' },
    { id: 'l17-k19', front: 'Forming a peptide bond', back: 'Remove **one O** from COO⁻ and **two H** from –NH₃⁺ (they leave as H₂O). Connect **C to N**.' },
    { id: 'l17-k20', front: 'Alanylserine vs serylalanine', back: 'Ala–Ser vs Ser–Ala: **different compounds**. The first amino acid ends in **-yl**.' },
    { id: 'l17-k21', front: 'Enkephalins', back: '**Pentapeptides** made in the brain; pain killers and sedatives. Bind the same pain receptors as morphine and heroin. A kind of **endorphin**.' },
    { id: 'l17-k22', front: 'Met- vs leu-enkephalin', back: 'Tyr–Gly–Gly–Phe–**Met** and Tyr–Gly–Gly–Phe–**Leu**.' },
    { id: 'l17-k23', front: 'Disulfide bonds', back: 'Two **cysteines** (SH side chains) join as S–S, connecting far-apart parts of a protein. Example: **insulin**.' },
    { id: 'l17-k24', front: 'Oxytocin', back: 'Cyclic nonapeptide. **Contracts uterine muscles**, signals for **milk production**; used to **induce labor**.' },
    { id: 'l17-k25', front: 'Vasopressin (ADH)', back: 'Cyclic nonapeptide. **Targets the kidneys**, limits urine output to keep body fluids up during dehydration.' },
    { id: 'l17-k26', front: 'Oxytocin vs vasopressin sequence', back: 'Identical except 2 amino acids: oxytocin **Ile, Leu**; vasopressin **Phe, Arg**.' },
  ],
  keyTerms: [
    { term: 'amino acid', def: 'A building block of proteins: an amino group and a carboxyl group on the α carbon, plus a side chain.' },
    { term: 'α carbon', def: 'The carbon bonded to the amino group, the carboxyl group, an H and the R group.' },
    { term: 'side chain', def: 'The R group, which determines the identity and properties of an amino acid.' },
    { term: 'zwitterion', def: 'A neutral compound with both a positive and a negative charge.' },
    { term: 'isoelectric pH', def: 'The pH at which an amino acid exists as a neutrally charged zwitterion.' },
    { term: 'peptide bond', def: 'The amide bond joining two amino acids.' },
    { term: 'dipeptide', def: 'Two amino acids joined by one amide bond.' },
    { term: 'polypeptide', def: 'A chain of many amino acids.' },
    { term: 'protein', def: 'A large polypeptide, with more than 40 amino acids.' },
    { term: 'N-terminal amino acid', def: 'The amino acid with the free –NH₃⁺ group, written on the left.' },
    { term: 'C-terminal amino acid', def: 'The amino acid with the free –COO⁻ group, written on the right.' },
    { term: 'enkephalin', def: 'A pentapeptide made in the brain that acts as a pain killer by binding to pain receptors.' },
    { term: 'disulfide bond', def: 'An S–S bond between two cysteine side chains.' },
    { term: 'oxytocin', def: 'A cyclic nonapeptide hormone that stimulates uterine contractions and signals for milk production.' },
    { term: 'vasopressin', def: 'A cyclic nonapeptide hormone (ADH) that makes the kidneys limit urine output.' },
  ],
};
