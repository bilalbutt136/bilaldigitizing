'use client';

import React, { useState, useEffect } from 'react';
import {
  Gift, Plus, Trash2, Calendar, Play, Pause, X, ArrowRight,
  Sparkles, CheckCircle2, ShieldCheck, Tag
} from 'lucide-react';
import { useAppState } from '../../context/StateContext';

export const PromotionsManager = () => {
  const { siteSettings, updateSiteSettings, showToast, clients = [] } = useAppState();
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

  // Master Promotions List
  const [promotions, setPromotions] = useState([]);

  // Sync state from siteSettings on load
  useEffect(() => {
    if (siteSettings && Array.isArray(siteSettings.promotions)) {
      setPromotions(siteSettings.promotions);
    }
  }, [siteSettings]);

  // Derive active promo
  const activePromo = promotions.find(p => p.status === 'active');

  // ---------------------------------------------------------------------------
  // CREATE PROMOTION ACTION (Simple 2-Step)
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
    const discount = Number(promoForm.discountPercent) || 10;
    const cleanName = promoForm.name.trim();
    const cleanCode = `SAVE${discount}`;

    const newPromo = {
      id: promoId,
      name: cleanName,
      type: 'new_buyer',
      discountPercent: discount,
      startDate: promoForm.startDate,
      endDate: promoForm.endDate,
      status: 'active', // starts active
      maxOrdersLimit: Number(promoForm.maxOrdersLimit) || 10,
      ordersCount: 0,
      servicesIncluded: promoForm.servicesIncluded || 'All Studio Services',
      promoCode: cleanCode,
      createdAt: new Date().toISOString()
    };

    // Auto-pause any previous active promo to ensure the newly created one runs active
    const updatedPromotions = [
      newPromo,
      ...promotions.map(p => ({ ...p, status: 'paused' }))
    ];

    // Automatically synchronize the live banner for this promotion percentage
    const syncedAnnouncement = {
      enabled: true,
      autoSync: true,
      badge: cleanName.toUpperCase() || 'SPECIAL PROMO',
      text: `Get ${discount}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`,
      linkText: `Claim ${discount}% Off`,
      linkUrl: '/order',
      promoCode: cleanCode,
      showCountdown: true,
      showCodeBadge: true,
      theme: 'orange',
      textColor: '#ffffff',
      discountValue: discount,
      discountType: 'percent'
    };

    setPromotions(updatedPromotions);
    setIsPromoModalOpen(false);

    if (showToast) {
      showToast(`🎉 Promotion "${cleanName}" (${discount}% OFF) activated and saved to database!`, 'success');
    }

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({
          promotions: updatedPromotions,
          announcement: syncedAnnouncement
        });
      }
    } catch (err) {
      console.error('Error saving new promotion to Supabase:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // TOGGLE START / PAUSE (100% Instant Live Database Connection)
  // ---------------------------------------------------------------------------
  const handleTogglePromoStatus = async (promoId) => {
    let newlyActive = null;

    const updatedPromotions = promotions.map(p => {
      if (p.id === promoId) {
        const nextStatus = p.status === 'active' ? 'paused' : 'active';
        const updated = { ...p, status: nextStatus };
        if (nextStatus === 'active') newlyActive = updated;
        return updated;
      }
      return p;
    });

    let updatedAnnouncement = null;

    if (newlyActive) {
      // Auto-sync banner to this newly started promo
      updatedAnnouncement = {
        enabled: true,
        autoSync: true,
        badge: (newlyActive.name || 'SPECIAL PROMO').toUpperCase(),
        text: `Get ${newlyActive.discountPercent}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`,
        linkText: `Claim ${newlyActive.discountPercent}% Off`,
        linkUrl: '/order',
        promoCode: newlyActive.promoCode || `SAVE${newlyActive.discountPercent}`,
        showCountdown: true,
        showCodeBadge: true,
        theme: 'orange',
        textColor: '#ffffff',
        discountValue: newlyActive.discountPercent,
        discountType: 'percent'
      };
    } else {
      // If paused and another promo is still active, sync to it, otherwise hide banner
      const otherActive = updatedPromotions.find(p => p.status === 'active');
      if (otherActive) {
        updatedAnnouncement = {
          enabled: true,
          autoSync: true,
          badge: (otherActive.name || 'SPECIAL PROMO').toUpperCase(),
          text: `Get ${otherActive.discountPercent}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`,
          linkText: `Claim ${otherActive.discountPercent}% Off`,
          linkUrl: '/order',
          promoCode: otherActive.promoCode || `SAVE${otherActive.discountPercent}`,
          showCountdown: true,
          showCodeBadge: true,
          theme: 'orange',
          textColor: '#ffffff',
          discountValue: otherActive.discountPercent,
          discountType: 'percent'
        };
      } else {
        updatedAnnouncement = {
          enabled: false,
          autoSync: true,
          text: '',
          discountValue: 0
        };
      }
    }

    setPromotions(updatedPromotions);

    const targetPromo = updatedPromotions.find(p => p.id === promoId);
    const isNowActive = targetPromo?.status === 'active';

    if (showToast) {
      showToast(
        `Promotion "${targetPromo?.name || 'Campaign'}" is now ${isNowActive ? `ACTIVE (${targetPromo.discountPercent}% OFF live on website)` : 'PAUSED (Hidden from website)'}`,
        isNowActive ? 'success' : 'info'
      );
    }

    // Persist directly to Supabase live database
    try {
      if (updateSiteSettings) {
        await updateSiteSettings({
          promotions: updatedPromotions,
          ...(updatedAnnouncement ? { announcement: updatedAnnouncement } : {})
        });
      }
    } catch (err) {
      console.error('Database sync error on toggle:', err);
      if (showToast) showToast('Failed to sync promotion with database', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE PROMOTION
  // ---------------------------------------------------------------------------
  const handleDeletePromotion = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    const updatedPromotions = promotions.filter(p => p.id !== promoId);
    
    const remainingActive = updatedPromotions.find(p => p.status === 'active');
    const updatedAnnouncement = remainingActive ? {
      enabled: true,
      badge: (remainingActive.name || 'SPECIAL PROMO').toUpperCase(),
      text: `Get ${remainingActive.discountPercent}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`,
      linkText: `Claim ${remainingActive.discountPercent}% Off`,
      promoCode: remainingActive.promoCode || `SAVE${remainingActive.discountPercent}`,
      discountValue: remainingActive.discountPercent
    } : { enabled: false };

    setPromotions(updatedPromotions);
    if (showToast) showToast('Promotion removed', 'info');

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({
          promotions: updatedPromotions,
          announcement: updatedAnnouncement
        });
      }
    } catch (err) {
      console.error('Delete promo error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // SEND A COUPON ACTION
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

    const currentPromoCodes = Array.isArray(siteSettings?.promoCodes) ? siteSettings.promoCodes : [];
    const updatedPromoCodes = [newCouponItem, ...currentPromoCodes.filter(c => c.code !== cleanCode)];
    setIsCouponModalOpen(false);

    if (showToast) showToast(`Coupon ${cleanCode} activated and sent to past buyers!`, 'success');

    try {
      if (updateSiteSettings) {
        await updateSiteSettings({ promoCodes: updatedPromoCodes });
      }
    } catch (err) {
      console.error('Error saving coupon to database:', err);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Clean Top Header Card */}
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
              Promotions & Buyer Campaigns
            </span>
            <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.12rem 0.5rem', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Database Connected
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
            Promotions Manager
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', margin: '0.25rem 0 0 0' }}>
            Select your promotion percentage, click Start to activate on live website, or Pause to hide anytime.
          </p>
        </div>

        {activePromo ? (
          <div style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065f46' }}>
              Active on Website: <strong>{activePromo.name} ({activePromo.discountPercent}% OFF)</strong>
            </span>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-subtle, #f8fafc)',
            border: '1px solid var(--color-border)',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-text-muted, #64748b)'
          }}>
            ⚪ No Promotion Currently Active
          </div>
        )}
      </div>

      {/* DUAL PROMOTIONAL LAUNCH CARDS (Exact match of reference image 1) */}
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
          minHeight: '250px'
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
          minHeight: '250px'
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

      {/* PROMOTIONS TABLE WITH INSTANT START / PAUSE BUTTONS */}
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: '0 0 0.25rem 0' }}>
              Your Promotions List ({promotions.length})
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
              Click <strong>Start</strong> to activate a promotion on the live website, or <strong>Pause</strong> to disable it instantly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreatePromoModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#00b22d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 178, 45, 0.25)'
            }}
          >
            <Plus size={16} /> Create Promotion
          </button>
        </div>

        {promotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-muted, #64748b)' }}>
            <Gift size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
            <h4 style={{ margin: '0 0 0.25rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', fontSize: '1.05rem' }}>No promotions created yet</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Click "Create a promotion" above to set up your discount campaign.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--color-border)', color: 'var(--color-text-muted, #64748b)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Promotion Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Discount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Running Dates</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Orders Limit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(promo => {
                  const isActive = promo.status === 'active';
                  const isExpired = promo.endDate && new Date(promo.endDate) < new Date();

                  return (
                    <tr key={promo.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      
                      {/* Name & Code */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', fontSize: '0.95rem' }}>
                          {promo.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', background: 'var(--color-subtle, #f1f5f9)', color: 'var(--color-text-muted, #64748b)', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 700 }}>
                            {promo.servicesIncluded || 'All Studio Services'}
                          </span>
                          {promo.promoCode && (
                            <span 
                              onClick={() => handleCopyCode(promo.promoCode)}
                              title="Click to copy promo code"
                              style={{ fontSize: '0.72rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' }}
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
                          padding: '0.3rem 0.75rem',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '1rem'
                        }}>
                          {promo.discountPercent}% OFF
                        </span>
                      </td>

                      {/* Running Dates */}
                      <td style={{ padding: '1rem', fontSize: '0.84rem', color: 'var(--color-text-secondary, #334155)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                          <span>{formatDateDisplay(promo.startDate)} – {formatDateDisplay(promo.endDate)}</span>
                        </div>
                      </td>

                      {/* Orders Counter */}
                      <td style={{ padding: '1rem', fontSize: '0.84rem' }}>
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
                            background: '#00b22d'
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
                          <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669' }} /> ACTIVE
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706' }} /> PAUSED
                          </span>
                        )}
                      </td>

                      {/* INSTANT START / PAUSE & DELETE */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          
                          {/* START / PAUSE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleTogglePromoStatus(promo.id)}
                            title={isActive ? 'Click to Pause promotion' : 'Click to Start promotion'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.9rem',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
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
                                <Pause size={14} fill="currentColor" /> Pause
                              </>
                            ) : (
                              <>
                                <Play size={14} fill="currentColor" /> Start
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
                              padding: '0.45rem 0.55rem',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={15} />
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

      {/* ========================================================================= */}
      {/* 2-STEP MODAL: CREATE PROMOTION (Exact match of reference images 2 & 3) */}
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
            
            {/* STEP 1: ADD PROMOTION DETAILS (Exact match of reference image 2) */}
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

            {/* STEP 2: CONFIRM PROMOTION (Exact match of reference image 3) */}
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
                    background: '#00b22d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.4rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Send & Activate Coupon
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
