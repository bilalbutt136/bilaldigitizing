'use client';

/**
 * Worker Payout PDF Invoice / Receipt Generator (PKR)
 * Generates an official payout invoice receipt for digitizers and vector artists in Pakistan (PKR).
 * Uses jsPDF and jspdf-autotable with dynamic loading support.
 */

async function loadJsPdf() {
  if (typeof window === 'undefined') return null;

  try {
    const jspdfModule = await import('jspdf');
    const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
    let autoTable = null;
    try {
      const atModule = await import('jspdf-autotable');
      autoTable = atModule.default || atModule;
    } catch {}
    return { jsPDF, autoTable };
  } catch {
    // Dynamic CDN fallback if npm bundle is resolving
    if (window.jspdf && window.jspdf.jsPDF) {
      return { 
        jsPDF: window.jspdf.jsPDF, 
        autoTable: (doc, opts) => {
          if (doc.autoTable) return doc.autoTable(opts);
        }
      };
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        const atScript = document.createElement('script');
        atScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        atScript.onload = resolve;
        atScript.onerror = reject;
        document.head.appendChild(atScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return { 
      jsPDF: window.jspdf.jsPDF, 
      autoTable: (doc, opts) => {
        if (doc.autoTable) return doc.autoTable(opts);
      }
    };
  }
}

export async function generateWorkerPayoutInvoicePdf({
  payout,
  worker,
  orders = []
}) {
  const lib = await loadJsPdf();
  if (!lib || !lib.jsPDF) {
    throw new Error('PDF generation library could not be loaded.');
  }

  const { jsPDF } = lib;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42];     // Dark navy #0f172a
  const orangeColor = [234, 88, 12];     // Primary orange #ea580c
  const greenColor = [16, 185, 129];     // Emerald green #10b981
  const grayText = [100, 116, 139];      // Slate gray #64748b
  const lightBg = [248, 250, 252];       // Light surface #f8fafc

  const payoutNumber = payout?.payout_number || `PAY-PKR-${Date.now().toString().slice(-6)}`;
  const workerName = worker?.name || payout?.worker_name || 'Digitizer Worker';
  const workerEmail = worker?.email || payout?.worker_email || 'worker@bilaldigitizing.com';
  const workerRole = worker?.specialty || worker?.worker_role || 'Embroidery Digitizer';
  const paymentMethod = payout?.payment_method || 'Bank Transfer / Mobile Wallet';
  const referenceNote = payout?.reference_note || 'Direct off-platform settlement';
  const payoutDate = payout?.created_at ? new Date(payout.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const totalAmountPkr = parseFloat(payout?.total_amount || 0);

  // 1. Top Decorative Bar
  doc.setFillColor(...orangeColor);
  doc.rect(0, 0, 210, 6, 'F');

  // 2. Header Section
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('BILAL DIGITIZING', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text('Commercial Embroidery Digitizing & Vector Art Agency', 14, 28);
  doc.text('Lahore, Pakistan • support@bilaldigitizing.com • www.bilaldigitizing.com', 14, 33);

  // Top Right: Invoice Title & Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...orangeColor);
  doc.text('WORKER PAYOUT RECEIPT', 210 - 14, 22, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text(`RECEIPT #: ${payoutNumber}`, 210 - 14, 29, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text(`Date: ${payoutDate}`, 210 - 14, 34, { align: 'right' });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 39, 210 - 14, 39);

  // 3. Worker & Payout Details Grid
  // Left: Paid To (Worker)
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 44, 88, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, 88, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...orangeColor);
  doc.text('PAID TO (WORKER):', 18, 51);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text(workerName, 18, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text(`Role: ${workerRole}`, 18, 64);
  doc.text(`Email: ${workerEmail}`, 18, 70);
  if (worker?.phone) {
    doc.text(`Phone: ${worker.phone}`, 18, 76);
  }

  // Right: Settlement Details
  doc.setFillColor(...lightBg);
  doc.roundedRect(108, 44, 88, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, 44, 88, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...orangeColor);
  doc.text('SETTLEMENT DETAILS:', 112, 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text('Payment Method:', 112, 58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(paymentMethod, 146, 58);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text('Currency:', 112, 64);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('PKR (Pakistani Rupee)', 146, 64);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text('Reference Note:', 112, 70);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryColor);
  doc.text(referenceNote.slice(0, 32), 146, 70);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...greenColor);
  doc.text('STATUS: PAID & SETTLED', 112, 77);

  // 4. Orders Breakdown Table
  const tableRows = orders.map((ord, idx) => {
    const cost = parseFloat(ord.costPkr || ord.quoted_price_pkr || ord.quoted_price || ord.worker_payout || 0);
    const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) : 'Recent';

    return [
      String(idx + 1),
      String(ord.id).slice(0, 10),
      ord.title || 'Embroidery Digitizing Design',
      dateStr,
      'Paid',
      `Rs. ${cost.toLocaleString()} PKR`
    ];
  });

  let finalY = 90;

  // Render Table using autoTable plugin
  if (doc.autoTable) {
    doc.autoTable({
      startY: 88,
      head: [['#', 'ORDER ID', 'ORDER / DESIGN TITLE', 'DATE', 'STATUS', 'QUOTED COST (PKR)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 20, halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
        5: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : 140;
  } else {
    // Manual table rendering fallback
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Orders Breakdown:', 14, 90);
    tableRows.forEach((row, rIdx) => {
      const y = 96 + (rIdx * 7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${row[0]}. [${row[1]}] ${row[2]} — ${row[5]}`, 14, y);
      finalY = y + 8;
    });
  }

  // 5. Grand Total Box
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFillColor(...lightBg);
  doc.roundedRect(120, finalY, 76, 24, 3, 3, 'F');
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.8);
  doc.roundedRect(120, finalY, 76, 24, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text(`TOTAL ORDERS: ${orders.length}`, 125, finalY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL PAID (PKR):', 125, finalY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...orangeColor);
  doc.text(`Rs. ${totalAmountPkr.toLocaleString()} PKR`, 125, finalY + 20);

  // 6. Signature & Verification Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text('TERMS & CONFIRMATION:', 14, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('1. This electronic receipt verifies full settlement of digitizing services rendered.', 14, finalY + 12);
  doc.text('2. All listed orders have been verified and permanently marked as Paid.', 14, finalY + 16);
  doc.text('3. Authorized by Bilal Digitizing Studio Management Desk.', 14, finalY + 20);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayText);
  doc.text(`Generated on ${new Date().toLocaleString('en-US')} • Document ID: ${payoutNumber}`, 14, 285);
  doc.text('Bilal Digitizing — Pakistan Production Operations Desk', 210 - 14, 285, { align: 'right' });

  // Generate Blob and Filename
  const blob = doc.output('blob');
  const filename = `${payoutNumber}_${workerName.replace(/\s+/g, '_')}.pdf`;

  const downloadPdf = () => {
    doc.save(filename);
  };

  return {
    doc,
    blob,
    filename,
    downloadPdf
  };
}
