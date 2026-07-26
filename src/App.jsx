import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { StateProvider, useAppState } from './context/StateContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/public/HeroSection';
import { CustomerSewOutsSection } from './components/public/CustomerSewOutsSection';
import { PricingCalculator } from './components/public/PricingCalculator';
import { CustomPatchesSection } from './components/public/CustomPatchesSection';
import { PortfolioSlider } from './components/public/PortfolioSlider';
import { MerchandiseStore } from './components/public/MerchandiseStore';
import { StorePage } from './components/public/StorePage';
import { VectorArtPage } from './components/public/VectorArtPage';
import { CoreServicesOrderSection } from './components/public/CoreServicesOrderSection';
import { WhyChooseUs } from './components/public/WhyChooseUs';
import { TestimonialsFAQ } from './components/public/TestimonialsFAQ';
import { Footer } from './components/public/Footer';

import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { OrderWizardModal } from './components/customer/OrderWizardModal';
import { StoreOrderModal } from './components/customer/StoreOrderModal';
import { OrderTrackerDrawer } from './components/customer/OrderTrackerDrawer';
import { DepositModal } from './components/customer/DepositModal';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { SecureAdminLogin } from './components/auth/SecureAdminLogin';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

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

    // 3. Calculator / Pricing
    if (combined.startsWith('calculat') || combined.startsWith('price') || combined.startsWith('pric')) {
      setCurrentView('public');
      setTimeout(() => {
        const el = document.getElementById('calculator');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
      const isMasterAdmin = isAuthenticated && authUser?.email?.toLowerCase().trim() === 'shahidbutt59191@gmail.com';
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
        const el = document.getElementById(scrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [scrollTo, setCurrentView]);

  return (
    <>
      <HeroSection />
      <CoreServicesOrderSection />
      <CustomerSewOutsSection />
      <PricingCalculator />
      <CustomPatchesSection />
      <WhyChooseUs />
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
          <Route path="/services" element={<PublicView scrollTo="services" />} />
          <Route path="/embroidery-digitizing" element={<PublicView scrollTo="services" />} />
          <Route path="/patches" element={<PublicView scrollTo="custom-patches" />} />
          <Route path="/custom-patches" element={<PublicView scrollTo="custom-patches" />} />
          <Route path="/vector-art" element={<VectorArtPage />} />
          <Route path="/portfolio" element={<PublicView scrollTo="portfolio" />} />
          <Route path="/calculator" element={<PublicView scrollTo="calculator" />} />
          <Route path="/pricing" element={<PublicView scrollTo="calculator" />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/formats" element={<PublicView scrollTo="formats" />} />
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

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            {toast.type === 'warning' && <AlertTriangle size={18} />}
            <span>{toast.message}</span>
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
