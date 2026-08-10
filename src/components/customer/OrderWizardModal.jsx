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
  Plus
} from 'lucide-react';
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
    pricingCards = [],
    patchCards = []
  } = useAppState();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');
  
  // Itemized Placements Cart State with default initial placement item
  const [placementItems, setPlacementItems] = useState([
    { id: 1, packageTier: 'standard', placementType: 'left_chest', quantity: 1, quantityInput: '1', specificNotes: '', files: [] }
  ]);

  const [type, setType] = useState('embroidery'); // 'embroidery' | 'vector' | 'patch'
  const [title] = useState('');
  
  const [, setPlacementType] = useState('Left Chest / Polo');
  const [, setServiceCategory] = useState('Left Chest Digitizing');
  const [fabricType, setFabricType] = useState('Pique Cotton Polo');
  const [requestedFormats, setRequestedFormats] = useState(['dst', 'pes', 'emb', 'svg']);
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

  React.useEffect(() => {
    setPatchQuantityInput(String(patchQuantity));
  }, [patchQuantity]);

  React.useEffect(() => {
    if (isOrderWizardOpen && orderWizardInitialData) {
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
    import('../../../services/supabaseService').then(({ getCmsContent }) => {
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
      const finalPrice = baseSubtotal + rushSurcharge;

      return {
        serviceTitle: 'Vector Art & Color Separation',
        currentTier: 'mixed',
        baseTierRate: 0,
        baseSubtotal,
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

      return {
        serviceTitle: 'Physical Custom Patches & Emblems',
        patchStyle: safePatchItems[0]?.patchStyle || 'Embroidered',
        patchBacking: safePatchItems[0]?.patchBacking || 'Iron-On',
        patchWidth: parseFloat(safePatchItems[0]?.patchWidth) || 3.0,
        patchHeight: parseFloat(safePatchItems[0]?.patchHeight) || 3.0,
        rateEach: placementBreakdown[0]?.priceEach || 0,
        baseSubtotal,
        totalPlacementQuantity: totalQty,
        rushSurcharge: 0,
        finalPrice: baseSubtotal,
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

      const allowRush = totalPlacementQuantity === 1;
      const rushSurcharge = (isRush && allowRush) ? (parseFloat(pricing?.rushSurcharge) || 10.00) : 0;
      const finalPrice = discountedSubtotal + rushSurcharge;

      return {
        serviceTitle: 'Embroidery Digitizing',
        currentTier: 'mixed',
        baseTierRate: 0,
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
    
    // Flatten files for the legacy uploadedFiles array just in case
    const allFiles = type === 'patch' 
      ? patchItems.flatMap(item => item.files || []) 
      : placementItems.flatMap(item => item.files || []);

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
      uploadedFiles: allFiles.map(a => a.name),
      paymentStatus: 'pending' // Enforce pending payment status
    };
    
    // Wallet balance gate: block order if insufficient funds
    if (walletBalance < parseFloat(finalPrice)) {
      showToast(
        `Insufficient wallet balance. You need $${(parseFloat(finalPrice) - walletBalance).toFixed(2)} more. Please fund your account.`,
        'error'
      );
      setIsDepositModalOpen(true);
      return;
    }

    setIsProcessingPayment(true);

    try {
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
                {type === 'all' ? 'Choose Your Service' : `Configure ${pricingDetails?.serviceTitle || 'Order'}`}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                {type === 'all' ? 'Select a service below to start your order configuration' : 'Multi-step order configuration with live instant pricing calculation'}
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

        {type === 'all' ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#0f172a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
              
              {/* Embroidery */}
              <div onClick={() => setType('embroidery')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2.5rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--orange-500)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ color: 'var(--orange-400)', marginBottom: '1.5rem', background: 'rgba(255,122,0,0.1)', padding: '1rem', borderRadius: '50%' }}>
                  <Sparkles size={40} />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>Embroidery Digitizing</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Convert logos to machine-ready files. Starting at $10.00.</p>
              </div>

              {/* Vector */}
              <div onClick={() => setType('vector')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2.5rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ color: '#3b82f6', marginBottom: '1.5rem', background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '50%' }}>
                  <FileCode size={40} />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>Vector Art Redraw</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Scale raster images to crisp vectors. Starting at $15.00.</p>
              </div>

              {/* Patches */}
              <div onClick={() => setType('patch')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2.5rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ color: '#10b981', marginBottom: '1.5rem', background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '50%' }}>
                  <FileCheck size={40} />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>Custom Patches</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Physical embroidered or PVC patches. Starting at $1.50.</p>
              </div>

            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>

          <div className="configurator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Step 1: Configure Service Options */}
              <div style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--orange-400)' }} /> Step 1: Configure {pricingDetails.serviceTitle} Options
                </h3>

                {/* 1. EMBROIDERY DIGITIZING */}
                {['embroidery', 'vector'].includes(type) && (
                  <>
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

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Package Tier *</label>
                              <select value={item.packageTier || 'standard'} onChange={(e) => updatePlacementItem(item.id, 'packageTier', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem' }}>
                                {type === 'vector' ? (
                                  <>
                                    <option value="basic">⚡ Simple Redraw ($15.00)</option>
                                    <option value="standard">✨ Complex Redraw ($25.00)</option>
                                    <option value="premium">🔥 Super Rush Express ($40.00)</option>
                                  </>
                                ) : (
                                  pricingCards && pricingCards.length > 0 ? (
                                    pricingCards.map(card => {
                                      const value = card.id.replace('pcard-', '');
                                      return (
                                        <option key={card.id} value={value}>
                                          {card.title.replace(' Digitizing', '').replace(' Patches', '')} ({card.rate.replace('Starting from ', '')})
                                        </option>
                                      );
                                    })
                                  ) : (
                                    <>
                                      <option value="basic">⚡ Basic</option>
                                      <option value="standard">⭐ Standard</option>
                                      <option value="premium">✨ Premium</option>
                                    </>
                                  )
                                )}
                              </select>
                            </div>

                            {type === 'embroidery' ? (
                              <div>
                                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Placement Location</label>
                                <select value={item.placementType} onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)} className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem' }}>
                                  {PLACEMENT_OPTIONS.map(plc => (
                                    <option key={plc.id} value={plc.id}>{plc.label}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Design Name *</label>
                                <input type="text" value={item.placementType || ''} onChange={(e) => updatePlacementItem(item.id, 'placementType', e.target.value)} placeholder="e.g. Left Chest Logo" className="form-control" style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem' }} />
                              </div>
                            )}

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
                      {type === 'embroidery' && (
                        <>
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
                    </div>
                  </>
                )}

                {/* 2. VECTOR ART & COLOR SEPARATION */}
                {type === 'vector' && (
                  <>

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
                    {/* 2. Configure Multi-Item Custom Patch List */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div>
                          <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            📍 Configure Patch Items ({patchItems.length} {patchItems.length === 1 ? 'Item' : 'Items'}) *
                          </label>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                            Add distinct patch items with individual materials, backing options, quantities, and logo artwork.
                          </div>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--orange-400)', fontWeight: 800, background: 'rgba(255,122,0,0.12)', padding: '0.25rem 0.65rem', borderRadius: '9999px', border: '1px solid rgba(255,122,0,0.3)' }}>
                          Total Quantity: {pricingDetails.totalPlacementQuantity} Pcs
                        </span>
                      </div>

                      {/* Patch Rows Container */}
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
                                background: '#0f172a',
                                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '12px',
                                padding: '1.15rem',
                                position: 'relative'
                              }}
                            >
                              {/* Row Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {index + 1}
                                  </span>
                                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                                    Patch Item #{index + 1}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-400)' }}>
                                    ${rateEach}/ea • Subtotal: ${itemSubtotal}
                                  </span>

                                  {patchItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removePatchItem(item.id)}
                                      title="Remove Patch Item"
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
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Row Content Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                                
                                {/* Patch Material Style */}
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                    Patch Craft / Material *
                                  </label>
                                  <select
                                    value={item.patchStyle || 'Embroidered'}
                                    onChange={(e) => updatePatchItem(item.id, 'patchStyle', e.target.value)}
                                    className="form-control"
                                    style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', fontWeight: 700 }}
                                  >
                                    {patchCards && patchCards.length > 0 ? (
                                      patchCards.map(card => {
                                        const value = card.title.includes('Embroidered') ? 'Embroidered' : card.title.includes('Woven') ? 'Woven' : 'PVC';
                                        return (
                                          <option key={card.id} value={value}>
                                            {card.badge ? `${card.badge} • ` : ''}{card.title} ({card.rate})
                                          </option>
                                        );
                                      })
                                    ) : (
                                      <>
                                        <option value="Embroidered">🧵 Embroidered Patch ($2.50/ea)</option>
                                        <option value="Woven">🌐 Micro Woven Patch ($1.50/ea)</option>
                                        <option value="PVC">⚡ 3D Rubber PVC Patch ($3.50/ea)</option>
                                        <option value="Leather">🪵 Debossed Leather Patch ($3.50/ea)</option>
                                      </>
                                    )}
                                  </select>
                                </div>

                                {/* Backing Option */}
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                    Backing Attachment *
                                  </label>
                                  <select
                                    value={item.patchBacking || 'Iron-On'}
                                    onChange={(e) => updatePatchItem(item.id, 'patchBacking', e.target.value)}
                                    className="form-control"
                                    style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', fontWeight: 700 }}
                                  >
                                    <option value="Iron-On">🔴 Iron-On / Heat Seal</option>
                                    <option value="Velcro">⚡ Tactical Velcro Hook & Loop (+$0.40)</option>
                                    <option value="Adhesive">📌 Peel & Stick Adhesive (+$0.25)</option>
                                    <option value="Sew-On">🪡 Standard Sew-On (Felt Backing)</option>
                                  </select>
                                </div>

                                {/* Width & Height */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.2rem' }}>Width (in)</label>
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="1.0"
                                      max="8.0"
                                      value={item.patchWidth || 3.0}
                                      onChange={(e) => updatePatchItem(item.id, 'patchWidth', parseFloat(e.target.value) || 3.0)}
                                      className="form-control"
                                      style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.2rem' }}>Height (in)</label>
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="1.0"
                                      max="8.0"
                                      value={item.patchHeight || 3.0}
                                      onChange={(e) => updatePatchItem(item.id, 'patchHeight', parseFloat(e.target.value) || 3.0)}
                                      className="form-control"
                                      style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }}
                                    />
                                  </div>
                                </div>

                                {/* Item Quantity */}
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
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
                                      background: '#1e293b',
                                      color: '#ffffff',
                                      border: (item.quantityInput === '' || parseInt(item.quantityInput, 10) < 50) ? '1.5px solid #fb923c' : '1px solid rgba(255,255,255,0.15)',
                                      fontWeight: 800
                                    }}
                                  />
                                </div>

                                {/* Specific Notes */}
                                <div style={{ gridColumn: 'span 2' }}>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                    Specific Thread Colors / Custom Notes (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Black merrowed edge, Pantone color matches..."
                                    value={item.specificNotes || ''}
                                    onChange={(e) => updatePatchItem(item.id, 'specificNotes', e.target.value)}
                                    style={{ background: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem' }}
                                  />
                                </div>

                                {/* Requirement 3: Dedicated Logo / Artwork File Upload Zone for this Patch Item */}
                                <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.35rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                    <span>📎 Upload Logo / Artwork File for Patch Item #{index + 1} *</span>
                                    {item.files && item.files.length > 0 && (
                                      <span style={{ color: 'var(--orange-400)', fontWeight: 800 }}>{item.files.length} File{item.files.length > 1 ? 's' : ''} Attached</span>
                                    )}
                                  </label>

                                  <div
                                    onClick={() => document.getElementById(`patch-file-input-${item.id}`)?.click()}
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
                                      Click or drop design artwork for Patch Item #{index + 1} (.PNG, .JPG, .AI, .PDF)
                                    </span>
                                    <input
                                      type="file"
                                      id={`patch-file-input-${item.id}`}
                                      multiple
                                      style={{ display: 'none' }}
                                      onChange={(e) => handlePatchFileUpload(item.id, e.target.files)}
                                    />
                                  </div>

                                  {/* Attached files list */}
                                  {item.files && item.files.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      {item.files.map(f => (
                                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: '#0f172a', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {f.previewUrl ? (
                                              <img src={f.previewUrl} alt="preview" style={{ width: '22px', height: '22px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                              <FileCheck size={14} style={{ color: 'var(--orange-400)' }} />
                                            )}
                                            <span style={{ color: '#ffffff', fontWeight: 700 }}>{f.name}</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removePatchItemFile(item.id, f.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem' }}
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

                      {/* Requirement 4: + Add Another Patch Item Button */}
                      <button
                        type="button"
                        onClick={addPatchItem}
                        style={{
                          width: '100%',
                          marginTop: '0.85rem',
                          padding: '0.65rem',
                          background: 'rgba(255, 122, 0, 0.1)',
                          border: '1.5px dashed var(--orange-500)',
                          borderRadius: '10px',
                          color: 'var(--orange-400)',
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

                    {/* Instant Live Price Summary Box */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      border: '1.5px solid rgba(249, 115, 22, 0.35)',
                      borderRadius: '10px',
                      padding: '0.85rem 1.15rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                          Physical Custom Patches ({patchItems.length} {patchItems.length === 1 ? 'Item' : 'Distinct Items'})
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                          Total Quantity: <strong style={{ color: 'var(--orange-400)' }}>{pricingDetails.totalPlacementQuantity} Pcs</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>ESTIMATED TOTAL</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>
                          ${pricingDetails.finalPrice.toFixed(2)}
                        </div>
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

                {/* Additional Instructions / Custom Notes (Optional) */}
                <div style={{ marginTop: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Additional Instructions / Custom Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Need specific color adjustments, custom file formats, or special placement notes..."
                    style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.875rem' }}
                  />
                </div>
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
        )}
      </div>
    </div>
  );
};
