// Peptides and amino acids drawn the way the Lecture 17 slides draw them: a straight backbone with
// each C=O pointing up, each side chain (R) pointing down and each new amide bond in color.
// Kept separate from the general structure renderer, like the sugar drawings.
import { aminoAcid } from './aminoacids.js';

const r2 = (x) => Math.round(x * 100) / 100;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (g) => esc(g).replace(/(\d)/g, '<tspan class="sub" dy="4" font-size="0.72em">$1</tspan><tspan dy="-4"></tspan>');
const textWidth = (g, fs) => g.replace(/\d/g, '').length * fs * 0.6 + (g.match(/\d/g) || []).length * fs * 0.42;
const elClass = (g) => (/^(O|OH|O⁻)$/.test(g) ? 'el-O' : /^(N|H3N⁺|H2N)$/.test(g) ? 'el-N' : /^H$/.test(g) ? 'el-H' : 'el-C');

/**
 * spec = {
 *   seq: ['Ala', 'Ser'],       // three-letter names from the N-terminal end; or
 *   rs:  ['R1', 'R2'],         // side chains as text (general drawings)
 *   n: 'H3N⁺' (default) | 'H2N',   c: 'O⁻' (default) | 'OH',
 *   plainAmide: true,          // draw amide bonds like the others
 *   title,
 * }
 */
export function renderPeptide(spec, opts = {}) {
  const S = opts.scale || 34;
  const fs = Math.round(S * 0.44);
  const residues = (spec.rs || spec.seq.map((t) => {
    const a = aminoAcid(t);
    if (!a || a.noDraw) throw new Error(`can't draw "${t}" in a peptide`);
    return a.ring ? { r: 'CH2', ring: a.ring } : a.r;
  })).map((x) => (typeof x === 'string' ? { r: x } : x));
  const parts = [];
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  const grow = (x0, y0, x1, y1) => { minX = Math.min(minX, x0); maxX = Math.max(maxX, x1); minY = Math.min(minY, y0); maxY = Math.max(maxY, y1); };
  const label = (g, x, y, anchor = 'middle') => {
    parts.push(`<text class="atom grp ${elClass(g)}" x="${r2(x)}" y="${r2(y + fs * 0.36)}" font-size="${fs}" text-anchor="${anchor}">${fmt(g)}</text>`);
    const w = textWidth(g, fs);
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    grow(x0, y - fs * 0.62, x0 + w, y + fs * 0.62);
    return w;
  };
  const line = (x1, y1, x2, y2, cls = '') => parts.push(`<line class="bond ${cls}" x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}"/>`);
  const gap = fs * 0.92; // space a bond leaves around a label's center
  const n = spec.n || 'H3N⁺', c = spec.c || 'O⁻';

  // the atoms along the backbone, left to right
  label(n, 0, 0, 'end');
  let x = S * 0.95;
  line(fs * 0.12, 0, x - gap, 0);
  const levels = []; // right edge of the last label on each row of side chains
  residues.forEach((res, i) => {
    const ca = x;
    label('CH', ca, 0);
    const cc = ca + S * 1.35;
    line(ca + gap, 0, cc - fs * 0.5, 0);
    // side chain: first row that has room, so long labels never run into each other or the N–H
    const w = textWidth(res.r, fs);
    let row = 0;
    const left = ca - w / 2 - fs * 0.5;
    while (levels[row] !== undefined && levels[row] > left) row += 1;
    if (i > 0 && row === 0 && left < ca - S * 1.35 + fs * 0.6) row = 1; // the H under the N before this CH
    while (levels[row] !== undefined && levels[row] > left) row += 1;
    levels[row] = ca + w / 2;
    const ry = S * 1.15 + row * S * 0.95;
    line(ca, fs * 0.62, ca, ry - fs * 0.62);
    label(res.r, ca, ry);
    if (res.ring) drawRing(ca, ry, res.ring, parts, grow, label, S, fs);
    // the carbonyl
    label('C', cc, 0);
    const d = S * 0.07;
    line(cc - d, -fs * 0.6, cc - d, -S * 1.0 + fs * 0.55);
    line(cc + d, -fs * 0.6, cc + d, -S * 1.0 + fs * 0.55);
    label('O', cc, -S * 1.0);
    if (i < residues.length - 1) {
      // the amide (peptide) bond
      const nx = cc + S * 1.35;
      const amide = spec.plainAmide ? '' : 'amide';
      line(cc + fs * 0.5, 0, nx - fs * 0.55, 0, amide);
      label('N', nx, 0);
      line(nx, fs * 0.6, nx, S * 1.0 - fs * 0.6);
      label('H', nx, S * 1.0);
      line(nx + fs * 0.55, 0, nx + S * 1.35 - gap, 0);
      x = nx + S * 1.35;
    } else {
      const ox = cc + S * 1.2;
      line(cc + fs * 0.5, 0, ox - fs * 0.55, 0);
      label(c, ox - fs * 0.4, 0, 'start');
    }
  });
  const pad = fs * 0.55;
  const w = maxX - minX + 2 * pad, h = maxY - minY + 2 * pad;
  const title = spec.title || opts.title;
  const aria = `role="img" aria-label="${esc(title || (spec.seq ? spec.seq.join('–') : 'amino acid'))}"`;
  return `<svg class="mol-svg peptide" xmlns="http://www.w3.org/2000/svg" viewBox="${r2(minX - pad)} ${r2(minY - pad)} ${r2(w)} ${r2(h)}" width="${Math.round(w)}" height="${Math.round(h)}" ${aria}><g stroke-width="${r2(Math.max(1.4, S * 0.05))}" stroke-linecap="round">${parts.join('')}</g></svg>`;
}

// The benzene ring of Phe and Tyr, hanging below their CH₂.
function drawRing(cx, ry, kind, parts, grow, label, S, fs) {
  const R = S * 0.62, top = ry + fs * 0.62, cy = top + S * 0.25 + R;
  const pts = Array.from({ length: 6 }, (_, k) => {
    const a = -Math.PI / 2 + k * Math.PI / 3;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  parts.push(`<line class="bond" x1="${r2(cx)}" y1="${r2(top)}" x2="${r2(pts[0][0])}" y2="${r2(pts[0][1])}"/>`);
  pts.forEach((p, k) => {
    const q = pts[(k + 1) % 6];
    parts.push(`<line class="bond" x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(q[0])}" y2="${r2(q[1])}"/>`);
    if (k % 2 === 0) { // alternating inner double bonds
      const f = 0.76;
      const ix = (u) => cx + (u[0] - cx) * f, iy = (u) => cy + (u[1] - cy) * f;
      parts.push(`<line class="bond" x1="${r2(ix(p))}" y1="${r2(iy(p))}" x2="${r2(ix(q))}" y2="${r2(iy(q))}"/>`);
    }
  });
  grow(cx - R, cy - R, cx + R, cy + R);
  if (kind === 'phenol') {
    const b = pts[3];
    parts.push(`<line class="bond" x1="${r2(b[0])}" y1="${r2(b[1])}" x2="${r2(b[0])}" y2="${r2(b[1] + S * 0.32)}"/>`);
    label('OH', b[0], b[1] + S * 0.32 + fs * 0.6);
  }
}
