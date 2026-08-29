// Shared in-memory state for the mocked Firebase modules, exposed on
// `window.__mockFirebase` so Playwright tests can seed/inspect it exactly
// like the old vanilla-app test harness did.
const g = (typeof window !== 'undefined' ? window : globalThis);

if (!g.__mockFirebase) {
  g.__mockFirebase = {
    user: null,
    authStateCallback: null,
    verifiedEmails: new Set(),
    collections: { admins: {}, allowlist: {}, pending: {} },
    docData: null, // users/{uid}/app/state
  };
}

export const mockFirebase = g.__mockFirebase;

export function denyErr() {
  const e = new Error('Missing or insufficient permissions.');
  e.code = 'permission-denied';
  return e;
}

// Mirrors firestore.rules' isOwner() list, so tests can exercise the
// hardcoded-owner bootstrap path the same way production rules do.
export const OWNER_EMAILS = ['ibrahimkhalil123@gmail.com', 'dreamapt@gmail.com'];

export function isAdminMock() {
  if (!mockFirebase.user) return false;
  const email = mockFirebase.user.email.toLowerCase();
  return OWNER_EMAILS.includes(email) || !!mockFirebase.collections.admins[email];
}
export function isAllowedMock(email) {
  return !!(email && mockFirebase.collections.allowlist[email.toLowerCase()]);
}
