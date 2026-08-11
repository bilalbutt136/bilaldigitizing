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

  const title = dbSettings.why_title || 'A whole world of professional digitizing talent at your fingertips';
  const subtext = dbSettings.why_sub || 'Industry-leading quality, unmatched speed, and a commitment to perfection.';

  // Workflow Data Source
  const rawWorkflowSteps = homePageConfig?.workflowSteps || [];
  let matchedSteps = rawWorkflowSteps.filter(s => s.service === currentKey && s.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  if (matchedSteps.length === 0) {
     matchedSteps = rawWorkflowSteps.filter(s => s.service === 'all' && s.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  }

  const workflowTitle = currentKey === 'all' ? 'How It Works: Our Process' :
    currentKey === 'vector' ? 'How It Works: Vector Art Conversion' :
    currentKey === 'patch' ? 'How It Works: Custom Patches Production' :
    'How It Works: Embroidery Digitizing';

  const workflowSubtext = currentKey === 'all' ? 'From initial request to final delivery in 4 simple steps.' :
    currentKey === 'vector' ? 'Pixel-perfect node tracing and color separation for print and vinyl cutting.' :
    currentKey === 'patch' ? 'Crafting premium physical emblems from digital proofing to doorstep delivery.' :
    'From initial logo upload to machine-ready stitch file delivery in 4 simple steps.';

  let stepsToRender = matchedSteps;

  if (stepsToRender.length === 0) {
    stepsToRender = currentKey === 'all' ? [
      { step_number: 1, icon: 'Upload', title: 'Select Service & Upload', description: 'Choose your desired service and upload your artwork with specifications.' },
      { step_number: 2, icon: 'Layers', title: 'Expert Processing', description: 'Our studio experts process your design via digitizing, vector tracing, or patch prototyping.' },
      { step_number: 3, icon: 'FileCheck', title: 'Quality Assurance', description: 'Every order undergoes strict quality checks and digital proofing before finalization.' },
      { step_number: 4, icon: 'Download', title: 'Instant Delivery / Shipping', description: 'Download digital files instantly or receive your physical patches via express shipping.' }
    ] : currentKey === 'vector' ? [
      { step_number: 1, icon: 'Upload', title: 'Upload Low-Res Image', description: 'Upload your pixelated JPEG, PNG, or hand sketch with target printing specifications.' },
      { step_number: 2, icon: 'PenTool', title: 'Manual Vector Tracing', description: 'Vector artists redraw your logo node-by-node in Illustrator — zero auto-tracing.' },
      { step_number: 3, icon: 'Palette', title: 'Color Separation', description: 'Clean Pantone spot color layer separation ready for screen printing films.' },
      { step_number: 4, icon: 'Download', title: 'Instant Vector Delivery', description: 'Download resolution-independent master vector source files (.AI, .EPS, .SVG, .PDF).' }
    ] : currentKey === 'patch' ? [
      { step_number: 1, icon: 'Upload', title: 'Artwork Submission', description: 'Upload your artwork and choose patch material (Embroidered, Woven, PVC, Leather).' },
      { step_number: 2, icon: 'FileCheck', title: 'Digital Proof & Approval', description: 'Receive a high-resolution 1:1 digital mockup & physical sample proof for final approval.' },
      { step_number: 3, icon: 'Sparkles', title: 'Precision Production', description: 'High-density embroidery, fine woven thread weaving, or 3D waterproof PVC molding.' },
      { step_number: 4, icon: 'Truck', title: 'Express Shipping', description: 'Every emblem undergoes strict quality inspection before express physical shipping.' }
    ] : [
      { step_number: 1, icon: 'Upload', title: 'Upload Artwork', description: 'Submit your logo file and specify target fabric type (polo, cap, hoodie) and dimensions.' },
      { step_number: 2, icon: 'Layers', title: 'Manual Pathing', description: 'Master digitizers set Wilcom underlay density, satin stitch directions, and pull compensation.' },
      { step_number: 3, icon: 'Cpu', title: 'Virtual Simulation', description: 'Every machine file undergoes pathing simulation to guarantee zero thread trims and breaks.' },
      { step_number: 4, icon: 'Download', title: 'Instant Download', description: 'Download production-ready machine files (.DST, .PES, .EMB) with free revisions.' }
    ];
  }

  return (
    <section id="why-choose-us" style={{ padding: '6rem 0', background: 'var(--bg-main)' }}>
      <div className="container">
        
        {/* Fiverr-Style Trust Proposition */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '4rem',
          alignItems: 'center',
          marginBottom: '8rem'
        }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', color: '#404145', marginBottom: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
              {title}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={24} color="#74767e" />
                  <h3 style={{ fontSize: '1.25rem', color: '#404145', fontWeight: 600, margin: 0 }}>The best for every budget</h3>
                </div>
                <p style={{ color: '#74767e', fontSize: '1.1rem', margin: 0, paddingLeft: '2.25rem' }}>
                  Find high-quality services at every price point. No hourly rates, just project-based pricing.
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={24} color="#74767e" />
                  <h3 style={{ fontSize: '1.25rem', color: '#404145', fontWeight: 600, margin: 0 }}>Quality work done quickly</h3>
                </div>
                <p style={{ color: '#74767e', fontSize: '1.1rem', margin: 0, paddingLeft: '2.25rem' }}>
                  Find the right digitizer to begin working on your project within minutes.
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={24} color="#74767e" />
                  <h3 style={{ fontSize: '1.25rem', color: '#404145', fontWeight: 600, margin: 0 }}>Protected payments, every time</h3>
                </div>
                <p style={{ color: '#74767e', fontSize: '1.1rem', margin: 0, paddingLeft: '2.25rem' }}>
                  Always know what you'll pay upfront. Your payment isn't released until you approve the work.
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={24} color="#74767e" />
                  <h3 style={{ fontSize: '1.25rem', color: '#404145', fontWeight: 600, margin: 0 }}>24/7 support</h3>
                </div>
                <p style={{ color: '#74767e', fontSize: '1.1rem', margin: 0, paddingLeft: '2.25rem' }}>
                  Questions? Our round-the-clock support team is available to help anytime, anywhere.
                </p>
              </div>
            </div>
          </div>

          <div style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <img src="/assets/embroidery-mock.jpg" alt="Quality Work" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Workflow Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', color: '#404145', marginBottom: '0.75rem', fontWeight: 700 }}>
            {workflowTitle}
          </h2>

          <p style={{ color: '#74767e', fontSize: '1.1rem', lineHeight: 1.6 }}>
            {workflowSubtext}
          </p>
        </div>

        {/* Workflow Timeline Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {stepsToRender.map((item, idx) => {
            return (
              <div 
                key={item.id || idx} 
                style={{ 
                  padding: '2.25rem 1.75rem', 
                  textAlign: 'left', 
                  background: '#ffffff',
                  border: '1px solid #e4e5e7',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease, boxShadow 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      background: '#1dbf73',
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '4px'
                    }}>
                      STEP {item.step_number || `0${idx + 1}`}
                    </span>

                    <div style={{
                      color: '#404145',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconRenderer iconName={item.icon} fallbackIcon={CheckCircle2} size={28} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#404145', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.95rem', color: '#74767e', lineHeight: 1.6, margin: 0 }}>
                    {item.description || item.desc}
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
