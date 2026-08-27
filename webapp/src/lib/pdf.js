// html2canvas + jsPDF are only needed when the user actually generates a PDF,
// so they're dynamically imported (code-split into their own chunk) instead
// of loaded on every page visit - keeps the initial app load lightweight.

export function shareViaEmail(subject, body) {
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
export function shareViaWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export async function htmlToPdfBlob(innerHtml) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '480px';
  container.style.background = '#ffffff';
  container.style.padding = '18px';
  container.style.fontFamily = "'Noto Sans Bengali','Inter',sans-serif";
  container.innerHTML = '<div class="print-title" style="display:block;"></div>' + innerHtml;
  document.body.appendChild(container);
  await new Promise((r) => setTimeout(r, 60));
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    let heightLeft = imgHeight, position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function sharePdfReport(via, innerHtml, filename, subject, textBody, showToast) {
  showToast('PDF তৈরি হচ্ছে...');
  let blob;
  try {
    blob = await htmlToPdfBlob(innerHtml);
  } catch (e) {
    showToast('PDF তৈরি ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    return;
  }
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: subject, text: textBody });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  downloadBlob(blob, filename);
  const note = '\n\n(পিডিএফ ফাইলটি ডাউনলোড হয়েছে — এটি ম্যানুয়ালি সংযুক্ত করে পাঠান)';
  if (via === 'email') shareViaEmail(subject, textBody + note);
  else shareViaWhatsApp(textBody + note);
  showToast('PDF ডাউনলোড হয়েছে, সংযুক্ত করে পাঠান');
}

// Renders `html` into the hidden #printArea node and triggers window.print(),
// showing only that content via the .printing-single body class + @media print rules.
export function printVoucher(html) {
  let area = document.getElementById('printArea');
  if (!area) {
    area = document.createElement('div');
    area.id = 'printArea';
    document.body.appendChild(area);
  }
  area.innerHTML = html;
  document.body.classList.add('printing-single');
  setTimeout(() => window.print(), 50);
}

if (typeof window !== 'undefined') {
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-single');
    const area = document.getElementById('printArea');
    if (area) area.innerHTML = '';
  });
}
