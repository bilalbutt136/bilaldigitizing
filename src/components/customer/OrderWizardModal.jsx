'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  UploadCloud, 
  Upload,
  Check, 
  Scissors, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  FileCheck,
  Image as ImageIcon,
  FileCode,
  FileText,
  Trash2,
  Wallet,
  CreditCard,
  Lock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
export const OrderWizardModal = () => {
  const { 
    isOrderWizardOpen, 
    setIsOrderWizardOpen, 
    orderWizardInitialData,
    createOrder,
    pricing,
    walletBalance = 150.00,
    deductWalletBalance,
    setIsDepositModalOpen,
    authUser
  } = useAppState();

  const [step, setStep] = useState(1); // 1: Upload & Service | 2: Specs | 3: Review | 4: Payment

  // Package Tier State with safe fallback default
  const [selectedPackageTier, setSelectedPackageTier] = useState('standard'); // 'basic' | 'standard' | 'premium'
  
  // Itemized Placements Cart State with default initial placement item
  const [placementItems, setPlacementItems] = useState([
    { id: 1, placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '' }
  ]);

  const [type, setType] = useState('embroidery'); // 'embroidery' | 'vector' | 'patch'
  const [title, setTitle] = useState('');
  
  // Multi-File Upload Selected Assets Array State
  const [selectedAssets, setSelectedAssets] = useState([]);
  const uploadedFilesList = selectedAssets; // Alias for submit & order creation
  
  const [isDragOver, setIsDragOver] = useState(false);

  const [selectedPlacements, setSelectedPlacements] = useState(['left_chest']);
  const [placementType, setPlacementType] = useState('Left Chest / Polo');
  const [serviceCategory, setServiceCategory] = useState('Left Chest Digitizing');
  const [width, setWidth] = useState(3.5);
  const [height, setHeight] = useState(3.0);
  const [fabricType, setFabricType] = useState('Pique Cotton Polo');
  const [colorsCount, setColorsCount] = useState(4);
  const [requestedFormats, setRequestedFormats] = useState(['dst', 'pes', 'emb', 'svg']);
  const [isRush, setIsRush] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentOption, setPaymentOption] = useState('bolt'); // 'bolt' | 'wallet' | 'card'

  // Custom Patches State Variables with safe defaults
  const [patchStyle, setPatchStyle] = useState('Embroidered');
  const [patchBacking, setPatchBacking] = useState('Iron-On');
  const [patchQuantity, setPatchQuantity] = useState(50);

  React.useEffect(() => {
    if (isOrderWizardOpen && orderWizardInitialData) {
      if (orderWizardInitialData.tierKey) {
        setSelectedPackageTier(orderWizardInitialData.tierKey);
      } else if (orderWizardInitialData.tier) {
        setSelectedPackageTier(orderWizardInitialData.tier);
      }
      if (orderWizardInitialData.type) {
        setType(orderWizardInitialData.type);
      }
      if (orderWizardInitialData.serviceCategory || orderWizardInitialData.title) {
        setServiceCategory(orderWizardInitialData.serviceCategory || orderWizardInitialData.title);
      }
      if (orderWizardInitialData.placementType) {
        setPlacementType(orderWizardInitialData.placementType);
      }
    }
  }, [isOrderWizardOpen, orderWizardInitialData]);

  const PLACEMENT_OPTIONS = [
    { id: 'left_chest', label: 'Left Chest / Polo', desc: 'Standard logo up to 4.0"', isJacketBack: false },
    { id: 'cap_front', label: 'Cap / Hat Front', desc: 'Center-out pathing', isJacketBack: false },
    { id: 'sleeve_cuff', label: 'Sleeve / Cuff / Visor', desc: 'Small side emblem', isJacketBack: false },
    { id: 'full_front', label: 'Full Front / Chest', desc: 'Chest crest logo up to 8.0"', isJacketBack: false },
    { id: 'jacket_back', label: 'Jacket Back / Full Back', desc: 'Large crest (9"-12"+ high stitch count)', isJacketBack: true }
  ];

  const togglePlacement = (placementId) => {
    setSelectedPlacements(prev => {
      if (prev.includes(placementId)) {
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== placementId);
      } else {
        return [...prev, placementId];
      }
    });
  };

  const FORMAT_OPTIONS = [
    { id: 'dst', label: '.DST', desc: 'Tajima / Universal' },
    { id: 'pes', label: '.PES', desc: 'Brother / Baby Lock' },
    { id: 'exp', label: '.EXP', desc: 'Melco / Bernina' },
    { id: 'jef', label: '.JEF', desc: 'Janome / Elna' },
    { id: 'hus', label: '.HUS', desc: 'Husqvarna Viking' },
    { id: 'emb', label: '.EMB', desc: 'Wilcom Source File' },
    { id: 'vp3', label: '.VP3', desc: 'PFAFF / Viking' },
    { id: 'xxx', label: '.XXX', desc: 'Singer' }
  ];

  const addPlacementItem = () => {
    setPlacementItems(prev => [
      ...prev,
      { id: Date.now(), placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '' }
    ]);
  };

  const removePlacementItem = (id) => {
    if (placementItems.length === 1) return;
    setPlacementItems(prev => prev.filter(item => item.id !== id));
  };

  const updatePlacementItem = (id, field, value) => {
    setPlacementItems(prev => prev.map(item => {
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

  const handlePlacementFileUpload = (itemId, files) => {
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

    setPlacementItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: [...(item.files || []), ...newFiles] };
      }
      return item;
    }));
  };

  const removeFileFromPlacement = (itemId, fileId) => {
    setPlacementItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: (item.files || []).filter(f => f.id !== fileId) };
      }
      return item;
    }));
  };

  const selectAllFormats = () => {
    if (requestedFormats.length === FORMAT_OPTIONS.length) {
      setRequestedFormats(['dst', 'pes', 'emb']);
    } else {
      setRequestedFormats(FORMAT_OPTIONS.map(f => f.id));
    }
  };

  const toggleFormat = (fmtId) => {
    setRequestedFormats(prev => 
      prev.includes(fmtId) ? prev.filter(f => f !== fmtId) : [...prev, fmtId]
    );
  };

  const getServicePricingDetails = () => {
    let customRateVal = null;
    if (orderWizardInitialData?.rate) {
      const match = String(orderWizardInitialData.rate).match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
      if (match && match[1]) {
        customRateVal = parseFloat(match[1]);
      } else if (!isNaN(parseFloat(orderWizardInitialData.rate))) {
        customRateVal = parseFloat(orderWizardInitialData.rate);
      }
    }

    if (type === 'vector') {
      const currentTier = selectedPackageTier || 'standard';
      const basicRate = (customRateVal && currentTier === 'basic') ? customRateVal : 15.00;
      const standardRate = (customRateVal && currentTier === 'standard') ? customRateVal : 25.00;
      const premiumRate = (customRateVal && currentTier === 'premium') ? customRateVal : 40.00;
      
      let rateEach = standardRate;
      if (currentTier === 'basic') rateEach = basicRate;
      if (currentTier === 'premium') rateEach = premiumRate;

      const safePlacementItems = Array.isArray(placementItems) && placementItems.length > 0 
        ? placementItems 
        : [{ id: 1, placementType: 'vector_redraw', quantity: 1, quantityInput: '1', specificNotes: '' }];

      let baseSubtotal = 0;
      const placementBreakdown = safePlacementItems.map((item, idx) => {
        const subtotal = rateEach * (item.quantity || 1);
        baseSubtotal += subtotal;
        return {
          index: idx + 1,
          id: item.id || idx + 1,
          label: `Vector Artwork #${idx + 1}`,
          quantity: item.quantity || 1,
          priceEach: rateEach,
          subtotal,
          notes: item.specificNotes || ''
        };
      });

      const totalQty = safePlacementItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      const allowRush = totalQty === 1;
      const rushSurcharge = (isRush && allowRush) ? 10.00 : 0;
      const finalPrice = baseSubtotal + rushSurcharge;

      return {
        serviceTitle: 'Vector Art & Color Separation',
        currentTier,
        rateEach,
        baseSubtotal,
        totalPlacementQuantity: totalQty,
        rushSurcharge,
        finalPrice,
        placementBreakdown
      };
    } else if (type === 'patch') {
      const currentTier = selectedPackageTier || 'standard';
      const rateEach = currentTier === 'basic' ? 1.50 : currentTier === 'premium' ? 3.50 : 2.50;
      const safeQty = Math.max(10, patchQuantity || 25);
      const baseSubtotal = rateEach * safeQty;
      const finalPrice = baseSubtotal;

      return {
        serviceTitle: 'Physical Custom Patches',
        currentTier,
        patchStyle,
        patchBacking,
        rateEach,
        baseSubtotal,
        totalPlacementQuantity: safeQty,
        rushSurcharge: 0,
        finalPrice,
        placementBreakdown: [{
          index: 1,
          id: 1,
          label: `${patchStyle} Patch (${patchBacking})`,
          quantity: safeQty,
          priceEach: rateEach,
          subtotal: baseSubtotal,
          notes: ''
        }]
      };
    } else {
      // Embroidery Digitizing
      const currentTier = selectedPackageTier || 'standard';
      const basicRate = (customRateVal && currentTier === 'basic') ? customRateVal : (parseFloat(pricing?.minOrderFee) || 10.00);
      const standardRate = (customRateVal && currentTier === 'standard') ? customRateVal : (parseFloat(pricing?.vectorSimpleRate) || 15.00);
      const premiumRate = (customRateVal && currentTier === 'premium') ? customRateVal : (parseFloat(pricing?.vectorComplexRate) || 25.00);

      let baseTierRate = basicRate;
      if (currentTier === 'standard') baseTierRate = standardRate;
      if (currentTier === 'premium') baseTierRate = premiumRate;

      const safePlacementItems = Array.isArray(placementItems) && placementItems.length > 0 
        ? placementItems 
        : [{ id: 1, placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '' }];

      let baseSubtotal = 0;
      const placementBreakdown = safePlacementItems.map((item, idx) => {
        const isJacket = item.placementType === 'jacket_back' || item.placementType === 'Jacket Back Crest';
        const itemPriceEach = isJacket ? 20.00 : baseTierRate;
        const subtotal = itemPriceEach * (item.quantity || 1);
        baseSubtotal += subtotal;
        
        const foundPlc = PLACEMENT_OPTIONS.find(p => p.id === item.placementType);
        const label = foundPlc ? foundPlc.label.split(' (')[0] : (item.placementType || 'Left Chest / Polo Logo');

        return {
          index: idx + 1,
          id: item.id || idx + 1,
          placementType: item.placementType,
          label,
          quantity: item.quantity || 1,
          priceEach: itemPriceEach,
          subtotal,
          notes: item.specificNotes || ''
        };
      });

      const totalPlacementQuantity = safePlacementItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

      let discountPercent = 0;
      if (totalPlacementQuantity >= 50) discountPercent = 35;
      else if (totalPlacementQuantity >= 25) discountPercent = 25;
      else if (totalPlacementQuantity >= 15) discountPercent = 20;
      else if (totalPlacementQuantity >= 10) discountPercent = 15;
      else if (totalPlacementQuantity >= 5) discountPercent = 10;

      const discountAmount = (baseSubtotal * discountPercent) / 100;
      const discountedSubtotal = baseSubtotal - discountAmount;

      const allowRush = totalPlacementQuantity === 1;
      const rushSurcharge = (isRush && allowRush) ? (parseFloat(pricing?.rushSurcharge) || 10.00) : 0;
      const finalPrice = discountedSubtotal + rushSurcharge;

      return {
        serviceTitle: 'Embroidery Digitizing',
        currentTier,
        baseTierRate,
        baseSubtotal,
        discountPercent,
        discountAmount,
        discountedSubtotal,
        totalPlacementQuantity,
        rushSurcharge,
        finalPrice,
        placementBreakdown
      };
    }
  };

  const pricingDetails = getServicePricingDetails();

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newAssets = Array.from(e.target.files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        preview: URL.createObjectURL(file)
      }));
      setSelectedAssets(prev => [...prev, ...newAssets]);
    }
  };

  const handleRemoveAsset = (id) => {
    setSelectedAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderTitle = title.trim() || `${pricingDetails.serviceTitle} Order`;
    const orderData = {
      title: orderTitle,
      type,
      selectedPackageTier,
      placementItems,
      fabricType,
      requestedFormats,
      isRush,
      patchStyle,
      patchBacking,
      patchQuantity,
      totalPrice: pricingDetails.finalPrice,
      uploadedFiles: selectedAssets.map(a => a.name)
    };
    if (createOrder) {
      createOrder(orderData);
    }
    setIsOrderWizardOpen(false);
    alert(`Order "${orderTitle}" placed successfully! Total: $${pricingDetails.finalPrice.toFixed(2)}`);
  };

  if (!isOrderWizardOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.5rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1140px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        margin: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '20px 20px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={22} style={{ color: 'var(--orange-400)' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Configure {pricingDetails.serviceTitle} Order
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                Multi-step order configuration with live instant pricing calculation
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsOrderWizardOpen(false)}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#cbd5e1', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>

          <div className="configurator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Step 1: Configure Service Options */}
              <div style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--orange-400)' }} /> Step 1: Configure {pricingDetails.serviceTitle} Options
                </h3>

                {/* 1. EMBROIDERY DIGITIZING */}
                {type === 'embroidery' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                        Select Pricing Package Tier *
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                        
                        <div
                          onClick={() => setSelectedPackageTier('basic')}
                          style={{
                            border: selectedPackageTier === 'basic' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'basic' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>⚡ BASIC</span>
                            {selectedPackageTier === 'basic' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$10.00 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ design</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Simple Left Chest / Small Logo (up to 4")</div>
                        </div>

                        <div
                          onClick={() => setSelectedPackageTier('standard')}
                          style={{
                            border: selectedPackageTier === 'standard' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'standard' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase' }}>⭐ STANDARD</span>
                            {selectedPackageTier === 'standard' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$15.00 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ design</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Standard Left Chest, Cap & Sleeve Logos</div>
                        </div>

                        <div
                          onClick={() => setSelectedPackageTier('premium')}
                          style={{
                            border: selectedPackageTier === 'premium' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'premium' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>✨ PREMIUM</span>
                            {selectedPackageTier === 'premium' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$25.00 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ design</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Jacket Back, Large Crest & 3D Puff</div>
                        </div>

                      </div>
                    </div>

                    {/* Interactive Placements Cart */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffffff' }}>
                          📍 Configure Order Placement Items ({placementItems.length} Item{placementItems.length > 1 ? 's' : ''}) *
                        </label>
                        <button type="button" onClick={addPlacementItem} style={{ background: 'rgba(255, 122, 0, 0.2)', border: '1px solid var(--orange-500)', color: 'var(--orange-400)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                          + Add Another Placement
                        </button>
                      </div>

                      {placementItems.map((item, index) => (
                        <div key={item.id} style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-400)' }}>Placement Item #{index + 1}</span>
                            {placementItems.length > 1 && (
                              <button type="button" onClick={() => removePlacementItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Placement Location</label>
                              <select value={item.placementType} onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem' }}>
                                {PLACEMENT_OPTIONS.map(plc => (
                                  <option key={plc.id} value={plc.id}>{plc.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Quantity</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} style={{ width: '32px', height: '34px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>-</button>
                                <input type="text" value={item.quantityInput} onChange={(e) => updatePlacementItem(item.id, 'quantityInput', e.target.value)} className="form-control" style={{ textAlign: 'center', background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800, padding: '0.3rem' }} />
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', item.quantity + 1)} style={{ width: '32px', height: '34px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>+</button>
                              </div>
                            </div>
                          </div>

                          {/* Dedicated File Upload Zone for this Placement */}
                          <div style={{ background: '#1e293b', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.6rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.3rem' }}>
                              <span>📎 Reference File for Placement #{index + 1} *</span>
                              {item.files && item.files.length > 0 && (
                                <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>{item.files.length} File{item.files.length > 1 ? 's' : ''}</span>
                              )}
                            </label>

                            <div
                              onClick={() => document.getElementById(`modal-plc-file-${item.id}`)?.click()}
                              style={{
                                border: '1.5px dashed rgba(255, 122, 0, 0.45)',
                                background: '#0f172a',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <Upload size={14} style={{ color: 'var(--orange-400)' }} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>Upload File for Item #{index + 1}</span>
                              <input
                                type="file"
                                id={`modal-plc-file-${item.id}`}
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => handlePlacementFileUpload(item.id, e.target.files)}
                              />
                            </div>

                            {item.files && item.files.length > 0 && (
                              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {item.files.map(f => (
                                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.5rem', background: '#0f172a', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <FileCode size={12} style={{ color: 'var(--orange-400)' }} />
                                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{f.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removeFileFromPlacement(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Target Garment Fabric *</label>
                      <select value={fabricType} onChange={(e) => setFabricType(e.target.value)} className="form-control" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}>
                        <option value="Pique Cotton Polo">Pique Polo Cotton</option>
                        <option value="Fleece Hoodie">Fleece Hoodie / Sweatshirt</option>
                        <option value="Structured Cap 3D Foam">Structured Cap / Hat (3D Foam)</option>
                        <option value="Performance Dry-Fit">Performance Dry-Fit Polyester</option>
                        <option value="Towel / Terry Cloth">Towel / Thick Plush Terry</option>
                        <option value="Leather / Canvas">Leather / Heavy Canvas</option>
                        <option value="Softshell Jacket">Softshell Jacket / Outerwear</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Required Machine File Formats</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                        {[{id: 'dst', label: '.DST'}, {id: 'pes', label: '.PES'}, {id: 'exp', label: '.EXP'}, {id: 'jef', label: '.JEF'}, {id: 'emb', label: '.EMB'}].map(fmt => (
                          <div key={fmt.id} onClick={() => toggleFormat(fmt.id)} style={{ padding: '0.5rem', background: requestedFormats.includes(fmt.id) ? 'rgba(255, 122, 0, 0.2)' : '#0f172a', border: requestedFormats.includes(fmt.id) ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input type="checkbox" checked={requestedFormats.includes(fmt.id)} onChange={() => {}} style={{ accentColor: 'var(--orange-500)' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{fmt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 2. VECTOR ART & COLOR SEPARATION */}
                {type === 'vector' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                        Select Pricing Package Tier *
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                        
                        <div
                          onClick={() => setSelectedPackageTier('basic')}
                          style={{
                            border: selectedPackageTier === 'basic' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'basic' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>⚡ BASIC REDRAW</span>
                            {selectedPackageTier === 'basic' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$15.00 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ artwork</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Clean text, simple logos, 1-3 colors</div>
                        </div>

                        <div
                          onClick={() => setSelectedPackageTier('standard')}
                          style={{
                            border: selectedPackageTier === 'standard' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'standard' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase' }}>⭐ COLOR SEPARATION</span>
                            {selectedPackageTier === 'standard' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$25.00 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ artwork</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Multi-color screen print prep & vector tracing</div>
                        </div>

                        <div
                          onClick={() => setSelectedPackageTier('premium')}
                          style={{
                            border: selectedPackageTier === 'premium' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'premium' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>✨ COMPLEX ART</span>
                            {selectedPackageTier === 'premium' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$40.00 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ artwork</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Mascots, gradients, detailed hand art</div>
                        </div>

                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Required Vector Formats</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                        {['.AI', '.EPS', '.SVG', '.PDF', '.CDR', '.PSD'].map(fmt => (
                          <div key={fmt} onClick={() => toggleFormat(fmt.toLowerCase())} style={{ padding: '0.5rem', background: requestedFormats.includes(fmt.toLowerCase()) ? 'rgba(255, 122, 0, 0.2)' : '#0f172a', border: requestedFormats.includes(fmt.toLowerCase()) ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input type="checkbox" checked={requestedFormats.includes(fmt.toLowerCase())} onChange={() => {}} style={{ accentColor: 'var(--orange-500)' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{fmt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 3. PHYSICAL CUSTOM PATCHES */}
                {type === 'patch' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                        Select Patch Material & Tier *
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                        
                        <div
                          onClick={() => setSelectedPackageTier('basic')}
                          style={{
                            border: selectedPackageTier === 'basic' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'basic' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>🧵 EMBROIDERED</span>
                            {selectedPackageTier === 'basic' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$1.50 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ patch</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Merrowed border, min 10 pcs</div>
                        </div>

                        <div
                          onClick={() => setSelectedPackageTier('standard')}
                          style={{
                            border: selectedPackageTier === 'standard' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'standard' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase' }}>🪵 LEATHER</span>
                            {selectedPackageTier === 'standard' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$2.50 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ patch</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>Genuine/Faux leather, min 10 pcs</div>
                        </div>

                        <div
                          onClick={() => setSelectedPackageTier('premium')}
                          style={{
                            border: selectedPackageTier === 'premium' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: selectedPackageTier === 'premium' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                            padding: '1rem 0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>✨ 3D PVC RUBBER</span>
                            {selectedPackageTier === 'premium' && (
                              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>$3.50 <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ patch</span></div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.3 }}>3D Rubber PVC, min 10 pcs</div>
                        </div>

                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Patch Style</label>
                        <select value={patchStyle} onChange={(e) => setPatchStyle(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <option value="Embroidered">Embroidered Patch (Merrowed Border)</option>
                          <option value="Leather">Genuine / Faux Leather Patch</option>
                          <option value="PVC">3D Soft Rubber PVC Patch</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Backing Option</label>
                        <select value={patchBacking} onChange={(e) => setPatchBacking(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <option value="Iron-On">Heat Seal / Iron-On</option>
                          <option value="Velcro">Velcro Hook & Loop</option>
                          <option value="Sew-On">Standard Sew-On</option>
                          <option value="Adhesive">Peel & Stick Adhesive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                        Select Patch Quantity (Preset Steps or Custom) *
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <select
                          value={[100, 200, 300, 400, 500, 1000].includes(patchQuantity) ? patchQuantity : 'custom'}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              setPatchQuantity(parseInt(e.target.value, 10));
                            }
                          }}
                          className="form-control"
                          style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }}
                        >
                          <option value="100">100 Pcs (Standard Min Tier)</option>
                          <option value="200">200 Pcs (Package Batch)</option>
                          <option value="300">300 Pcs (Mid Tier)</option>
                          <option value="400">400 Pcs (Bulk Tier)</option>
                          <option value="500">500 Pcs (Volume Saver)</option>
                          <option value="1000">1000 Pcs (Wholesale VIP)</option>
                          <option value="custom">Custom Quantity...</option>
                        </select>

                        <input 
                          type="number" 
                          min="10" 
                          step="5" 
                          value={patchQuantity} 
                          onChange={(e) => setPatchQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))} 
                          className="form-control" 
                          placeholder="Custom Pcs"
                          style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }} 
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {[100, 200, 300, 400, 500, 1000].map(qty => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setPatchQuantity(qty)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              border: patchQuantity === qty ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                              background: patchQuantity === qty ? 'var(--orange-500)' : 'rgba(255,255,255,0.05)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {qty} Pcs
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {pricingDetails.totalPlacementQuantity === 1 && type !== 'patch' && (
                  <div 
                    onClick={() => setIsRush(!isRush)}
                    style={{
                      background: isRush ? 'linear-gradient(135deg, rgba(255, 122, 0, 0.25) 0%, rgba(255, 122, 0, 0.1) 100%)' : '#0f172a',
                      border: isRush ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Zap size={20} style={{ color: 'var(--orange-400)' }} />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>Super Rush (2-4 Hrs / Express) Turnaround</span>
                        <span style={{ fontSize: '0.73rem', color: '#cbd5e1' }}>Need urgent delivery? Get your completed file in 2–4 hours (+$10.00)</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={isRush} onChange={() => {}} style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)', cursor: 'pointer' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Live Order Summary Panel */}
            <div style={{ position: 'sticky', top: '10px' }}>
              <div style={{ padding: '1.5rem', background: '#1e293b', border: '2px solid var(--orange-500)', borderRadius: '16px', boxShadow: '0 12px 32px rgba(255, 122, 0, 0.18)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.75rem' }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Selected Service:</span>
                    <strong style={{ color: 'var(--orange-400)' }}>{pricingDetails.serviceTitle}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Selected Tier:</span>
                    <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                      {pricingDetails.currentTier} (${(pricingDetails.rateEach || pricingDetails.baseTierRate || 10).toFixed(2)})
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Total Quantity:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {pricingDetails.totalPlacementQuantity} Pcs
                    </span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📍 ITEMS BREAKDOWN ({pricingDetails.placementBreakdown.length}):
                    </div>
                    {pricingDetails.placementBreakdown.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < pricingDetails.placementBreakdown.length - 1 ? '1px dashed rgba(255,255,255,0.08)' : 'none', paddingBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0' }}>
                          <span>#{item.index} {item.label} (x{item.quantity}):</span>
                          <strong style={{ color: '#ffffff' }}>${item.subtotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: '#ffffff' }}>
                      <span>Subtotal:</span>
                      <span style={{ color: 'var(--orange-400)' }}>${pricingDetails.baseSubtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Turnaround Guarantee:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {type === 'patch' ? '📦 3-5 Days Shipping' : isRush ? '⚡ 2-4 Hours Super Rush' : '8-12 Hours Standard'}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Total Price:</span>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--orange-400)' }}>
                      ${pricingDetails.finalPrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(255, 122, 0, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    Complete Order (${pricingDetails.finalPrice.toFixed(2)}) <ArrowRight size={18} />
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.85rem' }}>
                    ✓ 100% Quality Guaranteed • Free Unlimited Revisions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
