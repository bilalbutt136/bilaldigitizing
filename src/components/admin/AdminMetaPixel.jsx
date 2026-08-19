'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { BookOpen, Radio, BarChart2, Megaphone, Activity, RefreshCw, CheckCircle2, ShieldCheck, Save } from 'lucide-react';

export const AdminMetaPixel = () => {
  const { siteSettings, updateSiteSettings, showToast } = useAppState();
  
  // Local state for the input
  const [pixelId, setPixelId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
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

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const trimmedId = pixelId.trim();
      if (typeof window !== 'undefined' && trimmedId) {
        try { localStorage.setItem('meta_pixel_id', trimmedId); } catch {}
        if (window.fbq) {
          window.fbq('init', trimmedId);
          window.fbq('track', 'PageView');
        }
      }
      await updateSiteSettings({ metaPixelId: trimmedId });
      showToast('Meta Pixel ID saved successfully. Tracking is now active.', 'success');
    } catch (error) {
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem 0' }}>
                  Connect your Meta Pixel
                </h3>
                <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0 }}>
                  Paste the ID from Meta Events Manager — tracking goes live immediately.
                </p>
                
                <form onSubmit={handleSave} style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', maxWidth: '500px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter Meta Pixel ID (e.g. 1234567890)" 
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary-orange" disabled={isSaving}>
                    {isSaving ? 'Saving...' : <><Save size={16} /> Save</>}
                  </button>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>When</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Who</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>What Happened</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Source</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Traffic Source</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Value</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Page</th>
                </tr>
              </thead>
              <tbody>
                {loadingEvents ? (
                  <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading activity logs...</td></tr>
                ) : events.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No events recorded yet. Try simulating a page visit.</td></tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(ev.event_time).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>{ev.user_role}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{ev.event_name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>{ev.source}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>{ev.traffic_source}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>{ev.value}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>{ev.page_path}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
