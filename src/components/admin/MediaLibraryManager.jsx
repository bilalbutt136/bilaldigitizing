'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Image, 
  Upload, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Sparkles,
  Layers,
  Search,
  Filter,
  Eye,
  FileCode
} from 'lucide-react';

const INITIAL_MEDIA_ASSETS = [
  { id: 'img-1', name: 'Golden Eagle Polo Stitchout', category: 'Portfolio After', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', size: '1.2 MB' },
  { id: 'img-2', name: 'Golden Eagle Vector Original', category: 'Portfolio Before', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', size: '840 KB' },
  { id: 'img-3', name: 'Cybernetics 3D Puff Cap', category: '3D Foam Cap', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80', size: '1.5 MB' },
  { id: 'img-4', name: 'Vintage Skull Vector Artwork', category: 'Vector Tracing', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', size: '920 KB' },
  { id: 'img-5', name: 'Vintage Skull AI Vector Trace', category: 'Vector Tracing', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', size: '650 KB' },
  { id: 'img-6', name: 'Tactical Merrowed Embroidered Patch', category: 'Patches', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80', size: '1.8 MB' }
];

export const MediaLibraryManager = () => {
  const { showToast } = useAppState();
  const [mediaAssets, setMediaAssets] = useState(() => {
    if (typeof window === 'undefined') return INITIAL_MEDIA_ASSETS;
    try {
      const saved = localStorage.getItem('bdigi_media_assets');
      return saved ? JSON.parse(saved) : INITIAL_MEDIA_ASSETS;
    } catch {
      return INITIAL_MEDIA_ASSETS;
    }
  });

  const [copiedId, setCopiedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const saveMediaAssets = (newList) => {
    setMediaAssets(newList);
    try {
      localStorage.setItem('bdigi_media_assets', JSON.stringify(newList));
    } catch (_) {}
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAsset = {
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            category: 'Uploaded Asset',
            url: event.target.result,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          };
          saveMediaAssets([newAsset, ...mediaAssets]);
          showToast(`Uploaded "${file.name}" to Media Gallery!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });
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
    if (!window.confirm('Delete this image asset from Media Gallery?')) return;
    const nextList = mediaAssets.filter(item => item.id !== idToDelete);
    saveMediaAssets(nextList);
    showToast('Image asset removed', 'info');
  };

  const categories = ['all', 'Portfolio Before', 'Portfolio After', '3D Foam Cap', 'Vector Tracing', 'Patches', 'Uploaded Asset'];

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
              Upload and manage artwork samples, sew-out proof photos, hero banners, and service graphics.
            </p>
          </div>

          <label className="btn btn-primary-orange" style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
            <Upload size={17} /> Upload New Images
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
          </label>
        </div>

        {/* Search & Filter Control Bar */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search images by name or tag..." 
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
                title="Delete Image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

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
