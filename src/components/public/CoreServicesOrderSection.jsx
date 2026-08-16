'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  PenTool, 
  Tag, 
  Upload, 
  Trash2, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  FileCode,
  Zap,
  Check,
  Plus
} from 'lucide-react';
import { PackageCard } from './PackageCard';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

export const CoreServicesOrderSection = ({ defaultService = 'digitizing', hideTabs = false, initialTier = 'standard' }) => {
  const navigate = useNavigate();
  const { dynamicPricingTiers = [], patchCards = [], pricing = {}, createOrder, protectedNavigate, showToast } = useAppState();

  // Dynamic patch craft / material rate resolver connected to database & CMS
  const getPatchStyleBaseRate = (styleName) => {
    const clean = (styleName || '').toLowerCase().trim();
    
    // 1. Check dynamicPricingTiers
    const foundDynamic = (dynamicPricingTiers || []).find(t => 
      matchCategory(t.service_type, 'patch') && 
      (t.title?.toLowerCase().includes(clean) || clean.includes(t.title?.toLowerCase()))
    );
    if (foundDynamic && !isNaN(parseFloat(foundDynamic.price))) {
      return parseFloat(foundDynamic.price);
    }

    // 2. Check patchCards from CMS
    const foundCard = (patchCards || []).find(p => 
      p.title?.toLowerCase().includes(clean) || clean.includes(p.title?.toLowerCase()) ||
      (clean.includes('woven') && (p.tierKey === 'basic' || p.id?.includes('basic'))) ||
      (clean.includes('embroidered') && (p.tierKey === 'standard' || p.id?.includes('standard'))) ||
      ((clean.includes('pvc') || clean.includes('leather')) && (p.tierKey === 'premium' || p.id?.includes('premium')))
    );
    if (foundCard) {
      const parsed = parseFloat(String(foundCard.price || foundCard.rate || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // 3. Fallback standard craft rates
    if (clean.includes('woven')) return 1.50;
    if (clean.includes('printed') || clean.includes('sublimat')) return 2.00;
    if (clean.includes('pvc') || clean.includes('rubber')) return 3.50;
    if (clean.includes('leather')) return 3.50;
    if (clean.includes('chenille')) return 4.00;
    if (clean.includes('bullion')) return 8.00;
    return parseFloat(pricing?.patchBaseRate) || 2.50;
  };

  const dynamicPatchStyles = [
    { id: 'Embroidered', label: 'Embroidered Patch', icon: '🧵', defaultRate: 2.50 },
    { id: 'Woven', label: 'Micro Woven Patch', icon: '🌐', defaultRate: 1.50 },
    { id: 'PVC', label: '3D Rubber PVC Patch', icon: '⚡', defaultRate: 3.50 },
    { id: 'Leather', label: 'Debossed Leather Patch', icon: '🪵', defaultRate: 3.50 },
    { id: 'Chenille', label: 'Varsity Chenille Patch', icon: '🏆', defaultRate: 4.00 },
    { id: 'Printed', label: 'Sublimated Printed Patch', icon: '🎨', defaultRate: 2.00 },
    { id: 'Bullion', label: 'Handmade Bullion Wire Crest', icon: '👑', defaultRate: 8.00 },
  ].map(style => {
    const rate = getPatchStyleBaseRate(style.id);
    return {
      ...style,
      rate,
      displayLabel: `${style.icon} ${style.label} ($${rate.toFixed(2)}/ea)`
    };
  });


  const [activeService, setActiveService] = useState(defaultService);
  const [isOrderViewOpen, setIsOrderViewOpen] = useState(false);

  // Common Order State
  const [title] = useState('');
  const [notes, setNotes] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [selectedAssets] = useState([]);
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
  const [vectorFormats] = useState(['ai', 'eps', 'svg', 'pdf']);

  // Service 3: Custom Patches State
  const [patchItems, setPatchItems] = useState([
    {
      id: 'pch-initial-1',
      patchStyle: 'Embroidered',
      patchBacking: 'Iron-On',
      patchWidth: 3.0,
      patchHeight: 3.0,
      quantity: 50,
      quantityInput: '50',
      specificNotes: '',
      files: []
    }
  ]);

  // Service 4: Custom T-Shirts State
  const [tshirtColor] = useState('Black');
  const [tshirtSizes] = useState({ S: 2, M: 5, L: 5, XL: 3, '2XL': 0, '3XL': 0 });

  // Service 5: Custom Caps & 3D Puff Hats State
  const [capStyle] = useState('Structured Snapback'); // 'Structured Snapback' | 'Dad Hat' | 'Beanie'
  const [capColor] = useState('Black / White Mesh');
  const [is3dPuff] = useState(true);
  const [capQuantity] = useState(12);

  // Multi-Placement Options Definition
  const [PLACEMENT_OPTIONS, setPlacementOptions] = useState([
    { id: 'left_chest', label: 'Left Chest / Polo Logo', desc: 'Standard logo up to 4.0"', isJacketBack: false },
    { id: 'cap_front', label: 'Cap / Hat Front', desc: 'Center-out pathing for 3D/flat caps', isJacketBack: false },
    { id: 'sleeve_cuff', label: 'Sleeve / Cuff Emblem', desc: 'Small side sleeve logo', isJacketBack: false },
    { id: 'full_front', label: 'Full Chest / Front', desc: 'Chest crest logo up to 8.0"', isJacketBack: false },
    { id: 'jacket_back', label: 'Jacket Back / Full Back', desc: 'Large crest (9"-12"+ high stitch count)', isJacketBack: true },
    { id: 'beanie_visor', label: 'Beanie / Visor / Pocket', desc: 'Knit beanie or visor crest', isJacketBack: false }
  ]);

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

  const addPatchItem = () => {
    setPatchItems(prev => [
      ...prev,
      {
        id: `pch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patchStyle: 'Embroidered',
        patchBacking: 'Iron-On',
        patchWidth: 3.0,
        patchHeight: 3.0,
        quantity: 50,
        quantityInput: '50',
        specificNotes: '',
        files: []
      }
    ]);
  };

  const removePatchItem = (id) => {
    if (patchItems.length <= 1) return;
    setPatchItems(prev => prev.filter(item => item.id !== id));
  };

  const updatePatchItem = (id, field, value) => {
    setPatchItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'quantity') {
          const num = Math.max(1, parseInt(value, 10) || 1);
          return { ...item, quantity: num, quantityInput: String(num) };
        }
        if (field === 'quantityInput') {
          const raw = String(value);
          if (raw === '') return { ...item, quantityInput: '', quantity: 0 };
          const clean = raw.replace(/\D/g, '');
          if (clean === '') return { ...item, quantityInput: '', quantity: 0 };
          const parsed = parseInt(clean, 10);
          return { ...item, quantityInput: String(parsed), quantity: parsed };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleBlurPatchQuantity = (id) => {
    setPatchItems(prev => prev.map(item => {
      if (item.id === id) {
        if (!item.quantityInput || parseInt(item.quantityInput, 10) < 50) {
          return { ...item, quantity: 50, quantityInput: '50' };
        }
      }
      return item;
    }));
  };

  const handlePatchFileUpload = (itemId, files) => {
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
    setPatchItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: [...(item.files || []), ...newFiles] };
      }
      return item;
    }));
  };

  const removeFileFromPatch = (itemId, fileId) => {
    setPatchItems(prev => prev.map(item => {
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

  const [FORMAT_OPTIONS, setFormatOptions] = useState([
    { id: 'dst', label: '.DST', desc: 'Tajima / Universal' },
    { id: 'pes', label: '.PES', desc: 'Brother / Baby Lock' },
    { id: 'exp', label: '.EXP', desc: 'Melco / Bernina' },
    { id: 'jef', label: '.JEF', desc: 'Janome / Elna' },
    { id: 'hus', label: '.HUS', desc: 'Husqvarna Viking' },
    { id: 'emb', label: '.EMB', desc: 'Wilcom Source File' },
    { id: 'vp3', label: '.VP3', desc: 'PFAFF / Viking' },
    { id: 'xxx', label: '.XXX', desc: 'Singer' }
  ]);

  useEffect(() => {
    import('../../services/supabaseService').then(({ getCmsContent }) => {
      getCmsContent('placement_options').then(data => {
        if (data && data.length > 0) {
          setPlacementOptions(data.map(item => ({
            ...item,
            isJacketBack: item.id === 'jacket_back'
          })));
        }
      });
      getCmsContent('format_options').then(data => {
        if (data && data.length > 0) {
          setFormatOptions(data.map(item => ({
            id: item.id,
            label: item.label.split(' ')[0], // '.DST'
            desc: item.label.split(' ').slice(1).join(' ') // '(Tajima)'
          })));
        }
      });
    });
  }, []);

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
    
    if (activeService === 'digitizing') {
      return getDigitizingPricingDetails().total;
    } else if (activeService === 'vector') {
      let vectorSubtotal = 0;
      placementItems.forEach(item => {
        const itemTier = item.packageTier || 'standard';
        const unitRate = itemTier === 'complex' || itemTier === 'premium' ? (parseFloat(pricing?.vectorComplexRate) || 25.00) : (parseFloat(pricing?.vectorSimpleRate) || 15.00);
        vectorSubtotal += unitRate * (item.quantity || 1);
      });
      base = vectorSubtotal;
    } else if (activeService === 'patches') {
      let patchesSubtotal = 0;
      patchItems.forEach(item => {
        const w = parseFloat(item.patchWidth) || 3.0;
        const h = parseFloat(item.patchHeight) || 3.0;
        const sizeInches = (w + h) / 2;
        const sizeMultiplier = sizeInches > 3.0 ? (1 + (sizeInches - 3.0) * 0.18) : 1.0;
        
        let materialBase = getPatchStyleBaseRate(item.patchStyle);
        
        let qtyDiscount = 1.0;
        const q = item.quantity || 50;
        if (q >= 500) qtyDiscount = 0.80;
        else if (q >= 250) qtyDiscount = 0.88;
        else if (q >= 100) qtyDiscount = 0.95;
        
        let backingAddon = 0;
        if (item.patchBacking === 'Velcro') backingAddon = 0.40;
        if (item.patchBacking === 'Adhesive') backingAddon = 0.25;
        
        const rateEach = parseFloat(((materialBase * sizeMultiplier * qtyDiscount) + backingAddon).toFixed(2));
        patchesSubtotal += (rateEach * q);
      });
      base = patchesSubtotal;
    } else if (activeService === 'tshirts') {
      const totalShirts = Object.values(tshirtSizes).reduce((a, b) => a + Number(b), 0);
      const unitShirtRate = totalShirts >= 50 ? 12.00 : 14.00;
      base = Math.max(1, totalShirts) * unitShirtRate;
    } else if (activeService === 'caps') {
      const unitCapRate = capQuantity >= 50 ? 10.00 : 12.00;
      const puffExtra = is3dPuff ? 2.00 : 0.00;
      base = capQuantity * (unitCapRate + puffExtra);
    }

    const totalQty = activeService === 'vector' 
      ? placementItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
      : activeService === 'patches'
      ? patchItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
      : 0;

    const allowRush = activeService === 'vector' ? (totalQty === 1) : false;
    const rushFee = (isRush && allowRush && activeService === 'vector') ? 10.00 : 0.00;
    
    return (base + rushFee).toFixed(2);
  };

  // Order Submission Handler
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (activeService === 'digitizing') {
      const invalidItem = placementItems.find(p => !p.quantityInput || parseInt(p.quantityInput, 10) < 1);
      if (invalidItem) {
        showToast('Minimum quantity per placement item is 1 Pcs.', 'error');
        return;
      }
    } else if (activeService === 'vector') {
      const invalidItem = placementItems.find(p => !p.quantityInput || parseInt(p.quantityInput, 10) < 1);
      if (invalidItem) {
        showToast('Minimum quantity per vector item is 1 Artwork.', 'error');
        return;
      }
    } else if (activeService === 'patches') {
      const invalidItem = patchItems.find(p => !p.quantityInput || parseInt(p.quantityInput, 10) < 50);
      if (invalidItem) {
        showToast('Minimum order quantity per patch item is 50 Pcs.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    const totalPrice = calculatePrice();

    let placementsSummary = '';
    let totalPlacementCount = 0;
    
    if (activeService === 'digitizing') {
      const details = getDigitizingPricingDetails();
      placementsSummary = details.placementBreakdown.map(p => `${p.label} (x${p.quantity})`).join(', ');
      totalPlacementCount = details.totalPlacementItemsCount;
    } else if (activeService === 'vector') {
      placementsSummary = placementItems.map((p, i) => `Artwork #${i+1} (x${p.quantity})`).join(', ');
      totalPlacementCount = placementItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    } else if (activeService === 'patches') {
      placementsSummary = patchItems.map((p, i) => `Patch #${i+1} (${p.patchStyle}) (x${p.quantity})`).join(', ');
      totalPlacementCount = patchItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    }

    const orderTitle = title.trim() || (
      activeService === 'digitizing' ? `Embroidery Digitizing (${placementsSummary || 'Standard Order'})` :
      activeService === 'vector' ? `Vector Tracing (${placementsSummary})` :
      activeService === 'patches' ? `Custom Patches (${placementsSummary})` :
      `Custom Order`
    );

    // Upload files to Cloudinary first
    const allFiles = activeService === 'patches' 
      ? patchItems.flatMap(item => item.files || []) 
      : placementItems.flatMap(item => item.files || []);

    const uploadedCloudinaryFiles = [];
    for (const fileItem of allFiles) {
      if (fileItem.rawFile) {
        const uploaded = await uploadFileToCloudinaryFull(fileItem.rawFile, 'client-uploads', 'orders');
        if (uploaded) {
          uploadedCloudinaryFiles.push(uploaded);
        } else {
          uploadedCloudinaryFiles.push({ name: fileItem.name, error: 'Upload failed' });
        }
      } else {
        uploadedCloudinaryFiles.push({ name: fileItem.name }); // Fallback if no rawFile
      }
    }

    const newOrderPayload = {
      title: orderTitle,
      type: activeService,
      serviceCategory: 
        activeService === 'digitizing' ? `Embroidery Digitizing (${placementsSummary})` :
        activeService === 'vector' ? `Vector Tracing (${placementsSummary})` :
        activeService === 'patches' ? `Custom Patches (${placementsSummary})` :
        activeService === 'tshirts' ? `Custom T-Shirts (${Object.values(tshirtSizes).reduce((a, b) => a + Number(b), 0)} Pcs)` :
        `Custom Caps & 3D Hats (${capQuantity}x ${capStyle})`,
      price: parseFloat(totalPrice),
      isRush: activeService === 'digitizing' ? isRush : (activeService === 'vector' ? (totalPlacementCount === 1 && isRush) : false),
      notes,
      requestedFormats: activeService === 'vector' ? vectorFormats : targetFormats,
      uploadedFiles: uploadedCloudinaryFiles, // Replaced legacy global uploads with structured Cloudinary objects
      specifications: {
        placementsSummary,
        placementItems: activeService === 'digitizing' || activeService === 'vector' ? placementItems : undefined,
        patchItems: activeService === 'patches' ? patchItems : undefined,
        totalPlacementCount,
        fabricType,
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
    } catch {
      setIsSubmitting(false);
      showToast('Order created in guest preview session', 'info');
      protectedNavigate('customer', true);
      navigate('/client-portal');
    }
  };

  return (
    <section id="order-builder" style={{ 
      padding: '5.5rem 0', 
      background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e1b4b 100%)', 
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glowing Background Orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
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

            <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
              {(() => {
                const embTiers = (dynamicPricingTiers || [])
                  .filter(t => (t.service_type || '').toLowerCase().includes('emb'))
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

                const defaultEmb = [
                  { id: 'emb-1', title: 'Left Chest & Cap Small Logo', subtitle: 'Commercial stitch files for caps, polos, shirts & jackets', price: 10.00, price_unit: '/ DESIGN', turnaround_time: '4–12 Hours', badge_text: 'BASIC', is_popular: false, features: ['Up to 4" x 4" Dimensions', '100% Hand-Mapped Stitch Pathing', 'Cap Profile Optimization'] },
                  { id: 'emb-2', title: 'Mid-Size Jacket & Sleeve Design', subtitle: 'Medium complexity artwork up to 7" x 7" with calculated density', price: 20.00, price_unit: '/ DESIGN', turnaround_time: '6–12 Hours', badge_text: 'MOST POPULAR', is_popular: true, features: ['Up to 7" x 7" Artwork Area', 'Complex Multi-Color Layering', 'Free Unlimited Revisions'] },
                  { id: 'emb-3', title: 'Full Back & 3D Puff Foam', subtitle: 'High stitch count full jacket back designs up to 12" x 12"', price: 35.00, price_unit: '/ DESIGN', turnaround_time: '8–12 Hours', badge_text: 'PRO / 3D PUFF', is_popular: false, features: ['Up to 12" x 12" Full Back Area', 'High Density 3D Puff Foam Pathing', '24/7 Priority Support'] }
                ];

                const sourceTiers = embTiers.length > 0 ? embTiers : defaultEmb;

                return sourceTiers.map((t, idx) => {
                  const cardObj = {
                    id: t.id || `emb-tier-${idx}`,
                    title: t.title,
                    subTitle: t.subtitle,
                    badge: t.badge_text,
                    popular: Boolean(t.is_popular),
                    rate: typeof t.price === 'number' ? `$${t.price.toFixed(2)}` : (String(t.price).startsWith('$') ? String(t.price) : `$${t.price}`),
                    unit: t.price_unit || '/ design',
                    delivery: t.turnaround_time,
                    btnText: t.button_text || `Order ${t.title.split(' ')[0]}`,
                    features: Array.isArray(t.features) ? t.features : []
                  };

                  return (
                    <PackageCard
                      key={cardObj.id}
                      cat={cardObj}
                      idx={idx}
                      onSelect={(selectedCat) => {
                        const tierKey = idx === 0 ? 'basic' : idx === 2 ? 'premium' : 'standard';
                        setDigitizingPackageTier(tierKey);
                        setIsOrderViewOpen(true);
                      }}
                      forceCategory="embroidery"
                    />
                  );
                });
              })()}
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
            <div className="configurator-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              alignItems: 'start'
            }}>
              
              {/* Form Left Side */}
              <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
              {/* Step 1: Service-Specific Specifications & Item Placement Options */}
              <div className="card" style={{ padding: '1.75rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--orange-400)' }} /> Step 1: Configure Digitizing Options
                </h3>

              {/* 1. EMBROIDERY DIGITIZING */}
              {activeService === 'digitizing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Package Tier Dropdown Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                      Select Pricing Package Tier *
                    </label>
                    <select
                      value={digitizingPackageTier}
                      onChange={(e) => setDigitizingPackageTier(e.target.value)}
                      className="form-control"
                      style={{
                        background: '#1e293b',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        fontSize: '0.9rem',
                        padding: '0.75rem 1rem',
                        width: '100%',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {(() => {
                        const embTiers = (dynamicPricingTiers || [])
                          .filter(t => (t.service_type || '').toLowerCase().includes('emb'))
                          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

                        if (embTiers.length > 0) {
                          return embTiers.map((t, tIdx) => {
                            const val = tIdx === 0 ? 'basic' : tIdx === 2 ? 'premium' : 'standard';
                            return (
                              <option key={t.id || tIdx} value={val}>
                                {t.badge_text ? `${t.badge_text} • ` : ''}{t.title} (${typeof t.price === 'number' ? `$${t.price.toFixed(2)}` : t.price})
                              </option>
                            );
                          });
                        }

                        return (
                          <>
                            <option value="basic">⚡ BASIC • Left Chest & Cap ($10.00)</option>
                            <option value="standard">⭐ MOST POPULAR • Mid-Size Jacket ($20.00)</option>
                            <option value="premium">✨ PRO / 3D PUFF • Full Back ($35.00)</option>
                          </>
                        );
                      })()}
                    </select>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {placementItems.map((item, index) => {
                      const itemTier = item.packageTier || 'standard';
                      const unitRate = itemTier === 'complex' || itemTier === 'premium' ? (parseFloat(pricing?.vectorComplexRate) || 25.00) : (parseFloat(pricing?.vectorSimpleRate) || 15.00);
                      const itemQty = Math.max(1, parseInt(item.quantityInput !== undefined ? item.quantityInput : item.quantity, 10) || 1);
                      const rowSubtotal = unitRate * itemQty;

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: '#0f172a',
                            border: '1.5px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '1.15rem',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {index + 1}
                              </span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                                Vector Item #{index + 1}
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
                                  title="Remove Vector Item"
                                  style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Package Tier *</label>
                              <select value={item.packageTier || 'standard'} onChange={(e) => updatePlacementItem(item.id, 'packageTier', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', fontWeight: 700 }}>
                                <option value="standard">⚡ Simple Redraw (${parseFloat(pricing?.vectorSimpleRate || 15).toFixed(2)})</option>
                                <option value="premium">✨ Complex Redraw (${parseFloat(pricing?.vectorComplexRate || 25).toFixed(2)})</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Quantity (Artworks) *</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} style={{ width: '32px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>-</button>
                                <input type="text" value={item.quantityInput !== undefined ? item.quantityInput : item.quantity} onChange={(e) => updatePlacementItem(item.id, 'quantityInput', e.target.value)} onBlur={() => handleBlurPlacementQuantity(item.id)} className="form-control" style={{ textAlign: 'center', background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', item.quantity + 1)} style={{ width: '32px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>+</button>
                              </div>
                            </div>
                            
                            {/* File Upload Zone */}
                            <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.35rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                <span>📎 Reference Artwork File for Vector #{index + 1} *</span>
                                {item.files && item.files.length > 0 && <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>{item.files.length} Attached</span>}
                              </label>

                              <div onClick={() => document.getElementById(`vec-file-${item.id}`)?.click()} style={{ border: '1.5px dashed rgba(255, 122, 0, 0.45)', background: '#0f172a', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>Upload File for Vector #{index + 1}</span>
                                <input type="file" id={`vec-file-${item.id}`} multiple style={{ display: 'none' }} onChange={(e) => handlePlacementFileUpload(item.id, e.target.files)} />
                              </div>

                              {item.files && item.files.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {item.files.map(f => (
                                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: '#0f172a', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{f.name}</span>
                                      <button type="button" onClick={() => removeFileFromPlacement(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>🗑️</button>
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

                  <button type="button" onClick={addPlacementItem} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'rgba(255, 122, 0, 0.12)', border: '1.5px dashed var(--orange-500)', color: 'var(--orange-400)', fontWeight: 800, fontSize: '0.875rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    + Add Another Vector Item
                  </button>
                  
                  {/* Target Formats for Vector */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1' }}>Required Machine File Formats *</label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                      {['ai', 'eps', 'svg', 'pdf'].map(fmt => (
                        <div key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.65rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}>
                          <input type="checkbox" checked={vectorFormats.includes(fmt)} readOnly style={{ accentColor: 'var(--orange-500)' }} />
                          <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>.{fmt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PHYSICAL CUSTOM PATCHES */}
                            {activeService === 'patches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {patchItems.map((item, index) => {
                      const itemQty = Math.max(0, parseInt(item.quantityInput !== undefined ? item.quantityInput : item.quantity, 10) || 0);

                      let materialBase = getPatchStyleBaseRate(item.patchStyle);

                      let backingAddon = 0;
                      if (item.patchBacking === 'Velcro') backingAddon = 0.40;
                      if (item.patchBacking === 'Adhesive') backingAddon = 0.25;
                      
                      const w = parseFloat(item.patchWidth) || 3.0;
                      const h = parseFloat(item.patchHeight) || 3.0;
                      const sizeInches = (w + h) / 2;
                      const sizeMultiplier = sizeInches > 3.0 ? (1 + (sizeInches - 3.0) * 0.18) : 1.0;
                      
                      let qtyDiscount = 1.0;
                      if (itemQty >= 500) qtyDiscount = 0.80;
                      else if (itemQty >= 250) qtyDiscount = 0.88;
                      else if (itemQty >= 100) qtyDiscount = 0.95;

                      const rateEach = ((materialBase * sizeMultiplier * qtyDiscount) + backingAddon).toFixed(2);
                      const itemSubtotal = (parseFloat(rateEach) * itemQty).toFixed(2);

                      return (
                        <div key={item.id} style={{ background: '#0f172a', border: '1.5px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{index + 1}</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Patch Item #{index + 1}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-400)' }}>${rateEach}/ea • Subtotal: ${itemSubtotal}</span>
                              {patchItems.length > 1 && (
                                <button type="button" onClick={() => removePatchItem(item.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>🗑️</button>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Patch Style / Craft *</label>
                              <select value={item.patchStyle || 'Embroidered'} onChange={(e) => updatePatchItem(item.id, 'patchStyle', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', fontWeight: 700 }}>
                                {dynamicPatchStyles.map(st => (
                                  <option key={st.id} value={st.id}>
                                    {st.displayLabel}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Backing Option *</label>
                              <select value={item.patchBacking} onChange={(e) => updatePatchItem(item.id, 'patchBacking', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', fontWeight: 700 }}>
                                <option value="Iron-On">Iron-On (Heat Seal)</option>
                                <option value="Velcro">Velcro (Hook & Loop)</option>
                                <option value="Sew-On">Sew-On (No Backing)</option>
                                <option value="Adhesive">Peel & Stick (Adhesive)</option>
                              </select>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Width (in)</label>
                                <input type="number" step="0.1" value={item.patchWidth} onChange={(e) => updatePatchItem(item.id, 'patchWidth', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Height (in)</label>
                                <input type="number" step="0.1" value={item.patchHeight} onChange={(e) => updatePatchItem(item.id, 'patchHeight', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem' }} />
                              </div>
                            </div>
                            
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Quantity (Min 50) *</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" onClick={() => updatePatchItem(item.id, 'quantity', Math.max(50, item.quantity - 10))} style={{ width: '32px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>-</button>
                                <input type="text" value={item.quantityInput !== undefined ? item.quantityInput : item.quantity} onChange={(e) => updatePatchItem(item.id, 'quantityInput', e.target.value)} onBlur={() => handleBlurPatchQuantity(item.id)} className="form-control" style={{ textAlign: 'center', background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
                                <button type="button" onClick={() => updatePatchItem(item.id, 'quantity', item.quantity + 10)} style={{ width: '32px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}>+</button>
                              </div>
                            </div>

                            {/* File Upload Zone */}
                            <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.35rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                <span>📎 Reference Artwork File for Patch #{index + 1} *</span>
                                {item.files && item.files.length > 0 && <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>{item.files.length} Attached</span>}
                              </label>

                              <div onClick={() => document.getElementById(`pch-file-${item.id}`)?.click()} style={{ border: '1.5px dashed rgba(255, 122, 0, 0.45)', background: '#0f172a', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>Upload File for Patch #{index + 1}</span>
                                <input type="file" id={`pch-file-${item.id}`} multiple style={{ display: 'none' }} onChange={(e) => handlePatchFileUpload(item.id, e.target.files)} />
                              </div>

                              {item.files && item.files.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {item.files.map(f => (
                                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: '#0f172a', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{f.name}</span>
                                      <button type="button" onClick={() => removeFileFromPatch(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>🗑️</button>
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

                  <button type="button" onClick={addPatchItem} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'rgba(255, 122, 0, 0.12)', border: '1.5px dashed var(--orange-500)', color: 'var(--orange-400)', fontWeight: 800, fontSize: '0.875rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    + Add Another Patch Item
                  </button>
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
