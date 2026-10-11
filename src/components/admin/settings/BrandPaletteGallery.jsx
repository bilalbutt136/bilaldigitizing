'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, Paintbrush, Save, Sun, Moon } from 'lucide-react';
import { THEME_PRESETS } from '../../../utils/themePresets';
import ThemePreviewCard from '../../common/ThemePreviewCard';

export default function BrandPaletteGallery({ siteSettings, updateSiteSettings, showToast }) {
  const savedId = THEME_PRESETS.some(p => p.id === siteSettings?.themePreset)
    ? siteSettings.themePreset : 'studio-orange';
  const savedFinish = siteSettings?.themeFinish === 'solid' ? 'solid' : 'gradient';
  const [selectedId, setSelectedId] = useState(savedId);
  const [selectedFinish, setSelectedFinish] = useState(savedFinish);
  const [previewMode, setPreviewMode] = useState('light');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedId(savedId);
    setSelectedFinish(savedFinish);
  }, [savedId, savedFinish]);

  const selected = THEME_PRESETS.find(p => p.id === selectedId) || THEME_PRESETS[0];
  const pending = selectedId !== savedId || selectedFinish !== savedFinish || Boolean(siteSettings?.customBrandColors);

  const save = async () => {
    if (saving || !pending) return;
    setSaving(true);
    try {
      await updateSiteSettings({
        themePreset: selected.id,
        themeFinish: selectedFinish,
        customBrandColors: null
      });
      showToast(selected.name + ' (' + selectedFinish + ') applied to the entire website.', 'success');
    } catch (err) {
      showToast(err?.message || 'Could not save theme. Please retry.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" aria-labelledby="brand-palette-heading" style={{
      padding: 'clamp(1rem, 2.5vw, 1.75rem)', borderRadius: 20,
      border: '1px solid var(--color-border)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start', flexWrap:'wrap', marginBottom:16 }}>
        <div style={{ maxWidth:660 }}>
          <div style={{ display:'flex', gap:9, alignItems:'center' }}>
            <Paintbrush size={22} color="var(--color-primary)" aria-hidden="true" />
            <h3 id="brand-palette-heading" style={{ margin:0, color:'var(--color-text-primary)', fontSize:'1.25rem' }}>
              Premium Brand Color Library
            </h3>
          </div>
          <p style={{ fontSize:'.86rem', color:'var(--color-text-secondary)', lineHeight:1.6, margin:'7px 0 0' }}>
            8 hand-picked brand identities. Each works in solid or gradient style, with matching light and dark colors.
            Choose a preview, then Apply to Website. No change is published until you save.
          </p>
        </div>
        <span style={{ fontWeight:850, fontSize:'.8rem', color:'var(--color-primary)',
          background:'var(--color-primary-light)', padding:'8px 12px', borderRadius:999 }}>
          Live: {THEME_PRESETS.find(p=>p.id===savedId)?.name} · {savedFinish}
        </span>
      </div>

      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:17 }}>
        <fieldset style={{ border:'none', padding:0, margin:0 }}>
          <legend style={{ fontSize:'.76rem', color:'var(--color-text-muted)', fontWeight:800, marginBottom:5 }}>BUTTON STYLE</legend>
          <div style={{ display:'flex', gap:5 }}>
            {['solid','gradient'].map(f => (
              <button type="button" key={f} onClick={()=>setSelectedFinish(f)}
                aria-pressed={selectedFinish===f} style={{ padding:'9px 15px', fontWeight:800,
                  background:selectedFinish===f?'var(--color-primary)':'var(--color-subtle)',
                  color:selectedFinish===f?'var(--color-primary-text)':'var(--color-text-primary)',
                  border:'1px solid var(--color-border)', borderRadius:9, cursor:'pointer' }}>
                {f==='solid'?'Solid Color':'Gradient'}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset style={{ border:'none', padding:0, margin:0 }}>
          <legend style={{ fontSize:'.76rem', color:'var(--color-text-muted)', fontWeight:800, marginBottom:5 }}>PREVIEW MOOD (not published)</legend>
          <div style={{ display:'flex', gap:5 }}>
            {[['light',Sun],['dark',Moon]].map(([m, Icon]) => (
              <button type="button" key={m} onClick={()=>setPreviewMode(m)}
                aria-pressed={previewMode===m} style={{
                  padding:'9px 13px', display:'flex', gap:6, alignItems:'center', fontWeight:800,
                  background:previewMode===m?'var(--color-primary-light)':'var(--color-subtle)',
                  color:'var(--color-text-primary)', border:previewMode===m?'1px solid var(--color-primary)':'1px solid var(--color-border)',
                  borderRadius:9, cursor:'pointer'
                }}><Icon size={15}/>{m==='light'?'Light':'Dark'}</button>
            ))}
          </div>
        </fieldset>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap:14 }}>
        {THEME_PRESETS.map(preset=> (
          <div key={preset.id} style={{ position:'relative', minWidth:0 }}>
            <ThemePreviewCard themePreset={preset} isSelected={selectedId===preset.id}
              mode={previewMode} finish={selectedFinish} onSelect={setSelectedId}/>
            {preset.id===savedId && (
              <span style={{ position:'absolute', bottom:9, right:14, display:'flex', gap:4, alignItems:'center',
                fontSize:'.72rem', fontWeight:850, color:'var(--color-text-primary)',
                background:'var(--color-surface)', border:'1px solid var(--color-border)',
                borderRadius:999, padding:'3px 8px' }}>
                <CheckCircle2 size={13}/> Live
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap',
        gap:12, marginTop:18, padding:'14px 16px', borderRadius:13,
        background:'var(--color-subtle)', border:'1px solid var(--color-border)' }}>
        <div style={{ minWidth:0 }}>
          <strong style={{color:'var(--color-text-primary)'}}>{selected.name} · {selectedFinish==='solid'?'Solid':'Gradient'}</strong>
          <div style={{color:'var(--color-text-secondary)',fontSize:'.78rem',marginTop:3}}>
            {pending?'Preview selected — website is unchanged until you apply.':'This brand combination is live on the website.'}
          </div>
        </div>
        <button type="button" onClick={save} disabled={!pending || saving}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'var(--color-primary)', color:'var(--color-primary-text)', border:0,
            borderRadius:11, padding:'12px 19px', fontWeight:850,
            cursor:pending&&!saving?'pointer':'not-allowed', opacity:!pending||saving?.58:1 }}>
          {saving?<Sparkles size={16}/>:<Save size={16}/>}
          {saving?'Saving…':'Apply to Website'}
        </button>
      </div>
    </section>
  );
}
