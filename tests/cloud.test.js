import { describe, it, expect } from './harness.js';
import { createStore, memoryStorage, recordAttempt, mergeStates, defaultState, markSectionRead, earnFish } from '../js/state/store.js';
import { createSync, syncMerge, friendlyError } from '../js/cloud/sync.js';
import { createFakeCloud } from '../js/cloud/fake.js';
import { fingerprint, encodeState, decodeState, cloudCopy } from '../js/cloud/codec.js';
import { gateMode, gateSettled } from '../js/cloud/gate.js';
import { signInPlan } from '../js/cloud/firebase.js';
import { makeRng } from '../js/lib/random.js';

const T0 = new Date(2026, 9, 1, 12).getTime();
let clock = T0;
const now = () => clock;
const later = (ms = 1000) => { clock += ms; };

const ANA = { uid: 'u-ana', name: 'Ana Lopez', email: 'ana@example.com', photo: '' };
const BEN = { uid: 'u-ben', name: 'Ben', email: 'ben@example.com', photo: '' };

// A "device": its own saved progress, signed in (or not) to the shared fake cloud.
function device(cloud, user, { signedIn = false, store = null } = {}) {
  const queue = [];
  const s = store || createStore({ storage: memoryStorage(), debounceMs: 0, now });
  const sync = createSync({ store: s, adapter: cloud.adapter(user, { signedIn }), now, debounceMs: 0, schedule: (fn) => { queue.push(fn); return queue.length; }, cancel: () => {} });
  return { store: s, sync, queue };
}

const micro = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
// Run scheduled syncs until every device is quiet. Fails if devices keep trading changes forever.
async function settle(...devs) {
  for (let round = 0; round < 80; round++) {
    await micro();
    let did = false;
    for (const d of devs) while (d.queue.length) { did = true; d.queue.shift()(); }
    for (const d of devs) await d.sync.idle();
    await micro();
    if (!did && devs.every((d) => !d.queue.length)) return round;
  }
  throw new Error('sync never settled');
}

const answer = (d, skill, ok = true, key = null) => {
  later(1000);
  d.store.update((st) => recordAttempt(st, { skill, ok, ts: now(), ref: key ? { key, gen: 'l03-name-mc', seed: 1, skill } : null }));
};
const doc = (cloud, uid) => cloud.docs.get(uid);
const cloudState = async (cloud, uid) => decodeState(doc(cloud, uid));

describe('Cloud sync: signing in', () => {
  it('first sign-in saves this device\'s progress to the account', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA);
    answer(a, 'l03.naming');
    await settle(a);
    expect(a.sync.state.status).toBe('signed-out');
    expect(cloud.docs.size).toBe(0);
    await a.sync.signIn();
    await settle(a);
    expect(a.sync.state.status).toBe('synced');
    expect(a.sync.state.user.email).toBe('ana@example.com');
    expect(a.store.get().meta.cloudUid).toBe('u-ana');
    expect((await cloudState(cloud, 'u-ana')).skills['l03.naming'].n).toBe(1);
  });
  it('a second device gets everything, and changes flow both ways live', async () => {
    const cloud = createFakeCloud();
    const phone = device(cloud, ANA, { signedIn: true });
    answer(phone, 'l03.naming');
    phone.store.update((st) => { st.profile.name = 'Ana'; st.profile.accent = 'berry'; });
    await settle(phone);
    const laptop = device(cloud, ANA, { signedIn: true });
    await settle(phone, laptop);
    expect(laptop.store.get().skills['l03.naming'].n).toBe(1);
    expect(laptop.store.get().profile.accent).toBe('berry');
    answer(laptop, 'l04.naming');
    await settle(phone, laptop);
    expect(phone.store.get().skills['l04.naming'].n).toBe(1);
    later(); phone.store.update((st) => { st.profile.dailyGoal = 35; });
    await settle(phone, laptop);
    expect(laptop.store.get().profile.dailyGoal).toBe(35);
    expect(fingerprint(phone.store.get())).toBe(fingerprint(laptop.store.get()));
  });
  it('a new device keeps the account\'s settings even though its own setup is newer', async () => {
    const cloud = createFakeCloud();
    const phone = device(cloud, ANA, { signedIn: true });
    phone.store.update((st) => { st.profile.accent = 'teal'; st.profile.dailyGoal = 30; });
    await settle(phone);
    later(60000);
    const laptop = device(cloud, ANA);
    laptop.store.update((st) => { st.profile.name = 'Ana'; st.profile.onboarded = true; }); // onboarding on the laptop
    await laptop.sync.signIn();
    await settle(phone, laptop);
    expect(laptop.store.get().profile.accent).toBe('teal');
    expect(laptop.store.get().profile.dailyGoal).toBe(30);
    expect(phone.store.get().profile.name).toBe('Ana');
  });
  it('signing in with a different account never mixes two people\'s progress', async () => {
    const cloud = createFakeCloud();
    const store = createStore({ storage: memoryStorage(), debounceMs: 0, now });
    const asAna = device(cloud, ANA, { store });
    await asAna.sync.signIn();
    answer(asAna, 'l03.naming');
    await settle(asAna);
    await asAna.sync.signOut({ keepOnDevice: true });
    await settle(asAna);
    asAna.sync.stop();
    expect(store.get().skills['l03.naming'].n).toBe(1); // still on the device
    const asBen = device(cloud, BEN, { store });
    await asBen.sync.signIn();
    await settle(asBen);
    expect(store.get().skills['l03.naming']).toBe(undefined); // Ana's progress left this device
    expect(store.get().meta.cloudUid).toBe('u-ben');
    expect((await cloudState(cloud, 'u-ben')).skills['l03.naming']).toBe(undefined);
    expect((await cloudState(cloud, 'u-ana')).skills['l03.naming'].n).toBe(1); // and is safe in her account
  });
  it('sign out can remove progress from a shared computer; signing back in restores it', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    answer(a, 'l03.naming');
    await settle(a);
    await a.sync.signOut({ keepOnDevice: false });
    await settle(a);
    expect(a.store.get().skills['l03.naming']).toBe(undefined);
    expect(a.sync.state.status).toBe('signed-out');
    await a.sync.signIn();
    await settle(a);
    expect(a.store.get().skills['l03.naming'].n).toBe(1);
  });
  it('a cancelled sign-in is quiet; real problems get a clear message', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA);
    cloud.failNext = Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' });
    await a.sync.signIn();
    expect(a.sync.state.error).toBeNull();
    expect(a.sync.state.status).toBe('signed-out');
    cloud.failNext = Object.assign(new Error('x'), { code: 'auth/unauthorized-domain' });
    await a.sync.signIn();
    expect(a.sync.state.error).toContain('Authorized domains');
    expect(friendlyError({ code: 'permission-denied' })).toContain('rules');
    expect(friendlyError({ code: 'something-new' })).toContain('safe on this device');
  });
});

describe('Cloud sync: staying correct', () => {
  it('edits made on two devices at the same time are both kept', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    const b = device(cloud, ANA, { signedIn: true });
    await settle(a, b);
    answer(a, 'l05.naming', true, 'mA');
    answer(b, 'l06.thiols', false, 'mB');
    answer(a, 'l05.naming', false);
    await settle(a, b);
    for (const d of [a, b]) {
      expect(d.store.get().skills['l05.naming'].n).toBe(2);
      expect(d.store.get().skills['l06.thiols'].n).toBe(1);
      expect(!!d.store.get().mistakes.mB).toBe(true);
    }
    expect(fingerprint(a.store.get())).toBe(fingerprint(b.store.get()));
  });
  it('keeps working offline and catches up when the connection returns', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    await settle(a);
    cloud.failNext = Object.assign(new Error('offline'), { code: 'unavailable' });
    answer(a, 'l07.find-centers');
    a.queue.shift()(); // the sync attempt that fails
    await a.sync.idle();
    expect(a.sync.state.status).toBe('offline');
    expect(a.store.get().skills['l07.find-centers'].n).toBe(1); // still saved on the device
    await settle(a); // the retry
    expect(a.sync.state.status).toBe('synced');
    expect((await cloudState(cloud, 'u-ana')).skills['l07.find-centers'].n).toBe(1);
  });
  it('signing in before the database exists says so, then syncs live once it does', async () => {
    const cloud = createFakeCloud();
    const missing = () => Object.assign(new Error('The database (default) does not exist'), { code: 'not-found' });
    const step = async (d) => { await micro(); await d.sync.idle(); await micro(); };
    // b is already signed in: its sync works, but its live listener fails
    cloud.failWatch = missing();
    const b = device(cloud, ANA, { signedIn: true });
    await step(b);
    expect(b.sync.state.status).toBe('error');
    expect(b.sync.state.error).toContain('Create database');
    // a signs in while the database is missing
    const a = device(cloud, ANA);
    answer(a, 'l03.naming');
    const signing = a.sync.signIn();
    cloud.failNext = missing();
    cloud.failWatch = missing();
    await signing;
    await step(a);
    expect(a.sync.state.status).toBe('error');
    expect(a.sync.state.error).toContain('isn\'t set up yet');
    expect(a.store.get().skills['l03.naming'].n).toBe(1); // still saved on the device
    await settle(a, b); // the retries work now: both reconnect
    expect(a.sync.state.status).toBe('synced');
    expect(b.sync.state.status).toBe('synced');
    answer(a, 'l04.isomers');
    await settle(a, b);
    expect(b.store.get().skills['l03.naming'].n).toBe(1);
    expect(b.store.get().skills['l04.isomers'].n).toBe(1); // live updates are flowing again
    answer(b, 'l05.naming');
    await settle(a, b);
    expect(a.store.get().skills['l05.naming'].n).toBe(1);
  });
  it('never loses an answer made while a sync is in flight', async () => {
    const cloud = createFakeCloud();
    const store = createStore({ storage: memoryStorage(), debounceMs: 0, now });
    const adapter = cloud.adapter(ANA, { signedIn: true });
    const transact = adapter.transact;
    let inject = true;
    adapter.transact = (uid, fn) => transact(uid, async (d) => {
      const res = await fn(d);
      if (inject) { inject = false; later(); store.update((st) => recordAttempt(st, { skill: 'l09.ph', ok: true, ts: now() })); }
      return res;
    });
    const queue = [];
    const sync = createSync({ store, adapter, now, debounceMs: 0, schedule: (fn) => { queue.push(fn); return 1; }, cancel: () => {} });
    answer({ store }, 'l03.naming');
    await settle({ store, sync, queue });
    expect(store.get().skills['l09.ph'].n).toBe(1);
    expect((await cloudState(cloud, 'u-ana')).skills['l09.ph'].n).toBe(1);
  });
  it('an unfinished quiz stays on its own device', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    a.store.update((st) => { st.active = { id: 'q1', items: [1, 2], answers: [] }; });
    const b = device(cloud, ANA, { signedIn: true });
    answer(b, 'l03.naming');
    await settle(a, b);
    expect(a.store.get().active.id).toBe('q1');
    expect(b.store.get().active).toBeNull();
    expect((await cloudState(cloud, 'u-ana')).active).toBe(undefined);
  });
  it('deleted exams stay deleted on every device', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    const b = device(cloud, ANA, { signedIn: true });
    a.store.update((st) => { st.exams.push({ id: 'e1', title: 'Exam 2', date: '2026-10-20', lectures: [], updatedAt: now() }); });
    await settle(a, b);
    expect(b.store.get().exams.length).toBe(1);
    later();
    b.store.update((st) => { const e = st.exams[0]; e.deleted = true; e.updatedAt = now(); });
    await settle(a, b);
    expect(a.store.get().exams[0].deleted).toBe(true);
  });
  it('"reset everywhere" wipes every device, and old progress never creeps back', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    const b = device(cloud, ANA, { signedIn: true });
    answer(a, 'l03.naming');
    answer(b, 'l04.naming');
    await settle(a, b);
    later();
    await a.sync.resetEverywhere();
    await settle(a, b);
    for (const d of [a, b]) expect(Object.keys(d.store.get().skills).length).toBe(0);
    answer(b, 'l05.naming');
    await settle(a, b);
    expect(Object.keys(a.store.get().skills)).toEqual(['l05.naming']);
    expect(Object.keys((await cloudState(cloud, 'u-ana')).skills)).toEqual(['l05.naming']);
  });
  it('"delete my cloud data" removes it and doesn\'t re-upload', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    answer(a, 'l03.naming');
    await settle(a);
    expect(cloud.docs.has('u-ana')).toBe(true);
    await a.sync.deleteCloudData();
    answer(a, 'l04.naming');
    await settle(a);
    expect(cloud.docs.has('u-ana')).toBe(false);
    expect(a.sync.state.status).toBe('signed-out');
    expect(a.store.get().skills['l03.naming'].n).toBe(1); // this device's copy is kept
    expect(a.store.get().meta.cloudUid).toBeNull();
  });
  it('doesn\'t write to the cloud when nothing changed', async () => {
    const cloud = createFakeCloud();
    const a = device(cloud, ANA, { signedIn: true });
    answer(a, 'l03.naming');
    await settle(a);
    const writes = cloud.writes;
    a.store.update((st) => { st.meta.lastSeenVersion = 'x'; }); // device-only setting
    await a.sync.syncNow();
    await settle(a);
    expect(cloud.writes).toBe(writes);
  });
});

// Random progress for property tests.
function randomState(seed) {
  const r = makeRng(seed);
  const st = defaultState(T0 - r.int(0, 1e7));
  const skills = ['l03.naming', 'l04.naming', 'l02.fg-id', 'l05.oxidation', 'l09.ph'];
  for (let i = 0; i < r.int(0, 30); i++) recordAttempt(st, { skill: r.pick(skills), ok: r.chance(0.6), ts: T0 + r.int(0, 50) * 1000, qid: r.chance(0.3) ? `q${r.int(1, 5)}` : null, ref: r.chance(0.4) ? { key: `k${r.int(1, 6)}`, gen: 'g', seed: 1 } : null });
  for (let i = 0; i < r.int(0, 3); i++) st.exams.push({ id: `e${r.int(1, 4)}`, title: `T${r.int(1, 9)}`, date: '2026-10-10', lectures: [], updatedAt: T0 + r.int(0, 3), deleted: r.chance(0.2) || undefined });
  for (let i = 0; i < r.int(0, 5); i++) st.cards[`c${r.int(1, 6)}`] = { last: `2026-10-0${r.int(1, 3)}`, reps: r.int(0, 3), due: '2026-10-09', ease: 2.5, interval: r.int(1, 9) };
  for (let i = 0; i < r.int(0, 3); i++) markSectionRead(st, `l0${r.int(1, 3)}`, `s${r.int(1, 3)}`, T0 + r.int(0, 9));
  for (const k of ['accent', 'dailyGoal', 'name']) if (r.chance(0.5)) { st.profile[k] = k === 'dailyGoal' ? r.int(10, 40) : `${k}${r.int(1, 3)}`; st.meta.pt[k] = T0 + r.int(0, 2); }
  if (r.chance(0.5)) { st.meta.deviceId = r.pick(['dA', 'dB', 'dC']); earnFish(st, r.int(0, 500)); st.game.owned.push(r.pick(['bow', 'goggles', 'party'])); }
  if (r.chance(0.5)) st.game.words = { days: { [`2026-10-0${r.int(1, 3)}`]: { w: r.pick(['ESTER', 'THIOL']), g: r.pick([['ETHER'], ['ETHER', 'ESTER']]), done: r.chance(0.5), won: r.chance(0.5), ts: T0 + r.int(0, 3) } }, stats: { [r.pick(['dA', 'dB'])]: { p: r.int(0, 5), w: r.int(0, 5), d: [r.int(0, 2), 0, 1, 0, 0, 0] } }, best: r.int(0, 4) };
  for (let i = 0; i < r.int(0, 3); i++) st.sessions.push({ id: `s${r.int(1, 5)}`, startedAt: T0 + r.int(0, 3), endedAt: T0 + r.int(4, 9), results: [] });
  if (r.chance(0.5)) st.unlocked[r.pick(['first-session', 'streak-3'])] = T0 + r.int(0, 5);
  return st;
}

describe('Cloud sync: merging is safe', () => {
  it('gives the same result whichever device merges first, and merging again changes nothing', () => {
    for (let i = 0; i < 150; i++) {
      const a = randomState(`a${i}`);
      const b = randomState(`b${i}`);
      const ab = mergeStates(a, b);
      const ba = mergeStates(b, a);
      if (fingerprint(ab) !== fingerprint(ba)) throw new Error(`merge depends on order (case ${i})`);
      if (fingerprint(mergeStates(ab, a)) !== fingerprint(ab)) throw new Error(`merge is not stable (case ${i})`);
      if (fingerprint(mergeStates(ab, b)) !== fingerprint(ab)) throw new Error(`merge is not stable (case ${i})`);
    }
  });
  it('devices with lots of different progress settle quickly', async () => {
    for (let i = 0; i < 12; i++) {
      const cloud = createFakeCloud();
      const a = device(cloud, ANA, { store: storeWith(randomState(`x${i}`)) });
      const b = device(cloud, ANA, { store: storeWith(randomState(`y${i}`)) });
      await a.sync.signIn();
      await b.sync.signIn();
      await settle(a, b);
      expect(fingerprint(a.store.get())).toBe(fingerprint(b.store.get()));
      expect(cloud.writes).toBeLessThan(6);
    }
  });
  it('respects resets: progress from before a reset never wins', () => {
    const old = randomState('old');
    const fresh = defaultState(T0);
    fresh.meta.epoch = T0 + 5;
    expect(Object.keys(syncMerge(old, fresh).skills).length).toBe(0);
    expect(Object.keys(syncMerge(fresh, old).skills).length).toBe(0);
  });
  it('stores only progress in the cloud (no device-only settings)', async () => {
    const st = randomState('codec');
    st.active = { id: 'x' };
    st.meta.lastSeenVersion = 'v';
    st.meta.cloudUid = 'u';
    const enc = await encodeState(st);
    const back = await decodeState(enc);
    expect(back.active).toBe(undefined);
    expect(back.meta.lastSeenVersion).toBe(undefined);
    expect(back.meta.cloudUid).toBe(undefined);
    expect(fingerprint(back)).toBe(fingerprint(st));
    expect(cloudCopy(st).skills !== undefined).toBe(true);
  });
});

describe('Cloud sync: big progress', () => {
  it('compresses large progress (in browsers) and reads it back exactly', async () => {
    if (typeof CompressionStream !== 'function') return; // runs in the browser test page
    const st = defaultState(T0);
    for (let i = 0; i < 6000; i++) st.questions[`question-with-a-long-id-${i}`] = { n: i % 7, c: i % 5, last: T0 + i, lastOk: i % 2 };
    const enc = await encodeState(st);
    expect(enc.enc).toBe('gz64');
    expect(enc.data.length).toBeLessThan(JSON.stringify(st).length / 3);
    expect(fingerprint(await decodeState(enc))).toBe(fingerprint(st));
  });
});

function storeWith(state) {
  const storage = memoryStorage();
  storage.setItem('chem-companion:v1', JSON.stringify(state));
  return createStore({ storage, debounceMs: 0, now });
}

describe('Sign-in is required', () => {
  const v = (o) => ({ enabled: true, status: 'signed-out', user: null, authReady: true, error: null, ...o });
  it('asks only once Google has said nobody is signed in', () => {
    expect(gateMode(v({ authReady: false }))).toBe('none'); // still checking: never flash the screen
    expect(gateMode(v({}))).toBe('signin');
    expect(gateMode(v({ status: 'signing-in' }))).toBe('signin');
    expect(gateMode(v({ user: ANA, status: 'syncing' }))).toBe('none');
    expect(gateMode(v({ enabled: false }))).toBe('none'); // sign-in not set up
  });
  it('never locks her out', () => {
    expect(gateMode(v({}), { online: false })).toBe('offline'); // offers "Continue offline"
    expect(gateMode(v({}), { skipped: true })).toBe('none');
    expect(gateMode(v({ authReady: false, status: 'error', error: 'Couldn\'t load Google sign-in.' }))).toBe('none');
  });
  it('first-run screens wait for a returning user\'s progress', () => {
    expect(gateSettled(v({}))).toBe(false);
    expect(gateSettled(v({ user: ANA, status: 'syncing' }))).toBe(false);
    expect(gateSettled(v({ user: ANA, status: 'synced' }))).toBe(true);
    expect(gateSettled(v({ user: ANA, status: 'offline' }))).toBe(true);
    expect(gateSettled(v({}), { skipped: true })).toBe(true);
    expect(gateSettled(v({ authReady: false, status: 'error' }))).toBe(true);
  });
  it('the sync engine reports when the sign-in state is known', async () => {
    const cloud = createFakeCloud();
    const out = device(cloud, ANA);
    expect(out.sync.state.authReady).toBe(false);
    await settle(out);
    expect(out.sync.state.authReady).toBe(true);
    expect(out.sync.state.status).toBe('signed-out');
    const inn = device(cloud, ANA, { signedIn: true });
    const seen = [];
    inn.sync.subscribe((s) => seen.push(`${s.authReady}:${s.status}`));
    await settle(inn);
    expect(inn.sync.state.authReady).toBe(true);
    expect(inn.sync.state.status).toBe('synced');
    // a signed-in device never reports "known and signed out" on the way in
    expect(seen.includes('true:signed-out')).toBe(false);
  });
});

describe('How Google sign-in opens', () => {
  const AUTH = 'iusb-chem.firebaseapp.com';
  const plan = (o) => signInPlan(AUTH, { host: 'x.github.io', mobile: false, standalone: false, inApp: false, ...o });
  it('never uses the cross-site redirect that fails on iPhones ("missing initial state")', () => {
    expect(plan({})).toBe('popup');
    expect(plan({ mobile: true })).toBe('popup');
    expect(plan({ mobile: true, standalone: true })).toBe('popup');
  });
  it('on Firebase\'s own address, phones and home-screen apps use the full-page redirect', () => {
    expect(plan({ host: AUTH, mobile: true })).toBe('redirect');
    expect(plan({ host: AUTH, standalone: true })).toBe('redirect');
    expect(plan({ host: AUTH })).toBe('popup-or-redirect');
  });
  it('in Instagram/Facebook/Snapchat browsers, says to open the page in Safari or Chrome', () => {
    expect(plan({ inApp: true })).toBe('in-app');
    expect(plan({ host: AUTH, inApp: true, mobile: true })).toBe('in-app');
  });
});
