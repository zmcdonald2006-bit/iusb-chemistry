// Search everything: notes, key terms, flashcards, reactions and nursing notes.
import { h, icon, clear } from '../ui/dom.js';
import { pageHead, sectionTitle } from '../ui/components.js';
import { buildIndex, search, highlight } from '../lib/search.js';
import { LECTURES, allCards } from '../../content/course.js';
import { REACTIONS } from '../../content/reactions.js';
import { NURSING } from '../../content/nursing.js';

let INDEX = null;
const index = () => INDEX || (INDEX = buildIndex({ lectures: LECTURES, cards: allCards(), reactions: REACTIONS, nursing: NURSING }));

const GROUPS = [
  { type: 'term', title: 'Key terms', icon: 'book' },
  { type: 'notes', title: 'In the notes', icon: 'list' },
  { type: 'reaction', title: 'Reactions', icon: 'map' },
  { type: 'card', title: 'Flashcards', icon: 'cards' },
  { type: 'nursing', title: 'Nursing connections', icon: 'nurse' },
];
const SHOW = 5;
const IDEAS = ['micelle', 'saponification', 'Fischer projection', 'LDL', 'anomer', 'buffer', 'Markovnikov', 'chirality center', 'hydrogen bonding', 'lipase'];

export default function searchView({ app, main, query }) {
  main.appendChild(pageHead({ title: 'Search', sub: 'Search the notes, key terms, flashcards, reactions and nursing notes.' }));
  const input = h('input', { class: 'input', type: 'search', placeholder: 'e.g. micelle, LDL, Fischer', 'aria-label': 'Search everything', enterkeyhint: 'search', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: query.q || '' });
  main.appendChild(h('div', { class: 'search big-search' }, icon('search'), input));
  const results = h('div', { class: 'search-results', 'aria-live': 'polite' });
  main.appendChild(results);
  const expanded = new Set();

  const run = () => {
    const q = input.value.trim();
    // keep the search in the address so Back returns to it (without re-rendering the page)
    try { history.replaceState(history.state, '', q ? `#/search?q=${encodeURIComponent(q)}` : '#/search'); } catch { /* ignore */ }
    clear(results);
    if (!q) {
      results.appendChild(h('p', { class: 'muted small' }, 'Try:'));
      results.appendChild(h('div', { class: 'row wrap', style: { gap: '6px' } }, IDEAS.map((w) => h('button', { type: 'button', class: 'chip chip-select', onclick: () => { input.value = w; run(); } }, w))));
      return;
    }
    const found = search(index(), q);
    if (!found.length) {
      results.appendChild(h('div', { class: 'card muted' }, `Nothing matches "${q}". Try fewer words, or another spelling.`));
      return;
    }
    results.appendChild(h('div', { class: 'muted small search-count' }, `${found.length} result${found.length === 1 ? '' : 's'}`));
    for (const g of GROUPS) {
      const list = found.filter((f) => f.item.type === g.type);
      if (!list.length) continue;
      results.appendChild(sectionTitle(`${g.title} (${list.length})`));
      const box = h('div', { class: 'card list search-list' });
      const shown = expanded.has(g.type) ? list : list.slice(0, SHOW);
      for (const { item } of shown) box.appendChild(resultRow(item, q, g));
      if (list.length > shown.length) {
        box.appendChild(h('button', { type: 'button', class: 'list-item search-more', onclick: () => { expanded.add(g.type); run(); } }, h('div', { class: 'grow' }, `Show all ${list.length}`), icon('chevRight')));
      }
      results.appendChild(box);
    }
  };

  let timer = null;
  input.addEventListener('input', () => { clearTimeout(timer); expanded.clear(); timer = setTimeout(run, 120); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); run(); input.blur(); } });
  run();
  setTimeout(() => { if (!query.q) input.focus(); }, 50);
  return () => clearTimeout(timer);
}

function marked(parts) {
  return parts.map((p) => (p.mark ? h('mark', {}, p.text) : p.text));
}

function resultRow(it, q, g) {
  const where = [it.lecture ? `Lecture ${it.lecture.number}` : null, it.type === 'notes' ? it.lecture.title : it.section ? it.section.title : null].filter(Boolean).join(' · ');
  // Notes links scroll to the matching spot in the section and flash it.
  const href = it.type === 'notes' || (it.type === 'nursing' && it.section) || (it.type === 'term' && it.section) ? `${it.href}?hl=${encodeURIComponent(q)}` : it.href;
  const full = it.type === 'term' || it.type === 'card'; // short: show all of it
  return h('a', { class: 'list-item search-hit', href },
    h('div', { class: 'li-icon' }, icon(g.icon)),
    h('div', { class: 'grow' },
      h('div', { class: 'li-title' }, marked(highlight(it.title, q, { max: 0 }))),
      it.body ? h('div', { class: 'search-snippet' }, marked(highlight(it.body, q, full ? { max: 260 } : {}))) : null,
      where ? h('div', { class: 'li-sub' }, where) : null),
    h('span', { class: 'chev' }, icon('chevRight')));
}
