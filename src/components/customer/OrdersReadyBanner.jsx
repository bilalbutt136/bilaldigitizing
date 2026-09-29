'use client';

import React from 'react';
import { ArrowRight, Download } from 'lucide-react';

function OrdersReadyBanner({ count = 0, onView }) {
  if (!count) return null;

  return (
    <aside className="orders-ready-banner" aria-live="polite">
      <div className="orders-ready-banner-icon" aria-hidden="true">
        <Download size={18} />
      </div>

      <div className="orders-ready-banner-copy">
        <strong>{count} {count === 1 ? 'order is' : 'orders are'} ready</strong>
        <span>Production files are available to review and download.</span>
      </div>

      <button type="button" className="orders-ready-banner-action" onClick={onView}>
        View files
        <ArrowRight size={15} />
      </button>
    </aside>
  );
}

export default React.memo(OrdersReadyBanner);
