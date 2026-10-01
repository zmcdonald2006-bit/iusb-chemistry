import { describe, it, expect } from './harness.js';
import {
  createStore, memoryStorage, defaultState, migrate, mergeStates, dayKey, addDays, daysBetween,
  recordAttempt, markSectionRead, STORAGE_KEY, SCHEMA_VERSION,
} from '../js/state/store.js';
import { schedule, buildQueue, isDue, previewIntervals } from '../js/state/srs.js';
import { skillStats, streak, recommendations, lectureProgress, nextUnreadSection } from '../js/state/progress.js';

const T0 = new Date(2026, 8, 29, 10).getTime(); // Sep 29 2026 local
const DAY = 86400000;

describe('Dates', () => {
  it('formats and shifts local days', () => {
    expect(dayKey(T0)).toBe('2026-09-29');
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-09-29', '2026-10-02')).toBe(3);
    expect(daysBetween('2026-10-02', '2026-09-29')).toBe(-3);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2); // across DST change
  });
});

describe('Store', () => {
  it('starts with defaults and persists updates', () => {
    const storage = memoryStorage();
    const s = createStore({ storage, debounceMs: 0, now: () => T0 });
    expect(s.get().schema).toBe(SCHEMA_VERSION);
    s.update((st) => { st.profile.name = 'Test'; });
    const s2 = createStore({ storage, debounceMs: 0, now: () => T0 });
    expect(s2.get().profile.name).toBe('Test');
  });
  it('notifies subscribers', () => {
    const s = createStore({ storage: memoryStorage(), debounceMs: 0 });
    let calls = 0;
    const off = s.subscribe(() => calls++);
    s.update(() => {});
    off();
    s.update(() => {});
    expect(calls).toBe(1);
  });
  it('survives corrupt storage and keeps a copy of it', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    const s = createStore({ storage, debounceMs: 0, now: () => T0 });
    expect(s.get().profile.onboarded).toBe(false);
    expect(storage.getItem(`${STORAGE_KEY}:corrupt:${T0}`)).toBe('{not json');
  });
  it('keeps working when storage throws (private mode / quota)', () => {
    const bad = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} };
    const s = createStore({ storage: bad, debounceMs: 0 });
    s.update((st) => { st.profile.name = 'x'; });
    expect(s.storageOk).toBe(false);
    expect(s.get().profile.name).toBe('x');
  });
  it('exports and re-imports a backup', () => {
    const a = createStore({ storage: memoryStorage(), debounceMs: 0, now: () => T0 });
    a.update((st) => { st.profile.name = 'Backup'; recordAttempt(st, { skill: 'l03.naming', ok: true, ts: T0 }); });
    const json = a.exportData();
    const b = createStore({ storage: memoryStorage(), debounceMs: 0, now: () => T0 });
    expect(b.importData(json).ok).toBe(true);
    expect(b.get().profile.name).toBe('Backup');
    expect(b.get().skills['l03.naming'].n).toBe(1);
  });
  it('rejects bad backups with a clear message', () => {
    const s = createStore({ storage: memoryStorage(), debounceMs: 0 });
    expect(s.importData('nope').ok).toBe(false);
    expect(s.importData('{"hello":1}').error).toContain("doesn't look like");
    expect(s.importData(JSON.stringify({ app: 'chem-companion', data: { schema: 999 } })).error).toContain('newer version');
  });
  it('never lets an idle tab overwrite progress saved by another tab', () => {
    const storage = memoryStorage();
    const tabA = createStore({ storage, debounceMs: 0, now: () => T0 });
    const tabB = createStore({ storage, debounceMs: 0, now: () => T0 });
    tabA.update((st) => { recordAttempt(st, { skill: 'l03.naming', ok: true, ts: T0 }); });
    tabB.flush(); // tab B is hidden/closed with nothing new
    const fresh = createStore({ storage, debounceMs: 0, now: () => T0 });
    expect(fresh.get().skills['l03.naming'].n).toBe(1);
  });
  it('picks up progress saved by another tab', () => {
    const storage = memoryStorage();
    const tabA = createStore({ storage, debounceMs: 0, now: () => T0 });
    const tabB = createStore({ storage, debounceMs: 0, now: () => T0 });
    expect(tabB.reload()).toBe(false);
    tabA.update((st) => { st.profile.name = 'Synced'; recordAttempt(st, { skill: 'l03.naming', ok: true, ts: T0 }); });
    let notified = 0;
    tabB.subscribe(() => notified++);
    expect(tabB.reload()).toBe(true);
    expect(tabB.get().profile.name).toBe('Synced');
    expect(notified).toBe(1);
    expect(tabB.reload()).toBe(false);
    tabB.update((st) => { recordAttempt(st, { skill: 'l03.naming', ok: false, ts: T0 + 1 }); });
    expect(tabA.reload()).toBe(true);
    expect(tabA.get().skills['l03.naming'].n).toBe(2);
  });
  it('merges unsaved changes with another tab\'s save', () => {
    const storage = memoryStorage();
    const pending = [];
    const tabA = createStore({ storage, debounceMs: 0, now: () => T0 });
    const tabB = createStore({ storage, debounceMs: 250, now: () => T0, schedule: (fn) => { pending.push(fn); return pending.length; } });
    tabB.update((st) => { recordAttempt(st, { skill: 'l04.naming', ok: true, ts: T0 }); }); // not saved yet
    tabA.update((st) => { recordAttempt(st, { skill: 'l03.naming', ok: true, ts: T0 + 5 }); });
    expect(tabB.reload()).toBe(true);
    const merged = createStore({ storage, debounceMs: 0, now: () => T0 }).get();
    expect(merged.skills['l03.naming'].n).toBe(1);
    expect(merged.skills['l04.naming'].n).toBe(1);
  });
  it('fills defaults when migrating older data', () => {
    const m = migrate({ schema: 1, profile: { name: 'Old' } });
    expect(m.profile.name).toBe('Old');
    expect(m.profile.dailyGoal).toBe(20);
    expect(Array.isArray(m.sessions)).toBe(true);
    expect(typeof m.cards).toBe('object');
  });
});

describe('Recording attempts & mistakes', () => {
  it('tracks skills, activity and clears mistakes after two correct', () => {
    const st = defaultState(T0);
    const ref = { key: 'q:l03-q01', id: 'l03-q01' };
    recordAttempt(st, { skill: 's', qid: 'l03-q01', ok: false, ts: T0, ref });
    expect(st.mistakes['q:l03-q01'].count).toBe(1);
    recordAttempt(st, { skill: 's', qid: 'l03-q01', ok: true, ts: T0 + 1, ref });
    expect(st.mistakes['q:l03-q01'].cleared).toBe(false);
    recordAttempt(st, { skill: 's', qid: 'l03-q01', ok: true, ts: T0 + 2, ref });
    expect(st.mistakes['q:l03-q01'].cleared).toBe(true);
    expect(st.skills.s.n).toBe(3);
    expect(st.activity['2026-09-29'].q).toBe(3);
    expect(st.questions['l03-q01'].c).toBe(2);
  });
  it('caps history length', () => {
    const st = defaultState(T0);
    for (let i = 0; i < 100; i++) recordAttempt(st, { skill: 's', ok: true, ts: T0 + i });
    expect(st.skills.s.h.length).toBe(40);
    expect(st.skills.s.n).toBe(100);
  });
});

describe('Merging two devices', () => {
  it('unions progress without double counting', () => {
    const a = defaultState(T0), b = defaultState(T0);
    recordAttempt(a, { skill: 's', ok: true, ts: T0 });
    recordAttempt(b, { skill: 's', ok: false, ts: T0 + 5 });
    recordAttempt(b, { skill: 't', ok: true, ts: T0 + 6 });
    markSectionRead(b, 'l01', 'intro', T0);
    a.cards.c1 = { due: '2026-10-01', ivl: 2, ease: 2.5, reps: 2, lapses: 0, last: T0 };
    b.cards.c1 = { due: '2026-10-05', ivl: 6, ease: 2.5, reps: 3, lapses: 0, last: T0 + 99 };
    a.activity['2026-09-29'] = { q: 5 };
    b.activity['2026-09-29'] = { q: 3, cards: 4 };
    const m = mergeStates(a, b);
    expect(m.skills.s.h.length).toBe(2);
    expect(!!m.skills.t).toBe(true);
    expect(!!m.lessons.l01.read.intro).toBe(true);
    expect(m.cards.c1.due).toBe('2026-10-05');
    expect(m.activity['2026-09-29']).toEqual({ q: 5, cards: 4 });
    // merging the same data twice is stable
    const m2 = mergeStates(m, b);
    expect(m2.skills.s.h.length).toBe(2);
  });
  it('merges via store import', () => {
    const a = createStore({ storage: memoryStorage(), debounceMs: 0, now: () => T0 });
    a.update((st) => recordAttempt(st, { skill: 'x', ok: true, ts: T0 }));
    const b = createStore({ storage: memoryStorage(), debounceMs: 0, now: () => T0 });
    b.update((st) => recordAttempt(st, { skill: 'y', ok: true, ts: T0 }));
    expect(a.importData(b.exportData(), { mode: 'merge' }).ok).toBe(true);
    expect(!!a.get().skills.x && !!a.get().skills.y).toBe(true);
  });
});

describe('Spaced repetition', () => {
  const today = '2026-09-29';
  it('schedules a new card', () => {
    expect(schedule(null, 2, today).due).toBe('2026-09-30');
    expect(schedule(null, 3, today).due).toBe('2026-10-02');
    expect(schedule(null, 0, today).due).toBe(today);
  });
  it('grows intervals with Good answers', () => {
    let c = schedule(null, 2, today);
    let d = today;
    const ivls = [];
    for (let i = 0; i < 5; i++) {
      d = c.due;
      c = schedule(c, 2, d);
      ivls.push(c.ivl);
    }
    for (let i = 1; i < ivls.length; i++) expect(ivls[i]).toBeGreaterThan(ivls[i - 1]);
    expect(ivls[ivls.length - 1]).toBeLessThan(181);
  });
  it('resets on a lapse and lowers ease', () => {
    let c = schedule(null, 2, today);
    c = schedule(c, 2, c.due);
    const ease = c.ease;
    c = schedule(c, 0, c.due);
    expect(c.reps).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeLessThan(ease);
  });
  it('builds a queue with due cards and a new-card limit', () => {
    const cards = [1, 2, 3, 4, 5].map((i) => ({ id: `c${i}`, lecture: 'l01' }));
    const st = defaultState(T0);
    st.cards.c1 = { due: '2026-09-20', ivl: 3 };
    st.cards.c2 = { due: '2026-09-28', ivl: 3 };
    st.cards.c3 = { due: '2026-12-01', ivl: 30 };
    const q = buildQueue(cards, st, today, { newLimit: 1 });
    expect(q.due.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(q.fresh.length).toBe(1);
    expect(isDue(st.cards.c3, today)).toBe(false);
    expect(previewIntervals(null, today).map((p) => p.text)).toEqual(['now', '1 day', '1 day', '3 days']);
  });
});

describe('Progress', () => {
  it('scores skills with recency and confidence', () => {
    const st = defaultState(T0);
    expect(skillStats(st, 'z', T0).level).toBe(0);
    for (let i = 0; i < 10; i++) recordAttempt(st, { skill: 'z', ok: true, ts: T0 + i });
    expect(skillStats(st, 'z', T0 + 100).level).toBe(4);
    for (let i = 0; i < 6; i++) recordAttempt(st, { skill: 'z', ok: false, ts: T0 + 100 + i });
    expect(skillStats(st, 'z', T0 + 200).level).toBeLessThan(3);
    // a couple of lucky answers is not mastery
    recordAttempt(st, { skill: 'w', ok: true, ts: T0 });
    recordAttempt(st, { skill: 'w', ok: true, ts: T0 });
    expect(skillStats(st, 'w', T0).level).toBeLessThan(4);
  });
  it('counts streaks', () => {
    const st = defaultState(T0);
    const today = dayKey(T0);
    for (const d of [0, -1, -2, -4]) st.activity[addDays(today, d)] = { q: 5 };
    expect(streak(st, today).current).toBe(3);
    // no activity yet today keeps yesterday's streak alive
    delete st.activity[today];
    expect(streak(st, today).current).toBe(2);
    expect(streak(st, today).best).toBe(2);
  });
  it('recommends useful next steps', () => {
    const course = {
      lectures: [
        { id: 'l01', number: 1, title: 'Intro', tested: true, skills: [{ id: 'l01.a', title: 'A' }], sections: [{ id: 's1', title: 'S1' }] },
        { id: 'l02', number: 2, title: 'FG', tested: false, skills: [{ id: 'l02.a', title: 'B' }], sections: [{ id: 's1', title: 'S1' }] },
      ],
    };
    const st = defaultState(T0);
    for (let i = 0; i < 6; i++) recordAttempt(st, { skill: 'l01.a', ok: i % 3 === 0, ts: T0 + i });
    const recs = recommendations(st, course, [{ id: 'c1', lecture: 'l01' }], { today: dayKey(T0), now: T0 + 10 });
    const kinds = recs.map((r) => r.kind);
    expect(kinds).toContain('weak');
    expect(kinds).toContain('read');
    expect(kinds).toContain('bootcamp');
    expect(recs.length).toBeLessThan(5);
    expect(lectureProgress(st, course.lectures[0], T0).started).toBe(true);
    markSectionRead(st, 'l01', 's1', T0);
    expect(nextUnreadSection(st, course).lecture.id).toBe('l02');
  });
});
