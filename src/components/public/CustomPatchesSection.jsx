'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Truck,
  FileCheck,
  Zap,
  Trophy,
  UploadCloud,
  Layers,
  Package,
  ShieldCheck,
  Check,
  Image as ImageIcon
} from 'lucide-react';

export const CustomPatchesSection = () => {
  const navigate = useNavigate();
  const { patchCards = [], protectedNavigate, createOrder, showToast, openOrderWizard } = useAppState();

  const [selectedTierId, setSelectedTierId] = useState('patch-embroidered');
  const [quantity, setQuantity] = useState(100);
  const [backing, setBacking] = useState('Velcro Hook & Loop');
  const [borderType, setBorderType] = useState('Merrowed Die-Cut Border');
  const [patchSize, setPatchSize] = useState('3.5" x 3.5" (Standard)');
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState(null);
  const [patchNotes, setPatchNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const defaultPatchCards = [
    {
      id: 'patch-woven',
      title: 'Woven Patches',
      subTitle: 'Ideal for simple logos and bulk orders',
      icon: Zap,
      rate: '$1.50',
      unitPriceVal: 1.50,
      unit: '/ patch',
      delivery: '7–10 days turnaround',
      btnText: 'Order Woven',
      badge: 'ESSENTIAL',
      popular: false,
      features: [
        'Min. Qty: 50 Patches',
        '7–10 Business Days Turnaround',
        'Iron-on or heat-press backing',
        'Flat stitched edge detail'
      ]
    },
    {
      id: 'patch-embroidered',
      title: 'Embroidered Patches',
      subTitle: '3D raised thread texture & merrowed border',
      icon: Trophy,
      rate: '$2.50',
      unitPriceVal: 2.50,
      unit: '/ patch',
      delivery: '7–10 days turnaround',
      btnText: 'Order Embroidered',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Min. Qty: 50 Patches',
        '7–10 Business Days Turnaround',
        'Velcro, sew-on or heat-seal backing',
        'Classic merrowed border edges'
      ]
    },
    {
      id: 'patch-pvc',
      title: '3D PVC & Leather Patches',
      subTitle: 'Waterproof 3D molded PVC or genuine leather',
      icon: Sparkles,
      rate: '$3.50',
      unitPriceVal: 3.50,
      unit: '/ patch',
      delivery: '7–10 days turnaround',
      btnText: 'Order PVC & Leather',
      badge: 'LUXURY & PVC',
      popular: false,
      features: [
        'Min. Qty: 50 Patches',
        '7–10 Business Days Turnaround',
        'Tactical velcro or adhesive mounting',
        'High-durability waterproof 3D PVC'
      ]
    }
  ];

  const cardsToRender = (patchCards && patchCards.length > 0) ? patchCards : defaultPatchCards;

  // Robust Unit Price Resolver
  const getUnitPriceForTier = (cardObj, tierIdStr) => {
    if (cardObj && typeof cardObj.unitPriceVal === 'number' && cardObj.unitPriceVal > 0) {
      return cardObj.unitPriceVal;
    }

    if (cardObj && cardObj.rate) {
      const match = cardObj.rate.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }

    const combinedStr = `${tierIdStr || ''} ${cardObj?.id || ''} ${cardObj?.title || ''}`.toLowerCase();
    if (combinedStr.includes('woven') || combinedStr.includes('basic')) return 1.50;
    if (combinedStr.includes('pvc') || combinedStr.includes('leather') || combinedStr.includes('premium')) return 3.50;
    return 2.50;
  };

  const currentSelectedCard = cardsToRender.find(c => c.id === selectedTierId) ||
    cardsToRender.find(c => {
      const cId = (c.id || '').toLowerCase();
      const sId = (selectedTierId || '').toLowerCase();
      return cId.includes(sId) || sId.includes(cId) ||
        (sId.includes('woven') && (cId.includes('basic') || cId.includes('woven'))) ||
        (sId.includes('basic') && (cId.includes('basic') || cId.includes('woven'))) ||
        (sId.includes('pvc') && (cId.includes('premium') || cId.includes('pvc'))) ||
        (sId.includes('premium') && (cId.includes('premium') || cId.includes('pvc'))) ||
        (sId.includes('embroidered') && (cId.includes('standard') || cId.includes('embroidered'))) ||
        (sId.includes('standard') && (cId.includes('standard') || cId.includes('embroidered')));
    }) ||
    cardsToRender[0];

  const unitRate = getUnitPriceForTier(currentSelectedCard, selectedTierId);
  const totalCost = Number(quantity || 50) * unitRate;

  const handleSelectTier = (tierId, cardObj = null) => {
    setSelectedTierId(tierId);
    const targetCard = cardObj || cardsToRender.find(c => c.id === tierId) || currentSelectedCard;
    let tierKey = 'standard';
    if (tierId.includes('woven') || tierId.includes('basic')) tierKey = 'basic';
    else if (tierId.includes('pvc') || tierId.includes('premium')) tierKey = 'premium';

    if (openOrderWizard) {
      openOrderWizard({
        tierKey,
        type: 'patch',
        category: 'Custom Patches',
        title: targetCard?.title || 'Custom Patch Order',
        rate: targetCard?.rate || '$2.50',
        quantity: 100
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArtworkFile(file);
      const url = URL.createObjectURL(file);
      setArtworkPreviewUrl(url);
    }
  };

  const handlePatchSubmit = async (e) => {
    e.preventDefault();
    if (quantity < 50) {
      alert('Minimum order quantity for custom patches is 50 pcs.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPatchOrder = {
        id: `#P-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${currentSelectedCard.title} (${quantity} Pcs)`,
        type: 'patch',
        serviceCategory: currentSelectedCard.title || 'Custom Patch Order',
        clientName: 'Sarah Jenkins',
        clientEmail: 'sarah@apexapparel.com',
        createdAt: new Date().toISOString(),
        status: 'digitizing',
        quantity: Number(quantity),
        backing,
        borderType,
        patchSize,
        dimensions: { width: 3.5, height: 3.5, unit: 'inches' },
        price: totalCost,
        notes: patchNotes,
        artworkUrl: artworkPreviewUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        history: [
          { timestamp: new Date().toISOString(), label: 'Custom Patch Order Placed & In Production' }
        ]
      };

      if (createOrder) {
        await createOrder(newPatchOrder);
      }

      if (showToast) {
        showToast(`Order confirmed for ${quantity} Pcs of ${currentSelectedCard.title}!`, 'success');
      }

      if (protectedNavigate) {
        protectedNavigate('customer', false);
      }
      navigate('/client-portal');
    } catch (err) {
      console.error('Patch order submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const processSteps = [
    {
      step: '01',
      title: 'Submit Artwork & Backing Specs',
      desc: 'Send us your artwork, size, quantity, and preferred backing (Iron-On, Sew-On, or Velcro).'
    },
    {
      step: '02',
      title: 'Digital Proof Review',
      desc: 'We create and send a digital patch proof for your approval.'
    },
    {
      step: '03',
      title: 'Physical Sample Confirmation',
      desc: 'After approval, we produce a sample patch and share it with you for final confirmation.'
    },
    {
      step: '04',
      title: 'Production & Direct Shipping',
      desc: 'Once approved, we complete production and ship your order directly to your doorstep.'
    }
  ];

  const timelineSpecs = [
    { label: 'Digital proof', time: '1–3 business days' },
    { label: 'Production', time: '5–10 business days', note: '(depending on quantity and design complexity)' },
    { label: 'Shipping', time: '3–5 business days' }
  ];

  return (
    <section id="custom-patches" style={{ padding: '5.5rem 0 6rem', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">

        {/* 1. Main Heading & Subtitle Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            color: 'var(--orange-400)',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.825rem',
            fontWeight: 800,
            marginBottom: '1rem',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={15} /> PREMIUM CUSTOM EMBROIDERED & PVC PATCHES
          </div>

          <h1 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#ffffff', margin: '0 0 1rem', lineHeight: 1.15 }}>
            Custom Woven, Embroidered & 3D PVC Patches
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Choose your preferred patch tier below to configure custom quantities, backing options, die-cut borders, and upload your design artwork directly.
          </p>
        </div>

        {/* 2. Custom Patches Pricing Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto 4rem'
        }}>
          {cardsToRender.map((cat) => {
            const isSelected = cat.id === selectedTierId;
            const isPopular = cat.popular;
            const IconComp = cat.icon || Trophy;

            return (
              <div
                key={cat.id}
                onClick={() => handleSelectTier(cat.id, cat)}
                style={{
                  background: isSelected ? 'rgba(255, 122, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '2px solid #ff7a00' : '1.5px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.75rem 2rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 14px 35px rgba(255, 122, 0, 0.35)' : 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Top Badge Pill */}
                {cat.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isSelected || isPopular ? 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)' : 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.3rem 1.1rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.06em',
                    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)',
                    whiteSpace: 'nowrap'
                  }}>
                    {cat.badge}
                  </div>
                )}

                <div>
                  {/* Card Title & Icon Header */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <IconComp size={20} style={{ color: '#ff9433' }} />
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {cat.title}
                      </h3>
                    </div>
                    {cat.subTitle && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, fontStyle: 'italic', color: '#cbd5e1' }}>
                        {cat.subTitle}
                      </div>
                    )}
                  </div>

                  {/* Pricing Info */}
                  <div style={{ textAlign: 'left', padding: '0 0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
                        {cat.rate}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
                        {cat.unit || '/ patch'}
                      </span>
                    </div>

                    {cat.delivery && (
                      <div style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} style={{ color: '#ff7a00' }} /> {cat.delivery}
                      </div>
                    )}
                  </div>

                  {/* Action CTA Button */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <button
                      className="btn btn-block"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        padding: '0.85rem 1.5rem',
                        boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTier(cat.id, cat);
                      }}
                    >
                      {cat.btnText || 'Order Patches'}
                    </button>
                  </div>

                  {/* Divider line */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.25rem' }}></div>

                  {/* Feature Bullets List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(cat.features || []).map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                        <CheckCircle size={17} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* 4. Process Steps & Timeline Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto 3.5rem'
        }}>
          {/* Order Process Workflow Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} style={{ color: 'var(--orange-400)' }} /> 4-Step Order & Production Process
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {processSteps.map((p, pIdx) => (
                <div key={pIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'var(--orange-500)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {p.step}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.2rem' }}>
                      {p.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Timeline Specs Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: 'var(--orange-400)' }} /> Delivery & Turnaround Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {timelineSpecs.map((spec, sIdx) => (
                  <div key={sIdx} style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>
                      {spec.label}:
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--orange-400)' }}>
                      {spec.time}
                      {spec.note && <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{spec.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <Truck size={16} style={{ color: 'var(--orange-400)', flexShrink: 0 }} /> Express worldwide shipping available upon request.
            </div>
          </div>
        </div>

        {/* 5. Footer Note */}
        <div style={{
          textAlign: 'center',
          padding: '1rem 1.75rem',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '950px',
          margin: '0 auto',
          color: '#e2e8f0',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
          <span>From artwork to delivery, we ensure every patch meets our high-quality standards. Prices are per design. Mixing services? Use Add to order list and checkout once.</span>
        </div>

      </div>
    </section>
  );
};
