'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PromotionsManager = () => {
  const { siteSettings, updateSiteSettings } = useAppState();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    announcement: {
      enabled: false,
      text: '',
      linkUrl: '',
      linkText: '',
    },
    promotionalBanner: {
      enabled: false,
      title: '',
      description: '',
      ctaText: '',
      ctaLink: '',
      backgroundColor: '#ff7a00',
    }
  });

  useEffect(() => {
    if (siteSettings) {
      setFormData({
        announcement: {
          enabled: siteSettings.announcement?.enabled || false,
          text: siteSettings.announcement?.text || '',
          linkUrl: siteSettings.announcement?.linkUrl || '',
          linkText: siteSettings.announcement?.linkText || '',
        },
        promotionalBanner: {
          enabled: siteSettings.promotionalBanner?.enabled || false,
          title: siteSettings.promotionalBanner?.title || '',
          description: siteSettings.promotionalBanner?.description || '',
          ctaText: siteSettings.promotionalBanner?.ctaText || '',
          ctaLink: siteSettings.promotionalBanner?.ctaLink || '',
          backgroundColor: siteSettings.promotionalBanner?.backgroundColor || '#ff7a00',
        }
      });
    }
  }, [siteSettings]);

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      await updateSiteSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving promotions:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '64rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Promotions Manager</h2>
          <p style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>Manage announcement bar and promotional banners</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary-orange"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? (
            <span className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
          ) : (
            <Save size={20} />
          )}
          Save Changes
        </button>
      </div>

      {saveStatus === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#ecfdf5', color: '#047857' }}>
          <CheckCircle2 size={20} />
          <span>Promotions settings saved successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <span>Failed to save promotions settings. Please try again.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>Announcement Bar</h3>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox"
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  checked={formData.announcement.enabled}
                  onChange={(e) => handleChange('announcement', 'enabled', e.target.checked)}
                />
                <div style={{ display: 'block', width: '3.5rem', height: '2rem', borderRadius: '9999px', transition: 'background-color 0.3s', backgroundColor: formData.announcement.enabled ? '#3b82f6' : '#d1d5db' }}></div>
                <div style={{ position: 'absolute', left: '0.25rem', top: '0.25rem', backgroundColor: 'white', width: '1.5rem', height: '1.5rem', borderRadius: '50%', transition: 'transform 0.3s', transform: formData.announcement.enabled ? 'translateX(1.5rem)' : 'translateX(0)' }}></div>
              </div>
            </label>
          </div>

          <div style={{ opacity: formData.announcement.enabled ? 1 : 0.5, pointerEvents: formData.announcement.enabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Announcement Text</label>
              <input
                type="text"
                value={formData.announcement.text}
                onChange={(e) => handleChange('announcement', 'text', e.target.value)}
                placeholder="e.g. Special offer! Get 20% off your first order."
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Link URL (Optional)</label>
                <input
                  type="text"
                  value={formData.announcement.linkUrl}
                  onChange={(e) => handleChange('announcement', 'linkUrl', e.target.value)}
                  placeholder="e.g. /promotions"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Link Text (Optional)</label>
                <input
                  type="text"
                  value={formData.announcement.linkText}
                  onChange={(e) => handleChange('announcement', 'linkText', e.target.value)}
                  placeholder="e.g. Learn More"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>Promotional Banner</h3>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox"
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  checked={formData.promotionalBanner.enabled}
                  onChange={(e) => handleChange('promotionalBanner', 'enabled', e.target.checked)}
                />
                <div style={{ display: 'block', width: '3.5rem', height: '2rem', borderRadius: '9999px', transition: 'background-color 0.3s', backgroundColor: formData.promotionalBanner.enabled ? '#3b82f6' : '#d1d5db' }}></div>
                <div style={{ position: 'absolute', left: '0.25rem', top: '0.25rem', backgroundColor: 'white', width: '1.5rem', height: '1.5rem', borderRadius: '50%', transition: 'transform 0.3s', transform: formData.promotionalBanner.enabled ? 'translateX(1.5rem)' : 'translateX(0)' }}></div>
              </div>
            </label>
          </div>

          <div style={{ opacity: formData.promotionalBanner.enabled ? 1 : 0.5, pointerEvents: formData.promotionalBanner.enabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Banner Title</label>
              <input
                type="text"
                value={formData.promotionalBanner.title}
                onChange={(e) => handleChange('promotionalBanner', 'title', e.target.value)}
                placeholder="e.g. Summer Sale is Here!"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Description</label>
              <textarea
                value={formData.promotionalBanner.description}
                onChange={(e) => handleChange('promotionalBanner', 'description', e.target.value)}
                placeholder="Brief description of the promotion"
                rows={3}
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Button Text</label>
                <input
                  type="text"
                  value={formData.promotionalBanner.ctaText}
                  onChange={(e) => handleChange('promotionalBanner', 'ctaText', e.target.value)}
                  placeholder="e.g. Shop Now"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Button Link</label>
                <input
                  type="text"
                  value={formData.promotionalBanner.ctaLink}
                  onChange={(e) => handleChange('promotionalBanner', 'ctaLink', e.target.value)}
                  placeholder="e.g. /pricing"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>Background Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="color"
                  value={formData.promotionalBanner.backgroundColor}
                  onChange={(e) => handleChange('promotionalBanner', 'backgroundColor', e.target.value)}
                  style={{ width: '2.5rem', height: '2.5rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={formData.promotionalBanner.backgroundColor}
                  onChange={(e) => handleChange('promotionalBanner', 'backgroundColor', e.target.value)}
                  style={{ flex: 1, padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
