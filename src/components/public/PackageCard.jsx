import React from 'react';
import { CheckCircle, Zap, Trophy, Sparkles, Clock, ArrowRight } from 'lucide-react';

const getTierTheme = (idx = 0) => {
  const index = typeof idx === 'number' ? idx % 3 : 0;
  if (index === 0) {
    // Package #1: ORANGE THEME
    return {
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.12)',
      border: 'rgba(234, 88, 12, 0.35)',
      btnGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      glow: 'rgba(234, 88, 12, 0.25)'
    };
  }
  if (index === 1) {
    // Package #2: BLUE THEME
    return {
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      border: 'rgba(37, 99, 235, 0.35)',
      btnGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      glow: 'rgba(37, 99, 235, 0.25)'
    };
  }
  // Package #3: GREEN THEME
  return {
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    btnGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glow: 'rgba(5, 150, 105, 0.25)'
  };
};

export const PackageCard = ({ cat, idx = 0, onSelect, forceCategory = '' }) => {
  const isPopular = cat.popular || cat.badge === 'MOST POPULAR' || cat.badge === 'MOST POPULAR TIER' || cat.badge === 'BEST VALUE';
  const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);
  const typeString = (cat.category || forceCategory || '').toLowerCase() + ' ' + (cat.title || '').toLowerCase();
  
  const tierTheme = getTierTheme(idx);

  const rawRateStr = (cat.rate || '$10.00').replace(/\/.*$/, '').trim();
  
  // Extract numeric price value
  const priceMatch = rawRateStr.match(/\$?\d+(?:\.\d{2})?/);
  let displayRate = rawRateStr;
  let prefixText = '';

  if (priceMatch) {
    displayRate = priceMatch[0].startsWith('$') ? priceMatch[0] : `$${priceMatch[0]}`;
    prefixText = rawRateStr.replace(priceMatch[0], '').trim();
    if (prefixText.toLowerCase().includes('starting from')) prefixText = '';
  } else {
    displayRate = rawRateStr.startsWith('$') ? rawRateStr : `$${rawRateStr}`;
  }
  
  const unitText = cat.unit || (typeString.includes('patch') ? '/ piece' : '/ design');

  return (
    <div
      onClick={() => onSelect(cat)}
      style={{
        background: '#121827', // Very dark navy for card body
        border: isPopular ? `2.5px solid ${tierTheme.color}` : '1.5px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '2.25rem 1.75rem 1.75rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxShadow: isPopular ? `0 14px 35px ${tierTheme.glow}` : '0 4px 20px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer'
      }}
    >
      {/* Top Badge Pill on Border */}
      {(isPopular || cat.badge) && (
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: tierTheme.btnGradient,
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 900,
          padding: '0.3rem 1.2rem',
          borderRadius: '9999px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: `0 4px 12px ${tierTheme.glow}`,
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          ★ {cat.badge || 'MOST POPULAR'}
        </div>
      )}

      <div>
        {/* Inside Tag Badge (if any and not popular) */}
        {cat.discountTag && !isPopular && !cat.badge && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: tierTheme.color, background: tierTheme.bg, border: `1px solid ${tierTheme.border}`, padding: '0.25rem 0.65rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat.discountTag}
            </span>
          </div>
        )}

        {/* Card Title & Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ background: tierTheme.bg, color: tierTheme.color, padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
              <IconComp size={20} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading, "Inter", sans-serif)', fontWeight: 900, margin: 0, color: '#ffffff' }}>
              {cat.title}
            </h3>
          </div>
          {cat.subTitle && (
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.45, minHeight: '38px' }}>
              {cat.subTitle}
            </p>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '1rem 0' }} />

        {/* Themed Pricing Box */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.45rem' }}>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, color: tierTheme.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {displayRate}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              {unitText}
            </span>
            {cat.strikePrice && (
              <span style={{ fontSize: '1.1rem', color: '#64748b', textDecoration: 'line-through', marginLeft: '0.35rem', fontWeight: 600 }}>
                {cat.strikePrice}
              </span>
            )}
          </div>

          {cat.delivery ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: '#cbd5e1',
              marginTop: '0.75rem'
            }}>
              <Clock size={14} style={{ color: tierTheme.color }} /> {cat.delivery}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Starting rate
            </div>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '1rem 0' }} />

        {/* Feature Bullets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
          {(cat.features || []).map((feat, fIdx) => (
            <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }}>
                <CheckCircle size={16} />
              </div>
              <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Themed Action CTA Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          type="button"
          className="btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.95rem',
            padding: '0.95rem 1.25rem',
            background: tierTheme.btnGradient,
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            boxShadow: `0 4px 14px ${tierTheme.glow}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(cat);
          }}
        >
          {cat.btnText || `Order ${cat.title.split(' ')[0]} (${displayRate})`} <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>

    </div>
  );
};

export default PackageCard;
