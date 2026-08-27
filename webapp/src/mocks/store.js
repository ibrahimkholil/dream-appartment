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

export function isAdminMock() {
  return !!(mockFirebase.user && mockFirebase.collections.admins[mockFirebase.user.email.toLowerCase()]);
}
export function isAllowedMock(email) {
  return !!(email && mockFirebase.collections.allowlist[email.toLowerCase()]);
}
