'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, PenTool, Tag, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

export default function PricingPage() {
  const router = useRouter();
  const { openOrderWizard, pricing = {}, serviceCmsContent = {} } = useAppState();

  const embHero = serviceCmsContent?.embroidery?.hero || {};
  const vecHero = serviceCmsContent?.vector?.hero || {};
  const patHero = serviceCmsContent?.patch?.hero || {};

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
    <main style={{ padding: '8rem 2rem 6rem', background: 'var(--navy-100)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            <Sparkles size={16} />
            Clear & Transparent Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.25rem', lineHeight: 1.1 }}>
            Choose Your <span style={{ color: '#ff7a00' }}>Service</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
            Select from our three core studio services below. Simple, flat-rate starting prices with zero hidden fees and no surprises.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'stretch'
        }}>
          {/* Card 1: Embroidery */}
          <div className="card" style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.12)', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                  <Layers size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>{embHero.title || 'Embroidery Digitizing'}</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--orange-600)', lineHeight: 1 }}>${minFee}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{embHero.badge || 'Starting rate per design'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                {(embHero.trustPoints || [
                  { title: 'DST, PES, EMB machine formats' },
                  { title: 'Free unlimited revisions' },
                  { title: 'Standard 12-24 hr turnaround' },
                  { title: 'Custom underlay & pull compensation' }
                ]).map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                      <CheckCircle size={14} />
                    </div>
                    <span style={{ fontSize: '0.95rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat.title || feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleOrder('embroidery', 'Standard Digitizing', `$${minFee}`, 'embroidery')}
                className="btn btn-primary-orange btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800, padding: '1.1rem' }}
              >
                {embHero.primaryCta || 'Order Digitizing'} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/services/embroidery-digitizing')}
                className="btn btn-outline btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '1.1rem' }}
              >
                {embHero.secondaryCta || 'View Full Tiers'}
              </button>
            </div>
          </div>

          {/* Card 2: Vector */}
          <div className="card" style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                  <PenTool size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>{vecHero.title || 'Vector Art Conversion'}</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>${vectorFee}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{vecHero.badge || 'Starting flat rate'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                {(vecHero.trustPoints || [
                  { title: 'AI, EPS, SVG, PDF master formats' },
                  { title: '100% Hand-drawn node paths' },
                  { title: 'Pantone spot color separation' },
                  { title: 'Zero auto-trace distortion' }
                ]).map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                      <CheckCircle size={14} />
                    </div>
                    <span style={{ fontSize: '0.95rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat.title || feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleOrder('vector', 'Vector Conversion', `$${vectorFee}`, 'vector')}
                className="btn btn-md"
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  width: '100%',
                  justifyContent: 'center',
                  fontWeight: 800,
                  padding: '1.1rem',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)'
                }}
              >
                {vecHero.primaryCta || 'Order Vector Art'} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/services/vector-tracing')}
                className="btn btn-outline btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '1.1rem' }}
              >
                {vecHero.secondaryCta || 'View Full Tiers'}
              </button>
            </div>
          </div>

          {/* Card 3: Patches */}
          <div className="card" style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                  <Tag size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>{patHero.title || 'Custom Patches'}</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>${patchesFee}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{patHero.badge || 'Starting rate per patch'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                {(patHero.trustPoints || [
                  { title: 'Embroidered, Woven, PVC & Leather' },
                  { title: 'Velcro, Iron-On, or Sew-On backing' },
                  { title: 'Free physical sample photo' },
                  { title: 'Express physical shipping worldwide' }
                ]).map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                      <CheckCircle size={14} />
                    </div>
                    <span style={{ fontSize: '0.95rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat.title || feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleOrder('patch', 'Custom Patches', `$${patchesFee}`, 'patch')}
                className="btn btn-md"
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  width: '100%',
                  justifyContent: 'center',
                  fontWeight: 800,
                  padding: '1.1rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                }}
              >
                {patHero.primaryCta || 'Order Custom Patches'} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/custom-patches')}
                className="btn btn-outline btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '1.1rem' }}
              >
                {patHero.secondaryCta || 'View Full Tiers'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
