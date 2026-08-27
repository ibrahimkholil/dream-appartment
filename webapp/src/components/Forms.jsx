import React, { useEffect, useState } from 'react';
import { useAppState } from '../state/store.jsx';
import { uid, nextReceiptNumber, nextVoucherNumber, loanBalance, supplierDue } from '../state/calculations.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function FormShell({ title, onCancel, onSubmit, children }) {
  return (
    <>
      <h3>{title}</h3>
      <form onSubmit={onSubmit}>
        {children}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>বাতিল</button>
          <button type="submit" className="btn primary">সংরক্ষণ করুন</button>
        </div>
      </form>
    </>
  );
}

async function saveEntity(saveKey, state, type, id, data) {
  const list = state[type].slice();
  if (id) {
    const idx = list.findIndex((x) => x.id === id);
    list[idx] = { ...list[idx], ...data };
  } else {
    list.push({ id: uid(), ...data });
  }
  await saveKey(type, list);
}

export function DepositForm({ record, onClose }) {
  const { state, saveKey, showToast } = useAppState();
  const r = record || { date: todayISO(), name: '', receipt: nextReceiptNumber(state), amount: '', method: '', notes: '' };
  const [form, setForm] = useState(r);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(ev) {
    ev.preventDefault();
    await saveEntity(saveKey, state, 'deposits', record?.id, { ...form, amount: Number(form.amount) || 0 });
    showToast('সংরক্ষণ হয়েছে');
    onClose();
  }

  return (
    <FormShell title={record ? 'জমা এডিট করুন' : 'নতুন জমা এন্ট্রি'} onCancel={onClose} onSubmit={onSubmit}>
      <div className="field-row">
        <div className="field"><label>তারিখ</label><input type="date" required value={form.date || ''} onChange={(e) => set('date', e.target.value)} /></div>
        <div className="field"><label>রসিদ নং</label><input type="text" readOnly value={form.receipt || ''} /></div>
      </div>
      <div className="field">
        <label>শেয়ারহোল্ডারের নাম</label>
        <select required value={form.name || ''} onChange={(e) => set('name', e.target.value)}>
          <option value="">— নির্বাচন করুন —</option>
          {state.shareholders.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <div className="field"><label>জমার পরিমাণ (৳)</label><input type="number" step="any" required value={form.amount ?? ''} onChange={(e) => set('amount', e.target.value)} /></div>
      <div className="field">
        <label>পেমেন্ট মাধ্যম</label>
        <select value={form.method || ''} onChange={(e) => set('method', e.target.value)}>
          <option value="">— নির্বাচন করুন —</option>
          <option>নগদ (Cash)</option>
          <option>ব্যাংক ট্রান্সফার</option>
          <option>চেক</option>
          <option>বিকাশ/নগদ (MFS)</option>
        </select>
      </div>
      <div className="field"><label>মন্তব্য</label><input type="text" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
    </FormShell>
  );
}

export function ExpenseForm({ record, onClose }) {
  const { state, saveKey, showToast } = useAppState();
  const r = record || { date: todayISO(), voucher: nextVoucherNumber(state), category: '', qty: '', unit: '', rate: '', total: '', approvedBy: '', notes: '', paymentType: 'cash', supplierId: '', paidNow: '' };
  const [form, setForm] = useState({ ...r, paymentType: r.paymentType || (r.supplierId ? 'credit' : 'cash') });
  const isCredit = form.paymentType === 'credit';

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  useEffect(() => {
    const q = parseFloat(form.qty), rt = parseFloat(form.rate);
    if (!isNaN(q) && !isNaN(rt)) set('total', q * rt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.qty, form.rate]);

  useEffect(() => {
    const cat = state.categories.find((c) => c.name === form.category);
    set('unit', (cat && cat.unit) || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  async function onSubmit(ev) {
    ev.preventDefault();
    const data = { ...form, qty: form.qty === '' ? '' : Number(form.qty), rate: form.rate === '' ? '' : Number(form.rate), total: Number(form.total) || 0 };
    if (!isCredit) { data.supplierId = ''; data.paidNow = ''; }
    else { data.paidNow = Number(data.paidNow) || 0; }
    await saveEntity(saveKey, state, 'expenses', record?.id, data);
    showToast('সংরক্ষণ হয়েছে');
    onClose();
  }

  return (
    <FormShell title={record ? 'খরচ এডিট করুন' : 'নতুন খরচ এন্ট্রি'} onCancel={onClose} onSubmit={onSubmit}>
      <div className="field-row">
        <div className="field"><label>তারিখ</label><input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} /></div>
        <div className="field"><label>ভাউচার নং</label><input type="text" readOnly value={form.voucher || ''} /></div>
      </div>
      <div className="field">
        <label>খরচের খাত</label>
        <select required value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
          <option value="">— নির্বাচন করুন —</option>
          {state.categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div className="field-row">
        <div className="field"><label>পরিমাণ (Qty)</label><input type="number" step="any" value={form.qty ?? ''} onChange={(e) => set('qty', e.target.value)} /></div>
        <div className="field"><label>একক</label><input type="text" readOnly placeholder="খাত অনুযায়ী স্বয়ংক্রিয়" value={form.unit || ''} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>একক দর</label><input type="number" step="any" value={form.rate ?? ''} onChange={(e) => set('rate', e.target.value)} /></div>
        <div className="field"><label>মোট টাকা</label><input type="number" step="any" value={form.total ?? ''} onChange={(e) => set('total', e.target.value)} /></div>
      </div>
      <div className="field">
        <label>পরিশোধের ধরন</label>
        <select value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)}>
          <option value="cash">সম্পূর্ণ নগদ পরিশোধ</option>
          <option value="credit">বাকি (সাপ্লায়ারের কাছে)</option>
        </select>
      </div>
      {isCredit && (
        <div>
          <div className="field">
            <label>সাপ্লায়ার</label>
            <select value={form.supplierId || ''} onChange={(e) => set('supplierId', e.target.value)}>
              <option value="">— নির্বাচন করুন —</option>
              {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field"><label>এখনই কত পরিশোধ করলেন (৳)</label><input type="number" step="any" value={form.paidNow ?? 0} onChange={(e) => set('paidNow', e.target.value)} /></div>
          {state.suppliers.length === 0 && <div className="li-sub" style={{ margin: '-4px 0 10px' }}>এখনো কোনো সাপ্লায়ার যোগ করা হয়নি — "পাওনাদার" ট্যাবে গিয়ে আগে একজন যোগ করুন।</div>}
        </div>
      )}
      <div className="field"><label>অনুমোদনকারী</label><input type="text" value={form.approvedBy || ''} onChange={(e) => set('approvedBy', e.target.value)} /></div>
      <div className="field"><label>মন্তব্য</label><input type="text" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
    </FormShell>
  );
}

export function SupplierForm({ record, onClose }) {
  const { state, saveKey, showToast } = useAppState();
  const [form, setForm] = useState(record || { name: '', phone: '', notes: '' });
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function onSubmit(ev) {
    ev.preventDefault();
    await saveEntity(saveKey, state, 'suppliers', record?.id, form);
    showToast('সংরক্ষণ হয়েছে');
    onClose();
  }
  return (
    <FormShell title={record ? 'সাপ্লায়ার এডিট করুন' : 'নতুন পাওনাদার / সাপ্লায়ার'} onCancel={onClose} onSubmit={onSubmit}>
      <div className="field"><label>নাম</label><input type="text" required value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
      <div className="field"><label>মোবাইল নম্বর</label><input type="tel" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
      <div className="field"><label>মন্তব্য</label><input type="text" placeholder="যেমন: রড সাপ্লায়ার" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
    </FormShell>
  );
}

export function LoanForm({ record, onClose }) {
  const { state, saveKey, showToast } = useAppState();
  const [form, setForm] = useState(record || { type: 'payable', person: '', phone: '', principal: '', date: todayISO(), notes: '' });
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function onSubmit(ev) {
    ev.preventDefault();
    await saveEntity(saveKey, state, 'loans', record?.id, { ...form, principal: Number(form.principal) || 0 });
    showToast('সংরক্ষণ হয়েছে');
    onClose();
  }
  return (
    <FormShell title={record ? 'লোন হিসাব এডিট করুন' : 'নতুন লোন হিসাব'} onCancel={onClose} onSubmit={onSubmit}>
      <div className="field">
        <label>ধরন</label>
        <select value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option value="payable">আমরা ধার নিয়েছি (আমরা দেব)</option>
          <option value="receivable">আমরা ধার দিয়েছি (আমরা পাব)</option>
        </select>
      </div>
      <div className="field"><label>ব্যক্তি / প্রতিষ্ঠানের নাম</label><input type="text" required value={form.person || ''} onChange={(e) => set('person', e.target.value)} /></div>
      <div className="field"><label>মোবাইল নম্বর</label><input type="tel" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
      <div className="field-row">
        <div className="field"><label>মূল পরিমাণ (৳)</label><input type="number" step="any" required value={form.principal ?? ''} onChange={(e) => set('principal', e.target.value)} /></div>
        <div className="field"><label>তারিখ</label><input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} /></div>
      </div>
      <div className="field"><label>মন্তব্য</label><input type="text" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
    </FormShell>
  );
}

export function ShareholderForm({ record, onClose }) {
  const { state, saveKey, showToast } = useAppState();
  const [form, setForm] = useState(record || { name: '', phone: '', shares: '' });
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function onSubmit(ev) {
    ev.preventDefault();
    await saveEntity(saveKey, state, 'shareholders', record?.id, { ...form, shares: Number(form.shares) || 0 });
    showToast('সংরক্ষণ হয়েছে');
    onClose();
  }
  return (
    <FormShell title={record ? 'শেয়ারহোল্ডার এডিট করুন' : 'নতুন শেয়ারহোল্ডার'} onCancel={onClose} onSubmit={onSubmit}>
      <div className="field"><label>নাম</label><input type="text" required value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
      <div className="field"><label>মোবাইল নম্বর</label><input type="tel" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
      <div className="field"><label>শেয়ার সংখ্যা</label><input type="number" step="any" required value={form.shares ?? ''} onChange={(e) => set('shares', e.target.value)} /></div>
    </FormShell>
  );
}

export function PaymentForm({ kind, entityId, onClose }) {
  const { state, saveKey, showToast } = useAppState();
  const [form, setForm] = useState({ date: todayISO(), amount: '', notes: '' });
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const isSupplier = kind === 'supplier';
  const type = isSupplier ? 'supplierPayments' : 'loanPayments';
  const linkKey = isSupplier ? 'supplierId' : 'loanId';
  const sup = isSupplier ? state.suppliers.find((s) => s.id === entityId) : null;
  const loan = !isSupplier ? state.loans.find((l) => l.id === entityId) : null;
  const due = isSupplier ? supplierDue(state, entityId) : (loan ? loanBalance(state, loan) : 0);
  const label = isSupplier ? '' : (loan && loan.type === 'payable' ? 'পরিশোধ করছি' : 'ফেরত পাচ্ছি');
  const name = isSupplier ? sup?.name : loan?.person;

  async function onSubmit(ev) {
    ev.preventDefault();
    const list = state[type].slice();
    list.push({ id: uid(), date: form.date, amount: Number(form.amount) || 0, notes: form.notes, [linkKey]: entityId });
    await saveKey(type, list);
    showToast('পেমেন্ট সংরক্ষণ হয়েছে');
    onClose();
  }

  return (
    <FormShell title={`${name || ''}${isSupplier ? '-কে পেমেন্ট' : ' — ' + label}`} onCancel={onClose} onSubmit={onSubmit}>
      <div className="li-sub" style={{ marginBottom: 12 }}>বর্তমান {isSupplier ? 'বাকি' : 'স্থিতি'}: <b>৳{due.toLocaleString('en-IN')}</b></div>
      <div className="field"><label>তারিখ</label><input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
      <div className="field"><label>পরিমাণ (৳)</label><input type="number" step="any" required value={form.amount} onChange={(e) => set('amount', e.target.value)} /></div>
      <div className="field"><label>মন্তব্য</label><input type="text" placeholder="যেমন: নগদ পরিশোধ" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
    </FormShell>
  );
}
