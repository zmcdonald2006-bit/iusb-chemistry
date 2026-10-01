// 2D coordinate generation for skeletal structures (bond length = 1, y axis points up).
// Chains are drawn as the familiar zigzag, rings as regular polygons, cis/trans honoured.
import { neighbors, bondBetween, components } from './smiles.js';
import { findRings } from './graph.js';

const D = Math.PI / 180;
const dirVec = (deg) => ({ x: Math.cos(deg * D), y: Math.sin(deg * D) });
const add = (p, v, s = 1) => ({ x: p.x + v.x * s, y: p.y + v.y * s });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleOf = (from, to) => Math.atan2(to.y - from.y, to.x - from.x) / D;

export function layoutMolecule(mol) {
  if (mol._coords) return mol._coords;
  const coords = new Array(mol.atoms.length);
  const comps = components(mol);
  let cursorX = 0;
  // Larger components first (anion before cation, e.g. "CH3COO⁻  Na⁺")
  comps.sort((a, b) => b.length - a.length || a[0] - b[0]);
  for (const comp of comps) {
    const local = layoutComponent(mol, comp);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const i of comp) {
      minX = Math.min(minX, local[i].x); maxX = Math.max(maxX, local[i].x);
      minY = Math.min(minY, local[i].y); maxY = Math.max(maxY, local[i].y);
    }
    const midY = (minY + maxY) / 2;
    for (const i of comp) coords[i] = { x: local[i].x - minX + cursorX, y: local[i].y - midY };
    cursorX += (maxX - minX) + 1.6;
  }
  mol._coords = coords;
  return coords;
}

function layoutComponent(mol, comp) {
  const pos = {};
  if (comp.length === 1) { pos[comp[0]] = { x: 0, y: 0 }; return pos; }
  const compSet = new Set(comp);
  const rings = findRings(mol).filter((r) => compSet.has(r[0]));
  const ringsOf = new Map();
  rings.forEach((r, idx) => r.forEach((a) => { if (!ringsOf.has(a)) ringsOf.set(a, []); ringsOf.get(a).push(idx); }));
  const placedRing = new Set();
  const placed = new Set();

  const setPos = (i, p) => { pos[i] = p; placed.add(i); };

  // --- choose start atom
  const deg = (i) => neighbors(mol, i).length;
  const farthest = (from) => {
    const d = new Map([[from, 0]]);
    const q = [from];
    let last = from;
    while (q.length) {
      const u = q.shift();
      last = u;
      for (const v of neighbors(mol, u)) if (!d.has(v)) { d.set(v, d.get(u) + 1); q.push(v); }
    }
    return last;
  };
  let start;
  const first = comp[0];
  if (deg(first) <= 1 && !ringsOf.has(first)) start = first;
  else {
    const a = farthest(first);
    const b = farthest(a);
    const cand = [a, b].filter((x) => !ringsOf.has(x));
    if (!cand.length) start = rings.length ? rings[0][0] : a;
    else start = cand.find((x) => mol.atoms[x].el === 'C') ?? cand[0];
  }

  // depth of the region reachable from v without crossing placed atoms or `from`
  const reach = (v, from) => {
    const seen = new Set([from, v]);
    const stack = [[v, 0]];
    let maxd = 0;
    let count = 0;
    while (stack.length) {
      const [u, d] = stack.pop();
      count++;
      maxd = Math.max(maxd, d);
      for (const w of neighbors(mol, u)) {
        if (seen.has(w) || placed.has(w)) continue;
        seen.add(w);
        stack.push([w, d + 1]);
      }
    }
    return maxd * 100 + Math.min(count, 99);
  };

  const clearance = (p, ignore) => {
    let m = Infinity;
    for (const i of placed) {
      if (i === ignore) continue;
      m = Math.min(m, dist(p, pos[i]));
    }
    return m;
  };

  const chooseDir = (from, preferred, ignore) => {
    const offsets = [0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180];
    let bestAngle = preferred, bestScore = -1;
    for (const o of offsets) {
      const ang = preferred + o;
      const p = add(pos[from], dirVec(ang));
      const c = clearance(p, from);
      if (c >= 0.8) return ang;
      if (c > bestScore) { bestScore = c; bestAngle = ang; }
    }
    void ignore;
    return bestAngle;
  };

  const bondOrder = (a, b) => bondBetween(mol, a, b).order;
  const isLinear = (u) => {
    const orders = mol.atoms[u].bonds.map((bid) => mol.bonds[bid].order);
    return orders.includes(3) || orders.filter((o) => o === 2).length >= 2;
  };

  function visit(u, thetaIn, lastTurn, hasParent) {
    if (ringsOf.has(u) && !ringsOf.get(u).every((r) => placedRing.has(r))) {
      placeRingSystem(u, thetaIn, hasParent);
      return;
    }
    const kids = neighbors(mol, u).filter((v) => !placed.has(v));
    if (!kids.length) return;
    // main chain first: deepest; ties -> single bonds before double (so =O branches), carbon first
    const scored = kids.map((v) => ({ v, r: reach(v, u), order: bondOrder(u, v), isC: mol.atoms[v].el === 'C' }));
    scored.sort((a, b) => b.r - a.r || a.order - b.order || (b.isC - a.isC) || a.v - b.v);
    const ordered = scored.map((s) => s.v);
    let dirs;
    let turns;
    if (!hasParent) {
      if (ordered.length === 1) { dirs = [isLinear(ordered[0]) || isLinear(u) ? 0 : 30]; turns = [1]; }
      else { dirs = ordered.map((_, k) => 30 + (360 / ordered.length) * k); turns = ordered.map(() => 1); }
    } else if (isLinear(u)) {
      dirs = [thetaIn, thetaIn + 90, thetaIn - 90]; turns = [lastTurn, 1, -1];
    } else if (ordered.length === 1) {
      dirs = [thetaIn - lastTurn * 60]; turns = [-lastTurn];
    } else if (ordered.length === 2) {
      dirs = [thetaIn - lastTurn * 60, thetaIn + lastTurn * 60]; turns = [-lastTurn, lastTurn];
    } else {
      const main = thetaIn - lastTurn * 60;
      dirs = [main, main + lastTurn * 80, main + lastTurn * 160]; turns = [-lastTurn, lastTurn, lastTurn];
    }
    const placedKids = [];
    ordered.forEach((v, k) => {
      const pref = dirs[k] ?? thetaIn + 180;
      const ang = chooseDir(u, pref);
      setPos(v, add(pos[u], dirVec(ang)));
      placedKids.push({ v, ang, turn: turns[k] ?? 1 });
    });
    for (const { v, ang, turn } of placedKids) visit(v, ang, turn, true);
  }

  function placeRingSystem(entry, thetaIn, hasParent) {
    // collect all rings connected (fused) to the entry's ring
    const sysRings = new Set();
    const stack = [...ringsOf.get(entry)];
    while (stack.length) {
      const r = stack.pop();
      if (sysRings.has(r)) continue;
      sysRings.add(r);
      for (const a of rings[r]) for (const r2 of ringsOf.get(a)) if (!sysRings.has(r2)) stack.push(r2);
    }
    const centers = new Map();
    // first ring
    const r0 = [...ringsOf.get(entry)].sort((a, b) => rings[a].length - rings[b].length)[0];
    const ring = rings[r0];
    const k = ring.length;
    const R = 1 / (2 * Math.sin(Math.PI / k));
    let center, phi0;
    if (hasParent) {
      center = add(pos[entry], dirVec(thetaIn), R);
      phi0 = thetaIn + 180;
    } else {
      // standalone ring: entry at the top vertex (pointy-top hexagon, "house" pentagon)
      phi0 = 90;
      center = add(pos[entry], dirVec(phi0 + 180), R);
    }
    const idx = ring.indexOf(entry);
    const rot = [...ring.slice(idx), ...ring.slice(0, idx)];
    rot.forEach((a, j) => {
      if (j === 0) return;
      if (!placed.has(a)) setPos(a, add(center, dirVec(phi0 - j * (360 / k)), R));
    });
    placedRing.add(r0);
    centers.set(r0, center);
    // fused rings
    let progress = true;
    while (progress) {
      progress = false;
      for (const r of sysRings) {
        if (placedRing.has(r)) continue;
        const rr = rings[r];
        const kk = rr.length;
        // find a placed edge shared with a placed ring
        let edge = null;
        for (let j = 0; j < kk; j++) {
          const a = rr[j], b = rr[(j + 1) % kk];
          if (placed.has(a) && placed.has(b)) { edge = [j, (j + 1) % kk]; break; }
        }
        if (!edge) continue;
        const a = rr[edge[0]], b = rr[edge[1]];
        const neighborRing = [...placedRing].find((pr) => rings[pr].includes(a) && rings[pr].includes(b));
        const oldC = centers.get(neighborRing) || { x: 0, y: 0 };
        const mid = { x: (pos[a].x + pos[b].x) / 2, y: (pos[a].y + pos[b].y) / 2 };
        let nx = mid.x - oldC.x, ny = mid.y - oldC.y;
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        const apo = 1 / (2 * Math.tan(Math.PI / kk));
        const Rn = 1 / (2 * Math.sin(Math.PI / kk));
        const c = { x: mid.x + nx * apo, y: mid.y + ny * apo };
        const angA = angleOf(c, pos[a]);
        const angB = angleOf(c, pos[b]);
        let step = 360 / kk;
        // walk from b away from a
        const diff = ((angA - angB + 540) % 360) - 180;
        if (diff > 0) step = -step;
        let cur = edge[1];
        let ang = angB;
        for (let s = 1; s < kk - 1; s++) {
          cur = (cur + 1) % kk;
          ang += step;
          const atom = rr[cur];
          if (!placed.has(atom)) setPos(atom, add(c, dirVec(ang), Rn));
        }
        placedRing.add(r);
        centers.set(r, c);
        progress = true;
      }
    }
    // any leftover rings (spiro/bridged): place unplaced atoms roughly
    for (const r of sysRings) {
      if (placedRing.has(r)) continue;
      rings[r].forEach((a, j) => { if (!placed.has(a)) setPos(a, add(center, dirVec(j * 47), R * 1.5)); });
      placedRing.add(r);
    }
    // exocyclic substituents
    const sysAtoms = [];
    for (const r of sysRings) for (const a of rings[r]) if (!sysAtoms.includes(a)) sysAtoms.push(a);
    for (const a of sysAtoms) {
      const exo = neighbors(mol, a).filter((v) => !placed.has(v));
      if (!exo.length) continue;
      const ringNbrs = neighbors(mol, a).filter((v) => sysAtoms.includes(v));
      const avg = ringNbrs.reduce((acc, v) => ({ x: acc.x + pos[v].x, y: acc.y + pos[v].y }), { x: 0, y: 0 });
      avg.x /= ringNbrs.length || 1; avg.y /= ringNbrs.length || 1;
      const outward = angleOf(avg, pos[a]);
      const alreadyExo = neighbors(mol, a).filter((v) => placed.has(v) && !sysAtoms.includes(v)).length;
      let dirs;
      if (exo.length === 1 && !alreadyExo) dirs = [outward];
      else if (exo.length === 1) dirs = [outward + 50];
      else dirs = [outward + 35, outward - 35, outward + 90];
      exo.forEach((v, k2) => {
        const ang = chooseDir(a, dirs[k2] ?? outward);
        setPos(v, add(pos[a], dirVec(ang)));
      });
      exo.forEach((v) => {
        const ang = angleOf(pos[a], pos[v]);
        visit(v, ang, 1, true);
      });
    }
  }

  setPos(start, { x: 0, y: 0 });
  visit(start, 0, 1, false);
  // Place anything missed (shouldn't happen) in a line
  let extra = 0;
  for (const i of comp) if (!placed.has(i)) setPos(i, { x: extra++, y: -2 });

  enforceCisTrans(mol, pos, compSet);
  fitOrientation(pos, comp);
  return pos;
}

// Rotate tall drawings (e.g. a long cis fatty acid) by a multiple of 30° so they fit
// better on a phone screen. Multiples of 30° keep zigzag bonds on their usual angles.
function fitOrientation(pos, comp) {
  if (comp.length < 8) return;
  const box = (deg) => {
    const c = Math.cos(deg * D), s = Math.sin(deg * D);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const i of comp) {
      const x = pos[i].x * c - pos[i].y * s, y = pos[i].x * s + pos[i].y * c;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const w = maxX - minX, h = maxY - minY;
    return { deg, w, h, score: h + 0.25 * w };
  };
  const base = box(0);
  if (base.h < base.w * 0.8) return;
  let best = base;
  for (const deg of [30, -30, 60, -60, 90]) {
    const b = box(deg);
    if (b.score < best.score) best = b;
  }
  if (best.deg === 0 || best.score > base.score * 0.9) return;
  const c = Math.cos(best.deg * D), s = Math.sin(best.deg * D);
  for (const i of comp) {
    const { x, y } = pos[i];
    pos[i] = { x: x * c - y * s, y: x * s + y * c };
  }
}

function enforceCisTrans(mol, pos, compSet) {
  for (const st of mol.stereo || []) {
    if (!compSet.has(st.u)) continue;
    const u = pos[st.u], v = pos[st.v], x = pos[st.x], y = pos[st.y];
    const side = (p) => Math.sign((v.x - u.x) * (p.y - u.y) - (v.y - u.y) * (p.x - u.x));
    const isCis = side(x) === side(y);
    if (isCis === st.cis) continue;
    // reflect everything on v's side (reachable from v without passing u) across the u–v line
    const seen = new Set([st.u, st.v]);
    const stack = neighbors(mol, st.v).filter((n) => n !== st.u);
    stack.forEach((n) => seen.add(n));
    const toFlip = [...stack];
    while (stack.length) {
      const w = stack.pop();
      for (const n of neighbors(mol, w)) if (!seen.has(n)) { seen.add(n); stack.push(n); toFlip.push(n); }
    }
    const dx = v.x - u.x, dy = v.y - u.y;
    const len2 = dx * dx + dy * dy;
    for (const i of toFlip) {
      const p = pos[i];
      const t = ((p.x - u.x) * dx + (p.y - u.y) * dy) / len2;
      const foot = { x: u.x + t * dx, y: u.y + t * dy };
      pos[i] = { x: 2 * foot.x - p.x, y: 2 * foot.y - p.y };
    }
  }
}

// ---- "Full structure" layout: every atom and H drawn on a grid (textbook Lewis style) ---

export function layoutFull(mol) {
  // Only for acyclic molecules; returns null otherwise.
  if (findRings(mol).length) return null;
  const heavy = mol.atoms.map((a) => a.id);
  if (heavy.length > 12) return null;
  const pos = {};
  // longest path
  const far = (from) => {
    const d = new Map([[from, 0]]); const par = new Map(); const q = [from]; let last = from;
    while (q.length) { const u = q.shift(); last = u; for (const v of neighbors(mol, u)) if (!d.has(v)) { d.set(v, d.get(u) + 1); par.set(v, u); q.push(v); } }
    return { last, par };
  };
  const a = far(0).last;
  const { last: b, par } = far(a);
  const path = [b];
  while (path[path.length - 1] !== a) path.push(par.get(path[path.length - 1]));
  path.reverse();
  // ensure a carbon-first reading direction when possible
  if (mol.atoms[path[0]].el !== 'C' && mol.atoms[path[path.length - 1]].el === 'C') path.reverse();
  path.forEach((atom, i) => { pos[atom] = { x: i, y: 0 }; });
  const onPath = new Set(path);
  const occupied = new Set(path.map((p, i) => `${i},0`));
  const hSlots = []; // {atom, x, y}
  const lpSlots = [];
  const freeDirs = (x, y) => [[0, 1], [0, -1], [-1, 0], [1, 0]].filter(([dx, dy]) => !occupied.has(`${x + dx},${y + dy}`));
  function growBranch(root, from, x, y, dx, dy) {
    pos[root] = { x, y };
    occupied.add(`${x},${y}`);
    const kids = neighbors(mol, root).filter((v) => v !== from && !pos[v]);
    kids.forEach((v, k) => {
      const [ndx, ndy] = k === 0 ? [dx, dy] : [dy, dx];
      growBranch(v, root, x + ndx, y + ndy, ndx, ndy);
    });
  }
  path.forEach((atom, i) => {
    const branches = neighbors(mol, atom).filter((v) => !onPath.has(v));
    const dirs = [[0, 1], [0, -1]];
    branches.forEach((v, k) => {
      const [dx, dy] = dirs[k] || [0, 1];
      growBranch(v, atom, i + dx, dy, dx, dy);
    });
  });
  for (const at of mol.atoms) {
    const p = pos[at.id];
    if (!p) return null;
    let free = freeDirs(p.x, p.y);
    for (let h = 0; h < at.h; h++) {
      const d = free.shift();
      if (!d) return null;
      occupied.add(`${p.x + d[0]},${p.y + d[1]}`);
      hSlots.push({ atom: at.id, x: p.x + d[0], y: p.y + d[1] });
    }
    free = freeDirs(p.x, p.y);
    const lp = lonePairCount(mol, at.id);
    for (let l = 0; l < lp; l++) {
      const d = free.shift();
      if (!d) break;
      lpSlots.push({ atom: at.id, dx: d[0], dy: d[1] });
    }
  }
  return { pos, hSlots, lpSlots };
}

function lonePairCount(mol, i) {
  const a = mol.atoms[i];
  const ve = { N: 5, O: 6, S: 6, F: 7, Cl: 7, Br: 7, I: 7 }[a.el];
  if (!ve) return 0;
  const used = a.bonds.reduce((s, bid) => s + mol.bonds[bid].order, 0) + (a.h || 0);
  return Math.max(0, Math.round((ve - (a.charge || 0) - used) / 2));
}
