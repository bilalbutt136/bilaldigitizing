import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/StateContext';
import { 
  User, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronDown, 
  Wallet, 
  ShieldCheck, 
  Sparkles,
  ShoppingBag,
  PlusCircle
} from 'lucide-react';

export const UserMenuDropdown = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated,
    currentView,
    authUser, 
    currentUser, 
    logout, 
    walletBalance = 150.00,
    setIsDepositModalOpen,
    setIsOrderWizardOpen,
    showToast
  } = useAppState();

  const [isOpen, setIsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('bdigi_theme') || 'light';
  });

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

  useEffect(() => {
    const savedTheme = localStorage.getItem('bdigi_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  if (!isAuthenticated) return null;

  const activeUser = authUser || currentUser || {
    name: 'Sarah Jenkins',
    email: 'sarah@apexapparel.com',
    company: 'Apex Athletics Apparel',
    role: 'customer'
  };

  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('bdigi_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.body.classList.add('dark-mode');
      showToast('Switched to Dark Mode 🌙', 'info');
    } else {
      document.body.classList.remove('dark-mode');
      showToast('Switched to Light Mode ☀️', 'info');
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
    showToast('Signed out successfully', 'info');
  };

  const cleanName = (activeUser?.name || 'Sarah Jenkins')
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

  const isViewingAdmin = currentView === 'admin' || (typeof window !== 'undefined' && window.location.pathname.includes('admin'));
  const badgeLabel = isViewingAdmin ? 'MASTER ADMIN' : 'VERIFIED CLIENT';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          background: isOpen ? '#fff7ed' : '#ffffff',
          border: isOpen ? '1.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
          padding: '0.3rem 0.75rem',
          borderRadius: '9999px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
      >
        {/* User Initials Avatar */}
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--orange-600) 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
          flexShrink: 0
        }}>
          {initials}
        </div>

        {/* User Name & Company */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.15 }}>
            {cleanName || 'Sarah Jenkins'}
          </span>
          <span style={{ fontSize: '0.675rem', color: 'var(--orange-600)', fontWeight: 800, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {activeUser?.company || 'Apex Athletics'}
          </span>
        </div>

        <ChevronDown size={13} style={{ color: 'var(--navy-600)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {/* Dropdown Menu Popup Box */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: '260px',
          background: '#ffffff',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
          zIndex: 2000,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          
          {/* Menu User Header (Compact 3-Line Layout) */}
          <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', lineHeight: 1.2 }}>
              {cleanName || 'Sarah Jenkins'}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: 1.2 }}>
              {activeUser?.email || 'sarah@apexapparel.com'}
            </div>
            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', background: '#fff7ed', color: 'var(--orange-700)', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '9999px', border: '1px solid var(--orange-300)', lineHeight: 1.2 }}>
                {badgeLabel}
              </span>
              <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '9999px', lineHeight: 1.2 }}>
                ONLINE
              </span>
            </div>
          </div>

          {/* Quick Wallet Summary */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-800)' }}>
              <Wallet size={15} style={{ color: 'var(--orange-500)' }} /> Studio Wallet:
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--orange-600)' }}>
              ${walletBalance.toFixed(2)}
            </span>
          </div>

          {/* Menu Options List */}
          <div style={{ padding: '0.5rem 0' }}>
            
            {/* Client Dashboard Overview Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                protectedNavigate('customer', false);
                navigate('/client-portal');
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--navy-900)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={16} style={{ color: 'var(--orange-500)' }} /> Client Dashboard
            </button>

            {/* Account Settings Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (setIsDepositModalOpen) setIsDepositModalOpen(true);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--navy-900)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Settings size={16} style={{ color: 'var(--navy-700)' }} /> Account Settings & Wallet
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
                color: 'var(--navy-900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {themeMode === 'dark' ? (
                  <Moon size={16} style={{ color: '#818cf8' }} />
                ) : (
                  <Sun size={16} style={{ color: '#f59e0b' }} />
                )}
                <span>Theme Mode</span>
              </div>
              <span style={{
                fontSize: '0.725rem',
                fontWeight: 800,
                background: themeMode === 'dark' ? '#312e81' : '#fef3c7',
                color: themeMode === 'dark' ? '#c7d2fe' : '#b45309',
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px'
              }}>
                {themeMode === 'dark' ? 'Dark 🌙' : 'Light ☀️'}
              </span>
            </button>

            {/* Upload New Order Quick Action */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (setIsOrderWizardOpen) setIsOrderWizardOpen(true);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--navy-900)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <PlusCircle size={16} style={{ color: 'var(--orange-500)' }} /> New Design Brief
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.4rem 0' }} />

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
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} style={{ color: '#dc2626' }} /> Sign Out
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
