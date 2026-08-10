'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Image, 
  Upload, 
  Copy, 
  Check, 
  Trash2, 
  Search,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchMediaAssetsFromSupabase, uploadMediaAssetToSupabaseStorage } from '../../services/supabaseService';

export const MediaLibraryManager = () => {
  const { showToast } = useAppState();
  const [mediaAssets, setMediaAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMediaAssetsFromSupabase();
      setMediaAssets(data || []);
    } catch (err) {
      console.warn('Failed to load media assets from Supabase:', err);
      showToast('Could not load live media assets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const uploaded = await uploadMediaAssetToSupabaseStorage(file, 'media-gallery');
        if (uploaded) {
          uploadedCount++;
          setMediaAssets(prev => [{
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: uploaded.name,
            category: 'Uploaded Asset',
            url: uploaded.url,
            size: uploaded.size,
            createdAt: new Date().toISOString()
          }, ...prev]);
        }
      } catch (err) {
        console.error('Error uploading file to storage:', err);
      }
    }

    setIsUploading(false);
    if (uploadedCount > 0) {
      showToast(`Successfully uploaded ${uploadedCount} image(s) to Supabase Storage!`, 'success');
    } else {
      showToast('File upload failed. Please check network or file format.', 'error');
    }
  };

  const handleCopyUrl = (id, url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedId(id);
    showToast('Image URL copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteAsset = (idToDelete) => {
    if (!window.confirm('Remove this image asset from gallery view?')) return;
    setMediaAssets(prev => prev.filter(item => item.id !== idToDelete));
    showToast('Image asset removed from view', 'info');
  };

  const categories = ['all', 'Portfolio Before', 'Portfolio After', 'Uploaded Asset'];

  const filteredAssets = mediaAssets.filter(asset => {
    const matchesCat = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (asset.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & File Upload Dropzone */}
      <div className="card" style={{ padding: '1.75rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image size={22} style={{ color: '#ff7a00' }} /> Media & Studio Image Assets Gallery
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Live Supabase Storage assets, sew-out proofs, hero graphics, and portfolio media.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-outline btn-sm" 
              onClick={loadAssets} 
              disabled={isLoading}
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>

            <label className="btn btn-primary-orange btn-sm" style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? 'Uploading...' : 'Upload to Storage'}
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                disabled={isUploading}
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
            </label>
          </div>
        </div>

        {/* Search & Filter Control Bar */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search images by name or category..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.3rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary-orange' : 'btn-outline'}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Image Grid */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#ff7a00' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading media assets from Supabase...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <Image size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>No Media Assets Found</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            Upload artwork files and sew-outs directly into Supabase Storage using the upload button above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              className="card"
              style={{ 
                padding: '0.9rem', 
                background: '#ffffff', 
                border: '1px solid var(--border-color)', 
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div 
                  style={{ 
                    height: '150px', 
                    borderRadius: '10px', 
                    overflow: 'hidden', 
                    background: '#f8fafc',
                    position: 'relative',
                    marginBottom: '0.75rem',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPreviewImage(asset)}
                >
                  <img 
                    src={asset.url} 
                    alt={asset.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease' }} 
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                  <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(15,23,42,0.75)', color: '#ffffff', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                    {asset.category}
                  </span>
                </div>

                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--navy-950)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                  Size: {asset.size || 'Web Format'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  onClick={() => handleCopyUrl(asset.id, asset.url)}
                >
                  {copiedId === asset.id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                  {copiedId === asset.id ? 'Copied!' : 'Copy URL'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteAsset(asset.id)}
                  style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}
                  title="Remove from View"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)', zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setPreviewImage(null)}>
          <div style={{ maxWidth: '650px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '1.25rem', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy-900)' }}>{previewImage.name}</span>
              <button type="button" onClick={() => setPreviewImage(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '420px', display: 'flex', justifyContent: 'center', background: '#0f172a' }}>
              <img src={previewImage.url} alt={previewImage.name} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary-orange btn-sm" onClick={() => handleCopyUrl(previewImage.id, previewImage.url)}>
                Copy Image URL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
