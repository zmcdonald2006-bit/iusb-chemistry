// An in-memory stand-in for Firebase, used by the tests and for trying the sign-in screens on
// localhost without a Firebase project (in the console: localStorage.setItem('cc-fake-cloud', '1')).
const clone = (x) => JSON.parse(JSON.stringify(x));
const later = (fn) => Promise.resolve().then(fn);

export function createFakeCloud({ persistKey = null } = {}) {
  const docs = new Map();
  if (persistKey) {
    try { for (const [k, v] of Object.entries(JSON.parse(localStorage.getItem(persistKey) || '{}'))) docs.set(k, v); } catch { /* ignore */ }
  }
  const persist = () => { if (persistKey) { try { localStorage.setItem(persistKey, JSON.stringify(Object.fromEntries(docs))); } catch { /* ignore */ } } };
  const subs = new Map();
  const notify = (uid) => {
    const d = docs.get(uid);
    for (const cb of subs.get(uid) || []) later(() => cb(d ? clone(d) : null));
  };

  const cloud = {
    docs,
    writes: 0,
    failNext: null, // set to an error object to make the next cloud call fail
    failWatch: null, // set to an error object to make the next live listener fail (it then stops)
    // One "device": its own sign-in state, sharing this cloud.
    adapter(user, { signedIn = false, onSignedIn = null } = {}) {
      let current = signedIn ? user : null;
      const authCbs = new Set();
      const emit = () => { if (onSignedIn) onSignedIn(!!current); for (const cb of authCbs) later(() => cb(current)); };
      const maybeFail = () => { if (cloud.failNext) { const e = cloud.failNext; cloud.failNext = null; throw e; } };
      return {
        onAuth(cb) { authCbs.add(cb); later(() => cb(current)); return () => authCbs.delete(cb); },
        async signIn() { maybeFail(); current = user; emit(); },
        async signOut() { current = null; emit(); },
        async transact(uid, fn) {
          maybeFail();
          if (!current || current.uid !== uid) throw Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
          for (let attempt = 0; attempt < 5; attempt++) {
            const before = docs.get(uid) || null;
            const res = await fn(before ? clone(before) : null);
            if ((docs.get(uid) || null) !== before) continue; // another device wrote meanwhile: retry, like Firestore
            if (res.doc) { docs.set(uid, clone(res.doc)); cloud.writes++; persist(); notify(uid); }
            return res;
          }
          throw Object.assign(new Error('Too much contention.'), { code: 'aborted' });
        },
        subscribe(uid, cb, onError) {
          if (cloud.failWatch) { const e = cloud.failWatch; cloud.failWatch = null; later(() => onError && onError(e)); return () => {}; }
          if (!subs.has(uid)) subs.set(uid, new Set());
          subs.get(uid).add(cb);
          const d = docs.get(uid);
          later(() => cb(d ? clone(d) : null));
          return () => subs.get(uid).delete(cb);
        },
        async remove(uid) { maybeFail(); docs.delete(uid); persist(); notify(uid); },
      };
    },
  };
  return cloud;
}
