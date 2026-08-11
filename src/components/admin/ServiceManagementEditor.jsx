'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { normalizeCategory } from '../../utils/categoryUtils';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Clock, 
  Sparkles, 
  DollarSign,
  Check,
  X
} from 'lucide-react';

export const ServiceManagementEditor = () => {
  const { 
    pricing, 
    updatePricing, 
    pricingCards = [], 
    updatePricingCards, 
    patchCards = [], 
    updatePatchCards, 
    storeProducts = [],
    updateStoreProducts, 
    servicesList = [], 
    updateServicesList,
    showToast 
  } = useAppState();

  const [activeCategory, setActiveCategory] = useState('embroidery'); // 'embroidery' | 'vector' | 'patches' | 'store'
  const [editingItem, setEditingItem] = useState(null); // Item being edited in modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for Edit/Create Modal
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    rate: '',
    unit: '',
    badge: '',
    turnaround: '8 - 12 Hours',
    description: '',
    featuresStr: '',
    popular: false,
    status: 'active',
    category: 'embroidery',
    image: ''
  });

  // Base Pricing Settings State (Rates per placement/redraw)
  const [basePricing, setBasePricing] = useState({
    minOrderFee: pricing?.minOrderFee || 10.00,
    vectorSimpleRate: pricing?.vectorSimpleRate || 15.00,
    vectorComplexRate: pricing?.vectorComplexRate || 25.00,
    rushSurcharge: pricing?.rushSurcharge || 10.00,
    jacketBackRate: 20.00,
    patchBaseRate: 2.50
  });

  const handleBasePricingSave = (e) => {
    e.preventDefault();
    const next = { ...pricing, ...basePricing };
    if (updatePricing) updatePricing(next);
    showToast('Base pricing rates updated successfully!', 'success');
  };

  const handleOpenEdit = (item, cat) => {
    setFormData({
      id: item.id,
      title: item.title || '',
      rate: item.rate || item.price || '',
      unit: item.unit || item.desc || '',
      badge: item.badge || '',
      turnaround: item.time || item.turnaround || '8 - 12 Hours',
      description: item.description || item.desc || '',
      featuresStr: Array.isArray(item.features) ? item.features.join('\n') : '',
      addOnsStr: Array.isArray(item.addOns) ? item.addOns.join('\n') : (item.addOns || 'Super Rush Delivery (+$10)\nFree EMB Native Source File\n3D Foam Cap Pathing (+$5)'),
      popular: Boolean(item.popular),
      status: item.status || 'active',
      category: cat || activeCategory,
      image: item.image || ''
    });
    setEditingItem({ ...item, cat });
  };

  const handleOpenCreate = () => {
    setFormData({
      id: `srv-${Date.now()}`,
      title: '',
      rate: '$15.00',
      unit: 'per design',
      badge: 'NEW TIER',
      turnaround: '8 - 12 Hours',
      description: 'Professional digitizing & vector service tier.',
      featuresStr: '4-Hour Express Available\nFree native .EMB source files\n100% Free Unlimited Revisions',
      addOnsStr: 'Super Rush Delivery (+$10)\nFree EMB Native Source File\n3D Foam Cap Pathing (+$5)',
      popular: false,
      status: 'active',
      category: activeCategory,
      image: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    const updatedFeatures = formData.featuresStr.split('\n').map(f => f.trim()).filter(Boolean);
    const updatedAddOns = formData.addOnsStr.split('\n').map(a => a.trim()).filter(Boolean);
    const normCat = normalizeCategory(formData.category || activeCategory);

    const updatedObj = {
      id: formData.id || `srv-${Date.now()}`,
      title: formData.title,
      rate: formData.rate,
      price: formData.rate,
      unit: formData.unit,
      badge: formData.badge,
      time: formData.turnaround,
      turnaround: formData.turnaround,
      description: formData.description,
      desc: formData.description,
      features: updatedFeatures,
      addOns: updatedAddOns,
      popular: formData.popular,
      status: formData.status,
      category: normCat,
      image: formData.image
    };

    // Save to services list
    const sExists = (servicesList || []).some(s => s.id === updatedObj.id);
    const nextServices = sExists ? servicesList.map(s => s.id === updatedObj.id ? updatedObj : s) : [...servicesList, updatedObj];
    if (updateServicesList) updateServicesList(nextServices);

    if (normCat === 'embroidery') {
      const exists = (pricingCards || []).some(p => p.id === updatedObj.id);
      const next = exists ? pricingCards.map(p => p.id === updatedObj.id ? updatedObj : p) : [...pricingCards, updatedObj];
      if (updatePricingCards) updatePricingCards(next);
    } else if (normCat === 'patches') {
      const exists = (patchCards || []).some(p => p.id === updatedObj.id);
      const next = exists ? patchCards.map(p => p.id === updatedObj.id ? updatedObj : p) : [...patchCards, updatedObj];
      if (updatePatchCards) updatePatchCards(next);
    }

    showToast(`Service "${formData.title}" saved under category "${normCat}"!`, 'success');
    setEditingItem(null);
    setIsCreateModalOpen(false);
  };

  const handleDeleteItem = (idToDelete) => {
    if (!window.confirm('Are you sure you want to delete this service tier?')) return;

    if (activeCategory === 'embroidery') {
      const next = (pricingCards || []).filter(p => p.id !== idToDelete);
      if (updatePricingCards) updatePricingCards(next);
    } else if (activeCategory === 'patches') {
      const next = (patchCards || []).filter(p => p.id !== idToDelete);
      if (updatePatchCards) updatePatchCards(next);
    } else {
      const next = (servicesList || []).filter(p => p.id !== idToDelete);
      if (updateServicesList) updateServicesList(next);
    }

    showToast('Service tier removed', 'info');
  };

  const defaultEmbroideryCards = [
    {
      id: 'pcard-basic',
      category: 'embroidery',
      tierKey: 'basic',
      title: 'Basic Digitizing',
      rate: '$10.00',
      price: '$10.00',
      unit: '/ design',
      badge: 'ESSENTIAL',
      time: '8 - 12 Hours',
      turnaround: '8 - 12 Hours',
      description: 'Ideal for simple left chest / small logos',
      features: ['Standard turnaround', '.DST / .PES machine files', 'Essential stitch paths & underlay'],
      popular: false,
      status: 'active'
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      tierKey: 'standard',
      title: 'Standard Digitizing',
      rate: '$20.00',
      price: '$20.00',
      unit: '/ design',
      badge: 'MOST POPULAR',
      time: '4-8 Hours Express',
      turnaround: '4-8 Hours Express',
      description: 'Ideal for standard left chest & caps',
      features: ['4-Hour Express Available', 'Free native .EMB source files', '100% Free Unlimited Revisions'],
      popular: true,
      status: 'active'
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      tierKey: 'premium',
      title: 'Premium Digitizing',
      rate: '$30.00',
      price: '$30.00',
      unit: '/ design',
      badge: 'VIP & COMPLEX',
      time: '4-8 Hours Express',
      turnaround: '4-8 Hours Express',
      description: 'Ideal for Jacket Backs & Large Crests',
      features: ['3D Puff Cap density pathing', 'Jacket back high stitch count verification', '24/7 Priority studio support'],
      popular: false,
      status: 'active'
    }
  ];

  const defaultVectorCards = [
    {
      id: 'vec-basic',
      category: 'vector',
      tierKey: 'basic',
      title: 'Basic Vector Redraw',
      rate: '$15.00',
      price: '$15.00',
      unit: '/ design',
      badge: 'ESSENTIAL',
      time: '8 - 12 Hours',
      turnaround: '8 - 12 Hours',
      description: 'Ideal for simple logos, text, & icon redraws',
      features: ['100% Hand-Drawn Paths', 'Master AI, EPS, SVG & PDF files', 'Standard 8-12 hr turnaround'],
      popular: false,
      status: 'active'
    },
    {
      id: 'vec-standard',
      category: 'vector',
      tierKey: 'standard',
      title: 'Standard Vector Conversion',
      rate: '$25.00',
      price: '$25.00',
      unit: '/ design',
      badge: 'MOST POPULAR',
      time: '4-8 Hours Express',
      turnaround: '4-8 Hours Express',
      description: 'Ideal for detailed artwork & color separations',
      features: ['Pantone Spot Color Separation', 'Free Unlimited Revisions', 'High-res Print-Ready Files', '4-8 hr turnaround'],
      popular: true,
      status: 'active'
    },
    {
      id: 'vec-premium',
      category: 'vector',
      tierKey: 'premium',
      title: 'Premium Mascot & Complex Vector',
      rate: '$35.00',
      price: '$35.00',
      unit: '/ design',
      badge: 'COMPLEX & RUSH',
      time: 'Super Rush Available',
      turnaround: 'Super Rush Available',
      description: 'Ideal for complex illustrations & intricate logos',
      features: ['Complex Mascot Node Pathing', 'Super Rush Express Delivery', 'VIP Studio Support'],
      popular: false,
      status: 'active'
    }
  ];

  const defaultPatchCards = [
    {
      id: 'patch-basic',
      category: 'patch',
      tierKey: 'basic',
      title: 'Basic Woven Patches',
      rate: '$1.50',
      price: '$1.50',
      unit: 'starting rate',
      badge: 'ESSENTIAL',
      time: '7-10 Days',
      turnaround: '7-10 Days',
      description: 'Ideal for simple logos and bulk orders',
      features: ['Flat stitched edge detail', 'Iron-on backing', 'Ideal for simple logos & high-volume bulk runs', 'Standard 7-10 day studio turnaround'],
      popular: false,
      status: 'active'
    },
    {
      id: 'patch-standard',
      category: 'patch',
      tierKey: 'standard',
      title: 'Standard Embroidered Patches',
      rate: '$2.50',
      price: '$2.50',
      unit: 'starting rate',
      badge: 'MOST POPULAR',
      time: '5-7 Days',
      turnaround: '5-7 Days',
      description: '3D raised thread texture & merrowed border',
      features: ['Classic merrowed border edges', '3D raised thread texture', 'Velcro or heat-seal backing options', 'Free pre-production digital proof'],
      popular: true,
      status: 'active'
    },
    {
      id: 'patch-premium',
      category: 'patch',
      tierKey: 'premium',
      title: 'Premium 3D PVC & Leather Patches',
      rate: '$3.50',
      price: '$3.50',
      unit: 'starting rate',
      badge: 'LUXURY & PVC',
      time: '5-7 Days',
      turnaround: '5-7 Days',
      description: 'Waterproof 3D molded PVC or genuine leather',
      features: ['High-durability waterproof PVC or genuine leather', 'Laser-cut precision border outlines', 'Tactical velcro or adhesive mounting', 'VIP priority production'],
      popular: false,
      status: 'active'
    }
  ];

  // Get active list depending on selected category
  const getCurrentList = () => {
    if (activeCategory === 'embroidery') {
      return (pricingCards && pricingCards.length > 0) ? pricingCards : defaultEmbroideryCards;
    }
    if (activeCategory === 'patches') {
      return (patchCards && patchCards.length > 0) ? patchCards : defaultPatchCards;
    }
    const filteredVec = (servicesList || []).filter(s => normalizeCategory(s.category) === 'vector-art');
    return filteredVec.length > 0 ? filteredVec : defaultVectorCards;
  };

  const currentList = getCurrentList();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. TOP GLOBAL BASE RATES BANNER */}
      <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} style={{ color: 'var(--orange-500)' }} /> Instant Pricing Matrix & Rush Surcharges
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Configure studio base rates per item placement, vector redraw complexity, and rush delivery fees.
            </p>
          </div>

          <button 
            type="button" 
            className="btn btn-primary-orange btn-sm"
            onClick={handleBasePricingSave}
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={15} /> Save Base Rates
          </button>
        </div>

        <form onSubmit={handleBasePricingSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '0.3rem' }}>
              Basic Digitizing ($/design)
            </label>
            <input 
              type="number" 
              step="0.5"
              className="form-control"
              value={basePricing.minOrderFee}
              onChange={(e) => setBasePricing(p => ({ ...p, minOrderFee: parseFloat(e.target.value) || 0 }))}
              style={{ fontWeight: 800 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '0.3rem' }}>
              Standard Redraw ($/design)
            </label>
            <input 
              type="number" 
              step="0.5"
              className="form-control"
              value={basePricing.vectorSimpleRate}
              onChange={(e) => setBasePricing(p => ({ ...p, vectorSimpleRate: parseFloat(e.target.value) || 0 }))}
              style={{ fontWeight: 800 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '0.3rem' }}>
              Complex Vector ($/art)
            </label>
            <input 
              type="number" 
              step="0.5"
              className="form-control"
              value={basePricing.vectorComplexRate}
              onChange={(e) => setBasePricing(p => ({ ...p, vectorComplexRate: parseFloat(e.target.value) || 0 }))}
              style={{ fontWeight: 800 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '0.3rem' }}>
              Super Rush Surcharge ($)
            </label>
            <input 
              type="number" 
              step="0.5"
              className="form-control"
              value={basePricing.rushSurcharge}
              onChange={(e) => setBasePricing(p => ({ ...p, rushSurcharge: parseFloat(e.target.value) || 0 }))}
              style={{ fontWeight: 800, color: 'var(--orange-600)' }}
            />
          </div>
        </form>
      </div>

      {/* 2. CATEGORY SELECTOR TABS & ACTION BUTTON */}
      <div className="card" style={{ padding: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className={`btn btn-sm ${activeCategory === 'embroidery' ? 'btn-primary-orange' : 'btn-outline'}`}
              onClick={() => setActiveCategory('embroidery')}
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              🧵 Embroidery Digitizing Tiers ({pricingCards.length})
            </button>

            <button 
              type="button"
              className={`btn btn-sm ${activeCategory === 'vector' ? 'btn-primary-orange' : 'btn-outline'}`}
              onClick={() => setActiveCategory('vector')}
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              📐 Vector Redraw Services ({servicesList.length})
            </button>

            <button 
              type="button"
              className={`btn btn-sm ${activeCategory === 'patches' ? 'btn-primary-orange' : 'btn-outline'}`}
              onClick={() => setActiveCategory('patches')}
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              📦 Custom Patches Tiers ({patchCards.length})
            </button>
          </div>

          <button 
            type="button"
            className="btn btn-navy btn-sm"
            onClick={handleOpenCreate}
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Add New Service Package
          </button>
        </div>

        {/* SERVICE CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {currentList.map(item => (
            <div 
              key={item.id}
              style={{
                border: item.popular ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.35rem',
                background: item.popular ? 'linear-gradient(180deg, rgba(255,122,0,0.04) 0%, #ffffff 100%)' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: item.popular ? 'var(--orange-600)' : 'var(--navy-700)',
                    background: item.popular ? 'rgba(255,122,0,0.15)' : '#f1f5f9',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}>
                    {item.badge || 'STUDIO PACKAGE'}
                  </span>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button 
                      type="button"
                      onClick={() => handleOpenEdit(item, activeCategory)}
                      style={{ background: '#f1f5f9', border: 'none', color: 'var(--navy-700)', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                      title="Edit Service"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                      title="Delete Service"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.35rem 0' }}>
                  {item.title}
                </h4>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--orange-600)' }}>
                    {item.rate || item.price || '$15.00'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {item.unit || '/ design'}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--navy-800)', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} style={{ color: 'var(--orange-500)' }} /> {item.time || item.turnaround || '8 - 12 Hours Delivery'}
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1rem' }}>
                  {item.description || item.desc || 'Professional digitizing package.'}
                </p>

                {Array.isArray(item.features) && item.features.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--navy-800)' }}>
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.status === 'disabled' ? '#dc2626' : '#10b981' }}>
                  ● {item.status === 'disabled' ? 'Disabled' : 'Active Live'}
                </span>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEdit(item, activeCategory)}
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Configure <Edit3 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT / CREATE SERVICE MODAL */}
      {(editingItem || isCreateModalOpen) && (
        <div className="modal-overlay" onClick={() => { setEditingItem(null); setIsCreateModalOpen(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--orange-500)' }} />
                {editingItem ? `Edit Service: ${editingItem.title}` : `Create New Service Package`}
              </h3>
              <button 
                type="button" 
                onClick={() => { setEditingItem(null); setIsCreateModalOpen(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Service / Package Category *</label>
                <select 
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                  style={{ fontWeight: 700 }}
                >
                  <option value="embroidery">Embroidery</option>
                  <option value="vector-art">Vector Art</option>
                  <option value="patches">Patches</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Service Title *</label>
                <input 
                  type="text"
                  required
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Standard Left Chest & Cap Digitizing"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Price Rate ($) *</label>
                  <input 
                    type="text"
                    required
                    className="form-control"
                    value={formData.rate}
                    onChange={(e) => setFormData(p => ({ ...p, rate: e.target.value }))}
                    placeholder="e.g. $15.00"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Rate Unit</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.unit}
                    onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                    placeholder="e.g. / design"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Badge Tag</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.badge}
                    onChange={(e) => setFormData(p => ({ ...p, badge: e.target.value }))}
                    placeholder="e.g. MOST POPULAR"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Turnaround Time</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.turnaround}
                    onChange={(e) => setFormData(p => ({ ...p, turnaround: e.target.value }))}
                    placeholder="e.g. 4 - 8 Hours Express"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Description</label>
                <textarea 
                  rows={2}
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description of this service tier..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Features Checkmarks (1 per line)</label>
                <textarea 
                  rows={3}
                  className="form-control"
                  value={formData.featuresStr}
                  onChange={(e) => setFormData(p => ({ ...p, featuresStr: e.target.value }))}
                  placeholder="4-Hour Express Available&#10;Free native .EMB source files&#10;100% Free Unlimited Revisions"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Add-on Options & Upgrades (1 per line)</label>
                <textarea 
                  rows={3}
                  className="form-control"
                  value={formData.addOnsStr}
                  onChange={(e) => setFormData(p => ({ ...p, addOnsStr: e.target.value }))}
                  placeholder="Super Rush Delivery (+$10)&#10;Free EMB Native Source File&#10;3D Foam Cap Pathing (+$5)"
                />
              </div>

              {(activeCategory === 'store' || activeCategory === 'patches') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Product / Patch Preview Image URL</label>
                  <input 
                    type="url"
                    className="form-control"
                    value={formData.image}
                    onChange={(e) => setFormData(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData(p => ({ ...p, popular: e.target.checked }))}
                    style={{ accentColor: 'var(--orange-500)' }}
                  /> Highlight as Most Popular
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.2rem' }}>Service Live Status</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                    style={{ fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <option value="active">● Active Live in Studio</option>
                    <option value="disabled">🔴 Disabled / Offline</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => { setEditingItem(null); setIsCreateModalOpen(false); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary-orange"
                  style={{ fontWeight: 800 }}
                >
                  Save Service Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
