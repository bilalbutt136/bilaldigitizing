import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Layers
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
    setAuthModalMode
  } = useAppState();

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const servicesDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(e.target)) {
        setIsServicesOpen(false);
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
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem' }}>
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
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
              BDIGITIZING<span style={{ color: 'var(--orange-500)' }}>.PRO</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Embroidery & Vector Studio
            </div>
          </div>
        </div>

        {/* Public Navigation Links */}
        {currentView === 'public' && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
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
                    width: '195px',
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
                        navigate('/embroidery-digitizing');
                        setIsServicesOpen(false);
                        setTimeout(() => {
                          const el = document.getElementById('services');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 120);
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
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      Embroidery Digitizing
                    </button>

                    {/* Option 2: Patches */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/custom-patches');
                        setIsServicesOpen(false);
                        setTimeout(() => {
                          const el = document.getElementById('custom-patches');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 120);
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
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      Patches
                    </button>

                    {/* Option 3: Vector Art */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/vector-art');
                        setIsServicesOpen(false);
                        setTimeout(() => {
                          const el = document.getElementById('services');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 120);
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
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      Vector Art
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => handleNavClick('portfolio')}
              style={{ background: 'none', border: 'none', color: 'var(--navy-800)', fontWeight: 600, fontSize: '0.925rem', cursor: 'pointer', padding: 0 }}
            >
              Portfolio
            </button>
            <button 
              onClick={() => handleNavClick('pricing')}
              style={{ background: 'none', border: 'none', color: 'var(--navy-800)', fontWeight: 600, fontSize: '0.925rem', cursor: 'pointer', padding: 0 }}
            >
              Pricing
            </button>
            <button 
              onClick={() => handleNavClick('custom-patches')}
              style={{ background: 'none', border: 'none', color: 'var(--navy-800)', fontWeight: 600, fontSize: '0.925rem', cursor: 'pointer', padding: 0 }}
            >
              Custom Patches
            </button>
            <button 
              onClick={handleGoStore}
              style={{ 
                background: isStoreActive ? 'var(--orange-50)' : 'transparent',
                border: isStoreActive ? '1.5px solid var(--orange-400)' : 'none',
                color: 'var(--orange-600)', 
                fontWeight: 800, 
                fontSize: '0.925rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                padding: isStoreActive ? '0.25rem 0.75rem' : 0,
                borderRadius: '9999px'
              }}
            >
              <ShoppingBag size={15} /> Store
            </button>
          </nav>
        )}

        {currentView === 'customer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--navy-100)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              Logged in: <strong style={{ color: 'var(--orange-700)' }}>{authUser?.company || 'Apex Athletics Apparel'}</strong>
            </div>
          </div>
        )}

        {currentView === 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--green-600)', fontWeight: 700, fontSize: '0.9rem' }}>
              <TrendingUp size={16} /> Admin Operations Authorized
            </span>
          </div>
        )}

        {/* Right Action CTAs */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem',
          marginRight: !isAuthenticated ? '1.25rem' : '0'
        }}>
          
          {/* Primary Order Now Button - Hidden on Admin, Customer Portal View & Admin Routes */}
          {currentView !== 'admin' && currentView !== 'customer' && !location.pathname.includes('admin') && (
            <button 
              className="btn btn-primary-orange btn-sm"
              onClick={() => {
                if (isAuthenticated) {
                  protectedNavigate('customer', true);
                  navigate('/client-portal');
                } else {
                  protectedNavigate('customer', true);
                  navigate('/login');
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
                    protectedNavigate('customer', true);
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
    </header>
  );
};
