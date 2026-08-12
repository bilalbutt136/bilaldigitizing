'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Save, Layers, PenTool, Tag } from 'lucide-react';

export const ServiceBannerEditor = () => {
  const { homePageConfig, updateHomePageConfigSettings } = useAppState();
  const dbSettings = homePageConfig?.settings || {};

  const [activeTab, setActiveTab] = useState('embroidery'); // 'embroidery' | 'vector' | 'patches'
  const [formData, setFormData] = useState({
    embroidery: {
      emb_hero_badge: '',
      emb_hero_title: '',
      emb_hero_sub: '',
      emb_hero_value_1: '',
      emb_hero_value_2: '',
      emb_hero_value_3: '',
      emb_hero_btn_primary: '',
      emb_hero_btn_secondary: ''
    },
    vector: {
      vector_hero_badge: '',
      vector_hero_title: '',
      vector_hero_sub: '',
      vector_hero_value_1: '',
      vector_hero_value_2: '',
      vector_hero_value_3: '',
      vector_hero_btn_primary: '',
      vector_hero_btn_secondary: ''
    },
    patches: {
      patch_hero_badge: '',
      patch_hero_title: '',
      patch_hero_sub: '',
      patch_hero_price: '',
      patch_hero_value_1: '',
      patch_hero_value_2: '',
      patch_hero_value_3: '',
      patch_hero_btn_primary: '',
      patch_hero_btn_secondary: ''
    }
  });

  // Hydrate local state from context
  useEffect(() => {
    setFormData({
      embroidery: {
        emb_hero_badge: dbSettings.emb_hero_badge || 'DEDICATED EMBROIDERY DIGITIZING STUDIO',
        emb_hero_title: dbSettings.emb_hero_title || 'Custom Embroidery Digitizing Services',
        emb_hero_sub: dbSettings.emb_hero_sub || 'Turn your logo artwork into precise embroidery files ready for commercial production. Every design is hand-digitized with exact stitch counts, underlay pathing, and zero needle breaks.',
        emb_hero_value_1: dbSettings.emb_hero_value_1 || 'Accurate Stitching Pathing',
        emb_hero_value_2: dbSettings.emb_hero_value_2 || 'Smooth Commercial Results',
        emb_hero_value_3: dbSettings.emb_hero_value_3 || 'All Machine Formats (.DST, .PES, .EMB)',
        emb_hero_btn_primary: dbSettings.emb_hero_btn_primary || 'Order Digitizing Design',
        emb_hero_btn_secondary: dbSettings.emb_hero_btn_secondary || 'View Pricing Tiers'
      },
      vector: {
        vector_hero_badge: dbSettings.vector_hero_badge || 'Dedicated Vector Redraw Studio',
        vector_hero_title: dbSettings.vector_hero_title || 'Custom Vector Art Conversion & Redraws',
        vector_hero_sub: dbSettings.vector_hero_sub || 'Transform low-resolution JPEGs, PNGs, hand-drawn sketches, or pixelated logos into 100% hand-drawn, razor-sharp scalable vector graphics (.AI, .EPS, .SVG, .PDF, .CDR).',
        vector_hero_value_1: dbSettings.vector_hero_value_1 || 'Hand-Drawn Clean Paths',
        vector_hero_value_2: dbSettings.vector_hero_value_2 || '8–12 Hours Turnaround',
        vector_hero_value_3: dbSettings.vector_hero_value_3 || 'Print-Ready Separations',
        vector_hero_btn_primary: dbSettings.vector_hero_btn_primary || 'Order Vector Redraw',
        vector_hero_btn_secondary: dbSettings.vector_hero_btn_secondary || 'View Pricing Tiers'
      },
      patches: {
        patch_hero_badge: dbSettings.patch_hero_badge || 'DEDICATED CUSTOM PATCHES & EMBLEMS STUDIO',
        patch_hero_title: dbSettings.patch_hero_title || 'Custom Woven, Embroidered & 3D PVC Patches',
        patch_hero_sub: dbSettings.patch_hero_sub || 'Turn your brand logos, insignia, and artwork into high-durability physical patches. Hand-crafted precision with factory-direct pricing starting from ',
        patch_hero_price: dbSettings.patch_hero_price || '',
        patch_hero_value_1: dbSettings.patch_hero_value_1 || 'Min. Order: 50 Patches',
        patch_hero_value_2: dbSettings.patch_hero_value_2 || 'Heavy-Duty Tactical Velcro, Heat-Seal & Sew-On',
        patch_hero_value_3: dbSettings.patch_hero_value_3 || 'Free Physical Sample Photo Confirmation',
        patch_hero_btn_primary: dbSettings.patch_hero_btn_primary || 'Start Custom Patch Order',
        patch_hero_btn_secondary: dbSettings.patch_hero_btn_secondary || 'View Patch Pricing'
      }
    });
  }, [dbSettings]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (updateHomePageConfigSettings) {
      // Send only the currently active tab's settings to update
      await updateHomePageConfigSettings(formData[activeTab]);
    }
  };

  const tabs = [
    { id: 'embroidery', label: 'Embroidery', icon: Layers, prefix: 'emb' },
    { id: 'vector', label: 'Vector Art', icon: PenTool, prefix: 'vector' },
    { id: 'patches', label: 'Patches', icon: Tag, prefix: 'patch' }
  ];

  const activePrefix = tabs.find(t => t.id === activeTab).prefix;

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)' }}>Service Banners Content</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Edit the secondary banners (badges, titles, checkmarks, buttons) appearing below the hero.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn btn-primary-orange"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
        >
          <Save size={18} /> Save {tabs.find(t=>t.id === activeTab).label} Banner
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                background: isActive ? 'rgba(255, 122, 0, 0.1)' : 'transparent',
                color: isActive ? 'var(--orange-600)' : 'var(--navy-600)',
                border: 'none',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            Top Pill Badge
          </label>
          <input
            type="text"
            className="form-control"
            value={formData[activeTab][`${activePrefix}_hero_badge`]}
            onChange={(e) => handleInputChange(`${activePrefix}_hero_badge`, e.target.value)}
            style={{ color: 'var(--orange-600)', fontWeight: 700, textTransform: 'uppercase' }}
            placeholder="e.g. DEDICATED EMBROIDERY STUDIO"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            Main Section Title
          </label>
          <input
            type="text"
            className="form-control"
            value={formData[activeTab][`${activePrefix}_hero_title`]}
            onChange={(e) => handleInputChange(`${activePrefix}_hero_title`, e.target.value)}
            style={{ fontSize: '1.1rem', fontWeight: 800 }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            Description text
          </label>
          <textarea
            className="form-control"
            rows={4}
            value={formData[activeTab][`${activePrefix}_hero_sub`]}
            onChange={(e) => handleInputChange(`${activePrefix}_hero_sub`, e.target.value)}
            style={{ lineHeight: 1.6 }}
          />
        </div>

        {activeTab === 'patches' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
              Starting Price Note (Patches Only)
            </label>
            <input
              type="text"
              className="form-control"
              value={formData[activeTab].patch_hero_price}
              onChange={(e) => handleInputChange('patch_hero_price', e.target.value)}
              placeholder="e.g. $1.50 per patch"
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>
              Checkmark Value 1
            </label>
            <input
              type="text"
              className="form-control"
              value={formData[activeTab][`${activePrefix}_hero_value_1`]}
              onChange={(e) => handleInputChange(`${activePrefix}_hero_value_1`, e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>
              Checkmark Value 2
            </label>
            <input
              type="text"
              className="form-control"
              value={formData[activeTab][`${activePrefix}_hero_value_2`]}
              onChange={(e) => handleInputChange(`${activePrefix}_hero_value_2`, e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>
              Checkmark Value 3
            </label>
            <input
              type="text"
              className="form-control"
              value={formData[activeTab][`${activePrefix}_hero_value_3`]}
              onChange={(e) => handleInputChange(`${activePrefix}_hero_value_3`, e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>
              Primary Button Text (Orange)
            </label>
            <input
              type="text"
              className="form-control"
              value={formData[activeTab][`${activePrefix}_hero_btn_primary`]}
              onChange={(e) => handleInputChange(`${activePrefix}_hero_btn_primary`, e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>
              Secondary Button Text (Outline)
            </label>
            <input
              type="text"
              className="form-control"
              value={formData[activeTab][`${activePrefix}_hero_btn_secondary`]}
              onChange={(e) => handleInputChange(`${activePrefix}_hero_btn_secondary`, e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
