// Course index. To add a lecture: create content/lectures/l11.js (copy an existing one),
// import it below, and add it to LECTURES. See docs/CONTENT_GUIDE.md.
import l01 from './lectures/l01.js';
import l02 from './lectures/l02.js';
import l03 from './lectures/l03.js';
import l04 from './lectures/l04.js';
import l05 from './lectures/l05.js';
import l06 from './lectures/l06.js';
import l07 from './lectures/l07.js';
import l08 from './lectures/l08.js';
import l09 from './lectures/l09.js';
import l10 from './lectures/l10.js';

export const LECTURES = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10];

export const COURSE = {
  code: 'C102',
  title: 'Elementary Chemistry II',
  school: 'IU South Bend',
  textbook: 'Smith, General, Organic & Biological Chemistry',
  // Bump when content changes so the app can show "what's new".
  contentVersion: '2026.09.30',
  lectures: LECTURES,
};

// Shown on the "What's new" screen after an update. Newest first.
export const CHANGELOG = [
  {
    version: '2026.09.30',
    title: 'New: Sea Lion Splash 🌊',
    items: [
      'A study game: swim your sea lion through the ring with the right answer',
      '11 decks, from Foundations (Lectures 1–4) to reactions and acids',
      'Catch fish to unlock outfits and oceans',
      'Misses go to your Mistakes list, and game answers count toward your mastery',
    ],
  },
  {
    version: '2026.09.29',
    title: 'Welcome!',
    items: [
      'Lectures 1–10: notes, worked examples, practice and flashcards',
      'Foundations Bootcamp to rebuild Lectures 1–4',
      'Unlimited auto-generated practice for naming, reactions, chirality and pH',
      'Name Lab: type any name and see the structure drawn',
    ],
  },
];

export function lectureById(id) {
  return LECTURES.find((l) => l.id === id) || null;
}

export function skillById(id) {
  for (const l of LECTURES) {
    const s = l.skills.find((x) => x.id === id);
    if (s) return { ...s, lecture: l };
  }
  return null;
}

// Every authored question, including the quick checks embedded in lesson sections.
export function allAuthoredQuestions() {
  const out = [];
  for (const l of LECTURES) {
    for (const q of l.questions) out.push({ ...q, lecture: l.id });
    for (const s of l.sections) {
      for (const b of s.blocks) if (b.t === 'check') out.push({ ...b.q, lecture: l.id, fromSection: s.id });
    }
  }
  return out;
}

export function allCards() {
  const out = [];
  for (const l of LECTURES) for (const c of l.cards) out.push({ ...c, lecture: l.id });
  return out;
}

export function glossary() {
  const out = [];
  for (const l of LECTURES) for (const k of l.keyTerms || []) out.push({ ...k, lecture: l.id, number: l.number });
  return out.sort((a, b) => a.term.localeCompare(b.term));
}
