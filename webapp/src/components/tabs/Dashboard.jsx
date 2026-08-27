import React from 'react';
import { useAppState } from '../../state/store.jsx';
import {
  money, totalExpense, totalReceived, cashInHand, perShareCost,
  totalSupplierDue, totalLoanPayable, totalLoanReceivable, supplierDue,
  loanBalance, totalShares,
} from '../../state/calculations.js';

function ExpenseByCategoryChart({ rows }) {
  if (!rows.length) return <div className="empty">এখনো কোনো খরচ যোগ হয়নি</div>;
  const max = rows[0][1] || 1;
  return (
    <>
      {rows.map(([cat, amt]) => (
        <div className="bar-row" key={cat}>
          <div className="bar-row-top">
            <span>{cat}</span>
            <span className="num">{money(amt)}</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: Math.max(3, (amt / max) * 100) + '%' }} /></div>
        </div>
      ))}
    </>
  );
}

export default function Dashboard() {
  const { state } = useAppState();
  const exp = totalExpense(state), rec = totalReceived(state), cash = cashInHand(state), psc = perShareCost(state);
  const supDue = totalSupplierDue(state), loanPay = totalLoanPayable(state), loanRec = totalLoanReceivable(state);

  const byCat = {};
  state.expenses.forEach((e) => {
    const c = e.category || 'অন্যান্য';
    byCat[c] = (byCat[c] || 0) + (Number(e.total) || 0);
  });
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const topSuppliers = [...state.suppliers]
    .map((s) => ({ ...s, due: supplierDue(state, s.id) }))
    .filter((s) => s.due > 0).sort((a, b) => b.due - a.due).slice(0, 5);

  const activeLoans = [...state.loans]
    .map((l) => ({ ...l, bal: loanBalance(state, l) }))
    .filter((l) => l.bal > 0).sort((a, b) => b.bal - a.bal).slice(0, 5);

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">মোট খরচ</div><div className="stat-value num">{money(exp)}</div></div>
        <div className="stat-card"><div className="stat-label">মোট জমা</div><div className="stat-value num pos">{money(rec)}</div></div>
        <div className="stat-card"><div className="stat-label">হাতে ক্যাশ</div><div className={'stat-value num ' + (cash >= 0 ? 'pos' : 'neg')}>{money(cash)}</div></div>
        <div className="stat-card"><div className="stat-label">প্রতি শেয়ার খরচ</div><div className="stat-value num">{money(psc)}</div></div>
        <div className="stat-card"><div className="stat-label">সাপ্লায়ার বাকি</div><div className={'stat-value num ' + (supDue > 0 ? 'neg' : '')}>{money(supDue)}</div></div>
        <div className="stat-card"><div className="stat-label">লোন — আমরা দেব</div><div className={'stat-value num ' + (loanPay > 0 ? 'neg' : '')}>{money(loanPay)}</div></div>
        <div className="stat-card" style={{ gridColumn: '1/-1' }}><div className="stat-label">লোন — আমরা পাব</div><div className={'stat-value num ' + (loanRec > 0 ? 'pos' : '')}>{money(loanRec)}</div></div>
      </div>

      <div className="section-title">খাত অনুযায়ী খরচ <span className="tag">{Object.keys(byCat).length} খাত</span></div>
      <div className="card"><ExpenseByCategoryChart rows={catRows} /></div>

      <div className="section-title">সবচেয়ে বেশি বাকি — সাপ্লায়ার <span className="tag">{state.suppliers.length} জন</span></div>
      <div className="card">
        {topSuppliers.length ? topSuppliers.map((s) => (
          <div className="list-item" key={s.id}>
            <div className="li-main"><div className="li-title">{s.name}</div></div>
            <div className="li-amt num neg">{money(s.due)}</div>
          </div>
        )) : <div className="empty">কোনো বকেয়া নেই</div>}
      </div>

      <div className="section-title">সক্রিয় লোন হিসাব <span className="tag">{state.loans.length} টি</span></div>
      <div className="card">
        {activeLoans.length ? activeLoans.map((l) => (
          <div className="list-item" key={l.id}>
            <div className="li-main">
              <div className="li-title">{l.person}</div>
              <div className="li-sub">{l.type === 'payable' ? 'আমরা দেব' : 'আমরা পাব'}</div>
            </div>
            <div className={'li-amt num ' + (l.type === 'payable' ? 'neg' : 'pos')}>{money(l.bal)}</div>
          </div>
        )) : <div className="empty">কোনো লোন হিসাব নেই</div>}
      </div>

      <div className="section-title">সংক্ষিপ্ত তথ্য</div>
      <div className="card">
        <div className="list-item"><div className="li-title">মোট শেয়ারহোল্ডার</div><div className="li-amt num">{state.shareholders.length} জন</div></div>
        <div className="list-item"><div className="li-title">মোট শেয়ার সংখ্যা</div><div className="li-amt num">{totalShares(state)}</div></div>
        <div className="list-item"><div className="li-title">মোট জমার এন্ট্রি</div><div className="li-amt num">{state.deposits.length}</div></div>
        <div className="list-item"><div className="li-title">মোট খরচের এন্ট্রি</div><div className="li-amt num">{state.expenses.length}</div></div>
      </div>
    </>
  );
}
