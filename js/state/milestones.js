// Milestones unlock the encouragement notes in content/messages.js.
import { streak, lectureProgress } from './progress.js';

export function earnedMilestones(state, course, now = Date.now()) {
  const out = [];
  let q = 0, cards = 0;
  for (const a of Object.values(state.activity)) { q += a.q || 0; cards += a.cards || 0; }
  if (state.sessions.length >= 1) out.push('first-session');
  const st = streak(state);
  if (st.current >= 3) out.push('streak-3');
  if (st.current >= 7) out.push('streak-7');
  if (st.current >= 14) out.push('streak-14');
  if (q >= 100) out.push('questions-100');
  if (q >= 500) out.push('questions-500');
  if (cards >= 100) out.push('cards-100');
  const tested = course.lectures.filter((l) => l.tested);
  if (tested.length && tested.every((l) => lectureProgress(state, l, now).mastery >= 0.8)) out.push('bootcamp-done');
  if (course.lectures.some((l) => lectureProgress(state, l, now).mastery >= 0.9)) out.push('lecture-mastered');
  return out;
}

export function newMilestones(state, course, now = Date.now()) {
  return earnedMilestones(state, course, now).filter((id) => !state.unlocked[id]);
}
