import React, { useState } from 'react';
import { useAppState } from '../state/store.jsx';

function AuthMsg({ msg }) {
  if (!msg) return <div className="auth-msg" />;
  const ok = msg.startsWith('__OK__');
  const text = ok ? msg.slice(6) : msg;
  return <div className={'auth-msg show ' + (ok ? 'ok' : 'err')}>{text}</div>;
}

export function BootScreen() {
  return <div className="auth-loading" id="bootScreen">লোড হচ্ছে…</div>;
}

export function SetupScreen() {
  return (
    <div className="auth-screen setup-screen">
      <div className="auth-brand">
        <div className="brick-badge" style={{ margin: '0 auto 12px' }} />
        <h1>Firebase সেটআপ প্রয়োজন</h1>
        <div className="sub">এই অ্যাপটি চালানোর আগে একবার Firebase প্রজেক্ট কনফিগার করতে হবে।</div>
      </div>
      <div className="auth-card">
        <ol>
          <li><a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a>-এ গিয়ে একটি নতুন প্রজেক্ট তৈরি করুন (ফ্রি Spark প্ল্যান)।</li>
          <li>Build → Authentication → Sign-in method থেকে <b>Email/Password</b> চালু করুন।</li>
          <li>Build → Firestore Database থেকে একটি ডাটাবেজ তৈরি করুন।</li>
          <li>Project settings → Your apps → Web app যোগ করে কনফিগার অবজেক্ট কপি করুন।</li>
          <li>সেই মান <code>src/firebase.js</code> ফাইলের <code>FIREBASE_CONFIG</code> ভেরিয়েবলে বসান (README.md দেখুন)।</li>
          <li>Firestore-এ <code>allowlist</code> ও <code>admins</code> কালেকশনে প্রয়োজনীয় ইমেইল যোগ করুন।</li>
        </ol>
        <p className="muted">বিস্তারিত ধাপে ধাপে নির্দেশনা রিপোজিটরির README.md ফাইলে আছে।</p>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const { authMsg, setAuthMsg, authMode, setAuthMode, submitAuth, forgotPassword } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function switchMode(mode) {
    setAuthMode(mode);
    setAuthMsg('');
  }

  function onSubmit(ev) {
    ev.preventDefault();
    submitAuth({ email: email.trim(), password, confirm });
  }

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="brick-badge" style={{ margin: '0 auto 12px' }} />
        <h1>ড্রিম অ্যাপার্টমেন্ট</h1>
        <div className="sub">ফান্ড ট্র্যাকার — লগইন করুন</div>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>লগইন</button>
          <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>নতুন অ্যাকাউন্ট</button>
        </div>
        <AuthMsg msg={authMsg} />
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>ইমেইল</label>
            <input type="email" required autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>পাসওয়ার্ড</label>
            <input type="password" required minLength={6}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="কমপক্ষে ৬ অক্ষর" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {authMode === 'signup' && (
            <div className="field">
              <label>পাসওয়ার্ড নিশ্চিত করুন</label>
              <input type="password" autoComplete="new-password" minLength={6}
                placeholder="আবার পাসওয়ার্ড দিন" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          )}
          <span className="auth-forgot" onClick={() => forgotPassword(email.trim())}>পাসওয়ার্ড ভুলে গেছেন?</span>
          {authMode === 'signup' && (
            <p className="muted" style={{ margin: '-4px 0 12px' }}>
              সাইন আপের পর ইমেইল যাচাই করতে হবে, তারপর অ্যাডমিন অনুমোদন করলে ড্যাশবোর্ড দেখা যাবে।
            </p>
          )}
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <button type="submit" className="btn primary" style={{ flex: '1 1 100%' }}>
              {authMode === 'signup' ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগইন করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VerifyScreen() {
  const { authMsg, currentUser, recheckVerification, resendVerification, logout } = useAppState();
  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="brick-badge" style={{ margin: '0 auto 12px' }} />
        <h1>ইমেইল যাচাই করুন</h1>
        <div className="sub">যাচাইকরণ লিংক পাঠানো হয়েছে</div>
      </div>
      <div className="auth-card">
        <p className="muted"><b>{currentUser?.email}</b>-এ একটি যাচাইকরণ ইমেইল পাঠানো হয়েছে। ইমেইলের লিংকে ক্লিক করে যাচাই করুন, তারপর নিচের বাটনে চাপুন।</p>
        <AuthMsg msg={authMsg} />
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn primary" style={{ flex: '1 1 100%' }} onClick={recheckVerification}>✅ যাচাই করেছি, আবার চেক করুন</button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={resendVerification}>✉️ আবার পাঠান</button>
          <button type="button" className="btn ghost" onClick={logout}>🚪 লগআউট</button>
        </div>
      </div>
    </div>
  );
}

export function PendingScreen() {
  const { recheckPending, logout } = useAppState();
  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="brick-badge" style={{ margin: '0 auto 12px' }} />
        <h1>অনুমোদনের অপেক্ষায়</h1>
        <div className="sub">ইমেইল যাচাই সম্পন্ন হয়েছে</div>
      </div>
      <div className="auth-card">
        <p className="muted">আপনার আবেদন জমা হয়েছে। অ্যাডমিন অনুমোদন করলেই আপনি ড্যাশবোর্ড দেখতে পাবেন। কিছুক্ষণ পর আবার চেক করুন।</p>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn primary" style={{ flex: '1 1 100%' }} onClick={recheckPending}>🔄 আবার চেক করুন</button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={logout}>🚪 লগআউট</button>
        </div>
      </div>
    </div>
  );
}
