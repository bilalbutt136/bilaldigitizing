'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../context/StateContext';
import { 
  Megaphone, 
  Radio, 
  Search, 
  Globe, 
  BarChart2, 
  CheckCircle2, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Share2, 
  ExternalLink,
  Layers,
  Activity,
  Code
} from 'lucide-react';

export const MetaSeoTrackingSettings = () => {
  const { siteSettings = {}, updateSiteSettings, showToast } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState('tracking'); // 'tracking' | 'seo' | 'logs'
  const [isSaving, setIsSaving] = useState(false);

  // Tracking IDs Local State
  const [metaPixelId, setMetaPixelId] = useState(siteSettings?.metaPixelId || '');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(siteSettings?.googleAnalyticsId || '');
  const [tiktokPixelId, setTiktokPixelId] = useState(siteSettings?.tiktokPixelId || '');
  const [enableAutoTracking, setEnableAutoTracking] = useState(siteSettings?.enableAutoTracking !== false);

  // SEO & Social Graph Metadata Local State
  const [metaTitle, setMetaTitle] = useState(siteSettings?.metaTitle || 'Bilal Digitizing | Premier Commercial Embroidery Digitizing & Vector Art Lab');
  const [metaDescription, setMetaDescription] = useState(siteSettings?.metaDescription || 'Precision machine embroidery digitizing and vector conversion services backed by 25+ years master craftsmanship. 8-12 hour express turnaround.');
  const [metaKeywords, setMetaKeywords] = useState(siteSettings?.metaKeywords || 'embroidery digitizing, vector art conversion, custom patches, 3d puff embroidery, left chest logo digitizing, machine stitch files');
  const [canonicalUrl, setCanonicalUrl] = useState(siteSettings?.canonicalUrl || 'https://bdigitizing-pro.com');
  const [ogImageUrl, setOgImageUrl] = useState(siteSettings?.ogImageUrl || 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/portfolio-gallery/9e3dcdd7-e3b4-4886-9f18-a94361029147.png');

  // Event Logs State
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.metaPixelId !== undefined) setMetaPixelId(siteSettings.metaPixelId || '');
      if (siteSettings.googleAnalyticsId !== undefined) setGoogleAnalyticsId(siteSettings.googleAnalyticsId || '');
      if (siteSettings.tiktokPixelId !== undefined) setTiktokPixelId(siteSettings.tiktokPixelId || '');
      if (siteSettings.enableAutoTracking !== undefined) setEnableAutoTracking(siteSettings.enableAutoTracking !== false);
      if (siteSettings.metaTitle) setMetaTitle(siteSettings.metaTitle);
      if (siteSettings.metaDescription) setMetaDescription(siteSettings.metaDescription);
      if (siteSettings.metaKeywords) setMetaKeywords(siteSettings.metaKeywords);
      if (siteSettings.canonicalUrl) setCanonicalUrl(siteSettings.canonicalUrl);
      if (siteSettings.ogImageUrl) setOgImageUrl(siteSettings.ogImageUrl);
    }
  }, [siteSettings]);

  const formatEventTime = (timeStr) => {
    if (!timeStr) return new Date().toLocaleString('en-US');
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return String(timeStr);
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleSimulatePageVisit = async () => {
    try {
      const { logTrackingEventToSupabase } = await import('../../../services/supabaseService');
      const testEvent = {
        eventName: 'PageView',
        userRole: 'Platform Admin',
        source: 'Visitor browser',
        trafficSource: 'www.google.com',
        value: '—',
        pagePath: '/admin/meta-pixel'
      };
      await logTrackingEventToSupabase(testEvent);
      if (showToast) showToast('Test PageView event simulated and recorded in database!', 'success');
      loadEvents();
    } catch (err) {
      console.error('Simulate event error:', err);
    }
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const { fetchTrackingEventsFromSupabase } = await import('../../../services/supabaseService');
      const data = await fetchTrackingEventsFromSupabase();
      setEvents(data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'logs') {
      loadEvents();
    }
  }, [activeSubTab]);

  const handleSaveAll = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    try {
      const trimmedPixelId = metaPixelId.trim();
      if (typeof window !== 'undefined' && trimmedPixelId) {
        try { localStorage.setItem('meta_pixel_id', trimmedPixelId); } catch {}
        const { injectMetaPixel } = await import('../../common/MetaPixelTracker');
        injectMetaPixel(trimmedPixelId);
      }

      await updateSiteSettings({
        metaPixelId: trimmedPixelId,
        googleAnalyticsId: googleAnalyticsId.trim(),
        tiktokPixelId: tiktokPixelId.trim(),
        enableAutoTracking,
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: metaKeywords.trim(),
        canonicalUrl: canonicalUrl.trim(),
        ogImageUrl: ogImageUrl.trim()
      });
      showToast('Meta Pixel & Tracking settings saved and activated live!', 'success');
    } catch {
      showToast('Failed to persist settings. Please check network connection.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEvent = async () => {
    try {
      const trimmedPixelId = metaPixelId.trim();
      if (typeof window !== 'undefined' && trimmedPixelId) {
        const { injectMetaPixel, trackMetaEvent } = await import('../../common/MetaPixelTracker');
        injectMetaPixel(trimmedPixelId);
        trackMetaEvent('AdminPortalTestPing', {
          time: new Date().toISOString(),
          status: 'verified',
          test_source: 'MetaSeoTrackingSettings'
        }, 'Platform Admin');
      }

      showToast('⚡ Live test tracking event dispatched to Meta Pixel & Database!', 'success');
      setTimeout(loadEvents, 1000);
    } catch {
      showToast('Test event failed to send.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header Card & Sub-navigation */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.5rem', borderRadius: '10px' }}>
                <Megaphone size={22} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Meta Pixel, SEO & Marketing Analytics
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Connect Facebook/Instagram tracking, Google Analytics, and optimize global search engine metadata.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-subtle, var(--bg-subtle))', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('tracking')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeSubTab === 'tracking' ? 'var(--bg-card)' : 'transparent',
                color: activeSubTab === 'tracking' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: activeSubTab === 'tracking' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Radio size={14} /> Pixels & Tracking
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('seo')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeSubTab === 'seo' ? 'var(--bg-card)' : 'transparent',
                color: activeSubTab === 'seo' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: activeSubTab === 'seo' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Search size={14} /> SEO & Social Meta
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('logs')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeSubTab === 'logs' ? 'var(--bg-card)' : 'transparent',
                color: activeSubTab === 'logs' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: activeSubTab === 'logs' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Activity size={14} /> Live Event Log
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Pixels & Tracking Engines */}
      {activeSubTab === 'tracking' && (
        <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: metaPixelId ? '#10b981' : '#f59e0b' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Meta Pixel (Facebook & Instagram)
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: metaPixelId ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-subtle)', color: metaPixelId ? '#10b981' : 'var(--color-text-muted)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
                {metaPixelId ? '● Live & Connected' : '○ Not Configured'}
              </span>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
              Automatically tracks <code>PageView</code>, <code>InitiateCheckout</code>, <code>Lead</code>, and <code>Purchase</code> events to optimize ad conversion and retarget visitors.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                Meta Pixel ID
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 1234567890123456"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Found in Meta Events Manager ➔ Data Sources ➔ Settings ➔ Dataset ID.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              {/* Google Analytics */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  Google Analytics 4 (GA4) / GTM Container ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. G-ABC123XYZ or GTM-XXXXXXX"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Universal measurement ID for Google Analytics traffic reports.
                </span>
              </div>

              {/* TikTok Pixel */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  TikTok Ads Pixel ID (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CXXXXXXXXXXXXXX"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  TikTok Ads Manager event tracking token.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleSendTestEvent} 
              className="btn btn-outline btn-lg" 
              style={{ fontWeight: 700, padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Activity size={18} style={{ color: '#3b82f6' }} /> Test Tracking Ping
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary-orange btn-lg" style={{ fontWeight: 800, padding: '0.85rem 2rem' }}>
              <Save size={18} /> {isSaving ? 'Saving Changes...' : 'Save Tracking Configurations'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Global SEO & OpenGraph Social Graph */}
      {activeSubTab === 'seo' && (
        <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.25rem' }}>
              Search Engine Optimization (SEO) Metadata
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Controls the title, description, and keywords displayed on Google search results and web crawlers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Global Meta Title *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: metaTitle.length > 60 ? '#f59e0b' : 'var(--color-text-muted)' }}>
                    {metaTitle.length}/60 recommended chars
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Global Meta Description *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: metaDescription.length > 160 ? '#f59e0b' : 'var(--color-text-muted)' }}>
                    {metaDescription.length}/160 recommended chars
                  </span>
                </div>
                <textarea
                  className="form-control"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                    Search Keywords (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                    Canonical Domain URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                  OpenGraph Share Banner Image URL (`og:image`)
                </label>
                <input
                  type="url"
                  className="form-control"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Social Share & Search Result Live Previews */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Google Search Snippet Preview */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                Google Search Result Snippet Preview
              </span>
              <div style={{ fontFamily: 'Arial, sans-serif' }}>
                <div style={{ fontSize: '0.8rem', color: '#202124', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                  <Globe size={13} style={{ color: '#5f6368' }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{canonicalUrl || 'https://bdigitizing-pro.com'}</span>
                </div>
                <div style={{ fontSize: '1.1rem', color: '#1a0dab', fontWeight: 600, lineHeight: 1.3, marginBottom: '0.25rem', cursor: 'pointer' }}>
                  {metaTitle}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  {metaDescription}
                </div>
              </div>
            </div>

            {/* Social Share Card Preview */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                Facebook & Twitter / X Share Card Preview
              </span>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--color-subtle)' }}>
                <div style={{ height: '140px', background: '#090d16', overflow: 'hidden' }}>
                  <img src={ogImageUrl} alt="OG Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {canonicalUrl.replace('https://', '').replace('http://', '')}
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0.2rem 0', lineHeight: 1.25 }}>
                    {metaTitle}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {metaDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSaving} className="btn btn-primary-orange btn-lg" style={{ fontWeight: 800, padding: '0.85rem 2rem' }}>
              <Save size={18} /> {isSaving ? 'Saving Changes...' : 'Save SEO Metadata'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Real-time Event Stream Log (Matches media_1787330161134.png) */}
      {activeSubTab === 'logs' && (
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          
          {/* Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Activity size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
                  Activity log
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', margin: '0.2rem 0 0 0' }}>
                  Raw list of tracking events recorded on your site.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSimulatePageVisit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Radio size={14} style={{ color: '#6366f1' }} /> Simulate page visit
              </button>

              <button
                type="button"
                onClick={loadEvents}
                disabled={loadingEvents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: loadingEvents ? 'wait' : 'pointer'
                }}
              >
                <RefreshCw size={14} className={loadingEvents ? 'spin-icon' : ''} /> Refresh Stream
              </button>
            </div>
          </div>

          {/* Two Info Cards (Exact replica of Reference Image 2) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{
              background: 'var(--color-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem' }}>
                WHAT THIS DOES
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary, #334155)', lineHeight: 1.45 }}>
                Use this to debug setup issues — e.g. confirm a test event arrived after clicking &quot;Simulate page visit&quot;.
              </div>
            </div>

            <div style={{
              background: 'var(--color-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem' }}>
                WHEN TO USE IT
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary, #334155)', lineHeight: 1.45 }}>
                Not for ad reporting. Meta Ads Manager has official spend and conversion reports.
              </div>
            </div>
          </div>

          {/* Full Detailed Table (Exact match of Reference Image 2) */}
          {loadingEvents ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              Loading tracking events from Supabase...
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--color-subtle, #f8fafc)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <Activity size={36} style={{ color: '#6366f1', opacity: 0.5, margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                No tracking events registered yet
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Click &quot;Simulate page visit&quot; above or visit public pages to test event transmission.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WHEN</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WHO</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WHAT HAPPENED</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SOURCE</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRAFFIC SOURCE</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>VALUE</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, idx) => {
                    const timeDisplay = formatEventTime(ev.event_time || ev.created_at);
                    const whoDisplay = ev.user_role || (ev.user_email ? `Client (${ev.user_email})` : 'Platform Admin');
                    const whatDisplay = ev.event_name || 'PageView';
                    const sourceDisplay = ev.source || 'Visitor browser';
                    const trafficDisplay = ev.traffic_source || 'www.google.com';
                    const valueDisplay = ev.value !== undefined && ev.value !== null && ev.value !== '' ? ev.value : '—';
                    const pageDisplay = ev.page_path || ev.page_url || '/';

                    return (
                      <tr key={ev.id || idx} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', background: 'transparent' }}>
                        <td style={{ padding: '1rem', fontSize: '0.84rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {timeDisplay}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.84rem', color: '#64748b' }}>
                          {whoDisplay}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                          {whatDisplay}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.84rem', color: '#64748b' }}>
                          {sourceDisplay}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.84rem', color: '#64748b' }}>
                          {trafficDisplay}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.84rem', color: '#64748b' }}>
                          {valueDisplay}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.84rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {pageDisplay}
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
};
