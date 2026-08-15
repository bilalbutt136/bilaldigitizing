'use client';

import React, { useState } from 'react';
import { HeroServicesEditor } from './HeroServicesEditor';
import { DynamicPricingEditor } from './DynamicPricingEditor';
import { Layers, Sparkles } from 'lucide-react';

export const StudioServicesManager = () => {
  const [activeTab, setActiveTab] = useState('dynamic_pricing');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        borderBottom: '1.5px solid var(--border-color)', 
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('dynamic_pricing')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dynamic_pricing' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeTab === 'dynamic_pricing' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={18} />
          <span>Master Service Packages Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('homepage_services')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'homepage_services' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeTab === 'homepage_services' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={18} />
          <span>Service Pages & Showcase Content</span>
        </button>
      </div>

      <div>
        {activeTab === 'dynamic_pricing' && <DynamicPricingEditor />}
        {activeTab === 'homepage_services' && <HeroServicesEditor />}
      </div>
    </div>
  );
};

export default StudioServicesManager;
