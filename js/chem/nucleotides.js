// Nucleosides and nucleotides (Lecture 20), built from parts: a base, ribose or 2-deoxyribose, and
// 0–3 phosphates on the 5′ carbon. Names and abbreviations are built by the same rules the slides
// teach (purines + ribose end in -osine, pyrimidines in -idine; d = deoxy; MP/DP/TP), so questions,
// drawings and answers always agree.

export const BASES = {
  A: { name: 'adenine', kind: 'purine', nucleoside: 'adenosine', smiles: 'Nc1ncnc2[nH]cnc12', attach: 'n1cnc2c(N)ncnc21' },
  G: { name: 'guanine', kind: 'purine', nucleoside: 'guanosine', smiles: 'NC1=NC2=C(N=CN2)C(=O)N1', attach: 'N1C=NC2=C1N=C(N)NC2=O' },
  C: { name: 'cytosine', kind: 'pyrimidine', nucleoside: 'cytidine', smiles: 'NC1=NC(=O)NC=C1', attach: 'N1C=CC(N)=NC1=O' },
  T: { name: 'thymine', kind: 'pyrimidine', nucleoside: 'thymidine', smiles: 'CC1=CNC(=O)NC1=O', attach: 'N1C=C(C)C(=O)NC1=O' },
  U: { name: 'uracil', kind: 'pyrimidine', nucleoside: 'uridine', smiles: 'O=C1C=CNC(=O)N1', attach: 'N1C=CC(=O)NC1=O' },
};
export const PARENTS = { purine: 'c1ncc2[nH]cnc2n1', pyrimidine: 'c1cncnc1' };
export const SUGAR_SMILES = { ribose: 'OCC1OC(O)C(O)C1O', deoxyribose: 'OCC1OC(O)CC1O' };

// Thymine is found only in DNA and uracil only in RNA, so those two only ever come with one sugar here.
export const canPair = (b, deoxy) => !(b === 'U' && deoxy) && !(b === 'T' && !deoxy);

const PHOS = ['', 'P(=O)([O-])[O-]', 'P(=O)([O-])OP(=O)([O-])[O-]', 'P(=O)([O-])OP(=O)([O-])OP(=O)([O-])[O-]'];
const PREFIX = ['', 'mono', 'di', 'tri'];

/** SMILES for a nucleoside (phosphates 0) or nucleotide (1–3 phosphates on the 5′ OH). */
export function nucleoSmiles(b, deoxy = false, phosphates = 0) {
  const base = BASES[b];
  if (!base) throw new Error(`unknown base ${b}`);
  if (!(phosphates >= 0 && phosphates <= 3)) throw new Error('0–3 phosphates');
  // C1′ first (ring 9), then O4′, C4′ with the 5′ CH₂O–(P), C3′ OH, C2′ (OH in ribose only)
  return `C9(${base.attach})OC(CO${PHOS[phosphates]})C(O)C9${deoxy ? '' : 'O'}`;
}

// adenosine / deoxyadenosine; thymine's nucleoside is deoxythymidine, often just called thymidine.
export const nucleosideName = (b, deoxy = false) => `${deoxy ? 'deoxy' : ''}${BASES[b].nucleoside}`;
export const nucleotideName = (b, deoxy, n) => `${nucleosideName(b, deoxy)} 5′-${PREFIX[n]}phosphate`;
export const abbrev = (b, deoxy, n) => `${deoxy ? 'd' : ''}${b}${['', 'M', 'D', 'T'][n]}P`;
