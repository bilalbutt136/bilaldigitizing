'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Star, ChevronDown, Quote, HelpCircle, CheckCircle2, Sparkles, Layers, PenTool, PackageCheck } from 'lucide-react';
import { normalizeCategory, matchCategory } from '../../utils/categoryUtils';

export const TestimonialsFAQ = () => {
  const appState = useAppState?.() || {};

  const { activeHomeServiceTab = 'all', homePageConfig = {} } = appState;
  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');

  const dbSettings = homePageConfig?.settings || {};
  const testTitle = dbSettings.testimonials_title || 'Trusted by 1,200+ Apparel Decorators & Brands';
  const testSub = dbSettings.testimonials_sub || 'From complex 3D puff embroidery to meticulous vector conversions and premium physical patches, our clients rely on us for production-ready quality.';
  const faqTitle = dbSettings.faq_title || 'Frequently Asked Questions';
  const faqSub = dbSettings.faq_sub || 'Everything you need to know about files, turnaround times, and free revisions for our services.';

  const mappedTestimonials = (appState.testimonials || []).map(t => ({
    name: t.client_name || t.name || 'Verified Client',
    role: t.company ? `${t.role ? t.role + ', ' : ''}${t.company}` : (t.role || 'Verified Customer'),
    rating: t.rating || 5,
    comment: t.review_text || t.comment || '',
    avatar: t.avatar_url || t.avatar || null,
    service: t.service_category || t.service || 'Embroidery',
    isActive: t.is_active !== false
  }));

  // Filter testimonials based on category or show all active
  const activeTestimonials = mappedTestimonials.filter(t => t.isActive);
  const filteredTestimonials = activeTestimonials.filter(t => {
    if (activeTab === 'all') return true;
    return matchCategory(t.service, activeTab);
  });
  const displayTestimonials = filteredTestimonials.length > 0 ? filteredTestimonials : activeTestimonials;

  const allFaqs = (appState.faqs || []).filter(f => f.is_active !== false);
  const [activeFaqTab, setActiveFaqTab] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Sync FAQ tab if activeHomeServiceTab changes
  useEffect(() => {
    if (activeHomeServiceTab && activeHomeServiceTab !== 'all') {
      const norm = normalizeCategory(activeHomeServiceTab);
      setActiveFaqTab(norm);
    } else {
      setActiveFaqTab('all');
    }
    setOpenFaqIndex(0);
  }, [activeHomeServiceTab]);

  // Filter FAQs based on activeFaqTab
  const filteredFaqs = allFaqs.filter(faq => {
    if (activeFaqTab === 'all') return true;
    const faqCat = (faq.category || '').toLowerCase().trim();
    if (activeFaqTab === 'general') return faqCat === 'general';
    return matchCategory(faqCat, activeFaqTab);
  });
  const displayFaqs = filteredFaqs.length > 0 ? filteredFaqs : allFaqs;

  const faqTabs = [
    { key: 'all', label: 'All Questions' },
    { key: 'embroidery', label: 'Embroidery' },
    { key: 'vector-art', label: 'Vector Art' },
    { key: 'patches', label: 'Patches' },
    { key: 'general', label: 'General' }
  ];

  return (
    <section id="faqs" style={{ padding: '5.5rem 0', background: 'var(--bg-main)', position: 'relative', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Testimonials Block */}
        <div style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
            <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
              <Quote size={15} style={{ color: 'var(--orange-500)' }} />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {testTitle.includes('1,200+') ? (
                <>Trusted by <span className="text-gradient-orange">1,200+</span> Apparel Decorators & Brands</>
              ) : (
                testTitle
              )}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.65 }}>
              {testSub}
            </p>
          </div>

          <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
            {displayTestimonials.map((t, idx) => {
              const serviceLabel = (t.service || 'Embroidery').charAt(0).toUpperCase() + (t.service || 'Embroidery').slice(1);
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
                        background: 'var(--color-primary-light)', 
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-border)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {serviceLabel}
                      </span>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary, var(--navy-800))', fontSize: '0.975rem', lineHeight: 1.65, marginBottom: '2rem', fontStyle: 'italic' }}>
                      "{t.comment}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                    {t.avatar ? (
                      <img 
                        src={t.avatar} 
                        alt={t.name} 
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
                      />
                    ) : (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
                        color: 'var(--color-text-on-primary, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        border: '2px solid var(--color-border)',
                        boxShadow: '0 2px 6px var(--color-primary-glow)',
                        flexShrink: 0
                      }}>
                        {(t.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary, var(--navy-950))', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {t.name} <CheckCircle2 size={14} style={{ color: 'var(--color-success, #10b981)' }} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, var(--text-muted))', fontWeight: 600 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs Accordion Block */}
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
              <HelpCircle size={15} style={{ color: 'var(--orange-500)' }} />
              <span>Help & Answers</span>
            </div>

            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--navy-950)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              {faqTitle.includes('Questions') ? (
                <>Frequently Asked <span className="text-gradient-orange">Questions</span></>
              ) : (
                faqTitle
              )}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '2rem' }}>
              {faqSub}
            </p>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
              {faqTabs.map(tab => {
                const isActive = activeFaqTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveFaqTab(tab.key);
                      setOpenFaqIndex(0);
                    }}
                    style={{
                      padding: '0.5rem 1.15rem',
                      borderRadius: '9999px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isActive ? 'var(--color-primary)' : 'var(--color-surface, #ffffff)',
                      color: isActive ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)',
                      boxShadow: isActive ? '0 2px 8px var(--color-primary-glow)' : 'var(--shadow-sm)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={faq.id || idx}
                  className="card"
                  style={{
                    background: 'var(--color-surface, var(--bg-card))',
                    borderRadius: '16px',
                    border: isOpen ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease'
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
                      color: isOpen ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    <span style={{ paddingRight: '1rem' }}>{faq.question || faq.q}</span>
                    <div style={{ 
                      color: isOpen ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0
                    }}>
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 1.75rem 1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.95rem',
                      lineHeight: 1.65,
                    }}>
                      {faq.answer || faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsFAQ;

