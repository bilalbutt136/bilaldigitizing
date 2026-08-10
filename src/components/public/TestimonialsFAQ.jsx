'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Star, ChevronDown, ChevronUp, Quote } from 'lucide-react';

export const TestimonialsFAQ = () => {
  const appState = useAppState?.() || {};

  const { activeHomeServiceTab } = appState;
  const currentServiceKey = activeHomeServiceTab === 'vector' ? 'Vector' : activeHomeServiceTab === 'patches' || activeHomeServiceTab === 'patch' ? 'Patches' : 'Embroidery';

  const mappedTestimonials = (appState.testimonials || []).map(t => ({
    name: t.client_name || t.name,
    role: t.company || t.role,
    rating: t.rating || 5,
    comment: t.review_text || t.comment,
    avatar: t.avatar_url || t.avatar,
    service: t.service_category || t.service,
    isActive: t.is_active !== false // default to true if undefined
  }));

  const testimonials = mappedTestimonials.filter(
    (t) => t.service === currentServiceKey && t.isActive
  );
  const faqs = (appState.faqs || []).filter(f => f.is_active !== false);

  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeFaqTab, setActiveFaqTab] = useState(currentServiceKey);
  const [hoveredTestimonial, setHoveredTestimonial] = useState(null);

  // Sync activeFaqTab when global service changes
  useEffect(() => {
    setActiveFaqTab(currentServiceKey);
  }, [currentServiceKey]);

  // Optionally hide faqTabs if we want it fully synced with home tab
  // Or just filter filteredFaqs to only the activeFaqTab (which tracks currentServiceKey)
  const filteredFaqs = faqs.filter(faq => faq.category === activeFaqTab);

  // Responsive state for grid layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section id="faqs" style={{ padding: '6rem 0', background: 'var(--bg-main)', position: 'relative' }}>
      <div className="container">
        
        {/* Testimonials Block */}
        <div style={{ marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--orange-500)',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              <Quote size={16} /> Client Verification
            </div>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: 'var(--navy-950)', marginBottom: '1rem', lineHeight: 1.2 }}>
              Trusted by 1,200+ Apparel Decorators & Brands
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              From complex 3D puff embroidery to meticulous vector conversions and premium physical patches, our clients rely on us for production-ready quality.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
            {testimonials.map((t, idx) => {
              const isHovered = hoveredTestimonial === idx;
              return (
                <div 
                  key={idx}
                  onMouseEnter={() => setHoveredTestimonial(idx)}
                  onMouseLeave={() => setHoveredTestimonial(null)}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: isHovered 
                      ? '0 20px 40px -10px rgba(0,0,0,0.1), 0 10px 20px -5px rgba(255,122,0,0.1)' 
                      : '0 4px 6px -1px rgba(0,0,0,0.05)',
                    transform: isHovered ? 'translateY(-5px)' : 'none',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '4px', 
                    background: isHovered ? 'var(--orange-500)' : 'transparent',
                    transition: 'background 0.3s ease'
                  }}></div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" stroke="none" />
                        ))}
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        background: 'var(--orange-50)', 
                        color: 'var(--orange-600)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px'
                      }}>
                        {t.service}
                      </span>
                    </div>
                    <p style={{ color: 'var(--navy-800)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                      "{t.comment}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={t.avatar} 
                      alt={t.name} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-950)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs Accordion Block */}
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: 'var(--navy-950)', marginBottom: '1rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
              Everything you need to know about files, turnaround times, and free revisions for our services.
            </p>
            
            {/* Filter Tabs - Hidden as it is controlled globally now */}
            <div style={{ display: 'none' }}>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '12px',
                      border: isOpen ? '1px solid var(--orange-500)' : '1px solid var(--border-color)',
                      boxShadow: isOpen ? '0 4px 12px rgba(255,122,0,0.05)' : 'none',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '1.05rem',
                        color: isOpen ? 'var(--orange-600)' : 'var(--navy-950)'
                      }}
                    >
                      <span style={{ paddingRight: '1rem' }}>{faq.question || faq.q}</span>
                      <div style={{ 
                        color: isOpen ? 'var(--orange-500)' : 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}>
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    <div style={{
                      maxHeight: isOpen ? '500px' : '0',
                      opacity: isOpen ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out'
                    }}>
                      <div style={{
                        padding: '0 1.5rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '1rem',
                        lineHeight: 1.6,
                      }}>
                        {faq.answer || faq.a}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No FAQs available for this category yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
