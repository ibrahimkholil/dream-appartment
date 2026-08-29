import React, { useCallback, useEffect, useState } from 'react';
import { useAppState } from '../state/store.jsx';

function fmtTimestamp(ts) {
  try { if (ts && typeof ts.toDate === 'function') return ts.toDate().toLocaleString('bn-BD'); } catch (e) {}
  return '—';
}

export function AdminModal({ onClose }) {
  const { fetchAdminData, approvePending, rejectPending, revokeAccess, addAdmin, removeAdmin, currentUser, showToast, ownerEmails } = useAppState();
  const [pending, setPending] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [admins, setAdmins] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAdminData();
      setPending(data.pending);
      setAllowed(data.allowed);
      setAdmins(data.admins);
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
  async function onAddAdmin() {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    try {
      await addAdmin(email);
      setNewAdminEmail('');
      showToast('অ্যাডমিন যোগ করা হয়েছে: ' + email);
      refresh();
    } catch (e) { showToast('ব্যর্থ: ' + (e.message || '')); }
  }
  async function onRemoveAdmin(email) {
    if (ownerEmails?.includes(email)) { showToast('এটি একটি স্থায়ী মালিক অ্যাকাউন্ট, বাতিল করা যাবে না'); return; }
    const isSelf = currentUser?.email?.toLowerCase() === email;
    const msg = isSelf
      ? 'আপনি নিজেই অ্যাডমিন তালিকা থেকে বের হয়ে যাবেন এবং আর এই প্যানেল দেখতে পাবেন না। নিশ্চিত?'
      : email + ' — এই ইমেইলের অ্যাডমিন ক্ষমতা বাতিল করবেন?';
    if (!confirm(msg)) return;
    try {
      await removeAdmin(email);
      showToast('অ্যাডমিন বাতিল করা হয়েছে: ' + email);
      if (isSelf) { onClose(); } else { refresh(); }
    } catch (e) { showToast('ব্যর্থ: ' + (e.message || '')); }
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

      <div className="section-title" style={{ margin: '18px 2px 8px' }}>অ্যাডমিন তালিকা</div>
      <div className="card">
        <div className="field-row" style={{ padding: '10px 4px 4px' }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <input type="email" placeholder="নতুন অ্যাডমিনের ইমেইল" value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddAdmin(); }} />
          </div>
          <button type="button" className="btn primary" style={{ flex: '0 0 auto', marginBottom: 8 }} onClick={onAddAdmin}>+ যোগ করুন</button>
        </div>
        {loadError ? <div className="empty">লোড ব্যর্থ</div>
          : admins === null ? <div className="empty">লোড হচ্ছে…</div>
          : admins.length === 0 ? <div className="empty">কোনো অ্যাডমিন নেই</div>
          : admins.map((email) => {
            const isOwnerEmail = ownerEmails?.includes(email);
            return (
              <div className="list-item" key={email}>
                <div className="li-main">
                  <div className="li-title">{email}{currentUser?.email?.toLowerCase() === email ? ' (আপনি)' : ''}</div>
                  {isOwnerEmail && <div className="li-sub">স্থায়ী মালিক — বাতিল করা যাবে না</div>}
                </div>
                {!isOwnerEmail && (
                  <div className="li-actions"><div className="icon-btn danger" title="অ্যাডমিন বাতিল করুন" onClick={() => onRemoveAdmin(email)}>🗑</div></div>
                )}
              </div>
            );
          })}
        <p className="muted" style={{ padding: '8px 4px 2px' }}>অ্যাডমিন যোগ করলে তিনি সরাসরি অ্যাপে ঢুকতে পারবেন এবং এই প্যানেল দেখতে পাবেন — আলাদাভাবে "অনুমোদিত ইমেইল তালিকা"-তে যোগ করার দরকার নেই।</p>
      </div>

      <div className="modal-actions" style={{ marginTop: 14 }}>
        <button type="button" className="btn ghost" onClick={onClose}>বন্ধ করুন</button>
      </div>
    </>
  );
}
