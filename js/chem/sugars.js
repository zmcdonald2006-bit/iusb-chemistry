// Sugar drawings for Lecture 15: Fischer projections and Haworth projections.
// Kept separate from the general structure renderer (render.js): these are fixed textbook
// templates, not layouts computed from SMILES, so a sugar drawn here can't affect any other drawing.
// Both return SVG markup using the same CSS classes as the molecule drawings (.mol-svg, .bond, .atom…).

const r2 = (x) => Math.round(x * 100) / 100;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "CH2OH" → CH₂OH with real subscripts; colors oxygen-containing groups like the other drawings.
function fmt(g) {
  return esc(g).replace(/(\d)/g, '<tspan class="sub" dy="4" font-size="0.72em">$1</tspan><tspan dy="-4"></tspan>');
}
function elClass(g) {
  if (/^(OH|HO|O)$/.test(g)) return 'el-O';
  if (/^H$/.test(g)) return 'el-H';
  return 'el-C';
}
const textWidth = (g, fs) => g.replace(/\d/g, '').length * fs * 0.62 + (g.match(/\d/g) || []).length * fs * 0.45;

function svg(parts, box, S, title, extraClass = '') {
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0, h = y1 - y0;
  const aria = title ? `role="img" aria-label="${esc(title)}"` : 'role="img" aria-label="sugar structure"';
  return `<svg class="mol-svg ${extraClass}" xmlns="http://www.w3.org/2000/svg" viewBox="${r2(x0)} ${r2(y0)} ${r2(w)} ${r2(h)}" width="${Math.round(w)}" height="${Math.round(h)}" ${aria}><g stroke-width="${r2(Math.max(1.4, S * 0.045))}" stroke-linecap="round">${parts.join('')}</g></svg>`;
}

/**
 * Fischer projection.
 * spec = {
 *   top: 'CHO', bottom: 'CH2OH',
 *   rows: [['H', 'OH'], ['HO', 'H'], 'C=O', …],   // [left, right] = a chirality center (drawn as a cross);
 *                                                  // 'C=O' = a ketone carbon in the chain
 *   mark: [rowIndex…],   // highlight these rows (e.g. the chirality center farthest from C=O)
 *   showC: true,         // write "C" at each center instead of a bare cross
 *   numbers: true,       // number the carbons 1, 2, 3… from the top
 *   title,
 * }
 */
export function renderFischer(spec, opts = {}) {
  const S = opts.scale || 46;
  const fs = Math.round(S * 0.4);
  const rows = spec.rows || [];
  const marks = new Set(spec.mark || []);
  const parts = [];
  const arm = S * 0.9; // horizontal bond length
  const ys = [0, ...rows.map((_, i) => (i + 1) * S), (rows.length + 1) * S];
  let minX = -arm - fs, maxX = arm + fs;
  const label = (g, x, y, anchor) => {
    parts.push(`<text class="atom grp ${elClass(g)}" x="${r2(x)}" y="${r2(y + fs * 0.36)}" font-size="${fs}" text-anchor="${anchor}">${fmt(g)}</text>`);
    const w = textWidth(g, fs);
    if (anchor === 'end') minX = Math.min(minX, x - w); else if (anchor === 'start') maxX = Math.max(maxX, x + w);
    else { minX = Math.min(minX, x - w / 2); maxX = Math.max(maxX, x + w / 2); }
  };
  // highlights behind everything
  rows.forEach((row, i) => { if (marks.has(i)) parts.push(`<rect class="hl" x="${r2(-arm - fs * 1.6)}" y="${r2(ys[i + 1] - fs * 0.8)}" width="${r2(2 * arm + fs * 3.2)}" height="${r2(fs * 1.6)}" rx="${r2(fs * 0.6)}"/>`); });
  // the vertical chain: a line between each pair of neighbours, trimmed where a text label sits
  const isText = (k) => k === 0 || k === ys.length - 1 || typeof rows[k - 1] === 'string' || spec.showC;
  for (let k = 0; k + 1 < ys.length; k++) {
    const a = ys[k] + (isText(k) ? fs * 0.65 : 0), b = ys[k + 1] - (isText(k + 1) ? fs * 0.65 : 0);
    parts.push(`<line class="bond" x1="0" y1="${r2(a)}" x2="0" y2="${r2(b)}"/>`);
  }
  label(spec.top || 'CHO', 0, ys[0], 'middle');
  label(spec.bottom || 'CH2OH', 0, ys[ys.length - 1], 'middle');
  rows.forEach((row, i) => {
    const y = ys[i + 1];
    if (typeof row === 'string') {
      // a carbonyl carbon in the chain: C=O with the O to the right
      label('C', 0, y, 'middle');
      const x1 = fs * 0.55, x2 = arm - fs * 0.45, d = S * 0.07;
      parts.push(`<line class="bond" x1="${r2(x1)}" y1="${r2(y - d)}" x2="${r2(x2)}" y2="${r2(y - d)}"/>`);
      parts.push(`<line class="bond" x1="${r2(x1)}" y1="${r2(y + d)}" x2="${r2(x2)}" y2="${r2(y + d)}"/>`);
      label(row.replace(/^C=/, ''), arm, y, 'start');
      return;
    }
    const [left, right] = row;
    const gap = spec.showC ? fs * 0.55 : 0;
    parts.push(`<line class="bond" x1="${r2(-arm)}" y1="${r2(y)}" x2="${r2(-gap)}" y2="${r2(y)}"/>`);
    parts.push(`<line class="bond" x1="${r2(gap)}" y1="${r2(y)}" x2="${r2(arm)}" y2="${r2(y)}"/>`);
    if (spec.showC) label('C', 0, y, 'middle');
    label(left, -arm - fs * 0.2, y, 'end');
    label(right, arm + fs * 0.2, y, 'start');
  });
  if (spec.numbers) {
    ys.forEach((y, k) => parts.push(`<text class="locant" x="${r2(minX - fs * 0.5)}" y="${r2(y + fs * 0.3)}" font-size="${r2(fs * 0.75)}" text-anchor="end">${k + 1}</text>`));
    minX -= fs * 1.2;
  }
  const pad = fs * 0.6;
  return svg(parts, [minX - pad, ys[0] - fs - pad, maxX + pad, ys[ys.length - 1] + fs + pad], S, spec.title || opts.title, 'fischer');
}

// Ring templates in Haworth perspective (x right, y down; 1 = one unit). The front edge is drawn bold.
const RINGS = {
  // six-membered (pyranose): O at the back right, C1 on the right, C5 at the back left
  6: {
    pts: { O: [0.55, -0.5], C1: [1.15, 0.1], C2: [0.55, 0.7], C3: [-0.55, 0.7], C4: [-1.15, 0.1], C5: [-0.55, -0.5] },
    order: ['C5', 'O', 'C1', 'C2', 'C3', 'C4'],
    bold: [['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4']],
    carbons: ['C1', 'C2', 'C3', 'C4', 'C5'],
    inner: { C2: 0, C3: 0, C5: 1 }, // bonds that point into the ring (0 = up, 1 = down) are drawn short
  },
  // five-membered (furanose): O at the back, the anomeric carbon (C2 of fructose) on the right
  5: {
    pts: { O: [0, -0.6], C1: [1.25, -0.05], C2: [0.55, 0.78], C3: [-0.55, 0.78], C4: [-1.25, -0.05] },
    order: ['O', 'C1', 'C2', 'C3', 'C4'],
    bold: [['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4']],
    carbons: ['C1', 'C2', 'C3', 'C4'],
    inner: { C2: 0, C3: 0 },
  },
};

/**
 * Haworth projection.
 * spec = {
 *   ring: 6 | 5,
 *   subs: [[up, down], …]   // one pair per ring carbon, starting at the anomeric carbon and going
 *                           // the long way round to the carbon bonded to the ring O
 *   mark: [i…],             // highlight these ring carbons (0 = anomeric carbon)
 *   numbers: [1, 2, 3, 4, 5] // optional carbon numbers to print next to each ring carbon
 *   title,
 * }
 */
export function renderHaworth(spec, opts = {}) {
  const S = opts.scale || 56;
  const fs = Math.round(S * 0.3);
  const T = RINGS[spec.ring === 5 ? 5 : 6];
  const P = {};
  for (const [k, [x, y]] of Object.entries(T.pts)) P[k] = { x: x * S, y: y * S };
  const parts = [];
  const marks = new Set(spec.mark || []);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const grow = (x0, y0, x1, y1) => { minX = Math.min(minX, x0); maxX = Math.max(maxX, x1); minY = Math.min(minY, y0); maxY = Math.max(maxY, y1); };
  T.carbons.forEach((c, i) => { if (marks.has(i)) parts.push(`<circle class="hl" cx="${r2(P[c].x)}" cy="${r2(P[c].y)}" r="${r2(S * 0.2)}"/>`); });
  // ring bonds (shortened at the O label)
  const n = T.order.length;
  const bold = new Set(T.bold.map(([a, b]) => `${a}-${b}`));
  for (let i = 0; i < n; i++) {
    const a = T.order[i], b = T.order[(i + 1) % n];
    let p = P[a], q = P[b];
    const trim = (u, v) => { const l = Math.hypot(v.x - u.x, v.y - u.y), d = fs * 0.6; return { x: u.x + (v.x - u.x) / l * d, y: u.y + (v.y - u.y) / l * d }; };
    if (a === 'O') p = trim(p, q);
    if (b === 'O') q = trim(q, p);
    const thick = bold.has(`${a}-${b}`) || bold.has(`${b}-${a}`);
    parts.push(`<line class="bond" x1="${r2(p.x)}" y1="${r2(p.y)}" x2="${r2(q.x)}" y2="${r2(q.y)}"${thick ? ` stroke-width="${r2(Math.max(3.5, S * 0.11))}"` : ''}/>`);
  }
  parts.push(`<text class="atom el-O" x="${r2(P.O.x)}" y="${r2(P.O.y + fs * 0.36)}" font-size="${fs}" text-anchor="middle">O</text>`);
  grow(P.O.x - fs, P.O.y - fs, P.O.x + fs, P.O.y + fs);
  // substituents straight up and down from each ring carbon
  const L = S * 0.5;
  T.carbons.forEach((c, i) => {
    const pair = (spec.subs || [])[i] || [];
    const p = P[c];
    pair.forEach((g, k) => {
      if (!g) return;
      const dir = k === 0 ? -1 : 1;
      const end = p.y + dir * (T.inner && T.inner[c] === k ? S * 0.2 : L);
      parts.push(`<line class="bond" x1="${r2(p.x)}" y1="${r2(p.y)}" x2="${r2(p.x)}" y2="${r2(end - dir * fs * 0.15)}"/>`);
      const ty = end + dir * fs * 0.55;
      const w = textWidth(g, fs);
      // carbons at the far left/right of the ring write their labels outward, away from the ring
      const side = Math.abs(p.x) > 0.9 * S ? Math.sign(p.x) : 0;
      const anchor = side > 0 ? 'start' : side < 0 ? 'end' : 'middle';
      const tx = p.x - side * fs * 0.35;
      parts.push(`<text class="atom grp ${elClass(g)}" x="${r2(tx)}" y="${r2(ty + fs * 0.36)}" font-size="${fs}" text-anchor="${anchor}">${fmt(g)}</text>`);
      const x0 = side > 0 ? tx : side < 0 ? tx - w : tx - w / 2;
      grow(x0, ty - fs * 0.6, x0 + w, ty + fs * 0.6);
    });
    if (spec.numbers && spec.numbers[i] != null) {
      const out = { x: p.x + (p.x >= 0 ? fs * 0.55 : -fs * 0.55), y: p.y + fs * 0.25 };
      parts.push(`<text class="locant" x="${r2(out.x)}" y="${r2(out.y)}" font-size="${r2(fs * 0.75)}" text-anchor="${p.x >= 0 ? 'start' : 'end'}">${spec.numbers[i]}</text>`);
    }
    grow(p.x - fs, p.y - fs, p.x + fs, p.y + fs);
  });
  const pad = fs * 0.5;
  return svg(parts, [minX - pad, minY - pad, maxX + pad, maxY + pad], S, spec.title || opts.title, 'haworth');
}

// Ready-made specs for the sugars on the slides, so content and questions stay consistent.
export const SUGARS = {
  'D-glyceraldehyde': { top: 'CHO', rows: [['H', 'OH']], bottom: 'CH2OH' },
  'L-glyceraldehyde': { top: 'CHO', rows: [['HO', 'H']], bottom: 'CH2OH' },
  'dihydroxyacetone': { top: 'CH2OH', rows: ['C=O'], bottom: 'CH2OH' },
  'D-erythrose': { top: 'CHO', rows: [['H', 'OH'], ['H', 'OH']], bottom: 'CH2OH' },
  'ketopentose (slide)': { top: 'CH2OH', rows: ['C=O', ['H', 'OH'], ['HO', 'H']], bottom: 'CH2OH' },
  'D-glucose': { top: 'CHO', rows: [['H', 'OH'], ['HO', 'H'], ['H', 'OH'], ['H', 'OH']], bottom: 'CH2OH' },
  'L-glucose': { top: 'CHO', rows: [['HO', 'H'], ['H', 'OH'], ['HO', 'H'], ['HO', 'H']], bottom: 'CH2OH' },
  'D-galactose': { top: 'CHO', rows: [['H', 'OH'], ['HO', 'H'], ['HO', 'H'], ['H', 'OH']], bottom: 'CH2OH' },
  'D-fructose': { top: 'CH2OH', rows: ['C=O', ['HO', 'H'], ['H', 'OH'], ['H', 'OH']], bottom: 'CH2OH' },
  // Haworth projections (subs = [up, down] for each ring carbon, anomeric carbon first)
  'α-D-glucose': { ring: 6, subs: [['H', 'OH'], ['H', 'OH'], ['OH', 'H'], ['H', 'OH'], ['CH2OH', 'H']] },
  'β-D-glucose': { ring: 6, subs: [['OH', 'H'], ['H', 'OH'], ['OH', 'H'], ['H', 'OH'], ['CH2OH', 'H']] },
  'α-D-fructose': { ring: 5, subs: [['CH2OH', 'OH'], ['OH', 'H'], ['H', 'OH'], ['CH2OH', 'H']] },
  'β-D-fructose': { ring: 5, subs: [['OH', 'CH2OH'], ['OH', 'H'], ['H', 'OH'], ['CH2OH', 'H']] },
};

// Resolve a block/figure spec: either a full spec or { sugar: 'D-glucose', …overrides }.
export function sugarSpec(spec) {
  if (!spec) return null;
  if (spec.sugar) {
    const base = SUGARS[spec.sugar];
    if (!base) throw new Error(`unknown sugar "${spec.sugar}"`);
    return { ...base, ...spec };
  }
  return spec;
}

export function renderSugar(spec, opts = {}) {
  const s = sugarSpec(spec);
  return s.ring ? renderHaworth(s, opts) : renderFischer(s, opts);
}
