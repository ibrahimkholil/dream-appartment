import React from 'react';
import { useAppState } from '../state/store.jsx';
import {
  money, fmtDate, supplierInvoiced, supplierPaidAtPurchase, supplierDue,
  loanRepaid, loanBalance, shareholderPaid, perShareCost,
} from '../state/calculations.js';
import { paymentVoucherHtml, shareholderLedgerReportHtml, shareholderLedgerSummaryText } from '../lib/vouchers.js';
import { printVoucher, sharePdfReport } from '../lib/pdf.js';

export function SupplierLedgerModal({ supId, onClose }) {
  const { scopedState: state } = useAppState();
  const sup = state.suppliers.find((s) => s.id === supId);
  const invoiced = supplierInvoiced(state, supId);
  const paidAtPurchase = supplierPaidAtPurchase(state, supId);
  const payments = state.supplierPayments.filter((p) => p.supplierId === supId).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return (
    <>
      <h3>{sup ? sup.name : ''} — লেনদেন ইতিহাস</h3>
      <div className="li-sub" style={{ marginBottom: 10 }}>মোট চালান {money(invoiced)} · ক্রয়কালীন পরিশোধ {money(paidAtPurchase)} · বর্তমান বাকি <b>{money(supplierDue(state, supId))}</b></div>
      <div className="card" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {payments.length ? payments.map((p) => (
          <div className="list-item" key={p.id}>
            <div className="li-main"><div className="li-title">{fmtDate(p.date)}</div><div className="li-sub">{p.notes || ''}</div></div>
            <div className="li-amt num neg">{money(p.amount)}</div>
            <div className="li-actions"><div className="icon-btn" title="পেমেন্ট ভাউচার প্রিন্ট" onClick={() => printVoucher(paymentVoucherHtml('supplier', p, supId, state))}>🖨</div></div>
          </div>
        )) : <div className="empty">এখনো কোনো আলাদা পেমেন্ট রেকর্ড নেই</div>}
      </div>
      <div className="modal-actions"><button type="button" className="btn ghost" onClick={onClose}>বন্ধ করুন</button></div>
    </>
  );
}

export function LoanLedgerModal({ loanId, onClose }) {
  const { scopedState: state } = useAppState();
  const loan = state.loans.find((l) => l.id === loanId);
  const payments = state.loanPayments.filter((p) => p.loanId === loanId).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return (
    <>
      <h3>{loan ? loan.person : ''} — লেনদেন ইতিহাস</h3>
      <div className="li-sub" style={{ marginBottom: 10 }}>আসল {money(loan ? loan.principal : 0)} · পরিশোধিত {money(loanRepaid(state, loanId))} · বর্তমান স্থিতি <b>{money(loan ? loanBalance(state, loan) : 0)}</b></div>
      <div className="card" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {payments.length ? payments.map((p) => (
          <div className="list-item" key={p.id}>
            <div className="li-main"><div className="li-title">{fmtDate(p.date)}</div><div className="li-sub">{p.notes || ''}</div></div>
            <div className="li-amt num">{money(p.amount)}</div>
            <div className="li-actions"><div className="icon-btn" title="পেমেন্ট ভাউচার প্রিন্ট" onClick={() => printVoucher(paymentVoucherHtml('loan', p, loanId, state))}>🖨</div></div>
          </div>
        )) : <div className="empty">এখনো কোনো পরিশোধ রেকর্ড নেই</div>}
      </div>
      <div className="modal-actions"><button type="button" className="btn ghost" onClick={onClose}>বন্ধ করুন</button></div>
    </>
  );
}

export function ShareholderLedgerModal({ shId, onClose }) {
  const { scopedState: state, showToast } = useAppState();
  const p = state.shareholders.find((x) => x.id === shId);
  if (!p) return <div className="empty">তথ্য পাওয়া যায়নি</div>;
  const deps = state.deposits.filter((d) => d.name === p.name).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const paid = shareholderPaid(state, p.name);
  const dueAmt = perShareCost(state) * Number(p.shares || 0) - paid;
  return (
    <>
      <h3>{p.name} — পার্সোনাল লেজার</h3>
      <div className="li-sub" style={{ marginBottom: 10 }}>শেয়ার {p.shares} · মোট জমা {money(paid)} · {dueAmt <= 0 ? 'অগ্রিম' : 'বকেয়া'} {money(Math.abs(dueAmt))}</div>
      <div className="card" style={{ maxHeight: '44vh', overflowY: 'auto' }}>
        {deps.length ? deps.map((d) => (
          <div className="list-item" key={d.id}>
            <div className="li-main"><div className="li-title">{fmtDate(d.date)}</div><div className="li-sub">{d.receipt || ''}{d.method ? ' · ' + d.method : ''}</div></div>
            <div className="li-amt num pos">{money(d.amount)}</div>
          </div>
        )) : <div className="empty">কোনো জমা নেই</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onClose}>বন্ধ করুন</button>
        <button type="button" className="btn primary" onClick={() => printVoucher(shareholderLedgerReportHtml(shId, state))}>🖨️ প্রিন্ট / PDF</button>
      </div>
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn ghost" onClick={() => sharePdfReport('email', shareholderLedgerReportHtml(shId, state), 'পার্সোনাল-লেজার.pdf', 'শেয়ারহোল্ডার পার্সোনাল লেজার — ' + p.name, shareholderLedgerSummaryText(shId, state), showToast)}>✉️ ইমেইলে PDF পাঠান</button>
        <button type="button" className="btn ghost" onClick={() => sharePdfReport('whatsapp', shareholderLedgerReportHtml(shId, state), 'পার্সোনাল-লেজার.pdf', 'শেয়ারহোল্ডার পার্সোনাল লেজার — ' + p.name, shareholderLedgerSummaryText(shId, state), showToast)}>💬 হোয়াটসঅ্যাপে PDF পাঠান</button>
      </div>
    </>
  );
}
