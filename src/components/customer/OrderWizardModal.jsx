'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Upload,
  Zap, 
  ArrowRight, 
  FileCheck,
  FileCode,
  Trash2,
  Sparkles,
  Plus,
  Tag
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
    updateOrderStatus,
    showToast,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    walletBalance,
    setIsDepositModalOpen,
    dynamicPricingTiers = [],
    serviceCmsContent = {},
    siteSettings = {}
  } = useAppState();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');
  
  // Promo code & discount coupon state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Itemized Placements Cart State with default initial placement item
  const [placementItems, setPlacementItems] = useState([
    { id: 1, packageTier: 'standard', placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }
  ]);

  const [type, setType] = useState('embroidery'); // 'embroidery' | 'vector' | 'patch'
  const [title] = useState('');
  
  const [, setPlacementType] = useState('Left Chest / Polo');
  const [, setServiceCategory] = useState('Left Chest Digitizing');
  const [fabricType, setFabricType] = useState('Pique Cotton Polo');
  const defaultReqFormats = serviceCmsContent?.['order_wizard_formats'] || ['dst', 'pes', 'emb', 'svg'];
  const [requestedFormats, setRequestedFormats] = useState(defaultReqFormats);
  const [isRush, setIsRush] = useState(false);
  const [notes, setNotes] = useState('');

  // Custom Patches State Variables with safe defaults
  const [patchStyle, setPatchStyle] = useState('Embroidered'); // 'Embroidered' | 'Woven' | 'PVC' | 'Leather'
  const [patchBacking, setPatchBacking] = useState('Iron-On'); // 'Iron-On' | 'Velcro' | 'Sew-On' | 'Adhesive'
  const [patchBorderStyle] = useState('Merrowed'); // 'Merrowed' | 'Die-Cut'
  const [patchWidth] = useState(3.0);
  const [patchHeight] = useState(3.0);
  const [patchQuantity, setPatchQuantity] = useState(50);
  const [, setPatchQuantityInput] = useState('50');

  // Multi-Item Custom Patch List State
  const [patchItems, setPatchItems] = useState([
    {
      id: 1,
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

  const applyPromoCode = (codeToApply) => {
    if (!codeToApply || !codeToApply.trim()) return;
    const clean = codeToApply.trim().toUpperCase();
    
    // 1. Check promoCodes list from siteSettings
    const activeCoupons = Array.isArray(siteSettings?.promoCodes) ? siteSettings.promoCodes : [];
    const found = activeCoupons.find(c => c.code?.toUpperCase() === clean && c.isActive !== false);

    // 2. Check Top Announcement Bar configuration
    const announcement = siteSettings?.announcement;
    const isAnnouncementCode = announcement?.promoCode && announcement.promoCode.toUpperCase() === clean;

    // 3. Check Visitor Promotion Banner configuration
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

  React.useEffect(() => {
    setPatchQuantityInput(String(patchQuantity));
  }, [patchQuantity]);

  React.useEffect(() => {
    if (isOrderWizardOpen) {
      const code = orderWizardInitialData?.promoCode || siteSettings?.announcement?.promoCode || 'SAVE20';
      if (code) {
        setPromoCodeInput(code);
        applyPromoCode(code);
      }

      if (orderWizardInitialData) {
        if (orderWizardInitialData.tierKey || orderWizardInitialData.tier) {
          setPlacementItems(prev => prev.map((item, idx) => {
            if (idx === 0) return { ...item, packageTier: orderWizardInitialData.tierKey || orderWizardInitialData.tier };
            return item;
          }));
        }
        if (orderWizardInitialData.type) {
          setType(orderWizardInitialData.type);
        }
        if (orderWizardInitialData.patchStyle) setPatchStyle(orderWizardInitialData.patchStyle);
        if (orderWizardInitialData.patchBacking) setPatchBacking(orderWizardInitialData.patchBacking);
        if (orderWizardInitialData.patchQuantity) setPatchQuantity(orderWizardInitialData.patchQuantity);
        if (orderWizardInitialData.serviceCategory || orderWizardInitialData.title) {
          setServiceCategory(orderWizardInitialData.serviceCategory || orderWizardInitialData.title);
        }
        if (orderWizardInitialData.placementType) {
          setPlacementType(orderWizardInitialData.placementType);
        }
      }
    }
  }, [isOrderWizardOpen, orderWizardInitialData]);

  const addPatchItem = () => {
    setPatchItems(prev => [
      ...prev,
      {
        id: Date.now(),
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
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        ext: fileExt,
        previewUrl,
        file
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

  const [PLACEMENT_OPTIONS, setPlacementOptions] = useState([
    { id: 'left_chest', label: 'Left Chest / Polo', desc: 'Standard logo up to 4.0"', isJacketBack: false },
    { id: 'cap_front', label: 'Cap / Hat Front', desc: 'Center-out pathing', isJacketBack: false },
    { id: 'sleeve_cuff', label: 'Sleeve / Cuff / Visor', desc: 'Small side emblem', isJacketBack: false },
    { id: 'full_front', label: 'Full Front / Chest', desc: 'Chest crest logo up to 8.0"', isJacketBack: false },
    { id: 'jacket_back', label: 'Jacket Back / Full Back', desc: 'Large crest (9"-12"+ high stitch count)', isJacketBack: true }
  ]);

  React.useEffect(() => {
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
      const safePlacementItems = Array.isArray(placementItems) && placementItems.length > 0 
        ? placementItems 
        : [{ id: 1, packageTier: 'standard', placementType: 'vector_redraw', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }];

      let baseSubtotal = 0;
      const placementBreakdown = safePlacementItems.map((item, idx) => {
        const itemTier = item.packageTier || 'standard';
        const basicRate = (customRateVal && itemTier === 'basic') ? customRateVal : 15.00;
        const standardRate = (customRateVal && itemTier === 'standard') ? customRateVal : 25.00;
        const premiumRate = (customRateVal && itemTier === 'premium') ? customRateVal : 40.00;
        
        let rateEach = standardRate;
        if (itemTier === 'basic') rateEach = basicRate;
        if (itemTier === 'premium') rateEach = premiumRate;

        const subtotal = rateEach * (item.quantity || 1);
        baseSubtotal += subtotal;
        return {
          index: idx + 1,
          id: item.id || idx + 1,
          label: `Vector Artwork #${idx + 1} (${itemTier.toUpperCase()})`,
          quantity: item.quantity || 1,
          priceEach: rateEach,
          subtotal,
          notes: item.specificNotes || ''
        };
      });

      const totalQty = safePlacementItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
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
      let baseSubtotal = 0;
      let totalQty = 0;
      
      const safePatchItems = Array.isArray(patchItems) && patchItems.length > 0 
        ? patchItems 
        : [{ id: 1, patchStyle: 'Embroidered', patchBacking: 'Iron-On', patchWidth: 3.0, patchHeight: 3.0, quantity: 50, specificNotes: '', files: [] }];

      const placementBreakdown = safePatchItems.map((item, idx) => {
        const safeQty = Math.max(0, parseInt(item.quantity, 10) || 50);
        const w = parseFloat(item.patchWidth) || 3.0;
        const h = parseFloat(item.patchHeight) || 3.0;
        const sizeInches = (w + h) / 2;
        const sizeMultiplier = sizeInches > 3.0 ? (1 + (sizeInches - 3.0) * 0.18) : 1.0;

        let materialBase = 2.50;
        if (item.patchStyle === 'Woven') materialBase = 1.50;
        if (item.patchStyle === 'Embroidered') materialBase = 2.50;
        if (item.patchStyle === 'PVC' || item.patchStyle === 'Leather') materialBase = 3.50;

        let qtyDiscount = 1.0;
        if (safeQty >= 500) qtyDiscount = 0.80;
        else if (safeQty >= 250) qtyDiscount = 0.88;
        else if (safeQty >= 100) qtyDiscount = 0.95;

        let backingAddon = 0;
        if (item.patchBacking === 'Velcro') backingAddon = 0.40;
        if (item.patchBacking === 'Adhesive') backingAddon = 0.25;

        const rateEach = parseFloat(((materialBase * sizeMultiplier * qtyDiscount) + backingAddon).toFixed(2));
        const subtotal = parseFloat((rateEach * safeQty).toFixed(2));

        baseSubtotal += subtotal;
        totalQty += safeQty;

        return {
          index: idx + 1,
          id: item.id || idx + 1,
          label: `${item.patchStyle || 'Embroidered'} Patch (${w}"×${h}", ${item.patchBacking || 'Iron-On'} Backing)`,
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
        appliedPromo,
        totalPlacementQuantity: totalQty,
        rushSurcharge: 0,
        finalPrice,
        placementBreakdown
      };
    } else {
      // Embroidery Digitizing
      const safePlacementItems = Array.isArray(placementItems) && placementItems.length > 0 
        ? placementItems 
        : [{ id: 1, packageTier: 'standard', placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }];

      let baseSubtotal = 0;
      const placementBreakdown = safePlacementItems.map((item, idx) => {
        const itemTier = item.packageTier || 'standard';
        const basicRate = (customRateVal && itemTier === 'basic') ? customRateVal : (parseFloat(pricing?.minOrderFee) || 10.00);
        const standardRate = (customRateVal && itemTier === 'standard') ? customRateVal : (parseFloat(pricing?.vectorSimpleRate) || 15.00);
        const premiumRate = (customRateVal && itemTier === 'premium') ? customRateVal : (parseFloat(pricing?.vectorComplexRate) || 25.00);

        let itemPriceEach = standardRate;
        if (itemTier === 'basic') itemPriceEach = basicRate;
        if (itemTier === 'premium') itemPriceEach = premiumRate;

        const isJacket = item.placementType === 'jacket_back' || item.placementType === 'Jacket Back Crest';
        if (isJacket) itemPriceEach = 20.00; // Overwrite for jacket back if needed

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
      const rushSurcharge = (isRush && allowRush) ? (parseFloat(pricing?.rushSurcharge) || 10.00) : 0;
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ENFORCE COMPULSORY IMAGE ATTACHMENTS
    let hasMissingFiles = false;
    if (type === 'patch') {
      for (const item of patchItems) {
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
      if (showToast) showToast('Please attach at least one image/artwork file for ALL items.', 'error');
      else alert('Please attach at least one image/artwork file for ALL items.');
      return; // Block submission
    }

    const orderTitle = title.trim() || `${pricingDetails?.serviceTitle || 'Service'} Order`;
    const finalPrice = pricingDetails?.finalPrice || 15.00;

    setIsProcessingPayment(true);

    try {
      // Upload all files to Cloudinary first
      const allFiles = type === 'patch' 
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

      const orderData = {
        title: orderTitle,
        type,
        serviceCategory: pricingDetails?.serviceTitle || type || 'Embroidery Digitizing',
        price: parseFloat(finalPrice),
        placementItems,
        fabricType,
        requestedFormats,
        isRush,
        patchStyle,
        patchBacking,
        patchBorderStyle,
        patchWidth,
        patchHeight,
        patchQuantity,
        patchItems,
        notes: notes.trim(),
        totalPrice: finalPrice,
        original_price: pricingDetails?.baseSubtotal || finalPrice,
        discount_amount: pricingDetails?.promoDiscountAmount || 0,
        applied_promo_code: appliedPromo?.code || null,
        uploadedFiles: uploadedCloudinaryFiles,
        patchWidth,
        patchHeight,
        patchQuantity,
        patchItems,
        notes: notes.trim(),
        totalPrice: finalPrice,
        uploadedFiles: uploadedCloudinaryFiles,
        paymentStatus: 'pending' // Enforce pending payment status
      };

      let createdOrder = null;
      if (createOrder) {
        createdOrder = await createOrder(orderData);
      }
      
      const orderId = createdOrder?.id || `ORDER_${Date.now()}`;
      setPendingOrderId(orderId);

      // Pass the state to CheckoutModal to let the user select payment method
      setCheckoutSession({
        amount: finalPrice,
        orderId: orderId,
        // Invoice will be created by the CheckoutModal when method is selected
      });
      setIsCheckoutModalOpen(true);
      setIsOrderWizardOpen(false); // Close the wizard
    } catch (err) {
       console.error("Order creation error:", err);
       showToast('Error creating order: ' + (err.message || 'Unknown error'), 'error');
       setIsProcessingPayment(false);
    }
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
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '1140px',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
        overflow: 'hidden',
        margin: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #334155',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--orange-400)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                {type === 'all' ? 'Choose Your Service' : `Configure ${pricingDetails?.serviceTitle || 'Order'}`}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                {type === 'all' ? 'Select a service below to start your order configuration' : 'Multi-step order configuration with live instant pricing calculation'}
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsOrderWizardOpen(false)}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <X size={18} />
          </button>
        </div>

        {type === 'all' ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
              
              {/* Embroidery */}
              <div onClick={() => setType('embroidery')} style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '2.5rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--orange-500)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ color: 'var(--orange-500)', marginBottom: '1.25rem', background: 'var(--orange-50)', padding: '1rem', borderRadius: '50%', border: '1px solid var(--orange-200)' }}>
                  <Sparkles size={36} />
                </div>
                <h3 style={{ color: 'var(--navy-950)', fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.5rem' }}>Embroidery Digitizing</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0, lineHeight: 1.5 }}>Machine-ready files (.DST, .PES, .EMB) with zero thread breaks. Starting at $10.00.</p>
              </div>

              {/* Vector */}
              <div onClick={() => setType('vector')} style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '2.5rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ color: '#2563eb', marginBottom: '1.25rem', background: '#eff6ff', padding: '1rem', borderRadius: '50%', border: '1px solid #bfdbfe' }}>
                  <FileCode size={36} />
                </div>
                <h3 style={{ color: 'var(--navy-950)', fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.5rem' }}>Vector Art Redraw</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0, lineHeight: 1.5 }}>Scalable vector graphics (.AI, .EPS, .SVG) with Pantone color matching. Starting at $15.00.</p>
              </div>

              {/* Patches */}
              <div onClick={() => setType('patch')} style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '2.5rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ color: '#059669', marginBottom: '1.25rem', background: '#ecfdf5', padding: '1rem', borderRadius: '50%', border: '1px solid #a7f3d0' }}>
                  <FileCheck size={36} />
                </div>
                <h3 style={{ color: 'var(--navy-950)', fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.5rem' }}>Custom Physical Patches</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0, lineHeight: 1.5 }}>Embroidered, Woven, PVC rubber, and Leather emblems. Starting at $1.50/pc.</p>
              </div>

            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', background: '#f8fafc' }}>

          <div className="configurator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Step 1: Configure Service Options */}
              <div style={{ padding: '1.75rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '1.35rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--orange-500)' }} /> Step 1: Configure {pricingDetails.serviceTitle} Options
                  </h3>
                </div>

                {/* 1. EMBROIDERY DIGITIZING & VECTOR REDRAW */}
                {['embroidery', 'vector'].includes(type) && (
                  <>
                    {/* Interactive Placements Cart */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          📍 Configure Order Placements ({placementItems.length} Item{placementItems.length > 1 ? 's' : ''}) *
                        </label>
                        <button type="button" onClick={addPlacementItem} style={{ background: 'var(--orange-50)', border: '1px solid var(--orange-300)', color: 'var(--orange-700)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s' }}>
                          <Plus size={14} /> Add Another Placement
                        </button>
                      </div>

                      {placementItems.map((item, index) => (
                        <div key={item.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.15rem', marginBottom: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
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
                              <button type="button" onClick={() => removePlacementItem(item.id)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Package Tier *
                              </label>
                              <select value={item.packageTier || 'standard'} onChange={(e) => updatePlacementItem(item.id, 'packageTier', e.target.value)} className="form-control" style={{ background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}>
                                {(() => {
                                  const matchingTiers = (dynamicPricingTiers || [])
                                    .filter(t => matchCategory(t.service_type, type))
                                    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

                                  if (matchingTiers.length > 0) {
                                    return matchingTiers.map((t, tIdx) => {
                                      const keyVal = tIdx === 0 ? 'basic' : tIdx === 1 ? 'standard' : 'premium';
                                      return (
                                        <option key={t.id || tIdx} value={keyVal}>
                                          {t.title} (${typeof t.price === 'number' ? t.price.toFixed(2) : t.price})
                                        </option>
                                      );
                                    });
                                  }

                                  if (type === 'vector') {
                                    return (
                                      <>
                                        <option value="basic">⚡ Simple Logo ($15.00)</option>
                                        <option value="standard">⭐ Medium Detail ($25.00)</option>
                                        <option value="premium">✨ Complex Illustration ($45.00)</option>
                                      </>
                                    );
                                  }

                                  return (
                                    <>
                                      <option value="basic">⚡ Left Chest & Cap ($10.00 Flat)</option>
                                      <option value="standard">⭐ Mid-Size Jacket ($20.00 Flat)</option>
                                      <option value="premium">✨ Full Back & 3D ($35.00 Flat)</option>
                                    </>
                                  );
                                })()}
                              </select>
                            </div>

                            {type === 'embroidery' ? (
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                  Placement Location
                                </label>
                                <select value={item.placementType} onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)} className="form-control" style={{ background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}>
                                  {PLACEMENT_OPTIONS.map(plc => (
                                    <option key={plc.id} value={plc.id}>{plc.label}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                  Design Label / Name *
                                </label>
                                <input type="text" value={item.placementType || ''} onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)} placeholder="e.g. Front Chest Artwork" className="form-control" style={{ background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }} />
                              </div>
                            )}

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                Quantity
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} style={{ width: '34px', height: '36px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', color: 'var(--navy-900)', fontWeight: 900, borderRadius: '8px', cursor: 'pointer' }}>-</button>
                                <input type="text" value={item.quantityInput} onChange={(e) => updatePlacementItem(item.id, 'quantityInput', e.target.value)} className="form-control" style={{ textAlign: 'center', background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontWeight: 800, padding: '0.35rem', borderRadius: '8px' }} />
                                <button type="button" onClick={() => updatePlacementItem(item.id, 'quantity', item.quantity + 1)} style={{ width: '34px', height: '36px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', color: 'var(--navy-900)', fontWeight: 900, borderRadius: '8px', cursor: 'pointer' }}>+</button>
                              </div>
                            </div>
                          </div>

                          {/* Dedicated File Upload Zone for this Placement */}
                          <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '0.85rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                              <span>📎 Reference Artwork File for Item #{index + 1} *</span>
                              {item.files && item.files.length > 0 && (
                                <span style={{ color: 'var(--orange-600)', fontWeight: 800 }}>✓ {item.files.length} File Attached</span>
                              )}
                            </label>

                            <div
                              onClick={() => document.getElementById(`modal-plc-file-${item.id}`)?.click()}
                              style={{
                                border: '2px dashed var(--orange-300)',
                                background: '#fffaf5',
                                borderRadius: '8px',
                                padding: '0.85rem 1rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--orange-500)'; e.currentTarget.style.background = '#fff7ed'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--orange-300)'; e.currentTarget.style.background = '#fffaf5'; }}
                            >
                              <Upload size={16} style={{ color: 'var(--orange-500)' }} />
                              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-800)' }}>
                                Click to Upload or Drag File for Item #{index + 1} (.JPG, .PNG, .PDF, .AI)
                              </span>
                              <input
                                type="file"
                                id={`modal-plc-file-${item.id}`}
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => handlePlacementFileUpload(item.id, e.target.files)}
                              />
                            </div>

                            {item.files && item.files.length > 0 && (
                              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {item.files.map(f => (
                                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.65rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <FileCode size={14} style={{ color: 'var(--orange-500)' }} />
                                      <span style={{ fontWeight: 800, color: 'var(--navy-950)' }}>{f.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removeFileFromPlacement(item.id, f.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontWeight: 800 }}>
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {type === 'embroidery' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                              Target Garment Fabric *
                            </label>
                            <select value={fabricType} onChange={(e) => setFabricType(e.target.value)} className="form-control" style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', color: 'var(--navy-950)', fontWeight: 700, borderRadius: '8px' }}>
                              <option value="Pique Cotton Polo">Pique Polo Cotton (Pull compensation calibrated)</option>
                              <option value="Fleece Hoodie">Fleece Hoodie / Sweatshirt (High loft underlay)</option>
                              <option value="Structured Cap 3D Foam">Structured Cap / Hat (3D Foam Capped)</option>
                              <option value="Performance Dry-Fit">Performance Dry-Fit Polyester (Anti-puckering)</option>
                              <option value="Towel / Terry Cloth">Towel / Thick Plush Terry (Solvy topping)</option>
                              <option value="Leather / Canvas">Leather / Heavy Canvas (Sharp needle acute)</option>
                              <option value="Softshell Jacket">Softshell Jacket / Outerwear</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                              Required Machine File Formats
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                              {(serviceCmsContent?.['format_options'] || [{id: 'dst', label: '.DST (Universal)'}, {id: 'pes', label: '.PES (Brother)'}, {id: 'exp', label: '.EXP (Melco)'}, {id: 'jef', label: '.JEF (Janome)'}, {id: 'emb', label: '.EMB (Wilcom)'}]).map(fmt => {
                                const isChecked = requestedFormats.includes(fmt.id);
                                return (
                                  <div 
                                    key={fmt.id} 
                                    onClick={() => toggleFormat(fmt.id)} 
                                    style={{ 
                                      padding: '0.6rem 0.8rem', 
                                      background: isChecked ? '#fff7ed' : '#ffffff', 
                                      border: isChecked ? '1.5px solid var(--orange-500)' : '1.5px solid #cbd5e1', 
                                      borderRadius: '8px', 
                                      cursor: 'pointer', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.45rem',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ accentColor: 'var(--orange-500)' }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: isChecked ? 900 : 700, color: isChecked ? 'var(--orange-800)' : 'var(--navy-800)' }}>
                                      {fmt.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 2. VECTOR ART & COLOR SEPARATION */}
                {type === 'vector' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                      Required Vector File Deliverables
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                      {(serviceCmsContent?.['vector_format_options'] || [{id: 'ai', ext: '.AI (Illustrator)'}, {id: 'eps', ext: '.EPS (Vector)'}, {id: 'svg', ext: '.SVG (Scalable)'}, {id: 'pdf', ext: '.PDF (Print Ready)'}, {id: 'cdr', ext: '.CDR (CorelDraw)'}]).map(fmt => {
                        const fmtId = (fmt.id || fmt.ext).toLowerCase();
                        const isChecked = requestedFormats.includes(fmtId);
                        return (
                          <div 
                            key={fmt.id || fmt.ext} 
                            onClick={() => toggleFormat(fmtId)} 
                            style={{ 
                              padding: '0.6rem 0.8rem', 
                              background: isChecked ? '#fff7ed' : '#ffffff', 
                              border: isChecked ? '1.5px solid var(--orange-500)' : '1.5px solid #cbd5e1', 
                              borderRadius: '8px', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.45rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ accentColor: 'var(--orange-500)' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: isChecked ? 900 : 700, color: isChecked ? 'var(--orange-800)' : 'var(--navy-800)' }}>
                              {fmt.ext || fmt.name || fmt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. PHYSICAL CUSTOM PATCHES */}
                {type === 'patch' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          📍 Configure Patch Items ({patchItems.length} {patchItems.length === 1 ? 'Item' : 'Items'}) *
                        </label>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Configure individual materials, backing options, quantities, and logo artwork.
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--orange-700)', fontWeight: 900, background: 'var(--orange-50)', padding: '0.3rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--orange-200)' }}>
                        Total Quantity: {pricingDetails.totalPlacementQuantity} Pcs
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {patchItems.map((item, index) => {
                        const itemQty = Math.max(0, parseInt(item.quantityInput !== undefined ? item.quantityInput : item.quantity, 10) || 0);

                        let materialBase = 2.50;
                        if (item.patchStyle === 'Woven') materialBase = 1.50;
                        if (item.patchStyle === 'Embroidered') materialBase = 2.50;
                        if (item.patchStyle === 'PVC' || item.patchStyle === 'Leather') materialBase = 3.50;

                        let backingAddon = 0;
                        if (item.patchBacking === 'Velcro') backingAddon = 0.40;
                        if (item.patchBacking === 'Adhesive') backingAddon = 0.25;

                        const rateEach = (materialBase + backingAddon).toFixed(2);
                        const itemSubtotal = (parseFloat(rateEach) * itemQty).toFixed(2);

                        return (
                          <div
                            key={item.id}
                            style={{
                              background: '#f8fafc',
                              border: '1.5px solid #e2e8f0',
                              borderRadius: '14px',
                              padding: '1.25rem',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {index + 1}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                                  Patch Item #{index + 1}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-700)' }}>
                                  ${rateEach}/ea • Subtotal: ${itemSubtotal}
                                </span>

                                {patchItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePatchItem(item.id)}
                                    title="Remove Patch Item"
                                    style={{
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      color: '#dc2626',
                                      borderRadius: '6px',
                                      padding: '0.3rem 0.55rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={13} /> Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                  Patch Craft / Material *
                                </label>
                                <select
                                  value={item.patchStyle || 'Embroidered'}
                                  onChange={(e) => updatePatchItem(item.id, 'patchStyle', e.target.value)}
                                  className="form-control"
                                  style={{ background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}
                                >
                                  <option value="Embroidered">🧵 Embroidered Patch ($2.50/ea)</option>
                                  <option value="Woven">🌐 Micro Woven Patch ($1.50/ea)</option>
                                  <option value="PVC">⚡ 3D Rubber PVC Patch ($3.50/ea)</option>
                                  <option value="Leather">🪵 Debossed Leather Patch ($3.50/ea)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                  Backing Attachment *
                                </label>
                                <select
                                  value={item.patchBacking || 'Iron-On'}
                                  onChange={(e) => updatePatchItem(item.id, 'patchBacking', e.target.value)}
                                  className="form-control"
                                  style={{ background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}
                                >
                                  <option value="Iron-On">🔴 Iron-On / Heat Seal</option>
                                  <option value="Velcro">⚡ Tactical Velcro Hook & Loop (+$0.40)</option>
                                  <option value="Adhesive">📌 Peel & Stick Adhesive (+$0.25)</option>
                                  <option value="Sew-On">🪡 Standard Sew-On (Felt Backing)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                                  Quantity (min. 50 Pcs) *
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={item.quantityInput !== undefined ? item.quantityInput : item.quantity}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => updatePatchItem(item.id, 'quantityInput', e.target.value)}
                                  onBlur={() => {
                                    if (!item.quantityInput || parseInt(item.quantityInput, 10) < 50) {
                                      updatePatchItem(item.id, 'quantityInput', '50');
                                    }
                                  }}
                                  className="form-control"
                                  placeholder="min. 50"
                                  style={{
                                    background: '#ffffff',
                                    color: 'var(--navy-950)',
                                    border: (item.quantityInput === '' || parseInt(item.quantityInput, 10) < 50) ? '1.5px solid #fb923c' : '1.5px solid #cbd5e1',
                                    fontWeight: 800,
                                    borderRadius: '8px'
                                  }}
                                />
                              </div>

                              <div style={{ gridColumn: 'span 2', background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '0.35rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                                  <span>📎 Upload Logo / Artwork for Patch Item #{index + 1} *</span>
                                  {item.files && item.files.length > 0 && (
                                    <span style={{ color: 'var(--orange-600)', fontWeight: 800 }}>✓ {item.files.length} File Attached</span>
                                  )}
                                </label>

                                <div
                                  onClick={() => document.getElementById(`patch-file-input-${item.id}`)?.click()}
                                  style={{
                                    border: '2px dashed var(--orange-300)',
                                    background: '#fffaf5',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <Upload size={16} style={{ color: 'var(--orange-500)' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-800)' }}>
                                    Click or drop artwork file (.PNG, .JPG, .AI, .PDF)
                                  </span>
                                  <input
                                    type="file"
                                    id={`patch-file-input-${item.id}`}
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={(e) => handlePatchFileUpload(item.id, e.target.files)}
                                  />
                                </div>

                                {item.files && item.files.length > 0 && (
                                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {item.files.map(f => (
                                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.65rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          <FileCheck size={14} style={{ color: 'var(--orange-500)' }} />
                                          <span style={{ color: 'var(--navy-950)', fontWeight: 800 }}>{f.name}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removePatchItemFile(item.id, f.id)}
                                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 800 }}
                                        >
                                          ✕
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

                    <button
                      type="button"
                      onClick={addPatchItem}
                      style={{
                        width: '100%',
                        marginTop: '0.85rem',
                        padding: '0.75rem',
                        background: 'var(--orange-50)',
                        border: '1.5px dashed var(--orange-400)',
                        borderRadius: '10px',
                        color: 'var(--orange-700)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Plus size={16} /> + Add Another Patch Item
                    </button>
                  </div>
                )}

                {/* Express Rush Delivery Option */}
                {pricingDetails.totalPlacementQuantity === 1 && type !== 'patch' && (
                  <div 
                    onClick={() => setIsRush(!isRush)}
                    style={{
                      background: isRush ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : '#ffffff',
                      border: isRush ? '2px solid var(--orange-500)' : '1.5px solid #cbd5e1',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: isRush ? '0 4px 12px rgba(249, 115, 22, 0.15)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: isRush ? 'var(--orange-500)' : 'var(--orange-50)',
                        color: isRush ? '#ffffff' : 'var(--orange-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Zap size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--navy-950)', display: 'block' }}>
                          ⚡ Super Rush (2–4 Hrs / Express) Turnaround
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Need urgent delivery? Get your completed file in 2–4 hours (+$10.00)
                        </span>
                      </div>
                    </div>
                    <input type="checkbox" checked={isRush} onChange={() => {}} style={{ width: '20px', height: '20px', accentColor: 'var(--orange-500)', cursor: 'pointer' }} />
                  </div>
                )}

                {/* Additional Instructions / Custom Notes */}
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.4rem' }}>
                    Additional Instructions / Custom Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Need specific thread colors (Madeira/Isacord), special sizing requirements, or machine model..."
                    style={{ background: '#ffffff', color: 'var(--navy-950)', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>

            {/* Sticky Live Order Summary Panel */}
            <div style={{ position: 'sticky', top: '10px' }}>
              <div style={{ padding: '1.75rem', background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1.15rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', letterSpacing: '-0.01em' }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Selected Service:</span>
                    <strong style={{ color: 'var(--orange-600)', fontWeight: 800 }}>{pricingDetails.serviceTitle}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Total Items / Placements:</span>
                    <strong style={{ color: 'var(--navy-950)', fontWeight: 800 }}>
                      {pricingDetails.totalPlacementQuantity} {type === 'patch' ? 'Pcs' : 'File(s)'}
                    </strong>
                  </div>

                  {/* Items Breakdown Box */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--orange-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📍 ITEMS BREAKDOWN ({pricingDetails.placementBreakdown.length}):
                    </div>
                    {pricingDetails.placementBreakdown.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < pricingDetails.placementBreakdown.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--navy-900)' }}>
                          <span>#{item.index} {item.label} (x{item.quantity}):</span>
                          <strong style={{ color: 'var(--navy-950)' }}>${item.subtotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                      <span>Subtotal:</span>
                      <span style={{ color: 'var(--orange-600)' }}>${pricingDetails.baseSubtotal.toFixed(2)}</span>
                    </div>

                    {pricingDetails.discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: '#16a34a' }}>
                        <span>Quantity Bulk Discount ({pricingDetails.discountPercent}%):</span>
                        <span>-${pricingDetails.discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {pricingDetails.promoDiscountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 800, color: '#16a34a' }}>
                        <span>Promo Discount ({appliedPromo?.code}{appliedPromo?.discountType === 'percent' ? ` - ${appliedPromo.discountValue}% OFF` : ` - $${appliedPromo.discountValue} OFF`}):</span>
                        <span>-${pricingDetails.promoDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo / Discount Coupon Input */}
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--orange-700)', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                        <Tag size={13} /> Promo / Coupon Code
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
                        style={{
                          flex: 1,
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.45rem 0.65rem',
                          color: 'var(--navy-950)',
                          fontSize: '0.85rem',
                          fontWeight: 900,
                          letterSpacing: '0.05em'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => applyPromoCode(promoCodeInput)}
                        style={{
                          background: 'var(--orange-500)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
                        }}
                      >
                        Apply
                      </button>
                      {appliedPromo && (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoCodeInput('');
                          }}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="Remove promo code"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {appliedPromo && (
                      <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                        🎉 Promo Code <strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountType === 'percent' ? `${appliedPromo.discountValue}% OFF` : `$${appliedPromo.discountValue} OFF`})!
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span>Turnaround Guarantee:</span>
                    <strong style={{ color: 'var(--navy-950)', fontWeight: 800 }}>
                      {type === 'patch' ? '📦 7-10 Days Prod. + Shipping' : isRush ? '⚡ 2-4 Hours Super Rush' : '8-12 Hours Standard'}
                    </strong>
                  </div>
                </div>

                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1.15rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--navy-950)' }}>Total Price:</span>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--orange-600)', fontFamily: 'var(--font-heading)' }}>
                      ${pricingDetails.finalPrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    Complete Order (${pricingDetails.finalPrice.toFixed(2)}) <ArrowRight size={18} />
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem', fontWeight: 600 }}>
                    ✓ 100% Quality Guaranteed • Free Unlimited Revisions • 256-Bit SSL Encrypted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
