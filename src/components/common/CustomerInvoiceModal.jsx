'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Sparkles as _Sparkles
} from 'lucide-react';
import {
  generateCustomerTaxInvoicePdf,
  generateInvoiceNumber,
  formatOrderId,
  getOrderServiceTitle,
  getOrderFormatsString,
  getOrderTurnaroundTier,
  getOrderPriceNumeric,
  isOrderPaidStatus,
  formatFabricSpec,
  formatDimensionsSpec,
  getCustomerInstructionText
} from '../../utils/customerInvoicePdfGenerator';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';

export const CustomerInvoiceModal = ({
  order,
  client = null,
  isOpen = true,
  onClose
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  const isModalActive = Boolean(isOpen && order);
  const { handleSafeClose } = useModalBackNavigation({
    isOpen: isModalActive,
    onClose,
    modalId: 'customer_invoice_modal'
  });

  useEffect(() => {
    if (!isModalActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isModalActive, handleSafeClose]);

  if (!isOpen || !order) return null;

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
  const _unitPrice = quantity > 1 ? parseFloat((price / quantity).toFixed(2)) : price;
  const discountAmount = Math.max(0, parseFloat(order?.discount_amount || order?.discountAmount || 0));
  const rushFee = Math.max(0, parseFloat(order?.rush_fee || order?.rushFee || 0));
  const subtotal = discountAmount > 0 ? (price + discountAmount - rushFee) : price;
  const designTitle = order?.title || order?.design_name || order?.name || '';
  const customerNotes = getCustomerInstructionText(order);



  const specsParts = [];
  if (fabric) specsParts.push(`Fabric: ${fabric}`);
  if (placement) specsParts.push(`Placement: ${placement}`);
  if (dimensions) specsParts.push(`Dimensions: ${dimensions}`);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const { downloadPdf } = await generateCustomerTaxInvoicePdf({ order, client });
      downloadPdf();
    } catch (err) {
      console.error('Failed to generate customer invoice PDF:', err);
      alert('Could not generate invoice PDF. Please try printing or refresh.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    try {
      const printSheet = document.getElementById('customer-invoice-print-content');
      if (!printSheet) {
        window.print();
        return;
      }

      // Create an isolated hidden iframe containing ONLY the invoice document
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:fixed;top:-10000px;left:-10000px;width:816px;height:1056px;border:none;background:#fff;');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice_${invoiceNumber}</title>
            <meta charset="utf-8" />
            <style>
              @page {
                size: Letter portrait;
                margin: 0.42in;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html {
                font-size: 12px;
                background: #ffffff;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #0f172a;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 10.5px;
                line-height: 1.35;
              }
              #customer-invoice-print-content {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: #ffffff !important;
              }
              .invoice-print-keep {
                break-inside: avoid-page;
                page-break-inside: avoid;
              }
              .no-print {
                display: none !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                padding: 6px 7px !important;
                overflow-wrap: anywhere;
              }
              table {
                table-layout: fixed;
              }
            </style>
          </head>
          <body>
            ${printSheet.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.print():', e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      }, 300);
    } catch (err) {
      console.warn('Print initialization error:', err);
      window.print();
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(invoiceNumber);
      setHasCopiedId(true);
      setTimeout(() => setHasCopiedId(false), 2000);
    }
  };

  return (
    <div
      className="modal-overlay customer-invoice-overlay"
      onClick={handleSafeClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
    >
      {/* Print isolation styles for native Ctrl+P triggers */}
      <style>{`
        @page {
          size: Letter portrait;
          margin: 0.42in;
        }
        @media (max-width: 640px) {
          .customer-invoice-overlay {
            padding: 0 !important;
            align-items: stretch !important;
          }
          .customer-invoice-container {
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .customer-invoice-action-bar {
            padding: 0.65rem 0.75rem !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .customer-invoice-action-bar > div:last-child {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 2px;
          }
          #customer-invoice-print-content {
            padding: 1rem !important;
          }
        }
        @media print {
          html {
            font-size: 12px !important;
          }
          body {
            margin: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #customer-invoice-print-content,
          #customer-invoice-print-content * {
            visibility: visible !important;
          }
          .customer-invoice-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 99999999 !important;
            display: block !important;
          }
          .customer-invoice-container {
            position: static !important;
            max-width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            background: #ffffff !important;
          }
          .no-print,
          .customer-invoice-action-bar {
            display: none !important;
          }
          #customer-invoice-print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            font-size: 10.5px !important;
            line-height: 1.35 !important;
          }
          #customer-invoice-print-content table {
            table-layout: fixed !important;
          }
          #customer-invoice-print-content th,
          #customer-invoice-print-content td {
            padding: 6px 7px !important;
            overflow-wrap: anywhere !important;
          }
          .invoice-print-keep {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="modal-content customer-invoice-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* TOP ACTION BAR (Hidden from print) */}
        <div
          className="customer-invoice-action-bar no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 1.4rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                Commercial Tax Invoice
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                {invoiceNumber}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleCopyInvoiceNumber}
              className="btn btn-outline btn-sm no-print"
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.32rem 0.65rem',
                borderRadius: '7px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="Copy Invoice ID"
            >
              {hasCopiedId ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
              <span>{hasCopiedId ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-outline btn-sm no-print"
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.32rem 0.75rem',
                borderRadius: '7px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="Print Invoice"
            >
              <Printer size={13} /> Print
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="btn btn-primary-orange btn-sm no-print"
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.38rem 0.9rem',
                borderRadius: '7px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 3px 10px rgba(234, 88, 12, 0.3)'
              }}
            >
              <Download size={13} /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>

            <button
              type="button"
              onClick={handleSafeClose}
              className="no-print"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                padding: '0.35rem',
                cursor: 'pointer',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.2rem'
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* INVOICE CONTENT (Clean Executive Sheet) */}
        <div
          id="customer-invoice-print-content"
          className="printable-tax-invoice-sheet"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem 2.25rem',
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            boxSizing: 'border-box'
          }}
        >
          {/* Top Brand Accent Line */}
          <div style={{ height: '4px', background: '#ea580c', borderRadius: '2px', marginBottom: '1.5rem' }} />

          {/* Header Row */}
          <div className="invoice-print-keep" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                BDigitizing
              </h1>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Commercial Embroidery Digitizing & Vector Art
              </p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                support@bdigitizing.com • www.bdigitizing.com
              </p>
              <div style={{ marginTop: '0.35rem', fontSize: '0.62rem', fontWeight: 900, color: '#ea580c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Premium Client Document
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em' }}>
                TAX INVOICE
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginTop: '0.15rem' }}>
                {invoiceNumber}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                Date: {issueDateFormatted}
              </div>
              <div style={{ marginTop: '0.45rem' }}>
                <span style={{
                  background: isPaid ? '#ecfdf5' : '#fff7ed',
                  color: isPaid ? '#047857' : '#c2410c',
                  border: isPaid ? '1px solid #a7f3d0' : '1px solid #fed7aa',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '5px',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {isPaid ? `PAID (${paymentDateFormatted})` : 'PAYMENT DUE'}
                </span>
              </div>
            </div>
          </div>

          {/* Billed To & Order Details (Clean 2-Column Text) */}
          <div className="invoice-print-keep" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* Left: Billed To */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Billed To
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                {clientName}
              </div>
              {clientCompany && (
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.1rem' }}>
                  {clientCompany}
                </div>
              )}
              {clientEmail && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>
                  {clientEmail}
                </div>
              )}
              {clientPhone && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Tel: {clientPhone}
                </div>
              )}
              {clientAddress && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                  {clientAddress}
                </div>
              )}
            </div>

            {/* Right: Order Details */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Order Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', rowGap: '0.25rem', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Order ID:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatOrderId(order?.id)}</span>

                <span style={{ color: '#64748b' }}>Payment:</span>
                <span style={{ fontWeight: 700, color: isPaid ? '#10b981' : '#ea580c' }}>
                  {isPaid ? `Paid in Full (${paymentDateFormatted})` : 'Awaiting Payment'}
                </span>

                <span style={{ color: '#64748b' }}>Method:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {paymentMethod}
                </span>

                <span style={{ color: '#64748b' }}>Turnaround:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {turnaroundTier}
                </span>

                <span style={{ color: '#64748b' }}>Currency:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>USD ($)</span>
              </div>
            </div>

          </div>

          {/* Optional Production Specs Strip */}
          {specsParts.length > 0 && (
            <div className="invoice-print-keep" style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              padding: '0.55rem 0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#334155',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Production Specs:
              </span>
              <span>{specsParts.join('  •  ')}</span>
            </div>
          )}

          {/* Simple Clean Table */}
          <div className="invoice-print-keep" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.65rem 0.85rem', width: '5%' }}>#</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '50%' }}>Description</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '20%' }}>Formats</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '8%', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '17%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', color: '#94a3b8' }}>1</td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      {serviceTitle}
                    </div>
                    {designTitle && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Design: {designTitle}
                      </div>
                    )}
                    {specsParts.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        Specs: {specsParts.join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', color: '#475569', fontSize: '0.78rem' }}>
                    {formatsString}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', textAlign: 'center', fontWeight: 700 }}>
                    {quantity}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ${price.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Simple Right-Aligned Summary */}
          <div className="invoice-print-keep" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#10b981', marginBottom: '0.35rem' }}>
                  <span>Discount Applied:</span>
                  <span style={{ fontWeight: 700 }}>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {rushFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#ea580c', marginBottom: '0.35rem' }}>
                  <span>Rush Surcharge:</span>
                  <span style={{ fontWeight: 700 }}>+${rushFee.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.45rem' }}>
                <span>Tax (0% Export/B2B):</span>
                <span>$0.00</span>
              </div>
              <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '0.45rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  {isPaid ? 'Total Paid:' : 'Total Due:'}
                </span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: isPaid ? '#10b981' : '#ea580c' }}>
                  ${price.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Customer reference / special instructions */}
          {customerNotes && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.9rem 1rem',
              borderLeft: '4px solid #ea580c',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Customer Reference / Special Instructions
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {customerNotes}
              </div>
            </div>
          )}

          {/* System Generated Invoice - No signature required */}
          <div className="invoice-print-keep" style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#64748b'
          }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>This is a system-generated invoice. No signature required.</span>
          </div>

          {/* Footer */}
          <div className="invoice-print-keep" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
            <span>Record ID: {invoiceNumber}</span>
            <span>BDigitizing Commercial Studio</span>
          </div>

        </div>

      </div>
    </div>
  );
};
