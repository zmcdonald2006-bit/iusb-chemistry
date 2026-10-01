// Shared validation helpers for tests.
import { checkAnswer, answerText } from '../js/quiz/checkers.js';
import { parseSmiles } from '../js/chem/smiles.js';
import { canonicalKey } from '../js/chem/analyze.js';
import { renderMolecule } from '../js/chem/render.js';

// The response a perfect student would give.
export function perfectResponse(q) {
  switch (q.type) {
    case 'mc': case 'struct': case 'tf': case 'multi': case 'order': case 'match': case 'atoms': return q.answer;
    case 'num': return String(q.answer);
    case 'text': return q.answer;
    case 'formula': return q.answer;
    case 'name': return q.name.name;
    default: return null;
  }
}

export function validateQuestion(q) {
  const where = `${q.id || '?'} (${q.type})`;
  const fail = (m) => { throw new Error(`${where}: ${m}`); };
  if (!q.prompt || typeof q.prompt !== 'string') fail('missing prompt');
  if (!q.skill || !/^l\d\d\.[a-z0-9-]+$/.test(q.skill)) fail(`bad skill "${q.skill}"`);
  if (!q.explain) fail('missing explanation');
  const figs = [];
  if (q.figure) {
    if (q.figure.smiles) figs.push(q.figure.smiles);
    for (const m of q.figure.mols || []) figs.push(m.smiles);
    if (q.figure.rxn) { figs.push(q.figure.rxn.from); if (q.figure.rxn.to) figs.push(q.figure.rxn.to); }
  }
  for (const s of figs) {
    try { parseSmiles(s); renderMolecule(s, { highlight: q.figure.highlight }); } catch (e) { fail(`figure "${s}" fails: ${e.message}`); }
  }
  switch (q.type) {
    case 'mc':
      if (!Array.isArray(q.choices) || q.choices.length < 2) fail('needs ≥2 choices');
      if (!(q.answer >= 0 && q.answer < q.choices.length)) fail('answer out of range');
      if (new Set(q.choices).size !== q.choices.length) fail(`duplicate choices ${JSON.stringify(q.choices)}`);
      break;
    case 'struct': {
      if (q.choices.length < 2) fail('needs ≥2 structure choices');
      if (!(q.answer >= 0 && q.answer < q.choices.length)) fail('answer out of range');
      const keys = q.choices.map((c) => (c.smiles ? canonicalKey(c.smiles) : `t:${c.text}`));
      if (new Set(keys).size !== keys.length) fail('duplicate structures');
      for (const c of q.choices) if (c.smiles) renderMolecule(c.smiles);
      break;
    }
    case 'multi':
      if (!q.answer.length) fail('multi needs ≥1 answer');
      if (q.answer.some((i) => i < 0 || i >= q.choices.length)) fail('answer out of range');
      break;
    case 'num':
      if (!Number.isFinite(q.answer)) fail('answer not a number');
      break;
    case 'tf':
      if (typeof q.answer !== 'boolean') fail('tf answer must be boolean');
      break;
    case 'name':
      if (!q.name || !q.name.smiles || !q.name.name) fail('name question needs smiles + name');
      break;
    case 'order':
      if (q.items.length !== q.answer.length) fail('order length mismatch');
      if ([...q.answer].sort().join() !== q.items.map((_, i) => i).sort().join()) fail('order answer must be a permutation');
      break;
    case 'atoms':
      if (q.selectable && q.answer.some((a) => !q.selectable.includes(a))) fail('answer atom not selectable');
      if (!q.answer.length && !q.allowNone) fail('empty answer without allowNone');
      break;
    case 'match':
      if (!Array.isArray(q.left) || !Array.isArray(q.right) || q.answer.length !== q.left.length) fail('match needs left/right and one answer per left item');
      if (q.answer.some((i) => i < 0 || i >= q.right.length)) fail('match answer out of range');
      break;
    case 'formula': case 'text':
      if (!q.answer) fail('missing answer');
      break;
    default: fail('unknown type');
  }
  const res = checkAnswer(q, perfectResponse(q));
  if (!res.correct) fail(`perfect answer marked wrong: ${JSON.stringify(perfectResponse(q))} → ${res.message}`);
  if (q.type !== 'atoms' && q.type !== 'struct' && answerText(q) === '') fail('empty answer text');
}

