'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Upload,
  Zap, 
  ArrowRight, 
  ArrowLeft,
  FileCheck,
  FileCode,
  Trash2,
  Sparkles,
  Plus,
  Tag,
  Check,
  CheckCircle2,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  Clock,
  Layers,
  Palette
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';

export const OrderWizardModal = () => {
  const { 
    isOrderWizardOpen, 
    setIsOrderWizardOpen, 
    orderWizardInitialData,
    createOrder,
    pricing,
    showToast,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    authUser,
    isAuthenticated,
    register,
    login,
    dynamicPricingTiers = [],
    patchCards = [],
    serviceCmsContent = {},
    siteSettings = {}
  } = useAppState();

  // Wizard Step State: 1 = Service Specs & Artwork, 2 = Speed & Formats, 3 = Review, Account & Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Guest Account Setup State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [guestAuthMode, setGuestAuthMode] = useState('signup'); // 'signup' | 'login'
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Service Type: 'embroidery' | 'vector' | 'patch' | 'all'
  const [type, setType] = useState('embroidery');
  const [orderTitle, setOrderTitle] = useState('');

  // Promo code & discount coupon state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Speed & Common Instructions
  const [isRush, setIsRush] = useState(false);
  const [notes, setNotes] = useState('');

  // --- EMBROIDERY SPECIFIC STATE ---
  const [fabricType, setFabricType] = useState('Pique Cotton Polo');
  const [placementItems, setPlacementItems] = useState([
    { id: 1, packageTier: 'standard', placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }
  ]);
  const [PLACEMENT_OPTIONS, setPlacementOptions] = useState([
    { id: 'left_chest', label: 'Left Chest / Polo', desc: 'Standard logo up to 4.0"', isJacketBack: false },
    { id: 'cap_front', label: 'Cap / Hat Front', desc: 'Center-out pathing', isJacketBack: false },
    { id: 'sleeve_cuff', label: 'Sleeve / Cuff / Visor', desc: 'Small side emblem', isJacketBack: false },
    { id: 'full_front', label: 'Full Front / Chest', desc: 'Chest crest logo up to 8.0"', isJacketBack: false },
    { id: 'jacket_back', label: 'Jacket Back / Full Back', desc: 'Large crest (9"-12"+ high stitch count)', isJacketBack: true }
  ]);

  // --- VECTOR SPECIFIC STATE ---
  const [vectorApplication, setVectorApplication] = useState('Screen Printing (Color Separated)');
  const [vectorColorMode, setVectorColorMode] = useState('Full Color (CMYK / RGB)');
  const [vectorItems, setVectorItems] = useState([
    { id: 1, packageTier: 'standard', designName: 'Vector Artwork #1', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }
  ]);

  // --- PATCH SPECIFIC STATE ---
  const [patchStyle, setPatchStyle] = useState('Embroidered');
  const [patchBacking, setPatchBacking] = useState('Iron-On');
  const [patchBorderStyle, setPatchBorderStyle] = useState('Merrowed');
  const [patchWidth, setPatchWidth] = useState(3.0);
  const [patchHeight, setPatchHeight] = useState(3.0);
  const [patchQuantity, setPatchQuantity] = useState(50);
  const [patchItems, setPatchItems] = useState([
    {
      id: 1,
      packageTier: 'standard',
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

  // --- FORMATS SELECTION (SERVICE ISOLATED) ---
  const [requestedFormats, setRequestedFormats] = useState(['dst', 'pes', 'emb', 'pdf']);

  const EMBROIDERY_FORMATS = [
    { id: 'dst', label: '.DST (Tajima / Universal Stitch)' },
    { id: 'pes', label: '.PES (Brother / Babylock)' },
    { id: 'emb', label: '.EMB (Wilcom Master File)' },
    { id: 'jef', label: '.JEF (Janome / Elna)' },
    { id: 'exp', label: '.EXP (Melco / Bernina)' },
    { id: 'hus_vp3', label: '.HUS / .VP3 (Husqvarna / Pfaff)' },
    { id: 'pdf', label: '.PDF (Worksheet & Run Sheet)' }
  ];

  const VECTOR_FORMATS = [
    { id: 'ai', label: '.AI (Adobe Illustrator Vector Source)' },
    { id: 'eps', label: '.EPS (Universal Print Vector)' },
    { id: 'svg', label: '.SVG (Scalable Vector Graphics - Web & Laser)' },
    { id: 'pdf', label: '.PDF (Print-Ready High-Res Vector)' },
    { id: 'cdr', label: '.CDR (CorelDraw Vector File)' },
    { id: 'png', label: '.PNG (Transparent High-Res 300 DPI)' },
    { id: 'psd', label: '.PSD (Layered Photoshop Document)' }
  ];

  // Keep requested formats synchronized when service type changes
  useEffect(() => {
    if (type === 'vector') {
      setRequestedFormats(['ai', 'eps', 'svg', 'pdf']);
    } else if (type === 'embroidery') {
      setRequestedFormats(['dst', 'pes', 'emb', 'pdf']);
    } else if (type === 'patch') {
      setRequestedFormats([]);
    }
  }, [type]);

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
    });
  }, []);

  const applyPromoCode = (codeToApply) => {
    if (!codeToApply || !codeToApply.trim()) return;
    const clean = codeToApply.trim().toUpperCase();
    
    const activeCoupons = Array.isArray(siteSettings?.promoCodes) ? siteSettings.promoCodes : [];
    const found = activeCoupons.find(c => c.code?.toUpperCase() === clean && c.isActive !== false);

    const announcement = siteSettings?.announcement;
    const isAnnouncementCode = announcement?.promoCode && announcement.promoCode.toUpperCase() === clean;

    const banner = siteSettings?.promotionalBanner;
    const isBannerCode = banner?.promoCode && banner.promoCode.toUpperCase() === clean;

    let discountVal = 20;
    let discountType = 'percent';
    let desc = `${clean} Promotional Discount`;

    if (found) {
      discountVal = Number(found.discountValue) || 20;
      discountType = found.discountType || 'percent';
      desc = found.description || `${discountVal}% Off Special Promotion`;
    } else if (isAnnouncementCode) {
      if (announcement.discountValue !== undefined && announcement.discountValue !== null) {
        discountVal = Number(announcement.discountValue);
      } else if (announcement.text) {
        const match = announcement.text.match(/(\d+)%/);
        if (match) discountVal = Number(match[1]);
      }
      discountType = announcement.discountType || 'percent';
      desc = announcement.text || `${discountVal}% Off Announcement Offer`;
    } else if (isBannerCode) {
      if (banner.discountValue !== undefined && banner.discountValue !== null) {
        discountVal = Number(banner.discountValue);
      } else if (banner.description || banner.title) {
        const match = `${banner.title} ${banner.description}`.match(/(\d+)%/);
        if (match) discountVal = Number(match[1]);
      }
      discountType = 'percent';
      desc = banner.title || `${discountVal}% Off Welcome Offer`;
    } else if (clean === 'SAVE20' || clean === 'WELCOME20') {
      discountVal = 20;
      discountType = 'percent';
      desc = '20% Off Special Promotion';
    } else if (clean === 'WELCOME10') {
      discountVal = 10;
      discountType = 'percent';
      desc = '10% Off First-Time Client Offer';
    } else if (clean === 'FREESAMPLE') {
      discountVal = 10;
      discountType = 'fixed';
      desc = '$10 Credit Towards Order';
    } else {
      if (showToast) showToast(`Promo code ${clean} is invalid or expired`, 'error');
      return;
    }

    setAppliedPromo({
      code: clean,
      discountType,
      discountValue: discountVal,
      description: desc
    });

    const discountLabel = discountType === 'percent' ? `${discountVal}% OFF` : `$${discountVal.toFixed(2)} OFF`;
    if (showToast) showToast(`🎉 Promo code ${clean} applied (${discountLabel})!`, 'success');
  };

  useEffect(() => {
    if (isOrderWizardOpen) {
      setCurrentStep(1);
      const code = orderWizardInitialData?.promoCode || siteSettings?.announcement?.promoCode || 'SAVE20';
      if (code) {
        setPromoCodeInput(code);
        applyPromoCode(code);
      }

      if (orderWizardInitialData) {
        let detectedType = 'embroidery';
        if (orderWizardInitialData.type) {
          detectedType = orderWizardInitialData.type;
        } else if (orderWizardInitialData.serviceCategory) {
          const sc = orderWizardInitialData.serviceCategory.toLowerCase();
          if (sc.includes('vector') || sc.includes('redraw')) detectedType = 'vector';
          else if (sc.includes('patch')) detectedType = 'patch';
        } else if (orderWizardInitialData.title) {
          const t = orderWizardInitialData.title.toLowerCase();
          if (t.includes('vector') || t.includes('redraw')) detectedType = 'vector';
          else if (t.includes('patch')) detectedType = 'patch';
        }

        setType(detectedType);

        if (orderWizardInitialData.tierKey || orderWizardInitialData.tier) {
          const tier = orderWizardInitialData.tierKey || orderWizardInitialData.tier;
          setPlacementItems(prev => prev.map((item, idx) => idx === 0 ? { ...item, packageTier: tier } : item));
          setVectorItems(prev => prev.map((item, idx) => idx === 0 ? { ...item, packageTier: tier } : item));
          setPatchItems(prev => prev.map((item, idx) => idx === 0 ? { ...item, packageTier: tier } : item));
        }

        if (orderWizardInitialData.patchStyle) setPatchStyle(orderWizardInitialData.patchStyle);
        if (orderWizardInitialData.patchBacking) setPatchBacking(orderWizardInitialData.patchBacking);
        if (orderWizardInitialData.patchQuantity) setPatchQuantity(orderWizardInitialData.patchQuantity);
        if (orderWizardInitialData.title) setOrderTitle(orderWizardInitialData.title);
      }
    }
  }, [isOrderWizardOpen, orderWizardInitialData]);

  useEffect(() => {
    if (!isOrderWizardOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOrderWizardOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isOrderWizardOpen, setIsOrderWizardOpen]);

  // Placement handlers (Embroidery)
  const addPlacementItem = () => {
    setPlacementItems(prev => [
      ...prev,
      { id: Date.now(), packageTier: 'standard', placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }
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

  // Vector Item Handlers
  const addVectorItem = () => {
    setVectorItems(prev => [
      ...prev,
      { id: Date.now(), packageTier: 'standard', designName: `Vector Artwork #${prev.length + 1}`, quantity: 1, quantityInput: '1', specificNotes: '', files: [] }
    ]);
  };

  const removeVectorItem = (id) => {
    if (vectorItems.length === 1) return;
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

  const handleVectorFileUpload = (itemId, files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => {
      const fileName = file.name || 'vector_reference';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      const previewUrl = (file.type && file.type.startsWith('image/')) ? URL.createObjectURL(file) : null;
      return {
        id: `vec_file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

  const removeFileFromVector = (itemId, fileId) => {
    setVectorItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: (item.files || []).filter(f => f.id !== fileId) };
      }
      return item;
    }));
  };

  // Patch Item Handlers
  const addPatchItem = () => {
    setPatchItems(prev => [
      ...prev,
      {
        id: Date.now(),
        packageTier: 'standard',
        patchStyle: patchStyle || 'Embroidered',
        patchBacking: patchBacking || 'Iron-On',
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
    if (patchItems.length === 1) return;
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

  const handlePatchFileUpload = (itemId, files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => {
      const fileName = file.name || 'artwork_file';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      const previewUrl = (file.type && file.type.startsWith('image/')) ? URL.createObjectURL(file) : null;
      return {
        id: `patch_file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        ext: fileExt,
        previewUrl,
        rawFile: file,
        size: (file.size / 1024).toFixed(1) + ' KB'
      };
    });
    setPatchItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: [...(item.files || []), ...newFiles] };
      }
      return item;
    }));
  };

  const removePatchItemFile = (itemId, fileId) => {
    setPatchItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, files: (item.files || []).filter(f => f.id !== fileId) };
      }
      return item;
    }));
  };

  const toggleFormat = (fmtId) => {
    setRequestedFormats(prev => 
      prev.includes(fmtId) ? prev.filter(f => f !== fmtId) : [...prev, fmtId]
    );
  };

  // Pricing engine isolated per service
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
      const vecTiers = (dynamicPricingTiers || [])
        .filter(t => matchCategory(t.service_type, 'vector'))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      const basicDyn = (vecTiers[0] && !isNaN(parseFloat(vecTiers[0].price))) ? parseFloat(vecTiers[0].price) : (parseFloat(pricing?.vectorSimpleRate) || 15.00);
      const standardDyn = (vecTiers[1] && !isNaN(parseFloat(vecTiers[1].price))) ? parseFloat(vecTiers[1].price) : (parseFloat(pricing?.vectorComplexRate) || 25.00);
      const premiumDyn = (vecTiers[2] && !isNaN(parseFloat(vecTiers[2].price))) ? parseFloat(vecTiers[2].price) : 45.00;

      const safeVectorItems = Array.isArray(vectorItems) && vectorItems.length > 0 
        ? vectorItems 
        : [{ id: 1, packageTier: 'standard', designName: 'Vector Artwork #1', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }];

      let baseSubtotal = 0;
      const placementBreakdown = safeVectorItems.map((item, idx) => {
        const itemTier = item.packageTier || 'standard';
        const basicRate = (customRateVal && itemTier === 'basic') ? customRateVal : basicDyn;
        const standardRate = (customRateVal && itemTier === 'standard') ? customRateVal : standardDyn;
        const premiumRate = (customRateVal && itemTier === 'premium') ? customRateVal : premiumDyn;
        
        let rateEach = standardRate;
        if (itemTier === 'basic') rateEach = basicRate;
        if (itemTier === 'premium') rateEach = premiumRate;

        const subtotal = rateEach * (item.quantity || 1);
        baseSubtotal += subtotal;
        return {
          index: idx + 1,
          id: item.id || idx + 1,
          label: `${item.designName || `Vector Design #${idx + 1}`} (${itemTier.toUpperCase()})`,
          quantity: item.quantity || 1,
          priceEach: rateEach,
          subtotal,
          notes: item.specificNotes || ''
        };
      });

      const totalQty = safeVectorItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      const allowRush = totalQty === 1;
      const rushSurcharge = (isRush && allowRush) ? 10.00 : 0;
      
      let promoDiscountAmount = 0;
      if (appliedPromo) {
        if (appliedPromo.discountType === 'percent') {
          promoDiscountAmount = parseFloat(((baseSubtotal * appliedPromo.discountValue) / 100).toFixed(2));
        } else {
          promoDiscountAmount = parseFloat(Math.min(baseSubtotal, appliedPromo.discountValue).toFixed(2));
        }
      }

      const finalPrice = Math.max(0, parseFloat((baseSubtotal - promoDiscountAmount + rushSurcharge).toFixed(2)));

      return {
        serviceTitle: 'Vector Art & Color Separation',
        currentTier: 'mixed',
        baseTierRate: 0,
        baseSubtotal,
        promoDiscountAmount,
        appliedPromo,
        totalPlacementQuantity: totalQty,
        rushSurcharge,
        finalPrice,
        placementBreakdown
      };
    } else if (type === 'patch') {
      const patchTiers = (dynamicPricingTiers || [])
        .filter(t => matchCategory(t.service_type, 'patch'))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      const basicTierRate = (patchTiers[0] && !isNaN(parseFloat(patchTiers[0].price))) ? parseFloat(patchTiers[0].price) : 4.50;
      const standardTierRate = (patchTiers[1] && !isNaN(parseFloat(patchTiers[1].price))) ? parseFloat(patchTiers[1].price) : 2.50;
      const premiumTierRate = (patchTiers[2] && !isNaN(parseFloat(patchTiers[2].price))) ? parseFloat(patchTiers[2].price) : 1.50;

      let baseSubtotal = 0;
      let totalQty = 0;
      
      const safePatchItems = Array.isArray(patchItems) && patchItems.length > 0 
        ? patchItems 
        : [{ id: 1, packageTier: 'standard', patchStyle: 'Embroidered', patchBacking: 'Iron-On', patchWidth: 3.0, patchHeight: 3.0, quantity: 50, specificNotes: '', files: [] }];

      const placementBreakdown = safePatchItems.map((item, idx) => {
        const itemTier = item.packageTier || 'standard';
        const safeQty = Math.max(1, parseInt(item.quantity, 10) || 50);
        const w = parseFloat(item.patchWidth) || 3.0;
        const h = parseFloat(item.patchHeight) || 3.0;
        const sizeInches = (w + h) / 2;
        const sizeMultiplier = sizeInches > 3.0 ? (1 + (sizeInches - 3.0) * 0.18) : 1.0;

        let baseTierRate = standardTierRate;
        if (itemTier === 'basic') baseTierRate = basicTierRate;
        if (itemTier === 'premium') baseTierRate = premiumTierRate;

        if (customRateVal && itemTier === (orderWizardInitialData?.tierKey || 'standard')) {
          baseTierRate = customRateVal;
        }

        let backingAddon = 0;
        if (item.patchBacking === 'Velcro') backingAddon = 0.40;
        if (item.patchBacking === 'Adhesive') backingAddon = 0.25;

        const rateEach = parseFloat(((baseTierRate * sizeMultiplier) + backingAddon).toFixed(2));
        const subtotal = parseFloat((rateEach * safeQty).toFixed(2));

        baseSubtotal += subtotal;
        totalQty += safeQty;

        const foundTierObj = patchTiers.find((t, tIdx) => (tIdx === 0 && itemTier === 'basic') || (tIdx === 1 && itemTier === 'standard') || (tIdx === 2 && itemTier === 'premium'));
        const tierTitle = foundTierObj ? foundTierObj.title : (itemTier === 'basic' ? 'Sample Batch (10–50 Pcs)' : itemTier === 'premium' ? 'Wholesale Bulk Batch (500+ Pcs)' : 'Production Batch (100–500 Pcs)');

        return {
          index: idx + 1,
          id: item.id || idx + 1,
          label: `${tierTitle} - ${item.patchStyle || 'Embroidered'} (${w}"×${h}", ${item.patchBacking || 'Iron-On'})`,
          quantity: safeQty,
          priceEach: rateEach,
          subtotal: subtotal,
          notes: item.specificNotes || ''
        };
      });

      let promoDiscountAmount = 0;
      if (appliedPromo) {
        if (appliedPromo.discountType === 'percent') {
          promoDiscountAmount = parseFloat(((baseSubtotal * appliedPromo.discountValue) / 100).toFixed(2));
        } else {
          promoDiscountAmount = parseFloat(Math.min(baseSubtotal, appliedPromo.discountValue).toFixed(2));
        }
      }

      const finalPrice = Math.max(0, parseFloat((baseSubtotal - promoDiscountAmount).toFixed(2)));

      return {
        serviceTitle: 'Physical Custom Patches & Emblems',
        patchStyle: safePatchItems[0]?.patchStyle || 'Embroidered',
        patchBacking: safePatchItems[0]?.patchBacking || 'Iron-On',
        patchWidth: parseFloat(safePatchItems[0]?.patchWidth) || 3.0,
        patchHeight: parseFloat(safePatchItems[0]?.patchHeight) || 3.0,
        rateEach: placementBreakdown[0]?.priceEach || 0,
        baseSubtotal,
        promoDiscountAmount,
        totalPlacementQuantity: totalQty,
        rushSurcharge: 0,
        finalPrice,
        placementBreakdown
      };
    } else {
      // Embroidery Digitizing
      const embTiers = (dynamicPricingTiers || [])
        .filter(t => matchCategory(t.service_type, 'embroidery'))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      const basicDyn = (embTiers[0] && !isNaN(parseFloat(embTiers[0].price))) ? parseFloat(embTiers[0].price) : (parseFloat(pricing?.minOrderFee) || 10.00);
      const standardDyn = (embTiers[1] && !isNaN(parseFloat(embTiers[1].price))) ? parseFloat(embTiers[1].price) : 20.00;
      const premiumDyn = (embTiers[2] && !isNaN(parseFloat(embTiers[2].price))) ? parseFloat(embTiers[2].price) : 35.00;

      const safePlacementItems = Array.isArray(placementItems) && placementItems.length > 0 
        ? placementItems 
        : [{ id: 1, packageTier: 'standard', placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }];

      let baseSubtotal = 0;
      const placementBreakdown = safePlacementItems.map((item, idx) => {
        const itemTier = item.packageTier || 'standard';
        const basicRate = (customRateVal && itemTier === 'basic') ? customRateVal : basicDyn;
        const standardRate = (customRateVal && itemTier === 'standard') ? customRateVal : standardDyn;
        const premiumRate = (customRateVal && itemTier === 'premium') ? customRateVal : premiumDyn;

        let itemPriceEach = standardRate;
        if (itemTier === 'basic') itemPriceEach = basicRate;
        if (itemTier === 'premium') itemPriceEach = premiumRate;

        const isJacket = item.placementType === 'jacket_back' || item.placementType === 'Jacket Back Crest';
        if (isJacket && itemTier !== 'premium') itemPriceEach = standardRate;

        const subtotal = itemPriceEach * (item.quantity || 1);
        baseSubtotal += subtotal;
        
        const foundPlc = PLACEMENT_OPTIONS.find(p => p.id === item.placementType);
        const label = foundPlc ? foundPlc.label.split(' (')[0] : (item.placementType || 'Left Chest / Polo Logo');

        return {
          index: idx + 1,
          id: item.id || idx + 1,
          placementType: item.placementType,
          label: `${label} (${itemTier.toUpperCase()})`,
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

      let promoDiscountAmount = 0;
      if (appliedPromo) {
        if (appliedPromo.discountType === 'percent') {
          promoDiscountAmount = parseFloat(((discountedSubtotal * appliedPromo.discountValue) / 100).toFixed(2));
        } else {
          promoDiscountAmount = parseFloat(Math.min(discountedSubtotal, appliedPromo.discountValue).toFixed(2));
        }
      }

      const allowRush = totalPlacementQuantity === 1;
      const rushSurcharge = (isRush && allowRush) ? 10.00 : 0.00;
      const finalPrice = Math.max(0, parseFloat((discountedSubtotal - promoDiscountAmount + rushSurcharge).toFixed(2)));

      return {
        serviceTitle: 'Embroidery Digitizing',
        currentTier: 'mixed',
        baseTierRate: 0,
        baseSubtotal,
        discountPercent,
        discountAmount,
        discountedSubtotal,
        promoDiscountAmount,
        appliedPromo,
        totalPlacementQuantity,
        rushSurcharge,
        finalPrice,
        placementBreakdown
      };
    }
  };

  const pricingDetails = getServicePricingDetails();

  // Validate Step 1 before proceeding
  const handleValidateStep1 = () => {
    let hasMissingFiles = false;
    if (type === 'patch') {
      for (const item of patchItems) {
        if (!item.files || item.files.length === 0) {
          hasMissingFiles = true;
          break;
        }
      }
    } else if (type === 'vector') {
      for (const item of vectorItems) {
        if (!item.files || item.files.length === 0) {
          hasMissingFiles = true;
          break;
        }
      }
    } else {
      for (const item of placementItems) {
        if (!item.files || item.files.length === 0) {
          hasMissingFiles = true;
          break;
        }
      }
    }

    if (hasMissingFiles) {
      showToast('Please attach at least one artwork file for all items to proceed.', 'warning');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (handleValidateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (requestedFormats.length === 0 && type !== 'patch') {
        showToast('Please select at least one required output format.', 'warning');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalOrderSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isProcessingPayment) return;

    // 1. Guest Signup or Login
    let activeClientName = authUser?.company || authUser?.name || 'Valued Client';
    let activeClientEmail = (authUser?.email || '').toLowerCase().trim();
    let activeClientId = authUser?.id || authUser?.email || '';

    if (!isAuthenticated || !authUser) {
      const cleanEmail = guestEmail.toLowerCase().trim();
      const cleanPass = guestPassword.trim();
      const cleanName = guestName.trim();

      if (!cleanEmail || !cleanPass) {
        showToast('Please enter your email and password to create/access your account.', 'warning');
        return;
      }

      setIsSubmittingAuth(true);
      if (guestAuthMode === 'signup') {
        if (!cleanName) {
          showToast('Please enter your full name.', 'warning');
          setIsSubmittingAuth(false);
          return;
        }
        const regRes = await register(cleanName, cleanEmail, cleanPass, guestCompany);
        if (!regRes || !regRes.success) {
          showToast(regRes?.error || 'Registration error. Please check your details.', 'error');
          setIsSubmittingAuth(false);
          return;
        }
        activeClientName = regRes.user?.name || cleanName;
        activeClientEmail = cleanEmail;
        activeClientId = regRes.user?.id || cleanEmail;
      } else {
        const loginRes = await login(cleanEmail, cleanPass);
        if (!loginRes || !loginRes.success) {
          showToast(loginRes?.error || 'Invalid credentials. Please verify your email and password.', 'error');
          setIsSubmittingAuth(false);
          return;
        }
        activeClientName = loginRes.user?.name || 'Valued Client';
        activeClientEmail = cleanEmail;
        activeClientId = loginRes.user?.id || cleanEmail;
      }
      setIsSubmittingAuth(false);
    }

    const finalPrice = pricingDetails?.finalPrice || 15.00;
    setIsProcessingPayment(true);

    try {
      // 2. Process and upload files per item
      const updatedPlacementItems = [];
      const updatedVectorItems = [];
      const updatedPatchItems = [];
      const allUploadedFiles = [];

      if (type === 'patch') {
        for (const item of patchItems) {
          const itemFiles = [];
          for (const fileItem of (item.files || [])) {
            if (fileItem.rawFile) {
              const uploaded = await uploadFileToCloudinaryFull(fileItem.rawFile, 'client-uploads', 'orders');
              if (uploaded && uploaded.url) {
                const fileObj = {
                  id: fileItem.id,
                  name: fileItem.name,
                  url: uploaded.url,
                  public_url: uploaded.url,
                  size: uploaded.size || fileItem.size,
                  type: fileItem.type || 'image/png',
                  format: uploaded.format || fileItem.name?.split('.').pop()
                };
                itemFiles.push(fileObj);
                allUploadedFiles.push(fileObj);
              }
            } else if (fileItem.url) {
              itemFiles.push(fileItem);
              allUploadedFiles.push(fileItem);
            }
          }
          updatedPatchItems.push({ ...item, files: itemFiles });
        }
      } else if (type === 'vector') {
        for (const item of vectorItems) {
          const itemFiles = [];
          for (const fileItem of (item.files || [])) {
            if (fileItem.rawFile) {
              const uploaded = await uploadFileToCloudinaryFull(fileItem.rawFile, 'client-uploads', 'orders');
              if (uploaded && uploaded.url) {
                const fileObj = {
                  id: fileItem.id,
                  name: fileItem.name,
                  url: uploaded.url,
                  public_url: uploaded.url,
                  size: uploaded.size || fileItem.size,
                  type: fileItem.type || 'image/png',
                  format: uploaded.format || fileItem.name?.split('.').pop()
                };
                itemFiles.push(fileObj);
                allUploadedFiles.push(fileObj);
              }
            } else if (fileItem.url) {
              itemFiles.push(fileItem);
              allUploadedFiles.push(fileItem);
            }
          }
          updatedVectorItems.push({ ...item, files: itemFiles });
        }
      } else {
        for (const item of placementItems) {
          const itemFiles = [];
          for (const fileItem of (item.files || [])) {
            if (fileItem.rawFile) {
              const uploaded = await uploadFileToCloudinaryFull(fileItem.rawFile, 'client-uploads', 'orders');
              if (uploaded && uploaded.url) {
                const fileObj = {
                  id: fileItem.id,
                  name: fileItem.name,
                  url: uploaded.url,
                  public_url: uploaded.url,
                  size: uploaded.size || fileItem.size,
                  type: fileItem.type || 'image/png',
                  format: uploaded.format || fileItem.name?.split('.').pop()
                };
                itemFiles.push(fileObj);
                allUploadedFiles.push(fileObj);
              }
            } else if (fileItem.url) {
              itemFiles.push(fileItem);
              allUploadedFiles.push(fileItem);
            }
          }
          updatedPlacementItems.push({ ...item, files: itemFiles });
        }
      }

      const primaryArtworkUrl = allUploadedFiles[0]?.url || null;

      const orderData = {
        title: orderTitle.trim() || `${pricingDetails?.serviceTitle || 'Custom'} Order`,
        type,
        serviceCategory: pricingDetails?.serviceTitle || (type === 'patch' ? 'Custom Patches' : type === 'vector' ? 'Vector Tracing' : 'Embroidery Digitizing'),
        price: parseFloat(finalPrice),
        clientName: activeClientName,
        clientEmail: activeClientEmail,
        clientId: activeClientId,
        placementItems: type === 'embroidery' ? updatedPlacementItems : [],
        vectorItems: type === 'vector' ? updatedVectorItems : [],
        patchItems: type === 'patch' ? updatedPatchItems : [],
        fabricType: type === 'embroidery' ? fabricType : null,
        vectorApplication: type === 'vector' ? vectorApplication : null,
        vectorColorMode: type === 'vector' ? vectorColorMode : null,
        requestedFormats: type !== 'patch' ? requestedFormats : [],
        isRush,
        patchStyle: type === 'patch' ? patchStyle : null,
        patchBacking: type === 'patch' ? patchBacking : null,
        patchBorderStyle: type === 'patch' ? patchBorderStyle : null,
        patchWidth: type === 'patch' ? patchWidth : null,
        patchHeight: type === 'patch' ? patchHeight : null,
        patchQuantity: type === 'patch' ? patchQuantity : null,
        notes: notes.trim(),
        totalPrice: finalPrice,
        original_price: pricingDetails?.baseSubtotal || finalPrice,
        discount_amount: pricingDetails?.promoDiscountAmount || 0,
        applied_promo_code: appliedPromo?.code || null,
        artworkUrl: primaryArtworkUrl,
        image_url: primaryArtworkUrl,
        logo: primaryArtworkUrl,
        uploadedFiles: allUploadedFiles,
        paymentStatus: 'pending'
      };

      let createdOrder = null;
      if (createOrder) {
        createdOrder = await createOrder(orderData);
      }
      
      const orderId = createdOrder?.id || `ORDER_${Date.now()}`;

      setCheckoutSession({
        amount: finalPrice,
        orderId: orderId,
      });
      setIsCheckoutModalOpen(true);
      setIsOrderWizardOpen(false);
    } catch (err) {
      console.error("Order creation error:", err);
      showToast('Error creating order: ' + (err.message || 'Unknown error'), 'error');
      setIsProcessingPayment(false);
    }
  };

  if (!isOrderWizardOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOrderWizardOpen(false);
      }}
      style={{
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
        padding: '1rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div 
        className="modal-dialog order-wizard-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '94dvh',
          height: 'auto',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto'
        }}
      >
        {/* Header with Title and Step Progress Tracker */}
        <div 
          className="order-wizard-header"
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid #334155',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '24px 24px 0 0',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: type !== 'all' ? '0.85rem' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: type === 'vector' ? 'rgba(59, 130, 246, 0.2)' : type === 'patch' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                border: type === 'vector' ? '1px solid rgba(59, 130, 246, 0.4)' : type === 'patch' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: type === 'vector' ? '#60a5fa' : type === 'patch' ? '#34d399' : 'var(--orange-400)',
                flexShrink: 0
              }}>
                {type === 'vector' ? <FileCode size={20} /> : type === 'patch' ? <FileCheck size={20} /> : <Sparkles size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                  {type === 'all' 
                    ? 'Choose Your Desired Service' 
                    : type === 'vector'
                    ? 'Configure Vector Art Redraw'
                    : type === 'patch'
                    ? 'Configure Custom Physical Patches'
                    : 'Configure Embroidery Digitizing'}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  {type === 'vector'
                    ? 'Clean vector paths (.AI, .EPS, .SVG, .PDF) • Color separated • Print ready'
                    : type === 'patch'
                    ? 'Custom physical patches & emblems • Free digital proofing • Global shipping'
                    : 'Machine-ready files (.DST, .PES, .EMB) • Zero thread breaks • 24/7 Production'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {type !== 'all' && (
                <button
                  type="button"
                  onClick={() => setType('all')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Change selected service"
                >
                  <Layers size={13} /> Change Service
                </button>
              )}

              <button 
                type="button"
                onClick={() => setIsOrderWizardOpen(false)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  color: '#cbd5e1', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  transition: 'all 0.15s' 
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 3-Step Interactive Breadcrumb Bar */}
          {type !== 'all' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.35rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {[
                { step: 1, title: '1. Specs & Artwork', icon: Layers },
                { step: 2, title: '2. Speed & Formats', icon: Clock },
                { step: 3, title: '3. Review & Payment', icon: ShieldCheck }
              ].map(st => {
                const isActive = currentStep === st.step;
                const isPassed = currentStep > st.step;
                const IconComp = st.icon;

                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => {
                      if (isPassed || (st.step === 2 && handleValidateStep1())) {
                        setCurrentStep(st.step);
                      }
                    }}
                    style={{
                      background: isActive ? 'var(--orange-500)' : isPassed ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: isActive ? '1px solid var(--orange-400)' : isPassed ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                      color: isActive ? '#ffffff' : isPassed ? '#34d399' : '#94a3b8',
                      padding: '0.45rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 900 : 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      cursor: isPassed || isActive ? 'pointer' : 'default',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isPassed ? <Check size={14} /> : <IconComp size={14} />}
                    <span style={{ whiteSpace: 'nowrap' }}>{st.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SERVICE SELECTOR MODAL (WHEN TYPE === 'ALL') */}
        {type === 'all' ? (
          <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 1.5rem)', textAlign: 'center', background: '#f8fafc', overflowY: 'auto', flex: '1 1 auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Order Launcher</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--navy-950)', marginTop: '0.2rem' }}>Select Service Category</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Configure specs, upload artwork, and receive verified production files with instant pricing</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem', maxWidth: '980px', margin: '0 auto' }}>
              
              {/* Choice 1: Embroidery Digitizing */}
              <div 
                onClick={() => { setType('embroidery'); setCurrentStep(1); }} 
                style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '2rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }} 
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--orange-500)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} 
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ color: 'var(--orange-500)', marginBottom: '1rem', background: 'var(--orange-50)', padding: '1rem', borderRadius: '50%', border: '1px solid var(--orange-200)' }}>
                  <Sparkles size={32} />
                </div>
                <h3 style={{ color: 'var(--navy-950)', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.4rem' }}>Embroidery Digitizing</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>Machine-ready files (.DST, .PES, .EMB) with stitch density optimization. Starting at $10.00.</p>
                <div style={{ marginTop: '1.25rem', color: 'var(--orange-600)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Configure Order <ArrowRight size={15} />
                </div>
              </div>

              {/* Choice 2: Vector Art Redraw */}
              <div 
                onClick={() => { setType('vector'); setCurrentStep(1); }} 
                style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '2rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }} 
                onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-4px)'; }} 
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ color: '#2563eb', marginBottom: '1rem', background: '#eff6ff', padding: '1rem', borderRadius: '50%', border: '1px solid #bfdbfe' }}>
                  <FileCode size={32} />
                </div>
                <h3 style={{ color: 'var(--navy-950)', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.4rem' }}>Vector Art Redraw</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>Clean vector paths (.AI, .EPS, .SVG, .PDF) ready for screen printing & laser. Starting at $15.00.</p>
                <div style={{ marginTop: '1.25rem', color: '#2563eb', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Configure Order <ArrowRight size={15} />
                </div>
              </div>

              {/* Choice 3: Custom Physical Patches */}
              <div 
                onClick={() => { setType('patch'); setCurrentStep(1); }} 
                style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '2rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }} 
                onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-4px)'; }} 
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ color: '#059669', marginBottom: '1rem', background: '#ecfdf5', padding: '1rem', borderRadius: '50%', border: '1px solid #a7f3d0' }}>
                  <FileCheck size={32} />
                </div>
                <h3 style={{ color: 'var(--navy-950)', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.4rem' }}>Custom Physical Patches</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>Embroidered, Woven, PVC rubber, and Leather emblems with backings. Starting at $1.50/pc.</p>
                <div style={{ marginTop: '1.25rem', color: '#059669', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Configure Order <ArrowRight size={15} />
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* MULTI-STEP ORDER CONFIGURATOR */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: '1 1 auto', 
            minHeight: 0, 
            background: '#f8fafc',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div style={{ padding: 'clamp(1rem, 2vw, 1.5rem)', flex: '1 1 auto' }}>
              
              {/* ================= STEP 1: SPECS & ARTWORK ================= */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Order Title (Optional) */}
                  <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.35rem' }}>
                      Project Reference / Design Name (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={orderTitle} 
                      onChange={(e) => setOrderTitle(e.target.value)} 
                      placeholder={type === 'vector' ? "e.g. Apex Falcons Vector Redraw" : type === 'patch' ? "e.g. Falcon Squad PVC Patches" : "e.g. Apex Falcons Left Chest Logo"}
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem 0.85rem', 
                        borderRadius: '10px', 
                        border: '1.5px solid #cbd5e1', 
                        fontSize: '0.9rem', 
                        color: 'var(--navy-950)', 
                        fontWeight: 700,
                        background: '#ffffff'
                      }} 
                    />
                  </div>

                  {/* ==================== 1. VECTOR ART CONFIGURATION ==================== */}
                  {type === 'vector' && (
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
                            🎨 Vector Design Items ({vectorItems.length})
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                            Configure complexity tiers and attach reference artwork for each vector redraw
                          </p>
                        </div>

                        <button 
                          type="button" 
                          onClick={addVectorItem} 
                          style={{ 
                            background: '#eff6ff', 
                            border: '1px solid #bfdbfe', 
                            color: '#1d4ed8', 
                            padding: '0.45rem 0.85rem', 
                            borderRadius: '8px', 
                            fontSize: '0.8rem', 
                            fontWeight: 800, 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.3rem' 
                          }}
                        >
                          <Plus size={14} /> Add Another Vector Artwork
                        </button>
                      </div>

                      {vectorItems.map((item, index) => (
                        <div key={item.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.15rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ background: '#2563eb', color: '#ffffff', fontSize: '0.75rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                #{index + 1}
                              </span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                                Vector Design #{index + 1}
                              </span>
                            </div>

                            {vectorItems.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeVectorItem(item.id)} 
                                style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Vector Complexity Tier *
                              </label>
                              <select 
                                value={item.packageTier || 'standard'} 
                                onChange={(e) => updateVectorItem(item.id, 'packageTier', e.target.value)} 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }}
                              >
                                <option value="basic">⚡ Simple Vector ($15.00) — Typography & basic outlines</option>
                                <option value="standard">⭐ Medium Detail ($25.00) — Multi-color logos & graphics</option>
                                <option value="premium">✨ Complex Illustration ($45.00) — Mascots, crests & gradients</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Design Label / Name
                              </label>
                              <input 
                                type="text" 
                                value={item.designName || ''} 
                                onChange={(e) => updateVectorItem(item.id, 'designName', e.target.value)} 
                                placeholder="e.g. Front Chest Vector Logo" 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }} 
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Quantity of Variations
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" onClick={() => updateVectorItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} style={{ width: '34px', height: '36px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: 'var(--navy-900)', fontWeight: 900, borderRadius: '8px', cursor: 'pointer' }}>-</button>
                                <input type="text" value={item.quantityInput} onChange={(e) => updateVectorItem(item.id, 'quantityInput', e.target.value)} style={{ textAlign: 'center', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontWeight: 800, padding: '0.35rem', borderRadius: '8px', width: '60px' }} />
                                <button type="button" onClick={() => updateVectorItem(item.id, 'quantity', item.quantity + 1)} style={{ width: '34px', height: '36px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: 'var(--navy-900)', fontWeight: 900, borderRadius: '8px', cursor: 'pointer' }}>+</button>
                              </div>
                            </div>
                          </div>

                          {/* Drag and Drop Artwork Upload Zone */}
                          <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '12px', border: '1.5px dashed #cbd5e1', marginTop: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                                📎 Reference Image / Logo to Convert (Required) *
                              </label>
                              {item.files && item.files.length > 0 && (
                                <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle2 size={13} /> {item.files.length} File Attached
                                </span>
                              )}
                            </div>

                            <div 
                              onClick={() => document.getElementById(`vector-file-${item.id}`).click()}
                              style={{
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '10px',
                                padding: '1rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                            >
                              <Upload size={20} style={{ color: '#2563eb', margin: '0 auto 0.35rem auto' }} />
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                                Click to browse or drag & drop reference image
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Supports .PNG, .JPG, .PDF, .PSD, .BMP, .TIFF
                              </div>
                              <input 
                                type="file" 
                                id={`vector-file-${item.id}`} 
                                multiple 
                                style={{ display: 'none' }} 
                                onChange={(e) => handleVectorFileUpload(item.id, e.target.files)} 
                              />
                            </div>

                            {/* Attached Files List with Instant Preview */}
                            {item.files && item.files.length > 0 && (
                              <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {item.files.map(f => (
                                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {f.previewUrl ? (
                                        <img src={f.previewUrl} alt="preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                                      ) : (
                                        <FileCode size={16} style={{ color: '#2563eb' }} />
                                      )}
                                      <span style={{ color: 'var(--navy-950)', fontWeight: 800 }}>{f.name}</span>
                                      {f.size && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({f.size})</span>}
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => removeFileFromVector(item.id, f.id)} 
                                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 900, fontSize: '0.9rem' }}
                                      title="Remove file"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Vector Application & Color Mode Specs */}
                      <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                            Intended Output / Printing Process *
                          </label>
                          <select 
                            value={vectorApplication} 
                            onChange={(e) => setVectorApplication(e.target.value)} 
                            style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.55rem' }}
                          >
                            <option value="Screen Printing (Color Separated)">Screen Printing (Spot Color Separated Layers)</option>
                            <option value="Vinyl Cutting / Plotter (Clean Paths)">Vinyl Cutting / Plotter (Single Clean Vector Contours)</option>
                            <option value="Direct-to-Film (DTF) / Sublimation">Direct-to-Film (DTF) / Direct-to-Garment (DTG)</option>
                            <option value="Laser Engraving / CNC Cutting">Laser Engraving / CNC / Wood Cutting</option>
                            <option value="Large Format Signage & Banners">Large Format Signage & Banners</option>
                            <option value="General High-Res Digital & Web Branding">General High-Res Digital & Web Branding</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                            Color Separation Preference *
                          </label>
                          <select 
                            value={vectorColorMode} 
                            onChange={(e) => setVectorColorMode(e.target.value)} 
                            style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.55rem' }}
                          >
                            <option value="Full Color (CMYK / RGB)">Full Color (CMYK / RGB Vector Graphic)</option>
                            <option value="Pantone (PMS) Color Matched">Pantone (PMS) Solid Color Matched</option>
                            <option value="Spot Color Layer Separation">Spot Color Layered (Ready for Screen Print)</option>
                            <option value="Black & White (1-Color Silhouette)">Black & White (1-Color Silhouette Outlines)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== 2. EMBROIDERY DIGITIZING CONFIGURATION ==================== */}
                  {type === 'embroidery' && (
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
                            📍 Placement Items & Artwork Files ({placementItems.length})
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                            Configure sizes and upload your logo for each embroidery placement
                          </p>
                        </div>

                        <button 
                          type="button" 
                          onClick={addPlacementItem} 
                          style={{ 
                            background: 'var(--orange-50)', 
                            border: '1px solid var(--orange-300)', 
                            color: 'var(--orange-700)', 
                            padding: '0.45rem 0.85rem', 
                            borderRadius: '8px', 
                            fontSize: '0.8rem', 
                            fontWeight: 800, 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.3rem' 
                          }}
                        >
                          <Plus size={14} /> Add Placement Item
                        </button>
                      </div>

                      {placementItems.map((item, index) => (
                        <div key={item.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.15rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                #{index + 1}
                              </span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                                Placement Item #{index + 1}
                              </span>
                            </div>

                            {placementItems.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removePlacementItem(item.id)} 
                                style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Complexity / Package Tier *
                              </label>
                              <select 
                                value={item.packageTier || 'standard'} 
                                onChange={(e) => updatePlacementItem(item.id, 'packageTier', e.target.value)} 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }}
                              >
                                <option value="basic">⚡ Left Chest & Cap ($10.00 Flat)</option>
                                <option value="standard">⭐ Mid-Size Jacket ($20.00 Flat)</option>
                                <option value="premium">✨ Full Back & 3D ($35.00 Flat)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Placement Location
                              </label>
                              <select 
                                value={item.placementType} 
                                onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)} 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }}
                              >
                                {PLACEMENT_OPTIONS.map(plc => (
                                  <option key={plc.id} value={plc.id}>{plc.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Quantity
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} style={{ width: '34px', height: '36px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: 'var(--navy-900)', fontWeight: 900, borderRadius: '8px', cursor: 'pointer' }}>-</button>
                                <input type="text" value={item.quantityInput} onChange={(e) => updatePlacementItem(item.id, 'quantityInput', e.target.value)} style={{ textAlign: 'center', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontWeight: 800, padding: '0.35rem', borderRadius: '8px', width: '60px' }} />
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', item.quantity + 1)} style={{ width: '34px', height: '36px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: 'var(--navy-900)', fontWeight: 900, borderRadius: '8px', cursor: 'pointer' }}>+</button>
                              </div>
                            </div>
                          </div>

                          {/* Drag and Drop Artwork Upload Zone */}
                          <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '12px', border: '1.5px dashed #cbd5e1', marginTop: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                                📎 Reference Artwork File (Required) *
                              </label>
                              {item.files && item.files.length > 0 && (
                                <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle2 size={13} /> {item.files.length} File Attached
                                </span>
                              )}
                            </div>

                            <div 
                              onClick={() => document.getElementById(`placement-file-${item.id}`).click()}
                              style={{
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '10px',
                                padding: '1rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--orange-500)'; e.currentTarget.style.background = 'var(--orange-50)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                            >
                              <Upload size={20} style={{ color: 'var(--orange-500)', margin: '0 auto 0.35rem auto' }} />
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                                Click to browse or drag & drop artwork
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Supports .PNG, .JPG, .AI, .PDF, .EPS, .PSD
                              </div>
                              <input 
                                type="file" 
                                id={`placement-file-${item.id}`} 
                                multiple 
                                style={{ display: 'none' }} 
                                onChange={(e) => handlePlacementFileUpload(item.id, e.target.files)} 
                              />
                            </div>

                            {/* Attached Files List with Instant Preview */}
                            {item.files && item.files.length > 0 && (
                              <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {item.files.map(f => (
                                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {f.previewUrl ? (
                                        <img src={f.previewUrl} alt="preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                                      ) : (
                                        <FileCheck size={16} style={{ color: 'var(--orange-500)' }} />
                                      )}
                                      <span style={{ color: 'var(--navy-950)', fontWeight: 800 }}>{f.name}</span>
                                      {f.size && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({f.size})</span>}
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => removeFileFromPlacement(item.id, f.id)} 
                                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 900, fontSize: '0.9rem' }}
                                      title="Remove file"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Fabric / Target Garment Selection for Embroidery */}
                      <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                          Target Garment / Fabric Type *
                        </label>
                        <select 
                          value={fabricType} 
                          onChange={(e) => setFabricType(e.target.value)} 
                          style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, borderRadius: '8px', padding: '0.6rem' }}
                        >
                          <option value="Pique Cotton Polo">Pique Cotton Polo (Standard Underlay)</option>
                          <option value="Structured Twill Cap">Structured Twill Cap / Snapback (Center-Out Pathing)</option>
                          <option value="Fleece Hoodie / Sweatshirt">Fleece Hoodie / Sweatshirt (Knockdown Underlay)</option>
                          <option value="Beanie / Ribbed Knit Cap">Beanie / Ribbed Knit Cap (Heavy Underlay)</option>
                          <option value="T-Shirt / Performance Polyester">T-Shirt / Performance Polyester (Light Density)</option>
                          <option value="Jacket / Leather / Outerwear">Jacket / Leather / Outerwear</option>
                          <option value="Towel / Terry Cloth">Towel / Terry Cloth (Water Soluble Topping)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ==================== 3. CUSTOM PATCHES CONFIGURATION ==================== */}
                  {type === 'patch' && (
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
                            🧵 Patch Specifications & Artwork
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                            Select patch style, dimensions, backing, and quantity
                          </p>
                        </div>
                      </div>

                      {patchItems.map((item, index) => (
                        <div key={item.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.15rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Patch Style *
                              </label>
                              <select 
                                value={item.patchStyle || 'Embroidered'} 
                                onChange={(e) => updatePatchItem(item.id, 'patchStyle', e.target.value)} 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }}
                              >
                                {dynamicPatchStyles.map(st => (
                                  <option key={st.id} value={st.id}>{st.displayLabel}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Backing Type *
                              </label>
                              <select 
                                value={item.patchBacking || 'Iron-On'} 
                                onChange={(e) => updatePatchItem(item.id, 'patchBacking', e.target.value)} 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }}
                              >
                                <option value="Iron-On">Heat Press / Iron-On (Standard)</option>
                                <option value="Velcro">Hook & Loop (Velcro) (+$0.40/ea)</option>
                                <option value="Sew-On">Sew-On (Plastic Backing)</option>
                                <option value="Adhesive">Peel & Stick (Adhesive) (+$0.25/ea)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Batch Quantity (Pcs) *
                              </label>
                              <input 
                                type="text" 
                                value={item.quantityInput} 
                                onChange={(e) => updatePatchItem(item.id, 'quantityInput', e.target.value)} 
                                placeholder="50" 
                                style={{ width: '100%', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', padding: '0.5rem' }} 
                              />
                            </div>
                          </div>

                          {/* Patch File Dropzone */}
                          <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '12px', border: '1.5px dashed #cbd5e1', marginTop: '0.85rem' }}>
                            <div 
                              onClick={() => document.getElementById(`patch-file-${item.id}`).click()}
                              style={{
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '10px',
                                padding: '1rem',
                                textAlign: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Upload size={20} style={{ color: 'var(--orange-500)', margin: '0 auto 0.35rem auto' }} />
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                                Click or drag artwork file (.PNG, .JPG, .AI, .PDF)
                              </div>
                              <input 
                                type="file" 
                                id={`patch-file-${item.id}`} 
                                multiple 
                                style={{ display: 'none' }} 
                                onChange={(e) => handlePatchFileUpload(item.id, e.target.files)} 
                              />
                            </div>

                            {item.files && item.files.length > 0 && (
                              <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {item.files.map(f => (
                                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {f.previewUrl ? <img src={f.previewUrl} alt="preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} /> : <FileCheck size={16} style={{ color: 'var(--orange-500)' }} />}
                                      <span style={{ color: 'var(--navy-950)', fontWeight: 800 }}>{f.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removePatchItemFile(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 900 }}>✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* ================= STEP 2: SPEED & FORMATS ================= */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Rush Turnaround Toggle Card */}
                  {type !== 'patch' && (
                    <div 
                      onClick={() => setIsRush(!isRush)}
                      style={{
                        background: isRush ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : '#ffffff',
                        border: isRush ? '2px solid var(--orange-500)' : '1.5px solid #cbd5e1',
                        padding: '1.15rem 1.35rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: isRush ? '0 4px 15px rgba(249, 115, 22, 0.15)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: isRush ? 'var(--orange-500)' : 'var(--orange-50)',
                          color: isRush ? '#ffffff' : 'var(--orange-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Zap size={22} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--navy-950)', display: 'block' }}>
                            ⚡ Super Rush (2–4 Hrs / Express) Turnaround
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Need urgent delivery? Get your completed file in 2–4 hours (+$10.00)
                          </span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isRush} 
                        onChange={() => {}} 
                        style={{ width: '20px', height: '20px', accentColor: 'var(--orange-500)', cursor: 'pointer' }} 
                      />
                    </div>
                  )}

                  {/* Required Output Formats Selection (Isolated for Vector vs Embroidery) */}
                  {type !== 'patch' && (
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '0.35rem' }}>
                        {type === 'vector' ? 'Required Vector Output Formats *' : 'Required Machine Embroidery Formats *'}
                      </label>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        {type === 'vector' 
                          ? 'Select all vector and graphic formats you need delivered in your download pack:' 
                          : 'Select all embroidery machine formats you need delivered in your download bundle:'}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.5rem' }}>
                        {(type === 'vector' ? VECTOR_FORMATS : EMBROIDERY_FORMATS).map(fmt => {
                          const isSelected = requestedFormats.includes(fmt.id);
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => toggleFormat(fmt.id)}
                              style={{
                                background: isSelected 
                                  ? (type === 'vector' ? '#2563eb' : 'var(--orange-500)') 
                                  : '#f8fafc',
                                border: isSelected 
                                  ? (type === 'vector' ? '1.5px solid #1d4ed8' : '1.5px solid var(--orange-600)') 
                                  : '1.5px solid #e2e8f0',
                                color: isSelected ? '#ffffff' : 'var(--navy-900)',
                                padding: '0.65rem 0.75rem',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.12s'
                              }}
                            >
                              <span>{fmt.label}</span>
                              {isSelected && <Check size={14} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions / Notes (Customized per service) */}
                  <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '0.35rem' }}>
                      {type === 'vector' 
                        ? 'Special Vectorization & Redraw Instructions (Optional)' 
                        : type === 'patch'
                        ? 'Special Custom Patch Instructions (Optional)'
                        : 'Special Digitizing Instructions / Color Codes (Optional)'}
                    </label>
                    <textarea 
                      rows={4} 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder={
                        type === 'vector'
                          ? "e.g. Please convert raster image to clean vector paths, match Pantone 286 C for navy, separate colors into distinct layers for screen printing, remove white background, keep typography sharp..."
                          : type === 'patch'
                          ? "e.g. Specific border merrowing color, laser-cut contour details, thread matching, custom packaging instructions..."
                          : "e.g. Please match Madeira Classic 1147 for royal blue, trim jump stitches closely, 3D puff on letters, center-out pathing for cap front..."
                      }
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: '10px', 
                        border: '1.5px solid #cbd5e1', 
                        fontSize: '0.85rem', 
                        color: 'var(--navy-950)', 
                        background: '#ffffff',
                        lineHeight: 1.5 
                      }} 
                    />
                  </div>

                </div>
              )}

              {/* ================= STEP 3: REVIEW, ACCOUNT & PAYMENT ================= */}
              {currentStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
                  
                  {/* Left Column: Account Details (for guest) or Authenticated Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {isAuthenticated && authUser ? (
                      /* Authenticated User Status Card */
                      <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '18px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Verified Client Profile</span>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                              {authUser.company || authUser.name || 'Valued Client'}
                            </h4>
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', fontSize: '0.825rem', color: 'var(--navy-800)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <Mail size={14} style={{ color: 'var(--orange-500)' }} />
                            <span><strong>Delivery Email:</strong> {authUser.email}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Your order and finished files will appear in your Client Portal.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Guest Quick Account Setup Card */
                      <div style={{ background: '#ffffff', padding: '1.35rem', borderRadius: '18px', border: '1.5px solid var(--orange-300)', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {guestAuthMode === 'signup' ? '⚡ Instant Client Account' : '🔑 Client Sign In'}
                            </span>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                              {guestAuthMode === 'signup' ? 'Where should we send your files?' : 'Sign in to your account'}
                            </h4>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {guestAuthMode === 'signup' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                                Full Name / Contact Person *
                              </label>
                              <div style={{ position: 'relative' }}>
                                <User size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                                <input 
                                  type="text" 
                                  value={guestName} 
                                  onChange={(e) => setGuestName(e.target.value)} 
                                  placeholder="John Doe" 
                                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: '#ffffff' }} 
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                              Email Address (For File Delivery) *
                            </label>
                            <div style={{ position: 'relative' }}>
                              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                              <input 
                                type="email" 
                                value={guestEmail} 
                                onChange={(e) => setGuestEmail(e.target.value)} 
                                placeholder="name@company.com" 
                                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: '#ffffff' }} 
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                              Password (To access your tracker) *
                            </label>
                            <div style={{ position: 'relative' }}>
                              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                              <input 
                                type="password" 
                                value={guestPassword} 
                                onChange={(e) => setGuestPassword(e.target.value)} 
                                placeholder="••••••••" 
                                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: '#ffffff' }} 
                              />
                            </div>
                          </div>

                          {guestAuthMode === 'signup' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                                Business / Company Name (Optional)
                              </label>
                              <div style={{ position: 'relative' }}>
                                <Building size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                                <input 
                                  type="text" 
                                  value={guestCompany} 
                                  onChange={(e) => setGuestCompany(e.target.value)} 
                                  placeholder="Apex Studio" 
                                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: '#ffffff' }} 
                                />
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setGuestAuthMode(guestAuthMode === 'signup' ? 'login' : 'signup')}
                              style={{ background: 'none', border: 'none', color: 'var(--orange-600)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                              {guestAuthMode === 'signup' ? 'Already have an account? Sign In instead' : "Don't have an account? Create one now"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Specs Summary Card */}
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '0.65rem' }}>
                        📋 Production Specifications
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem', color: 'var(--navy-800)' }}>
                        <div><strong>Service:</strong> {pricingDetails.serviceTitle}</div>
                        {type === 'vector' && <div><strong>Application:</strong> {vectorApplication}</div>}
                        {type === 'vector' && <div><strong>Color Mode:</strong> {vectorColorMode}</div>}
                        {type === 'embroidery' && <div><strong>Garment:</strong> {fabricType}</div>}
                        {type === 'patch' && <div><strong>Patch Style:</strong> {patchStyle} ({patchBacking})</div>}
                        {type !== 'patch' && <div><strong>Output Formats:</strong> {requestedFormats.join(', ').toUpperCase()}</div>}
                        <div><strong>Turnaround:</strong> {type === 'patch' ? '7–10 Days Physical Dispatch' : isRush ? '⚡ 2–4 Hours Super Rush' : '8–12 Hours Standard'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Price Breakdown & Promo Box */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                        Price Summary
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                        {pricingDetails.placementBreakdown.map((item, idx) => (
                          <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--navy-900)' }}>
                            <span>#{item.index} {item.label} (x{item.quantity}):</span>
                            <strong>${item.subtotal.toFixed(2)}</strong>
                          </div>
                        ))}

                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                          <span>Subtotal:</span>
                          <span style={{ color: type === 'vector' ? '#2563eb' : 'var(--orange-600)' }}>${pricingDetails.baseSubtotal.toFixed(2)}</span>
                        </div>

                        {pricingDetails.rushSurcharge > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-600)' }}>
                            <span>⚡ Super Rush Surcharge:</span>
                            <span>+${pricingDetails.rushSurcharge.toFixed(2)}</span>
                          </div>
                        )}

                        {pricingDetails.promoDiscountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: '#16a34a' }}>
                            <span>Promo Discount ({appliedPromo?.code}):</span>
                            <span>-${pricingDetails.promoDiscountAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Promo Code Input Box */}
                      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.85rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--orange-700)', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                            <Tag size={13} /> Coupon Code
                          </span>
                          {appliedPromo && (
                            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 900 }}>
                              ✓ {appliedPromo.code} Active
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input 
                            type="text" 
                            placeholder="e.g. SAVE20" 
                            value={promoCodeInput} 
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} 
                            style={{ flex: 1, background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.65rem', color: 'var(--navy-950)', fontSize: '0.85rem', fontWeight: 900 }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => applyPromoCode(promoCodeInput)} 
                            style={{ background: 'var(--orange-500)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' }}
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--navy-950)' }}>Total Price:</span>
                          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: type === 'vector' ? '#2563eb' : 'var(--orange-600)', fontFamily: 'var(--font-heading)' }}>
                            ${pricingDetails.finalPrice.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isProcessingPayment || isSubmittingAuth}
                          onClick={handleFinalOrderSubmit}
                          className="btn btn-primary-orange"
                          style={{
                            width: '100%',
                            padding: '0.95rem',
                            fontSize: '1.05rem',
                            fontWeight: 900,
                            borderRadius: '12px',
                            background: type === 'vector' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                            boxShadow: type === 'vector' ? '0 8px 24px rgba(37, 99, 235, 0.35)' : '0 8px 24px rgba(249, 115, 22, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isProcessingPayment || isSubmittingAuth ? (
                            <span>Setting up order & payment...</span>
                          ) : (
                            <>Proceed to Secure Payment (${pricingDetails.finalPrice.toFixed(2)}) <ArrowRight size={18} /></>
                          )}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem', fontWeight: 600 }}>
                          ✓ 100% Quality Guaranteed • Free Unlimited Revisions • 256-Bit SSL Encrypted
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Footer Navigation Bar */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    style={{
                      background: '#f1f5f9',
                      border: '1.5px solid #cbd5e1',
                      color: 'var(--navy-900)',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsOrderWizardOpen(false)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: 'var(--navy-700)',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Price</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: type === 'vector' ? '#2563eb' : 'var(--orange-600)', lineHeight: 1 }}>
                    ${pricingDetails.finalPrice.toFixed(2)}
                  </div>
                </div>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn btn-primary-orange"
                    style={{
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      borderRadius: '10px',
                      background: type === 'vector' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    Continue to {currentStep === 1 ? 'Step 2: Formats & Speed' : 'Step 3: Review & Pay'} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessingPayment || isSubmittingAuth}
                    onClick={handleFinalOrderSubmit}
                    className="btn btn-primary-orange"
                    style={{
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      borderRadius: '10px',
                      background: type === 'vector' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔒 Proceed to Payment <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
