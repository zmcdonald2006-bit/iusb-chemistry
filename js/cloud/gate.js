// When to ask for Google sign-in. Signing in is required whenever sign-in is set up, so progress is
// always saved to the account. It never locks anyone out of studying, though: no prompt while the
// sign-in state is still being checked (or Google's sign-in couldn't load), a gentler "offline" prompt
// with "Continue offline" when there's no connection, and "Not now" if signing in didn't work.
//   view: app.cloud.state; online: navigator.onLine; skipped: she chose "not now" this session.
// Returns 'none' | 'signin' | 'offline'.
export function gateMode(view, { online = true, skipped = false } = {}) {
  if (!view || !view.enabled || skipped || view.user || !view.authReady) return 'none';
  return online ? 'signin' : 'offline';
}

// The first-run screens and update notes wait until sign-in is settled: signed in and synced (so a
// returning user's progress has arrived), skipped, or sign-in unavailable right now.
export function gateSettled(view, { skipped = false } = {}) {
  if (!view || !view.enabled || skipped) return true;
  if (view.user) return ['synced', 'error', 'offline'].includes(view.status);
  return !view.authReady && ['error', 'offline'].includes(view.status);
}
