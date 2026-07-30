'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from '../utils/navigation';
import { useAppState } from '../context/StateContext';
import { 
  Phone, 
  Mail, 
  Clock, 
  Scissors, 
  PlusCircle, 
  ShieldCheck, 
  UserCheck, 
  Globe, 
  LogOut,
  LogIn,
  TrendingUp,
  User,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  Zap,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { UserMenuDropdown } from './common/UserMenuDropdown';

export const HeaderNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStoreActive = location.pathname === '/store';

  const { 
    currentView, 
    setCurrentView,
    isAuthenticated,
    authUser,
    logout,
    protectedNavigate,
    setIsAuthModalOpen,
    setAuthModalMode,
    openOrderWizard
  } = useAppState();

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const servicesDropdownRef = useRef(null);
  const storeDropdownRef = useRef(null);
  const pricingDropdownRef = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (sectionId) => {
    setCurrentView('public');
    if (location.pathname !== '/') {
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

  const handleGoStore = () => {
    setCurrentView('public');
    navigate('/store');
  };

  const handleGoHome = () => {
    setCurrentView('public');
    navigate('/');
  };

  const handleGoClientPortal = () => {
    protectedNavigate('customer');
    if (isAuthenticated) {
      navigate('/client-portal');
    }
  };

  const handleGoAdminPortal = () => {
    protectedNavigate('admin');
    if (isAuthenticated && authUser?.role === 'admin') {
      navigate('/admin-portal');
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
      {/* Main Brand Navbar */}

      {/* 2. Main Brand Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem 0.85rem 0.75rem', width: '100%' }}>
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginLeft: 0 }}
          onClick={handleGoHome}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-900), #ff7a00)',
            color: '#ffffff',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)'
          }}>
            <Scissors size={24} style={{ color: 'var(--orange-500)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--navy-900)', letterSpacing: '-0.02em', leading: 1 }}>
              BILAL DIGITIZING<span style={{ color: 'var(--orange-500)' }}>.PRO</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Embroidery & Vector Studio
            </div>
          </div>
        </div>

        {/* Public Navigation Links (Desktop) */}
        {currentView === 'public' && (
          <nav className="desktop-only" style={{ alignItems: 'center', gap: '1.75rem' }}>
            {/* Home Link */}
            <button 
              onClick={handleGoHome}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: location.pathname === '/' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: location.pathname === '/' ? 800 : 600, 
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
                  color: isServicesOpen ? 'var(--orange-600)' : 'var(--navy-800)', 
                  fontWeight: 600, 
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
                    width: '210px',
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
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.4rem 0.85rem 0.2rem' }}>
                      Digital Studio Services
                    </div>

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
                        transition: 'all 0.18s ease'
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
                      Embroidery Digitizing
                    </button>

                    {/* Option 2: Vector Tracing */}
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
                        transition: 'all 0.18s ease'
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
                      Vector Tracing & Redraw
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Patches & Emblems Nav Button */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/custom-patches');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: location.pathname === '/custom-patches' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: location.pathname === '/custom-patches' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Custom Patches
            </button>

            {/* Pricing Dropdown Item */}
            <div 
              ref={pricingDropdownRef}
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setIsPricingOpen(true)}
              onMouseLeave={() => setIsPricingOpen(false)}
            >
              <button 
                onClick={() => {
                  setCurrentView('public');
                  if (location.pathname !== '/') {
                    navigate('/pricing');
                  } else {
                    const el = document.getElementById('pricing');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                  setIsPricingOpen(!isPricingOpen);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: isPricingOpen ? 'var(--orange-600)' : 'var(--navy-800)', 
                  fontWeight: 600, 
                  fontSize: '0.925rem', 
                  cursor: 'pointer', 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'color 0.15s ease'
                }}
              >
                Pricing <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: isPricingOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {/* Pricing Dropdown Popup Card Menu */}
              {isPricingOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  paddingTop: '8px',
                  zIndex: 2000
                }}>
                  <div style={{
                    width: '220px',
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
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.4rem 0.85rem 0.2rem' }}>
                      Rates & Pricing Tiers
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/services/embroidery-digitizing');
                        setIsPricingOpen(false);
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
                        fontWeight: 700
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = 'var(--orange-600)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--navy-900)'; }}
                    >
                      Embroidery Digitizing Rates
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/services/vector-tracing');
                        setIsPricingOpen(false);
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
                        fontWeight: 700
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = 'var(--orange-600)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--navy-900)'; }}
                    >
                      Vector Tracing Rates
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/pricing?cat=patches');
                        setIsPricingOpen(false);
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
                        fontWeight: 700
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = 'var(--orange-600)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--navy-900)'; }}
                    >
                      Custom Patches Tiers
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
                color: location.pathname === '/portfolio' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: location.pathname === '/portfolio' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Portfolio
            </button>
          </nav>
        )}



        {/* Right Action CTAs */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem',
          marginRight: !isAuthenticated ? '0.5rem' : '0'
        }}>
          
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: '#f1f5f9',
              border: '1px solid var(--border-color)',
              color: 'var(--navy-900)',
              padding: '0.45rem',
              borderRadius: '8px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          {/* Primary Order Now Button - Direct Navigation to Order Builder & Payment System */}
          {currentView !== 'admin' && currentView !== 'customer' && !location.pathname.includes('admin') && (
            <button 
              className="btn btn-primary-orange btn-sm"
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
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.825rem',
                fontWeight: 800
              }}
            >
              <PlusCircle size={14} /> Order Now
            </button>
          )}

          {/* Dynamic Authentication Controls */}
          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.825rem'
                }}
                onClick={() => {
                  setAuthModalMode('signup');
                  setIsAuthModalOpen(true);
                  navigate('/signup');
                }}
              >
                <UserCheck size={14} /> Sign Up
              </button>

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
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.825rem'
                }}
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                  navigate('/login');
                }}
              >
                <LogIn size={14} /> Sign In
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {currentView === 'public' && (
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
              
              <UserMenuDropdown />
            </div>
          )}

          {currentView !== 'public' && (
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleGoHome}
            >
              <Globe size={14} /> Public Website
            </button>
          )}
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-only"
          style={{
            flexDirection: 'column',
            background: '#ffffff',
            borderTop: '1px solid var(--border-color)',
            padding: '1.25rem 1.5rem',
            gap: '0.85rem',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <button
            type="button"
            onClick={() => {
              handleGoHome();
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)', padding: '0.4rem 0' }}
          >
            Home
          </button>

          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
            Digital Studio Services
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/services/embroidery-digitizing');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)', padding: '0.4rem 0' }}
          >
            Embroidery Digitizing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/services/vector-tracing');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)', padding: '0.4rem 0' }}
          >
            Vector Tracing & Redraw
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/portfolio');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)', padding: '0.4rem 0' }}
          >
            Portfolio Showcase
          </button>

          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.6rem', marginBottom: '0.2rem' }}>
            Physical Custom Goods
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/custom-patches');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)', padding: '0.4rem 0' }}
          >
            Custom Patches & Emblems
          </button>

          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {!isAuthenticated ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  className="btn btn-outline btn-md"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                  style={{ fontWeight: 700, justifyContent: 'center' }}
                >
                  <UserCheck size={16} /> Sign Up
                </button>

                <button
                  className="btn btn-primary-orange btn-md"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  style={{ fontWeight: 800, justifyContent: 'center' }}
                >
                  <LogIn size={16} /> Sign In
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary-orange btn-md"
                onClick={() => {
                  protectedNavigate('customer', false);
                  setIsMobileMenuOpen(false);
                  navigate('/client-portal');
                }}
                style={{ fontWeight: 800, justifyContent: 'center' }}
              >
                <User size={16} /> Go to Client Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
