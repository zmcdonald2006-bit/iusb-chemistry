// Content integrity: every lecture, question, card and structure is checked.
import { describe, it, expect } from './harness.js';
import { validateQuestion } from './helpers.js';
import { LECTURES, allAuthoredQuestions, allCards, glossary, CHANGELOG, COURSE, lectureById, skillById } from '../content/course.js';
import { EDGES } from '../js/views/reactions.js';
import { FAMILIES, REACTIONS, TYPES, REAGENTS } from '../content/reactions.js';
import { NURSING } from '../content/nursing.js';
import * as messages from '../content/messages.js';
import { parseSmiles } from '../js/chem/smiles.js';
import { sameMolecule } from '../js/chem/analyze.js';
import { nameCompound } from '../js/chem/namer.js';
import { renderMolecule, renderTetrahedral } from '../js/chem/render.js';
import { generatorsForSkill, getGenerator } from '../js/quiz/generators.js';
import * as rx from '../js/chem/reactions.js';
import { markup } from '../js/lib/markup.js';
import { normalizeQuestion } from '../js/quiz/bank.js';

const BLOCK_TYPES = new Set(['p', 'h', 'list', 'callout', 'mol', 'mols', 'table', 'steps', 'example', 'check', 'rxn', 'tetra', 'compare', 'link']);
const CALLOUT_KINDS = new Set(['key', 'tip', 'warn', 'exam', 'memory', 'life']);

function textsOf(obj, out = []) {
  if (typeof obj === 'string') out.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => textsOf(x, out));
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (['smiles', 'from', 'to', 'mol', 'id', 'skill', 'href', 'kind', 't', 'type', 'name', 'accept', 'groups', 'highlight'].includes(k)) continue;
      textsOf(v, out);
    }
  }
  return out;
}

function checkMarkup(text, where) {
  const bold = (text.match(/\*\*/g) || []).length;
  if (bold % 2) throw new Error(`${where}: unbalanced ** in "${text.slice(0, 60)}"`);
  const dollars = (text.match(/\$/g) || []).length;
  if (dollars % 2) throw new Error(`${where}: unbalanced $ in "${text.slice(0, 60)}"`);
  const html = markup(text);
  if (/<script|javascript:/i.test(html)) throw new Error(`${where}: unsafe markup`);
}

function checkSmiles(s, where, extra = {}) {
  try {
    parseSmiles(s);
    renderMolecule(s, extra);
  } catch (e) {
    throw new Error(`${where}: bad SMILES "${s}" (${e.message})`);
  }
}

function checkMolItem(item, where) {
  checkSmiles(item.smiles, where, { highlight: item.highlight });
  if (item.name) {
    const r = nameCompound(item.smiles);
    const got = r ? [r.name, ...r.alternates, ...r.common] : [];
    if (!got.includes(item.name)) throw new Error(`${where}: "${item.name}" but the namer says "${r ? r.name : 'unsupported'}" for ${item.smiles}`);
  }
  if (item.numbers === 'auto' && !(nameCompound(item.smiles) || {}).numbering) throw new Error(`${where}: numbers:auto needs a nameable molecule`);
}

describe('Course structure', () => {
  it('has lectures with unique, ordered ids', () => {
    LECTURES.forEach((l, i) => {
      expect(l.id).toBe(`l${String(i + 1).padStart(2, '0')}`);
      expect(l.number).toBe(i + 1);
      if (!l.title || !l.summary || !l.chapter) throw new Error(`${l.id} missing title/summary/chapter`);
    });
    expect(!!COURSE.contentVersion).toBe(true);
    expect(CHANGELOG.length).toBeGreaterThan(0);
  });
  it('has unique skill ids that belong to their lecture', () => {
    const seen = new Set();
    for (const l of LECTURES) {
      for (const s of l.skills) {
        if (seen.has(s.id)) throw new Error(`duplicate skill ${s.id}`);
        seen.add(s.id);
        if (!s.id.startsWith(`${l.id}.`)) throw new Error(`${s.id} should start with ${l.id}.`);
        if (!s.title || !s.desc) throw new Error(`${s.id} missing title/desc`);
      }
    }
  });
  it('gives every skill enough practice', () => {
    const qs = allAuthoredQuestions();
    for (const l of LECTURES) {
      for (const s of l.skills) {
        const authored = qs.filter((q) => q.skill === s.id).length;
        const gens = generatorsForSkill(s.id).length;
        if (authored < 2 && gens === 0) throw new Error(`${s.id}: only ${authored} questions and no generator`);
      }
    }
  });
  it('marks lectures 1–4 as already tested (Foundations Bootcamp)', () => {
    expect(LECTURES.filter((l) => l.tested).map((l) => l.id)).toEqual(['l01', 'l02', 'l03', 'l04']);
  });
});

describe('Lesson sections', () => {
  for (const l of LECTURES) {
    it(`${l.id}: sections and blocks are valid`, () => {
      const ids = new Set();
      for (const s of l.sections) {
        if (ids.has(s.id)) throw new Error(`${l.id}: duplicate section ${s.id}`);
        ids.add(s.id);
        if (!s.title || !s.blocks.length) throw new Error(`${l.id}/${s.id}: empty section`);
        s.blocks.forEach((b, bi) => {
          const where = `${l.id}/${s.id}#${bi}(${b.t})`;
          if (!BLOCK_TYPES.has(b.t)) throw new Error(`${where}: unknown block type`);
          if (b.t === 'callout' && !CALLOUT_KINDS.has(b.kind)) throw new Error(`${where}: bad callout kind ${b.kind}`);
          if (b.t === 'mol') checkMolItem(b, where);
          if (b.t === 'mols') b.items.forEach((it2, k) => checkMolItem(it2, `${where}[${k}]`));
          if (b.t === 'example' && b.mol) checkMolItem(b.mol, where);
          if (b.t === 'rxn') {
            checkSmiles(b.from, where);
            for (const t of [].concat(b.to || [])) checkSmiles(t, where);
          }
          if (b.t === 'tetra') b.items.forEach((x) => { if (x.groups.length !== 4) throw new Error(`${where}: tetra needs 4 groups`); renderTetrahedral(x.groups, x); });
          if (b.t === 'table') b.rows.forEach((r) => { if (r.length !== b.head.length) throw new Error(`${where}: row length ${r.length} ≠ ${b.head.length}`); });
          if (b.t === 'link' && !/^#\//.test(b.href)) throw new Error(`${where}: links must be in-app (#/…)`);
          if (b.t === 'check') validateQuestion(normalizeQuestion({ ...b.q, lecture: l.id }));
          for (const t of textsOf(b)) checkMarkup(t, where);
        });
      }
    });
  }
});

describe('Authored questions', () => {
  it('have unique ids', () => {
    const seen = new Set();
    for (const q of allAuthoredQuestions()) {
      if (seen.has(q.id)) throw new Error(`duplicate question id ${q.id}`);
      seen.add(q.id);
      if (!q.id.startsWith(q.lecture)) throw new Error(`${q.id} should start with ${q.lecture}`);
    }
  });
  for (const l of LECTURES) {
    it(`${l.id}: every question is valid and self-consistent`, () => {
      const skills = new Set(l.skills.map((s) => s.id));
      const qs = allAuthoredQuestions().filter((q) => q.lecture === l.id);
      if (qs.length < 12) throw new Error(`${l.id}: only ${qs.length} authored questions`);
      for (const q of qs) {
        if (!skills.has(q.skill)) throw new Error(`${q.id}: skill ${q.skill} not in ${l.id}`);
        validateQuestion(normalizeQuestion(q));
        for (const t of textsOf(q)) checkMarkup(t, q.id);
      }
    });
  }
  it('name questions agree with the namer', () => {
    for (const q of allAuthoredQuestions().filter((x) => x.type === 'name')) {
      const r = nameCompound(q.name.smiles);
      if (!r) throw new Error(`${q.id}: namer can't name ${q.name.smiles}`);
    }
  });
});

describe('Flashcards & glossary', () => {
  it('have unique ids and content', () => {
    const seen = new Set();
    for (const c of allCards()) {
      if (seen.has(c.id)) throw new Error(`duplicate card ${c.id}`);
      seen.add(c.id);
      if (!c.front || !c.back) throw new Error(`${c.id}: empty side`);
      if (c.mol) checkSmiles(c.mol, c.id);
      checkMarkup(c.front, c.id);
      checkMarkup(c.back, c.id);
    }
    for (const l of LECTURES) if (l.cards.length < 12) throw new Error(`${l.id}: only ${l.cards.length} cards`);
  });
  it('builds a glossary', () => {
    const g = glossary();
    expect(g.length).toBeGreaterThan(50);
    for (const k of g) if (!k.term || !k.def) throw new Error('empty glossary entry');
  });
});

describe('Reaction map', () => {
  it('uses valid structures, families and practice generators', () => {
    const fam = new Set(FAMILIES.map((f) => f.id));
    for (const f of FAMILIES) checkSmiles(f.smiles, f.id);
    for (const r of REACTIONS) {
      if (!fam.has(r.from) || (r.to && !fam.has(r.to))) throw new Error(`${r.id}: unknown family`);
      if (!getGenerator(r.practice)) throw new Error(`${r.id}: no generator ${r.practice}`);
      checkSmiles(r.example[0], r.id);
      if (r.example[1]) checkSmiles(r.example[1], r.id);
      if (!TYPES[r.type]) throw new Error(`${r.id}: unknown type ${r.type}`);
      if (!skillById(r.skill)) throw new Error(`${r.id}: unknown skill ${r.skill}`);
      const lec = lectureById(r.lecture);
      if (!lec || !lec.sections.some((x) => x.id === r.section)) throw new Error(`${r.id}: no section ${r.lecture}/${r.section}`);
      if (!r.rule || !r.steps || !r.steps.length || !r.trap) throw new Error(`${r.id}: needs a rule, steps and a trap`);
      for (const t of [r.rule, ...r.steps, r.trap, r.body || '']) markup(t);
    }
    const ids = new Set(REACTIONS.map((r) => r.id));
    if (ids.size !== REACTIONS.length) throw new Error('duplicate reaction id');
    for (const g of REAGENTS) for (const id of g.ids) if (!ids.has(id)) throw new Error(`reagent decoder: unknown reaction ${id}`);
  });
  it('every reaction is on the map', () => {
    const onMap = new Set([...EDGES.map((e) => e[0]), 'ket-ox']);
    for (const r of REACTIONS) if (!onMap.has(r.id)) throw new Error(`${r.id} has no arrow on the map`);
    for (const e of EDGES) if (!REACTIONS.some((r) => r.id === e[0])) throw new Error(`map arrow for unknown reaction ${e[0]}`);
  });
  it('examples match the reaction engine', () => {
    const byId = Object.fromEntries(REACTIONS.map((r) => [r.id, r]));
    const same = (id, got) => { if (!got || !sameMolecule(got, byId[id].example[1])) throw new Error(`${id}: engine gives ${got}`); };
    same('hydrogenation', rx.hydrogenate(byId.hydrogenation.example[0]));
    same('halogenation', rx.halogenate(byId.halogenation.example[0], 'Br'));
    same('hydrohalogenation', rx.hydrohalogenate(byId.hydrohalogenation.example[0], 'Br').major);
    same('hydration', rx.hydrate(byId.hydration.example[0]).major);
    same('dehydration', rx.dehydrate(byId.dehydration.example[0]).major);
    same('ox1', rx.oxidizeAlcohol(byId.ox1.example[0]).first);
    same('oxald', rx.oxidizeAldehyde(byId.oxald.example[0]));
    same('ox2', rx.oxidizeAlcohol(byId.ox2.example[0]).first);
    expect(rx.oxidizeAlcohol(byId.ox3.example[0]).first).toBeNull();
    same('red-ald', rx.reduceCarbonyl(byId['red-ald'].example[0]));
    same('red-ket', rx.reduceCarbonyl(byId['red-ket'].example[0]));
    same('neutralize', rx.neutralizeAcid(byId.neutralize.example[0]));
    same('thiol-ox', rx.oxidizeThiol(byId['thiol-ox'].example[0]));
    expect(rx.oxidizeAldehyde(byId['ket-ox'].example[0])).toBeNull();
    // disulfide reduction is thiol oxidation backwards
    if (!sameMolecule(rx.oxidizeThiol(byId['disulfide-red'].example[1]), byId['disulfide-red'].example[0])) throw new Error('disulfide-red example');
  });
});

describe('Nursing connections', () => {
  it('point at real lesson sections and use valid markup', () => {
    const ids = new Set();
    for (const n of NURSING) {
      if (ids.has(n.id)) throw new Error(`duplicate ${n.id}`);
      ids.add(n.id);
      const lec = lectureById(n.lecture);
      if (!lec || !lec.sections.some((x) => x.id === n.section)) throw new Error(`${n.id}: no section ${n.lecture}/${n.section}`);
      if (!n.title || !n.text || n.text.length > 420) throw new Error(`${n.id}: needs a title and a short text`);
      markup(n.title); markup(n.text);
    }
    for (const l of LECTURES) if (!NURSING.some((n) => n.lecture === l.id)) throw new Error(`no nursing connection for ${l.id}`);
  });
});

describe('Messages', () => {
  it('are non-empty', () => {
    expect(messages.cheers.length).toBeGreaterThan(0);
    expect(messages.comfort.length).toBeGreaterThan(0);
    for (const v of Object.values(messages.milestones)) if (!v) throw new Error('empty milestone');
  });
});
