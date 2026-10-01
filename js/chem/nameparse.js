// Name -> structure parser for the naming grammar used in C102.
// Accepts old style (2-butanol, 1,3-butadiene) and new IUPAC style (butan-2-ol,
// buta-1,3-diene), common names (acetone, diethyl ether, isopropyl alcohol) and
// carboxylate salts (sodium acetate). Returns a structured parse plus any issues found,
// so the answer checker can give specific feedback.

import { parseSmiles, toSmiles } from './smiles.js';
import { STEMS, MULT, alphaKey } from './namer.js';

const STEM_RE = 'icos|nonadec|octadec|heptadec|hexadec|pentadec|tetradec|tridec|dodec|undec|meth|eth|prop|but|pent|hex|hept|oct|non|dec';

const ALKYL_SMILES = {
  methyl: 'C', ethyl: 'CC', propyl: 'CCC', butyl: 'CCCC', pentyl: 'CCCCC', hexyl: 'CCCCCC',
  heptyl: 'CCCCCCC', octyl: 'CCCCCCCC', nonyl: 'CCCCCCCCC', decyl: 'CCCCCCCCCC',
  isopropyl: 'C(C)C', 'sec-butyl': 'C(C)CC', isobutyl: 'CC(C)C', 'tert-butyl': 'C(C)(C)C',
};
const PREFIX_SMILES = {
  ...ALKYL_SMILES,
  fluoro: 'F', chloro: 'Cl', bromo: 'Br', iodo: 'I', hydroxy: 'O', oxo: '=O',
  methoxy: 'OC', ethoxy: 'OCC', propoxy: 'OCCC', butoxy: 'OCCCC', isopropoxy: 'OC(C)C', 'tert-butoxy': 'OC(C)(C)C',
};
const PREFIX_NAMES = Object.keys(PREFIX_SMILES).sort((a, b) => b.length - a.length);

// Common names -> SMILES (all lower case).
export const COMMON_NAMES = {
  formaldehyde: 'C=O', acetaldehyde: 'CC=O', benzaldehyde: 'O=Cc1ccccc1', acetone: 'CC(C)=O',
  'formic acid': 'OC=O', 'acetic acid': 'CC(=O)O', 'benzoic acid': 'OC(=O)c1ccccc1', 'butyric acid': 'CCCC(=O)O',
  'propionic acid': 'CCC(=O)O', 'lactic acid': 'CC(O)C(=O)O', 'glycolic acid': 'OCC(=O)O',
  ethylene: 'C=C', acetylene: 'C#C', propylene: 'CC=C', isobutane: 'CC(C)C',
  'ethylene glycol': 'OCCO', glycerol: 'OCC(O)CO', glycerin: 'OCC(O)CO', chloroform: 'ClC(Cl)Cl',
  'rubbing alcohol': 'CC(C)O', 'wood alcohol': 'CO', 'grain alcohol': 'CCO',
  glutaraldehyde: 'O=CCCCC=O', benzene: 'c1ccccc1', toluene: 'Cc1ccccc1', phenol: 'Oc1ccccc1',
  water: 'O', ammonia: 'N',
};

export function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')
    .replace(/[’']/g, '')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function issue(code, msg) { return { code, msg }; }

function fail(issues) { return { ok: false, issues }; }

// ---- Main entry --------------------------------------------------------------------

export function parseName(input) {
  const raw = normalizeName(input);
  if (!raw) return fail([issue('empty', 'Type a name first.')]);
  const s = raw
    .replace(/\(1-methylethyl\)/g, 'isopropyl')
    .replace(/\b(t|tert)-?butyl/g, 'tert-butyl')
    .replace(/\b(s|sec)-?butyl/g, 'sec-butyl')
    .replace(/\biso-(propyl|butyl)/g, 'iso$1')
    .replace(/\b(t|tert)-?butoxy/g, 'tert-butoxy');

  if (COMMON_NAMES[s]) {
    return build({ smiles: COMMON_NAMES[s], kind: 'common', common: s, issues: [] });
  }
  let m;
  // Carboxylate salts: sodium acetate, potassium propanoate
  if ((m = /^(sodium|potassium|lithium) (.+)ate$/.exec(s))) {
    const acidName = m[2] + 'ic acid';
    const acid = parseName(acidName);
    if (!acid.ok) return acid;
    const metal = { sodium: 'Na', potassium: 'K', lithium: 'Li' }[m[1]];
    const mol = acid.mol;
    const acidO = mol.atoms.find((a) => a.el === 'O' && a.h === 1 && a.bonds.length === 1);
    if (!acidO) return fail([issue('salt', 'Only carboxylic acids form these carboxylate salts.')]);
    Object.assign(acidO, { charge: -1, bracket: true, hExplicit: 0, h: 0 });
    const smiles = toSmiles(mol) + `.[${metal}+]`;
    return build({ smiles, kind: 'salt', issues: acid.issues || [] });
  }
  // Common alcohol names: ethyl alcohol, isopropyl alcohol
  if ((m = /^(.+?) ?alcohol$/.exec(s))) {
    const r = ALKYL_SMILES[m[1]];
    if (!r) return fail([issue('unknown', `Unknown alkyl group "${m[1]}".`)]);
    return build({ smiles: 'O' + r, kind: 'common', issues: [] });
  }
  // Common ether / ketone names
  if ((m = /^(.+?) ?(ether|ketone)$/.exec(s))) {
    const groups = splitAlkyls(m[1]);
    if (!groups) return fail([issue('unknown', `Couldn't read the groups in "${m[1]}".`)]);
    const [r1, r2] = groups;
    // substituent SMILES are written root-first, so attach each group through a branch
    const smiles = m[2] === 'ether' ? `O(${ALKYL_SMILES[r1]})${ALKYL_SMILES[r2]}` : `C(=O)(${ALKYL_SMILES[r1]})${ALKYL_SMILES[r2]}`;
    const iss = [];
    if (r1 !== r2 && alphaKey(r1) > alphaKey(r2)) iss.push(issue('alphabetical', 'In common names, list the two groups in alphabetical order.'));
    return build({ smiles, kind: 'common', issues: iss, commonGroups: [r1, r2] });
  }
  return parseSystematic(s);
}

function splitAlkyls(str) {
  const t = str.replace(/\s+/g, ' ').trim();
  if (t.startsWith('di') && ALKYL_SMILES[t.slice(2)]) return [t.slice(2), t.slice(2)];
  const parts = t.split(' ');
  if (parts.length === 2 && ALKYL_SMILES[parts[0]] && ALKYL_SMILES[parts[1]]) return parts;
  // run-together: "ethylmethyl"
  for (const a of Object.keys(ALKYL_SMILES)) {
    if (t.startsWith(a) && ALKYL_SMILES[t.slice(a.length)]) return [a, t.slice(a.length)];
  }
  return null;
}

// ---- Systematic names -------------------------------------------------------------------

const PREFIX_RE = new RegExp(`^[,\\- ]*(?:(\\d+(?:,\\d+)*)-?)?(di|tri|tetra|penta|hexa)?(${PREFIX_NAMES.map((p) => p.replace('-', '\\-')).join('|')})-?`);
const PARENT_RE = new RegExp(`^[,\\- ]*(?:(\\d+(?:,\\d+)*)-)?(cyclo)?(${STEM_RE})(.*)$`);

const ENDINGS = [
  // [regex on the ending, kind, count] ; old style
  [/^ane$/, 'ane', 0], [/^ene$/, 'ene', 1], [/^adiene$/, 'ene', 2], [/^atriene$/, 'ene', 3],
  [/^yne$/, 'yne', 1], [/^adiyne$/, 'yne', 2],
  [/^anol$/, 'alcohol', 1], [/^anediol$/, 'alcohol', 2], [/^anetriol$/, 'alcohol', 3],
  [/^anal$/, 'aldehyde', 1], [/^anedial$/, 'aldehyde', 2],
  [/^anone$/, 'ketone', 1], [/^anedione$/, 'ketone', 2],
  [/^anoic ?acid$/, 'acid', 1], [/^anedioic ?acid$/, 'acid', 2],
  [/^anethiol$/, 'thiol', 1], [/^anedithiol$/, 'thiol', 2],
];
const NEW_SUFFIX = {
  ol: ['alcohol', 1], diol: ['alcohol', 2], triol: ['alcohol', 3], al: ['aldehyde', 1], dial: ['aldehyde', 2],
  one: ['ketone', 1], dione: ['ketone', 2], thiol: ['thiol', 1], dithiol: ['thiol', 2],
  ene: ['ene', 1], diene: ['ene', 2], triene: ['ene', 3], yne: ['yne', 1], diyne: ['yne', 2],
  'oic acid': ['acid', 1], oicacid: ['acid', 1], 'dioic acid': ['acid', 2],
};

function parseLocants(str) {
  return str ? str.split(',').map((x) => parseInt(x, 10)) : null;
}

function parseSystematic(s) {
  const issues = [];
  let rest = s;
  let stereo = null;
  let m = /^(cis|trans)[- ]?/.exec(rest);
  if (m) { stereo = m[1]; rest = rest.slice(m[0].length); }
  const prefixes = [];
  const commaStyle = /[a-z],\d/.test(rest);
  for (let guard = 0; guard < 12; guard++) {
    m = PREFIX_RE.exec(rest);
    if (!m) break;
    // don't eat a parent stem like "methanol" (prefix regex needs a full prefix name)
    const after = rest.slice(m[0].length);
    if (!after) break; // the "prefix" was actually the whole name
    prefixes.push({ locants: parseLocants(m[1]), mult: m[2] || '', name: m[3], raw: m[0] });
    rest = after;
  }
  m = PARENT_RE.exec(rest);
  if (!m) return fail([issue('parent', "I couldn't find the parent chain (like hexane, 2-butanol, cyclohexene).")]);
  let parentLocs = parseLocants(m[1]);
  const cyclo = !!m[2];
  const n = STEMS.indexOf(m[3]);
  let ending = m[4].trim();
  let kind = null, count = 0, newStyle = false;
  for (const [re, k, c] of ENDINGS) if (re.test(ending)) { kind = k; count = c; break; }
  if (!kind) {
    const mm = /^(an|ane|en|yn|a)?-(\d+(?:,\d+)*)-(.+)$/.exec(ending);
    if (mm && NEW_SUFFIX[mm[3].trim()]) {
      [kind, count] = NEW_SUFFIX[mm[3].trim()];
      if (parentLocs) issues.push(issue('format', 'Locants appear twice in the parent name.'));
      parentLocs = parseLocants(mm[2]);
      newStyle = true;
    }
  }
  if (!kind) return fail([issue('suffix', `I couldn't read the ending "-${ending}". Endings look like -ane, -ene, -yne, -ol, -al, -one, -oic acid, -thiol.`)]);
  if (n < 1) return fail([issue('parent', 'Unknown parent chain.')]);
  if (cyclo && n < 3) return fail([issue('ring', 'A ring needs at least 3 carbons.')]);

  // ---- place parent features
  const subs = Array.from({ length: n + 1 }, () => []); // 1-based
  const bondOrder = Array(n + 1).fill(1); // bondOrder[i]: between i and i+1 (ring: n->1 at index n)
  let principal = null;
  const multipleKinds = ['ene', 'yne'];
  if (multipleKinds.includes(kind)) {
    let locs = parentLocs;
    if (!locs) {
      if (count === 1 && (cyclo || n <= 3)) locs = [1];
      else {
        issues.push(issue('missingLocant', `Add a number to show where the ${kind === 'ene' ? 'double' : 'triple'} bond is (e.g. 2-${STEMS[n]}${kind}).`));
        locs = count === 1 ? [1] : [1, 3].slice(0, count);
      }
    }
    if (locs.length !== count) return fail([issue('multiplier', `The ending says ${count} multiple bond(s) but you gave ${locs.length} number(s).`)]);
    for (const l of locs) {
      const max = cyclo ? n : n - 1;
      if (l < 1 || l > max) return fail([issue('range', `There is no C${l}–C${l + 1} bond in a ${n}-carbon ${cyclo ? 'ring' : 'chain'}.`)]);
      bondOrder[l] = kind === 'ene' ? 2 : 3;
    }
    parentLocs = locs;
  } else if (kind !== 'ane') {
    let locs = parentLocs;
    if (kind === 'acid' || kind === 'aldehyde') {
      if (cyclo) return fail([issue('ring', 'Ring aldehydes/acids use other naming rules not covered here.')]);
      if (parentLocs && !newStyle) issues.push(issue('extraLocant', `No number is needed: the ${kind === 'acid' ? 'COOH' : 'CHO'} carbon is always C1.`));
      locs = count === 2 ? [1, n] : [1];
    } else if (!locs) {
      if (count === 1 && (cyclo || n <= 2)) locs = [1];
      else if (kind === 'ketone' && n <= 4 && count === 1) { locs = [2]; }
      else {
        issues.push(issue('missingLocant', 'Add the position number of the functional group (e.g. 2-butanol, 3-pentanone).'));
        locs = kind === 'ketone' ? [2] : [1];
        if (count > 1) return fail([issue('missingLocant', 'Give a number for each functional group (e.g. 1,2-ethanediol).')]);
      }
    }
    if (locs.length !== count) return fail([issue('multiplier', `The ending says ${count} group(s) but you gave ${locs.length} number(s).`)]);
    for (const l of locs) if (l < 1 || l > n) return fail([issue('range', `C${l} doesn't exist in a ${n}-carbon ${cyclo ? 'ring' : 'chain'}.`)]);
    principal = { kind, locants: locs };
    const frag = { alcohol: 'O', thiol: 'S', ketone: '=O', aldehyde: '=O', acid: null }[kind];
    for (const l of locs) {
      if (kind === 'acid') { subs[l].push('=O'); subs[l].push('O'); }
      else subs[l].push(frag);
    }
    if (kind === 'ketone' && !cyclo && locs.some((l) => l === 1 || l === n)) {
      return fail([issue('ketoneEnd', 'A C=O at the end of a chain is an aldehyde (-al), not a ketone (-one).')]);
    }
    parentLocs = locs;
  }

  // ---- place prefixes
  const parsedPrefixes = [];
  let prefixCount = 0;
  for (const p of prefixes) {
    const multCount = p.mult ? MULT.indexOf(p.mult) : 1;
    let locs = p.locants;
    if (!locs) {
      const onlyOne = prefixes.length === 1 && multCount === 1;
      if (n === 1) locs = Array(multCount).fill(1);
      else if (onlyOne && ((n === 2 && kind === 'ane') || (n === 2 && kind === 'ene') || (cyclo && kind === 'ane'))) locs = [1];
      else if (onlyOne && n === 2 && ['ene', 'yne'].includes(kind)) locs = [1];
      else {
        issues.push(issue('missingLocant', `Give each ${p.name} group a position number.`));
        return fail(issues);
      }
    }
    if (locs.length !== multCount) {
      if (!p.mult && locs.length > 1) issues.push(issue('missingMultiplier', `Two or more ${p.name} groups need a prefix like di- or tri- (e.g. ${locs.join(',')}-${MULT[locs.length]}${p.name}).`));
      else return fail([issue('multiplier', `"${p.mult}${p.name}" needs ${multCount} number(s), but you gave ${locs.length}.`)]);
    }
    for (const l of locs) {
      if (l < 1 || l > n) return fail([issue('range', `C${l} doesn't exist in a ${n}-carbon ${cyclo ? 'ring' : 'chain'}.`)]);
      subs[l].push(PREFIX_SMILES[p.name]);
      prefixCount++;
    }
    parsedPrefixes.push({ name: p.name, locants: [...locs].sort((a, b) => a - b), mult: p.mult });
  }
  if (commaStyle) issues.push(issue('commaStyle', 'Separate a number from the next word with a hyphen, not a comma (e.g. 2-bromo-5-methylhexane).'));

  // Merge duplicated prefix entries (e.g. "2-methyl-3-methyl")
  const merged = new Map();
  for (const p of parsedPrefixes) {
    if (merged.has(p.name)) {
      merged.get(p.name).locants.push(...p.locants);
      issues.push(issue('duplicatePrefix', `Combine identical groups into one prefix (e.g. 2,3-dimethyl instead of 2-methyl-3-methyl).`));
    } else merged.set(p.name, { name: p.name, locants: [...p.locants] });
  }
  const grouped = [...merged.values()].map((g) => ({ ...g, locants: g.locants.sort((a, b) => a - b) }));
  const order = parsedPrefixes.map((p) => p.name);
  const sortedOrder = [...order].sort((a, b) => (alphaKey(a) < alphaKey(b) ? -1 : alphaKey(a) > alphaKey(b) ? 1 : 0));
  if (order.join('|') !== sortedOrder.join('|')) issues.push(issue('alphabetical', 'List substituents in alphabetical order (ignore di-, tri-, sec-, tert-).'));

  // ---- stereo
  let stereoPlaced = null;
  if (stereo) {
    const dbs = [];
    for (let i = 1; i <= n; i++) if (bondOrder[i] === 2) dbs.push(i);
    if (cyclo || dbs.length !== 1) {
      issues.push(issue('stereo', 'cis/trans is used here only for a single C=C in a chain.'));
    } else {
      const l = dbs[0];
      const left = l - 1, right = l + 2;
      if (left < 1 || right > n) {
        issues.push(issue('noCisTrans', `A C=C at the end of a chain (C${l}) can't have cis/trans isomers — one carbon has two H's.`));
      } else if (subs[l].length || subs[l + 1].length) {
        issues.push(issue('stereo', 'This alkene needs E/Z naming (beyond this course); cis/trans ignored.'));
      } else stereoPlaced = { l, cis: stereo === 'cis' };
    }
  }

  // ---- build SMILES
  let smi = '';
  for (let i = 1; i <= n; i++) {
    smi += 'C';
    if (cyclo && i === 1) smi += '1';
    for (const f of subs[i]) smi += `(${f})`;
    if (i < n) smi += bondOrder[i] === 2 ? '=' : bondOrder[i] === 3 ? '#' : '';
    if (cyclo && i === n) smi += (bondOrder[n] === 2 ? '=' : bondOrder[n] === 3 ? '#' : '') + '1';
  }
  if (stereoPlaced) smi = buildWithStereo(n, subs, bondOrder, stereoPlaced);
  const result = build({
    smiles: smi,
    kind: 'systematic',
    issues,
    parsed: {
      stereo: stereoPlaced ? (stereoPlaced.cis ? 'cis' : 'trans') : null,
      prefixes: grouped.sort((a, b) => (alphaKey(a.name) < alphaKey(b.name) ? -1 : 1)),
      order,
      parent: { n, cyclic: cyclo, kind: principal ? principal.kind : kind, count: principal ? principal.locants.length : count, locants: parentLocs || [] },
      newStyle,
      prefixCount,
    },
  });
  return result;
}

function buildWithStereo(n, subs, bondOrder, st) {
  let smi = '';
  for (let i = 1; i <= n; i++) {
    if (i === st.l) smi += '/';
    if (i === st.l + 2) smi += st.cis ? '\\' : '/';
    smi += 'C';
    for (const f of subs[i]) smi += `(${f})`;
    if (i < n) smi += bondOrder[i] === 2 ? '=' : bondOrder[i] === 3 ? '#' : '';
  }
  return smi;
}

function build(r) {
  let mol;
  try { mol = parseSmiles(r.smiles); } catch (e) {
    return fail([...(r.issues || []), issue('build', 'That name does not describe a valid structure.')]);
  }
  // Valence check: no carbon may exceed 4 bonds.
  for (const a of mol.atoms) {
    const sum = a.bonds.reduce((acc, bid) => acc + mol.bonds[bid].order, 0);
    const max = { C: 4, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 }[a.el];
    if (max != null && !a.charge && !a.bracket && sum > max) {
      return fail([...(r.issues || []), issue('valence', `That name gives a ${a.el} with ${sum} bonds — ${a.el === 'C' ? 'carbon can only have 4' : 'too many'}.`)]);
    }
  }
  return { ok: true, ...r, mol };
}
