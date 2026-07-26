import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Trophy, 
  Tag, 
  Clock, 
  ArrowRight, 
  UploadCloud, 
  ShieldCheck, 
  FileCode, 
  CheckCircle2, 
  HelpCircle,
  Scissors,
  Flame,
  Award
} from 'lucide-react';
import { MACHINE_FORMATS } from '../../data/mockData';

export const EmbroideryDigitizingPage = () => {
  const navigate = useNavigate();
  const { pricing = {}, pricingCards = [], protectedNavigate, setIsOrderWizardOpen } = useAppState();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const minFee = pricing.minOrderFee !== undefined ? parseFloat(pricing.minOrderFee).toFixed(2) : '5.00';

  const defaultCards = [
    {
      id: 'pcard-basic',
      category: 'embroidery',
      title: 'Basic Digitizing',
      subTitle: 'Ideal for simple left chest / small logos',
      icon: Zap,
      discountTag: 'ESSENTIAL',
      strikePrice: '$10.00',
      rate: `$5.00`,
      unit: '/ design',
      delivery: '8 - 12 Hours Express Delivery',
      btnText: 'Order 1 Design',
      badge: 'ESSENTIAL',
      popular: false,
      features: [
        'Standard turnaround (8-12 Hours)',
        '.DST / .PES machine files',
        'Essential stitch paths & underlay',
        'Free native .EMB source file',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      title: 'Standard Digitizing',
      subTitle: 'Ideal for standard left chest & caps',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      strikePrice: '$18.00',
      rate: `$10.00`,
      unit: '/ design',
      delivery: '8 - 12 Hours Express Available',
      btnText: 'Order 1 Design',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        '8-Hour Express Available',
        'Free native .EMB source files',
        '3D Puff Cap density pathing',
        'All major machine formats',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      title: 'Premium Digitizing',
      subTitle: 'Ideal for Jacket Backs & Large Crests',
      icon: Sparkles,
      discountTag: 'VIP & COMPLEX',
      strikePrice: '$35.00',
      rate: `$20.00`,
      unit: '/ design',
      delivery: '12 - 24 Hours Priority Delivery',
      btnText: 'Order 1 Design',
      badge: 'VIP & COMPLEX',
      popular: false,
      features: [
        'Jacket back high stitch count verification',
        '3D Puff Cap density pathing',
        '24/7 Priority studio support',
        'Free machine simulation sew-out proof',
        '100% Free Unlimited Revisions'
      ]
    }
  ];

  const cardsToRender = (pricingCards && pricingCards.length > 0) ? pricingCards : defaultCards;

  const handleStartOrder = () => {
    const el = document.getElementById('digitizing-order-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsOrderWizardOpen(true);
    }
  };

  return (
    <div style={{ background: 'var(--navy-950)', color: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Hero Banner */}
      <section style={{ padding: '5rem 0 4rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 122, 0, 0.15)',
            border: '1px solid rgba(255, 122, 0, 0.4)',
            color: 'var(--orange-400)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            marginBottom: '1rem'
          }}>
            <Layers size={16} /> Dedicated Embroidery Digitizing Studio
          </div>

          <h1 style={{ fontSize: '3rem', color: '#ffffff', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            Custom Embroidery Digitizing Services
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            Turn your logo artwork into precise embroidery files ready for commercial production. Every design is hand-digitized with exact stitch counts, underlay pathing, and zero needle breaks.
          </p>

          {/* Quick Value Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '2.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Accurate Stitching Pathing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Smooth Commercial Results
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> All Machine Formats (.DST, .PES, .EMB)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary-orange btn-lg"
              onClick={handleStartOrder}
              style={{ fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem' }}
            >
              Order Digitizing Design <ArrowRight size={20} />
            </button>

            <a 
              href="#pricing-tiers" 
              className="btn btn-outline btn-lg"
              style={{ fontWeight: 700, padding: '0.85rem 1.75rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              View Pricing Tiers
            </a>
          </div>

        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing-tiers" style={{ padding: '5rem 0', background: 'var(--navy-950)' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 122, 0, 0.15)',
              border: '1px solid rgba(255, 122, 0, 0.4)',
              color: 'var(--orange-400)',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              marginBottom: '0.75rem'
            }}>
              <Tag size={16} /> Transparent Flat Rates & Pricing Tiers
            </div>

            <h2 style={{ fontSize: '2.4rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
              Embroidery Digitizing Pricing Tiers
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Simple transparent rates per design. No hidden setup fees, zero per-stitch upcharges, and 100% free revisions.
            </p>
          </div>

          {/* Pricing Tiers Grid Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {cardsToRender.map((cat, idx) => {
              const isPopular = cat.popular || cat.badge === 'MOST POPULAR';
              const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);

              return (
                <div
                  key={cat.id || idx}
                  style={{
                    background: isPopular ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' : '#0f172a',
                    border: isPopular ? '2.5px solid var(--orange-500)' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '2.5rem 1.85rem 2rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isPopular ? '0 12px 35px rgba(255, 122, 0, 0.2)' : 'none'
                  }}
                >
                  {isPopular && (
                    <div style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--orange-500)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.08em',
                      padding: '0.3rem 0.95rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(255, 122, 0, 0.4)'
                    }}>
                      ⭐ Most Popular
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ background: 'rgba(255, 122, 0, 0.15)', color: 'var(--orange-400)', padding: '0.75rem', borderRadius: '12px', display: 'inline-flex' }}>
                        <IconComp size={26} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-400)', background: 'rgba(255, 122, 0, 0.1)', padding: '0.3rem 0.7rem', borderRadius: '9999px', border: '1px solid rgba(255, 122, 0, 0.3)' }}>
                        {cat.discountTag || 'ESSENTIAL'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                      {cat.title}
                    </h3>

                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem', minHeight: '38px', lineHeight: 1.45 }}>
                      {cat.subTitle}
                    </p>

                    {/* Price Header */}
                    <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--orange-400)' }}>
                          {cat.rate}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          {cat.strikePrice}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          {cat.unit}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} style={{ color: 'var(--orange-400)' }} /> {cat.delivery}
                      </div>
                    </div>

                    {/* Features List */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                      {(cat.features || []).map((feat, fIdx) => (
                        <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', lineHeight: 1.4 }}>
                          <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <button
                      className={isPopular ? "btn btn-primary-orange" : "btn btn-outline"}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 800,
                        padding: '0.85rem',
                        color: isPopular ? '#ffffff' : '#ffffff',
                        borderColor: isPopular ? 'transparent' : 'rgba(255,255,255,0.25)'
                      }}
                      onClick={handleStartOrder}
                    >
                      {cat.btnText || 'Order 1 Design'} <ArrowRight size={17} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            📌 <em>Prices are flat rates per design with zero hidden charges. Mixing services? Add to order list and checkout once.</em>
          </div>

        </div>
      </section>

      {/* Machine File Formats Grid */}
      <section style={{ padding: '4.5rem 0', background: '#0f172a', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '2.2rem', color: '#ffffff', fontWeight: 800, marginBottom: '0.75rem' }}>
              Supported Commercial Machine Formats
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              We provide stitch files engineered specifically for your commercial or single-head embroidery machine brand.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {MACHINE_FORMATS.map((fmt, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                <div style={{ background: 'rgba(255,122,0,0.15)', color: 'var(--orange-400)', padding: '0.6rem', borderRadius: '8px' }}>
                  <FileCode size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>{fmt.ext}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{fmt.brand}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Interactive Order Builder Mount */}
      <section id="digitizing-order-section" style={{ padding: '5rem 0', background: 'var(--navy-950)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 122, 0, 0.15)', color: 'var(--orange-400)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              <UploadCloud size={16} /> Instant Online Order Submission
            </div>
            <h2 style={{ fontSize: '2.25rem', color: '#ffffff', fontWeight: 800, marginBottom: '0.5rem' }}>
              Submit Your Embroidery Digitizing Order
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              Upload your logo artwork below to receive an instant live quote and submit your order directly to our studio engineers.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
