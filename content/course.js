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
import l11 from './lectures/l11.js';
import l12 from './lectures/l12.js';
import l13 from './lectures/l13.js';
import l14 from './lectures/l14.js';
import l15 from './lectures/l15.js';

export const LECTURES = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12, l13, l14, l15];

export const COURSE = {
  code: 'C102',
  title: 'Elementary Chemistry II',
  school: 'IU South Bend',
  textbook: 'Smith, General, Organic & Biological Chemistry',
  // Bump when content changes so the app can show "what's new".
  contentVersion: '2026.10.25',
  lectures: LECTURES,
};

// Shown on the "What's new" screen after an update. Newest first.
export const CHANGELOG = [
  {
    version: '2026.10.25',
    title: 'New: Lectures 13, 14 & 15 (lipids and carbohydrates)',
    items: [
      'Lecture 13, Lipids: fatty acids and melting points, omega-3s, triacylglycerols, fats vs oils, trans fats, lipases, soap and phospholipids',
      'Lecture 14, Lipids & the Body: olestra, cell membranes and transport, cholesterol with LDL and HDL, steroid hormones, vitamins A, D, E and K, prostaglandins and COX enzymes',
      'Lecture 15, Carbohydrates: aldoses and ketoses, Fischer projections, D and L sugars, glucose and diabetes, and the α and β ring forms, with new sugar drawings',
      'New Sea Lion Splash decks (Lipid Lagoon and Sugar Shoals), 33 new Word Splash words and 10 new nursing connections',
      'After each update, a "What\'s new" pop-up shows what changed. Every update is listed under More → What\'s new',
      'Fixes: long formulas and the Lecture 12 overview no longer run off narrow phone screens, and a few practice questions are worded more clearly',
    ],
  },
  {
    version: '2026.10.13',
    title: 'Every lecture checked against the slides',
    items: [
      'Lectures 1–10 now include every worked example and practice problem from the slides (Sample Problems 11.4, 14.6, 16.1 and 17.1, the "circle the main product" and "which are chiral?" sets, and more)',
      'Slide data added: boiling points, the full Ka and buffer tables, pH in the body, vitamin names, and the ether anesthetics (isoflurane, enflurane, methoxyflurane)',
      'About 60 new practice questions and 30 new flashcards built from the slides',
      'Steroid hormones and cholesterol are now drawn the way the textbook draws them',
    ],
  },
  {
    version: '2026.10.12',
    title: 'New: Lectures 11 & 12 (amines and the body)',
    items: [
      'Lecture 11, Amines: classifying, shape, naming (N-methyl-2-propanamine, triethylamine), boiling points, caffeine, nicotine, morphine and other alkaloids, and ammonium salts',
      'Lecture 12, Amines & the Body: drugs as ammonium salts, the nervous system, agonists and antagonists, acetylcholine, dopamine, serotonin, epinephrine and antihistamines',
      'Unlimited practice for both, Name Lab support for amines, 38 new flashcards, new nursing connections, an amine + HCl reaction on the map, 37 new Word Splash words, and two new Sea Lion Splash decks',
    ],
  },
  {
    version: '2026.10.01.3',
    title: 'New game: Word Splash 🟩🟨',
    items: [
      'Guess the chemistry word in 6 tries: a new daily word, plus unlimited practice by lecture',
      'Each word shows what it means, its structure, and a link to the notes',
      'One fish wallet for both games (More → Games), and fish earned on two devices always add up',
    ],
  },
  {
    version: '2026.10.01.2',
    title: 'Your progress, always saved to your Google account',
    items: [
      'Sign in with Google when you open the app, and you stay signed in',
      'The cloud at the top shows your progress is saved (green check = saved to your account)',
      'Updates now install by themselves when you open the app',
    ],
  },
  {
    version: '2026.10.01',
    title: 'A clearer reaction map, nursing connections, and a "This confused me" button',
    items: [
      'Reaction map: a tappable map that fits your phone, a reagent decoder, how to draw each product, common traps, and a "Quiz me" mode',
      'Nursing connections: how each topic shows up in nursing (in the notes, and all together under Reference → Nursing)',
      'Stuck on something? Tap "This confused me" on any question, note, flashcard or reaction, so it can be explained better',
    ],
  },
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

// The updates this device hasn't seen yet, newest first (at most `max`). Nothing for a first visit.
export function changesSince(seen, max = 3) {
  if (!seen) return [];
  const i = CHANGELOG.findIndex((c) => c.version === seen);
  return CHANGELOG.slice(0, i < 0 ? 1 : i).slice(0, max);
}

// '2026.10.01.3' → 'October 1, 2026'
export function changeDate(version) {
  const [y, m, d] = version.split('.').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

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
