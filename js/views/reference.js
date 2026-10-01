import { h, icon, mdi, clear } from '../ui/dom.js';
import { pageHead, molView } from '../ui/components.js';
import { glossary } from '../../content/course.js';

const TABS = [
  ['groups', 'Functional groups'], ['naming', 'Naming'], ['properties', 'Properties'], ['shapes', 'Shapes'], ['acidbase', 'Acids & bases'], ['glossary', 'Glossary'],
];

const FAMILIES = [
  ['Alkane', 'CCC', 'C–C, C–H only', '-ane', 'L3'],
  ['Alkene', 'CC=C', 'C=C', '-ene', 'L4'],
  ['Alkyne', 'CC#C', 'C≡C', '-yne', 'L4'],
  ['Aromatic', 'c1ccccc1', 'benzene ring', '—', 'L2'],
  ['Alkyl halide', 'CCCl', 'C–X (F, Cl, Br, I)', 'halo- prefix', 'L6'],
  ['Alcohol', 'CCO', '–OH', '-ol', 'L5'],
  ['Ether', 'COC', 'C–O–C', 'alkoxy- / "… ether"', 'L6'],
  ['Thiol', 'CCS', '–SH', '-thiol', 'L6'],
  ['Amine', 'CCN', '–NH₂', '(not covered yet)', 'L2'],
  ['Aldehyde', 'CC=O', '–CHO', '-al', 'L8'],
  ['Ketone', 'CC(C)=O', 'C–CO–C', '-one', 'L8'],
  ['Carboxylic acid', 'CC(=O)O', '–COOH', '-oic acid', 'L10'],
  ['Ester', 'CC(=O)OC', '–COOR', '(not covered yet)', 'L2'],
  ['Amide', 'CC(N)=O', '–CONH₂', '(not covered yet)', 'L2'],
];

export default function reference({ app, main, params }) {
  const tab = params.tab && TABS.some((t) => t[0] === params.tab) ? params.tab : 'groups';
  main.appendChild(pageHead({ title: 'Reference', sub: 'Quick-look tables for everything you need to memorize.' }));
  main.appendChild(h('div', { class: 'tabs', role: 'tablist' }, TABS.map(([id, label]) => h('a', { class: 'tab', role: 'tab', href: `#/reference/${id}`, 'aria-selected': String(id === tab) }, label))));
  const body = h('div', { class: 'stack' });
  main.appendChild(body);
  ({ groups, naming, properties, shapes, acidbase, glossary: glossaryTab })[tab](body, app);
}

function table(head, rows) {
  return h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, head.map((x) => h('th', {}, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c instanceof Node ? c : mdi(String(c)))))))));
}

function groups(body) {
  body.appendChild(table(['Family', 'Example', 'Group', 'Name ending', ''], FAMILIES.map(([f, s, g, e, l]) => [h('b', {}, f), molView({ smiles: s, plain: true, scale: 22 }), g, e, h('span', { class: 'chip' }, l)])));
  body.appendChild(h('div', { class: 'callout tip' }, h('div', { class: 'co-title' }, icon('bulb'), 'Carbonyl families: what\'s on the C=O carbon?'), mdi('**H** → aldehyde · **two C** → ketone · **OH** → carboxylic acid · **OR** → ester · **N** → amide')));
}

function naming(body) {
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'Chain length prefixes'), table(['#C', 'Prefix', '#C', 'Prefix'], [[1, 'meth'], [2, 'eth'], [3, 'prop'], [4, 'but'], [5, 'pent']].map(([n, p], i) => [n, p, n + 5, ['hex', 'hept', 'oct', 'non', 'dec'][i]]))));
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'Suffixes & priority'), table(['Family', 'Suffix', 'Numbering'], [
    ['Carboxylic acid', '**-oic acid**', 'COOH carbon = C1 (no number)'],
    ['Aldehyde', '**-al**', 'CHO carbon = C1 (no number)'],
    ['Ketone', '**-one**', 'lowest number to C=O'],
    ['Alcohol', '**-ol**', 'lowest number to OH'],
    ['Thiol', '**-thiol**', 'lowest number to SH (keep the "e": propanethiol)'],
    ['Alkene / alkyne', '**-ene / -yne**', 'lowest number to the multiple bond'],
    ['Alkane', '**-ane**', 'lowest numbers to substituents'],
  ]), h('p', { class: 'hint', style: { marginTop: '8px' } }, 'If a molecule has two of these, the one higher in the table is the suffix; the other becomes a prefix (hydroxy-, oxo-).')));
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'Prefixes (substituents)'), table(['Group', 'Prefix'], [
    ['$CH_3$–', 'methyl'], ['$CH_3CH_2$–', 'ethyl'], ['$CH_3CH_2CH_2$–', 'propyl'], ['$(CH_3)_2CH$–', 'isopropyl'], ['F, Cl, Br, I', 'fluoro, chloro, bromo, iodo'], ['$CH_3O$–, $CH_3CH_2O$–', 'methoxy, ethoxy'], ['–OH (when not the suffix)', 'hydroxy'],
  ])));
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'The naming checklist'), h('ol', { class: 'steps' }, [
    'Find the **longest chain** that contains the functional group (and the C=C/C≡C). It may bend!',
    'Number from the end that gives the **functional group** the lowest number; then multiple bonds; then substituents (first point of difference).',
    'Tie? The substituent **first alphabetically** gets the lower number.',
    'Combine identical groups with **di-, tri-, tetra-**; every group gets a number.',
    'List substituents **alphabetically** (ignore di-, tri-, sec-, tert-).',
    'Commas between numbers, hyphens between numbers and words.',
  ].map((s) => h('li', {}, mdi(s))))));
  body.appendChild(h('a', { class: 'btn secondary', href: '#/lab' }, icon('lab'), 'Check a name in the Name Lab'));
}

function properties(body) {
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'Boiling-point ladder (molecules of similar size)'),
    h('div', { class: 'ladder' }, h('div', { class: 'ladder-row' },
      ...['alkane', 'ether / alkyl halide', 'aldehyde / ketone', 'alcohol', 'carboxylic acid'].flatMap((x, i, arr) => [h('span', { class: 'fam' }, x), i < arr.length - 1 ? h('span', { class: 'faint' }, '<') : null]))),
    h('p', { class: 'small muted', style: { marginTop: '10px' } }, 'Nonpolar (London only) < polar, no H-bonding < H-bonding < extra H-bonding. Within one family, bigger molecules (and bigger halogens) boil higher.')));
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'Water solubility rules from class'), table(['Family', 'Soluble in water?'], [
    ['Hydrocarbons (alkanes, alkenes, alkynes)', 'No — nonpolar'],
    ['Alkyl halides', 'No — all are insoluble'],
    ['Alcohols', 'Small ones yes; ~6+ C no'],
    ['Ethers', '≤ 5 C yes; 6+ C no'],
    ['Aldehydes & ketones', '≤ 6 C yes; 7+ C no'],
    ['Carboxylic acids', 'Small ones yes; long chains (e.g. octanoic acid) no'],
    ['Carboxylate salts', 'Yes — ionic'],
  ])));
  body.appendChild(h('div', { class: 'card' }, h('h3', {}, 'Hydrogen bonding'), mdi('Needs an **H on O, N or F**. Alcohols, carboxylic acids and amines H-bond with each other. Ethers, aldehydes and ketones can\'t H-bond with each other, but water can H-bond **to** their O. Thiols (S–H) don\'t H-bond.')));
}

function shapes(body) {
  body.appendChild(table(['Groups (atoms + lone pairs)', 'Lone pairs', 'Shape', 'Angle', 'Example'], [
    ['2', '0', 'linear', '180°', 'C≡C carbon, CO₂'],
    ['3', '0', 'trigonal planar', '120°', 'C=C or C=O carbon'],
    ['4', '0', 'tetrahedral', '109.5°', 'CH₄, any C with 4 single bonds'],
    ['4', '1', 'trigonal pyramidal', '~109.5° (class)', 'NH₃'],
    ['4', '2', 'bent', '~109.5° (class)', 'H₂O, alcohols, ethers'],
  ]));
  body.appendChild(h('div', { class: 'callout memory' }, h('div', { class: 'co-title' }, icon('heart'), 'HONC 1-2-3-4'), mdi('H 1 bond · O 2 bonds (2 lone pairs) · N 3 bonds (1 lone pair) · C 4 bonds · halogens 1 bond (3 lone pairs)')));
}

function acidbase(body) {
  body.appendChild(table(['Idea', 'Formula / rule'], [
    ['Brønsted–Lowry acid / base', 'acid donates H⁺ · base accepts H⁺'],
    ['Conjugate base / acid', 'acid − H⁺ (charge −1) · base + H⁺ (charge +1)'],
    ['Ka', 'Ka = [H₃O⁺][A⁻] / [HA] — larger Ka = stronger acid'],
    ['pH', 'pH = −log[H₃O⁺]'],
    ['[H₃O⁺] from pH', '[H₃O⁺] = 10^−pH^'],
    ['Acidic / neutral / basic', 'pH < 7 / = 7 / > 7'],
    ['Sig figs', 'digits in [H₃O⁺] = decimal places in pH'],
    ['Buffer', 'weak acid + its conjugate base; [H₃O⁺] = Ka × [HA]/[A⁻]'],
    ['Blood', 'pH 7.35–7.45; H₂CO₃/HCO₃⁻ buffer'],
  ]));
  body.appendChild(h('a', { class: 'btn secondary', href: '#/tools/ph' }, icon('flask'), 'Open the pH calculator'));
}

function glossaryTab(body) {
  const all = glossary();
  const input = h('input', { class: 'input', type: 'search', placeholder: 'Search terms…', 'aria-label': 'Search glossary' });
  const list = h('dl', { class: 'glossary card', style: { margin: 0 } });
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    clear(list);
    const hits = all.filter((k) => !q || k.term.toLowerCase().includes(q) || k.def.toLowerCase().includes(q));
    for (const k of hits) {
      list.appendChild(h('dt', {}, k.term, ' ', h('a', { class: 'chip', href: `#/learn/${k.lecture}` }, `L${k.number}`)));
      list.appendChild(h('dd', {}, mdi(k.def)));
    }
    if (!hits.length) list.appendChild(h('p', { class: 'muted' }, 'No matches.'));
  };
  input.addEventListener('input', draw);
  body.appendChild(h('div', { class: 'search' }, icon('search'), input));
  body.appendChild(list);
  draw();
}
