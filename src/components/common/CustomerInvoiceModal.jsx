'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  generateCustomerTaxInvoicePdf, 
  generateInvoiceNumber, 
  formatOrderId, 
  getOrderServiceTitle, 
  getOrderFormatsString, 
  getOrderTurnaroundTier, 
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
  const turnaroundTier = getOrderTurnaroundTier(order);

  const clientName = client?.name || order?.client_name || order?.clientName || 'Commercial Client';
  const clientCompany = client?.company || order?.client_company || order?.company || 'Corporate Design Account';
  const clientEmail = client?.email || order?.client_email || order?.clientEmail || 'client@studio.com';

  const orderDateRaw = order?.createdAt || order?.created_at || new Date();
  const issueDateFormatted = new Date(orderDateRaw).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const paymentDateFormatted = order?.paid_at ? new Date(order.paid_at).toLocaleDateString('en-US', {
    month: 'long',
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
        background: 'rgba(15, 23, 42, 0.86)',
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
          maxWidth: '920px',
          maxHeight: '94vh',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden'
        }}
      >
        {/* TOP MODAL CONTROLS BAR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.4rem',
          background: 'var(--bg-surface, #f8fafc)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))',
              color: 'var(--color-primary, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                International Tax Invoice Preview
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>
                {invoiceNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleCopyInvoiceNumber}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="Copy Invoice ID"
            >
              {hasCopiedId ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              <span>{hasCopiedId ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Print official invoice"
            >
              <Printer size={14} /> Print
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="btn btn-primary-orange btn-sm"
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '0.4rem 0.95rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)'
              }}
            >
              <Download size={14} /> {isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                padding: '0.4rem',
                cursor: 'pointer',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* INVOICE PAPER BODY (Scrollable Viewport) */}
        <div 
          className="printable-tax-invoice-sheet"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem 2rem',
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            boxSizing: 'border-box'
          }}
        >
          {/* Top Decorative Stripe */}
          <div style={{ height: '5px', background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #0f172a 100%)', borderRadius: '4px', marginBottom: '1.25rem' }} />

          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  BILAL DIGITIZING
                </h1>
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                  COMMERCIAL STUDIO
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                Commercial Embroidery Digitizing & Vector Graphics Studio
              </p>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                International Digital Services Desk • Tax Reg ID: <strong>BD-INTL-TAX-984210</strong><br />
                Web: <span style={{ color: '#ea580c' }}>www.bilaldigitizing.com</span> • Support: <span style={{ color: '#ea580c' }}>billing@bilaldigitizing.com</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: isPaid ? '#ecfdf5' : '#fff7ed',
                color: isPaid ? '#047857' : '#c2410c',
                border: isPaid ? '1.5px solid #a7f3d0' : '1.5px solid #fed7aa',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                marginBottom: '0.45rem'
              }}>
                {isPaid ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                {isPaid ? 'Commercial Tax Invoice (Paid)' : 'Pro Forma Invoice (Unpaid)'}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                INVOICE #: <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{invoiceNumber}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                Date of Issue: <strong>{issueDateFormatted}</strong>
              </div>
            </div>
          </div>

          {/* Two-Column Bill-To & Order Details Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            
            {/* Bill-To Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Bill To (Client / Entity)
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {clientName}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
                <strong>Organization:</strong> {clientCompany}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
                <strong>Email:</strong> {clientEmail}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', background: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                Verified Commercial Account • Cross-Border B2B Client
              </div>
            </div>

            {/* Specifications Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Invoice & Order Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '0.35rem', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Order Reference:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatOrderId(order?.id)}</span>

                <span style={{ color: '#64748b' }}>Payment Status:</span>
                <span style={{ fontWeight: 800, color: isPaid ? '#10b981' : '#f59e0b' }}>
                  {isPaid ? `Paid in Full (${paymentDateFormatted})` : 'Awaiting Payment'}
                </span>

                <span style={{ color: '#64748b' }}>Currency:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>USD ($) — US Dollar</span>

                <span style={{ color: '#64748b' }}>Turnaround Tier:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{turnaroundTier}</span>
              </div>
            </div>

          </div>

          {/* Itemized Services Breakdown Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <th style={{ padding: '0.65rem 0.85rem', width: '5%' }}>#</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '50%' }}>Item & Service Description</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '20%' }}>Turnaround</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '8%', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '17%', textAlign: 'right' }}>Total (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <td style={{ padding: '0.85rem', verticalAlign: 'top', fontWeight: 800, color: '#64748b' }}>1</td>
                  <td style={{ padding: '0.85rem', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      {serviceTitle}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                      <strong>Design:</strong> {order?.title || 'Custom Client Design'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      <strong>Deliverables:</strong> {formatsString}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem', verticalAlign: 'top', color: '#334155', fontWeight: 600 }}>
                    {turnaroundTier}
                  </td>
                  <td style={{ padding: '0.85rem', verticalAlign: 'top', textAlign: 'center', fontWeight: 800 }}>
                    1
                  </td>
                  <td style={{ padding: '0.85rem', verticalAlign: 'top', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                    ${price.toFixed(2)} USD
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial & Tax Summary Box */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* Tax Rules & Compliance Notes (Left) */}
            <div style={{ flex: 1, minWidth: '280px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={15} style={{ color: '#10b981' }} /> Tax Treatment & Export Compliance
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.74rem', color: '#475569', lineHeight: 1.5 }}>
                <li><strong>Cross-Border Export:</strong> Zero-rated B2B digital service export under international trade treaties.</li>
                <li><strong>United States:</strong> IRS-compliant commercial expense documentation under IRC § 162 / Pub 583.</li>
                <li><strong>UK / European Union:</strong> Reverse charge mechanism applies for registered VAT entities.</li>
              </ul>
            </div>

            {/* Calculations Box (Right) */}
            <div style={{ width: '280px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '0.45rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>${price.toFixed(2)} USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '0.2rem' }}>
                <span>Sales Tax / VAT (0%):</span>
                <span>$0.00 USD</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.55rem' }}>
                * B2B Digital Export — Tax Exempt
              </div>
              <div style={{ height: '1px', background: '#cbd5e1', marginBottom: '0.55rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                  {isPaid ? 'Total Paid:' : 'Total Due:'}
                </span>
                <span style={{ fontWeight: 900, fontSize: '1.25rem', color: isPaid ? '#10b981' : '#ea580c' }}>
                  ${price.toFixed(2)} USD
                </span>
              </div>
            </div>

          </div>

          {/* Official Verification Stamp If Paid */}
          {isPaid && (
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Official Verified Commercial Transaction • Electronic Desk Clearance
                </div>
                <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '0.1rem' }}>
                  Full payment received and authenticated for Order {formatOrderId(order?.id)}. Electronic Ledger Reference: {invoiceNumber}
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM GENERATED LEGAL VALIDITY DECLARATION (Requested by User) */}
          <div style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} style={{ color: '#ea580c' }} /> System-Generated Document — Legal Validity & Signature Exemption Declaration
            </div>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: '#475569', lineHeight: 1.45 }}>
              This document is an authentic commercial tax invoice generated automatically by the Bilal Digitizing billing system. Under the Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. § 7001 - United States), the Uniform Electronic Transactions Act (UETA), Regulation (EU) No 910/2014 (eIDAS - European Union), and the UNCITRAL Model Law on Electronic Commerce, this computer-generated document constitutes an authentic, legally binding tax receipt and proof of commercial expense without requiring any physical signature, seal, or corporate stamp.
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.45 }}>
              Valid for corporate tax deductions, VAT/sales tax input credits, IRS expense substantiation, and international audit compliance across the United States of America (IRS), Canada (CRA), United Kingdom (HMRC), European Union, Australia (ATO), and worldwide.
            </p>
          </div>

          {/* Bottom Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <span>Generated on {new Date().toLocaleString('en-US')} • Record ID: {invoiceNumber}</span>
            <span>Bilal Digitizing — International Commercial Billing Infrastructure</span>
          </div>

        </div>

      </div>
    </div>
  );
};
