'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

export default function FAQsPage() {
  const { faqs: dbFaqs = [] } = useAppState() || {};
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    const groupedFaqs = dbFaqs.reduce((acc, faq) => {
      const cat = faq.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ q: faq.question || faq.q, a: faq.answer || faq.a });
      return acc;
    }, {});
    
    setFaqs(Object.keys(groupedFaqs).map(cat => ({
      category: cat,
      questions: groupedFaqs[cat]
    })));
  }, [dbFaqs]);

  const [openIndex, setOpenIndex] = useState('0-0');

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const schemaData = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.flatMap(section => section.questions.map(q => ({
      "@type": "Question",
      "name": q.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.a
      }
    })))
  } : null;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '4rem', paddingBottom: '6rem' }}>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to know about our services, processes, and policies. Can't find the answer you're looking for? Feel free to contact our 24/7 support.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {faqs.map((section, sIdx) => (
            <div key={sIdx}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                {section.category}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {section.questions.map((faq, qIdx) => {
                  const idx = `${sIdx}-${qIdx}`;
                  const isOpen = openIndex === idx;
                  
                  return (
                    <div 
                      key={qIdx} 
                      style={{ 
                        background: '#ffffff', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        boxShadow: isOpen ? '0 10px 25px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <button
                        onClick={() => toggleAccordion(idx)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: isOpen ? 'var(--orange-600)' : 'var(--navy-900)',
                        }}
                      >
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{faq.q}</span>
                        <ChevronDown 
                          size={20} 
                          style={{ 
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                            transition: 'transform 0.3s ease',
                            color: isOpen ? 'var(--orange-500)' : 'var(--navy-400)'
                          }} 
                        />
                      </button>
                      
                      <div 
                        style={{ 
                          maxHeight: isOpen ? '500px' : '0', 
                          overflow: 'hidden', 
                          transition: 'max-height 0.3s ease-in-out',
                          background: '#f8fafc'
                        }}
                      >
                        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '4rem', background: 'var(--navy-900)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', color: '#ffffff' }}>
          <MessageCircle size={40} style={{ color: 'var(--orange-500)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Still have questions?</h3>
          <p style={{ color: 'var(--navy-200)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
            Our team is available 24/7 to assist you with any custom requests or specific inquiries.
          </p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('bdigi_open_chat'));
                setTimeout(() => {
                  const chatBtn = document.querySelector('.live-chat-floating-button') || document.querySelector('[data-chat-trigger="true"]');
                  if (chatBtn) chatBtn.click();
                }, 100);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #ff7a00, #ff9d40)',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '999px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 122, 0, 0.3)'
            }}
          >
            Chat with Support
          </button>
        </div>

      </div>
    </div>
  );
}
