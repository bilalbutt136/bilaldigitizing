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
  X
} from 'lucide-react';

const PRESET_THEMES = [
  { id: 'orange', name: 'Brand Orange', bg: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)', text: '#ffffff', border: '#fb923c' },
  { id: 'navy', name: 'Studio Indigo', bg: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', text: '#ffffff', border: '#6366f1' },
  { id: 'emerald', name: 'Emerald Green', bg: 'linear-gradient(90deg, #065f46 0%, #059669 50%, #065f46 100%)', text: '#ffffff', border: '#34d399' },
  { id: 'crimson', name: 'Crimson Red', bg: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)', text: '#ffffff', border: '#f87171' }
];

export const PromotionsManager = () => {
  const { siteSettings, updateSiteSettings, showToast } = useAppState();
  const [loading, setLoading] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('announcement'); // 'announcement' | 'coupons' | 'visitor_banner'

  const [formData, setFormData] = useState({
    announcement: {
      enabled: false,
      badge: 'SPECIAL PROMO',
      text: 'Get 20% OFF on All Custom Embroidery Digitizing & Vector Art Orders!',
      promoCode: 'SAVE20',
      discountValue: 20,
      discountType: 'percent',
      linkText: 'Claim 20% Off',
      linkUrl: '/order',
      theme: 'orange',
      bgColor: '#ea580c',
      textColor: '#ffffff',
      showCodeBadge: true,
      showCountdown: true,
      countdownHours: 24
    },
    promotionalBanner: {
      enabled: false,
      title: 'First-Time Client Welcome Offer',
      description: 'Enjoy 20% off your first digitizing file or vector redraw with guaranteed zero thread breaks and free unlimited revisions.',
      promoCode: 'WELCOME20',
      ctaText: 'Start Your Order',
      ctaLink: '/order',
      theme: 'navy',
      position: 'bottom-right'
    },
    promoCodes: [
      {
        code: 'SAVE20',
        discountType: 'percent',
        discountValue: 20,
        minOrder: 10,
        description: '20% off all embroidery digitizing and vector conversion services',
        isActive: true
      },
      {
        code: 'WELCOME10',
        discountType: 'percent',
        discountValue: 10,
        minOrder: 10,
        description: '10% off for first-time studio clients',
        isActive: true
      },
      {
        code: 'FREESAMPLE',
        discountType: 'fixed',
        discountValue: 10,
        minOrder: 10,
        description: '$10 credit towards free digitizing stitch proof',
        isActive: true
      }
    ]
  });

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
        promotionalBanner: {
          ...prev.promotionalBanner,
          ...(siteSettings.promotionalBanner || {}),
          enabled: siteSettings.promotionalBanner?.enabled !== undefined ? siteSettings.promotionalBanner.enabled : prev.promotionalBanner.enabled,
          title: siteSettings.promotionalBanner?.title || prev.promotionalBanner.title,
          description: siteSettings.promotionalBanner?.description || prev.promotionalBanner.description,
          promoCode: siteSettings.promotionalBanner?.promoCode || prev.promotionalBanner.promoCode,
          ctaText: siteSettings.promotionalBanner?.ctaText || prev.promotionalBanner.ctaText,
          ctaLink: siteSettings.promotionalBanner?.ctaLink || prev.promotionalBanner.ctaLink
        },
        promoCodes: Array.isArray(siteSettings.promoCodes) && siteSettings.promoCodes.length > 0
          ? siteSettings.promoCodes
          : prev.promoCodes
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
      // Sync matching coupon in promoCodes list
      const updatedPromoCodes = prev.promoCodes.map(c => {
        if (c.code?.toUpperCase() === currentCode.toUpperCase()) {
          return { ...c, discountValue: numericVal, description: `${numericVal}% off promotion` };
        }
        return c;
      });

      // Update text if it had percentage mention
      const updatedText = prev.announcement.text.replace(/\d+%/g, `${numericVal}%`);
      const updatedLinkText = prev.announcement.linkText.replace(/\d+%/g, `${numericVal}%`);

      return {
        ...prev,
        announcement: {
          ...prev.announcement,
          discountValue: numericVal,
          discountType: 'percent',
          text: updatedText,
          linkText: updatedLinkText
        },
        promoCodes: updatedPromoCodes
      };
    });
  };

  const handleBannerChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      promotionalBanner: {
        ...prev.promotionalBanner,
        [field]: value
      }
    }));
  };

  // Promo Codes management
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 20,
    minOrder: 10,
    description: '',
    isActive: true
  });

  const handleAddCoupon = () => {
    if (!newCoupon.code.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }
    const cleanCode = newCoupon.code.trim().toUpperCase();
    const existing = formData.promoCodes.find(c => c.code.toUpperCase() === cleanCode);
    if (existing) {
      showToast(`Coupon code ${cleanCode} already exists`, 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      promoCodes: [
        ...prev.promoCodes,
        {
          code: cleanCode,
          discountType: newCoupon.discountType,
          discountValue: Number(newCoupon.discountValue) || 10,
          minOrder: Number(newCoupon.minOrder) || 0,
          description: newCoupon.description.trim() || `${newCoupon.discountValue}${newCoupon.discountType === 'percent' ? '%' : '$'} discount`,
          isActive: true
        }
      ]
    }));

    setNewCoupon({
      code: '',
      discountType: 'percent',
      discountValue: 20,
      minOrder: 10,
      description: '',
      isActive: true
    });
    showToast(`Promo code ${cleanCode} added!`, 'success');
  };

  const persistSettings = async (updatedSettings, successMsg) => {
    setLoading(true);
    try {
      await updateSiteSettings(updatedSettings);

      await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'site_settings', value: updatedSettings },
            { key: 'announcement', value: updatedSettings.announcement },
            { key: 'promotionalBanner', value: updatedSettings.promotionalBanner },
            { key: 'promoCodes', value: updatedSettings.promoCodes }
          ]
        })
      });

      if (successMsg) {
        showToast(successMsg, 'success');
      }
    } catch (error) {
      console.error('Error saving promotions:', error);
      showToast('Failed to save promotions settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaster = async () => {
    const isCurrentlyAnyEnabled = formData.announcement.enabled || formData.promotionalBanner.enabled;
    const nextState = !isCurrentlyAnyEnabled;
    const updated = {
      ...formData,
      announcement: { ...formData.announcement, enabled: nextState },
      promotionalBanner: { ...formData.promotionalBanner, enabled: nextState }
    };
    setFormData(updated);
    await persistSettings(updated, nextState ? 'Promotions turned ON (Live on website)' : 'Promotions turned OFF (Hidden from website)');
  };

  const handleToggleAnnouncement = async () => {
    const nextState = !formData.announcement.enabled;
    const updated = {
      ...formData,
      announcement: { ...formData.announcement, enabled: nextState }
    };
    setFormData(updated);
    await persistSettings(updated, nextState ? 'Top Announcement Ribbon is now LIVE' : 'Top Announcement Ribbon is now HIDDEN');
  };

  const handleToggleBanner = async () => {
    const nextState = !formData.promotionalBanner.enabled;
    const updated = {
      ...formData,
      promotionalBanner: { ...formData.promotionalBanner, enabled: nextState }
    };
    setFormData(updated);
    await persistSettings(updated, nextState ? 'Visitor Welcome Offer is now LIVE' : 'Visitor Welcome Offer is now HIDDEN');
  };

  const handleToggleCoupon = async (codeToToggle) => {
    const updatedCodes = formData.promoCodes.map(c => c.code === codeToToggle ? { ...c, isActive: !c.isActive } : c);
    const updated = {
      ...formData,
      promoCodes: updatedCodes
    };
    setFormData(updated);
    const toggledItem = updatedCodes.find(c => c.code === codeToToggle);
    await persistSettings(updated, `Promo code ${codeToToggle} is now ${toggledItem?.isActive ? 'Active' : 'Disabled'}`);
  };

  const handleDeleteCoupon = async (codeToDelete) => {
    const updatedCodes = formData.promoCodes.filter(c => c.code !== codeToDelete);
    const updated = {
      ...formData,
      promoCodes: updatedCodes
    };
    setFormData(updated);
    await persistSettings(updated, `Promo code ${codeToDelete} removed`);
  };

  const handleSave = async () => {
    await persistSettings(formData, 'Promotions and coupons saved successfully to live website!');
  };

  const currentTheme = PRESET_THEMES.find(t => t.id === formData.announcement.theme) || PRESET_THEMES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header & Primary Save Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--orange-500)' }} /> Promotions & Announcement Manager
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Control top announcement ribbons, 1-click coupon codes, and visitor welcome discount offers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Master Promotion System Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#ffffff',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            border: '1.5px solid var(--border-color)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
              Master Status:
            </span>
            <button
              type="button"
              onClick={handleToggleMaster}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: (formData.announcement.enabled || formData.promotionalBanner.enabled) ? '#22c55e' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                padding: '0.35rem 0.95rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ffffff' }}></span>
              {(formData.announcement.enabled || formData.promotionalBanner.enabled) ? 'PROMOTIONS ON' : 'PROMOTIONS OFF'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary-orange btn-md"
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: '150px' }}
          >
            {loading ? <RefreshCw size={16} className="spin-icon" /> : <Save size={16} />}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. LIVE INTERACTIVE WEBSITE PREVIEW BOX */}
      <div className="card" style={{ padding: '1.5rem', background: '#090d16', borderRadius: '18px', border: '1.5px solid rgba(255, 255, 255, 0.12)', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Eye size={14} /> Real-Time Website Visitor Preview
          </span>
          <span style={{ fontSize: '0.78rem', color: formData.announcement.enabled ? '#22c55e' : '#94a3b8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: formData.announcement.enabled ? '#22c55e' : '#64748b' }}></span>
            {formData.announcement.enabled ? 'Live on Website' : 'Currently Hidden'}
          </span>
        </div>

        {/* Render Live Top Bar Preview */}
        {formData.announcement.enabled ? (
          <div style={{
            background: currentTheme.bg,
            color: currentTheme.text,
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            flexWrap: 'wrap',
            position: 'relative'
          }}>
            {/* Sparkle Badge */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              letterSpacing: '0.04em'
            }}>
              <Flame size={12} style={{ color: '#fef08a' }} />
              {formData.announcement.badge || 'PROMOTION'}
            </div>

            {/* Announcement Text */}
            <span style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'center' }}>
              {formData.announcement.text || 'Special studio offer active today!'}
            </span>

            {/* Promo Code Pill with Copy */}
            {formData.announcement.showCodeBadge && formData.announcement.promoCode && (
              <div
                onClick={() => {
                  setCopiedPreview(true);
                  setTimeout(() => setCopiedPreview(false), 2000);
                }}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px dashed rgba(255, 255, 255, 0.6)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
                title="Click to copy promo code"
              >
                <Tag size={12} />
                <span>{formData.announcement.promoCode}</span>
                <span style={{ fontSize: '0.68rem', color: copiedPreview ? '#86efac' : 'rgba(255,255,255,0.75)', fontWeight: 800 }}>
                  {copiedPreview ? '✓ Copied!' : 'Copy'}
                </span>
              </div>
            )}

            {/* Action CTA Button */}
            {formData.announcement.linkText && (
              <span style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '0.3rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                {formData.announcement.linkText} <ArrowRight size={12} />
              </span>
            )}
          </div>
        ) : (
          <div style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            Top Announcement Bar is currently disabled. Toggle it on below to publish to website visitors.
          </div>
        )}
      </div>

      {/* 3. Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', width: 'fit-content' }}>
        {[
          { id: 'announcement', label: 'Top Announcement Bar', icon: Layout },
          { id: 'coupons', label: 'Discount Promo Codes', icon: Tag },
          { id: 'visitor_banner', label: 'Visitor Welcome Card', icon: Gift }
        ].map(tab => {
          const IconComp = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: isSelected ? '#ffffff' : 'transparent',
                color: isSelected ? 'var(--orange-600)' : 'var(--navy-700)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <IconComp size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB 1: TOP ANNOUNCEMENT BAR SETTINGS */}
      {activeTab === 'announcement' && (
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '16px' }}>
          
          {/* Enable / Disable Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                Top Announcement Bar Visibility
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                When active, displays a sleek promotional ribbon across the top of all pages.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAnnouncement}
              style={{
                background: formData.announcement.enabled ? 'var(--orange-500)' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              {formData.announcement.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
              <span>{formData.announcement.enabled ? 'Visible to Visitors' : 'Disabled / Hidden'}</span>
            </button>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            
            {/* Badge */}
            <div className="form-group">
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                Badge Text
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.announcement.badge}
                onChange={(e) => handleAnnouncementChange('badge', e.target.value)}
                placeholder="e.g. SPECIAL PROMO, FLASH SALE"
              />
            </div>

            {/* Promo Code */}
            <div className="form-group">
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                Promo Coupon Code
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.announcement.promoCode}
                onChange={(e) => handleAnnouncementChange('promoCode', e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
              />
            </div>
          </div>

          {/* Discount Percentage Selector & Presets */}
          <div className="form-group" style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Percent size={15} style={{ color: 'var(--orange-500)' }} /> Promotional Discount Rate (% OFF)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Auto-applies to Order Wizard & Checkout
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {[10, 15, 20, 25, 30, 40, 50].map((pct) => {
                const isSelected = Number(formData.announcement.discountValue) === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleAnnouncementDiscountChange(pct)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--orange-500)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--navy-800)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pct}% OFF
                  </button>
                );
              })}

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-800)' }}>Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-control"
                  style={{ width: '75px', padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 800 }}
                  value={formData.announcement.discountValue || 20}
                  onChange={(e) => handleAnnouncementDiscountChange(e.target.value)}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>%</span>
              </div>
            </div>
          </div>

          {/* Announcement Main Headline Text */}
          <div className="form-group">
            <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
              Announcement Headline Message *
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.announcement.text}
              onChange={(e) => handleAnnouncementChange('text', e.target.value)}
              placeholder="e.g. Get 20% OFF on All Custom Embroidery Digitizing & Vector Art Orders!"
              required
            />
          </div>

          {/* CTA Link & Text */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                Button Text
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.announcement.linkText}
                onChange={(e) => handleAnnouncementChange('linkText', e.target.value)}
                placeholder="e.g. Claim 20% Off, Order Now"
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                Target URL / Action
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.announcement.linkUrl}
                onChange={(e) => handleAnnouncementChange('linkUrl', e.target.value)}
                placeholder="e.g. /order, #pricing, /pricing"
              />
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.65rem' }}>
              Visual Gradient Themes
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              {PRESET_THEMES.map(theme => {
                const isSelected = formData.announcement.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        announcement: {
                          ...prev.announcement,
                          theme: theme.id,
                          bgColor: theme.bg,
                          textColor: theme.text
                        }
                      }));
                    }}
                    style={{
                      background: theme.bg,
                      color: theme.text,
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: isSelected ? '3px solid #ffffff' : '1px solid rgba(0,0,0,0.1)',
                      boxShadow: isSelected ? '0 0 0 2px var(--orange-500), 0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {theme.name} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Background and Text Color */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Custom Background (HEX or CSS Gradient)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.announcement.bgColor?.startsWith('#') ? formData.announcement.bgColor : '#ea580c'}
                    onChange={(e) => {
                      handleAnnouncementChange('bgColor', e.target.value);
                      handleAnnouncementChange('theme', 'custom');
                    }}
                    style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. #ea580c or linear-gradient(...)"
                    value={formData.announcement.bgColor || ''}
                    onChange={(e) => {
                      handleAnnouncementChange('bgColor', e.target.value);
                      handleAnnouncementChange('theme', 'custom');
                    }}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Text Color
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.announcement.textColor?.startsWith('#') ? formData.announcement.textColor : '#ffffff'}
                    onChange={(e) => handleAnnouncementChange('textColor', e.target.value)}
                    style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="#ffffff"
                    value={formData.announcement.textColor || '#ffffff'}
                    onChange={(e) => handleAnnouncementChange('textColor', e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Toggles */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              <input
                type="checkbox"
                checked={formData.announcement.showCodeBadge}
                onChange={(e) => handleAnnouncementChange('showCodeBadge', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--orange-500)' }}
              />
              <span>Show 1-Click Copy Promo Code Badge</span>
            </label>
          </div>

        </div>
      )}

      {/* 5. TAB 2: DISCOUNT PROMO CODES MANAGER */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add New Coupon Card */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Plus size={18} style={{ color: 'var(--orange-500)' }} /> Create New Discount Promo Code
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. FLASH25"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Discount Type
                </label>
                <select
                  className="form-control"
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, discountType: e.target.value }))}
                  style={{ fontWeight: 700 }}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Discount Value
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="20"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, discountValue: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Min. Order ($)
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="10"
                  value={newCoupon.minOrder}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, minOrder: e.target.value }))}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddCoupon}
                  className="btn btn-primary-orange"
                  style={{ width: '100%', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', height: '42px' }}
                >
                  <Plus size={16} /> Add Promo Code
                </button>
              </div>
            </div>
          </div>

          {/* Active Promo Codes List */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)', margin: '0 0 1rem' }}>
              Active Promo Codes ({formData.promoCodes.length})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {formData.promoCodes.map((coupon, idx) => (
                <div
                  key={coupon.code || idx}
                  style={{
                    background: coupon.isActive !== false ? '#ffffff' : '#f8fafc',
                    border: coupon.isActive !== false ? '1.5px solid var(--border-color)' : '1.5px dashed #cbd5e1',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <Tag size={15} style={{ color: 'var(--orange-500)' }} />
                        <strong style={{ fontSize: '1.1rem', color: 'var(--navy-950)', letterSpacing: '0.04em' }}>{coupon.code}</strong>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)' }}>
                        {coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(coupon.code)}
                      style={{
                        background: coupon.isActive !== false ? '#ecfdf5' : '#f1f5f9',
                        color: coupon.isActive !== false ? '#059669' : '#64748b',
                        border: 'none',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {coupon.isActive !== false ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {coupon.description || `Min. order $${coupon.minOrder || 0}`}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Min: ${coupon.minOrder || 0}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon.code)}
                      style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                      title="Delete code"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 6. TAB 3: VISITOR WELCOME CARD */}
      {activeTab === 'visitor_banner' && (
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                Visitor Welcome Discount Card
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Floating card in the bottom corner of the website welcoming new visitors with a discount coupon.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleBanner}
              style={{
                background: formData.promotionalBanner.enabled ? 'var(--orange-500)' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {formData.promotionalBanner.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
              <span>{formData.promotionalBanner.enabled ? 'Visible to Visitors' : 'Disabled / Hidden'}</span>
            </button>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
              Card Title
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.promotionalBanner.title}
              onChange={(e) => handleBannerChange('title', e.target.value)}
              placeholder="e.g. First-Time Client Welcome Offer"
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
              Offer Description
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.promotionalBanner.description}
              onChange={(e) => handleBannerChange('description', e.target.value)}
              placeholder="e.g. Enjoy 20% off your first digitizing file or vector redraw with free unlimited revisions."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                Promo Code
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.promotionalBanner.promoCode}
                onChange={(e) => handleBannerChange('promoCode', e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                Button Text
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.promotionalBanner.ctaText}
                onChange={(e) => handleBannerChange('ctaText', e.target.value)}
                placeholder="e.g. Start Your Order"
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default PromotionsManager;
