'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  ShoppingBag, 
  Upload, 
  CheckCircle2, 
  CreditCard, 
  Wallet, 
  AlertCircle, 
  ArrowRight,
  Plus,
  Minus,
  FileCheck
} from 'lucide-react';

export const StoreOrderModal = () => {
  const { 
    isStoreOrderModalOpen, 
    setIsStoreOrderModalOpen, 
    selectedStoreItem, 
    walletBalance, 
    deductWalletBalance,
    createOrder,
    isAuthenticated,
    authUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    showToast 
  } = useAppState();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [minQty, setMinQty] = useState(1);
  const [placementNotes, setPlacementNotes] = useState('');
  const [uploadedArtwork, setUploadedArtwork] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize modal fields whenever selectedStoreItem changes
  useEffect(() => {
    if (selectedStoreItem) {
      const sizes = selectedStoreItem.sizes || ['Standard'];
      const colors = selectedStoreItem.colors || ['Default'];
      setSelectedSize(sizes[0] || 'Standard');
      setSelectedColor(colors[0] || 'Default');

      // Parse minimum quantity from unit or description
      let parsedMin = 1;
      const unitText = selectedStoreItem.unit || '';
      const match = unitText.match(/Min\.\s*(\d+)/i);
      if (match && match[1]) {
        parsedMin = parseInt(match[1], 10);
      } else if (selectedStoreItem.category === 'tshirts') {
        parsedMin = 5;
      } else if (selectedStoreItem.category === 'caps') {
        parsedMin = 12;
      }
      setMinQty(parsedMin);
      setQuantity(parsedMin);
      setUploadedArtwork(null);
      setPlacementNotes('');
    }
  }, [selectedStoreItem]);

  if (!isStoreOrderModalOpen || !selectedStoreItem) return null;

  // Calculate prices
  const unitPrice = parseFloat((selectedStoreItem.price || '$10.00').replace(/[^0-9.]/g, '')) || 10.00;
  const totalPrice = (unitPrice * quantity).toFixed(2);
  const totalPriceNum = parseFloat(totalPrice);
  const hasEnoughWallet = walletBalance >= totalPriceNum;

  const handleArtworkUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedArtwork({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          url: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteStoreOrder = (paymentMethod) => {
    if (!isAuthenticated) {
      showToast('Please sign in or register an account to complete your store order', 'info');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (quantity < minQty) {
      showToast(`Minimum order requirement for this item is ${minQty} pcs`, 'warning');
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === 'wallet') {
      if (!hasEnoughWallet) {
        showToast(`Insufficient studio wallet balance ($${walletBalance.toFixed(2)}). Please top up or pay via BoltPayouts`, 'warning');
        setIsSubmitting(false);
        return;
      }
      deductWalletBalance(totalPriceNum);
    } else if (paymentMethod === 'bolt') {
      // Direct payment gateway link popup/redirect
      window.open('https://www.boltpayouts.xyz/pay/boltpayouts', '_blank');
    }

    // Build store order object with explicit product image schema
    const productImage = selectedStoreItem.image || selectedStoreItem.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
    const clientArtwork = uploadedArtwork?.url || null;

    const newStoreOrder = {
      title: `${selectedStoreItem.title} (${quantity} pcs - ${selectedSize})`,
      category: 'merchandise',
      serviceCategory: 'Merchandise & Store',
      serviceType: 'Merchandise & Store',
      clientName: authUser?.company || authUser?.name || 'Apex Athletics Apparel',
      clientEmail: authUser?.email || 'sarah@apexapparel.com',
      clientId: authUser?.email || 'sarah@apexapparel.com',
      price: totalPriceNum,
      cost: totalPriceNum,
      productImage: productImage,
      product_image: productImage,
      artworkUrl: clientArtwork || productImage,
      image_url: productImage,
      logo: productImage,
      file_url: productImage,
      status: 'submitted',
      date: new Date().toISOString().split('T')[0],
      notes: `Item: ${selectedStoreItem.title} | Qty: ${quantity} | Size: ${selectedSize} | Color: ${selectedColor} | Artwork: ${uploadedArtwork?.name || 'Default Artwork'} | Notes: ${placementNotes || 'Standard placement'}`,
      details: {
        itemTitle: selectedStoreItem.title,
        productImage: productImage,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        unitPrice: `$${unitPrice.toFixed(2)}`,
        totalPrice: `$${totalPrice}`,
        placementNotes: placementNotes || 'Standard Left Chest / Front Center placement',
        artworkFile: uploadedArtwork?.name || 'Default Studio Artwork',
        artworkUrl: clientArtwork,
        paymentMethod: paymentMethod === 'wallet' ? 'Studio Wallet Credit' : 'BoltPayouts Gateway'
      }
    };

    setTimeout(() => {
      createOrder(newStoreOrder);

      // Save directly to localStorage store_orders array
      try {
        const existing = JSON.parse(localStorage.getItem('store_orders') || '[]');
        const updated = [newStoreOrder, ...existing.filter(item => item.id !== newStoreOrder.id)];
        localStorage.setItem('store_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('store_orders_updated'));
      } catch (err) {
        console.warn('Error saving store_orders to localStorage:', err);
      }

      setIsSubmitting(false);
      setIsStoreOrderModalOpen(false);
      showToast(`Store Order #${Date.now().toString().slice(-6)} placed successfully!`, 'success');
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}>

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
            <ShoppingBag size={22} style={{ color: 'var(--orange-500)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                Apparel Customization & Store Order
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Specify sizes, quantities, and upload your logo artwork
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsStoreOrderModalOpen(false)}
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

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Selected Product Banner */}
          <div style={{
            display: 'flex',
            gap: '1.25rem',
            background: '#f8fafc',
            border: '1.5px solid var(--border-color)',
            padding: '1.15rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            alignItems: 'center'
          }}>
            <img 
              src={selectedStoreItem.image} 
              alt={selectedStoreItem.title} 
              style={{ width: '85px', height: '85px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--orange-500)', color: '#ffffff', padding: '0.15rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                  {selectedStoreItem.badge || 'STORE ITEM'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Unit: {selectedStoreItem.price}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.35rem' }}>
                {selectedStoreItem.title}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                {selectedStoreItem.description}
              </p>
            </div>
          </div>

          {/* Customization Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Size Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Select Size / Specification:
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {(selectedStoreItem.sizes || ['Standard']).map((sz, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      border: selectedSize === sz ? '2px solid var(--orange-500)' : '1px solid var(--border-color)',
                      background: selectedSize === sz ? '#fff7ed' : '#ffffff',
                      color: selectedSize === sz ? 'var(--orange-600)' : 'var(--navy-800)',
                      cursor: 'pointer'
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Variant Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Select Color / Backing Type:
              </label>
              <select
                className="form-control"
                style={{ marginTop: '0.4rem', fontWeight: 700 }}
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                {(selectedStoreItem.colors || ['Default']).map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Quantity Counter & Price Calculation */}
          <div style={{
            background: 'var(--navy-50)',
            border: '1.5px solid var(--orange-200)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Order Quantity (Dropdown & Manual Entry - Min. {minQty} pcs):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {/* Quantity Dropdown Preset */}
                <select
                  className="form-control"
                  value={[minQty, minQty * 2, minQty * 5, minQty * 10, minQty * 25, 50, 100].includes(quantity) ? quantity : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setQuantity(parseInt(e.target.value) || minQty);
                    }
                  }}
                  style={{ width: 'auto', minWidth: '140px', fontWeight: 700 }}
                >
                  <option value={minQty}>{minQty} pcs (Minimum Tier)</option>
                  <option value={minQty * 2}>{minQty * 2} pcs (Double Batch)</option>
                  <option value={minQty * 5}>{minQty * 5} pcs (Standard Bulk)</option>
                  <option value={minQty * 10}>{minQty * 10} pcs (Shop Batch)</option>
                  <option value={50}>50 pcs (Volume Batch)</option>
                  <option value={100}>100 pcs (Commercial Wholesale)</option>
                  <option value="custom">Custom Quantity...</option>
                </select>

                {/* Manual Number Input with Increments */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(minQty, prev - 1))}
                    style={{
                      width: '36px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  
                  <input 
                    type="number"
                    min={minQty}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                    style={{
                      width: '65px',
                      height: '38px',
                      textAlign: 'center',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    style={{
                      width: '36px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Total Price Banner */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Total Order Amount
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange-600)', lineHeight: 1 }}>
                ${totalPrice}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--navy-700)', marginTop: '0.2rem', fontWeight: 600 }}>
                (${unitPrice.toFixed(2)} x {quantity} pcs)
              </div>
            </div>
          </div>

          {/* Logo / Artwork Upload Section */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.4rem' }}>
              Upload Logo / Artwork for Merchandise Embroidery:
            </label>
            
            <div style={{
              border: '2px dashed var(--orange-300)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              textAlign: 'center',
              background: uploadedArtwork ? '#f0fdf4' : '#f8fafc',
              cursor: 'pointer'
            }}>
              {uploadedArtwork ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
                  <FileCheck size={32} style={{ color: '#16a34a' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)' }}>
                      {uploadedArtwork.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Size: {uploadedArtwork.size} | Attached Successfully
                    </div>
                  </div>
                </div>
              ) : (
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={28} style={{ color: 'var(--orange-600)', marginBottom: '0.35rem' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                    Click to upload logo artwork file
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Supports PNG, JPG, PDF, AI, EPS, SVG (Any file format & long filename)
                  </div>
                  <input 
                    type="file" 
                    onChange={handleArtworkUpload} 
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Embroidery Placement / Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>
              Embroidery Placement & Custom Instructions:
            </label>
            <textarea 
              rows={2}
              className="form-control"
              style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}
              placeholder="e.g., Left chest logo (3.5 inches wide), back collar text in white thread..."
              value={placementNotes}
              onChange={(e) => setPlacementNotes(e.target.value)}
            />
          </div>

        </div>

        {/* Modal Footer / Checkout Buttons */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: '#f8fafc',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Pay with Studio Wallet */}
            <button
              type="button"
              disabled={isSubmitting || !hasEnoughWallet}
              onClick={() => handleCompleteStoreOrder('wallet')}
              className="btn btn-outline"
              style={{
                borderColor: hasEnoughWallet ? 'var(--orange-500)' : '#cbd5e1',
                color: hasEnoughWallet ? 'var(--orange-600)' : '#94a3b8',
                fontWeight: 800,
                justifyContent: 'center',
                padding: '0.75rem 1rem'
              }}
            >
              <Wallet size={18} /> Pay with Wallet (${walletBalance.toFixed(2)})
            </button>

            {/* Pay via BoltPayouts Gateway */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleCompleteStoreOrder('bolt')}
              className="btn btn-primary-orange"
              style={{
                fontWeight: 800,
                justifyContent: 'center',
                padding: '0.75rem 1rem'
              }}
            >
              <CreditCard size={18} /> Pay ${totalPrice} via BoltPayouts
            </button>
          </div>

          {!hasEnoughWallet && isAuthenticated && (
            <div style={{ fontSize: '0.75rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
              <AlertCircle size={14} /> Wallet balance is lower than total (${totalPrice}). Select BoltPayouts or top up wallet in client portal.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
