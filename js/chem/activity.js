// Enzyme activity curves (Lecture 19): activity against pH or temperature, one hump per enzyme,
// labeled A, B, C like the slides. Each curve peaks at its optimum. Temperature curves rise slowly
// and fall fast, because heat denatures the enzyme past its optimum.

const r2 = (x) => Math.round(x * 100) / 100;
const AXES = {
  pH: { min: 0, max: 12, step: 1, label: 'pH' },
  temp: { min: 0, max: 60, step: 10, label: 'Temperature (°C)' },
};

// Relative activity (0–1) of an enzyme with this optimum at x.
export function activityAt(kind, peak, x) {
  const d = x - peak;
  const s = kind === 'pH' ? 0.95 : d < 0 ? 11 : 4.5;
  return Math.exp(-(d * d) / (2 * s * s));
}

/**
 * spec = { x: 'pH' | 'temp', curves: [{ label: 'A', peak: 2 }, …], title }
 * Peaks must sit inside the axis (pH 0–12, 0–60 °C).
 */
export function renderActivity(spec, opts = {}) {
  const ax = AXES[spec.x];
  if (!ax) throw new Error(`unknown axis "${spec.x}"`);
  const curves = spec.curves || [];
  if (!curves.length) throw new Error('no curves');
  const W = 320, H = 190, L = 44, R = 12, T = 26, B = 40;
  const px = (v) => L + ((v - ax.min) / (ax.max - ax.min)) * (W - L - R);
  const py = (a) => H - B - a * (H - B - T);
  const parts = [];
  // axes
  parts.push(`<line class="ax" x1="${L}" y1="${T - 6}" x2="${L}" y2="${H - B}"/>`);
  parts.push(`<line class="ax" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/>`);
  for (let v = ax.min; v <= ax.max + 1e-9; v += ax.step) {
    const x = r2(px(v));
    parts.push(`<line class="ax" x1="${x}" y1="${H - B}" x2="${x}" y2="${H - B + 4}"/>`);
    if (v !== ax.min || spec.x === 'temp') parts.push(`<text class="tick" x="${x}" y="${H - B + 16}" font-size="11" text-anchor="middle">${v}</text>`);
  }
  parts.push(`<text class="axlabel" x="${r2((L + W - R) / 2)}" y="${H - 6}" font-size="12.5" text-anchor="middle">${ax.label}</text>`);
  parts.push(`<text class="axlabel" x="14" y="${r2((T + H - B) / 2)}" font-size="12.5" text-anchor="middle" transform="rotate(-90 14 ${r2((T + H - B) / 2)})">Enzyme activity</text>`);
  curves.forEach((c, i) => {
    if (!(c.peak >= ax.min && c.peak <= ax.max)) throw new Error(`peak ${c.peak} is off the ${spec.x} axis`);
    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const v = ax.min + ((ax.max - ax.min) * k) / 160;
      pts.push(`${r2(px(v))},${r2(py(activityAt(spec.x, c.peak, v) * 0.92))}`);
    }
    parts.push(`<polyline class="curve c${i % 4}" points="${pts.join(' ')}"/>`);
    if (c.label) parts.push(`<text class="curve-label c${i % 4}" x="${r2(px(c.peak))}" y="${r2(py(0.92) - 7)}" font-size="14" text-anchor="middle">${c.label}</text>`);
  });
  const title = opts.title || spec.title;
  const label = title ? `<title>${String(title).replace(/[*_<>&]/g, '')}</title>` : '';
  return `<svg class="mol-svg activity-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">${label}${parts.join('')}</svg>`;
}
