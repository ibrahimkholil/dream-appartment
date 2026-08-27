import React from 'react';
import { useAppState } from '../../state/store.jsx';
import { money, fmtDate } from '../../state/calculations.js';
import { RowActions } from '../RowActions.jsx';
import { ExpenseForm } from '../Forms.jsx';
import { expenseVoucherHtml } from '../../lib/vouchers.js';
import { printVoucher } from '../../lib/pdf.js';

export default function Expenses() {
  const { state, saveKey, showToast, openModal, closeModal } = useAppState();
  const rows = [...state.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function openEdit(e) { openModal(<ExpenseForm record={e} onClose={closeModal} />); }
  async function del(id) {
    await saveKey('expenses', state.expenses.filter((x) => x.id !== id));
    showToast('মুছে ফেলা হয়েছে');
  }

  return (
    <>
      <div className="section-title">খরচের তালিকা <span className="tag">{state.expenses.length} এন্ট্রি</span></div>
      <div className="card">
        {rows.length ? rows.map((e) => {
          const sup = e.supplierId ? state.suppliers.find((s) => s.id === e.supplierId) : null;
          const due = sup ? (Number(e.total) || 0) - (Number(e.paidNow) || 0) : 0;
          return (
            <div className="list-item" key={e.id}>
              <div className="li-main">
                <div className="li-title">{e.category || '—'} {e.voucher ? <span className="li-sub" style={{ display: 'inline' }}>· {e.voucher}</span> : null}</div>
                <div className="li-sub">{fmtDate(e.date)} {e.qty ? '· ' + e.qty + ' ' + (e.unit || '') : ''} {e.approvedBy ? '· ' + e.approvedBy : ''}</div>
                {sup && <div className="li-sub">🏗️ {sup.name} {due > 0 ? '· বাকি ' + money(due) : '· সম্পূর্ণ পরিশোধ'}</div>}
              </div>
              <div className="li-amt num neg">{money(e.total)}</div>
              <RowActions onDelete={() => del(e.id)}>
                <div className="icon-btn" title="খরচের ভাউচার প্রিন্ট" onClick={() => printVoucher(expenseVoucherHtml(e, state))}>🖨</div>
                <div className="icon-btn" onClick={() => openEdit(e)}>✎</div>
              </RowActions>
            </div>
          );
        }) : <div className="empty">এখনো কোনো খরচ যোগ হয়নি। নিচের ＋ বাটনে চাপুন।</div>}
      </div>
    </>
  );
}
