export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function money(n) {
  n = Number(n) || 0;
  return '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  return d || '—';
}

export function totalExpense(state) {
  return state.expenses.reduce((s, e) => s + (Number(e.total) || 0), 0);
}
export function totalReceived(state) {
  return state.deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
}
export function totalShares(state) {
  return state.shareholders.reduce((s, p) => s + (Number(p.shares) || 0), 0);
}
export function perShareCost(state) {
  const ts = totalShares(state);
  return ts > 0 ? totalExpense(state) / ts : 0;
}
export function shareholderPaid(state, name) {
  return state.deposits.filter((d) => d.name === name).reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

export function supplierInvoiced(state, id) {
  return state.expenses.filter((e) => e.supplierId === id).reduce((s, e) => s + (Number(e.total) || 0), 0);
}
export function supplierPaidAtPurchase(state, id) {
  return state.expenses.filter((e) => e.supplierId === id).reduce((s, e) => s + (Number(e.paidNow) || 0), 0);
}
export function supplierPaymentsTotal(state, id) {
  return state.supplierPayments.filter((p) => p.supplierId === id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
}
export function supplierDue(state, id) {
  return supplierInvoiced(state, id) - supplierPaidAtPurchase(state, id) - supplierPaymentsTotal(state, id);
}
export function totalSupplierDue(state) {
  return state.suppliers.reduce((s, sup) => s + supplierDue(state, sup.id), 0);
}
export function cashPaidToSuppliers(state) {
  return state.supplierPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
}
export function cashPaidForExpenses(state) {
  return state.expenses.reduce((s, e) => {
    if (e.supplierId) return s + (Number(e.paidNow) || 0);
    return s + (Number(e.total) || 0);
  }, 0);
}

export function loanRepaid(state, id) {
  return state.loanPayments.filter((p) => p.loanId === id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
}
export function loanBalance(state, loan) {
  return (Number(loan.principal) || 0) - loanRepaid(state, loan.id);
}
export function loansByType(state, type) {
  return state.loans.filter((l) => l.type === type);
}
export function totalLoanPayable(state) {
  return loansByType(state, 'payable').reduce((s, l) => s + loanBalance(state, l), 0);
}
export function totalLoanReceivable(state) {
  return loansByType(state, 'receivable').reduce((s, l) => s + loanBalance(state, l), 0);
}
export function loanCashInflowOutflow(state) {
  const payablePrincipal = loansByType(state, 'payable').reduce((s, l) => s + (Number(l.principal) || 0), 0);
  const payableRepaid = state.loanPayments
    .filter((p) => { const l = state.loans.find((x) => x.id === p.loanId); return l && l.type === 'payable'; })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const receivablePrincipal = loansByType(state, 'receivable').reduce((s, l) => s + (Number(l.principal) || 0), 0);
  const receivableRepaid = state.loanPayments
    .filter((p) => { const l = state.loans.find((x) => x.id === p.loanId); return l && l.type === 'receivable'; })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return payablePrincipal - payableRepaid - receivablePrincipal + receivableRepaid;
}
export function cashInHand(state) {
  return totalReceived(state) - cashPaidForExpenses(state) - cashPaidToSuppliers(state) + loanCashInflowOutflow(state);
}

export function nextReceiptNumber(state) {
  let max = 0;
  state.deposits.forEach((d) => {
    const m = /^MR-(\d+)$/.exec((d.receipt || '').trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'MR-' + (max + 1);
}
export function nextVoucherNumber(state) {
  let max = 0;
  state.expenses.forEach((e) => {
    const m = /^EXP-(\d+)$/.exec((e.voucher || '').trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'EXP-' + String(max + 1).padStart(3, '0');
}

export function voucherNo(prefix, id) {
  return prefix + '-' + String(id).slice(-6).toUpperCase();
}

export const APP_KEYS = [
  'shareholders', 'deposits', 'expenses', 'categories',
  'suppliers', 'supplierPayments', 'loans', 'loanPayments',
];

export function emptyState() {
  return { shareholders: [], deposits: [], expenses: [], categories: [], suppliers: [], supplierPayments: [], loans: [], loanPayments: [] };
}

export function seedCategories() {
  const list = [
    ['রড ক্রয়', 'কেজি'], ['সিমেন্ট ক্রয়', 'বস্তা'], ['সাদা বালু ক্রয়', 'সিএফটি'],
    ['লাল বালু ক্রয়', 'সিএফটি'], ['পাথর ক্রয়', 'সিএফটি'], ['ইটা ক্রয়', 'পিস'],
    ['প্রিন্টিং ও স্টেশনারী', ''], ['ইটের খোয়া', 'সিএফটি'], ['যাতায়াত', ''],
    ['রাজ কন্ট্রাক্টর', ''], ['সেনেটারী মালামাল', ''], ['বিদ্যুতের মালামাল', ''],
    ['সেনেটারী কন্ট্রাক্টর', ''], ['বিদ্যুতের কন্ট্রাক্টর', ''], ['দৈনিক মজুরি', ''],
    ['ডিজাইন ও রাজউক প্লান', ''], ['বেতন', ''], ['সার্ভিস চার্জ', ''],
  ];
  return list.map(([name, unit]) => ({ id: uid(), name, unit }));
}
