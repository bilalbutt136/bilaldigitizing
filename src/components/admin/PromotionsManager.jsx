'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, Trash2, CheckCircle2, Clock, Zap, Percent,
  Sliders, Save, Flame, Gift, ArrowRight, X, Play, Pause,
  Calendar, Users, Info, Sparkles, Send
} from 'lucide-react';
import { useAppState } from '../../context/StateContext';

const PRESET_THEMES = [
  { id: 'orange', name: '🔥 Electric Orange (High Conversion)', bg: 'linear-gradient(90deg, #ff7a00 0%, #ff4500 50%, #ff7a00 100%)', badgeBg: '#ffffff', badgeColor: '#ea580c' },
  { id: 'emerald', name: '💎 Emerald Prime (Luxury & Fresh)', bg: 'linear-gradient(90deg, #059669 0%, #047857 50%, #065f46 100%)', badgeBg: 'rgba(255,255,255,0.25)', badgeColor: '#ffffff' },
  { id: 'indigo', name: '⚡ Cyber Violet (Tech & Modern)', bg: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)', badgeBg: 'rgba(255,255,255,0.25)', badgeColor: '#ffffff' },
  { id: 'dark', name: '👑 Midnight Gold (Commercial Exclusive)', bg: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #090d16 100%)', badgeBg: '#fbbf24', badgeColor: '#0f172a' }
];

export const PromotionsManager = () => {
  const { siteSettings, updateSiteSettings, openOrderWizard, showToast, clients = [] } = useAppState();
  const [activeTab, setActiveTab] = useState('promotions'); // 'promotions' | 'coupons' | 'announcement' | 'volume_tiers'
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // 2-Step Modal states for "Create a promotion"
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoWizardStep, setPromoWizardStep] = useState(1); // 1: details, 2: confirm

  // Modal states for "Send a coupon"
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Calculate default dates
  const today = new Date();
  const defaultStartStr = today.toISOString().split('T')[0];
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 30);
  const defaultEndStr = defaultEnd.toISOString().split('T')[0];

  const [promoForm, setPromoForm] = useState({
    name: '',
    discountPercent: 10,
    startDate: defaultStartStr,
    endDate: defaultEndStr,
    servicesIncluded: 'All Studio Services',
    maxOrdersLimit: 10
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 15,
    serviceScope: 'all',
    targetAudience: 'all_past_buyers',
    expiresAt: defaultEndStr,
    description: 'Exclusive loyalty discount for past clients'
  });

  // Master Local State
  const [formData, setFormData] = useState({
    promotions: [],
    announcement: {
      enabled: true,
      badge: 'LIMITED TIME DEAL',
      text: 'Get 20% OFF on your first Embroidery Digitizing or Vector Art order!',
      linkText: 'Claim 20% Off',
      linkUrl: '/order',
      promoCode: 'WELCOME20',
      showCountdown: true,
      showCodeBadge: true,
      theme: 'orange',
      textColor: '#ffffff'
    },
    promoCodes: [
      {
        code: 'WELCOME20',
        discountType: 'percent',
        discountValue: 20,
        minOrder: 10,
        serviceScope: 'all',
        description: '20% off introductory discount for new embroidery & vector orders',
        isActive: true
      },
      {
        code: 'BULK15',
        discountType: 'percent',
        discountValue: 15,
        minOrder: 40,
        serviceScope: 'embroidery',
        description: '15% off embroidery digitizing on orders over $40',
        isActive: true
      },
      {
        code: 'VECTOR10',
        discountType: 'fixed',
        discountValue: 10,
        minOrder: 30,
        serviceScope: 'vector',
        description: '$10 off vector conversion and line art recreation',
        isActive: true
      }
    ],
    volumeDiscounts: {
      enabled: true,
      tier1Min: 3, tier1Percent: 5,
      tier2Min: 5, tier2Percent: 10,
      tier3Min: 10, tier3Percent: 15,
      tier4Min: 25, tier4Percent: 25,
      tier5Min: 50, tier5Percent: 35
    }
  });

  // Multi-Design Volume Calculator State
  const [calcQty, setCalcQty] = useState(5);
  const [calcBaseRate, setCalcBaseRate] = useState(20);

  // Sync state from siteSettings on load
  useEffect(() => {
    if (siteSettings) {
      setFormData(prev => ({
        ...prev,
        promotions: Array.isArray(siteSettings.promotions) ? siteSettings.promotions : (prev.promotions || []),
        announcement: siteSettings.announcement ? { ...prev.announcement, ...siteSettings.announcement } : prev.announcement,
        promoCodes: Array.isArray(siteSettings.promoCodes) && siteSettings.promoCodes.length > 0 ? siteSettings.promoCodes : prev.promoCodes,
        volumeDiscounts: siteSettings.volumeDiscounts ? { ...prev.volumeDiscounts, ...siteSettings.volumeDiscounts } : prev.volumeDiscounts
      }));
    }
  }, [siteSettings]);

  // ---------------------------------------------------------------------------
  // PROMOTIONS ACTIONS (100% Instant Live Connection)
  // ---------------------------------------------------------------------------
  const handleOpenCreatePromoModal = () => {
    setPromoForm({
      name: '',
      discountPercent: 10,
      startDate: defaultStartStr,
      endDate: defaultEndStr,
      servicesIncluded: 'All Studio Services',
      maxOrdersLimit: 10
    });
    setPromoWizardStep(1);
    setIsPromoModalOpen(true);
  };

  const handleReviewPromoDetails = (e) => {
    e?.preventDefault();
    if (!promoForm.name.trim()) {
      if (showToast) showToast('Please enter a promotion name (up to 15 characters)', 'warning');
      return;
    }
    setPromoWizardStep(2);
  };

  const handleConfirmPromotion = async () => {
    const promoId = `promo_${Date.now()}`;
    const codeGen = `PROMO${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newPromo = {
      id: promoId,
      name: promoForm.name.trim(),
      type: 'new_buyer',
      discountPercent: Number(promoForm.discountPercent) || 10,
      startDate: promoForm.startDate,
      endDate: promoForm.endDate,
      status: 'active',
      maxOrdersLimit: Number(promoForm.maxOrdersLimit) || 10,
      ordersCount: 0,
      servicesIncluded: promoForm.servicesIncluded || 'All Studio Services',
      promoCode: codeGen,
      createdAt: new Date().toISOString()
    };

    const updatedPromotions = [newPromo, ...formData.promotions];
    setFormData(prev => ({ ...prev, promotions: updatedPromotions }));
    setIsPromoModalOpen(false);

    if (showToast) showToast(`Promotion "${newPromo.name}" created and activated!`, 'success');

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promotions: updatedPromotions });
      }
    } catch (err) {
      console.error('Error saving new promotion:', err);
    }
  };

  const handleTogglePromoStatus = async (promoId) => {
    const updatedPromotions = formData.promotions.map(p => {
      if (p.id === promoId) {
        const nextStatus = p.status === 'active' ? 'paused' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    });

    // 100% Instant optimistic local state update
    setFormData(prev => ({ ...prev, promotions: updatedPromotions }));
    const targetPromo = updatedPromotions.find(p => p.id === promoId);
    const isNowActive = targetPromo?.status === 'active';

    if (showToast) {
      showToast(`Promotion "${targetPromo?.name || 'Campaign'}" is now ${isNowActive ? 'ACTIVE (Live on website)' : 'PAUSED (Hidden)'}`, isNowActive ? 'success' : 'info');
    }

    // Instant save to Supabase live database
    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promotions: updatedPromotions });
      }
    } catch (err) {
      console.error('Error toggling promotion status in Supabase:', err);
      if (showToast) showToast('Failed to sync promotion status with database', 'error');
    }
  };

  const handleDeletePromotion = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    const updatedPromotions = formData.promotions.filter(p => p.id !== promoId);
    setFormData(prev => ({ ...prev, promotions: updatedPromotions }));
    if (showToast) showToast('Promotion removed', 'info');

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promotions: updatedPromotions });
      }
    } catch (err) {
      console.error('Delete promo error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // COUPONS ACTIONS
  // ---------------------------------------------------------------------------
  const handleOpenSendCouponModal = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCouponForm({
      code: `LOYAL${randomSuffix}`,
      discountType: 'percent',
      discountValue: 10,
      minOrder: 15,
      serviceScope: 'all',
      targetAudience: 'all_past_buyers',
      expiresAt: defaultEndStr,
      description: 'Exclusive loyalty discount for past clients'
    });
    setIsCouponModalOpen(true);
  };

  const handleSendCouponSubmit = async (e) => {
    e?.preventDefault();
    const cleanCode = (couponForm.code || '').trim().toUpperCase();
    const newCouponItem = {
      code: cleanCode,
      discountType: couponForm.discountType || 'percent',
      discountValue: Number(couponForm.discountValue) || 10,
      minOrder: Number(couponForm.minOrder) || 0,
      serviceScope: couponForm.serviceScope || 'all',
      description: couponForm.description.trim() || `${cleanCode} Loyalty Coupon`,
      expiresAt: couponForm.expiresAt,
      isActive: true
    };

    const updatedPromoCodes = [newCouponItem, ...formData.promoCodes.filter(c => c.code !== cleanCode)];
    setFormData(prev => ({ ...prev, promoCodes: updatedPromoCodes }));
    setIsCouponModalOpen(false);

    if (showToast) showToast(`Coupon ${cleanCode} activated and sent to past buyers!`, 'success');

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promoCodes: updatedPromoCodes });
      }
    } catch (err) {
      console.error('Error saving coupon:', err);
    }
  };

  const handleToggleCoupon = async (codeToToggle) => {
    const updatedPromoCodes = formData.promoCodes.map(c =>
      c.code === codeToToggle ? { ...c, isActive: !c.isActive } : c
    );
    setFormData(prev => ({ ...prev, promoCodes: updatedPromoCodes }));

    const targetCoupon = updatedPromoCodes.find(c => c.code === codeToToggle);
    if (showToast) {
      showToast(`Coupon ${codeToToggle} is now ${targetCoupon?.isActive ? 'ACTIVE' : 'PAUSED'}`, 'info');
    }

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promoCodes: updatedPromoCodes });
      }
    } catch (err) {
      console.error('Error toggling coupon:', err);
    }
  };

  const handleDeleteCoupon = async (codeToDelete) => {
    if (!confirm(`Delete coupon ${codeToDelete}?`)) return;
    const updatedPromoCodes = formData.promoCodes.filter(c => c.code !== codeToDelete);
    setFormData(prev => ({ ...prev, promoCodes: updatedPromoCodes }));
    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promoCodes: updatedPromoCodes });
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // SAVE ALL SETTINGS
  // ---------------------------------------------------------------------------
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const payload = {
        promotions: formData.promotions,
        announcement: formData.announcement,
        promoCodes: formData.promoCodes,
        volumeDiscounts: formData.volumeDiscounts
      };
      if (updateSiteSettings) {
        await updateSiteSettings(payload);
        if (showToast) showToast('All Promotions & Discounts successfully synced to live website!', 'success');
      }
    } catch (err) {
      console.error('Save all promotions error:', err);
      if (showToast) showToast('Failed to save promotions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeTheme = PRESET_THEMES.find(t => t.id === formData.announcement.theme) || PRESET_THEMES[0];
  const bgToUse = activeTheme.bg;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1.5px solid var(--color-border)',
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
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Revenue & Conversion Suite
            </span>
            <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
              Live Production Synced
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
            Promotions, Coupons & Commercial Volume Tiers
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', margin: '0.25rem 0 0 0' }}>
            Control buyer promotions, coupons with instant Start/Pause buttons, and flash banners.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={loading}
            style={{
              fontWeight: 800,
              padding: '0.65rem 1.5rem',
              fontSize: '0.9rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px var(--color-primary-glow)',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            <Save size={16} />
            <span>{loading ? 'Saving to Database...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1.5px solid var(--color-border)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('promotions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.15rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'promotions' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'promotions' ? '#ffffff' : 'var(--color-text-secondary, #334155)',
            boxShadow: activeTab === 'promotions' ? '0 2px 8px var(--color-primary-glow)' : 'none'
          }}
        >
          <Gift size={16} />
          <span>Promotions & Buyer Deals ({formData.promotions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.15rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'coupons' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'coupons' ? '#ffffff' : 'var(--color-text-secondary, #334155)',
            boxShadow: activeTab === 'coupons' ? '0 2px 8px var(--color-primary-glow)' : 'none'
          }}
        >
          <Tag size={16} />
          <span>Coupons Hub ({formData.promoCodes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.15rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'announcement' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'announcement' ? '#ffffff' : 'var(--color-text-secondary, #334155)',
            boxShadow: activeTab === 'announcement' ? '0 2px 8px var(--color-primary-glow)' : 'none'
          }}
        >
          <Flame size={16} />
          <span>Header Announcement Ribbon</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('volume_tiers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.15rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'volume_tiers' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'volume_tiers' ? '#ffffff' : 'var(--color-text-secondary, #334155)',
            boxShadow: activeTab === 'volume_tiers' ? '0 2px 8px var(--color-primary-glow)' : 'none'
          }}
        >
          <Percent size={16} />
          <span>Commercial Volume Discounts</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROMOTIONS & BUYER DEALS (EXACT REPLICA OF USER SCREENSHOTS) */}
      {/* ========================================================================= */}
      {activeTab === 'promotions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* DUAL LAUNCH CARDS (media_1787326604604.png) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            
            {/* Card 1: New buyer promotion */}
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              minHeight: '260px'
            }}>
              <div>
                <div style={{ marginBottom: '1.25rem', color: 'var(--color-text-primary, #1e293b)' }}>
                  <Gift size={32} strokeWidth={1.75} />
                </div>

                <h3 style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary, #1e293b)',
                  margin: '0 0 0.5rem 0'
                }}>
                  New buyer promotion
                </h3>

                <p style={{
                  fontSize: '0.92rem',
                  color: 'var(--color-text-secondary, #475569)',
                  lineHeight: 1.45,
                  margin: '0 0 1.25rem 0'
                }}>
                  Boost orders by offering a discount to first-time buyers.{' '}
                  <span style={{ textDecoration: 'underline', color: 'var(--color-text-primary, #0f172a)', fontWeight: 600, cursor: 'pointer' }}>
                    Learn more
                  </span>
                </p>

                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--color-text-muted, #64748b)',
                  margin: '0 0 1.5rem 0'
                }}>
                  You can have up to 5 promotions at a time.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreatePromoModal}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Create a promotion
              </button>
            </div>

            {/* Card 2: Coupons for past buyers */}
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              minHeight: '260px'
            }}>
              <div>
                <div style={{ marginBottom: '1.25rem', color: 'var(--color-text-primary, #1e293b)' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid currentColor',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontWeight: 900,
                    fontSize: '1.1rem'
                  }}>
                    5%
                  </div>
                </div>

                <h3 style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary, #1e293b)',
                  margin: '0 0 0.5rem 0'
                }}>
                  Coupons for past buyers
                </h3>

                <p style={{
                  fontSize: '0.92rem',
                  color: 'var(--color-text-secondary, #475569)',
                  lineHeight: 1.45,
                  margin: '0 0 1.25rem 0'
                }}>
                  Offer an incentive for buyers to place another order.{' '}
                  <span style={{ textDecoration: 'underline', color: 'var(--color-text-primary, #0f172a)', fontWeight: 600, cursor: 'pointer' }}>
                    Learn more
                  </span>
                </p>

                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--color-text-muted, #64748b)',
                  margin: '0 0 1.5rem 0'
                }}>
                  5 coupons available this month.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenSendCouponModal}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Send a coupon
              </button>
            </div>

          </div>

          {/* ACTIVE PROMOTIONS TABLE WITH INSTANT START / PAUSE BUTTONS */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: '0 0 0.25rem 0' }}>
                  Live Active Promotions & Buyer Campaigns
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
                  Click Start or Pause to toggle promotion status with 100% instant sync on the live website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreatePromoModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--color-subtle, #f1f5f9)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #0f172a)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Add New Promotion
              </button>
            </div>

            {formData.promotions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted, #64748b)' }}>
                <Gift size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ margin: '0 0 0.25rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>No promotions currently created</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Click "Create a promotion" above to boost first-time buyer conversions.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--color-border)', color: 'var(--color-text-muted, #64748b)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Promotion Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Discount</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Dates / Duration</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Orders Limit</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.promotions.map(promo => {
                      const isActive = promo.status === 'active';
                      const isExpired = promo.endDate && new Date(promo.endDate) < new Date();

                      return (
                        <tr key={promo.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          
                          {/* Name & Code */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', fontSize: '0.92rem' }}>
                              {promo.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', background: 'var(--color-subtle, #f1f5f9)', color: 'var(--color-text-muted, #64748b)', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 700 }}>
                                {promo.servicesIncluded || 'All Studio Services'}
                              </span>
                              {promo.promoCode && (
                                <span 
                                  onClick={() => handleCopyCode(promo.promoCode)}
                                  title="Click to copy code"
                                  style={{ fontSize: '0.72rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' }}
                                >
                                  {promo.promoCode} {copiedCode === promo.promoCode ? '✓' : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Discount % */}
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontWeight: 900,
                              fontSize: '0.95rem'
                            }}>
                              {promo.discountPercent}% OFF
                            </span>
                          </td>

                          {/* Running Dates */}
                          <td style={{ padding: '1rem', fontSize: '0.82rem', color: 'var(--color-text-secondary, #334155)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
                              <span>{formatDateDisplay(promo.startDate)} – {formatDateDisplay(promo.endDate)}</span>
                            </div>
                          </td>

                          {/* Orders Counter */}
                          <td style={{ padding: '1rem', fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                              {promo.ordersCount || 0} / {promo.maxOrdersLimit || 10} orders
                            </div>
                            <div style={{
                              width: '100px',
                              height: '6px',
                              background: 'var(--color-subtle, #e2e8f0)',
                              borderRadius: '9999px',
                              marginTop: '0.3rem',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(100, ((promo.ordersCount || 0) / (promo.maxOrdersLimit || 10)) * 100)}%`,
                                height: '100%',
                                background: 'var(--color-primary)'
                              }} />
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '1rem' }}>
                            {isExpired ? (
                              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                                EXPIRED
                              </span>
                            ) : isActive ? (
                              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} /> ACTIVE
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }} /> PAUSED
                              </span>
                            )}
                          </td>

                          {/* INSTANT START / PAUSE & DELETE ACTIONS */}
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              
                              {/* 100% INSTANT START / PAUSE BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleTogglePromoStatus(promo.id)}
                                title={isActive ? 'Click to Pause promotion' : 'Click to Start / Resume promotion'}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  background: isActive ? '#fffbeb' : '#ecfdf5',
                                  color: isActive ? '#b45309' : '#047857',
                                  border: `1.5px solid ${isActive ? '#fde68a' : '#a7f3d0'}`
                                }}
                              >
                                {isActive ? (
                                  <>
                                    <Pause size={13} fill="currentColor" /> Pause
                                  </>
                                ) : (
                                  <>
                                    <Play size={13} fill="currentColor" /> Start
                                  </>
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeletePromotion(promo.id)}
                                title="Delete Promotion"
                                style={{
                                  background: 'transparent',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '8px',
                                  padding: '0.4rem 0.5rem',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER COUPON CODES HUB */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: '0 0 0.25rem 0' }}>
                  Client Coupon Codes & Loyalty Rewards
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
                  Manage discount codes redeemable by apparel decorators during checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenSendCouponModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px var(--color-primary-glow)'
                }}
              >
                <Plus size={15} /> Send a Coupon
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {formData.promoCodes.map((coupon, idx) => {
                const isActive = coupon.isActive !== false;
                const isPercent = coupon.discountType === 'percent';
                const discountDisplay = isPercent ? `${coupon.discountValue}% OFF` : `$${Number(coupon.discountValue).toFixed(2)} OFF`;

                return (
                  <div key={idx} style={{
                    background: isActive ? 'var(--color-surface, #ffffff)' : 'var(--color-subtle, #f8fafc)',
                    border: `1.5px solid ${isActive ? 'var(--color-border)' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    opacity: isActive ? 1 : 0.75
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span 
                          onClick={() => handleCopyCode(coupon.code)}
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 900,
                            fontFamily: 'monospace',
                            color: 'var(--color-primary)',
                            background: 'var(--color-primary-light)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {coupon.code} {copiedCode === coupon.code ? '✓' : ''}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: isActive ? '#ecfdf5' : '#f1f5f9',
                          color: isActive ? '#059669' : '#64748b',
                          border: `1px solid ${isActive ? '#a7f3d0' : '#cbd5e1'}`
                        }}>
                          {isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </div>

                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', marginBottom: '0.35rem' }}>
                        {discountDisplay}
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #475569)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                        {coupon.description || 'Promotional coupon code'}
                      </p>

                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                        Min spend: ${coupon.minOrder || 0} • Scope: {coupon.serviceScope === 'all' ? 'All Services' : coupon.serviceScope}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(coupon.code)}
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          border: '1px solid var(--color-border)',
                          background: 'transparent',
                          color: 'var(--color-text-primary, #0f172a)',
                          cursor: 'pointer'
                        }}
                      >
                        {isActive ? 'Pause Code' : 'Start Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon.code)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HEADER ANNOUNCEMENT RIBBON */}
      {/* ========================================================================= */}
      {activeTab === 'announcement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Preview Box */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                Live Visitor Announcement Banner Preview:
              </span>
              <span style={{ fontSize: '0.75rem', color: formData.announcement.enabled ? '#059669' : '#ef4444', fontWeight: 800 }}>
                {formData.announcement.enabled ? '● Currently Active on Website' : '○ Currently Hidden'}
              </span>
            </div>

            <div style={{
              background: bgToUse,
              color: formData.announcement.textColor || '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              fontSize: '0.86rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              {formData.announcement.badge && (
                <div style={{ background: activeTheme.badgeBg || 'rgba(255,255,255,0.25)', color: activeTheme.badgeColor || '#ffffff', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Flame size={12} />
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

          {/* Banner Settings Form */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: '0 0 1.25rem 0' }}>
              Top Announcement Banner Configuration
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.announcement.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement, enabled: e.target.checked }
                    }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: formData.announcement.enabled ? '#059669' : 'var(--color-text-muted)' }}>
                    {formData.announcement.enabled ? 'Banner Active (Live)' : 'Banner Hidden'}
                  </span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', marginBottom: '0.4rem' }}>
                  Campaign Badge Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. FLASH SALE"
                  value={formData.announcement.badge}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement, badge: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text-primary, #0f172a)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', marginBottom: '0.4rem' }}>
                  Promo Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={formData.announcement.promoCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement, promoCode: e.target.value.toUpperCase() }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text-primary, #0f172a)',
                    fontSize: '0.88rem',
                    fontWeight: 800
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', marginBottom: '0.4rem' }}>
                  Announcement Text
                </label>
                <input
                  type="text"
                  value={formData.announcement.text}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement, text: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text-primary, #0f172a)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', marginBottom: '0.4rem' }}>
                  Theme Preset
                </label>
                <select
                  value={formData.announcement.theme}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement, theme: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text-primary, #0f172a)',
                    fontSize: '0.88rem'
                  }}
                >
                  {PRESET_THEMES.map(th => (
                    <option key={th.id} value={th.id}>{th.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', marginBottom: '0.4rem' }}>
                  Action Button Text
                </label>
                <input
                  type="text"
                  value={formData.announcement.linkText}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement, linkText: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text-primary, #0f172a)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', marginBottom: '0.4rem' }}>
                  Destination Link
                </label>
                <input
                  type="text"
                  value={formData.announcement.linkUrl}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement, linkUrl: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text-primary, #0f172a)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMMERCIAL VOLUME DISCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'volume_tiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={18} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
                Automated Multi-Design Bulk Tiers (Commercial B2B Standard)
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #475569)', margin: '0.35rem 0 1.25rem 0', lineHeight: 1.55 }}>
              Commercial apparel decorators and uniform contractors frequently order multiple logos in a single order. These volume tiers automatically reward multi-design batch orders without requiring manual discount codes.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[1, 2, 3, 4, 5].map(tier => (
                <div key={tier} style={{
                  background: 'var(--color-subtle, #f8fafc)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', fontSize: '0.9rem' }}>Tier {tier}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      {formData.volumeDiscounts[`tier${tier}Percent`]}% OFF
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                    <strong>{formData.volumeDiscounts[`tier${tier}Min`]}+ Designs</strong> in same order
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Calculator Simulator */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Zap size={18} style={{ color: 'var(--color-primary)' }} />
              Live Multi-Design Volume Calculator Simulator
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', display: 'block', marginBottom: '0.25rem' }}>
                  Simulated Design Quantity:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 800, background: 'var(--color-surface, #ffffff)', color: 'var(--color-text-primary, #0f172a)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', display: 'block', marginBottom: '0.25rem' }}>
                  Base Rate Per Design ($):
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={calcBaseRate}
                  onChange={(e) => setCalcBaseRate(Math.max(5, parseFloat(e.target.value) || 20))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 800, background: 'var(--color-surface, #ffffff)', color: 'var(--color-text-primary, #0f172a)' }}
                />
              </div>

              {/* Computed Breakdown */}
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
                  <div style={{ background: 'var(--color-subtle, #f8fafc)', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>Automated Pricing Output:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', textDecoration: discountPct > 0 ? 'line-through' : 'none' }}>
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
          style={{
            fontWeight: 800,
            padding: '0.75rem 2.25rem',
            fontSize: '0.95rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-primary)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 16px var(--color-primary-glow)',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          <Save size={18} />
          <span>{loading ? 'Saving Changes...' : 'Save All Promotions to Live Website'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2-STEP MODAL: CREATE PROMOTION (media_1787326924982.png & media_1787326990955.png) */}
      {/* ========================================================================= */}
      {isPromoModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            
            {/* STEP 1: ADD PROMOTION DETAILS (media_1787326924982.png) */}
            {promoWizardStep === 1 && (
              <form onSubmit={handleReviewPromoDetails}>
                
                <div style={{
                  padding: '1.5rem 1.5rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)' }}>
                    Add promotion details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted, #64748b)',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
                  
                  {/* Field 1: Promotion name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.15rem' }}>
                      Promotion name
                    </label>
                    <p style={{ margin: '0 0 0.45rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                      This is only visible to you.
                    </p>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="Example: 'Summer sale'"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid var(--color-border)',
                        background: 'var(--color-surface, #ffffff)',
                        color: 'var(--color-text-primary, #0f172a)',
                        fontSize: '0.92rem'
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)', marginTop: '0.25rem' }}>
                      {promoForm.name.length}/15
                    </div>
                  </div>

                  {/* Field 2: Discount */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.45rem' }}>
                      Discount
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {[5, 10, 15, 20].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPromoForm(prev => ({ ...prev, discountPercent: val }))}
                          style={{
                            flex: 1,
                            minWidth: '70px',
                            padding: '0.7rem 1rem',
                            borderRadius: '8px',
                            border: `1.5px solid ${promoForm.discountPercent === val ? '#00b22d' : 'var(--color-border)'}`,
                            background: promoForm.discountPercent === val ? 'rgba(0, 178, 45, 0.06)' : 'var(--color-surface, #ffffff)',
                            color: promoForm.discountPercent === val ? '#00b22d' : 'var(--color-text-primary, #1e293b)',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                          }}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 3: Promotion dates */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.15rem' }}>
                      Promotion dates
                    </label>
                    <p style={{ margin: '0 0 0.45rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                      Selected dates will reflect your current time zone.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <input
                        type="date"
                        value={promoForm.startDate}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid var(--color-border)',
                          background: 'var(--color-surface, #ffffff)',
                          color: 'var(--color-text-primary, #0f172a)',
                          fontSize: '0.85rem'
                        }}
                      />
                      <input
                        type="date"
                        value={promoForm.endDate}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid var(--color-border)',
                          background: 'var(--color-surface, #ffffff)',
                          color: 'var(--color-text-primary, #0f172a)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Rule Bullet Points */}
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-text-secondary, #475569)',
                    lineHeight: 1.5,
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '0.75rem'
                  }}>
                    <div style={{ marginBottom: '0.35rem' }}>• Promotions can last up to 30 days.</div>
                    <div>• If the monthly 10-order limit (across all promotions) is reached before the scheduled end date, all active promotions will end early.</div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-subtle, #f8fafc)'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary, #475569)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    style={{
                      background: '#00b22d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Review details
                  </button>
                </div>

              </form>
            )}

            {/* STEP 2: CONFIRM PROMOTION (media_1787326990955.png) */}
            {promoWizardStep === 2 && (
              <div>
                
                <div style={{
                  padding: '1.5rem 1.5rem 0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)' }}>
                      If everything looks good, confirm below
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)' }}>
                      Once your promotion is confirmed, you won&apos;t be able to edit it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted, #64748b)',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary, #1e293b)' }}>
                      Promotion name
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary, #1e293b)', fontWeight: 600 }}>
                      {promoForm.name}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary, #1e293b)' }}>
                      Discount
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary, #1e293b)', fontWeight: 600 }}>
                      {promoForm.discountPercent}%
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary, #1e293b)' }}>
                      Dates
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary, #1e293b)', fontWeight: 600 }}>
                      {formatDateDisplay(promoForm.startDate)} – {formatDateDisplay(promoForm.endDate)}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary, #1e293b)' }}>
                      Gigs included
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary, #1e293b)', fontWeight: 600 }}>
                      1 Gigs ({promoForm.servicesIncluded})
                    </span>
                  </div>

                </div>

                <div style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-subtle, #f8fafc)'
                }}>
                  <button
                    type="button"
                    onClick={() => setPromoWizardStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary, #475569)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPromotion}
                    style={{
                      background: '#00b22d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm promotion
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND A COUPON TO PAST BUYERS */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <form onSubmit={handleSendCouponSubmit}>
              <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)' }}>
                  Send a coupon to past buyers
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted, #64748b)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.35rem' }}>
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    value={couponForm.code}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border)',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.35rem' }}>
                      Discount Value
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.35rem' }}>
                      Type
                    </label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--color-border)' }}
                    >
                      <option value="percent">Percentage (% Off)</option>
                      <option value="fixed">Fixed Amount ($ Off)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.35rem' }}>
                    Target Audience
                  </label>
                  <select
                    value={couponForm.targetAudience}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--color-border)' }}
                  >
                    <option value="all_past_buyers">All Past Buyers ({clients.length} registered)</option>
                    <option value="active_last_30">Active in last 30 days</option>
                    <option value="vip_decorators">Top Volume Apparel Decorators</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1e293b)', marginBottom: '0.35rem' }}>
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={couponForm.expiresAt}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--color-subtle, #f8fafc)'
              }}>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary, #475569)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.4rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Send size={15} /> Send & Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PromotionsManager;
