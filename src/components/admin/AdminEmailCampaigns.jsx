'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Send, Users, Clock, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Sparkles, FileText,
  AtSign, BarChart3, HelpCircle, ShieldCheck,
  Loader2, Undo2, Paperclip, Trash2, Smartphone,
  Monitor, Search, Tag, ExternalLink, User,
  FileIcon, Image as ImageIcon, Archive, Check
} from 'lucide-react';

// ─── Format File Size ────────────────────────────────────────────────────────
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// ─── Resolve File Icon ───────────────────────────────────────────────────────
function getFileBadgeIcon(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return <ImageIcon size={14} style={{ color: '#0284c7' }} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <Archive size={14} style={{ color: '#d97706' }} />;
  }
  if (['dst', 'pes', 'emb', 'exp', 'jef', 'vp3', 'xxx'].includes(ext)) {
    return <span style={{ fontSize: '10px', fontWeight: 800, color: '#ea580c', background: '#ffedd5', padding: '1px 4px', borderRadius: '4px' }}>EMB</span>;
  }
  return <FileIcon size={14} style={{ color: '#64748b' }} />;
}

// ─── Stat Card Component ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = '#ea580c' }) => (
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

// ─── Status Badge Component ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    sent:    { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle, label: 'Sent' },
    partial: { bg: '#fef3c7', color: '#d97706', icon: AlertTriangle, label: 'Partial' },
    failed:  { bg: '#fee2e2', color: '#dc2626', icon: XCircle, label: 'Failed' },
    draft:   { bg: '#f1f5f9', color: '#64748b', icon: FileText, label: 'Draft' }
  };
  const s = map[status] || map.draft;
  const Icon = s.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: s.bg, color: s.color, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
      <Icon size={11} /> {s.label}
    </span>
  );
};

export function AdminEmailCampaigns() {
  // ── Mode & Tab State ───────────────────────────────────────────────────────
  // mode: 'support' (Gmail style 1-on-1 direct support) | 'campaign' (Promotional broadcast)
  const [emailMode, setEmailMode] = useState('support');
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'history'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  // ── Database & Server State ────────────────────────────────────────────────
  const [campaigns, setCampaigns]       = useState([]);
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [serverConfig, setServerConfig] = useState(null);
  const [showConfigHelp, setShowHelp]   = useState(false);
  const [toast, setToast]               = useState(null);

  // ── Form State ─────────────────────────────────────────────────────────────
  // Common
  const [subject, setSubject]           = useState('');
  const [message, setMessage]           = useState('');
  const [attachments, setAttachments]   = useState([]); // [{ name, url, size, type }]
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Direct Support Mode Fields
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);

  // Campaign Mode Fields
  const [campaignName, setCampaignName] = useState('');
  const [headline, setHeadline]         = useState('');
  const [offerCode, setOfferCode]       = useState('');
  const [buttonText, setButtonText]     = useState('Place Your Order Now');
  const [buttonUrl, setButtonUrl]       = useState('https://bdigitizing.com');
  const [recipientMode, setRM]          = useState('all_clients'); // 'test' | 'single' | 'all_clients'
  const [testEmail, setTestEmail]       = useState('');
  const [previewCount, setPreviewCount] = useState(null);
  const [checkingAudience, setCA]       = useState(false);

  // History Filter
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'support' | 'campaign'

  // AI Polish States
  const [isPolishingSubject, setIsPolishingSubject] = useState(false);
  const [isPolishingMessage, setIsPolishingMessage] = useState(false);
  const [prevSubject, setPrevSubject]               = useState(null);
  const [prevMessage, setPrevMessage]               = useState(null);

  // ── Toast Helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Close client dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Load Campaigns & Live Clients ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (Array.isArray(data.clients)) setClients(data.clients);
        if (data.config) setServerConfig(data.config);
      }
    } catch (err) {
      console.error('[email-campaigns load error]', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── File Attachment Upload Handler ─────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds the 25MB attachment limit.`, 'error');
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'chat-attachments');
        formData.append('folder', 'email-attachments');

        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data?.success && (data.url || data.file_url)) {
          const fileUrl = data.url || data.file_url;
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              url: fileUrl,
              size: file.size,
              type: file.type || 'application/octet-stream'
            }
          ]);
          showToast(`Attached: ${file.name}`, 'success');
        } else {
          showToast(data?.error || `Failed to upload "${file.name}"`, 'error');
        }
      } catch (uploadErr) {
        showToast(`Error uploading "${file.name}": ${uploadErr.message}`, 'error');
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadingFile(false);
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // ── AI Polish Handlers (Google Gemini) ─────────────────────────────────────
  const handleAiPolishSubject = async () => {
    if (!subject.trim() || isPolishingSubject) return;
    setIsPolishingSubject(true);
    setPrevSubject(subject);
    try {
      const tone = emailMode === 'support' ? 'professional' : 'promotional';
      const res = await fetch('/api/chat/ai-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: subject, target: 'email_subject', tone })
      });
      const data = await res.json();
      if (data?.polishedText) {
        setSubject(data.polishedText);
        showToast('✨ Subject line polished with Google Gemini!', 'success');
      } else if (data?.error) {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Failed to polish subject line.', 'error');
    } finally {
      setIsPolishingSubject(false);
    }
  };

  const handleAiPolishMessage = async () => {
    if (!message.trim() || isPolishingMessage) return;
    setIsPolishingMessage(true);
    setPrevMessage(message);
    try {
      const tone = emailMode === 'support' ? 'professional' : 'promotional';
      const res = await fetch('/api/chat/ai-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, target: 'email_body', tone })
      });
      const data = await res.json();
      if (data?.polishedText) {
        setMessage(data.polishedText);
        showToast('✨ Message content polished with Google Gemini!', 'success');
      } else if (data?.error) {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Failed to polish email content.', 'error');
    } finally {
      setIsPolishingMessage(false);
    }
  };

  // ── Quick Presets (Support & Promotional) ──────────────────────────────────
  const applySupportPreset = (type) => {
    if (type === 'delivery') {
      setSubject('📦 Your Digitized Embroidery Files Are Ready! [BDigitizing]');
      setMessage(
        "Hi there,\n\nGreat news! Your custom embroidery digitizing order has been completed by our master digitizers.\n\nAll production-ready stitch files and preview proofs are attached to this email for your convenience. Please inspect the stitch path and test run on your machine.\n\nIf you need any stitch tweaks, density adjustments, or format changes, simply reply to this email. We are here to assist you 24/7!\n\nBest regards,\nBDigitizing Production Support Desk"
      );
    } else if (type === 'artwork_clarification') {
      setSubject('🔍 Artwork Clarification & Dimensions Needed [BDigitizing Support]');
      setMessage(
        "Hello,\n\nThank you for choosing BDigitizing Studio for your custom order!\n\nTo ensure optimal stitch density and flawless embroidery production, our master digitizer needs a quick clarification regarding your artwork.\n\nCould you please confirm the exact target dimensions (width & height), placement (e.g. Cap Front, Left Chest, Jacket Back), and fabric type (e.g. Cotton Pique, Twill, Fleece)?\n\nYou can reply directly to this email or attach higher-resolution reference images.\n\nWarm regards,\nBDigitizing Production Team"
      );
    } else if (type === 'revision_done') {
      setSubject('✂️ Design Revision Completed & Attached [BDigitizing Support]');
      setMessage(
        "Hello,\n\nWe have updated your embroidery design as requested. The revised digitized stitch files and color sequence proof are attached to this email.\n\nPlease review the changes and let us know if everything meets your exact specifications.\n\nThank you for your business!\nBDigitizing Quality Assurance Team"
      );
    } else if (type === 'payment_receipt') {
      setSubject('💳 Payment Confirmation & Order Receipt [BDigitizing]');
      setMessage(
        "Dear Valued Customer,\n\nThank you! We have received and confirmed your payment for your recent order.\n\nYour order is now being processed by our production team with priority turnaround. You will receive your completed files shortly.\n\nIf you have any questions, feel free to reply to this email anytime.\n\nSincerely,\nBDigitizing Accounts & Support"
      );
    }
    showToast('Support preset applied! Feel free to edit or attach files.', 'info');
  };

  const applyPromoPreset = (type) => {
    if (type === 'discount') {
      setCampaignName('Flash Sale 20% Off');
      setSubject('🎉 Exclusive 20% Off Your Next Embroidery Order!');
      setHeadline('Save 20% On All Custom Digitizing & Vector Work');
      setMessage(
        "Hi there!\n\nFor a limited time, enjoy an exclusive 20% discount on all custom embroidery digitizing and vector conversion services.\n\nWhether you need cap logos, jacket back pieces, or left-chest emblems, our master digitizers deliver high-density, production-ready files in under 12 hours."
      );
      setOfferCode('SAVE20');
      setButtonText('Place Order With 20% Off');
      setButtonUrl('https://bdigitizing.com');
    } else if (type === 'speed') {
      setCampaignName('Rush Turnaround Service');
      setSubject('⚡ Faster Turnaround Times Now Active at BDigitizing');
      setHeadline('Supercharge Your Production With 8-12 Hour Turnaround');
      setMessage(
        "Hello,\n\nWe have expanded our team of master digitizers to provide lightning-fast turnaround times without compromising on stitch quality.\n\nSubmit your complex logos, 3D puff designs, and vector art today for same-day delivery."
      );
      setOfferCode('EXPRESS');
      setButtonText('Upload New Artwork');
      setButtonUrl('https://bdigitizing.com');
    } else if (type === 'patches') {
      setCampaignName('Custom Patches Special');
      setSubject('🧢 Premium Custom Patches - Free Sample Preview!');
      setHeadline('Top-Tier Embroidered, PVC & Woven Patches');
      setMessage(
        "Looking for high-quality custom embroidered patches with clean merrowed borders and iron-on backing?\n\nOrder today with low minimums (as low as 10 pcs) and get 100% free digital proofing before production."
      );
      setOfferCode('PATCH10');
      setButtonText('Explore Custom Patches');
      setButtonUrl('https://bdigitizing.com');
    }
    showToast('Promo preset applied! You can customize any field.', 'info');
  };

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

  // ── Dispatch Email Handler ─────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim()) {
      showToast('Please enter an email subject line.', 'error');
      return;
    }
    if (!message.trim()) {
      showToast('Please write your email message content.', 'error');
      return;
    }

    let payload = {
      emailType: emailMode,
      subject: subject.trim(),
      message: message.trim(),
      attachments
    };

    if (emailMode === 'support') {
      const target = (recipientEmail || '').trim().toLowerCase();
      if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
        showToast('Please enter a valid recipient customer email.', 'error');
        return;
      }
      payload = {
        ...payload,
        campaignName: `Support: ${selectedClient?.name || target} - ${subject.slice(0, 40)}`,
        recipientMode: 'single',
        singleEmail: target
      };

      if (!window.confirm(`Send support email with ${attachments.length} attachment(s) to:\n${target}?`)) {
        return;
      }
    } else {
      // Promotional campaign mode
      if (recipientMode === 'test' && !testEmail.trim()) {
        showToast('Please enter your test email address.', 'error');
        return;
      }

      payload = {
        ...payload,
        campaignName: campaignName.trim() || `Promo: ${subject.slice(0, 50)}`,
        headline: headline.trim(),
        offerCode: offerCode.trim(),
        buttonText: buttonText.trim(),
        buttonUrl: buttonUrl.trim(),
        recipientMode,
        testEmail: testEmail.trim()
      };

      const confirmMsg = recipientMode === 'all_clients'
        ? `⚠️ Are you sure you want to broadcast this promotional campaign to ALL active registered clients?`
        : `Send promotional test email to: ${testEmail}?`;

      if (!window.confirm(confirmMsg)) return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        showToast(`🎉 ${data.message || 'Email sent successfully!'}`, 'success');
        loadData();
        // Clear attachments on success
        setAttachments([]);
        setActiveTab('history');
      } else {
        showToast(`❌ ${data.error || 'Failed to dispatch email'}`, 'error');
        loadData();
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }
    setSending(false);
  };

  // ── Filter Clients for Autocomplete ────────────────────────────────────────
  const filteredClients = clients.filter(c => {
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase();
    return (c.name && c.name.toLowerCase().includes(q)) || (c.email && c.email.toLowerCase().includes(q));
  }).slice(0, 15);

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.fail_count || 0), 0);
  const supportCount = campaigns.filter(c => c.email_type === 'support').length;
  const promoCount = campaigns.filter(c => c.email_type !== 'support').length;

  // ── Filtered History Records ───────────────────────────────────────────────
  const displayedCampaigns = campaigns.filter(c => {
    if (historyFilter === 'support') return c.email_type === 'support';
    if (historyFilter === 'campaign') return c.email_type !== 'support';
    return true;
  });

  // ── Preview Paragraphs ─────────────────────────────────────────────────────
  const previewParagraphs = message.trim()
    ? message.trim().split(/\n\s*\n/)
    : [emailMode === 'support'
        ? 'Your direct support message will appear here. Write normal text in the composer, and it will be delivered with executive BDigitizing Support Desk branding!'
        : 'Your promotional message will appear here. Write normal text, and it will be formatted into an executive studio marketing blast!'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── Toast Notification ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'info' ? '#eff6ff' : '#dcfce7',
          color: toast.type === 'error' ? '#991b1b' : toast.type === 'info' ? '#1e40af' : '#14532d',
          border: `1.5px solid ${toast.type === 'error' ? '#fca5a5' : toast.type === 'info' ? '#93c5fd' : '#86efac'}`,
          padding: '0.85rem 1.35rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem',
          boxShadow: '0 10px 28px rgba(0,0,0,0.14)', maxWidth: '440px', lineHeight: 1.5,
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} style={{ flexShrink: 0 }} /> : <CheckCircle size={18} style={{ flexShrink: 0 }} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Top Header Bar & Mode Selector ─────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                color: '#fff',
                padding: '0.55rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
              }}>
                <Mail size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  VIP Email &amp; Support Mailbox
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.15rem 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Official dispatch from:</span>
                  <strong style={{ color: '#ea580c' }}>support@bdigitizing.com</strong>
                  <span style={{ color: 'var(--border-color)' }}>•</span>
                  <span>Direct Customer Support &amp; Broadcast Marketing</span>
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowHelp(!showConfigHelp)}
              style={{
                padding: '0.55rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-color)',
                background: showConfigHelp ? 'rgba(234,88,12,0.1)' : 'var(--bg-surface)',
                color: showConfigHelp ? '#ea580c' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s ease'
              }}
            >
              <HelpCircle size={15} /> Setup / SMTP Guide
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              style={{
                padding: '0.6rem 1.15rem', borderRadius: '10px', border: '1.5px solid', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                background: activeTab === 'compose' ? 'var(--orange-500)' : 'var(--bg-surface)',
                color: activeTab === 'compose' ? '#fff' : 'var(--text-main)',
                borderColor: activeTab === 'compose' ? 'var(--orange-500)' : 'var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'all 0.15s ease',
                boxShadow: activeTab === 'compose' ? '0 4px 12px rgba(234, 88, 12, 0.25)' : 'none'
              }}
            >
              <Send size={15} /> Compose Email
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('history'); loadData(); }}
              style={{
                padding: '0.6rem 1.15rem', borderRadius: '10px', border: '1.5px solid', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                background: activeTab === 'history' ? 'var(--orange-500)' : 'var(--bg-surface)',
                color: activeTab === 'history' ? '#fff' : 'var(--text-main)',
                borderColor: activeTab === 'history' ? 'var(--orange-500)' : 'var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'all 0.15s ease',
                boxShadow: activeTab === 'history' ? '0 4px 12px rgba(234, 88, 12, 0.25)' : 'none'
              }}
            >
              <Clock size={15} /> Sent History ({campaigns.length})
            </button>
          </div>
        </div>

        {/* ── Email Mode Pill Selector (When in Compose Tab) ── */}
        {activeTab === 'compose' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setEmailMode('support')}
                style={{
                  padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                  background: emailMode === 'support' ? '#0284c7' : 'transparent',
                  color: emailMode === 'support' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s ease'
                }}
              >
                <Mail size={14} /> ✉️ Direct Support Email (Gmail Style)
              </button>

              <button
                type="button"
                onClick={() => setEmailMode('campaign')}
                style={{
                  padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                  background: emailMode === 'campaign' ? '#ea580c' : 'transparent',
                  color: emailMode === 'campaign' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s ease'
                }}
              >
                <Tag size={14} /> 📢 Marketing &amp; Promotional Campaign
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Mode:</span>
              {emailMode === 'support' ? (
                <span style={{ color: '#0284c7', fontWeight: 800, background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                  1-on-1 Customer Support &amp; Order Files
                </span>
              ) : (
                <span style={{ color: '#c2410c', fontWeight: 800, background: '#ffedd5', padding: '2px 8px', borderRadius: '6px' }}>
                  Audience Broadcast &amp; Special Discounts
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Setup / DNS Guidance Accordion ─────────────────────────────────── */}
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
              <ShieldCheck size={18} /> Official Email Dispatch: support@bdigitizing.com
            </div>
            <button type="button" onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            Aapki live domain <strong>bdigitizing.com</strong> se emails send hone ke liye Namecheap SMTP ya Resend API configure hai:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                Option 1: Resend Domain Verification (Active)
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong><a href="https://resend.com/domains" target="_blank" rel="noreferrer" style={{ color: '#ea580c' }}>resend.com/domains</a></strong> par <code>bdigitizing.com</code> verified hai to all emails instant customer inboxes mein deliver hoti hain bina spam box jaye.
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                Option 2: Namecheap Private Email SMTP
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Direct Namecheap Private Email SMTP (Host: <code>mail.privateemail.com</code>, Port: <code>465</code>, User: <code>support@bdigitizing.com</code>) ke through attachments aur emails natively deliver hoti hain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Stat Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
        <StatCard icon={Send} label="Total Dispatches" value={campaigns.length} color="#ea580c" />
        <StatCard icon={Users} label="Delivered Emails" value={totalSent.toLocaleString()} color="#16a34a" />
        <StatCard icon={Mail} label="Support Emails" value={supportCount} color="#0284c7" />
        <StatCard icon={Tag} label="Promo Blasts" value={promoCount} color="#f59e0b" />
        <StatCard
          icon={AtSign}
          label="Active Sender"
          value={serverConfig?.hasSmtp ? 'SMTP Active' : 'support@'}
          color="#8b5cf6"
        />
      </div>

      {/* ── Compose Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'compose' && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left Column: Composer Form */}
          <div style={{ flex: '1 1 540px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Quick Presets Bar */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px',
              padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '0.6rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={15} style={{ color: emailMode === 'support' ? '#0284c7' : '#ea580c' }} />
                <span>Quick {emailMode === 'support' ? 'Support' : 'Promo'} Presets:</span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {emailMode === 'support' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => applySupportPreset('delivery')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #bae6fd',
                        background: '#f0f9ff', color: '#0369a1', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      📦 Files Ready &amp; Delivered
                    </button>
                    <button
                      type="button"
                      onClick={() => applySupportPreset('artwork_clarification')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      🔍 Need Dimensions / Clarification
                    </button>
                    <button
                      type="button"
                      onClick={() => applySupportPreset('revision_done')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      ✂️ Revision Done
                    </button>
                    <button
                      type="button"
                      onClick={() => applySupportPreset('payment_receipt')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      💳 Payment Receipt
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPromoPreset('discount')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #fed7aa',
                        background: '#fff7ed', color: '#c2410c', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      🎉 20% Off Flash Sale
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPromoPreset('speed')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      ⚡ Fast 8-12h Rush Turnaround
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPromoPreset('patches')}
                      style={{
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      🧢 Custom Patches Special
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Recipient / Audience Section */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.35rem', boxShadow: 'var(--shadow-sm)' }}>

              {emailMode === 'support' ? (
                /* ── Gmail Style "To" Recipient Field ── */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={15} style={{ color: '#0284c7' }} /> TO (Client Email Address) *
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Search registered clients or type any email
                    </span>
                  </div>

                  <div style={{ position: 'relative' }} ref={clientDropdownRef}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.4rem 0.75rem',
                      gap: '0.5rem'
                    }}>
                      <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => {
                          setRecipientEmail(e.target.value);
                          setClientSearchQuery(e.target.value);
                          setSelectedClient(null);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Type customer email (e.g. client@example.com) or search name..."
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none'
                        }}
                      />
                      {recipientEmail && (
                        <button
                          type="button"
                          onClick={() => { setRecipientEmail(''); setSelectedClient(null); setClientSearchQuery(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px', fontSize: '0.8rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Selected Client Badge Pill */}
                    {selectedClient && (
                      <div style={{
                        marginTop: '0.4rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <User size={12} />
                        <span>Client: {selectedClient.name || 'Client'} ({selectedClient.email})</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedClient(null); setRecipientEmail(''); }}
                          style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', marginLeft: '2px', fontWeight: 800 }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Autocomplete Dropdown List */}
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 90,
                        boxShadow: 'var(--shadow-md)',
                        padding: '0.35rem 0'
                      }}>
                        <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                          Registered Clients ({clients.length} in database)
                        </div>
                        {filteredClients.map(c => (
                          <div
                            key={c.id || c.email}
                            onClick={() => {
                              setRecipientEmail(c.email);
                              setSelectedClient(c);
                              setShowClientDropdown(false);
                            }}
                            style={{
                              padding: '0.5rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              fontSize: '0.82rem',
                              transition: 'background 0.1s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                background: '#e0f2fe', color: '#0284c7', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem'
                              }}>
                                {(c.name || c.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                  {c.name || 'Registered Client'}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                  {c.email}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick fill:</span>
                    <button
                      type="button"
                      onClick={() => { setRecipientEmail('shahidbutt59191@gmail.com'); setSelectedClient({ name: 'Admin Shahid', email: 'shahidbutt59191@gmail.com' }); }}
                      style={{ fontSize: '0.72rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Admin (shahidbutt59191@gmail.com)
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>•</span>
                    <button
                      type="button"
                      onClick={() => { setRecipientEmail('bilalsadiq612@gmail.com'); setSelectedClient({ name: 'Bilal Sadiq', email: 'bilalsadiq612@gmail.com' }); }}
                      style={{ fontSize: '0.72rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Bilal Sadiq (bilalsadiq612@gmail.com)
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Promotional Audience Target ── */
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={16} style={{ color: '#ea580c' }} /> Select Target Audience
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    {[
                      { id: 'all_clients', label: '📢 All Registered Clients', desc: 'Broadcast to all customer accounts' },
                      { id: 'test', label: '🧪 Test Send First', desc: 'Verify rendering on your own email' },
                      { id: 'single', label: '👤 Single Client', desc: 'Target 1 customer exclusively' }
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

                  {recipientMode === 'test' && (
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                        YOUR TEST EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        placeholder="Enter your email to test rendering"
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
                      padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#9a3412', fontWeight: 600 }}>
                        📢 Broadcast will be sent to all active clients in database.
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
              )}

            </div>

            {/* Email Content Section */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.35rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} style={{ color: emailMode === 'support' ? '#0284c7' : '#ea580c' }} />
                <span>Compose Message</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Promotional Internal Campaign Name */}
                {emailMode === 'campaign' && (
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      CAMPAIGN NAME (Internal Admin Record)
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      placeholder="e.g. October 20% Discount Promo Blast"
                      style={{
                        width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Subject Line with AI Polish */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      SUBJECT LINE * (Shown in client inbox)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {prevSubject !== null && (
                        <button
                          type="button"
                          onClick={() => { setSubject(prevSubject); setPrevSubject(null); }}
                          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Undo2 size={12} /> Undo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAiPolishSubject}
                        disabled={isPolishingSubject || !subject.trim()}
                        style={{
                          background: isPolishingSubject ? '#fed7aa' : '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #ffedd5',
                          borderRadius: '6px',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: isPolishingSubject || !subject.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        title="Polish subject line with Google Gemini AI"
                      >
                        {isPolishingSubject ? <Loader2 size={12} className="spin-icon" /> : <Sparkles size={12} />}
                        {isPolishingSubject ? 'Polishing...' : '✨ AI Polish'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder={emailMode === 'support' ? "e.g. 📦 Your Digitized Embroidery Files Are Ready! [Order #1042]" : "e.g. 🎉 Special Offer: 20% Off Your Embroidery Digitizing!"}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Promotional Top Headline */}
                {emailMode === 'campaign' && (
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      PROMO BANNER HEADLINE
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={e => setHeadline(e.target.value)}
                      placeholder="e.g. Exclusive Savings for Custom Embroidery & Vector Art! 👋"
                      style={{
                        width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Message Body with AI Polish */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      EMAIL MESSAGE BODY *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {prevMessage !== null && (
                        <button
                          type="button"
                          onClick={() => { setMessage(prevMessage); setPrevMessage(null); }}
                          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Undo2 size={12} /> Undo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAiPolishMessage}
                        disabled={isPolishingMessage || !message.trim()}
                        style={{
                          background: isPolishingMessage ? '#fed7aa' : '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #ffedd5',
                          borderRadius: '6px',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: isPolishingMessage || !message.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        title="Polish message content with Google Gemini AI"
                      >
                        {isPolishingMessage ? <Loader2 size={12} className="spin-icon" /> : <Sparkles size={12} />}
                        {isPolishingMessage ? 'Polishing...' : '✨ AI Polish Message'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={emailMode === 'support' ? 9 : 7}
                    placeholder={
                      emailMode === 'support'
                        ? "Hi there,\n\nType your support message here. Mention order details, updates, or instructions.\n\nUse empty lines between paragraphs — it will be beautifully styled automatically in the customer's inbox!"
                        : "Type your announcement or marketing message here as you would in an email..."
                    }
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.6,
                      boxSizing: 'border-box', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                {/* Promotional Highlights / Code / CTA */}
                {emailMode === 'campaign' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                        PROMO CODE / SPECIAL OFFER BADGE (Optional)
                      </label>
                      <input
                        type="text"
                        value={offerCode}
                        onChange={e => setOfferCode(e.target.value)}
                        placeholder="e.g. SAVE20 or 25% OFF"
                        style={{
                          width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                          background: 'var(--bg-surface)', color: '#ea580c', fontWeight: 800, fontSize: '0.85rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
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
                        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
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
                  </>
                )}

                {/* ── File Attachments Section (Gmail Style Paperclip 📎) ── */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Paperclip size={16} style={{ color: emailMode === 'support' ? '#0284c7' : '#ea580c' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Attached Files ({attachments.length})
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        (Images, .DST, .PES, .EMB, .PDF, .ZIP)
                      </span>
                    </div>

                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".dst,.pes,.emb,.exp,.jef,.pxf,.pdf,.png,.jpg,.jpeg,.webp,.gif,.ai,.eps,.zip,.rar,.7z"
                      />
                      <button
                        type="button"
                        disabled={uploadingFile}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: uploadingFile ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {uploadingFile ? <Loader2 size={13} className="spin-icon" /> : <Paperclip size={13} />}
                        {uploadingFile ? 'Uploading File...' : 'Attach File(s)'}
                      </button>
                    </div>
                  </div>

                  {/* List of Attached Files */}
                  {attachments.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            {getFileBadgeIcon(att.name)}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.name}>
                                {att.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {formatBytes(att.size)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Download / View"
                              style={{ color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                            >
                              <ExternalLink size={13} />
                            </a>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              title="Remove attachment"
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Send Dispatch Button */}
            <div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                style={{
                  width: '100%', padding: '0.95rem 1.5rem', borderRadius: '12px', border: 'none',
                  background: sending
                    ? '#94a3b8'
                    : emailMode === 'support'
                      ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                      : 'linear-gradient(135deg, #ea580c, #c2410c)',
                  color: '#ffffff',
                  fontWeight: 900, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                  boxShadow: emailMode === 'support'
                    ? '0 6px 18px rgba(2, 132, 199, 0.35)'
                    : '0 6px 18px rgba(234, 88, 12, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {sending ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" /> Sending Email...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {emailMode === 'support'
                      ? `Send Support Email to ${recipientEmail || 'Client'}`
                      : recipientMode === 'test'
                        ? 'Send Test Promo Email'
                        : recipientMode === 'single'
                          ? 'Send Promo to Customer'
                          : 'Broadcast Campaign to All Clients'}
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Live VIP Email Preview Card */}
          <div style={{ flex: '1 1 420px', position: 'sticky', top: '1rem' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)'
            }}>

              {/* Fake Email Client Chrome */}
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

                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    style={{
                      padding: '3px 8px', borderRadius: '5px', border: 'none',
                      background: previewDevice === 'desktop' ? 'var(--bg-card)' : 'transparent',
                      color: previewDevice === 'desktop' ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                    }}
                  >
                    <Monitor size={12} /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    style={{
                      padding: '3px 8px', borderRadius: '5px', border: 'none',
                      background: previewDevice === 'mobile' ? 'var(--bg-card)' : 'transparent',
                      color: previewDevice === 'mobile' ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                    }}
                  >
                    <Smartphone size={12} /> Mobile
                  </button>
                </div>
              </div>

              {/* Envelope Meta Header */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78rem', background: 'var(--bg-card)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <strong>From:</strong> {emailMode === 'support' ? 'BDigitizing Support Desk' : 'BDigitizing Studio'} &lt;support@bdigitizing.com&gt;
                </div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <strong>To:</strong> {emailMode === 'support' ? (recipientEmail || '(Select recipient client)') : recipientMode === 'test' ? (testEmail || '(Your test email)') : 'All Registered Clients'}
                </div>
                <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  <strong>Subject:</strong> {subject.trim() || '(No subject line yet)'}
                </div>
              </div>

              {/* Rendered Email Body Canvas */}
              <div style={{
                background: '#f1f5f9',
                padding: previewDevice === 'mobile' ? '1rem 0.5rem' : '1.25rem',
                maxHeight: '620px',
                overflowY: 'auto'
              }}>
                <div style={{
                  maxWidth: previewDevice === 'mobile' ? '360px' : '520px',
                  margin: '0 auto', background: '#ffffff',
                  border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                }}>

                  {/* Header Banner */}
                  {emailMode === 'support' ? (
                    <div style={{ background: '#0f172a', padding: '18px 24px', borderBottom: '3px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ color: '#ffffff', fontSize: '17px', fontWeight: 800 }}>
                          BDigitizing <span style={{ color: '#38bdf8' }}>SUPPORT</span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '2px' }}>
                          Official Customer Care Desk
                        </div>
                      </div>
                      <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                        DIRECT MESSAGE
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#090d16', padding: '20px 24px', textAlign: 'center', borderBottom: '3px solid #ea580c' }}>
                      <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        BDigitizing <span style={{ color: '#ea580c' }}>STUDIO</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                        Commercial Embroidery Digitizing &amp; Vector Art
                      </div>
                    </div>
                  )}

                  {/* Content Area */}
                  <div style={{ padding: '22px 24px', color: '#1e293b' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', lineHeight: 1.35 }}>
                      {emailMode === 'support'
                        ? (subject.trim() || 'BDigitizing Support Update')
                        : (headline.trim() || subject.trim() || 'Special Studio Announcement')}
                    </div>

                    {previewParagraphs.map((para, i) => (
                      <p key={i} style={{ margin: '0 0 13px 0', color: '#334155', fontSize: '13px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                        {para}
                      </p>
                    ))}

                    {/* Promo Offer Box (In Campaign Mode) */}
                    {emailMode === 'campaign' && offerCode.trim() && (
                      <div style={{
                        background: '#fff7ed', border: '2px dashed #ea580c', borderRadius: '8px',
                        padding: '14px 18px', textAlign: 'center', margin: '18px 0'
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

                    {/* Attached Files Box (If files attached) */}
                    {attachments.length > 0 && (
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        margin: '18px 0'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Paperclip size={12} style={{ color: '#0284c7' }} />
                          <span>ATTACHED FILES ({attachments.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {attachments.map((att, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '11.5px'
                            }}>
                              <span style={{ fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                {att.name}
                              </span>
                              <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '11px' }}>
                                Download ({formatBytes(att.size)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Promo Button (In Campaign Mode) */}
                    {emailMode === 'campaign' && buttonText.trim() && (
                      <div style={{ textAlign: 'center', margin: '20px 0 10px 0' }}>
                        <div style={{
                          display: 'inline-block', background: '#ea580c', color: '#ffffff',
                          padding: '10px 24px', borderRadius: '8px', fontWeight: 800, fontSize: '13px'
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
                    <div style={{ fontWeight: 700, color: '#334155' }}>
                      {emailMode === 'support' ? 'BDigitizing Customer Care Desk' : 'BDigitizing Studio'}
                    </div>
                    <div>support@bdigitizing.com • bdigitizing.com</div>
                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                      24/7 Production Support • High-Precision Embroidery Art
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── History Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{
            padding: '1rem 1.35rem', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart3 size={18} style={{ color: '#ea580c' }} /> Dispatch Logs &amp; Delivery Records
              </span>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {[
                  { id: 'all', label: 'All Records' },
                  { id: 'support', label: '✉️ Support' },
                  { id: 'campaign', label: '📢 Promo' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHistoryFilter(f.id)}
                    style={{
                      padding: '3px 8px', borderRadius: '6px', border: 'none',
                      background: historyFilter === f.id ? 'var(--bg-card)' : 'transparent',
                      color: historyFilter === f.id ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={loadData}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} /> Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <RefreshCw size={22} className="spin-icon" style={{ color: '#ea580c', marginBottom: '0.5rem' }} />
              <div>Loading dispatch logs...</div>
            </div>
          ) : displayedCampaigns.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Mail size={40} style={{ color: 'var(--border-color)', marginBottom: '0.85rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>No Dispatches Found</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>Compose a support email or promotional campaign to see it recorded here.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Type', 'Subject / Title', 'Recipient / Target', 'Attachments', 'Sent', 'Status', 'Error / Reason', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedCampaigns.map((c, i) => {
                    const isSupport = c.email_type === 'support';
                    const attCount = Array.isArray(c.attachments) ? c.attachments.length : 0;
                    return (
                      <tr
                        key={c.id || i}
                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Type Badge */}
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                          {isSupport ? (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Mail size={11} /> Support
                            </span>
                          ) : (
                            <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 7px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Tag size={11} /> Promo
                            </span>
                          )}
                        </td>

                        {/* Title / Subject */}
                        <td style={{ padding: '0.75rem 1rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{c.name || 'Untitled'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{c.subject}</div>
                        </td>

                        {/* Recipient */}
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {c.target_email ? (
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>{c.target_email}</span>
                          ) : c.recipient_mode === 'all_clients' ? (
                            <span style={{ fontWeight: 700 }}>All Clients ({c.recipient_count || 0})</span>
                          ) : (
                            <span>{c.recipient_count || 0} recipient(s)</span>
                          )}
                        </td>

                        {/* Attachments */}
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                          {attCount > 0 ? (
                            <span style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Paperclip size={11} /> {attCount} file{attCount !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>
                          )}
                        </td>

                        {/* Sent Count */}
                        <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {(c.sent_count || 0).toLocaleString()}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                          <StatusBadge status={c.status} />
                        </td>

                        {/* Error / Reason */}
                        <td style={{ padding: '0.75rem 1rem', maxWidth: '220px', fontSize: '0.75rem', color: c.status === 'failed' ? '#dc2626' : 'var(--text-muted)' }}>
                          {c.error_message ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title={c.error_message}>
                              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.error_message}
                              </span>
                            </div>
                          ) : c.status === 'sent' ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>Delivered</span>
                          ) : '—'}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
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
