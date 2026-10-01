// Checks a typed compound name against the expected answer and explains mistakes.
//
// status: 'correct' | 'close' (right molecule, name not quite right) | 'wrong' | 'unreadable'
// Also returns `userSmiles` when the typed name could be drawn, so the UI can show
// "here's what your name describes" next to the real answer.

import { normalizeName, parseName } from './nameparse.js';
import { nameCompound } from './namer.js';
import { canonicalKey, toMol } from './analyze.js';
import { toSmiles } from './smiles.js';

const loose = (s) => normalizeName(s).replace(/[\s,\-()]/g, '');

// expected: { smiles, name?, accept?: [...] , iupacOnly?: bool }
export function checkName(input, expected) {
  const user = normalizeName(input);
  const auto = expected.smiles ? nameCompound(expected.smiles) : null;
  const primary = expected.name || (auto && auto.name);
  const iupacSet = [primary, ...(auto ? auto.alternates : []), ...(expected.accept || [])].filter(Boolean);
  const commonSet = auto ? auto.common : [];
  const result = (status, message, extra = {}) => ({ status, correct: status === 'correct', message, answer: primary, tips: [], ...extra });

  if (!user) return result('wrong', 'No answer given.');
  if (iupacSet.map(normalizeName).includes(user)) return result('correct', 'Correct!');
  if (commonSet.map(normalizeName).includes(user)) {
    if (expected.iupacOnly) return result('close', `"${input.trim()}" is the common name. The IUPAC name is ${primary}.`);
    return result('correct', `Correct — that's the common name. IUPAC name: ${primary}.`);
  }
  const looseHit = [...iupacSet, ...(expected.iupacOnly ? [] : commonSet)].find((n) => loose(n) === loose(user));

  const parsed = parseName(user);
  if (!parsed.ok) {
    if (looseHit) return result('correct', `Correct! Formatting tip: write it as ${looseHit}.`);
    const why = parsed.issues.map((i) => i.msg).join(' ');
    return result('unreadable', why || "I couldn't read that name.", { tips: parsed.issues.map((i) => i.msg) });
  }
  const userSmiles = toSmiles(parsed.mol);
  let same = false;
  try { same = canonicalKey(parsed.mol) === canonicalKey(toMol(expected.smiles)); } catch { same = false; }
  // cis/trans is not captured by the canonical key; compare separately.
  const expStereo = auto && auto.parts ? auto.parts.stereo : null;
  const userStereo = parsed.parsed ? parsed.parsed.stereo : null;

  if (!same) {
    const tips = [];
    const expMol = toMol(expected.smiles);
    const cUser = parsed.mol.atoms.filter((a) => a.el === 'C').length;
    const cExp = expMol.atoms.filter((a) => a.el === 'C').length;
    if (cUser !== cExp) tips.push(`Count carbons: your name has ${cUser} C, but the molecule has ${cExp}.`);
    for (const i of parsed.issues || []) tips.push(i.msg);
    return result('wrong', 'That name describes a different compound.', { userSmiles, tips });
  }

  if (expStereo && userStereo !== expStereo) {
    return result('close', `Right structure — but include the geometry: ${expStereo}- (the two groups are on ${expStereo === 'cis' ? 'the same side' : 'opposite sides'} of the C=C).`, { userSmiles });
  }
  if (!expStereo && userStereo) {
    return result('close', `Right structure, but this compound doesn't need cis/trans. Answer: ${primary}.`, { userSmiles });
  }

  // Same molecule. Is the name itself correct?
  if (parsed.kind === 'common' || parsed.kind === 'salt') {
    if (looseHit) return result('correct', 'Correct!');
    const alpha = (parsed.issues || []).find((i) => i.code === 'alphabetical');
    if (alpha && !expected.iupacOnly) return result('correct', `Correct! (Tip: ${alpha.msg}) IUPAC name: ${primary}.`);
    if (expected.iupacOnly) return result('close', `That's a common name for the right compound. The IUPAC name is ${primary}.`, { userSmiles });
    return result('correct', `Correct — that's another accepted name. IUPAC name: ${primary}.`);
  }
  if (!auto || !auto.parts || !parsed.parsed) {
    if (looseHit) return result('correct', `Correct! Formatting tip: ${looseHit}.`);
    return result('close', `That describes the right molecule, but the expected name is ${primary}.`, { userSmiles });
  }
  const diag = diagnose(parsed, auto.parts);
  const hardIssues = (parsed.issues || []).filter((i) => !['commaStyle', 'format'].includes(i.code));
  if (!diag.length && !hardIssues.length) {
    const tips = [];
    if (parsed.parsed.newStyle) tips.push(`That's the newer IUPAC format. Your class writes it as ${primary}.`);
    if ((parsed.issues || []).some((i) => i.code === 'commaStyle') || (looseHit && normalizeName(looseHit) !== user)) {
      tips.push(`Formatting: commas go between numbers, hyphens between numbers and words — ${primary}.`);
    }
    return result('correct', tips.length ? `Correct! ${tips.join(' ')}` : 'Correct!', { tips });
  }
  const tips = [...diag, ...hardIssues.map((i) => i.msg)];
  const unique = [...new Set(tips)];
  return result('close', `Right molecule, but the name needs a fix. ${unique[0]}`, { userSmiles, tips: unique });
}

function sameLocantMap(a, b) {
  const key = (ps) => ps.map((p) => `${p.name}:${p.locants.join(',')}`).sort().join('|');
  return key(a) === key(b);
}

function diagnose(userParse, expParts) {
  const tips = [];
  const up = userParse.parsed;
  const ep = expParts;
  if (up.parent.n !== ep.parent.n || up.parent.cyclic !== ep.parent.cyclic) {
    const what = ep.parent.kind === 'ene' ? ' that contains the C=C'
      : ep.parent.kind === 'yne' ? ' that contains the C≡C'
        : ['alcohol', 'thiol', 'ketone', 'aldehyde', 'acid'].includes(ep.parent.kind) ? ' that contains the functional group' : '';
    tips.push(`Parent chain: find the longest chain${what}. It has ${ep.parent.n} carbons here, not ${up.parent.n}. Remember: chains can bend around corners.`);
    return tips;
  }
  const namesUser = up.prefixes.map((p) => p.name).sort().join('|');
  const namesExp = ep.prefixes.map((p) => p.name).sort().join('|');
  if (namesUser !== namesExp) {
    tips.push('The substituents are different from what the parent chain choice gives. Recheck which carbons belong to the main chain.');
    return tips;
  }
  const upLocs = up.parent.locants.join(',');
  const epLocs = ep.parent.locants.join(',');
  if (upLocs !== epLocs && ep.parent.locants.length) {
    const grp = { ene: 'the C=C', yne: 'the C≡C', alcohol: 'the –OH', thiol: 'the –SH', ketone: 'the C=O', aldehyde: 'the CHO', acid: 'the COOH' }[ep.parent.kind] || 'the functional group';
    tips.push(`Numbering: number the chain from the end that gives ${grp} the lowest number (${epLocs}).`);
    return tips;
  }
  if (!sameLocantMap(up.prefixes, ep.prefixes)) {
    const allU = up.prefixes.flatMap((p) => p.locants).sort((a, b) => a - b).join(',');
    const allE = ep.prefixes.flatMap((p) => p.locants).sort((a, b) => a - b).join(',');
    if (allU === allE) tips.push('Numbering tie: both directions give the same numbers, so the group that comes first alphabetically gets the lower number.');
    else tips.push(`Numbering: number from the end that gives the substituents the lowest numbers at the first point of difference (${allE}, not ${allU}).`);
    return tips;
  }
  const alphaIssue = (userParse.issues || []).find((i) => i.code === 'alphabetical');
  if (alphaIssue) {
    const onlyIso = up.order.some((n) => /^iso/.test(n));
    if (!onlyIso) tips.push('Alphabetical order: list substituents alphabetically, ignoring di-, tri-, tetra- (e.g. ethyl before methyl).');
  }
  return tips;
}
