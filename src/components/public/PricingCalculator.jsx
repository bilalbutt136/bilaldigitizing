import React from 'react';
import { useAppState } from '../../context/StateContext';
import {
  CheckCircle,
  Tag,
  Sparkles,
  Zap,
  Trophy,
  Clock
} from 'lucide-react';

import { useLocation } from 'react-router-dom';

export const PricingCalculator = () => {
  const { pricing = {}, pricingCards = [], protectedNavigate } = useAppState();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('cat') || searchParams.get('service') || 'all';

  const [activeCategory, setActiveCategory] = React.useState(initialCategory);

  React.useEffect(() => {
    const cat = new URLSearchParams(location.search).get('cat') || new URLSearchParams(location.search).get('service');
    if (cat) {
      setActiveCategory(cat);
    }
  }, [location.search]);

  const minFee = pricing.minOrderFee !== undefined ? parseFloat(pricing.minOrderFee).toFixed(2) : '10.00';
  const patchesFee = pricing.customPatchesStartingRate !== undefined ? parseFloat(pricing.customPatchesStartingRate).toFixed(2) : '1.50';
  const vectorFee = pricing.vectorSimpleRate !== undefined ? parseFloat(pricing.vectorSimpleRate).toFixed(2) : '15.00';

  const defaultCards = [
    {
      id: 'pcard-basic',
      category: 'embroidery',
      title: 'Basic',
      subTitle: 'Simple Logo Digitizing',
      icon: Zap,
      discountTag: '40% OFF',
      strikePrice: '$5.00',
      rate: `$${minFee}`,
      unit: '/ design',
      delivery: '1 day delivery',
      btnText: 'Order 1 Design',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'For 4" by 4" Simple design',
        'All major formats',
        'Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      title: 'Standard',
      subTitle: 'Medium Level Logo Digitizing',
      icon: Trophy,
      discountTag: '40% OFF',
      strikePrice: '$15.00',
      rate: `$${(parseFloat(minFee) + 5).toFixed(2)}`,
      unit: '/ design',
      delivery: '1 days delivery',
      btnText: 'Order 1 Design',
      badge: null,
      popular: false,
      features: [
        'For up-to 4" to 8" Simple design',
        'All major formats',
        'Unlimited revisions'
      ]
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      title: 'Premium',
      subTitle: 'Detailed Logo Digitizing',
      icon: Sparkles,
      discountTag: '40% OFF',
      strikePrice: '$25.00',
      rate: `$${(parseFloat(minFee) + 15).toFixed(2)}`,
      unit: '/ design',
      delivery: '2 days delivery',
      btnText: 'Order 1 Design',
      badge: 'BEST VALUE',
      popular: false,
      features: [
        'For large size design little complex',
        'All major formats',
        'Unlimited revisions',
        'Priority support'
      ]
    }
  ];

  const allCards = (pricingCards && pricingCards.length > 0) ? pricingCards : defaultCards;
  const cardsToRender = activeCategory === 'all'
    ? allCards
    : allCards.filter(c => (c.category || '').toLowerCase() === activeCategory.toLowerCase() || (c.title || '').toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <section id="pricing" style={{ padding: '5.5rem 0', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem' }}>
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

          <h2 style={{ fontSize: '2.5rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
            Embroidery & Vector Pricing Studio
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            Turn your artwork into precise embroidery files ready for production. Every design is digitized with the right stitch settings to ensure clean results and smooth machine performance.
          </p>

          {/* Key Feature Bullets */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={17} style={{ color: '#10b981' }} /> Accurate Stitching
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={17} style={{ color: '#10b981' }} /> Smooth Embroidery Results
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={17} style={{ color: '#10b981' }} /> All Embroidery File Formats
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'all', label: 'All Pricing Tiers' },
              { id: 'embroidery', label: 'Embroidery Digitizing' },
              { id: 'vector', label: 'Vector Tracing' },
              { id: 'patches', label: 'Custom Patches' },
              { id: 'store', label: 'Apparel & Caps' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  background: activeCategory === tab.id ? '#ff7a00' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: activeCategory === tab.id ? '1px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: activeCategory === tab.id ? 800 : 600,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Pricing Category Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.75rem',
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

                  {/* 40% OFF Tag & Pricing */}
                  <div style={{ textAlign: 'left', padding: '0 0.5rem', marginBottom: '1.5rem' }}>
                    {cat.discountTag && (
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}>
                        {cat.discountTag}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {cat.strikePrice && (
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 700 }}>
                          {cat.strikePrice} {cat.unit || '/ design'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
                        {cat.rate}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
                        {cat.unit || '/ design'}
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
                      {cat.btnText || 'Order 1 Design'}
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

        {/* Closing Footer Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '2.5rem',
          padding: '0.85rem 1.5rem',
          background: 'rgba(255, 122, 0, 0.12)',
          border: '1px solid rgba(255, 122, 0, 0.3)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '800px',
          margin: '2.5rem auto 0',
          color: '#e2e8f0',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} style={{ color: '#ff9433', flexShrink: 0 }} />
          <span>Prices are per design. Mixing services? Use Add to order list and checkout once.</span>
        </div>

      </div>
    </section>
  );
};
