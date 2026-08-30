import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendEmailVerification, sendPasswordResetEmail, reload,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs, serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured } from '../firebase.js';
import { APP_KEYS, PROJECT_SCOPED_KEYS, emptyState, seedCategories, scopeToProject, uid } from './calculations.js';

// Permanent owner emails - mirrors firestore.rules' isOwner(). These always
// count as admin, without needing an admins/{email} Firestore document, so
// the very first admin only ever requires one rules deploy, not a manually
// created document too. Keep this list in sync with firestore.rules.
const OWNER_EMAILS = ['ibrahimkhalil122@gmail.com', 'dreamapt@gmail.com'];

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
  const [currentProjectId, setCurrentProjectId] = useState(null);
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

  // Returns the freshly-computed state (not just a flag) so callers that need
  // to persist a just-seeded default (e.g. a brand-new user's categories, or
  // a one-time legacy-data migration) write that exact value instead of
  // racing React's async setState via a stale stateRef.
  const applyState = useCallback((data) => {
    const isNew = !data;
    const next = {};
    APP_KEYS.forEach((k) => {
      if (data && Array.isArray(data[k])) next[k] = data[k];
      else if (k === 'categories') next[k] = seedCategories();
      else next[k] = [];
    });
    // One-time migration: accounts that started using the app before the
    // "projects" concept existed have shareholders/deposits/etc with no
    // project attached. Fold all of it into a single auto-created project
    // instead of making it disappear once projects become mandatory.
    let migrated = false;
    if (!isNew && next.projects.length === 0) {
      const hasLegacyData = PROJECT_SCOPED_KEYS.some((k) => next[k].length > 0);
      if (hasLegacyData) {
        const legacyProject = { id: uid(), name: 'আমার প্রথম প্রজেক্ট', address: '', createdAt: Date.now() };
        next.projects = [legacyProject];
        PROJECT_SCOPED_KEYS.forEach((k) => {
          next[k] = next[k].map((r) => (r.projectId ? r : { ...r, projectId: legacyProject.id }));
        });
        migrated = true;
      }
    }
    setState(next);
    return { isNew, next, migrated };
  }, []);

  // Full-document overwrite - only safe for cases with no concurrent writer:
  // seeding a brand-new user's first document, or an explicit backup restore.
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

  // Merges ONE key against the latest server document inside a transaction,
  // so a save from one tab/device never clobbers a different field that
  // changed on another tab/device in between (each call only ever touches
  // its own key, keeping everything else at whatever the server just had).
  const persistKey = useCallback(async (key, val) => {
    const user = authRef.current?.currentUser;
    if (!user || !dbRef.current) return false;
    setSyncState(navigator.onLine ? 'saving' : 'offline');
    try {
      const ref = stateDocRef(user);
      await runTransaction(dbRef.current, async (tx) => {
        const snap = await tx.get(ref);
        const existing = (snap.exists() && snap.data().data) || {};
        const merged = { ...existing, [key]: val };
        tx.set(ref, { data: merged, email: user.email, updatedAt: serverTimestamp() }, { merge: true });
      });
      setSyncState('saved');
      return true;
    } catch (e) {
      setSyncState('error');
      showToast('সংরক্ষণ ব্যর্থ হয়েছে: ' + (e.message || 'error'));
      return false;
    }
  }, [setSyncState, showToast]);

  // Keeps the same call signature used across every form: caller passes the
  // already-updated array for one key, this persists just that key.
  const saveKey = useCallback(async (key, val) => {
    setState((prev) => ({ ...prev, [key]: val }));
    if (applyingRemoteRef.current) return true;
    return persistKey(key, val);
  }, [persistKey]);

  function attachRealtimeListener(user) {
    if (unsubscribeRef.current) { try { unsubscribeRef.current(); } catch (e) {} }
    unsubscribeRef.current = onSnapshot(stateDocRef(user), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      applyingRemoteRef.current = true;
      const { migrated, next } = applyState(snap.exists() ? snap.data().data : null);
      applyingRemoteRef.current = false;
      // Mirrors checkAccessAndLoad's own migrated-write: whichever call (the
      // initial getDoc or this listener) sees the legacy data first is the
      // one that persists it, so the one-time migration stays a single,
      // deterministic project id no matter which fires first.
      if (migrated) persistNow(next);
    }, (err) => console.warn('Realtime listener error', err));
  }

  // Returns 'ok' | 'denied' | 'error'. A real permission-denied means the
  // account genuinely isn't allowlisted yet. Any other failure (offline on a
  // brand-new device with no cached copy, a network blip) gets one retry
  // before falling back, so a real connectivity hiccup doesn't get
  // misreported as "still waiting for admin approval" to an already-approved
  // user.
  const checkAccessAndLoad = useCallback(async (user, attempt = 0) => {
    try {
      const snap = await getDoc(stateDocRef(user));
      const { isNew, next, migrated } = applyState(snap.exists() ? snap.data().data : null);
      attachRealtimeListener(user);
      if (isNew || migrated) await persistNow(next);
      return 'ok';
    } catch (e) {
      console.warn('Access check failed', e);
      if (e.code !== 'permission-denied' && attempt < 1) {
        await new Promise((r) => setTimeout(r, 1500));
        return checkAccessAndLoad(user, attempt + 1);
      }
      return 'denied';
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
    const email = user.email.toLowerCase();
    if (OWNER_EMAILS.includes(email)) { setIsAdmin(true); return; }
    try {
      const snap = await getDoc(doc(dbRef.current, 'admins', email));
      setIsAdmin(!!snap.exists());
    } catch (e) { setIsAdmin(false); }
  }, []);

  const handleAuthenticatedUser = useCallback(async (user) => {
    setCurrentUser(user);
    const result = await checkAccessAndLoad(user);
    if (result === 'ok') {
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
    const result = await checkAccessAndLoad(user);
    if (result === 'ok') { await checkIsAdmin(user); setScreen('app'); }
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
    const [pendingSnap, allowSnap, adminSnap] = await Promise.all([
      getDocs(collection(dbRef.current, 'pending')),
      getDocs(collection(dbRef.current, 'allowlist')),
      getDocs(collection(dbRef.current, 'admins')),
    ]);
    const pending = [];
    pendingSnap.forEach((d) => pending.push({ uid: d.id, ...d.data() }));
    const allowed = [];
    allowSnap.forEach((d) => allowed.push(d.id));
    const admins = new Set(OWNER_EMAILS);
    adminSnap.forEach((d) => admins.add(d.id));
    return { pending, allowed, admins: Array.from(admins) };
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

  const addAdmin = useCallback(async (email) => {
    await setDoc(doc(dbRef.current, 'admins', email.toLowerCase()), {
      admin: true, addedAt: serverTimestamp(), addedBy: currentUser?.email,
    });
  }, [currentUser]);

  const removeAdmin = useCallback(async (email) => {
    await deleteDoc(doc(dbRef.current, 'admins', email.toLowerCase()));
  }, []);

  // ---------------- Project actions ----------------
  // Keep the active project selection valid: default to the first project
  // once any exist, and fall back if the currently-selected one got deleted.
  useEffect(() => {
    if (state.projects.length === 0) { if (currentProjectId !== null) setCurrentProjectId(null); return; }
    if (!state.projects.some((p) => p.id === currentProjectId)) setCurrentProjectId(state.projects[0].id);
  }, [state.projects, currentProjectId]);

  // Everything the UI reads for display/calculations should come from here,
  // not from `state` directly - it's the same data limited to the active
  // project. `state` itself stays the full, unfiltered document so writes
  // (create/edit/delete) never accidentally drop another project's records.
  const scopedState = useMemo(() => scopeToProject(state, currentProjectId), [state, currentProjectId]);

  const createProject = useCallback(async (name, address) => {
    const project = { id: uid(), name, address: address || '', createdAt: Date.now() };
    await saveKey('projects', [...state.projects, project]);
    setCurrentProjectId(project.id);
    return project;
  }, [state.projects, saveKey]);

  const updateProject = useCallback(async (id, patch) => {
    await saveKey('projects', state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, [state.projects, saveKey]);

  // Returns 'has-data' instead of deleting when the project still owns any
  // records, so a project can never be removed out from under its own data.
  const deleteProject = useCallback(async (id) => {
    const hasData = PROJECT_SCOPED_KEYS.some((k) => state[k].some((r) => r.projectId === id));
    if (hasData) return 'has-data';
    await saveKey('projects', state.projects.filter((p) => p.id !== id));
    return 'ok';
  }, [state, saveKey]);

  const value = {
    screen, setScreen,
    authMsg, setAuthMsg, authMode, setAuthMode, submitAuth, forgotPassword,
    resendVerification, recheckVerification, recheckPending, logout, changePassword,
    currentUser, isAdmin,
    state, scopedState, setState, saveKey, persistNow,
    currentProjectId, setCurrentProjectId, createProject, updateProject, deleteProject,
    tab, setTab,
    syncState,
    toast, showToast,
    modalContent, openModal, closeModal,
    fetchAdminData, approvePending, rejectPending, revokeAccess, addAdmin, removeAdmin,
    ownerEmails: OWNER_EMAILS,
    firestore: () => dbRef.current,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
