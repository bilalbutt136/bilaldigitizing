import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Check, Loader2, RefreshCw } from 'lucide-react';

export const HomePageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [settings, setSettings] = useState({});
  const [trustStats, setTrustStats] = useState([]);
  const [trustFeatures, setTrustFeatures] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [pricingStaticCards, setPricingStaticCards] = useState([]);

  // Modal State for Editing Rows
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState('');
  const [editingData, setEditingData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/homepage');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSettings(data.settings || {});
      setTrustStats(data.trustStats || []);
      setTrustFeatures(data.trustFeatures || []);
      setWorkflowSteps(data.workflowSteps || []);
      setPricingStaticCards(data.pricingStaticCards || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch Home Page configuration. Make sure you have executed the cms_migrations.sql script in your Supabase SQL Editor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (keysToSave) => {
    try {
      setSaving(true);
      const payload = keysToSave.map(k => ({ key: k, value: settings[k] || '' }));
      
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateSettings', payload })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      showSuccess("Settings saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleStatChange = (index, field, value, listName = 'trustStats') => {
    if (listName === 'trustStats') {
      const updated = [...trustStats];
      updated[index][field] = value;
      setTrustStats(updated);
    } else if (listName === 'trustFeatures') {
      const updated = [...trustFeatures];
      updated[index][field] = value;
      setTrustFeatures(updated);
    } else if (listName === 'workflowSteps') {
      const updated = [...workflowSteps];
      updated[index][field] = value;
      setWorkflowSteps(updated);
    } else if (listName === 'pricingStaticCards') {
      const updated = [...pricingStaticCards];
      updated[index][field] = value;
      setPricingStaticCards(updated);
    }
  };

  const handleSaveTableRow = async (row, table) => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsertTableRow', payload: { table, data: row } })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showSuccess(`${table} row saved!`);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTableRow = (table) => {
    if (table === 'trust_stats') {
      setTrustStats([...trustStats, { label: 'New Stat', value: '100', icon: 'Star', sort_order: trustStats.length }]);
    } else if (table === 'trust_features') {
      setTrustFeatures([...trustFeatures, { title: 'New Feature', description: 'Description', icon: 'Check', is_active: true, sort_order: trustFeatures.length }]);
    } else if (table === 'workflow_steps') {
      setWorkflowSteps([...workflowSteps, { service: 'embroidery', step_number: workflowSteps.length + 1, title: 'New Step', description: 'Desc', icon: 'Check', is_active: true, sort_order: workflowSteps.length }]);
    } else if (table === 'pricing_static_cards') {
      setPricingStaticCards([...pricingStaticCards, { service: 'embroidery', title: 'New Service', subtitle: 'Starts $10', price: '$10.00', features: ['Feature 1', 'Feature 2'], highlight_color: false, is_active: true, sort_order: pricingStaticCards.length }]);
    }
  };

  const deleteTableRow = async (id, table) => {
    if (!id || !confirm("Are you sure?")) return;
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteTableRow', payload: { table, id } })
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (table, rowData) => {
    setEditingTable(table);
    setEditingData({ ...rowData });
    setEditModalOpen(true);
  };

  const handleModalSave = () => {
    if (editingData) {
      handleSaveTableRow(editingData, editingTable);
    }
    setEditModalOpen(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} color="var(--orange-500)" /></div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>Home Page Editor</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>Modify live content on the public home page.</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} /><div>{error}</div>
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #34d399', color: '#047857', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Check size={20} />{successMsg}
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--orange-500)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Hero Section</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Main Title</label>
            <input type="text" value={settings.hero_title || ''} onChange={e => handleSettingChange('hero_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Rotating Texts (Comma Separated)</label>
            <input type="text" value={settings.hero_rotating_texts || ''} onChange={e => handleSettingChange('hero_rotating_texts', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
               <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge 1</label>
               <input type="text" value={settings.hero_badge_1 || ''} onChange={e => handleSettingChange('hero_badge_1', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
               <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge 2</label>
               <input type="text" value={settings.hero_badge_2 || ''} onChange={e => handleSettingChange('hero_badge_2', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['hero_title', 'hero_rotating_texts', 'hero_badge_1', 'hero_badge_2'])} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Hero Text
            </button>
          </div>
        </div>
      </div>

      {/* --- TRUST STATS SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Trust Stats (The 4 numbers below Hero)</h3>
          <button onClick={() => addTableRow('trust_stats')} style={{ background: 'var(--orange-50)', color: 'var(--orange-600)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Add Stat
          </button>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
          {trustStats.map((stat, i) => (
            <div key={stat.id || i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Label</label>
                  <input type="text" value={stat.label} onChange={e => handleStatChange(i, 'label', e.target.value, 'trustStats')} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Value</label>
                  <input type="text" value={stat.value} onChange={e => handleStatChange(i, 'value', e.target.value, 'trustStats')} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.2rem' }}>
                <button onClick={() => handleSaveTableRow(stat, 'trust_stats')} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                {stat.id && (
                  <button onClick={() => deleteTableRow(stat.id, 'trust_stats')} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- WHY CHOOSE US SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Why Choose Us (Trust Features)</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
              <input type="text" value={settings.why_title || ''} onChange={e => handleSettingChange('why_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle</label>
              <input type="text" value={settings.why_sub || ''} onChange={e => handleSettingChange('why_sub', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['why_title', 'why_sub'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Titles</button>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0 }}>Feature Cards</h4>
              <button onClick={() => addTableRow('trust_features')} style={{ background: 'var(--orange-50)', color: 'var(--orange-600)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <Plus size={16} /> Add Feature
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {trustFeatures.map((feat, i) => (
                <div key={feat.id || i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Title</label>
                      <input type="text" value={feat.title} onChange={e => handleStatChange(i, 'title', e.target.value, 'trustFeatures')} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Description</label>
                      <input type="text" value={feat.description} onChange={e => handleStatChange(i, 'description', e.target.value, 'trustFeatures')} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.2rem' }}>
                    <button onClick={() => handleSaveTableRow(feat, 'trust_features')} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                    {feat.id && (
                      <button onClick={() => deleteTableRow(feat.id, 'trust_features')} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- TESTIMONIALS & FAQS SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Testimonials & FAQs Headers</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>*Content is managed in Studio Content</span>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Testimonials Title</label>
              <input type="text" value={settings.testimonials_title || ''} onChange={e => handleSettingChange('testimonials_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Testimonials Subtitle</label>
              <textarea value={settings.testimonials_sub || ''} onChange={e => handleSettingChange('testimonials_sub', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>FAQ Title</label>
              <input type="text" value={settings.faq_title || ''} onChange={e => handleSettingChange('faq_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>FAQ Subtitle</label>
              <textarea value={settings.faq_sub || ''} onChange={e => handleSettingChange('faq_sub', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['testimonials_title', 'testimonials_sub', 'faq_title', 'faq_sub'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Headers</button>
          </div>
        </div>
      </div>

      {/* --- PRICING SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Pricing Settings & Static Cards</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>*Dynamic packages are managed in Studio Content</span>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge Text</label>
            <input type="text" value={settings.pricing_badge || ''} onChange={e => handleSettingChange('pricing_badge', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title (All Services)</label>
              <input type="text" value={settings.pricing_title_all || ''} onChange={e => handleSettingChange('pricing_title_all', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle (All Services)</label>
              <textarea value={settings.pricing_sub_all || ''} onChange={e => handleSettingChange('pricing_sub_all', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title (Specific Category)</label>
              <input type="text" value={settings.pricing_title_cat || ''} onChange={e => handleSettingChange('pricing_title_cat', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle (Specific Category)</label>
              <textarea value={settings.pricing_sub_cat || ''} onChange={e => handleSettingChange('pricing_sub_cat', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button onClick={() => handleSaveSettings(['pricing_badge', 'pricing_title_all', 'pricing_sub_all', 'pricing_title_cat', 'pricing_sub_cat'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Headers</button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Static Pricing Cards (Shown on "All" tab)</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem' }}>Service</th>
                    <th style={{ padding: '0.75rem' }}>Title</th>
                    <th style={{ padding: '0.75rem' }}>Price</th>
                    <th style={{ padding: '0.75rem' }}>Features</th>
                    <th style={{ padding: '0.75rem' }}>Sort</th>
                    <th style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingStaticCards.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>{item.service}</td>
                      <td style={{ padding: '0.75rem' }}>{item.title}</td>
                      <td style={{ padding: '0.75rem' }}>{item.price}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{Array.isArray(item.features) ? item.features.join(', ') : ''}</td>
                      <td style={{ padding: '0.75rem' }}>{item.sort_order}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--orange-600)' }}><Edit2 size={16}/></button>
                        <button onClick={() => deleteTableRow(item.id, 'pricing_static_cards')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'red', marginLeft: '0.5rem' }}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addTableRow('pricing_static_cards')} style={{ marginTop: '1rem', background: 'var(--orange-50)', color: 'var(--orange-600)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px dashed var(--orange-300)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Plus size={16} /> Add Static Card
            </button>
          </div>
        </div>
      </div>

      {/* --- FINAL CTA SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Final CTA Section</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge Text (e.g. 🚀 Ready to Get Started?)</label>
              <input type="text" value={settings.cta_badge || ''} onChange={e => handleSettingChange('cta_badge', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Secondary Button Text (e.g. Get Free Quote)</label>
              <input type="text" value={settings.cta_secondary_btn || ''} onChange={e => handleSettingChange('cta_secondary_btn', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Embroidery Content</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
                <input type="text" value={settings.cta_emb_title || ''} onChange={e => handleSettingChange('cta_emb_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Button Text</label>
                <input type="text" value={settings.cta_emb_btn || ''} onChange={e => handleSettingChange('cta_emb_btn', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
              <textarea value={settings.cta_emb_desc || ''} onChange={e => handleSettingChange('cta_emb_desc', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Vector Content</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
                <input type="text" value={settings.cta_vector_title || ''} onChange={e => handleSettingChange('cta_vector_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Button Text</label>
                <input type="text" value={settings.cta_vector_btn || ''} onChange={e => handleSettingChange('cta_vector_btn', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
              <textarea value={settings.cta_vector_desc || ''} onChange={e => handleSettingChange('cta_vector_desc', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Patches Content</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
                <input type="text" value={settings.cta_patch_title || ''} onChange={e => handleSettingChange('cta_patch_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Button Text</label>
                <input type="text" value={settings.cta_patch_btn || ''} onChange={e => handleSettingChange('cta_patch_btn', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
              <textarea value={settings.cta_patch_desc || ''} onChange={e => handleSettingChange('cta_patch_desc', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Trust Badges (Bottom)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge 1</label>
                <input type="text" value={settings.cta_trust_badge_1 || ''} onChange={e => handleSettingChange('cta_trust_badge_1', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge 2</label>
                <input type="text" value={settings.cta_trust_badge_2 || ''} onChange={e => handleSettingChange('cta_trust_badge_2', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge 3</label>
                <input type="text" value={settings.cta_trust_badge_3 || ''} onChange={e => handleSettingChange('cta_trust_badge_3', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge 4</label>
                <input type="text" value={settings.cta_trust_badge_4 || ''} onChange={e => handleSettingChange('cta_trust_badge_4', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['cta_badge', 'cta_secondary_btn', 'cta_emb_title', 'cta_emb_desc', 'cta_emb_btn', 'cta_vector_title', 'cta_vector_desc', 'cta_vector_btn', 'cta_patch_title', 'cta_patch_desc', 'cta_patch_btn', 'cta_trust_badge_1', 'cta_trust_badge_2', 'cta_trust_badge_3', 'cta_trust_badge_4'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save CTA Content</button>
          </div>
        </div>
      </div>

      {/* --- EMBROIDERY DIGITIZING PAGE SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Embroidery Digitizing Page</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge</label>
              <input type="text" value={settings.emb_hero_badge !== undefined ? settings.emb_hero_badge : 'DEDICATED EMBROIDERY DIGITIZING STUDIO'} onChange={e => handleSettingChange('emb_hero_badge', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
              <input type="text" value={settings.emb_hero_title !== undefined ? settings.emb_hero_title : 'Custom Embroidery Digitizing Services'} onChange={e => handleSettingChange('emb_hero_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle</label>
            <textarea value={settings.emb_hero_sub !== undefined ? settings.emb_hero_sub : 'Turn your logo artwork into precise embroidery files ready for commercial production. Every design is hand-digitized with exact stitch counts, underlay pathing, and zero needle breaks.'} onChange={e => handleSettingChange('emb_hero_sub', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 1</label>
              <input type="text" value={settings.emb_hero_value_1 !== undefined ? settings.emb_hero_value_1 : 'Accurate Stitching Pathing'} onChange={e => handleSettingChange('emb_hero_value_1', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 2</label>
              <input type="text" value={settings.emb_hero_value_2 !== undefined ? settings.emb_hero_value_2 : 'Smooth Commercial Results'} onChange={e => handleSettingChange('emb_hero_value_2', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 3</label>
              <input type="text" value={settings.emb_hero_value_3 !== undefined ? settings.emb_hero_value_3 : 'All Machine Formats (.DST, .PES, .EMB)'} onChange={e => handleSettingChange('emb_hero_value_3', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Primary Button</label>
              <input type="text" value={settings.emb_hero_btn_primary !== undefined ? settings.emb_hero_btn_primary : 'Order Digitizing Design'} onChange={e => handleSettingChange('emb_hero_btn_primary', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Secondary Button</label>
              <input type="text" value={settings.emb_hero_btn_secondary !== undefined ? settings.emb_hero_btn_secondary : 'View Pricing Tiers'} onChange={e => handleSettingChange('emb_hero_btn_secondary', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Footer Note</label>
            <textarea value={settings.emb_footer_text !== undefined ? settings.emb_footer_text : 'Prices are flat rates per design with zero hidden charges. Need multiple designs? Click any tier package above to open your instant order form.'} onChange={e => handleSettingChange('emb_footer_text', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['emb_hero_badge', 'emb_hero_title', 'emb_hero_sub', 'emb_hero_value_1', 'emb_hero_value_2', 'emb_hero_value_3', 'emb_hero_btn_primary', 'emb_hero_btn_secondary', 'emb_footer_text'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Embroidery Page Text</button>
          </div>
        </div>
      </div>

      {/* --- VECTOR ART PAGE SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Vector Art Page</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge</label>
              <input type="text" value={settings.vector_hero_badge !== undefined ? settings.vector_hero_badge : 'Dedicated Vector Redraw Studio'} onChange={e => handleSettingChange('vector_hero_badge', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
              <input type="text" value={settings.vector_hero_title !== undefined ? settings.vector_hero_title : 'Custom Vector Art Conversion & Redraws'} onChange={e => handleSettingChange('vector_hero_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle</label>
            <textarea value={settings.vector_hero_sub !== undefined ? settings.vector_hero_sub : 'Transform low-resolution JPEGs, PNGs, hand-drawn sketches, or pixelated logos into 100% hand-drawn, razor-sharp scalable vector graphics (.AI, .EPS, .SVG, .PDF, .CDR).'} onChange={e => handleSettingChange('vector_hero_sub', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 1</label>
              <input type="text" value={settings.vector_hero_value_1 !== undefined ? settings.vector_hero_value_1 : 'Hand-Drawn Clean Paths'} onChange={e => handleSettingChange('vector_hero_value_1', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 2</label>
              <input type="text" value={settings.vector_hero_value_2 !== undefined ? settings.vector_hero_value_2 : '8–12 Hours Turnaround'} onChange={e => handleSettingChange('vector_hero_value_2', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 3</label>
              <input type="text" value={settings.vector_hero_value_3 !== undefined ? settings.vector_hero_value_3 : 'Unlimited Free Revisions'} onChange={e => handleSettingChange('vector_hero_value_3', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 4</label>
              <input type="text" value={settings.vector_hero_value_4 !== undefined ? settings.vector_hero_value_4 : 'Starting from $15.00'} onChange={e => handleSettingChange('vector_hero_value_4', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Primary Button</label>
              <input type="text" value={settings.vector_hero_btn_primary !== undefined ? settings.vector_hero_btn_primary : 'Order Vector Art'} onChange={e => handleSettingChange('vector_hero_btn_primary', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Secondary Button</label>
              <input type="text" value={settings.vector_hero_btn_secondary !== undefined ? settings.vector_hero_btn_secondary : 'View Pricing Tiers'} onChange={e => handleSettingChange('vector_hero_btn_secondary', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Footer Note</label>
            <textarea value={settings.vector_footer_text !== undefined ? settings.vector_footer_text : 'Prices are flat rates per design with zero hidden charges. Click any tier package above to configure your artwork.'} onChange={e => handleSettingChange('vector_footer_text', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['vector_hero_badge', 'vector_hero_title', 'vector_hero_sub', 'vector_hero_value_1', 'vector_hero_value_2', 'vector_hero_value_3', 'vector_hero_value_4', 'vector_hero_btn_primary', 'vector_hero_btn_secondary', 'vector_footer_text'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Vector Page Text</button>
          </div>
        </div>
      </div>

      {/* --- CUSTOM PATCHES PAGE SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Custom Patches Page</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge</label>
              <input type="text" value={settings.patch_hero_badge !== undefined ? settings.patch_hero_badge : 'DEDICATED CUSTOM PATCHES & EMBLEMS STUDIO'} onChange={e => handleSettingChange('patch_hero_badge', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
              <input type="text" value={settings.patch_hero_title !== undefined ? settings.patch_hero_title : 'Custom Woven, Embroidered & 3D PVC Patches'} onChange={e => handleSettingChange('patch_hero_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle</label>
            <textarea value={settings.patch_hero_sub !== undefined ? settings.patch_hero_sub : 'Turn your brand logos, insignia, and artwork into high-durability physical patches. Hand-crafted precision with factory-direct pricing starting from '} onChange={e => handleSettingChange('patch_hero_sub', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 1</label>
              <input type="text" value={settings.patch_hero_value_1 !== undefined ? settings.patch_hero_value_1 : 'Min. Order: 50 Patches'} onChange={e => handleSettingChange('patch_hero_value_1', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 2</label>
              <input type="text" value={settings.patch_hero_value_2 !== undefined ? settings.patch_hero_value_2 : 'Heavy-Duty Tactical Velcro, Heat-Seal & Sew-On'} onChange={e => handleSettingChange('patch_hero_value_2', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value 3</label>
              <input type="text" value={settings.patch_hero_value_3 !== undefined ? settings.patch_hero_value_3 : 'Free Physical Sample Photo Confirmation'} onChange={e => handleSettingChange('patch_hero_value_3', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Hero Price Tag</label>
              <input type="text" value={settings.patch_hero_price !== undefined ? settings.patch_hero_price : '$1.50'} onChange={e => handleSettingChange('patch_hero_price', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Primary Button</label>
              <input type="text" value={settings.patch_hero_btn_primary !== undefined ? settings.patch_hero_btn_primary : 'Order Custom Patches'} onChange={e => handleSettingChange('patch_hero_btn_primary', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Secondary Button</label>
              <input type="text" value={settings.patch_hero_btn_secondary !== undefined ? settings.patch_hero_btn_secondary : 'View Pricing Tiers & Materials'} onChange={e => handleSettingChange('patch_hero_btn_secondary', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Footer Note</label>
            <textarea value={settings.patch_footer_text !== undefined ? settings.patch_footer_text : 'Prices are flat rates per patch with zero hidden charges. Minimum order 50 Pcs. Click any tier package above to launch your order configuration modal.'} onChange={e => handleSettingChange('patch_footer_text', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['patch_hero_badge', 'patch_hero_title', 'patch_hero_sub', 'patch_hero_value_1', 'patch_hero_value_2', 'patch_hero_value_3', 'patch_hero_price', 'patch_hero_btn_primary', 'patch_hero_btn_secondary', 'patch_footer_text'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Custom Patches Text</button>
          </div>
        </div>
      </div>

      {/* --- LEGAL PAGES SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Legal Pages (Privacy & Terms)</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Privacy Policy Content (HTML)</label>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Paste the full HTML content for the Privacy Policy. This is required for Payment Gateway approvals.</p>
            <textarea value={settings.privacy_policy_html || ''} onChange={e => handleSettingChange('privacy_policy_html', e.target.value)} rows={12} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Terms & Conditions Content (HTML)</label>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Paste the full HTML content for the Terms and Conditions.</p>
            <textarea value={settings.terms_html || ''} onChange={e => handleSettingChange('terms_html', e.target.value)} rows={12} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['privacy_policy_html', 'terms_html'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Legal Pages</button>
          </div>
        </div>
      </div>
      {/* --- PORTFOLIO TITLES SECTION --- */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)' }}>Portfolio Preview Headers</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>*Portfolio items are managed in the main Portfolio tab</span>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Badge Text</label>
              <input type="text" value={settings.portfolio_badge || ''} onChange={e => handleSettingChange('portfolio_badge', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</label>
              <input type="text" value={settings.portfolio_title || ''} onChange={e => handleSettingChange('portfolio_title', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subtitle</label>
            <textarea value={settings.portfolio_sub || ''} onChange={e => handleSettingChange('portfolio_sub', e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => handleSaveSettings(['portfolio_badge', 'portfolio_title', 'portfolio_sub'])} disabled={saving} style={{ background: 'var(--navy-900)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Portfolio Texts</button>
          </div>
        </div>
      </div>

      {editModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem' }}>Edit {editingTable}</h3>
            
            {editingTable === 'pricing_static_cards' && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Service</label>
                    <select value={editingData.service || ''} onChange={e => setEditingData({...editingData, service: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <option value="embroidery">embroidery</option>
                      <option value="vector">vector</option>
                      <option value="patch">patch</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Title</label>
                    <input type="text" value={editingData.title || ''} onChange={e => setEditingData({...editingData, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Price Text</label>
                    <input type="text" value={editingData.price || ''} onChange={e => setEditingData({...editingData, price: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Subtitle Text</label>
                    <input type="text" value={editingData.subtitle || ''} onChange={e => setEditingData({...editingData, subtitle: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Features (comma separated)</label>
                  <textarea 
                    rows={3} 
                    value={Array.isArray(editingData.features) ? editingData.features.join(', ') : (editingData.features || '')} 
                    onChange={e => {
                      const feats = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setEditingData({...editingData, features: feats});
                    }} 
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="checkbox" checked={editingData.highlight_color || false} onChange={e => setEditingData({...editingData, highlight_color: e.target.checked})} />
                      Highlighted Color Theme
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Sort Order</label>
                    <input type="number" value={editingData.sort_order || 0} onChange={e => setEditingData({...editingData, sort_order: parseInt(e.target.value, 10)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setEditModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleModalSave} style={{ padding: '0.5rem 1rem', background: 'var(--navy-900)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
