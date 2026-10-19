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

  // Workflow Data Source
  const rawWorkflowSteps = homePageConfig?.workflowSteps || [];
  let matchedSteps = rawWorkflowSteps.filter(s => s.service === currentKey && s.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  if (matchedSteps.length === 0) {
    matchedSteps = rawWorkflowSteps.filter(s => s.service === 'all' && s.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  }

  const workflowTitle = currentKey === 'vector-art' ? 'How It Works: Vector Art Conversion' :
    'How It Works: Our Process';

  const workflowSubtext = currentKey === 'vector-art' ? 'From low-resolution image to press-ready vector in 4 easy steps.' :
    'From artwork upload to production-ready files in 4 easy steps.';

  const defaultAllSteps = [
    { step_number: '01', icon: 'Upload', title: 'Upload Artwork', description: 'Drop your logo or sketch and pick your service.' },
    { step_number: '02', icon: 'Layers', title: 'Master Processing', description: 'Our studio experts manually digitize your design.' },
    { step_number: '03', icon: 'FileCheck', title: 'Free Proof Review', description: 'Check your high-res digital proof before final sew-out.' },
    { step_number: '04', icon: 'Download', title: 'Download & Stitch', description: 'Instant machine files (.DST, .PES) or tracked patch delivery.' }
  ];

  const defaultVectorSteps = [
    { step_number: '01', icon: 'Upload', title: 'Send Artwork', description: 'Upload your low-res JPG, PNG, screenshot, or sketch.' },
    { step_number: '02', icon: 'PenTool', title: 'Hand Vector Redraw', description: 'Redrawn node-by-node in Illustrator with zero auto-trace.' },
    { step_number: '03', icon: 'Palette', title: 'Color Separation', description: 'Calibrated Pantone (PMS) spot colors ready for press.' },
    { step_number: '04', icon: 'Download', title: 'Instant Download', description: 'Get editable .AI, .EPS, .SVG and print-ready PDF files.' }
  ];

  const activeDefaultSteps = currentKey === 'vector-art' ? defaultVectorSteps : defaultAllSteps;

  const stepsToRender = (matchedSteps.length > 0)
    ? matchedSteps.slice(0, 4).map((item, idx) => ({
        ...item,
        step_number: item.step_number ? (String(item.step_number).padStart(2, '0')) : `0${idx + 1}`,
        description: item.description || activeDefaultSteps[idx]?.description || ''
      }))
    : activeDefaultSteps;

  return (
    <section id="why-choose-us" style={{ padding: '5.5rem 0', background: 'transparent', position: 'relative' }}>
      <style>{`
        .vip-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 5.5rem;
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
        .vip-trust-card .card-top-shimmer,
        .vip-step-card .card-top-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #2563eb, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .vip-trust-card:hover .card-top-shimmer,
        .vip-step-card:hover .card-top-shimmer {
          opacity: 1;
        }
        .vip-step-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .vip-step-card {
          position: relative;
          background: var(--color-surface, var(--bg-card));
          border: 1.5px solid var(--color-border, var(--border-color));
          border-radius: 20px;
          padding: 2.25rem 1.75rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .vip-step-card:hover {
          transform: translateY(-5px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 16px 36px -8px rgba(37, 99, 235, 0.14), var(--shadow-md);
        }
        @media (max-width: 1024px) {
          .vip-trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
          .vip-step-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        @media (max-width: 640px) {
          .vip-trust-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .vip-step-grid {
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

        {/* Workflow Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
            <ShieldCheck size={16} style={{ color: '#2563eb' }} />
            <span>Seamless Step-by-Step Process</span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '0.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {workflowTitle.includes(':') ? (
              <>{workflowTitle.split(':')[0]}: <span style={{ color: '#2563eb' }}>{workflowTitle.split(':')[1]}</span></>
            ) : (
              workflowTitle
            )}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
            {workflowSubtext}
          </p>
        </div>

        {/* VIP Workflow Step Grid */}
        <div className="vip-step-grid">
          {stepsToRender.map((item, idx) => (
            <div key={item.id || idx} className="vip-step-card">
              <div className="card-top-shimmer" />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.32)',
                    letterSpacing: '0.05em'
                  }}>
                    STEP {item.step_number || `0${idx + 1}`}
                  </span>

                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.18)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconRenderer iconName={item.icon} fallbackIcon={CheckCircle2} size={22} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.45rem', letterSpacing: '-0.015em', lineHeight: 1.35 }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                  {item.description || item.desc}
                </p>
              </div>

              {/* VIP Step Progress Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Phase 0{idx + 1} of 04
                </span>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[1, 2, 3, 4].map(s => (
                    <span
                      key={s}
                      style={{
                        width: s === idx + 1 ? '16px' : '6px',
                        height: '5px',
                        borderRadius: '9999px',
                        background: s === idx + 1 ? '#2563eb' : 'var(--border-color)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
