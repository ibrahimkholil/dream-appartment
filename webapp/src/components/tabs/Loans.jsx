import React from 'react';
import { useAppState } from '../../state/store.jsx';
import { money, fmtDate, loanRepaid, loanBalance } from '../../state/calculations.js';
import { RowActions } from '../RowActions.jsx';
import { LoanForm, PaymentForm } from '../Forms.jsx';
import { LoanLedgerModal } from '../LedgerModal.jsx';

export default function Loans() {
  const { state, saveKey, showToast, openModal, closeModal } = useAppState();
  const rows = [...state.loans].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function openEdit(l) { openModal(<LoanForm record={l} onClose={closeModal} />); }
  function openPay(id) { openModal(<PaymentForm kind="loan" entityId={id} onClose={closeModal} />); }
  function openLedger(id) { openModal(<LoanLedgerModal loanId={id} onClose={closeModal} />); }
  async function del(id) {
    await saveKey('loans', state.loans.filter((x) => x.id !== id));
    showToast('মুছে ফেলা হয়েছে');
  }

  return (
    <>
      <div className="section-title">পার্সোনাল লোন হিসাব <span className="tag">{state.loans.length} টি</span></div>
      <div className="card">
        {rows.length ? rows.map((l) => {
          const repaid = loanRepaid(state, l.id);
          const bal = loanBalance(state, l);
          return (
            <div className="list-item" key={l.id}>
              <div className="li-main">
                <div className="li-title">{l.person} <span className="catchip">{l.type === 'payable' ? 'আমরা দেব' : 'আমরা পাব'}</span></div>
                <div className="li-sub">{fmtDate(l.date)} · আসল {money(l.principal)} · পরিশোধ {money(repaid)}</div>
              </div>
              <div className={'li-amt num ' + (l.type === 'payable' ? 'neg' : 'pos')}>{money(bal)}</div>
              <RowActions onDelete={() => del(l.id)}>
                <div className="icon-btn" title="পেমেন্ট করুন" onClick={() => openPay(l.id)}>💵</div>
                <div className="icon-btn" title="লেনদেন ইতিহাস / ভাউচার" onClick={() => openLedger(l.id)}>🧾</div>
                <div className="icon-btn" onClick={() => openEdit(l)}>✎</div>
              </RowActions>
            </div>
          );
        }) : <div className="empty">এখনো কোনো লোন হিসাব যোগ হয়নি। নিচের ＋ বাটনে চাপুন।</div>}
      </div>
    </>
  );
}
