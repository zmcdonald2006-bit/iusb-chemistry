import { h, md, clear } from '../ui/dom.js';
import { pageHead, emptyState } from '../ui/components.js';
import { parseNumber } from '../quiz/checkers.js';

export default function tools({ app, main, params }) {
  if (params.tool !== 'ph') {
    main.appendChild(emptyState('tool', 'Tool not found', '', h('a', { class: 'btn', href: '#/tools/ph' }, 'pH calculator')));
    return;
  }
  app.setTitle('pH calculator');
  main.appendChild(pageHead({ title: 'pH calculator', sub: 'Shows every step and applies the sig-fig rule — so you can check homework and learn the method.' }));

  const c1 = h('div', { class: 'card' });
  const conc = h('input', { class: 'input', inputmode: 'decimal', placeholder: 'e.g. 1.2 x 10^-5', 'aria-label': 'Hydronium concentration in M', autocomplete: 'off' });
  const out1 = h('div', { style: { marginTop: '12px' } });
  c1.append(h('h3', {}, '[H₃O⁺] → pH'), h('div', { class: 'field' }, h('label', {}, '[H₃O⁺] in M'), conc, h('span', { class: 'hint' }, 'Formats: 1.2 x 10^-5, 1.2e-5, 0.000012')), out1);
  conc.addEventListener('input', () => {
    clear(out1);
    const x = parseNumber(conc.value);
    if (x == null || x <= 0) return;
    const digits = sigDigits(conc.value);
    const ph = -Math.log10(x);
    const shown = ph.toFixed(Math.max(0, digits));
    const kind = ph < 7 - 1e-9 ? 'acidic' : ph > 7 + 1e-9 ? 'basic' : 'neutral';
    out1.appendChild(md(`pH = −log(${fmt(x)}) = **${shown}**\n\nSig figs: the concentration has **${digits}** significant digit${digits === 1 ? '' : 's'}, so the pH has **${digits}** decimal place${digits === 1 ? '' : 's'}.\n\nThe solution is **${kind}**.`));
  });

  const c2 = h('div', { class: 'card' });
  const phIn = h('input', { class: 'input', inputmode: 'decimal', placeholder: 'e.g. 4.50', 'aria-label': 'pH', autocomplete: 'off' });
  const out2 = h('div', { style: { marginTop: '12px' } });
  c2.append(h('h3', {}, 'pH → [H₃O⁺]'), h('div', { class: 'field' }, h('label', {}, 'pH'), phIn), out2);
  phIn.addEventListener('input', () => {
    clear(out2);
    const p = parseNumber(phIn.value);
    if (p == null) return;
    const dec = (phIn.value.split('.')[1] || '').replace(/\D/g, '').length || 1;
    const x = Math.pow(10, -p);
    const e = Math.floor(Math.log10(x));
    const m = x / Math.pow(10, e);
    const kind = p < 7 ? 'acidic' : p > 7 ? 'basic' : 'neutral';
    out2.appendChild(md(`[H₃O⁺] = 10^−${p}^ = **${m.toFixed(Math.max(0, dec - 1))} × 10^${e}^ M**\n\nThe pH has **${dec}** decimal place${dec === 1 ? '' : 's'}, so the answer gets **${dec}** significant digit${dec === 1 ? '' : 's'}. On a calculator: **10^x^** (often 2nd + log) of −${p}.\n\nThe solution is **${kind}**.`));
  });

  main.append(h('div', { class: 'stack' }, c1, c2));
}

function sigDigits(text) {
  const t = String(text).trim().toLowerCase().replace(/\s+/g, '');
  const mant = t.split(/x|×|\*|e/)[0].replace(/^[-+]/, '');
  const digits = mant.replace('.', '').replace(/^0+/, '');
  return Math.max(1, digits.length);
}

function fmt(x) {
  if (x >= 1e-3 && x < 1e3) return String(x);
  const e = Math.floor(Math.log10(x));
  return `${+(x / Math.pow(10, e)).toPrecision(6)} × 10^${e}^`;
}
