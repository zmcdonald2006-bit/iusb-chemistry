import { h, icon, md, mdi, clear } from '../ui/dom.js';
import { pageHead, molView, autoNumbers } from '../ui/components.js';
import { parseName } from '../chem/nameparse.js';
import { nameCompound } from '../chem/namer.js';
import { checkName } from '../chem/namecheck.js';
import { molecularFormula, functionalGroupTypes, chiralityCenters } from '../chem/analyze.js';
import { condensedFormula } from '../chem/condensed.js';
import { toSmiles } from '../chem/smiles.js';
import { FG_LABELS } from '../chem/analyze.js';
import { randomMolecule, KINDS } from '../chem/generator.js';
import { makeRng } from '../lib/random.js';

const EXAMPLES = ['2-methylhexane', '5-ethyl-2,6-dimethyloctane', '2-ethylpentane', 'cis-2-butene', '4,4-dimethyl-2-pentyne', '2-butanol', '3-methoxyheptane', '2-chloro-5-methylheptane', '2-methylbutanal', '3-pentanone', '2-methylbutanoic acid', 'sodium acetate', 'methylcyclohexane', 'diethyl ether', 'acetone'];

export default function lab({ app, main, query }) {
  main.appendChild(pageHead({ title: 'Name Lab', sub: 'Type any name from class and see the structure it describes. Great for checking homework — and for seeing why a name is wrong.' }));
  const input = h('input', { class: 'input', type: 'text', placeholder: 'e.g. 3-ethyl-2-methylhexane', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Compound name' });
  const out = h('div', { style: { marginTop: '14px' } });
  const chips = h('div', { class: 'example-chips' }, EXAMPLES.map((e) => h('button', { type: 'button', class: 'chip chip-select', onclick: () => { input.value = e; update(); } }, e)));
  const randomBtn = h('button', { type: 'button', class: 'btn secondary small' }, icon('shuffle'), 'Random structure — can you name it?');
  main.appendChild(h('div', { class: 'card' }, h('label', { class: 'label', for: 'lab-in' }, 'Compound name'), h('div', { class: 'answer-input', style: { marginTop: '6px' } }, input), chips, h('div', { style: { marginTop: '12px' } }, randomBtn)));
  input.id = 'lab-in';
  main.appendChild(out);

  let t = null;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(update, 220); });
  randomBtn.addEventListener('click', () => {
    const kinds = Object.keys(KINDS);
    const r = makeRng(Date.now());
    const m = randomMolecule(r, r.pick(kinds));
    if (!m) return;
    clear(out);
    const reveal = h('button', { type: 'button', class: 'btn' }, icon('eye'), 'Reveal the name');
    const nameBox = h('div', { class: 'hidden', style: { marginTop: '10px' } });
    reveal.addEventListener('click', () => { nameBox.classList.remove('hidden'); reveal.remove(); });
    nameBox.appendChild(h('h3', {}, m.name));
    nameBox.appendChild(h('button', { type: 'button', class: 'btn secondary small', onclick: () => { input.value = m.name; update(); } }, 'Show details'));
    out.appendChild(h('div', { class: 'card center' }, h('p', { class: 'muted' }, 'Name this compound in your head (or on paper), then reveal.'), h('div', { class: 'mols' }, molView({ smiles: m.smiles, toggleH: true })), reveal, nameBox));
  });

  function update() {
    clear(out);
    const text = input.value.trim();
    if (!text) return;
    const p = parseName(text);
    if (!p.ok) {
      out.appendChild(h('div', { class: 'card callout warn' }, h('div', { class: 'co-title' }, icon('warn'), 'Can\'t draw that yet'), h('ul', {}, p.issues.map((i) => h('li', {}, mdi(i.msg))))));
      return;
    }
    const smiles = toSmiles(p.mol);
    const real = nameCompound(p.mol);
    const check = real ? checkName(text, { smiles: p.smiles || smiles }) : null;
    const left = h('div', { class: 'card center' }, molView({ smiles: p.smiles || smiles, numbers: autoNumbers(p.smiles || smiles), toggleH: true, scale: 42 }), h('div', { class: 'hint' }, 'Purple numbers show the correct IUPAC numbering.'));
    const right = h('div', { class: 'card' });
    if (check && !check.correct) {
      right.appendChild(h('div', { class: `callout ${check.status === 'close' ? 'warn' : 'tip'}`, style: { marginBottom: '12px' } },
        h('div', { class: 'co-title' }, icon('bulb'), check.status === 'close' ? 'Right molecule, name needs a fix' : 'Heads up'),
        md(check.tips && check.tips.length ? check.tips.join("\n\n") : check.message),
        real ? h('p', { style: { margin: '6px 0 0' } }, 'Correct name: ', h('b', {}, real.name)) : null));
    } else if (check && check.correct) {
      right.appendChild(h('div', { class: 'callout life', style: { marginBottom: '12px' } }, h('div', { class: 'co-title' }, icon('check'), 'That\'s a correct name'), check.message && check.message !== 'Correct!' ? md(check.message) : null));
    }
    const fgs = functionalGroupTypes(p.mol).map((f) => FG_LABELS[f] || f);
    const centers = chiralityCenters(p.mol);
    const cond = condensedFormula(p.mol);
    const dl = h('dl', { class: 'kv' },
      h('dt', {}, 'IUPAC name'), h('dd', {}, real ? real.name : '—'),
      real && real.common.length ? [h('dt', {}, 'Other names'), h('dd', {}, real.common.join(', '))] : null,
      h('dt', {}, 'Formula'), h('dd', { html: formulaHtmlSafe(molecularFormula(p.mol)) }),
      cond ? [h('dt', {}, 'Condensed'), h('dd', { html: formulaHtmlSafe(cond) })] : null,
      h('dt', {}, 'Family'), h('dd', {}, fgs.length ? fgs.join(', ') : 'Alkane (no functional group)'),
      h('dt', {}, 'Chirality centers'), h('dd', {}, String(centers.length)));
    right.appendChild(dl);
    if (centers.length) {
      right.appendChild(h('div', { style: { marginTop: '12px' } }, h('div', { class: 'hint' }, 'Chirality centers highlighted:'), molView({ smiles: p.smiles || smiles, highlight: centers, plain: true, scale: 30 })));
    }
    out.appendChild(h('div', { class: 'lab-out' }, left, right));
  }

  if (query.name) { input.value = query.name; update(); }
}

function formulaHtmlSafe(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>').replace(/([+-])$/, '<sup>$1</sup>');
}
