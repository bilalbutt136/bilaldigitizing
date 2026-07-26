import React from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Clock,
  Truck,
  FileCheck,
  Zap,
  Trophy
} from 'lucide-react';

export const CustomPatchesSection = () => {
  const { patchCards = [], protectedNavigate } = useAppState();

  const defaultPatchCards = [
    {
      id: 'patch-woven',
      title: 'Woven Patches',
      subTitle: 'Ideal for simple logos and bulk orders',
      icon: Zap,
      rate: '$1.50',
      unit: '/ patch',
      delivery: '7–10 days turnaround',
      btnText: 'Order Woven',
      badge: 'ESSENTIAL',
      popular: false,
      features: [
        'Min. Qty: 50 Patches',
        '7–10 Business Days Turnaround',
        'Iron-on or heat-press backing',
        'Flat stitched edge detail'
      ]
    },
    {
      id: 'patch-embroidered',
      title: 'Embroidered Patches',
      subTitle: '3D raised thread texture & merrowed border',
      icon: Trophy,
      rate: '$2.50',
      unit: '/ patch',
      delivery: '7–10 days turnaround',
      btnText: 'Order Embroidered',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Min. Qty: 50 Patches',
        '7–10 Business Days Turnaround',
        'Velcro, sew-on or heat-seal backing',
        'Classic merrowed border edges'
      ]
    },
    {
      id: 'patch-pvc',
      title: '3D PVC & Leather Patches',
      subTitle: 'Waterproof 3D molded PVC or genuine leather',
      icon: Sparkles,
      rate: '$3.50',
      unit: '/ patch',
      delivery: '7–10 days turnaround',
      btnText: 'Order PVC & Leather',
      badge: 'LUXURY & PVC',
      popular: false,
      features: [
        'Min. Qty: 50 Patches',
        '7–10 Business Days Turnaround',
        'Tactical velcro or adhesive mounting',
        'High-durability waterproof 3D PVC'
      ]
    }
  ];

  const cardsToRender = (patchCards && patchCards.length > 0) ? patchCards : defaultPatchCards;

  const processSteps = [
    {
      step: '01',
      title: 'Submit Artwork & Backing Specs',
      desc: 'Send us your artwork, size, quantity, and preferred backing (Iron-On, Sew-On, or Velcro).'
    },
    {
      step: '02',
      title: 'Digital Proof Review',
      desc: 'We create and send a digital patch proof for your approval.'
    },
    {
      step: '03',
      title: 'Physical Sample Confirmation',
      desc: 'After approval, we produce a sample patch and share it with you for final confirmation.'
    },
    {
      step: '04',
      title: 'Production & Direct Shipping',
      desc: 'Once approved, we complete production and ship your order directly to your doorstep.'
    }
  ];

  const timelineSpecs = [
    { label: 'Digital proof', time: '1–3 business days' },
    { label: 'Production', time: '5–10 business days', note: '(depending on quantity and design complexity)' },
    { label: 'Shipping', time: '3–5 business days' }
  ];

  return (
    <section id="custom-patches" style={{ padding: '5.5rem 0', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">
        
        {/* 1. Main Heading & Subtitle Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            color: 'var(--orange-400)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '0.85rem'
          }}>
            <Sparkles size={16} /> CUSTOM PATCHES & EMBLEM MANUFACTURING
          </div>

          <h2 style={{ fontSize: '2.6rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Custom Patches
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.65, margin: '0 0 1.75rem' }}>
            We create high-quality custom embroidered patches for clubs, businesses, teams, and brands. Whether you need a single patch or a large bulk order, we handle projects of any size with precision and care.
          </p>

          {/* Feature Badges / Highlights */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.875rem',
            fontWeight: 700
          }}>
            <span style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', padding: '0.4rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ✨ 3D Puff Capabilities
            </span>
            <span style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', padding: '0.4rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚡ Velcro or Iron-on Ready
            </span>
            <span style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', padding: '0.4rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🎨 Vector Mockups Included
            </span>
          </div>
        </div>

        {/* 3 Custom Patches Pricing Tiers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.75rem',
          maxWidth: '1200px',
          margin: '0 auto 4rem'
        }}>
          {cardsToRender.map((cat, idx) => {
            const isPopular = cat.popular;
            const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);

            return (
              <div
                key={cat.id || idx}
                style={{
                  background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                  border: '2px solid #ff7a00',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.75rem 2rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 14px 35px rgba(255, 122, 0, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Top Badge Pill */}
                {cat.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isPopular ? 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)' : 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.3rem 1.1rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.06em',
                    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)',
                    whiteSpace: 'nowrap'
                  }}>
                    {cat.badge}
                  </div>
                )}

                <div>
                  {/* Card Title & Icon Header */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <IconComp size={20} style={{ color: '#ff9433' }} />
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {cat.title}
                      </h3>
                    </div>
                    {cat.subTitle && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, fontStyle: 'italic', color: '#cbd5e1' }}>
                        {cat.subTitle}
                      </div>
                    )}
                  </div>

                  {/* Pricing Info */}
                  <div style={{ textAlign: 'left', padding: '0 0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
                        {cat.rate}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
                        {cat.unit || '/ patch'}
                      </span>
                    </div>

                    {cat.delivery && (
                      <div style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} style={{ color: '#ff7a00' }} /> {cat.delivery}
                      </div>
                    )}
                  </div>

                  {/* Action CTA Button */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <button
                      className="btn btn-block"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        padding: '0.85rem 1.5rem',
                        boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)'
                      }}
                      onClick={() => protectedNavigate('customer', true)}
                    >
                      {cat.btnText || 'Order Patches'}
                    </button>
                  </div>

                  {/* Divider line */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.25rem' }}></div>

                  {/* Feature Bullets List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(cat.features || []).map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                        <CheckCircle size={17} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* 2 & 3. Process Steps & Timeline Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto 3.5rem'
        }}>
          {/* Order Process Workflow Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} style={{ color: 'var(--orange-400)' }} /> 4-Step Order & Production Process
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {processSteps.map((p, pIdx) => (
                <div key={pIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'var(--orange-500)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {p.step}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.2rem' }}>
                      {p.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Timeline Specs Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: 'var(--orange-400)' }} /> Delivery & Turnaround Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {timelineSpecs.map((spec, sIdx) => (
                  <div key={sIdx} style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>
                      {spec.label}:
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--orange-400)' }}>
                      {spec.time}
                      {spec.note && <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{spec.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <Truck size={16} style={{ color: 'var(--orange-400)', flexShrink: 0 }} /> Express worldwide shipping available upon request.
            </div>
          </div>
        </div>

        {/* 4. Footer Note */}
        <div style={{
          textAlign: 'center',
          padding: '1rem 1.75rem',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '950px',
          margin: '0 auto',
          color: '#e2e8f0',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
          <span>From artwork to delivery, we ensure every patch meets our high-quality standards. Prices are per design. Mixing services? Use Add to order list and checkout once.</span>
        </div>

      </div>
    </section>
  );
};
