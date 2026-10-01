import { h, icon, mdi } from '../ui/dom.js';
import { pageHead, rxnView, sectionTitle } from '../ui/components.js';
import { FAMILIES, REACTIONS } from '../../content/reactions.js';
import { lectureById } from '../../content/course.js';

const ARROW = '<svg viewBox="0 0 56 12" aria-hidden="true"><path d="M2 6h48" stroke="currentColor" stroke-width="2" fill="none"/><path d="M46 2l6 4-6 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export default function reactions({ app, main }) {
  main.appendChild(pageHead({ title: 'Reaction map', sub: 'Every reaction in the course on one page. Tap "Practice" on any reaction for unlimited predict-the-product questions.' }));

  // Big-picture overview: the oxidation ladder and alkene reactions
  const fam = (id) => FAMILIES.find((f) => f.id === id);
  const node = (id) => h('a', { class: 'fam', href: `#rx-${id}`, onclick: (e) => { e.preventDefault(); const t = document.getElementById(`rx-${id}`); if (t) t.scrollIntoView({ behavior: 'smooth' }); } }, fam(id).label);
  const arrow = (label) => h('span', { class: 'arrow-lbl' }, mdi(label), h('span', { html: ARROW }));
  main.appendChild(h('div', { class: 'card' },
    h('h3', {}, 'The big picture'),
    h('p', { class: 'muted small' }, mdi('Arrows marked **[O]** are oxidations (more C–O bonds or fewer C–H bonds). **H₂, Pd** on a C=O is a reduction — the reverse.')),
    h('div', { class: 'ladder' },
      h('div', { class: 'ladder-row' }, node('alkene'), arrow('H₂O, H₂SO₄'), node('alcohol2'), arrow('[O]'), node('ketone')),
      h('div', { class: 'ladder-row' }, node('alcohol1'), arrow('[O]'), node('aldehyde'), arrow('[O]'), node('acid'), arrow('NaOH'), node('salt')),
      h('div', { class: 'ladder-row' }, node('alcohol2'), arrow('H₂SO₄ (−H₂O)'), node('alkene'), arrow('H₂, Pd'), node('alkane')),
      h('div', { class: 'ladder-row' }, node('alkene'), arrow('X₂'), node('dihalide'), h('span', { class: 'faint' }, '·'), node('alkene'), arrow('HX'), node('halide')),
      h('div', { class: 'ladder-row' }, node('aldehyde'), arrow('H₂, Pd'), node('alcohol1'), h('span', { class: 'faint' }, '·'), node('ketone'), arrow('H₂, Pd'), node('alcohol2')),
      h('div', { class: 'ladder-row' }, node('thiol'), arrow('[O] ⇄ [H]'), node('disulfide'), h('span', { class: 'faint' }, '·'), node('alcohol3'), arrow('[O]'), h('span', { class: 'fam', style: { borderStyle: 'dashed' } }, 'no reaction')))));

  const byFrom = new Map();
  for (const r of REACTIONS) {
    if (!byFrom.has(r.from)) byFrom.set(r.from, []);
    byFrom.get(r.from).push(r);
  }
  for (const [from, list] of byFrom) {
    const f = fam(from);
    main.appendChild(h('div', { id: `rx-${from}`, style: { scrollMarginTop: '70px' } }, sectionTitle(`Starting from: ${f.label}`)));
    const grid = h('div', { class: 'grid two rxn-grid' });
    for (const r of list) {
      const lec = lectureById(r.lecture);
      grid.appendChild(h('div', { class: 'card rxn-card' },
        h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, r.name), h('span', { class: 'chip accent' }, `L${lec.number}`)),
        h('div', { style: { margin: '10px 0' } }, rxnView({ from: r.example[0], reagent: r.reagent, to: r.example[1] ? r.example[1] : [] }, { scale: 24 })),
        h('p', { class: 'small', style: { margin: '0 0 10px' } }, mdi(r.rule)),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn small', href: `#/practice/skill/${skillFor(r)}` }, icon('target'), 'Practice'),
          h('a', { class: 'btn small ghost', href: `#/learn/${r.lecture}` }, icon('book'), 'Notes'))));
    }
    main.appendChild(grid);
  }
}

function skillFor(r) {
  const map = { l04: r.id === 'hydrohalogenation' || r.id === 'hydration' ? 'l04.markovnikov' : 'l04.addition', l05: r.id === 'dehydration' ? 'l05.dehydration' : 'l05.oxidation', l06: 'l06.thiols', l08: 'l08.reactions', l10: 'l10.salts' };
  return map[r.lecture];
}
