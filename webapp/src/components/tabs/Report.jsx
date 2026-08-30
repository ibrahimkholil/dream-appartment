import React from 'react';
import { useAppState } from '../../state/store.jsx';
import {
  fullReportBodyHtml, fullReportSummaryText, shareholderReportHtml, shareholderReportSummaryText,
  expenseReportHtml, expenseReportSummaryText,
} from '../../lib/vouchers.js';
import { printVoucher, sharePdfReport } from '../../lib/pdf.js';

export default function Report() {
  const { scopedState: state, showToast } = useAppState();

  return (
    <>
      <div className="report-toolbar" style={{ flexWrap: 'wrap' }}>
        <button className="btn primary" style={{ flexBasis: '100%' }} onClick={() => window.print()}>🖨️ সম্পূর্ণ রিপোর্ট প্রিন্ট / PDF</button>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => sharePdfReport('email', fullReportBodyHtml(state), 'সম্পূর্ণ-রিপোর্ট.pdf', 'ড্রিম অ্যাপার্টমেন্ট — সম্পূর্ণ রিপোর্ট', fullReportSummaryText(state), showToast)}>✉️ ইমেইলে PDF পাঠান</button>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => sharePdfReport('whatsapp', fullReportBodyHtml(state), 'সম্পূর্ণ-রিপোর্ট.pdf', 'ড্রিম অ্যাপার্টমেন্ট — সম্পূর্ণ রিপোর্ট', fullReportSummaryText(state), showToast)}>💬 হোয়াটসঅ্যাপে PDF পাঠান</button>
      </div>
      <div className="report-toolbar" style={{ flexWrap: 'wrap', marginTop: 8 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => printVoucher(shareholderReportHtml(state))}>👥 শেয়ারহোল্ডার রিপোর্ট</button>
        <button className="btn ghost" title="ইমেইলে PDF পাঠান" style={{ flex: '0 0 auto' }} onClick={() => sharePdfReport('email', shareholderReportHtml(state), 'শেয়ারহোল্ডার-রিপোর্ট.pdf', 'ড্রিম অ্যাপার্টমেন্ট — শেয়ারহোল্ডার রিপোর্ট', shareholderReportSummaryText(state), showToast)}>✉️</button>
        <button className="btn ghost" title="হোয়াটসঅ্যাপে PDF পাঠান" style={{ flex: '0 0 auto' }} onClick={() => sharePdfReport('whatsapp', shareholderReportHtml(state), 'শেয়ারহোল্ডার-রিপোর্ট.pdf', 'ড্রিম অ্যাপার্টমেন্ট — শেয়ারহোল্ডার রিপোর্ট', shareholderReportSummaryText(state), showToast)}>💬</button>
      </div>
      <div className="report-toolbar" style={{ flexWrap: 'wrap', marginTop: 8 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => printVoucher(expenseReportHtml(state))}>🧾 এক্সপেন্স রিপোর্ট</button>
        <button className="btn ghost" title="ইমেইলে PDF পাঠান" style={{ flex: '0 0 auto' }} onClick={() => sharePdfReport('email', expenseReportHtml(state), 'এক্সপেন্স-রিপোর্ট.pdf', 'ড্রিম অ্যাপার্টমেন্ট — এক্সপেন্স রিপোর্ট', expenseReportSummaryText(state), showToast)}>✉️</button>
        <button className="btn ghost" title="হোয়াটসঅ্যাপে PDF পাঠান" style={{ flex: '0 0 auto' }} onClick={() => sharePdfReport('whatsapp', expenseReportHtml(state), 'এক্সপেন্স-রিপোর্ট.pdf', 'ড্রিম অ্যাপার্টমেন্ট — এক্সপেন্স রিপোর্ট', expenseReportSummaryText(state), showToast)}>💬</button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: fullReportBodyHtml(state) }} />
    </>
  );
}
