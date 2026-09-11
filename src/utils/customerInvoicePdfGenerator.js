'use client';

/**
 * VIP International Commercial Tax Invoice PDF Generator (Clean & Minimalist)
 * Produces a sleek, executive 1-page commercial invoice with essential billing details
 * and a concise international system-generated signature exemption notice.
 */

export function formatOrderId(id) {
  if (!id) return 'BD-0000';
  const str = String(id).trim().replace(/^#+/, '');
  return str.startsWith('ORD-') ? str : `ORD-${str.slice(0, 8).toUpperCase()}`;
}

export function generateInvoiceNumber(order) {
  if (!order) return `INV-BD-${Date.now().toString().slice(-6)}`;
  const orderId = String(order.id || '').replace(/^#+/, '').replace(/^ORD-/i, '');
  const cleanId = orderId.slice(0, 8).toUpperCase() || '0000';
  const orderYear = order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).getFullYear() : new Date().getFullYear();
  return `INV-BD-${orderYear}-${cleanId}`;
}

export function getOrderServiceTitle(order) {
  if (!order) return 'Commercial Embroidery Digitizing';
  const cat = String(order.serviceCategory || order.service_category || order.type || order.serviceType || '').toLowerCase();
  if (cat.includes('vector')) return 'Vector Art Tracing';
  if (cat.includes('patch')) return 'Custom Patches';
  return 'Embroidery Digitizing';
}

export function getOrderFormatsString(order) {
  if (Array.isArray(order?.requestedFormats) && order.requestedFormats.length > 0) {
    return order.requestedFormats.map(f => String(f).toUpperCase()).join(', ');
  }
  if (Array.isArray(order?.requested_formats) && order.requested_formats.length > 0) {
    return order.requested_formats.map(f => String(f).toUpperCase()).join(', ');
  }
  const cat = String(order?.serviceCategory || order?.service_category || order?.type || '').toLowerCase();
  if (cat.includes('vector')) return 'AI, EPS, SVG, PDF';
  if (cat.includes('patch')) return 'Physical Goods';
  return 'DST, PES, EMB';
}

export function getOrderTurnaroundTier(order) {
  const isRush = Boolean(
    order?.isRush || 
    order?.is_rush || 
    order?.turnaround === 'rush' || 
    order?.turnaround === '2-4 hours' || 
    order?.turnaroundHours === 4 ||
    String(order?.notes || '').toLowerCase().includes('rush') ||
    String(order?.title || '').toLowerCase().includes('rush')
  );
  return isRush ? 'Rush (4-8 hr)' : 'Standard (12-24 hr)';
}

export function getOrderPriceNumeric(order) {
  if (!order) return 15.00;
  const raw = parseFloat(order.price ?? order.totalPrice ?? order.total_price ?? order.amount ?? order.cost ?? 0);
  if (!isNaN(raw) && raw > 0) return raw;
  const cat = String(order.serviceCategory || order.service_category || order.type || order.serviceType || '').toLowerCase();
  if (cat.includes('vector')) return 12.00;
  if (cat.includes('patch')) return 25.00;
  return 15.00;
}

export function isOrderPaidStatus(order) {
  if (!order) return false;
  const pStatus = String(order.payment_status || order.paymentStatus || '').toLowerCase().trim();
  const oStatus = String(order.status || '').toLowerCase().trim();
  const isPaidFlag = order.isPaid === true || order.paid === true || Boolean(order.paid_at);
  return isPaidFlag || 
         pStatus === 'paid' || 
         pStatus === 'completed' || 
         pStatus === 'settled' || 
         pStatus === 'verified' || 
         pStatus === 'wallet' ||
         ['in_progress', 'digitizing', 'assigned', 'qc', 'delivered', 'completed'].includes(oStatus);
}

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

export async function generateCustomerTaxInvoicePdf({
  order,
  client = null,
  studioSettings = {}
}) {
  const lib = await loadJsPdf();
  if (!lib || !lib.jsPDF) {
    throw new Error('PDF generation engine could not be loaded.');
  }

  const { jsPDF } = lib;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryNavy = [15, 23, 42];     // #0f172a
  const brandOrange = [234, 88, 12];     // #ea580c
  const paidGreen = [16, 185, 129];      // #10b981
  const textDark = [30, 41, 59];         // #1e293b
  const textMuted = [100, 116, 139];     // #64748b
  const borderLight = [226, 232, 240];   // #e2e8f0

  const isPaid = isOrderPaidStatus(order);
  const invoiceNumber = generateInvoiceNumber(order);
  const price = getOrderPriceNumeric(order);
  const serviceTitle = getOrderServiceTitle(order);
  const formatsString = getOrderFormatsString(order);

  const clientName = client?.name || order?.client_name || order?.clientName || 'Valued Client';
  const clientCompany = client?.company || order?.client_company || order?.company || '';
  const clientEmail = client?.email || order?.client_email || order?.clientEmail || '';

  const orderDateRaw = order?.createdAt || order?.created_at || new Date();
  const issueDateFormatted = new Date(orderDateRaw).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Top Accent Stripe
  doc.setFillColor(...brandOrange);
  doc.rect(0, 0, 210, 4, 'F');

  // Header Left: Studio Brand
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BILAL DIGITIZING', 16, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Commercial Embroidery Digitizing & Vector Art', 16, 26);
  doc.text('billing@bilaldigitizing.com • www.bilaldigitizing.com', 16, 31);

  // Header Right: Invoice Title & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryNavy);
  doc.text('TAX INVOICE', 210 - 16, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Invoice: ${invoiceNumber}`, 210 - 16, 26, { align: 'right' });
  doc.text(`Date: ${issueDateFormatted}`, 210 - 16, 31, { align: 'right' });

  // Paid / Unpaid Pill on top right
  if (isPaid) {
    doc.setFillColor(...paidGreen);
    doc.roundedRect(210 - 16 - 28, 35, 28, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('✓ PAID', 210 - 16 - 14, 39.2, { align: 'center' });
  } else {
    doc.setFillColor(...brandOrange);
    doc.roundedRect(210 - 16 - 32, 35, 32, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('DUE / UNPAID', 210 - 16 - 16, 39.2, { align: 'center' });
  }

  // Divider
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(16, 44, 210 - 16, 44);

  // Bill To & Order Summary (Clean 2-Column Text)
  const infoY = 52;
  
  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandOrange);
  doc.text('BILLED TO', 16, infoY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryNavy);
  doc.text(String(clientName).slice(0, 36), 16, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  let currentY = infoY + 11;
  if (clientCompany) {
    doc.text(clientCompany, 16, currentY);
    currentY += 5;
  }
  if (clientEmail) {
    doc.text(clientEmail, 16, currentY);
  }

  // Right: Order Reference
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandOrange);
  doc.text('ORDER DETAILS', 125, infoY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Order ID:', 125, infoY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(formatOrderId(order?.id), 155, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Status:', 125, infoY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isPaid ? paidGreen : brandOrange));
  doc.text(isPaid ? 'Paid in Full' : 'Awaiting Payment', 155, infoY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Currency:', 125, infoY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text('USD ($)', 155, infoY + 16);

  // Items Table
  const tableStartY = 74;
  const itemTitle = order?.title ? `${serviceTitle} — ${order.title}` : serviceTitle;
  
  const tableRows = [
    [
      '1',
      itemTitle,
      formatsString,
      '1',
      `$${price.toFixed(2)}`,
      `$${price.toFixed(2)}`
    ]
  ];

  let finalY = 105;

  if (doc.autoTable) {
    doc.autoTable({
      startY: tableStartY,
      head: [['#', 'DESCRIPTION', 'FORMATS', 'QTY', 'PRICE', 'TOTAL (USD)']],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', textColor: textMuted },
        1: { cellWidth: 86, fontStyle: 'bold', textColor: primaryNavy },
        2: { cellWidth: 40, textColor: textMuted, fontSize: 8 },
        3: { cellWidth: 12, halign: 'center', textColor: textDark },
        4: { cellWidth: 20, halign: 'right', textColor: textMuted },
        5: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: primaryNavy }
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: { bottom: 0.3 }
      },
      margin: { left: 16, right: 16 }
    });

    finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : 105;
  }

  // Summary (Clean Right-Aligned)
  const sumX = 140;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text('Subtotal:', sumX, finalY);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${price.toFixed(2)}`, 210 - 16, finalY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Tax (0%):', sumX, finalY + 6);
  doc.text('$0.00', 210 - 16, finalY + 6, { align: 'right' });

  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(sumX, finalY + 9, 210 - 16, finalY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text(isPaid ? 'Total Paid:' : 'Total Due:', sumX, finalY + 16);
  doc.setFontSize(13);
  doc.setTextColor(...(isPaid ? paidGreen : brandOrange));
  doc.text(`$${price.toFixed(2)} USD`, 210 - 16, finalY + 16, { align: 'right' });

  // Minimalist 1-Sentence System-Generated & International Validity Note
  const noteBoxY = finalY + 30;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, noteBoxY, 210 - 32, 16, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, noteBoxY, 210 - 32, 16, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryNavy);
  doc.text('✓ SYSTEM-GENERATED INVOICE — NO SIGNATURE OR STAMP REQUIRED', 20, noteBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Valid for business expense deduction & tax accounting worldwide (US E-SIGN Act, EU eIDAS & international rules).', 20, noteBoxY + 11.5);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Record ID: ${invoiceNumber} • Thank you for your business!`, 16, 285);
  doc.text('Bilal Digitizing Commercial Studio', 210 - 16, 285, { align: 'right' });

  // Generate Blob and Filename
  const blob = doc.output('blob');
  const filename = `${invoiceNumber}_Invoice.pdf`;

  const downloadPdf = () => {
    doc.save(filename);
  };

  return {
    doc,
    blob,
    filename,
    invoiceNumber,
    downloadPdf
  };
}
