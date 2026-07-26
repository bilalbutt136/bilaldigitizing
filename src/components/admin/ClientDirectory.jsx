import React from 'react';
import { useAppState } from '../../context/StateContext';
import { Building2, Mail, Award, DollarSign, FileText } from 'lucide-react';

export const ClientDirectory = () => {
  const { clients } = useAppState();

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-900)' }}>
            Registered Embroidery Shops & Apparel Brands
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Client directory, volume metrics, and custom pricing tier assignments.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
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
            {clients.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} style={{ color: 'var(--orange-600)' }} />
                    {c.company}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.id}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ color: 'var(--navy-900)' }}>{c.contact}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${c.tier.includes('VIP') ? 'badge-completed' : 'badge-assigned'}`}>
                    {c.tier}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                  {c.totalOrders} jobs
                </td>
                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--green-600)' }}>
                  ${c.totalSpent.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
