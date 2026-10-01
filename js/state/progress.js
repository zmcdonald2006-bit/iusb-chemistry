// Derived progress numbers: skill mastery, lecture progress, streaks, recommendations.
import { dayKey, addDays, daysBetween } from './store.js';
import { deckCounts } from './srs.js';

export const LEVELS = [
  { id: 0, label: 'Not started', short: 'New' },
  { id: 1, label: 'Needs work', short: 'Weak' },
  { id: 2, label: 'Getting there', short: 'Okay' },
  { id: 3, label: 'Solid', short: 'Solid' },
  { id: 4, label: 'Mastered', short: 'Mastered' },
];

export function skillStats(state, skillId, now = Date.now()) {
  const sk = state.skills[skillId];
  if (!sk || !sk.h || !sk.h.length) return { p: 0, acc: 0, n: 0, level: 0, label: LEVELS[0].label, stale: false };
  const recent = sk.h.slice(-12);
  let w = 0, s = 0;
  recent.forEach(([, ok], i) => {
    const wt = Math.pow(0.85, recent.length - 1 - i);
    w += wt;
    s += wt * ok;
  });
  const acc = s / w;
  const conf = Math.min(1, recent.length / 8);
  const days = (now - (sk.last || now)) / 86400000;
  const fade = days > 21 ? 0.85 : days > 10 ? 0.93 : 1;
  const p = acc * (0.4 + 0.6 * conf) * fade;
  let level;
  if (acc >= 0.9 && conf >= 1 && fade === 1) level = 4;
  else if (p >= 0.75) level = 3;
  else if (p >= 0.5) level = 2;
  else level = 1;
  return { p, acc, n: sk.n || recent.length, level, label: LEVELS[level].label, stale: days > 10 };
}

export function lectureProgress(state, lecture, now = Date.now()) {
  const skills = lecture.skills.map((sk) => ({ ...sk, stats: skillStats(state, sk.id, now) }));
  const mastery = skills.length ? skills.reduce((a, s) => a + s.stats.p, 0) / skills.length : 0;
  const read = state.lessons[lecture.id] ? Object.keys(state.lessons[lecture.id].read || {}).filter((sid) => lecture.sections.some((x) => x.id === sid)).length : 0;
  const started = skills.some((s) => s.stats.n > 0) || read > 0;
  return { mastery, read, totalSections: lecture.sections.length, readPct: lecture.sections.length ? read / lecture.sections.length : 0, skills, started };
}

export function overallProgress(state, course, now = Date.now()) {
  const per = course.lectures.map((l) => lectureProgress(state, l, now));
  const mastery = per.length ? per.reduce((a, p) => a + p.mastery, 0) / per.length : 0;
  let q = 0, c = 0, secs = 0;
  for (const a of Object.values(state.activity)) { q += a.q || 0; c += a.c || 0; secs += a.secs || 0; }
  return { mastery, per, questions: q, correct: c, accuracy: q ? c / q : 0, minutes: Math.round(secs / 60) };
}

export function isActiveDay(a) {
  return !!a && ((a.q || 0) >= 3 || (a.cards || 0) >= 5 || (a.read || 0) >= 1 || (a.secs || 0) >= 300);
}

export function streak(state, today = dayKey()) {
  let cur = 0;
  let d = today;
  if (!isActiveDay(state.activity[d])) d = addDays(d, -1);
  while (isActiveDay(state.activity[d])) { cur++; d = addDays(d, -1); }
  // best streak
  const days = Object.keys(state.activity).filter((k) => isActiveDay(state.activity[k])).sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current: cur, best: Math.max(best, cur), activeToday: isActiveDay(state.activity[today]) };
}

export function todayStats(state, today = dayKey()) {
  const a = state.activity[today] || {};
  return { q: a.q || 0, c: a.c || 0, cards: a.cards || 0, minutes: Math.round((a.secs || 0) / 60), read: a.read || 0 };
}

export function upcomingExams(state, today = dayKey()) {
  return state.exams
    .filter((e) => !e.deleted && e.date && daysBetween(today, e.date) >= 0 && !e.done)
    .map((e) => ({ ...e, daysLeft: daysBetween(today, e.date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function weakSkills(state, course, { lectures = null, limit = 5, now = Date.now() } = {}) {
  const out = [];
  for (const l of course.lectures) {
    if (lectures && !lectures.includes(l.id)) continue;
    for (const sk of l.skills) {
      const st = skillStats(state, sk.id, now);
      out.push({ lecture: l, skill: sk, stats: st });
    }
  }
  const attempted = out.filter((x) => x.stats.n > 0).sort((a, b) => a.stats.p - b.stats.p);
  return attempted.slice(0, limit);
}

export function nextUnreadSection(state, course) {
  // Prefer the lecture she looked at most recently, then the first lecture with unread sections.
  const byRecent = [...course.lectures].sort((a, b) => ((state.lessons[b.id] || {}).lastVisit || 0) - ((state.lessons[a.id] || {}).lastVisit || 0));
  for (const l of byRecent) {
    const read = (state.lessons[l.id] || {}).read || {};
    if (!(state.lessons[l.id] || {}).lastVisit) continue;
    const next = l.sections.find((s) => !read[s.id]);
    if (next) return { lecture: l, section: next };
  }
  for (const l of course.lectures) {
    const read = (state.lessons[l.id] || {}).read || {};
    const next = l.sections.find((s) => !read[s.id]);
    if (next) return { lecture: l, section: next };
  }
  return null;
}

export function openMistakes(state) {
  return Object.entries(state.mistakes).filter(([, m]) => !m.cleared).map(([k, m]) => ({ key: k, ...m }));
}

export function recommendations(state, course, allCards, { today = dayKey(), now = Date.now() } = {}) {
  const recs = [];
  const exams = upcomingExams(state, today);
  const exam = exams.find((e) => e.daysLeft <= 21);
  const counts = deckCounts(allCards, state, today);
  const due = Object.values(counts).reduce((a, c) => a + c.due, 0);
  if (due > 0) {
    recs.push({ kind: 'cards', icon: 'cards', title: `Review ${due} flashcard${due === 1 ? '' : 's'}`, subtitle: `About ${Math.max(1, Math.round(due * 0.2))} min · keeps them in long-term memory`, href: '#/cards/review' });
  }
  if (exam) {
    const lecs = exam.lectures && exam.lectures.length ? exam.lectures : course.lectures.map((l) => l.id);
    const weak = weakSkills(state, course, { lectures: lecs, limit: 1, now })[0];
    recs.push({
      kind: 'exam', icon: 'target',
      title: exam.daysLeft === 0 ? `${exam.title} is today — quick warm-up` : `${exam.title} in ${exam.daysLeft} day${exam.daysLeft === 1 ? '' : 's'}`,
      subtitle: weak ? `Weakest spot: ${weak.skill.title} (${Math.round(weak.stats.p * 100)}%)` : 'Take a practice exam to see where you stand',
      href: `#/practice/exam?lectures=${lecs.join(',')}`,
    });
  }
  const weak = weakSkills(state, course, { limit: 3, now }).filter((w) => w.stats.p < 0.7);
  if (weak.length) {
    const w = weak[0];
    recs.push({ kind: 'weak', icon: 'bolt', title: `Strengthen: ${w.skill.title}`, subtitle: `Lecture ${w.lecture.number} · ${Math.round(w.stats.p * 100)}% mastery`, href: `#/practice/skill/${w.skill.id}` });
  }
  const mistakes = openMistakes(state);
  if (mistakes.length >= 3) {
    recs.push({ kind: 'mistakes', icon: 'redo', title: `Fix ${mistakes.length} past mistakes`, subtitle: 'Get each one right twice to clear it', href: '#/practice/mistakes' });
  }
  const next = nextUnreadSection(state, course);
  if (next) {
    recs.push({ kind: 'read', icon: 'book', title: `Continue: ${next.section.title}`, subtitle: `Lecture ${next.lecture.number} · ${next.lecture.title}`, href: `#/learn/${next.lecture.id}/${next.section.id}` });
  }
  const foundations = course.lectures.filter((l) => l.tested);
  if (foundations.length) {
    const fm = foundations.map((l) => lectureProgress(state, l, now).mastery);
    const avg = fm.reduce((a, b) => a + b, 0) / fm.length;
    if (avg < 0.75) {
      recs.push({ kind: 'bootcamp', icon: 'spark', title: 'Foundations Bootcamp', subtitle: `Rebuild Lectures 1–${foundations[foundations.length - 1].number} · ${Math.round(avg * 100)}% so far`, href: '#/bootcamp' });
    }
  }
  if (!recs.length) recs.push({ kind: 'mixed', icon: 'shuffle', title: 'Mixed review', subtitle: 'A little of everything you have covered', href: '#/practice/mixed' });
  return recs.slice(0, 4);
}
