import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  UploadCloud, 
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
  ShieldCheck
} from 'lucide-react';
import { MACHINE_FORMATS } from '../../data/mockData';

export const OrderWizardModal = () => {
  const { 
    isOrderWizardOpen, 
    setIsOrderWizardOpen, 
    createOrder,
    pricing,
    walletBalance = 150.00,
    deductWalletBalance,
    setIsDepositModalOpen,
    authUser
  } = useAppState();

  const [step, setStep] = useState(1); // 1: Upload & Service | 2: Specs | 3: Review | 4: Payment

  // Form State
  const [type, setType] = useState('embroidery'); // 'embroidery' | 'vector'
  const [title, setTitle] = useState('');
  
  // Multi-File Upload Selected Assets Array State
  const [selectedAssets, setSelectedAssets] = useState([]);
  const uploadedFilesList = selectedAssets; // Alias for submit & order creation
  
  const [isDragOver, setIsDragOver] = useState(false);

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

  if (!isOrderWizardOpen) return null;

  const toggleFormat = (fmtId) => {
    setRequestedFormats(prev => 
      prev.includes(fmtId) ? prev.filter(f => f !== fmtId) : [...prev, fmtId]
    );
  };

  // Dynamic Price Calculation
  const calculatePrice = () => {
    if (type === 'vector') {
      const isComplex = serviceCategory.toLowerCase().includes('complex');
      const base = isComplex 
        ? (parseFloat(pricing?.vectorComplexRate) || 25.00) 
        : (parseFloat(pricing?.vectorSimpleRate) || 15.00);
      const rush = isRush ? (parseFloat(pricing?.rushSurcharge) || 10.00) : 0;
      return (base + rush).toFixed(2);
    }

    const area = width * height;
    let baseStitches = Math.round(area * 1100);
    if (placementType.includes('Cap') || fabricType.includes('Cap')) baseStitches += 1500;
    if (placementType.includes('Jacket') || fabricType.includes('Jacket')) baseStitches += 4000;

    const thousandUnits = Math.ceil(baseStitches / 1000);
    let calculatedStitchPrice = thousandUnits * (parseFloat(pricing?.ratePerThousandStitches) || 1.50);

    let base = Math.max((parseFloat(pricing?.minOrderFee) || 10.00), calculatedStitchPrice);
    if (placementType.includes('Cap') || fabricType.includes('Cap')) base += (parseFloat(pricing?.cap3dPuffSurcharge) || 5.00);

    const rush = isRush ? (parseFloat(pricing?.rushSurcharge) || 10.00) : 0;
    return (base + rush).toFixed(2);
  };

  const calculatedTotal = calculatePrice();

  // Multi-File Processing Handler (Processes all image & vector files regardless of special names, hashes, or alphanumeric strings)
  const processFilesList = (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const newAssets = fileArray.map((file) => {
      const fileName = file.name || 'unnamed_asset';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      
      // Broad image check including special file extensions
      const isImage = file.type?.startsWith('image/') || 
        ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tif', 'tiff', 'ico', 'heic', 'avif'].includes(fileExt);

      let previewUrl = null;
      if (isImage) {
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (_) {
          previewUrl = null;
        }
      }

      return {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: fileName,
        size: file.size || 0,
        type: file.type || fileExt || 'asset',
        preview: previewUrl,
        fileObj: file
      };
    });

    // Immediately push files to selectedAssets state array for instant UI preview cards
    setSelectedAssets(prev => [...prev, ...newAssets]);

    // Fallback FileReader for dataURL if object URL is unsupported
    fileArray.forEach((file, idx) => {
      const fileName = file.name || '';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      const isImage = file.type?.startsWith('image/') || 
        ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tif', 'tiff'].includes(fileExt);

      if (isImage && !newAssets[idx].preview) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setSelectedAssets(prev => prev.map(asset => 
            asset.fileObj === file ? { ...asset, preview: evt.target.result } : asset
          ));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesList(e.target.files);
    }
    // Reset file input value so re-selecting identical filename triggers onChange reliably
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesList(e.dataTransfer.files);
    }
  };

  const removeUploadedFile = (indexToRemove) => {
    setSelectedAssets(prev => {
      const itemToRemove = prev[indexToRemove];
      if (itemToRemove?.preview && itemToRemove.preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(itemToRemove.preview); } catch (_) {}
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a design brief title.');
      setStep(1);
      return;
    }

    const orderCost = parseFloat(calculatedTotal);

    if (paymentOption === 'wallet') {
      if (walletBalance < orderCost) {
        alert(`Insufficient Studio Wallet Balance ($${walletBalance.toFixed(2)} available vs $${orderCost.toFixed(2)} total cost). Please top up your wallet or select BoltPayouts Payment Gateway.`);
        setIsDepositModalOpen(true);
        return;
      }
      if (deductWalletBalance) {
        deductWalletBalance(orderCost);
      }
    } else if (paymentOption === 'bolt') {
      const redirectUrl = `${window.location.origin}/client-portal?bolt_status=success&amount=${orderCost}`;
      const boltUrl = `https://www.boltpayouts.xyz/pay/boltpayouts?amount=${orderCost}&currency=USD&email=${encodeURIComponent(authUser?.email || 'client@bdigitizing.pro')}&return_url=${encodeURIComponent(redirectUrl)}`;
      try {
        window.open(boltUrl, '_blank');
      } catch (_) {
        window.location.href = boltUrl;
      }
    }

    const primaryPreview = uploadedFilesList.length > 0 ? uploadedFilesList[0].preview : null;
    const primaryName = uploadedFilesList.length > 0 ? uploadedFilesList[0].name : 'design_artwork.png';

    const newOrderData = {
      title,
      type,
      placementType,
      serviceCategory: `${placementType} (${type === 'embroidery' ? 'Embroidery' : 'Vector'})`,
      isRush,
      dimensions: { width: parseFloat(width), height: parseFloat(height), unit: 'inches' },
      fabricType,
      colorsCount: parseInt(colorsCount),
      estimatedStitches: type === 'embroidery' ? Math.round(width * height * 1100) : 0,
      requestedFormats,
      price: orderCost,
      notes,
      paymentMethod: paymentOption === 'wallet' ? 'Studio Wallet Credit' : (paymentOption === 'bolt' ? 'BoltPayouts Gateway' : 'Credit Card'),
      paymentStatus: 'Paid',
      artworkUrl: primaryPreview,
      image_url: primaryPreview,
      logo: primaryPreview,
      file_url: primaryPreview,
      file_path: primaryName,
      artworkFileName: primaryName,
      artworkFilesList: uploadedFilesList.map(f => ({ name: f.name, preview: f.preview }))
    };

    createOrder(newOrderData);
    setIsOrderWizardOpen(false);
    setStep(1);
    setTitle('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--navy-950)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.15rem' }}>
              Upload New Design Brief
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Step {step} of 4 — {step === 1 ? 'Service & Multi-File Upload' : step === 2 ? 'Technical Specifications' : step === 3 ? 'Brief Summary' : 'BoltPayouts Gateway Payment'}
            </div>
          </div>

          <button 
            onClick={() => setIsOrderWizardOpen(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div style={{ background: 'var(--navy-900)', padding: '0.5rem 1.75rem', display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              style={{ 
                flex: 1, 
                height: '4px', 
                borderRadius: '2px',
                background: s <= step ? 'var(--orange-500)' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s'
              }} 
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
          
          {/* STEP 1: Service Selection & Multi-File Upload */}
          {step === 1 && (
            <div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Design Brief Title / Reference Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Apex Athletics Left Chest Polo Logo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Service Type Switch */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Select Primary Studio Service</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setType('embroidery')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${type === 'embroidery' ? 'var(--orange-600)' : 'var(--border-color)'}`,
                      background: type === 'embroidery' ? 'var(--orange-50)' : '#ffffff',
                      color: type === 'embroidery' ? 'var(--orange-700)' : 'var(--navy-800)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    🧵 Custom Embroidery Digitizing
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Stitch pathing for Tajima, Brother, Melco (.DST, .PES, .EMB)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('vector')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${type === 'vector' ? 'var(--orange-600)' : 'var(--border-color)'}`,
                      background: type === 'vector' ? 'var(--orange-50)' : '#ffffff',
                      color: type === 'vector' ? 'var(--orange-700)' : 'var(--navy-800)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    ✒️ Vector Art & Color Separation
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>High-res .AI, .EPS, .SVG vector tracing</div>
                  </button>
                </div>
              </div>

              {/* Placement Selection */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Placement / Garment Target</label>
                <select 
                  className="form-control"
                  value={placementType}
                  onChange={(e) => setPlacementType(e.target.value)}
                >
                  <option value="Left Chest / Polo">Left Chest / Polo Shirt (Standard 3.5"-4.0")</option>
                  <option value="Cap Front / 3D Puff">Cap Front / Hat (3D Foam Compensation)</option>
                  <option value="Jacket Back Crest">Jacket Back / Large Crest (9"-12"+)</option>
                  <option value="Sleeve / Cuff Logo">Sleeve / Cuff / Visor Emblem</option>
                  <option value="Applique / Patch">Custom Woven Patch / Applique</option>
                  <option value="Vector Art Conversion">Vector Artwork Conversion (Print / Screen)</option>
                </select>
              </div>

              {/* Native Drag & Drop Multiple File Selector */}
              <div className="form-group">
                <label>Upload Artwork Files (Select Multiple .PNG, .JPG, .AI, .CDR, .PDF, .DST)</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragOver ? 'var(--orange-500)' : 'var(--orange-600)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: isDragOver ? 'var(--orange-50)' : 'var(--navy-100)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="file" 
                    multiple
                    accept="*/*"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <UploadCloud size={42} style={{ color: isDragOver ? 'var(--orange-500)' : 'var(--orange-600)', marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem' }}>
                    Drag & Drop multiple files or click to select any file format
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Universal Upload Support: PNG, JPG, PDF, AI, EPS, CDR, DST, EMB, PES, EXP, ZIP & all formats
                  </div>
                </div>
              </div>

              {/* Selected Assets Array List Grid with Removal Controls */}
              {selectedAssets.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.65rem' }}>
                    Selected Source Assets ({selectedAssets.length}):
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {selectedAssets.map((fileItem, idx) => (
                      <div 
                        key={fileItem.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          padding: '0.6rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {fileItem.preview ? (
                          <img 
                            src={fileItem.preview} 
                            alt={fileItem.name} 
                            style={{ width: '42px', height: '42px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '4px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileCode size={20} />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div 
                            style={{ 
                              fontWeight: 700, 
                              fontSize: '0.825rem', 
                              color: 'var(--navy-900)', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis' 
                            }}
                            title={fileItem.name}
                          >
                            {fileItem.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--green-600)', fontWeight: 600 }}>
                            ✓ Attached ({fileItem.size ? `${(fileItem.size / 1024).toFixed(0)} KB` : 'Ready'})
                          </div>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => removeUploadedFile(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          title="Remove file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: Technical Specifications & Formats */}
          {step === 2 && (
            <div>
              {/* Dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Width (Inches)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    step="0.1"
                    min="0.5"
                    max="18"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group">
                  <label>Height (Inches)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    step="0.1"
                    min="0.5"
                    max="18"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Target Fabric */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Target Garment Fabric / Material Type</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. 100% Pique Cotton Polo, 6-Panel Structured Cap, Denim Jacket..."
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                />
              </div>

              {/* Format Checkboxes */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Required Output Machine & Master Formats (Free Included)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '0.35rem' }}>
                  {MACHINE_FORMATS.map(fmt => {
                    const isSelected = requestedFormats.includes(fmt.id);
                    return (
                      <div 
                        key={fmt.id}
                        onClick={() => toggleFormat(fmt.id)}
                        style={{
                          border: `1.5px solid ${isSelected ? 'var(--orange-500)' : 'var(--border-color)'}`,
                          background: isSelected ? '#fff7ed' : '#ffffff',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--orange-600)' : 'var(--navy-800)'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          border: `1px solid ${isSelected ? 'var(--orange-500)' : '#cbd5e1'}`,
                          background: isSelected ? 'var(--orange-500)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}>
                          {isSelected && <Check size={12} />}
                        </div>
                        {fmt.name.split(' ')[0]}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Color Notes */}
              <div className="form-group">
                <label>Special Instructions & Thread Color Notes</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Match Pantone 186C Red, keep eagle eye sharp, apply 3mm foam compensation on cap front letter T..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Brief Summary & Review */}
          {step === 3 && (
            <div>
              <div style={{
                background: 'var(--navy-100)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Brief Summary Review</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Title:</strong> {title || 'Untitled Brief'}</div>
                  <div><strong>Type:</strong> {type === 'embroidery' ? 'Custom Embroidery' : 'Vector Art'}</div>
                  <div><strong>Placement:</strong> {placementType}</div>
                  <div><strong>Dimensions:</strong> {width} x {height} inches</div>
                  <div><strong>Target Fabric:</strong> {fabricType}</div>
                  <div><strong>Attached Files:</strong> {uploadedFilesList.length} File(s)</div>
                  <div><strong>Formats Requested:</strong> {requestedFormats.join(', ').toUpperCase()}</div>
                </div>
              </div>

              {/* Rush Order Switch */}
              <div style={{
                background: isRush ? '#ffe4e6' : 'var(--bg-main)',
                border: `1px solid ${isRush ? '#f43f5e' : 'var(--border-color)'}`,
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={18} style={{ color: 'var(--orange-500)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Rush Express Delivery (4-8 Hours)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+ ${pricing.rushSurcharge.toFixed(2)} Priority Digitizing Surcharge</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isRush} 
                  onChange={(e) => setIsRush(e.target.checked)} 
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              {/* Total Summary Price Box */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff',
                border: '2px solid var(--orange-500)',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.15)'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Order Brief Cost</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--navy-950)', lineHeight: 1.1 }}>${calculatedTotal}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary-orange btn-lg"
                  onClick={() => setStep(4)}
                >
                  Proceed to Payment Gateway <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Dedicated BoltPayouts Payment Gateway & Checkout */}
          {step === 4 && (
            <div>
              
              {/* Total Order Amount Banner */}
              <div style={{
                background: 'linear-gradient(135deg, var(--navy-950), var(--navy-900))',
                color: '#ffffff',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--orange-500)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Checkout Order Total
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>
                    ${calculatedTotal}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Order Brief:</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>{title || 'Custom Brief'}</div>
                </div>
              </div>

              {/* Payment Method Selection Options */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>
                  Select Payment Method to Complete Order
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                  
                  {/* Featured Option 1: BoltPayouts Gateway */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('bolt')}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentOption === 'bolt' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentOption === 'bolt' ? '#fff7ed' : '#ffffff',
                      color: paymentOption === 'bolt' ? 'var(--navy-950)' : 'var(--navy-900)',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: paymentOption === 'bolt' ? '0 6px 20px rgba(249, 115, 22, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'var(--orange-500)',
                        color: '#ffffff',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        display: 'flex'
                      }}>
                        <Zap size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                          BoltPayouts Payment Gateway
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          https://www.boltpayouts.xyz/pay/boltpayouts (Cards, Apple Pay, Debit)
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'var(--orange-500)', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 800 }}>
                      ⚡ Recommended
                    </span>
                  </button>

                  {/* Option 2: Studio Wallet Credit */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('wallet')}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentOption === 'wallet' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentOption === 'wallet' ? '#fff7ed' : '#ffffff',
                      color: paymentOption === 'wallet' ? 'var(--orange-600)' : 'var(--navy-900)',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'var(--navy-900)',
                        color: '#ffffff',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        display: 'flex'
                      }}>
                        <Wallet size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                          Pay with Studio Wallet Balance
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Available Wallet Balance: <strong style={{ color: 'var(--green-600)' }}>${walletBalance.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                    {walletBalance >= parseFloat(calculatedTotal) ? (
                      <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: 'var(--green-600)', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 800 }}>
                        Sufficient Funds
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', background: '#fff1f2', color: '#e11d48', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 800 }}>
                        Deposit Required
                      </span>
                    )}
                  </button>

                  {/* Option 3: Credit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('card')}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentOption === 'card' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentOption === 'card' ? '#fff7ed' : '#ffffff',
                      color: paymentOption === 'card' ? 'var(--orange-600)' : 'var(--navy-900)',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <CreditCard size={18} style={{ color: 'var(--orange-600)' }} />
                      <span style={{ fontSize: '0.875rem' }}>Standard Credit Card Invoice</span>
                    </div>
                  </button>

                </div>
              </div>

              {/* Encryption Security Note */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green-600)', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem' }}>
                <ShieldCheck size={18} /> Encrypted 256-Bit SSL Payment Guarantee
              </div>

            </div>
          )}

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            {step > 1 ? (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setStep(s => s - 1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button 
                type="button" 
                className="btn btn-primary-orange"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    alert('Please enter a design brief title.');
                    return;
                  }
                  setStep(s => s + 1);
                }}
              >
                {step === 3 ? 'Proceed to Payment Gateway' : 'Continue'} <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary-orange btn-lg"
                style={{ boxShadow: '0 6px 22px rgba(249, 115, 22, 0.45)' }}
              >
                <FileCheck size={18} /> {paymentOption === 'bolt' ? `Pay $${calculatedTotal} via BoltPayouts` : `Pay $${calculatedTotal} & Finalize Order`}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
