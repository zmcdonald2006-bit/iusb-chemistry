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

export const DEPICTIONS = {
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
