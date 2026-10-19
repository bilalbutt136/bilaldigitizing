'use client';

import React from 'react';
import { useAppState } from '../../context/StateContext';
import { normalizeCategory } from '../../utils/categoryUtils';
import {
  Upload,
  Layers,
  Cpu,
  Download,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Truck,
  PenTool,
  Palette,
  ShieldCheck,
  Award,
  MousePointer2,
  RefreshCw,
  Globe,
  Headset,
  Shield,
  ThumbsUp
} from 'lucide-react';

const ICONS = { Award, MousePointer2, RefreshCw, Globe, Headset, Shield, ThumbsUp, Upload, Layers, Cpu, Download, Sparkles, CheckCircle2, FileCheck, Truck, PenTool, Palette, ShieldCheck };

const IconRenderer = ({ iconName, size = 24, fallbackIcon = Award }) => {
  const IconComponent = ICONS[iconName] || fallbackIcon;
  return <IconComponent size={size} strokeWidth={2} />;
};

export const WhyChooseUs = () => {
  const {
    activeHomeServiceTab = 'all',
    homePageConfig = {}
  } = useAppState();

  const currentKey = normalizeCategory(activeHomeServiceTab);
  const dbSettings = homePageConfig?.settings || {};

  const title = dbSettings[`why_title_${currentKey}`] || dbSettings.why_title || 'Why Choose BDigitizing?';
  const rawSubtext = dbSettings[`why_sub_${currentKey}`] || dbSettings.why_sub || '';
  const subtext = (rawSubtext && !rawSubtext.includes('Industry-leading quality'))
    ? rawSubtext
    : 'Fast turnaround, factory-grade precision, and guaranteed clean sew-outs.';

  // Helper to ensure descriptions are crisp, short & customer-friendly
  const formatShortDesc = (desc, fallback) => {
    if (!desc) return fallback;
    if (desc.includes('Over a decade of master expertise')) return 'Over a decade of master craft trusted by 5,000+ brands.';
    if (desc.includes('No auto-tracing. Every stitch')) return 'Every stitch mapped by hand for clean, snag-free sew-outs.';
    if (desc.includes('We tweak and refine until')) return 'Free tweaks until you are 100% satisfied with your files.';
    if (desc.includes('Express shipping for patches')) return 'Instant file downloads plus express worldwide patch shipping.';
    if (desc.includes('Round-the-clock customer service')) return 'Real studio experts ready to help anytime via chat or email.';
    if (desc.includes('Enterprise-grade encryption')) return 'Encrypted checkout and safe file storage guaranteed.';
    if (desc.includes('Premium quality guaranteed on every single order')) return 'Flawless commercial sew-outs or your money back.';
    return desc;
  };

  // Trust Features Data source
  const allFeaturesStr = homePageConfig?.settings?.trust_features;
  let rawTrustFeatures = [];
  try {
    rawTrustFeatures = typeof allFeaturesStr === 'string' ? JSON.parse(allFeaturesStr) : (allFeaturesStr || []);
  } catch {
    rawTrustFeatures = [];
  }

  // Try to find features matching the current service
  let trustFeatures = rawTrustFeatures.filter(f => f.service_key === currentKey && f.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Fallback to 'all' if no features exist for current service
  if (trustFeatures.length === 0) {
    trustFeatures = rawTrustFeatures.filter(f => (!f.service_key || f.service_key === 'all') && f.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  // Curated 6 VIP Pillars fallback (perfect 3x2 matrix on desktop, 2x3 on tablet, 1x6 on mobile)
  const defaultTrustFeatures = [
    {
      icon: 'Award',
      badge: 'SINCE 2013',
      title: '11+ Years Experience',
      description: 'Over a decade of master craft trusted by 5,000+ brands.'
    },
    {
      icon: 'MousePointer2',
      badge: 'ZERO AUTO-TRACE',
      title: '100% Manual Digitizing',
      description: 'Every stitch mapped by hand for clean, snag-free sew-outs.'
    },
    {
      icon: 'RefreshCw',
      badge: 'UNLIMITED',
      title: 'Free Edits & Revisions',
      description: 'Free tweaks until you are 100% satisfied with your files.'
    },
    {
      icon: 'Globe',
      badge: 'WORLDWIDE',
      title: 'Fast Global Delivery',
      description: 'Instant file downloads plus express worldwide patch shipping.'
    },
    {
      icon: 'Headset',
      badge: '24/7 LIVE',
      title: 'Round-the-Clock Support',
      description: 'Real studio experts ready to help anytime via chat or email.'
    },
    {
      icon: 'ShieldCheck',
      badge: 'RISK-FREE',
      title: 'Satisfaction Guaranteed',
      description: 'Flawless commercial sew-outs or your money back.'
    }
  ];

  const featuresToRender = trustFeatures.length > 0
    ? trustFeatures.slice(0, 6).map((item, idx) => ({
        ...item,
        badge: item.badge || defaultTrustFeatures[idx]?.badge || 'VERIFIED',
        description: formatShortDesc(item.description || item.desc, defaultTrustFeatures[idx]?.description)
      }))
    : defaultTrustFeatures;

  return (
    <section id="why-choose-us" style={{ padding: '5.5rem 0', background: 'transparent', position: 'relative' }}>
      <style>{`
        .vip-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 0;
        }
        .vip-trust-card {
          position: relative;
          background: var(--color-surface, var(--bg-card));
          border: 1.5px solid var(--color-border, var(--border-color));
          border-radius: 20px;
          padding: 2rem 1.75rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .vip-trust-card:hover {
          transform: translateY(-5px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 16px 36px -8px rgba(37, 99, 235, 0.14), var(--shadow-md);
        }
        .vip-trust-card .card-top-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #2563eb, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .vip-trust-card:hover .card-top-shimmer {
          opacity: 1;
        }
        @media (max-width: 1024px) {
          .vip-trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        @media (max-width: 640px) {
          .vip-trust-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>

      <div className="container">

        {/* Trust Grid Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
            <Award size={15} style={{ color: '#2563eb' }} />
            <span>Industry Proven Precision</span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '0.85rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {title.includes('BDigitizing') ? (
              <>Why Choose <span style={{ color: '#2563eb' }}>BDigitizing</span>?</>
            ) : (
              title
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
            {subtext}
          </p>
        </div>

        {/* VIP Trust Grid */}
        <div className="vip-trust-grid">
          {featuresToRender.map((item, idx) => (
            <div key={item.id || idx} className="vip-trust-card">
              <div className="card-top-shimmer" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.18)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)'
                }}>
                  <IconRenderer iconName={item.icon} size={24} />
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#2563eb',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px'
                }}>
                  {item.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.45rem', letterSpacing: '-0.015em' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                {item.description || item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
