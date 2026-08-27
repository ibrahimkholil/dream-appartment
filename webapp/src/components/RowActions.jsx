import React, { useState } from 'react';

export function RowActions({ onDelete, children }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="confirm-strip">
        <span>মুছে ফেলবেন?</span>
        <button type="button" className="cancel" onClick={() => setConfirming(false)}>না</button>
        <button type="button" className="yes" onClick={() => { onDelete(); setConfirming(false); }}>হ্যাঁ, মুছুন</button>
      </div>
    );
  }
  return <div className="li-actions">{children}<div className="icon-btn danger" onClick={() => setConfirming(true)}>🗑</div></div>;
}
