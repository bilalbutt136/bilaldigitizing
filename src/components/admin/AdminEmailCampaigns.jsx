'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Send, Users, Clock, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Sparkles,
  FileText, AtSign, BarChart3, HelpCircle,
  ShieldCheck
} from 'lucide-react';

const STAT_CARD = ({ icon: Icon, label, value, color = '#ea580c' }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    boxShadow: 'var(--shadow-sm)'
  }}>
    <div style={{ background: `${color}18`, borderRadius: '10px', padding: '0.6rem', flexShrink: 0 }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
    </div>
  </div>
);

const STATUS_BADGE = ({ status }) => {
  const map = {
    sent:    { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle, label: 'Sent' },
    partial: { bg: '#fef3c7', color: '#d97706', icon: AlertTriangle, label: 'Partial' },
    failed:  { bg: '#fee2e2', color: '#dc2626', icon: XCircle, label: 'Failed' },
    draft:   { bg: '#f1f5f9', color: '#64748b', icon: FileText, label: 'Draft' }
  };
  const s = map[status] || map.draft;
  const Icon = s.icon;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', background: s.bg, color: s.color, fontSize:'0.72rem', fontWeight:700, padding:'0.2rem 0.55rem', borderRadius:'9999px' }}>
      <Icon size={11} /> {s.label}
    </span>
  );
};

export function AdminEmailCampaigns() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [activeTab, setActiveTab]     = useState('compose'); // 'compose' | 'history'
  const [previewCount, setPreviewCount] = useState(null);
  const [checkingAudience, setCA]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [showConfigHelp, setShowHelp] = useState(false);
  const [serverConfig, setServerConfig] = useState(null);

  // Clean Simple Form Inputs (NO HTML required)
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject]           = useState('');
  const [headline, setHeadline]         = useState('');
  const [message, setMessage]           = useState('');
  const [offerCode, setOfferCode]       = useState('');
  const [buttonText, setButtonText]     = useState('Place Your Order Now');
  const [buttonUrl, setButtonUrl]       = useState('https://bdigitizing.com');
  const [recipientMode, setRM]          = useState('test'); // 'test' | 'single' | 'all_clients'
  const [testEmail, setTestEmail]       = useState('');
  const [singleEmail, setSingleEmail]   = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Load Campaign History ──────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (data.config) setServerConfig(data.config);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ── Audience Count Check ───────────────────────────────────────────────────
  const handleCheckAudience = async () => {
    setCA(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'Audience Check',
          message: message || 'Audience Check',
          recipientMode,
          testEmail,
          singleEmail,
          preview: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewCount(data.recipientCount);
        showToast(`Audience calculated: ${data.recipientCount} client${data.recipientCount !== 1 ? 's' : ''}`, 'info');
      } else {
        showToast(data.error || 'Could not calculate audience', 'error');
      }
    } catch {
      showToast('Network error while checking audience', 'error');
    }
    setCA(false);
  };

  // ── Send Campaign ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim()) {
      showToast('Please enter an email subject line.', 'error');
      return;
    }
    if (!message.trim()) {
      showToast('Please write your email message content.', 'error');
      return;
    }
    if (recipientMode === 'test' && !testEmail.trim()) {
      showToast('Please enter your test email address.', 'error');
      return;
    }
    if (recipientMode === 'single' && !singleEmail.trim()) {
      showToast('Please enter the customer email address.', 'error');
      return;
    }

    const confirmMsg = recipientMode === 'all_clients'
      ? 'Are you sure you want to broadcast this campaign to ALL active clients in your database?'
      : `Send email to: ${recipientMode === 'test' ? testEmail : singleEmail}?`;

    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          subject,
          headline,
          message,
          offerCode,
          buttonText,
          buttonUrl,
          recipientMode,
          testEmail,
          singleEmail
        })
      });

      const data = await res.json();

      if (data.success) {
        showToast(`🎉 ${data.message}`, 'success');
        loadCampaigns();
        setActiveTab('history');
      } else {
        showToast(`❌ ${data.error || 'Failed to send campaign'}`, 'error');
        loadCampaigns();
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }
    setSending(false);
  };

  // Quick preset template filler
  const handleApplyPreset = (presetType) => {
    if (presetType === 'discount') {
      setCampaignName('Flash Sale 20% Off');
      setSubject('🎉 Exclusive 20% Off Your Next Embroidery Order!');
      setHeadline('Save 20% On All Custom Digitizing & Vector Work');
      setMessage("Hi there!\n\nFor a limited time, enjoy an exclusive 20% discount on all custom embroidery digitizing and vector conversion services.\n\nWhether you need cap logos, jacket back pieces, or left-chest emblems, our master digitizers deliver high-density, production-ready files in under 12 hours.");
      setOfferCode('SAVE20');
      setButtonText('Place Order With 20% Off');
      setButtonUrl('https://bdigitizing.com');
    } else if (presetType === 'update') {
      setCampaignName('Service Update & Fast Turnaround');
      setSubject('⚡ Faster Turnaround Times Now Active at BDigitizing');
      setHeadline('Supercharge Your Production With 8-12 Hour Turnaround');
      setMessage("Hello,\n\nWe have expanded our team of master digitizers to provide faster turnaround times without sacrificing the immaculate stitch quality you rely on.\n\nSend us your complex logos and artwork today for same-day delivery.");
      setOfferCode('');
      setButtonText('Upload New Artwork');
      setButtonUrl('https://bdigitizing.com');
    }
    showToast('Preset loaded! You can edit any field before sending.', 'info');
  };

  // Stats calculation
  const totalSent   = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.fail_count || 0), 0);

  // Derived preview data
  const previewHeadline = headline.trim() || subject.trim() || 'Special Announcement from BDigitizing';
  const previewParagraphs = message.trim()
    ? message.trim().split(/\n\s*\n/)
    : ['Your email message will appear here. Write normal text in the box on the left, and it will be beautifully formatted automatically!'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── Toast Notification ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'info' ? '#eff6ff' : '#dcfce7',
          color: toast.type === 'error' ? '#991b1b' : toast.type === 'info' ? '#1e40af' : '#14532d',
          border: `1.5px solid ${toast.type === 'error' ? '#fca5a5' : toast.type === 'info' ? '#93c5fd' : '#86efac'}`,
          padding: '0.85rem 1.35rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem',
          boxShadow: '0 10px 28px rgba(0,0,0,0.14)', maxWidth: '420px', lineHeight: 1.5
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={24} style={{ color: '#ea580c' }} /> Email Campaigns & Mailbox
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Send announcements, discounts, and custom updates from <strong>support@bdigitizing.com</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowHelp(!showConfigHelp)}
            style={{
              padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: showConfigHelp ? 'rgba(234,88,12,0.1)' : 'var(--bg-card)',
              color: showConfigHelp ? '#ea580c' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            <HelpCircle size={14} /> Domain / Setup Guide
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '8px', border: '1.5px solid', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
              background: activeTab === 'compose' ? 'var(--orange-500)' : 'var(--bg-card)',
              color: activeTab === 'compose' ? '#fff' : 'var(--text-main)',
              borderColor: activeTab === 'compose' ? 'var(--orange-500)' : 'var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <Send size={14} /> Compose
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('history'); loadCampaigns(); }}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '8px', border: '1.5px solid', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
              background: activeTab === 'history' ? 'var(--orange-500)' : 'var(--bg-card)',
              color: activeTab === 'history' ? '#fff' : 'var(--text-main)',
              borderColor: activeTab === 'history' ? 'var(--orange-500)' : 'var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <Clock size={14} /> Campaign History
          </button>
        </div>
      </div>

      {/* ── Setup / Verification Guidance Dropdown ─────────────────────────── */}
      {showConfigHelp && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px solid #fed7aa',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#9a3412', fontSize: '0.95rem' }}>
              <ShieldCheck size={18} /> How to send 100% spam-free from support@bdigitizing.com
            </div>
            <button type="button" onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            Aapne Namecheap se <strong>support@bdigitizing.com</strong> purchase kar liya hai. Emails live clients ko seamlessly deliver hone ke 2 aasan tareeqe hain:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                Tareeqa 1: Resend Domain Verification (Recommended)
              </div>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li><strong><a href="https://resend.com/domains" target="_blank" rel="noreferrer" style={{ color: '#ea580c' }}>resend.com/domains</a></strong> open karein.</li>
                <li><strong>"Add Domain"</strong> click karein aur <code>bdigitizing.com</code> enter karein.</li>
                <li>Resend jo 2 DNS records (DKIM & SPF TXT) dega, unhein Namecheap Advanced DNS mein paste karein.</li>
                <li>Resend domain verify hote hi emails direct inbox mein deliver hongi.</li>
              </ol>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                Tareeqa 2: Namecheap Private Email SMTP
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Agar aap Resend use nahi karna chahte, to Namecheap Private Email ke SMTP credentials (Server: <code>mail.privateemail.com</code>, Port: <code>465</code>, Password) se direct Namecheap ke through bhi emails send ho sakti hain!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Stat Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
        <STAT_CARD icon={Send} label="Total Campaigns" value={campaigns.length} color="#ea580c" />
        <STAT_CARD icon={Users} label="Delivered Emails" value={totalSent.toLocaleString()} color="#16a34a" />
        <STAT_CARD icon={XCircle} label="Delivery Errors" value={totalFailed} color={totalFailed > 0 ? '#dc2626' : '#94a3b8'} />
        <STAT_CARD
          icon={AtSign}
          label={serverConfig?.hasSmtp ? 'Sender (Namecheap SMTP)' : 'Sender (support@)'}
          value={serverConfig?.hasSmtp ? 'SMTP Active' : 'support@'}
          color="#3b82f6"
        />
      </div>

      {/* ── Compose Mode ───────────────────────────────────────────────────── */}
      {activeTab === 'compose' && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left Side: Clean Form (NO HTML CODE REQUIRED) */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Quick Templates / Presets Bar */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px',
              padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '0.6rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={15} style={{ color: '#ea580c' }} /> Quick Preset Templates:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('discount')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #fed7aa',
                    background: '#fff7ed', color: '#c2410c', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🎉 20% Discount Offer
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('update')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  ⚡ Speed / Turnaround Notice
                </button>
              </div>
            </div>

            {/* Section 1: Audience & Sender */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.35rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} style={{ color: '#ea580c' }} /> 1. Select Target Audience
              </div>

              {/* Recipient Target Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { id: 'test', label: '🧪 Test Send', desc: 'Send to my own email first' },
                  { id: 'single', label: '👤 Single Client', desc: 'Send to 1 specific email' },
                  { id: 'all_clients', label: '📢 All Clients', desc: 'Broadcast to all clients' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRM(opt.id)}
                    style={{
                      padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1.5px solid',
                      borderColor: recipientMode === opt.id ? '#ea580c' : 'var(--border-color)',
                      background: recipientMode === opt.id ? 'rgba(234,88,12,0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: recipientMode === opt.id ? '#ea580c' : 'var(--text-main)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Conditional Email Inputs */}
              {recipientMode === 'test' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    YOUR TEST EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="Enter your email to receive a test preview"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setTestEmail('bilalsadiq612@gmail.com')}
                      style={{ fontSize: '0.7rem', color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Fill: bilalsadiq612@gmail.com (Resend Account Email)
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>•</span>
                    <button
                      type="button"
                      onClick={() => setTestEmail('shahidbutt59191@gmail.com')}
                      style={{ fontSize: '0.7rem', color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Fill: shahidbutt59191@gmail.com (Admin Email)
                    </button>
                  </div>
                </div>
              )}

              {recipientMode === 'single' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    RECIPIENT CUSTOMER EMAIL *
                  </label>
                  <input
                    type="email"
                    value={singleEmail}
                    onChange={e => setSingleEmail(e.target.value)}
                    placeholder="e.g. client@example.com"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {recipientMode === 'all_clients' && (
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
                  padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#9a3412', fontWeight: 600 }}>
                    📢 Will broadcast to all clients who haven't opted out.
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckAudience}
                    disabled={checkingAudience}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #ea580c',
                      background: '#ea580c', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {checkingAudience ? 'Calculating...' : previewCount !== null ? `Audience: ${previewCount} Clients` : 'Check Client Count'}
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Email Details (Clean fields, NO HTML) */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.35rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} style={{ color: '#ea580c' }} /> 2. Compose Email Content
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {/* Campaign Name (Internal) */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    CAMPAIGN TITLE (For your admin dashboard records)
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g. Autumn 20% Discount Blast"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Subject Line */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    EMAIL SUBJECT LINE * (What the customer sees in their inbox)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. 🎉 Special Offer: 20% Off Your Embroidery Digitizing!"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Headline / Title */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    TOP HEADLINE (Bold greeting inside the email)
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. Exclusive Offer for You! 👋"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Message Body (Normal Text) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      MESSAGE CONTENT * (Normal text — no HTML tags needed!)
                    </label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Paragraphs will automatically format nicely
                    </span>
                  </div>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={7}
                    placeholder="Type your message here as you would in a regular email...&#10;&#10;Use blank lines between paragraphs. It will automatically look sleek and professional in the customer's inbox!"
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.6,
                      boxSizing: 'border-box', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                {/* Highlight / Promo Code Box */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    PROMO CODE / SPECIAL HIGHLIGHT (Optional)
                  </label>
                  <input
                    type="text"
                    value={offerCode}
                    onChange={e => setOfferCode(e.target.value)}
                    placeholder="e.g. SAVE20 or FLAT 20% OFF"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: '#ea580c', fontWeight: 700, fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Call To Action Button */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      BUTTON TEXT (Optional)
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={e => setButtonText(e.target.value)}
                      placeholder="e.g. Place Your Order Now"
                      style={{
                        width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      BUTTON URL (Link to open)
                    </label>
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={e => setButtonUrl(e.target.value)}
                      placeholder="https://bdigitizing.com"
                      style={{
                        width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Submit Action Button */}
            <div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                style={{
                  width: '100%', padding: '0.95rem 1.5rem', borderRadius: '12px', border: 'none',
                  background: sending ? '#94a3b8' : '#ea580c', color: '#ffffff',
                  fontWeight: 800, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)', transition: 'all 0.15s ease'
                }}
              >
                {sending ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" /> Sending Email...
                  </>
                ) : (
                  <>
                    <Send size={18} /> {recipientMode === 'test' ? 'Send Test Email' : recipientMode === 'single' ? 'Send to Customer' : 'Broadcast to All Clients'}
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Side: Live Visual Preview Card (Customer's Perspective) */}
          <div style={{ flex: '1 1 420px', position: 'sticky', top: '1rem' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)'
            }}>
              {/* Fake Email Client Top Bar */}
              <div style={{
                background: 'var(--bg-surface)', padding: '0.75rem 1.1rem',
                borderBottom: '1px solid var(--border-color)', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Customer Inbox Preview
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 700 }}>
                  Live Visual
                </span>
              </div>

              {/* Email Envelope Meta Header */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78rem', background: 'var(--bg-card)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <strong>From:</strong> BDigitizing Support &lt;support@bdigitizing.com&gt;
                </div>
                <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  <strong>Subject:</strong> {subject.trim() || '(No subject line yet)'}
                </div>
              </div>

              {/* Rendered Email Visual Box */}
              <div style={{ background: '#f1f5f9', padding: '1.25rem' }}>
                <div style={{
                  maxWidth: '520px', margin: '0 auto', background: '#ffffff',
                  border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                }}>

                  {/* Header Banner */}
                  <div style={{ background: '#090d16', padding: '20px 24px', textAlign: 'center', borderBottom: '3px solid #ea580c' }}>
                    <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      BDIGITIZING <span style={{ color: '#ea580c' }}>STUDIO</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                      Commercial Embroidery Digitizing &amp; Vector Art
                    </div>
                  </div>

                  {/* Content Area */}
                  <div style={{ padding: '24px 26px', color: '#1e293b' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', lineHeight: 1.35 }}>
                      {previewHeadline}
                    </div>

                    {previewParagraphs.map((para, i) => (
                      <p key={i} style={{ margin: '0 0 14px 0', color: '#334155', fontSize: '13.5px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                        {para}
                      </p>
                    ))}

                    {/* Promo Box (if entered) */}
                    {offerCode.trim() && (
                      <div style={{
                        background: '#fff7ed', border: '2px dashed #ea580c', borderRadius: '8px',
                        padding: '14px 18px', textAlign: 'center', margin: '20px 0'
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                          PROMO CODE
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', letterSpacing: '1.5px', fontFamily: 'monospace' }}>
                          {offerCode.trim()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#7c2d12', marginTop: '4px' }}>
                          Mention this code when submitting your next order.
                        </div>
                      </div>
                    )}

                    {/* Button (if entered) */}
                    {buttonText.trim() && (
                      <div style={{ textAlign: 'center', margin: '22px 0 10px 0' }}>
                        <div style={{
                          display: 'inline-block', background: '#ea580c', color: '#ffffff',
                          padding: '11px 26px', borderRadius: '8px', fontWeight: 800, fontSize: '13.5px'
                        }}>
                          {buttonText.trim()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{
                    background: '#f8fafc', padding: '16px 20px', textAlign: 'center',
                    borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', lineHeight: 1.6
                  }}>
                    <div style={{ fontWeight: 700, color: '#334155' }}>BDigitizing Studio</div>
                    <div>support@bdigitizing.com • bdigitizing.com</div>
                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
                      24/7 Production Support • High-Precision Stitch Art
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── History Mode ───────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '1rem 1.35rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={18} style={{ color: '#ea580c' }} /> Campaign Logs & Delivery Records
            </span>
            <button
              type="button"
              onClick={loadCampaigns}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} /> Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <RefreshCw size={22} className="spin-icon" style={{ color: '#ea580c', marginBottom: '0.5rem' }} />
              <div>Loading campaign history...</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Mail size={40} style={{ color: 'var(--border-color)', marginBottom: '0.85rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>No Campaigns Dispatched Yet</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>Switch to the Compose tab to create your first promotional blast.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Campaign', 'Subject', 'From', 'Recipients', 'Sent', 'Failed', 'Status', 'Error / Reason', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr
                      key={c.id || i}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name || 'Untitled'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.subject}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#2563eb', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {c.from_address?.replace(/^.*<([^>]+)>.*$/, '$1') || c.from_address}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {(c.recipient_count || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 800 }}>
                        {(c.sent_count || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: c.fail_count > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: c.fail_count > 0 ? 800 : 400 }}>
                        {c.fail_count || 0}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <STATUS_BADGE status={c.status} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', fontSize: '0.75rem', color: c.status === 'failed' ? '#dc2626' : 'var(--text-muted)' }}>
                        {c.error_message ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title={c.error_message}>
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.error_message}
                            </span>
                          </div>
                        ) : c.status === 'sent' ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>All delivered</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default AdminEmailCampaigns;
