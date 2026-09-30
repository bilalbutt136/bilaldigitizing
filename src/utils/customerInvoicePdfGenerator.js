'use client';

/**
 * VIP International Commercial Tax Invoice PDF Generator (Clean & Minimalist)
 * Produces a sleek, executive 1-page commercial invoice with complete billing details,
 * order specifications, itemized line breakdown, and international system-generated validity notice.
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

export function formatFabricSpec(fab) {
  if (!fab) return '';
  if (typeof fab === 'string') return fab;
  if (typeof fab === 'object') return fab.name || fab.type || fab.label || '';
  return String(fab);
}

export function formatDimensionsSpec(dim) {
  if (!dim) return '';
  if (typeof dim === 'string') return dim;
  if (typeof dim === 'number') return `${dim}"`;
  if (typeof dim === 'object') {
    const w = dim.width || dim.w || '';
    const h = dim.height || dim.h || '';
    const u = dim.unit || 'in';
    if (w && h) return `${w}" x ${h}" ${u}`;
    if (w) return `${w}" ${u}`;
    if (h) return `${h}" ${u}`;
  }
  return String(dim);
}

export function getCustomerInstructionText(order) {
  if (!order) return '';

  const readInstructionValue = (value) => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === '[object Object]') return '';

      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          return readInstructionValue(JSON.parse(trimmed));
        } catch {
          return trimmed;
        }
      }

      return trimmed;
    }

    if (Array.isArray(value)) {
      return value
        .map(readInstructionValue)
        .filter(Boolean)
        .join('\n');
    }

    if (typeof value === 'object') {
      const direct = value.customerNotes
        ?? value.customer_notes
        ?? value.specialInstructions
        ?? value.special_instructions
        ?? value.instructions
        ?? value.notes
        ?? value.description;

      const directText = readInstructionValue(direct);
      if (directText) return directText;

      if (Array.isArray(value.placementItems)) {
        return value.placementItems
          .map((item) => readInstructionValue(
            item?.customerNotes
            ?? item?.customer_notes
            ?? item?.specialInstructions
            ?? item?.special_instructions
            ?? item?.instructions
            ?? item?.notes
          ))
          .filter(Boolean)
          .join('\n');
      }
    }

    return '';
  };

  const candidates = [
    order.special_instructions,
    order.specialInstructions,
    order.customer_notes,
    order.customerNotes,
    order.notes
  ];

  for (const candidate of candidates) {
    const text = readInstructionValue(candidate);
    if (text) return text;
  }

  return '';
}

async function loadJsPdf() {
  try {
    const jspdfModule = await import('jspdf');
    const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
    let autoTableFn = null;
    try {
      const atModule = await import('jspdf-autotable');
      if (typeof atModule.applyPlugin === 'function') {
        atModule.applyPlugin(jsPDF);
      } else if (atModule.default && typeof atModule.default.applyPlugin === 'function') {
        atModule.default.applyPlugin(jsPDF);
      }
      autoTableFn = atModule.autoTable || atModule.default || atModule;
    } catch (e) {
      console.warn('jspdf-autotable dynamic import error:', e);
    }
    return { jsPDF, autoTable: autoTableFn };
  } catch (err) {
    if (typeof window !== 'undefined') {
      if (window.jspdf && window.jspdf.jsPDF) {
        return {
          jsPDF: window.jspdf.jsPDF,
          autoTable: (doc, opts) => {
            if (typeof doc.autoTable === 'function') return doc.autoTable(opts);
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
          if (typeof doc.autoTable === 'function') return doc.autoTable(opts);
        }
      };
    }
    throw new Error('PDF generation engine could not be loaded: ' + err.message);
  }
}

export async function generateCustomerTaxInvoicePdf({
  order,
  client = null,
  studioSettings: _studioSettings = {}
}) {
  const lib = await loadJsPdf();
  if (!lib || !lib.jsPDF) {
    throw new Error('PDF generation engine could not be loaded.');
  }

  const { jsPDF, autoTable: loadedAutoTable } = lib;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
    compress: true,
    putOnlyUsedFonts: true
  });

  // US Letter production geometry (8.5 × 11 in / 215.9 × 279.4 mm).
  // All drawing coordinates derive from these values so print/download margins
  // stay consistent and nothing is clipped by Letter-size printers.
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentRight = pageWidth - marginX;
  const contentWidth = pageWidth - (marginX * 2);
  const footerY = pageHeight - 8.5;
  const safeContentBottom = pageHeight - 20;

  // Color Palette
  const primaryNavy = [15, 23, 42];     // #0f172a
  const brandOrange = [234, 88, 12];    // #ea580c
  const paidGreen = [16, 185, 129];     // #10b981
  const textDark = [30, 41, 59];        // #1e293b
  const textMuted = [100, 116, 139];    // #64748b
  const borderLight = [226, 232, 240];  // #e2e8f0

  const isPaid = isOrderPaidStatus(order);
  const invoiceNumber = generateInvoiceNumber(order);
  const price = getOrderPriceNumeric(order);
  const serviceTitle = getOrderServiceTitle(order);
  const formatsString = getOrderFormatsString(order);
  const turnaroundTier = getOrderTurnaroundTier(order);

  const clientName = client?.name || order?.client_name || order?.clientName || 'Valued Client';
  const clientCompany = client?.company || order?.client_company || order?.company || '';
  const clientEmail = client?.email || order?.client_email || order?.clientEmail || '';
  const clientPhone = client?.phone || order?.client_phone || order?.clientPhone || order?.phone || '';
  const clientAddress = client?.address || order?.client_address || order?.clientAddress || order?.address || '';

  const orderDateRaw = order?.createdAt || order?.created_at || new Date();
  const issueDateFormatted = new Date(orderDateRaw).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const paymentDateFormatted = order?.paid_at ? new Date(order.paid_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : issueDateFormatted;

  const paymentMethod = order?.payment_method || order?.paymentMethod || (isPaid ? 'Credit Card / Electronic Gateway' : 'Awaiting Settlement');
  const fabric = formatFabricSpec(order?.fabric || order?.fabricType || order?.fabric_type);
  const dimensions = formatDimensionsSpec(order?.dimensions || order?.size);
  const placement = order?.placement || order?.placementType || order?.placement_type || '';
  const quantity = Math.max(1, parseInt(order?.quantity || order?.qty || 1, 10) || 1);
  const unitPrice = quantity > 1 ? parseFloat((price / quantity).toFixed(2)) : price;
  const discountAmount = Math.max(0, parseFloat(order?.discount_amount || order?.discountAmount || 0));
  const rushFee = Math.max(0, parseFloat(order?.rush_fee || order?.rushFee || 0));
  const subtotal = discountAmount > 0 ? (price + discountAmount - rushFee) : price;
  const designTitle = order?.title || order?.design_name || order?.name || '';
  const customerNotes = getCustomerInstructionText(order);

  // 1. Top Accent Stripe
  doc.setFillColor(...brandOrange);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Header Left: Studio Brand
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BDIGITIZING', marginX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Commercial Embroidery Digitizing & Vector Art', marginX, 26);
  doc.text('support@bdigitizing.com • www.bdigitizing.com', marginX, 31);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...brandOrange);
  doc.text('PREMIUM CLIENT DOCUMENT', marginX, 37);

  // 3. Header Right: Invoice Title & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryNavy);
  doc.text('TAX INVOICE', contentRight, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Invoice: ${invoiceNumber}`, contentRight, 26, { align: 'right' });
  doc.text(`Date: ${issueDateFormatted}`, contentRight, 31, { align: 'right' });

  // Paid / Unpaid Status Badge Pill
  if (isPaid) {
    const badgeText = `PAID (${paymentDateFormatted})`;
    doc.setFillColor(...paidGreen);
    doc.roundedRect(contentRight - 44, 35, 44, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, contentRight - 22, 39.2, { align: 'center' });
  } else {
    doc.setFillColor(...brandOrange);
    doc.roundedRect(contentRight - 32, 35, 32, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('PAYMENT DUE', contentRight - 16, 39.2, { align: 'center' });
  }

  // Divider
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(marginX, 44, contentRight, 44);

  // 4. Billed To & Order Details (Clean 2-Column Grid)
  const infoY = 52;

  // Left: Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandOrange);
  doc.text('BILLED TO', marginX, infoY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryNavy);
  doc.text(String(clientName).slice(0, 36), marginX, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  let currentClientY = infoY + 11;
  if (clientCompany) {
    doc.text(String(clientCompany).slice(0, 42), marginX, currentClientY);
    currentClientY += 5;
  }
  if (clientEmail) {
    doc.text(String(clientEmail).slice(0, 42), marginX, currentClientY);
    currentClientY += 5;
  }
  if (clientPhone) {
    doc.text(`Tel: ${String(clientPhone).slice(0, 24)}`, marginX, currentClientY);
    currentClientY += 5;
  }
  if (clientAddress) {
    doc.text(String(clientAddress).slice(0, 44), marginX, currentClientY);
  }

  // Right: Order Details
  const orderColX = pageWidth - 92;
  const orderValX = pageWidth - 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandOrange);
  doc.text('ORDER DETAILS', orderColX, infoY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Order ID:', orderColX, infoY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(formatOrderId(order?.id), orderValX, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Payment:', orderColX, infoY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isPaid ? paidGreen : brandOrange));
  doc.text(isPaid ? `Paid in Full (${paymentDateFormatted})` : 'Awaiting Payment', orderValX, infoY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Method:', orderColX, infoY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(String(paymentMethod).slice(0, 24), orderValX, infoY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Turnaround:', orderColX, infoY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(turnaroundTier, orderValX, infoY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Currency:', orderColX, infoY + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text('USD ($)', orderValX, infoY + 26);

  // 5. Optional Production Specs Strip
  let tableStartY = 84;
  const specsParts = [];
  if (fabric) specsParts.push(`Fabric: ${fabric}`);
  if (placement) specsParts.push(`Placement: ${placement}`);
  if (dimensions) specsParts.push(`Dimensions: ${dimensions}`);

  if (specsParts.length > 0) {
    const specsY = 82;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, specsY, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, specsY, contentWidth, 8, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...brandOrange);
    doc.text('PRODUCTION SPECS:', marginX + 3, specsY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(specsParts.join('  •  '), marginX + 40, specsY + 5.2);
    tableStartY = 94;
  }

  // 6. Items Table Data
  let descriptionText = serviceTitle;
  if (designTitle) {
    descriptionText += `\nDesign: ${designTitle}`;
  }
  if (specsParts.length > 0 && tableStartY === 84) {
    descriptionText += `\nSpecs: ${specsParts.join(', ')}`;
  }

  const tableRows = [
    [
      '1',
      descriptionText,
      formatsString,
      String(quantity),
      `$${unitPrice.toFixed(2)}`,
      `$${price.toFixed(2)}`
    ]
  ];

  let finalY = tableStartY + 25;
  let tableRendered = false;

  // Execute autoTable plugin if available
  const autoTableRunner = (typeof doc.autoTable === 'function')
    ? (opts) => doc.autoTable(opts)
    : (typeof loadedAutoTable === 'function' ? (opts) => loadedAutoTable(doc, opts) : null);

  if (autoTableRunner) {
    try {
      autoTableRunner({
        startY: tableStartY,
        head: [['#', 'DESCRIPTION', 'FORMATS', 'QTY', 'UNIT PRICE', 'TOTAL (USD)']],
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
          0: { halign: 'center', textColor: textMuted },
          1: { fontStyle: 'bold', textColor: primaryNavy },
          2: { textColor: textMuted, fontSize: 8 },
          3: { halign: 'center', textColor: textDark },
          4: { halign: 'right', textColor: textMuted },
          5: { halign: 'right', fontStyle: 'bold', textColor: primaryNavy }
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: { bottom: 0.3 }
        },
        margin: { left: marginX, right: marginX }
      });
      finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : (tableStartY + 28);
      tableRendered = true;
    } catch (tblErr) {
      console.warn('autoTable rendering failed, falling back to vector drawing:', tblErr);
      tableRendered = false;
    }
  }

  // Bulletproof Manual Vector Drawing Fallback (if autoTable plugin was absent or threw)
  if (!tableRendered) {
    const tableX = marginX;
    const tableW = contentWidth;
    const rowH = 16;

    // Header background
    doc.setFillColor(248, 250, 252);
    doc.rect(tableX, tableStartY, tableW, 8, 'F');
    doc.setDrawColor(...borderLight);
    doc.line(tableX, tableStartY + 8, tableX + tableW, tableStartY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryNavy);
    doc.text('#', tableX + 3, tableStartY + 5.5);
    doc.text('DESCRIPTION', tableX + 14, tableStartY + 5.5);
    doc.text('FORMATS', tableX + 94, tableStartY + 5.5);
    doc.text('QTY', tableX + 134, tableStartY + 5.5);
    doc.text('PRICE', tableX + 152, tableStartY + 5.5);
    doc.text('TOTAL', tableX + tableW - 2, tableStartY + 5.5, { align: 'right' });

    // Row 1
    const rY = tableStartY + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textMuted);
    doc.text('1', tableX + 3, rY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(serviceTitle, tableX + 14, rY + 6);
    if (designTitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text(`Design: ${designTitle}`, tableX + 14, rY + 11);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(formatsString, tableX + 94, rY + 6);

    doc.setTextColor(...textDark);
    doc.text(String(quantity), tableX + 137, rY + 6);

    doc.setTextColor(...textMuted);
    doc.text(`$${unitPrice.toFixed(2)}`, tableX + 152, rY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(`$${price.toFixed(2)}`, tableX + tableW - 2, rY + 6, { align: 'right' });

    doc.setDrawColor(...borderLight);
    doc.line(tableX, rY + rowH, tableX + tableW, rY + rowH);
    finalY = rY + rowH + 8;
  }

  // 7. Right-Aligned Financial Summary
  const sumX = contentRight - 61;
  const valX = contentRight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Subtotal:', sumX, finalY);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${subtotal.toFixed(2)}`, valX, finalY, { align: 'right' });

  let curSumY = finalY;

  if (discountAmount > 0) {
    curSumY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // green
    doc.text('Discount Applied:', sumX, curSumY);
    doc.setFont('helvetica', 'bold');
    doc.text(`-$${discountAmount.toFixed(2)}`, valX, curSumY, { align: 'right' });
  }

  if (rushFee > 0) {
    curSumY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...brandOrange);
    doc.text('Rush Delivery Fee:', sumX, curSumY);
    doc.setFont('helvetica', 'bold');
    doc.text(`+$${rushFee.toFixed(2)}`, valX, curSumY, { align: 'right' });
  }

  curSumY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Tax (0% Export/B2B):', sumX, curSumY);
  doc.text('$0.00', valX, curSumY, { align: 'right' });

  curSumY += 3;
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(sumX, curSumY, valX, curSumY);

  curSumY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryNavy);
  doc.text(isPaid ? 'Total Paid:' : 'Total Due:', sumX, curSumY);
  doc.setFontSize(12);
  doc.setTextColor(...(isPaid ? paidGreen : brandOrange));
  doc.text(`$${price.toFixed(2)} USD`, valX, curSumY, { align: 'right' });

  // 8. Customer reference / special instructions
  let noteBoxY = curSumY + 14;
  if (customerNotes) {
    const allNoteLines = doc.splitTextToSize(customerNotes, contentWidth - 12);
    const lineHeight = 4.1;
    const maxLinesPerBox = 48;
    let remainingLines = [...allNoteLines];
    let partNumber = 1;

    while (remainingLines.length > 0) {
      const pageLines = remainingLines.splice(0, maxLinesPerBox);
      const boxHeight = 14 + (pageLines.length * lineHeight);

      if (noteBoxY + boxHeight > safeContentBottom) {
        doc.addPage();
        noteBoxY = 18;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(...borderLight);
      doc.setLineWidth(0.35);
      doc.roundedRect(marginX, noteBoxY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFillColor(...brandOrange);
      doc.rect(marginX, noteBoxY, 1.6, boxHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.7);
      doc.setTextColor(...primaryNavy);
      doc.text(
        partNumber === 1
          ? 'CUSTOMER REFERENCE / SPECIAL INSTRUCTIONS'
          : 'CUSTOMER REFERENCE / SPECIAL INSTRUCTIONS (CONTINUED)',
        marginX + 5,
        noteBoxY + 5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...textMuted);
      doc.text('Provided by customer • Applies to this order and production requirements', marginX + 5, noteBoxY + 9);

      doc.setFontSize(8.2);
      doc.setTextColor(...textDark);
      doc.text(pageLines, marginX + 5, noteBoxY + 14);
      noteBoxY += boxHeight + 5;
      partNumber += 1;

      if (remainingLines.length > 0) {
        doc.addPage();
        noteBoxY = 18;
      }
    }
  }

  // 9. Minimalist System-Generated Notice (No signature required)
  const noteBoxH = 8;
  if (noteBoxY + noteBoxH > safeContentBottom + 4) {
    doc.addPage();
    noteBoxY = 18;
  }
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, noteBoxY, contentWidth, noteBoxH, 1.5, 1.5, 'F');
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, noteBoxY, contentWidth, noteBoxH, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('This is a system-generated invoice. No signature required.', pageWidth / 2, noteBoxY + 5.2, { align: 'center' });

  // 10. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Record ID: ${invoiceNumber} • Thank you for your business!`, marginX, footerY);
  doc.text('BDigitizing Commercial Studio • www.bdigitizing.com', contentRight, footerY, { align: 'right' });

  // 11. Generate Output
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
