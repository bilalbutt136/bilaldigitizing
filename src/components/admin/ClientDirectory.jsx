'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { Building2, RefreshCw, Users } from 'lucide-react';

export const ClientDirectory = () => {
  const { clients = [], orders = [], refreshClients } = useAppState();
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    if (refreshClients) {
      refreshClients();
    }
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (refreshClients) await refreshClients();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-900)', margin: 0 }}>
            Registered Embroidery Shops & Apparel Brands ({clients.length})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Client directory, volume metrics, and custom pricing tier assignments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          title="Refresh client directory from database"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Directory'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--navy-700)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Company / Shop Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Primary Contact</th>
              <th style={{ padding: '0.75rem 1rem' }}>Wholesale Tier</th>
              <th style={{ padding: '0.75rem 1rem' }}>Total Orders</th>
              <th style={{ padding: '0.75rem 1rem' }}>Lifetime Spend</th>
            </tr>
          </thead>
          <tbody>
            {(!clients || clients.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                    No Registered Clients Found
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    Clients will appear here automatically when accounts register or place orders.
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((c, idx) => {
                const tierStr = c.tier || 'Standard Client';
                const companyName = c.company || c.company_name || c.name || c.email?.split('@')[0] || 'Client Account';
                const contactName = c.contact || c.full_name || c.name || 'Primary Contact';
                
                // Match client's real production orders
                const clientEmail = (c.email || '').toLowerCase().trim();
                const matchedOrders = (orders || []).filter(o => {
                  const oEmail = (o?.clientEmail || o?.client_email || '').toLowerCase().trim();
                  return clientEmail && oEmail === clientEmail;
                });

                const ordersCount = (c.totalOrders ?? c.orders_count) || matchedOrders.length;
                const computedSpend = matchedOrders.reduce((acc, o) => acc + (parseFloat(o.price || o.cost || 0) || 0), 0);
                const spendAmount = typeof c.totalSpent === 'number' && c.totalSpent > 0
                  ? c.totalSpent
                  : (computedSpend > 0 ? computedSpend : (typeof c.wallet_balance === 'number' ? c.wallet_balance : 0));

                return (
                  <tr key={c.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} style={{ color: 'var(--orange-600)' }} />
                        {companyName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.id || `c-${idx}`}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: 'var(--navy-900)' }}>{contactName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${tierStr.includes('VIP') ? 'badge-completed' : 'badge-assigned'}`}>
                        {tierStr}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                      {ordersCount} jobs
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--green-600)' }}>
                      ${spendAmount.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
