import React from 'react';
import { useAppState } from '../../state/store.jsx';
import { money, fmtDate } from '../../state/calculations.js';
import { RowActions } from '../RowActions.jsx';
import { DepositForm } from '../Forms.jsx';
import { receiveVoucherHtml } from '../../lib/vouchers.js';
import { printVoucher } from '../../lib/pdf.js';

export default function Deposits() {
  const { state, scopedState, saveKey, showToast, openModal, closeModal } = useAppState();
  const rows = [...scopedState.deposits].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function openEdit(d) { openModal(<DepositForm record={d} onClose={closeModal} />); }
  async function del(id) {
    await saveKey('deposits', state.deposits.filter((x) => x.id !== id));
    showToast('মুছে ফেলা হয়েছে');
  }

  return (
    <>
      <div className="section-title">জমার তালিকা <span className="tag">{scopedState.deposits.length} এন্ট্রি</span></div>
      <div className="card">
        {rows.length ? rows.map((d) => (
          <div className="list-item" key={d.id}>
            <div className="li-main">
              <div className="li-title">{d.name || '—'}</div>
              <div className="li-sub">{fmtDate(d.date)} · {d.receipt || ''}{d.method ? ' · ' + d.method : ''}</div>
            </div>
            <div className="li-amt num pos">{money(d.amount)}</div>
            <RowActions onDelete={() => del(d.id)}>
              <div className="icon-btn" title="রিসিভ ভাউচার প্রিন্ট" onClick={() => printVoucher(receiveVoucherHtml(d))}>🖨</div>
              <div className="icon-btn" onClick={() => openEdit(d)}>✎</div>
            </RowActions>
          </div>
        )) : <div className="empty">এখনো কোনো জমা যোগ হয়নি। নিচের ＋ বাটনে চাপুন।</div>}
      </div>
    </>
  );
}
