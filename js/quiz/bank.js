// The question bank: authored questions from the content files plus generated ones.
import { LECTURES, allAuthoredQuestions } from '../../content/course.js';
import { nameCompound } from '../chem/namer.js';
import { generatorsForSkill, makeGenerated } from './generators.js';

// Fill in computed fields so authored questions can stay short.
export function normalizeQuestion(q) {
  const out = { ...q };
  if (!out.lecture && out.skill) out.lecture = out.skill.split('.')[0];
  if (out.type === 'name' && out.name && !out.name.name) {
    const r = nameCompound(out.name.smiles);
    out.name = { ...out.name, name: r ? r.name : '' };
  }
  if (!out.ref) out.ref = { key: `q:${out.id}`, id: out.id };
  if (out.shuffle == null && ['mc', 'multi', 'struct'].includes(out.type)) out.shuffle = true;
  return out;
}

let _authored = null;
export function authoredQuestions() {
  if (!_authored) _authored = allAuthoredQuestions().map(normalizeQuestion);
  return _authored;
}

export function authoredById(id) {
  return authoredQuestions().find((q) => q.id === id) || null;
}

export function questionsForSkill(skillId) {
  return authoredQuestions().filter((q) => q.skill === skillId);
}

export function skillsForLectures(lectureIds) {
  return LECTURES.filter((l) => lectureIds.includes(l.id)).flatMap((l) => l.skills.map((s) => s.id));
}

// Recreate any question from its saved reference (mistake notebook, resumed sessions).
export function questionFromRef(ref) {
  if (!ref) return null;
  if (ref.id) return authoredById(ref.id);
  if (ref.gen) return makeGenerated(ref.gen, ref.seed, ref.skill);
  return null;
}

export function sourcesForSkill(skillId) {
  return { authored: questionsForSkill(skillId), generators: generatorsForSkill(skillId) };
}
