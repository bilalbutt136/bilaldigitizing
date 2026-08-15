'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { upsertPricingTier, deletePricingTier } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Save, 
  X, 
  RefreshCw, 
  Layers, 
  PenTool, 
  Tag, 
  Sparkles,
  ArrowRight,
  Clock,
  DollarSign,
  Eye
} from 'lucide-react';

export const DynamicPricingEditor = () => {
  const {
    isAuthInitialized,
    dynamicPricingTiers = [],
    setDynamicPricingTiers,
    showToast,
    resetAllData
  } = useAppState();

  const [activeTypeTab, setActiveTypeTab] = useState('embroidery');
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthInitialized) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  const filteredTiers = dynamicPricingTiers
    .filter(t => matchCategory(t.service_type, activeTypeTab))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handleEdit = (tier) => {
    setFormData({
      ...tier,
      service_type: tier.service_type === 'vector-art' ? 'vector_art' : (tier.service_type || activeTypeTab),
      features: Array.isArray(tier.features) ? tier.features : []
    });
    setEditingTier(tier.id || 'new');
  };

  const handleAddNew = () => {
    const sType = activeTypeTab === 'vector-art' ? 'vector_art' : activeTypeTab;
    setFormData({
      service_type: sType,
      title: '',
      subtitle: '',
      badge_text: '',
      price: 15,
      original_price: null,
      price_unit: '/ design',
      turnaround_time: '12-24 hr',
      features: ['100% Hand-Crafted Paths', 'Free Unlimited Edits', 'Production Source Files'],
      button_text: 'Order Now',
      is_popular: false,
      display_order: filteredTiers.length + 1
    });
    setEditingTier('new');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      showToast('Please provide a tier title.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedType = (formData.service_type || activeTypeTab).toLowerCase().replace('-', '_');
      const normalizedData = {
        ...formData,
        service_type: sanitizedType === 'vector' || sanitizedType === 'vector_art' ? 'vector_art' : (sanitizedType === 'patch' || sanitizedType === 'patches' ? 'patches' : 'embroidery')
      };

      const success = await upsertPricingTier(normalizedData);
      if (success) {
        showToast('Pricing tier saved successfully!', 'success');
        setEditingTier(null);
        await resetAllData();
      } else {
        showToast('Failed to save pricing tier. Please check connection.', 'error');
      }
    } catch (err) {
      console.error('Save pricing tier error:', err);
      showToast('Error saving pricing tier.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing tier?')) return;
    const success = await deletePricingTier(id);
    if (success) {
      showToast('Pricing tier deleted.', 'info');
      setDynamicPricingTiers(prev => prev.filter(t => t.id !== id));
      await resetAllData();
    } else {
      showToast('Failed to delete pricing tier.', 'error');
    }
  };

  const handleFeatureChange = (index, val) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = val;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => setFormData({ ...formData, features: [...(formData.features || []), ''] });
  const removeFeature = (index) => {
    const newFeatures = (formData.features || []).filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const getServiceTheme = (sType) => {
    const norm = (sType || '').toLowerCase().replace('-', '_');
    if (norm === 'vector_art' || norm === 'vector') {
      return {
        label: 'Vector Art',
        color: '#2563eb',
        bgLight: '#eff6ff',
        border: '#bfdbfe',
        icon: PenTool
      };
    }
    if (norm === 'patches' || norm === 'patch') {
      return {
        label: 'Custom Patches',
        color: '#059669',
        bgLight: '#ecfdf5',
        border: '#a7f3d0',
        icon: Tag
      };
    }
    return {
      label: 'Embroidery',
      color: '#ea580c',
      bgLight: '#fff7ed',
      border: '#fed7aa',
      icon: Layers
    };
  };

  const tabs = [
    { id: 'embroidery', label: 'Embroidery Digitizing', icon: Layers, count: dynamicPricingTiers.filter(t => matchCategory(t.service_type, 'embroidery')).length },
    { id: 'vector_art', label: 'Vector Art Conversion', icon: PenTool, count: dynamicPricingTiers.filter(t => matchCategory(t.service_type, 'vector_art')).length },
    { id: 'patches', label: 'Custom Patches', icon: Tag, count: dynamicPricingTiers.filter(t => matchCategory(t.service_type, 'patches')).length }
  ];

  return (
    <div style={{ padding: '1rem 0' }}>
      
      {/* Top Header */}
      <div className="card" style={{ padding: '1.5rem 2rem', background: '#ffffff', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--orange-500)' }} />
              Dynamic Storefront Pricing Tiers
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
              Manage service packages, pricing tiers, bullet features, and turnaround times displayed to customers on the pricing page.
            </p>
          </div>
          <button 
            onClick={handleAddNew} 
            className="btn btn-primary-orange btn-md"
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} /> Add New Pricing Tier
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        background: '#f1f5f9',
        padding: '0.4rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTypeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTypeTab(tab.id);
                setEditingTier(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.35rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? 'var(--orange-600)' : 'var(--navy-700)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.925rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={18} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'var(--orange-100)' : '#e2e8f0',
                color: isActive ? 'var(--orange-700)' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                marginLeft: '0.25rem'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {editingTier ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Edit Form */}
          <div className="card" style={{ padding: '2rem', background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                {editingTier === 'new' ? '✨ Create New Pricing Tier' : '✏️ Edit Pricing Tier'}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingTier(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Target Service *</label>
                  <select 
                    className="form-control" 
                    value={formData.service_type || 'embroidery'} 
                    onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="embroidery">Embroidery Digitizing</option>
                    <option value="vector_art">Vector Art Conversion</option>
                    <option value="patches">Custom Physical Patches</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Badge Text (e.g. Popular, Best Value)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.badge_text || ''} 
                    onChange={e => setFormData({ ...formData, badge_text: e.target.value })} 
                    placeholder="e.g. Most Popular / Best Value" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Tier Title *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.title || ''} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="e.g. Left Chest / Hat Logo" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Subtitle / Scope</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.subtitle || ''} 
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })} 
                    placeholder="e.g. Standard logos up to 4x4 inches" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    required 
                    value={formData.price !== undefined ? formData.price : 0} 
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Strike Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    value={formData.original_price || ''} 
                    onChange={e => setFormData({ ...formData, original_price: e.target.value ? parseFloat(e.target.value) : null })} 
                    placeholder="e.g. 20.00" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Price Unit</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.price_unit || ''} 
                    onChange={e => setFormData({ ...formData, price_unit: e.target.value })} 
                    placeholder="e.g. / design" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Turnaround Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.turnaround_time || ''} 
                    onChange={e => setFormData({ ...formData, turnaround_time: e.target.value })} 
                    placeholder="e.g. 4–12 Hours" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>Button Text</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.button_text || ''} 
                    onChange={e => setFormData({ ...formData, button_text: e.target.value })} 
                    placeholder="e.g. Order Now" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isPopular" 
                    checked={formData.is_popular || false} 
                    onChange={e => setFormData({ ...formData, is_popular: e.target.checked })} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                  />
                  <label htmlFor="isPopular" style={{ fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                    Highlight as 'Most Popular' (Special glowing card)
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.875rem' }}>Display Order:</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    style={{ width: '75px' }} 
                    value={formData.display_order || 0} 
                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Features Checklist (Bullet Points)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(formData.features || []).map((feat, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={feat} 
                        onChange={e => handleFeatureChange(index, e.target.value)} 
                        placeholder="Feature line item..."
                      />
                      <button 
                        type="button" 
                        onClick={() => removeFeature(index)} 
                        style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '0.45rem', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={addFeature} 
                    className="btn btn-outline btn-sm" 
                    style={{ alignSelf: 'flex-start', marginTop: '0.35rem', fontWeight: 700 }}
                  >
                    <Plus size={14} /> Add Feature
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setEditingTier(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary-orange btn-lg" style={{ fontWeight: 800, padding: '0.85rem 2rem' }}>
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Pricing Tier'}
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Customer Preview Card */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-700)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={16} style={{ color: 'var(--orange-500)' }} /> Customer Live Preview
            </div>

            {(() => {
              const theme = getServiceTheme(formData.service_type);
              const ThemeIcon = theme.icon;
              return (
                <div style={{
                  background: '#ffffff',
                  border: formData.is_popular ? '2px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '2.25rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: formData.is_popular ? '0 10px 30px rgba(234, 88, 12, 0.15)' : 'var(--shadow-md)',
                  position: 'relative'
                }}>
                  {formData.is_popular && (
                    <span style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--orange-500)',
                      color: '#ffffff',
                      padding: '0.35rem 1.1rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 10px rgba(234,88,12,0.3)'
                    }}>
                      MOST POPULAR
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: theme.bgLight, color: theme.color, padding: '0.65rem', borderRadius: '12px', display: 'flex' }}>
                      <ThemeIcon size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.color, textTransform: 'uppercase' }}>
                        {theme.label}
                      </span>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>
                        {formData.title || 'Tier Title'}
                      </h3>
                    </div>
                  </div>

                  {formData.subtitle && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      {formData.subtitle}
                    </p>
                  )}

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <div style={{ fontSize: '2.75rem', fontWeight: 900, color: theme.color, lineHeight: 1 }}>
                        ${formData.price !== undefined ? formData.price : '0'}
                      </div>
                      {formData.original_price && (
                        <div style={{ fontSize: '1.15rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                          ${formData.original_price}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.4rem', textTransform: 'uppercase' }}>
                      {formData.badge_text || formData.price_unit || '/ design'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
                    {(formData.features || []).filter(f => f && f.trim()).map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                          <CheckCircle size={13} />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '0.9rem',
                    background: theme.color,
                    color: '#ffffff',
                    textAlign: 'center',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}>
                    {formData.button_text || 'Order Now'} <ArrowRight size={16} />
                  </div>

                  {formData.turnaround_time && (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.75rem' }}>
                      Turnaround: {formData.turnaround_time}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredTiers.length === 0 ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '16px', gridColumn: '1 / -1', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.5rem' }}>
                No pricing tiers created for this service yet.
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Click "Add New Pricing Tier" above to create packages for {tabs.find(t => t.id === activeTypeTab)?.label}.
              </p>
              <button onClick={handleAddNew} className="btn btn-primary-orange btn-sm" style={{ fontWeight: 700 }}>
                <Plus size={16} /> Create First Tier
              </button>
            </div>
          ) : (
            filteredTiers.map(tier => {
              const theme = getServiceTheme(tier.service_type);
              const ThemeIcon = theme.icon;

              return (
                <div 
                  key={tier.id} 
                  className="card" 
                  style={{ 
                    padding: '2rem 1.75rem', 
                    background: '#fff', 
                    borderRadius: '16px', 
                    border: tier.is_popular ? '2px solid var(--orange-500)' : '1px solid var(--border-color)', 
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: tier.is_popular ? '0 8px 24px rgba(234, 88, 12, 0.12)' : 'var(--shadow-sm)'
                  }}
                >
                  {tier.is_popular && (
                    <span style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: 'var(--orange-500)', color: '#fff', padding: '0.25rem 0.9rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                      MOST POPULAR
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ background: theme.bgLight, color: theme.color, padding: '0.55rem', borderRadius: '10px', display: 'flex' }}>
                          <ThemeIcon size={20} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: theme.color, textTransform: 'uppercase' }}>
                            {theme.label}
                          </span>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>
                            {tier.title}
                          </h3>
                        </div>
                      </div>

                      {tier.badge_text && (
                        <span style={{ background: 'var(--navy-50)', color: 'var(--navy-800)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {tier.badge_text}
                        </span>
                      )}
                    </div>

                    {tier.subtitle && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                        {tier.subtitle}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 900, color: theme.color, lineHeight: 1 }}>${tier.price}</span>
                      {tier.original_price && (
                        <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>${tier.original_price}</span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{tier.price_unit}</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {(Array.isArray(tier.features) ? tier.features : []).map((feat, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                          <CheckCircle size={14} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {tier.turnaround_time && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: theme.color }} /> Turnaround: {tier.turnaround_time}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <button type="button" onClick={() => handleEdit(tier)} className="btn btn-outline btn-sm" style={{ flex: 1, fontWeight: 700 }}>
                        <Edit2 size={14} /> Edit Tier
                      </button>
                      <button type="button" onClick={() => handleDelete(tier.id)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', color: '#dc2626', borderColor: '#fecdd3' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicPricingEditor;
