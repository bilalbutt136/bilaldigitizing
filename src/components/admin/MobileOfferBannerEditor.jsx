'use client';

import React, { useEffect, useState } from 'react';
import { BadgePercent, Save } from 'lucide-react';
import { DEFAULT_MOBILE_OFFER_BANNER, getActiveMobileOffer } from '../../utils/mobileOffer';

const FIELDS = [
  ['eyebrow', 'Small label', 35],
  ['headline', 'Main headline', 90],
  ['description', 'Supporting text', 160],
  ['ctaText', 'Button text', 50]
];

export default function MobileOfferBannerEditor({ siteSettings, updateSiteSettings, showToast }) {
  const [draft, setDraft] = useState(() => ({ ...DEFAULT_MOBILE_OFFER_BANNER, ...(siteSettings?.mobileOfferBanner || {}) }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...DEFAULT_MOBILE_OFFER_BANNER, ...(siteSettings?.mobileOfferBanner || {}) });
  }, [siteSettings?.mobileOfferBanner]);

  const activeOffer = getActiveMobileOffer({ ...siteSettings, mobileOfferBanner: { enabled: true } });
  const canDisplay = draft.enabled && Boolean(activeOffer);

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;
    const next = { enabled: draft.enabled === true };
    for (const [key, , maxLength] of FIELDS) {
      next[key] = String(draft[key] || '').trim().slice(0, maxLength);
      if (!next[key]) {
        showToast?.('Please complete all banner text fields.', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await updateSiteSettings({ mobileOfferBanner: next });
      showToast?.('Mobile offer banner saved to live site settings.', 'success');
    } catch (error) {
      console.error('Could not save mobile offer banner:', error);
      showToast?.('Could not save the banner. Please retry.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.64rem 0.72rem', minHeight: 42,
    boxSizing: 'border-box', border: '1px solid var(--color-border)',
    borderRadius: '9px', background: 'var(--color-background, #fff)',
    color: 'var(--color-text-primary, #0f172a)', font: 'inherit'
  };

  return (
    <section aria-label="Mobile discount banner editor" style={{
      background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)',
      borderRadius: '16px', padding: '1.25rem', display: 'grid', gap: '1rem'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          <BadgePercent size={17} /> VIP OFFER DISPLAY
        </div>
        <h3 style={{ fontSize: '1.16rem', fontWeight: 900, margin: '0.35rem 0', color: 'var(--color-text-primary)' }}>VIP Discount Banner (Mobile + Desktop)</h3>
        <p style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.55 }}>
          Edit the VIP banner on mobile and desktop. This switch does not affect the moving top line. Its percentage follows your active live discount campaign.
        </p>
      </div>
      <form onSubmit={handleSave} style={{ display: 'grid', gap: '0.8rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '0.86rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.enabled === true} onChange={e => setDraft(current => ({ ...current, enabled: e.target.checked }))} style={{ width: 19, height: 19, accentColor: '#059669' }} />
          Show VIP banner when a promotion is active
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.8rem' }}>
          {FIELDS.map(([key, label, maxLength]) => (
            <label key={key} style={{ display: 'grid', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 750, color: 'var(--color-text-primary)' }}>
              {label}
              <input type="text" maxLength={maxLength} value={draft[key] || ''} onChange={e => setDraft(current => ({ ...current, [key]: e.target.value }))} required style={inputStyle} />
            </label>
          ))}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)' }}>Compact mobile preview</div>
        <div style={{
          maxWidth: '390px', boxSizing: 'border-box',
          background: 'linear-gradient(112deg, #111b31 0%, #223054 62%, #0c5147 100%)',
          border: '1px solid rgba(214,181,107,0.4)', borderRadius: '13px',
          padding: '0.7rem 0.75rem', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', color: '#f5d992' }}>♛ {draft.eyebrow}</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, marginTop: '0.3rem', lineHeight: 1.2, overflowWrap: 'anywhere' }}>{draft.headline}</div>
            <div style={{ fontSize: '0.67rem', color: '#cbd5e1', marginTop: '0.24rem' }}>{draft.description}</div>
          </div>
          <div style={{
            flexShrink: 0, width: '105px', textAlign: 'center', boxSizing: 'border-box',
            background: 'linear-gradient(155deg, #fff7df 0%, #f4d88e 100%)',
            color: '#182439', borderRadius: '10px', padding: '0.4rem 0.3rem', fontWeight: 900
          }}>
            <div style={{ fontSize: '0.58rem' }}>UP TO</div>
            <div style={{ fontSize: '1.18rem', whiteSpace: 'nowrap' }}>{activeOffer ? activeOffer.percent : '—'}% OFF</div>
            <div style={{ fontSize: '0.62rem', overflowWrap: 'anywhere' }}>{draft.ctaText} ↗</div>
          </div>
        </div>
        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: canDisplay ? '#059669' : 'var(--color-text-secondary)' }}>
          {canDisplay ? 'Ready to show while this live promotion remains active.' : draft.enabled ? 'Banner hidden until you activate a valid promotion in Promotions Manager.' : 'Banner is switched off.'}
        </div>
        <button type="submit" disabled={saving} style={{
          justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          minHeight: 42, padding: '0.6rem 1rem', border: 'none', borderRadius: '9px',
          background: '#047857', color: '#fff', fontWeight: 850, cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.65 : 1
        }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save VIP Banner'}
        </button>
      </form>
    </section>
  );
}
