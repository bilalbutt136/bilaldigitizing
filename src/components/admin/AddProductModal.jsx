'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { addStoreProduct, uploadFileToCloudinaryFull } from '../../services/supabaseService';
import { 
  X, 
  Package, 
  Upload, 
  Check, 
  Save
} from 'lucide-react';

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', 'Adjustable', 'Custom Shape'];

export const AddProductModal = ({ isOpen, onClose }) => {
  const { storeProducts = [], updateStoreProducts, showToast } = useAppState();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('tshirts');
  const [price, setPrice] = useState('$19.99');
  const [unit, setUnit] = useState('per piece');
  const [minQuantity, setMinQuantity] = useState(10);
  const [badge, setBadge] = useState('NEW ARRIVAL');
  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L', 'XL', '2XL']);
  const [colorsText, setColorsText] = useState('Classic Black, Navy Blue, Heather Gray');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80');
  const [description, setDescription] = useState('Premium custom embroidered apparel with high stitch density artwork.');
  const [featuresText, setFeaturesText] = useState('100% Heavyweight Cotton\nHigh stitch count embroidery\nFree digital sew-out proof\nFast 5-7 day production');
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSize = (sz) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes(prev => prev.filter(s => s !== sz));
    } else {
      setSelectedSizes(prev => [...prev, sz]);
    }
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setIsUploading(true);
      const uploadedImage = await uploadFileToCloudinaryFull(file, 'media-gallery', 'store-products');
      setIsUploading(false);
      
      if (uploadedImage) {
        setImage(uploadedImage.url);
      } else {
        showToast('Image upload failed. Please try again.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showToast('Please enter a product title', 'warning');
      return;
    }

    const newProd = {
      id: `store-${Date.now()}`,
      category: category,
      title: title.trim(),
      price: price.trim() || '$15.00',
      unit: unit.trim() || 'per piece',
      minQuantity: parseInt(minQuantity, 10) || 1,
      badge: badge.trim() || 'NEW',
      status: 'active',
      image: image.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      description: description.trim(),
      sizes: selectedSizes.length > 0 ? selectedSizes : ['Standard'],
      colors: colorsText.split(',').map(c => c.trim()).filter(Boolean),
      features: featuresText.split('\n').map(f => f.trim()).filter(Boolean)
    };

    const savedProduct = await addStoreProduct(newProd);
    if (!savedProduct) {
      showToast('Error saving product to database', 'error');
      return;
    }

    const updatedCatalog = [newProd, ...storeProducts];
    updateStoreProducts(updatedCatalog);
    showToast(`New product "${newProd.title}" published live to Store database!`, 'success');
    onClose();
  };

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--navy-950)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Package size={22} style={{ color: 'var(--orange-500)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                Add New Merchandise Product
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Publishes product directly to database & public /store catalog
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              padding: '0.4rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Title & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  Product Title *
                </label>
                <input 
                  type="text"
                  required
                  className="form-control"
                  style={{ marginTop: '0.35rem', fontWeight: 700 }}
                  placeholder="e.g. Custom Embroidered Pullover Hoodie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  Category *
                </label>
                <select
                  className="form-control"
                  style={{ marginTop: '0.35rem', fontWeight: 700 }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="tshirts">Custom T-Shirts & Apparel</option>
                  <option value="patches">Custom Patches (Woven & PVC)</option>
                  <option value="caps">3D Puff Caps & Hats</option>
                  <option value="vector">Digitizing Bundles</option>
                </select>
              </div>
            </div>

            {/* Price, Unit, MOQ & Badge */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  Price Tag *
                </label>
                <input 
                  type="text"
                  required
                  className="form-control"
                  style={{ marginTop: '0.35rem', fontWeight: 800, color: 'var(--orange-600)' }}
                  placeholder="$19.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  Unit Spec
                </label>
                <input 
                  type="text"
                  className="form-control"
                  style={{ marginTop: '0.35rem' }}
                  placeholder="per hoodie"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  MOQ (pcs) *
                </label>
                <input 
                  type="number"
                  min="1"
                  className="form-control"
                  style={{ marginTop: '0.35rem', fontWeight: 700 }}
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  Badge Label
                </label>
                <input 
                  type="text"
                  className="form-control"
                  style={{ marginTop: '0.35rem' }}
                  placeholder="NEW ARRIVAL"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                />
              </div>
            </div>

            {/* Available Sizes Tag Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block' }}>
                Select Available Sizes / Options:
              </label>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {STANDARD_SIZES.map(sz => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: isSelected ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                        background: isSelected ? '#fff7ed' : '#ffffff',
                        color: isSelected ? 'var(--orange-600)' : 'var(--navy-800)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {isSelected && <Check size={12} />} {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors / Backing Types */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Available Colors / Backings (Comma separated):
              </label>
              <input 
                type="text"
                className="form-control"
                style={{ marginTop: '0.35rem' }}
                placeholder="Classic Black, Navy Blue, Heather Gray"
                value={colorsText}
                onChange={(e) => setColorsText(e.target.value)}
              />
            </div>

            {/* Product Image Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Product Photo / Mockup (File Upload or Image URL):
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', alignItems: 'center' }}>
                <img 
                  src={image} 
                  alt="Preview" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
                />
                <input 
                  type="text"
                  className="form-control"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
                <label style={{
                  background: isUploading ? 'var(--navy-600)' : 'var(--navy-800)',
                  color: '#ffffff',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  opacity: isUploading ? 0.7 : 1
                }}>
                  {isUploading ? 'Uploading...' : <><Upload size={14} /> Choose File</>}
                  <input 
                    type="file" 
                    onChange={handleImageFileUpload} 
                    style={{ display: 'none' }} 
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Description & Features */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Product Short Description:
              </label>
              <textarea 
                rows={2}
                className="form-control"
                style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Feature Bullet Points (One per line):
              </label>
              <textarea 
                rows={3}
                className="form-control"
                style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '1.25rem 1.75rem',
            background: '#f8fafc',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary-orange"
              style={{ fontWeight: 800, opacity: isUploading ? 0.7 : 1 }}
              disabled={isUploading}
            >
              <Save size={18} /> {isUploading ? 'Uploading Image...' : 'Save & Publish Product to Store'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
