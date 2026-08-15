'use client';

import React, { useState } from 'react';
import { HeroServicesEditor } from './HeroServicesEditor';
import { ServiceManagementEditor } from './ServiceManagementEditor';
import { DynamicPricingEditor } from './DynamicPricingEditor';

export const StudioServicesManager = () => {
  const [activeTab, setActiveTab] = useState('homepage_services');

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
          onClick={() => setActiveTab('homepage_services')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'homepage_services' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.925rem',
            color: activeTab === 'homepage_services' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          Homepage Services & Hero Showcase
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('base_rates')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'base_rates' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.925rem',
            color: activeTab === 'base_rates' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          Base Rates & Service Cards
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dynamic_pricing')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dynamic_pricing' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.925rem',
            color: activeTab === 'dynamic_pricing' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          Dynamic Pricing Tiers
        </button>
      </div>

      <div>
        {activeTab === 'homepage_services' && <HeroServicesEditor />}
        {activeTab === 'base_rates' && <ServiceManagementEditor />}
        {activeTab === 'dynamic_pricing' && <DynamicPricingEditor />}
      </div>
    </div>
  );
};

export default StudioServicesManager;
