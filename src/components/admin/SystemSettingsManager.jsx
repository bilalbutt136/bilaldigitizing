'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CreditCard,
  Megaphone,
  Palette,
  ShieldCheck
} from 'lucide-react';
import { ThemeBrandingSettings } from './settings/ThemeBrandingSettings';
import { MetaSeoTrackingSettings } from './settings/MetaSeoTrackingSettings';
import { AdminSecuritySettings } from './settings/AdminSecuritySettings';
import { StudioGeneralSettings } from './settings/StudioGeneralSettings';
import { AdminNotificationSettings } from './settings/AdminNotificationSettings';
import { PaymentMethodSettings } from './settings/PaymentMethodSettings';

const SETTINGS_SECTIONS = [
  {
    id: 'theme',
    adminTab: 'settings-theme',
    label: 'Brand & Appearance',
    shortLabel: 'Brand',
    icon: Palette,
    description: 'Logos, colors, themes and visual identity.'
  },
  {
    id: 'payments',
    adminTab: 'settings-payments',
    label: 'Payments',
    shortLabel: 'Payments',
    icon: CreditCard,
    description: 'Checkout methods and payment availability.'
  },
  {
    id: 'meta',
    adminTab: 'settings-meta',
    label: 'Marketing & Tracking',
    shortLabel: 'Tracking',
    icon: Megaphone,
    description: 'Meta Pixel, Google Ads, SEO and visitor analytics.'
  },
  {
    id: 'security',
    adminTab: 'settings-admin',
    label: 'Admin & Security',
    shortLabel: 'Security',
    icon: ShieldCheck,
    description: 'Administrator access, MFA and security controls.'
  },
  {
    id: 'notifications',
    adminTab: 'settings-email',
    label: 'Notifications',
    shortLabel: 'Alerts',
    icon: Bell,
    description: 'Email alerts, notification routing and sound preferences.'
  },
  {
    id: 'general',
    adminTab: 'settings-general',
    label: 'Business Profile',
    shortLabel: 'Profile',
    icon: Building2,
    description: 'Business details, contact information and operating defaults.'
  }
];

export const SystemSettingsManager = ({ activeSubTab = 'theme' }) => {
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'theme');

  useEffect(() => {
    if (activeSubTab) setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  const currentSection = useMemo(
    () => SETTINGS_SECTIONS.find((section) => section.id === currentTab) || SETTINGS_SECTIONS[0],
    [currentTab]
  );

  const switchSection = (section) => {
    setCurrentTab(section.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_switch_admin_tab', {
        detail: { tab: section.adminTab }
      }));
    }
  };

  const renderActiveSection = () => {
    if (currentTab === 'theme') return <ThemeBrandingSettings />;
    if (currentTab === 'payments') return <PaymentMethodSettings />;
    if (currentTab === 'meta') return <MetaSeoTrackingSettings />;
    if (currentTab === 'security') return <AdminSecuritySettings />;
    if (currentTab === 'notifications' || currentTab === 'email') return <AdminNotificationSettings />;
    if (currentTab === 'general') return <StudioGeneralSettings />;
    return <ThemeBrandingSettings />;
  };

  const ActiveIcon = currentSection.icon;

  return (
    <div className="vip-settings-shell">
      <style dangerouslySetInnerHTML={{ __html: `
        .vip-settings-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .vip-settings-mobile-switcher {
          display: none;
        }
        .vip-settings-context {
          display: none;
        }
        .vip-settings-content {
          width: 100%;
          min-width: 0;
        }
        .vip-settings-content > div,
        .vip-settings-content > form {
          gap: 1rem !important;
        }
        .vip-settings-content .card {
          border-radius: 14px !important;
          border: 1px solid var(--border-color, #e2e8f0);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045) !important;
          background: var(--bg-card, #ffffff);
        }
        .vip-settings-content .form-control,
        .vip-settings-content input[type="text"],
        .vip-settings-content input[type="email"],
        .vip-settings-content input[type="number"],
        .vip-settings-content input[type="url"],
        .vip-settings-content input[type="password"],
        .vip-settings-content select,
        .vip-settings-content textarea {
          border-radius: 10px !important;
          border-color: var(--border-color, #cbd5e1) !important;
          min-height: 42px;
        }
        .vip-settings-content textarea {
          min-height: 110px;
        }
        .vip-settings-content .form-control:focus,
        .vip-settings-content input:focus,
        .vip-settings-content select:focus,
        .vip-settings-content textarea:focus {
          outline: none !important;
          border-color: #60a5fa !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, .10) !important;
        }
        .vip-settings-content .btn {
          border-radius: 9px !important;
          min-height: 40px;
          font-weight: 800 !important;
        }
        .vip-settings-content .vip-advanced-diagnostic {
          display: none !important;
        }
        .vip-settings-content h3,
        .vip-settings-content h4 {
          letter-spacing: -0.02em;
        }
        .vip-settings-content label {
          line-height: 1.35;
        }
        .vip-settings-content button {
          -webkit-tap-highlight-color: transparent;
        }
        .vip-inner-tabs {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          max-width: 100%;
          overflow-x: auto;
          padding: .3rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 11px;
          background: var(--color-subtle, #f8fafc);
          scrollbar-width: none;
        }
        .vip-inner-tabs::-webkit-scrollbar {
          display: none;
        }
        .vip-inner-tabs button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .35rem;
          min-height: 36px;
          padding: .42rem .72rem;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--color-text-muted, #64748b);
          font-size: .72rem;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
          transition: all .16s ease;
        }
        .vip-inner-tabs button:hover {
          color: var(--color-text-primary, #0f172a);
          background: color-mix(in srgb, var(--bg-card, #ffffff) 70%, transparent);
        }
        .vip-inner-tabs button.active {
          background: var(--bg-card, #ffffff);
          border-color: var(--border-color, #e2e8f0);
          color: var(--color-primary, #2563eb);
          box-shadow: 0 2px 7px rgba(15, 23, 42, .06);
        }
        @media (min-width: 1025px) {
          .vip-settings-content > div > .card,
          .vip-settings-content > form > .card {
            padding: 1.35rem !important;
          }
        }
        @media (max-width: 1024px) {
          .vip-settings-context {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: .75rem;
            padding: .8rem .9rem;
            border-radius: 13px;
            border: 1px solid var(--border-color, #e2e8f0);
            background: var(--bg-card, #ffffff);
          }
          .vip-settings-context-left {
            display: flex;
            align-items: center;
            gap: .7rem;
            min-width: 0;
          }
          .vip-settings-context-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: grid;
            place-items: center;
            background: var(--color-primary-light, #eff6ff);
            color: var(--color-primary, #2563eb);
            flex: 0 0 auto;
          }
          .vip-settings-context-title {
            font-size: .88rem;
            font-weight: 900;
            color: var(--color-text-primary, #0f172a);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .vip-settings-context-copy {
            margin-top: 2px;
            font-size: .69rem;
            color: var(--color-text-muted, #64748b);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .vip-settings-mobile-switcher {
            display: flex;
            gap: .4rem;
            overflow-x: auto;
            padding: .15rem 0 .25rem;
            scrollbar-width: none;
          }
          .vip-settings-mobile-switcher::-webkit-scrollbar {
            display: none;
          }
          .vip-settings-mobile-tab {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            gap: .35rem;
            min-height: 38px;
            padding: .45rem .65rem;
            border-radius: 9px;
            border: 1px solid var(--border-color, #cbd5e1);
            background: var(--bg-card, #ffffff);
            color: var(--color-text-secondary, #475569);
            font-size: .7rem;
            font-weight: 800;
            cursor: pointer;
          }
          .vip-settings-mobile-tab.active {
            background: var(--color-primary, #2563eb);
            border-color: var(--color-primary, #2563eb);
            color: #ffffff;
          }
          .vip-settings-content > div > .card,
          .vip-settings-content > form > .card {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
        }
      ` }} />

      <div className="vip-settings-context">
        <div className="vip-settings-context-left">
          <div className="vip-settings-context-icon">
            <ActiveIcon size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="vip-settings-context-title">{currentSection.label}</div>
            <div className="vip-settings-context-copy">{currentSection.description}</div>
          </div>
        </div>
      </div>

      <div className="vip-settings-mobile-switcher" aria-label="Settings sections">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = section.id === currentTab;
          return (
            <button
              key={section.id}
              type="button"
              className={'vip-settings-mobile-tab' + (active ? ' active' : '')}
              onClick={() => switchSection(section)}
            >
              <Icon size={13} />
              {section.shortLabel}
            </button>
          );
        })}
      </div>

      <div className="vip-settings-content">
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default SystemSettingsManager;
