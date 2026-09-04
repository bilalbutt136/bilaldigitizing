'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../context/StateContext';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Sliders
} from 'lucide-react';

export const StudioGeneralSettings = () => {
  const { siteSettings = {}, updateSiteSettings, showToast } = useAppState();

  const [isSaving, setIsSaving] = useState(false);

  // Business Identity
  const [studioName, setStudioName] = useState(siteSettings?.studioName || 'Bilal Digitizing Studio');
  const [studioTagline, setStudioTagline] = useState(siteSettings?.studioTagline || 'Premier Commercial Embroidery Digitizing & Vector Art Lab');
  const [supportPhone, setSupportPhone] = useState(siteSettings?.contactInfo?.phone || siteSettings?.contactPhone || '+1 (347) 915-4498');
  const [supportEmail, setSupportEmail] = useState(siteSettings?.contactInfo?.email || siteSettings?.supportEmail || 'orders@bdigitizing-pro.com');
  const [whatsappNumber, setWhatsappNumber] = useState(siteSettings?.contactInfo?.whatsapp || siteSettings?.whatsapp || '+1 (347) 915-4498');
  const [studioAddress, setStudioAddress] = useState(siteSettings?.contactInfo?.address || siteSettings?.studioAddress || '100 Craftsmanship Way, New York, NY 10001, USA');
  const [businessHours, setBusinessHours] = useState(siteSettings?.contactInfo?.businessHours || siteSettings?.businessHours || '24/7 Global Production Support');

  // Operations & Invoice Defaults
  const [currencySymbol, setCurrencySymbol] = useState(siteSettings?.currencySymbol || '$');
  const [currencyCode, setCurrencyCode] = useState(siteSettings?.currencyCode || 'USD');
  const [standardTurnaround, setStandardTurnaround] = useState(siteSettings?.standardTurnaround || '8 - 12 Hours');
  const [rushTurnaround, setRushTurnaround] = useState(siteSettings?.rushTurnaround || '2 - 4 Hours Express');
  const [maxUploadSize, setMaxUploadSize] = useState(siteSettings?.maxUploadSize || '100 MB');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(siteSettings?.invoiceFooterNote || 'Thank you for your business with Bilal Digitizing. For any technical sew-out questions, contact support 24/7.');

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.studioName) setStudioName(siteSettings.studioName);
      if (siteSettings.studioTagline) setStudioTagline(siteSettings.studioTagline);
      if (siteSettings.contactPhone || siteSettings.contactInfo?.phone) setSupportPhone(siteSettings.contactPhone || siteSettings.contactInfo?.phone);
      if (siteSettings.supportEmail || siteSettings.contactInfo?.email) setSupportEmail(siteSettings.supportEmail || siteSettings.contactInfo?.email);
      if (siteSettings.whatsapp || siteSettings.contactInfo?.whatsapp) setWhatsappNumber(siteSettings.whatsapp || siteSettings.contactInfo?.whatsapp);
      if (siteSettings.studioAddress || siteSettings.contactInfo?.address) setStudioAddress(siteSettings.studioAddress || siteSettings.contactInfo?.address);
      if (siteSettings.businessHours || siteSettings.contactInfo?.businessHours) setBusinessHours(siteSettings.businessHours || siteSettings.contactInfo?.businessHours);
      if (siteSettings.currencySymbol) setCurrencySymbol(siteSettings.currencySymbol);
      if (siteSettings.currencyCode) setCurrencyCode(siteSettings.currencyCode);
      if (siteSettings.standardTurnaround) setStandardTurnaround(siteSettings.standardTurnaround);
      if (siteSettings.rushTurnaround) setRushTurnaround(siteSettings.rushTurnaround);
      if (siteSettings.maxUploadSize) setMaxUploadSize(siteSettings.maxUploadSize);
      if (siteSettings.invoiceFooterNote) setInvoiceFooterNote(siteSettings.invoiceFooterNote);
    }
  }, [siteSettings]);

  const handleSaveGeneral = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    try {
      await updateSiteSettings({
        studioName: studioName.trim(),
        studioTagline: studioTagline.trim(),
        contactPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        whatsapp: whatsappNumber.trim(),
        studioAddress: studioAddress.trim(),
        businessHours: businessHours.trim(),
        contactInfo: {
          ...(siteSettings?.contactInfo || {}),
          phone: supportPhone.trim(),
          email: supportEmail.trim(),
          whatsapp: whatsappNumber.trim(),
          address: studioAddress.trim(),
          businessHours: businessHours.trim()
        },
        currencySymbol,
        currencyCode,
        standardTurnaround: standardTurnaround.trim(),
        rushTurnaround: rushTurnaround.trim(),
        maxUploadSize: maxUploadSize.trim(),
        invoiceFooterNote: invoiceFooterNote.trim()
      });
      showToast('Studio details and operational defaults saved to live database!', 'success');
    } catch {
      showToast('Failed to save general settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header Card */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <div style={{ background: 'rgba(249, 115, 22, 0.12)', color: 'var(--orange-500)', padding: '0.5rem', borderRadius: '10px' }}>
            <Building2 size={22} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Studio Profile, Contact & Operational Defaults
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Manage your official studio branding, direct customer support channels, currency formats, and invoice defaults.
        </p>
      </div>

      {/* 2. Studio Identity & Public Contact Details */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.25rem' }}>
          Studio Identity & Public Contact Channels
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Studio Brand Name *
            </label>
            <input
              type="text"
              className="form-control"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Official Slogan / Tagline
            </label>
            <input
              type="text"
              className="form-control"
              value={studioTagline}
              onChange={(e) => setStudioTagline(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Support Phone / Voice Line
            </label>
            <input
              type="text"
              className="form-control"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Customer Support & Orders Email
            </label>
            <input
              type="email"
              className="form-control"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              WhatsApp Direct Support Number
            </label>
            <input
              type="text"
              className="form-control"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Operating Hours Text
            </label>
            <input
              type="text"
              className="form-control"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Physical Studio Address (Displayed in Footer & Invoices)
            </label>
            <input
              type="text"
              className="form-control"
              value={studioAddress}
              onChange={(e) => setStudioAddress(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 3. Operational Defaults & Invoice Formatting */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.25rem' }}>
          Production & Invoice Defaults
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Currency Symbol
            </label>
            <select
              className="form-control"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
            >
              <option value="$">$ (USD / CAD / AUD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="AED">AED (Dirham)</option>
              <option value="PKR">PKR (Rupee)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Standard Delivery Guarantee
            </label>
            <input
              type="text"
              className="form-control"
              value={standardTurnaround}
              onChange={(e) => setStandardTurnaround(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Express Rush Turnaround Notice
            </label>
            <input
              type="text"
              className="form-control"
              value={rushTurnaround}
              onChange={(e) => setRushTurnaround(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Max Single File Upload Limit
            </label>
            <input
              type="text"
              className="form-control"
              value={maxUploadSize}
              onChange={(e) => setMaxUploadSize(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
            Invoice Note & Production Terms Footer
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={invoiceFooterNote}
            onChange={(e) => setInvoiceFooterNote(e.target.value)}
          />
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={isSaving} className="btn btn-primary-orange btn-lg" style={{ fontWeight: 800, padding: '0.85rem 2.25rem' }}>
          <Save size={18} /> {isSaving ? 'Saving...' : 'Save Studio Configurations'}
        </button>
      </div>

    </form>
  );
};
