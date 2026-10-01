// SMILES parser + writer for the small organic molecules used in this course.
// Produces a plain molecule graph: { atoms: [...], bonds: [...] }.
// Supports: organic subset atoms, aromatic atoms, bracket atoms ([O-], [Na+], [C@H]),
// bonds - = # :, cis/trans markers / \, branches, ring closures, and '.' components.

const ORGANIC_VALENCE = { B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1] };
const AROMATIC_SYMBOLS = { b: 'B', c: 'C', n: 'N', o: 'O', p: 'P', s: 'S' };
const TWO_LETTER = new Set(['Cl', 'Br', 'Na', 'Li', 'Mg', 'Ca', 'Al', 'Si', 'Se', 'Fe', 'Zn', 'Cu', 'Mn', 'Co', 'Ni', 'He', 'Ne', 'Ar', 'Kr']);

export class SmilesError extends Error {}

export function parseSmiles(smiles) {
  if (typeof smiles !== 'string' || !smiles.trim()) throw new SmilesError('Empty SMILES');
  const s = smiles.trim();
  const atoms = [];
  const bonds = [];
  const branchStack = [];
  const ringOpen = new Map();
  let prev = -1;
  let pendingOrder = null; // explicit bond order before next atom
  let pendingDir = null; // '/' or '\\'
  let i = 0;

  function addBond(a, b, order, dir, aromatic) {
    if (a === b) throw new SmilesError('Atom bonded to itself');
    if (bondBetween({ bonds, atoms }, a, b)) throw new SmilesError('Duplicate bond');
    const bond = { id: bonds.length, a, b, order, aromatic: !!aromatic, dir: dir || null };
    bonds.push(bond);
    atoms[a].bonds.push(bond.id);
    atoms[b].bonds.push(bond.id);
    return bond;
  }

  function implicitBondBetween(a, b) {
    const aa = atoms[a], bb = atoms[b];
    if (aa.aromatic && bb.aromatic) return { order: 1.5, aromatic: true };
    return { order: 1, aromatic: false };
  }

  function addAtom(atom) {
    atom.id = atoms.length;
    atom.bonds = [];
    atoms.push(atom);
    if (prev >= 0) {
      let order, aromatic = false;
      if (pendingOrder != null) {
        order = pendingOrder;
        aromatic = pendingOrder === 1.5;
      } else {
        ({ order, aromatic } = implicitBondBetween(prev, atom.id));
      }
      addBond(prev, atom.id, order, pendingDir, aromatic);
    }
    pendingOrder = null;
    pendingDir = null;
    prev = atom.id;
  }

  while (i < s.length) {
    const ch = s[i];
    if (ch === '(') {
      if (prev < 0) throw new SmilesError('Branch before atom');
      branchStack.push(prev);
      i++;
    } else if (ch === ')') {
      if (!branchStack.length) throw new SmilesError('Unbalanced )');
      prev = branchStack.pop();
      i++;
    } else if (ch === '-') { pendingOrder = 1; i++; }
    else if (ch === '=') { pendingOrder = 2; i++; }
    else if (ch === '#') { pendingOrder = 3; i++; }
    else if (ch === ':') { pendingOrder = 1.5; i++; }
    else if (ch === '/' || ch === '\\') { pendingDir = ch; if (pendingOrder == null) pendingOrder = 1; i++; }
    else if (ch === '.') { prev = -1; pendingOrder = null; pendingDir = null; i++; }
    else if (ch === '%' || (ch >= '0' && ch <= '9')) {
      let num;
      if (ch === '%') { num = parseInt(s.substr(i + 1, 2), 10); i += 3; }
      else { num = +ch; i++; }
      if (Number.isNaN(num)) throw new SmilesError('Bad ring number');
      if (prev < 0) throw new SmilesError('Ring closure before atom');
      if (ringOpen.has(num)) {
        const open = ringOpen.get(num);
        ringOpen.delete(num);
        let order = pendingOrder != null ? pendingOrder : open.order;
        let aromatic;
        if (order == null) ({ order, aromatic } = implicitBondBetween(open.atom, prev));
        else aromatic = order === 1.5;
        addBond(open.atom, prev, order, null, aromatic);
      } else {
        ringOpen.set(num, { atom: prev, order: pendingOrder });
      }
      pendingOrder = null;
      pendingDir = null;
    } else if (ch === '[') {
      const end = s.indexOf(']', i);
      if (end < 0) throw new SmilesError('Unclosed [');
      addAtom(parseBracket(s.slice(i + 1, end)));
      i = end + 1;
    } else if (/[A-Za-z*]/.test(ch)) {
      const two = s.substr(i, 2);
      if (two === 'Cl' || two === 'Br') {
        addAtom({ el: two, aromatic: false, charge: 0, hExplicit: null, bracket: false });
        i += 2;
      } else if (ORGANIC_VALENCE[ch]) {
        addAtom({ el: ch, aromatic: false, charge: 0, hExplicit: null, bracket: false });
        i++;
      } else if (AROMATIC_SYMBOLS[ch]) {
        addAtom({ el: AROMATIC_SYMBOLS[ch], aromatic: true, charge: 0, hExplicit: null, bracket: false });
        i++;
      } else {
        throw new SmilesError(`Unknown atom "${ch}" at ${i}`);
      }
    } else if (ch === ' ') { i++; }
    else {
      throw new SmilesError(`Unexpected "${ch}" at ${i}`);
    }
  }
  if (branchStack.length) throw new SmilesError('Unbalanced (');
  if (ringOpen.size) throw new SmilesError('Unclosed ring');
  if (!atoms.length) throw new SmilesError('No atoms');

  const mol = { atoms, bonds };
  kekulize(mol);
  computeHydrogens(mol);
  for (const a of atoms) {
    if (a.bracket) continue;
    const sum = a.bonds.reduce((acc, bid) => acc + bonds[bid].order, 0);
    const vals = ORGANIC_VALENCE[a.el];
    if (sum > vals[vals.length - 1]) throw new SmilesError(`${a.el} atom ${a.id + 1} has too many bonds (${sum})`);
  }
  mol.stereo = extractCisTrans(mol);
  return mol;
}

function parseBracket(body) {
  const m = /^(\d+)?([A-Z][a-z]?|[bcnops]|se)(@@|@)?(H\d?)?([+-]+\d*|[+-]\d+)?(?::\d+)?$/.exec(body);
  if (!m) throw new SmilesError(`Bad bracket atom [${body}]`);
  let sym = m[2];
  let aromatic = false;
  if (AROMATIC_SYMBOLS[sym]) { sym = AROMATIC_SYMBOLS[sym]; aromatic = true; }
  else if (sym === 'se') { sym = 'Se'; aromatic = true; }
  else if (sym.length === 2 && !TWO_LETTER.has(sym)) throw new SmilesError(`Unknown element ${sym}`);
  let h = 0;
  if (m[4]) h = m[4].length > 1 ? +m[4].slice(1) : 1;
  let charge = 0;
  if (m[5]) {
    const c = m[5];
    const sign = c[0] === '+' ? 1 : -1;
    const digits = c.replace(/[+-]/g, '');
    charge = digits ? sign * +digits : sign * c.length;
  }
  return { el: sym, aromatic, charge, hExplicit: h, bracket: true, chiral: m[3] || null };
}

// Convert aromatic bonds into alternating single/double bonds (Kekulé form).
function kekulize(mol) {
  const aromBonds = mol.bonds.filter((b) => b.aromatic);
  if (!aromBonds.length) return;
  // Atoms that need exactly one double bond: aromatic C, and aromatic N without H.
  const needs = new Set();
  for (const a of mol.atoms) {
    if (!a.aromatic) continue;
    const exoDouble = a.bonds.some((bid) => { const b = mol.bonds[bid]; return !b.aromatic && b.order === 2; });
    if (exoDouble) continue;
    if (a.el === 'C' || a.el === 'B') needs.add(a.id);
    else if ((a.el === 'N' || a.el === 'P') && !(a.hExplicit > 0) && a.charge === 0) {
      const aromDeg = a.bonds.filter((bid) => mol.bonds[bid].aromatic).length;
      const otherDeg = a.bonds.length - aromDeg;
      if (otherDeg === 0) needs.add(a.id);
    }
  }
  const candidateBonds = aromBonds.filter((b) => needs.has(b.a) && needs.has(b.b));
  const matched = new Map(); // atom -> bond id
  const atomList = [...needs];
  function solve(idx) {
    while (idx < atomList.length && matched.has(atomList[idx])) idx++;
    if (idx >= atomList.length) return true;
    const at = atomList[idx];
    for (const b of candidateBonds) {
      if (b.a !== at && b.b !== at) continue;
      const other = b.a === at ? b.b : b.a;
      if (matched.has(other)) continue;
      matched.set(at, b.id);
      matched.set(other, b.id);
      if (solve(idx + 1)) return true;
      matched.delete(at);
      matched.delete(other);
    }
    return false;
  }
  if (!solve(0)) throw new SmilesError('Could not kekulize aromatic system');
  const doubles = new Set(matched.values());
  for (const b of aromBonds) {
    b.order = doubles.has(b.id) ? 2 : 1;
    b.aromatic = true; // keep the flag so we know it is part of an aromatic ring
  }
}

export function computeHydrogens(mol) {
  for (const a of mol.atoms) {
    if (a.bracket) { a.h = a.hExplicit || 0; continue; }
    const sum = a.bonds.reduce((acc, bid) => acc + mol.bonds[bid].order, 0);
    const vals = ORGANIC_VALENCE[a.el] || [0];
    const target = vals.find((v) => v >= sum);
    a.h = target == null ? 0 : target - sum;
  }
}

// Determine cis/trans relationships for double bonds carrying / \ markers.
function extractCisTrans(mol) {
  const out = [];
  for (const db of mol.bonds) {
    if (db.order !== 2 || db.aromatic) continue;
    const sideU = sideOf(mol, db.a, db.b);
    const sideV = sideOf(mol, db.b, db.a);
    if (!sideU || !sideV) continue;
    out.push({ bond: db.id, u: db.a, v: db.b, x: sideU.atom, y: sideV.atom, cis: sideU.up === sideV.up });
  }
  return out;
}

// For double-bond atom `u` (partner `v`), find a neighbour with a direction marker and
// whether it lies "up" relative to u.
function sideOf(mol, u, v) {
  for (const bid of mol.atoms[u].bonds) {
    const b = mol.bonds[bid];
    if (!b.dir) continue;
    const other = b.a === u ? b.b : b.a;
    if (other === v) continue;
    // bond written as other -> u (other came first) when b.a === other
    if (b.a === other) return { atom: other, up: b.dir === '\\' };
    return { atom: other, up: b.dir === '/' };
  }
  return null;
}

// ---- Graph helpers ---------------------------------------------------------

export function bondBetween(mol, a, b) {
  const atom = mol.atoms[a];
  if (!atom) return null;
  for (const bid of atom.bonds) {
    const bond = mol.bonds[bid];
    if ((bond.a === a && bond.b === b) || (bond.a === b && bond.b === a)) return bond;
  }
  return null;
}

export function neighbors(mol, i) {
  return mol.atoms[i].bonds.map((bid) => {
    const b = mol.bonds[bid];
    return b.a === i ? b.b : b.a;
  });
}

export function otherAtom(bond, i) {
  return bond.a === i ? bond.b : bond.a;
}

export function components(mol) {
  const seen = new Array(mol.atoms.length).fill(false);
  const comps = [];
  for (let i = 0; i < mol.atoms.length; i++) {
    if (seen[i]) continue;
    const comp = [];
    const stack = [i];
    seen[i] = true;
    while (stack.length) {
      const x = stack.pop();
      comp.push(x);
      for (const n of neighbors(mol, x)) if (!seen[n]) { seen[n] = true; stack.push(n); }
    }
    comps.push(comp.sort((a, b) => a - b));
  }
  return comps;
}

export function cloneMol(mol) {
  return {
    atoms: mol.atoms.map((a) => ({ ...a, bonds: [...a.bonds] })),
    bonds: mol.bonds.map((b) => ({ ...b })),
    stereo: (mol.stereo || []).map((s) => ({ ...s })),
  };
}

// ---- Editing helpers (used by the reaction engine) --------------------------

export function addAtomTo(mol, el, attachTo, order = 1, extra = {}) {
  const atom = { id: mol.atoms.length, el, aromatic: false, charge: 0, hExplicit: null, bracket: false, bonds: [], ...extra };
  mol.atoms.push(atom);
  if (attachTo != null) {
    const bond = { id: mol.bonds.length, a: attachTo, b: atom.id, order, aromatic: false, dir: null };
    mol.bonds.push(bond);
    mol.atoms[attachTo].bonds.push(bond.id);
    atom.bonds.push(bond.id);
  }
  return atom.id;
}

export function connect(mol, a, b, order = 1) {
  const bond = { id: mol.bonds.length, a, b, order, aromatic: false, dir: null };
  mol.bonds.push(bond);
  mol.atoms[a].bonds.push(bond.id);
  mol.atoms[b].bonds.push(bond.id);
  return bond.id;
}

// Remove atoms (and their bonds) and renumber everything.
export function removeAtoms(mol, ids) {
  const drop = new Set(ids);
  const map = new Map();
  const atoms = [];
  mol.atoms.forEach((a) => {
    if (drop.has(a.id)) return;
    map.set(a.id, atoms.length);
    atoms.push({ ...a, id: atoms.length, bonds: [] });
  });
  const bonds = [];
  for (const b of mol.bonds) {
    if (drop.has(b.a) || drop.has(b.b)) continue;
    const nb = { ...b, id: bonds.length, a: map.get(b.a), b: map.get(b.b) };
    bonds.push(nb);
    atoms[nb.a].bonds.push(nb.id);
    atoms[nb.b].bonds.push(nb.id);
  }
  return { atoms, bonds, stereo: [] };
}

// ---- Writer -----------------------------------------------------------------

function atomToken(mol, a) {
  const organic = ORGANIC_VALENCE[a.el] && !a.charge && !a.chiral;
  let natural = null;
  if (organic) {
    const sum = a.bonds.reduce((acc, bid) => acc + mol.bonds[bid].order, 0);
    const target = ORGANIC_VALENCE[a.el].find((v) => v >= sum);
    natural = target == null ? 0 : target - sum;
  }
  if (organic && natural === a.h) return a.el;
  let t = '[' + a.el;
  if (a.h) t += 'H' + (a.h > 1 ? a.h : '');
  if (a.charge) t += (a.charge > 0 ? '+' : '-') + (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : '');
  return t + ']';
}

function bondToken(order) {
  return order === 2 ? '=' : order === 3 ? '#' : '';
}

// Writes a (non-canonical) SMILES string in Kekulé form. Stereo markers are dropped.
export function toSmiles(mol, { root = null } = {}) {
  const comps = components(mol);
  const parts = [];
  for (const comp of comps) {
    const start = root != null && comp.includes(root) ? root : comp[0];
    const visited = new Set();
    const ringLabels = new Map(); // bond id -> label
    let nextLabel = 1;
    const treeEdges = new Set();
    // first DFS to find ring closure bonds
    const order = [];
    (function dfs(u, parentBond) {
      visited.add(u);
      order.push(u);
      for (const bid of mol.atoms[u].bonds) {
        if (bid === parentBond) continue;
        const v = otherAtom(mol.bonds[bid], u);
        if (visited.has(v)) {
          if (!treeEdges.has(bid) && !ringLabels.has(bid)) ringLabels.set(bid, null);
          continue;
        }
        treeEdges.add(bid);
        dfs(v, bid);
      }
    })(start, -1);
    const written = new Set();
    const openAt = new Map(); // atom -> [bond ids closing here]
    let str = '';
    (function write(u, parentBond) {
      written.add(u);
      let tok = atomToken(mol, mol.atoms[u]);
      for (const bid of mol.atoms[u].bonds) {
        if (!ringLabels.has(bid)) continue;
        const b = mol.bonds[bid];
        const v = otherAtom(b, u);
        if (ringLabels.get(bid) == null) {
          const label = nextLabel++;
          ringLabels.set(bid, label);
          tok += bondToken(b.order) + (label > 9 ? '%' + label : label);
        } else if (written.has(v)) {
          const label = ringLabels.get(bid);
          tok += bondToken(b.order) + (label > 9 ? '%' + label : label);
        }
      }
      str += tok;
      const kids = mol.atoms[u].bonds.filter((bid) => bid !== parentBond && treeEdges.has(bid) && !written.has(otherAtom(mol.bonds[bid], u)));
      kids.forEach((bid, idx) => {
        const v = otherAtom(mol.bonds[bid], u);
        const last = idx === kids.length - 1;
        if (!last) str += '(';
        str += bondToken(mol.bonds[bid].order);
        write(v, bid);
        if (!last) str += ')';
      });
    })(start, -1);
    void openAt;
    parts.push(str);
  }
  return parts.join('.');
}
