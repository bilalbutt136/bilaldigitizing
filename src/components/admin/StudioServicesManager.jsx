'use client';

import React, { useState } from 'react';
import { ServiceManagementEditor } from './ServiceManagementEditor';
import { DynamicPricingEditor } from './DynamicPricingEditor';

export const StudioServicesManager = () => {
  const [activeTab, setActiveTab] = useState('base_rates');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('base_rates')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'base_rates' ? '3px solid var(--orange-500)' : '3px solid transparent',
            padding: '0.5rem 1rem',
            fontWeight: 800,
            color: activeTab === 'base_rates' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer'
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
            padding: '0.5rem 1rem',
            fontWeight: 800,
            color: activeTab === 'dynamic_pricing' ? 'var(--orange-500)' : 'var(--navy-600)',
            cursor: 'pointer'
          }}
        >
          Dynamic Pricing Tiers
        </button>
      </div>

      <div>
        {activeTab === 'base_rates' && <ServiceManagementEditor />}
        {activeTab === 'dynamic_pricing' && <DynamicPricingEditor />}
      </div>
    </div>
  );
};
