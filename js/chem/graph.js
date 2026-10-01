// Ring perception and small graph utilities.
import { neighbors, otherAtom } from './smiles.js';

// Returns a list of rings; each ring is an ordered array of atom ids (cycle order).
// Uses fundamental cycles from a spanning tree, then shrinks them by combining with
// smaller cycles (good enough for isolated and simply fused rings).
export function findRings(mol) {
  if (mol._rings) return mol._rings;
  const n = mol.atoms.length;
  const parent = new Array(n).fill(-1);
  const depth = new Array(n).fill(-1);
  const treeBond = new Set();
  const cycles = [];
  for (let root = 0; root < n; root++) {
    if (depth[root] >= 0) continue;
    depth[root] = 0;
    const stack = [root];
    while (stack.length) {
      const u = stack.pop();
      for (const bid of mol.atoms[u].bonds) {
        const v = otherAtom(mol.bonds[bid], u);
        if (depth[v] < 0) {
          depth[v] = depth[u] + 1;
          parent[v] = u;
          treeBond.add(bid);
          stack.push(v);
        }
      }
    }
  }
  for (const b of mol.bonds) {
    if (treeBond.has(b.id)) continue;
    // path from b.a and b.b to their common ancestor
    let x = b.a, y = b.b;
    const px = [x], py = [y];
    while (x !== y) {
      if (depth[x] >= depth[y]) { x = parent[x]; px.push(x); }
      else { y = parent[y]; py.push(y); }
    }
    py.pop();
    cycles.push(edgeSet(mol, px.concat(py.reverse())));
  }
  // Reduce: try to replace each cycle by XOR with another smaller cycle.
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    cycles.sort((a, b) => a.size - b.size);
    for (let i = 0; i < cycles.length; i++) {
      for (let j = 0; j < cycles.length; j++) {
        if (i === j) continue;
        const x = xorSets(cycles[i], cycles[j]);
        if (x.size && x.size < cycles[i].size && isSimpleCycle(mol, x)) {
          cycles[i] = x;
          changed = true;
        }
      }
    }
  }
  const rings = cycles.map((edges) => orderCycle(mol, edges)).filter(Boolean);
  mol._rings = rings;
  return rings;
}

function edgeSet(mol, cyclePath) {
  const s = new Set();
  for (let i = 0; i < cyclePath.length; i++) {
    const a = cyclePath[i], b = cyclePath[(i + 1) % cyclePath.length];
    const bond = mol.atoms[a].bonds.map((bid) => mol.bonds[bid]).find((bb) => otherAtom(bb, a) === b);
    if (bond) s.add(bond.id);
  }
  return s;
}

function xorSets(a, b) {
  const out = new Set(a);
  for (const x of b) { if (out.has(x)) out.delete(x); else out.add(x); }
  return out;
}

function isSimpleCycle(mol, edges) {
  const deg = new Map();
  for (const bid of edges) {
    const b = mol.bonds[bid];
    deg.set(b.a, (deg.get(b.a) || 0) + 1);
    deg.set(b.b, (deg.get(b.b) || 0) + 1);
  }
  for (const d of deg.values()) if (d !== 2) return false;
  // connected?
  return orderCycle(mol, edges) !== null;
}

function orderCycle(mol, edges) {
  const adj = new Map();
  for (const bid of edges) {
    const b = mol.bonds[bid];
    if (!adj.has(b.a)) adj.set(b.a, []);
    if (!adj.has(b.b)) adj.set(b.b, []);
    adj.get(b.a).push(b.b);
    adj.get(b.b).push(b.a);
  }
  const start = Math.min(...adj.keys());
  const order = [start];
  let prev = -1, cur = start;
  for (;;) {
    const nexts = adj.get(cur);
    if (!nexts || nexts.length !== 2) return null;
    const nxt = nexts[0] !== prev ? nexts[0] : nexts[1];
    if (nxt === start) break;
    if (order.includes(nxt)) return null;
    order.push(nxt);
    prev = cur;
    cur = nxt;
    if (order.length > edges.size) return null;
  }
  return order.length === edges.size ? order : null;
}

export function ringAtomSet(mol) {
  const s = new Set();
  for (const r of findRings(mol)) for (const a of r) s.add(a);
  return s;
}

export function isRingBond(mol, bond) {
  return findRings(mol).some((r) => {
    const ia = r.indexOf(bond.a), ib = r.indexOf(bond.b);
    if (ia < 0 || ib < 0) return false;
    const d = Math.abs(ia - ib);
    return d === 1 || d === r.length - 1;
  });
}

// Groups rings that share atoms into ring systems: [{rings:[ringIdx], atoms:Set}]
export function ringSystems(mol) {
  const rings = findRings(mol);
  const sys = [];
  rings.forEach((r, idx) => {
    const hits = sys.filter((s) => r.some((a) => s.atoms.has(a)));
    if (!hits.length) sys.push({ rings: [idx], atoms: new Set(r) });
    else {
      const base = hits[0];
      base.rings.push(idx);
      r.forEach((a) => base.atoms.add(a));
      for (const other of hits.slice(1)) {
        other.rings.forEach((x) => base.rings.push(x));
        other.atoms.forEach((a) => base.atoms.add(a));
        sys.splice(sys.indexOf(other), 1);
      }
    }
  });
  return sys;
}

// BFS distances from a start atom (restricted to an optional allowed set).
export function bfs(mol, start, allowed) {
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const u = q.shift();
    for (const v of neighbors(mol, u)) {
      if (allowed && !allowed.has(v)) continue;
      if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); q.push(v); }
    }
  }
  return dist;
}
