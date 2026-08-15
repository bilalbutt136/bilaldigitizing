'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  FolderPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Upload, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  PenTool, 
  Tag, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  X,
  Maximize2
} from 'lucide-react';
import { savePortfolioItemViaApi, deletePortfolioItemViaApi } from '../../services/supabaseService';

const CATEGORY_OPTIONS = [
  { value: 'Embroidery', label: 'Embroidery Digitizing', icon: Layers, color: '#f97316' },
  { value: 'Vector Art', label: 'Vector Art Conversion', icon: PenTool, color: '#06b6d4' },
  { value: 'Custom Patches', label: 'Custom Patches', icon: Tag, color: '#a855f7' }
];

export const PortfolioManager = () => {
  const { portfolioSamples = [], setPortfolioSamples, showToast, resetAllData } = useAppState();

  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);

  // Form state for Modal
  const [formState, setFormState] = useState({
    id: '',
    title: '',
    category: 'Embroidery',
    description: '',
    digitized_image: '',
    original_image: '',
    stitch_count: '',
    colors: '',
    formats: 'DST, PES, EMB',
    client_type: 'Apparel & Uniform Brand',
    sort_order: 0,
    is_active: true
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormState({
      id: `port-${Date.now()}`,
      title: '',
      category: selectedCategoryTab === 'all' ? 'Embroidery' : (
        selectedCategoryTab === 'embroidery' ? 'Embroidery' :
        selectedCategoryTab === 'vector' ? 'Vector Art' : 'Custom Patches'
      ),
      description: '',
      digitized_image: '',
      original_image: '',
      stitch_count: '12,500 Stitches',
      colors: 'Standard Thread Colors',
      formats: 'DST, PES, EMB, EXP',
      client_type: 'Commercial Client',
      sort_order: (portfolioSamples || []).length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormState({
      id: item.id,
      title: item.title || '',
      category: item.category || 'Embroidery',
      description: item.description || '',
      digitized_image: item.digitized_image || item.digitizedImage || item.afterImg || item.image || '',
      original_image: item.original_image || item.originalImage || item.beforeImg || '',
      stitch_count: item.stitch_count || item.stitchCount || '',
      colors: item.colors || '',
      formats: typeof item.formats === 'string' ? item.formats : (Array.isArray(item.formats) ? item.formats.join(', ') : 'DST, PES, EMB'),
      client_type: item.client_type || item.clientType || 'Commercial Client',
      sort_order: Number(item.sort_order) || 0,
      is_active: item.is_active !== false
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (file, isBefore = false) => {
    if (!file) return;
    if (isBefore) setIsUploadingBefore(true);
    else setIsUploadingMain(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'portfolio-gallery');

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.url || data.secure_url) {
        const uploadedUrl = data.secure_url || data.url;
        if (isBefore) {
          setFormState(prev => ({ ...prev, original_image: uploadedUrl }));
        } else {
          setFormState(prev => ({ ...prev, digitized_image: uploadedUrl }));
        }
        showToast('Image uploaded successfully!', 'success');
      } else {
        throw new Error(data.error || 'Upload returned no URL');
      }
    } catch (err) {
      console.error('Portfolio image upload error:', err);
      showToast('Image upload failed: ' + err.message, 'error');
    } finally {
      if (isBefore) setIsUploadingBefore(false);
      else setIsUploadingMain(false);
    }
  };

  const handleSaveModal = async (e) => {
    if (e) e.preventDefault();
    if (!formState.title.trim()) {
      showToast('Please enter a project title', 'error');
      return;
    }
    if (!formState.digitized_image.trim()) {
      showToast('Please upload or provide a finished design image', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formState,
        sort_order: Number(formState.sort_order) || 0
      };

      const result = await savePortfolioItemViaApi(payload);
      if (result.success || result.data) {
        showToast(`Portfolio item "${formState.title}" saved successfully!`, 'success');
        
        // Update local StateContext
        if (setPortfolioSamples) {
          setPortfolioSamples(prev => {
            const list = [...(prev || [])];
            const index = list.findIndex(p => p.id === formState.id);
            if (index >= 0) {
              list[index] = payload;
            } else {
              list.unshift(payload);
            }
            return list;
          });
        }
        setIsModalOpen(false);
      } else {
        showToast('Failed to save portfolio item: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Save portfolio item error:', err);
      showToast('Error saving portfolio item: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    const updated = { ...item, is_active: item.is_active === false ? true : false };
    const result = await savePortfolioItemViaApi(updated);
    if (result.success || result.data) {
      showToast(`Item "${item.title}" ${updated.is_active ? 'enabled' : 'hidden'}`, 'success');
      if (setPortfolioSamples) {
        setPortfolioSamples(prev => prev.map(p => p.id === item.id ? updated : p));
      }
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}" from the portfolio?`)) return;

    try {
      const result = await deletePortfolioItemViaApi(item.id);
      if (result.success) {
        showToast(`"${item.title}" removed from portfolio`, 'success');
        if (setPortfolioSamples) {
          setPortfolioSamples(prev => prev.filter(p => p.id !== item.id));
        }
      } else {
        showToast('Failed to delete: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error deleting portfolio item: ' + err.message, 'error');
    }
  };

  const handleMoveOrder = async (item, direction) => {
    const list = [...portfolioSamples];
    const index = list.findIndex(p => p.id === item.id);
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Update order numbers
    const updated = list.map((p, i) => ({ ...p, sort_order: i + 1 }));
    if (setPortfolioSamples) setPortfolioSamples(updated);

    // Save the moved item
    await savePortfolioItemViaApi({ ...item, sort_order: targetIdx + 1 });
  };

  // Filtered items
  const filteredList = (portfolioSamples || []).filter(item => {
    const cat = (item.category || '').toLowerCase();
    const matchesTab = selectedCategoryTab === 'all' ? true : (
      selectedCategoryTab === 'embroidery' ? (cat.includes('embroid') || cat === 'general') :
      selectedCategoryTab === 'vector' ? cat.includes('vector') :
      selectedCategoryTab === 'patches' ? cat.includes('patch') : true
    );
    const matchesSearch = searchQuery.trim() === '' ? true : (
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.formats || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--orange-500)' }} /> Portfolio & Work Gallery Manager
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Manage showcase sew-outs, vector art redraws, and custom patches displayed on the public gallery and homepage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={resetAllData}
            title="Refresh database records"
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} /> Refresh Gallery
          </button>

          <button
            type="button"
            className="btn btn-primary-orange btn-sm"
            onClick={openAddModal}
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Add Portfolio Project
          </button>
        </div>
      </div>

      {/* 2. Category Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Works', count: (portfolioSamples || []).length },
            { id: 'embroidery', label: 'Embroidery Digitizing', count: (portfolioSamples || []).filter(p => (p.category || '').toLowerCase().includes('embroid') || p.category === 'general').length },
            { id: 'vector', label: 'Vector Art Conversion', count: (portfolioSamples || []).filter(p => (p.category || '').toLowerCase().includes('vector')).length },
            { id: 'patches', label: 'Custom Patches', count: (portfolioSamples || []).filter(p => (p.category || '').toLowerCase().includes('patch')).length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategoryTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                background: selectedCategoryTab === tab.id ? '#ffffff' : 'transparent',
                color: selectedCategoryTab === tab.id ? 'var(--orange-600)' : 'var(--navy-700)',
                fontWeight: selectedCategoryTab === tab.id ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: selectedCategoryTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: selectedCategoryTab === tab.id ? 'var(--orange-500)' : '#cbd5e1',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* 3. Portfolio Projects Grid */}
      {filteredList.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#ffffff', border: '1.5px dashed var(--border-color)', borderRadius: '16px' }}>
          <FolderPlus size={44} style={{ color: 'var(--orange-500)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            No Portfolio Projects Found
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            {searchQuery ? 'No results matched your search query.' : 'Click below to publish your first embroidery sew-out or vector art project to the live gallery.'}
          </p>
          <button
            type="button"
            className="btn btn-primary-orange btn-md"
            onClick={openAddModal}
            style={{ fontWeight: 800, margin: '0 auto' }}
          >
            <Plus size={16} /> Add First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredList.map((item, idx) => {
            const displayImg = item.digitized_image || item.digitizedImage || item.afterImg || item.image || item.original_image || '';
            const isCatVector = (item.category || '').toLowerCase().includes('vector');
            const isCatPatch = (item.category || '').toLowerCase().includes('patch');
            const badgeColor = isCatVector ? '#06b6d4' : isCatPatch ? '#a855f7' : '#f97316';
            const badgeBg = isCatVector ? 'rgba(6, 182, 212, 0.12)' : isCatPatch ? 'rgba(168, 85, 247, 0.12)' : 'rgba(249, 115, 22, 0.12)';

            return (
              <div
                key={item.id || idx}
                className="card"
                style={{
                  background: item.is_active !== false ? '#ffffff' : '#f8fafc',
                  border: item.is_active !== false ? '1.5px solid var(--border-color)' : '1.5px dashed #cbd5e1',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: item.is_active !== false ? 1 : 0.75,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  {/* Image Container with Preview */}
                  <div style={{ position: 'relative', width: '100%', height: '210px', background: '#090d16', overflow: 'hidden' }}>
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        No Image
                      </div>
                    )}

                    {/* Category Pill Over Image */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`,
                        backdropFilter: 'blur(8px)',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        {item.category || 'Embroidery'}
                      </span>
                    </div>

                    {/* Active Status Over Image */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        style={{
                          background: item.is_active !== false ? 'rgba(16, 185, 129, 0.9)' : 'rgba(100, 116, 139, 0.9)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backdropFilter: 'blur(6px)'
                        }}
                        title={item.is_active !== false ? 'Click to hide from website' : 'Click to publish on website'}
                      >
                        {item.is_active !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{item.is_active !== false ? 'Live' : 'Hidden'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.4rem', lineHeight: 1.3 }}>
                      {item.title || 'Untitled Project'}
                    </h3>

                    {item.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.85rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                    )}

                    {/* Tech specs tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {item.stitch_count && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          ⚡ {item.stitch_count}
                        </span>
                      )}
                      {item.formats && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          📁 {typeof item.formats === 'string' ? item.formats : Array.isArray(item.formats) ? item.formats.join(', ') : ''}
                        </span>
                      )}
                      {item.original_image && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          ✓ Includes Before Art
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(item, 'up')}
                      style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                      title="Move Up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredList.length - 1}
                      onClick={() => handleMoveOrder(item, 'down')}
                      style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: idx === filteredList.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === filteredList.length - 1 ? 0.3 : 1 }}
                      title="Move Down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditModal(item)}
                      style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.35rem 0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                      title="Delete Project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. ADD / EDIT MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
                  {editingItem ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Provide artwork image, category, specifications, and descriptions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Category Selector */}
              <div>
                <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.4rem' }}>
                  Project Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {CATEGORY_OPTIONS.map(opt => {
                    const isSelected = formState.category === opt.value;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormState(prev => ({ ...prev, category: opt.value }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          padding: '0.75rem 0.5rem',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                          background: isSelected ? `${opt.color}15` : '#ffffff',
                          color: isSelected ? opt.color : 'var(--navy-800)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <IconComp size={16} />
                        <span>{opt.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.title}
                  onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 3D Puff Raised Cap Logo Digitizing"
                  required
                />
              </div>

              {/* Finished Production Image (Required) */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                  Finished Design / Sew-Out Image *
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  The primary high-resolution finished sew-out or vector image.
                </p>

                {formState.digitized_image && (
                  <div style={{ width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', background: '#090d16', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <img src={formState.digitized_image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <label style={{ flex: 1, margin: 0 }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], false);
                        }
                      }}
                    />
                    <span className="btn btn-outline btn-sm" style={{ width: '100%', background: '#ffffff', color: 'var(--orange-600)', borderColor: 'var(--orange-500)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      {isUploadingMain ? <RefreshCw size={14} className="spin-icon" /> : <Upload size={14} />}
                      <span>{isUploadingMain ? 'Uploading...' : 'Upload Image File'}</span>
                    </span>
                  </label>

                  <input
                    type="url"
                    className="form-control"
                    placeholder="Or paste direct image URL..."
                    value={formState.digitized_image}
                    onChange={(e) => setFormState(prev => ({ ...prev, digitized_image: e.target.value }))}
                    style={{ flex: 1.5, fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              {/* Optional Raw Artwork / Before Image */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                  Original Artwork / Before Image (Optional)
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  If provided, visitors can inspect the raw artwork versus digitized production.
                </p>

                {formState.original_image && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', background: '#090d16', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <img src={formState.original_image} alt="Before Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <label style={{ flex: 1, margin: 0 }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], true);
                        }
                      }}
                    />
                    <span className="btn btn-outline btn-sm" style={{ width: '100%', background: '#ffffff', color: 'var(--navy-700)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      {isUploadingBefore ? <RefreshCw size={14} className="spin-icon" /> : <Upload size={14} />}
                      <span>{isUploadingBefore ? 'Uploading...' : 'Upload Original Art'}</span>
                    </span>
                  </label>

                  <input
                    type="url"
                    className="form-control"
                    placeholder="Or paste original art URL..."
                    value={formState.original_image}
                    onChange={(e) => setFormState(prev => ({ ...prev, original_image: e.target.value }))}
                    style={{ flex: 1.5, fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                  Project Description
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formState.description}
                  onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Clean 3D puff embroidery pathing with foam underlay and zero thread breaks."
                />
              </div>

              {/* Specifications Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                    Stitch Count / Complexity
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.stitch_count}
                    onChange={(e) => setFormState(prev => ({ ...prev, stitch_count: e.target.value }))}
                    placeholder="e.g. 14,500 Stitches"
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                    Deliverable Formats
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.formats}
                    onChange={(e) => setFormState(prev => ({ ...prev, formats: e.target.value }))}
                    placeholder="e.g. DST, PES, EMB, SVG"
                  />
                </div>
              </div>

              {/* Client Type & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                    Application / Client Type
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.client_type}
                    onChange={(e) => setFormState(prev => ({ ...prev, client_type: e.target.value }))}
                    placeholder="e.g. Sports Apparel Brand"
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                    Display Status
                  </label>
                  <select
                    className="form-control"
                    value={formState.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormState(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="true">Published & Live</option>
                    <option value="false">Hidden / Draft</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary-orange btn-md"
                  style={{ fontWeight: 800, minWidth: '160px' }}
                >
                  {isSaving ? 'Saving Project...' : editingItem ? 'Save Changes' : 'Publish Project'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PortfolioManager;
