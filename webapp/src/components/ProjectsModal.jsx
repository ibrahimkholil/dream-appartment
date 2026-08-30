import React, { useState } from 'react';
import { useAppState } from '../state/store.jsx';

export function ProjectsModal({ onClose }) {
  const { state, currentProjectId, setCurrentProjectId, createProject, updateProject, deleteProject, showToast } = useAppState();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [editing, setEditing] = useState({});

  async function onCreate() {
    const n = name.trim();
    if (!n) { showToast('প্রজেক্টের নাম দিন'); return; }
    await createProject(n, address.trim());
    setName(''); setAddress('');
    showToast('প্রজেক্ট তৈরি হয়েছে');
  }

  function startEdit(p) { setEditing((e) => ({ ...e, [p.id]: { name: p.name, address: p.address || '' } })); }
  function editField(id, k, v) { setEditing((e) => ({ ...e, [id]: { ...e[id], [k]: v } })); }
  function cancelEdit(id) { setEditing((e) => { const n = { ...e }; delete n[id]; return n; }); }
  async function saveEdit(id) {
    const draft = editing[id];
    if (!draft || !draft.name.trim()) { showToast('প্রজেক্টের নাম দিন'); return; }
    await updateProject(id, { name: draft.name.trim(), address: draft.address.trim() });
    cancelEdit(id);
    showToast('আপডেট হয়েছে');
  }

  async function onDelete(id) {
    if (!confirm('এই প্রজেক্টটি মুছবেন?')) return;
    const res = await deleteProject(id);
    if (res === 'has-data') showToast('এই প্রজেক্টে শেয়ারহোল্ডার/জমা/খরচ ডাটা আছে — আগে সব মুছুন, তারপর প্রজেক্ট মুছুন');
    else showToast('প্রজেক্ট মুছে ফেলা হয়েছে');
  }

  return (
    <>
      <h3>🗂️ প্রজেক্ট পরিচালনা</h3>
      <div className="field"><label>নতুন প্রজেক্টের নাম</label>
        <input type="text" placeholder="যেমন: মিরপুর অ্যাপার্টমেন্ট" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }} />
      </div>
      <div className="field"><label>প্রজেক্টের ঠিকানা</label>
        <input type="text" placeholder="যেমন: ঢাকা-১২০৫, বাংলাদেশ" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }} />
      </div>
      <div className="modal-actions" style={{ marginBottom: 18 }}>
        <button type="button" className="btn ghost" onClick={onClose}>বন্ধ করুন</button>
        <button type="button" className="btn primary" onClick={onCreate}>+ প্রজেক্ট তৈরি করুন</button>
      </div>

      <div className="section-title" style={{ margin: '2px 2px 8px' }}>সব প্রজেক্ট <span className="tag">{state.projects.length} টি</span></div>
      <div className="card">
        {state.projects.length === 0 ? <div className="empty">এখনো কোনো প্রজেক্ট তৈরি হয়নি</div> : state.projects.map((p) => {
          const isActive = p.id === currentProjectId;
          const draft = editing[p.id];
          if (draft) {
            return (
              <div className="list-item" key={p.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <input type="text" value={draft.name} onChange={(e) => editField(p.id, 'name', e.target.value)} placeholder="প্রজেক্টের নাম" />
                <input type="text" value={draft.address} onChange={(e) => editField(p.id, 'address', e.target.value)} placeholder="ঠিকানা" />
                <div className="li-actions" style={{ marginLeft: 0 }}>
                  <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={() => cancelEdit(p.id)}>বাতিল</button>
                  <button type="button" className="btn primary" style={{ flex: 1 }} onClick={() => saveEdit(p.id)}>সংরক্ষণ</button>
                </div>
              </div>
            );
          }
          return (
            <div className="list-item" key={p.id}>
              <div className="li-main">
                <div className="li-title">{p.name}{isActive ? ' ✓' : ''}</div>
                <div className="li-sub">{p.address || '—'}</div>
              </div>
              <div className="li-actions">
                {!isActive && <div className="icon-btn" title="এই প্রজেক্ট সক্রিয় করুন" onClick={() => setCurrentProjectId(p.id)}>🔁</div>}
                <div className="icon-btn" title="এডিট করুন" onClick={() => startEdit(p)}>✎</div>
                <div className="icon-btn danger" title="মুছুন" onClick={() => onDelete(p.id)}>🗑</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
