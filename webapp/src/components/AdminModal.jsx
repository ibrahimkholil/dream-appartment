import React, { useCallback, useEffect, useState } from 'react';
import { useAppState } from '../state/store.jsx';

function fmtTimestamp(ts) {
  try { if (ts && typeof ts.toDate === 'function') return ts.toDate().toLocaleString('bn-BD'); } catch (e) {}
  return '—';
}

export function AdminModal({ onClose }) {
  const { fetchAdminData, approvePending, rejectPending, revokeAccess, showToast } = useAppState();
  const [pending, setPending] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAdminData();
      setPending(data.pending);
      setAllowed(data.allowed);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'লোড ব্যর্থ');
    }
  }, [fetchAdminData]);

  useEffect(() => { refresh(); }, [refresh]);

  async function onApprove(uid, email) {
    try { await approvePending(uid, email); showToast('অনুমোদিত হয়েছে: ' + email); refresh(); }
    catch (e) { showToast('ব্যর্থ: ' + (e.message || '')); }
  }
  async function onReject(uid) {
    try { await rejectPending(uid); showToast('আবেদন বাতিল করা হয়েছে'); refresh(); }
    catch (e) { showToast('ব্যর্থ: ' + (e.message || '')); }
  }
  async function onRevoke(email) {
    if (!confirm(email + ' — এই ইমেইলের অ্যাক্সেস বাতিল করবেন? এই ইমেইল দিয়ে আর লগইন করা যাবে না।')) return;
    try { await revokeAccess(email); showToast('অ্যাক্সেস বাতিল করা হয়েছে: ' + email); refresh(); }
    catch (e) { showToast('ব্যর্থ: ' + (e.message || '')); }
  }

  return (
    <>
      <h3>🛡️ অ্যাডমিন প্যানেল</h3>
      <div className="section-title" style={{ margin: '4px 2px 8px' }}>অপেক্ষমাণ আবেদন</div>
      <div className="card">
        {loadError ? <div className="empty">লোড ব্যর্থ: {loadError}</div>
          : pending === null ? <div className="empty">লোড হচ্ছে…</div>
          : pending.length === 0 ? <div className="empty">কোনো অপেক্ষমাণ আবেদন নেই</div>
          : pending.map((r) => (
            <div className="list-item" key={r.uid}>
              <div className="li-main"><div className="li-title">{r.email || '—'}</div><div className="li-sub">{fmtTimestamp(r.requestedAt)}</div></div>
              <div className="li-actions">
                <div className="icon-btn" title="অনুমোদন করুন" onClick={() => onApprove(r.uid, r.email)}>✅</div>
                <div className="icon-btn danger" title="বাতিল করুন" onClick={() => onReject(r.uid)}>✖️</div>
              </div>
            </div>
          ))}
      </div>
      <div className="section-title" style={{ margin: '18px 2px 8px' }}>অনুমোদিত ইমেইল তালিকা</div>
      <div className="card">
        {loadError ? <div className="empty">লোড ব্যর্থ</div>
          : allowed === null ? <div className="empty">লোড হচ্ছে…</div>
          : allowed.length === 0 ? <div className="empty">কোনো অনুমোদিত ইমেইল নেই</div>
          : allowed.map((email) => (
            <div className="list-item" key={email}>
              <div className="li-main"><div className="li-title">{email}</div></div>
              <div className="li-actions"><div className="icon-btn danger" title="অ্যাক্সেস বাতিল করুন" onClick={() => onRevoke(email)}>🗑</div></div>
            </div>
          ))}
      </div>
      <div className="modal-actions" style={{ marginTop: 14 }}>
        <button type="button" className="btn ghost" onClick={onClose}>বন্ধ করুন</button>
      </div>
    </>
  );
}
