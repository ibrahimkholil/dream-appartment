import { mockFirebase, denyErr, isAdminMock, isAllowedMock } from './store.js';

export function initializeFirestore() { return {}; }
export function persistentLocalCache() { return {}; }
export function persistentMultipleTabManager() { return {}; }

export function serverTimestamp() { return 'MOCK_TS'; }

function isStatePath(segments) {
  return segments.length === 4 && segments[0] === 'users' && segments[2] === 'app' && segments[3] === 'state';
}

export function doc(db, ...segments) {
  if (isStatePath(segments)) {
    return { kind: 'state', uid: segments[1] };
  }
  const [collName, id] = segments;
  return { kind: 'doc', collName, id };
}

export function collection(db, name) {
  return { kind: 'collection', name };
}

export async function getDoc(ref) {
  if (ref.kind === 'state') {
    if (!mockFirebase.user || !(isAllowedMock(mockFirebase.user.email) || isAdminMock())) throw denyErr();
    return mockFirebase.docData
      ? { exists: () => true, data: () => ({ data: mockFirebase.docData }) }
      : { exists: () => false, data: () => undefined };
  }
  const { collName, id } = ref;
  if (collName === 'admins') {
    const isSelf = mockFirebase.user && mockFirebase.user.email.toLowerCase() === id;
    if (!isSelf && !isAdminMock()) throw denyErr();
  } else if (collName === 'allowlist') {
    if (!isAdminMock()) throw denyErr();
  } else if (collName === 'pending') {
    const isOwn = mockFirebase.user && mockFirebase.user.uid === id;
    if (!isOwn && !isAdminMock()) throw denyErr();
  }
  const d = mockFirebase.collections[collName]?.[id];
  return d ? { exists: () => true, id, data: () => d } : { exists: () => false, id, data: () => undefined };
}

export async function setDoc(ref, payload, opts) {
  if (ref.kind === 'state') {
    if (!mockFirebase.user || !(isAllowedMock(mockFirebase.user.email) || isAdminMock())) throw denyErr();
    mockFirebase.docData = payload.data;
    return;
  }
  const { collName, id } = ref;
  if (collName === 'admins') {
    if (!isAdminMock()) throw denyErr();
  } else if (collName === 'allowlist') {
    if (!isAdminMock()) throw denyErr();
  } else if (collName === 'pending') {
    const isOwn = mockFirebase.user && mockFirebase.user.uid === id;
    if (!isOwn || !mockFirebase.user.emailVerified) throw denyErr();
  }
  const merge = opts && opts.merge;
  mockFirebase.collections[collName] = mockFirebase.collections[collName] || {};
  mockFirebase.collections[collName][id] = { ...(merge ? (mockFirebase.collections[collName][id] || {}) : {}), ...payload };
}

export async function deleteDoc(ref) {
  const { collName, id } = ref;
  if ((collName === 'admins' || collName === 'allowlist' || collName === 'pending') && !isAdminMock()) throw denyErr();
  delete mockFirebase.collections[collName]?.[id];
}

export function onSnapshot(ref, cb, errCb) {
  if (ref.kind === 'state') {
    cb({
      exists: () => !!mockFirebase.docData,
      metadata: { hasPendingWrites: false },
      data: () => (mockFirebase.docData ? { data: mockFirebase.docData } : undefined),
    });
  }
  return () => {};
}

export async function runTransaction(db, updateFn) {
  const tx = {
    get: (ref) => getDoc(ref),
    set: (ref, payload, opts) => setDoc(ref, payload, opts),
  };
  return updateFn(tx);
}

export async function getDocs(ref) {
  const { name } = ref;
  if ((name === 'pending' || name === 'allowlist' || name === 'admins') && !isAdminMock()) throw denyErr();
  const store = mockFirebase.collections[name] || {};
  const docs = Object.keys(store).map((id) => ({ id, data: () => store[id] }));
  return { forEach: (fn) => docs.forEach(fn), docs };
}
