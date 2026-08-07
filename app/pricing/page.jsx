'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, PenTool, Tag, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

export default function PricingPage() {
  const router = useRouter();
  const { openOrderWizard, pricing = {} } = useAppState();

  const minFee = pricing.minOrderFee !== undefined ? parseFloat(pricing.minOrderFee).toFixed(2) : '10.00';
  const patchesFee = pricing.customPatchesStartingRate !== undefined ? parseFloat(pricing.customPatchesStartingRate).toFixed(2) : '1.50';
  const vectorFee = pricing.vectorSimpleRate !== undefined ? parseFloat(pricing.vectorSimpleRate).toFixed(2) : '15.00';

  const handleOrder = (type, title, rate, category) => {
    if (openOrderWizard) {
      openOrderWizard({
        tierKey: 'standard',
        type,
        category,
        title,
        rate
      });
    }
  };

  return (
    <main style={{ padding: '8rem 2rem 6rem', background: 'var(--navy-950)', minHeight: '100vh', color: '#fff', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255, 122, 0, 0.1)',
            color: '#ff7a00',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 122, 0, 0.2)',
          }}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Clear & Transparent Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', lineHeight: 1.1 }}>
            Choose Your <span style={{ color: '#ff7a00' }}>Service</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
            Select from our three core studio services below. Simple, flat-rate starting prices with zero hidden fees and no surprises.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {/* Card 1: Embroidery */}
          <div className="glass-panel" style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Layers size={32} style={{ color: '#ff7a00' }} />
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: '#fff' }}>Embroidery Digitizing</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>${minFee}</div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting rate per design</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                {['DST, PES, EMB machine formats', 'Free unlimited revisions', 'Standard 12-24 hr turnaround', 'Custom underlay & pull compensation'].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.4, fontWeight: 500 }}>
                    <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} /> <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleOrder('embroidery', 'Standard Digitizing', `$${minFee}`, 'embroidery')}
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.25)'
                }}
              >
                Order Digitizing <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/services/embroidery-digitizing')}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                View Full Tiers
              </button>
            </div>
          </div>

          {/* Card 2: Vector */}
          <div className="glass-panel" style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <PenTool size={32} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: '#fff' }}>Vector Art Conversion</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>${vectorFee}</div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting flat rate</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                {['AI, EPS, SVG, PDF master formats', '100% Hand-drawn node paths', 'Pantone spot color separation', 'Zero auto-trace distortion'].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.4, fontWeight: 500 }}>
                    <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} /> <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleOrder('vector', 'Vector Conversion', `$${vectorFee}`, 'vector')}
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)'
                }}
              >
                Order Vector Art <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/services/vector-tracing')}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                View Full Tiers
              </button>
            </div>
          </div>

          {/* Card 3: Patches */}
          <div className="glass-panel" style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Tag size={32} style={{ color: '#10b981' }} />
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: '#fff' }}>Custom Patches</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>${patchesFee}</div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting rate per patch</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                {['Embroidered, Woven, PVC & Leather', 'Velcro, Iron-On, or Sew-On backing', 'Free physical sample photo', 'Express physical shipping worldwide'].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.4, fontWeight: 500 }}>
                    <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} /> <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleOrder('patch', 'Custom Patches', `$${patchesFee}`, 'patch')}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                }}
              >
                Order Custom Patches <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/custom-patches')}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                View Full Tiers
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
