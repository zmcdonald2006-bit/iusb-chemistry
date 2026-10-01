// The real cloud: Firebase Authentication (Google sign-in) + Cloud Firestore.
// Loaded from Google's CDN only when sign-in is configured in js/cloud/config.js.
// Each account's progress is one document, users/{uid}; the Firestore rules in
// docs/GOOGLE_SIGN_IN.md make sure people can only read and write their own.
const VERSION = '12.19.0';
const CDN = `https://www.gstatic.com/firebasejs/${VERSION}`;

const coded = (code, message) => Object.assign(new Error(message), { code });

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '');
const isStandalone = () => typeof window !== 'undefined' && (window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(ua()) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Apps that open links in their own browser (Instagram, Facebook, Messenger, Snapchat, TikTok…): Google blocks sign-in there.
const isInAppBrowser = () => /FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|musical_ly|Line\/|LinkedInApp|Twitter|MicroMessenger/i.test(ua());

// Google sign-in runs on the auth domain (Firebase's sign-in page). When the app is served from that
// same site (Firebase Hosting), a full-page redirect is the most reliable, so phones and home-screen
// apps use it. From any other site (GitHub Pages) the redirect can't work on iPhones and newer
// browsers (they keep the two sites' storage apart, which shows "missing initial state"), so only
// the pop-up is used there.
export function signInPlan(authDomain, { host = typeof location !== 'undefined' ? location.hostname : '', mobile = isMobile(), standalone = isStandalone(), inApp = isInAppBrowser() } = {}) {
  if (inApp) return 'in-app';
  const sameSite = host === authDomain;
  if (sameSite && (mobile || standalone)) return 'redirect';
  return sameSite ? 'popup-or-redirect' : 'popup';
}

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
    // How sign-in opens depends on where the app is running (see signInPlan above).
    async signIn() {
      const plan = signInPlan(config.authDomain);
      if (plan === 'in-app') throw coded('cc/in-app-browser', 'Google doesn\'t allow signing in inside this app\'s built-in browser. Tap ⋯ (or the share button) and choose "Open in Safari" or "Open in Chrome", then sign in there.');
      if (plan === 'redirect') { await authMod.signInWithRedirect(auth, provider); return; }
      try {
        await authMod.signInWithPopup(auth, provider);
      } catch (e) {
        const blocked = e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment');
        if (blocked && plan === 'popup-or-redirect') { await authMod.signInWithRedirect(auth, provider); return; }
        if (blocked && isStandalone()) throw coded('cc/standalone', 'Google sign-in can\'t open from this home-screen app. Open the site in Safari (or Chrome) and sign in there.');
        if (blocked) throw coded('cc/popup-blocked', 'The Google sign-in window was blocked. Tap "Sign in with Google" again, or allow pop-ups for this site.');
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
