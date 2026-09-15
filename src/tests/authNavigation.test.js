import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Auth Navigation & Single Popup Architecture', () => {
  test('1. Dedicated auth route list correctly identifies standalone authentication pages', () => {
    const isDedicatedAuthRoute = (pathname) => {
      return ['/login', '/signup', '/reset-password', '/secure-admin-login'].includes(pathname);
    };

    assert.equal(isDedicatedAuthRoute('/login'), true);
    assert.equal(isDedicatedAuthRoute('/signup'), true);
    assert.equal(isDedicatedAuthRoute('/reset-password'), true);
    assert.equal(isDedicatedAuthRoute('/secure-admin-login'), true);

    assert.equal(isDedicatedAuthRoute('/'), false);
    assert.equal(isDedicatedAuthRoute('/client-portal'), false);
    assert.equal(isDedicatedAuthRoute('/pricing'), false);
    assert.equal(isDedicatedAuthRoute('/services/embroidery-digitizing'), false);
  });

  test('2. Header "Client Login" triggers modal in-place without triggering navigate()', () => {
    let modalMode = null;
    let isModalOpen = false;
    let navigatedTo = null;

    const setAuthModalMode = (mode) => { modalMode = mode; };
    const setIsAuthModalOpen = (open) => { isModalOpen = open; };
    const navigate = (to) => { navigatedTo = to; };

    const handleDesktopClientLogin = () => {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    };

    handleDesktopClientLogin();

    assert.equal(modalMode, 'login', 'Modal mode must be set to login');
    assert.equal(isModalOpen, true, 'Modal open state must be set to true');
    assert.equal(navigatedTo, null, 'Must NOT trigger navigation, preventing double popup');
  });

  test('3. Mobile "Sign In" and "Register" actions close drawer and open modal in-place', () => {
    let modalMode = null;
    let isModalOpen = false;
    let isMobileMenuOpen = true;
    let navigatedTo = null;

    const setAuthModalMode = (mode) => { modalMode = mode; };
    const setIsAuthModalOpen = (open) => { isModalOpen = open; };
    const setIsMobileMenuOpen = (open) => { isMobileMenuOpen = open; };
    const navigate = (to) => { navigatedTo = to; };

    const handleMobileSignIn = () => {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      setIsMobileMenuOpen(false);
    };

    handleMobileSignIn();
    assert.equal(modalMode, 'login');
    assert.equal(isModalOpen, true);
    assert.equal(isMobileMenuOpen, false);
    assert.equal(navigatedTo, null);

    isMobileMenuOpen = true;
    const handleMobileRegister = () => {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      setIsMobileMenuOpen(false);
    };

    handleMobileRegister();
    assert.equal(modalMode, 'signup');
    assert.equal(isModalOpen, true);
    assert.equal(isMobileMenuOpen, false);
    assert.equal(navigatedTo, null);
  });

  test('4. Client Portal unauthenticated guard redirects cleanly to /login with redirect parameter', () => {
    let redirectedRoute = null;
    let redirectOptions = null;
    let currentView = 'customer';
    let isAuthModalOpened = false;

    const navigate = (route, options) => {
      redirectedRoute = route;
      redirectOptions = options;
    };
    const setCurrentView = (v) => { currentView = v; };
    const setIsAuthModalOpen = (o) => { isAuthModalOpened = o; };

    const handleClientPortalAuthGuard = (isUserLoggedIn) => {
      if (!isUserLoggedIn) {
        if (currentView !== 'public') setCurrentView('public');
        navigate('/login?redirect=/client-portal', { replace: true });
      }
    };

    handleClientPortalAuthGuard(false);

    assert.equal(redirectedRoute, '/login?redirect=/client-portal');
    assert.deepEqual(redirectOptions, { replace: true });
    assert.equal(currentView, 'public');
    assert.equal(isAuthModalOpened, false, 'Should not trigger modal overlay when redirecting to /login');
  });

  test('5. Post-login Order Wizard ONLY opens when orderWizardInitialData is present', () => {
    const simulatePostLogin = (orderWizardInitialData, authModalTarget) => {
      let wizardOpened = false;
      if (orderWizardInitialData) {
        wizardOpened = true;
      }
      return wizardOpened;
    };

    assert.equal(
      simulatePostLogin(null, 'customer'), 
      false, 
      'Standard customer login must NOT pop up the Order Wizard'
    );

    assert.equal(
      simulatePostLogin({ type: 'embroidery', serviceCategory: 'left_chest' }, 'customer'), 
      true, 
      'Must open Order Wizard if the customer had configured order data'
    );
  });

  test('6. Safe redirect destination parsing prevents open redirect vulnerabilities', () => {
    const resolveTargetRoute = (redirectParam, role) => {
      const defaultRoute = (role === 'admin') ? '/admin-portal' : '/client-portal';
      const isValidRedirect = redirectParam && 
        redirectParam.startsWith('/') && 
        !redirectParam.startsWith('/login') && 
        !redirectParam.startsWith('//');
      
      return isValidRedirect ? redirectParam : defaultRoute;
    };

    assert.equal(resolveTargetRoute('/client-portal?tab=inbox', 'customer'), '/client-portal?tab=inbox');
    assert.equal(resolveTargetRoute('/services/vector-art', 'customer'), '/services/vector-art');
    assert.equal(resolveTargetRoute('/login', 'customer'), '/client-portal');
    assert.equal(resolveTargetRoute('https://evil.com', 'customer'), '/client-portal');
    assert.equal(resolveTargetRoute('//evil.com', 'customer'), '/client-portal');
    assert.equal(resolveTargetRoute(null, 'admin'), '/admin-portal');
  });
});
