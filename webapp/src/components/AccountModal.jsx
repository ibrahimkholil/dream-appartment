import React, { useRef, useState } from 'react';
import { useAppState } from '../state/store.jsx';
import { APP_KEYS } from '../state/calculations.js';

function downloadBackup(state) {
  const payload = { app: 'Dream Apartment App', version: 1, exportedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dream-apartment-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
}

export function AccountModal({ onClose }) {
  const { currentUser, logout, showToast, state, setState, persistNow } = useAppState();
  const [view, setView] = useState('main');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const fileInput = useRef(null);
  const { changePassword } = useAppState();

  async function onChangePassword() {
    try {
      await changePassword(cur, next);
      showToast('পাসওয়ার্ড পরিবর্তন হয়েছে');
      setView('main');
    } catch (e) {
      setPwMsg('ব্যর্থ: ' + (e.message || 'unknown error'));
    }
  }

  function onRestoreFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = JSON.parse(reader.result);
        const data = payload.data || payload;
        if (!data || typeof data !== 'object') throw new Error('invalid');
        if (!confirm('Backup থেকে ডাটা Restore করলে বর্তমান ডাটা এই ডাটা দিয়ে প্রতিস্থাপিত হবে। চালিয়ে যাবেন?')) return;
        const next = { ...state };
        APP_KEYS.forEach((k) => { if (Array.isArray(data[k])) next[k] = data[k]; });
        setState(next);
        await persistNow(next);
        showToast('Backup Restore সম্পন্ন হয়েছে');
      } catch (e) { showToast('Backup file সঠিক নয়'); }
    };
    reader.readAsText(file);
  }

  if (view === 'password') {
    return (
      <>
        <h3>🔑 পাসওয়ার্ড পরিবর্তন</h3>
        {pwMsg && <div className="auth-msg err show">{pwMsg}</div>}
        <div className="field"><label>বর্তমান পাসওয়ার্ড</label><input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="field"><label>নতুন পাসওয়ার্ড</label><input type="password" autoComplete="new-password" minLength={6} value={next} onChange={(e) => setNext(e.target.value)} /></div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={() => setView('main')}>ফিরে যান</button>
          <button type="button" className="btn primary" onClick={onChangePassword}>সংরক্ষণ করুন</button>
        </div>
      </>
    );
  }

  return (
    <>
      <h3>👤 অ্যাকাউন্ট</h3>
      <div className="cloud-status">🟢 লগইন করা আছে: {currentUser?.email}</div>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={() => setView('password')}>🔑 পাসওয়ার্ড পরিবর্তন</button>
        <button type="button" className="btn" onClick={logout}>🚪 লগআউট</button>
      </div>
      <hr />
      <div className="modal-actions">
        <button type="button" className="btn primary" onClick={() => downloadBackup(state)}>⬇️ Backup Download</button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>⬆️ Backup Restore</button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => onRestoreFile(e.target.files[0])} />
      <p className="muted">ডাটা স্বয়ংক্রিয়ভাবে Cloud-এ সংরক্ষিত ও সিঙ্ক হয় — আলাদা করে আপলোড/ডাউনলোড করার দরকার নেই। এই ব্যাকআপ শুধু অতিরিক্ত সুরক্ষার জন্য।</p>
    </>
  );
}
