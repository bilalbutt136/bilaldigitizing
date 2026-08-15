import React from 'react';
import { CheckCircle, Zap, Trophy, Sparkles, Clock, ArrowRight, Layers, PenTool, Tag } from 'lucide-react';

const getTierTheme = (idx = 0, serviceType = '') => {
  const index = typeof idx === 'number' ? idx % 3 : 0;
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

  if (index === 0) {
    // Package #1: ORANGE THEME
    return {
      packageNumber: 1,
      color: '#ea580c',
      bgLight: 'rgba(234, 88, 12, 0.12)',
      border: '#fed7aa',
      btnGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      glow: 'rgba(234, 88, 12, 0.28)',
      defaultIcon,
      serviceLabel
    };
  }
  if (index === 1) {
    // Package #2: BLUE THEME
    return {
      packageNumber: 2,
      color: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.12)',
      border: '#bfdbfe',
      btnGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      glow: 'rgba(37, 99, 235, 0.28)',
      defaultIcon,
      serviceLabel
    };
  }
  // Package #3: GREEN THEME
  return {
    packageNumber: 3,
    color: '#059669',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    border: '#a7f3d0',
    btnGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glow: 'rgba(5, 150, 105, 0.28)',
    defaultIcon,
    serviceLabel
  };
};

export const PackageCard = ({ cat, idx = 0, onSelect, forceCategory = '' }) => {
  const isPopular = cat.popular || cat.badge === 'MOST POPULAR' || cat.badge === 'MOST POPULAR TIER' || cat.badge === 'BEST VALUE';
  const rawService = cat.category || forceCategory || '';
  const tierTheme = getTierTheme(idx, rawService);
  const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);
  
  const rawRateStr = (cat.rate || '$10.00').replace(/\/.*$/, '').trim();
  
  // Extract numeric price value
  const priceMatch = rawRateStr.match(/\$?\d+(?:\.\d{2})?/);
  let displayRate = rawRateStr;

  if (priceMatch) {
    displayRate = priceMatch[0].startsWith('$') ? priceMatch[0] : `$${priceMatch[0]}`;
  } else {
    displayRate = rawRateStr.startsWith('$') ? rawRateStr : `$${rawRateStr}`;
  }
  
  const unitText = cat.unit || (rawService.toLowerCase().includes('patch') ? '/ PIECE' : '/ DESIGN');
  const badgeText = cat.badge || cat.discountTag || (idx === 0 ? 'BASIC' : idx === 1 ? 'MOST POPULAR' : 'PRO / 3D PUFF');

  return (
    <div
      onClick={() => onSelect(cat)}
      style={{
        background: '#ffffff',
        border: isPopular ? `2.5px solid ${tierTheme.color}` : '1.5px solid #e2e8f0',
        borderRadius: '24px',
        padding: '2.75rem 2.25rem 2.25rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxShadow: isPopular ? `0 18px 40px ${tierTheme.glow}` : '0 6px 24px rgba(0, 0, 0, 0.05)',
        transform: isPopular ? 'translateY(-8px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        overflow: 'visible'
      }}
    >
      {/* Top Badge Pill */}
      {badgeText && (
        <span style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: tierTheme.color,
          color: '#ffffff',
          padding: '0.4rem 1.4rem',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          zIndex: 20,
          boxShadow: `0 6px 16px ${tierTheme.glow}`
        }}>
          {badgeText}
        </span>
      )}

      <div>
        {/* Header with Icon and Category Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: tierTheme.bgLight, color: tierTheme.color, padding: '0.75rem', borderRadius: '14px', display: 'flex' }}>
            <IconComp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: tierTheme.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {tierTheme.serviceLabel} · PACKAGE #{idx + 1}
            </span>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading, "Inter", sans-serif)', fontWeight: 900, margin: '0.15rem 0 0', color: '#0f172a', lineHeight: 1.2 }}>
              {cat.title}
            </h3>
          </div>
        </div>

        {cat.subTitle && (
          <p style={{ fontSize: '0.925rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5, minHeight: '44px' }}>
            {cat.subTitle}
          </p>
        )}

        {/* Price Box */}
        <div style={{ marginBottom: '1.75rem', padding: '1.35rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '3.25rem', fontWeight: 900, color: tierTheme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {displayRate}
            </div>
            {cat.strikePrice && (
              <div style={{ fontSize: '1.35rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 700 }}>
                {cat.strikePrice}
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {unitText}
          </div>
        </div>

        {/* Features Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
          {(cat.features || []).map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0, display: 'flex' }}>
                <CheckCircle size={14} />
              </div>
              <span style={{ fontSize: '0.925rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.45 }}>
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Order CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(cat);
          }}
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: '1.05rem', 
            padding: '1.15rem', 
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            background: tierTheme.btnGradient,
            color: '#ffffff',
            border: 'none',
            boxShadow: `0 6px 20px ${tierTheme.glow}`
          }}
        >
          <span>{cat.btnText || `Order ${cat.title.split(' ')[0]} (${displayRate})`}</span>
          <ArrowRight size={18} />
        </button>

        {cat.delivery && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Clock size={14} style={{ color: tierTheme.color }} /> Express Delivery: {cat.delivery}
          </div>
        )}
      </div>

    </div>
  );
};

export default PackageCard;
