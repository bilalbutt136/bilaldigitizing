'use client';

import React from 'react';
import { PlusCircle } from 'lucide-react';

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' }
];

function OrdersManagementHeader({
  activeCount = 0,
  completedCount = 0,
  totalCount = 0,
  activeFilter = 'active',
  onFilterChange,
  onNewOrder
}) {
  const counts = {
    active: activeCount,
    completed: completedCount,
    all: totalCount
  };

  return (
    <section className="orders-management-header" aria-labelledby="orders-management-title">
      <div className="orders-management-title-block">
        <div>
          <span className="orders-management-eyebrow">Order workspace</span>
          <h2 id="orders-management-title">My Orders</h2>
          <p>Track production, payments, revisions, and delivered files.</p>
        </div>

        <button
          type="button"
          onClick={onNewOrder}
          className="orders-new-order-button"
        >
          <PlusCircle size={17} />
          <span>New order</span>
        </button>
      </div>

      <div className="orders-header-actions-group">
        <div className="orders-segmented-filter-bar" role="tablist" aria-label="Filter orders">
          {FILTERS.map(filter => {
            const selected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={'orders-segmented-filter-btn' + (selected ? ' is-active' : '')}
                onClick={() => onFilterChange?.(filter.id)}
              >
                <span>{filter.label}</span>
                <span className="orders-filter-count">{counts[filter.id]}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNewOrder}
          className="orders-new-order-button orders-new-order-button-mobile"
        >
          <PlusCircle size={17} />
          <span>New order</span>
        </button>
      </div>
    </section>
  );
}

export default React.memo(OrdersManagementHeader);
