'use client';

import React, { useState } from 'react';
import { FAQS } from '../../data/catalogDefaults';
import { Star, ChevronDown, ChevronUp, Quote } from 'lucide-react';

export const TestimonialsFAQ = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const testimonials = [
    {
      name: 'Dave Miller',
      role: 'Owner, Custom Cap Crafters',
      rating: 5,
      comment: 'Bilal Digitizing is our go-to partner for 3D puff cap digitizing. The foam compensation and center-out pathing are flawless. Zero thread breaks on our Tajima 6-head machine!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
    },
    {
      name: 'Sarah Jenkins',
      role: 'Production Manager, Apex Athletics',
      rating: 5,
      comment: 'Their 12-hour turnaround saved our team during high-season rush orders. The DST files sew clean on pique polos with zero puckering. Best digitizing service on the market.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
    },
    {
      name: 'Marcus Thorne',
      role: 'Art Director, Vintage Apparel Co.',
      rating: 5,
      comment: 'The vector artwork conversions are super clean. Low-resolution client PNGs get turned into crisp AI/SVG files ready for screen printing color separation within hours.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'
    }
  ];

  return (
    <section id="faqs" style={{ padding: '5rem 0', background: 'var(--bg-main)' }}>
      <div className="container">
        
        {/* Testimonials Block */}
        <div style={{ marginBottom: '5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
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

            <h2 style={{ fontSize: '2.25rem', color: 'var(--navy-900)' }}>
              Trusted by 1,200+ Apparel Decorators
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.75rem'
          }}>
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="card"
                style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem', color: 'var(--orange-500)' }}>
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="var(--orange-500)" />
                    ))}
                  </div>
                  <p style={{ color: 'var(--navy-800)', fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                    "{t.comment}"
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <img 
                    src={t.avatar} 
                    alt={t.name} 
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Accordion Block */}
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Everything you need to know about files, turnaround times, and free revisions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="card"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    borderColor: isOpen ? 'var(--orange-600)' : 'var(--border-color)'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.15rem 1.5rem',
                      background: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: isOpen ? 'var(--orange-700)' : 'var(--navy-900)'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 1.5rem 1.25rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--navy-100)',
                      paddingTop: '1rem'
                    }}>
                      {faq.a}
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
