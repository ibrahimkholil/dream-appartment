import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendEmailVerification, sendPasswordResetEmail, reload,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured } from '../firebase.js';
import { APP_KEYS, emptyState, seedCategories } from './calculations.js';

const AppStateContext = createContext(null);
export function useAppState() {
  return useContext(AppStateContext);
}

export function AppStateProvider({ children }) {
  const [screen, setScreen] = useState('boot'); // boot|setup|auth|verify|pending|app
  const [authMsg, setAuthMsg] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [state, setState] = useState(emptyState());
  const [tab, setTab] = useState('dashboard');
  const [syncState, setSyncStateRaw] = useState('idle');
  const [toast, setToast] = useState('');
  const [modalContent, setModalContent] = useState(null);

  const authRef = useRef(null);
  const dbRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const unsubscribeRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const toastTimer = useRef(null);
  const syncTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  }, []);

  const setSyncState = useCallback((s) => {
    setSyncStateRaw(s);
    clearTimeout(syncTimer.current);
    if (s === 'saved') {
      syncTimer.current = setTimeout(() => setSyncStateRaw((cur) => (cur === 'saved' ? 'idle' : cur)), 2200);
    }
  }, []);

  const openModal = useCallback((content) => setModalContent(content), []);
  const closeModal = useCallback(() => setModalContent(null), []);

  function stateDocRef(user) {
    return doc(dbRef.current, 'users', user.uid, 'app', 'state');
  }

  const applyState = useCallback((data) => {
    const isNew = !data;
    const next = {};
    APP_KEYS.forEach((k) => {
      if (data && Array.isArray(data[k])) next[k] = data[k];
      else if (k === 'categories') next[k] = seedCategories();
      else next[k] = [];
    });
    setState(next);
    return isNew;
  }, []);

  const persistNow = useCallback(async (dataOverride) => {
    const user = authRef.current?.currentUser;
    if (!user || !dbRef.current) return false;
    setSyncState(navigator.onLine ? 'saving' : 'offline');
    try {
      const data = {};
      APP_KEYS.forEach((k) => { data[k] = (dataOverride || stateRef.current)[k] || []; });
      await setDoc(stateDocRef(user), { data, email: user.email, updatedAt: serverTimestamp() }, { merge: true });
      setSyncState('saved');
      return true;
    } catch (e) {
      setSyncState('error');
      showToast('সংরক্ষণ ব্যর্থ হয়েছে: ' + (e.message || 'error'));
      return false;
    }
  }, [setSyncState, showToast]);

  // Keeps the same call signature used across every form: caller passes the
  // already-updated array for one key, this saves the whole document.
  const saveKey = useCallback(async (key, val) => {
    const next = { ...stateRef.current, [key]: val };
    setState(next);
    if (applyingRemoteRef.current) return true;
    return persistNow(next);
  }, [persistNow]);

  function attachRealtimeListener(user) {
    if (unsubscribeRef.current) { try { unsubscribeRef.current(); } catch (e) {} }
    unsubscribeRef.current = onSnapshot(stateDocRef(user), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      applyingRemoteRef.current = true;
      applyState(snap.exists() ? snap.data().data : null);
      applyingRemoteRef.current = false;
    }, (err) => console.warn('Realtime listener error', err));
  }

  const checkAccessAndLoad = useCallback(async (user) => {
    try {
      const snap = await getDoc(stateDocRef(user));
      const isNew = applyState(snap.exists() ? snap.data().data : null);
      attachRealtimeListener(user);
      if (isNew) await persistNow(stateRef.current);
      return true;
    } catch (e) {
      console.warn('Access check failed', e);
      return false;
    }
  }, [applyState, persistNow]);

  const ensurePendingRecord = useCallback(async (user) => {
    if (!dbRef.current) return;
    try {
      await setDoc(doc(dbRef.current, 'pending', user.uid), { email: user.email, requestedAt: serverTimestamp() }, { merge: true });
    } catch (e) { console.warn('pending record write failed', e); }
  }, []);

  const checkIsAdmin = useCallback(async (user) => {
    if (!user?.email || !dbRef.current) { setIsAdmin(false); return; }
    try {
      const snap = await getDoc(doc(dbRef.current, 'admins', user.email.toLowerCase()));
      setIsAdmin(!!snap.exists());
    } catch (e) { setIsAdmin(false); }
  }, []);

  const handleAuthenticatedUser = useCallback(async (user) => {
    setCurrentUser(user);
    const ok = await checkAccessAndLoad(user);
    if (ok) {
      await checkIsAdmin(user);
      setScreen('app');
      return;
    }
    if (!user.emailVerified) { setScreen('verify'); return; }
    await ensurePendingRecord(user);
    setScreen('pending');
  }, [checkAccessAndLoad, checkIsAdmin, ensurePendingRecord]);

  useEffect(() => {
    if (!isFirebaseConfigured()) { setScreen('setup'); return; }
    const { auth, db } = initFirebase();
    authRef.current = auth;
    dbRef.current = db;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleAuthenticatedUser(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        if (unsubscribeRef.current) { try { unsubscribeRef.current(); } catch (e) {} unsubscribeRef.current = null; }
        setScreen('auth');
        setAuthMsg('');
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function authErrorMessage(e) {
    const map = {
      'auth/invalid-email': 'সঠিক ইমেইল ঠিকানা দিন',
      'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই',
      'auth/wrong-password': 'পাসওয়ার্ড সঠিক নয়',
      'auth/email-already-in-use': 'এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে, লগইন করুন',
      'auth/weak-password': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
      'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড সঠিক নয়',
      'auth/too-many-requests': 'অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন',
    };
    return map[e.code] || (e.message || 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন');
  }

  const submitAuth = useCallback(async ({ email, password, confirm }) => {
    if (!email || !password) { setAuthMsg('ইমেইল ও পাসওয়ার্ড দিন'); return; }
    if (authMode === 'signup' && password !== confirm) { setAuthMsg('পাসওয়ার্ড মিলছে না'); return; }
    setAuthMsg('');
    try {
      if (authMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(authRef.current, email, password);
        try { await sendEmailVerification(cred.user); } catch (e) {}
      } else {
        await signInWithEmailAndPassword(authRef.current, email, password);
      }
    } catch (e) {
      setAuthMsg(authErrorMessage(e));
    }
  }, [authMode]);

  const forgotPassword = useCallback(async (email) => {
    if (!email) { setAuthMsg('আগে ইমেইল লিখুন, তারপর আবার চাপুন'); return; }
    try {
      await sendPasswordResetEmail(authRef.current, email);
      setAuthMsg('__OK__পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে');
    } catch (e) {
      setAuthMsg(authErrorMessage(e));
    }
  }, []);

  const resendVerification = useCallback(async () => {
    const user = authRef.current?.currentUser;
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setAuthMsg('__OK__যাচাইকরণ ইমেইল আবার পাঠানো হয়েছে');
    } catch (e) {
      setAuthMsg('পাঠানো ব্যর্থ: ' + (e.message || 'error'));
    }
  }, []);

  const recheckVerification = useCallback(async () => {
    const user = authRef.current?.currentUser;
    if (!user) return;
    await reload(user);
    if (user.emailVerified) {
      await handleAuthenticatedUser(user);
    } else {
      setAuthMsg('এখনো যাচাই হয়নি — ইমেইলের লিংকে ক্লিক করুন, তারপর আবার চেষ্টা করুন');
    }
  }, [handleAuthenticatedUser]);

  const recheckPending = useCallback(async () => {
    const user = authRef.current?.currentUser;
    if (!user) return;
    showToast('চেক করা হচ্ছে…');
    const ok = await checkAccessAndLoad(user);
    if (ok) { await checkIsAdmin(user); setScreen('app'); }
    else showToast('এখনো অনুমোদন হয়নি');
  }, [checkAccessAndLoad, checkIsAdmin, showToast]);

  const logout = useCallback(async () => {
    try {
      if (unsubscribeRef.current) { try { unsubscribeRef.current(); } catch (e) {} unsubscribeRef.current = null; }
      await signOut(authRef.current);
      closeModal();
    } catch (e) { showToast('লগআউট ব্যর্থ হয়েছে'); }
  }, [closeModal, showToast]);

  const changePassword = useCallback(async (current, next) => {
    const user = authRef.current?.currentUser;
    if (!current || !next || next.length < 6) throw new Error('সঠিক বর্তমান ও নতুন পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)');
    const cred = EmailAuthProvider.credential(user.email, current);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, next);
  }, []);

  // ---------------- Admin actions ----------------
  const fetchAdminData = useCallback(async () => {
    const [pendingSnap, allowSnap] = await Promise.all([
      getDocs(collection(dbRef.current, 'pending')),
      getDocs(collection(dbRef.current, 'allowlist')),
    ]);
    const pending = [];
    pendingSnap.forEach((d) => pending.push({ uid: d.id, ...d.data() }));
    const allowed = [];
    allowSnap.forEach((d) => allowed.push(d.id));
    return { pending, allowed };
  }, []);

  const approvePending = useCallback(async (uidVal, email) => {
    await setDoc(doc(dbRef.current, 'allowlist', email.toLowerCase()), {
      allowed: true, approvedAt: serverTimestamp(), approvedBy: currentUser?.email,
    });
    await deleteDoc(doc(dbRef.current, 'pending', uidVal));
  }, [currentUser]);

  const rejectPending = useCallback(async (uidVal) => {
    await deleteDoc(doc(dbRef.current, 'pending', uidVal));
  }, []);

  const revokeAccess = useCallback(async (email) => {
    await deleteDoc(doc(dbRef.current, 'allowlist', email.toLowerCase()));
  }, []);

  const value = {
    screen, setScreen,
    authMsg, setAuthMsg, authMode, setAuthMode, submitAuth, forgotPassword,
    resendVerification, recheckVerification, recheckPending, logout, changePassword,
    currentUser, isAdmin,
    state, setState, saveKey, persistNow,
    tab, setTab,
    syncState,
    toast, showToast,
    modalContent, openModal, closeModal,
    fetchAdminData, approvePending, rejectPending, revokeAccess,
    firestore: () => dbRef.current,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
