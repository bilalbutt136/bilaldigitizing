import React from 'react';
import { CheckCircle, Zap, Trophy, Sparkles, Clock, ArrowRight } from 'lucide-react';

const getTierTheme = (tierKey, title) => {
  const str = ((tierKey || '') + ' ' + (title || '')).toLowerCase();
  if (str.includes('basic') || str.includes('simple')) {
    return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' }; // Blue
  }
  if (str.includes('premium') || str.includes('rush') || str.includes('vip') || str.includes('leather')) {
    return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' }; // Purple
  }
  // Standard / Default
  return { color: '#ff7a00', bg: 'rgba(255, 122, 0, 0.15)', border: 'rgba(255, 122, 0, 0.3)' }; // Orange
};

export const PackageCard = ({ cat, idx, onSelect, forceCategory = '' }) => {
  const isPopular = cat.popular || cat.badge === 'MOST POPULAR' || cat.badge === 'MOST POPULAR TIER';
  const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);
  const typeString = (cat.category || forceCategory || '').toLowerCase() + ' ' + (cat.title || '').toLowerCase();
  
  const tierTheme = getTierTheme(cat.tierKey, cat.title);

  const rawRateStr = (cat.rate || '$2.50').replace(/\/.*$/, '').trim();
  
  // Extract just the numeric price value (e.g. "$1.50" or "10.00" -> "$10.00")
  const priceMatch = rawRateStr.match(/\$?\d+(?:\.\d{2})?/);
  let displayRate = rawRateStr;
  let prefixText = '';

  if (priceMatch) {
    displayRate = priceMatch[0].startsWith('$') ? priceMatch[0] : `$${priceMatch[0]}`;
    // Extract any prefix text like "Starting from" but remove it if we already have "Starting rate" label
    prefixText = rawRateStr.replace(priceMatch[0], '').trim();
    if (prefixText.toLowerCase().includes('starting from')) prefixText = '';
  } else {
    displayRate = rawRateStr.startsWith('$') ? rawRateStr : `$${rawRateStr}`;
  }
  
  const unitText = cat.unit || (typeString.includes('patch') ? '/ patch' : '/ design');

  return (
    <div
      onClick={() => onSelect(cat)}
      style={{
        background: '#121827', // very dark blue for the card body
        border: isPopular ? `2px solid #ff7a00` : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '2rem 1.5rem 1.5rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxShadow: isPopular ? '0 12px 30px rgba(255, 122, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer'
      }}
    >
      {/* Top Badge Pill on Border for Popular */}
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
          color: '#ffffff',
          fontSize: '0.725rem',
          fontWeight: 800,
          padding: '0.25rem 1rem',
          borderRadius: '9999px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)',
          whiteSpace: 'nowrap'
        }}>
          ★ MOST POPULAR
        </div>
      )}

      <div>
        {/* Inside Tag Badge (if any and not popular) */}
        {cat.discountTag && !isPopular && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: tierTheme.color, background: tierTheme.bg, border: `1px solid ${tierTheme.border}`, padding: '0.25rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat.discountTag}
            </span>
          </div>
        )}

        {/* Card Title & Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <IconComp size={22} style={{ color: tierTheme.color }} />
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading, "Inter", sans-serif)', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {cat.title}
            </h3>
          </div>
          {cat.subTitle && (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {cat.subTitle}
            </p>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '1rem 0' }} />

        {/* Refined Pricing Box */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.4rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
              {displayRate}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              {unitText}
            </span>
            {cat.strikePrice && (
              <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through', marginLeft: '0.25rem' }}>
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
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#94a3b8',
              marginTop: '0.75rem'
            }}>
              <Clock size={14} style={{ color: tierTheme.color }} /> {cat.delivery}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              <div style={{ color: '#10b981', flexShrink: 0, marginTop: '1px' }}>
                <CheckCircle size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          type="button"
          className="btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '0.85rem 1.25rem',
            background: isPopular ? 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)' : 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            border: isPopular ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            boxShadow: isPopular ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
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

