'use client';

import React from 'react';
import { useAppState } from '../../context/StateContext';
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
  ShieldCheck
} from 'lucide-react';

export const WhyChooseUs = () => {
  const { 
    activeHomeServiceTab = 'embroidery', 
    serviceCmsContent = {} 
  } = useAppState();

  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
  const cmsWorkflow = serviceCmsContent[currentKey]?.workflow || serviceCmsContent[currentKey]?.advantages || {};

  const title = cmsWorkflow.title || (
    currentKey === 'vector' ? 'How It Works: Vector Art Conversion Workflow' :
    currentKey === 'patch' ? 'How It Works: Custom Patches Production Workflow' :
    'How It Works: Embroidery Digitizing Workflow'
  );

  const subtext = cmsWorkflow.subtext || (
    currentKey === 'vector' ? 'Pixel-perfect node tracing and color separation for print and vinyl cutting.' :
    currentKey === 'patch' ? 'Crafting premium physical emblems from digital proofing to doorstep delivery.' :
    'From initial logo upload to machine-ready stitch file delivery in 4 simple steps.'
  );

  const defaultSteps = currentKey === 'vector' ? [
    { step: '01', icon: Upload, title: 'Upload Low-Res Image or Sketch', desc: 'Upload your pixelated JPEG, PNG, or hand sketch with target printing specifications.' },
    { step: '02', icon: PenTool, title: 'Manual Pen-Tool Vector Tracing', desc: 'Vector artists redraw your logo node-by-node in Adobe Illustrator — zero auto-tracing distortion.' },
    { step: '03', icon: Palette, title: 'Color Separation & Scale Adjustment', desc: 'Clean Pantone spot color layer separation ready for screen printing films and vinyl plotters.' },
    { step: '04', icon: Download, title: 'Instant Vector Delivery', desc: 'Download resolution-independent master vector source files (.AI, .EPS, .SVG, .PDF).' }
  ] : currentKey === 'patch' ? [
    { step: '01', icon: Upload, title: 'Artwork Submission & Specs', desc: 'Upload your artwork and choose patch material (Embroidered, Woven, PVC, Leather), backing, and border.' },
    { step: '02', icon: FileCheck, title: 'Digital Proof & Approval', desc: 'Receive a high-resolution 1:1 digital mockup & physical sample proof for final approval before mass production.' },
    { step: '03', icon: Sparkles, title: 'Precision Stitching & Molding', desc: 'High-density embroidery, fine woven thread weaving, or 3D waterproof PVC vulcanization.' },
    { step: '04', icon: Truck, title: 'Quality Check & Express Shipping', desc: 'Every emblem undergoes strict quality inspection before express physical shipping worldwide.' }
  ] : [
    { step: '01', icon: Upload, title: 'Upload Raster / Vector Logo', desc: 'Submit your logo file and specify target fabric type (polo, cap, hoodie) and required dimensions.' },
    { step: '02', icon: Layers, title: 'Manual Pathing & Density Mapping', desc: 'Master digitizers set Wilcom underlay density, satin stitch directions, and fabric pull compensation.' },
    { step: '03', icon: Cpu, title: 'Virtual Stitch Simulation & Testing', desc: 'Every machine file undergoes pathing simulation to guarantee zero thread trims and zero needle breaks.' },
    { step: '04', icon: Download, title: 'Instant Download & Free Revisions', desc: 'Download production-ready machine files (.DST, .PES, .EMB) with 100% free unlimited revisions.' }
  ];

  const stepsToRender = cmsWorkflow.steps && cmsWorkflow.steps.length > 0
    ? cmsWorkflow.steps.map((s, idx) => ({ ...s, icon: defaultSteps[idx]?.icon || CheckCircle2 }))
    : defaultSteps;

  return (
    <section id="workflow" style={{ padding: '5.5rem 0', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Section Title */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={16} /> Seamless Step-by-Step Process
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.75rem', fontWeight: 800 }}>
            {title}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            {subtext}
          </p>
        </div>

        {/* 4-Column Step-by-Step Timeline Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          position: 'relative'
        }}>
          {stepsToRender.map((item, idx) => {
            const StepIcon = item.icon || CheckCircle2;
            return (
              <div 
                key={idx} 
                className="card"
                style={{ 
                  padding: '2.25rem 1.75rem', 
                  textAlign: 'left', 
                  background: '#f8fafc',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease, boxShadow 0.3s ease'
                }}
              >
                <div>
                  {/* Step Badge & Icon Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                    }}>
                      STEP {item.step || `0${idx + 1}`}
                    </span>

                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1.5px solid var(--orange-200)',
                      color: 'var(--orange-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}>
                      <StepIcon size={22} />
                    </div>
                  </div>

                  {/* Step Title & Description */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.65rem', lineHeight: 1.35 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
