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
  const rawTrustFeatures = homePageConfig?.trustFeatures || [];
  
  // Try to find features matching the current service
  let trustFeatures = rawTrustFeatures.filter(f => f.service_key === currentKey && f.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  
  // Fallback to 'all' if no features exist for current service
  if (trustFeatures.length === 0) {
    trustFeatures = rawTrustFeatures.filter(f => (!f.service_key || f.service_key === 'all') && f.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
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
    <section id="why-choose-us" style={{ padding: '6rem 0', background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Trust Grid Section */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 800 }}>
            {title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            {subtext}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '6rem'
        }}>
          {trustFeatures.map((item, idx) => {
            return (
              <div 
                key={item.id || idx} 
                style={{ 
                  padding: '2rem 1.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, boxShadow 0.3s ease, borderColor 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = 'var(--orange-200)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'var(--orange-50)',
                  color: 'var(--orange-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <IconRenderer iconName={item.icon} size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {item.description || item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Workflow Section Header */}
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
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={16} /> Seamless Step-by-Step Process
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-950)', marginBottom: '0.75rem', fontWeight: 800 }}>
            {workflowTitle}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
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
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease, boxShadow 0.3s ease, borderColor 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--orange-200)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      background: 'var(--orange-500)',
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)'
                    }}>
                      STEP {item.step_number || `0${idx + 1}`}
                    </span>

                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--orange-200)',
                      color: 'var(--orange-500)',
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

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
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


