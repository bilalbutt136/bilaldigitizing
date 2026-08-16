'use client';

import React from 'react';
import { CheckCircle, Zap, Trophy, Sparkles, Clock, ArrowRight, Layers, PenTool, Tag } from 'lucide-react';

const PALETTES = [
  {
    color: '#ea580c',
    bgLight: 'rgba(234, 88, 12, 0.1)',
    border: '#fed7aa',
    btnGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    glow: 'rgba(234, 88, 12, 0.22)'
  },
  {
    color: '#2563eb',
    bgLight: 'rgba(37, 99, 235, 0.1)',
    border: '#bfdbfe',
    btnGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    glow: 'rgba(37, 99, 235, 0.22)'
  },
  {
    color: '#059669',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    border: '#a7f3d0',
    btnGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glow: 'rgba(5, 150, 105, 0.22)'
  },
  {
    color: '#7c3aed',
    bgLight: 'rgba(124, 58, 237, 0.1)',
    border: '#ddd6fe',
    btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    glow: 'rgba(124, 58, 237, 0.22)'
  },
  {
    color: '#d97706',
    bgLight: 'rgba(217, 119, 6, 0.1)',
    border: '#fde68a',
    btnGradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    glow: 'rgba(217, 119, 6, 0.22)'
  }
];

const getTierTheme = (idx = 0, serviceType = '') => {
  const pal = PALETTES[idx % PALETTES.length];
  const sType = (serviceType || '').toLowerCase().replace('-', '_');
  
  let defaultIcon = Layers;
  let serviceLabel = 'EMBROIDERY DIGITIZING';

  if (sType.includes('vec')) {
    defaultIcon = PenTool;
    serviceLabel = 'VECTOR ART CONVERSION';
  } else if (sType.includes('patch')) {
    defaultIcon = Tag;
    serviceLabel = 'CUSTOM MANUFACTURED PATCHES';
  }

  return {
    packageNumber: idx + 1,
    ...pal,
    defaultIcon,
    serviceLabel
  };
};

export const PackageCard = ({ cat = {}, idx = 0, onSelect, forceCategory = '' }) => {
  const isPopular = Boolean(cat.is_popular || cat.popular || cat.badge_text === 'MOST POPULAR' || cat.badge === 'MOST POPULAR' || cat.badge === 'BEST VALUE');
  const rawService = cat.service_type || cat.category || forceCategory || '';
  const tierTheme = getTierTheme(idx, rawService);
  const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);
  
  // Rate Formatting with exact 2 decimal places e.g. $4.50, $15.00
  let numericPrice = (cat.price !== undefined && cat.price !== null && cat.price !== '') ? parseFloat(cat.price) : null;
  let displayRate = '$10.00';

  if (numericPrice !== null && !isNaN(numericPrice)) {
    displayRate = `$${numericPrice.toFixed(2)}`;
  } else if (cat.rate) {
    const rawRateStr = String(cat.rate).replace(/\/.*$/, '').trim();
    const priceMatch = rawRateStr.match(/\d+(?:\.\d+)?/);
    if (priceMatch) {
      displayRate = `$${parseFloat(priceMatch[0]).toFixed(2)}`;
    } else {
      displayRate = rawRateStr.startsWith('$') ? rawRateStr : `$${rawRateStr}`;
    }
  }

  // Strike price formatting with exact 2 decimal places e.g. $5.00, $20.00
  let displayStrikePrice = null;
  const rawOrig = cat.original_price ?? cat.originalPrice ?? cat.strikePrice;
  if (rawOrig !== undefined && rawOrig !== null && rawOrig !== '') {
    const parsedOrig = typeof rawOrig === 'number' ? rawOrig : parseFloat(String(rawOrig).replace(/[^\d.]/g, ''));
    if (!isNaN(parsedOrig)) {
      displayStrikePrice = `$${parsedOrig.toFixed(2)}`;
    }
  }
  
  const unitText = cat.price_unit || cat.unit || (rawService.toLowerCase().includes('patch') ? '/ PIECE' : '/ DESIGN');
  const badgeText = cat.badge_text || cat.badge || cat.discountTag || (isPopular ? 'MOST POPULAR' : (idx === 0 ? 'BASIC' : 'PRO'));
  const descriptionText = cat.subtitle || cat.subTitle || cat.description || '';
  const turnaroundText = cat.turnaround_time || cat.delivery || '4–12 Hours';
  const buttonText = cat.button_text || cat.btnText || `Order ${cat.title ? cat.title.split(' ')[0] : 'Package'} (${displayRate})`;

  return (
    <div
      onClick={() => onSelect && onSelect(cat)}
      style={{
        background: '#ffffff',
        border: isPopular ? `2px solid ${tierTheme.color}` : '1.5px solid #e2e8f0',
        borderRadius: '18px',
        padding: '1.75rem 1.4rem 1.35rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxShadow: isPopular ? `0 12px 30px ${tierTheme.glow}` : '0 4px 16px rgba(0, 0, 0, 0.04)',
        transform: isPopular ? 'translateY(-4px)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        overflow: 'visible'
      }}
    >
      {/* Top Badge Pill */}
      {badgeText && (
        <span style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: tierTheme.color,
          color: '#ffffff',
          padding: '0.25rem 1rem',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          zIndex: 20,
          boxShadow: `0 4px 12px ${tierTheme.glow}`
        }}>
          {badgeText}
        </span>
      )}

      <div>
        {/* Header with Icon and Category Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div style={{ background: tierTheme.bgLight, color: tierTheme.color, padding: '0.5rem', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
            <IconComp size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: tierTheme.color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              {tierTheme.serviceLabel} · #{idx + 1}
            </span>
            <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-heading, "Inter", sans-serif)', fontWeight: 900, margin: '0.1rem 0 0', color: '#0f172a', lineHeight: 1.25, minHeight: '2.8rem', display: 'flex', alignItems: 'center' }}>
              {cat.title}
            </h3>
          </div>
        </div>

        {descriptionText && (
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.45, minHeight: '2.8rem' }}>
            {descriptionText}
          </p>
        )}

        {/* Price Box - Centered in the middle */}
        <div style={{
          marginBottom: '1.15rem',
          padding: '0.85rem 1rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.45rem' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: tierTheme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {displayRate}
            </div>
            {displayStrikePrice && (
              <div style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 700 }}>
                {displayStrikePrice}
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
            {unitText}
          </div>
        </div>

        {/* Features Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.35rem' }}>
          {(cat.features || []).map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.15rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0, display: 'flex' }}>
                <CheckCircle size={13} />
              </div>
              <span style={{ fontSize: '0.825rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.35 }}>
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Order CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(cat);
          }}
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: '0.9rem', 
            padding: '0.75rem 1rem', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            background: tierTheme.btnGradient,
            color: '#ffffff',
            border: 'none',
            boxShadow: `0 4px 14px ${tierTheme.glow}`,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>{buttonText}</span>
          <ArrowRight size={15} />
        </button>

        {turnaroundText && (
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Clock size={13} style={{ color: tierTheme.color }} /> Express Delivery: {turnaroundText}
          </div>
        )}
      </div>

    </div>
  );
};

export default PackageCard;
