// Turns on "Sign in with Google": your Firebase web app's config (Firebase → Project settings →
// Your apps). Step-by-step setup: docs/GOOGLE_SIGN_IN.md
//
// These values are meant to be public (they only identify the Firebase project; the database
// rules are what keep each person's progress private), so it's fine to commit them.
// Set this to null to turn sign-in off: progress is then saved on each device only.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCSeN4WdVaEHv81-cHMlnIfJGqEzuK6sNs',
  authDomain: 'iusb-chem.firebaseapp.com',
  projectId: 'iusb-chem',
  messagingSenderId: '545751128625',
  // The Firestore database's name (Firebase → Firestore, shown at the top). Leave this out if the
  // database is called "(default)".
  databaseId: 'chemcomp',
  // Google sign-in and the database need only the values above. (storageBucket and appId are
  // for other Firebase products; they can be added here too, but aren't required.)
};
