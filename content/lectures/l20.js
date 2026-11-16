// Lecture 20 — Nucleic Acids (Smith Ch. 22.1–22.3)
import { BASES, PARENTS, SUGAR_SMILES, nucleoSmiles } from '../../js/chem/nucleotides.js';

const base = (b) => ({ smiles: BASES[b].smiles, caption: `**${BASES[b].name}** (${b})`, scale: 28 });

export default {
  id: 'l20',
  number: 20,
  title: 'Nucleic Acids',
  subtitle: 'Nucleotides, DNA & RNA, the double helix and base pairing',
  chapter: 'Ch. 22.1–22.3',
  tested: false,
  summary: 'DNA and RNA are chains of nucleotides. Learn the three parts of a nucleotide, ribose vs 2-deoxyribose, the five bases (purines A and G; pyrimidines C, T and U), nucleoside vs nucleotide names and abbreviations like dAMP and ATP, the sugar–phosphate backbone with its 5′ and 3′ ends, and the double helix: A pairs with T by 2 hydrogen bonds, G with C by 3. Then write a complementary strand the way the exam asks.',
  skills: [
    { id: 'l20.overview', title: 'DNA, RNA & the central dogma', desc: 'Biomolecule polymers, what DNA and RNA do, chromosomes, replication, transcription, translation.' },
    { id: 'l20.parts', title: 'Parts of a nucleotide', desc: 'Sugar, base and phosphate; ribose vs 2-deoxyribose; purines vs pyrimidines; which bases go where.' },
    { id: 'l20.naming', title: 'Nucleosides & nucleotides', desc: 'Nucleoside vs nucleotide, -osine and -idine names, CMP, dAMP, ADP, ATP, dATP.' },
    { id: 'l20.strands', title: 'Polynucleotide strands', desc: 'Phosphodiester linkages, the backbone, 5′ and 3′ ends, reading 5′ → 3′.' },
    { id: 'l20.helix', title: 'Double helix & base pairing', desc: 'Antiparallel strands, A–T with 2 H-bonds, G–C with 3, complementary sequences.' },
  ],
  sections: [
    {
      id: 'overview',
      title: 'Nucleic acids: the big picture',
      minutes: 5,
      blocks: [
        { t: 'h', text: 'Quick review: four kinds of biomolecules' },
        {
          t: 'table', head: ['Biomolecule', 'What it is', 'Examples'],
          rows: [
            ['**Lipids**', 'hydrophobic (nonpolar) carbon chains', 'triacylglycerols, phospholipids, cholesterol, steroids'],
            ['**Polysaccharides**', 'chains of **monosaccharides**', 'amylose (unbranched); amylopectin, glycogen (branched)'],
            ['**Proteins**', '**unbranched** chains of **amino acids**', 'hemoglobin, collagen, all enzymes'],
            ['**Nucleic acids**', '**unbranched** chains of **nucleotides**', '**DNA** and **RNA**'],
          ],
        },
        { t: 'list', items: ['**Nucleic acids** are unbranched polymers of repeating monomers called **nucleotides**. There are two types: **DNA** and **RNA**.', '**DNA (deoxyribonucleic acid)** **stores the genetic information** of an organism and transmits it from one generation to the next.', '**RNA (ribonucleic acid)** **translates** the genetic information in DNA into the **proteins** needed for all cellular function.'] },
        { t: 'h', text: 'The central dogma' },
        { t: 'p', text: '**DNA** —transcription→ **RNA** —translation→ **protein**' },
        { t: 'list', items: ['**DNA** contains **all** the genetic information of an organism.', '**RNA** allows that information to be translated into protein **one gene at a time**.', 'The information in **each gene** is used to make **one protein**.'] },
        { t: 'h', text: 'DNA by the numbers' },
        { t: 'list', items: ['DNA molecules contain **several million nucleotides** (**3 billion in humans**), while RNA molecules have only **a few thousand**.', 'DNA is contained in the **chromosomes** within the **nucleus** of the cell.', 'Humans have **46 chromosomes (23 pairs)**, each made up of **thousands of genes**.'] },
        {
          t: 'check', q: {
            id: 'l20-c-roles', skill: 'l20.overview', type: 'mc', prompt: 'Which nucleic acid stores the genetic information of an organism?',
            choices: ['DNA', 'RNA', 'both equally', 'neither; proteins do'], answer: 0, shuffle: false,
            explain: '**DNA** stores the information; **RNA** translates it into proteins.',
          },
        },
      ],
    },
    {
      id: 'nucleotides',
      title: 'The parts of a nucleotide',
      minutes: 7,
      blocks: [
        { t: 'p', text: 'A **nucleotide** consists of three parts:' },
        { t: 'list', ordered: true, items: ['a **monosaccharide**, one of **two** sugars, which determines **DNA or RNA**', 'a **nitrogen-containing base (nucleobase)**, one of **5** bases', 'a **phosphate group**'] },
        { t: 'mol', smiles: nucleoSmiles('A', false, 1), caption: 'A nucleotide (AMP): **phosphate** on the left, the **sugar** ring in the middle, the **base** (adenine) on the right' },
        { t: 'h', text: 'The sugar: ribose or 2-deoxyribose' },
        { t: 'list', items: ['In **RNA** the monosaccharide is **ribose** (RNA = **R**ibo**N**ucleic **A**cid).', 'In **DNA** the monosaccharide is **2-deoxyribose** (DNA = **D**eoxyribo**N**ucleic **A**cid).', 'The sugar carbons are numbered **1′ to 5′** (pronounced "**prime**"), so they aren\'t confused with the base\'s numbers.'] },
        { t: 'mols', items: [{ smiles: SUGAR_SMILES.ribose, caption: '**D-ribose** (in **R**NA): OH on C2′ (shaded)', highlight: [7] }, { smiles: SUGAR_SMILES.deoxyribose, caption: '**D-2-deoxyribose** (in **D**NA): **no OH on C2′**' }] },
        { t: 'callout', kind: 'key', title: 'The difference between DNA and RNA sugars', text: 'It is the **OH at the 2′ carbon**. Ribose has it; **deoxy**ribose is missing that oxygen ("de-oxy").' },
        { t: 'h', text: 'The bases: purines and pyrimidines' },
        {
          t: 'compare', items: [
            { title: 'Purines (2 rings)', text: '**Adenine (A)** and **guanine (G)**, based on the structure of **purine**.' },
            { title: 'Pyrimidines (1 ring)', text: '**Cytosine (C)**, **uracil (U)** (only in RNA) and **thymine (T)** (only in DNA), based on the structure of **pyrimidine**.' },
          ],
        },
        { t: 'mols', items: [{ smiles: PARENTS.purine, caption: '**purine** (parent compound)', scale: 28 }, base('A'), base('G')] },
        { t: 'mols', items: [{ smiles: PARENTS.pyrimidine, caption: '**pyrimidine** (parent compound)', scale: 28 }, base('C'), { ...base('U'), caption: '**uracil** (U): **only in RNA**' }, { ...base('T'), caption: '**thymine** (T): **only in DNA**' }] },
        {
          t: 'compare', items: [
            { title: 'DNA can only have', text: '**A, C, G or T**' },
            { title: 'RNA can only have', text: '**A, C, G or U**' },
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Memory tricks', text: '"**P**ure **A**s **G**old": **pur**ines are **A** and **G** (and they are the bigger, 2-ring bases).\n"**CUT** the **py**": **C**, **U**, **T** are **py**rimidines (1 ring).\nThymine has a **CH₃** that uracil lacks; otherwise they look alike.' },
        {
          t: 'check', q: {
            id: 'l20-c-purine', skill: 'l20.parts', type: 'multi', prompt: 'Select the purines.',
            choices: ['adenine', 'guanine', 'cytosine', 'thymine', 'uracil'], answer: [0, 1],
            explain: '**Adenine and guanine** are purines (2 rings). C, T and U are pyrimidines (1 ring).',
          },
        },
      ],
    },
    {
      id: 'nucleosides',
      title: 'Nucleosides: naming',
      minutes: 6,
      blocks: [
        {
          t: 'compare', items: [
            { title: 'Nucleo**s**ide', text: '**sugar + base**, but **no phosphates**' },
            { title: 'Nucleo**t**ide', text: '**sugar + base + at least one phosphate**' },
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: 'Nucleo**t**ide has a **t** for the extra bi**t**: the phosphate. (Or: nucleo**s**ide is just the **s**ugar + base.)' },
        { t: 'p', text: 'A nucleoside is formed by **joining the anomeric carbon (C1′) of the monosaccharide** with a **N atom of the base**. The new C–N bond is an **N-glycoside**, like the glycosidic linkages of Lecture 16 but to a nitrogen.' },
        { t: 'rxn', from: SUGAR_SMILES.ribose, reagent: '+ cytosine, −H₂O', to: nucleoSmiles('C', false, 0), caption: 'D-ribose + cytosine → **cytidine**, a ribonucleoside. The base\'s N joins C1′.' },
        {
          t: 'table', head: ['Base', '+ ribose =', 'Rule'],
          rows: [
            ['adenine', '**adenosine**', 'purines + ribose end in **"-osine"**'],
            ['guanine', '**guanosine**', ''],
            ['cytosine', '**cytidine**', 'pyrimidines + ribose end in **"-idine"**'],
            ['thymine', '**thymidine**', ''],
            ['uracil', '**uridine**', ''],
          ],
        },
        { t: 'callout', kind: 'tip', title: 'Deoxy- for DNA', text: 'With 2-deoxyribose, add **deoxy-** to the front: deoxyadenosine, deoxyguanosine, deoxycytidine. (Thymine occurs only in DNA, so in real life its nucleoside is made with deoxyribose: **deoxythymidine**, which is usually just called thymidine. The slide shows the -idine ending with ribose.)' },
        { t: 'h', text: 'DNA or RNA? Look at C2′' },
        { t: 'mols', items: [{ smiles: nucleoSmiles('C', false, 0), caption: '**cytidine**, a ribonucleoside: OH on the 2′ carbon → **RNA**' }, { smiles: nucleoSmiles('A', true, 0), caption: '**deoxyadenosine**, a deoxyribonucleoside: **no OH** on the 2′ carbon → **DNA**' }] },
        {
          t: 'check', q: {
            id: 'l20-c-idine', skill: 'l20.naming', type: 'mc', prompt: 'What is the name of the nucleoside made from guanine and ribose?',
            choices: ['guanosine', 'guanidine', 'deoxyguanosine', 'guanine phosphate'], answer: 0,
            explain: 'Guanine is a **purine**, so + ribose → **-osine**: **guanosine**.',
          },
        },
      ],
    },
    {
      id: 'phosphates',
      title: 'Nucleotides: adding phosphates',
      minutes: 6,
      blocks: [
        { t: 'p', text: '**Nucleotides** are formed by adding a **phosphate group to the 5′-OH** of a nucleoside.' },
        { t: 'mols', items: [{ smiles: nucleoSmiles('C', false, 1), caption: '**cytidine 5′-monophosphate**, a ribonucleotide: **CMP**' }, { smiles: nucleoSmiles('A', true, 1), caption: '**deoxyadenosine 5′-monophosphate**, a deoxyribonucleotide: **dAMP**' }] },
        { t: 'mols', items: [{ smiles: nucleoSmiles('A', false, 2), caption: '**adenosine 5′-diphosphate**: **ADP**, a diphosphate' }, { smiles: nucleoSmiles('A', false, 3), caption: '**adenosine 5′-triphosphate**: **ATP**, a triphosphate' }] },
        {
          t: 'steps', title: 'HOW TO write a nucleotide abbreviation', items: [
            '**d** if the sugar is **deoxy**ribose (no OH on C2′); nothing for ribose.',
            'The **base letter**: A, G, C, T or U.',
            '**M**, **D** or **T** for **mono-, di- or tri**phosphate.',
            '**P** for phosphate.',
          ],
        },
        {
          t: 'example', title: 'Example from the slides', prompt: 'What is the abbreviation for this adenosine nucleotide? It has **three phosphates** and **no OH on the 2′ carbon**.',
          steps: ['No OH on C2′ → **deoxy** → **d**.', 'The base is adenine → **A**.', 'Three phosphates → **TP**.'],
          answer: '**dATP**: deoxyadenosine triphosphate',
          answerMols: [{ smiles: nucleoSmiles('A', true, 3), caption: 'dATP' }],
        },
        { t: 'callout', kind: 'warn', title: 'Two "T"s', text: 'In **dTTP** the first T is the base **thymine** and the second is **tri**phosphate. Read the letters by position: (d) + base + M/D/T + P.' },
        {
          t: 'check', q: {
            id: 'l20-c-abbrev', skill: 'l20.naming', type: 'mc', prompt: 'What is the abbreviation for guanosine 5′-diphosphate?',
            choices: ['GDP', 'dGDP', 'GMP', 'GTP'], answer: 0,
            explain: 'Ribose (no d) + **G** + **D**iphosphate + P = **GDP**.',
          },
        },
      ],
    },
    {
      id: 'strands',
      title: 'Nucleic acid strands',
      minutes: 6,
      blocks: [
        { t: 'list', items: ['Nucleic acids (DNA and RNA) are polymers of nucleotides joined by **phosphodiester linkages**.', 'The phosphodiester linkage joins the **3′ C of one nucleotide** to the **5′ C of the next**, through a phosphate.', 'A polynucleotide has **one free phosphate group at the 5′ end** and **one free OH group at the 3′ end**.', 'The backbone consists of **alternating sugar and phosphate groups**.', 'In DNA, the **sequence of the bases** carries the **genetic information** of the organism.'] },
        {
          t: 'table', head: ['On the sugar', 'What is there'],
          rows: [['**1′ C**', 'the **base**'], ['**2′ C**', '**OH** (RNA) or **H** (DNA)'], ['**3′ C**', 'the **3′-OH end** (or the link to the next phosphate)'], ['**5′ C**', 'the **phosphate** (the **5′ end**)']],
        },
        { t: 'dna', items: [{ top: 'CATG', bottom: 'none', caption: 'A polynucleotide in simplified form: the **sugar–phosphate backbone** on top, one base hanging from each sugar. 5′-phosphate end on the left, 3′-OH end on the right.' }] },
        { t: 'callout', kind: 'key', title: 'Always read from the 5′ end to the 3′ end', text: 'This polynucleotide is named **CATG**, reading from the 5′ end (the free phosphate) to the 3′ end (the free OH).' },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: '**5′ = P** (the phosphate hangs off C5′). **3′ = OH**. Read like a book, from **5 to 3**.' },
        {
          t: 'check', q: {
            id: 'l20-c-ends', skill: 'l20.strands', type: 'mc', prompt: 'What is found at the 3′ end of a polynucleotide?',
            choices: ['a free OH group', 'a free phosphate group', 'a base', 'an H only'], answer: 0,
            explain: '**3′ end: free OH.** 5′ end: free phosphate.',
          },
        },
      ],
    },
    {
      id: 'helix',
      title: 'The DNA double helix',
      minutes: 9,
      blocks: [
        { t: 'list', items: ['The DNA model was proposed by **Watson and Crick** in **1953**.', 'DNA consists of **two polynucleotide strands** that wind into a **right-handed double helix**.', 'The two strands run in **opposite directions**: one runs from the 5′ end to the 3′ end, and the other from the 3′ end to the 5′ end.', 'The **sugar–phosphate** groups lie on the **outside** of the helix, and the **bases** lie on the **inside**.'] },
        { t: 'h', text: 'Base pairing' },
        { t: 'list', items: ['The bases always line up so that a **pyrimidine** hydrogen bonds to a **purine** on the other strand.', '**A binds to T** (or **U** in RNA). **G binds to C**.', 'Adenine pairs with thymine using **2 hydrogen bonds**: an **A–T** base pair.', 'Cytosine pairs with guanine using **3 hydrogen bonds**: a **C–G** base pair.'] },
        { t: 'dna', items: [{ top: 'TAGGCTA', caption: 'Original strand 5′-TAGGCTA-3′ on top; the complementary strand 3′-ATCCGAT-5′ below. The dashes are hydrogen bonds: **2** for each A–T, **3** for each G–C.' }] },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: '**A**pple in the **T**ree, **C**ar in the **G**arage. **G–C** has **3** H-bonds, the stronger pair ("**G**oes **C**lose, **3** times").' },
        {
          t: 'steps', title: 'HOW TO write a complementary strand', items: [
            '**Pair each base**: A → T, T → A, G → C, C → G.',
            '**Flip the end labels.** Written under the original, the new strand runs **3′ → 5′**.',
            '**If the question asks for 5′ → 3′, reverse it**: read your new strand from right to left.',
          ],
        },
        {
          t: 'example', title: 'Question from the slides', prompt: 'What is the complementary sequence of the DNA fragment **5′-GATTCGA-3′**?\n\nA. 5′-GATTCGA-3′\nB. 5′-CTAAGCT-3′\nC. 3′-CTAAGCT-5′\nD. 3′-GATTCGA-5′',
          steps: ['Pair each base: G→C, A→T, T→A, T→A, C→G, G→C, A→T gives CTAAGCT.', 'Under the original it runs the other way: **3′-CTAAGCT-5′**.', 'B has the right letters but the wrong direction labels.'],
          answer: '**C. 3′-CTAAGCT-5′**. It can also be written **5′-TCGAATC-3′**: the same strand, read from its 5′ end.',
        },
        { t: 'dna', items: [{ top: 'GATTCGA' }] },
        {
          t: 'example', title: 'Write it from 5′ to 3′', prompt: 'Write the complementary sequence of **5′-ATTGCGA-3′** from 5′ to 3′.',
          steps: ['Pair each base: **3′-TAACGCT-5′**.', 'Reverse it to start at the 5′ end.'],
          answer: '**5′-TCGCAAT-3′**',
        },
        { t: 'callout', kind: 'exam', title: 'The trap', text: 'The right letters with the **wrong 5′/3′ labels** is a wrong answer. 3′-CTAAGCT-5′ and 5′-TCGAATC-3′ are the **same** strand; 5′-CTAAGCT-3′ is **not**.' },
        {
          t: 'check', q: {
            id: 'l20-c-comp', skill: 'l20.helix', type: 'mc', prompt: 'What is the complementary sequence of 5′-GTTCACCT-3′?',
            choices: ['3′-CAAGTGGA-5′', '5′-CAAGTGGA-3′', '3′-GTTCACCT-5′', '3′-TGGTCAAC-5′'], answer: 0,
            explain: 'G→C, T→A, T→A, C→G, A→T, C→G, C→G, T→A: **3′-CAAGTGGA-5′** (= 5′-AGGTGAAC-3′).',
          },
        },
      ],
    },
    {
      id: 'flow',
      title: 'From DNA to protein',
      minutes: 4,
      blocks: [
        { t: 'p', text: 'The information stored in DNA is used to direct the **synthesis of proteins**.' },
        {
          t: 'table', head: ['Process', 'What happens'],
          rows: [
            ['**Replication**', 'DNA is **duplicated** before a cell divides (DNA → DNA)'],
            ['**Transcription**', 'the **synthesis of RNA from DNA**: the genetic information in DNA is passed onto RNA'],
            ['**Translation**', 'the **synthesis of proteins from RNA**: the information determines the specific **amino acid sequence** of the protein'],
          ],
        },
        { t: 'callout', kind: 'memory', title: 'Memory trick', text: '**Transcription** keeps the same "language" (nucleic acid → nucleic acid), like a scribe copying a page. **Translation** changes language: nucleotides → **amino acids**, like translating into another language.' },
        { t: 'h', text: 'Summary from the slides' },
        { t: 'list', items: ['Nucleic acids (DNA and RNA) are polynucleotides.', 'Nucleotide vs nucleoside composition.', 'Bases: purines (A, G) vs pyrimidines (C, U or T).', 'DNA vs RNA: deoxyribose vs ribose AND T vs U.', 'DNA structure: sugar–phosphate backbone, and the 5′ end vs the 3′ end.', 'A binds to T (or U in RNA) with 2 hydrogen bonds; G binds to C with 3 hydrogen bonds.', 'The complementary sequence for a piece of DNA.', 'Most importantly: DNA is the genetic code, and each gene is translated into a protein.'] },
        {
          t: 'check', q: {
            id: 'l20-c-transc', skill: 'l20.overview', type: 'mc', prompt: 'The synthesis of RNA from DNA is called…',
            choices: ['transcription', 'translation', 'replication', 'hydrolysis'], answer: 0,
            explain: '**Transcription**: DNA → RNA. Translation: RNA → protein. Replication: DNA → DNA.',
          },
        },
      ],
    },
  ],
  questions: [
    // overview
    { id: 'l20-q01', skill: 'l20.overview', type: 'mc', prompt: 'Nucleic acids are unbranched chains of…', choices: ['nucleotides', 'amino acids', 'monosaccharides', 'fatty acids'], answer: 0, explain: 'Nucleic acids are polymers of **nucleotides**.' },
    { id: 'l20-q02', skill: 'l20.overview', type: 'match', prompt: 'Match each biomolecule with its building block.', left: ['nucleic acid', 'protein', 'polysaccharide'], right: ['nucleotide', 'amino acid', 'monosaccharide'], answer: [0, 1, 2], explain: 'DNA/RNA ← nucleotides; proteins ← amino acids; polysaccharides ← monosaccharides.' },
    { id: 'l20-q03', skill: 'l20.overview', type: 'num', prompt: 'How many chromosomes do humans have?', answer: 46, tol: 0, explain: '**46** chromosomes, in **23 pairs**.' },
    { id: 'l20-q04', skill: 'l20.overview', type: 'mc', prompt: 'About how many nucleotides are in human DNA?', choices: ['3 billion', 'a few thousand', '46', '153'], answer: 0, explain: 'About **3 billion**. RNA molecules have only a few thousand.' },
    { id: 'l20-q05', skill: 'l20.overview', type: 'mc', prompt: 'Where in the cell is DNA found?', choices: ['in the chromosomes within the nucleus', 'in the cell wall', 'in the extracellular matrix', 'in the plasma membrane'], answer: 0, explain: 'DNA is in the **chromosomes** within the **nucleus**.' },
    { id: 'l20-q06', skill: 'l20.overview', type: 'match', prompt: 'Match each process with what it makes.', left: ['replication', 'transcription', 'translation'], right: ['a copy of DNA', 'RNA, from DNA', 'protein, from RNA'], answer: [0, 1, 2], explain: 'Replication: DNA → DNA. Transcription: DNA → RNA. Translation: RNA → protein.' },
    { id: 'l20-q07', skill: 'l20.overview', type: 'mc', prompt: 'The information in each gene is used to make…', choices: ['one protein', 'one chromosome', 'all the proteins at once', 'one nucleotide'], answer: 0, explain: '**One gene → one protein**, translated one gene at a time.' },
    // parts
    { id: 'l20-q08', skill: 'l20.parts', type: 'multi', prompt: 'Select the three parts of a nucleotide.', choices: ['a monosaccharide', 'a nitrogen-containing base', 'a phosphate group', 'an amino acid', 'a fatty acid'], answer: [0, 1, 2], explain: 'Sugar + **base** + **phosphate**.' },
    { id: 'l20-q09', skill: 'l20.parts', type: 'mc', prompt: 'What is the sugar in DNA?', choices: ['2-deoxyribose', 'ribose', 'glucose', 'fructose'], answer: 0, explain: '**2-Deoxy**ribose (DNA = deoxyribonucleic acid). RNA uses ribose.' },
    { id: 'l20-q10', skill: 'l20.parts', type: 'mc', prompt: 'What is the difference between ribose and 2-deoxyribose?', figure: { mols: [{ smiles: SUGAR_SMILES.ribose, caption: 'ribose' }, { smiles: SUGAR_SMILES.deoxyribose, caption: '2-deoxyribose' }] }, choices: ['the OH at the 2′ carbon', 'the OH at the 5′ carbon', 'the number of carbons', 'the ring oxygen'], answer: 0, explain: 'Deoxyribose has **no OH on C2′**.' },
    { id: 'l20-q11', skill: 'l20.parts', type: 'mc', prompt: 'Which base is found only in RNA?', choices: ['uracil', 'thymine', 'adenine', 'guanine'], answer: 0, explain: '**Uracil** is only in RNA; **thymine** is only in DNA.' },
    { id: 'l20-q12', skill: 'l20.parts', type: 'mc', prompt: 'Which bases can DNA have?', choices: ['A, C, G and T', 'A, C, G and U', 'A, G, T and U', 'all five'], answer: 0, explain: 'DNA: **A, C, G, T**. RNA: A, C, G, U.' },
    { id: 'l20-q13', skill: 'l20.parts', type: 'mc', prompt: 'Is this base a purine or a pyrimidine?', figure: { smiles: BASES.G.smiles }, choices: ['purine', 'pyrimidine'], answer: 0, shuffle: false, explain: 'Two fused rings → **purine**. This is guanine.' },
    { id: 'l20-q14', skill: 'l20.parts', type: 'mc', prompt: 'How many rings does a pyrimidine base have?', choices: ['1', '2', '3', '0'], answer: 0, shuffle: false, explain: 'Pyrimidines (C, T, U): **1 ring**. Purines (A, G): 2 rings.' },
    { id: 'l20-q15', skill: 'l20.parts', type: 'mc', prompt: 'What are the sugar carbons of a nucleotide numbered?', choices: ['1′ to 5′ (“prime”)', '1 to 5, the same as the base', '1 to 6', 'α and β'], answer: 0, explain: 'The sugar carbons are **1′–5′**, read "one prime" to "five prime".' },
    // naming
    { id: 'l20-q16', skill: 'l20.naming', type: 'mc', prompt: 'A nucleoside contains…', choices: ['a sugar and a base, but no phosphate', 'a sugar, a base and at least one phosphate', 'a base and a phosphate only', 'only a sugar'], answer: 0, explain: 'Nucleo**s**ide = sugar + base. Nucleo**t**ide adds a phosphate.' },
    { id: 'l20-q17', skill: 'l20.naming', type: 'mc', prompt: 'In a nucleoside, the base is joined to which carbon of the sugar?', choices: ['the anomeric carbon, C1′', 'C2′', 'C3′', 'C5′'], answer: 0, explain: 'The base\'s **N** joins the **anomeric carbon (C1′)**: an N-glycoside.' },
    { id: 'l20-q18', skill: 'l20.naming', type: 'match', prompt: 'Match each base with its nucleoside (with ribose).', left: ['adenine', 'cytosine', 'uracil', 'guanine'], right: ['adenosine', 'cytidine', 'uridine', 'guanosine'], answer: [0, 1, 2, 3], explain: 'Purines → **-osine**; pyrimidines → **-idine**.' },
    { id: 'l20-q19', skill: 'l20.naming', type: 'mc', prompt: 'Is this nucleoside found in DNA or RNA?', figure: { smiles: nucleoSmiles('C', false, 0) }, choices: ['RNA', 'DNA'], answer: 0, shuffle: false, explain: 'There is an **OH on the 2′ carbon** → ribose → **RNA**. This is cytidine.' },
    { id: 'l20-q20', skill: 'l20.naming', type: 'mc', prompt: 'Where is the phosphate attached in a nucleotide?', choices: ['the 5′-OH of the sugar', 'the 2′-OH of the sugar', 'the N of the base', 'the 1′ carbon'], answer: 0, explain: 'Nucleotides are formed by adding a phosphate to the **5′-OH**.' },
    { id: 'l20-q21', skill: 'l20.naming', type: 'mc', prompt: 'What is the abbreviation for deoxyadenosine 5′-monophosphate?', choices: ['dAMP', 'AMP', 'dATP', 'DAMP'], answer: 0, explain: '**d** (deoxy) + **A** + **M**ono + **P** = **dAMP**.' },
    { id: 'l20-q22', skill: 'l20.naming', type: 'mc', prompt: 'What is the abbreviation for this nucleotide?', figure: { smiles: nucleoSmiles('A', true, 3) }, choices: ['dATP', 'ATP', 'dADP', 'dAMP'], answer: 0, explain: 'No OH on C2′ (**d**), adenine (**A**), three phosphates (**TP**): **dATP**.' },
    { id: 'l20-q23', skill: 'l20.naming', type: 'mc', prompt: 'ADP is an example of a…', choices: ['diphosphate', 'monophosphate', 'triphosphate', 'nucleoside'], answer: 0, explain: 'A**D**P = adenosine **di**phosphate.' },
    // strands
    { id: 'l20-q24', skill: 'l20.strands', type: 'mc', prompt: 'The nucleotides of DNA and RNA are joined by…', choices: ['phosphodiester linkages', 'peptide bonds', 'glycosidic linkages only', 'disulfide bonds'], answer: 0, explain: '**Phosphodiester linkages**, joining the 3′ C of one nucleotide to the 5′ C of the next.' },
    { id: 'l20-q25', skill: 'l20.strands', type: 'mc', prompt: 'The backbone of a polynucleotide consists of…', choices: ['alternating sugar and phosphate groups', 'alternating bases and sugars', 'only phosphates', 'amino acids'], answer: 0, explain: 'The backbone alternates **sugar–phosphate–sugar–phosphate**. The bases hang off it.' },
    { id: 'l20-q26', skill: 'l20.strands', type: 'mc', prompt: 'A polynucleotide has a free phosphate at its…', choices: ['5′ end', '3′ end', '2′ carbon', 'both ends'], answer: 0, shuffle: false, explain: 'Free **phosphate at the 5′ end**; free **OH at the 3′ end**.' },
    { id: 'l20-q27', skill: 'l20.strands', type: 'mc', prompt: 'What is this polynucleotide named?', figure: { dna: [{ top: 'CATG', bottom: 'none' }] }, choices: ['CATG', 'GTAC', 'GUAC', 'CAUG'], answer: 0, explain: 'Always read from the **5′ end to the 3′ end**: **CATG**.' },
    { id: 'l20-q28', skill: 'l20.strands', type: 'mc', prompt: 'In DNA, what carries the genetic information?', choices: ['the sequence of the bases', 'the sugar–phosphate backbone', 'the phosphodiester bonds', 'the 3′-OH group'], answer: 0, explain: 'The **sequence of the bases** carries the information.' },
    // helix
    { id: 'l20-q29', skill: 'l20.helix', type: 'mc', prompt: 'Who proposed the DNA double helix model, and when?', choices: ['Watson and Crick, 1953', 'Watson and Crick, 1903', 'Fischer and Haworth, 1953', 'Smith, 2020'], answer: 0, explain: '**Watson and Crick** in **1953**.' },
    { id: 'l20-q30', skill: 'l20.helix', type: 'multi', prompt: 'Select the true statements about the DNA double helix.', choices: ['It is right-handed', 'The two strands run in opposite directions', 'The bases lie on the inside', 'The sugar–phosphate groups lie on the inside', 'The two strands run in the same direction'], answer: [0, 1, 2], explain: '**Right-handed**, **antiparallel** strands, **bases inside**, sugar–phosphate backbone **outside**.' },
    { id: 'l20-q31', skill: 'l20.helix', type: 'mc', prompt: 'How many hydrogen bonds hold an A–T base pair together?', choices: ['2', '3', '1', '4'], answer: 0, shuffle: false, explain: 'A–T: **2**. G–C: **3**.' },
    { id: 'l20-q32', skill: 'l20.helix', type: 'mc', prompt: 'Which base pairs with guanine?', choices: ['cytosine', 'thymine', 'adenine', 'uracil'], answer: 0, explain: '**G–C**, with 3 hydrogen bonds.' },
    { id: 'l20-q33', skill: 'l20.helix', type: 'mc', prompt: 'In a base pair, a purine always hydrogen bonds to a…', choices: ['pyrimidine', 'purine', 'phosphate', 'sugar'], answer: 0, explain: 'A **purine** pairs with a **pyrimidine** (A with T or U, G with C).' },
    { id: 'l20-q34', skill: 'l20.helix', type: 'mc', prompt: 'What is the complementary sequence of 5′-GATTCGA-3′?', choices: ['3′-CTAAGCT-5′', '5′-GATTCGA-3′', '5′-CTAAGCT-3′', '3′-GATTCGA-5′'], answer: 0, explain: 'Pair each base and flip the labels: **3′-CTAAGCT-5′** (also written 5′-TCGAATC-3′).' },
    { id: 'l20-q35', skill: 'l20.helix', type: 'text', prompt: 'Write the complementary sequence of 5′-ATTGCGA-3′ **from 5′ to 3′**. Type just the letters.', answer: 'TCGCAAT', accept: ["5' TCGCAAT 3'", "3' TAACGCT 5'"], placeholder: 'e.g. ACGT', explain: 'Pair: 3′-TAACGCT-5′. Reverse to read from 5′: **5′-TCGCAAT-3′**.' },
    { id: 'l20-q36', skill: 'l20.helix', type: 'text', prompt: 'Write the strand that pairs with 5′-TAGGCTA-3′, lined up under it (3′ → 5′). Type just the letters.', answer: 'ATCCGAT', accept: ["3' ATCCGAT 5'", "5' TAGCCTA 3'"], placeholder: 'e.g. ACGT', explain: 'T→A, A→T, G→C, G→C, C→G, T→A, A→T: **3′-ATCCGAT-5′**.' },
  ],
  cards: [
    { id: 'l20-k01', front: 'Nucleic acid', back: 'An unbranched polymer of **nucleotides**. Two types: **DNA** and **RNA**.' },
    { id: 'l20-k02', front: 'DNA vs RNA jobs', back: 'DNA **stores** the genetic information and passes it on. RNA **translates** it into proteins.' },
    { id: 'l20-k03', front: 'Central dogma', back: 'DNA → (transcription) → RNA → (translation) → protein. One gene → one protein.' },
    { id: 'l20-k04', front: 'DNA by the numbers', back: '**3 billion** nucleotides in humans (RNA: a few thousand). **46 chromosomes (23 pairs)** in the nucleus, each with thousands of genes.' },
    { id: 'l20-k05', front: 'Parts of a nucleotide', back: 'A **monosaccharide** (ribose or deoxyribose), a **nitrogen-containing base**, and a **phosphate**.' },
    { id: 'l20-k06', front: 'Ribose vs 2-deoxyribose', back: 'Ribose (RNA) has an **OH on C2′**; 2-deoxyribose (DNA) does **not**. Sugar carbons are numbered 1′–5′.' },
    { id: 'l20-k07', front: 'Purines', back: '**Adenine (A)** and **guanine (G)**: **2 rings**.' },
    { id: 'l20-k08', front: 'Pyrimidines', back: '**Cytosine (C)**, **thymine (T, DNA only)**, **uracil (U, RNA only)**: **1 ring**.' },
    { id: 'l20-k09', front: 'Bases in DNA vs RNA', back: 'DNA: **A, C, G, T**. RNA: **A, C, G, U**.' },
    { id: 'l20-k10', front: 'Nucleoside vs nucleotide', back: 'Nucleoside: **sugar + base**. Nucleotide: **sugar + base + at least one phosphate**.' },
    { id: 'l20-k11', front: 'Forming a nucleoside', back: 'The **anomeric carbon (C1′)** of the sugar joins an **N** of the base: an N-glycoside.' },
    { id: 'l20-k12', front: 'Nucleoside names', back: 'Purines + ribose → **-osine** (adenosine, guanosine). Pyrimidines → **-idine** (cytidine, thymidine, uridine). Deoxyribose adds **deoxy-**.' },
    { id: 'l20-k13', front: 'Nucleotide abbreviations', back: '(**d** if deoxy) + **base** + **M/D/T** + **P**. CMP, dAMP, ADP, ATP, dATP.' },
    { id: 'l20-k14', front: 'Where the phosphate goes', back: 'On the **5′-OH** of the sugar.' },
    { id: 'l20-k15', front: 'Phosphodiester linkage', back: 'Joins nucleotides: the **3′ C** of one to the **5′ C** of the next, through a phosphate.' },
    { id: 'l20-k16', front: '5′ end vs 3′ end', back: '5′ end: free **phosphate**. 3′ end: free **OH**. Always read **5′ → 3′**.' },
    { id: 'l20-k17', front: 'Backbone', back: '**Alternating sugar and phosphate** groups. The **sequence of the bases** carries the genetic information.' },
    { id: 'l20-k18', front: 'Double helix', back: 'Watson & Crick, **1953**. Two strands, **right-handed**, running in **opposite directions**. Backbone **outside**, bases **inside**.' },
    { id: 'l20-k19', front: 'Base pairing', back: '**A–T** (or A–U in RNA): **2** H-bonds. **G–C**: **3** H-bonds. Always a purine with a pyrimidine.' },
    { id: 'l20-k20', front: 'Writing a complementary strand', back: 'Pair each base, then **flip the 5′/3′ labels**. 5′-GATTCGA-3′ → **3′-CTAAGCT-5′** = 5′-TCGAATC-3′.' },
    { id: 'l20-k21', front: 'Replication, transcription, translation', back: 'Replication: DNA **duplicated** before a cell divides. Transcription: **RNA from DNA**. Translation: **protein from RNA**.' },
  ],
  keyTerms: [
    { term: 'nucleic acid', def: 'An unbranched polymer of nucleotides: DNA or RNA.' },
    { term: 'DNA', def: 'Deoxyribonucleic acid, which stores an organism\'s genetic information.' },
    { term: 'RNA', def: 'Ribonucleic acid, which translates the information in DNA into proteins.' },
    { term: 'nucleotide', def: 'A sugar, a nitrogen-containing base and at least one phosphate.' },
    { term: 'nucleoside', def: 'A sugar joined to a nitrogen-containing base, with no phosphate.' },
    { term: '2-deoxyribose', def: 'The sugar of DNA: ribose without the OH on its 2′ carbon.' },
    { term: 'purine', def: 'A two-ring base: adenine or guanine.' },
    { term: 'pyrimidine', def: 'A one-ring base: cytosine, thymine or uracil.' },
    { term: 'phosphodiester linkage', def: 'The phosphate link joining the 3′ carbon of one nucleotide to the 5′ carbon of the next.' },
    { term: '5′ end', def: 'The end of a polynucleotide with a free phosphate group.' },
    { term: '3′ end', def: 'The end of a polynucleotide with a free OH group.' },
    { term: 'double helix', def: 'Two antiparallel DNA strands wound into a right-handed helix, bases inside.' },
    { term: 'base pair', def: 'Two bases joined by hydrogen bonds: A–T (or A–U) with 2, G–C with 3.' },
    { term: 'complementary strand', def: 'The strand whose bases pair with another strand\'s, running in the opposite direction.' },
    { term: 'replication', def: 'Duplication of DNA before a cell divides.' },
    { term: 'transcription', def: 'The synthesis of RNA from DNA.' },
    { term: 'translation', def: 'The synthesis of proteins from RNA.' },
  ],
};
