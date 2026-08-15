'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, PenTool, Tag, ArrowRight, CheckCircle, Sparkles, Clock, ShieldCheck, Zap, LayoutGrid } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';
import { matchCategory } from '../../src/utils/categoryUtils';

export default function PricingPage() {
  const router = useRouter();
  const { openOrderWizard, dynamicPricingTiers = [] } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const getThemeForService = (serviceType) => {
    const norm = (serviceType || '').toLowerCase().replace('-', '_');
    if (norm === 'vector_art' || norm === 'vector') {
      return {
        label: 'Vector Art Redraw',
        icon: <PenTool size={24} />,
        bgLight: 'rgba(37, 99, 235, 0.12)',
        colorMain: '#2563eb',
        colorHex: '#2563eb',
        btnClass: 'btn btn-md',
        btnStyle: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' },
        orderCat: 'vector'
      };
    }
    if (norm === 'patches' || norm === 'patch') {
      return {
        label: 'Custom Physical Patches',
        icon: <Tag size={24} />,
        bgLight: 'rgba(16, 185, 129, 0.12)',
        colorMain: '#059669',
        colorHex: '#059669',
        btnClass: 'btn btn-md',
        btnStyle: { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' },
        orderCat: 'patch'
      };
    }
    return {
      label: 'Embroidery Digitizing',
      icon: <Layers size={24} />,
      bgLight: 'rgba(249, 115, 22, 0.12)',
      colorMain: 'var(--orange-600)',
      colorHex: '#ea580c',
      btnClass: 'btn btn-primary-orange btn-md',
      btnStyle: { boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' },
      orderCat: 'embroidery'
    };
  };

  const filteredTiers = dynamicPricingTiers
    .filter(tier => {
      if (selectedCategory === 'all') return true;
      return matchCategory(tier.service_type, selectedCategory);
    })
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const filterTabs = [
    { id: 'all', label: 'All Services', icon: LayoutGrid },
    { id: 'embroidery', label: 'Embroidery Digitizing', icon: Layers },
    { id: 'vector_art', label: 'Vector Art Redraw', icon: PenTool },
    { id: 'patches', label: 'Custom Patches', icon: Tag }
  ];

  return (
    <main style={{ padding: '8rem 2rem 6rem', background: 'var(--navy-100)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.1)'
          }}>
            <Sparkles size={16} />
            Clear & Transparent Factory Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--navy-900)', marginBottom: '1.25rem', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
            Choose Your <span style={{ color: 'var(--orange-500)' }}>Service Package</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
            Factory direct pricing with 100% free unlimited edits, machine sew-out guarantees, and express 4–12 hour turnaround.
          </p>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              padding: '0.35rem',
              borderRadius: '9999px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              flexWrap: 'wrap',
              gap: '0.3rem'
            }}>
              {filterTabs.map(tab => {
                const Icon = tab.icon;
                const isSelected = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.45rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: isSelected ? 'var(--navy-900)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--navy-700)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.25)' : 'none'
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {filteredTiers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                No active packages found in this category
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Please select another category above or check back shortly.
              </p>
            </div>
          ) : (
            filteredTiers.map((tier) => {
              const theme = getThemeForService(tier.service_type);
              
              return (
                <div key={tier.id} className="card" style={{
                  background: '#ffffff',
                  border: tier.is_popular ? '2.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: tier.is_popular ? '0 16px 36px rgba(234, 88, 12, 0.18)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  transform: tier.is_popular ? 'translateY(-6px)' : 'none'
                }}>
                  {tier.is_popular && (
                    <span style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--orange-500)',
                      color: '#ffffff',
                      padding: '0.35rem 1.25rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)'
                    }}>
                      ⭐ MOST POPULAR
                    </span>
                  )}

                  <div>
                    {/* Header with Icon & Category */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: theme.bgLight, color: theme.colorMain, padding: '0.7rem', borderRadius: '14px', display: 'flex' }}>
                          {theme.icon}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.colorMain, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {theme.label}
                          </span>
                          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: 'var(--navy-900)', lineHeight: 1.2 }}>
                            {tier.title}
                          </h3>
                        </div>
                      </div>

                      {tier.badge_text && (
                        <span style={{ background: 'var(--navy-50)', color: 'var(--navy-800)', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {tier.badge_text}
                        </span>
                      )}
                    </div>

                    {tier.subtitle && (
                      <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        {tier.subtitle}
                      </p>
                    )}

                    {/* Pricing Display */}
                    <div style={{ marginBottom: '1.75rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3.15rem', fontWeight: 900, color: theme.colorMain, lineHeight: 1, letterSpacing: '-0.03em' }}>
                          ${tier.price}
                        </div>
                        {tier.original_price && (
                          <div style={{ fontSize: '1.35rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                            ${tier.original_price}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {tier.price_unit || '/ design'}
                      </div>
                    </div>

                    {/* Features Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                      {(Array.isArray(tier.features) ? tier.features : []).map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                            <CheckCircle size={14} />
                          </div>
                          <span style={{ fontSize: '0.925rem', color: 'var(--navy-800)', fontWeight: 600, lineHeight: 1.45 }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                      onClick={() => handleOrder(theme.orderCat, tier.title, `$${tier.price}`, theme.orderCat)}
                      className={theme.btnClass}
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        fontWeight: 800, 
                        fontSize: '1rem', 
                        padding: '1.05rem', 
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        ...(theme.btnStyle || {}) 
                      }}
                    >
                      <span>{tier.button_text || 'Order Now'}</span>
                      <ArrowRight size={18} />
                    </button>
                    {tier.turnaround_time && (
                      <div style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: theme.colorMain }} /> Delivery: {tier.turnaround_time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </main>
  );
}
