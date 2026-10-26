// Search across everything she studies from: the notes (section by section), key terms, flashcards,
// the reaction map and the nursing notes. Built once, on the first search.
// Matching ignores case, markup, accents and sub/superscripts ("CH₃" = "ch3"), and Greek letters
// match their names ("α" = "alpha"). Every word of the query must appear somewhere in a result.
import { plain } from './markup.js';

const CHAR = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '−': '-', '–': '-', '—': '-', '’': "'", '‘': "'",
  α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ω: 'omega', λ: 'lambda',
};

// Normalized text plus, for each of its characters, the index of the character it came from,
// so matches can be highlighted in the original text.
export function normMap(text) {
  let out = '';
  const map = [];
  for (let i = 0; i < text.length; i++) {
    let n = text[i].toLowerCase();
    n = CHAR[n] || n.normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const ch of n) { out += ch; map.push(i); }
  }
  map.push(text.length);
  return { out, map };
}
export const norm = (s) => normMap(plain(s)).out;

export function queryWords(q) {
  const words = [...new Set(norm(q).split(/[\s,;:!?()"]+/).filter(Boolean))];
  const long = words.filter((w) => w.length > 1);
  return long.length ? long : words;
}

// ---- Building the index ------------------------------------------------------------------------

function blockText(b) {
  const out = [];
  const add = (...xs) => { for (const x of xs) if (typeof x === 'string' && x) out.push(x); };
  add(b.title, b.text, b.caption, b.name, b.q && b.q.prompt);
  // drawings count too: a sugar drawn by name, a structure's name or caption
  if (Array.isArray(b.items)) for (const it of b.items) { if (typeof it === 'string') add(it); else if (it) add(it.title, it.text, it.caption, it.name, typeof it.sugar === 'string' ? it.sugar : null); }
  if (Array.isArray(b.head)) add(...b.head);
  if (Array.isArray(b.rows)) for (const r of b.rows) if (Array.isArray(r)) add(...r);
  if (b.t === 'example') { add(b.prompt, b.answer); for (const s of b.steps || []) add(typeof s === 'string' ? s : s && s.text); }
  return out.map(plain).join(' · ');
}

const item = (type, fields) => {
  const body = fields.body || '';
  return { type, ...fields, body, nTitle: norm(fields.title), nBody: norm(body) };
};

export function buildIndex({ lectures, cards = [], reactions = [], nursing = [] }) {
  const items = [];
  for (const l of lectures) {
    const sections = l.sections.map((s) => {
      const body = s.blocks.map(blockText).filter(Boolean).join(' · ');
      const it = item('notes', { title: s.title, body, lecture: l, section: s, href: `#/learn/${l.id}/${s.id}` });
      items.push(it);
      return it;
    });
    for (const k of l.keyTerms || []) {
      // link a term to the first section of its lecture that mentions it
      const t = norm(k.term);
      const home = sections.find((s) => s.nTitle.includes(t) || s.nBody.includes(t));
      items.push(item('term', { title: k.term, body: plain(k.def), lecture: l, section: home && home.section, href: home ? home.href : `#/learn/${l.id}` }));
    }
  }
  const byId = new Map(lectures.map((l) => [l.id, l]));
  for (const c of cards) {
    const l = byId.get(c.lecture);
    if (l) items.push(item('card', { title: plain(c.front), body: plain(c.back), lecture: l, href: `#/cards/review?deck=${l.id}` }));
  }
  for (const r of reactions) {
    const body = [`${r.from} → ${r.to}`, r.reagent, r.rule, ...(r.steps || []), r.trap, r.body].filter(Boolean).map(plain).join(' · ');
    items.push(item('reaction', { title: r.name, body, lecture: byId.get(r.lecture), href: `#/reactions?rx=${r.id}` }));
  }
  for (const n of nursing) {
    const l = byId.get(n.lecture);
    const s = l && l.sections.find((x) => x.id === n.section);
    items.push(item('nursing', { title: plain(n.title), body: plain(n.text), lecture: l, section: s, href: s ? `#/learn/${l.id}/${s.id}` : '#/reference/nursing' }));
  }
  return items;
}

// ---- Searching ---------------------------------------------------------------------------------

const TYPE_BONUS = { term: 4, reaction: 2, notes: 1, card: 0, nursing: -1 };

export function search(index, q, { limit = 400 } = {}) {
  const words = queryWords(q);
  if (!words.length) return [];
  const phrase = norm(q).trim();
  const out = [];
  for (const it of index) {
    let score = TYPE_BONUS[it.type] || 0;
    let ok = true;
    for (const w of words) {
      if (it.nTitle.includes(w)) score += 6;
      else if (it.nBody.includes(w)) score += 2;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (words.length > 1 || phrase.length > 2) {
      if (it.nTitle === phrase) score += 12;
      else if (it.nTitle.includes(phrase)) score += 8;
      else if (it.nBody.includes(phrase)) score += 4;
    }
    if (it.nTitle.startsWith(words[0])) score += 3;
    out.push({ item: it, score });
  }
  out.sort((a, b) => b.score - a.score || ((a.item.lecture && a.item.lecture.number) || 99) - ((b.item.lecture && b.item.lecture.number) || 99));
  return out.slice(0, limit);
}

// Pieces of `text` around the first match, as [{ text, mark }] (mark = part of a match).
export function highlight(text, q, { around = 70, max = 190 } = {}) {
  const src = plain(text);
  const { out, map } = normMap(src);
  const words = queryWords(q);
  let first = -1;
  for (const w of words) { const i = out.indexOf(w); if (i >= 0 && (first < 0 || i < first)) first = i; }
  let start = 0;
  let end = src.length;
  if (max && src.length > max) {
    start = first < 0 ? 0 : Math.max(0, map[first] - around);
    if (start > 0) { const sp = src.indexOf(' ', start); if (sp >= 0 && sp < start + 15) start = sp + 1; }
    end = Math.min(src.length, start + max);
    if (end < src.length) { const sp = src.lastIndexOf(' ', end); if (sp > start + max / 2) end = sp; }
  }
  // character ranges to mark, in the original text
  const marks = new Array(end - start).fill(false);
  for (const w of words) {
    let i = out.indexOf(w);
    while (i >= 0) {
      const a = map[i], b = map[i + w.length - 1] + 1;
      for (let k = Math.max(a, start); k < Math.min(b, end); k++) marks[k - start] = true;
      i = out.indexOf(w, i + w.length);
    }
  }
  const parts = [];
  for (let k = start; k < end; k++) {
    const m = marks[k - start];
    const last = parts[parts.length - 1];
    if (last && last.mark === m) last.text += src[k]; else parts.push({ text: src[k], mark: m });
  }
  if (start > 0) parts.unshift({ text: '…', mark: false });
  if (end < src.length) parts.push({ text: '…', mark: false });
  return parts;
}
