'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '../../../src/context/StateContext';
import { supabase } from '../../../src/lib/supabase/client';
import { ArrowLeft, UploadCloud, Trash2, Image as ImageIcon, Save, RefreshCw } from 'lucide-react';
import { upsertPortfolioItems } from '../../../src/services/supabaseService';

export function PortfolioUploaderClient() {
  const router = useRouter();
  const { isAuthenticated, isAuthInitialized, authUser, showToast } = useAppState();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!isAuthInitialized) return;
    
    const isMasterAdmin = isAuthenticated && authUser?.role === 'admin';
    if (!isMasterAdmin) {
      router.replace('/secure-admin-login');
      return;
    }
    
    fetchPortfolioItems();
  }, [isAuthInitialized, isAuthenticated, authUser, router]);

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      showToast('Error loading portfolio items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target.result);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !category || !file) {
      showToast('Please fill all fields and select an image.', 'warning');
      return;
    }

    try {
      setSaving(true);
      showToast('Uploading image to Supabase Storage...', 'info');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      showToast('Saving to database...', 'info');
      
      const newItem = {
        id: `port-${Date.now()}`,
        title,
        category,
        original_image: publicUrl,
        digitized_image: publicUrl, // For backward compatibility with existing components
        description: 'Uploaded via Admin Direct Uploader'
      };

      const res = await upsertPortfolioItems([newItem]);
      if (!res) throw new Error('Database insert failed.');

      showToast('Portfolio item successfully added!', 'success');
      
      setTitle('');
      setCategory('');
      setFile(null);
      setPreview(null);
      
      fetchPortfolioItems();
      
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error uploading portfolio item.', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      setLoading(true);
      // Try to delete from storage if it's from our bucket
      if (imageUrl && imageUrl.includes('portfolio-images')) {
        const path = imageUrl.split('portfolio-images/')[1];
        if (path) {
          await supabase.storage.from('portfolio-images').remove([path]);
        }
      }
      
      const { error } = await supabase.from('portfolio').delete().eq('id', id);
      if (error) throw error;
      
      showToast('Item deleted successfully', 'success');
      fetchPortfolioItems();
    } catch (err) {
      showToast('Error deleting item: ' + err.message, 'error');
      setLoading(false);
    }
  };

  if (!isAuthInitialized || (!isAuthenticated && loading)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <RefreshCw size={24} className="spin-icon" style={{ color: 'var(--orange-500)' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <button 
              onClick={() => router.push('/admin-portal')} 
              className="btn btn-outline btn-sm" 
              style={{ marginBottom: '1rem', border: 'none', background: 'transparent', padding: 0, color: 'var(--navy-600)' }}
            >
              <ArrowLeft size={16} /> Back to Operations Desk
            </button>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ImageIcon size={28} color="var(--orange-500)" />
              Direct Portfolio Uploader
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Upload high-resolution images directly to Supabase Storage.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Upload Form */}
          <div className="card" style={{ padding: '2rem', alignSelf: 'start' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 800 }}>Upload New Item</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 3D Puff Cap"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-control"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category...</option>
                  <option value="Embroidery Digitizing">Embroidery Digitizing</option>
                  <option value="Vector Art Conversion">Vector Art Conversion</option>
                  <option value="Custom Patches">Custom Patches</option>
                </select>
              </div>
              <div className="form-group">
                <label>Image File</label>
                <label className="btn btn-outline" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center', borderStyle: 'dashed', borderWidth: '2px', padding: '2rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <UploadCloud size={24} color="var(--navy-400)" />
                    <span style={{ color: 'var(--navy-600)', fontWeight: 600 }}>{file ? file.name : 'Select Image to Upload'}</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} required />
                </label>
              </div>
              
              {preview && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                </div>
              )}
              
              <button type="submit" className="btn btn-primary-orange" disabled={saving || !file} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {saving ? <><RefreshCw size={18} className="spin-icon" /> Uploading...</> : <><Save size={18} /> Upload \u0026 Save</>}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="card" style={{ padding: '2rem', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 800 }}>Live Portfolio</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw className="spin-icon" size={24} style={{ color: 'var(--navy-400)' }} />
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No portfolio items found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {items.map(item => (
                  <div key={item.id} style={{ background: '#fff', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <img 
                      src={item.digitized_image || item.original_image} 
                      alt={item.title} 
                      style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.category}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id, item.digitized_image || item.original_image)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.35rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
