'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  PenTool, 
  FileCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { getCmsContent, saveCmsContent } from '../../services/supabaseService';

const DEFAULT_SERVICE_DATA = {
  embroidery: {
    name: 'Embroidery Digitizing',
    prefix: 'embroidery',
    icon: Layers,
    processTitle: '4-Step Embroidery Digitizing Process',
    timelineTitle: 'Delivery & Turnaround Timeline',
    calloutText: 'Ready to digitize your logo? Choose your tier package or open your custom order form instantly.',
    calloutBtnText: 'Order Embroidery Digitizing',
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
    name: 'Vector Art Conversion',
    prefix: 'vector',
    icon: PenTool,
    processTitle: '4-Step Vector Conversion & Redraw Process',
    timelineTitle: 'Delivery & Turnaround Timeline',
    calloutText: 'Have a low-res image or sketch? Convert it to clean, infinitely scalable vector artwork today.',
    calloutBtnText: 'Order Vector Conversion',
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
    name: 'Custom Patches & Goods',
    prefix: 'patch',
    icon: FileCheck,
    processTitle: '4-Step Patch Production Process',
    timelineTitle: 'Delivery & Production Timeline',
    calloutText: 'Ready to create your custom patches? Click Order Custom Patches to configure quantities, backing options, and artwork files instantly.',
    calloutBtnText: 'Order Custom Patches',
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

export const ProductionProcessTimelineEditor = () => {
  const { showToast } = useAppState();

  const [activeService, setActiveService] = useState('embroidery'); // 'embroidery' | 'vector' | 'patches'
  const [formData, setFormData] = useState({
    processTitle: DEFAULT_SERVICE_DATA.embroidery.processTitle,
    timelineTitle: DEFAULT_SERVICE_DATA.embroidery.timelineTitle,
    calloutText: DEFAULT_SERVICE_DATA.embroidery.calloutText,
    calloutBtnText: DEFAULT_SERVICE_DATA.embroidery.calloutBtnText,
    steps: JSON.parse(JSON.stringify(DEFAULT_SERVICE_DATA.embroidery.steps)),
    timeline: JSON.parse(JSON.stringify(DEFAULT_SERVICE_DATA.embroidery.timeline))
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const currentDefaults = DEFAULT_SERVICE_DATA[activeService] || DEFAULT_SERVICE_DATA.embroidery;
  const currentPrefix = currentDefaults.prefix;

  // Load data when activeService changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadServiceConfig = async () => {
      try {
        const [stepsData, timelineData, metaData] = await Promise.all([
          getCmsContent(`${currentPrefix}_process_steps`),
          getCmsContent(`${currentPrefix}_timeline`),
          getCmsContent(`${currentPrefix}_section_meta`)
        ]);

        if (!isMounted) return;

        let loadedSteps = currentDefaults.steps;
        if (stepsData && Array.isArray(stepsData) && stepsData.length > 0) {
          loadedSteps = stepsData.map((s, idx) => ({
            step: s.step || String(idx + 1).padStart(2, '0'),
            title: s.title || '',
            desc: s.desc || s.description || ''
          }));
        }

        let loadedTimeline = currentDefaults.timeline;
        if (timelineData) {
          if (Array.isArray(timelineData) && timelineData.length > 0) {
            loadedTimeline = timelineData.map(t => ({
              label: t.label || '',
              time: t.time || t.value || '',
              note: t.note || ''
            }));
          }
        }

        setFormData({
          processTitle: metaData?.processTitle || currentDefaults.processTitle,
          timelineTitle: metaData?.timelineTitle || currentDefaults.timelineTitle,
          calloutText: metaData?.calloutText || currentDefaults.calloutText,
          calloutBtnText: metaData?.calloutBtnText || currentDefaults.calloutBtnText,
          steps: JSON.parse(JSON.stringify(loadedSteps)),
          timeline: JSON.parse(JSON.stringify(loadedTimeline))
        });
      } catch (err) {
        console.warn('Error loading CMS data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadServiceConfig();

    return () => {
      isMounted = false;
    };
  }, [activeService, currentPrefix]);

  // Handle Step Mutations
  const handleAddStep = () => {
    const nextIdx = formData.steps.length + 1;
    const newStep = {
      step: String(nextIdx).padStart(2, '0'),
      title: 'New Workflow Step',
      desc: 'Description of the step process and quality assurance checks.'
    };
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleUpdateStep = (idx, field, value) => {
    setFormData(prev => {
      const nextSteps = [...prev.steps];
      nextSteps[idx] = { ...nextSteps[idx], [field]: value };
      return { ...prev, steps: nextSteps };
    });
  };

  const handleDeleteStep = (idx) => {
    if (formData.steps.length <= 1) {
      if (showToast) showToast('A minimum of 1 process step is required.', 'warning');
      return;
    }
    setFormData(prev => {
      const nextSteps = prev.steps.filter((_, i) => i !== idx).map((s, newIdx) => ({
        ...s,
        step: String(newIdx + 1).padStart(2, '0')
      }));
      return { ...prev, steps: nextSteps };
    });
  };

  const handleMoveStep = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= formData.steps.length) return;

    setFormData(prev => {
      const nextSteps = [...prev.steps];
      const temp = nextSteps[idx];
      nextSteps[idx] = nextSteps[targetIdx];
      nextSteps[targetIdx] = temp;

      return {
        ...prev,
        steps: nextSteps.map((s, i) => ({ ...s, step: String(i + 1).padStart(2, '0') }))
      };
    });
  };

  // Handle Timeline Mutations
  const handleAddTimeline = () => {
    const newTimeline = {
      label: 'New Milestone / Order Tier',
      time: '12–24 Hours',
      note: 'Turnaround description or specifications'
    };
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, newTimeline]
    }));
  };

  const handleUpdateTimeline = (idx, field, value) => {
    setFormData(prev => {
      const nextTimeline = [...prev.timeline];
      nextTimeline[idx] = { ...nextTimeline[idx], [field]: value };
      return { ...prev, timeline: nextTimeline };
    });
  };

  const handleDeleteTimeline = (idx) => {
    if (formData.timeline.length <= 1) {
      if (showToast) showToast('A minimum of 1 timeline item is required.', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== idx)
    }));
  };

  const handleMoveTimeline = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= formData.timeline.length) return;

    setFormData(prev => {
      const nextTimeline = [...prev.timeline];
      const temp = nextTimeline[idx];
      nextTimeline[idx] = nextTimeline[targetIdx];
      nextTimeline[targetIdx] = temp;
      return { ...prev, timeline: nextTimeline };
    });
  };

  // Save to live Supabase backend
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const stepsPayload = formData.steps.map((s, idx) => ({
        step: s.step || String(idx + 1).padStart(2, '0'),
        title: s.title.trim(),
        desc: s.desc.trim(),
        description: s.desc.trim()
      }));

      const timelinePayload = formData.timeline.map(t => ({
        label: t.label.trim(),
        time: t.time.trim(),
        value: t.time.trim(),
        note: t.note.trim()
      }));

      const metaPayload = {
        processTitle: formData.processTitle.trim(),
        timelineTitle: formData.timelineTitle.trim(),
        calloutText: formData.calloutText.trim(),
        calloutBtnText: formData.calloutBtnText.trim()
      };

      const [res1, res2, res3] = await Promise.all([
        saveCmsContent(`${currentPrefix}_process_steps`, stepsPayload),
        saveCmsContent(`${currentPrefix}_timeline`, timelinePayload),
        saveCmsContent(`${currentPrefix}_section_meta`, metaPayload)
      ]);

      if (res1.success !== false && res2.success !== false && res3.success !== false) {
        if (showToast) {
          showToast(`Successfully saved ${currentDefaults.name} process & timeline to live production!`, 'success');
        } else {
          alert(`Saved ${currentDefaults.name} process & timeline!`);
        }
      } else {
        const errorMsg = res1.error || res2.error || res3.error || 'Failed to save changes';
        if (showToast) showToast(`Error saving: ${errorMsg}`, 'error');
        else alert(`Error saving: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Save CMS exception:', err);
      if (showToast) showToast('Exception saving content: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm(`Reset ${currentDefaults.name} process steps and timeline to factory standard defaults?`)) {
      setFormData({
        processTitle: currentDefaults.processTitle,
        timelineTitle: currentDefaults.timelineTitle,
        calloutText: currentDefaults.calloutText,
        calloutBtnText: currentDefaults.calloutBtnText,
        steps: JSON.parse(JSON.stringify(currentDefaults.steps)),
        timeline: JSON.parse(JSON.stringify(currentDefaults.timeline))
      });
      if (showToast) showToast('Reset to defaults in editor. Click "Save to Live Database" to publish.', 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1.5px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dynamic Content Control
            </span>
            <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
              Live Synced
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
            Production Process Steps & Delivery Timelines
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Customize the step-by-step workflow boxes, turnaround timelines, and CTA callouts for each service page.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              background: showPreview ? 'rgba(255, 122, 0, 0.1)' : 'var(--bg-surface)',
              border: showPreview ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
              color: showPreview ? 'var(--orange-600)' : 'var(--text-main)',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showPreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Reset to standard defaults"
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="btn btn-primary-orange"
            style={{
              fontWeight: 800,
              padding: '0.65rem 1.35rem',
              fontSize: '0.9rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              cursor: isSaving ? 'wait' : 'pointer'
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving to Database...' : 'Save to Live Production'}</span>
          </button>
        </div>
      </div>

      {/* Service Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem'
      }}>
        {Object.entries(DEFAULT_SERVICE_DATA).map(([sKey, sConf]) => {
          const IconC = sConf.icon;
          const isActive = activeService === sKey;
          return (
            <button
              key={sKey}
              type="button"
              onClick={() => setActiveService(sKey)}
              style={{
                padding: '0.9rem 1.15rem',
                borderRadius: '12px',
                border: isActive ? '2px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                background: isActive ? 'linear-gradient(135deg, rgba(255, 122, 0, 0.12) 0%, rgba(255, 122, 0, 0.04) 100%)' : 'var(--bg-card, #ffffff)',
                color: isActive ? 'var(--orange-600)' : 'var(--navy-900)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isActive ? '0 4px 14px rgba(249, 115, 22, 0.15)' : 'var(--shadow-sm)',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isActive ? 'var(--orange-500)' : 'var(--bg-subtle, #f1f5f9)',
                color: isActive ? '#ffffff' : 'var(--navy-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconC size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.2 }}>
                  {sConf.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: isActive ? 'var(--orange-600)' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                  /{sKey === 'patches' ? 'custom-patches' : `services/${sKey === 'vector' ? 'vector-tracing' : 'embroidery-digitizing'}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Editing Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
        gap: '1.75rem',
        alignItems: 'start'
      }}>

        {/* LEFT PANE: Process Steps Editor */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <FileCheck size={18} style={{ color: 'var(--orange-500)' }} />
                Left Box: Process Steps
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {formData.steps.length} Steps Active
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Section Box Title:
              </label>
              <input
                type="text"
                value={formData.processTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, processTitle: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--navy-950)',
                  background: 'var(--bg-surface)'
                }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formData.steps.map((step, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--color-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--orange-500)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {step.step || String(idx + 1).padStart(2, '0')}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                      Step #{idx + 1}
                    </span>
                  </div>

                  {/* Reorder & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(idx, -1)}
                      disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 0.8, padding: '3px' }}
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(idx, 1)}
                      disabled={idx === formData.steps.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === formData.steps.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === formData.steps.length - 1 ? 0.3 : 0.8, padding: '3px' }}
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '3px', marginLeft: '0.25rem' }}
                      title="Delete Step"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Step Title (e.g. Master Hand Digitizing)"
                    value={step.title}
                    onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--navy-950)',
                      background: '#ffffff',
                      marginBottom: '0.45rem'
                    }}
                  />
                  <textarea
                    rows={2}
                    placeholder="Step description and technical process..."
                    value={step.desc}
                    onChange={(e) => handleUpdateStep(idx, 'desc', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--text-main)',
                      background: '#ffffff',
                      resize: 'vertical',
                      lineHeight: 1.45
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddStep}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1.5px dashed var(--orange-500)',
              background: 'rgba(255, 122, 0, 0.05)',
              color: 'var(--orange-600)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} />
            <span>Add New Process Step</span>
          </button>
        </div>

        {/* RIGHT PANE: Timeline Specs Editor */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={18} style={{ color: 'var(--orange-500)' }} />
                Right Box: Delivery Timelines
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {formData.timeline.length} Milestones Active
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Timeline Box Title:
              </label>
              <input
                type="text"
                value={formData.timelineTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, timelineTitle: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--navy-950)',
                  background: 'var(--bg-surface)'
                }}
              />
            </div>
          </div>

          {/* Timeline Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {formData.timeline.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--color-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                    Milestone #{idx + 1}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveTimeline(idx, -1)}
                      disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 0.8, padding: '3px' }}
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTimeline(idx, 1)}
                      disabled={idx === formData.timeline.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === formData.timeline.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === formData.timeline.length - 1 ? 0.3 : 0.8, padding: '3px' }}
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTimeline(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '3px', marginLeft: '0.25rem' }}
                      title="Delete Item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Milestone / Order Tier:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Small Logo & Left Chest"
                      value={item.label}
                      onChange={(e) => handleUpdateTimeline(idx, 'label', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--navy-950)',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Turnaround Time:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4–12 Hours"
                      value={item.time}
                      onChange={(e) => handleUpdateTimeline(idx, 'time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: 'var(--orange-600)',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Sub-Note / Description:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Multi-color layering & pull compensation sheet"
                    value={item.note}
                    onChange={(e) => handleUpdateTimeline(idx, 'note', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      color: 'var(--text-main)',
                      background: '#ffffff'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddTimeline}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1.5px dashed var(--orange-500)',
              background: 'rgba(255, 122, 0, 0.05)',
              color: 'var(--orange-600)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} />
            <span>Add New Timeline Milestone</span>
          </button>
        </div>

      </div>

      {/* BOTTOM CALLOUT BANNER CONFIG */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1.5px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Sparkles size={18} style={{ color: 'var(--orange-500)' }} />
          Bottom Callout Action Banner
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Callout Text / Pitch:
            </label>
            <input
              type="text"
              value={formData.calloutText}
              onChange={(e) => setFormData(prev => ({ ...prev, calloutText: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--navy-950)',
                background: 'var(--bg-surface)'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Action Button Label:
            </label>
            <input
              type="text"
              value={formData.calloutBtnText}
              onChange={(e) => setFormData(prev => ({ ...prev, calloutBtnText: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--orange-600)',
                background: 'var(--bg-surface)'
              }}
            />
          </div>
        </div>
      </div>

      {/* LIVE VISUAL PREVIEW BOX */}
      {showPreview && (
        <div style={{
          background: '#090d16',
          border: '1.5px solid rgba(255, 122, 0, 0.4)',
          borderRadius: '20px',
          padding: '2rem',
          color: '#ffffff',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} style={{ color: 'var(--orange-400)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                Live Website Preview ({currentDefaults.name})
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(255, 122, 0, 0.2)', color: 'var(--orange-400)', border: '1px solid var(--orange-500)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
              Live Component Emulation
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch'
          }}>
            {/* Left Preview Box */}
            <div style={{ background: '#0f172a', border: '1.5px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={18} style={{ color: 'var(--orange-400)' }} /> {formData.processTitle}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.steps.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--orange-500)', color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      {p.step || String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.2rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Preview Box */}
            <div style={{ background: '#0f172a', border: '1.5px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} style={{ color: 'var(--orange-400)' }} /> {formData.timelineTitle}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {formData.timeline.map((spec, sIdx) => (
                    <div key={sIdx} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e2e8f0' }}>{spec.label}:</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--orange-400)' }}>{spec.time}</span>
                        {spec.note && <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>{spec.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={15} style={{ color: 'var(--orange-400)' }} /> Standard studio production turnaround guarantee.
              </div>
            </div>
          </div>

          {/* Callout Preview */}
          <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'rgba(255, 122, 0, 0.12)', border: '1px solid rgba(255, 122, 0, 0.3)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
              <Sparkles size={18} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{formData.calloutText}</span>
            </div>
            <button type="button" className="btn btn-primary-orange" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '8px' }}>
              {formData.calloutBtnText}
            </button>
          </div>
        </div>
      )}

      {/* Save Bottom Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="btn btn-primary-orange"
          style={{
            fontWeight: 800,
            padding: '0.75rem 2rem',
            fontSize: '0.95rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)'
          }}
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving Changes...' : `Save ${currentDefaults.name} Changes`}</span>
        </button>
      </div>

    </div>
  );
};

export default ProductionProcessTimelineEditor;
