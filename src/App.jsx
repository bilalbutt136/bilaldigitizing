import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { StateProvider, useAppState } from './context/StateContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/public/HeroSection';
import { CustomerSewOutsSection } from './components/public/CustomerSewOutsSection';
import { PricingCalculator } from './components/public/PricingCalculator';
import { CustomPatchesSection } from './components/public/CustomPatchesSection';
import { PortfolioPage } from './components/public/PortfolioPage';
import { MerchandiseStore } from './components/public/MerchandiseStore';
import { StorePage } from './components/public/StorePage';
import { VectorArtPage } from './components/public/VectorArtPage';
import { EmbroideryDigitizingPage } from './components/public/EmbroideryDigitizingPage';
import { CustomApparelPage } from './components/public/CustomApparelPage';
import { CustomHeadwearPage } from './components/public/CustomHeadwearPage';
import { CoreServicesOrderSection } from './components/public/CoreServicesOrderSection';
import { ServicesGrid } from './components/public/ServicesGrid';
import { StructuredServicesSection } from './components/public/StructuredServicesSection';
import { WhyChooseUs } from './components/public/WhyChooseUs';
import { TestimonialsFAQ } from './components/public/TestimonialsFAQ';
import { Footer } from './components/public/Footer';

import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { OrderWizardModal } from './components/customer/OrderWizardModal';
import { StoreOrderModal } from './components/customer/StoreOrderModal';
import { OrderTrackerDrawer } from './components/customer/OrderTrackerDrawer';
import { DepositModal } from './components/customer/DepositModal';
import { ClientLiveChatWidget } from './components/customer/ClientLiveChatWidget';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { SecureAdminLogin } from './components/auth/SecureAdminLogin';
import { CheckCircle2, Info, AlertTriangle, AlertCircle } from 'lucide-react';

// Sync URL Path & Auto-Correct Typos with StateContext
const UrlSyncHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentView, 
    setCurrentView, 
    setIsAuthModalOpen, 
    setAuthModalMode,
    isAuthenticated,
    authUser,
    siteSettings = {},
    depositFunds
  } = useAppState();

  useEffect(() => {
    const rawPath = location.pathname.toLowerCase();
    const rawHash = location.hash.toLowerCase();
    const combined = (rawPath + rawHash).replace('/', '').replace('#', '');

    // BoltPayouts Return Callback Verification Handler
    const searchParams = new URLSearchParams(location.search);
    const boltStatus = searchParams.get('bolt_status') || searchParams.get('payment') || searchParams.get('status');
    const depositAmount = searchParams.get('amount') || searchParams.get('deposit_amount');

    if ((boltStatus === 'success' || boltStatus === 'completed') && depositAmount) {
      const amountNum = parseFloat(depositAmount);
      if (!isNaN(amountNum) && amountNum > 0) {
        depositFunds(amountNum);
        navigate(location.pathname, { replace: true });
      }
    }

    // 1. Secure Admin Login Secret Route
    if (rawPath === '/secure-admin-login' || rawPath === '/system-access') {
      return;
    }

    // 2. Client Auth Routes
    if (combined.startsWith('signu') || combined.startsWith('signup')) {
      setCurrentView('public');
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      if (rawPath !== '/signup') navigate('/signup', { replace: true });
      return;
    }

    if (combined.startsWith('logi') || combined.startsWith('login') || combined.startsWith('signin')) {
      setCurrentView('public');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      if (rawPath !== '/login') navigate('/login', { replace: true });
      return;
    }

    if (combined.includes('reset-password') || combined.includes('type=recovery') || location.hash.includes('type=recovery')) {
      setCurrentView('public');
      setAuthModalMode('update_password');
      setIsAuthModalOpen(true);
      return;
    }

    // 3. Calculator / Pricing
    if (combined.startsWith('calculat') || combined.startsWith('price') || combined.startsWith('pric')) {
      setCurrentView('public');
      if (rawPath !== '/embroidery-digitizing') navigate('/embroidery-digitizing', { replace: true });
      return;
    }

    // 4. Client Portal routes
    if (rawPath === '/client-portal' || rawPath === '/dashboard') {
      if (!isAuthenticated) {
        setIsAuthModalOpen(true);
        setAuthModalMode('login');
        setCurrentView('public');
      } else {
        setCurrentView('customer');
      }
      return;
    }

    // 5. Admin Portal routes
    if (rawPath === '/admin-portal' || rawPath === '/admin') {
      const configuredAdmin = (siteSettings?.adminEmail || 'shahidbutt59191@gmail.com').toLowerCase().trim();
      const isMasterAdmin = isAuthenticated && (
        authUser?.email?.toLowerCase().trim() === configuredAdmin ||
        authUser?.email?.toLowerCase().trim() === 'shahidbutt59191@gmail.com'
      );
      if (!isMasterAdmin) {
        if (isAuthenticated) {
          navigate('/client-portal', { replace: true });
        } else {
          navigate('/secure-admin-login', { replace: true });
        }
      } else {
        setCurrentView('admin');
      }
      return;
    }

    // 6. Hash scrolling for public sections
    if (rawHash) {
      const cleanHash = rawHash.startsWith('#') ? rawHash : `#${rawHash}`;
      const element = document.querySelector(cleanHash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.pathname, location.hash, isAuthenticated, authUser, navigate, setCurrentView, setIsAuthModalOpen, setAuthModalMode]);

  return null;
};

// Main Public View Page Component
const PublicView = ({ scrollTo }) => {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
    if (scrollTo) {
      setTimeout(() => {
        const targetId = scrollTo === 'services' ? 'sew-outs' : scrollTo;
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }
  }, [scrollTo, setCurrentView]);

  return (
    <>
      {/* Section 1: Hero & Service Switcher */}
      <HeroSection />

      {/* Section 2: Category-Specific Work Showcase & Sew-Outs */}
      <CustomerSewOutsSection />

      {/* Section 3: Technical Advantages & Production Process */}
      <WhyChooseUs />

      {/* Social Proof & FAQ */}
      <TestimonialsFAQ />
    </>
  );
};

// Smart Redirect Component for invalid or mistyped routes
const SmartRedirect = () => {
  const { isAuthenticated } = useAppState();
  return <Navigate to={isAuthenticated ? "/client-portal" : "/"} replace />;
};

// Main App Inner Component
const MainContent = () => {
  const { currentView, toast } = useAppState();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UrlSyncHandler />
      <HeaderNav />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route path="/login" element={<PublicView />} />
          <Route path="/signup" element={<PublicView />} />
          <Route path="/reset-password" element={<PublicView />} />
          <Route path="/services" element={<PublicView scrollTo="services" />} />
          <Route path="/embroidery-digitizing" element={<EmbroideryDigitizingPage />} />
          <Route path="/services/embroidery-digitizing" element={<EmbroideryDigitizingPage />} />
          <Route path="/patches" element={<CustomPatchesSection />} />
          <Route path="/custom-patches" element={<CustomPatchesSection />} />
          <Route path="/custom-tshirts" element={<Navigate to="/custom-patches" replace />} />
          <Route path="/custom-caps" element={<Navigate to="/custom-patches" replace />} />
          <Route path="/services/vector-tracing" element={<VectorArtPage />} />
          <Route path="/vector-art" element={<VectorArtPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/calculator" element={<Navigate to="/embroidery-digitizing" replace />} />
          <Route path="/pricing" element={<Navigate to="/embroidery-digitizing" replace />} />
          <Route path="/store" element={<Navigate to="/custom-patches" replace />} />
          <Route path="/formats" element={<PublicView scrollTo="services" />} />
          <Route path="/faq" element={<PublicView scrollTo="faqs" />} />
          
          <Route path="/client-portal" element={<CustomerDashboard />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          
          <Route path="/admin-portal" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Secret Admin Authentication Route */}
          <Route path="/secure-admin-login" element={<SecureAdminLogin />} />
          <Route path="/system-access" element={<SecureAdminLogin />} />
          
          {/* Default Auto-Redirect for mistyped or invalid routes */}
          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </main>

      <Footer />

      {/* Global Modals & Drawers */}
      <AuthModal />
      <OrderWizardModal />
      <StoreOrderModal />
      <OrderTrackerDrawer />
      <DepositModal />
      <ClientLiveChatWidget />

      {/* Global Top Center Toast Notification Popup */}
      {toast && (
        <div 
          className="toast-container"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            width: 'auto',
            maxWidth: '90vw'
          }}
        >
          <div 
            className={`toast toast-${toast.type}`}
            style={{
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1.4rem',
              borderRadius: '16px',
              background: toast.type === 'error' ? 'linear-gradient(135deg, #1e1b1e 0%, #0f172a 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 0 1.5px ' + (
                toast.type === 'error' ? '#ef4444' : 
                toast.type === 'success' ? '#22c55e' : 
                toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
              ),
              fontSize: '0.925rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              animation: 'toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              backdropFilter: 'blur(12px)',
              maxWidth: '520px',
              textAlign: 'left'
            }}
          >
            {toast.type === 'error' && <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />}
            {toast.type === 'success' && <CheckCircle2 size={22} style={{ color: '#22c55e', flexShrink: 0 }} />}
            {toast.type === 'info' && <Info size={22} style={{ color: '#3b82f6', flexShrink: 0 }} />}
            {toast.type === 'warning' && <AlertTriangle size={22} style={{ color: '#f59e0b', flexShrink: 0 }} />}
            <span style={{ lineHeight: 1.35 }}>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StateProvider>
          <MainContent />
        </StateProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
