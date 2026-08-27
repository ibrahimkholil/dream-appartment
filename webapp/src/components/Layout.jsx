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

export function Header({ onOpenAdmin, onOpenReport, onOpenAccount }) {
  const { state, isAdmin, syncState } = useAppState();
  const exp = totalExpense(state);
  const rec = totalReceived(state);
  const target = Math.max(exp, rec, 1);
  const pct = Math.min(100, Math.round((rec / target) * 100));
  const segCount = 24;
  const filled = Math.round((pct / 100) * segCount);
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const badgeText = offline ? SYNC_LABELS.offline : SYNC_LABELS[syncState];

  return (
    <header className="top">
      <div className="brand">
        <div>
          <div className="brand-title">ড্রিম অ্যাপার্টমেন্ট</div>
          <div className="brand-sub">{state.shareholders.length} জন শেয়ারহোল্ডার · ফান্ড ট্র্যাকার</div>
          <div className={'sync-badge' + (badgeText ? ' show' : '')}>{badgeText}</div>
        </div>
        <div className="header-actions">
          {isAdmin && <button className="report-btn" title="অ্যাডমিন প্যানেল" onClick={onOpenAdmin}>🛡️</button>}
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
