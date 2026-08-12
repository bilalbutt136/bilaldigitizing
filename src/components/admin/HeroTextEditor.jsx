'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Save, Sparkles, Image as ImageIcon, Layers, PenTool, Tag } from 'lucide-react';

export const HeroTextEditor = () => {
  const { heroServiceText, updateHeroServiceText, showToast } = useAppState();

  const [activeTab, setActiveTab] = useState('embroidery'); // 'embroidery' | 'vector-art' | 'patch'
  const [formData, setFormData] = useState({
    embroidery: {
      headline: '',
      subtitle: '',
      description: ''
    },
    'vector-art': {
      headline: '',
      subtitle: '',
      description: ''
    },
    patch: {
      headline: '',
      subtitle: '',
      description: ''
    },
    all: {
      headline: '',
      subtitle: '',
      description: ''
    }
  });

  // Default fallbacks used in the frontend if nothing is saved
  const DEFAULT_CONTENT = {
    embroidery: {
      headline: 'Embroidery Digitizing Logo',
      subtitle: 'Precision Commercial Embroidery',
      description: 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks. Delivering unmatched quality for promotional product distributors, apparel brands, and custom decoration shops globally.'
    },
    'vector-art': {
      headline: 'Vector Art Conversion',
      subtitle: 'Scalable Vector Art Redraw',
      description: 'Transform pixelated JPEGs, PNGs, and sketches into 100% hand-drawn scalable vector files (.AI, .EPS, .SVG, .PDF, .CDR) with Pantone color separation. Perfect for screen printing, DTG, and large format printing with zero quality loss.'
    },
    patch: {
      headline: 'Custom Patches',
      subtitle: 'Custom Physical Patches & Emblems',
      description: 'High-density embroidered, 3D molded waterproof PVC, woven, and laser-engraved leather patches with physical worldwide shipping. Premium quality backings including iron-on, velcro, and peel-and-stick.'
    },
    all: {
      headline: 'Embroidery Digitizing, Vector Art & Custom Patches',
      subtitle: 'Precision Commercial Embroidery, Scalable Vector Art, Custom Physical Patches',
      description: 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks. Delivering unmatched quality for promotional product distributors, apparel brands, and custom decoration shops globally.'
    }
  };

  const parseField = (fieldValue, defaultValue) => {
    if (!fieldValue) return { text: defaultValue, color: '', fontSize: '', textAlign: 'left' };
    if (typeof fieldValue === 'string') return { text: fieldValue, color: '', fontSize: '', textAlign: 'left' };
    return {
      text: fieldValue.text !== undefined ? fieldValue.text : defaultValue,
      color: fieldValue.color || '',
      fontSize: fieldValue.fontSize || '',
      textAlign: fieldValue.textAlign || 'left'
    };
  };

  useEffect(() => {
    if (heroServiceText) {
      setFormData(prev => ({
        embroidery: {
          headline: parseField(heroServiceText.embroidery?.headline, DEFAULT_CONTENT.embroidery.headline),
          subtitle: parseField(heroServiceText.embroidery?.subtitle, DEFAULT_CONTENT.embroidery.subtitle),
          description: parseField(heroServiceText.embroidery?.description, DEFAULT_CONTENT.embroidery.description)
        },
        'vector-art': {
          headline: parseField(heroServiceText['vector-art']?.headline, DEFAULT_CONTENT['vector-art'].headline),
          subtitle: parseField(heroServiceText['vector-art']?.subtitle, DEFAULT_CONTENT['vector-art'].subtitle),
          description: parseField(heroServiceText['vector-art']?.description, DEFAULT_CONTENT['vector-art'].description)
        },
        patch: {
          headline: parseField(heroServiceText.patch?.headline, DEFAULT_CONTENT.patch.headline),
          subtitle: parseField(heroServiceText.patch?.subtitle, DEFAULT_CONTENT.patch.subtitle),
          description: parseField(heroServiceText.patch?.description, DEFAULT_CONTENT.patch.description)
        },
        all: {
          headline: parseField(heroServiceText.all?.headline, DEFAULT_CONTENT.all.headline),
          subtitle: parseField(heroServiceText.all?.subtitle, DEFAULT_CONTENT.all.subtitle),
          description: parseField(heroServiceText.all?.description, DEFAULT_CONTENT.all.description)
        }
      }));
    }
  }, [heroServiceText]);

  const handleInputChange = (field, prop, value) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: {
          ...prev[activeTab][field],
          [prop]: value
        }
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (updateHeroServiceText) {
      updateHeroServiceText(formData);
    } else {
      showToast('Error saving hero text. Please try again.', 'error');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Services', icon: Sparkles },
    { id: 'embroidery', label: 'Embroidery', icon: Layers },
    { id: 'vector-art', label: 'Vector Art', icon: PenTool },
    { id: 'patch', label: 'Patches', icon: Tag }
  ];

  const renderStyleControls = (field) => {
    const val = formData[activeTab]?.[field] || parseField(null, '');
    return (
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--navy-600)' }}>Color</label>
          <input 
            type="color" 
            value={val.color || '#ffffff'} 
            onChange={(e) => handleInputChange(field, 'color', e.target.value)}
            style={{ width: '40px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--navy-600)' }}>Size (e.g. 3rem, 40px)</label>
          <input 
            type="text" 
            className="form-control"
            value={val.fontSize || ''} 
            onChange={(e) => handleInputChange(field, 'fontSize', e.target.value)}
            style={{ width: '120px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
            placeholder="Default"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--navy-600)' }}>Align</label>
          <select
            className="form-control"
            value={val.textAlign || 'left'}
            onChange={(e) => handleInputChange(field, 'textAlign', e.target.value)}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)' }}>Hero Section Text Content</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Edit the dynamic headlines, subtitles, and descriptions shown on the public homepage for each service.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn btn-primary-orange"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
        >
          <Save size={18} /> Save Changes
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
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            Main Headline (H1)
          </label>
          <input
            type="text"
            className="form-control"
            value={formData[activeTab]?.headline?.text || ''}
            onChange={(e) => handleInputChange('headline', 'text', e.target.value)}
            style={{ fontSize: '1.25rem', fontWeight: 800 }}
          />
          {renderStyleControls('headline')}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            Subtitle / Dynamic Text
          </label>
          <input
            type="text"
            className="form-control"
            value={formData[activeTab]?.subtitle?.text || ''}
            onChange={(e) => handleInputChange('subtitle', 'text', e.target.value)}
            style={{ color: 'var(--orange-600)', fontWeight: 600 }}
          />
          {renderStyleControls('subtitle')}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            Description Paragraph
          </label>
          <textarea
            className="form-control"
            rows={4}
            value={formData[activeTab]?.description?.text || ''}
            onChange={(e) => handleInputChange('description', 'text', e.target.value)}
            style={{ lineHeight: 1.6 }}
          />
          {renderStyleControls('description')}
        </div>

      </div>
    </div>
  );
};
