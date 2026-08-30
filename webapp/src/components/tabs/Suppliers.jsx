import React from 'react';
import { useAppState } from '../../state/store.jsx';
import { money, supplierInvoiced, supplierPaidAtPurchase, supplierPaymentsTotal, supplierDue } from '../../state/calculations.js';
import { RowActions } from '../RowActions.jsx';
import { SupplierForm, PaymentForm } from '../Forms.jsx';
import { SupplierLedgerModal } from '../LedgerModal.jsx';

export default function Suppliers() {
  const { state, scopedState, saveKey, showToast, openModal, closeModal } = useAppState();
  const rows = [...scopedState.suppliers].sort((a, b) => supplierDue(scopedState, b.id) - supplierDue(scopedState, a.id));

  function openEdit(s) { openModal(<SupplierForm record={s} onClose={closeModal} />); }
  function openPay(id) { openModal(<PaymentForm kind="supplier" entityId={id} onClose={closeModal} />); }
  function openLedger(id) { openModal(<SupplierLedgerModal supId={id} onClose={closeModal} />); }
  async function del(id) {
    await saveKey('suppliers', state.suppliers.filter((x) => x.id !== id));
    showToast('মুছে ফেলা হয়েছে');
  }

  return (
    <>
      <div className="section-title">পাওনাদার / সাপ্লায়ার <span className="tag">{scopedState.suppliers.length} জন</span></div>
      <div className="card">
        {rows.length ? rows.map((s) => {
          const invoiced = supplierInvoiced(scopedState, s.id);
          const paid = supplierPaidAtPurchase(scopedState, s.id) + supplierPaymentsTotal(scopedState, s.id);
          const due = supplierDue(scopedState, s.id);
          return (
            <div className="list-item" key={s.id}>
              <div className="li-main">
                <div className="li-title">{s.name}</div>
                <div className="li-sub">{s.phone || ''} · চালান {money(invoiced)} · পরিশোধ {money(paid)}</div>
              </div>
              <div className={'li-amt num ' + (due > 0 ? 'neg' : 'pos')}>{due > 0 ? 'বাকি ' + money(due) : 'ক্লিয়ার'}</div>
              <RowActions onDelete={() => del(s.id)}>
                <div className="icon-btn" title="পেমেন্ট করুন" onClick={() => openPay(s.id)}>💵</div>
                <div className="icon-btn" title="লেনদেন ইতিহাস / ভাউচার" onClick={() => openLedger(s.id)}>🧾</div>
                <div className="icon-btn" onClick={() => openEdit(s)}>✎</div>
              </RowActions>
            </div>
          );
        }) : <div className="empty">এখনো কোনো সাপ্লায়ার যোগ হয়নি। নিচের ＋ বাটনে চাপুন।</div>}
      </div>
    </>
  );
}
