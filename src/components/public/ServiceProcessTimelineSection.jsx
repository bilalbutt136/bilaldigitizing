'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  FileCheck, 
  Clock, 
  Sparkles, 
  Layers, 
  PenTool, 
  Truck, 
  Zap, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { getCmsContent } from '../../services/supabaseService';

// Built-in high quality defaults for all services
const DEFAULT_SERVICE_DATA = {
  embroidery: {
    processTitle: '4-Step Embroidery Digitizing Process',
    timelineTitle: 'Delivery & Turnaround Timeline',
    processIcon: Layers,
    bottomNote: 'Instant digital delivery with DST, PES, EMB, EXP, and PDF color sheets.',
    calloutText: 'Ready to digitize your logo? Choose your tier package or open your custom order form instantly.',
    calloutBtnText: 'Order Embroidery Digitizing',
    targetOrderType: 'embroidery',
    steps: [
      {
        step: '01',
        title: 'Submit Artwork & Target Fabric Specs',
        desc: 'Upload your logo, rough sketch, or vector file. Select desired placement (Cap, Left Chest, Jacket Back) and specify garment fabric for calibrated push/pull compensation.'
      },
      {
        step: '02',
        title: 'Master Hand Digitizing & Node Pathing',
        desc: 'Our senior digitizers hand-plot each stitch segment (Satin, Tatami, Run) in Wilcom, calculating exact underlay density, trims, and angle paths with zero auto-trace shortcuts.'
      },
      {
        step: '03',
        title: 'Virtual Stitch Simulation & QA Inspection',
        desc: 'Designs undergo 100% digital stitch simulator inspection to verify proper color stop sequences, jump stitch minimization, and thread tension optimization to ensure zero needle breaks.'
      },
      {
        step: '04',
        title: 'Instant Machine File & PDF Production Sheet',
        desc: 'Download commercial-ready machine files (.DST, .PES, .EMB, .EXP) paired with a complete color sequence worksheet, backed by 100% free unlimited stitch revisions.'
      }
    ],
    timeline: [
      {
        label: 'Small Logo & Left Chest (Up to 4" x 4")',
        time: '4–12 Hours',
        note: 'Fast turnaround with complete machine file pack'
      },
      {
        label: 'Mid-Size Jacket & Sleeve (Up to 7" x 7")',
        time: '6–12 Hours',
        note: 'Multi-color layering & pull compensation sheet'
      },
      {
        label: 'Full Jacket Back & 3D Puff Foam (12" x 12")',
        time: '8–12 Hours',
        note: 'High-density puff foam & specialty garment pathing'
      },
      {
        label: 'Rush Priority Production Queue',
        time: '2–4 Hours Express',
        note: 'Immediate direct digitizer lane for tight deadlines'
      },
      {
        label: 'Free Unlimited Stitch Revisions',
        time: 'Instant / 2–4 Hours',
        note: 'Complimentary minor tweaks & size calibrations'
      }
    ]
  },
  vector: {
    processTitle: '4-Step Vector Conversion & Redraw Process',
    timelineTitle: 'Delivery & Turnaround Timeline',
    processIcon: PenTool,
    bottomNote: '100% manual redraws in Adobe Illustrator with clean anchor points & layers.',
    calloutText: 'Have a low-res image or sketch? Convert it to clean, infinitely scalable vector artwork today.',
    calloutBtnText: 'Order Vector Conversion',
    targetOrderType: 'vector',
    steps: [
      {
        step: '01',
        title: 'Upload Low-Res Logo, Photo or Sketch',
        desc: 'Upload your pixelated JPEG, PNG, mobile photo, rough paper sketch, or legacy bitmap in any resolution or color profile.'
      },
      {
        step: '02',
        title: 'Manual Pen-Tool Redraw & Precision Bezier Curves',
        desc: 'Expert vector artists meticulously redraw every curve, node, contour, and glyph by hand in Adobe Illustrator with ultra-clean geometry.'
      },
      {
        step: '03',
        title: 'Pantone Color Matching & Spot Layer Separation',
        desc: 'Artwork is calibrated to exact Pantone (PMS) spot colors or CMYK/RGB with cleanly organized, named layers ready for screen printing, vinyl cutting, and engraving.'
      },
      {
        step: '04',
        title: 'Master Scalable Files Delivery & Unlimited Edits',
        desc: 'Download high-res, infinitely scalable vector master assets (.AI, .EPS, .SVG, .PDF) plus 300 DPI transparent PNG with full copyright and free unlimited revisions.'
      }
    ],
    timeline: [
      {
        label: 'Simple Clean Logo Redraw (1–3 Colors)',
        time: '4–8 Hours',
        note: 'Crisp vectorization & clean anchor point optimization'
      },
      {
        label: 'Standard Multi-Color Graphic (Up to 8 Colors)',
        time: '6–12 Hours',
        note: 'Pantone color matching & separated layers'
      },
      {
        label: 'Complex Illustration, Crest & Mascot Redraw',
        time: '8–18 Hours',
        note: 'Detailed shading, custom typography & gradients'
      },
      {
        label: 'Rush Priority Vector Lane',
        time: '2–4 Hours Express',
        note: 'Dedicated senior illustrator assigned immediately'
      },
      {
        label: 'Free Lifetime Color & Layer Tweaks',
        time: 'Instant / 2–4 Hours',
        note: 'Zero charge for minor color variants or format re-saves'
      }
    ]
  },
  patches: {
    processTitle: '4-Step Patch Production Process',
    timelineTitle: 'Delivery & Production Timeline',
    processIcon: FileCheck,
    bottomNote: 'Express worldwide air shipping available for all physical patch orders.',
    calloutText: 'Ready to create your custom patches? Click Order Custom Patches to configure quantities and backing options.',
    calloutBtnText: 'Order Custom Patches',
    targetOrderType: 'patches',
    steps: [
      {
        step: '01',
        title: 'Submit Artwork & Custom Specs',
        desc: 'Upload your vector logo or sketch. Select patch style (embroidered, woven, or 3D PVC), backing type, border style, and dimensions.'
      },
      {
        step: '02',
        title: 'Free Digital Proof & Sample Approval',
        desc: 'Our master digitizers engineer a precision stitch-path mock-up and digital proof for your approval with unlimited free revisions.'
      },
      {
        step: '03',
        title: 'Precision Machine Production & Hand QA',
        desc: 'Manufactured with high-density Madeira threads and laser-cut edges on commercial Japanese looms, followed by 100% manual inspection.'
      },
      {
        step: '04',
        title: 'Secure Packaging & Express Doorstep Air Delivery',
        desc: 'Carefully packaged with optional retail backer cards and dispatched via express air courier (DHL/FedEx) with door-to-door tracking.'
      }
    ],
    timeline: [
      {
        label: 'Digital Production Proof',
        time: '12–24 Hours',
        note: 'Free unlimited revisions until approved'
      },
      {
        label: 'Sample Run (10–50 Pcs)',
        time: '3–5 Business Days',
        note: 'Fast prototype & club batches'
      },
      {
        label: 'Production Run (100–500 Pcs)',
        time: '5–7 Business Days',
        note: 'Uniform & commercial batch orders'
      },
      {
        label: 'Wholesale Bulk (500+ Pcs)',
        time: '7–10 Business Days',
        note: 'Priority dedicated factory line'
      },
      {
        label: 'Express Doorstep Air Shipping',
        time: '3–5 Days Worldwide',
        note: 'DHL / FedEx with live tracking'
      }
    ]
  }
};

export const ServiceProcessTimelineSection = ({
  serviceType = 'embroidery', // 'embroidery' | 'vector' | 'patches'
  overrideTitle,
  overrideTimelineTitle,
  showCallout = true,
  calloutText,
  calloutBtnText,
  onCtaClick
}) => {
  const { openOrderWizard, setIsOrderWizardOpen } = useAppState();

  const normalizedService = (serviceType || 'embroidery').toLowerCase().includes('vec') 
    ? 'vector' 
    : ((serviceType || '').toLowerCase().includes('patch') ? 'patches' : 'embroidery');

  const defaultData = DEFAULT_SERVICE_DATA[normalizedService] || DEFAULT_SERVICE_DATA.embroidery;

  const [steps, setSteps] = useState(defaultData.steps);
  const [timeline, setTimeline] = useState(defaultData.timeline);
  const [customTitles, setCustomTitles] = useState({
    processTitle: defaultData.processTitle,
    timelineTitle: defaultData.timelineTitle
  });

  // Load from Supabase CMS backend
  useEffect(() => {
    let isMounted = true;
    const cmsPrefix = normalizedService === 'patches' ? 'patch' : normalizedService;

    // Load Steps
    getCmsContent(`${cmsPrefix}_process_steps`).then((data) => {
      if (isMounted && data && Array.isArray(data) && data.length > 0) {
        setSteps(data.map((item, idx) => ({
          step: item.step || String(idx + 1).padStart(2, '0'),
          title: item.title || '',
          desc: item.desc || item.description || ''
        })));
      }
    }).catch(() => {});

    // Load Timeline
    getCmsContent(`${cmsPrefix}_timeline`).then((data) => {
      if (isMounted && data) {
        if (Array.isArray(data) && data.length > 0) {
          setTimeline(data.map((item) => ({
            label: item.label || '',
            time: item.time || item.value || '',
            note: item.note || ''
          })));
        } else if (typeof data === 'object') {
          // Object format fallback
          const mapped = Object.entries(data).map(([key, val]) => ({
            label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            time: typeof val === 'string' ? val : (val.time || ''),
            note: val.note || ''
          }));
          if (mapped.length > 0) setTimeline(mapped);
        }
      }
    }).catch(() => {});

    // Load Metadata Titles if custom saved
    getCmsContent(`${cmsPrefix}_section_meta`).then((meta) => {
      if (isMounted && meta) {
        setCustomTitles(prev => ({
          processTitle: meta.processTitle || prev.processTitle,
          timelineTitle: meta.timelineTitle || prev.timelineTitle
        }));
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [normalizedService]);

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    if (openOrderWizard) {
      openOrderWizard(defaultData.targetOrderType);
    } else if (setIsOrderWizardOpen) {
      setIsOrderWizardOpen(true);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/order?service=${defaultData.targetOrderType}`;
    }
  };

  const IconComponent = defaultData.processIcon || FileCheck;
  const displayProcessTitle = overrideTitle || customTitles.processTitle || defaultData.processTitle;
  const displayTimelineTitle = overrideTimelineTitle || customTitles.timelineTitle || defaultData.timelineTitle;

  return (
    <section 
      className="service-process-timeline-section"
      style={{
        padding: '4.5rem 0 3.5rem',
        background: 'transparent',
        color: 'var(--color-text-primary)'
      }}
    >
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Main 2-Column Responsive Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>

          {/* LEFT COLUMN: 4-Step Production Process */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            padding: 'clamp(1.5rem, 3vw, 2.25rem)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 122, 0, 0.12)',
                  border: '1px solid rgba(255, 122, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--orange-500)',
                  flexShrink: 0
                }}>
                  <IconComponent size={20} />
                </div>
                <h3 style={{
                  fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.25
                }}>
                  {displayProcessTitle}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {steps.map((p, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', gap: '1.15rem', alignItems: 'flex-start' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                      marginTop: '2px'
                    }}>
                      {p.step || String(pIdx + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 0.3rem',
                        lineHeight: 1.3
                      }}>
                        {p.title}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)',
                        margin: 0,
                        lineHeight: 1.6
                      }}>
                        {p.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Assurance Assurance */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.825rem',
              color: 'var(--color-text-muted)'
            }}>
              <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>100% Quality Guaranteed · Master human digitizers & senior vector illustrators only.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Delivery & Turnaround Timeline */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            padding: 'clamp(1.5rem, 3vw, 2.25rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 122, 0, 0.12)',
                  border: '1px solid rgba(255, 122, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--orange-500)',
                  flexShrink: 0
                }}>
                  <Clock size={20} />
                </div>
                <h3 style={{
                  fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.25
                }}>
                  {displayTimelineTitle}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {timeline.map((spec, sIdx) => (
                  <div 
                    key={sIdx} 
                    style={{
                      background: 'var(--color-subtle, #f8fafc)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', flex: 1, minWidth: '180px' }}>
                      {spec.label}:
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: 'var(--orange-600, #ea580c)',
                        background: 'rgba(255, 122, 0, 0.08)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        display: 'inline-block',
                        border: '1px solid rgba(255, 122, 0, 0.2)'
                      }}>
                        {spec.time}
                      </span>
                      {spec.note && (
                        <span style={{ display: 'block', fontSize: '0.73rem', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>
                          {spec.note}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reassurance Footer */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.825rem',
              color: 'var(--color-text-muted)'
            }}>
              <Zap size={18} style={{ color: 'var(--orange-500)', flexShrink: 0 }} />
              <span>{defaultData.bottomNote}</span>
            </div>
          </div>

        </div>

        {/* BOTTOM CALLOUT BANNER */}
        {showCallout && (
          <div style={{
            marginTop: '3.5rem',
            padding: '1.5rem 2rem',
            background: 'var(--color-primary-light, rgba(255, 122, 0, 0.08))',
            border: '1.5px solid rgba(255, 122, 0, 0.28)',
            borderRadius: '18px',
            color: 'var(--navy-950, #0f172a)',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 4px 20px rgba(255, 122, 0, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--orange-500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(249, 115, 22, 0.35)'
              }}>
                <Sparkles size={20} />
              </div>
              <span style={{ lineHeight: 1.5, fontSize: '0.95rem', color: 'var(--navy-950, #0f172a)' }}>
                {calloutText || defaultData.calloutText}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCtaClick}
              className="btn btn-primary-orange"
              style={{
                fontWeight: 800,
                padding: '0.75rem 1.65rem',
                fontSize: '0.95rem',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                flexShrink: 0,
                boxShadow: '0 6px 18px rgba(249, 115, 22, 0.35)',
                cursor: 'pointer'
              }}
            >
              <span>{calloutBtnText || defaultData.calloutBtnText}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

export default ServiceProcessTimelineSection;
