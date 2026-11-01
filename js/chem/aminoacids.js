// The 20 amino acids of the Lecture 17 chart, as drawn on the slide (each one at its isoelectric pH:
// –NH₃⁺ and –COO⁻, with aspartate and glutamate carrying a side-chain COO⁻ and lysine, arginine and
// histidine a side-chain +). tests/content.test.js checks every structure against its known formula.
//   side: the side chain in SMILES, written from the α carbon outward (null for glycine)
//   r:    the side chain as text, the way a peptide drawing writes it
export const AMINO_ACIDS = [
  // nonpolar
  { name: 'glycine', three: 'Gly', one: 'G', cls: 'nonpolar', r: 'H', side: null, yl: 'glycyl' },
  { name: 'alanine', three: 'Ala', one: 'A', cls: 'nonpolar', r: 'CH3', side: 'C', yl: 'alanyl' },
  { name: 'valine', three: 'Val', one: 'V', cls: 'nonpolar', r: 'CH(CH3)2', side: 'C(C)C', yl: 'valyl' },
  { name: 'leucine', three: 'Leu', one: 'L', cls: 'nonpolar', r: 'CH2CH(CH3)2', side: 'CC(C)C', yl: 'leucyl' },
  { name: 'isoleucine', three: 'Ile', one: 'I', cls: 'nonpolar', r: 'CH(CH3)CH2CH3', side: 'C(C)CC', yl: 'isoleucyl' },
  { name: 'methionine', three: 'Met', one: 'M', cls: 'nonpolar', r: 'CH2CH2SCH3', side: 'CCSC', yl: 'methionyl' },
  { name: 'phenylalanine', three: 'Phe', one: 'F', cls: 'nonpolar', r: 'CH2C6H5', ring: 'phenyl', side: 'Cc1ccccc1', yl: 'phenylalanyl' },
  { name: 'tryptophan', three: 'Trp', one: 'W', cls: 'nonpolar', r: 'CH2C8H6N', side: 'Cc1c[nH]c2ccccc12', yl: 'tryptophyl', noDraw: true },
  { name: 'proline', three: 'Pro', one: 'P', cls: 'nonpolar', r: null, smiles: '[NH2+]1CCCC1C(=O)[O-]', yl: 'prolyl', noDraw: true },
  // polar, uncharged
  { name: 'serine', three: 'Ser', one: 'S', cls: 'polar', r: 'CH2OH', side: 'CO', yl: 'seryl' },
  { name: 'threonine', three: 'Thr', one: 'T', cls: 'polar', r: 'CH(OH)CH3', side: 'C(O)C', yl: 'threonyl' },
  { name: 'cysteine', three: 'Cys', one: 'C', cls: 'polar', r: 'CH2SH', side: 'CS', yl: 'cysteinyl' },
  { name: 'tyrosine', three: 'Tyr', one: 'Y', cls: 'polar', r: 'CH2C6H4OH', ring: 'phenol', side: 'Cc1ccc(O)cc1', yl: 'tyrosyl' },
  { name: 'asparagine', three: 'Asn', one: 'N', cls: 'polar', r: 'CH2CONH2', side: 'CC(=O)N', yl: 'asparaginyl' },
  { name: 'glutamine', three: 'Gln', one: 'Q', cls: 'polar', r: 'CH2CH2CONH2', side: 'CCC(=O)N', yl: 'glutaminyl' },
  // electrically charged: acidic
  { name: 'aspartate', three: 'Asp', one: 'D', cls: 'acidic', r: 'CH2COO⁻', side: 'CC(=O)[O-]', yl: 'aspartyl' },
  { name: 'glutamate', three: 'Glu', one: 'E', cls: 'acidic', r: 'CH2CH2COO⁻', side: 'CCC(=O)[O-]', yl: 'glutamyl' },
  // electrically charged: basic
  { name: 'lysine', three: 'Lys', one: 'K', cls: 'basic', r: 'CH2CH2CH2CH2NH3⁺', side: 'CCCC[NH3+]', yl: 'lysyl' },
  { name: 'arginine', three: 'Arg', one: 'R', cls: 'basic', r: 'CH2CH2CH2NHC(NH2)=NH2⁺', side: 'CCCNC(N)=[NH2+]', yl: 'arginyl', noDraw: true },
  { name: 'histidine', three: 'His', one: 'H', cls: 'basic', r: null, side: 'CC1=C[NH+]=CN1', yl: 'histidyl', noDraw: true },
];

export const AA_CLASSES = {
  nonpolar: 'nonpolar', polar: 'polar', acidic: 'acidic (charged −)', basic: 'basic (charged +)',
};

export const aminoAcid = (three) => AMINO_ACIDS.find((a) => a.three === three) || null;

// The zwitterion, with its side chain
export function aaSmiles(a) {
  if (a.smiles) return a.smiles;
  return a.side ? `[NH3+]C(${a.side})C(=O)[O-]` : '[NH3+]CC(=O)[O-]';
}

// The atoms of the side chain in aaSmiles, to shade them like the slide's chart.
export function aaSideAtoms(a) {
  if (a.three === 'Pro') return [1, 2, 3];
  if (!a.side) return [];
  const total = aaSmiles(a).replace(/\[[^\]]*\]/g, 'X').replace(/[^A-Za-z]/g, '').length;
  // [NH3+] and C(α) come first; C(=O)[O-] (3 atoms) come last
  return Array.from({ length: total - 5 }, (_, i) => i + 2);
}

// A chain of amino acids as a zwitterion, from the N-terminal end, for checking drawings.
export function peptideSmiles(threes) {
  const body = threes.map((t) => {
    const a = aminoAcid(t);
    return a.side ? `C(${a.side})C(=O)` : 'CC(=O)';
  });
  return `[NH3+]${body.join('N')}[O-]`;
}
