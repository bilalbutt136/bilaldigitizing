'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Zap, 
  Upload,
  UploadCloud, 
  Check, 
  CheckCircle2, 
  Clock, 
  FileCode, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  ArrowRight,
  Wallet,
  CreditCard
} from 'lucide-react';
import { PackageCard } from './PackageCard';

export const VectorArtPage = ({ hideHero = false }) => {
  const navigate = useNavigate();
  const { 
    createOrder, 
    pricing, 
    walletBalance = 0, 
    deductWalletBalance, 
    setIsDepositModalOpen,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    protectedNavigate,
    serviceCmsContent = {}
  } = useAppState();

  // Multi-Item Vector Cart State
  const [vectorItems, setVectorItems] = useState([
    { id: 1, name: 'Vector Artwork #1', complexity: 'Simple Vector Redraw', quantity: 1, quantityInput: '1', notes: '', files: [] }
  ]);
  const [colorMode, setColorMode] = useState('Spot Colors (Pantone/Solid)');
  const [requestedFormats, setRequestedFormats] = useState(['ai', 'eps', 'svg', 'pdf']);
  const [isRush, setIsRush] = useState(false);
  const [paymentOption, setPaymentOption] = useState('bolt'); // 'bolt' | 'wallet'
  const [isOrderViewOpen, setIsOrderViewOpen] = useState(false);
  const [vectorCards, setVectorCards] = useState([]);

  React.useEffect(() => {
    import('../../services/supabaseService').then(({ getCmsContent }) => {
      getCmsContent('vector_cards').then(data => {
        if (data && data.length > 0) {
          const mappedCards = data.map((card, idx) => {
            const isRush = card.title.toLowerCase().includes('rush');
            const isComplex = card.title.toLowerCase().includes('complex');
            
            return {
              id: `vec-${idx}`,
              title: card.title,
              subTitle: card.description,
              discountTag: card.popular ? '⭐ MOST POPULAR' : (isRush ? '✨ EXPRESS' : ''),
              badge: card.popular ? 'MOST POPULAR' : '',
              popular: card.popular,
              rate: card.price,
              unit: '/ design',
              delivery: card.turnaround,
              complexityValue: isComplex ? 'Complex Vector Redraw' : 'Simple Vector Redraw',
              isRushValue: isRush,
              tierKey: isRush ? 'premium' : (card.popular ? 'standard' : 'basic'),
              category: 'vector',
              features: card.features,
              btnText: `Configure Order (${card.price})`
            };
          });
          setVectorCards(mappedCards);
        }
      });
    });
  }, []);

  const addVectorItem = () => {
    setVectorItems(prev => [
      ...prev,
      {
        id: Date.now(),
        name: `Vector Artwork #${prev.length + 1}`,
        complexity: 'Simple Vector Redraw',
        quantity: 1,
        quantityInput: '1',
        notes: '',
        files: []
      }
    ]);
  };

  const removeVectorItem = (id) => {
    if (vectorItems.length <= 1) return;
    setVectorItems(prev => prev.filter(item => item.id !== id));
  };

  const updateVectorItem = (id, field, value) => {
    setVectorItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'quantity') {
          const num = Math.max(1, parseInt(value, 10) || 1);
          return { ...item, quantity: num, quantityInput: String(num) };
        }
        if (field === 'quantityInput') {
          const raw = String(value);
          if (raw === '') return { ...item, quantityInput: '' };
          const clean = raw.replace(/\D/g, '');
          if (clean === '') return { ...item, quantityInput: '' };
          const parsed = parseInt(clean, 10);
          return { ...item, quantityInput: String(parsed), quantity: parsed > 0 ? parsed : item.quantity };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleItemFileUpload = (itemId, files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => {
      const fileName = file.name || 'artwork_file';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      const previewUrl = (file.type && file.type.startsWith('image/')) ? URL.createObjectURL(file) : null;
      return {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: fileExt.toUpperCase() || 'FILE',
        previewUrl,
        rawFile: file
      };
    });

    setVectorItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: [...(item.files || []), ...newFiles] };
      }
      return item;
    }));
  };

  const removeFileFromItem = (itemId, fileId) => {
    setVectorItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: (item.files || []).filter(f => f.id !== fileId) };
      }
      return item;
    }));
  };

  // File Upload State
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const VECTOR_FORMAT_OPTIONS = serviceCmsContent['vector_format_options'] || [
    { id: 'ai', name: 'Adobe Illustrator (.AI)', ext: '.AI' },
    { id: 'eps', name: 'Encapsulated PostScript (.EPS)', ext: '.EPS' },
    { id: 'svg', name: 'Scalable Vector Graphics (.SVG)', ext: '.SVG' },
    { id: 'pdf', name: 'Vector PDF Document (.PDF)', ext: '.PDF' },
    { id: 'cdr', name: 'CorelDraw Graphic (.CDR)', ext: '.CDR' }
  ];

  const toggleFormat = (fmtId) => {
    setRequestedFormats(prev => 
      prev.includes(fmtId) ? prev.filter(f => f !== fmtId) : [...prev, fmtId]
    );
  };

  // Dynamic Price Calculation across vectorItems
  const simpleRate = (pricing?.vectorSimpleRate && !isNaN(parseFloat(pricing.vectorSimpleRate)) && parseFloat(pricing.vectorSimpleRate) > 0)
    ? parseFloat(pricing.vectorSimpleRate)
    : 15.00;

  const complexRate = (pricing?.vectorComplexRate && !isNaN(parseFloat(pricing.vectorComplexRate)) && parseFloat(pricing.vectorComplexRate) > 0)
    ? parseFloat(pricing.vectorComplexRate)
    : 25.00;

  const rushFeeAmount = (pricing?.rushSurcharge && !isNaN(parseFloat(pricing.rushSurcharge)) && parseFloat(pricing.rushSurcharge) >= 0)
    ? parseFloat(pricing.rushSurcharge)
    : 10.00;

  const superRushRate = complexRate + rushFeeAmount;

  const safeVectorItems = Array.isArray(vectorItems) && vectorItems.length > 0 
    ? vectorItems 
    : [{ id: 1, name: 'Vector Artwork #1', complexity: 'Simple Vector Redraw', quantity: 1, quantityInput: '1', notes: '' }];

  let basePrice = 0;
  const vectorBreakdown = safeVectorItems.map((item, idx) => {
    const compStr = (item.complexity || '').toLowerCase();
    let itemRate = simpleRate;
    if (compStr.includes('super rush') || compStr.includes('express')) {
      itemRate = superRushRate;
    } else if (compStr.includes('complex')) {
      itemRate = complexRate;
    } else {
      itemRate = simpleRate;
    }

    const itemSubtotal = itemRate * (item.quantity || 1);
    basePrice += itemSubtotal;

    return {
      index: idx + 1,
      id: item.id || idx + 1,
      name: item.name || `Vector Artwork #${idx + 1}`,
      complexity: item.complexity || 'Simple Vector Redraw',
      rate: itemRate,
      quantity: item.quantity || 1,
      subtotal: itemSubtotal,
      notes: item.notes || ''
    };
  });

  const totalVectorQuantity = safeVectorItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const allowRush = totalVectorQuantity === 1;
  const rushSurcharge = (isRush && allowRush) ? rushFeeAmount : 0.00;
  const totalPriceNum = basePrice + rushSurcharge;
  const totalPrice = totalPriceNum.toFixed(2);

  // File Upload Handling
  const processFilesList = (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const newAssets = fileArray.map((file) => {
      const fileName = file.name || 'artwork_image';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      const previewUrl = (file.type && file.type.startsWith('image/')) ? URL.createObjectURL(file) : null;

      return {
        id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: fileExt.toUpperCase() || 'FILE',
        previewUrl,
        rawFile: file
      };
    });

    setSelectedAssets(prev => [...prev, ...newAssets]);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesList(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesList(e.target.files);
    }
  };

  const removeAsset = (assetId) => {
    setSelectedAssets(prev => prev.filter(ast => ast.id !== assetId));
  };

  // Order Submission Handler
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (!title.trim()) {
      alert('Please enter an Order Title for your vector conversion project.');
      return;
    }

    const allFiles = vectorItems.flatMap(item => item.files || []);
    if (allFiles.length === 0) {
      alert('Please upload at least one reference file for your designs.');
      return;
    }

    if (paymentOption === 'wallet' && walletBalance < parseFloat(totalPrice)) {
      alert(`Insufficient Wallet Balance ($${walletBalance.toFixed(2)}). Please top up your wallet or select Online Card Checkout.`);
      setIsDepositModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const firstItemName = vectorItems[0]?.name || 'Vector Art Order';
      const orderTitle = title.trim() || `${firstItemName}${vectorItems.length > 1 ? ` (+${vectorItems.length - 1} more)` : ''}`;

      const newVectorOrder = {
        type: 'vector',
        title: orderTitle,
        serviceCategory: 'Vector Art & Color Separation',
        placementType: 'Vector Art Redraw',
        colorMode,
        requestedFormats,
        isRush,
        vectorItems,
        vectorBreakdown,
        totalQuantity: totalVectorQuantity,
        price: parseFloat(totalPrice),
        uploadedFiles: allFiles.map(f => f.name),
        artworkUrl: allFiles[0]?.previewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
        paymentMethod: paymentOption,
        estimatedDelivery: isRush ? '2-4 Hours (Super Rush)' : '8-12 Hours (Standard)'
      };

      if (paymentOption === 'wallet') {
        deductWalletBalance(parseFloat(totalPrice));
      }

      await createOrder(newVectorOrder);
      setIsSubmitting(false);

      // Navigate client straight to portal
      protectedNavigate('customer', true);
      navigate('/client-portal');
    } catch (err) {
      console.error('Vector order creation error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#0b1329', minHeight: '100vh', paddingBottom: '5rem', color: '#ffffff' }}>
      
      {/* 1. Studio Header Banner */}
      {!hideHero && (
        <section style={{
          background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e1b4b 100%)',
          color: '#ffffff',
          padding: '4.5rem 0 3.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255, 122, 0, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 122, 0, 0.15)',
              border: '1.5px solid var(--orange-500)',
              color: 'var(--orange-400)',
              fontWeight: 800,
              fontSize: '0.825rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              marginBottom: '1.25rem'
            }}>
              <Zap size={16} /> Dedicated Vector Redraw Studio
            </div>

            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Custom Vector Art Conversion & Redraws
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
              Transform low-resolution JPEGs, PNGs, hand-drawn sketches, or pixelated logos into 100% hand-drawn, razor-sharp scalable vector graphics (.AI, .EPS, .SVG, .PDF, .CDR).
            </p>

            {/* Value Highlights Pill Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#e2e8f0'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--orange-500)' }} /> Hand-Drawn Clean Paths
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: 'var(--orange-500)' }} /> 8–12 Hours Turnaround
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--orange-500)' }} /> Unlimited Free Revisions
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} style={{ color: 'var(--orange-500)' }} /> Starting from $15.00
              </span>
            </div>

          </div>
        </div>
        </section>
      )}

      {/* 2. Pricing Tier Cards OR Order Configuration Form View */}
      {!isOrderViewOpen ? (
        <div id="pricing-tiers" className="container" style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            
            {(() => {
              const handleSelectVectorTier = (cat) => {
                updateVectorItem(vectorItems[0]?.id || 1, 'complexity', cat.complexityValue);
                setIsRush(cat.isRushValue);
                setIsOrderViewOpen(true);
              };

              const fallbackVectorCards = [];

              return vectorCards.map((cat, idx) => (
                <PackageCard
                  key={cat.id || idx}
                  cat={cat}
                  idx={idx}
                  onSelect={handleSelectVectorTier}
                  forceCategory="vector"
                />
              ));
            })()}
          </div>
        </div>
      ) : (
        /* Dedicated Order Configuration View */
        <div id="vector-order-form" className="container" style={{ marginTop: '2rem' }}>
          
          {/* Back Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => setIsOrderViewOpen(false)}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#cbd5e1',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Back to Pricing Packages
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Configuring:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-400)', background: 'rgba(255, 122, 0, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--orange-500)' }}>
                {vectorBreakdown[0]?.complexity || 'Vector Redraw'} {isRush ? '(Super Rush Express)' : ''}
              </span>
            </div>
          </div>
        <div 
          className="grid-responsive-2col"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
          }}
        >
          
          {/* Main Order Form */}
          <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Step 1: Artwork Specifications */}
            <div style={{ padding: '2rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 122, 0, 0.2)', border: '1px solid var(--orange-500)', color: 'var(--orange-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  1
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Vector Conversion Specifications
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Itemized Vector Cart Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.875rem', color: '#ffffff' }}>
                    📍 Configure Vector Design Items ({vectorItems.length} Item{vectorItems.length > 1 ? 's' : ''}) *
                  </label>

                  {vectorItems.map((item, index) => {
                    const compStr = (item.complexity || '').toLowerCase();
                    const isSuperRush = compStr.includes('super rush') || compStr.includes('express');
                    const isComplex = compStr.includes('complex') && !isSuperRush;
                    const isSimple = !isComplex && !isSuperRush;

                    let itemRate = simpleRate;
                    if (isSuperRush) itemRate = superRushRate;
                    else if (isComplex) itemRate = complexRate;
                    else itemRate = simpleRate;

                    const itemSubtotal = itemRate * (item.quantity || 1);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '12px',
                          padding: '1.15rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontSize: '0.72rem', fontWeight: 900, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {index + 1}
                            </span>
                            <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{item.name}</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-400)' }}>
                              ${itemRate.toFixed(2)}/ea • Subtotal: ${itemSubtotal.toFixed(2)}
                            </span>

                            {vectorItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVectorItem(item.id)}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Streamlined Row: Package Tier, Name, and Quantity */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                          
                          <div>
                            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Package Tier *</label>
                            <select 
                              value={item.complexity || 'Simple Vector Redraw'} 
                              onChange={(e) => updateVectorItem(item.id, 'complexity', e.target.value)} 
                              className="form-control" 
                              style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem', width: '100%' }}
                            >
                              <option value="Simple Vector Redraw">⚡ Simple Redraw (${simpleRate.toFixed(2)})</option>
                              <option value="Complex Vector Redraw">⭐ Complex Redraw (${complexRate.toFixed(2)})</option>
                              <option value="Super Rush Vector">✨ Super Rush (${superRushRate.toFixed(2)})</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Design Name / Label</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateVectorItem(item.id, 'name', e.target.value)}
                              className="form-control"
                              style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem', width: '100%' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Quantity</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button type="button" onClick={() => updateVectorItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} style={{ width: '32px', height: '34px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>-</button>
                              <input type="text" value={item.quantityInput !== undefined ? item.quantityInput : item.quantity} onChange={(e) => updateVectorItem(item.id, 'quantityInput', e.target.value)} className="form-control" style={{ textAlign: 'center', background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800, padding: '0.3rem', width: '100%' }} />
                              <button type="button" onClick={() => updateVectorItem(item.id, 'quantity', item.quantity + 1)} style={{ width: '32px', height: '34px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>+</button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Specific Instructions for this Design</label>
                          <input
                            type="text"
                            placeholder="e.g. Remove background, change red to navy blue, keep typography vector clean..."
                            value={item.notes}
                            onChange={(e) => updateVectorItem(item.id, 'notes', e.target.value)}
                            className="form-control"
                            style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.8rem' }}
                          />
                        </div>

                        {/* Dedicated File Upload Zone Bound to this Specific Item */}
                        <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                            <span>📎 Reference Artwork File for {item.name} *</span>
                            {item.files && item.files.length > 0 && (
                              <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>{item.files.length} File{item.files.length > 1 ? 's' : ''} Attached</span>
                            )}
                          </label>

                          <div
                            onClick={() => document.getElementById(`item-file-input-${item.id}`)?.click()}
                            style={{
                              border: '1.5px dashed rgba(255, 122, 0, 0.45)',
                              background: '#0f172a',
                              borderRadius: '8px',
                              padding: '0.65rem 0.85rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Upload size={15} style={{ color: 'var(--orange-400)' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                              Upload File specifically for {item.name}
                            </span>
                            <input
                              type="file"
                              id={`item-file-input-${item.id}`}
                              multiple
                              style={{ display: 'none' }}
                              onChange={(e) => handleItemFileUpload(item.id, e.target.files)}
                            />
                          </div>

                          {/* Uploaded files bound to this item */}
                          {item.files && item.files.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {item.files.map(f => (
                                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: '#0f172a', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {f.previewUrl ? (
                                      <img src={f.previewUrl} alt={f.name} style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                      <FileCode size={13} style={{ color: 'var(--orange-400)' }} />
                                    )}
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{f.name}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>({f.size})</span>
                                  </div>
                                  <button type="button" onClick={() => removeFileFromItem(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addVectorItem}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255, 122, 0, 0.12)',
                      border: '1.5px dashed var(--orange-500)',
                      color: 'var(--orange-400)',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Sparkles size={16} /> + Add Another Design
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                    Requested Vector Output Formats
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                    {VECTOR_FORMAT_OPTIONS.map((fmt) => {
                      const isChecked = requestedFormats.includes(fmt.id);
                      return (
                        <div
                          key={fmt.id}
                          onClick={() => toggleFormat(fmt.id)}
                          style={{
                            padding: '0.6rem 0.85rem',
                            border: isChecked ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.12)',
                            background: isChecked ? 'rgba(255, 122, 0, 0.2)' : '#0f172a',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: isChecked ? 'var(--orange-400)' : '#e2e8f0'
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isChecked ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                            background: isChecked ? 'var(--orange-500)' : '#1e293b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px'
                          }}>
                            {isChecked && <Check size={13} />}
                          </div>
                          <span>{fmt.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Color Mode Selection */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Vector Color Separation Mode
                  </label>
                  <select
                    className="form-control"
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value)}
                    style={{ width: '100%', height: '42px', background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <option value="Spot Colors (Pantone/Solid)">Spot Colors (Pantone / Solid Separation for Screen Printing)</option>
                    <option value="Full Color CMYK (Process Printing)">Full Color CMYK (Process Printing / DTG / Vinyl)</option>
                    <option value="Monochrome / Single Color Black">Monochrome / Single Color Black & White</option>
                  </select>
                </div>

                {/* Turnaround Time Selection */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                    Turnaround Time
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div
                      onClick={() => setIsRush(false)}
                      style={{
                        padding: '0.85rem 1rem',
                        border: !isRush ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                        background: !isRush ? 'rgba(255, 122, 0, 0.2)' : '#0f172a',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>Standard Turnaround</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>8–12 Hours Delivery</div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem' }}>FREE</span>
                    </div>

                    <div
                      onClick={() => setIsRush(true)}
                      style={{
                        padding: '0.85rem 1rem',
                        border: isRush ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                        background: isRush ? 'rgba(255, 122, 0, 0.2)' : '#0f172a',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>Super Rush</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>2–4 Hours Express</div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--orange-400)', fontSize: '0.85rem' }}>+$10.00</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </form>

          {/* Right Checkout & Order Summary Card */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '1.75rem', background: '#1e293b', border: '2px solid var(--orange-500)', borderRadius: '16px', boxShadow: '0 12px 32px rgba(255, 122, 0, 0.18)' }}>
              
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.75rem' }}>
                Vector Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Service Type:</span>
                  <strong style={{ color: 'var(--orange-400)' }}>Vector Art & Color Separation</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Total Artworks:</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>
                    {totalVectorQuantity} Pcs across {vectorItems.length} {vectorItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Itemized Vector Cart Breakdown */}
                <div style={{ background: '#0f172a', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📍 VECTOR CART ({vectorItems.length}):
                  </div>
                  {vectorBreakdown.map((item, idx) => (
                    <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < vectorBreakdown.length - 1 ? '1px dashed rgba(255,255,255,0.08)' : 'none', paddingBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0' }}>
                        <span>#{item.index} {item.name} (x{item.quantity}):</span>
                        <strong style={{ color: '#ffffff' }}>${item.subtotal.toFixed(2)}</strong>
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: '#ffffff' }}>
                    <span>Artworks Subtotal:</span>
                    <span style={{ color: 'var(--orange-400)' }}>${basePrice.toFixed(2)}</span>
                  </div>
                </div>

                {isRush && totalVectorQuantity === 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--orange-400)', fontWeight: 700 }}>
                    <span>Super Rush (2-4 Hrs):</span>
                    <span>+${rushSurcharge.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Output Formats:</span>
                  <span style={{ fontWeight: 700, color: 'var(--orange-400)' }}>{requestedFormats.map(f => f.toUpperCase()).join(', ')}</span>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Total Price:</span>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--orange-400)' }}>${totalPrice}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                  Select Payment Option
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div
                    onClick={() => setPaymentOption('wallet')}
                    style={{
                      padding: '0.65rem 0.85rem',
                      border: paymentOption === 'wallet' ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                      background: paymentOption === 'wallet' ? 'rgba(255, 122, 0, 0.2)' : '#0f172a',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wallet size={16} style={{ color: 'var(--orange-400)' }} />
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>Client Wallet Balance</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>(${walletBalance.toFixed(2)})</span>
                  </div>

                  <div
                    onClick={() => setPaymentOption('bolt')}
                    style={{
                      padding: '0.65rem 0.85rem',
                      border: paymentOption === 'bolt' ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                      background: paymentOption === 'bolt' ? 'rgba(255, 122, 0, 0.2)' : '#0f172a',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <CreditCard size={16} style={{ color: 'var(--orange-400)' }} />
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>Instant Online Card Checkout</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="btn btn-primary-orange"
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                  boxShadow: '0 8px 24px rgba(255, 122, 0, 0.35)'
                }}
              >
                {isSubmitting ? (
                  'Submitting Vector Order...'
                ) : (
                  <>
                    Submit Vector Order (${totalPrice}) <ArrowRight size={18} />
                  </>
                )}
              </button>

            </div>
          </div>

        </div>
      </div>
      )}
    </div>
  );
};
