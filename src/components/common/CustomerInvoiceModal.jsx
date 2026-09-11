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
  ShieldCheck
} from 'lucide-react';
import { 
  generateCustomerTaxInvoicePdf, 
  generateInvoiceNumber, 
  formatOrderId, 
  getOrderServiceTitle, 
  getOrderFormatsString, 
  getOrderPriceNumeric, 
  isOrderPaidStatus 
} from '../../utils/customerInvoicePdfGenerator';

export const CustomerInvoiceModal = ({
  order,
  client = null,
  isOpen = true,
  onClose
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [onClose]);

  if (!isOpen || !order) return null;

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

  const paymentDateFormatted = order?.paid_at ? new Date(order.paid_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : issueDateFormatted;

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
    window.print();
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
      onClick={onClose}
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
        {/* TOP ACTION BAR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.8rem 1.4rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0
        }}>
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
              className="btn btn-outline btn-sm"
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
              className="btn btn-outline btn-sm"
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
              className="btn btn-primary-orange btn-sm"
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
              onClick={onClose}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                BILAL DIGITIZING
              </h1>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Commercial Embroidery Digitizing & Vector Art
              </p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                billing@bilaldigitizing.com • www.bilaldigitizing.com
              </p>
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
                  {isPaid ? 'PAID' : 'PAYMENT DUE'}
                </span>
              </div>
            </div>
          </div>

          {/* Billed To & Order Details (Clean 2-Column Text) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            
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
            </div>

            {/* Right: Order Details */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Order Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', rowGap: '0.25rem', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Order ID:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatOrderId(order?.id)}</span>

                <span style={{ color: '#64748b' }}>Payment:</span>
                <span style={{ fontWeight: 700, color: isPaid ? '#10b981' : '#ea580c' }}>
                  {isPaid ? `Paid in Full (${paymentDateFormatted})` : 'Awaiting Payment'}
                </span>

                <span style={{ color: '#64748b' }}>Currency:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>USD ($)</span>
              </div>
            </div>

          </div>

          {/* Simple Clean Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.65rem 0.85rem', width: '5%' }}>#</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '55%' }}>Description</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '20%' }}>Formats</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '8%', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '12%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', color: '#94a3b8' }}>1</td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      {serviceTitle}
                    </div>
                    {order?.title && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                        Design: {order.title}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', color: '#475569', fontSize: '0.78rem' }}>
                    {formatsString}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', textAlign: 'center', fontWeight: 700 }}>
                    1
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'top', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ${price.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Simple Right-Aligned Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem' }}>
            <div style={{ width: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>${price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.45rem' }}>
                <span>Tax (0%):</span>
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

          {/* Concise 1-Sentence System Generated International Note */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} /> System-Generated Invoice — No Signature Required
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
              This electronic invoice is legally valid worldwide for business expense deductions and tax accounting without a physical signature or stamp (compliant with US E-SIGN Act, EU eIDAS & international commercial standards).
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
            <span>Record ID: {invoiceNumber}</span>
            <span>Bilal Digitizing Commercial Studio</span>
          </div>

        </div>

      </div>
    </div>
  );
};
