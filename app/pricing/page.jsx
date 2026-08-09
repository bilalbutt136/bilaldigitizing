'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, PenTool, Tag, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

export default function PricingPage() {
  const router = useRouter();
  const { openOrderWizard, dynamicPricingTiers = [] } = useAppState();

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
    switch (serviceType) {
      case 'embroidery':
        return {
          icon: <Layers size={28} />,
          bgLight: 'rgba(249, 115, 22, 0.12)',
          colorMain: 'var(--orange-600)',
          colorHex: '#ea580c',
          btnClass: 'btn btn-primary-orange btn-md',
          orderCat: 'embroidery'
        };
      case 'vector_art':
        return {
          icon: <PenTool size={28} />,
          bgLight: 'rgba(59, 130, 246, 0.12)',
          colorMain: '#3b82f6',
          colorHex: '#3b82f6',
          btnClass: 'btn btn-md',
          btnStyle: { background: '#3b82f6', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)' },
          orderCat: 'vector'
        };
      case 'patches':
      default:
        return {
          icon: <Tag size={28} />,
          bgLight: 'rgba(16, 185, 129, 0.12)',
          colorMain: '#10b981',
          colorHex: '#10b981',
          btnClass: 'btn btn-md',
          btnStyle: { background: '#10b981', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' },
          orderCat: 'patch'
        };
    }
  };

  const sortedTiers = [...dynamicPricingTiers].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

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
            Select from our dynamic pricing tiers below. Simple, flat-rate starting prices with zero hidden fees and no surprises.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'stretch'
        }}>
          {sortedTiers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading pricing tiers...
            </div>
          ) : (
            sortedTiers.map((tier) => {
              const theme = getThemeForService(tier.service_type);
              
              return (
                <div key={tier.id} className="card" style={{
                  background: '#ffffff',
                  border: tier.is_popular ? '2px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '2.75rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: tier.is_popular ? '0 10px 30px rgba(234, 88, 12, 0.15)' : 'var(--shadow-md)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  position: 'relative',
                  transform: tier.is_popular ? 'translateY(-8px)' : 'none'
                }}>
                  {tier.is_popular && (
                    <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--orange-500)', color: '#fff', padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em', boxShadow: '0 4px 10px rgba(234,88,12,0.3)' }}>
                      MOST POPULAR
                    </span>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: theme.bgLight, color: theme.colorMain, padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                        {theme.icon}
                      </div>
                      <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>{tier.title}</h3>
                    </div>
                    {tier.subtitle && (
                       <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>{tier.subtitle}</p>
                    )}
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: theme.colorMain, lineHeight: 1 }}>${tier.price}</div>
                        {tier.original_price && (
                          <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>${tier.original_price}</div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tier.badge_text || tier.price_unit}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                      {(Array.isArray(tier.features) ? tier.features : []).map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                            <CheckCircle size={14} />
                          </div>
                          <span style={{ fontSize: '0.95rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                      onClick={() => handleOrder(theme.orderCat, tier.title, `$${tier.price}`, theme.orderCat)}
                      className={theme.btnClass}
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 800, padding: '1.1rem', ...(theme.btnStyle || {}) }}
                    >
                      {tier.button_text || 'Order Now'} <ArrowRight size={18} />
                    </button>
                    {tier.turnaround_time && (
                      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Turnaround: {tier.turnaround_time}
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
