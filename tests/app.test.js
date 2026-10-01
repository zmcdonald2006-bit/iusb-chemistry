import { describe, it, expect } from './harness.js';
import { markup, inline, escapeHtml, plain } from '../js/lib/markup.js';
import { parseHash, matchRoute } from '../js/router.js';
import { pickItems, createSession, summarize, sessionRecord, extendSession } from '../js/quiz/session.js';
import { earnedMilestones, newMilestones } from '../js/state/milestones.js';
import { defaultState, recordAttempt, dayKey, addDays } from '../js/state/store.js';
import { LECTURES, COURSE, lectureById, skillById } from '../content/course.js';
import { BOOTCAMP } from '../content/bootcamp.js';
import { questionFromRef, authoredQuestions } from '../js/quiz/bank.js';
import { makeRng } from '../js/lib/random.js';

const T0 = new Date(2026, 8, 29, 10).getTime();

describe('Markup', () => {
  it('escapes HTML so content can never inject markup', () => {
    expect(inline('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeHtml('"&\'')).toBe('&quot;&amp;&#39;');
  });
  it('formats bold, italics, super/subscripts and formulas', () => {
    expect(inline('**bold** and *it*')).toBe('<strong>bold</strong> and <em>it</em>');
    expect(inline('$H2O$')).toBe('<span class="f">H<sub>2</sub>O</span>');
    expect(inline('$C_nH_{2n+2}$')).toBe('<span class="f">C<sub>n</sub>H<sub>2n+2</sub></span>');
    expect(inline('$H_3O^+^$')).toBe('<span class="f">H<sub>3</sub>O<sup>+</sup></span>');
    expect(inline('10^−5^')).toBe('10<sup>−5</sup>');
    expect(inline('$CH3(CH2)4CH3$')).toBe('<span class="f">CH<sub>3</sub>(CH<sub>2</sub>)<sub>4</sub>CH<sub>3</sub></span>');
  });
  it('only allows in-app or https links', () => {
    expect(inline('[go](#/learn)')).toContain('href="#/learn"');
    expect(inline('[x](javascript:alert(1))')).toBe('[x](javascript:alert(1))');
    expect(inline('[x](https://iusb.edu)')).toContain('rel="noopener"');
  });
  it('builds paragraphs and lists', () => {
    expect(markup('a\n\nb')).toBe('<p>a</p><p>b</p>');
    expect(markup('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(markup('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>');
    expect(plain('**Hi** $H_2O$')).toBe('Hi H2O');
  });
});

describe('Router', () => {
  const routes = [{ path: '/' }, { path: '/learn/:lid' }, { path: '/learn/:lid/:sid' }, { path: '*' }];
  it('parses hashes with queries', () => {
    expect(parseHash('#/practice/exam?lectures=l05,l06')).toEqual({ path: '/practice/exam', query: { lectures: 'l05,l06' } });
    expect(parseHash('')).toEqual({ path: '/', query: {} });
  });
  it('matches params', () => {
    expect(matchRoute(routes, '/learn/l03').params).toEqual({ lid: 'l03' });
    expect(matchRoute(routes, '/learn/l03/naming').params).toEqual({ lid: 'l03', sid: 'naming' });
    expect(matchRoute(routes, '/nope/x/y/z')).toBeNull();
  });
});

describe('Session planning', () => {
  const l3 = lectureById('l03');
  const skills = l3.skills.map((s) => s.id);
  it('picks the requested number of questions from the given skills only', () => {
    const items = pickItems(defaultState(T0), skills, 20, { seed: 1, now: T0 });
    expect(items.length).toBe(20);
    for (const it of items) if (!skills.includes(it.skill)) throw new Error(`unexpected skill ${it.skill}`);
  });
  it('never repeats an authored question within a session', () => {
    const items = pickItems(defaultState(T0), skills, 40, { seed: 2, now: T0 });
    const ids = items.filter((i) => i.ref.id).map((i) => i.ref.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('can rebuild every planned question', () => {
    const items = pickItems(defaultState(T0), LECTURES.flatMap((l) => l.skills.map((s) => s.id)), 60, { seed: 3, now: T0 });
    for (const it of items) if (!questionFromRef(it.ref)) throw new Error(`cannot rebuild ${JSON.stringify(it.ref)}`);
  });
  it('favors weak skills', () => {
    const st = defaultState(T0);
    for (const s of skills) for (let i = 0; i < 10; i++) recordAttempt(st, { skill: s, ok: s !== 'l03.naming', ts: T0 - 1000 + i });
    const items = pickItems(st, skills, 200, { seed: 4, now: T0 });
    const naming = items.filter((i) => i.skill === 'l03.naming').length;
    expect(naming).toBeGreaterThan(200 / skills.length);
  });
  it('spreads exam questions evenly across skills', () => {
    const items = pickItems(defaultState(T0), skills, skills.length * 2, { seed: 5, now: T0, spread: true });
    for (const s of skills) expect(items.filter((i) => i.skill === s).length).toBe(2);
  });
  it('builds mistake-review sessions from the notebook', () => {
    const st = defaultState(T0);
    const q = authoredQuestions().find((x) => x.skill === 'l03.naming');
    recordAttempt(st, { skill: q.skill, qid: q.id, ok: false, ts: T0, ref: q.ref });
    const s = createSession(st, { mode: 'mistakes', title: 'x', now: T0 });
    expect(s.items.length).toBe(1);
    expect(s.items[0].ref.id).toBe(q.id);
  });
  it('summarizes and extends sessions', () => {
    const st = defaultState(T0);
    const s = createSession(st, { mode: 'drill', title: 'd', skills: ['l03.naming'], count: 4, now: T0 });
    s.answers = [{ ref: s.items[0].ref, skill: 'l03.naming', ok: true, ms: 1000 }, { ref: s.items[1].ref, skill: 'l03.naming', ok: false, ms: 2000 }];
    const sum = summarize(s);
    expect(sum.total).toBe(2);
    expect(sum.correct).toBe(1);
    expect(sessionRecord(s).results.length).toBe(2);
    extendSession(st, s, 5, T0);
    expect(s.items.length).toBe(9);
  });
});

describe('Milestones', () => {
  it('unlocks as progress grows', () => {
    const st = defaultState(T0);
    expect(earnedMilestones(st, COURSE, T0)).toEqual([]);
    st.sessions.push({ id: 'a' });
    const today = dayKey(T0);
    for (let d = 0; d < 3; d++) st.activity[addDays(today, -d)] = { q: 40 };
    const got = earnedMilestones(st, COURSE, T0);
    expect(got).toContain('first-session');
    expect(got).toContain('questions-100');
    st.unlocked['first-session'] = 1;
    expect(newMilestones(st, COURSE, T0)).toContain('questions-100');
    expect(newMilestones(st, COURSE, T0).includes('first-session')).toBe(false);
  });
});

describe('Foundations Bootcamp content', () => {
  it('links to real skills and sections', () => {
    for (const b of BOOTCAMP) {
      const sk = skillById(b.skill);
      if (!sk) throw new Error(`unknown skill ${b.skill}`);
      const [lid, sid] = b.section.split('/');
      const l = lectureById(lid);
      if (!l || !l.sections.some((s) => s.id === sid)) throw new Error(`bad section ${b.section}`);
      if (!sk.lecture.tested) throw new Error(`${b.skill} is not from a tested lecture`);
    }
  });
  it('is deterministic for seeded RNG', () => {
    expect(makeRng('x').next()).toBe(makeRng('x').next());
  });
});
