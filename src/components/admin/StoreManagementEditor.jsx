'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  Upload,
  Filter
} from 'lucide-react';

import { AddProductModal } from './AddProductModal';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

export const StoreManagementEditor = () => {
  const { 
    storeProducts = [], 
    updateStoreProducts, 
    orders = [], 
    updateOrderStatus, 
    digitizers = [], 
    assignDigitizer,
    showToast 
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'orders'
  const [draftProducts, setDraftProducts] = useState([...(storeProducts || [])]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);



  // Sync draftProducts when storeProducts updates
  React.useEffect(() => {
    setDraftProducts([...(storeProducts || [])]);
  }, [storeProducts]);

  // Filter merchandise orders from state
  const stateStoreOrders = orders.filter(o => 
    o.category === 'merchandise' || 
    o.serviceCategory === 'Merchandise & Store' || 
    o.serviceCategory === 'merchandise' || 
    o.serviceType === 'Merchandise & Store' || 
    o.details?.itemTitle || 
    (o.title || '').toLowerCase().includes('shirt') || 
    (o.title || '').toLowerCase().includes('patch') || 
    (o.title || '').toLowerCase().includes('cap')
  );

  // Deduplicate state store orders (if necessary) or simply use stateStoreOrders
  const storeOrders = React.useMemo(() => {
    const map = new Map();
    stateStoreOrders.forEach(o => map.set(o.id, o));
    return Array.from(map.values());
  }, [stateStoreOrders]);

  // Product Editing Handlers
  const handleProductChange = (id, field, value) => {
    setDraftProducts(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'sizes' || field === 'colors' || field === 'features') {
          return { ...item, [field]: value.split(',').map(s => s.trim()).filter(Boolean) };
        }
        if (field === 'minQuantity') {
          return { ...item, minQuantity: parseInt(value, 10) || 1 };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddProduct = () => {
    setIsAddModalOpen(true);
  };

  const handleRemoveProduct = (idToRemove) => {
    setDraftProducts(prev => prev.filter(item => item.id !== idToRemove));
    showToast('Product removed from catalog', 'warning');
  };

  const handleSaveCatalog = (e) => {
    e.preventDefault();
    updateStoreProducts(draftProducts);
    showToast('Store products catalog updated and published live to /store page!', 'success');
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    
    // Quick preview first
    const reader = new FileReader();
    reader.onload = (e) => {
      handleProductChange(id, 'image', e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary in background and replace preview with real URL
    try {
      const uploaded = await uploadFileToCloudinaryFull(file, 'media-gallery', 'store-products');
      if (uploaded && uploaded.url) {
        handleProductChange(id, 'image', uploaded.url);
      }
    } catch (err) {
      console.error('Store image upload failed:', err);
    }
  };

  const filteredProducts = filterCategory === 'all' 
    ? draftProducts 
    : draftProducts.filter(p => p.category === filterCategory);

  return (
    <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', background: '#ffffff' }}>
      
      {/* Header & Sub-tab Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={24} style={{ color: 'var(--orange-500)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
              Store & Merchandise Management
            </h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Manage product items, prices, MOQs, stock availability, and fulfill customer store merchandise orders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className={`btn ${activeSubTab === 'catalog' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('catalog')}
          >
            <Package size={16} /> Products Catalog ({draftProducts.length})
          </button>

          <button
            type="button"
            className={`btn ${activeSubTab === 'orders' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('orders')}
          >
            <ShoppingBag size={16} /> Store Orders ({storeOrders.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PRODUCTS CATALOG EDITOR */}
      {activeSubTab === 'catalog' && (
        <form onSubmit={handleSaveCatalog}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: 'var(--navy-700)' }} />
              <select
                className="form-control"
                style={{ fontWeight: 700, width: 'auto' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories ({draftProducts.length})</option>
                <option value="tshirts">Custom T-Shirts & Polos</option>
                <option value="patches">Custom Patches</option>
                <option value="caps">3D Puff Caps</option>
                <option value="vector">Digitizing Bundles</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddProduct}
              >
                <Plus size={16} /> Add New Merchandise Product
              </button>

              <button
                type="submit"
                className="btn btn-primary-orange"
                style={{ fontWeight: 800 }}
              >
                <Save size={16} /> Save & Publish Live Store Catalog
              </button>
            </div>
          </div>

          {/* Product Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredProducts.map((prod, idx) => (
              <div 
                key={prod.id || idx}
                style={{
                  padding: '1.5rem',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  background: prod.status === 'out_of_stock' ? '#fff1f2' : '#f8fafc',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img 
                      src={prod.image} 
                      alt={prod.title}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                    />
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        {prod.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        ID: {prod.id} | Category: {prod.category.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Status selector */}
                    <select
                      className="form-control"
                      style={{
                        width: 'auto',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        background: prod.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: prod.status === 'active' ? '#15803d' : '#b91c1c',
                        border: 'none'
                      }}
                      value={prod.status || 'active'}
                      onChange={(e) => handleProductChange(prod.id, 'status', e.target.value)}
                    >
                      <option value="active">Active (In Stock)</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(prod.id)}
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>

                {/* Form Controls Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem', marginBottom: '1.15rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Product Title</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ fontWeight: 700 }}
                      value={prod.title || ''}
                      onChange={(e) => handleProductChange(prod.id, 'title', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Category</label>
                    <select
                      className="form-control"
                      style={{ fontWeight: 700 }}
                      value={prod.category || 'tshirts'}
                      onChange={(e) => handleProductChange(prod.id, 'category', e.target.value)}
                    >
                      <option value="tshirts">Custom T-Shirts & Polos</option>
                      <option value="patches">Custom Patches (Woven & PVC)</option>
                      <option value="caps">3D Puff Caps & Hats</option>
                      <option value="vector">Digitizing Bundles</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Unit Price (e.g. $12.99)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ fontWeight: 800, color: 'var(--orange-600)' }}
                      value={prod.price || ''}
                      onChange={(e) => handleProductChange(prod.id, 'price', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Min Order Quantity (MOQ)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="form-control"
                      style={{ fontWeight: 700 }}
                      value={prod.minQuantity || 1}
                      onChange={(e) => handleProductChange(prod.id, 'minQuantity', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Badge Label (e.g. Bestseller)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={prod.badge || ''}
                      onChange={(e) => handleProductChange(prod.id, 'badge', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Image URL / Upload File</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-control"
                        style={{ fontSize: '0.8rem' }}
                        value={prod.image || ''}
                        onChange={(e) => handleProductChange(prod.id, 'image', e.target.value)}
                      />
                      <label style={{
                        background: 'var(--navy-800)',
                        color: '#ffffff',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.75rem'
                      }}>
                        <Upload size={14} />
                        <input 
                          type="file" 
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageUpload(prod.id, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sizes & Colors Input */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.15rem', marginBottom: '1.15rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Available Sizes (Comma separated)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="S, M, L, XL, 2XL, 3XL"
                      value={Array.isArray(prod.sizes) ? prod.sizes.join(', ') : (prod.sizes || '')}
                      onChange={(e) => handleProductChange(prod.id, 'sizes', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Available Colors / Backings (Comma separated)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Navy Blue, Classic Black, Pure White"
                      value={Array.isArray(prod.colors) ? prod.colors.join(', ') : (prod.colors || '')}
                      onChange={(e) => handleProductChange(prod.id, 'colors', e.target.value)}
                    />
                  </div>
                </div>

                {/* Description & Feature Specs Input */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.15rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Product Short Description</label>
                    <textarea 
                      rows={2}
                      className="form-control"
                      style={{ fontSize: '0.825rem' }}
                      value={prod.description || ''}
                      onChange={(e) => handleProductChange(prod.id, 'description', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Feature Bullet Points (Comma separated)</label>
                    <textarea 
                      rows={2}
                      className="form-control"
                      style={{ fontSize: '0.825rem' }}
                      value={Array.isArray(prod.features) ? prod.features.join(', ') : (prod.features || '')}
                      onChange={(e) => handleProductChange(prod.id, 'features', e.target.value)}
                    />
                  </div>
                </div>

                {/* Card Specific Save Changes Action Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange btn-sm"
                    style={{ fontWeight: 800 }}
                    onClick={() => {
                      updateStoreProducts(draftProducts);
                      showToast(`Product "${prod.title}" updated and published live to Store!`, 'success');
                    }}
                  >
                    <Save size={15} /> Save Changes for {prod.title}
                  </button>
                </div>

              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button
              type="submit"
              className="btn btn-primary-orange btn-lg"
              style={{ fontWeight: 800 }}
            >
              <Save size={18} /> Save & Publish Live Store Catalog
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: STORE ORDERS LIST */}
      {activeSubTab === 'orders' && (
        <div>
          <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Viewing <strong>{storeOrders.length}</strong> store merchandise purchases submitted by clients.
          </div>

          {storeOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
              <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h4 style={{ color: 'var(--navy-900)' }}>No Store Orders Placed Yet</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Customer merchandise purchases from the /store page will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {storeOrders.map(order => (
                <div 
                  key={order.id}
                  style={{
                    padding: '1.5rem',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                          Order #{order.id}
                        </span>
                        <span className={`badge badge-${order.status}`} style={{ textTransform: 'uppercase' }}>
                          {order.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '9999px' }}>
                          MERCHANDISE
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span>Submitted on <strong>{order.date || 'Recent'}</strong></span>
                        <span>•</span>
                        <span>Customer: <strong style={{ color: 'var(--navy-900)' }}>{order.clientName || 'Valued Client'}</strong></span>
                        <span>•</span>
                        <span style={{ color: 'var(--orange-600)', fontWeight: 700, background: '#fff7ed', padding: '0.1rem 0.5rem', borderRadius: '4px', border: '1px solid var(--orange-200)' }}>
                          ✉️ {order.clientEmail || order.clientId || 'No email on file'}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--orange-600)' }}>
                        ${parseFloat(order.price || order.amount || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
                        {order.details?.paymentMethod || 'Studio Wallet / Gateway'}
                      </div>
                    </div>
                  </div>

                  {/* Order Product Image & Details Specification Grid */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    background: '#f8fafc',
                    padding: '1.15rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap'
                  }}>
                    {/* Product Image Thumbnail */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={order.productImage || order.details?.productImage || order.image_url || order.artworkUrl || order.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'} 
                        alt={order.details?.itemTitle || order.title} 
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '2px solid var(--orange-500)',
                          background: '#ffffff',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.04em'
                      }}>
                        PRODUCT
                      </span>
                    </div>

                    {/* Specification Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '0.85rem',
                      width: '100%',
                      flex: 1,
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--navy-900)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Item Title:</strong>
                        <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{order.details?.itemTitle || order.title}</div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--navy-900)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Quantity & Size:</strong>
                        <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                          <span style={{ color: 'var(--orange-600)' }}>{order.details?.quantity || 1} pcs</span> ({order.details?.size || 'Standard'})
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--navy-900)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Color / Option:</strong>
                        <div>{order.details?.color || 'Default'}</div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--navy-900)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Logo Artwork:</strong>
                        <div style={{ color: 'var(--orange-600)', fontWeight: 700 }}>
                          {order.details?.artworkFile || 'Attached Artwork'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Assignment Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-800)' }}>Update Order Status:</span>
                      <select
                        className="form-control"
                        style={{ width: 'auto', fontSize: '0.8rem', fontWeight: 700 }}
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="in-production">In Production / Printing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-800)' }}>Assign Production Staff:</span>
                      <select
                        className="form-control"
                        style={{ width: 'auto', fontSize: '0.8rem', fontWeight: 700 }}
                        value={order.digitizerId || ''}
                        onChange={(e) => assignDigitizer(order.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {digitizers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add New Merchandise Product Modal */}
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

    </div>
  );
};
