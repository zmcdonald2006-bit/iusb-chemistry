import { describe, it, expect } from './harness.js';
import { createFeedback, cleanReport, LIMITS } from '../js/state/feedback.js';
import { createStore, memoryStorage } from '../js/state/store.js';
import { createSync } from '../js/cloud/sync.js';
import { createFakeCloud } from '../js/cloud/fake.js';

const ANA = { uid: 'u-ana', name: 'Ana Lopez', email: 'ana@example.com', photo: '' };
const micro = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

// A device with the real sync engine on the fake cloud, plus the feedback outbox wired like the app.
function setup({ signedIn = false } = {}) {
  const cloud = createFakeCloud();
  const store = createStore({ storage: memoryStorage(), debounceMs: 0 });
  const sync = createSync({ store, adapter: cloud.adapter(ANA, { signedIn }), debounceMs: 0, schedule: () => 0, cancel: () => {} });
  const storage = memoryStorage();
  const fb = createFeedback({ storage, send: (r) => sync.sendFeedback(r) });
  return { cloud, sync, fb, storage };
}

const report = { kind: 'wrong', note: 'I think B is right', where: 'L5 · Oxidation of alcohols: question', item: 'l05-oxidation (seed 42)', question: 'Oxidize 2-butanol', given: '2-butanone', answer: 'butanal' };

describe('"This confused me" reports', () => {
  it('signed in: the report reaches the database with the account id', async () => {
    const { cloud, fb } = setup({ signedIn: true });
    await micro();
    expect(await fb.add(report)).toBe('sent');
    expect(cloud.feedback.length).toBe(1);
    const got = cloud.feedback[0];
    expect(got.uid).toBe('u-ana');
    expect(got.kind).toBe('wrong');
    expect(got.where).toBe(report.where);
    expect(got.given).toBe('2-butanone');
    expect(got.id === undefined).toBe(true); // the device's own queue id isn't sent
    expect(typeof got.ts).toBe('number');
    expect(fb.pending).toBe(0);
  });
  it('signed out: kept on the device, then sent after signing in', async () => {
    const { cloud, sync, fb } = setup();
    await micro();
    expect(await fb.add(report)).toBe('saved');
    expect(await fb.add({ ...report, kind: 'topic' })).toBe('saved');
    expect(fb.pending).toBe(2);
    expect(cloud.feedback.length).toBe(0);
    await sync.signIn();
    await micro(); await sync.idle(); await micro();
    await fb.flush();
    expect(cloud.feedback.length).toBe(2);
    expect(cloud.feedback.map((r) => r.kind).join()).toBe('wrong,topic'); // oldest first
    expect(fb.pending).toBe(0);
  });
  it('a failed send (offline) keeps the report for later', async () => {
    const { cloud, fb } = setup({ signedIn: true });
    await micro();
    cloud.failNext = Object.assign(new Error('offline'), { code: 'unavailable' });
    expect(await fb.add(report)).toBe('saved');
    expect(fb.pending).toBe(1);
    await fb.flush();
    expect(fb.pending).toBe(0);
    expect(cloud.feedback.length).toBe(1);
  });
  it('the queue survives a reload and is capped', async () => {
    const storage = memoryStorage();
    const off = createFeedback({ storage, send: async () => false });
    for (let i = 0; i < 60; i++) await off.add({ kind: 'other', note: `n${i}` });
    const again = createFeedback({ storage, send: async () => false });
    expect(again.pending).toBe(50);
  });
  it('cleans reports to the limits the database rules allow', () => {
    const r = cleanReport({ kind: 'nonsense', note: 'x'.repeat(5000), where: '  a \n  b ', extra: 'dropped', ts: 12.7 });
    expect(r.kind).toBe('other');
    expect(r.note.length).toBe(LIMITS.note);
    expect(r.where).toBe('a b');
    expect(r.extra === undefined).toBe(true);
    expect(r.ts).toBe(13);
    expect(r.question === undefined).toBe(true); // empty fields are left out
  });
});
