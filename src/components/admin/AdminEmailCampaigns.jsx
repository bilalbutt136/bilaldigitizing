'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Send, Users, TestTube2, Clock, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Eye, ChevronDown, ChevronUp, Zap,
  FileText, AtSign, Inbox, BarChart3
} from 'lucide-react';

// ── Simple HTML Editor ──────────────────────────────────────────────────────
const STARTER_TEMPLATE = `<div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <div style="background:#090d16;padding:24px;text-align:center;border-bottom:3px solid #ea580c;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">BDIGITIZING <span style="color:#ea580c;">STUDIO</span></h1>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Professional Embroidery Digitizing &amp; Vector Art</p>
  </div>
  <div style="padding:28px 32px;color:#1e293b;line-height:1.7;">
    <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 12px;">Hello Valued Client! 👋</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Write your promotional message here. You can include special offers, new service announcements, or important updates.
    </p>
    <div style="background:#fff7ed;border-left:4px solid #ea580c;padding:14px 18px;border-radius:6px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#9a3412;font-weight:600;">🎉 Special Offer: Get 20% off your next order!</p>
    </div>
    <div style="text-align:center;margin:28px 0 10px;">
      <a href="https://bdigitizing.com" style="background:#ea580c;color:#fff;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
        Place Your Order Now
      </a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:18px 24px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
    <p style="margin:0 0 4px;font-weight:600;color:#334155;">BDigitizing Studio</p>
    <p style="margin:0;">support@bdigitizing.com &bull; bdigitizing.com</p>
    <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;">You are receiving this because you have an account with us. <a href="https://bdigitizing.com/client-portal" style="color:#ea580c;">Unsubscribe</a></p>
  </div>
</div>`;

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
  // ── State ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [preview, setPreview]         = useState(null);
  const [previewLoading, setPL]       = useState(false);
  const [activeTab, setActiveTab]     = useState('compose'); // 'compose' | 'history'
  const [showHtmlPreview, setShowHP]  = useState(false);
  const [toast, setToast]             = useState(null);

  // Form state
  const [subject, setSubject]         = useState('');
  const [htmlBody, setHtmlBody]       = useState(STARTER_TEMPLATE);
  const [campaignName, setCampaignName] = useState('');
  const [recipientMode, setRM]        = useState('test'); // test | all_clients | single
  const [testEmail, setTestEmail]     = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [fromAlias, setFromAlias]     = useState('support'); // support | orders

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load campaigns ───────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      const data = await res.json();
      if (data.success) setCampaigns(data.campaigns || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // ── Preview recipients ───────────────────────────────────────────────────
  const handlePreview = async () => {
    if (recipientMode === 'test') {
      setPreview({ recipientCount: 1, recipients: [testEmail || '(your test email)'] });
      return;
    }
    if (recipientMode === 'single') {
      setPreview({ recipientCount: 1, recipients: [singleEmail || '(single email)'] });
      return;
    }
    setPL(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject || 'preview', htmlBody: '<p>preview</p>', recipientMode, fromAlias, preview: true })
      });
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      showToast('Preview failed: ' + err.message, 'error');
    }
    setPL(false);
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim()) { showToast('Subject is required.', 'error'); return; }
    if (!htmlBody.trim()) { showToast('Email body is required.', 'error'); return; }
    if (recipientMode === 'test' && !testEmail.trim()) { showToast('Test email address required.', 'error'); return; }
    if (recipientMode === 'single' && !singleEmail.trim()) { showToast('Recipient email required.', 'error'); return; }

    const confirm = window.confirm(
      recipientMode === 'all_clients'
        ? `Send this campaign to ALL active clients? This cannot be undone.`
        : `Send test email to: ${recipientMode === 'test' ? testEmail : singleEmail}?`
    );
    if (!confirm) return;

    setSending(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlBody, recipientMode, testEmail, singleEmail, campaignName, fromAlias })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
        loadCampaigns();
        setActiveTab('history');
      } else {
        showToast(data.error || 'Send failed', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }
    setSending(false);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalSent   = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.fail_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#991b1b' : '#14532d',
          border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`,
          padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '360px'
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={22} style={{ color: '#ea580c' }} /> Email Campaigns & Mailbox
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
            Send promotional emails from <strong>support@bdigitizing.com</strong> directly to your clients
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              background: activeTab === 'compose' ? 'var(--orange-500)' : 'var(--bg-card)',
              color: activeTab === 'compose' ? '#fff' : 'var(--text-main)',
              borderColor: activeTab === 'compose' ? 'var(--orange-500)' : 'var(--border-color)'
            }}
          >
            <Zap size={13} style={{ marginRight: '0.35rem' }} /> Compose
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('history'); loadCampaigns(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              background: activeTab === 'history' ? 'var(--orange-500)' : 'var(--bg-card)',
              color: activeTab === 'history' ? '#fff' : 'var(--text-main)',
              borderColor: activeTab === 'history' ? 'var(--orange-500)' : 'var(--border-color)'
            }}
          >
            <Clock size={13} style={{ marginRight: '0.35rem' }} /> History
          </button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
        <STAT_CARD icon={Send} label="Campaigns Sent" value={campaigns.length} color="#ea580c" />
        <STAT_CARD icon={Users} label="Emails Delivered" value={totalSent.toLocaleString()} color="#16a34a" />
        <STAT_CARD icon={XCircle} label="Failed" value={totalFailed} color="#dc2626" />
        <STAT_CARD icon={AtSign} label="From Address" value="support@" color="#3b82f6" />
      </div>

      {/* ── Compose Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'compose' && (
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left: Form */}
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* From + Recipient Mode */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AtSign size={15} style={{ color: '#ea580c' }} /> Sender & Recipients
              </h3>

              {/* From Address */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>FROM ADDRESS</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { id: 'support', label: 'support@bdigitizing.com', desc: 'Support / Promo' },
                    { id: 'orders',  label: 'orders@bdigitizing.com',  desc: 'Transactional' }
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setFromAlias(opt.id)} style={{
                      flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1.5px solid',
                      borderColor: fromAlias === opt.id ? '#ea580c' : 'var(--border-color)',
                      background: fromAlias === opt.id ? 'rgba(234,88,12,0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer', textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, color: fromAlias === opt.id ? '#ea580c' : 'var(--text-main)' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Mode */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>SEND TO</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'test',        label: '🧪 Test Only',      desc: 'My test email' },
                    { id: 'single',      label: '👤 Single Client',  desc: 'One address' },
                    { id: 'all_clients', label: '📢 All Clients',    desc: 'Bulk broadcast' }
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setRM(opt.id)} style={{
                      flex: '1 1 120px', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid',
                      borderColor: recipientMode === opt.id ? '#ea580c' : 'var(--border-color)',
                      background: recipientMode === opt.id ? 'rgba(234,88,12,0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer', textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, color: recipientMode === opt.id ? '#ea580c' : 'var(--text-main)' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {recipientMode === 'test' && (
                  <input
                    type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ marginTop: '0.6rem', width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                )}
                {recipientMode === 'single' && (
                  <input
                    type="email" value={singleEmail} onChange={e => setSingleEmail(e.target.value)}
                    placeholder="client@email.com"
                    style={{ marginTop: '0.6rem', width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                )}
                {recipientMode === 'all_clients' && (
                  <div style={{ marginTop: '0.65rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#92400e', fontWeight: 600 }}>
                    ⚠️ This will send to ALL clients in your database. Use the Preview button first to check recipient count.
                  </div>
                )}
              </div>
            </div>

            {/* Subject + Campaign Name */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={15} style={{ color: '#ea580c' }} /> Email Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>CAMPAIGN NAME (Internal)</label>
                  <input
                    type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g. October Promo 2026"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>EMAIL SUBJECT LINE *</label>
                  <input
                    type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="🎉 Special Offer: 20% Off This Week Only!"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={handlePreview} disabled={previewLoading}
                style={{ flex: '1 1 130px', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Eye size={15} /> {previewLoading ? 'Loading…' : 'Preview Recipients'}
              </button>
              <button type="button" onClick={() => setShowHP(!showHtmlPreview)}
                style={{ flex: '1 1 130px', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Eye size={15} /> {showHtmlPreview ? 'Hide' : 'Preview Email'}
              </button>
              <button type="button" onClick={handleSend} disabled={sending}
                style={{ flex: '2 1 160px', padding: '0.7rem 1.25rem', borderRadius: '10px', border: 'none', background: sending ? '#94a3b8' : '#ea580c', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {sending ? <><RefreshCw size={15} className="spin-icon" /> Sending…</> : <><Send size={15} /> Send Campaign</>}
              </button>
            </div>

            {/* Preview Recipients */}
            {preview && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  📬 {preview.recipientCount} recipient{preview.recipientCount !== 1 ? 's' : ''} will receive this email
                </div>
                {Array.isArray(preview.recipients) && preview.recipients.slice(0, 8).map((e, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.2rem 0' }}>• {e}</div>
                ))}
                {(preview.recipientCount || 0) > 8 && (
                  <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, marginTop: '0.3rem' }}>…and {preview.recipientCount - 8} more</div>
                )}
              </div>
            )}
          </div>

          {/* Right: HTML Editor + Preview */}
          <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>✏️ HTML Email Body</span>
                <button type="button" onClick={() => setHtmlBody(STARTER_TEMPLATE)}
                  style={{ fontSize: '0.72rem', color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  Reset Template
                </button>
              </div>
              <textarea
                value={htmlBody}
                onChange={e => setHtmlBody(e.target.value)}
                rows={22}
                spellCheck={false}
                style={{ width: '100%', padding: '1rem', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: '0.8rem', lineHeight: 1.6, border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Live HTML Preview */}
            {showHtmlPreview && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '0.75rem 1.1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  👁️ Email Preview (how it looks in inbox)
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', overflowX: 'auto' }}>
                  <iframe
                    srcDoc={htmlBody}
                    title="Email Preview"
                    style={{ width: '100%', minHeight: '400px', border: 'none', borderRadius: '8px' }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── History Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={17} style={{ color: '#ea580c' }} /> Campaign History
            </span>
            <button type="button" onClick={loadCampaigns} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <RefreshCw size={20} className="spin-icon" style={{ color: '#ea580c', marginBottom: '0.5rem' }} />
              <div>Loading campaign history…</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Mail size={36} style={{ color: 'var(--border-color)', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700 }}>No campaigns sent yet</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>Compose your first campaign to see it here.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Campaign', 'Subject', 'From', 'Recipients', 'Sent', 'Failed', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.65rem 0.9rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={c.id || i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || '—'}</td>
                      <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</td>
                      <td style={{ padding: '0.65rem 0.9rem', color: '#3b82f6', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{c.from_address?.split('<')[1]?.replace('>', '') || c.from_address}</td>
                      <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{(c.recipient_count || 0).toLocaleString()}</td>
                      <td style={{ padding: '0.65rem 0.9rem', color: '#16a34a', fontWeight: 700 }}>{(c.sent_count || 0).toLocaleString()}</td>
                      <td style={{ padding: '0.65rem 0.9rem', color: c.fail_count > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: c.fail_count > 0 ? 700 : 400 }}>{c.fail_count || 0}</td>
                      <td style={{ padding: '0.65rem 0.9rem' }}><STATUS_BADGE status={c.status} /></td>
                      <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}</td>
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
