// Answer checking for every question type. Pure functions (no DOM), fully unit tested.
import { checkName } from '../chem/namecheck.js';
import { parseFormula, sameFormula } from '../chem/analyze.js';

const SUPERSCRIPTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };

// Parses "4.92", "3.2e-5", "3.2 x 10^-5", "3.2×10⁻⁵", "3.2*10-5", "1.5 X 10 ^ -4", "10^-7".
export function parseNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  let s = String(input || '').trim();
  if (!s) return null;
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => (c === '⁻' || c === '⁺' ? '^' : '') + SUPERSCRIPTS[c])
    .replace(/\^\^/g, '^')
    .replace(/[−–—]/g, '-')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/M$/i, '');
  // collapse "^-" sequences produced by superscripts, e.g. "10^-^5" -> "10^-5"
  s = s.replace(/\^-\^?/g, '^-').replace(/\^\+\^?/g, '^');
  let m = /^([-+]?\d*\.?\d+)(?:[xX×*·]10\^?([-+]?\d+))?$/.exec(s);
  if (m) {
    const mant = parseFloat(m[1]);
    return m[2] != null ? mant * Math.pow(10, parseInt(m[2], 10)) : mant;
  }
  m = /^10\^?([-+]?\d+)$/.exec(s);
  if (m) return Math.pow(10, parseInt(m[1], 10));
  m = /^([-+]?\d*\.?\d+)e([-+]?\d+)$/i.exec(s);
  if (m) return parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
  return null;
}

export function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[°º]/g, '')
    .replace(/[‐-―−]/g, '-')
    .replace(/[^a-z0-9.+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((x) => sa.has(x));
}

const ok = (message = 'Correct!', extra = {}) => ({ correct: true, status: 'correct', message, ...extra });
const no = (message = 'Not quite.', extra = {}) => ({ correct: false, status: 'wrong', message, ...extra });

export function checkAnswer(q, response) {
  switch (q.type) {
    case 'mc':
    case 'struct':
      return response === q.answer ? ok() : no();
    case 'tf':
      return response === q.answer ? ok() : no();
    case 'multi': {
      const r = Array.isArray(response) ? response : [];
      if (sameSet(r, q.answer)) return ok();
      const missed = q.answer.filter((x) => !r.includes(x));
      const extra = r.filter((x) => !q.answer.includes(x));
      const bits = [];
      if (missed.length) bits.push(`missed ${missed.length}`);
      if (extra.length) bits.push(`${extra.length} extra`);
      return no(`Not quite — ${bits.join(', ')}.`, { missed, extra });
    }
    case 'num': {
      const x = parseNumber(response);
      if (x == null) return no("I couldn't read that as a number. Examples: 4.92, 3.2e-5, 3.2 x 10^-5");
      const ans = q.answer;
      const tol = q.tol != null ? q.tol : q.rel != null ? Math.abs(ans) * q.rel : Math.max(Math.abs(ans) * 0.005, 1e-9);
      if (Math.abs(x - ans) <= tol + 1e-12) {
        if (q.decimals != null) {
          const typed = String(response).trim();
          const dec = (typed.split('.')[1] || '').replace(/[^0-9]/g, '').length;
          if (dec !== q.decimals && !/e|x|×|\^/i.test(typed)) return ok(`Correct! Sig-fig tip: report ${q.decimals} decimal place${q.decimals === 1 ? '' : 's'} here.`);
        }
        return ok();
      }
      return no();
    }
    case 'text': {
      const r = normalizeText(response);
      const accepted = [q.answer, ...(q.accept || [])].map(normalizeText);
      if (accepted.includes(r)) return ok();
      if (r && accepted.some((a) => a.replace(/[\s-]/g, '') === r.replace(/[\s-]/g, ''))) return ok();
      return no();
    }
    case 'formula': {
      const counts = parseFormula(String(response || '').replace(/\s+/g, ''));
      if (!counts) return no('Write a formula like C4H10 (element symbols with counts).');
      if (sameFormula(counts, q.answer)) {
        const typed = String(response).replace(/\s+/g, '').replace(/[₀-₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)));
        if (typed !== q.answer) return ok(`Correct! Usually written ${q.answer} (C first, then H, then others A→Z).`);
        return ok();
      }
      const exp = parseFormula(q.answer);
      if ((counts.C || 0) === (exp.C || 0) && (counts.H || 0) !== (exp.H || 0)) {
        return no(`Carbons are right; recount the hydrogens (each C needs 4 bonds).`);
      }
      return no();
    }
    case 'name': {
      const r = checkName(response, q.name);
      return { correct: r.correct, status: r.status, message: r.message, tips: r.tips, userSmiles: r.userSmiles };
    }
    case 'order': {
      const r = Array.isArray(response) ? response : [];
      if (r.length === q.answer.length && r.every((x, i) => x === q.answer[i])) return ok();
      const right = r.filter((x, i) => x === q.answer[i]).length;
      return no(`${right} of ${q.answer.length} in the right place.`);
    }
    case 'match': {
      const r = Array.isArray(response) ? response : [];
      const right = q.answer.filter((x, i) => r[i] === x).length;
      if (right === q.answer.length) return ok();
      return no(`${right} of ${q.answer.length} matched correctly.`);
    }
    case 'atoms': {
      const r = Array.isArray(response) ? response : [];
      if (sameSet(r, q.answer)) return ok();
      const missed = q.answer.filter((x) => !r.includes(x));
      const extra = r.filter((x) => !q.answer.includes(x));
      if (!q.answer.length) return no('There are none here.', { missed, extra });
      if (!r.length) return no(`There ${q.answer.length === 1 ? 'is 1' : `are ${q.answer.length}`}.`, { missed, extra });
      const bits = [];
      if (missed.length) bits.push(`missed ${missed.length}`);
      if (extra.length) bits.push(`${extra.length} shouldn't be selected`);
      return no(`Not quite — ${bits.join(', ')}.`, { missed, extra });
    }
    default:
      return no('Unknown question type.');
  }
}

// Text used to reveal the right answer after a miss.
export function answerText(q) {
  switch (q.type) {
    case 'mc': return q.choices[q.answer];
    case 'tf': return q.answer ? 'True' : 'False';
    case 'multi': return q.answer.map((i) => q.choices[i]).join(', ') || 'None of them';
    case 'num': return q.answerText || String(q.answer);
    case 'text': return q.answer;
    case 'formula': return `$${q.answer}$`;
    case 'name': return q.name.name || '';
    case 'order': return q.answer.map((i) => q.items[i]).join('  <  ');
    case 'match': return q.left.map((l, i) => `${l} → ${q.right[q.answer[i]]}`).join('; ');
    default: return '';
  }
}
