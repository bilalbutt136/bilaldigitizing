'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { X } from 'lucide-react';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';
import { StreamlinedOrderFlow } from './StreamlinedOrderFlow';

export const OrderWizardModal = () => {
  const {
    isOrderWizardOpen,
    setIsOrderWizardOpen,
    orderWizardInitialData
  } = useAppState();

  const { handleSafeClose } = useModalBackNavigation({
    isOpen: isOrderWizardOpen,
    onClose: () => setIsOrderWizardOpen(false),
    modalId: 'order_wizard_modal'
  });

  useEffect(() => {
    if (!isOrderWizardOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrderWizardOpen, handleSafeClose]);

  if (!isOrderWizardOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.5rem, 2vw, 1.5rem)',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '94svh',
          overflowY: 'auto',
          borderRadius: '20px',
          background: 'var(--color-surface, #ffffff)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Modal Header Bar with Title and Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--color-border, #e2e8f0)',
            background: 'var(--color-surface, #ffffff)',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.94rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
              ⚡ Direct Studio Order Desk
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
              4–12H Delivery
            </span>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-subtle, #f1f5f9)',
              border: '1px solid var(--color-border, #cbd5e1)',
              color: 'var(--color-text-primary, #0f172a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            aria-label="Close Order Wizard"
          >
            <X size={18} />
          </button>
        </div>

        <StreamlinedOrderFlow
          initialService={
            orderWizardInitialData?.type === 'all'
              ? null
              : (orderWizardInitialData?.type || orderWizardInitialData?.category || null)
          }
          initialPackage={orderWizardInitialData?.selectedPackage || null}
          _isModal={true}
          onCloseModal={handleSafeClose}
          onOrderComplete={() => {
            setIsOrderWizardOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default OrderWizardModal;
