// The real cloud: Firebase Authentication (Google sign-in) + Cloud Firestore.
// Loaded from Google's CDN only when sign-in is configured in js/cloud/config.js.
// Each account's progress is one document, users/{uid}; the Firestore rules in
// docs/GOOGLE_SIGN_IN.md make sure people can only read and write their own.
const VERSION = '12.19.0';
const CDN = `https://www.gstatic.com/firebasejs/${VERSION}`;

export async function createFirebaseAdapter({ databaseId, ...config }) {
  const [appMod, authMod, fsMod] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`),
  ]);
  const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(config);
  const auth = authMod.getAuth(app);
  const db = databaseId ? fsMod.getFirestore(app, databaseId) : fsMod.getFirestore(app);
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const ref = (uid) => fsMod.doc(db, 'users', uid);

  // Finishes a redirect sign-in (used when a pop-up isn't possible); errors are reported once.
  const redirect = authMod.getRedirectResult(auth).then(() => null, (e) => e);

  return {
    redirectError: () => redirect,
    onAuth(cb) {
      return authMod.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null));
    },
    async signIn() {
      try {
        await authMod.signInWithPopup(auth, provider);
      } catch (e) {
        // Some browsers and installed apps can't open pop-ups: go to Google and come back instead.
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
          await authMod.signInWithRedirect(auth, provider);
          return;
        }
        throw e;
      }
    },
    signOut: () => authMod.signOut(auth),
    transact(uid, fn) {
      return fsMod.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref(uid));
        const res = await fn(snap.exists() ? snap.data() : null);
        if (res.doc) tx.set(ref(uid), { ...res.doc, updatedAt: fsMod.serverTimestamp() });
        return res;
      });
    },
    subscribe(uid, cb, onError) {
      return fsMod.onSnapshot(ref(uid), (snap) => {
        if (snap.metadata.hasPendingWrites) return; // our own write, not yet confirmed
        cb(snap.exists() ? snap.data() : null);
      }, onError);
    },
    remove: (uid) => fsMod.deleteDoc(ref(uid)),
    addFeedback: (uid, report) => fsMod.addDoc(fsMod.collection(db, 'feedback'), { ...report, uid, createdAt: fsMod.serverTimestamp() }),
  };
}
