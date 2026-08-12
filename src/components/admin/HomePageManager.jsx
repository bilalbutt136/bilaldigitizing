'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Save, Image as ImageIcon, CheckCircle2, RefreshCw, Plus, Trash2, LayoutTemplate } from 'lucide-react';
import { uploadFileToSupabaseStorage, upsertHeroContent, updateHomePageSettingsInSupabase, upsertHomePageTableRow, deleteHomePageTableRow } from '../../services/supabaseService';

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'embroidery', label: 'Embroidery' },
  { id: 'vector-art', label: 'Vector Art' },
  { id: 'patches', label: 'Patches' }
];

const ICONS_LIST = [
  'Star', 'Globe', 'Clock', 'ShieldCheck', 'HeartHandshake', 'Award', 'Zap', 'TrendingUp', 'ThumbsUp', 'CheckCircle2', 'Tag', 'Upload', 'Layers', 'Cpu', 'Download', 'Sparkles', 'FileCheck', 'Truck', 'PenTool', 'Palette', 'MousePointer2', 'RefreshCw', 'Headset', 'Shield'
];

export const HomePageManager = () => {
  const { heroSlides, homePageConfig, showToast, resetAllData } = useAppState();
  const [activeTab, setActiveTab] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  // Local state for the forms
  const [heroForm, setHeroForm] = useState({
    id: null,
    headline: '',
    subtitle: '',
    description: '',
    primaryCta: '',
    primaryAction: '',
    secondaryCta: '',
    secondaryAction: '',
    previewTitle: '',
    previewBefore: '',
    previewAfter: '',
    previewTag: '',
    previewTagAfter: '',
    is_active: true,
    stats: []
  });

  const [workflowForm, setWorkflowForm] = useState([]);
  const [trustFeaturesForm, setTrustFeaturesForm] = useState([]);
  
  const [whyForm, setWhyForm] = useState({
    why_title: '',
    why_sub: ''
  });

  const [filesToUpload, setFilesToUpload] = useState({});

  // Sync from global state when tab changes or data reloads
  useEffect(() => {
    // 1. Hero Content
    const targetKey = activeTab === 'patches' ? 'patch' : activeTab;
    const existingHero = heroSlides?.find(s => s.id?.toLowerCase()?.includes(targetKey) || s.service_key?.toLowerCase()?.includes(targetKey));
    
    // Parse showcase metadata from trust_points or use defaults
    let showcaseMeta = {};
    if (existingHero?.trust_points && Array.isArray(existingHero.trust_points) && existingHero.trust_points.length > 0) {
      if (typeof existingHero.trust_points[0] === 'object') {
        showcaseMeta = existingHero.trust_points[0];
      }
    }

    setHeroForm({
      id: existingHero?.id || `hero-${activeTab}`,
      headline: existingHero?.title || '',
      subtitle: existingHero?.highlight || '',
      description: existingHero?.description || '',
      primaryCta: existingHero?.primary_cta || 'Get Started',
      primaryAction: existingHero?.primary_btn_action || '/order',
      secondaryCta: existingHero?.secondary_cta || 'View Pricing',
      secondaryAction: existingHero?.secondary_btn_action || '/services',
      previewTitle: showcaseMeta.previewTitle || 'Professional Results',
      previewBefore: showcaseMeta.previewBefore || '',
      previewAfter: existingHero?.banner_image || '',
      previewTag: showcaseMeta.previewTag || 'Before',
      previewTagAfter: showcaseMeta.previewTagAfter || 'After',
      stats: showcaseMeta.stats || [
        { value: '1,200+', label: 'Clients', icon: 'Star' },
        { value: '45+', label: 'Countries', icon: 'Globe' },
        { value: '4-Hr', label: 'Express', icon: 'Clock' },
        { value: '100%', label: 'Guaranteed', icon: 'ShieldCheck' }
      ],
      is_active: existingHero?.is_active !== false,
      service_key: targetKey
    });

    // 2. Why Choose Us Title/Subtext (we will save as why_title_embroidery, etc.)
    const dbSettings = homePageConfig?.settings || {};
    setWhyForm({
      why_title: dbSettings[`why_title_${activeTab}`] || dbSettings.why_title || '',
      why_sub: dbSettings[`why_sub_${activeTab}`] || dbSettings.why_sub || ''
    });

    // 3. Workflow Steps
    const currentKeyForWorkflow = activeTab === 'patches' ? 'patch' : activeTab === 'vector-art' ? 'vector' : activeTab;
    const rawWorkflowSteps = homePageConfig?.workflowSteps || [];
    let matchedSteps = rawWorkflowSteps.filter(s => s.service === currentKeyForWorkflow).sort((a, b) => a.sort_order - b.sort_order);
    
    setWorkflowForm(matchedSteps);

    // 4. Trust Features (Why Choose Us grid)
    // Try to load existing trust features from site_settings (assuming it's managed via site_config or a specific table)
    // For now we will store trust features globally in site_config for simplicity, or per category if needed.
    // The existing WhyChooseUs.jsx pulls from homePageConfig?.trustFeatures
    let rawTrustFeatures = homePageConfig?.trustFeatures || [];
    let matchedFeatures = rawTrustFeatures.filter(s => s.service_key === activeTab || (!s.service_key && activeTab === 'all')).sort((a, b) => a.sort_order - b.sort_order);
    if (matchedFeatures.length === 0 && activeTab === 'all') {
      matchedFeatures = [
        { id: 'temp-1', icon: 'Award', title: '15+ Years Experience', description: 'Decades of expertise handling complex designs for global brands.', sort_order: 1, is_active: true, service_key: activeTab },
        { id: 'temp-2', icon: 'MousePointer2', title: '100% Manual Digitizing', description: 'No auto-tracing. Every stitch and node is manually plotted for perfection.', sort_order: 2, is_active: true, service_key: activeTab }
      ];
    }
    setTrustFeaturesForm(matchedFeatures);

  }, [activeTab, heroSlides, homePageConfig]);

  const handleHeroChange = (field, value) => setHeroForm(prev => ({ ...prev, [field]: value }));
  const handleWhyChange = (field, value) => setWhyForm(prev => ({ ...prev, [field]: value }));

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilesToUpload(prev => ({ ...prev, [field]: file }));
      // Create local preview immediately
      handleHeroChange(field, URL.createObjectURL(file));
    }
  };

  const handleAddWorkflowStep = () => {
    const currentKeyForWorkflow = activeTab === 'patches' ? 'patch' : activeTab === 'vector-art' ? 'vector' : activeTab;
    setWorkflowForm(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        service: currentKeyForWorkflow,
        step_number: prev.length + 1,
        title: '',
        description: '',
        icon: 'CheckCircle2',
        sort_order: prev.length + 1,
        is_active: true
      }
    ]);
  };

  const updateWorkflowStep = (idx, field, value) => {
    setWorkflowForm(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRemoveWorkflowStep = async (idx) => {
    const step = workflowForm[idx];
    if (step.id && !step.id.toString().startsWith('temp-')) {
      const res = await deleteHomePageTableRow('workflow_steps', step.id);
      if (!res.success) {
        showToast('Failed to delete workflow step from database', 'error');
        return;
      }
    }
    setWorkflowForm(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddTrustFeature = () => {
    setTrustFeaturesForm(prev => [
      ...prev,
      {
        id: `temp-feat-${Date.now()}`,
        icon: 'Star',
        title: '',
        description: '',
        sort_order: prev.length + 1,
        is_active: true,
        service_key: activeTab
      }
    ]);
  };

  const updateTrustFeature = (idx, field, value) => {
    setTrustFeaturesForm(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRemoveTrustFeature = async (idx) => {
    // For now we assume they are saved as a JSON array in site_config under 'trust_features' or in a table.
    // If they are in a table `trust_features`:
    const feature = trustFeaturesForm[idx];
    if (feature.id && !feature.id.toString().startsWith('temp-')) {
      const res = await deleteHomePageTableRow('trust_features', feature.id);
      if (res && !res.success) {
        // If it fails, maybe they are just JSON. We'll proceed with local delete anyway
        console.warn('Could not delete from table, might be json only', res);
      }
    }
    setTrustFeaturesForm(prev => prev.filter((_, i) => i !== idx));
  };


  const handleSave = async () => {
    setIsSaving(true);
    showToast('Saving Home Page Content...', 'info');

    try {
      // 1. Upload any pending images for the Hero Section
      let finalBeforeUrl = heroForm.previewBefore;
      let finalAfterUrl = heroForm.previewAfter;

      if (filesToUpload.previewBefore) {
        finalBeforeUrl = await uploadFileToSupabaseStorage(filesToUpload.previewBefore, 'portfolio-images', 'showcase');
        if (!finalBeforeUrl) throw new Error("Failed to upload Before Image. Please check your storage settings.");
      }
      if (filesToUpload.previewAfter) {
        finalAfterUrl = await uploadFileToSupabaseStorage(filesToUpload.previewAfter, 'portfolio-images', 'showcase');
        if (!finalAfterUrl) throw new Error("Failed to upload After Image. Please check your storage settings.");
      }

      // 2. Save Hero Content
      const heroDbPayload = {
        id: heroForm.id,
        service_key: heroForm.service_key,
        title: heroForm.headline,
        highlight: heroForm.subtitle,
        description: heroForm.description,
        primary_cta: heroForm.primaryCta,
        primary_btn_action: heroForm.primaryAction,
        secondary_cta: heroForm.secondaryCta,
        secondary_btn_action: heroForm.secondaryAction,
        banner_image: finalAfterUrl,
        is_active: heroForm.is_active,
        trust_points: [{
          previewTitle: heroForm.previewTitle,
          previewBefore: finalBeforeUrl,
          previewTag: heroForm.previewTag,
          previewTagAfter: heroForm.previewTagAfter,
          stats: heroForm.stats
        }]
      };
      
      const res1 = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsertTableRow', payload: { table: 'hero_slides', data: heroDbPayload } })
      });
      
      if (!res1.ok) {
         await upsertHeroContent([heroDbPayload]);
      }

      // 3. Save Settings (Why Choose Us titles)
      const settingsPayload = [
        { key: `why_title_${activeTab}`, value: whyForm.why_title },
        { key: `why_sub_${activeTab}`, value: whyForm.why_sub },
        // Also save generic ones if 'all' is selected to ensure fallback
        ...(activeTab === 'all' ? [
          { key: 'why_title', value: whyForm.why_title },
          { key: 'why_sub', value: whyForm.why_sub }
        ] : [])
      ];
      await updateHomePageSettingsInSupabase(settingsPayload);

      // 4. Save Trust Features to table
      for (const feat of trustFeaturesForm) {
        const featPayload = { ...feat, service_key: feat.service_key || activeTab };
        if (featPayload.id && featPayload.id.toString().startsWith('temp-')) {
          delete featPayload.id;
        }
        await upsertHomePageTableRow('trust_features', featPayload);
      }

      // 4. Save Workflow Steps
      for (const step of workflowForm) {
        const stepPayload = { ...step };
        if (stepPayload.id && stepPayload.id.toString().startsWith('temp-')) {
          delete stepPayload.id;
        }
        await upsertHomePageTableRow('workflow_steps', stepPayload);
      }

      showToast(`Successfully saved content for ${CATEGORIES.find(c => c.id === activeTab).label}`, 'success');
      setFilesToUpload({});
      resetAllData(); // Force refresh global state
    } catch (err) {
      console.error(err);
      showToast('Error saving content: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--orange-50)', color: 'var(--orange-500)', padding: '0.65rem', borderRadius: '10px' }}>
          <LayoutTemplate size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>Home Page CMS</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Edit Homepage sections specifically for each service category.</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === cat.id ? 'var(--navy-900)' : '#f1f5f9',
              color: activeTab === cat.id ? '#ffffff' : 'var(--navy-600)',
              fontWeight: activeTab === cat.id ? 700 : 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        {/* LEFT COLUMN: HERO SECTION */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Hero Section</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Headline (Supports HTML)</label>
              <textarea 
                className="form-input" 
                rows={2}
                value={heroForm.headline || ''}
                onChange={e => handleHeroChange('headline', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Subtitle (Supports HTML)</label>
              <textarea 
                className="form-input" 
                rows={2}
                value={heroForm.subtitle || ''}
                onChange={e => handleHeroChange('subtitle', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={heroForm.description || ''}
                onChange={e => handleHeroChange('description', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Primary Button Text</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={heroForm.primaryCta || ''}
                  onChange={e => handleHeroChange('primaryCta', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Primary Button Action</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={heroForm.primaryAction || ''}
                  onChange={e => handleHeroChange('primaryAction', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Secondary Button Text</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={heroForm.secondaryCta || ''}
                  onChange={e => handleHeroChange('secondaryCta', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Secondary Button Action</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={heroForm.secondaryAction || ''}
                  onChange={e => handleHeroChange('secondaryAction', e.target.value)}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-800)', marginTop: '1rem' }}>Hero Statistics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {heroForm.stats && heroForm.stats.map((stat, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Value (e.g. 1,200+)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={stat.value || ''}
                      onChange={(e) => {
                        const newStats = [...heroForm.stats];
                        newStats[idx].value = e.target.value;
                        handleHeroChange('stats', newStats);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Label (e.g. Clients)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={stat.label || ''}
                      onChange={(e) => {
                        const newStats = [...heroForm.stats];
                        newStats[idx].label = e.target.value;
                        handleHeroChange('stats', newStats);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Icon</label>
                    <select 
                      className="form-input"
                      value={stat.icon || 'Star'}
                      onChange={(e) => {
                        const newStats = [...heroForm.stats];
                        newStats[idx].icon = e.target.value;
                        handleHeroChange('stats', newStats);
                      }}
                    >
                      {ICONS_LIST.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-800)', marginTop: '1rem' }}>Showcase Image (Before/After)</h4>
            
            <div className="form-group">
              <label>Showcase Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={heroForm.previewTitle || ''}
                onChange={e => handleHeroChange('previewTitle', e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>Before Image</label>
                {heroForm.previewBefore ? (
                  <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <img src={heroForm.previewBefore} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '120px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', color: '#94a3b8' }}>
                    <ImageIcon size={24} />
                  </div>
                )}
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={e => handleFileChange(e, 'previewBefore')} style={{ fontSize: '0.8rem' }} />
                <input 
                  type="text" 
                  placeholder="Before Tag (e.g. Low Res)" 
                  className="form-input" 
                  style={{ marginTop: '0.5rem', padding: '0.4rem', fontSize: '0.8rem' }}
                  value={heroForm.previewTag || ''}
                  onChange={e => handleHeroChange('previewTag', e.target.value)}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.5rem' }}>After Image</label>
                {heroForm.previewAfter ? (
                  <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <img src={heroForm.previewAfter} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '120px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', color: '#94a3b8' }}>
                    <ImageIcon size={24} />
                  </div>
                )}
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={e => handleFileChange(e, 'previewAfter')} style={{ fontSize: '0.8rem' }} />
                <input 
                  type="text" 
                  placeholder="After Tag (e.g. Vectorized)" 
                  className="form-input" 
                  style={{ marginTop: '0.5rem', padding: '0.4rem', fontSize: '0.8rem' }}
                  value={heroForm.previewTagAfter || ''}
                  onChange={e => handleHeroChange('previewTagAfter', e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: WHY CHOOSE US / WORKFLOW */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Why Choose Us (Grid & Workflow)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Section Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={whyForm.why_title || ''}
                onChange={e => handleWhyChange('why_title', e.target.value)}
                placeholder="e.g. How It Works & Why Choose Us"
              />
            </div>
            
            <div className="form-group">
              <label>Section Subtext</label>
              <textarea 
                className="form-input" 
                rows={2}
                value={whyForm.why_sub || ''}
                onChange={e => handleWhyChange('why_sub', e.target.value)}
                placeholder="e.g. Industry-leading quality, unmatched speed..."
              />
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '1rem' }}>Trust Grid Features</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {trustFeaturesForm.map((feat, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button 
                  onClick={() => handleRemoveTrustFeature(idx)}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Feature Title</label>
                    <input type="text" className="form-input" style={{ padding: '0.4rem' }} value={feat.title || ''} onChange={e => updateTrustFeature(idx, 'title', e.target.value)} />
                  </div>
                  <div style={{ width: '120px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Icon</label>
                    <select className="form-input" style={{ padding: '0.4rem' }} value={feat.icon || 'Star'} onChange={e => updateTrustFeature(idx, 'icon', e.target.value)}>
                      {ICONS_LIST.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Description</label>
                  <textarea className="form-input" rows={2} style={{ padding: '0.4rem' }} value={feat.description || ''} onChange={e => updateTrustFeature(idx, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button 
              onClick={handleAddTrustFeature}
              className="btn btn-outline" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Add Grid Feature
            </button>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '1rem' }}>Workflow Steps</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workflowForm.map((step, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button 
                  onClick={() => handleRemoveWorkflowStep(idx)}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Step Title</label>
                    <input type="text" className="form-input" style={{ padding: '0.4rem' }} value={step.title || ''} onChange={e => updateWorkflowStep(idx, 'title', e.target.value)} />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Icon</label>
                    <select className="form-input" style={{ padding: '0.4rem' }} value={step.icon || 'CheckCircle2'} onChange={e => updateWorkflowStep(idx, 'icon', e.target.value)}>
                      {ICONS_LIST.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                  <div style={{ width: '60px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Order</label>
                    <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={step.sort_order || 0} onChange={e => updateWorkflowStep(idx, 'sort_order', parseInt(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Description</label>
                  <textarea className="form-input" rows={2} style={{ padding: '0.4rem' }} value={step.description || ''} onChange={e => updateWorkflowStep(idx, 'description', e.target.value)} />
                </div>
              </div>
            ))}

            <button 
              onClick={handleAddWorkflowStep}
              className="btn btn-outline" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Add Workflow Step
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn btn-primary-orange btn-lg" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px', justifyContent: 'center' }}
        >
          {isSaving ? <RefreshCw size={18} className="spin-icon" /> : <Save size={18} />}
          {isSaving ? 'Saving...' : `Save ${CATEGORIES.find(c => c.id === activeTab).label} Content`}
        </button>
      </div>

    </div>
  );
};
