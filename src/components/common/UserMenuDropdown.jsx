'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  User, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  Wallet, 
  PlusCircle,
  Palette,
  Check
} from 'lucide-react';

export const UserMenuDropdown = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    isAuthenticated,
    currentView,
    authUser, 
    currentUser, 
    logout, 
    walletBalance = 0,
    setIsDepositModalOpen,
    setIsOrderWizardOpen,
    setSelectedOrderForDrawer,
    setActiveCustomerTab,
    showToast,
    protectedNavigate,
    theme = 'light',
    toggleTheme,
    colorTheme = 'studio-orange',
    setColorTheme,
    availableThemes = []
  } = useAppState();

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted || (!isAuthenticated && !authUser?.email)) return null;

  const activeUser = authUser || currentUser || {
    name: 'Verified User',
    email: '',
    company: '',
    role: 'customer'
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      navigate('/');
    }
    showToast('Signed out successfully', 'info');
  };

  const cleanName = (activeUser?.name || 'Verified User')
    .replace(/\s*\([^)]*ADMIN[^)]*\)/gi, '')
    .replace(/ADMIN/gi, '')
    .trim();

  const initials = (cleanName || 'Client User')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isViewingAdmin = 
    activeUser?.role === 'admin' || 
    (mounted && currentView === 'admin') || 
    (mounted && typeof window !== 'undefined' && window.location && window.location.pathname.includes('admin'));
  const badgeLabel = isViewingAdmin ? 'STUDIO ADMIN' : 'VERIFIED CLIENT';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? '#fff7ed' : '#ffffff',
          border: isOpen ? '2px solid var(--orange-500)' : '1.5px solid var(--border-color)',
          padding: '2px',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        title={`${cleanName} (${activeUser?.email || ''})`}
      >
        {/* User Initials Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--navy-900) 0%, #1e293b 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #ffffff'
        }}>
          {initials}
        </div>
      </button>

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div 
          className="theme-light-enforced"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 35px -8px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          
          {/* Menu User Header (Compact 3-Line Layout) */}
          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--color-subtle, #f8fafc)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-primary, var(--navy-900))', lineHeight: 1.2 }}>
              {cleanName || 'Verified User'}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: '0.1rem', lineHeight: 1.2 }}>
              {activeUser?.email || 'Not signed in'}
            </div>
            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', background: 'var(--color-primary-light, #fff7ed)', color: 'var(--color-primary, var(--orange-700))', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '9999px', border: '1px solid var(--color-primary)', lineHeight: 1.2 }}>
                {badgeLabel}
              </span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '9999px', lineHeight: 1.2 }}>
                ONLINE
              </span>
            </div>
          </div>

          {/* Quick Wallet Summary */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface, #ffffff)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary, var(--navy-800))' }}>
              <Wallet size={15} style={{ color: 'var(--color-primary, var(--orange-500))' }} /> Studio Wallet:
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary, var(--orange-600))' }}>
              ${walletBalance.toFixed(2)}
            </span>
          </div>

          {/* Menu Options List */}
          <div style={{ padding: '0.5rem 0' }}>
            
            {/* Admin Portal Overview Option (Admins Only) */}
            {authUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  protectedNavigate('admin', false);
                }}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, var(--navy-900))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={16} style={{ color: 'var(--color-primary, var(--orange-500))' }} /> Admin Portal
              </button>
            )}

            {/* Client Dashboard Overview Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (setSelectedOrderForDrawer) setSelectedOrderForDrawer(null);
                if (setActiveCustomerTab) setActiveCustomerTab('dashboard');
                protectedNavigate('customer', false);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, var(--navy-900))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={16} style={{ color: 'var(--color-primary, var(--orange-500))' }} /> Client Dashboard
            </button>

            {/* Account Settings Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (typeof window !== 'undefined') {
                  if (window.location.pathname.includes('client-portal')) {
                    if (setIsDepositModalOpen) setIsDepositModalOpen(true);
                  } else {
                    window.location.href = '/client-portal?tab=wallet';
                  }
                } else if (setIsDepositModalOpen) {
                  setIsDepositModalOpen(true);
                }
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, var(--navy-900))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Settings size={16} style={{ color: 'var(--color-text-secondary, var(--navy-700))' }} /> Account Settings & Wallet
            </button>

            {/* Theme Switcher Toggle Option */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {theme === 'dark' ? (
                  <Moon size={16} style={{ color: 'var(--color-primary)' }} />
                ) : (
                  <Sun size={16} style={{ color: 'var(--color-primary)' }} />
                )}
                <span>Theme Mood</span>
              </div>
              <span style={{
                fontSize: '0.725rem',
                fontWeight: 800,
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px',
                border: '1px solid var(--color-border)'
              }}>
                {theme === 'dark' ? 'Darker 🌙' : 'White ☀️'}
              </span>
            </button>

            {/* Quick 5 Themes Palette Selector */}
            <div style={{ padding: '0.35rem 1rem 0.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div 
                onClick={() => setShowThemePicker(!showThemePicker)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: '0.2rem 0'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Palette size={14} style={{ color: 'var(--color-primary)' }} /> Palette:
                </span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                  {availableThemes.find(t => t.id === colorTheme)?.name || 'Executive Studio Pro'}
                </span>
              </div>

              {showThemePicker && (
                <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {availableThemes.slice(0, 5).map((preset) => {
                    const isSelected = colorTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorTheme(preset.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                          background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                          fontSize: '0.775rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span 
                            style={{ 
                              width: '10px', 
                              height: '10px', 
                              borderRadius: '50%', 
                              background: preset.palette?.primary || '#ea580c',
                              boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                            }} 
                          />
                          <span>{preset.name}</span>
                        </div>
                        {isSelected && <Check size={13} style={{ color: 'var(--color-primary)' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upload New Order Quick Action */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (setIsOrderWizardOpen) {
                  setIsOrderWizardOpen(true);
                } else {
                  protectedNavigate('customer', true);
                }
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, var(--navy-900))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <PlusCircle size={16} style={{ color: 'var(--color-primary, var(--orange-500))' }} /> New Design Brief
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.4rem 0' }} />

            {/* Logout Option */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} style={{ color: '#ef4444' }} /> Sign Out
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
