'use client';

import React from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Star,
  Tag
} from 'lucide-react';
import { PortfolioSlider } from './PortfolioSlider';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { protectedNavigate, pricing = {} } = useAppState();

  const minFee = pricing.minOrderFee !== undefined ? parseFloat(pricing.minOrderFee).toFixed(2) : '10.00';

  return (
    <section style={{
      background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 60%, #080d1a 100%)',
      color: '#ffffff',
      padding: '4.5rem 0 5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Accent Lights */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '25%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column Text Content */}
          <div style={{ textAlign: 'left' }}>
            
            {/* Trustpilot Rating Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              padding: '0.45rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} style={{ color: '#10b981', fill: '#10b981' }} />
                ))}
              </div>
              <span><strong style={{ color: '#10b981' }}>4.9</strong> - 1,040+ reviews</span>
            </div>

            {/* Main Bold Headline */}
            <h1 style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '1.25rem',
              letterSpacing: '-0.025em'
            }}>
              Embroidery Digitizing, <span style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>100% Guaranteed</span>
            </h1>

            {/* Clear Subtext */}
            <p style={{
              fontSize: '1.15rem',
              lineHeight: 1.65,
              color: '#cbd5e1',
              marginBottom: '2rem',
              maxWidth: '580px'
            }}>
              Convert your logos into clean, production-ready embroidery machine files engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks. Starting from just ${minFee}.
            </p>

            {/* 4 Key Trust Checkmarks Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.15rem',
              marginBottom: '2.5rem'
            }}>
              {[
                { title: '100% Manual Digitizing', sub: 'Master digitizers, zero auto-trace' },
                { title: 'Free Revisions Included', sub: '100% satisfaction guaranteed' },
                { title: 'Machine-Ready Formats', sub: 'DST, PES, EXP, EMB, JEF' },
                { title: 'Super Fast 4-12 Hrs Delivery', sub: '24/7 express rush processing' }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem'
                }}>
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '50%',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '1px' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Orange Upload CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.15rem', 
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <button 
                className="btn btn-primary-orange btn-lg"
                onClick={() => protectedNavigate('customer', true)}
                style={{ 
                  boxShadow: '0 8px 25px rgba(249, 115, 22, 0.45)',
                  padding: '1.05rem 2.25rem',
                  fontSize: '1.1rem',
                  fontWeight: 800
                }}
              >
                <Upload size={20} /> Upload Your Design <ArrowRight size={18} />
              </button>

              <button 
                type="button"
                onClick={() => navigate('/services/embroidery-digitizing')}
                className="btn btn-outline btn-lg"
                style={{ 
                  color: '#ffffff', 
                  borderColor: 'rgba(255,255,255,0.3)', 
                  padding: '1.05rem 1.75rem', 
                  fontSize: '1rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer'
                }}
              >
                <Tag size={19} /> View Pricing Rates
              </button>
            </div>

          </div>

          {/* Right Column Interactive Before/After Visualizer */}
          <div style={{ width: '100%' }}>
            <PortfolioSlider isHero={true} />
          </div>

        </div>
      </div>
    </section>
  );
};

