// SVG rendering of molecules. Returns markup strings so the same code works in the
// browser (innerHTML) and in tests. Colours come from CSS classes (theme aware).
import { toMol } from './analyze.js';
import { neighbors } from './smiles.js';
import { findRings, isRingBond } from './graph.js';
import { layoutMolecule, layoutFull } from './layout.js';

const ELEMENT_NAMES = { C: 'carbon', H: 'hydrogen', O: 'oxygen', N: 'nitrogen', S: 'sulfur', F: 'fluorine', Cl: 'chlorine', Br: 'bromine', I: 'iodine', Na: 'sodium', K: 'potassium', Li: 'lithium', P: 'phosphorus' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = (x) => Math.round(x * 100) / 100;

let uid = 0;

/**
 * @param {string|object} input SMILES or molecule
 * @param {object} opts
 *   scale: px per bond (default 38)
 *   mode: 'skeletal' | 'condensed' (label every C with its H's) | 'full' (all H drawn, lone pairs)
 *   numbers: { atomIndex: label }  small locant numbers next to atoms
 *   highlight: [atomIndex], highlightBonds: [[a,b]], highlightClass
 *   selectable: bool, selected: [atomIndex]
 *   title: accessible title
 */
export function renderMolecule(input, opts = {}) {
  const mol = toMol(input);
  if (opts.mode === 'full') {
    const full = renderFull(mol, opts);
    if (full) return full;
    opts = { ...opts, mode: 'condensed' }; // branched/cyclic: fall back to condensed labels
  }
  const base = opts.scale || 38;
  const S = base * (opts.mode === 'condensed' ? 1.4 : 1);
  const coords = layoutMolecule(mol);
  const P = coords.map((c) => ({ x: c.x * S, y: -c.y * S }));
  const fs = Math.round(base * 0.42);
  const labels = mol.atoms.map((a, i) => atomLabel(mol, i, opts, P));
  const rings = findRings(mol);
  const parts = [];
  const hlSet = new Set(opts.highlight || []);
  const hlClass = opts.highlightClass || 'hl';

  // highlights (behind everything)
  for (const [a, b] of opts.highlightBonds || []) {
    parts.push(`<line class="${hlClass}-bond" x1="${r2(P[a].x)}" y1="${r2(P[a].y)}" x2="${r2(P[b].x)}" y2="${r2(P[b].y)}" stroke-width="${r2(S * 0.36)}" stroke-linecap="round"/>`);
  }
  for (const i of hlSet) parts.push(`<circle class="${hlClass}" cx="${r2(P[i].x)}" cy="${r2(P[i].y)}" r="${r2(S * 0.34)}"/>`);
  const selSet = new Set(opts.selected || []);
  for (const i of selSet) parts.push(`<circle class="sel" cx="${r2(P[i].x)}" cy="${r2(P[i].y)}" r="${r2(S * 0.36)}"/>`);

  // bonds: every line is clipped against the text boxes of labelled atoms at its ends
  const boxes = labels.map((lab, i) => (lab ? labelBox(lab, P[i], fs) : null));
  for (const b of mol.bonds) {
    const p1 = P[b.a], p2 = P[b.b];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const d = { x: (p2.x - p1.x) / len, y: (p2.y - p1.y) / len };
    const n = { x: -d.y, y: d.x };
    const line = (a, c, shrinkA = 0, shrinkC = 0) => {
      const s = clipSegment(a, c, boxes[b.a], boxes[b.b]);
      if (!s) return '';
      const [u, v] = s;
      const L = Math.hypot(v.x - u.x, v.y - u.y);
      if (L < 2) return '';
      const ua = { x: u.x + d.x * shrinkA, y: u.y + d.y * shrinkA };
      const vc = { x: v.x - d.x * shrinkC, y: v.y - d.y * shrinkC };
      return `<line class="bond" x1="${r2(ua.x)}" y1="${r2(ua.y)}" x2="${r2(vc.x)}" y2="${r2(vc.y)}"/>`;
    };
    const shifted = (s) => [{ x: p1.x + n.x * s, y: p1.y + n.y * s }, { x: p2.x + n.x * s, y: p2.y + n.y * s }];
    const off = S * 0.17;
    if (b.order === 1) parts.push(line(p1, p2));
    else if (b.order === 3) {
      parts.push(line(p1, p2));
      for (const s of [1, -1]) parts.push(line(...shifted(off * s)));
    } else if (b.order === 2) {
      const side = doubleBondSide(mol, b, coords, rings, labels);
      if (side === 0) {
        for (const s of [0.5, -0.5]) parts.push(line(...shifted(off * s)));
      } else {
        parts.push(line(p1, p2));
        const shrink = S * 0.14;
        parts.push(line(...shifted(off * side), labels[b.a] ? 0 : shrink, labels[b.b] ? 0 : shrink));
      }
    }
  }

  // atom labels
  labels.forEach((lab, i) => {
    if (!lab) return;
    parts.push(labelSvg(lab, P[i], fs));
  });

  // locant numbers
  if (opts.numbers) {
    for (const [k, text] of Object.entries(opts.numbers)) {
      const i = +k;
      const [ux, uy] = openDirection(mol, P, i);
      const dd = labels[i] ? S * 0.62 : S * 0.42;
      parts.push(`<text class="locant" x="${r2(P[i].x + ux * dd)}" y="${r2(P[i].y + uy * dd + fs * 0.3)}" font-size="${Math.round(fs * 0.72)}" text-anchor="middle">${esc(text)}</text>`);
    }
  }

  // hit targets for atom selection
  if (opts.selectable) {
    const onlyAtoms = opts.selectableAtoms ? new Set(opts.selectableAtoms) : null;
    mol.atoms.forEach((a, i) => {
      if (onlyAtoms && !onlyAtoms.has(i)) return;
      const nm = ELEMENT_NAMES[a.el] || a.el;
      parts.push(`<circle class="atom-hit" data-atom="${i}" cx="${r2(P[i].x)}" cy="${r2(P[i].y)}" r="${r2(S * 0.4)}" tabindex="0" role="button" aria-pressed="${selSet.has(i)}" aria-label="${esc(`${nm} atom ${i + 1}`)}"><title>${esc(nm)}</title></circle>`);
    });
  }

  return wrapSvg(parts, P, S, fs, opts, labels);
}

// Unit vector pointing into the largest empty angular gap around atom i (SVG coordinates).
function openDirection(mol, P, i) {
  const nb = neighbors(mol, i);
  if (!nb.length) return [0, -1];
  const angs = nb.map((j) => Math.atan2(P[j].y - P[i].y, P[j].x - P[i].x)).sort((a, b) => a - b);
  if (angs.length === 1) return [-Math.cos(angs[0]), -Math.sin(angs[0])];
  let best = 0, bestMid = 0;
  for (let k = 0; k < angs.length; k++) {
    const a = angs[k];
    const b = k + 1 < angs.length ? angs[k + 1] : angs[0] + 2 * Math.PI;
    if (b - a > best) { best = b - a; bestMid = (a + b) / 2; }
  }
  return [Math.cos(bestMid), Math.sin(bestMid)];
}

function wrapSvg(parts, P, S, fs, opts, labels) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  P.forEach((p, i) => {
    const w = labels && labels[i] ? labelWidth(labels[i], fs) : 0;
    const extraL = labels && labels[i] && labels[i].hLeft ? w : fs * 0.4;
    const extraR = labels && labels[i] && !labels[i].hLeft ? w : fs * 0.4;
    minX = Math.min(minX, p.x - extraL); maxX = Math.max(maxX, p.x + extraR);
    minY = Math.min(minY, p.y - fs * 0.7); maxY = Math.max(maxY, p.y + fs * 0.7);
  });
  const pad = opts.numbers ? S * 0.75 : S * 0.35;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  const w = Math.max(maxX - minX, S), h = Math.max(maxY - minY, S);
  const id = `mol${++uid}`;
  const title = opts.title ? `<title id="${id}-t">${esc(opts.title)}</title>` : '';
  const aria = opts.title ? `role="img" aria-labelledby="${id}-t"` : 'role="img" aria-label="chemical structure"';
  return `<svg class="mol-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${r2(minX)} ${r2(minY)} ${r2(w)} ${r2(h)}" width="${Math.round(w)}" height="${Math.round(h)}" ${aria}>${title}<g stroke-width="${r2(Math.max(1.4, S * 0.045))}" stroke-linecap="round">${parts.join('')}</g></svg>`;
}

function doubleBondSide(mol, b, coords, rings, labels) {
  // ring bond: inside the ring
  for (const r of rings) {
    const ia = r.indexOf(b.a), ib = r.indexOf(b.b);
    if (ia < 0 || ib < 0) continue;
    const dd = Math.abs(ia - ib);
    if (dd !== 1 && dd !== r.length - 1) continue;
    const c = r.reduce((acc, i) => ({ x: acc.x + coords[i].x / r.length, y: acc.y + coords[i].y / r.length }), { x: 0, y: 0 });
    return sideOfPoint(coords[b.a], coords[b.b], c);
  }
  // terminal heteroatom (C=O): centred
  const deg = (i) => neighbors(mol, i).length;
  if ((labels[b.a] && deg(b.a) === 1) || (labels[b.b] && deg(b.b) === 1)) return 0;
  const others = [...neighbors(mol, b.a).filter((x) => x !== b.b), ...neighbors(mol, b.b).filter((x) => x !== b.a)];
  if (!others.length) return 0;
  let s = 0;
  for (const o of others) s += sideOfPoint(coords[b.a], coords[b.b], coords[o]);
  if (s === 0) return 0;
  return s > 0 ? 1 : -1;
}

// +1 / -1 depending on which side of line a->b the point lies (in SVG space, y flipped)
function sideOfPoint(a, b, p) {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  // SVG normal n = (-d.y, d.x) with y flipped => sign inverts
  return cross > 0 ? -1 : cross < 0 ? 1 : 0;
}

function atomLabel(mol, i, opts, P) {
  const a = mol.atoms[i];
  const nb = neighbors(mol, i);
  const isC = a.el === 'C';
  const showC = opts.mode === 'condensed' || mol.atoms.length === 1 || (isC && a.charge) || (isC && nb.length === 0);
  if (isC && !showC) return null;
  let vx = 0;
  for (const j of nb) vx += P[j].x - P[i].x;
  const hLeft = nb.length > 0 && vx > 0.3 && a.h > 0;
  return { el: a.el, h: a.h || 0, charge: a.charge || 0, hLeft };
}

// Axis-aligned box around an atom label's text (SVG coordinates), with a little padding.
function labelBox(lab, p, fs) {
  const elW = lab.el.length * fs * 0.62;
  const w = labelWidth(lab, fs);
  let x0, x1;
  if (lab.hLeft) { x1 = p.x + elW / 2; x0 = x1 - w; } else { x0 = p.x - elW / 2; x1 = x0 + w; }
  const pad = fs * 0.14;
  return { x0: x0 - pad, x1: x1 + pad, y0: p.y - fs * 0.46 - pad, y1: p.y + fs * 0.42 + pad };
}

// Slab test: parameter interval [t0, t1] where segment a→c is inside the box, or null.
function boxHit(a, c, box) {
  let t0 = 0, t1 = 1;
  const dx = c.x - a.x, dy = c.y - a.y;
  for (const [p, dp, lo, hi] of [[a.x, dx, box.x0, box.x1], [a.y, dy, box.y0, box.y1]]) {
    if (Math.abs(dp) < 1e-9) { if (p < lo || p > hi) return null; continue; }
    let ta = (lo - p) / dp, tb = (hi - p) / dp;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return [t0, t1];
}

// Trim a bond line so it stops just outside the label boxes at its two ends.
export function clipSegment(a, c, boxA, boxC) {
  let ts = 0, te = 1;
  const len = Math.hypot(c.x - a.x, c.y - a.y) || 1;
  const gap = 1.5 / len;
  if (boxA) { const hit = boxHit(a, c, boxA); if (hit && hit[0] < 0.5) ts = Math.max(ts, hit[1] + gap); }
  if (boxC) { const hit = boxHit(a, c, boxC); if (hit && hit[1] > 0.5) te = Math.min(te, hit[0] - gap); }
  if (te <= ts) return null;
  return [{ x: a.x + (c.x - a.x) * ts, y: a.y + (c.y - a.y) * ts }, { x: a.x + (c.x - a.x) * te, y: a.y + (c.y - a.y) * te }];
}

function labelWidth(lab, fs) {
  const cw = fs * 0.62;
  let w = lab.el.length * cw;
  if (lab.h) w += cw + (lab.h > 1 ? cw * 0.6 : 0);
  if (lab.charge) w += cw * 0.6;
  return w;
}

function labelSvg(lab, p, fs) {
  const cw = fs * 0.62;
  const elW = lab.el.length * cw;
  const sub = lab.h > 1 ? `<tspan class="sub" dy="${r2(fs * 0.28)}" font-size="${Math.round(fs * 0.7)}">${lab.h}</tspan><tspan dy="${r2(-fs * 0.28)}">&#8203;</tspan>` : '';
  const hPart = lab.h ? `H${sub}` : '';
  const chargeText = lab.charge ? (Math.abs(lab.charge) > 1 ? Math.abs(lab.charge) : '') + (lab.charge > 0 ? '+' : '−') : '';
  const charge = chargeText ? `<tspan class="chg" dy="${r2(-fs * 0.42)}" font-size="${Math.round(fs * 0.72)}">${chargeText}</tspan>` : '';
  const cls = `atom el-${lab.el}`;
  const y = r2(p.y + fs * 0.36);
  if (lab.hLeft) {
    const x = r2(p.x + elW / 2);
    return `<text class="${cls}" x="${x}" y="${y}" font-size="${fs}" text-anchor="end">${hPart}${lab.el}${charge}</text>`;
  }
  const x = r2(p.x - elW / 2);
  return `<text class="${cls}" x="${x}" y="${y}" font-size="${fs}" text-anchor="start">${lab.el}${hPart}${charge}</text>`;
}

// ---- Full (Lewis-style) structure --------------------------------------------------------

function renderFull(mol, opts) {
  const L = layoutFull(mol);
  if (!L) return null;
  const S = (opts.scale || 38) * 1.05;
  const fs = Math.round(S * 0.42);
  const parts = [];
  const P = {};
  for (const [k, p] of Object.entries(L.pos)) P[k] = { x: p.x * S, y: -p.y * S };
  const hl = new Set(opts.highlight || []);
  for (const i of hl) parts.push(`<circle class="${opts.highlightClass || 'hl'}" cx="${r2(P[i].x)}" cy="${r2(P[i].y)}" r="${r2(S * 0.36)}"/>`);
  const line = (a, c) => `<line class="bond" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(c.x)}" y2="${r2(c.y)}"/>`;
  const seg = (p1, p2, cut = fs * 0.62) => {
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const d = { x: (p2.x - p1.x) / len, y: (p2.y - p1.y) / len };
    return [{ x: p1.x + d.x * cut, y: p1.y + d.y * cut }, { x: p2.x - d.x * cut, y: p2.y - d.y * cut }, d];
  };
  for (const b of mol.bonds) {
    const [q1, q2, d] = seg(P[b.a], P[b.b]);
    const n = { x: -d.y, y: d.x };
    const off = S * 0.09;
    if (b.order === 1) parts.push(line(q1, q2));
    else {
      const ks = b.order === 2 ? [1, -1] : [2, 0, -2];
      for (const k of ks) parts.push(line({ x: q1.x + n.x * off * k, y: q1.y + n.y * off * k }, { x: q2.x + n.x * off * k, y: q2.y + n.y * off * k }));
    }
  }
  const all = Object.values(P);
  for (const hs of L.hSlots) {
    const hp = { x: hs.x * S, y: -hs.y * S };
    const [q1, q2] = seg(P[hs.atom], hp);
    parts.push(line(q1, q2));
    parts.push(`<text class="atom el-H" x="${r2(hp.x)}" y="${r2(hp.y + fs * 0.36)}" font-size="${fs}" text-anchor="middle">H</text>`);
    all.push(hp);
  }
  for (const a of mol.atoms) {
    const p = P[a.id];
    const chg = a.charge ? `<tspan dy="${r2(-fs * 0.42)}" font-size="${Math.round(fs * 0.72)}">${a.charge > 0 ? '+' : '−'}</tspan>` : '';
    parts.push(`<text class="atom el-${a.el}" x="${r2(p.x)}" y="${r2(p.y + fs * 0.36)}" font-size="${fs}" text-anchor="middle">${a.el}${chg}</text>`);
  }
  for (const lp of L.lpSlots) {
    const p = P[lp.atom];
    const cx = p.x + lp.dx * fs * 0.78, cy = p.y - lp.dy * fs * 0.78;
    const px = lp.dy !== 0 ? fs * 0.22 : 0, py = lp.dx !== 0 ? fs * 0.22 : 0;
    parts.push(`<circle class="lp" cx="${r2(cx - px)}" cy="${r2(cy - py)}" r="${r2(fs * 0.1)}"/><circle class="lp" cx="${r2(cx + px)}" cy="${r2(cy + py)}" r="${r2(fs * 0.1)}"/>`);
  }
  return wrapSvg(parts, all, S, fs, opts, null);
}

// ---- 3D tetrahedral centre (wedge/dash) for chirality -------------------------------------

/**
 * groups: [top, left, wedge, dash] labels. mirror: draw the mirror image.
 * Returns SVG markup of a tetrahedral carbon drawn with two in-plane bonds, a wedge and a dash.
 */
export function renderTetrahedral(groups, opts = {}) {
  const S = opts.scale || 50;
  const fs = Math.round(S * 0.36);
  const m = opts.mirror ? -1 : 1;
  const C = { x: 0, y: 0 };
  // top (in plane), left (in plane), wedge (toward viewer), dash (away from viewer)
  const ends = [
    { x: 0, y: -S },
    { x: -S * 0.95 * m, y: S * 0.5 },
    { x: S * 0.95 * m, y: S * 0.55 },
    { x: S * 0.95 * m, y: -S * 0.35 },
  ];
  const anchors = ['middle', m > 0 ? 'end' : 'start', m > 0 ? 'start' : 'end', m > 0 ? 'start' : 'end'];
  const parts = [];
  const toward = (p, q, dd) => { const l = Math.hypot(q.x - p.x, q.y - p.y); return { x: p.x + (q.x - p.x) / l * dd, y: p.y + (q.y - p.y) / l * dd }; };
  const sC = (e) => toward(C, e, fs * 0.55);
  const sE = (e) => toward(e, C, e === ends[0] ? fs * 0.7 : fs * 0.15);
  // plain bonds
  for (const e of ends.slice(0, 2)) {
    const a = sC(e), b = sE(e);
    parts.push(`<line class="bond" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"/>`);
  }
  // wedge (filled triangle)
  {
    const e = ends[2]; const a = sC(e), b = sE(e);
    const l = Math.hypot(b.x - a.x, b.y - a.y); const n = { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
    const w = S * 0.12;
    parts.push(`<polygon class="wedge" points="${r2(a.x)},${r2(a.y)} ${r2(b.x + n.x * w)},${r2(b.y + n.y * w)} ${r2(b.x - n.x * w)},${r2(b.y - n.y * w)}"/>`);
  }
  // dash (hashed wedge)
  {
    const e = ends[3]; const a = sC(e), b = sE(e);
    const l = Math.hypot(b.x - a.x, b.y - a.y); const n = { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
    const steps = 6;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps; const w = S * 0.12 * t;
      const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
      parts.push(`<line class="bond hash" x1="${r2(px + n.x * w)}" y1="${r2(py + n.y * w)}" x2="${r2(px - n.x * w)}" y2="${r2(py - n.y * w)}"/>`);
    }
  }
  parts.push(`<text class="atom el-C" x="0" y="${r2(fs * 0.36)}" font-size="${fs}" text-anchor="middle">C</text>`);
  let minX = -S, maxX = S;
  groups.forEach((g, k) => {
    const e = ends[k];
    const el = groupElementClass(g);
    const w = g.replace(/\d/g, '').length * fs * 0.62 + (g.match(/\d/g) || []).length * fs * 0.45;
    const gap = fs * 0.2;
    let x = e.x;
    if (anchors[k] === 'start') { x = e.x + gap; maxX = Math.max(maxX, x + w); }
    else if (anchors[k] === 'end') { x = e.x - gap; minX = Math.min(minX, x - w); }
    parts.push(`<text class="atom grp ${el}" x="${r2(x)}" y="${r2(e.y + fs * 0.36)}" font-size="${fs}" text-anchor="${anchors[k]}">${formatGroup(g)}</text>`);
  });
  const pad = fs * 0.8;
  const minY = -S - fs - pad, maxY = S * 0.6 + fs + pad;
  const vb = `${r2(minX - pad)} ${r2(minY)} ${r2(maxX - minX + 2 * pad)} ${r2(maxY - minY)}`;
  const aria = opts.title ? `aria-label="${esc(opts.title)}"` : 'aria-label="3D drawing of a tetrahedral carbon"';
  return `<svg class="mol-svg tetra" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${Math.round(maxX - minX + 2 * pad)}" height="${Math.round(maxY - minY)}" role="img" ${aria}><g stroke-width="${r2(Math.max(1.4, S * 0.045))}" stroke-linecap="round">${parts.join('')}</g></svg>`;
}

function groupElementClass(g) {
  const m = /^(Cl|Br|F|I|OH|HO|O|NH2|H2N|N|SH|HS|S)/.exec(g);
  if (!m) return 'el-C';
  const map = { OH: 'O', HO: 'O', O: 'O', NH2: 'N', H2N: 'N', N: 'N', SH: 'S', HS: 'S', S: 'S' };
  return `el-${map[m[1]] || m[1]}`;
}

function formatGroup(g) {
  return esc(g).replace(/(\d)/g, `<tspan class="sub" dy="4" font-size="0.72em">$1</tspan><tspan dy="-4"></tspan>`);
}

export { isRingBond };
