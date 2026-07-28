import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { patchCards = [], protectedNavigate, createOrder, showToast } = useAppState();

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

  const handleSelectTier = (tierId) => {
    setSelectedTierId(tierId);
    const builderElem = document.getElementById('patch-order-builder');
    if (builderElem) {
      builderElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                  transition: 'all 0.3s ease'
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
                        background: isSelected ? '#ffffff' : 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                        color: isSelected ? 'var(--navy-950)' : '#ffffff',
                        borderRadius: '9999px',
                        padding: '0.85rem 1.5rem',
                        boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSelectTier(cat.id)}
                    >
                      {isSelected ? '✓ Tier Selected - Configure Below' : (cat.btnText || 'Order Patches')}
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

        {/* 3. Interactive Custom Patch Order Builder Section */}
        <div id="patch-order-builder" style={{ scrollMarginTop: '100px', maxWidth: '1050px', margin: '0 auto 4rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '2px solid var(--orange-500)',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 20px 45px rgba(0,0,0,0.4)'
          }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STEP 2 OF 2 • ORDER CONFIGURATOR
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0 0' }}>
                  Configure Your {currentSelectedCard.title} Order
                </h2>
              </div>

              <div style={{ background: 'rgba(249, 115, 22, 0.2)', border: '1px solid var(--orange-500)', padding: '0.6rem 1.25rem', borderRadius: '12px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>ESTIMATED TOTAL COST</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--orange-400)', lineHeight: 1.1 }}>
                  ${totalCost.toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handlePatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* Tier Pills Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.65rem' }}>
                  1. Selected Patch Style & Tier
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {cardsToRender.map((c) => {
                    const cPrice = getUnitPriceForTier(c, c.id);
                    const isThisSelected = currentSelectedCard.id === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedTierId(c.id)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          border: isThisSelected ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                          background: isThisSelected ? 'linear-gradient(135deg, rgba(255,122,0,0.25) 0%, rgba(255,122,0,0.1) 100%)' : 'rgba(255,255,255,0.03)',
                          color: '#ffffff',
                          fontWeight: isThisSelected ? 800 : 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{c.title}</span>
                        <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>
                          Starting from ${cPrice.toFixed(2)} / patch
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Options */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                    2. Patch Quantity (Min. 50 Pcs)
                  </label>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Unit Rate: <strong>${unitRate.toFixed(2)}/pc</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {[50, 100, 200, 500, 1000].map(qty => (
                    <button
                      type="button"
                      key={qty}
                      onClick={() => setQuantity(qty)}
                      style={{
                        padding: '0.5rem 1.1rem',
                        borderRadius: '8px',
                        border: quantity === qty ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                        background: quantity === qty ? 'var(--orange-500)' : 'rgba(255,255,255,0.05)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {qty} Pcs
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="50"
                  step="10"
                  className="form-control"
                  placeholder="Or enter custom quantity..."
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(50, parseInt(e.target.value) || 50))}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', maxWidth: '250px' }}
                />
              </div>

              {/* Backing & Border Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {/* Backing */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                    3. Backing Attachment
                  </label>
                  <select
                    className="form-select"
                    value={backing}
                    onChange={(e) => setBacking(e.target.value)}
                    style={{ background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}
                  >
                    <option value="Velcro Hook & Loop">Velcro Hook & Loop (Tactical)</option>
                    <option value="Iron-On Heat Seal">Iron-On Heat Press Seal</option>
                    <option value="Sew-On / Plain Back">Sew-On / Plain Cloth Backing</option>
                    <option value="Peel & Stick Adhesive">Peel & Stick Self Adhesive</option>
                  </select>
                </div>

                {/* Border */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                    4. Border Edge Finish
                  </label>
                  <select
                    className="form-select"
                    value={borderType}
                    onChange={(e) => setBorderType(e.target.value)}
                    style={{ background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}
                  >
                    <option value="Merrowed Die-Cut Border">Merrowed Overlock Border</option>
                    <option value="Hot Cut Border">Hot Cut Clean Edge Border</option>
                    <option value="Laser Cut Clean Edge">Laser Cut Contour Border</option>
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                    5. Patch Size Dimension
                  </label>
                  <select
                    className="form-select"
                    value={patchSize}
                    onChange={(e) => setPatchSize(e.target.value)}
                    style={{ background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}
                  >
                    <option value='2.5" x 2.5" Small'>2.5" x 2.5" Small Badge</option>
                    <option value='3.0" x 3.0" Medium'>3.0" x 3.0" Medium Emblem</option>
                    <option value='3.5" x 3.5" (Standard)'>3.5" x 3.5" Standard Size</option>
                    <option value='4.0" x 4.0" Large'>4.0" x 4.0" Large Jacket Patch</option>
                  </select>
                </div>
              </div>

              {/* Upload Artwork Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                  6. Upload Patch Logo / Design Artwork
                </label>
                <div style={{
                  border: '2px dashed rgba(255,122,0,0.5)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'rgba(255,122,0,0.05)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*,.ai,.pdf,.psd,.eps,.svg"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                  {artworkPreviewUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                      <img src={artworkPreviewUrl} alt="Patch Artwork" style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid var(--orange-500)' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>{artworkFile?.name || 'Uploaded Artwork'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--orange-400)' }}>Click to replace file</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={32} style={{ color: 'var(--orange-400)', marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                        Click or Drop Logo File Here (PNG, JPG, AI, SVG, PDF)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        High resolution files ensure exact thread matching
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Instructions Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                  7. Design & Color Notes (Optional)
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Specify Pantone thread colors, metallic threads, or layout details..."
                  value={patchNotes}
                  onChange={(e) => setPatchNotes(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                />
              </div>

              {/* Order Submission Button */}
              <div style={{ marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-block"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '1.1rem 2rem',
                    boxShadow: '0 6px 20px rgba(255, 122, 0, 0.45)',
                    cursor: 'pointer'
                  }}
                >
                  {isSubmitting ? 'Processing Custom Order...' : `Confirm & Place Order ($${totalCost.toFixed(2)})`}
                </button>
              </div>

            </form>
          </div>
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
