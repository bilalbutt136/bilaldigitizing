'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '../utils/navigation';
import { useAppState } from '../context/StateContext';
import { 
  Scissors, 
  PlusCircle, 
  UserCheck, 
  Globe, 
  LogIn,
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
  Truck,
  ArrowRight
} from 'lucide-react';
import { UserMenuDropdown } from './common/UserMenuDropdown';

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
    setActiveAdminTab,
    setActiveCustomerTab,
    notifications = [],
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount = 0
  } = useAppState();

  const safeCurrentView = mounted ? currentView : 'public';
  const safeIsAuthenticated = mounted ? isAuthenticated : false;
  const safeAuthUser = mounted ? authUser : null;
  const currentPath = mounted ? (location?.pathname || '') : '';

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [, setIsStoreOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);

  const servicesDropdownRef = useRef(null);
  const storeDropdownRef = useRef(null);
  const pricingDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const supportDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(e.target)) {
        setIsServicesOpen(false);
      }
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target)) {
        setIsStoreOpen(false);
      }
      if (pricingDropdownRef.current && !pricingDropdownRef.current.contains(e.target)) {
        setIsPricingOpen(false);
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

  const handleOpenLiveSupport = () => {
    // 1. If Admin Portal or Admin user, navigate directly to Admin Chat & Inbox tab
    if (safeIsAuthenticated && authUser?.role === 'admin') {
      if (setActiveAdminTab) setActiveAdminTab('chat');
      protectedNavigate('admin');
      navigate('/admin-portal');
      return;
    }

    // 2. If authenticated Client in Portal, set support tab active
    if (safeIsAuthenticated && setActiveCustomerTab) {
      setActiveCustomerTab('support');
    }

    // 3. Open Live Support Chat widget directly on current view (Home Page or Client Portal)
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
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: isScrolled ? 'rgba(255, 255, 255, 0.85)' : '#ffffff', backdropFilter: isScrolled ? 'blur(12px)' : 'none', borderBottom: '1px solid var(--border-color)', transition: 'all 0.3s ease', boxShadow: isScrolled ? 'var(--shadow-sm)' : 'none' }}>
      {/* Main Brand Navbar */}

      {/* 2. Main Brand Navbar */}
      <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full max-w-[1400px] mx-auto">
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0 }}
          onClick={handleGoHome}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-900), #ff7a00)',
            color: '#ffffff',
            padding: '0.45rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
            flexShrink: 0
          }}>
            <Scissors size={20} style={{ color: 'var(--orange-500)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--navy-900)', letterSpacing: '-0.02em', leading: 1, whiteSpace: 'nowrap' }}>
              BILAL DIGITIZING<span style={{ color: 'var(--orange-500)' }}>.PRO</span>
            </div>
            <div className="desktop-only" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Embroidery & Vector Studio
            </div>
          </div>
        </div>

        {/* Public Navigation Links (Desktop) */}
        {safeCurrentView === 'public' && (
          <nav className="hidden lg:flex items-center gap-7">
            {/* Home Link */}
            <button 
              onClick={handleGoHome}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/' ? 'var(--orange-600)' : 'var(--navy-800)', 
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
                  color: (currentPath.includes('/services') || currentPath === '/custom-patches') ? 'var(--orange-600)' : 'var(--navy-800)', 
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
                    background: '#ffffff',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
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
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.color = 'var(--orange-600)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                      }}
                    >
                      <PenTool size={16} /> Embroidery Digitizing
                    </button>

                    {/* Option 2: Vector Art */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
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
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.color = 'var(--orange-600)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                      }}
                    >
                      <ImageIcon size={16} /> Vector Art
                    </button>
                    
                    {/* Option 3: Custom Patches */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
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
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.color = 'var(--orange-600)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
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
                color: currentPath === '/portfolio' ? 'var(--orange-600)' : 'var(--navy-800)', 
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
                color: currentPath === '/pricing' ? 'var(--orange-600)' : 'var(--navy-800)', 
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
                color: currentPath === '/faqs' ? 'var(--orange-600)' : 'var(--navy-800)', 
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
          {/* Primary Get Started Button */}
          {safeCurrentView !== 'admin' && safeCurrentView !== 'customer' && !currentPath.includes('admin') && (
            <button 
              className="btn btn-primary-orange"
              onClick={() => {
                if (openOrderWizard) {
                  openOrderWizard();
                } else {
                  protectedNavigate('customer', true);
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

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--navy-900)',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Dynamic Authentication Controls */}
          {!safeIsAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  borderColor: 'var(--navy-300)',
                  color: 'var(--navy-800)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {safeCurrentView === 'public' && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 800,
                    borderColor: 'var(--orange-500)',
                    color: 'var(--orange-600)',
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '0.35rem 0.85rem'
                  }}
                  onClick={() => {
                    protectedNavigate('customer', false);
                    navigate('/client-portal');
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
                    onClick={handleOpenLiveSupport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(255, 122, 0, 0.1)',
                      border: '1px solid rgba(255, 122, 0, 0.35)',
                      color: 'var(--orange-600)',
                      padding: '0.45rem 0.85rem',
                      height: '38px',
                      borderRadius: '9px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#ff7a00'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 122, 0, 0.1)'; e.currentTarget.style.color = 'var(--orange-600)'; }}
                    title={safeAuthUser?.role === 'admin' ? 'Open Admin Chat Inbox' : 'Open 24/7 Live Support Chat'}
                  >
                    <MessageSquare size={16} />
                    <span>Inbox</span>
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
                        background: isNotificationDropdownOpen ? '#ff7a00' : '#f8fafc',
                        border: '1px solid var(--border-color)',
                        color: isNotificationDropdownOpen ? '#ffffff' : 'var(--navy-800)',
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
                          background: 'var(--orange-500)',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid #ffffff'
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
                        width: '310px',
                        background: '#ffffff',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '14px',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
                        padding: '0.85rem',
                        zIndex: 3000,
                        animation: 'fadeIn 0.15s ease-out'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.55rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--navy-900)' }}>Notifications</span>
                            {unreadNotificationsCount > 0 && (
                              <span style={{ fontSize: '0.7rem', background: '#fff7ed', color: '#ff7a00', border: '1px solid #ff7a00', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 800 }}>
                                {unreadNotificationsCount} unread
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { if (markAllNotificationsAsRead) markAllNotificationsAsRead(); }}
                            style={{ background: 'none', border: 'none', color: '#ff7a00', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Mark all read
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '280px', overflowY: 'auto' }}>
                          {notifications.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((item) => (
                              <div 
                                key={item.id} 
                                onClick={() => {
                                  if (markNotificationAsRead) markNotificationAsRead(item.id);
                                  setIsNotificationDropdownOpen(false);
                                  if (item.link) {
                                    protectedNavigate(safeCurrentView === 'admin' ? 'admin' : 'customer');
                                    navigate(item.link);
                                  }
                                }}
                                style={{ 
                                  padding: '0.55rem 0.65rem', 
                                  background: item.read ? '#f8fafc' : '#fff7ed', 
                                  borderRadius: '99px', 
                                  borderLeft: item.read ? '3px solid #cbd5e1' : '3px solid #ff7a00',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)' }}>{item.title}</div>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{item.timestamp}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.message}</div>
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
                        background: isSupportDropdownOpen ? '#f1f5f9' : 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--navy-600)',
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
                      onMouseOver={(e) => { if(!isSupportDropdownOpen) e.currentTarget.style.background = '#f1f5f9'; }}
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
                        width: '240px',
                        background: '#ffffff',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                        padding: '0.5rem',
                        zIndex: 3000,
                        animation: 'fadeIn 0.15s ease-out'
                      }}>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); navigate('/faqs'); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--navy-900)', fontSize: '0.875rem', fontWeight: 600 }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Ask the Community / FAQs
                        </button>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); navigate('/blogs'); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--navy-900)', fontSize: '0.875rem', fontWeight: 600 }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Blogs
                        </button>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); navigate('/terms'); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--navy-900)', fontSize: '0.875rem', fontWeight: 600 }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Terms and Conditions
                        </button>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }}></div>
                        <button 
                          onClick={() => { setIsSupportDropdownOpen(false); handleOpenLiveSupport(); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--orange-600)', fontSize: '0.875rem', fontWeight: 700 }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#fff7ed'}
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
          className="fixed inset-0 w-full h-full bg-white/95 backdrop-blur-md z-[999] flex flex-col pt-20 px-6 pb-8 gap-4 overflow-y-auto lg:hidden animate-fadeIn"
        >
          {/* Close button inside mobile menu */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '1.2rem',
              right: '1.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--navy-900)'
            }}
          >
            <X size={28} />
          </button>

          <button
            type="button"
            onClick={() => {
              handleGoHome();
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}
          >
            Home
          </button>

          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '1rem' }}>
            Services
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/services/embroidery-digitizing');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            <PenTool size={18} /> Embroidery Digitizing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/services/vector-tracing');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            <ImageIcon size={18} /> Vector Art
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/custom-patches');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            <Award size={18} /> Custom Patches
          </button>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

          <button
            type="button"
            onClick={() => {
              navigate('/portfolio');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            Portfolio
          </button>
          
          <button
            type="button"
            onClick={() => {
              navigate('/pricing');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            Pricing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/faqs');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            FAQs
          </button>
          


          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!safeIsAuthenticated ? (
              <>
                <button
                  className="btn btn-primary-orange btn-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (openOrderWizard) {
                      openOrderWizard();
                    } else {
                      protectedNavigate('customer', true);
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
                  style={{ fontWeight: 700, justifyContent: 'center', width: '100%', borderColor: 'var(--navy-300)' }}
                >
                  <User size={16} /> Client Login
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary-orange btn-lg"
                onClick={() => {
                  protectedNavigate('customer', false);
                  setIsMobileMenuOpen(false);
                  navigate('/client-portal');
                }}
                style={{ fontWeight: 800, justifyContent: 'center', width: '100%' }}
              >
                <User size={16} /> Go to Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
