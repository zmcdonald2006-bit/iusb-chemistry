import { h, icon, mdi, clear } from '../ui/dom.js';
import { pageHead, rxnView, sectionTitle } from '../ui/components.js';
import { confusedButton } from '../ui/confused.js';
import { FAMILIES, REACTIONS, TYPES, REAGENTS } from '../../content/reactions.js';
import { lectureById } from '../../content/course.js';

// ---- The map: a tappable flowchart that fits a phone screen (all arrows are straight up/down/across) ----
const W = 380;
const NODES = [
  { id: 'alkane', x: 190, y: 26 },
  { id: 'dihalide', x: 50, y: 112 },
  { id: 'alkene', x: 190, y: 112 },
  { id: 'halide', x: 318, y: 112 },
  { id: 'alcohol', x: 190, y: 214, label: 'Alcohol', fams: ['alcohol1', 'alcohol2', 'alcohol3'] },
  { id: 'alcohol1', x: 80, y: 294 },
  { id: 'alcohol2', x: 190, y: 294 },
  { id: 'alcohol3', x: 310, y: 294 },
  { id: 'aldehyde', x: 80, y: 386 },
  { id: 'ketone', x: 190, y: 386 },
  { id: 'nr', x: 310, y: 386, label: 'No reaction', dashed: true, fams: [] },
  { id: 'acid', x: 80, y: 478 },
  { id: 'salt', x: 80, y: 570 },
  { id: 'thiol', x: 292, y: 478 },
  { id: 'disulfide', x: 292, y: 570 },
];
const NH = 32; // node height
const label = (n) => n.label || FAMILIES.find((f) => f.id === n.id).label;
const nodeW = (n) => Math.round(label(n).length * 7.9 + 22);
const node = (id) => NODES.find((n) => n.id === id);

// [reaction id, from node, to node, x offset of the arrow, label side]
export const EDGES = [
  ['hydrogenation', 'alkene', 'alkane', 0, 'right'],
  ['halogenation', 'alkene', 'dihalide', 0, 'above'],
  ['hydrohalogenation', 'alkene', 'halide', 0, 'above'],
  ['hydration', 'alkene', 'alcohol', -14, 'left'],
  ['dehydration', 'alcohol', 'alkene', 14, 'right'],
  ['ox1', 'alcohol1', 'aldehyde', -9, 'left'],
  ['red-ald', 'aldehyde', 'alcohol1', 9, 'right'],
  ['ox2', 'alcohol2', 'ketone', -9, 'left'],
  ['red-ket', 'ketone', 'alcohol2', 9, 'right'],
  ['ox3', 'alcohol3', 'nr', 0, 'right'],
  ['oxald', 'aldehyde', 'acid', 0, 'right'],
  ['neutralize', 'acid', 'salt', 0, 'right'],
  ['thiol-ox', 'thiol', 'disulfide', -9, 'left'],
  ['disulfide-red', 'disulfide', 'thiol', 9, 'right'],
];
const SHORT = { hydration: ['H₂O, H₂SO₄'], dehydration: ['H₂SO₄', '(−H₂O)'], 'red-ald': ['H₂, Pd'], 'red-ket': ['H₂, Pd'], hydrogenation: ['H₂, Pd'], halogenation: ['X₂'], hydrohalogenation: ['HX'], neutralize: ['NaOH'], 'disulfide-red': ['[H]'] };

function mapSvg() {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, text = null) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text != null) e.textContent = text;
    return e;
  };
  const svg = el('svg', { viewBox: `0 0 ${W} 600`, class: 'rmap', role: 'group', 'aria-label': 'Reaction map: tap a family or an arrow' });

  // alcohol hub → 1°, 2°, 3°
  const hub = node('alcohol');
  for (const id of ['alcohol1', 'alcohol2', 'alcohol3']) {
    const n = node(id);
    svg.appendChild(el('path', { d: `M${hub.x} ${hub.y + NH / 2} L${n.x} ${n.y - NH / 2}`, class: 'rm-link' }));
  }

  for (const [rid, fromId, toId, dx, side] of EDGES) {
    const r = REACTIONS.find((x) => x.id === rid);
    const a = node(fromId), b = node(toId);
    const g = el('g', { class: `rm-edge t-${r.type}`, 'data-rx': rid, tabindex: '0', role: 'button', 'aria-label': `${r.name}: ${label(a)} to ${label(b)} with ${r.reagent}` });
    let x1, y1, x2, y2;
    if (a.y === b.y) { // across
      const dir = b.x > a.x ? 1 : -1;
      x1 = a.x + dir * nodeW(a) / 2; x2 = b.x - dir * nodeW(b) / 2; y1 = y2 = a.y;
    } else { // up or down
      const dir = b.y > a.y ? 1 : -1;
      x1 = x2 = a.x + dx; y1 = a.y + dir * NH / 2; y2 = b.y - dir * NH / 2;
    }
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const hx = x2 - ux * 2, hy = y2 - uy * 2; // arrow tip, just off the node
    g.appendChild(el('path', { d: `M${x1 + ux * 2} ${y1 + uy * 2} L${hx - ux * 7} ${hy - uy * 7}`, class: 'rm-line' }));
    g.appendChild(el('path', { d: `M${hx} ${hy} L${hx - ux * 8 - uy * 5} ${hy - uy * 8 + ux * 5} L${hx - ux * 8 + uy * 5} ${hy - uy * 8 - ux * 5} Z`, class: 'rm-head' }));
    // a wider invisible hit area for fingers
    g.appendChild(el('path', { d: `M${x1} ${y1} L${x2} ${y2}`, class: 'rm-hit' }));
    const lines = SHORT[rid] || [r.reagent.replace(/\s*\(.*\)$/, '')];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    lines.forEach((t, i) => {
      const attrs = side === 'above'
        ? { x: mx, y: my - 7, 'text-anchor': 'middle' }
        : { x: mx + (side === 'left' ? -6 : 6), y: my + 4.5 + (i - (lines.length - 1) / 2) * 14, 'text-anchor': side === 'left' ? 'end' : 'start' };
      g.appendChild(el('text', { ...attrs, class: 'rm-label' }, t));
    });
    svg.appendChild(g);
  }

  for (const n of NODES) {
    const w = nodeW(n);
    const fams = n.fams || [n.id];
    const g = el('g', { class: `rm-node${n.dashed ? ' dashed' : ''}`, 'data-node': n.id });
    if (fams.length) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `Show reactions for ${label(n)}`); }
    g.appendChild(el('rect', { x: n.x - w / 2, y: n.y - NH / 2, width: w, height: NH, rx: 10 }));
    g.appendChild(el('text', { x: n.x, y: n.y + 5, 'text-anchor': 'middle' }, label(n)));
    svg.appendChild(g);
  }
  // ketone + [O]: no reaction (noted under the ketone)
  const k = node('ketone');
  const kt = el('text', { x: k.x, y: k.y + NH / 2 + 16, 'text-anchor': 'middle', class: 'rm-note', 'data-rx': 'ket-ox', tabindex: '0', role: 'button' }, '[O]: no reaction');
  svg.appendChild(kt);
  return svg;
}

// ---- Page --------------------------------------------------------------------------------------------
let quizMode = false; // remembered while the app is open

export default function reactions({ app, main }) {
  main.appendChild(pageHead({ title: 'Reaction map', sub: 'Every reaction in the course: how the families connect, how to spot each reaction, and how to draw the product.' }));

  let family = null; // node id picked on the map
  let type = null;

  // The big picture
  const svg = mapSvg();
  const legend = h('div', { class: 'rm-legend' }, Object.entries(TYPES).map(([id, t]) => h('button', { type: 'button', class: `chip chip-select rm-type t-${id}`, 'aria-pressed': 'false', dataset: { type: id } }, h('i', { class: 'dot' }), t.label)));
  const typeNote = h('div', { class: 'small muted rm-type-note' });
  const top = h('div', { class: 'rm-top' });
  main.appendChild(top);
  top.appendChild(h('div', { class: 'card' },
    h('h3', {}, 'The big picture'),
    h('p', { class: 'small muted', style: { margin: '0 0 8px' } }, mdi('Going **down** the alcohol columns is **oxidation** ([O]); going back **up** is **reduction**. Tap a family or an arrow.')),
    h('div', { class: 'rmap-wrap' }, svg),
    legend, typeNote));

  // Reagent decoder
  top.appendChild(h('div', { class: 'card' },
    h('h3', {}, 'Reagent decoder'),
    h('p', { class: 'small muted', style: { margin: '0 0 10px' } }, 'On a test, the reagent over the arrow tells you which reaction it is. Then look at the starting material.'),
    h('div', { class: 'rm-decoder' }, REAGENTS.map((g) => {
      const r0 = REACTIONS.find((x) => x.id === g.ids[0]);
      return h('button', { type: 'button', class: 'rm-dec-row', onclick: () => show(g.ids[0]), 'aria-label': `${g.reagent} on ${g.on}: ${g.does}, gives ${g.gives}` },
        h('b', { class: 'rm-dec-reagent' }, g.reagent),
        h('span', { class: 'rm-dec-what' },
          h('span', {}, h('b', {}, g.on), ' → ', g.gives),
          h('span', { class: `rm-dec-does t-${r0.type}` }, h('i', { class: 'dot' }), g.does)),
        icon('chevRight'));
    })),
    h('div', { class: 'callout tip', style: { marginTop: '12px' } },
      h('div', { class: 'co-title' }, icon('bulb'), 'Same acid, opposite reactions'),
      mdi('**H₂O + H₂SO₄** on an **alkene** adds water (hydration). **H₂SO₄ alone** on an **alcohol** removes water (dehydration).'))));

  // Controls + list
  const listHost = h('div');
  const quizToggle = h('button', { type: 'button', class: 'chip chip-select', 'aria-pressed': String(quizMode) }, icon('eye'), 'Quiz me: hide products');
  const filterNote = h('div', { class: 'rm-filter' });
  const controls = h('div', { class: 'rm-controls' },
    h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
      quizToggle,
      h('a', { class: 'chip chip-select', href: '#/practice/reactions' }, icon('target'), 'Drill all reactions')),
    filterNote);
  main.appendChild(h('div', { id: 'rx-list', style: { scrollMarginTop: '70px' } }, sectionTitle('Reactions')));
  main.appendChild(controls);
  main.appendChild(listHost);

  quizToggle.addEventListener('click', () => { quizMode = !quizMode; quizToggle.setAttribute('aria-pressed', String(quizMode)); drawList(); });

  legend.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    type = type === b.dataset.type ? null : b.dataset.type;
    drawList();
    scrollToList();
  });

  const pick = (e) => {
    const rx = e.target.closest('[data-rx]');
    if (rx) { show(rx.getAttribute('data-rx')); return; }
    const nd = e.target.closest('[data-node]');
    if (nd) {
      const n = node(nd.getAttribute('data-node'));
      if (!(n.fams || [n.id]).length) return;
      family = family === n.id ? null : n.id;
      type = null;
      drawList();
      scrollToList();
    }
  };
  svg.addEventListener('click', pick);
  svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });

  function scrollToList() {
    const t = document.getElementById('rx-list');
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  }

  // Jump to one reaction (clearing filters that would hide it) and flash it.
  function show(id) {
    const r = REACTIONS.find((x) => x.id === id);
    if (!r) return;
    if ((type && r.type !== type) || (family && !matches(r, family))) { type = null; family = null; drawList(); }
    const card = document.getElementById(`rx-${id}`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
  }

  function drawList() {
    for (const b of legend.querySelectorAll('[data-type]')) b.setAttribute('aria-pressed', String(b.dataset.type === type));
    typeNote.innerHTML = '';
    if (type) typeNote.appendChild(mdi(`**${TYPES[type].label}:** ${TYPES[type].text}`));
    for (const g of svg.querySelectorAll('[data-node]')) g.classList.toggle('on', g.getAttribute('data-node') === family);
    for (const g of svg.querySelectorAll('.rm-edge')) {
      const r = REACTIONS.find((x) => x.id === g.getAttribute('data-rx'));
      g.classList.toggle('dim', !!(type && r.type !== type) || !!(family && !matches(r, family)));
    }

    clear(filterNote);
    const clearBtn = (text) => h('button', { type: 'button', class: 'chip chip-select', 'aria-pressed': 'true', onclick: () => { family = null; type = null; drawList(); } }, text, icon('x'));
    if (family) filterNote.appendChild(clearBtn(`${label(node(family))} only`));
    if (type) filterNote.appendChild(clearBtn(`${TYPES[type].label} only`));

    clear(listHost);
    let groups;
    if (family) {
      const fams = node(family).fams || [family];
      groups = [
        [`Reactions of ${label(node(family)).toLowerCase()}s`, REACTIONS.filter((r) => fams.includes(r.from))],
        [`Ways to make ${label(node(family)).toLowerCase()}s`, REACTIONS.filter((r) => fams.includes(r.to))],
      ];
    } else {
      const byLec = new Map();
      for (const r of REACTIONS.filter((x) => !type || x.type === type)) {
        if (!byLec.has(r.lecture)) byLec.set(r.lecture, []);
        byLec.get(r.lecture).push(r);
      }
      groups = [...byLec].sort((a, b) => lectureById(a[0]).number - lectureById(b[0]).number)
        .map(([lid, list]) => [`Lecture ${lectureById(lid).number}: ${lectureById(lid).title}`, list]);
    }
    for (const [title, list] of groups) {
      if (!list.length) continue;
      listHost.appendChild(h('h3', { class: 'rm-group' }, title));
      const grid = h('div', { class: 'grid two rxn-grid' });
      for (const r of list) grid.appendChild(reactionCard(r));
      listHost.appendChild(grid);
    }
  }

  drawList();
}

function matches(r, fam) {
  const fams = node(fam).fams || [fam];
  return fams.includes(r.from) || fams.includes(r.to);
}

function reactionCard(r) {
  const lec = lectureById(r.lecture);
  const t = TYPES[r.type];
  const drawing = h('div', { class: 'rm-drawing' });
  // The explanation names the product, so in quiz mode it stays hidden until she checks her answer.
  const details = h('div', {},
    h('p', { class: 'small', style: { margin: '0 0 8px' } }, mdi(r.rule)),
    h('div', { class: 'steps-title' }, 'How to draw the product'),
    h('ol', { class: 'steps compact' }, r.steps.map((s) => h('li', {}, mdi(s)))),
    r.trap ? h('div', { class: 'rm-line-note warn' }, icon('warn'), h('span', {}, mdi(`**Watch out:** ${r.trap}`))) : null,
    r.body ? h('div', { class: 'rm-line-note nurse' }, icon('nurse'), h('span', {}, mdi(`**In the body:** ${r.body}`))) : null);
  const draw = (hidden) => {
    clear(drawing).appendChild(rxnView({ from: r.example[0], reagent: r.reagent, to: r.example[1] ? r.example[1] : [], question: hidden }, { scale: 24 }));
    details.classList.toggle('hidden', hidden);
    if (hidden) {
      drawing.appendChild(h('div', { class: 'small muted center' }, 'What\'s the product? Decide, then check.'));
      drawing.appendChild(h('button', { type: 'button', class: 'btn small secondary rm-reveal', onclick: () => draw(false) }, icon('eye'), 'Show answer'));
    }
  };
  draw(quizMode);
  const confused = confusedButton({ where: `Reaction map › ${r.name}`, item: r.id });
  return h('div', { class: 'card rxn-card', id: `rx-${r.id}` },
    h('div', { class: 'row between', style: { gap: '8px', alignItems: 'flex-start' } },
      h('h3', { style: { margin: 0 } }, r.name),
      h('div', { class: 'row', style: { gap: '6px', flexShrink: 0 } }, h('span', { class: `chip rm-type t-${r.type}` }, h('i', { class: 'dot' }), t.label), h('span', { class: 'chip accent' }, `L${lec.number}`))),
    drawing,
    details,
    h('div', { class: 'btn-row', style: { marginTop: '12px', alignItems: 'center' } },
      h('a', { class: 'btn small', href: `#/practice/skill/${r.skill}?from=${encodeURIComponent('#/reactions')}` }, icon('target'), 'Practice'),
      h('a', { class: 'btn small ghost', href: `#/learn/${r.lecture}/${r.section}` }, icon('book'), 'Notes'),
      confused ? h('span', { style: { marginLeft: 'auto' } }, confused) : null));
}
