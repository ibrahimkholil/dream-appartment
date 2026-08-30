import React from 'react';
import { useAppState } from '../../state/store.jsx';
import { money, shareholderPaid, perShareCost } from '../../state/calculations.js';
import { RowActions } from '../RowActions.jsx';
import { ShareholderForm } from '../Forms.jsx';
import { ShareholderLedgerModal } from '../LedgerModal.jsx';

export default function Shareholders() {
  const { state, scopedState, saveKey, showToast, openModal, closeModal } = useAppState();
  const rows = [...scopedState.shareholders].sort((a, b) => a.name.localeCompare(b.name));

  function openEdit(p) { openModal(<ShareholderForm record={p} onClose={closeModal} />); }
  function openLedger(id) { openModal(<ShareholderLedgerModal shId={id} onClose={closeModal} />); }
  async function del(id) {
    await saveKey('shareholders', state.shareholders.filter((x) => x.id !== id));
    showToast('মুছে ফেলা হয়েছে');
  }

  return (
    <>
      <div className="section-title">শেয়ারহোল্ডার তালিকা <span className="tag">{scopedState.shareholders.length} জন</span></div>
      <div className="card">
        {rows.length ? rows.map((p) => {
          const paid = shareholderPaid(scopedState, p.name);
          const due = perShareCost(scopedState) * Number(p.shares || 0) - paid;
          return (
            <div className="list-item" key={p.id}>
              <div className="li-main">
                <div className="li-title">{p.name}</div>
                <div className="li-sub">{p.phone || ''} · শেয়ার {p.shares} · জমা {money(paid)}</div>
              </div>
              <div className={'li-amt num ' + (due <= 0 ? 'pos' : 'neg')}>{due <= 0 ? 'অগ্রিম ' : 'বকেয়া '}{money(Math.abs(due))}</div>
              <RowActions onDelete={() => del(p.id)}>
                <div className="icon-btn" title="পার্সোনাল লেজার / রিপোর্ট" onClick={() => openLedger(p.id)}>📄</div>
                <div className="icon-btn" onClick={() => openEdit(p)}>✎</div>
              </RowActions>
            </div>
          );
        }) : <div className="empty">এখনো কোনো শেয়ারহোল্ডার যোগ হয়নি। নিচের ＋ বাটনে চাপুন।</div>}
      </div>
    </>
  );
}
