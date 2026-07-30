'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  PenTool, 
  Tag, 
  Shirt, 
  HardHat, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  FileCode,
  DollarSign,
  Plus,
  Minus,
  Zap,
  Check
} from 'lucide-react';

export const CoreServicesOrderSection = ({ defaultService = 'digitizing', hideTabs = false, initialTier = 'standard' }) => {
  const navigate = useNavigate();
  const { pricing = {}, createOrder, isAuthenticated, protectedNavigate, showToast } = useAppState();

  const [activeService, setActiveService] = useState(defaultService);
  const [isOrderViewOpen, setIsOrderViewOpen] = useState(false);

  // Common Order State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Service 1: Embroidery Digitizing State with Itemized Placement Cart Flow
  const [placementItems, setPlacementItems] = useState([
    { 
      id: 'plc-initial-1', 
      placementType: 'left_chest', 
      quantity: 1, 
      quantityInput: '1', 
      specificNotes: '' 
    }
  ]);
  const [fabricType, setFabricType] = useState('Pique Polo Cotton');
  const [targetFormats, setTargetFormats] = useState(['dst', 'pes', 'emb']);
  const [digitizingPackageTier, setDigitizingPackageTier] = useState(initialTier || 'standard'); // 'basic' | 'standard' | 'premium'

  // Service 2: Vector Tracing State
  const [vectorComplexity, setVectorComplexity] = useState('simple'); // 'simple' | 'complex'
  const [vectorFormats, setVectorFormats] = useState(['ai', 'eps', 'svg', 'pdf']);
  const [vectorQuantity, setVectorQuantity] = useState(1);
  const [vectorQuantityInput, setVectorQuantityInput] = useState('1');

  // Sync vectorQuantity state with input display string
  React.useEffect(() => {
    setVectorQuantityInput(String(vectorQuantity));
  }, [vectorQuantity]);

  // Service 3: Custom Patches State
  const [patchStyle, setPatchStyle] = useState('Embroidered'); // 'Embroidered' | 'Leather' | 'PVC'
  const [patchBacking, setPatchBacking] = useState('Iron-On'); // 'Iron-On' | 'Velcro' | 'Sew-On' | 'Adhesive'
  const [patchQuantity, setPatchQuantity] = useState(25);
  const [patchSize, setPatchSize] = useState('3.0 inches');

  // Service 4: Custom T-Shirts State
  const [tshirtColor, setTshirtColor] = useState('Black');
  const [tshirtPlacement, setTshirtPlacement] = useState('Left Chest Embroidery');
  const [tshirtSizes, setTshirtSizes] = useState({ S: 2, M: 5, L: 5, XL: 3, '2XL': 0, '3XL': 0 });

  // Service 5: Custom Caps & 3D Puff Hats State
  const [capStyle, setCapStyle] = useState('Structured Snapback'); // 'Structured Snapback' | 'Dad Hat' | 'Beanie'
  const [capColor, setCapColor] = useState('Black / White Mesh');
  const [is3dPuff, setIs3dPuff] = useState(true);
  const [capQuantity, setCapQuantity] = useState(12);

  // Multi-Placement Options Definition
  const PLACEMENT_OPTIONS = [
    { id: 'left_chest', label: 'Left Chest / Polo Logo', desc: 'Standard logo up to 4.0"', isJacketBack: false },
    { id: 'cap_front', label: 'Cap / Hat Front', desc: 'Center-out pathing for 3D/flat caps', isJacketBack: false },
    { id: 'sleeve_cuff', label: 'Sleeve / Cuff Emblem', desc: 'Small side sleeve logo', isJacketBack: false },
    { id: 'full_front', label: 'Full Chest / Front', desc: 'Chest crest logo up to 8.0"', isJacketBack: false },
    { id: 'jacket_back', label: 'Jacket Back / Full Back', desc: 'Large crest (9"-12"+ high stitch count)', isJacketBack: true },
    { id: 'beanie_visor', label: 'Beanie / Visor / Pocket', desc: 'Knit beanie or visor crest', isJacketBack: false }
  ];

  // Dynamic Placement Rows Handlers
  const addPlacementItem = () => {
    const existingTypes = placementItems.map(p => p.placementType);
    const nextType = PLACEMENT_OPTIONS.find(o => !existingTypes.includes(o.id))?.id || 'jacket_back';
    const newId = `plc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    setPlacementItems(prev => [
      ...prev,
      { id: newId, placementType: nextType, quantity: 1, quantityInput: '1', specificNotes: '' }
    ]);
  };

  const removePlacementItem = (id) => {
    if (placementItems.length <= 1) return;
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
          if (value === '') {
            return { ...item, quantityInput: '' };
          }
          const clean = value.replace(/\D/g, '');
          if (clean === '') {
            return { ...item, quantityInput: '' };
          }
          const parsed = parseInt(clean, 10);
          return { ...item, quantityInput: String(parsed), quantity: Math.max(1, parsed) };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleBlurPlacementQuantity = (id) => {
    setPlacementItems(prev => prev.map(item => {
      if (item.id === id) {
        if (!item.quantityInput || parseInt(item.quantityInput, 10) < 1) {
          return { ...item, quantity: 1, quantityInput: '1' };
        }
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

  const totalPlacementQuantity = placementItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Sync initialTier prop changes
  React.useEffect(() => {
    if (initialTier) {
      setDigitizingPackageTier(initialTier);
    }
  }, [initialTier]);

  // Auto-reset Super Rush if total order quantity is set to 2 or more placements (bulk orders)
  React.useEffect(() => {
    if (activeService === 'digitizing' && totalPlacementQuantity > 1 && isRush) {
      setIsRush(false);
    }
  }, [totalPlacementQuantity, activeService, isRush]);

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

  const toggleTargetFormat = (fmtId) => {
    setTargetFormats(prev => 
      prev.includes(fmtId) ? prev.filter(f => f !== fmtId) : [...prev, fmtId]
    );
  };

  const selectAllFormats = () => {
    if (targetFormats.length === FORMAT_OPTIONS.length) {
      setTargetFormats(['dst', 'pes', 'emb']);
    } else {
      setTargetFormats(FORMAT_OPTIONS.map(f => f.id));
    }
  };

  // Detailed Digitizing Pricing Breakdown with Itemized Multi-Placement Row Aggregation
  const getDigitizingPricingDetails = () => {
    const baseTierRate = digitizingPackageTier === 'premium' ? 20.00 : digitizingPackageTier === 'standard' ? 10.00 : 5.00;

    const placementBreakdown = placementItems.map((item, idx) => {
      const option = PLACEMENT_OPTIONS.find(o => o.id === item.placementType);
      const isJacket = option?.isJacketBack;
      const unitRate = isJacket ? 20.00 : baseTierRate;
      const itemSubtotal = unitRate * (item.quantity || 1);

      return {
        id: item.id,
        index: idx + 1,
        placementType: item.placementType,
        label: option?.label || item.placementType,
        quantity: item.quantity || 1,
        unitRate,
        subtotal: itemSubtotal,
        notes: item.specificNotes
      };
    });

    const totalPlacementItemsCount = placementBreakdown.reduce((sum, p) => sum + p.quantity, 0);
    const baseSubtotal = placementBreakdown.reduce((sum, p) => sum + p.subtotal, 0);

    let discountPercent = 0;
    if (totalPlacementItemsCount >= 25) discountPercent = 20;
    else if (totalPlacementItemsCount >= 10) discountPercent = 15;
    else if (totalPlacementItemsCount >= 5) discountPercent = 10;
    else if (totalPlacementItemsCount >= 3) discountPercent = 5;

    const discountAmount = (baseSubtotal * discountPercent) / 100;
    const subtotalAfterDiscount = baseSubtotal - discountAmount;
    
    // Super Rush (2-4 Hrs) is ONLY available for single-design placement orders (total items === 1)
    const allowRush = totalPlacementItemsCount === 1;
    const rushFee = (isRush && allowRush) ? 10.00 : 0.00;
    const total = subtotalAfterDiscount + rushFee;

    return {
      baseTierRate,
      placementBreakdown,
      totalPlacementItemsCount,
      baseSubtotal,
      discountPercent,
      discountAmount,
      subtotalAfterDiscount,
      allowRush,
      rushFee,
      total: total.toFixed(2)
    };
  };

  // Dynamic Price Calculation
  const calculatePrice = () => {
    let base = 0;
    const rushFee = isRush ? 10.00 : 0.00;

    if (activeService === 'digitizing') {
      return getDigitizingPricingDetails().total;
    } else if (activeService === 'vector') {
      const unitRate = vectorComplexity === 'complex' ? (parseFloat(pricing.vectorComplexRate) || 25.00) : (parseFloat(pricing.vectorSimpleRate) || 15.00);
      base = vectorQuantity * unitRate;
    } else if (activeService === 'patches') {
      const unitRate = patchQuantity >= 100 ? 1.50 : patchQuantity >= 50 ? 2.20 : 3.00;
      base = patchQuantity * unitRate;
    } else if (activeService === 'tshirts') {
      const totalShirts = Object.values(tshirtSizes).reduce((a, b) => a + Number(b), 0);
      const unitShirtRate = totalShirts >= 50 ? 12.00 : 14.00;
      base = Math.max(1, totalShirts) * unitShirtRate;
    } else if (activeService === 'caps') {
      const unitCapRate = capQuantity >= 50 ? 10.00 : 12.00;
      const puffExtra = is3dPuff ? 2.00 : 0.00;
      base = capQuantity * (unitCapRate + puffExtra);
    }

    return (base + rushFee).toFixed(2);
  };

  // File Upload Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAssets = files.map(file => ({
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || 'Artwork Image',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setSelectedAssets(prev => [...prev, ...newAssets]);
    showToast(`${files.length} file(s) attached successfully!`, 'success');
  };

  const removeAsset = (id) => {
    setSelectedAssets(prev => prev.filter(ast => ast.id !== id));
  };

  // Order Submission Handler
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an order title/artwork name', 'error');
      return;
    }

    setIsSubmitting(true);
    const totalPrice = calculatePrice();

    const details = getDigitizingPricingDetails();
    const placementsSummary = details.placementBreakdown.map(p => `${p.label} (x${p.quantity})`).join(', ');

    const newOrderPayload = {
      title,
      type: activeService,
      serviceCategory: 
        activeService === 'digitizing' ? `Embroidery Digitizing (${placementsSummary})` :
        activeService === 'vector' ? `Vector Tracing (${vectorComplexity.toUpperCase()})` :
        activeService === 'patches' ? `Custom Patches (${patchQuantity}x ${patchStyle})` :
        activeService === 'tshirts' ? `Custom T-Shirts (${Object.values(tshirtSizes).reduce((a, b) => a + Number(b), 0)} Pcs)` :
        `Custom Caps & 3D Hats (${capQuantity}x ${capStyle})`,
      price: parseFloat(totalPrice),
      isRush,
      notes,
      requestedFormats: activeService === 'vector' ? vectorFormats : targetFormats,
      uploadedFiles: selectedAssets,
      specifications: {
        placementsSummary,
        placementItems,
        totalPlacementCount: details.totalPlacementItemsCount,
        fabricType,
        vectorComplexity,
        patchStyle,
        patchBacking,
        patchQuantity,
        tshirtColor,
        tshirtSizes,
        capStyle,
        capColor,
        is3dPuff
      }
    };

    try {
      await createOrder(newOrderPayload);
      setIsSubmitting(false);
      showToast('Order submitted successfully!', 'success');
      protectedNavigate('customer', true);
      navigate('/client-portal');
    } catch (err) {
      setIsSubmitting(false);
      showToast('Order created in guest preview session', 'info');
      protectedNavigate('customer', true);
      navigate('/client-portal');
    }
  };

  return (
    <section id="order-builder" style={{ padding: '5.5rem 0', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 122, 0, 0.15)',
            border: '1px solid rgba(255, 122, 0, 0.4)',
            color: 'var(--orange-400)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={16} /> Dedicated Digitizing & Vector Order Studio
          </div>

          <h2 style={{ fontSize: '2.5rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
            {hideTabs ? 'Configure Your Embroidery Digitizing Order' : 'Select Service & Configure Your Order'}
          </h2>

          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6 }}>
            {hideTabs 
              ? 'Upload your artwork, select your target machine formats, configure stitch options, and receive instant transparent pricing.' 
              : 'Choose from our core services below to upload your artwork, customize specifications, and receive instant transparent pricing.'
            }
          </p>
        </div>

        {/* Category Header Badges */}
        {!hideTabs && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#0f172a', border: '1px solid var(--orange-500)', color: 'var(--orange-400)', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800 }}>
              📁 Digital Studio Services (Instant File Download)
            </div>
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 122, 0, 0.4)', color: '#ffffff', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800 }}>
              📦 Physical Custom Patches (Worldwide Shipping)
            </div>
          </div>
        )}

        {/* 3 Core Services Selector Tabs */}
        {!hideTabs && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            marginBottom: '2.5rem'
          }}>
            <button
              type="button"
              onClick={() => setActiveService('digitizing')}
              style={{
                padding: '1.15rem 1rem',
                borderRadius: '12px',
                border: activeService === 'digitizing' ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                background: activeService === 'digitizing' ? 'linear-gradient(135deg, rgba(255,122,0,0.2) 0%, rgba(255,122,0,0.05) 100%)' : '#1e293b',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Layers size={24} style={{ color: activeService === 'digitizing' ? 'var(--orange-400)' : '#94a3b8' }} />
              <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Embroidery Digitizing</span>
              <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>Digital File Download</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveService('vector')}
              style={{
                padding: '1.15rem 1rem',
                borderRadius: '12px',
                border: activeService === 'vector' ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                background: activeService === 'vector' ? 'linear-gradient(135deg, rgba(255,122,0,0.2) 0%, rgba(255,122,0,0.05) 100%)' : '#1e293b',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <PenTool size={24} style={{ color: activeService === 'vector' ? 'var(--orange-400)' : '#94a3b8' }} />
              <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Vector Tracing</span>
              <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>Digital Vector Files</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveService('patches')}
              style={{
                padding: '1.15rem 1rem',
                borderRadius: '12px',
                border: activeService === 'patches' ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                background: activeService === 'patches' ? 'linear-gradient(135deg, rgba(255,122,0,0.2) 0%, rgba(255,122,0,0.05) 100%)' : '#1e293b',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Tag size={24} style={{ color: activeService === 'patches' ? 'var(--orange-400)' : '#94a3b8' }} />
              <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Physical Custom Patches</span>
              <span style={{ fontSize: '0.73rem', color: '#10b981', fontWeight: 700 }}>Physical Shipping</span>
            </button>
          </div>
        )}

        {/* Pricing Cards View OR Order Configuration Form View */}
        {!isOrderViewOpen ? (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                Choose Your Embroidery Digitizing Package Tier
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                Select a package tier below to open the dedicated order configuration form
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              
              {/* Basic Tier Card */}
              <div
                onClick={() => {
                  setDigitizingPackageTier('basic');
                  setIsOrderViewOpen(true);
                }}
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                      ⚡ BASIC DIGITIZING
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Small Logo</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem 0' }}>
                    Basic Digitizing
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--orange-400)' }}>$10.00</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ design</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: 'var(--orange-400)' }} /> 8–12 Hours Delivery
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                    Simple Left Chest / Small Logo up to 4.0". Ideal for simple text, monogramming, and clean logos.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Up to 4" Left Chest / Hat Logo
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> All machine formats (.DST, .PES, .EXP)
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Free native .EMB Wilcom source file
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> 100% Free Unlimited Revisions
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-primary-orange"
                  style={{ width: '100%', height: '42px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  Configure Basic Order <ArrowRight size={16} />
                </button>
              </div>

              {/* Standard Tier Card */}
              <div
                onClick={() => {
                  setDigitizingPackageTier('standard');
                  setIsOrderViewOpen(true);
                }}
                style={{
                  background: '#1e293b',
                  border: '2.5px solid var(--orange-500)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 36px rgba(255, 122, 0, 0.22)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fb923c', background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251, 146, 60, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                      ⭐ MOST POPULAR • STANDARD
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      POPULAR
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem 0' }}>
                    Standard Digitizing
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--orange-400)' }}>$15.00</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ design</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: 'var(--orange-400)' }} /> 8–12 Hours Standard Delivery
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                    Standard Left Chest, Cap & Sleeve Logos up to 5.0" with detailed pathing & density balance.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Left Chest, Cap & Sleeve Logos up to 5.0"
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Optimized stitch density & fabric pathing
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Free 3D Puff / Flat cap pathing
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> 100% Free Unlimited Revisions
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-primary-orange"
                  style={{ width: '100%', height: '42px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  Configure Standard Order <ArrowRight size={16} />
                </button>
              </div>

              {/* Premium Tier Card */}
              <div
                onClick={() => {
                  setDigitizingPackageTier('premium');
                  setIsOrderViewOpen(true);
                }}
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                      ✨ VIP & JACKET BACK • PREMIUM
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Jacket Back</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem 0' }}>
                    Premium Digitizing
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--orange-400)' }}>$25.00</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ design</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: '#10b981' }} /> 12–24 Hours Priority
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                    Large crests, full jacket backs (9"-12"+), complex 3D puff, and high stitch-count designs.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Large crests & jacket backs (9"-12"+)
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Complex 3D Puff & multi-layer pathing
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> Free machine simulation sew-out proof
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> 24/7 Priority studio desk support
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-primary-orange"
                  style={{ width: '100%', height: '42px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  Configure Premium Order <ArrowRight size={16} />
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* Dedicated Order Configuration View */
          <div>
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
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Selected Tier:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-400)', background: 'rgba(255, 122, 0, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--orange-500)', textTransform: 'uppercase' }}>
                  {digitizingPackageTier} Digitizing Package
                </span>
              </div>
            </div>

            {/* Main Form Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              alignItems: 'start'
            }}>
              
              {/* Form Left Side */}
              <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Step 1: Title & File Upload */}
            <div className="card" style={{ padding: '1.75rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} style={{ color: 'var(--orange-400)' }} /> Step 1: Order Title & Artwork Upload
              </h3>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Artwork / Order Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Apex Logo Digitizing / Custom Patch Order"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                />
              </div>

              {/* Compact Upload Box */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.85rem',
                padding: '0.85rem 1.25rem',
                background: '#0f172a',
                border: '2px dashed rgba(255, 122, 0, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <Upload size={22} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>Click or drag artwork files to upload</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Supports PNG, JPG, PDF, AI, SVG, PSD, DST</span>
                </div>
                <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              </label>

              {/* Upload Preview */}
              {selectedAssets.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAssets.map(ast => (
                    <div key={ast.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '0.55rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{ast.name} ({ast.size})</span>
                      <button type="button" onClick={() => removeAsset(ast.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Service-Specific Specifications */}
            <div className="card" style={{ padding: '1.75rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--orange-400)' }} /> Step 2: Configure Digitizing Options
              </h3>

              {/* 1. EMBROIDERY DIGITIZING */}
              {activeService === 'digitizing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* 3 Package Cards Display */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                      Select Pricing Package Tier *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                      {/* Basic Card */}
                      <div
                        onClick={() => setDigitizingPackageTier('basic')}
                        style={{
                          border: digitizingPackageTier === 'basic' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                          background: digitizingPackageTier === 'basic' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                          boxShadow: digitizingPackageTier === 'basic' ? '0 8px 25px rgba(255, 122, 0, 0.28)' : 'none',
                          padding: '1.25rem 1rem',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.65rem',
                          paddingBottom: '0.5rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            ⚡ ESSENTIAL TIER
                          </span>
                          {digitizingPackageTier === 'basic' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.15rem 0.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={11} /> Selected
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                            Basic Digitizing
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--orange-400)' }}>$10.00</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>/ design</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} style={{ color: 'var(--orange-400)' }} /> 8 - 12 Hours Delivery
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Simple left chest & small logos up to 4.0"</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>All machine formats (.DST, .PES, .EXP)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Essential stitch pathing & underlay</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Free native .EMB Wilcom source file</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>100% Free Unlimited Revisions</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Standard Card */}
                      <div
                        onClick={() => setDigitizingPackageTier('standard')}
                        style={{
                          border: digitizingPackageTier === 'standard' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                          background: digitizingPackageTier === 'standard' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                          boxShadow: digitizingPackageTier === 'standard' ? '0 8px 25px rgba(255, 122, 0, 0.28)' : 'none',
                          padding: '1.25rem 1rem',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.65rem',
                          paddingBottom: '0.5rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#fb923c',
                            background: 'rgba(251, 146, 60, 0.15)',
                            border: '1px solid rgba(251, 146, 60, 0.3)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            ⭐ MOST POPULAR • STANDARD
                          </span>
                          {digitizingPackageTier === 'standard' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.15rem 0.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={11} /> Selected
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                            Standard Digitizing
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--orange-400)' }}>$15.00</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>/ design</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} style={{ color: 'var(--orange-400)' }} /> 8 - 12 Hours Express
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Medium chest, cap & sleeve logos up to 8.0"</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>3D Puff cap foam density pathing</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Includes free native .EMB source file</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>All commercial machine formats</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>100% Free Unlimited Revisions</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Premium Card */}
                      <div
                        onClick={() => setDigitizingPackageTier('premium')}
                        style={{
                          border: digitizingPackageTier === 'premium' ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                          background: digitizingPackageTier === 'premium' ? 'linear-gradient(180deg, rgba(255, 122, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#0f172a',
                          boxShadow: digitizingPackageTier === 'premium' ? '0 8px 25px rgba(255, 122, 0, 0.28)' : 'none',
                          padding: '1.25rem 1rem',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.65rem',
                          paddingBottom: '0.5rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#c084fc',
                            background: 'rgba(192, 132, 252, 0.15)',
                            border: '1px solid rgba(192, 132, 252, 0.3)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            ✨ VIP & JACKET BACK • PREMIUM
                          </span>
                          {digitizingPackageTier === 'premium' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ffffff', background: 'var(--orange-500)', padding: '0.15rem 0.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={11} /> Selected
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                            Premium Digitizing
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--orange-400)' }}>$25.00</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>/ design</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} style={{ color: 'var(--orange-400)' }} /> 12 - 24 Hours Priority
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Large crests & jacket backs (9"-12"+)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Complex 3D Puff & multi-layer pathing</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>Free machine simulation sew-out proof</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>24/7 Priority studio desk support</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                              <span>100% Free Unlimited Revisions</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                       {/* Multi-Placement Itemized Cart Configuration */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          📍 Configure Order Placement Items ({placementItems.length} {placementItems.length === 1 ? 'Item' : 'Items'}) *
                        </label>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          Add distinct placements with custom quantities and specific size/color instructions.
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--orange-400)', fontWeight: 800, background: 'rgba(255,122,0,0.12)', padding: '0.25rem 0.65rem', borderRadius: '9999px', border: '1px solid rgba(255,122,0,0.3)' }}>
                        Total Quantity: {totalPlacementQuantity} Pcs
                      </span>
                    </div>

                    {/* Placement Rows Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {placementItems.map((item, index) => {
                        const option = PLACEMENT_OPTIONS.find(o => o.id === item.placementType);
                        const isJacket = option?.isJacketBack;
                        const baseTierRate = digitizingPackageTier === 'premium' ? 20.00 : digitizingPackageTier === 'standard' ? 10.00 : 5.00;
                        const unitRate = isJacket ? 20.00 : baseTierRate;
                        const rowSubtotal = unitRate * (item.quantity || 1);

                        return (
                          <div
                            key={item.id}
                            style={{
                              background: '#0f172a',
                              border: '1.5px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '12px',
                              padding: '1.15rem',
                              position: 'relative',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            {/* Row Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {index + 1}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                                  Placement Item #{index + 1}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-400)' }}>
                                  ${unitRate.toFixed(2)}/ea • Subtotal: ${rowSubtotal.toFixed(2)}
                                </span>

                                {placementItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePlacementItem(item.id)}
                                    title="Remove Placement Item"
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: '#ef4444',
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Row Content Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                              
                              {/* Placement Type Dropdown */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                  Target Placement Position *
                                </label>
                                <select
                                  value={item.placementType}
                                  onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)}
                                  className="form-control"
                                  style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', fontWeight: 700 }}
                                >
                                  {PLACEMENT_OPTIONS.map(plc => (
                                    <option key={plc.id} value={plc.id}>
                                      {plc.label} ({plc.isJacketBack ? '$20.00' : `$${baseTierRate.toFixed(2)}`})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Placement Quantity Counter */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                  Item Quantity (Pcs) *
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => updatePlacementItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                    style={{ width: '32px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={item.quantityInput !== undefined ? item.quantityInput : item.quantity}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => updatePlacementItem(item.id, 'quantityInput', e.target.value)}
                                    onBlur={() => handleBlurPlacementQuantity(item.id)}
                                    className="form-control"
                                    style={{ textAlign: 'center', background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updatePlacementItem(item.id, 'quantity', item.quantity + 1)}
                                    style={{ width: '32px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Individual Placement Notes / Size / File Instructions */}
                              <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                  Specific Size / Thread Color / Instructions (Optional)
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. Max width 3.8 inches, Navy thread match, extra underlay..."
                                  value={item.specificNotes}
                                  onChange={(e) => updatePlacementItem(item.id, 'specificNotes', e.target.value)}
                                  style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem' }}
                                />
                              </div>

                              {/* Dedicated File Upload Zone Bound to this Specific Placement Item */}
                              <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.35rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                  <span>📎 Reference Artwork File for {option?.label || `Placement #${index + 1}`} *</span>
                                  {item.files && item.files.length > 0 && (
                                    <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>{item.files.length} File{item.files.length > 1 ? 's' : ''} Attached</span>
                                  )}
                                </label>

                                <div
                                  onClick={() => document.getElementById(`plc-file-input-${item.id}`)?.click()}
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
                                    Upload File for {option?.label || `Placement #${index + 1}`}
                                  </span>
                                  <input
                                    type="file"
                                    id={`plc-file-input-${item.id}`}
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={(e) => handlePlacementFileUpload(item.id, e.target.files)}
                                  />
                                </div>

                                {/* Uploaded files bound to this placement item */}
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
                                        <button type="button" onClick={() => removeFileFromPlacement(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Another Placement Item Button */}
                    <button
                      type="button"
                      onClick={addPlacementItem}
                      style={{
                        marginTop: '1rem',
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
                      <Plus size={18} /> Add Another Placement Item
                    </button>
                  </div>

                  {/* Target Garment Fabric */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Target Garment Fabric</label>
                    <select value={fabricType} onChange={(e) => setFabricType(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <option value="Pique Polo Cotton">Pique Polo Cotton (Standard Underlay)</option>
                      <option value="Fleece / Hoodie">Fleece / Heavyweight Hoodie (Dense Underlay)</option>
                      <option value="Structured Cap (3D Foam)">Structured Cap / 3D Foam (High Density Pathing)</option>
                      <option value="Thin Polyester / Dry-Fit">Thin Polyester / Performance Dry-Fit (Light Density)</option>
                      <option value="Towel / Terry Cloth">Towel / Terry Cloth (Solvy Water-Soluble Film Pathing)</option>
                      <option value="Leather / Canvas">Leather / Heavy Canvas (Sharp Needle Pathing)</option>
                      <option value="Softshell Jacket">Softshell Outerwear Jacket</option>
                    </select>
                  </div>

                  {/* Target Machine Formats Selection */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1' }}>
                        Required Machine File Formats ({targetFormats.length} Selected) *
                      </label>
                      <button
                        type="button"
                        onClick={selectAllFormats}
                        style={{ background: 'none', border: 'none', color: 'var(--orange-400)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {targetFormats.length === FORMAT_OPTIONS.length ? 'Reset Default' : 'Select All Formats'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                      {FORMAT_OPTIONS.map(fmt => {
                        const isChecked = targetFormats.includes(fmt.id);
                        return (
                          <div
                            key={fmt.id}
                            onClick={() => toggleTargetFormat(fmt.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.65rem',
                              background: isChecked ? 'rgba(255,122,0,0.18)' : '#0f172a',
                              border: isChecked ? '1.5px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.12)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ accentColor: 'var(--orange-500)', cursor: 'pointer' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#ffffff' }}>{fmt.label}</div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{fmt.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Super Rush Option (Displayed ONLY when total items === 1) */}
                  {totalPlacementQuantity === 1 ? (
                    <div 
                      onClick={() => setIsRush(!isRush)}
                      style={{
                        background: isRush ? 'linear-gradient(135deg, rgba(255, 122, 0, 0.25) 0%, rgba(255, 122, 0, 0.1) 100%)' : '#0f172a',
                        border: isRush ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: isRush ? '0 4px 16px rgba(255, 122, 0, 0.25)' : 'none',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(255, 122, 0, 0.2)', color: 'var(--orange-400)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                          <Zap size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ⚡ Super Rush (2-4 Hrs / Express) Turnaround
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                            Need urgent delivery? Get your completed embroidery file in 2–4 hours (+ $10.00)
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isRush}
                        onChange={(e) => {
                          e.stopPropagation();
                          setIsRush(e.target.checked);
                        }}
                        style={{ width: '19px', height: '19px', accentColor: 'var(--orange-500)', cursor: 'pointer' }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      📌 <em>Super Rush (2-4 Hrs) is available for single placement orders. Bulk orders ({totalPlacementQuantity} Pcs) are automatically processed under standard 8-12 hour studio turnaround.</em>
                    </div>
                  )}

                </div>
              )}

              {/* 2. VECTOR TRACING */}
              {activeService === 'vector' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* 2 Package Cards Display */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                      Vector Complexity Tier *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div
                        onClick={() => setVectorComplexity('simple')}
                        style={{
                          border: vectorComplexity === 'simple' ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                          background: vectorComplexity === 'simple' ? 'rgba(255, 122, 0, 0.18)' : '#0f172a',
                          padding: '0.85rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase' }}>⚡ SIMPLE REDRAW</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0' }}>$15.00</div>
                        <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Clean text, simple logos, 1-3 colors</div>
                      </div>

                      <div
                        onClick={() => setVectorComplexity('complex')}
                        style={{
                          border: vectorComplexity === 'complex' ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)',
                          background: vectorComplexity === 'complex' ? 'rgba(255, 122, 0, 0.18)' : '#0f172a',
                          padding: '0.85rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase' }}>✨ COMPLEX REDRAW</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0' }}>$25.00</div>
                        <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Mascots, gradients, detailed artwork</div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Quantity Control: Dropdown + Manual Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                      Quantity (Dropdown & Manual Entry)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        value={[1, 2, 3, 5, 10, 15, 25, 50].includes(vectorQuantity) ? vectorQuantity : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setVectorQuantity(parseInt(e.target.value) || 1);
                          }
                        }}
                        style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }}
                      >
                        <option value="1">1 Artwork (Single Order)</option>
                        <option value="2">2 Artworks (Package)</option>
                        <option value="3">3 Artworks (Package)</option>
                        <option value="5">5 Artworks (Bulk Batch)</option>
                        <option value="10">10 Artworks (Bulk Batch)</option>
                        <option value="25">25 Artworks (Volume Tier)</option>
                        <option value="custom">Custom Quantity...</option>
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => setVectorQuantity(Math.max(1, vectorQuantity - 1))}
                          style={{ width: '36px', height: '38px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={vectorQuantityInput}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            if (rawVal === '') {
                              setVectorQuantityInput('');
                              return;
                            }
                            const cleanVal = rawVal.replace(/\D/g, '');
                            if (cleanVal === '') {
                              setVectorQuantityInput('');
                              return;
                            }
                            const parsed = parseInt(cleanVal, 10);
                            setVectorQuantityInput(String(parsed));
                            if (parsed > 0) {
                              setVectorQuantity(parsed);
                            }
                          }}
                          onBlur={() => {
                            if (!vectorQuantityInput || parseInt(vectorQuantityInput, 10) < 1) {
                              setVectorQuantity(1);
                              setVectorQuantityInput('1');
                            }
                          }}
                          className="form-control"
                          style={{ textAlign: 'center', background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800, padding: '0.4rem 0.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setVectorQuantity(vectorQuantity + 1)}
                          style={{ width: '36px', height: '38px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PHYSICAL CUSTOM PATCHES */}
              {activeService === 'patches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
                </div>
              )}

              {/* Special Notes */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Special Instructions</label>
                <textarea rows={2} className="form-control" placeholder="Specify color codes, thread type, or special requests..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }} />
              </div>
            </div>

          </form>

          {/* Right Summary & Checkout Box */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '1.75rem', background: '#1e293b', border: '2px solid var(--orange-500)', borderRadius: '16px', boxShadow: '0 12px 32px rgba(255, 122, 0, 0.15)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.75rem' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Selected Service:</span>
                  <strong style={{ color: 'var(--orange-400)' }}>
                    {activeService === 'digitizing' ? 'Embroidery Digitizing' :
                     activeService === 'vector' ? 'Vector Tracing' : 'Custom Patches'}
                  </strong>
                </div>

                {activeService === 'digitizing' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Selected Tier:</span>
                      <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                        {digitizingPackageTier} (${getDigitizingPricingDetails().baseTierRate.toFixed(2)}/placement)
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Total Placements:</span>
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        {getDigitizingPricingDetails().totalPlacementItemsCount} Pcs across {placementItems.length} {placementItems.length === 1 ? 'row' : 'rows'}
                      </span>
                    </div>

                    {/* Itemized Placement Cart Breakdown */}
                    <div style={{ background: '#0f172a', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.45rem', margin: '0.2rem 0' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📍 Placements Cart ({placementItems.length}):
                      </div>
                      {getDigitizingPricingDetails().placementBreakdown.map((item, idx) => (
                        <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < placementItems.length - 1 ? '1px dashed rgba(255,255,255,0.08)' : 'none', paddingBottom: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0' }}>
                            <span>#{item.index} {item.label} (x{item.quantity}):</span>
                            <strong style={{ color: '#ffffff' }}>${item.subtotal.toFixed(2)}</strong>
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.35rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: '#ffffff' }}>
                        <span>Placements Subtotal:</span>
                        <span style={{ color: 'var(--orange-400)' }}>${getDigitizingPricingDetails().baseSubtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {getDigitizingPricingDetails().discountPercent > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700 }}>
                        <span>Bulk Discount ({getDigitizingPricingDetails().discountPercent}%):</span>
                        <span>-${getDigitizingPricingDetails().discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Machine Formats:</span>
                      <span style={{ color: 'var(--orange-400)', fontWeight: 700 }}>
                        {targetFormats.length} Formats Selected
                      </span>
                    </div>
                  </>
                )}

                {activeService === 'vector' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Selected Tier:</span>
                      <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                        {vectorComplexity === 'simple' ? 'Simple Redraw ($15.00/art)' : 'Complex Redraw ($25.00/art)'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Total Artworks:</span>
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        {vectorQuantity} {vectorQuantity === 1 ? 'Artwork' : 'Artworks'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Output Formats:</span>
                      <span style={{ color: 'var(--orange-400)', fontWeight: 700 }}>
                        {targetFormats.length} Formats Selected
                      </span>
                    </div>
                  </>
                )}

                {activeService === 'patches' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Selected Style:</span>
                      <strong style={{ color: '#ffffff' }}>
                        {patchStyle} Patch ({patchBacking})
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Total Quantity:</span>
                      <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>
                        {patchQuantity} Pcs
                      </span>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Turnaround Guarantee:</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>
                    {activeService === 'patches' 
                      ? '📦 3-5 Days Worldwide Shipping' 
                      : (isRush && totalPlacementQuantity === 1)
                        ? '⚡ 2-4 Hours Super Rush' 
                        : '8-12 Hours Standard'}
                  </span>
                </div>

                {/* Conditional Super Rush Toggle (Displayed ONLY when quantity is set to exactly 1 design) */}
                {activeService === 'digitizing' && totalPlacementQuantity === 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: isRush ? 'rgba(255, 122, 0, 0.2)' : '#0f172a',
                    border: isRush ? '1.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    marginTop: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                        ⚡ Add Super Rush (2-4 Hrs / Express)
                      </span>
                      <span style={{ fontSize: '0.72rem', color: isRush ? 'var(--orange-400)' : '#94a3b8' }}>
                        +$10.00 Express 2-4 Hour Delivery
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isRush}
                      onChange={(e) => setIsRush(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)', cursor: 'pointer' }}
                    />
                  </div>
                )}

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Total Price:</span>
                  <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--orange-400)' }}>${calculatePrice()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800, gap: '0.5rem', background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)', borderColor: '#ff7a00' }}
              >
                {isSubmitting ? 'Processing Order...' : `Complete Order ($${calculatePrice()})`} <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.85rem' }}>
                <ShieldCheck size={14} style={{ color: '#10b981' }} /> 100% Quality Guaranteed • Free Unlimited Revisions
              </div>
            </div>
          </div>

        </div>
      </div>
      )}

      </div>
    </section>
  );
};
