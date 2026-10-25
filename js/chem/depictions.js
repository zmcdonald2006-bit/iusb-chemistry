// Hand-placed 2D drawings for molecules the automatic layout can't draw cleanly: cage-shaped
// ("bridged") ring systems from Lecture 11, drawn the way the textbook draws them.
// Keyed by the exact SMILES used in the content; coords follow that SMILES's atom order
// (x right, y up, 1 = one bond length). `bold`: bonds drawn thick, like the slides' bridge bonds.
// tests/chem2.test.js checks every entry has one point per atom and sensible bond lengths.

// The morphine skeleton (atoms 0–13 are shared by morphine, codeine and heroin, whose SMILES are
// written in the same order): benzene ring top left, the O bridge, the cyclohexene ring with the OH
// at the bottom, and the N–CH₃ ring on the right with its bridge drawn bold, as on the slide.
const MORPHINAN = [
  [3.5, -1.4], [2.6, -0.9], [1.95, 0.2], [0.6, 0.2], [0, -0.5], [0.866, -1.0], [1.732, -0.5], [1.732, 0.5], // CH3, N, C16, C15, C13, C14, C9, C10
  [0.866, 1.0], [0, 0.5], [-0.866, 1.0], [-0.866, 2.0], [0, 2.5], [0.866, 2.0], // aromatic ring
];
const LOWER = [[-0.866, -1.0], [-0.866, -2.0], [0, -2.5], [0.866, -2.0]]; // C5, C6, C7, C8
const FURAN_O = [-1.5, 0.0];
const BRIDGE = [[2, 3]]; // C16–C15, drawn bold

// The steroid skeleton (Lecture 2 cholesterol; Lecture 4 sex hormones and birth-control drugs), drawn the
// textbook way: rings A, B and C as hexagons, ring D as a pentagon, angular methyls pointing straight up.
// Keys are the standard steroid carbon numbers.
const STEROID = {
  C1: [0, 1], C2: [-0.866, 0.5], C3: [-0.866, -0.5], C4: [0, -1], C5: [0.866, -0.5], C10: [0.866, 0.5],
  C6: [1.732, -1], C7: [2.598, -0.5], C8: [2.598, 0.5], C9: [1.732, 1],
  C11: [1.732, 2], C12: [2.598, 2.5], C13: [3.464, 2], C14: [3.464, 1],
  C15: [4.415, 0.691], C16: [5.003, 1.5], C17: [4.415, 2.309],
  C18: [3.464, 3], C19: [0.866, 1.5], O3: [-1.732, -1],
};
const steroid = (order, extra = {}) => order.map((k) => extra[k] || STEROID[k]);
const UP17 = [4.415, 3.309];  // a group drawn straight up from C17
const OUT17 = [4.724, 3.26];  // a group drawn up-and-out from C17
// adrenal cortical steroids: OH/C=O on C11 drawn up-left; C17 carries OH (right) and the C(=O)CH2OH side chain (up)
const CORTICOID = { O11: [0.866, 2.5], O17: [5.4, 2.48], C20: UP17, O20: [3.65, 3.95], C21: [5.28, 3.81], O21: [6.15, 3.31] };

export const DEPICTIONS = {
  // cholesterol: the C17 side chain zig-zags to the right
  'CC(C)CCCC(C)C1CCC2C1(C)CCC1C2CC=C2CC(O)CCC12C': {
    coords: steroid(['C26', 'C25', 'C27', 'C24', 'C23', 'C22', 'C20', 'C21', 'C17', 'C16', 'C15', 'C14', 'C13', 'C18', 'C12', 'C11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19'], {
      C20: OUT17, C21: [4.42, 4.21], C22: [5.69, 3.0], C23: [6.56, 3.5], C24: [7.53, 3.24], C25: [8.4, 3.74], C26: [9.37, 3.48], C27: [8.4, 4.74],
    }),
  },
  // estradiol (aromatic ring A, no C19 methyl)
  'CC12CCC3c4ccc(O)cc4CCC3C1CCC2O': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C10', 'C1', 'C2', 'C3', 'O3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C14', 'C15', 'C16', 'C17', 'O17'], { O17: OUT17 }),
  },
  // ethynylestradiol: OH up, C≡CH to the right on C17
  'CC12CCC3c4ccc(O)cc4CCC3C1CCC2(O)C#C': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C10', 'C1', 'C2', 'C3', 'O3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C14', 'C15', 'C16', 'C17', 'O17', 'C20', 'C21'], { O17: UP17, C20: [5.38, 2.57], C21: [6.345, 2.83] }),
  },
  // progesterone: C=O on C3, C4=C5, acetyl on C17
  'CC(=O)C1CCC2C1(C)CCC1C2CCC2=CC(=O)CCC12C': {
    coords: steroid(['C21', 'C20', 'O20', 'C17', 'C16', 'C15', 'C14', 'C13', 'C18', 'C12', 'C11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19'], { C20: OUT17, O20: [4.2, 4.11], C21: [5.69, 3.52] }),
  },
  // --- Lecture 14 steroid hormones (same skeleton, same carbon numbers) ---
  // testosterone: C=O on C3, C4=C5, OH on C17
  'CC12CCC3C(CCC4=CC(=O)CCC34C)C1CCC2O': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19', 'C14', 'C15', 'C16', 'C17', 'O17'], { O17: OUT17 }),
  },
  // androsterone: OH on C3, C=O on C17
  'CC12CCC3C(CCC4CC(O)CCC34C)C1CCC2=O': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19', 'C14', 'C15', 'C16', 'C17', 'O17'], { O17: OUT17 }),
  },
  // estrone: like estradiol with C=O on C17
  'CC12CCC3c4ccc(O)cc4CCC3C1CCC2=O': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C10', 'C1', 'C2', 'C3', 'O3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C14', 'C15', 'C16', 'C17', 'O17'], { O17: OUT17 }),
  },
  // nandrolone (an anabolic steroid: testosterone without the C19 methyl)
  'CC12CCC3C(CCC4=CC(=O)CCC34)C1CCC2O': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C14', 'C15', 'C16', 'C17', 'O17'], { O17: OUT17 }),
  },
  // cortisol: OH on C11, OH on C17, C(=O)CH2OH side chain
  'CC12CC(O)C3C(CCC4=CC(=O)CCC34C)C1CCC2(O)C(=O)CO': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'O11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19', 'C14', 'C15', 'C16', 'C17', 'O17', 'C20', 'O20', 'C21', 'O21'], CORTICOID),
  },
  // cortisone: C=O on C11 instead of OH
  'CC12CC(=O)C3C(CCC4=CC(=O)CCC34C)C1CCC2(O)C(=O)CO': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'O11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19', 'C14', 'C15', 'C16', 'C17', 'O17', 'C20', 'O20', 'C21', 'O21'], CORTICOID),
  },
  // prednisone: cortisone with an extra C1=C2 double bond
  'CC12CC(=O)C3C(CCC4=CC(=O)C=CC34C)C1CCC2(O)C(=O)CO': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'O11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19', 'C14', 'C15', 'C16', 'C17', 'O17', 'C20', 'O20', 'C21', 'O21'], CORTICOID),
  },
  // aldosterone: C18 is a CHO, OH on C11, C(=O)CH2OH on C17
  'O=CC12CC(O)C3C(CCC4=CC(=O)CCC34C)C1CCC2C(=O)CO': {
    coords: steroid(['O18', 'C18', 'C13', 'C12', 'C11', 'O11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C19', 'C14', 'C15', 'C16', 'C17', 'C20', 'O20', 'C21', 'O21'], {
      O18: [2.598, 3.5], O11: [0.866, 2.5], C20: OUT17, O20: [4.2, 4.11], C21: [5.69, 3.52], O21: [6.56, 3.02],
    }),
  },
  // norethindrone (19-nor: no methyl on C10)
  'CC12CCC3C(CCC4=CC(=O)CCC34)C1CCC2(O)C#C': {
    coords: steroid(['C18', 'C13', 'C12', 'C11', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'O3', 'C2', 'C1', 'C10', 'C14', 'C15', 'C16', 'C17', 'O17', 'C20', 'C21'], { O17: UP17, C20: [5.38, 2.57], C21: [6.345, 2.83] }),
  },
  // morphine
  'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O': {
    coords: [...MORPHINAN, [-1.732, 2.5], FURAN_O, ...LOWER, [-1.732, -2.5]],
    bold: BRIDGE,
  },
  // codeine (the phenol OH is OCH₃)
  'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(C=C4)O': {
    coords: [...MORPHINAN, [-1.732, 2.5], [-2.598, 2.0], FURAN_O, ...LOWER, [-1.732, -2.5]],
    bold: BRIDGE,
  },
  // heroin (both OH groups are acetate esters)
  'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC(C)=O)OC3C(C=C4)OC(C)=O': {
    coords: [...MORPHINAN, [-1.732, 2.5], [-2.598, 2.0], [-2.598, 1.0], [-3.464, 2.5], FURAN_O, ...LOWER, [-1.732, -2.5], [-2.598, -2.0], [-2.598, -1.0], [-3.464, -2.5]],
    bold: BRIDGE,
  },
  // quinine: quinoline below, CH(OH) above it, the quinuclidine cage top right
  'COC1=CC2=C(C=CN=C2C=C1)C(C3CC4CCN3CC4C=C)O': {
    coords: [
      [-3.464, 0.5], [-2.598, 1.0], // CH3, O
      [-1.732, 0.5], [-0.866, 1.0], [0, 0.5], [0.866, 1.0], [1.732, 0.5], [1.732, -0.5], [0.866, -1.0], [0, -0.5], [-0.866, -1.0], [-1.732, -0.5], // quinoline
      [0.866, 2.0], // CH(OH)
      [1.732, 2.5], [1.732, 3.5], [2.598, 4.0], [2.35, 3.3], [2.35, 2.7], [2.598, 2.0], [3.464, 2.5], [3.464, 3.5], // quinuclidine (N at 2.598, 2.0)
      [4.33, 4.0], [5.196, 3.5], // vinyl
      [0, 2.5], // OH
    ],
    bold: [[15, 16], [16, 17], [17, 18]],
  },
  // atropine: the N–CH₃ bridge on top of the ring, the ester going down to the right
  'CN1C2CCC1CC(C2)OC(=O)C(CO)c1ccccc1': {
    coords: [
      [0, 2.2], [0, 1.2], [-0.866, 0.5], [-0.45, 0.0], [0.45, 0.0], [0.866, 0.5], [0.866, -0.5], [0, -1.0], [-0.866, -0.5], // CH3, N, tropane
      [0, -2.0], [0.866, -2.5], [0.866, -3.5], [1.732, -2.0], [2.3, -1.2], [3.2, -0.8], // O, C=O, =O, CH, CH2, OH
      [2.598, -2.5], [3.464, -2.0], [4.33, -2.5], [4.33, -3.5], [3.464, -4.0], [2.598, -3.5], // phenyl
    ],
    bold: [[1, 2], [1, 5]],
  },
};
