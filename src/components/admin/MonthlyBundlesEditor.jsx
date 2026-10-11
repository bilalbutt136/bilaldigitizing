'use client';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../services/supabaseService';
import { MONTHLY_DESIGN_LIMITS, MONTHLY_SERVICES, normalizeMonthlyBundleConfig } from '../../utils/monthlyBundles';
import { Save, RefreshCw, CalendarDays, CheckCircle2 } from 'lucide-react';

const serviceLabel = { embroidery: 'Embroidery Digitizing', vector: 'Vector Art' };
const field = { width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0.6rem 0.7rem', borderRadius: '9px', border: '1px solid var(--color-border)', background: 'var(--color-input)', color: 'var(--color-text-primary)', fontSize: '0.84rem' };

export default function MonthlyBundlesEditor() {
  const [plans, setPlans] = useState(normalizeMonthlyBundleConfig(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/monthly-bundles?admin=1', { headers: await getAuthHeaders(), cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load monthly plans.');
      setPlans(normalizeMonthlyBundleConfig({ plans: body.plans }));
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const update = (id, prop, value) =>
    setPlans(prev => prev.map(item => item.id === id ? { ...item, [prop]: value } : item));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      for (const plan of plans) {
        if (plan.active && (!Number.isFinite(Number(plan.price)) || Number(plan.price) <= 0)) {
          throw new Error(`${serviceLabel[plan.service]} / ${plan.designs} designs: set a valid price before publishing.`);
        }
      }
      const response = await fetch('/api/monthly-bundles', {
        method: 'POST', cache: 'no-store',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ plans })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Save failed.');
      setPlans(body.plans);
      setFeedback('Saved to live database. Enabled bundles are available in the Order Desk.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ padding: '1.15rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18 }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>Monthly Design Bundles</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0.35rem 0' }}>
          Configure 10, 25, 50 and 100-design prepaid 30-day bundles separately for Embroidery and Vector Art.
          No auto-renewal or subscription charge is activated. Leave a plan disabled until pricing is ready.
          Artwork can be supplied after checkout using the order conversation.
        </p>
        <button type="button" onClick={load} disabled={loading || saving} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.45rem 0.7rem', background: 'var(--color-subtle)', color: 'var(--color-text-primary)', display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><RefreshCw size={14} /> Reload Live Prices</button>
      </div>
      {MONTHLY_SERVICES.map(service => (
        <section key={service} aria-label={serviceLabel[service]} style={{ padding: '1.1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18 }}>
          <h4 style={{ margin: '0 0 0.8rem', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 850, color: 'var(--color-text-primary)' }}><CalendarDays size={19} color="var(--color-primary)" /> {serviceLabel[service]}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 245px), 1fr))', gap: '0.8rem' }}>
            {MONTHLY_DESIGN_LIMITS.map(count => {
              const plan = plans.find(item => item.service === service && item.designs === count);
              if (!plan) return null;
              return <div key={plan.id} style={{ padding: '0.9rem', borderRadius: 14, border: plan.active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-background)', display: 'grid', gap: '0.65rem', color: 'var(--color-text-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong>{count} designs / 30 days</strong>
                  <label style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={Boolean(plan.active)} onChange={e=> update(plan.id, 'active', e.target.checked)} /> Publish
                  </label>
                </div>
                <label style={{ display: 'grid', gap: 4, fontSize: '0.77rem', fontWeight: 700 }}>Bundle price (USD)
                  <input type="number" min="0.01" max="100000" step="0.01" placeholder="Set price" style={field} value={plan.price ?? ''} onChange={e=>update(plan.id,'price',e.target.value)} />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: '0.77rem', fontWeight: 700 }}>Plan title
                  <input type="text" maxLength={80} style={field} value={plan.title} onChange={e=>update(plan.id,'title',e.target.value)} />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: '0.77rem', fontWeight: 700 }}>Short description (optional)
                  <input type="text" maxLength={180} style={field} placeholder="e.g. Priority studio support" value={plan.description} onChange={e=>update(plan.id,'description',e.target.value)} />
                </label>
              </div>;
            })}
          </div>
        </section>
      ))}
      {error && <p role="alert" style={{ margin: 0, color: 'var(--color-error-text, #b91c1c)' }}>{error}</p>}
      {feedback && <p role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, color: 'var(--color-success, #059669)', fontWeight: 750 }}><CheckCircle2 size={17}/>{feedback}</p>}
      <button type="submit" disabled={loading || saving} style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center', background: 'linear-gradient(115deg, #1d4ed8, #4338ca)', color: '#fff', padding: '0.8rem 1.4rem', borderRadius: 10, fontWeight: 850, border: 'none', cursor: saving ? 'wait' : 'pointer' }}><Save size={17}/>{saving ? 'Publishing...' : 'Save Monthly Plans'}</button>
    </form>
  );
}
