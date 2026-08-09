'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
  {
    category: "Embroidery Digitizing",
    questions: [
      {
        q: "What file formats do you provide for embroidery digitizing?",
        a: "We provide all major machine formats including .DST, .PES, .EXP, .HUS, .JEF, .VIP, .VP3, and .XXX. If you need a specific format not listed here, just let us know in your order notes."
      },
      {
        q: "What is the turnaround time for digitizing orders?",
        a: "Our standard turnaround time is 12-24 hours. However, we also offer a Rush option for 2-4 hour delivery at an additional cost."
      },
      {
        q: "Do you charge for revisions?",
        a: "Minor revisions such as slight size adjustments (up to 10%), density changes, or sequence edits are completely free. Major revisions involving artwork changes or scaling up significantly may incur a small editing fee."
      },
      {
        q: "How do I know my design will run well on my machine?",
        a: "Every design goes through a strict Quality Assurance process where we digitally simulate the sew-out and, for complex designs, run physical test sew-outs to ensure zero thread breaks, correct density, and sharp details."
      }
    ]
  },
  {
    category: "Vector Art Conversion",
    questions: [
      {
        q: "What file formats will I receive for vector art?",
        a: "You will receive print-ready, fully scalable vector files including .AI, .EPS, .SVG, .PDF, and high-resolution .PNG / .JPG for quick viewing."
      },
      {
        q: "Can you convert low-resolution images or sketches into vectors?",
        a: "Yes, our expert artists can manually trace low-resolution JPGs, PNGs, and even rough hand-drawn sketches into crisp, scalable vector artwork."
      },
      {
        q: "Will the colors match my original artwork?",
        a: "Absolutely. We match colors as closely as possible to your original image using Pantone matching systems. If you have specific color codes you need us to use, you can provide them during the order process."
      }
    ]
  },
  {
    category: "Custom Patches",
    questions: [
      {
        q: "What types of custom patches do you make?",
        a: "We manufacture Embroidered, Woven, Leather, PVC (Rubber), Printed, and Chenille patches. We offer various backings including Iron-on, Velcro (Hook & Loop), Peel-and-Stick, and standard Sew-on."
      },
      {
        q: "What is the Minimum Order Quantity (MOQ) for patches?",
        a: "Our Minimum Order Quantity for custom patches is typically 50 pieces, though this may vary slightly depending on the patch material (e.g. PVC or Leather). Contact us for specific details based on your design."
      },
      {
        q: "How long does it take to produce and ship custom patches?",
        a: "Production usually takes 7-10 business days after the digital proof is approved. Shipping via DHL/FedEx takes an additional 3-5 business days depending on your location."
      },
      {
        q: "Can I see a sample before full production?",
        a: "Yes, we always provide a high-resolution digital photo of a physical sample (pre-production proof) for your approval before we proceed with the full bulk production run."
      }
    ]
  }
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState('0-0');

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '4rem', paddingBottom: '6rem' }}>
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
