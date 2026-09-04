'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Clock, 
  RotateCcw, 
  DollarSign, 
  CheckSquare, 
  Square, 
  Send, 
  Loader2,
  Scissors,
  Layers,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { createCustomOffer } from '../../services/supabaseService';

export default function AdminCreateOfferModal({
  isOpen,
  onClose,
  conversationId,
  clientName = 'Customer',
  clientEmail = '',
  onOfferCreated = () => {},
  showToast = () => {}
}) {
  const isSubmittingRef = useRef(false);
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('Embroidery Digitizing');
  const [description, setDescription] = useState('');
  const [deliveryTimeText, setDeliveryTimeText] = useState('1 Day');
  const [deliveryDays, setDeliveryDays] = useState(1);
  const [revisionsAllowed, setRevisionsAllowed] = useState('2');
  const [price, setPrice] = useState('25.00');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [requiresRequirements, setRequiresRequirements] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numPrice = parseFloat(price) || 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const finalPrice = Math.max(0, numPrice - numDiscount);

  // Quick preset templates
  const applyPreset = (preset) => {
    setTitle(preset.title);
    setServiceType(preset.serviceType);
    setDescription(preset.description);
    setPrice(preset.price);
    setDiscountAmount('0.00');
    setDeliveryTimeText(preset.delivery);
    setDeliveryDays(preset.days);
    setRevisionsAllowed(preset.revisions);
    setRequiresRequirements(preset.requiresRequirements ?? true);
  };

  const presets = [
    {
      label: 'Embroidery Standard',
      title: 'Embroidery Digitizing – DST & PES',
      serviceType: 'Embroidery Digitizing',
      description: 'I will digitize your logo into production-ready DST and PES files with clean stitching and proper embroidery density.',
      price: '25.00',
      delivery: '1 Day',
      days: 1,
      revisions: '2'
    },
    {
      label: 'Vector Conversion',
      title: 'Vector Artwork Conversion – AI, EPS & SVG',
      serviceType: 'Vector Artwork',
      description: 'Convert low-resolution logo into sharp, scalable vector files (AI, EPS, SVG, High-Res PDF) ready for screen printing and vinyl cutting.',
      price: '18.00',
      delivery: '1 Day',
      days: 1,
      revisions: '2'
    },
    {
      label: '3D Puff Embroidery',
      title: '3D Puff / Foam Embroidery Digitizing',
      serviceType: 'Embroidery Digitizing',
      description: 'Specialized 3D puff embroidery file for structured caps and jackets with capped ends and proper foam perforation density.',
      price: '35.00',
      delivery: '1 Day',
      days: 1,
      revisions: '3'
    },
    {
      label: 'Combo Pack',
      title: 'Embroidery Digitizing + Vector Artwork Combo',
      serviceType: 'Embroidery Digitizing',
      description: 'Complete studio package: Production embroidery machine file (DST/PES) + Scalable master vector artwork (AI/EPS/PDF).',
      price: '40.00',
      delivery: '2 Days',
      days: 2,
      revisions: '3'
    }
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting || isSubmittingRef.current) return;

    if (!title.trim()) {
      showToast('Please enter an offer title.', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Please describe the scope of deliverables.', 'error');
      return;
    }
    if (finalPrice <= 0) {
      showToast('Please enter a valid price greater than $0.', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const idempotencyKey = `idemp-off-${conversationId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        conversation_id: conversationId,
        client_name: clientName,
        client_email: clientEmail,
        title: title.trim(),
        description: description.trim(),
        service_type: serviceType,
        price: numPrice,
        discount_amount: numDiscount,
        final_price: finalPrice,
        delivery_time_text: deliveryTimeText,
        delivery_days: deliveryDays,
        revisions_allowed: revisionsAllowed,
        expires_in_hours: expiresInHours,
        requires_requirements: requiresRequirements,
        idempotency_key: idempotencyKey
      };

      const res = await createCustomOffer(payload);
      if (res.error) {
        showToast(res.error, 'error');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      } else {
        showToast(`Custom offer sent to ${clientName}!`, 'success');
        onOfferCreated(res.offer, res.message);
        onClose();
      }
    } catch {
      showToast('Failed to create offer. Please try again.', 'error');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0b1329',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Tag size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Create Custom Offer</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Sending to <strong style={{ color: '#60a5fa' }}>{clientName}</strong> ({clientEmail || 'Chat Customer'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Quick Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Templates
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#93c5fd',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  + {p.label} (${p.price})
                </button>
              ))}
            </div>
          </div>

          {/* Service Type & Expiry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Embroidery Digitizing">Embroidery Digitizing</option>
                <option value="Vector Artwork">Vector Artwork</option>
                <option value="Custom Patches">Custom Patches</option>
                <option value="Custom Design">Custom Design & Combo</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Offer Expiry
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours (1 Day)</option>
                <option value={48}>48 Hours (2 Days)</option>
                <option value={72}>3 Days</option>
                <option value={168}>7 Days</option>
              </select>
            </div>
          </div>

          {/* Offer Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Offer Title <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Embroidery Digitizing – DST & PES (Left Chest)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Scope / Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Offer Description & Deliverables <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Type instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Delivery & Revisions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Delivery Time
              </label>
              <select
                value={deliveryTimeText}
                onChange={(e) => {
                  setDeliveryTimeText(e.target.value);
                  const days = e.target.value.includes('12') ? 1 : parseInt(e.target.value, 10) || 1;
                  setDeliveryDays(days);
                }}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="12 Hours Express">12 Hours Express</option>
                <option value="1 Day">1 Day</option>
                <option value="2 Days">2 Days</option>
                <option value="3 Days">3 Days</option>
                <option value="5 Days">5 Days</option>
                <option value="7 Days">7 Days</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Revisions Included
              </label>
              <select
                value={revisionsAllowed}
                onChange={(e) => setRevisionsAllowed(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="1">1 Revision</option>
                <option value="2">2 Revisions</option>
                <option value="3">3 Revisions</option>
                <option value="5">5 Revisions</option>
                <option value="Unlimited">Unlimited Revisions</option>
              </select>
            </div>
          </div>

          {/* Pricing & Discount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Price ($ USD) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>$</span>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Discount / Credit ($ USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Requirements Checkbox */}
          <div
            onClick={() => setRequiresRequirements(!requiresRequirements)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {requiresRequirements ? (
              <CheckSquare size={18} className="text-emerald-400" />
            ) : (
              <Square size={18} className="text-slate-400" />
            )}
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Request Requirements</strong>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Customer must provide artwork files or notes before production queue starts.</span>
            </div>
          </div>

          {/* Total & Submit Button */}
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Final Offer Price</span>
              <strong style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399' }}>
                ${finalPrice.toFixed(2)}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSubmitting ? 'Sending Offer...' : 'Send Offer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
