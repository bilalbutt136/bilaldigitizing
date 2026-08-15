'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Star, ChevronDown, Quote, HelpCircle, CheckCircle2 } from 'lucide-react';

export const TestimonialsFAQ = () => {
  const appState = useAppState?.() || {};

  const { activeHomeServiceTab, homePageConfig = {} } = appState;
  const currentServiceKey = activeHomeServiceTab === 'vector' ? 'Vector' : activeHomeServiceTab === 'patches' || activeHomeServiceTab === 'patch' ? 'Patches' : 'Embroidery';

  const dbSettings = homePageConfig?.settings || {};
  const testTitle = dbSettings.testimonials_title || 'Trusted by 1,200+ Apparel Decorators & Brands';
  const testSub = dbSettings.testimonials_sub || 'From complex 3D puff embroidery to meticulous vector conversions and premium physical patches, our clients rely on us for production-ready quality.';
  const faqTitle = dbSettings.faq_title || 'Frequently Asked Questions';
  const faqSub = dbSettings.faq_sub || 'Everything you need to know about files, turnaround times, and free revisions for our services.';

  const mappedTestimonials = (appState.testimonials || []).map(t => ({
    name: t.client_name || t.name,
    role: t.company || t.role,
    rating: t.rating || 5,
    comment: t.review_text || t.comment,
    avatar: t.avatar_url || t.avatar,
    service: t.service_category || t.service,
    isActive: t.is_active !== false
  }));

  const testimonials = mappedTestimonials.filter(
    (t) => t.service === currentServiceKey && t.isActive
  );
  const faqs = (appState.faqs || []).filter(f => f.is_active !== false);

  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeFaqTab, setActiveFaqTab] = useState(currentServiceKey);

  // Sync activeFaqTab when global service changes
  useEffect(() => {
    setActiveFaqTab(currentServiceKey);
  }, [currentServiceKey]);

  const filteredFaqs = faqs.filter(faq => faq.category === activeFaqTab);

  return (
    <section id="faqs" style={{ padding: '5.5rem 0', background: 'var(--bg-main)', position: 'relative', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Testimonials Block */}
        <div style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--orange-700)',
              background: 'var(--orange-50)',
              border: '1px solid var(--orange-200)',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              <Quote size={15} /> Verified Customer Feedback
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {testTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.65 }}>
              {testSub}
            </p>
          </div>

          <div className="grid-responsive-3">
            {testimonials.map((t, idx) => {
              return (
                <div 
                  key={idx}
                  className="card"
                  style={{
                    background: 'var(--bg-card)',
                    padding: '2.25rem 2rem',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '3px', color: '#f59e0b' }}>
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={17} fill="currentColor" stroke="none" />
                        ))}
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        background: 'var(--orange-50)', 
                        color: 'var(--orange-700)',
                        border: '1px solid var(--orange-200)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {t.service}
                      </span>
                    </div>
                    <p style={{ color: 'var(--navy-800)', fontSize: '0.975rem', lineHeight: 1.65, marginBottom: '2rem', fontStyle: 'italic' }}>
                      "{t.comment}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '1.25rem' }}>
                    <img 
                      src={t.avatar} 
                      alt={t.name} 
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--orange-200)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-950)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {t.name} <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.role}</div>
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
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--orange-700)',
              background: 'var(--orange-50)',
              border: '1px solid var(--orange-200)',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              <HelpCircle size={15} /> Help & Answers
            </div>

            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              {faqTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.65 }}>
              {faqSub}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="card"
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '16px',
                      border: isOpen ? '1.5px solid var(--orange-400)' : '1px solid var(--border-color)',
                      boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '1.35rem 1.75rem',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: isOpen ? 'var(--orange-600)' : 'var(--navy-950)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      <span style={{ paddingRight: '1rem' }}>{faq.question || faq.q}</span>
                      <div style={{ 
                        color: isOpen ? 'var(--orange-500)' : 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        flexShrink: 0
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
                        padding: '0 1.75rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
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

