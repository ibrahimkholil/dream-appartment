import React from 'react';
import { useAppState } from '../state/store.jsx';
import { totalExpense, totalReceived, money } from '../state/calculations.js';

const TABS = [
  { key: 'dashboard', icon: '🏠', label: 'হোম' },
  { key: 'deposits', icon: '💰', label: 'জমা' },
  { key: 'expenses', icon: '🧾', label: 'খরচ' },
  { key: 'suppliers', icon: '🏗️', label: 'পাওনাদার' },
  { key: 'loans', icon: '🏦', label: 'লোন' },
  { key: 'shareholders', icon: '👥', label: 'সদস্য' },
];

const SYNC_LABELS = {
  idle: '',
  saving: '🟡 সংরক্ষণ হচ্ছে…',
  saved: '🟢 সংরক্ষিত',
  offline: '🔴 অফলাইন — সংযোগ ফিরলে সিঙ্ক হবে',
  error: '🔴 সংরক্ষণ ব্যর্থ, আবার চেষ্টা করুন',
};

export function Header({ onOpenAdmin, onOpenReport, onOpenAccount, onOpenProjects }) {
  const { scopedState, state, isAdmin, syncState, currentProjectId } = useAppState();
  const exp = totalExpense(scopedState);
  const rec = totalReceived(scopedState);
  const target = Math.max(exp, rec, 1);
  const pct = Math.min(100, Math.round((rec / target) * 100));
  const segCount = 24;
  const filled = Math.round((pct / 100) * segCount);
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const badgeText = offline ? SYNC_LABELS.offline : SYNC_LABELS[syncState];
  const currentProject = state.projects.find((p) => p.id === currentProjectId);

  return (
    <header className="top">
      <div className="brand">
        <div>
          <div className="brand-title">ড্রিম অ্যাপার্টমেন্ট</div>
          <div className="brand-sub" onClick={onOpenProjects} style={{ cursor: 'pointer' }}>
            🗂️ {currentProject ? currentProject.name : 'প্রজেক্ট নির্বাচন করুন'} · {scopedState.shareholders.length} জন শেয়ারহোল্ডার
          </div>
          <div className={'sync-badge' + (badgeText ? ' show' : '')}>{badgeText}</div>
        </div>
        <div className="header-actions">
          {isAdmin && <button className="report-btn" title="অ্যাডমিন প্যানেল" onClick={onOpenAdmin}>🛡️</button>}
          <button className="report-btn" title="প্রজেক্ট পরিচালনা" onClick={onOpenProjects}>🗂️</button>
          <button className="report-btn" title="রিপোর্ট / প্রিন্ট / PDF" onClick={onOpenReport}>📄</button>
          <button className="report-btn" title="অ্যাকাউন্ট ও ব্যাকআপ" onClick={onOpenAccount}>👤</button>
          <div className="brick-badge" />
        </div>
      </div>
      <div className="brickbar-wrap">
        <div className="brickbar-labels">
          <span>সংগ্রহ {pct}%</span>
          <span>{money(rec)} / {money(exp)}</span>
        </div>
        <div className="brickbar">
          {Array.from({ length: segCount }).map((_, i) => (
            <div key={i} className={'brick' + (i < filled ? ' filled' : '')} />
          ))}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { tab, setTab } = useAppState();
  return (
    <nav className="bottom">
      {TABS.map((t) => (
        <button key={t.key} className={'navbtn' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
          <span className="ic">{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
  );
}

export function Fab({ onClick, hidden }) {
  if (hidden) return null;
  return <button className="fab" onClick={onClick}>＋</button>;
}

export function NoProjectNotice({ onCreate }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '44px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🗂️</div>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--navy)' }}>এখনো কোনো প্রজেক্ট নেই</div>
      <div className="li-sub" style={{ marginBottom: 16 }}>শুরু করতে আপনার প্রথম প্রজেক্ট (যেমন: একটি অ্যাপার্টমেন্ট বিল্ডিং) তৈরি করুন।</div>
      <button type="button" className="btn primary" style={{ flex: 'none', padding: '10px 22px' }} onClick={onCreate}>+ প্রজেক্ট তৈরি করুন</button>
    </div>
  );
}

export function ModalHost() {
  const { modalContent, closeModal } = useAppState();
  return (
    <div className={'modal-back' + (modalContent ? ' open' : '')} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal">{modalContent}</div>
    </div>
  );
}

export function ToastHost() {
  const { toast } = useAppState();
  return <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>;
}
