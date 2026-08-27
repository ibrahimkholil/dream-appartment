import {
  esc, money, fmtDate, voucherNo, perShareCost, shareholderPaid, totalExpense,
  totalReceived, cashInHand, totalSupplierDue, totalLoanPayable, totalLoanReceivable,
  supplierInvoiced, supplierPaidAtPurchase, supplierPaymentsTotal, supplierDue,
  loanRepaid, loanBalance,
} from '../state/calculations.js';

function genDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
}

export function receiveVoucherHtml(d) {
  if (!d) return '<div class="voucher-box">তথ্য পাওয়া যায়নি</div>';
  return `
    <div class="voucher-box">
      <div class="v-head"><h2>ড্রিম অ্যাপার্টমেন্ট</h2><div class="v-sub">ফান্ড ট্র্যাকার — জমা রশিদ</div></div>
      <div class="v-type">রিসিভ ভাউচার / MONEY RECEIPT</div>
      <div class="v-row"><span class="k">রশিদ নং</span><span class="v">${esc(d.receipt || voucherNo('MR', d.id))}</span></div>
      <div class="v-row"><span class="k">তারিখ</span><span class="v">${fmtDate(d.date)}</span></div>
      <div class="v-row"><span class="k">শেয়ারহোল্ডারের নাম</span><span class="v">${esc(d.name)}</span></div>
      <div class="v-row"><span class="k">পেমেন্ট মাধ্যম</span><span class="v">${esc(d.method || '—')}</span></div>
      <div class="v-row"><span class="k">মন্তব্য</span><span class="v">${esc(d.notes || '—')}</span></div>
      <div class="voucher-amt-box">গৃহীত পরিমাণ: ${money(d.amount)}</div>
      <div class="voucher-sign"><div>প্রদানকারীর স্বাক্ষর</div><div>প্রস্তুতকারী</div><div>গ্রহীতার স্বাক্ষর</div></div>
    </div>`;
}

export function expenseVoucherHtml(e, state) {
  if (!e) return '<div class="voucher-box">তথ্য পাওয়া যায়নি</div>';
  const sup = e.supplierId ? state.suppliers.find((s) => s.id === e.supplierId) : null;
  return `
    <div class="voucher-box">
      <div class="v-head"><h2>ড্রিম অ্যাপার্টমেন্ট</h2><div class="v-sub">ফান্ড ট্র্যাকার — খরচের ভাউচার</div></div>
      <div class="v-type">এক্সপেন্স ভাউচার / EXPENSE VOUCHER</div>
      <div class="v-row"><span class="k">ভাউচার নং</span><span class="v">${esc(e.voucher || voucherNo('EXP', e.id))}</span></div>
      <div class="v-row"><span class="k">তারিখ</span><span class="v">${fmtDate(e.date)}</span></div>
      <div class="v-row"><span class="k">খাত</span><span class="v">${esc(e.category || '—')}</span></div>
      ${e.qty ? `<div class="v-row"><span class="k">পরিমাণ / একক দর</span><span class="v">${e.qty} ${esc(e.unit || '')} × ${money(e.rate)}</span></div>` : ''}
      ${sup ? `<div class="v-row"><span class="k">সাপ্লায়ার</span><span class="v">${esc(sup.name)}</span></div><div class="v-row"><span class="k">এখনই পরিশোধ</span><span class="v">${money(e.paidNow)}</span></div>` : ''}
      <div class="v-row"><span class="k">অনুমোদনকারী</span><span class="v">${esc(e.approvedBy || '—')}</span></div>
      <div class="v-row"><span class="k">মন্তব্য</span><span class="v">${esc(e.notes || '—')}</span></div>
      <div class="voucher-amt-box">মোট খরচ: ${money(e.total)}</div>
      <div class="voucher-sign"><div>প্রস্তুতকারী</div><div>অনুমোদনকারী</div><div>গ্রহীতার স্বাক্ষর</div></div>
    </div>`;
}

export function paymentVoucherHtml(kind, payment, entityId, state) {
  if (!payment) return '<div class="voucher-box">তথ্য পাওয়া যায়নি</div>';
  let name = '', label = '';
  if (kind === 'supplier') {
    const sup = state.suppliers.find((s) => s.id === entityId);
    name = sup ? sup.name : '';
    label = 'সাপ্লায়ার পেমেন্ট';
  } else {
    const loan = state.loans.find((l) => l.id === entityId);
    name = loan ? loan.person : '';
    label = loan && loan.type === 'payable' ? 'লোন পরিশোধ (আমরা দিচ্ছি)' : 'লোন ফেরত গ্রহণ (আমরা পাচ্ছি)';
  }
  return `
    <div class="voucher-box">
      <div class="v-head"><h2>ড্রিম অ্যাপার্টমেন্ট</h2><div class="v-sub">ফান্ড ট্র্যাকার — পেমেন্ট ভাউচার</div></div>
      <div class="v-type">পেমেন্ট ভাউচার / PAYMENT VOUCHER</div>
      <div class="v-row"><span class="k">ভাউচার নং</span><span class="v">${voucherNo('PAY', payment.id)}</span></div>
      <div class="v-row"><span class="k">তারিখ</span><span class="v">${fmtDate(payment.date)}</span></div>
      <div class="v-row"><span class="k">প্রাপক / সংশ্লিষ্ট</span><span class="v">${esc(name)}</span></div>
      <div class="v-row"><span class="k">ধরন</span><span class="v">${esc(label)}</span></div>
      <div class="v-row"><span class="k">মন্তব্য</span><span class="v">${esc(payment.notes || '—')}</span></div>
      <div class="voucher-amt-box">পরিমাণ: ${money(payment.amount)}</div>
      <div class="voucher-sign"><div>প্রদানকারী</div><div>অনুমোদনকারী</div><div>গ্রহীতার স্বাক্ষর</div></div>
    </div>`;
}

export function shareholderLedgerReportHtml(shId, state) {
  const p = state.shareholders.find((x) => x.id === shId);
  if (!p) return '<div class="voucher-box">তথ্য পাওয়া যায়নি</div>';
  const deps = state.deposits.filter((d) => d.name === p.name).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const paid = shareholderPaid(state, p.name);
  const psc = perShareCost(state);
  const shareOfCost = psc * Number(p.shares || 0);
  const dueAmt = shareOfCost - paid;
  const depRows = deps.map((d) => `<tr><td>${fmtDate(d.date)}</td><td>${esc(d.receipt || '')}</td><td>${esc(d.method || '')}</td><td class="num">${money(d.amount)}</td></tr>`).join('');
  return `
    <div class="print-title" style="display:block;"><h1>শেয়ারহোল্ডার পার্সোনাল লেজার</h1><div class="sub">তৈরি হয়েছে: ${genDate()}</div></div>
    <div class="card"><table class="report-table">
      <tr><td>নাম</td><td class="num">${esc(p.name)}</td></tr>
      <tr><td>মোবাইল</td><td class="num">${esc(p.phone || '—')}</td></tr>
      <tr><td>শেয়ার সংখ্যা</td><td class="num">${p.shares}</td></tr>
      <tr><td>প্রতি শেয়ার খরচ</td><td class="num">${money(psc)}</td></tr>
      <tr><td>তার প্রাপ্য অংশ (শেয়ার অনুযায়ী খরচ)</td><td class="num">${money(shareOfCost)}</td></tr>
      <tr><td>মোট জমা</td><td class="num">${money(paid)}</td></tr>
      <tr><td>${dueAmt <= 0 ? 'অগ্রিম' : 'বকেয়া'}</td><td class="num">${money(Math.abs(dueAmt))}</td></tr>
    </table></div>
    <div class="report-section-title">জমার বিস্তারিত</div>
    <div class="card"><table class="report-table">
      <thead><tr><th>তারিখ</th><th>রশিদ</th><th>মাধ্যম</th><th class="num">পরিমাণ</th></tr></thead>
      <tbody>${depRows || '<tr><td colspan="4" class="empty">কোনো জমা নেই</td></tr>'}</tbody>
      <tfoot><tr><td colspan="3">মোট</td><td class="num">${money(paid)}</td></tr></tfoot>
    </table></div>
    <div class="voucher-sign" style="max-width:480px; margin:56px auto 0;"><div>প্রস্তুতকারী</div><div>অনুমোদনকারী</div><div>শেয়ারহোল্ডারের স্বাক্ষর</div></div>`;
}

export function shareholderLedgerSummaryText(shId, state) {
  const p = state.shareholders.find((x) => x.id === shId);
  if (!p) return '';
  const deps = state.deposits.filter((d) => d.name === p.name).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const paid = shareholderPaid(state, p.name);
  const psc = perShareCost(state);
  const shareOfCost = psc * Number(p.shares || 0);
  const dueAmt = shareOfCost - paid;
  const depLines = deps.map((d) => `• ${fmtDate(d.date)} — ${d.receipt || '—'} (${d.method || '—'}): ${money(d.amount)}`).join('\n');
  return [
    `শেয়ারহোল্ডার পার্সোনাল লেজার — ${p.name}`, `তৈরি হয়েছে: ${genDate()}`, '',
    `মোবাইল: ${p.phone || '—'}`, `শেয়ার সংখ্যা: ${p.shares}`, `প্রতি শেয়ার খরচ: ${money(psc)}`,
    `প্রাপ্য অংশ: ${money(shareOfCost)}`, `মোট জমা: ${money(paid)}`,
    `${dueAmt <= 0 ? 'অগ্রিম' : 'বকেয়া'}: ${money(Math.abs(dueAmt))}`, '',
    'জমার বিস্তারিত:', depLines || 'কোনো জমা নেই',
  ].join('\n');
}

export function shareholderReportHtml(state) {
  const psc = perShareCost(state);
  const rows = [...state.shareholders].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
    const paid = shareholderPaid(state, p.name);
    const shareOfCost = psc * Number(p.shares || 0);
    const due = shareOfCost - paid;
    return `<tr><td>${esc(p.name)}</td><td>${esc(p.phone || '')}</td><td class="num">${p.shares}</td><td class="num">${money(shareOfCost)}</td><td class="num">${money(paid)}</td><td class="num">${due <= 0 ? 'অগ্রিম ' : 'বকেয়া '}${money(Math.abs(due))}</td></tr>`;
  }).join('');
  const totalPaid = state.shareholders.reduce((s, p) => s + shareholderPaid(state, p.name), 0);
  return `
    <div class="print-title" style="display:block;"><h1>ড্রিম অ্যাপার্টমেন্ট — শেয়ারহোল্ডার রিপোর্ট</h1><div class="sub">তৈরি হয়েছে: ${genDate()}</div></div>
    <div class="card"><table class="report-table">
      <thead><tr><th>নাম</th><th>মোবাইল</th><th class="num">শেয়ার</th><th class="num">প্রাপ্য অংশ</th><th class="num">জমা</th><th class="num">অবস্থা</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody>
      <tfoot><tr><td colspan="4">মোট</td><td class="num">${money(totalPaid)}</td><td></td></tr></tfoot>
    </table></div>`;
}

export function shareholderReportSummaryText(state) {
  const psc = perShareCost(state);
  const lines = [...state.shareholders].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
    const paid = shareholderPaid(state, p.name);
    const shareOfCost = psc * Number(p.shares || 0);
    const due = shareOfCost - paid;
    return `• ${p.name} (শেয়ার ${p.shares}): প্রাপ্য অংশ ${money(shareOfCost)}, জমা ${money(paid)}, ${due <= 0 ? 'অগ্রিম' : 'বকেয়া'} ${money(Math.abs(due))}`;
  }).join('\n');
  const totalPaid = state.shareholders.reduce((s, p) => s + shareholderPaid(state, p.name), 0);
  return ['ড্রিম অ্যাপার্টমেন্ট — শেয়ারহোল্ডার রিপোর্ট', `তৈরি হয়েছে: ${genDate()}`, '', lines || 'কোনো তথ্য নেই', '', `মোট জমা: ${money(totalPaid)}`].join('\n');
}

export function expenseReportHtml(state) {
  const rows = [...state.expenses].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((e) => {
    const sup = e.supplierId ? state.suppliers.find((s) => s.id === e.supplierId) : null;
    return `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.voucher || '')}</td><td>${esc(e.category || '')}</td><td>${e.qty ? e.qty + ' ' + esc(e.unit || '') : '—'}</td><td>${esc(sup ? sup.name : '—')}</td><td class="num">${money(e.total)}</td></tr>`;
  }).join('');
  const byCat = {};
  state.expenses.forEach((e) => { const c = e.category || 'অন্যান্য'; byCat[c] = (byCat[c] || 0) + (Number(e.total) || 0); });
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${money(v)}</td></tr>`).join('');
  return `
    <div class="print-title" style="display:block;"><h1>ড্রিম অ্যাপার্টমেন্ট — এক্সপেন্স রিপোর্ট</h1><div class="sub">তৈরি হয়েছে: ${genDate()}</div></div>
    <div class="report-section-title">খাত অনুযায়ী সারসংক্ষেপ</div>
    <div class="card"><table class="report-table"><thead><tr><th>খাত</th><th class="num">পরিমাণ</th></tr></thead><tbody>${catRows || '<tr><td colspan="2" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody></table></div>
    <div class="report-section-title">বিস্তারিত খরচের তালিকা</div>
    <div class="card"><table class="report-table">
      <thead><tr><th>তারিখ</th><th>ভাউচার</th><th>খাত</th><th>পরিমাণ</th><th>সাপ্লায়ার</th><th class="num">টাকা</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody>
      <tfoot><tr><td colspan="5">সর্বমোট</td><td class="num">${money(totalExpense(state))}</td></tr></tfoot>
    </table></div>`;
}

export function expenseReportSummaryText(state) {
  const byCat = {};
  state.expenses.forEach((e) => { const c = e.category || 'অন্যান্য'; byCat[c] = (byCat[c] || 0) + (Number(e.total) || 0); });
  const catLines = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `• ${c}: ${money(v)}`).join('\n');
  return ['ড্রিম অ্যাপার্টমেন্ট — এক্সপেন্স রিপোর্ট', `তৈরি হয়েছে: ${genDate()}`, '', 'খাত অনুযায়ী সারসংক্ষেপ:', catLines || 'কোনো তথ্য নেই', '', `সর্বমোট: ${money(totalExpense(state))}`].join('\n');
}

export function fullReportBodyHtml(state) {
  const exp = totalExpense(state), rec = totalReceived(state), cash = cashInHand(state), psc = perShareCost(state);
  const supDue = totalSupplierDue(state), loanPay = totalLoanPayable(state), loanRec = totalLoanReceivable(state);
  const byCat = {};
  state.expenses.forEach((e) => { const c = e.category || 'অন্যান্য'; byCat[c] = (byCat[c] || 0) + (Number(e.total) || 0); });
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${money(v)}</td></tr>`).join('');
  const shRows = [...state.shareholders].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
    const paid = shareholderPaid(state, p.name);
    const due = psc * Number(p.shares || 0) - paid;
    return `<tr><td>${esc(p.name)}</td><td class="num">${p.shares}</td><td class="num">${money(paid)}</td><td class="num">${due <= 0 ? 'অগ্রিম ' : 'বকেয়া '}${money(Math.abs(due))}</td></tr>`;
  }).join('');
  const depRows = [...state.deposits].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((d) => `<tr><td>${fmtDate(d.date)}</td><td>${esc(d.name)}</td><td>${esc(d.receipt || '')}</td><td class="num">${money(d.amount)}</td></tr>`).join('');
  const expRows = [...state.expenses].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((e) => `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.category || '')}</td><td>${esc(e.voucher || '')}</td><td class="num">${money(e.total)}</td></tr>`).join('');
  const supRows = [...state.suppliers].sort((a, b) => supplierDue(state, b.id) - supplierDue(state, a.id)).map((s) => {
    const invoiced = supplierInvoiced(state, s.id);
    const paid = supplierPaidAtPurchase(state, s.id) + supplierPaymentsTotal(state, s.id);
    const due = supplierDue(state, s.id);
    return `<tr><td>${esc(s.name)}</td><td class="num">${money(invoiced)}</td><td class="num">${money(paid)}</td><td class="num">${money(due)}</td></tr>`;
  }).join('');
  const loanRows = [...state.loans].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((l) => {
    const repaid = loanRepaid(state, l.id);
    const bal = loanBalance(state, l);
    return `<tr><td>${esc(l.person)}</td><td>${l.type === 'payable' ? 'আমরা দেব' : 'আমরা পাব'}</td><td class="num">${money(l.principal)}</td><td class="num">${money(repaid)}</td><td class="num">${money(bal)}</td></tr>`;
  }).join('');
  return `
    <div class="print-title"><h1>ড্রিম অ্যাপার্টমেন্ট — সম্পূর্ণ রিপোর্ট</h1><div class="sub">তৈরি হয়েছে: ${genDate()}</div></div>
    <div class="report-meta">রিপোর্ট তৈরির তারিখ ও সময়: ${genDate()}</div>
    <div class="section-title">সারসংক্ষেপ</div>
    <div class="card"><table class="report-table">
      <tr><td>মোট খরচ</td><td class="num">${money(exp)}</td></tr>
      <tr><td>মোট জমা</td><td class="num">${money(rec)}</td></tr>
      <tr><td>হাতে ক্যাশ</td><td class="num">${money(cash)}</td></tr>
      <tr><td>প্রতি শেয়ার খরচ</td><td class="num">${money(psc)}</td></tr>
      <tr><td>সাপ্লায়ার বাকি</td><td class="num">${money(supDue)}</td></tr>
      <tr><td>লোন — আমরা দেব</td><td class="num">${money(loanPay)}</td></tr>
      <tr><td>লোন — আমরা পাব</td><td class="num">${money(loanRec)}</td></tr>
    </table></div>
    <div class="section-title">খাত অনুযায়ী খরচ</div>
    <div class="card"><table class="report-table"><thead><tr><th>খাত</th><th class="num">পরিমাণ</th></tr></thead><tbody>${catRows || '<tr><td colspan="2" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody></table></div>
    <div class="section-title">শেয়ারহোল্ডার তালিকা</div>
    <div class="card"><table class="report-table"><thead><tr><th>নাম</th><th class="num">শেয়ার</th><th class="num">জমা</th><th class="num">অবস্থা</th></tr></thead><tbody>${shRows || '<tr><td colspan="4" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody></table></div>
    <div class="section-title">জমার তালিকা</div>
    <div class="card"><table class="report-table"><thead><tr><th>তারিখ</th><th>নাম</th><th>রসিদ</th><th class="num">পরিমাণ</th></tr></thead><tbody>${depRows || '<tr><td colspan="4" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody><tfoot><tr><td colspan="3">মোট</td><td class="num">${money(rec)}</td></tr></tfoot></table></div>
    <div class="section-title">খরচের তালিকা</div>
    <div class="card"><table class="report-table"><thead><tr><th>তারিখ</th><th>খাত</th><th>ভাউচার</th><th class="num">পরিমাণ</th></tr></thead><tbody>${expRows || '<tr><td colspan="4" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody><tfoot><tr><td colspan="3">মোট</td><td class="num">${money(exp)}</td></tr></tfoot></table></div>
    <div class="section-title">পাওনাদার / সাপ্লায়ার</div>
    <div class="card"><table class="report-table"><thead><tr><th>নাম</th><th class="num">চালান</th><th class="num">পরিশোধ</th><th class="num">বাকি</th></tr></thead><tbody>${supRows || '<tr><td colspan="4" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody></table></div>
    <div class="section-title">পার্সোনাল লোন হিসাব</div>
    <div class="card"><table class="report-table"><thead><tr><th>নাম</th><th>ধরন</th><th class="num">আসল</th><th class="num">পরিশোধ</th><th class="num">বাকি</th></tr></thead><tbody>${loanRows || '<tr><td colspan="5" class="empty">কোনো তথ্য নেই</td></tr>'}</tbody></table></div>`;
}

export function fullReportSummaryText(state) {
  const exp = totalExpense(state), rec = totalReceived(state), cash = cashInHand(state), psc = perShareCost(state);
  const supDue = totalSupplierDue(state), loanPay = totalLoanPayable(state), loanRec = totalLoanReceivable(state);
  const byCat = {};
  state.expenses.forEach((e) => { const c = e.category || 'অন্যান্য'; byCat[c] = (byCat[c] || 0) + (Number(e.total) || 0); });
  const catLines = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `• ${c}: ${money(v)}`).join('\n');
  const shLines = [...state.shareholders].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
    const paid = shareholderPaid(state, p.name);
    const due = psc * Number(p.shares || 0) - paid;
    return `• ${p.name} (শেয়ার ${p.shares}): জমা ${money(paid)}, ${due <= 0 ? 'অগ্রিম' : 'বকেয়া'} ${money(Math.abs(due))}`;
  }).join('\n');
  return [
    'ড্রিম অ্যাপার্টমেন্ট — সম্পূর্ণ রিপোর্ট', `তৈরি হয়েছে: ${genDate()}`, '',
    'সারসংক্ষেপ:', `মোট খরচ: ${money(exp)}`, `মোট জমা: ${money(rec)}`, `হাতে ক্যাশ: ${money(cash)}`,
    `প্রতি শেয়ার খরচ: ${money(psc)}`, `সাপ্লায়ার বাকি: ${money(supDue)}`, `লোন — আমরা দেব: ${money(loanPay)}`, `লোন — আমরা পাব: ${money(loanRec)}`, '',
    'খাত অনুযায়ী খরচ:', catLines || 'কোনো তথ্য নেই', '',
    'শেয়ারহোল্ডার তালিকা:', shLines || 'কোনো তথ্য নেই',
  ].join('\n');
}
