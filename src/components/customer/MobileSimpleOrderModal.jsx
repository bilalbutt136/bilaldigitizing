'use client';

import React from 'react';
import { StreamlinedOrderFlow } from './StreamlinedOrderFlow';
import { X } from 'lucide-react';

export const MobileSimpleOrderModal = ({
  isOpen,
  onClose,
  defaultService = 'embroidery',
  initialData = null,
  onOrderCreated = null
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94svh',
          overflowY: 'auto',
          borderRadius: '20px'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <StreamlinedOrderFlow
          initialService={defaultService || initialData?.type || 'embroidery'}
          initialPackage={initialData?.selectedPackage || null}
          isModal={true}
          onCloseModal={onClose}
          onOrderComplete={(orderId) => {
            if (onOrderCreated) onOrderCreated({ id: orderId });
            if (onClose) onClose();
          }}
        />
      </div>
    </div>
  );
};

export default MobileSimpleOrderModal;
