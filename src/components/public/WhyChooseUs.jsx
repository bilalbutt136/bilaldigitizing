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
  const subtext = dbSettings[`why_sub_${currentKey}`] || dbSettings.why_sub || 'Industry-leading quality, unmatched speed, and a commitment to perfection.';

  // Trust Features Data source
  const allFeaturesStr = homePageConfig?.settings?.trust_features;
  let rawTrustFeatures = [];
  try {
    rawTrustFeatures = typeof allFeaturesStr === 'string' ? JSON.parse(allFeaturesStr) : (allFeaturesStr || []);
  } catch(e) {
    rawTrustFeatures = [];
  }
  
  // Try to find features matching the current service
  let trustFeatures = rawTrustFeatures.filter(f => f.service_key === currentKey && f.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  // Fallback to 'all' if no features exist for current service
  if (trustFeatures.length === 0) {
    trustFeatures = rawTrustFeatures.filter(f => (!f.service_key || f.service_key === 'all') && f.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  
  // Hardcoded fallback if DB is empty
  if (trustFeatures.length === 0) {
    trustFeatures = [
      { icon: 'Award', title: '15+ Years Experience', description: 'Decades of expertise handling complex designs for global brands.' },
      { icon: 'MousePointer2', title: '100% Manual Digitizing', description: 'No auto-tracing. Every stitch and node is manually plotted for perfection.' },
      { icon: 'RefreshCw', title: 'Free Unlimited Revisions', description: 'We tweak and refine until you are 100% satisfied with the result.' },
      { icon: 'Globe', title: 'Worldwide Delivery', description: 'Express shipping for patches, instant downloads for digital files globally.' },
      { icon: 'Headset', title: '24/7 Support', description: 'Round-the-clock customer service ready to answer technical queries.' },
      { icon: 'Shield', title: 'Secure Payments', description: 'Enterprise-grade encryption for all your transactions and files.' },
      { icon: 'ThumbsUp', title: 'Satisfaction Guarantee', description: 'Premium quality guaranteed on every single order, large or small.' }
    ];
  }

  // Workflow Data Source
  const rawWorkflowSteps = homePageConfig?.workflowSteps || [];
  // Try to find steps matching the current service, fallback to 'all' if none exist for current service
  let matchedSteps = rawWorkflowSteps.filter(s => s.service === currentKey && s.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  if (matchedSteps.length === 0) {
     matchedSteps = rawWorkflowSteps.filter(s => s.service === 'all' && s.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  }

  const workflowTitle = currentKey === 'all' ? 'How It Works: Our Process' :
    currentKey === 'vector-art' ? 'How It Works: Vector Art Conversion' :
    currentKey === 'patches' ? 'How It Works: Custom Patches Production' :
    'How It Works: Embroidery Digitizing';

  const workflowSubtext = currentKey === 'all' ? 'From initial request to final delivery in 4 simple steps.' :
    currentKey === 'vector-art' ? 'Pixel-perfect node tracing and color separation for print and vinyl cutting.' :
    currentKey === 'patches' ? 'Crafting premium physical emblems from digital proofing to doorstep delivery.' :
    'From initial logo upload to machine-ready stitch file delivery in 4 simple steps.';


  let stepsToRender = matchedSteps;

  if (stepsToRender.length === 0) {
    stepsToRender = currentKey === 'all' ? [
      { step_number: 1, icon: 'Upload', title: 'Select Service & Upload', description: 'Choose your desired service and upload your artwork with specifications.' },
      { step_number: 2, icon: 'Layers', title: 'Expert Processing', description: 'Our studio experts process your design via digitizing, vector tracing, or patch prototyping.' },
      { step_number: 3, icon: 'FileCheck', title: 'Quality Assurance', description: 'Every order undergoes strict quality checks and digital proofing before finalization.' },
      { step_number: 4, icon: 'Download', title: 'Instant Delivery / Shipping', description: 'Download digital files instantly or receive your physical patches via express shipping.' }
    ] : currentKey === 'vector-art' ? [
      { step_number: 1, icon: 'Upload', title: 'Upload Low-Res Image', description: 'Upload your pixelated JPEG, PNG, or hand sketch with target printing specifications.' },
      { step_number: 2, icon: 'PenTool', title: 'Manual Vector Tracing', description: 'Vector artists redraw your logo node-by-node in Illustrator — zero auto-tracing.' },
      { step_number: 3, icon: 'Palette', title: 'Color Separation', description: 'Clean Pantone spot color layer separation ready for screen printing films.' },
      { step_number: 4, icon: 'Download', title: 'Instant Vector Delivery', description: 'Download resolution-independent master vector source files (.AI, .EPS, .SVG, .PDF).' }
    ] : currentKey === 'patches' ? [
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
    <section id="why-choose-us" style={{ padding: '5.5rem 0', background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Trust Grid Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
            <Award size={15} style={{ color: 'var(--orange-500)' }} />
            <span>Industry Proven Precision</span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {title.includes('BDigitizing') ? (
              <>Why Choose <span className="text-gradient-orange">BDigitizing</span>?</>
            ) : (
              title
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.65 }}>
            {subtext}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '1.5rem',
          marginBottom: '5.5rem'
        }}>
          {trustFeatures.map((item, idx) => {
            return (
              <div 
                key={item.id || idx} 
                className="card"
                style={{ 
                  padding: '2.25rem 1.75rem',
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'default',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.35rem',
                  boxShadow: '0 4px 16px var(--color-primary-glow)'
                }}>
                  <IconRenderer iconName={item.icon} size={28} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.6rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {item.description || item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Workflow Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--orange-500)' }} />
            <span>Seamless Step-by-Step Process</span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '0.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {workflowTitle.includes(':') ? (
              <>{workflowTitle.split(':')[0]}: <span className="text-gradient-orange">{workflowTitle.split(':')[1]}</span></>
            ) : (
              workflowTitle
            )}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.65 }}>
            {workflowSubtext}
          </p>
        </div>

        {/* Workflow Timeline Grid */}
        <div className="grid-responsive-4">
          {stepsToRender.map((item, idx) => {
            return (
              <div 
                key={item.id || idx} 
                className="card"
                style={{ 
                  padding: '2.25rem 1.75rem', 
                  textAlign: 'left', 
                  background: 'var(--color-surface, var(--bg-card))',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'default'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
                      color: 'var(--color-text-on-primary, #ffffff)',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      boxShadow: '0 4px 12px var(--color-primary-glow)',
                      letterSpacing: '0.04em'
                    }}>
                      STEP {item.step_number || `0${idx + 1}`}
                    </span>

                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconRenderer iconName={item.icon} fallbackIcon={CheckCircle2} size={22} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
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



