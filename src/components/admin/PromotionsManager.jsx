'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Sparkles, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  Copy, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Flame, 
  Clock, 
  RefreshCw, 
  Palette, 
  Layout, 
  Gift, 
  Percent, 
  DollarSign,
  X,
  Layers,
  PenTool,
  FileCheck,
  ShieldCheck,
  Zap,
  Sliders,
  Check
} from 'lucide-react';

const PRESET_THEMES = [
  { id: 'orange', name: 'Brand Flame Orange', bg: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)', text: '#ffffff', border: '#fb923c', badgeBg: 'rgba(255,255,255,0.22)' },
  { id: 'navy', name: 'Midnight Studio Navy', bg: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', text: '#ffffff', border: '#6366f1', badgeBg: 'rgba(249, 115, 22, 0.25)' },
  { id: 'emerald', name: 'Emerald Production Pro', bg: 'linear-gradient(90deg, #065f46 0%, #059669 50%, #065f46 100%)', text: '#ffffff', border: '#34d399', badgeBg: 'rgba(255,255,255,0.22)' },
  { id: 'crimson', name: 'Crimson Rush Express', bg: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)', text: '#ffffff', border: '#f87171', badgeBg: 'rgba(255,255,255,0.22)' },
  { id: 'royal', name: 'Royal Indigo Velvet', bg: 'linear-gradient(90deg, #312e81 0%, #4338ca 50%, #312e81 100%)', text: '#ffffff', border: '#818cf8', badgeBg: 'rgba(255,255,255,0.22)' }
];

export const PromotionsManager = () => {
  const { siteSettings, updateSiteSettings, showToast, openOrderWizard } = useAppState();
  const [loading, setLoading] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('announcement'); // 'announcement' | 'coupons' | 'volume_tiers'

  const [formData, setFormData] = useState({
    announcement: {
      enabled: true,
      badge: 'SPECIAL PROMO',
      text: 'Get 20% OFF on All Custom Embroidery Digitizing & Vector Art Orders!',
      promoCode: 'SAVE20',
      discountValue: 20,
      discountType: 'percent',
      linkText: 'Claim 20% Off',
      linkUrl: '/order',
      theme: 'orange',
      bgColor: '',
      textColor: '#ffffff',
      showCodeBadge: true,
      showCountdown: true,
      countdownHours: 24
    },
    promoCodes: [
      {
        code: 'SAVE20',
        discountType: 'percent',
        discountValue: 20,
        minOrder: 10,
        serviceScope: 'all',
        description: '20% off all embroidery digitizing and vector conversion services',
        isActive: true
      },
      {
        code: 'WELCOME10',
        discountType: 'percent',
        discountValue: 10,
        minOrder: 10,
        serviceScope: 'all',
        description: '10% off for first-time apparel decorator clients',
        isActive: true
      },
      {
        code: 'VECTORDEAL',
        discountType: 'percent',
        discountValue: 15,
        minOrder: 15,
        serviceScope: 'vector',
        description: '15% off manual vector redraws and color separations',
        isActive: true
      },
      {
        code: 'FREESAMPLE',
        discountType: 'fixed',
        discountValue: 10,
        minOrder: 20,
        serviceScope: 'embroidery',
        description: '$10 credit towards stitch proof sampling',
        isActive: true
      }
    ],
    volumeDiscounts: {
      enabled: true,
      tier1Min: 3,
      tier1Percent: 5,
      tier2Min: 5,
      tier2Percent: 10,
      tier3Min: 10,
      tier3Percent: 15,
      tier4Min: 25,
      tier4Percent: 25,
      tier5Min: 50,
      tier5Percent: 35
    }
  });

  // New Coupon Creator State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 15,
    minOrder: 10,
    serviceScope: 'all',
    description: '',
    isActive: true
  });
  const [showAddCoupon, setShowAddCoupon] = useState(false);

  // Volume calculator simulator state
  const [calcQty, setCalcQty] = useState(5);
  const [calcBaseRate, setCalcBaseRate] = useState(20);

  useEffect(() => {
    if (siteSettings) {
      setFormData(prev => ({
        announcement: {
          ...prev.announcement,
          ...(siteSettings.announcement || {}),
          enabled: siteSettings.announcement?.enabled !== undefined ? siteSettings.announcement.enabled : prev.announcement.enabled,
          badge: siteSettings.announcement?.badge || prev.announcement.badge,
          text: siteSettings.announcement?.text || prev.announcement.text,
          promoCode: siteSettings.announcement?.promoCode || prev.announcement.promoCode,
          discountValue: siteSettings.announcement?.discountValue !== undefined ? Number(siteSettings.announcement.discountValue) : prev.announcement.discountValue,
          discountType: siteSettings.announcement?.discountType || prev.announcement.discountType,
          linkText: siteSettings.announcement?.linkText || prev.announcement.linkText,
          linkUrl: siteSettings.announcement?.linkUrl || prev.announcement.linkUrl,
          theme: siteSettings.announcement?.theme || prev.announcement.theme,
          bgColor: siteSettings.announcement?.bgColor || prev.announcement.bgColor,
          textColor: siteSettings.announcement?.textColor || prev.announcement.textColor,
          showCodeBadge: siteSettings.announcement?.showCodeBadge !== false,
          showCountdown: siteSettings.announcement?.showCountdown !== false
        },
        promoCodes: Array.isArray(siteSettings.promoCodes) && siteSettings.promoCodes.length > 0
          ? siteSettings.promoCodes
          : prev.promoCodes,
        volumeDiscounts: {
          ...prev.volumeDiscounts,
          ...(siteSettings.volumeDiscounts || {})
        }
      }));
    }
  }, [siteSettings]);

  const handleAnnouncementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        [field]: value
      }
    }));
  };

  const handleAnnouncementDiscountChange = (newVal) => {
    const numericVal = Math.max(1, Math.min(100, Number(newVal) || 0));
    setFormData(prev => {
      const currentCode = prev.announcement.promoCode || 'SAVE20';
      const updatedPromoCodes = prev.promoCodes.map(c => {
        if (c.code?.toUpperCase() === currentCode.toUpperCase()) {
          return { ...c, discountValue: numericVal, description: `${numericVal}% off promotion` };
        }
        return c;
      });

      return {
        ...prev,
        announcement: {
          ...prev.announcement,
          discountValue: numericVal,
          text: prev.announcement.text.replace(/\d+%/g, `${numericVal}%`)
        },
        promoCodes: updatedPromoCodes
      };
    });
  };

  // Add Coupon
  const handleAddCoupon = () => {
    const cleanCode = newCoupon.code.trim().toUpperCase();
    if (!cleanCode) {
      if (showToast) showToast('Please enter a valid coupon code.', 'warning');
      return;
    }

    const existing = formData.promoCodes.find(c => c.code.toUpperCase() === cleanCode);
    if (existing) {
      if (showToast) showToast(`Coupon code ${cleanCode} already exists.`, 'warning');
      return;
    }

    const couponObj = {
      code: cleanCode,
      discountType: newCoupon.discountType || 'percent',
      discountValue: Math.max(1, Number(newCoupon.discountValue) || 10),
      minOrder: Math.max(0, Number(newCoupon.minOrder) || 0),
      serviceScope: newCoupon.serviceScope || 'all',
      description: newCoupon.description.trim() || `${cleanCode} promotional discount`,
      isActive: newCoupon.isActive !== false
    };

    setFormData(prev => ({
      ...prev,
      promoCodes: [couponObj, ...prev.promoCodes]
    }));

    setNewCoupon({
      code: '',
      discountType: 'percent',
      discountValue: 15,
      minOrder: 10,
      serviceScope: 'all',
      description: '',
      isActive: true
    });
    setShowAddCoupon(false);

    if (showToast) showToast(`Created coupon ${cleanCode}! Remember to click "Save to Database".`, 'info');
  };

  const handleToggleCoupon = (codeToToggle) => {
    setFormData(prev => ({
      ...prev,
      promoCodes: prev.promoCodes.map(c => c.code === codeToToggle ? { ...c, isActive: !c.isActive } : c)
    }));
  };

  const handleDeleteCoupon = (codeToDelete) => {
    if (confirm(`Are you sure you want to permanently delete coupon ${codeToDelete}?`)) {
      setFormData(prev => ({
        ...prev,
        promoCodes: prev.promoCodes.filter(c => c.code !== codeToDelete)
      }));
      if (showToast) showToast(`Deleted coupon ${codeToDelete}. Click "Save to Database" to publish.`, 'info');
    }
  };

  // Save Settings to Supabase
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const payload = {
        announcement: formData.announcement,
        promoCodes: formData.promoCodes,
        volumeDiscounts: formData.volumeDiscounts
      };

      if (updateSiteSettings) {
        await updateSiteSettings(payload);
        if (showToast) showToast('Promotions & Discounts successfully updated in live database!', 'success');
      }
    } catch (err) {
      console.error('Save promotions error:', err);
      if (showToast) showToast('Failed to save promotions: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Active theme details
  const activeTheme = PRESET_THEMES.find(t => t.id === formData.announcement.theme) || PRESET_THEMES[0];
  const bgToUse = formData.announcement.bgColor || activeTheme.bg;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1.5px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Revenue & Conversion Suite
            </span>
            <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
              Live Production Synced
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
            Promotions, Coupons & Commercial Volume Tiers
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Control top flash deal ribbons, enterprise coupon codes, and automated multi-design bulk discounts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={loading}
            className="btn btn-primary-orange"
            style={{
              fontWeight: 800,
              padding: '0.65rem 1.5rem',
              fontSize: '0.9rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            <Save size={16} />
            <span>{loading ? 'Saving to Database...' : 'Save Changes to Live Website'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1.5px solid var(--border-color)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'announcement' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeTab === 'announcement' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Flame size={18} />
          <span>Top Announcement Ribbon & Flash Sale</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'coupons' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeTab === 'coupons' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Tag size={18} />
          <span>Master Coupon Codes Hub ({formData.promoCodes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('volume_tiers')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'volume_tiers' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeTab === 'volume_tiers' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sliders size={18} />
          <span>Multi-Design Volume Tiers (B2B Discounts)</span>
        </button>
      </div>

      {/* TAB 1: TOP ANNOUNCEMENT RIBBON */}
      {activeTab === 'announcement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Preview Box */}
          <div style={{
            background: '#090d16',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1.5px solid rgba(255, 122, 0, 0.4)',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-400)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Eye size={15} /> Top Header Announcement Live Emulation
              </span>
              <span style={{ fontSize: '0.72rem', background: formData.announcement.enabled ? '#059669' : '#ef4444', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 800 }}>
                {formData.announcement.enabled ? 'ACTIVE ON WEBSITE' : 'CURRENTLY PAUSED'}
              </span>
            </div>

            {/* Render Actual Component Emulation */}
            <div style={{
              background: bgToUse,
              color: formData.announcement.textColor || '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              flexWrap: 'wrap',
              fontSize: '0.84rem',
              fontWeight: 600,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {formData.announcement.badge && (
                <div style={{ background: activeTheme.badgeBg || 'rgba(255,255,255,0.25)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Flame size={12} style={{ color: '#fef08a' }} />
                  <span>{formData.announcement.badge}</span>
                </div>
              )}
              <span style={{ fontWeight: 700 }}>{formData.announcement.text}</span>
              
              {formData.announcement.showCountdown && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fef08a' }}>
                  <Clock size={11} /> Ends in: 14h 35m 48s
                </div>
              )}

              {formData.announcement.showCodeBadge && formData.announcement.promoCode && (
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px dashed rgba(255,255,255,0.8)', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'monospace' }}>
                  <Tag size={12} style={{ color: '#fbbf24' }} />
                  <span>{formData.announcement.promoCode}</span>
                  <span style={{ fontSize: '0.68rem', color: '#86efac', marginLeft: '2px' }}>Apply</span>
                </div>
              )}

              {formData.announcement.linkText && (
                <div style={{ background: '#ffffff', color: activeTheme.id === 'orange' ? '#ea580c' : '#0f172a', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>{formData.announcement.linkText}</span>
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          </div>

          {/* Settings Card */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Status Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                  Top Announcement Ribbon Status
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  When enabled, this bar renders at the very top of all public visitor pages.
                </p>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.announcement.enabled}
                  onChange={(e) => handleAnnouncementChange('enabled', e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--orange-500)', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: formData.announcement.enabled ? '#059669' : 'var(--text-muted)' }}>
                  {formData.announcement.enabled ? 'Enabled (Live)' : 'Disabled (Hidden)'}
                </span>
              </label>
            </div>

            {/* Campaign Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Campaign Badge Tag:
                </label>
                <input
                  type="text"
                  placeholder="e.g. FLASH SALE, WEEKEND DEAL"
                  value={formData.announcement.badge}
                  onChange={(e) => handleAnnouncementChange('badge', e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', fontWeight: 700, background: 'var(--bg-surface)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Linked Promo Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={formData.announcement.promoCode}
                  onChange={(e) => handleAnnouncementChange('promoCode', e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--orange-600)', background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Main Announcement Headline:
              </label>
              <input
                type="text"
                value={formData.announcement.text}
                onChange={(e) => handleAnnouncementChange('text', e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 700, background: 'var(--bg-surface)' }}
              />
            </div>

            {/* Themes & Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Preset Studio Theme:
                </label>
                <select
                  value={formData.announcement.theme}
                  onChange={(e) => handleAnnouncementChange('theme', e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', fontWeight: 700, background: 'var(--bg-surface)' }}
                >
                  {PRESET_THEMES.map(th => (
                    <option key={th.id} value={th.id}>{th.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Action Button Label:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Claim 20% Off"
                  value={formData.announcement.linkText}
                  onChange={(e) => handleAnnouncementChange('linkText', e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', fontWeight: 700, background: 'var(--bg-surface)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Destination Link:
                </label>
                <input
                  type="text"
                  placeholder="e.g. /order or /services/embroidery-digitizing"
                  value={formData.announcement.linkUrl}
                  onChange={(e) => handleAnnouncementChange('linkUrl', e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            {/* Checkbox Features */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.announcement.showCountdown}
                  onChange={(e) => handleAnnouncementChange('showCountdown', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--orange-500)' }}
                />
                <span>Display Urgency Countdown Timer (Ends in Xh Xm)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.announcement.showCodeBadge}
                  onChange={(e) => handleAnnouncementChange('showCodeBadge', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--orange-500)' }}
                />
                <span>Display 1-Click "Copy & Auto-Apply" Promo Badge</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER COUPON CODES HUB */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Coupon Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #ffffff)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Active Coupons</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--navy-950)', marginTop: '0.25rem' }}>
                {formData.promoCodes.filter(c => c.isActive !== false).length} / {formData.promoCodes.length}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card, #ffffff)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Studio Discount</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--orange-600)', marginTop: '0.25rem' }}>
                {Math.max(...formData.promoCodes.map(c => c.discountType === 'percent' ? c.discountValue : 0), 0)}% OFF
              </div>
            </div>

            <div style={{ background: 'var(--bg-card, #ffffff)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Need New Campaign?</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)', marginTop: '0.25rem' }}>Create Promo Code</div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCoupon(!showAddCoupon)}
                className="btn btn-primary-orange"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 800, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={15} />
                <span>{showAddCoupon ? 'Close' : 'Add Coupon'}</span>
              </button>
            </div>
          </div>

          {/* New Coupon Creation Form */}
          {showAddCoupon && (
            <div style={{
              background: 'var(--color-subtle, #f8fafc)',
              border: '2px solid var(--orange-500)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Tag size={18} style={{ color: 'var(--orange-500)' }} />
                Create New Studio Promo Code
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Coupon Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VIP25"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-950)', background: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Discount Type *
                  </label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, discountType: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, background: '#ffffff' }}
                  >
                    <option value="percent">Percentage (%) Off</option>
                    <option value="fixed">Fixed Dollar ($) Amount</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Discount Value ({newCoupon.discountType === 'percent' ? '%' : '$'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newCoupon.discountType === 'percent' ? 100 : 500}
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, discountValue: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--orange-600)', background: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Minimum Spend ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 20"
                    value={newCoupon.minOrder}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, minOrder: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 700, background: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Applicable Service Scope
                  </label>
                  <select
                    value={newCoupon.serviceScope}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, serviceScope: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, background: '#ffffff' }}
                  >
                    <option value="all">All Studio Services</option>
                    <option value="embroidery">Embroidery Digitizing Only</option>
                    <option value="vector">Vector Art & Tracing Only</option>
                    <option value="patch">Custom Patches Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Description / Note (Customer facing summary)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25% off embroidery digitizing for orders over $20"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.85rem', background: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCoupon(false)}
                  style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#ffffff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCoupon}
                  className="btn btn-primary-orange"
                  style={{ padding: '0.55rem 1.35rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={15} />
                  <span>Create Coupon</span>
                </button>
              </div>
            </div>
          )}

          {/* Coupon Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {formData.promoCodes.map((coupon, idx) => {
              const isPercent = coupon.discountType === 'percent';
              const discountDisplay = isPercent ? `${coupon.discountValue}% OFF` : `$${Number(coupon.discountValue).toFixed(2)} OFF`;
              const isActive = coupon.isActive !== false;
              const scopeLabel = coupon.serviceScope === 'vector' ? 'Vector Art' : coupon.serviceScope === 'patch' ? 'Custom Patches' : coupon.serviceScope === 'embroidery' ? 'Embroidery' : 'All Services';

              return (
                <div
                  key={coupon.code || idx}
                  style={{
                    background: 'var(--bg-card, #ffffff)',
                    border: isActive ? '1.5px solid var(--border-color)' : '1.5px dashed #cbd5e1',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isActive ? 1 : 0.65,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: 'var(--navy-950)', background: 'var(--color-subtle, #f1f5f9)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          {coupon.code}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', background: 'rgba(255, 122, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          {discountDisplay}
                        </span>
                      </div>

                      {/* Active Toggle Switch */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleToggleCoupon(coupon.code)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--orange-500)', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isActive ? '#059669' : '#ef4444' }}>
                          {isActive ? 'Active' : 'Paused'}
                        </span>
                      </label>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '0 0 0.65rem 0', lineHeight: 1.45 }}>
                      {coupon.description || 'Promotional coupon code'}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                        Scope: {scopeLabel}
                      </span>
                      {coupon.minOrder > 0 && (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                          Min Spend: ${coupon.minOrder}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (openOrderWizard) {
                          openOrderWizard({ promoCode: coupon.code, type: coupon.serviceScope || 'all' });
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--orange-600)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Sparkles size={13} />
                      <span>Test in Wizard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon.code)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 3: AUTOMATIC MULTI-DESIGN VOLUME DISCOUNTS */}
      {activeTab === 'volume_tiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Explanation Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(255, 122, 0, 0.02) 100%)',
            border: '1.5px solid rgba(255, 122, 0, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--orange-500)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={18} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
                Automated Multi-Design Bulk Tiers (Commercial B2B Standard)
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0.35rem 0 0 0', lineHeight: 1.55 }}>
              Commercial apparel decorators, uniform contractors, and screen printing shops frequently order multiple logos in a single order. These volume tiers automatically reward multi-design batch orders without requiring manual discount codes.
            </p>
          </div>

          {/* Volume Tiers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1rem' }}>
            
            {/* Tier 1 */}
            <div style={{ background: 'var(--bg-card, #ffffff)', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)' }}>Tier 1: Starter Batch</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--orange-600)', background: 'rgba(255, 122, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>5% OFF</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>3 – 4 Designs</strong> in same order
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 700 }}>
                ✓ Perfect for small uniform bundles (Chest + Cap + Sleeve)
              </div>
            </div>

            {/* Tier 2 */}
            <div style={{ background: 'var(--bg-card, #ffffff)', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)' }}>Tier 2: Team Catalog</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--orange-600)', background: 'rgba(255, 122, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>10% OFF</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>5 – 9 Designs</strong> in same order
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 700 }}>
                ✓ Ideal for sports leagues & multi-location franchises
              </div>
            </div>

            {/* Tier 3 */}
            <div style={{ background: 'var(--bg-card, #ffffff)', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)' }}>Tier 3: Commercial Program</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--orange-600)', background: 'rgba(255, 122, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>15% OFF</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>10 – 24 Designs</strong> in same order
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 700 }}>
                ✓ For high-volume print shops & apparel brands
              </div>
            </div>

            {/* Tier 4 */}
            <div style={{ background: 'var(--bg-card, #ffffff)', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)' }}>Tier 4: Enterprise Wholesale</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--orange-600)', background: 'rgba(255, 122, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>25% OFF</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>25 – 49 Designs</strong> in same order
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 700 }}>
                ✓ Dedicated digitizer assignment & priority queue
              </div>
            </div>

            {/* Tier 5 */}
            <div style={{ background: 'var(--bg-card, #ffffff)', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)' }}>Tier 5: Master Factory</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--orange-600)', background: 'rgba(255, 122, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>35% OFF</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>50+ Designs</strong> in same order
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 700 }}>
                ✓ Full seasonal corporate catalog digitizing
              </div>
            </div>

          </div>

          {/* Interactive Calculator Simulator */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Zap size={18} style={{ color: 'var(--orange-500)' }} />
              Live Multi-Design Volume Calculator Simulator
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Simulated Design Quantity:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 800, background: 'var(--bg-surface)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Base Rate Per Design ($):
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={calcBaseRate}
                  onChange={(e) => setCalcBaseRate(Math.max(5, parseFloat(e.target.value) || 20))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 800, background: 'var(--bg-surface)' }}
                />
              </div>

              {/* Calculated Result */}
              {(() => {
                const subtotal = calcQty * calcBaseRate;
                let discountPct = 0;
                if (calcQty >= 50) discountPct = 35;
                else if (calcQty >= 25) discountPct = 25;
                else if (calcQty >= 10) discountPct = 15;
                else if (calcQty >= 5) discountPct = 10;
                else if (calcQty >= 3) discountPct = 5;

                const discountAmt = (subtotal * discountPct) / 100;
                const finalAmt = subtotal - discountAmt;

                return (
                  <div style={{ background: 'var(--color-subtle, #f8fafc)', border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Automated Pricing Output:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: discountPct > 0 ? 'line-through' : 'none' }}>
                        ${subtotal.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669' }}>
                        ${finalAmt.toFixed(2)}
                      </span>
                    </div>
                    {discountPct > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, marginTop: '0.15rem' }}>
                        ✓ Client Saves ${discountAmt.toFixed(2)} ({discountPct}% Volume Tier)
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* Save Bottom Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={loading}
          className="btn btn-primary-orange"
          style={{
            fontWeight: 800,
            padding: '0.75rem 2.25rem',
            fontSize: '0.95rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)'
          }}
        >
          <Save size={18} />
          <span>{loading ? 'Saving Changes...' : 'Save All Promotions to Live Website'}</span>
        </button>
      </div>

    </div>
  );
};

export default PromotionsManager;
