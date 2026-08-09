'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '../../../src/context/StateContext';
import { upsertPricingTier, deletePricingTier } from '../../../src/services/supabaseService';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, Save, X, RefreshCw } from 'lucide-react';

export function PricingManagerClient() {
  const router = useRouter();
  const {
    isAuthenticated,
    isAuthInitialized,
    authUser,
    dynamicPricingTiers = [],
    setDynamicPricingTiers,
    showToast,
    resetAllData
  } = useAppState();

  const [activeTypeTab, setActiveTypeTab] = useState('embroidery');
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isAuthInitialized) return;
    const isMasterAdmin = isAuthenticated && authUser?.role === 'admin';
    if (!isMasterAdmin) {
      router.replace('/secure-admin-login');
    }
  }, [isAuthInitialized, isAuthenticated, authUser, router]);

  if (!isAuthInitialized) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  const filteredTiers = dynamicPricingTiers
    .filter(t => t.service_type === activeTypeTab)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handleEdit = (tier) => {
    setFormData({
      ...tier,
      features: Array.isArray(tier.features) ? tier.features : []
    });
    setEditingTier(tier.id || 'new');
  };

  const handleAddNew = () => {
    setFormData({
      service_type: activeTypeTab,
      title: '',
      subtitle: '',
      badge_text: '',
      price: 0,
      original_price: null,
      price_unit: '/ design',
      turnaround_time: '12-24 hr',
      features: [''],
      button_text: 'Order Now',
      is_popular: false,
      display_order: filteredTiers.length + 1
    });
    setEditingTier('new');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await upsertPricingTier(formData);
    if (success) {
      showToast('Pricing tier saved successfully!', 'success');
      setEditingTier(null);
      await resetAllData(); // Refresh catalog to get new data
    } else {
      showToast('Failed to save pricing tier.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;
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
    const newFeatures = [...formData.features];
    newFeatures[index] = val;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => setFormData({ ...formData, features: [...formData.features, ''] });
  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button 
          onClick={() => router.push('/admin')}
          className="btn btn-outline btn-sm"
          style={{ marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} /> Back to Admin Dashboard
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-900)' }}>Pricing Tiers Management</h1>
            <p style={{ color: 'var(--text-muted)' }}>Dynamically manage storefront pricing, features, and display details.</p>
          </div>
          <button onClick={handleAddNew} className="btn btn-primary-orange">
            <Plus size={16} /> Add New Tier
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'embroidery', label: 'Embroidery Digitizing' },
            { id: 'vector_art', label: 'Vector Art Conversion' },
            { id: 'patches', label: 'Custom Patches' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTypeTab(tab.id)}
              style={{
                background: activeTypeTab === tab.id ? 'var(--navy-900)' : 'transparent',
                color: activeTypeTab === tab.id ? '#fff' : 'var(--navy-600)',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {editingTier ? (
          <div className="card" style={{ padding: '2rem', background: '#fff', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingTier === 'new' ? 'Create New Tier' : 'Edit Tier'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Title</label>
                  <input type="text" className="form-control" required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Standard Digitizing" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Subtitle</label>
                  <input type="text" className="form-control" value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. For most logos and designs" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Price</label>
                  <input type="number" step="0.01" className="form-control" required value={formData.price || 0} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Original Price (Strike-through)</label>
                  <input type="number" step="0.01" className="form-control" value={formData.original_price || ''} onChange={e => setFormData({...formData, original_price: e.target.value ? parseFloat(e.target.value) : null})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Price Unit</label>
                  <input type="text" className="form-control" value={formData.price_unit || ''} onChange={e => setFormData({...formData, price_unit: e.target.value})} placeholder="e.g. / design" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Badge Text (Optional)</label>
                  <input type="text" className="form-control" value={formData.badge_text || ''} onChange={e => setFormData({...formData, badge_text: e.target.value})} placeholder="e.g. Most Popular" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Turnaround Time</label>
                  <input type="text" className="form-control" value={formData.turnaround_time || ''} onChange={e => setFormData({...formData, turnaround_time: e.target.value})} placeholder="e.g. 12-24 hr" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Button Text</label>
                  <input type="text" className="form-control" value={formData.button_text || ''} onChange={e => setFormData({...formData, button_text: e.target.value})} placeholder="e.g. Order Now" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="isPopular" checked={formData.is_popular || false} onChange={e => setFormData({...formData, is_popular: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  <label htmlFor="isPopular" style={{ fontWeight: 700 }}>Highlight as 'Most Popular'</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 700 }}>Display Order:</label>
                  <input type="number" className="form-control" style={{ width: '80px' }} value={formData.display_order || 0} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Features (Bullet Points)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.features?.map((feat, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={feat} 
                        onChange={e => handleFeatureChange(index, e.target.value)} 
                        placeholder="Feature description"
                      />
                      <button type="button" onClick={() => removeFeature(index)} className="btn btn-outline" style={{ padding: '0.5rem', color: 'red' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addFeature} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                    <Plus size={14} /> Add Feature
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setEditingTier(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-orange">
                  <Save size={16} /> Save Pricing Tier
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredTiers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '12px', gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-muted)' }}>No pricing tiers found for this service. Create one above.</p>
              </div>
            ) : (
              filteredTiers.map(tier => (
                <div key={tier.id} className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: tier.is_popular ? '2px solid var(--orange-500)' : '1px solid var(--border-color)', position: 'relative' }}>
                  {tier.is_popular && (
                    <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--orange-500)', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                      MOST POPULAR
                    </span>
                  )}
                  {tier.badge_text && (
                    <span style={{ display: 'inline-block', background: 'var(--navy-50)', color: 'var(--navy-800)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                      {tier.badge_text}
                    </span>
                  )}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{tier.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{tier.subtitle}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900 }}>${tier.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tier.price_unit}</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(Array.isArray(tier.features) ? tier.features : []).map((feat, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <CheckCircle size={14} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button onClick={() => handleEdit(tier)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(tier.id)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', color: 'red', borderColor: 'red' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
