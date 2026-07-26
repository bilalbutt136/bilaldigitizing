import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Save, 
  Sliders, 
  DollarSign, 
  Layers, 
  Settings, 
  Plus, 
  Trash2, 
  Tag, 
  Clock, 
  Globe 
} from 'lucide-react';

export const PricingSettingsModal = () => {
  const { 
    isPricingSettingsOpen, 
    setIsPricingSettingsOpen,
    pricing,
    updatePricing,
    servicesList,
    updateServicesList,
    siteSettings,
    updateSiteSettings,
    showToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' | 'services' | 'settings'

  const [draftPricing, setDraftPricing] = useState({ ...pricing });
  const [draftServices, setDraftServices] = useState([...(servicesList || [])]);
  const [draftSettings, setDraftSettings] = useState({ ...siteSettings });

  if (!isPricingSettingsOpen) return null;

  const handlePricingChange = (key, value) => {
    const num = parseFloat(value);
    setDraftPricing(prev => ({
      ...prev,
      [key]: isNaN(num) ? value : num
    }));
  };

  const handleServiceChange = (id, field, value) => {
    setDraftServices(prev => prev.map(srv => {
      if (srv.id === id) {
        return { ...srv, [field]: value };
      }
      return srv;
    }));
  };

  const handleAddService = () => {
    const newId = `srv-${Date.now()}`;
    const newServiceItem = {
      id: newId,
      title: 'New Studio Service',
      price: 'Starting $15.00',
      stitches: 'Custom Pathing',
      time: '12 - 24 Hours',
      icon: 'Shirt',
      desc: 'Enter public service description here.'
    };
    setDraftServices(prev => [...prev, newServiceItem]);
  };

  const handleRemoveService = (idToRemove) => {
    setDraftServices(prev => prev.filter(srv => srv.id !== idToRemove));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updatePricing(draftPricing);
    updateServicesList(draftServices);
    updateSiteSettings(draftSettings);
    showToast('Services, Pricing Rates & Site Content published live!', 'success');
    setIsPricingSettingsOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsPricingSettingsOpen(false)}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
      >
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--navy-950)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--orange-500)', color: '#ffffff', padding: '0.4rem', borderRadius: '6px', display: 'flex' }}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, margin: 0 }}>
                Services & Pricing Content Editor
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Instant real-time update panel for public landing pages and quote calculations
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsPricingSettingsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', background: 'var(--navy-100)', borderBottom: '1px solid var(--border-color)', padding: '0 1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            style={{
              padding: '0.85rem 1.15rem',
              border: 'none',
              borderBottom: activeTab === 'pricing' ? '3px solid var(--orange-500)' : '3px solid transparent',
              background: 'none',
              fontWeight: 800,
              fontSize: '0.875rem',
              color: activeTab === 'pricing' ? 'var(--orange-600)' : 'var(--navy-800)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <DollarSign size={16} /> Pricing Rates
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            style={{
              padding: '0.85rem 1.15rem',
              border: 'none',
              borderBottom: activeTab === 'services' ? '3px solid var(--orange-500)' : '3px solid transparent',
              background: 'none',
              fontWeight: 800,
              fontSize: '0.875rem',
              color: activeTab === 'services' ? 'var(--orange-600)' : 'var(--navy-800)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Layers size={16} /> Service Cards & Turnaround Badges ({draftServices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '0.85rem 1.15rem',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '3px solid var(--orange-500)' : '3px solid transparent',
              background: 'none',
              fontWeight: 800,
              fontSize: '0.875rem',
              color: activeTab === 'settings' ? 'var(--orange-600)' : 'var(--navy-800)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Settings size={16} /> Site Settings & Contact
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} style={{ padding: '1.75rem', maxHeight: '65vh', overflowY: 'auto' }}>
          
          {/* TAB 1: PRICING RATES */}
          {activeTab === 'pricing' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                  Dynamic Pricing & Rate Rules
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Updates starting fees, stitch multipliers, and rush surcharges instantly across quote calculators and landing pages.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Embroidery Min Order Fee ($)</label>
                  <input 
                    type="number"
                    step="0.50"
                    className="form-control"
                    style={{ fontWeight: 800 }}
                    value={draftPricing.minOrderFee ?? 10.00}
                    onChange={(e) => handlePricingChange('minOrderFee', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Rate Per 1,000 Stitches ($)</label>
                  <input 
                    type="number"
                    step="0.10"
                    className="form-control"
                    style={{ fontWeight: 800 }}
                    value={draftPricing.ratePerThousandStitches ?? 1.50}
                    onChange={(e) => handlePricingChange('ratePerThousandStitches', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Custom Patches Starting Rate ($)</label>
                  <input 
                    type="number"
                    step="0.25"
                    className="form-control"
                    style={{ fontWeight: 800 }}
                    value={draftPricing.customPatchesStartingRate ?? 1.50}
                    onChange={(e) => handlePricingChange('customPatchesStartingRate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Vector Simple Rate ($)</label>
                  <input 
                    type="number"
                    step="1.00"
                    className="form-control"
                    style={{ fontWeight: 800 }}
                    value={draftPricing.vectorSimpleRate ?? 15.00}
                    onChange={(e) => handlePricingChange('vectorSimpleRate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Vector Complex Rate ($)</label>
                  <input 
                    type="number"
                    step="1.00"
                    className="form-control"
                    style={{ fontWeight: 800 }}
                    value={draftPricing.vectorComplexRate ?? 30.00}
                    onChange={(e) => handlePricingChange('vectorComplexRate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Express Rush Surcharge ($)</label>
                  <input 
                    type="number"
                    step="1.00"
                    className="form-control"
                    style={{ fontWeight: 800 }}
                    value={draftPricing.rushSurcharge ?? 10.00}
                    onChange={(e) => handlePricingChange('rushSurcharge', e.target.value)}
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: SERVICE CARDS & TURNAROUND BADGES */}
          {activeTab === 'services' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                    Public Service Cards & Badges
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Edit service titles, starting prices ($10-$15, $1.50 patches, etc.), turnaround time badges, and descriptions.
                  </p>
                </div>

                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={handleAddService}
                  style={{ gap: '0.35rem', fontWeight: 700 }}
                >
                  <Plus size={15} /> Add Service
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {draftServices.map((srv, idx) => (
                  <div 
                    key={srv.id || idx}
                    style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Tag size={15} style={{ color: 'var(--orange-500)' }} /> Service Card #{idx + 1}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveService(srv.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={14} /> Remove Card
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Service Title</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ fontWeight: 700 }}
                          value={srv.title || ''}
                          onChange={(e) => handleServiceChange(srv.id, 'title', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Starting Price Tag (e.g. $10 - $15)</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ fontWeight: 700, color: 'var(--orange-600)' }}
                          value={srv.price || ''}
                          onChange={(e) => handleServiceChange(srv.id, 'price', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Turnaround Time Badge</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={srv.time || ''}
                          onChange={(e) => handleServiceChange(srv.id, 'time', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Stitches / Pathing Badge</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={srv.stitches || ''}
                          onChange={(e) => handleServiceChange(srv.id, 'stitches', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Public Service Description</label>
                      <textarea 
                        rows={2}
                        className="form-control"
                        value={srv.desc || ''}
                        onChange={(e) => handleServiceChange(srv.id, 'desc', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SITE SETTINGS & CONTACT */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                  Site Contact & Announcement Settings
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Update global support email, phone numbers, and top header banner notice across public pages.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.825rem' }}>Brand / Studio Title</label>
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ fontWeight: 700 }}
                    value={draftSettings.siteTitle || ''}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem' }}>Support Email Address</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={draftSettings.supportEmail || ''}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem' }}>Contact Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={draftSettings.contactPhone || ''}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.825rem' }}>Operational Status</label>
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ fontWeight: 700, color: 'var(--green-700)' }}
                    value={draftSettings.operationalStatus || ''}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, operationalStatus: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.825rem' }}>Top Announcement Banner Notice</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={draftSettings.bannerNotice || ''}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, bannerNotice: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem',
            marginTop: '1.5rem'
          }}>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsPricingSettingsOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary-orange btn-lg"
              style={{ fontWeight: 800 }}
            >
              <Save size={18} /> Save & Publish Live Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
