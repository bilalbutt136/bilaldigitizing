'use client';

import React from 'react';
import {
  ArrowRight,
  Building2,
  CreditCard,
  Mail,
  PlusCircle,
  Settings2,
  ShieldCheck,
  User,
  Wallet
} from 'lucide-react';

function getInitials(user) {
  const name = String(user?.name || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }
  const email = String(user?.email || '').trim();
  return (email[0] || 'C').toUpperCase();
}

const DetailRow = React.memo(function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="customer-profile-detail-row">
      <div className="customer-profile-detail-icon" aria-hidden="true">
        <Icon size={17} />
      </div>
      <div className="customer-profile-detail-copy">
        <span>{label}</span>
        <strong title={value}>{value || 'Not provided'}</strong>
      </div>
    </div>
  );
});

function CustomerProfilePanel({
  user,
  walletBalance = 0,
  onDeposit,
  onNewOrder,
  onOpenSettings
}) {
  const safeBalance = Number(walletBalance);
  const balance = Number.isFinite(safeBalance) ? safeBalance : 0;

  return (
    <section className="customer-profile-shell" aria-labelledby="customer-profile-title">
      <div className="customer-profile-hero">
        <div className="customer-profile-avatar" aria-hidden="true">
          {getInitials(user)}
        </div>

        <div className="customer-profile-identity">
          <div className="customer-profile-kicker">
            <ShieldCheck size={14} />
            Secure client account
          </div>
          <h2 id="customer-profile-title">{user?.name || 'Client account'}</h2>
          <p>{user?.email || 'Signed-in studio customer'}</p>
        </div>

        <button
          type="button"
          className="customer-profile-settings-button"
          onClick={onOpenSettings}
        >
          <Settings2 size={17} />
          <span>Preferences</span>
        </button>
      </div>

      <div className="customer-profile-grid">
        <section className="customer-profile-section-card" aria-labelledby="profile-account-heading">
          <div className="customer-profile-section-heading">
            <div>
              <span className="customer-profile-section-eyebrow">Account details</span>
              <h3 id="profile-account-heading">Profile information</h3>
            </div>
            <User size={19} aria-hidden="true" />
          </div>

          <div className="customer-profile-detail-list">
            <DetailRow
              icon={Mail}
              label="Email address"
              value={user?.email || 'Not provided'}
            />
            <DetailRow
              icon={Building2}
              label="Company / brand"
              value={user?.company || 'Not provided'}
            />
          </div>
        </section>

        <section className="customer-profile-section-card customer-profile-wallet-card" aria-labelledby="profile-wallet-heading">
          <div className="customer-profile-section-heading">
            <div>
              <span className="customer-profile-section-eyebrow">Billing</span>
              <h3 id="profile-wallet-heading">Studio wallet</h3>
            </div>
            <Wallet size={19} aria-hidden="true" />
          </div>

          <div className="customer-profile-balance">
            <span>Available credit</span>
            <strong>{'$' + balance.toFixed(2)}</strong>
            <p>Apply wallet credit securely during checkout or add funds before your next order.</p>
          </div>

          <button
            type="button"
            className="customer-profile-primary-action"
            onClick={onDeposit}
          >
            <CreditCard size={17} />
            Add wallet funds
            <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <div className="customer-profile-quick-actions">
        <div>
          <span className="customer-profile-section-eyebrow">Studio shortcut</span>
          <strong>Ready for another project?</strong>
        </div>
        <button
          type="button"
          className="customer-profile-secondary-action"
          onClick={onNewOrder}
        >
          <PlusCircle size={17} />
          New order
        </button>
      </div>
    </section>
  );
}

export default React.memo(CustomerProfilePanel);
