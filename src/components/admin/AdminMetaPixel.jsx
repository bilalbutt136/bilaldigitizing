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
  
  useEffect(() => {
    if (siteSettings?.metaPixelId) {
      setPixelId(siteSettings.metaPixelId);
    }
  }, [siteSettings?.metaPixelId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateSiteSettings({ metaPixelId: pixelId.trim() });
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

      {activeTab !== 'setup' && (
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
