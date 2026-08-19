'use client';

import React, { useState, useEffect } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';
import { 
  Home, 
  Mail, 
  Search, 
  ClipboardList, 
  User, 
  Bell, 
  SlidersHorizontal, 
  MoreVertical, 
  ChevronRight, 
  Plus, 
  Layers, 
  PenTool, 
  Package, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Check, 
  Sparkles, 
  Send, 
  Paperclip, 
  X, 
  Settings, 
  HelpCircle, 
  Share2, 
  ShieldCheck, 
  ArrowLeft, 
  RotateCcw, 
  FileText, 
  Download,
  LayoutGrid,
  Tag,
  Palette,
  LogOut,
  Info
} from 'lucide-react';
import { 
  fetchConversations, 
  fetchNotificationsFromSupabase, 
  markNotificationAsReadInSupabase, 
  subscribeToLiveMessages 
} from '../../services/supabaseService';
import MobileSimpleOrderModal from '../customer/MobileSimpleOrderModal';
import { ClientChatInbox } from '../customer/ClientChatInbox';

export const BDigitizingMobileApp = () => {
  const navigate = useNavigate();
  const { 
    orders = [], 
    authUser, 
    currentUser, 
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    walletBalance = 0,
    setSelectedOrderForDrawer,
    setIsDepositModalOpen,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    showToast,
    logout,
    theme,
    setTheme
  } = useAppState();

  // Active Tab: 'home' | 'inbox' | 'categories' | 'orders' | 'profile'
  const [mobileTab, setMobileTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category sub-tab: 'categories' | 'interests'
  const [categorySubTab, setCategorySubTab] = useState('categories');
  
  // Orders filter: 'all' | 'active' | 'completed'
  const [orderFilter, setOrderFilter] = useState('all');

  // Modals & Chat state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDefaultService, setOrderDefaultService] = useState('embroidery');
  const [selectedChatOrderId, setSelectedChatOrderId] = useState(null);
  const [isOrderActionMenuOpen, setIsOrderActionMenuOpen] = useState(null); // order object
  
  // Real-time unread counts
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  const activeUser = authUser || currentUser || {
    name: 'Bilal',
    email: 'client@studio.com',
    company: 'BDigitizing Client'
  };

  const userInitial = (activeUser?.name?.[0] || 'B').toUpperCase();
  const userName = activeUser?.name || 'Bilal';

  // Filter Orders for Customer
  const myOrders = orders.filter(o => {
    if (!activeUser?.email) return true;
    const clientEmail = (o.client_email || o.clientEmail || '').toLowerCase().trim();
    const userEmail = (activeUser.email || '').toLowerCase().trim();
    return !clientEmail || clientEmail === userEmail || userEmail === 'client@studio.com';
  });

  const activeOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    return s !== 'completed' && s !== 'cancelled' && s !== 'delivered';
  });

  const completedOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    return s === 'completed' || s === 'delivered';
  });

  // Load Real-time Notifications & Messages
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const notifs = await fetchNotificationsFromSupabase();
        if (isMounted && Array.isArray(notifs)) {
          setNotifications(notifs);
          const unread = notifs.filter(n => !n.is_read && !n.read).length;
          setUnreadNotifCount(unread);
        }

        const convRes = await fetchConversations({ clientEmail: activeUser?.email });
        if (isMounted && convRes?.conversations) {
          const totalUnread = convRes.conversations.reduce((sum, c) => sum + (c.clientUnreadCount || 0), 0);
          setUnreadChatCount(totalUnread);
        }
      } catch (err) {
        console.warn('Mobile app data sync note:', err);
      }
    };

    loadData();

    const unsubscribe = subscribeToLiveMessages({
      onMessage: () => {
        if (isMounted) loadData();
      },
      onNotification: () => {
        if (isMounted) loadData();
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeUser?.email]);

  const handleOpenChat = (orderId = null) => {
    setSelectedChatOrderId(orderId);
    setMobileTab('inbox');
  };

  const handleOpenOrderConfigurator = (serviceType = 'embroidery') => {
    setOrderDefaultService(serviceType);
    setIsOrderModalOpen(true);
  };

  return (
    <div 
      className="mobile-app-root"
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingBottom: '70px',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      
      {/* =========================================================================
          SCREEN 1: HOME (Matching Screenshot 5)
          ========================================================================= */}
      {mobileTab === 'home' && (
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.03em' }}>
                bdigitizing<span style={{ color: '#10b981' }}>.</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileTab('categories')}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.45rem',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          {/* Search Input Bar */}
          <div 
            onClick={() => setMobileTab('categories')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              cursor: 'pointer'
            }}
          >
            <Search size={18} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
              Search services (e.g. Embroidery, Vector, Patches...)
            </span>
          </div>

          {/* Popular Services Section (Horizontal Slider) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Popular Services
              </h3>
              <button
                type="button"
                onClick={() => setMobileTab('categories')}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                See All
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.85rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {/* Card 1: Embroidery Digitizing */}
              <div
                onClick={() => handleOpenOrderConfigurator('embroidery')}
                style={{
                  minWidth: '150px',
                  width: '150px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Layers size={42} strokeWidth={1.75} />
                </div>
                <div style={{ padding: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                    Embroidery Digitizing
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, display: 'block', marginTop: '0.25rem' }}>
                    From $15.00
                  </span>
                </div>
              </div>

              {/* Card 2: Vector Art Redraw */}
              <div
                onClick={() => handleOpenOrderConfigurator('vector')}
                style={{
                  minWidth: '150px',
                  width: '150px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <PenTool size={42} strokeWidth={1.75} />
                </div>
                <div style={{ padding: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                    Vector Art Tracing
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 800, display: 'block', marginTop: '0.25rem' }}>
                    From $12.00
                  </span>
                </div>
              </div>

              {/* Card 3: Custom Physical Patches */}
              <div
                onClick={() => handleOpenOrderConfigurator('patch')}
                style={{
                  minWidth: '150px',
                  width: '150px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Package size={42} strokeWidth={1.75} />
                </div>
                <div style={{ padding: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                    Custom Patches
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800, display: 'block', marginTop: '0.25rem' }}>
                    From $45.00
                  </span>
                </div>
              </div>

              {/* Card 4: 4-8 Hour Express Rush */}
              <div
                onClick={() => handleOpenOrderConfigurator('embroidery')}
                style={{
                  minWidth: '150px',
                  width: '150px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Zap size={42} strokeWidth={1.75} />
                </div>
                <div style={{ padding: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                    Express 4-8h Rush
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 800, display: 'block', marginTop: '0.25rem' }}>
                    +$10 Speed Fee
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* What's new on BDigitizing? (Banner Carousel Matching Screenshot 5) */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              What's new on BDigitizing?
            </h3>

            <div style={{
              display: 'flex',
              gap: '0.85rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {/* Feature Banner 1 (Burgundy/Deep Red Card) */}
              <div 
                onClick={() => handleOpenOrderConfigurator('embroidery')}
                style={{
                  minWidth: '280px',
                  width: '280px',
                  height: '170px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #4a044e 0%, #701a75 100%)',
                  color: '#ffffff',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(74, 4, 78, 0.25)',
                  flexShrink: 0
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Express Production
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.25 }}>
                    Expand your apparel brand
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#f5d0fe', lineHeight: 1.3 }}>
                    Native Wilcom stitch pathing with zero thread breaks.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                  <span>Start Order</span> <ChevronRight size={14} />
                </div>
              </div>

              {/* Feature Banner 2 (Emerald Green Card) */}
              <div 
                onClick={() => handleOpenOrderConfigurator('vector')}
                style={{
                  minWidth: '280px',
                  width: '280px',
                  height: '170px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                  color: '#ffffff',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(6, 78, 59, 0.25)',
                  flexShrink: 0
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                    100% Quality Guaranteed
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.25 }}>
                    Free Unlimited Revisions
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#a7f3d0', lineHeight: 1.3 }}>
                    We refine every detail until your machine stitches flawlessly.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                  <span>Upload Artwork</span> <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Place New Order Big Floating CTA */}
          <button
            type="button"
            onClick={() => handleOpenOrderConfigurator('embroidery')}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '0.9rem',
              fontWeight: 900,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
          >
            <Plus size={20} strokeWidth={3} /> Place New Order
          </button>

        </div>
      )}


      {/* =========================================================================
          SCREEN 2: INBOX / MESSAGES (Matching Screenshot 4)
          ========================================================================= */}
      {mobileTab === 'inbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
          
          {/* Chat Inbox Header (Matching Screenshot 4) */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              Inbox
            </h2>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {/* Render Full Client Chat Inbox */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ClientChatInbox initialOrderId={selectedChatOrderId} />
          </div>
        </div>
      )}


      {/* =========================================================================
          SCREEN 3: CATEGORIES / SEARCH (Matching Screenshot 3)
          ========================================================================= */}
      {mobileTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          
          {/* Categories Top Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              Categories
            </h2>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer' }}
            >
              <Search size={20} />
            </button>
          </div>

          {/* Category Tabs: Categories | Interests */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid #f1f5f9', background: '#ffffff' }}>
            <button
              type="button"
              onClick={() => setCategorySubTab('categories')}
              style={{
                flex: 1,
                padding: '0.85rem',
                border: 'none',
                background: 'none',
                fontSize: '0.92rem',
                fontWeight: categorySubTab === 'categories' ? 900 : 600,
                color: categorySubTab === 'categories' ? '#0f172a' : '#64748b',
                borderBottom: categorySubTab === 'categories' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                cursor: 'pointer'
              }}
            >
              Categories
            </button>
            <button
              type="button"
              onClick={() => setCategorySubTab('interests')}
              style={{
                flex: 1,
                padding: '0.85rem',
                border: 'none',
                background: 'none',
                fontSize: '0.92rem',
                fontWeight: categorySubTab === 'interests' ? 900 : 600,
                color: categorySubTab === 'interests' ? '#0f172a' : '#64748b',
                borderBottom: categorySubTab === 'interests' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                cursor: 'pointer'
              }}
            >
              Interests
            </button>
          </div>

          {/* Categories List (Matching Screenshot 3) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              {
                id: 'embroidery',
                title: 'Embroidery Digitizing',
                subtitle: 'Left Chest, Cap Front, 3D Puff, Jacket Back & Applique',
                icon: Layers,
                price: 'From $15'
              },
              {
                id: 'vector',
                title: 'Vector Art Tracing',
                subtitle: 'Logo Redraw, Screen Print Color Separation, Raster to Vector',
                icon: PenTool,
                price: 'From $12'
              },
              {
                id: 'patch',
                title: 'Custom Physical Patches',
                subtitle: 'Embroidered, 3D Molded PVC Rubber, Woven & Leather Patches',
                icon: Package,
                price: 'From $45'
              },
              {
                id: 'embroidery',
                title: 'Express Rush Turnaround',
                subtitle: '4-8 Hour Same-Day Guaranteed Delivery',
                icon: Zap,
                price: 'Express'
              },
              {
                id: 'embroidery',
                title: 'Wilcom EMB Master Files',
                subtitle: 'Full Native Object Tree & Stitch Density Source Files',
                icon: Sparkles,
                price: 'Included'
              }
            ].map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleOpenOrderConfigurator(cat.id)}
                  style={{
                    padding: '1.15rem 1.25rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    background: '#ffffff',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    flexShrink: 0
                  }}>
                    <IconComp size={22} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {cat.title}
                      </h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
                        {cat.price}
                      </span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3 }}>
                      {cat.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}


      {/* =========================================================================
          SCREEN 4: MANAGE ORDERS (Matching Screenshot 2)
          ========================================================================= */}
      {mobileTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f8fafc' }}>
          
          {/* Manage Orders Header (Matching Screenshot 2) */}
          <div style={{
            padding: '1rem 1.25rem',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              Manage orders
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', position: 'relative' }}
              >
                <Bell size={20} />
                {unreadNotifCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                )}
              </button>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer' }}
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Sub-filter Switcher */}
          <div style={{ padding: '0.75rem 1rem 0.25rem', display: 'flex', gap: '0.4rem' }}>
            {[
              { id: 'all', label: `All (${myOrders.length})` },
              { id: 'active', label: `Active (${activeOrders.length})` },
              { id: 'completed', label: `Completed (${completedOrders.length})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOrderFilter(f.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: orderFilter === f.id ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                  background: orderFilter === f.id ? '#0f172a' : '#ffffff',
                  color: orderFilter === f.id ? '#ffffff' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Order Cards List (Exact layout matching Screenshot 2) */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(() => {
              const filtered = myOrders.filter(o => {
                const s = String(o?.status || '').toLowerCase().trim();
                const isDone = s === 'completed' || s === 'delivered';
                if (orderFilter === 'active') return !isDone && s !== 'cancelled';
                if (orderFilter === 'completed') return isDone;
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    marginTop: '1rem'
                  }}>
                    <ClipboardList size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      No Orders Found
                    </h4>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#64748b' }}>
                      {orderFilter === 'active' ? 'You have no active orders in production.' : 'No completed orders in your history.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenOrderConfigurator('embroidery')}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.65rem 1.25rem',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Place New Order
                    </button>
                  </div>
                );
              }

              return filtered.map(ord => {
                const primaryImg = ord?.artworkUrl || ord?.image_url || ord?.logo || ord?.uploadedFiles?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                const isCompleted = String(ord?.status || '').toLowerCase() === 'completed' || String(ord?.status || '').toLowerCase() === 'delivered';
                const priceVal = Number(ord.totalPrice || ord.price || 15).toFixed(2);
                const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 31, 2026';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderForDrawer(ord)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Top Row: Thumbnail + Price + Title */}
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <img
                        src={primaryImg}
                        alt={ord.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                        }}
                        style={{
                          width: '58px',
                          height: '58px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          border: '1px solid #cbd5e1',
                          flexShrink: 0
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                          ${priceVal}
                        </div>
                        <p style={{
                          margin: '0.15rem 0 0',
                          fontSize: '0.85rem',
                          color: '#334155',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {ord.title || 'Do asap embroidery digitizing into dst, pes'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Digitizer Avatar + Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#fef08a',
                          color: '#854d0e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 900
                        }}>
                          BD
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          BDigitizing Studio
                        </span>
                      </div>

                      <span style={{
                        background: isCompleted ? '#ecfdf5' : '#eff6ff',
                        color: isCompleted ? '#059669' : '#0284c7',
                        border: isCompleted ? '1px solid #a7f3d0' : '1px solid #bae6fd',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                      </span>
                    </div>

                    {/* Bottom Row: Date + 3 Dots Menu */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.65rem',
                      marginTop: '0.2rem'
                    }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                        {dateStr}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOrderActionMenuOpen(ord);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0f172a',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      )}


      {/* =========================================================================
          SCREEN 5: PROFILE & ACCOUNT (Matching Screenshot 1)
          ========================================================================= */}
      {mobileTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#ffffff' }}>
          
          {/* Top Brand Green Header (Matching Screenshot 1) */}
          <div style={{
            background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.25rem 2.25rem',
            position: 'relative'
          }}>
            {/* Top Bar with Bell */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', position: 'relative' }}
              >
                <Bell size={22} />
                {unreadNotifCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                )}
              </button>
            </div>

            {/* User Avatar + Name + Balance (Or Guest Sign-In) */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    border: '2px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {userInitial}
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #ffffff'
                  }} />
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                    {userName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Personal balance: <strong style={{ color: '#ffffff', fontWeight: 800 }}>${walletBalance.toFixed(2)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDepositModalOpen(true)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '12px',
                        padding: '0.1rem 0.45rem',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      + Top-Up
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff'
                  }}>
                    <User size={28} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                      Guest Visitor
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', display: 'block', marginTop: '0.1rem' }}>
                      Sign in to track orders & balance
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#047857',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  Sign In
                </button>
              </div>
            )}

          </div>

          {/* Floating Card: VIP Studio Mode (Matching Screenshot 1) */}
          <div style={{ padding: '0 1.25rem', marginTop: '-18px' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '0.85rem 1.15rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                Client VIP mode
              </span>
              <div style={{
                width: '42px',
                height: '24px',
                borderRadius: '12px',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '2px',
                boxSizing: 'border-box'
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* Invite friends row */}
          <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
            <div 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'BDigitizing', url: window.location.origin });
                } else {
                  showToast('Link copied to clipboard!', 'success');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                cursor: 'pointer',
                padding: '0.5rem 0'
              }}
            >
              <Share2 size={20} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                Invite friends
              </span>
            </div>
          </div>

          {/* SETTINGS SECTION (Matching Screenshot 1) */}
          <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
              Settings
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div 
                onClick={() => setMobileTab('orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Settings size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>Preferences</span>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              <div 
                onClick={() => showToast(`Signed in as ${activeUser?.email}`, 'info')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <User size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>Account</span>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* RESOURCES SECTION (Matching Screenshot 1) */}
          <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
              Resources
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div 
                onClick={() => handleOpenChat('general-support')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <HelpCircle size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>Support & Help Desk</span>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              <div 
                onClick={() => navigate('/terms')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <ShieldCheck size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>Community and legal</span>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              <div 
                onClick={() => showToast('Thank you for your feedback! ⭐⭐⭐⭐⭐', 'success')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Sparkles size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>Share feedback</span>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* App Version Tag + Sign Out */}
          <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
              4.4.4.1 (BDigitizing App)
            </span>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  if (logout) logout();
                  navigate('/login');
                }}
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <User size={16} /> Sign In to Studio Account
              </button>
            )}
          </div>

        </div>
      )}


      {/* =========================================================================
          UNIVERSAL BOTTOM 5-TAB NAVIGATION BAR (Exact Match to All 5 Screenshots)
          ========================================================================= */}
      <nav 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '62px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          zIndex: 99999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)'
        }}
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.35rem 0',
            color: mobileTab === 'home' ? '#0f172a' : '#94a3b8'
          }}
        >
          <Home size={22} strokeWidth={mobileTab === 'home' ? 2.5 : 1.75} />
        </button>

        {/* Tab 2: Messages / Inbox */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.35rem 0',
            position: 'relative',
            color: mobileTab === 'inbox' ? '#0f172a' : '#94a3b8'
          }}
        >
          <Mail size={22} strokeWidth={mobileTab === 'inbox' ? 2.5 : 1.75} />
          {unreadChatCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '22px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444'
            }} />
          )}
        </button>

        {/* Tab 3: Search / Categories */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('categories');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.35rem 0',
            color: mobileTab === 'categories' ? '#0f172a' : '#94a3b8'
          }}
        >
          <Search size={22} strokeWidth={mobileTab === 'categories' ? 2.5 : 1.75} />
        </button>

        {/* Tab 4: Manage Orders */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('orders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.35rem 0',
            position: 'relative',
            color: mobileTab === 'orders' ? '#0f172a' : '#94a3b8'
          }}
        >
          <ClipboardList size={22} strokeWidth={mobileTab === 'orders' ? 2.5 : 1.75} />
          {activeOrders.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '20px',
              background: '#059669',
              color: '#ffffff',
              fontSize: '0.55rem',
              fontWeight: 900,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeOrders.length}
            </span>
          )}
        </button>

        {/* Tab 5: Profile & Account */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.35rem 0',
            color: mobileTab === 'profile' ? '#0f172a' : '#94a3b8'
          }}
        >
          <User size={22} strokeWidth={mobileTab === 'profile' ? 2.5 : 1.75} />
        </button>
      </nav>

      {/* ORDER ACTION SHEET (When clicking 3 dots on order card) */}
      {isOrderActionMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsOrderActionMenuOpen(null)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '20px 20px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              animation: 'slideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ea580c' }}>
                  {formatOrderId(isOrderActionMenuOpen.id)}
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {isOrderActionMenuOpen.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderActionMenuOpen(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderForDrawer(isOrderActionMenuOpen);
                setIsOrderActionMenuOpen(null);
              }}
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer'
              }}
            >
              <ClipboardList size={18} style={{ color: '#059669' }} /> View Full Order & Download Files
            </button>

            <button
              type="button"
              onClick={() => {
                const ordId = isOrderActionMenuOpen.id;
                setIsOrderActionMenuOpen(null);
                handleOpenChat(ordId);
              }}
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer'
              }}
            >
              <Mail size={18} style={{ color: '#ea580c' }} /> Chat with Digitizer
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DRAWER */}
      {isNotifDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsNotifDrawerOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '85%',
              maxWidth: '380px',
              height: '100%',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Bell size={18} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Notifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No new notifications</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id || Math.random()}
                    onClick={() => {
                      markNotificationAsReadInSupabase(n.id);
                      setIsNotifDrawerOpen(false);
                      if (n.order_id) {
                        const found = myOrders.find(o => String(o.id) === String(n.order_id));
                        if (found) setSelectedOrderForDrawer(found);
                      } else {
                        setMobileTab('inbox');
                      }
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: n.is_read ? '#f8fafc' : '#ecfdf5',
                      border: n.is_read ? '1px solid #e2e8f0' : '1px solid #a7f3d0',
                      cursor: 'pointer'
                    }}
                  >
                    <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      {n.title || 'Studio Notification'}
                    </h5>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      {n.message || n.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5-STEP ORDER MODAL */}
      <MobileSimpleOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        defaultService={orderDefaultService}
        onOrderCreated={(newOrd) => {
          setMobileTab('orders');
        }}
      />

    </div>
  );
};

export default BDigitizingMobileApp;
