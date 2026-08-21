'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '../utils/navigation';
import { useAppState } from '../context/StateContext';
import { 
  Scissors, 
  Globe, 
  User, 
  ChevronDown, 
  Menu, 
  X, 
  MessageSquare, 
  Bell, 
  PenTool, 
  Image as ImageIcon, 
  Award, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  Headphones
} from 'lucide-react';
import { UserMenuDropdown } from './common/UserMenuDropdown';
import { ThemeToggle } from './common/ThemeToggle';

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
    currentView, 
    setCurrentView,
    isAuthenticated,
    authUser,
    protectedNavigate,
    setIsAuthModalOpen,
    setAuthModalMode,
    openOrderWizard,
    openOrderTrackerDrawer,
    setActiveAdminTab,
    setActiveCustomerTab,
    setActiveHomeServiceTab,
    notifications = [],
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount = 0,
    unreadChatCount = 0,
    setMobileMode
  } = useAppState();

  const safeCurrentView = mounted ? currentView : 'public';
  const safeIsAuthenticated = mounted ? isAuthenticated : false;
  const safeAuthUser = mounted ? authUser : null;
  const currentPath = mounted ? (location?.pathname || '') : '';

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
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
          <nav className="desktop-only" style={{ alignItems: 'center', gap: '1.75rem' }}>
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
          {/* Primary Get Started Button (Desktop) */}
          {safeCurrentView !== 'admin' && safeCurrentView !== 'customer' && !currentPath.includes('admin') && (
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

          {/* Mobile Quick-Access Inbox Button for Logged-In Users */}
          {safeIsAuthenticated && (
            <button
              type="button"
              className="mobile-only"
              onClick={handleOpenInbox}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--orange-500)',
                cursor: 'pointer',
                position: 'relative'
              }}
              title="Open Inbox"
              aria-label="Open Inbox"
            >
              <MessageSquare size={19} />
              {unreadChatCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  borderRadius: '9999px',
                  padding: '1px 5px',
                  lineHeight: 1.2
                }}>
                  {unreadChatCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Theme Toggle Quick Icon */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: isMobileMenuOpen ? 'rgba(255, 122, 0, 0.12)' : 'transparent',
              border: isMobileMenuOpen ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
              color: isMobileMenuOpen ? 'var(--orange-500)' : 'var(--text-main)',
              width: '42px',
              height: '42px',
              minWidth: '42px',
              minHeight: '42px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Theme Toggle Button (Desktop) */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
          </div>

          {/* Dynamic Authentication Controls (Desktop) */}
          {!safeIsAuthenticated ? (
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            </div>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    if (safeAuthUser?.role === 'admin') {
                      protectedNavigate('admin', false);
                      navigate('/admin-portal');
                    } else {
                      protectedNavigate('customer', false);
                      navigate('/client-portal');
                    }
                  }}
                >
                  <User size={14} style={{ color: 'var(--orange-500)' }} /> Dashboard
                </button>
              )}
              
              {/* TOP HEADER CHAT & NOTIFICATIONS FOR ALL AUTHENTICATED USERS */}
              {safeIsAuthenticated && (
                <>
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
                                  if (markNotificationAsRead) markNotificationAsRead(item.id);
                                  setIsNotificationDropdownOpen(false);
                                  
                                  const targetOrderId = item.order_id || item.orderId;
                                  if (targetOrderId && openOrderTrackerDrawer) {
                                    openOrderTrackerDrawer(targetOrderId);
                                  }

                                  if (item.link) {
                                    protectedNavigate(safeCurrentView === 'admin' ? 'admin' : 'customer');
                                    navigate(item.link);
                                  }
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
                </>
              )}

              <UserMenuDropdown />
            </div>
          )}

          {safeCurrentView !== 'public' && (
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleGoHome}
            >
              <Globe size={14} /> Public Website
            </button>
          )}
        </div>
      </div>

      {/* Mobile Slide-Down / Overlay Navigation Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-only"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100dvh',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '4.5rem 1.25rem 2rem 1.25rem',
            gap: '0.75rem',
            animation: 'fadeIn 0.2s ease-out',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Close button inside mobile menu */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)'
            }}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>

          {/* Theme Mood Selector (Mobile) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0',
            borderBottom: '1px solid var(--border-color)',
            marginTop: '0.5rem'
          }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Theme Mood
            </span>
            <ThemeToggle variant="pill" />
          </div>

          <button
            type="button"
            onClick={() => {
              handleGoHome();
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', padding: '0.65rem 0', borderBottom: '1px solid var(--border-color)' }}
          >
            Home
          </button>

          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.5rem' }}>
            Services
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/services/embroidery-digitizing');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            <PenTool size={18} style={{ color: 'var(--orange-500)' }} /> Embroidery Digitizing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/services/vector-tracing');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            <ImageIcon size={18} style={{ color: '#2563eb' }} /> Vector Art
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/custom-patches');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            <Award size={18} style={{ color: '#10b981' }} /> Custom Patches
          </button>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }}></div>

          <button
            type="button"
            onClick={() => {
              navigate('/portfolio');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            Portfolio
          </button>
          
          <button
            type="button"
            onClick={() => {
              navigate('/pricing');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            Pricing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/faqs');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            FAQs
          </button>
          
          <button
            type="button"
            onClick={() => {
              navigate('/blogs');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', padding: '0.5rem 0' }}
          >
            Blogs & Guides
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                if (setMobileMode) setMobileMode('app');
                setIsMobileMenuOpen(false);
              }}
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <Sparkles size={16} style={{ color: '#f59e0b' }} />
              <span>📱 Open BDigitizing App Mode</span>
            </button>
            {!safeIsAuthenticated ? (
              <>
                <button
                  className="btn btn-primary-orange btn-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (openOrderWizard) {
                      openOrderWizard({ type: 'all' });
                    } else {
                      protectedNavigate('customer', true, { type: 'all' });
                    }
                  }}
                  style={{ fontWeight: 800, justifyContent: 'center', width: '100%' }}
                >
                  Get Started <ArrowRight size={16} style={{marginLeft: '0.25rem'}}/>
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  style={{ fontWeight: 700, justifyContent: 'center', width: '100%', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <User size={16} /> Client Login
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenLiveSupport();
                  }}
                  style={{ fontWeight: 700, justifyContent: 'center', width: '100%', borderColor: 'var(--border-color)', color: 'var(--orange-500)', background: 'rgba(255, 122, 0, 0.05)' }}
                >
                  <Headphones size={16} /> 🎧 Live Support Chat
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
                <button
                  className="btn btn-primary-orange btn-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenInbox();
                  }}
                  style={{ fontWeight: 800, justifyContent: 'center', width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <MessageSquare size={16} /> 💬 Open Inbox {unreadChatCount > 0 && `(${unreadChatCount})`}
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenLiveSupport();
                  }}
                  style={{ fontWeight: 700, justifyContent: 'center', width: '100%', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <Headphones size={16} /> 🎧 Customer Support & Help
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => {
                    protectedNavigate('customer', false);
                    setIsMobileMenuOpen(false);
                    navigate('/client-portal');
                  }}
                  style={{ fontWeight: 700, justifyContent: 'center', width: '100%', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <User size={16} /> Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

