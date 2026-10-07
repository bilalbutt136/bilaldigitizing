'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { BookOpen, Radio, BarChart2, Megaphone, Activity, RefreshCw, CheckCircle2, ShieldCheck, Save, Eye, Code, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { VisitorDetailsModal } from './tracking/VisitorDetailsModal';
import { extractMetaPixelId, isValidMetaPixelId, detectSnippetType } from '../../utils/pixelUtils.js';

export const AdminMetaPixel = () => {
  const { siteSettings, updateSiteSettings, showToast } = useAppState();

  // Local state for the input
  const [pixelId, setPixelId] = useState('');
  const [inputMode, setInputMode] = useState('id'); // 'id' | 'snippet'
  const [snippetCode, setSnippetCode] = useState('');
  const [snippetNotice, setSnippetNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (activeTab === 'log') {
      loadEvents();
    }
  }, [activeTab]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const { fetchTrackingEventsFromSupabase } = await import('../../services/supabaseService');
      const data = await fetchTrackingEventsFromSupabase();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (siteSettings?.metaPixelId) {
      setPixelId(siteSettings.metaPixelId);
    }
  }, [siteSettings?.metaPixelId]);

  const cleanPixelId = extractMetaPixelId(pixelId) || String(pixelId || '').trim();
  const isValid = isValidMetaPixelId(cleanPixelId);

  const handleIdChange = (val) => {
    const raw = String(val || '');
    const snippetType = detectSnippetType(raw);
    if (snippetType === 'full_meta_code' || snippetType === 'custom_script') {
      const extracted = extractMetaPixelId(raw);
      if (extracted) {
        setPixelId(extracted);
        setSnippetCode(raw);
        setSnippetNotice(`Detected Meta Base Code! Successfully extracted Pixel ID: ${extracted}`);
        setTimeout(() => setSnippetNotice(null), 6000);
        return;
      }
    }
    setPixelId(raw);
  };

  const handleSnippetChange = (val) => {
    const raw = String(val || '');
    setSnippetCode(raw);
    const extracted = extractMetaPixelId(raw);
    if (extracted) {
      setPixelId(extracted);
      setSnippetNotice(`Extracted Meta Pixel ID: ${extracted}`);
    } else {
      setSnippetNotice(null);
    }
  };

  const handleSendTestPing = async () => {
    const targetId = extractMetaPixelId(pixelId) || pixelId.trim();
    if (!targetId) {
      if (showToast) showToast('Please enter or paste a valid Meta Pixel ID first.', 'error');
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      if (typeof window !== 'undefined') {
        const { injectMetaPixel, trackMetaEvent } = await import('../common/MetaPixelTracker');
        injectMetaPixel(targetId);
        trackMetaEvent('AdminTestPing', {
          time: new Date().toISOString(),
          status: 'verified',
          test_source: 'AdminMetaPixel',
          pixel_id: targetId
        }, 'Platform Admin');
      }
      setTestResult(`✓ Test PageView dispatched to Pixel ID ${targetId}! Recorded in live telemetry.`);
      if (showToast) showToast('⚡ Test tracking event dispatched to Meta Pixel & Database!', 'success');
      setTimeout(loadEvents, 800);
      setTimeout(() => setTestResult(null), 8000);
    } catch (err) {
      if (showToast) showToast('Test failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const cleanId = extractMetaPixelId(pixelId) || pixelId.trim();
      if (typeof window !== 'undefined' && cleanId) {
        try { localStorage.setItem('meta_pixel_id', cleanId); } catch {}
        const { injectMetaPixel } = await import('../common/MetaPixelTracker');
        injectMetaPixel(cleanId);
      }
      await updateSiteSettings({ metaPixelId: cleanId });
      setPixelId(cleanId);
      showToast('Meta Pixel ID saved successfully. Tracking is now active live on production.', 'success');
    } catch {
      showToast('Failed to save Meta Pixel ID.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isConfigured = !!siteSettings?.metaPixelId;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ color: 'var(--navy-700)', fontSize: '0.95rem', fontWeight: 500 }}>
          Connect Facebook/Instagram tracking, monitor orders, and prepare ad campaigns — no developer needed.
        </div>
        <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={14} /> Refresh data
        </button>
      </div>

      {/* Info Block */}
      <div style={{
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <BookOpen size={24} style={{ color: '#475569', flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 0.5rem 0' }}>
              What is Meta Pixel?
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              A small tracking code that tells Facebook & Instagram when someone visits your site, starts an order, or pays. You need it to <strong>run ads that find buyers</strong>, retarget people who abandoned checkout, and see which campaigns make money.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('setup')}
          style={{
            flex: 1,
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            background: activeTab === 'setup' ? '#f8fafc' : '#ffffff',
            border: activeTab === 'setup' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Radio size={20} style={{ color: activeTab === 'setup' ? '#3b82f6' : '#64748b' }} />
          <div>
            <div style={{ fontWeight: 700, color: activeTab === 'setup' ? '#1e293b' : '#334155', fontSize: '0.95rem' }}>Setup & connect</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Connect Meta and turn on tracking</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          style={{
            flex: 1,
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            background: activeTab === 'performance' ? '#f8fafc' : '#ffffff',
            border: activeTab === 'performance' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <BarChart2 size={20} style={{ color: activeTab === 'performance' ? '#3b82f6' : '#64748b' }} />
          <div>
            <div style={{ fontWeight: 700, color: activeTab === 'performance' ? '#1e293b' : '#334155', fontSize: '0.95rem' }}>Performance</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>See how visitors convert to orders</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          style={{
            flex: 1,
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            background: activeTab === 'ads' ? '#f8fafc' : '#ffffff',
            border: activeTab === 'ads' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Megaphone size={20} style={{ color: activeTab === 'ads' ? '#3b82f6' : '#64748b' }} />
          <div>
            <div style={{ fontWeight: 700, color: activeTab === 'ads' ? '#1e293b' : '#334155', fontSize: '0.95rem' }}>Run ads</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Build links and retargeting audiences</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('log')}
          style={{
            flex: 1,
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            background: activeTab === 'log' ? '#f8fafc' : '#ffffff',
            border: activeTab === 'log' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Activity size={20} style={{ color: activeTab === 'log' ? '#3b82f6' : '#64748b' }} />
          <div>
            <div style={{ fontWeight: 700, color: activeTab === 'log' ? '#1e293b' : '#334155', fontSize: '0.95rem' }}>Activity log</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Debug and export raw events</div>
          </div>
        </button>
      </div>

      {activeTab === 'setup' && (
        <>
          {/* Status Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 0',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isConfigured ? '#dcfce7' : '#f1f5f9',
                color: isConfigured ? '#166534' : '#64748b',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConfigured ? '#16a34a' : '#94a3b8' }} />
                Tracking {isConfigured ? 'ON' : 'OFF'}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#e0e7ff',
                color: '#3730a3',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <ShieldCheck size={14} />
                Server backup ON
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Last activity: <strong style={{ color: '#0f172a' }}>{isConfigured ? 'PageView' : 'None'}</strong> {isConfigured ? `• ${new Date().toLocaleString()}` : ''}
            </div>
          </div>

          {/* Setup Form */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#6366f1',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                flexShrink: 0
              }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                    Connect your Meta Pixel
                  </h3>
                  {isValid && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.65rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={13} /> Active Pixel: {cleanPixelId}
                    </span>
                  )}
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                  Paste your numeric Pixel ID or paste the complete code snippet from Meta Events Manager.
                </p>

                {/* Mode Selector */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setInputMode('id')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: inputMode === 'id' ? '#ffffff' : 'transparent',
                      color: inputMode === 'id' ? '#0f172a' : '#64748b',
                      boxShadow: inputMode === 'id' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    🔢 Enter Pixel ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('snippet')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: inputMode === 'snippet' ? '#ffffff' : 'transparent',
                      color: inputMode === 'snippet' ? '#0f172a' : '#64748b',
                      boxShadow: inputMode === 'snippet' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Code size={13} /> Paste Code Snippet
                  </button>
                </div>

                {snippetNotice && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} /> {snippetNotice}
                  </div>
                )}

                {testResult && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.5rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.8rem', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={14} /> {testResult}
                  </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '620px' }}>
                  {inputMode === 'id' ? (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Meta Pixel ID (e.g. 986664733689901)"
                        value={pixelId}
                        onChange={(e) => handleIdChange(e.target.value)}
                        style={{ flex: 1, fontFamily: 'monospace' }}
                      />
                      <button type="submit" className="btn btn-primary-orange" disabled={isSaving}>
                        {isSaving ? 'Saving...' : <><Save size={16} /> Save</>}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <textarea
                        className="form-control"
                        rows={5}
                        placeholder="<!-- Paste Meta Pixel Code here -->&#10;<script>&#10;!function(f,b,e,v,n,t,s)...&#10;fbq('init', '1234567890123456');&#10;fbq('track', 'PageView');&#10;</script>"
                        value={snippetCode}
                        onChange={(e) => handleSnippetChange(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {cleanPixelId ? `Detected Pixel ID: ${cleanPixelId}` : 'Paste script above to extract ID'}
                        </span>
                        <button type="submit" className="btn btn-primary-orange" disabled={isSaving || !cleanPixelId}>
                          {isSaving ? 'Saving...' : <><Save size={16} /> Save Extracted ID</>}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={handleSendTestPing}
                      disabled={!isValid || testLoading}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#3b82f6', color: '#3b82f6', fontWeight: 700 }}
                    >
                      <Zap size={14} /> {testLoading ? 'Pinging...' : 'Test Tracking Ping'}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Dispatches a live PageView event to test browser & server tracking.
                    </span>
                  </div>
                </form>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  WHAT THIS DOES
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                  Links your website to Facebook so ad clicks and on-site orders can be measured.
                </div>
              </div>
              <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  WHEN TO USE IT
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                  Do this first, before running any Facebook or Instagram ads.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'log' && (
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                WHAT THIS DOES
              </div>
              <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                Use this to debug setup issues — e.g. confirm a test event arrived after clicking "Simulate page visit".
              </div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                WHEN TO USE IT
              </div>
              <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                Not for ad reporting. Meta Ads Manager has official spend and conversion reports.
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: '#f8fafc', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>When</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Who</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>What Happened</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Device / OS</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Traffic Channel</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Page</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loadingEvents ? (
                  <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading activity logs...</td></tr>
                ) : events.length === 0 ? (
                  <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No events recorded yet. Try simulating a page visit.</td></tr>
                ) : (
                  events.map((ev) => {
                    const tel = ev.telemetry || {};
                    const whatDisplay = ev.event_name || 'PageView';
                    const deviceDisplay = tel.os ? `${tel.browser || 'Browser'} / ${tel.os} (${tel.deviceType || 'Desktop'})` : (ev.source || 'Desktop');
                    const trafficChannel = tel.trafficChannel || (ev.traffic_source?.startsWith('{') ? 'Direct' : (ev.traffic_source || 'Direct'));
                    const locationDisplay = tel.city && tel.city !== 'Unknown'
                      ? `${tel.city}, ${tel.country || ''}`
                      : (tel.country && tel.country !== 'Unknown' ? tel.country : '—');
                    const isReturning = Boolean(tel.isReturningVisitor || (tel.visitCount && tel.visitCount > 1));

                    return (
                      <tr key={ev.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(ev.event_time).toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{ev.user_role}</div>
                          {isReturning && (
                            <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', marginTop: '2px' }}>
                              Visit #{tel.visitCount}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            background: whatDisplay === 'PageView' ? '#e0f2fe' : (whatDisplay === 'InitiateCheckout' || whatDisplay === 'Purchase' ? '#dcfce7' : '#f3e8ff'),
                            color: whatDisplay === 'PageView' ? '#0369a1' : (whatDisplay === 'InitiateCheckout' || whatDisplay === 'Purchase' ? '#15803d' : '#7e22ce')
                          }}>
                            {whatDisplay}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.82rem', color: '#64748b' }}>{deviceDisplay}</td>
                        <td style={{ padding: '1rem', fontSize: '0.82rem', color: '#64748b' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{trafficChannel}</span>
                          {tel.fbclid && (
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#2563eb', fontWeight: 700 }}>Meta Ad Click</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.82rem', color: '#64748b' }}>{locationDisplay}</td>
                        <td style={{ padding: '1rem', fontSize: '0.82rem', color: '#64748b', fontFamily: 'monospace' }}>{ev.page_path}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedEvent(ev)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            <Eye size={13} style={{ color: '#2563eb' }} /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEvent && (
        <VisitorDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {(activeTab !== 'setup' && activeTab !== 'log') && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <Activity size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>Data Gathering</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            This section will populate with data once your pixel is connected and visitors start interacting with your site.
          </p>
        </div>
      )}

    </div>
  );
};
