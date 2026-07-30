'use client';

import React from 'react';
import { useAppState } from '../src/context/StateContext';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function ToastContainer() {
  const { toast } = useAppState();
  if (!toast) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type}`}>
        {toast.type === 'success' && <CheckCircle2 size={18} />}
        {toast.type === 'info' && <Info size={18} />}
        {toast.type === 'warning' && <AlertTriangle size={18} />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
