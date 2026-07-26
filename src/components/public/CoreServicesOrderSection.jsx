import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Minus
} from 'lucide-react';

export const CoreServicesOrderSection = () => {
  const navigate = useNavigate();
  const { pricing = {}, createOrder, isAuthenticated, protectedNavigate, showToast } = useAppState();

  const [activeService, setActiveService] = useState('digitizing'); // 'digitizing' | 'vector' | 'patches' | 'tshirts' | 'caps'

  // Common Order State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Service 1: Embroidery Digitizing State
  const [digitizingPlacement, setDigitizingPlacement] = useState('Left Chest');
  const [fabricType, setFabricType] = useState('Pique Polo Cotton');
  const [targetFormats, setTargetFormats] = useState(['dst', 'pes', 'emb']);

  // Service 2: Vector Tracing State
  const [vectorComplexity, setVectorComplexity] = useState('simple'); // 'simple' | 'complex'
  const [vectorFormats, setVectorFormats] = useState(['ai', 'eps', 'svg', 'pdf']);

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

  // Dynamic Price Calculation
  const calculatePrice = () => {
    let base = 0;
    const rushFee = isRush ? 10.00 : 0.00;

    if (activeService === 'digitizing') {
      base = digitizingPlacement === 'Jacket Back' ? 35.00 : (pricing.minOrderFee || 10.00);
    } else if (activeService === 'vector') {
      base = vectorComplexity === 'complex' ? (pricing.vectorComplexRate || 25.00) : (pricing.vectorSimpleRate || 15.00);
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

    const newOrderPayload = {
      title,
      type: activeService,
      serviceCategory: 
        activeService === 'digitizing' ? `Embroidery Digitizing (${digitizingPlacement})` :
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
        digitizingPlacement,
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
            <Sparkles size={16} /> Multi-Service Interactive Studio
          </div>

          <h2 style={{ fontSize: '2.5rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
            Select Service & Configure Your Order
          </h2>

          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Choose from our 5 core services below to upload your artwork, customize specifications, and receive instant transparent pricing.
          </p>
        </div>

        {/* 5 Core Services Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
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
            <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>From $10.00</span>
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
            <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>From $15.00</span>
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
            <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Custom Patches</span>
            <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>From $1.50 / patch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveService('tshirts')}
            style={{
              padding: '1.15rem 1rem',
              borderRadius: '12px',
              border: activeService === 'tshirts' ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
              background: activeService === 'tshirts' ? 'linear-gradient(135deg, rgba(255,122,0,0.2) 0%, rgba(255,122,0,0.05) 100%)' : '#1e293b',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Shirt size={24} style={{ color: activeService === 'tshirts' ? 'var(--orange-400)' : '#94a3b8' }} />
            <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Custom T-Shirts</span>
            <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>From $14.00 / shirt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveService('caps')}
            style={{
              padding: '1.15rem 1rem',
              borderRadius: '12px',
              border: activeService === 'caps' ? '2px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.15)',
              background: activeService === 'caps' ? 'linear-gradient(135deg, rgba(255,122,0,0.2) 0%, rgba(255,122,0,0.05) 100%)' : '#1e293b',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <HardHat size={24} style={{ color: activeService === 'caps' ? 'var(--orange-400)' : '#94a3b8' }} />
            <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Caps & 3D Puff Hats</span>
            <span style={{ fontSize: '0.73rem', color: 'var(--orange-400)', fontWeight: 700 }}>From $12.00 / cap</span>
          </button>
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

              {/* Upload Box */}
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1.5rem',
                background: '#0f172a',
                border: '2px dashed rgba(255, 122, 0, 0.4)',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <Upload size={28} style={{ color: 'var(--orange-400)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Click or drag artwork files to upload</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Supports PNG, JPG, PDF, AI, SVG, PSD, DST</span>
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
                <Sparkles size={18} style={{ color: 'var(--orange-400)' }} /> Step 2: Configure Service Options
              </h3>

              {/* 1. EMBROIDERY DIGITIZING */}
              {activeService === 'digitizing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Logo Placement</label>
                    <select value={digitizingPlacement} onChange={(e) => setDigitizingPlacement(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <option value="Left Chest">Left Chest / Polo Logo (Up to 4 inches)</option>
                      <option value="Cap / Hat">Cap / Hat Logo (Center-Out Pathing)</option>
                      <option value="Jacket Back">Jacket Back / Large Crest (Full Back)</option>
                      <option value="Sleeve / Cuff">Sleeve / Cuff Logo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Target Garment Fabric</label>
                    <input type="text" className="form-control" value={fabricType} onChange={(e) => setFabricType(e.target.value)} style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }} />
                  </div>
                </div>
              )}

              {/* 2. VECTOR TRACING */}
              {activeService === 'vector' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Vector Complexity Tier</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div onClick={() => setVectorComplexity('simple')} style={{ padding: '0.85rem', borderRadius: '8px', border: vectorComplexity === 'simple' ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)', background: vectorComplexity === 'simple' ? 'rgba(255,122,0,0.15)' : '#0f172a', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>Simple Redraw ($15)</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Clean text, simple logos, 1-3 colors</div>
                      </div>

                      <div onClick={() => setVectorComplexity('complex')} style={{ padding: '0.85rem', borderRadius: '8px', border: vectorComplexity === 'complex' ? '2px solid var(--orange-500)' : '1px solid rgba(255,255,255,0.15)', background: vectorComplexity === 'complex' ? 'rgba(255,122,0,0.15)' : '#0f172a', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>Complex Redraw ($25)</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mascots, gradients, multi-color illustrations</div>
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Patch Quantity (pcs)</label>
                    <input type="number" min="10" step="5" value={patchQuantity} onChange={(e) => setPatchQuantity(Number(e.target.value))} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }} />
                  </div>
                </div>
              )}

              {/* 4. CUSTOM T-SHIRTS */}
              {activeService === 'tshirts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Shirt Color</label>
                      <input type="text" value={tshirtColor} onChange={(e) => setTshirtColor(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Logo Placement</label>
                      <select value={tshirtPlacement} onChange={(e) => setTshirtPlacement(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <option value="Left Chest Embroidery">Left Chest Embroidery</option>
                        <option value="Full Center Chest">Full Center Chest</option>
                        <option value="Sleeve Logo">Sleeve Logo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem' }}>Size Quantity Breakdown (S - 3XL)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                      {['S', 'M', 'L', 'XL', '2XL', '3XL'].map(sz => (
                        <div key={sz} style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{sz}</span>
                          <input type="number" min="0" value={tshirtSizes[sz] || 0} onChange={(e) => setTshirtSizes(prev => ({ ...prev, [sz]: Number(e.target.value) }))} className="form-control" style={{ padding: '0.3rem', textAlign: 'center', background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CUSTOM CAPS & 3D PUFF HATS */}
              {activeService === 'caps' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Cap Style</label>
                      <select value={capStyle} onChange={(e) => setCapStyle(e.target.value)} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <option value="Structured Snapback">Structured Snapback Cap</option>
                        <option value="Dad Hat">Unstructured Dad Hat</option>
                        <option value="Beanie">Knit Beanie Hat</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>Cap Quantity (pcs)</label>
                      <input type="number" min="6" step="6" value={capQuantity} onChange={(e) => setCapQuantity(Number(e.target.value))} className="form-control" style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <input type="checkbox" id="puff-check" checked={is3dPuff} onChange={(e) => setIs3dPuff(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)' }} />
                    <label htmlFor="puff-check" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}>
                      Add 3D Foam Raised Embroidery (+ $2.00 / cap)
                    </label>
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
                     activeService === 'vector' ? 'Vector Tracing' :
                     activeService === 'patches' ? 'Custom Patches' :
                     activeService === 'tshirts' ? 'Custom T-Shirts' : 'Caps & 3D Puff Hats'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Turnaround Guarantee:</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>
                    {activeService === 'patches' || activeService === 'tshirts' || activeService === 'caps' ? '2-4 Days Shipping' : '8-12 Hours Standard'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#0f172a', borderRadius: '8px', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Add Super Rush (2-4 Hrs / Express)</span>
                  <input type="checkbox" checked={isRush} onChange={(e) => setIsRush(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)' }} />
                </div>

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
    </section>
  );
};
