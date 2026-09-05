'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Palette, Megaphone, ShieldCheck, Building2, Settings, Mail } from 'lucide-react';
import { ThemeBrandingSettings } from './settings/ThemeBrandingSettings';
import { MetaSeoTrackingSettings } from './settings/MetaSeoTrackingSettings';
import { AdminSecuritySettings } from './settings/AdminSecuritySettings';
import { StudioGeneralSettings } from './settings/StudioGeneralSettings';
import { AdminNotificationSettings } from './settings/AdminNotificationSettings';

export const SystemSettingsManager = ({ activeSubTab = 'theme' }) => {
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'theme');

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const tabs = [
    { id: 'theme', label: 'Theme & Brand Engine', icon: Palette, badge: 'Design' },
    { id: 'meta', label: 'Meta Pixel & SEO Tracking', icon: Megaphone, badge: 'Analytics' },
    { id: 'security', label: 'Admin Team & Security', icon: ShieldCheck, badge: 'Access' },
    { id: 'notifications', label: 'Email & Alert Routing', icon: Mail, badge: 'Alerts' },
    { id: 'general', label: 'Studio Profile & Defaults', icon: Building2, badge: 'General' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Top Main Categorized Sub-Navigation Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '0.6rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              style={{
                flex: '1 1 min(100%, 220px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.15rem',
                borderRadius: '12px',
                border: isActive ? '1.5px solid var(--orange-500)' : '1px solid transparent',
                background: isActive ? 'var(--color-primary-light, rgba(249, 115, 22, 0.12))' : 'transparent',
                color: isActive ? 'var(--color-primary, #ea580c)' : 'var(--color-text-primary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <IconComp size={18} style={{ color: isActive ? 'var(--color-primary, #ea580c)' : 'var(--color-text-muted)' }} />
                <span>{tab.label}</span>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                background: isActive ? 'var(--orange-500)' : 'var(--color-subtle)',
                color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                textTransform: 'uppercase'
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render Active Modular Settings Sub-Component */}
      {currentTab === 'theme' && <ThemeBrandingSettings />}
      {currentTab === 'meta' && <MetaSeoTrackingSettings />}
      {currentTab === 'security' && <AdminSecuritySettings />}
      {(currentTab === 'notifications' || currentTab === 'email') && <AdminNotificationSettings />}
      {currentTab === 'general' && <StudioGeneralSettings />}

    </div>
  );
};

export default SystemSettingsManager;
