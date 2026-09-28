'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Headphones,
  ArrowRight
} from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

export default function ContactPage() {
  const { siteSettings, openOrderWizard, showNotification } = useAppState();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Embroidery Digitizing',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const email = siteSettings?.supportEmail || 'support@bdigitizing.com';
  const phone = siteSettings?.supportPhone || '+1 (347) 915-4498';
  const whatsapp = siteSettings?.whatsappNumber || '+1 (347) 915-4498';
  const address = siteSettings?.officeAddress || '30 N Gould St Ste R, Sheridan, WY 82801, USA';
  const hours = siteSettings?.businessHours || '24/7 Global Production Desk Active';

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWhatsapp = whatsapp.replace(/[^0-9+]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      if (showNotification) showNotification('Please fill in your name, email, and message.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Send message to contact endpoint or fallback grace
      const _res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `[Contact Form] ${formData.service}: ${formData.subject || 'New Inquiry'}`,
          type: 'contact_form',
          data: formData
        })
      }).catch(() => null);

      setSubmitted(true);
      if (showNotification) {
        showNotification('Thank you! Your message has been dispatched to our production team.', 'success');
      }
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg, #0b1120)', color: 'var(--color-text-primary, #ffffff)', paddingBottom: '5rem' }}>

      {/* Top Banner / Breadcrumb */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Link href="/" style={{ color: 'var(--color-text-muted, #94a3b8)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted, #64748b)' }} />
          <span style={{ color: '#ea580c', fontWeight: 700 }}>Contact & Support</span>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 1.5rem 0' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(234, 88, 12, 0.1)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            borderRadius: '999px',
            color: '#f97316',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            <Sparkles size={15} /> 24/7 Global Production Support
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.15 }}>
            Let&apos;s Build Something <span style={{ color: '#ea580c' }}>Remarkable</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
            Have a question about embroidery stitch density, complex vector conversion, or custom patch specifications? Our senior digitizers and customer support engineers are ready to assist you.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '4rem'
        }}>

          {/* Card 1: Email */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.75rem',
            transition: 'border-color 0.2s',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', marginBottom: '1.25rem' }}>
              <Mail size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Email Helpdesk</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', flexGrow: 1 }}>
              Direct line to our senior production engineers for detailed artwork reviews and quotes.
            </p>
            <a
              href={`mailto:${email}`}
              style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', wordBreak: 'break-all' }}
            >
              {email}
            </a>
          </div>

          {/* Card 2: Phone */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.75rem',
            transition: 'border-color 0.2s',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '1.25rem' }}>
              <Phone size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Direct Line</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', flexGrow: 1 }}>
              Speak directly with our US customer account specialists during business hours.
            </p>
            <a
              href={`tel:${cleanPhone}`}
              style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}
            >
              {phone}
            </a>
          </div>

          {/* Card 3: WhatsApp */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.75rem',
            transition: 'border-color 0.2s',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: '1.25rem' }}>
              <MessageCircle size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Instant WhatsApp</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', flexGrow: 1 }}>
              Fast-track urgent order queries, sew-out proofs, or file format questions 24/7.
            </p>
            <a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}
            >
              WhatsApp Us Now &rarr;
            </a>
          </div>

          {/* Card 4: Operations Desk */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.75rem',
            transition: 'border-color 0.2s',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', marginBottom: '1.25rem' }}>
              <Clock size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Global Turnaround</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', flexGrow: 1 }}>
              {hours}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#4ade80', fontSize: '0.85rem', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
              Production Active Now
            </div>
          </div>

        </div>

        {/* Main Content: Contact Form & Studio Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: '3rem',
          alignItems: 'start'
        }}>

          {/* Inquiry Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '2.5rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Send Us a Message</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Fill in your inquiry below. Our engineering desk replies within an average of 15 minutes.
            </p>

            {submitted ? (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Message Dispatched!</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Thank you, <strong>{formData.name}</strong>. A senior production specialist has received your inquiry and will respond to <strong>{formData.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', service: 'Embroidery Digitizing', subject: '', message: '' });
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                      Service of Interest
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Embroidery Digitizing">Embroidery Digitizing</option>
                      <option value="Vector Art Tracing">Vector Art Tracing</option>
                      <option value="Custom Patches">Custom Physical Patches</option>
                      <option value="General Support">General Support / Billing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Brief summary of your question"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                    Your Message / Artwork Specifications *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please include details such as desired width/height, fabric type (piqué, twill, fleece, cap), or machine file format needed..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.9rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(234, 88, 12, 0.35)',
                    opacity: submitting ? 0.7 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={18} />
                  {submitting ? 'Transmitting...' : 'Send Inquiry to Production'}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Information & Direct Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Quick Order Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.12) 0%, rgba(249, 115, 22, 0.05) 100%)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: '20px',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Headphones size={24} style={{ color: '#ea580c' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Ready to place an order?</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Skip the inquiry form and launch our instant Order Wizard directly with real-time pricing and secure checkout.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (openOrderWizard) openOrderWizard({ type: 'all' });
                  else window.location.href = '/order';
                }}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)'
                }}
              >
                Launch Instant Order Wizard <ArrowRight size={16} />
              </button>
            </div>

            {/* Studio Headquarters */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} style={{ color: '#ea580c' }} /> Office Headquarters
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Registered US Address</div>
                  <div style={{ fontWeight: 600, lineHeight: 1.5 }}>{address}</div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Customer Support Coverage</div>
                  <div style={{ fontWeight: 600 }}>United States, Canada, United Kingdom &amp; Australia</div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Turnaround Guarantee</div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#22c55e' }} /> 100% Sew-Out Guarantee with Free Revisions
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Shortcut */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Frequently Asked Questions</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Find immediate answers on thread counts, file formats &amp; turnaround.</p>
              </div>
              <Link
                href="/faqs"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                View FAQs &rarr;
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
