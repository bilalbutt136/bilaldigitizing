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
          maxWidth: '960px',
          maxHeight: '92svh',
          overflowY: 'auto',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={handleSafeClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 10,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #cbd5e1)',
            color: 'var(--color-text-primary, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease'
          }}
          aria-label="Close Order Wizard"
        >
          <X size={20} />
        </button>

        <StreamlinedOrderFlow
          initialService={orderWizardInitialData?.type || orderWizardInitialData?.category || 'embroidery'}
          initialPackage={orderWizardInitialData?.selectedPackage || null}
          isModal={true}
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
