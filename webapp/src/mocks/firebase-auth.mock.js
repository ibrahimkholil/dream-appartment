import { mockFirebase } from './store.js';

function makeUser(email, uidVal) {
  const u = {
    uid: uidVal,
    email,
    get emailVerified() { return mockFirebase.verifiedEmails.has(email); },
    reload: async function () {},
  };
  return u;
}

export function getAuth() {
  return { currentUser: mockFirebase.user };
}

export function onAuthStateChanged(auth, cb) {
  mockFirebase.authStateCallback = cb;
  cb(mockFirebase.user);
  return () => {};
}

export async function signInWithEmailAndPassword(auth, email, pw) {
  if (pw === 'wrongpass') { const e = new Error('bad password'); e.code = 'auth/wrong-password'; throw e; }
  mockFirebase.user = makeUser(email, 'uid-' + email);
  auth.currentUser = mockFirebase.user;
  mockFirebase.authStateCallback(mockFirebase.user);
}

export async function createUserWithEmailAndPassword(auth, email, pw) {
  mockFirebase.user = makeUser(email, 'uid-' + email);
  auth.currentUser = mockFirebase.user;
  mockFirebase.authStateCallback(mockFirebase.user);
  return { user: mockFirebase.user };
}

export async function signOut(auth) {
  mockFirebase.user = null;
  auth.currentUser = null;
  mockFirebase.authStateCallback(null);
}

export async function sendEmailVerification(user) {}
export async function sendPasswordResetEmail(auth, email) {}
export async function reload(user) {}

export const EmailAuthProvider = {
  credential: (email, pw) => ({ email, pw }),
};
export async function reauthenticateWithCredential(user, cred) {}
export async function updatePassword(user, next) {}
