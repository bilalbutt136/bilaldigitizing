'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Save, MoveRight } from 'lucide-react';

const DEFAULT_TICKER = Object.freeze({
  enabled: false,
  autoSync: false,
  badge: 'STUDIO NEWS',
  text: '',
  linkText: 'Explore Services',
  linkUrl: '/order',
  theme: 'navy',
  promoCode: '',
  showCodeBadge: false,
  showCountdown: false
});

const THEMES = [
  { value: 'navy', label: 'Premium Navy' },
  { value: 'orange', label: 'Studio Blue' },
  { value: 'royal', label: 'Royal Purple' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'crimson', label: 'Crimson' }
];

export default function RunningTickerEditor({ siteSettings, updateSiteSettings, showToast }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_TICKER, ...(siteSettings?.announcement || {}),
    enabled: siteSettings?.announcement?.enabled === true
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      ...DEFAULT_TICKER, ...(siteSettings?.announcement || {}),
      enabled: siteSettings?.announcement?.enabled === true
    });
  }, [siteSettings?.announcement]);

  const change = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const field = {
    width: '100%', minHeight: 40, boxSizing: 'border-box', padding: '0.55rem 0.7rem',
    borderRadius: 9, border: '1px solid var(--color-border, #cbd5e1)',
    background: 'var(--color-background, #fff)', color: 'var(--color-text-primary, #0f172a)', font: 'inherit'
  };
  const label = {
    fontWeight: 750, fontSize: '0.78rem', color: 'var(--color-text-primary, #0f172a)',
    display: 'grid', gap: '0.3rem'
  };

  const save = async event => {
    event.preventDefault();
    if (saving) return;
    const text = String(draft.text || '').trim().slice(0, 240);
    const linkUrl = String(draft.linkUrl || '/order').trim();
    if (draft.enabled && !draft.autoSync && !text) {
      showToast?.('Enter announcement text, or choose automatic live discount text.', 'error');
      return;
    }
    if (!linkUrl.startsWith('/') || linkUrl.startsWith('//') || /[\\\s]/.test(linkUrl)) {
      showToast?.('Use an internal website link such as /order.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateSiteSettings({
        announcement: {
          enabled: draft.enabled === true,
          autoSync: draft.autoSync === true,
          badge: String(draft.badge || '').trim().slice(0, 40),
          text,
          linkText: String(draft.linkText || '').trim().slice(0, 55),
          linkUrl,
          theme: draft.theme,
          promoCode: '',
          showCodeBadge: false,
          showCountdown: false
        }
      });
      showToast?.(draft.enabled ? 'Top running line is now ON.' : 'Top running line is OFF. VIP banner stays unchanged.', 'success');
    } catch (error) {
      console.error('Could not update ticker:', error);
      showToast?.('Could not update the top line. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Top running announcement editor" style={{
      padding: '1.2rem', border: '1px solid var(--color-border, #cbd5e1)',
      borderRadius: 16, background: 'var(--color-surface, #fff)',
      display: 'grid', gap: '0.8rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 900, fontSize: '0.7rem' }}>
            <Megaphone size={16} /> HEADER DISPLAY CONTROL
          </div>
          <h3 style={{ fontSize: '1.12rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: '0.35rem 0' }}>
            Top Running Line (Ticker)
          </h3>
        </div>
        <span style={{
          fontSize: '0.72rem', fontWeight: 850,
          background: draft.enabled ? '#dcfce7' : '#e2e8f0',
          color: draft.enabled ? '#166534' : '#334155',
          borderRadius: 999, padding: '0.35rem 0.7rem'
        }}>
          {draft.enabled ? 'ON after saving' : 'OFF after saving'}
        </span>
      </div>
      <p style={{ margin: 0, color: 'var(--color-text-secondary, #64748b)', fontSize: '0.81rem', lineHeight: 1.5 }}>
        This is the moving line above the navigation, <strong>not</strong> the VIP discount banner.
        Turn it off without pausing the actual offer or hiding the VIP banner. You can switch it back on whenever you like.
      </p>
      <form onSubmit={save} style={{ display: 'grid', gap: '0.9rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.86rem', fontWeight: 850, color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.enabled} onChange={event => change('enabled', event.target.checked)}
            style={{ width: 19, height: 19, accentColor: '#047857' }} />
          Show the running top line
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.81rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.autoSync === true} onChange={event => change('autoSync', event.target.checked)}
            style={{ width: 17, height: 17, accentColor: '#2563eb' }} />
          Automatically show rates from the active discount campaign
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 235px), 1fr))', gap: '0.8rem' }}>
          <label style={label}>Short badge text
            <input style={field} maxLength={40} value={draft.badge || ''} onChange={e => change('badge', e.target.value)} placeholder="STUDIO NEWS" />
          </label>
          <label style={label}>Background style
            <select style={field} value={draft.theme || 'navy'} onChange={e => change('theme', e.target.value)}>
              {THEMES.map(theme => <option key={theme.value} value={theme.value}>{theme.label}</option>)}
            </select>
          </label>
          <label style={label}>Action button text
            <input style={field} maxLength={55} value={draft.linkText || ''} onChange={e => change('linkText', e.target.value)} placeholder="Explore Services" />
          </label>
          <label style={label}>Action button link
            <input style={field} maxLength={150} value={draft.linkUrl || ''} onChange={e => change('linkUrl', e.target.value)} placeholder="/order" />
          </label>
        </div>
        <label style={label}>Custom moving text {draft.autoSync && '(saved for when automatic text is off)'}
          <textarea rows={2} maxLength={240} style={{ ...field, resize: 'vertical', minHeight: 65 }}
            value={draft.text || ''} onChange={e => change('text', e.target.value)}
            placeholder="e.g. New designs accepted daily · Fast turnaround · Free revisions" />
        </label>
        <button type="submit" disabled={saving} style={{
          justifySelf: 'start', border: 0, padding: '0.63rem 1rem',
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          background: draft.enabled ? '#047857' : '#1d4ed8', color: '#fff', borderRadius: 9,
          fontWeight: 850, cursor: saving ? 'wait' : 'pointer', minHeight: 43, opacity: saving ? 0.7 : 1
        }}>
          {saving ? <MoveRight size={16} /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Top Line Settings'}
        </button>
      </form>
    </section>
  );
}
