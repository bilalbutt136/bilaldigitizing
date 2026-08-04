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
  ShieldCheck,
  Award,
  MousePointer2,
  RefreshCw,
  Globe,
  Headset,
  Shield,
  ThumbsUp
} from 'lucide-react';

export const WhyChooseUs = () => {
  const { 
    activeHomeServiceTab = 'embroidery', 
    serviceCmsContent = {} 
  } = useAppState();

  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
  const cmsWorkflow = serviceCmsContent[currentKey]?.workflow || serviceCmsContent[currentKey]?.advantages || {};

  const title = cmsWorkflow.title || (
    currentKey === 'vector' ? 'How It Works: Vector Art Conversion' :
    currentKey === 'patch' ? 'How It Works: Custom Patches Production' :
    'How It Works: Embroidery Digitizing'
  );

  const subtext = cmsWorkflow.subtext || (
    currentKey === 'vector' ? 'Pixel-perfect node tracing and color separation for print and vinyl cutting.' :
    currentKey === 'patch' ? 'Crafting premium physical emblems from digital proofing to doorstep delivery.' :
    'From initial logo upload to machine-ready stitch file delivery in 4 simple steps.'
  );

  const defaultSteps = currentKey === 'vector' ? [
    { step: '01', icon: Upload, title: 'Upload Low-Res Image', desc: 'Upload your pixelated JPEG, PNG, or hand sketch with target printing specifications.' },
    { step: '02', icon: PenTool, title: 'Manual Vector Tracing', desc: 'Vector artists redraw your logo node-by-node in Illustrator — zero auto-tracing.' },
    { step: '03', icon: Palette, title: 'Color Separation', desc: 'Clean Pantone spot color layer separation ready for screen printing films.' },
    { step: '04', icon: Download, title: 'Instant Vector Delivery', desc: 'Download resolution-independent master vector source files (.AI, .EPS, .SVG, .PDF).' }
  ] : currentKey === 'patch' ? [
    { step: '01', icon: Upload, title: 'Artwork Submission', desc: 'Upload your artwork and choose patch material (Embroidered, Woven, PVC, Leather).' },
    { step: '02', icon: FileCheck, title: 'Digital Proof & Approval', desc: 'Receive a high-resolution 1:1 digital mockup & physical sample proof for final approval.' },
    { step: '03', icon: Sparkles, title: 'Precision Production', desc: 'High-density embroidery, fine woven thread weaving, or 3D waterproof PVC molding.' },
    { step: '04', icon: Truck, title: 'Express Shipping', desc: 'Every emblem undergoes strict quality inspection before express physical shipping.' }
  ] : [
    { step: '01', icon: Upload, title: 'Upload Artwork', desc: 'Submit your logo file and specify target fabric type (polo, cap, hoodie) and dimensions.' },
    { step: '02', icon: Layers, title: 'Manual Pathing', desc: 'Master digitizers set Wilcom underlay density, satin stitch directions, and pull compensation.' },
    { step: '03', icon: Cpu, title: 'Virtual Simulation', desc: 'Every machine file undergoes pathing simulation to guarantee zero thread trims and breaks.' },
    { step: '04', icon: Download, title: 'Instant Download', desc: 'Download production-ready machine files (.DST, .PES, .EMB) with free revisions.' }
  ];

  const stepsToRender = cmsWorkflow.steps && cmsWorkflow.steps.length > 0
    ? cmsWorkflow.steps.map((s, idx) => ({ ...s, icon: defaultSteps[idx]?.icon || CheckCircle2 }))
    : defaultSteps;

  const trustFeatures = [
    { icon: Award, title: '15+ Years Experience', desc: 'Decades of expertise handling complex designs for global brands.' },
    { icon: MousePointer2, title: '100% Manual Digitizing', desc: 'No auto-tracing. Every stitch and node is manually plotted for perfection.' },
    { icon: RefreshCw, title: 'Free Unlimited Revisions', desc: 'We tweak and refine until you are 100% satisfied with the result.' },
    { icon: Globe, title: 'Worldwide Delivery', desc: 'Express shipping for patches, instant downloads for digital files globally.' },
    { icon: Headset, title: '24/7 Support', desc: 'Round-the-clock customer service ready to answer technical queries.' },
    { icon: Shield, title: 'Secure Payments', desc: 'Enterprise-grade encryption for all your transactions and files.' },
    { icon: ThumbsUp, title: 'Satisfaction Guarantee', desc: 'Premium quality guaranteed on every single order, large or small.' }
  ];

  return (
    <section id="why-choose-us" style={{ padding: '6rem 0', background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Trust Grid Section */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 800 }}>
            Why Choose BDigitizing?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Industry-leading quality, unmatched speed, and a commitment to perfection.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '6rem'
        }}>
          {trustFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
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
                  <Icon size={28} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
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
            {title}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            {subtext}
          </p>
        </div>

        {/* Workflow Timeline Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {stepsToRender.map((item, idx) => {
            const StepIcon = item.icon || CheckCircle2;
            return (
              <div 
                key={idx} 
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
                      STEP {item.step || `0${idx + 1}`}
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
                      <StepIcon size={22} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
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

