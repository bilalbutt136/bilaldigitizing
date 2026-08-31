'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '../utils/navigation';
import { useAppState } from '../context/StateContext';
import { 
  Home,
  Scissors, 
  User, 
  ChevronDown, 
  ChevronRight,
  Menu, 
  MoreVertical,
  X, 
  MessageSquare, 
  Bell, 
  PenTool, 
  Image as ImageIcon, 
  Award, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  Headphones,
  PlusCircle,
  Plus,
  Smartphone,
  Download,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  Layers,
  Upload,
  DollarSign,
  BookOpen
} from 'lucide-react';
import { UserMenuDropdown } from './common/UserMenuDropdown';
import { ThemeToggle } from './common/ThemeToggle';
import { handleNotificationClick } from '../utils/notificationRouter';

export const HeaderNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { 
    theme,
    currentView, 
    setCurrentView,
    isAuthenticated,
    authUser,
    protectedNavigate,
    setIsAuthModalOpen,
    setAuthModalMode,
    openOrderWizard,
    setIsOrderWizardOpen,
    openOrderTrackerDrawer,
    setSelectedOrderForDrawer,
    setActiveAdminTab,
    setActiveCustomerTab,
    setActiveHomeServiceTab,
    orders = [],
    notifications = [],
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount = 0,
    unreadChatCount = 0,
    setMobileMode,
    mobileMode,
    logout,
    showToast
  } = useAppState();

  const isDark = theme === 'dark';
  const safeCurrentView = mounted ? currentView : 'public';
  const safeIsAuthenticated = mounted ? isAuthenticated : false;
  const safeAuthUser = mounted ? authUser : null;
  const currentPath = mounted ? (location?.pathname || '') : '';
  const isAdmin = mounted && (safeAuthUser?.role === 'admin' || currentPath.includes('admin') || safeCurrentView === 'admin');
  const isClient = mounted && safeIsAuthenticated && !isAdmin;

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.paddingRight = '';
    };
  }, [isMobileMenuOpen]);

  const servicesDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const supportDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(e.target)) {
        setIsServicesOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target)) {
        setIsNotificationDropdownOpen(false);
      }
      if (supportDropdownRef.current && !supportDropdownRef.current.contains(e.target)) {
        setIsSupportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenInbox = () => {
    // 1. If Admin Portal or Admin user, navigate directly to Admin Chat & Inbox tab
    if (safeIsAuthenticated && authUser?.role === 'admin') {
      if (setActiveAdminTab) setActiveAdminTab('chat');
      protectedNavigate('admin');
      navigate('/admin-portal?tab=chat');
      return;
    }

    // 2. If authenticated Client in Portal, open Customer Inbox
    if (safeIsAuthenticated) {
      if (setActiveCustomerTab) setActiveCustomerTab('inbox');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'inbox', orderId: 'inbox' } }));
      }
      protectedNavigate('customer', false);
      navigate('/client-portal?tab=inbox');
      return;
    }

    // 3. If unauthenticated, open public live support chat widget
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_open_chat'));
    }
  };

  const handleOpenLiveSupport = () => {
    // 1. If Admin Portal or Admin user, navigate directly to Admin Chat & Inbox tab
    if (safeIsAuthenticated && authUser?.role === 'admin') {
      if (setActiveAdminTab) setActiveAdminTab('chat');
      protectedNavigate('admin');
      navigate('/admin-portal?tab=chat');
      return;
    }

    // 2. If authenticated Client in Portal, open Help & Support chat
    if (safeIsAuthenticated) {
      if (setActiveCustomerTab) setActiveCustomerTab('help-support');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'help-support', orderId: 'general-support' } }));
      }
      protectedNavigate('customer', false);
      navigate('/client-portal?tab=help-support');
      return;
    }

    // 3. Open Live Support Chat widget on Public Home Page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_open_chat'));
    }

    setTimeout(() => {
      const chatBtn = document.querySelector('.live-chat-floating-button') || document.querySelector('[data-chat-trigger="true"]');
      if (chatBtn) {
        chatBtn.click();
      }
    }, 100);
  };

  const handleInstallMobileApp = async () => {
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      if (window.deferredPWAInstallPrompt) {
        try {
          window.deferredPWAInstallPrompt.prompt();
          const { outcome } = await window.deferredPWAInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            window.deferredPWAInstallPrompt = null;
            if (showToast) showToast('Bilal Digitizing App installed successfully!', 'success');
          }
          return;
        } catch (err) {
          console.error('PWA install error:', err);
        }
      }
      // Trigger PWA install banner / instructions event
      window.dispatchEvent(new Event('bdigi_trigger_pwa_install'));
    }
  };

  const handleNavClick = (sectionId) => {
    setCurrentView('public');
    if (currentPath !== '/') {
      navigate('/');
      if (sectionId) {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoHome = () => {
    setCurrentView('public');
    navigate('/');
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--bg-card)', backdropFilter: isScrolled ? 'blur(12px)' : 'none', borderBottom: '1px solid var(--border-color)', transition: 'all 0.3s ease', boxShadow: isScrolled ? 'var(--shadow-sm)' : 'none' }}>
      {/* Main Brand Navbar */}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.75rem clamp(1rem, 2vw, 1.75rem)', 
        width: '100%', 
        maxWidth: '100%', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0 }}
          onClick={handleGoHome}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--color-surface-elevated, #090d16), var(--color-primary))',
            color: 'var(--color-text-on-primary, #ffffff)',
            padding: '0.45rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--color-primary-glow)',
            flexShrink: 0
          }}>
            <Scissors size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
              BILAL DIGITIZING<span style={{ color: 'var(--orange-500)' }}>.PRO</span>
            </div>
            <div className="desktop-only" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Embroidery & Vector Studio
            </div>
          </div>
        </div>

        {/* Public Navigation Links (Desktop) */}
        {safeCurrentView === 'public' && (
          <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            {/* Home Link */}
            <button 
              onClick={handleGoHome}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/' ? 'var(--orange-500)' : 'var(--text-main)', 
                fontWeight: currentPath === '/' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Home
            </button>

            {/* Services Dropdown Item */}
            <div 
              ref={servicesDropdownRef}
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button 
                onClick={() => {
                  handleNavClick('services');
                  setIsServicesOpen(!isServicesOpen);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: (currentPath.includes('/services') || currentPath === '/custom-patches') ? 'var(--orange-500)' : 'var(--text-main)', 
                  fontWeight: (currentPath.includes('/services') || currentPath === '/custom-patches') ? 800 : 600, 
                  fontSize: '0.925rem', 
                  cursor: 'pointer', 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'color 0.15s ease'
                }}
              >
                Services <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: isServicesOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {/* Services Dropdown Popup Card Menu */}
              {isServicesOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  paddingTop: '8px',
                  zIndex: 2000
                }}>
                  <div style={{
                    width: '240px',
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                    animation: 'fadeIn 0.15s ease-out'
                  }}>
                    {/* Option 1: Embroidery Digitizing */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        if (setActiveHomeServiceTab) setActiveHomeServiceTab('embroidery');
                        navigate('/services/embroidery-digitizing');
                        setIsServicesOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.85rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.12)';
                        e.currentTarget.style.color = 'var(--orange-500)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      <PenTool size={16} /> Embroidery Digitizing
                    </button>

                    {/* Option 2: Vector Art */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        if (setActiveHomeServiceTab) setActiveHomeServiceTab('vector-art');
                        navigate('/services/vector-tracing');
                        setIsServicesOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.85rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.12)';
                        e.currentTarget.style.color = 'var(--orange-500)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      <ImageIcon size={16} /> Vector Art
                    </button>
                    
                    {/* Option 3: Custom Patches */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        if (setActiveHomeServiceTab) setActiveHomeServiceTab('patches');
                        navigate('/custom-patches');
                        setIsServicesOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.85rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.12)';
                        e.currentTarget.style.color = 'var(--orange-500)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      <Award size={16} /> Custom Patches
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/portfolio');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/portfolio' ? 'var(--orange-500)' : 'var(--text-main)', 
                fontWeight: currentPath === '/portfolio' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Portfolio
            </button>
            
            {/* Pricing Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/pricing');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/pricing' ? 'var(--orange-500)' : 'var(--text-main)', 
                fontWeight: currentPath === '/pricing' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Pricing
            </button>
            
            {/* FAQs Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/faqs');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/faqs' ? 'var(--orange-500)' : 'var(--text-main)', 
                fontWeight: currentPath === '/faqs' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              FAQs
            </button>
            
          </nav>
        )}



                {/* Right Action CTAs */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem',
          flexShrink: 0
        }}>
          {/* Primary Get Started Button (Desktop - only for non-authenticated guests) */}
          {!safeIsAuthenticated && safeCurrentView !== 'admin' && safeCurrentView !== 'customer' && !currentPath.includes('admin') && (
            <button 
              className="desktop-only btn btn-primary-orange"
              onClick={() => {
                if (openOrderWizard) {
                  openOrderWizard({ type: 'all' });
                } else {
                  protectedNavigate('customer', true, { type: 'all' });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          )}

          {/* Mobile Right Action Area (Clean Three-Lines Hamburger Menu) */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {/* Mobile Three-Lines Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: isMobileMenuOpen ? 'rgba(255, 122, 0, 0.12)' : 'transparent',
                border: isMobileMenuOpen ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                color: isMobileMenuOpen ? 'var(--orange-500)' : 'var(--text-main)',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
              aria-label="Toggle Navigation Menu"
              title="Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Dynamic Header Controls (Desktop) */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            
            {/* 1. Theme Mood Toggle */}
            <ThemeToggle />

            {!safeIsAuthenticated ? (
              <button 
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                  background: 'transparent',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px'
                }}
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                  navigate('/login');
                }}
              >
                <User size={14} /> Client Login
              </button>
            ) : (
              <>
                {/* 2. Permanent Order Now Button for Logged-In Clients Only (Never on Admin) */}
                {isClient && (
                  <button
                    type="button"
                    onClick={() => {
                      if (setIsOrderWizardOpen) setIsOrderWizardOpen(true);
                      else if (openOrderWizard) openOrderWizard({ type: 'embroidery' });
                      else protectedNavigate('customer', true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'linear-gradient(135deg, var(--color-primary, #ff7a00) 0%, var(--orange-600, #ea580c) 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 1rem',
                      height: '38px',
                      borderRadius: '9px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px var(--color-primary-glow, rgba(249, 115, 22, 0.35))',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 5px 16px var(--color-primary-glow, rgba(249, 115, 22, 0.45))';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 3px 12px var(--color-primary-glow, rgba(249, 115, 22, 0.35))';
                    }}
                    title="Place a New Custom Digitizing or Vector Order"
                  >
                    <PlusCircle size={15} style={{ strokeWidth: 2.5 }} />
                    <span>Order Now</span>
                  </button>
                )}

                {safeCurrentView === 'public' && (
                  <button 
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 800,
                      borderColor: 'var(--orange-500)',
                      color: 'var(--orange-500)',
                      background: 'var(--bg-card)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.85rem'
                    }}
                    onClick={() => {
                      if (isAdmin) {
                        navigate('/admin-portal');
                        if (setCurrentView) setCurrentView('admin');
                        protectedNavigate('admin', false);
                      } else {
                        navigate('/client-portal');
                        if (setCurrentView) setCurrentView('customer');
                        protectedNavigate('customer', false);
                      }
                    }}
                  >
                    <User size={14} style={{ color: 'var(--orange-500)' }} /> {isAdmin ? 'Admin Portal' : 'Dashboard'}
                  </button>
                )}
                
                {/* TOP HEADER CHAT / INBOX BUTTON */}
                <button
                    type="button"
                    onClick={handleOpenInbox}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: unreadChatCount > 0 ? 'var(--color-primary)' : 'var(--color-primary-light)',
                      border: unreadChatCount > 0 ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      color: unreadChatCount > 0 ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-primary)',
                      padding: '0.45rem 0.85rem',
                      height: '38px',
                      borderRadius: '9px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-text-on-primary, #ffffff)'; }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.background = unreadChatCount > 0 ? 'var(--color-primary)' : 'var(--color-primary-light)'; 
                      e.currentTarget.style.color = unreadChatCount > 0 ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-primary)'; 
                    }}
                    title={safeAuthUser?.role === 'admin' ? 'Open Admin Chat Inbox' : 'Open Working Chat & Order Discussions'}
                  >
                    <MessageSquare size={16} />
                    <span>Inbox</span>
                    {unreadChatCount > 0 && (
                      <span style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }}>
                        {unreadChatCount}
                      </span>
                    )}
                  </button>

                  {/* TOP HEADER NOTIFICATION BELL WITH DROPDOWN SUPPORT */}
                  <div ref={notificationDropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                      }}
                      style={{
                        position: 'relative',
                        background: isNotificationDropdownOpen ? 'var(--color-primary, #ff7a00)' : 'var(--color-subtle, #f8fafc)',
                        border: '1px solid var(--color-border)',
                        color: isNotificationDropdownOpen ? '#ffffff' : 'var(--color-text-primary, var(--navy-800))',
                        width: '38px',
                        height: '38px',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      aria-label="Notifications"
                      title="Notifications"
                    >
                      <Bell size={17} />
                      {unreadNotificationsCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'var(--color-primary)',
                          color: 'var(--color-text-on-primary, #ffffff)',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid var(--color-surface, #ffffff)'
                        }}>
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>

                    {/* NOTIFICATION POPUP DROPDOWN LIST */}
                    {isNotificationDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 'min(340px, calc(100vw - 20px))',
                        background: 'var(--color-surface, #ffffff)',
                        border: '1.5px solid var(--color-border)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(15, 23, 42, 0.18))',
                        padding: '1rem',
                        zIndex: 3000,
                        animation: 'fadeIn 0.15s ease-out'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text-primary, var(--navy-900))' }}>Notifications</span>
                            {unreadNotificationsCount > 0 && (
                              <span style={{ fontSize: '0.72rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 800 }}>
                                {unreadNotificationsCount} unread
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { if (markAllNotificationsAsRead) markAllNotificationsAsRead(); }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Mark all read
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                          {notifications.length === 0 ? (
                            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((item) => (
                              <div 
                                key={item.id} 
                                onClick={() => {
                                  setIsNotificationDropdownOpen(false);
                                  handleNotificationClick(item, {
                                    markNotificationAsRead,
                                    markGlobalNotificationAsRead: markNotificationAsRead,
                                    authUser: safeAuthUser,
                                    isAuthenticated: safeIsAuthenticated,
                                    setIsAuthModalOpen,
                                    setAuthModalMode,
                                    orders,
                                    openOrderTrackerDrawer,
                                    setSelectedOrderForDrawer,
                                    setActiveAdminTab,
                                    setActiveCustomerTab,
                                    navigate,
                                    protectedNavigate,
                                    currentView: safeCurrentView,
                                    mobileMode
                                  });
                                }}
                                style={{ 
                                  padding: '0.65rem 0.75rem', 
                                  background: item.read ? 'var(--bg-subtle, #f8fafc)' : 'var(--color-primary-light)', 
                                  borderRadius: '10px', 
                                  borderLeft: item.read ? '3.5px solid var(--color-border)' : '3.5px solid var(--color-primary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-primary, var(--navy-900))' }}>{item.title}</div>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                    {item.timestamp ? (item.timestamp.includes('T') ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.timestamp) : 'Just now'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{item.message}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TOP HEADER SUPPORT DROPDOWN (?) */}
                  <div ref={supportDropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSupportDropdownOpen(!isSupportDropdownOpen);
                      }}
                      style={{
                        position: 'relative',
                        background: isSupportDropdownOpen ? 'var(--color-subtle, #f1f5f9)' : 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--color-text-secondary, var(--navy-600))',
                        width: '38px',
                        height: '38px',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      aria-label="Support & Help"
                      title="Support & Help"
                      onMouseOver={(e) => { if(!isSupportDropdownOpen) e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)'; }}
                      onMouseOut={(e) => { if(!isSupportDropdownOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <HelpCircle size={18} />
                    </button>

                    {/* SUPPORT POPUP DROPDOWN LIST */}
                    {isSupportDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 'min(240px, calc(100vw - 20px))',
                        background: 'var(--color-surface, #ffffff)',
                        border: '1.5px solid var(--color-border)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(15, 23, 42, 0.25))',
                        padding: '0.5rem',
                        zIndex: 3000,
                        animation: 'fadeIn 0.15s ease-out'
                      }}>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); navigate('/faqs'); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-primary, var(--navy-900))', fontSize: '0.875rem', fontWeight: 600 }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f8fafc)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Ask the Community / FAQs
                        </button>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); navigate('/blogs'); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-primary, var(--navy-900))', fontSize: '0.875rem', fontWeight: 600 }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f8fafc)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Blogs
                        </button>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); navigate('/terms'); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-primary, var(--navy-900))', fontSize: '0.875rem', fontWeight: 600 }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f8fafc)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Terms and Conditions
                        </button>
                        <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.35rem 0' }}></div>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); handleOpenLiveSupport(); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-primary, var(--orange-600))', fontSize: '0.875rem', fontWeight: 700 }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-light, #fff7ed)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Support (24/7 Live Chat)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Menu / Admin Profile Dropdown */}
                  <UserMenuDropdown />
                </>
              )}
            </div>
          </div>
        </div>

      {/* Mobile Drawer (Backdrop Overlay + Smooth Slide-In Sheet) */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop Overlay (Click outside to close) */}
          <div 
            className="mobile-drawer-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchMove={(e) => {
              if (e.cancelable) e.preventDefault();
              e.stopPropagation();
            }}
            aria-hidden="true"
          />

          {/* Drawer Sheet Panel */}
          <aside 
            className="mobile-drawer-sheet"
            role="dialog"
            aria-label="Navigation Menu"
            style={{
              padding: '1.25rem 1.15rem',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.85rem',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* 1. Header Area: Brand Logo + Theme Toggle + Clean "X" Close Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              <div 
                onClick={() => { handleGoHome(); setIsMobileMenuOpen(false); }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #090d16, var(--color-primary))',
                  color: '#ffffff',
                  padding: '0.4rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px var(--color-primary-glow)'
                }}>
                  <Scissors size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-0.02em' }}>
                  BILAL DIGITIZING<span style={{ color: 'var(--color-primary)' }}>.PRO</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ThemeToggle variant="pill" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    background: isDark ? '#1e293b' : '#f1f5f9',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    transition: 'all 0.15s ease'
                  }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Center Area (User Profile + Navigation Links) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '2px'
            }}>
              {/* 2. User Profile / Auth Section */}
              {safeIsAuthenticated ? (
                <div style={{
                  background: isDark ? '#1e293b' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--orange-600) 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px var(--color-primary-glow)'
                    }}>
                      {safeAuthUser?.name ? safeAuthUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isDark ? '#ffffff' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {safeAuthUser?.name || 'Customer Account'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {safeAuthUser?.email || 'Logged In'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.4rem', paddingTop: '0.25rem', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (isAdmin) protectedNavigate('admin');
                        else protectedNavigate('customer');
                      }}
                      style={{
                        background: 'var(--color-primary)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      <User size={13} /> My Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (logout) logout();
                      }}
                      style={{
                        background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                        color: isDark ? '#fca5a5' : '#dc2626',
                        border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fecaca',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    style={{
                      background: isDark ? '#1e293b' : '#f8fafc',
                      border: isDark ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid #cbd5e1',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderRadius: '10px',
                      padding: '0.65rem 0.5rem',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    <LogIn size={15} style={{ color: 'var(--color-primary)' }} />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.65rem 0.5rem',
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.35)'
                    }}
                  >
                    <UserPlus size={15} />
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* 3. Navigation Links (Clean Vertical List with subtle icons and dividers) */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {/* Home */}
                <button
                  type="button"
                  onClick={() => {
                    handleGoHome();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Home size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>Home</span>
                  </div>
                  <ChevronRight size={15} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                </button>

                {/* Services Collapsible Accordion */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button
                    type="button"
                    onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.7rem 0.75rem',
                      borderRadius: '8px',
                      background: isMobileServicesOpen ? (isDark ? 'rgba(249, 115, 22, 0.1)' : '#fff7ed') : 'transparent',
                      border: 'none',
                      color: isMobileServicesOpen ? 'var(--color-primary)' : (isDark ? '#f1f5f9' : '#1e293b'),
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Layers size={18} style={{ color: 'var(--color-primary)' }} />
                      <span>Services</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      style={{ 
                        color: isMobileServicesOpen ? 'var(--color-primary)' : (isDark ? '#64748b' : '#94a3b8'),
                        transform: isMobileServicesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }} 
                    />
                  </button>

                  {/* Sub-Services Accordion Dropdown */}
                  {isMobileServicesOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      paddingLeft: '1.25rem',
                      marginTop: '0.2rem',
                      marginBottom: '0.2rem',
                      borderLeft: isDark ? '2px solid rgba(249, 115, 22, 0.3)' : '2px solid #fed7aa',
                      marginLeft: '1.1rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/services/embroidery-digitizing');
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#cbd5e1' : '#334155',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <PenTool size={15} style={{ color: '#f97316' }} />
                        <span>Embroidery Digitizing</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigate('/services/vector-tracing');
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#cbd5e1' : '#334155',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <ImageIcon size={15} style={{ color: '#3b82f6' }} />
                        <span>Vector Art Tracing</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigate('/custom-patches');
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#cbd5e1' : '#334155',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <Award size={15} style={{ color: '#10b981' }} />
                        <span>Custom Patches</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Portfolio Gallery */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/portfolio');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                    <span>Portfolio Gallery</span>
                  </div>
                  <ChevronRight size={15} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                </button>

                {/* Pricing & Rates */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/pricing');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <DollarSign size={18} style={{ color: '#10b981' }} />
                    <span>Pricing & Rates</span>
                  </div>
                  <ChevronRight size={15} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                </button>

                {/* FAQs & Guides */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/faqs');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <HelpCircle size={18} style={{ color: '#3b82f6' }} />
                    <span>FAQs & Formats</span>
                  </div>
                  <ChevronRight size={15} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                </button>

                {/* Blogs & Industry Guides */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/blogs');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <BookOpen size={18} style={{ color: '#ec4899' }} />
                    <span>Blogs & Guides</span>
                  </div>
                  <ChevronRight size={15} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                </button>

                {/* Contact / 24/7 Live Support */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenLiveSupport();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Headphones size={18} style={{ color: '#06b6d4' }} />
                    <span>Contact / 24/7 Support</span>
                  </div>
                  <ChevronRight size={15} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                </button>
              </nav>
            </div>

            {/* 4. Footer / Actions Area: Start Order & Install App */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
              paddingTop: '0.75rem',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              {/* Primary CTA: Start Order */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (openOrderWizard) openOrderWizard({ type: 'all' });
                  else protectedNavigate('customer', true, { type: 'all' });
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px var(--color-primary-glow)',
                  width: '100%'
                }}
              >
                <Upload size={16} />
                <span>Start Order</span>
                <ArrowRight size={15} />
              </button>

              {/* Install Mobile App Compact Banner/Button */}
              <button
                type="button"
                onClick={handleInstallMobileApp}
                style={{
                  background: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
                  color: isDark ? '#6ee7b7' : '#047857',
                  border: isDark ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '0.55rem 0.85rem',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={15} />
                <span>Install Mobile App (1-Tap Access)</span>
                <Download size={13} />
              </button>
            </div>
          </aside>
        </>
      )}
    </header>
  );
};

