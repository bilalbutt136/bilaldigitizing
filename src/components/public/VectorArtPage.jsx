import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/StateContext';
import { 
  Zap, 
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
  CreditCard,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';

export const VectorArtPage = () => {
  const navigate = useNavigate();
  const { 
    createOrder, 
    pricing, 
    walletBalance = 150.00, 
    deductWalletBalance, 
    setIsDepositModalOpen,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    protectedNavigate
  } = useAppState();

  // Form State
  const [title, setTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Simple Vector Redraw'); // 'Simple Vector Redraw' | 'Complex Vector Redraw'
  const [colorMode, setColorMode] = useState('Spot Colors (Pantone/Solid)');
  const [requestedFormats, setRequestedFormats] = useState(['ai', 'eps', 'svg', 'pdf']);
  const [isRush, setIsRush] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentOption, setPaymentOption] = useState('bolt'); // 'bolt' | 'wallet'
  
  // File Upload State
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const VECTOR_FORMAT_OPTIONS = [
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

  // Dynamic Price Calculation
  const simpleRate = (pricing?.vectorSimpleRate && !isNaN(parseFloat(pricing.vectorSimpleRate)) && parseFloat(pricing.vectorSimpleRate) > 0)
    ? parseFloat(pricing.vectorSimpleRate)
    : 15.00;

  const complexRate = (pricing?.vectorComplexRate && !isNaN(parseFloat(pricing.vectorComplexRate)) && parseFloat(pricing.vectorComplexRate) > 0)
    ? parseFloat(pricing.vectorComplexRate)
    : 25.00;

  const rushFeeAmount = (pricing?.rushSurcharge && !isNaN(parseFloat(pricing.rushSurcharge)) && parseFloat(pricing.rushSurcharge) >= 0)
    ? parseFloat(pricing.rushSurcharge)
    : 10.00;

  const isComplexSelected = serviceCategory.toLowerCase().includes('complex');
  const basePrice = isComplexSelected ? complexRate : simpleRate;
  const rushSurcharge = isRush ? rushFeeAmount : 0.00;
  const totalPriceNum = Number(basePrice) + Number(rushSurcharge);
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

    if (selectedAssets.length === 0) {
      alert('Please upload at least one raster image, scan, or artwork file to convert into vector.');
      return;
    }

    if (paymentOption === 'wallet' && walletBalance < parseFloat(totalPrice)) {
      alert(`Insufficient Wallet Balance ($${walletBalance.toFixed(2)}). Please top up your wallet or select Online Card Checkout.`);
      setIsDepositModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const newVectorOrder = {
        type: 'vector',
        title: title.trim(),
        serviceCategory,
        placementType: 'Vector Art Redraw',
        colorMode,
        requestedFormats,
        isRush,
        price: parseFloat(totalPrice),
        notes,
        uploadedFiles: selectedAssets.map(ast => ast.name),
        artworkUrl: selectedAssets[0]?.previewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
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
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* 1. Studio Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy-950) 0%, #0f172a 60%, #1e1b4b 100%)',
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

      {/* 2. Order Form Container */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <div 
          className="grid-responsive-2col"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
          }}
        >
          
          {/* Main Order Form */}
          <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Step A: Upload Artwork Files */}
            <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  1
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Upload Source Image or Sketch
                </h3>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                style={{
                  border: isDragOver ? '2px dashed var(--orange-500)' : '2px dashed var(--border-color)',
                  background: isDragOver ? '#fff7ed' : '#f8fafc',
                  borderRadius: '12px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => document.getElementById('vector-file-input').click()}
              >
                <input
                  id="vector-file-input"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.psd,.bmp,.ai,.svg"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <UploadCloud size={44} style={{ color: 'var(--orange-500)', marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                  Click to Browse or Drag & Drop Artwork
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Supports JPG, PNG, BMP, PSD, PDF, or mobile photos of hand sketches (Up to 50MB per file)
                </p>
              </div>

              {/* Uploaded File List Preview */}
              {selectedAssets.length > 0 && (
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-800)' }}>
                    Uploaded Artwork ({selectedAssets.length} file{selectedAssets.length > 1 ? 's' : ''}):
                  </div>
                  {selectedAssets.map((ast) => (
                    <div 
                      key={ast.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        background: 'var(--navy-100)',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {ast.previewUrl ? (
                          <img src={ast.previewUrl} alt={ast.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <FileCode size={24} style={{ color: 'var(--orange-500)' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{ast.name}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{ast.size} • {ast.type}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAsset(ast.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step B: Artwork Specifications */}
            <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  2
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Vector Conversion Specifications
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Order Title */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                    Order Title / Artwork Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Apex Athletics Logo Vector Conversion"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ width: '100%', height: '42px' }}
                  />
                </div>

                {/* Vector Complexity Selection */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                    Vector Complexity & Detail Level
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div 
                      onClick={() => setServiceCategory('Simple Vector Redraw')}
                      style={{
                        padding: '1rem',
                        border: serviceCategory === 'Simple Vector Redraw' ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                        background: serviceCategory === 'Simple Vector Redraw' ? '#fff7ed' : '#ffffff',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <strong style={{ color: 'var(--navy-900)', fontSize: '0.95rem' }}>Simple / Standard Redraw</strong>
                        <span style={{ fontWeight: 800, color: 'var(--orange-600)' }}>${simpleRate.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Logos with clean lines, solid color fills, text vectorization, and 1–3 color elements.
                      </div>
                    </div>

                    <div 
                      onClick={() => setServiceCategory('Complex Vector Redraw')}
                      style={{
                        padding: '1rem',
                        border: serviceCategory === 'Complex Vector Redraw' ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                        background: serviceCategory === 'Complex Vector Redraw' ? '#fff7ed' : '#ffffff',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <strong style={{ color: 'var(--navy-900)', fontSize: '0.95rem' }}>Complex / Detailed Redraw</strong>
                        <span style={{ fontWeight: 800, color: 'var(--orange-600)' }}>${complexRate.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Mascots, intricate crests, gradient shading, fine line details, and multi-color illustrations.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requested Vector Output Formats */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
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
                            border: isChecked ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                            background: isChecked ? '#fff7ed' : '#f8fafc',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: isChecked ? 'var(--orange-700)' : 'var(--navy-800)'
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isChecked ? 'none' : '1.5px solid var(--navy-300)',
                            background: isChecked ? 'var(--orange-500)' : '#ffffff',
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
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                    Vector Color Separation Mode
                  </label>
                  <select
                    className="form-select"
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value)}
                    style={{ width: '100%', height: '42px' }}
                  >
                    <option value="Spot Colors (Pantone/Solid)">Spot Colors (Pantone / Solid Separation for Screen Printing)</option>
                    <option value="Full Color CMYK (Process Printing)">Full Color CMYK (Process Printing / DTG / Vinyl)</option>
                    <option value="Monochrome / Single Color Black">Monochrome / Single Color Black & White</option>
                  </select>
                </div>

                {/* Turnaround Time Selection */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                    Turnaround Time
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div
                      onClick={() => setIsRush(false)}
                      style={{
                        padding: '0.85rem 1rem',
                        border: !isRush ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                        background: !isRush ? '#fff7ed' : '#ffffff',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.9rem' }}>Standard Turnaround</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>8–12 Hours Delivery</div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem' }}>FREE</span>
                    </div>

                    <div
                      onClick={() => setIsRush(true)}
                      style={{
                        padding: '0.85rem 1rem',
                        border: isRush ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                        background: isRush ? '#fff7ed' : '#ffffff',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.9rem' }}>Super Rush</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>2–4 Hours Express</div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--orange-600)', fontSize: '0.85rem' }}>+$10.00</span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                    Special Vector Redraw Instructions (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Specify font name modifications, color adjustments, line thickness requests, or cleanups..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem' }}
                  />
                </div>

              </div>
            </div>

          </form>

          {/* Right Checkout & Order Summary Card */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '1.75rem', background: '#ffffff', border: '1.5px solid var(--orange-400)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
              
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Vector Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-700)' }}>
                  <span>Service Type:</span>
                  <strong style={{ color: 'var(--navy-900)' }}>{serviceCategory}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-700)' }}>
                  <span>Base Rate ({isComplexSelected ? 'Complex' : 'Simple'}):</span>
                  <span style={{ fontWeight: 700 }}>${basePrice.toFixed(2)}</span>
                </div>

                {isRush && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--orange-600)', fontWeight: 700 }}>
                    <span>Super Rush (2-4 Hrs):</span>
                    <span>+${rushSurcharge.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-700)' }}>
                  <span>Output Formats:</span>
                  <span style={{ fontWeight: 700, color: 'var(--orange-600)' }}>{requestedFormats.map(f => f.toUpperCase()).join(', ')}</span>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)' }}>Total Price:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--orange-600)' }}>${totalPrice}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-800)', marginBottom: '0.5rem' }}>
                  Select Payment Option
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div
                    onClick={() => setPaymentOption('wallet')}
                    style={{
                      padding: '0.65rem 0.85rem',
                      border: paymentOption === 'wallet' ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                      background: paymentOption === 'wallet' ? '#fff7ed' : '#ffffff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wallet size={16} style={{ color: 'var(--orange-500)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Client Wallet Balance</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>(${walletBalance.toFixed(2)})</span>
                  </div>

                  <div
                    onClick={() => setPaymentOption('bolt')}
                    style={{
                      padding: '0.65rem 0.85rem',
                      border: paymentOption === 'bolt' ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                      background: paymentOption === 'bolt' ? '#fff7ed' : '#ffffff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <CreditCard size={16} style={{ color: 'var(--orange-500)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Instant Online Card Checkout</span>
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
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)'
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Lock size={13} /> 256-Bit SSL Encrypted & Money-Back Guaranteed
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
