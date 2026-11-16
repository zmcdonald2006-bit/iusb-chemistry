// Lectures 18–20: proteins (structure levels, side-chain roles, hydrolysis, denaturation), enzymes
// (the six classes, cofactors, activity vs pH, regulation, inhibitors) and nucleic acids (bases, sugars,
// nucleoside and nucleotide names, strands, base pairing). Answers that can be worked out are
// computed: a side chain's role from its class, hydrolysis products from the sequence, an enzyme's
// class from its tagged reaction, complementary strands, hydrogen-bond counts and abbreviations.
import { mcq } from './common.js';
import { AMINO_ACIDS, aminoAcid, aaSmiles, aaSideAtoms } from '../../chem/aminoacids.js';
import { ENZYME_CLASSES, CLASS_KEYS, ENZYME_REACTIONS, quizRxn } from '../../chem/enzymes.js';
import { DNA_BASES, complement, complement53, reverse, hBonds, hBondsOf, pairOf } from '../../chem/dna.js';
import { BASES, nucleoSmiles, nucleosideName, nucleotideName, abbrev, canPair } from '../../chem/nucleotides.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
function matchq(prompt, pairs, { skill, why = '' } = {}) {
  return {
    type: 'match', skill, prompt, left: pairs.map((p) => p[0]), right: pairs.map((p) => p[1]), answer: pairs.map((_, i) => i),
    explain: `${pairs.map(([a, b]) => `**${a}** → ${b}`).join('; ')}.${why ? ` ${why}` : ''}`,
  };
}
const matchFrom = (r, pool, n, prompt, skill) => matchq(prompt, r.shuffle(pool).slice(0, n), { skill });
// A fact { q, a, o: [wrong…], e } as a multiple-choice question.
const factMcq = (r, pool, skill, extra = {}) => { const x = r.pick(pool); return mcq(x.q, [x.a, ...x.o], 0, { skill, explain: x.e, ...extra }); };

// ---- Lecture 18: proteins -------------------------------------------------------------------------

const LEVELS = ['primary', 'secondary', 'tertiary', 'quaternary'];
const LEVEL_FACTS = [
  { d: 'the sequence of amino acids, joined by peptide bonds', a: 'primary' },
  { d: 'an α-helix held by H-bonds along its axis', a: 'secondary' },
  { d: 'a β-pleated sheet of strands H-bonded side by side', a: 'secondary' },
  { d: 'the 3D shape of the entire peptide chain', a: 'tertiary' },
  { d: 'nonpolar side chains packed in the interior of one chain', a: 'tertiary' },
  { d: 'an intramolecular disulfide bond holding one chain\'s fold', a: 'tertiary' },
  { d: 'two or more folded chains (subunits) in one complex', a: 'quaternary' },
  { d: 'hemoglobin\'s four subunits fitting together', a: 'quaternary' },
  { d: 'the change from glutamate to valine in sickle cell hemoglobin', a: 'primary' },
];

// What each kind of side chain does in a folded protein (the slides' practice problems).
const ROLE = {
  interior: 'It is most likely in the interior of the protein',
  hbond: 'It is most likely involved in hydrogen bonding',
  ionic: 'It is most likely involved in ionic interactions',
  disulfide: 'It forms a disulfide bond',
};
const roleOf = (a) => (a.three === 'Cys' ? 'disulfide' : a.cls === 'nonpolar' ? 'interior' : a.cls === 'polar' ? 'hbond' : 'ionic');
const ROLE_WHY = {
  interior: (a) => `${cap(a.name)}'s side chain is **nonpolar** (C and H), so it packs into the **interior** with London dispersion forces.`,
  hbond: (a) => `${cap(a.name)}'s side chain is **polar** (${a.three === 'Tyr' ? 'an OH' : ['Asn', 'Gln'].includes(a.three) ? 'an amide' : 'an OH'}), so it forms **hydrogen bonds**.`,
  ionic: (a) => `${cap(a.name)}'s side chain is **charged** (${a.cls === 'acidic' ? 'COO⁻' : 'N with a + charge'}), so it takes part in **ionic (electrostatic) interactions**.`,
  disulfide: () => '**Cysteine**\'s SH side chain is oxidized with another cysteine\'s to form a **disulfide bond**.',
};
const ROLE_ACIDS = AMINO_ACIDS.filter((a) => a.three !== 'Gly');

const INTERACTIONS = [
  { q: 'Which interaction holds two cysteine side chains together?', a: 'a disulfide bond', e: 'Two SH groups are oxidized to **S–S**: a covalent **disulfide bond**.' },
  { q: 'What attracts an –NH₃⁺ side chain to a –COO⁻ side chain?', a: 'an electrostatic interaction', e: 'Opposite charges: an **electrostatic (ionic) interaction**.' },
  { q: 'What holds nonpolar side chains together inside a protein?', a: 'London dispersion forces', e: 'Nonpolar side chains pack in the **interior**, held by **London dispersion forces** (hydrophobic interactions).' },
  { q: 'How do polar OH groups on a protein\'s surface interact with water?', a: 'hydrogen bonding', e: 'Polar groups **hydrogen bond** with each other or with water on the exterior.' },
  { q: 'Which interaction holding a protein\'s 3D shape is covalent?', a: 'a disulfide bond', e: 'Only the **disulfide bond** is a covalent bond; the others are attractions.' },
  { q: 'What holds an α-helix in its coil?', a: 'hydrogen bonding', e: 'H-bonds between backbone **N–H** and **C=O** groups, along the axis of the helix.' },
];
const INTERACTION_NAMES = ['a disulfide bond', 'an electrostatic interaction', 'London dispersion forces', 'hydrogen bonding'];

const SECONDARY = [
  { q: 'In an α-helix, the hydrogen bonds run…', a: 'along the axis of the helix', o: ['between different strands', 'between subunits', 'to the heme'], e: 'α-helix: **along the axis**. β-sheet: across, between strands.' },
  { q: 'In a β-pleated sheet, the hydrogen bonds run…', a: 'between different strands', o: ['along the axis of a helix', 'between two cysteines', 'only to water'], e: '**Multiple strands form one sheet**, H-bonded **between** strands.' },
  { q: 'Secondary structure comes from H-bonds between…', a: 'an amide N–H and another C=O', o: ['two cysteine SH groups', 'a –COO⁻ and an –NH₃⁺', 'two nonpolar side chains'], e: 'Backbone **N–H**···**O=C** hydrogen bonds.' },
  { q: 'On a ribbon diagram, a β-sheet is drawn as…', a: 'flat arrows side by side', o: ['a coiled ribbon', 'a thin loop', 'a ring with Fe²⁺'], e: 'Ribbon shorthand: α-helix = coil, **β-sheet = arrows**, random region = loop.' },
  { q: 'Creutzfeldt–Jakob disease turns α-helices into…', a: 'β-pleated sheets', o: ['random coils', 'triple helices', 'disulfide bonds'], e: 'A **prion** protein converts α-helical regions into pathogenic **β-pleated sheets** in neurons.' },
  { q: 'Regions of a protein that are neither helix nor sheet are…', a: 'random arrangements', o: ['quaternary structure', 'always disulfide bonds', 'hydrolyzed'], e: 'Most proteins have α-helix and β-sheet regions plus **random** regions.' },
];

const FIBROUS = [
  { p: 'α-keratin', k: 'fibrous' }, { p: 'collagen', k: 'fibrous' },
  { p: 'hemoglobin', k: 'globular' }, { p: 'myoglobin', k: 'globular' }, { p: 'most enzymes', k: 'globular' }, { p: 'a transport protein', k: 'globular' },
];
const COMMON = [
  { q: 'α-Keratins are found in…', a: 'hair, hooves, nails, skin and wool', o: ['tendons and bone', 'red blood cells', 'gastric juice'], e: '**α-Keratins**: hair, hooves, nails, skin and wool.' },
  { q: 'α-Keratin is made of how many α-helix chains coiled into a superhelix?', a: 'two', o: ['three', 'four', 'one'], e: '**Two** α-helix chains coil into a superhelix; collagen uses three.' },
  { q: 'Collagen is a superhelix of how many chains?', a: 'three', o: ['two', 'four', 'one'], e: 'Collagen\'s **triple** helix: **three** chains.' },
  { q: 'Which vitamin is needed to form collagen fibers?', a: 'vitamin C', o: ['vitamin D', 'vitamin K', 'vitamin A'], e: '**Vitamin C** is required for proper formation of collagen.' },
  { q: 'Collagen is a main component of the…', a: 'extracellular matrix', o: ['nucleus', 'hemoglobin', 'gastric juice'], e: 'Collagen is a main component of the **extracellular matrix**.' },
  { q: 'Which protein function do hormones like insulin fill?', a: 'signaling', o: ['transport', 'structural', 'immune response'], e: '**Signaling**: hormones (like insulin) and receptors.' },
  { q: 'Antibodies and clotting factors are examples of which protein function?', a: 'immune response', o: ['enzymatic', 'transport', 'structural'], e: '**Immune response**: antibodies and clotting factors.' },
  { q: 'Globular proteins are…', a: 'compact and water soluble', o: ['bundled into rods or sheets', 'always structural', 'never enzymes'], e: '**Globular**: coiled into **compact**, **water-soluble** shapes.' },
];
const HEMO = [
  { q: 'The non-protein part of hemoglobin is…', a: 'heme', o: ['collagen', 'NAD⁺', 'a disulfide bond'], e: 'The non-protein unit is **heme**, an organic complex around Fe²⁺.' },
  { q: 'Which ion at the center of heme binds O₂?', a: 'Fe²⁺', o: ['Fe³⁺', 'Mg²⁺', 'Na⁺'], e: '**Fe²⁺** binds O₂.' },
  { q: 'How many polypeptide chains does myoglobin have?', a: '1', o: ['2', '3', '4'], e: 'Myoglobin: **1** chain of 153 amino acids.' },
  { q: 'How many heme units does hemoglobin carry?', a: '4', o: ['1', '2', '153'], e: '**4**: one on each of its 4 chains.' },
  { q: 'CO binds to Fe²⁺ how much more strongly than O₂?', a: 'about 200 times', o: ['about 2 times', 'about 20 times', 'equally'], e: '**200 times** more strongly, so hemoglobin can\'t carry O₂.' },
  { q: 'Sickle cell anemia is caused by…', a: 'one amino acid changed in hemoglobin', o: ['a missing heme group', 'denatured myoglobin', 'too much collagen'], e: 'A **single amino acid** is different: a mutation in the primary structure.' },
  { q: 'Which protein stores O₂ in tissues?', a: 'myoglobin', o: ['hemoglobin', 'collagen', 'α-keratin'], e: '**Myoglobin** stores O₂; hemoglobin transports it.' },
  { q: 'Hemoglobin and myoglobin are conjugated proteins, meaning they…', a: 'have a protein and a non-protein part', o: ['are made of two proteins', 'contain no amino acids', 'are fibrous'], e: 'Conjugated = **protein + non-protein** (heme).' },
];

// Amino acids the peptide renderer can draw, for hydrolysis problems.
const DRAWN = AMINO_ACIDS.filter((a) => !a.noDraw);
const NEAR = { Gly: 'Ala', Ala: 'Gly', Val: 'Leu', Leu: 'Ile', Ile: 'Leu', Ser: 'Thr', Thr: 'Ser', Phe: 'Tyr', Tyr: 'Phe', Cys: 'Ser', Met: 'Cys', Asp: 'Glu', Glu: 'Asp', Asn: 'Gln', Gln: 'Asn', Lys: 'Arg' };
const listNames = (threes) => threes.map((t) => aminoAcid(t).name).join(', ');

const DENATURE = [
  { q: 'Denaturation changes a protein\'s shape without breaking its…', a: 'peptide bonds', o: ['hydrogen bonds', 'ionic attractions', 'London dispersion forces'], e: 'The **amide bonds** of the primary structure stay intact.' },
  { q: 'Which can denature a protein?', a: 'heat, acid, base or agitation', o: ['only enzymes', 'only water', 'adding more amino acids'], e: '**High temperature, acid, base and even agitation** disrupt the noncovalent interactions.' },
  { q: 'After denaturation, a globular protein is usually…', a: 'less water soluble', o: ['more water soluble', 'hydrolyzed into amino acids', 'unchanged'], e: 'Denaturation often makes globular proteins **less water soluble**.' },
  { q: 'Cooking egg white (ovalbumin) is an example of…', a: 'denaturation', o: ['hydrolysis', 'saponification', 'a mutation'], e: 'Heat **denatures** ovalbumin: clear → opaque white, no peptide bonds broken.' },
  { q: 'Which level of structure survives denaturation?', a: 'primary', o: ['secondary', 'tertiary', 'quaternary'], e: 'Only the **primary** structure (the sequence) survives; the folding is lost.' },
  { q: 'Breaking a protein\'s peptide bonds with water is…', a: 'hydrolysis', o: ['denaturation', 'oxidation', 'isomerization'], e: '**Hydrolysis** breaks peptide bonds. Denaturation only changes the shape.' },
];
const DIGEST = [
  { q: 'Where does pepsin work?', a: 'in the stomach, in gastric juice', o: ['in the intestines', 'in the liver', 'in the blood'], e: '**Pepsin** works in **gastric juice** and cleaves some peptide bonds.' },
  { q: 'Which enzymes finish protein digestion in the intestines?', a: 'trypsin and chymotrypsin', o: ['pepsin and lipase', 'amylase and lactase', 'maltase and sucrase'], e: '**Trypsin and chymotrypsin** hydrolyze the remaining amide bonds into amino acids.' },
  { q: 'What does pepsin make from large proteins?', a: 'smaller peptide chains', o: ['individual amino acids only', 'glucose', 'fatty acids'], e: 'Pepsin cleaves **some** bonds → **smaller peptides**. Intestinal enzymes make the amino acids.' },
  { q: 'Protein hydrolysis can be done with…', a: 'aqueous acid, base or certain enzymes', o: ['heat alone', 'NAD⁺', 'agitation'], e: 'Peptide bonds break with **acid, base or enzymes** plus water.' },
];

// ---- Lecture 19: enzymes --------------------------------------------------------------------------

const BASICS = [
  { q: 'Enzymes speed up reactions by about…', a: '10⁶ to 10¹² times', o: ['2 to 10 times', '10 to 100 times', '1,000 times at most'], e: '**10⁶ to 10¹² times faster**, without being changed.' },
  { q: 'After the reaction, an enzyme is…', a: 'unchanged', o: ['used up', 'turned into product', 'denatured'], e: 'A catalyst comes out **unchanged**.' },
  { q: 'The names of most enzymes end in…', a: '-ase', o: ['-ose', '-ine', '-ol'], e: '**-ase**: maltase, lipase, peptidase. (-ose is for sugars.)' },
  { q: 'Each enzyme catalyzes…', a: 'a certain reaction or type of reaction only', o: ['any reaction in the cell', 'only hydrolysis', 'only redox reactions'], e: 'Enzymes are very **specific**.' },
  { q: 'An enzyme converts its substrate into…', a: 'product', o: ['a cofactor', 'a zymogen', 'an inhibitor'], e: '**Substrate → product.**' },
  { q: 'Enzymes are made of…', a: 'protein', o: ['lipid', 'carbohydrate', 'DNA'], e: 'Enzymes are **proteins** (most are globular).' },
];
const SUBSTRATES = [['maltase', 'maltose'], ['lactase', 'lactose'], ['sucrase', 'sucrose'], ['lipase', 'lipids (triacylglycerols)'], ['peptidase', 'peptides']];

const COFACTORS = [
  { q: 'A cofactor is…', a: 'a nonprotein part some enzymes need', o: ['the substrate of an enzyme', 'an inactive enzyme', 'a kind of inhibitor'], e: 'A cofactor (coenzyme) is a **nonprotein** component: a metal ion or an organic molecule.' },
  { q: 'Which can be a cofactor?', a: 'a metal ion or an organic molecule', o: ['only a metal ion', 'only another protein', 'only water'], e: '**A metal ion or an organic molecule.**' },
  { q: 'NAD is derived from…', a: 'vitamin B₃', o: ['vitamin C', 'vitamin K', 'vitamin D'], e: 'NAD comes from **vitamin B₃**.' },
  { q: 'NAD is used in which reactions?', a: 'oxidation–reduction', o: ['hydrolysis', 'isomerization', 'ligation'], e: 'NAD⁺/NADH carries H in **redox** reactions.' },
  { q: 'Which vitamins act as enzyme cofactors?', a: 'K, C and most B vitamins', o: ['A and D only', 'only vitamin E', 'none of them'], e: '**Vitamin K, vitamin C and most of the B vitamins.**' },
];
const REDOX = [
  { d: 'lactate + NAD⁺ → pyruvate + NADH + H⁺', ask: 'lactate', a: 'oxidized', e: 'Lactate **loses 2 H** (C–OH → C=O): it is **oxidized**, and NAD⁺ is reduced.' },
  { d: 'lactate + NAD⁺ → pyruvate + NADH + H⁺', ask: 'NAD⁺', a: 'reduced', e: 'NAD⁺ **gains** the H atoms: it is **reduced** to NADH.' },
  { d: 'pyruvate + NADH + H⁺ → lactate + NAD⁺', ask: 'pyruvate', a: 'reduced', e: 'Pyruvate **gains** H (C=O → C–OH): it is **reduced**, and NADH is oxidized.' },
  { d: 'pyruvate + NADH + H⁺ → lactate + NAD⁺', ask: 'NADH', a: 'oxidized', e: 'NADH **gives up** its H: it is **oxidized** to NAD⁺.' },
];
const KEY_ROWS = ENZYME_CLASSES.map((c) => [c, CLASS_KEYS[c]]);

const MECH = [
  { q: 'The part of an enzyme that binds the substrate is the…', a: 'active site', o: ['allosteric site', 'cofactor', 'zymogen'], e: 'The **active site** binds the substrate, forming the enzyme–substrate complex.' },
  { q: 'When the substrate binds the active site, it forms…', a: 'an enzyme–substrate complex', o: ['a zymogen', 'a disulfide bond', 'a peptide bond'], e: 'Enzyme + substrate → **enzyme–substrate complex** → enzyme + products.' },
  { q: 'The lock-and-key model says the active site is…', a: 'rigid, an exact match', o: ['flexible', 'far from the substrate', 'made of DNA'], e: 'Lock-and-key: a **rigid** cavity the substrate must exactly fit.' },
  { q: 'The induced-fit model says the active site is…', a: 'flexible, changing shape to fit', o: ['rigid, an exact match', 'covalently bound to the substrate', 'never used again'], e: 'Induced fit: **flexible**; the enzyme changes shape when the substrate binds.' },
  { q: 'Enzymes in the body usually have maximum activity around…', a: '37 °C', o: ['0 °C', '60 °C', '100 °C'], e: 'Around **37 °C**, body temperature.' },
  { q: 'Above its optimum temperature, an enzyme\'s activity drops because…', a: 'the enzyme is denatured', o: ['the substrate is used up', 'its peptide bonds hydrolyze', 'it becomes a zymogen'], e: 'Heat **denatures** the protein, so its active site loses its shape.' },
];
// Where an enzyme works, and where its activity should peak (pH values from the Lecture 9 slide).
// Each comes with three curves whose peaks are far apart, so only one fits.
const PLACES = [
  { where: 'in the stomach, where conditions are acidic', peak: 2, peaks: [2, 7, 10] },
  { where: 'in the small intestine, at about pH 8.5', peak: 9, peaks: [2, 5, 9] },
  { where: 'in the blood, at about pH 7.4', peak: 7, peaks: [2, 7, 11] },
];

const REGULATION = [
  { q: 'In allosteric control, the regulator binds…', a: 'far away from the active site', o: ['inside the active site', 'to the substrate', 'to the product'], e: '**Allo** = other: the regulator binds **away from the active site**.' },
  { q: 'Negative allosteric control…', a: 'decreases the rate of reaction', o: ['increases the rate of reaction', 'cleaves a zymogen', 'denatures the enzyme'], e: 'Negative = **inhibition**: the rate goes **down**.' },
  { q: 'Positive allosteric control…', a: 'increases the rate of reaction', o: ['decreases the rate of reaction', 'destroys the active site', 'adds water'], e: 'Positive = **activation**: the rate goes **up**.' },
  { q: 'During the fasting state, which enzymes are activated?', a: 'those that break down glycogen', o: ['those that make glycogen', 'only digestive zymogens', 'none'], e: 'Fasting: **break down** glycogen to release glucose. Fed: make glycogen.' },
  { q: 'During the fed state, which enzymes are activated?', a: 'those that make glycogen', o: ['those that break down glycogen', 'HIV protease', 'none'], e: 'Fed: **synthesize** glycogen to store glucose.' },
  { q: 'A zymogen is…', a: 'an inactive form of an enzyme', o: ['an allosteric inhibitor', 'a coenzyme', 'a denatured enzyme'], e: 'Zymogens (proenzymes) are **inactive**, switched on when needed.' },
  { q: 'A zymogen is activated by…', a: 'cleavage by a peptidase', o: ['adding NAD⁺', 'heating to 37 °C', 'binding an inhibitor'], e: 'A **peptidase cleaves** off part of the chain.' },
  { q: 'Where is trypsinogen made?', a: 'in the pancreas', o: ['in the stomach', 'in the liver', 'in the intestine'], e: 'Made in the **pancreas**, activated to trypsin **in the intestine**.' },
  { q: 'Trypsinogen is cleaved to its active form…', a: 'in the intestine', o: ['in the pancreas', 'in the stomach', 'in the blood'], e: 'It is activated **in the intestine**, where the food is, so it can\'t digest the pancreas.' },
];
const INHIB_CASES = [
  { d: 'It looks like the substrate and binds the active site.', kind: 'competitive' },
  { d: 'It binds the enzyme somewhere other than the active site.', kind: 'noncompetitive' },
  { d: 'It is an allosteric inhibitor.', kind: 'noncompetitive' },
  { d: 'It lowers activity, and structural analysis shows it in the active site.', kind: 'competitive' },
  { d: 'It binds far from the active site and changes its shape so the substrate no longer fits.', kind: 'noncompetitive' },
];
const BOND_CASES = [
  { d: 'It forms a covalent bond to the enzyme.', kind: 'irreversible' },
  { d: 'Enzyme activity comes back once it is released.', kind: 'reversible' },
  { d: 'It permanently destroys the enzyme\'s activity.', kind: 'irreversible' },
  { d: 'It is a competitive inhibitor.', kind: 'reversible' },
  { d: 'It is penicillin, binding the bacterial cell-wall enzyme.', kind: 'irreversible' },
];
const DRUGS = [
  { q: 'Penicillin kills bacteria by…', a: 'irreversibly inhibiting the cell-wall enzyme', o: ['reversibly binding HIV protease', 'blocking cholesterol synthesis', 'hydrolyzing DNA'], e: 'It **covalently** inactivates the enzyme for the **bacterial cell wall**.' },
  { q: 'Penicillin does not harm human cells because…', a: 'human cells have no cell walls', o: ['humans lack enzymes', 'it is reversible in humans', 'it is digested by pepsin'], e: '**We don\'t have cell walls.**' },
  { q: 'Amprenavir is…', a: 'an HIV protease inhibitor', o: ['a statin', 'an antibiotic like penicillin', 'a zymogen'], e: 'Amprenavir inhibits **HIV protease**, lowering the virus population in the blood.' },
  { q: 'Statins lower cholesterol by…', a: 'blocking enzymes that make cholesterol', o: ['hydrolyzing cholesterol', 'binding HIV protease', 'destroying cell walls'], e: 'They block the **enzymes that make cholesterol** at its early stages.' },
  { q: 'Which drug is a statin?', a: 'atorvastatin (Lipitor)', o: ['penicillin', 'amprenavir', 'naloxone'], e: '**Atorvastatin** (Lipitor) and simvastatin (Zocor) are statins.' },
];

// ---- Lecture 20: nucleic acids --------------------------------------------------------------------

const strand = (r, n) => Array.from({ length: n }, () => r.pick(DNA_BASES)).join('');
const lab = (s, five) => (five ? `5′-${s}-3′` : `3′-${s}-5′`);
// A written strand, as the same strand read 5′ → 3′ (so two ways of writing one strand compare equal).
const as53 = (s, five) => (five ? s : reverse(s));

const OVERVIEW = [
  { q: 'Which nucleic acid translates genetic information into proteins?', a: 'RNA', o: ['DNA', 'ATP', 'NAD⁺'], e: '**RNA** translates the information in DNA into proteins.' },
  { q: 'Which nucleic acid stores genetic information and passes it on?', a: 'DNA', o: ['RNA', 'ATP', 'collagen'], e: '**DNA** stores the genetic information.' },
  { q: 'How many chromosomes do humans have?', a: '46 (23 pairs)', o: ['23 (12 pairs)', '92 (46 pairs)', '3 billion'], e: '**46 chromosomes, 23 pairs.**' },
  { q: 'About how many nucleotides are in human DNA?', a: '3 billion', o: ['a few thousand', '46', '20'], e: '**3 billion**; RNA molecules have only a few thousand.' },
  { q: 'Where is DNA found in the cell?', a: 'in the chromosomes in the nucleus', o: ['in the cell wall', 'in the cell membrane', 'outside the cell'], e: 'In the **chromosomes** within the **nucleus**.' },
  { q: 'The information in one gene is used to make…', a: 'one protein', o: ['one chromosome', 'every protein', 'one sugar'], e: '**One gene → one protein.**' },
  { q: 'Who proposed the double helix, and when?', a: 'Watson and Crick, 1953', o: ['Watson and Crick, 1903', 'Fischer, 1953', 'Haworth, 1929'], e: '**Watson and Crick, 1953.**' },
  { q: 'Nucleic acids are polymers of…', a: 'nucleotides', o: ['amino acids', 'monosaccharides', 'fatty acids'], e: 'Unbranched chains of **nucleotides**.' },
];
const FLOW = [
  ['replication', 'DNA is duplicated before a cell divides'],
  ['transcription', 'RNA is made from DNA'],
  ['translation', 'protein is made from RNA'],
];
const HELIX = [
  { q: 'In the double helix, the two strands run…', a: 'in opposite directions', o: ['in the same direction', 'at right angles', 'in a circle'], e: 'One runs 5′ → 3′, the other 3′ → 5′.' },
  { q: 'Where are the bases in the double helix?', a: 'on the inside', o: ['on the outside', 'in the backbone', 'at the 5′ end only'], e: 'Bases **inside**; sugar–phosphate backbone **outside**.' },
  { q: 'Where is the sugar–phosphate backbone in the double helix?', a: 'on the outside', o: ['on the inside', 'between the base pairs', 'only at the 3′ end'], e: 'The backbone lies on the **outside**.' },
  { q: 'The DNA double helix is…', a: 'right-handed', o: ['left-handed', 'flat', 'triple stranded'], e: 'Two strands wound into a **right-handed** double helix.' },
  { q: 'In a base pair, a purine always pairs with a…', a: 'pyrimidine', o: ['purine', 'sugar', 'phosphate'], e: '**Purine + pyrimidine**: A with T (or U), G with C.' },
];
const STRAND_FACTS = [
  { q: 'Nucleotides in DNA are joined by…', a: 'phosphodiester linkages', o: ['peptide bonds', 'disulfide bonds', 'hydrogen bonds'], e: '**Phosphodiester linkages** join the 3′ C of one to the 5′ C of the next.' },
  { q: 'What is at the 5′ end of a polynucleotide?', a: 'a free phosphate group', o: ['a free OH group', 'a base', 'nothing'], e: '**5′ end: free phosphate.** 3′ end: free OH.' },
  { q: 'What is at the 3′ end of a polynucleotide?', a: 'a free OH group', o: ['a free phosphate group', 'a base', 'an amino group'], e: '**3′ end: free OH.**' },
  { q: 'The backbone of DNA is made of…', a: 'alternating sugar and phosphate', o: ['alternating bases and sugars', 'amino acids', 'only phosphates'], e: '**Sugar–phosphate–sugar–phosphate.**' },
  { q: 'Which carbon of the sugar holds the base?', a: '1′', o: ['2′', '3′', '5′'], e: '**1′ C: base**; 2′: OH or H; 3′: OH end; 5′: phosphate.' },
  { q: 'Which carbon of the sugar holds the phosphate?', a: '5′', o: ['1′', '2′', '3′'], e: 'The phosphate is on **C5′** (the 5′ end).' },
  { q: 'A polynucleotide sequence is always read…', a: 'from the 5′ end to the 3′ end', o: ['from the 3′ end to the 5′ end', 'from either end', 'from the middle out'], e: 'Always read **5′ → 3′**.' },
  { q: 'In DNA, the genetic information is carried by…', a: 'the sequence of the bases', o: ['the phosphates', 'the sugars', 'the 3′-OH'], e: 'The **sequence of the bases**.' },
];

export const proteinNucleicGenerators = [
  // ----- L18 -----
  {
    id: 'l18-level', skill: 'l18.levels', title: 'Which level of structure?',
    make(r) {
      const x = r.pick(LEVEL_FACTS);
      const skill = x.a === 'quaternary' ? 'l18.quaternary' : x.a === 'tertiary' ? 'l18.tertiary' : 'l18.levels';
      return mcq(`Which level of protein structure is ${x.d}?`, LEVELS, LEVELS.indexOf(x.a), { skill, shuffle: false, explain: `That is **${x.a}** structure. Primary: sequence. Secondary: α-helix/β-sheet. Tertiary: the whole chain\'s 3D shape. Quaternary: subunits together.` });
    },
  },
  { id: 'l18-secondary', skill: 'l18.levels', title: 'α-Helix & β-sheet', make(r) { return factMcq(r, SECONDARY, 'l18.levels'); } },
  {
    id: 'l18-role', skill: 'l18.tertiary', title: 'What does this side chain do?',
    make(r) {
      const a = r.pick(ROLE_ACIDS);
      const role = roleOf(a);
      const keys = Object.keys(ROLE);
      return mcq(`Choose the correct statement about the role of **${a.name}** in stabilizing the tertiary structure of a protein.`, keys.map((k) => ROLE[k]), keys.indexOf(role), {
        skill: 'l18.tertiary', figure: { smiles: aaSmiles(a), highlight: aaSideAtoms(a), scale: 28 }, explain: ROLE_WHY[role](a),
      });
    },
  },
  {
    id: 'l18-interaction', skill: 'l18.tertiary', title: 'Name the interaction',
    make(r) {
      const x = r.pick(INTERACTIONS);
      const wrong = r.shuffle(INTERACTION_NAMES.filter((n) => n !== x.a)).slice(0, 3);
      return mcq(x.q, [x.a, ...wrong], 0, { skill: 'l18.tertiary', explain: x.e });
    },
  },
  {
    id: 'l18-fibrous', skill: 'l18.common', title: 'Fibrous or globular?',
    make(r) {
      const x = r.pick(FIBROUS);
      return mcq(`Fibrous or globular: **${x.p}**?`, ['fibrous', 'globular'], x.k === 'fibrous' ? 0 : 1, { skill: 'l18.common', shuffle: false, explain: x.k === 'fibrous' ? `**Fibrous**: long chains bundled into rods or sheets, with a structural role.` : `**Globular**: a compact, water-soluble shape. Most enzymes and transport proteins are globular.` });
    },
  },
  { id: 'l18-common', skill: 'l18.common', title: 'Keratin, collagen & protein jobs', make(r) { return factMcq(r, COMMON, 'l18.common'); } },
  { id: 'l18-hemo', skill: 'l18.hemoglobin', title: 'Hemoglobin, myoglobin & sickle cell', make(r) { return factMcq(r, HEMO, 'l18.hemoglobin'); } },
  {
    id: 'l18-hydrolysis', skill: 'l18.hydrolysis', title: 'Products of hydrolysis',
    make(r) {
      const n = r.pick([2, 3, 3]);
      const seq = Array.from({ length: n }, () => r.pick(DRAWN).three);
      const right = listNames(seq);
      const wrongs = new Set();
      for (let i = 0; i < 12 && wrongs.size < 3; i++) {
        const k = r.int(0, n - 1);
        const alt = NEAR[seq[k]] || 'Gly';
        const w = seq.slice(); w[k] = alt;
        const t = listNames(w);
        if (t !== right) wrongs.add(t);
      }
      wrongs.add(n === 2 ? 'none: the dipeptide stays whole' : 'a dipeptide and one amino acid only');
      const choices = [right, ...[...wrongs].slice(0, 3)];
      return mcq(`Complete hydrolysis of **${seq.join('–')}** gives which amino acids?`, choices, 0, {
        skill: 'l18.hydrolysis', figure: { peptides: [{ seq }] },
        explain: `Water breaks **all ${n - 1}** peptide bond${n === 2 ? '' : 's'}, freeing each amino acid: **${right}**. It takes ${n - 1} H₂O.`,
      });
    },
  },
  {
    id: 'l18-water', skill: 'l18.hydrolysis', title: 'How much water?',
    make(r) {
      const sizes = [['dipeptide', 2], ['tripeptide', 3], ['tetrapeptide', 4], ['pentapeptide', 5], ['nonapeptide', 9], ['chain of 21 amino acids', 21], ['chain of 153 amino acids (myoglobin)', 153]];
      const [name, k] = r.pick(sizes);
      return { type: 'num', skill: 'l18.hydrolysis', prompt: `How many water molecules does it take to hydrolyze a **${name}** completely into amino acids?`, answer: k - 1, tol: 0, explain: `A chain of ${k} amino acids has **${k - 1}** peptide bonds, and each takes one H₂O.` };
    },
  },
  {
    id: 'l18-read', skill: 'l18.hydrolysis', title: 'Read a peptide drawn backwards',
    make(r) {
      const seq = r.shuffle(DRAWN.filter((a) => a.r && a.r.length <= 10)).slice(0, 3).map((a) => a.three);
      const rs = seq.map((t) => aminoAcid(t).r);
      const back = [...seq].reverse();
      const shown = [...rs].reverse().map((x) => x.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])).join(', ');
      const options = [seq.join('–'), back.join('–'), [seq[1], seq[0], seq[2]].join('–'), [seq[0], seq[2], seq[1]].join('–')];
      return mcq(`A tripeptide is drawn with its **–COO⁻ on the left** and its **–NH₃⁺ on the right**. Its side chains, left to right, are ${shown}. What is its name?`, [...new Set(options)], 0, {
        skill: 'l18.hydrolysis', explain: `Name a peptide from its free **–NH₃⁺** end, here on the right. Reading right to left: **${seq.join('–')}**.`,
      });
    },
  },
  { id: 'l18-denature', skill: 'l18.denature', title: 'Denaturation vs hydrolysis', make(r) { return factMcq(r, DENATURE, 'l18.denature'); } },
  { id: 'l18-digest', skill: 'l18.hydrolysis', title: 'Pepsin, trypsin & chymotrypsin', make(r) { return factMcq(r, DIGEST, 'l18.hydrolysis'); } },
  { id: 'l18-match-levels', skill: 'l18.quaternary', title: 'Match the four levels', make(r) {
    return matchq('Match each level of structure with its description.', r.shuffle([['primary', 'the amino acid sequence'], ['secondary', 'α-helix and β-sheets'], ['tertiary', 'the 3D shape of one whole chain'], ['quaternary', 'two or more subunits combined']]), { skill: 'l18.quaternary' });
  } },
  { id: 'l18-match-forces', skill: 'l18.tertiary', title: 'Match the interactions', make(r) {
    return matchq('Match each side chain with the interaction it usually forms.', r.shuffle([['cysteine', 'disulfide bond'], ['serine', 'hydrogen bonding'], ['lysine', 'ionic (electrostatic) interaction'], ['valine', 'London dispersion, in the interior']]), { skill: 'l18.tertiary' });
  } },

  // ----- L19 -----
  { id: 'l19-basics', skill: 'l19.basics', title: 'What enzymes are', make(r) { return factMcq(r, BASICS, 'l19.basics'); } },
  {
    id: 'l19-substrate', skill: 'l19.basics', title: 'Name the enzyme or its substrate',
    make(r) {
      const [enz, sub] = r.pick(SUBSTRATES);
      const others = r.shuffle(SUBSTRATES.filter((s) => s[0] !== enz)).slice(0, 3);
      if (r.chance(0.5)) return mcq(`What does **${enz}** act on?`, [sub, ...others.map((s) => s[1])], 0, { skill: 'l19.basics', explain: `Drop the **-ase**: ${enz} acts on **${sub}**.` });
      return mcq(`Which enzyme acts on **${sub}**?`, [enz, ...others.map((s) => s[0])], 0, { skill: 'l19.basics', explain: `Substrate name + **-ase**: **${enz}**.` });
    },
  },
  { id: 'l19-cofactor', skill: 'l19.cofactors', title: 'Cofactors & NAD', make(r) { return factMcq(r, COFACTORS, 'l19.cofactors'); } },
  {
    id: 'l19-redox', skill: 'l19.cofactors', title: 'Oxidized or reduced?',
    make(r) {
      const x = r.pick(REDOX);
      return mcq(`In **${x.d}**, is ${x.ask} oxidized or reduced?`, ['oxidized', 'reduced'], x.a === 'oxidized' ? 0 : 1, { skill: 'l19.cofactors', shuffle: false, explain: x.e });
    },
  },
  {
    id: 'l19-class', skill: 'l19.classes', title: 'Classify the enzyme',
    make(r) {
      const x = r.pick(ENZYME_REACTIONS);
      return mcq(`Which class of enzyme most likely catalyzes this reaction (${x.what})?`, ENZYME_CLASSES, ENZYME_CLASSES.indexOf(x.cls), { skill: 'l19.classes', shuffle: false, figure: { rxn: quizRxn(x) }, explain: x.why });
    },
  },
  {
    id: 'l19-class-key', skill: 'l19.classes', title: 'Key clue → class',
    make(r) {
      const [cls, info] = r.pick(KEY_ROWS);
      if (r.chance(0.5)) return mcq(`In a reaction, **${info.key}**. Which class of enzyme catalyzes it?`, ENZYME_CLASSES, ENZYME_CLASSES.indexOf(cls), { skill: 'l19.classes', shuffle: false, explain: `That key clue means **${cls}**: it ${info.does}.` });
      const wrongs = r.shuffle(ENZYME_CLASSES.filter((c) => c !== cls)).slice(0, 3).map((c) => CLASS_KEYS[c].does);
      return mcq(`What does a **${cls}** do?`, [info.does, ...wrongs], 0, { skill: 'l19.classes', explain: `A ${cls} ${info.does}. Key clue: ${info.key}.` });
    },
  },
  { id: 'l19-mechanism', skill: 'l19.mechanism', title: 'Active site & models', make(r) { return factMcq(r, MECH, 'l19.mechanism'); } },
  {
    id: 'l19-optimum', skill: 'l19.mechanism', title: 'Which activity curve?',
    make(r) {
      const place = r.pick(PLACES);
      const curves = r.shuffle(place.peaks).map((p, i) => ({ label: 'ABC'[i], peak: p }));
      const right = curves.find((c) => c.peak === place.peak);
      return mcq(`An enzyme that works **${place.where}** has which activity curve?`, ['A', 'B', 'C'], 'ABC'.indexOf(right.label), {
        skill: 'l19.mechanism', shuffle: false, figure: { activity: { x: 'pH', curves } },
        explain: `An enzyme works best where it lives: its curve should peak near pH ${place.peak}. That is curve **${right.label}**.`,
      });
    },
  },
  {
    id: 'l19-read-optimum', skill: 'l19.mechanism', title: 'Read the optimum pH',
    make(r) {
      const peak = r.int(2, 10);
      return { type: 'num', skill: 'l19.mechanism', prompt: 'At what pH does this enzyme work fastest? (Read the peak.)', figure: { activity: { x: 'pH', curves: [{ label: '', peak }] } }, answer: peak, tol: 0.5, explain: `The curve peaks at **pH ${peak}**: its **optimum pH**, where catalysis is at a maximum rate.` };
    },
  },
  { id: 'l19-regulation', skill: 'l19.regulation', title: 'Allosteric control & zymogens', make(r) { return factMcq(r, REGULATION, 'l19.regulation'); } },
  {
    id: 'l19-inhibitor', skill: 'l19.inhibitors', title: 'What kind of inhibitor?',
    make(r) {
      if (r.chance(0.5)) {
        const x = r.pick(INHIB_CASES);
        return mcq(`An enzyme inhibitor: ${x.d} Is it competitive or noncompetitive?`, ['competitive', 'noncompetitive'], x.kind === 'competitive' ? 0 : 1, { skill: 'l19.inhibitors', shuffle: false, explain: x.kind === 'competitive' ? 'It binds the **active site**, competing with the substrate → **competitive**.' : 'It binds **somewhere other than the active site** → **noncompetitive** (allosteric inhibitors are this kind).' });
      }
      const x = r.pick(BOND_CASES);
      return mcq(`An enzyme inhibitor: ${x.d} Is it reversible or irreversible?`, ['reversible', 'irreversible'], x.kind === 'reversible' ? 0 : 1, { skill: 'l19.inhibitors', shuffle: false, explain: x.kind === 'reversible' ? 'Reversible inhibitors bind **noncovalently**; activity is restored when they are released.' : 'Irreversible inhibitors bind **covalently** and **permanently** destroy activity.' });
    },
  },
  { id: 'l19-drug', skill: 'l19.inhibitors', title: 'Penicillin, HIV drugs & statins', make(r) { return factMcq(r, DRUGS, 'l19.inhibitors'); } },
  { id: 'l19-match-classes', skill: 'l19.classes', title: 'Match the enzyme classes', make(r) {
    return matchFrom(r, KEY_ROWS.map(([c, i]) => [c, i.key]), 4, 'Match each enzyme class with its key clue.', 'l19.classes');
  } },
  { id: 'l19-match-inhib', skill: 'l19.inhibitors', title: 'Match the inhibitors', make(r) {
    return matchq('Match each inhibitor with how it works.', r.shuffle([['competitive', 'looks like the substrate; binds the active site'], ['noncompetitive', 'binds somewhere other than the active site'], ['irreversible', 'bonds covalently; activity is gone for good']]), { skill: 'l19.inhibitors' });
  } },

  // ----- L20 -----
  { id: 'l20-overview', skill: 'l20.overview', title: 'DNA, RNA & chromosomes', make(r) { return factMcq(r, OVERVIEW, 'l20.overview'); } },
  {
    id: 'l20-flow', skill: 'l20.overview', title: 'Replication, transcription, translation',
    make(r) {
      const [name, what] = r.pick(FLOW);
      if (r.chance(0.5)) return mcq(`In which process is **${what}**?`, FLOW.map((f) => f[0]), FLOW.findIndex((f) => f[0] === name), { skill: 'l20.overview', shuffle: false, explain: `**${cap(name)}**: ${what}.` });
      return mcq(`What happens in **${name}**?`, FLOW.map((f) => f[1]), FLOW.findIndex((f) => f[0] === name), { skill: 'l20.overview', explain: `**${cap(name)}**: ${what}.` });
    },
  },
  {
    id: 'l20-base', skill: 'l20.parts', title: 'Purine or pyrimidine?',
    make(r) {
      const b = r.pick(Object.keys(BASES));
      const x = BASES[b];
      if (r.chance(0.6)) return mcq('Is this base a purine or a pyrimidine?', ['purine', 'pyrimidine'], x.kind === 'purine' ? 0 : 1, { skill: 'l20.parts', shuffle: false, figure: { smiles: x.smiles, scale: 28 }, explain: `This is **${x.name}** (${b}): ${x.kind === 'purine' ? '**two** fused rings → **purine**' : '**one** ring → **pyrimidine**'}.` });
      const where = b === 'T' ? 'only in DNA' : b === 'U' ? 'only in RNA' : 'in both DNA and RNA';
      return mcq(`Where is **${x.name}** found?`, ['only in DNA', 'only in RNA', 'in both DNA and RNA'], ['only in DNA', 'only in RNA', 'in both DNA and RNA'].indexOf(where), { skill: 'l20.parts', shuffle: false, explain: `${cap(x.name)} is found **${where}**. DNA: A, C, G, T. RNA: A, C, G, U.` });
    },
  },
  {
    id: 'l20-dna-rna', skill: 'l20.parts', title: 'DNA or RNA?',
    make(r) {
      const deoxy = r.chance(0.5);
      const b = r.pick(Object.keys(BASES).filter((k) => canPair(k, deoxy)));
      const phos = r.int(0, 1);
      return mcq(`Is this ${phos ? 'nucleotide' : 'nucleoside'} found in DNA or RNA?`, ['DNA', 'RNA'], deoxy ? 0 : 1, {
        skill: 'l20.parts', shuffle: false, figure: { smiles: nucleoSmiles(b, deoxy, phos) },
        explain: deoxy ? '**No OH on the 2′ carbon** → 2-deoxyribose → **DNA**.' : 'There is an **OH on the 2′ carbon** → ribose → **RNA**.',
      });
    },
  },
  {
    id: 'l20-nucleoside-name', skill: 'l20.naming', title: 'Name the nucleoside',
    make(r) {
      const deoxy = r.chance(0.4);
      const b = r.pick(Object.keys(BASES).filter((k) => canPair(k, deoxy) && !(k === 'T')));
      const right = nucleosideName(b, deoxy);
      const sugar = deoxy ? '2-deoxyribose' : 'ribose';
      const wrong = new Set([nucleosideName(b, !deoxy), `${BASES[b].nucleoside.replace(/osine$|idine$/, BASES[b].kind === 'purine' ? 'idine' : 'osine')}`, ...Object.keys(BASES).filter((k) => k !== b && canPair(k, deoxy) && k !== 'T').map((k) => nucleosideName(k, deoxy))]);
      wrong.delete(right);
      return mcq(`What is the nucleoside formed from **${BASES[b].name}** and **${sugar}**?`, [right, ...r.shuffle([...wrong]).slice(0, 3)], 0, {
        skill: 'l20.naming', figure: { smiles: nucleoSmiles(b, deoxy, 0) },
        explain: `${cap(BASES[b].name)} is a **${BASES[b].kind}**, so its nucleoside ends in **-${BASES[b].kind === 'purine' ? 'osine' : 'idine'}**${deoxy ? ', with **deoxy-** for 2-deoxyribose' : ''}: **${right}**.`,
      });
    },
  },
  {
    id: 'l20-abbrev', skill: 'l20.naming', title: 'Nucleotide abbreviations',
    make(r) {
      const deoxy = r.chance(0.5);
      const b = r.pick(Object.keys(BASES).filter((k) => canPair(k, deoxy)));
      const n = r.int(1, 3);
      const right = abbrev(b, deoxy, n);
      const mode = r.pick(['name', 'draw', 'expand']);
      // (no sugar-flipped twin for thymine: its nucleoside is often called thymidine either way)
      const wrong = new Set([...(b === 'T' ? [] : [abbrev(b, !deoxy, n)]), abbrev(b, deoxy, n === 3 ? 1 : n + 1), abbrev(b, deoxy, n === 1 ? 3 : n - 1), abbrev(r.pick(Object.keys(BASES).filter((k) => k !== b)), deoxy, n)]);
      wrong.delete(right);
      const why = `${deoxy ? '**d** (deoxyribose, no 2′ OH)' : 'no d (ribose, 2′ OH)'} + **${b}** (${BASES[b].name}) + **${['', 'M', 'D', 'T'][n]}** (${['', 'mono', 'di', 'tri'][n]}phosphate) + **P** = **${right}**.`;
      if (mode === 'expand') {
        const wrongNames = [...wrong].slice(0, 3).map((w) => { const d = w[0] === 'd'; const k = d ? w[1] : w[0]; const m = 'MDT'.indexOf(d ? w[2] : w[1]) + 1; return nucleotideName(k, d, m); });
        return mcq(`What does **${right}** stand for?`, [nucleotideName(b, deoxy, n), ...wrongNames], 0, { skill: 'l20.naming', explain: why });
      }
      const opts = [right, ...r.shuffle([...wrong]).slice(0, 3)];
      if (mode === 'draw') return mcq('What is the abbreviation for this nucleotide?', opts, 0, { skill: 'l20.naming', figure: { smiles: nucleoSmiles(b, deoxy, n) }, explain: why });
      return mcq(`What is the abbreviation for **${nucleotideName(b, deoxy, n)}**?`, opts, 0, { skill: 'l20.naming', explain: why });
    },
  },
  {
    id: 'l20-side', skill: 'l20.naming', title: 'Nucleoside or nucleotide?',
    make(r) {
      const deoxy = r.chance(0.5);
      const b = r.pick(Object.keys(BASES).filter((k) => canPair(k, deoxy)));
      const n = r.pick([0, 0, 1, 2, 3]);
      return mcq('Is this a nucleoside or a nucleotide?', ['nucleoside', 'nucleotide'], n ? 1 : 0, {
        skill: 'l20.naming', shuffle: false, figure: { smiles: nucleoSmiles(b, deoxy, n) },
        explain: n ? `It has **${n} phosphate${n > 1 ? 's' : ''}** → **nucleotide** (sugar + base + phosphate).` : 'Sugar + base, **no phosphate** → **nucleoside**.',
      });
    },
  },
  { id: 'l20-strand-facts', skill: 'l20.strands', title: 'Backbone & 5′/3′ ends', make(r) { return factMcq(r, STRAND_FACTS, 'l20.strands'); } },
  {
    id: 'l20-read', skill: 'l20.strands', title: 'Name a strand 5′ → 3′',
    make(r) {
      const s = strand(r, r.int(4, 7));
      if (s === reverse(s)) return null;
      const flip = r.chance(0.5);
      const prompt = flip ? `A strand is written **3′-${reverse(s)}-5′**. How is it named, reading 5′ → 3′?` : 'What is this polynucleotide named?';
      const opts = [...new Set([s, reverse(s), complement(s), complement53(s)])];
      return mcq(prompt, opts, 0, { skill: 'l20.strands', figure: flip ? undefined : { dna: [{ top: s, bottom: 'none' }] }, explain: `Always read from the **5′ end to the 3′ end**: **${s}**.` });
    },
  },
  {
    id: 'l20-complement', skill: 'l20.helix', title: 'Complementary strand',
    make(r) {
      const s = strand(r, r.int(6, 8));
      const c = complement(s);
      const right = lab(c, false); // written under the original
      // traps: right letters with the wrong labels; the original strand; purines paired with purines
      const mispair = [...s].map((b) => ({ A: 'G', G: 'A', T: 'C', C: 'T' }[b])).join('');
      const candidates = [[c, true], [s, false], [s, true], [mispair, false]];
      const key53 = as53(c, false);
      const seen = new Set([key53]);
      const wrong = [];
      for (const [t, five] of candidates) {
        const k = as53(t, five);
        if (seen.has(k)) continue;
        seen.add(k);
        wrong.push(lab(t, five));
      }
      if (wrong.length < 3) return null;
      return mcq(`What is the complementary sequence of the DNA fragment **5′-${s}-3′**?`, [right, ...wrong.slice(0, 3)], 0, {
        skill: 'l20.helix', figure: { dna: [{ top: s, bottom: 'blank' }] },
        explain: `Pair each base (A↔T, G↔C) and flip the labels: **${right}**. Read from its own 5′ end, the same strand is 5′-${complement53(s)}-3′.`,
      });
    },
  },
  {
    id: 'l20-complement-typed', skill: 'l20.helix', title: 'Write the complementary strand',
    make(r) {
      const s = strand(r, r.int(5, 8));
      const five = r.chance(0.5);
      const ans = five ? complement53(s) : complement(s);
      return {
        type: 'text', skill: 'l20.helix',
        prompt: five ? `Write the complementary sequence of **5′-${s}-3′** from **5′ to 3′**. Type just the letters.` : `Write the strand that pairs with **5′-${s}-3′**, lined up under it (**3′ → 5′**). Type just the letters.`,
        // the same strand written with its labels the other way round is right too; bare letters must follow the asked direction
        answer: ans, accept: five ? [`5' ${ans} 3'`, `3' ${reverse(ans)} 5'`] : [`3' ${ans} 5'`, `5' ${reverse(ans)} 3'`], placeholder: 'e.g. ACGT',
        figure: { dna: [{ top: s, bottom: 'blank' }] },
        explain: five ? `Pair each base: 3′-${complement(s)}-5′. Reverse it to start from the 5′ end: **5′-${ans}-3′**.` : `Pair each base, A↔T and G↔C: **3′-${ans}-5′**.`,
      };
    },
  },
  {
    id: 'l20-hbonds', skill: 'l20.helix', title: 'Count the hydrogen bonds',
    make(r) {
      const s = strand(r, r.int(4, 7));
      const gc = [...s].filter((b) => b === 'G' || b === 'C').length;
      return {
        type: 'num', skill: 'l20.helix', prompt: `How many hydrogen bonds hold **5′-${s}-3′** to its complementary strand?`,
        figure: { dna: [{ top: s, bottom: 'auto', bonds: false }] }, answer: hBonds(s), tol: 0,
        explain: `Each G–C pair has **3** H-bonds and each A–T pair has **2**: ${gc} × 3 + ${s.length - gc} × 2 = **${hBonds(s)}**.`,
      };
    },
  },
  {
    id: 'l20-pair', skill: 'l20.helix', title: 'Which base pairs with it?',
    make(r) {
      const rna = r.chance(0.3);
      const b = r.pick(rna ? ['A', 'C', 'G', 'U'] : DNA_BASES);
      const p = pairOf(b, { rna });
      if (r.chance(0.5)) {
        const names = ['adenine', 'thymine', 'guanine', 'cytosine', 'uracil'];
        const right = BASES[p].name;
        const wrong = r.shuffle(names.filter((n) => n !== right && n !== BASES[b].name && !(rna ? n === 'thymine' : n === 'uracil'))).slice(0, 3);
        return mcq(`In ${rna ? 'RNA' : 'DNA'}, which base pairs with **${BASES[b].name}**?`, [right, ...wrong], 0, { skill: 'l20.helix', explain: `**${b}–${p}**: ${BASES[b].name} pairs with **${right}**, held by **${hBondsOf(b)}** hydrogen bonds.` });
      }
      return mcq(`How many hydrogen bonds hold a **${b}–${p}** base pair together?`, ['2', '3'], hBondsOf(b) === 2 ? 0 : 1, { skill: 'l20.helix', shuffle: false, explain: `A–T and A–U: **2**. G–C: **3**. This one: **${hBondsOf(b)}**.` });
    },
  },
  { id: 'l20-helix', skill: 'l20.helix', title: 'The double helix', make(r) { return factMcq(r, HELIX, 'l20.helix'); } },
  { id: 'l20-match-bases', skill: 'l20.parts', title: 'Match the bases', make(r) {
    const picks = r.shuffle(Object.keys(BASES)).slice(0, 4);
    return matchq('Match each base with its description.', picks.map((b) => [BASES[b].name, b === 'T' ? 'pyrimidine, only in DNA' : b === 'U' ? 'pyrimidine, only in RNA' : b === 'C' ? 'pyrimidine, in DNA and RNA' : b === 'A' ? 'purine; pairs with T or U' : 'purine; pairs with C']), { skill: 'l20.parts' });
  } },
  { id: 'l20-match-flow', skill: 'l20.overview', title: 'Match the processes', make(r) { return matchq('Match each process with what happens.', r.shuffle(FLOW.map(([a, b]) => [a, b])), { skill: 'l20.overview' }); } },
];

