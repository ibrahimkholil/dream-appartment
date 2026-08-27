import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Paste your Firebase project's Web App config here (Firebase Console ->
// Project settings -> Your apps -> Web app). This value is NOT a secret -
// Firestore Security Rules + the allowlist/admin system protect the data.
// See README.md for full setup steps.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDpXJ8AXY8w_s8_V8FpZfLa8NV4Ffulh2s',
  authDomain: 'dream-appartment.firebaseapp.com',
  projectId: 'dream-appartment',
  storageBucket: 'dream-appartment.firebasestorage.app',
  messagingSenderId: '544959789453',
  appId: '1:544959789453:web:071a1c0fd17f4c9c3d25c4',
};

export function isFirebaseConfigured() {
  if (import.meta.env.VITE_USE_MOCKS === '1') return true;
  return !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.apiKey.startsWith('YOUR_')
  );
}

let app = null;
let auth = null;
let db = null;

export function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (app) return { app, auth, db };
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e) {
    // Falls back to in-memory cache (e.g. private browsing) - app still works online.
    console.warn('Firestore offline persistence unavailable:', e);
    db = initializeFirestore(app, {});
  }
  return { app, auth, db };
}
