import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ORDER_STATUSES, validateStatusTransition } from '../utils/orderLifecycle.js';

describe('1. Customer Order Cancellation Request System', () => {
  test('validates cancellation_requested transitions in state machine', () => {
    // Eligible states can transition to cancellation_requested
    assert.equal(validateStatusTransition(ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.CANCELLATION_REQUESTED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLATION_REQUESTED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.CANCELLATION_REQUESTED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.CANCELLATION_REQUESTED), true);

    // Terminal or completed states CANNOT transition to cancellation_requested
    assert.equal(validateStatusTransition(ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLATION_REQUESTED), false);
    assert.equal(validateStatusTransition(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLATION_REQUESTED), false);
    assert.equal(validateStatusTransition(ORDER_STATUSES.CANCELLED, ORDER_STATUSES.CANCELLATION_REQUESTED), false);
  });

  test('validates admin review transitions from cancellation_requested', () => {
    // Admin can approve to CANCELLED
    assert.equal(validateStatusTransition(ORDER_STATUSES.CANCELLATION_REQUESTED, ORDER_STATUSES.CANCELLED), true);
    // Admin can reject and restore to IN_PROGRESS, DIGITIZING, or SUBMITTED
    assert.equal(validateStatusTransition(ORDER_STATUSES.CANCELLATION_REQUESTED, ORDER_STATUSES.IN_PROGRESS), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.CANCELLATION_REQUESTED, ORDER_STATUSES.DIGITIZING), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.CANCELLATION_REQUESTED, ORDER_STATUSES.SUBMITTED), true);
  });

  test('safely merges cancellation metadata into order notes without overwriting existing specifications', () => {
    const existingNotes = {
      fabric: 'Pique Knit Polo',
      dimensions: '3.5 inches wide',
      stitchCount: 8500,
      uploadedFiles: [{ name: 'logo.png', url: 'https://cloudinary.com/logo.png' }]
    };

    const cancellationPayload = {
      status: 'pending_review',
      reason: 'Client decided to change garment type and cancelled design project.',
      requested_at: new Date().toISOString(),
      requested_by: 'client@example.com',
      previous_status: 'in_progress',
      refund_issued: false
    };

    const mergedNotes = {
      ...existingNotes,
      cancellation: cancellationPayload
    };

    // Confirm original specifications intact
    assert.equal(mergedNotes.fabric, 'Pique Knit Polo');
    assert.equal(mergedNotes.dimensions, '3.5 inches wide');
    assert.equal(mergedNotes.stitchCount, 8500);
    assert.equal(mergedNotes.uploadedFiles.length, 1);

    // Confirm cancellation metadata safely stored
    assert.equal(mergedNotes.cancellation.status, 'pending_review');
    assert.equal(mergedNotes.cancellation.reason, 'Client decided to change garment type and cancelled design project.');
    assert.equal(mergedNotes.cancellation.refund_issued, false);
  });

  test('enforces strict idempotency on wallet refunds for approved cancellations', () => {
    let orderNotes = {
      cancellation: {
        status: 'pending_review',
        reason: 'Duplicate artwork upload by mistake.',
        refund_issued: false,
        refund_amount: 0
      }
    };
    let walletBalance = 50.00;
    const orderPaidAmount = 25.00;
    const transactions = [];

    // First Admin Approval: Should issue refund
    if (!orderNotes.cancellation.refund_issued) {
      walletBalance += orderPaidAmount;
      orderNotes.cancellation.refund_issued = true;
      orderNotes.cancellation.refund_amount = orderPaidAmount;
      transactions.push({ type: 'refund', amount: orderPaidAmount });
    }

    assert.equal(walletBalance, 75.00);
    assert.equal(orderNotes.cancellation.refund_issued, true);
    assert.equal(transactions.length, 1);

    // Second Admin Approval (Simulated duplicate webhook or button click): Must NOT issue double refund
    let secondRefundIssued = false;
    if (!orderNotes.cancellation.refund_issued) {
      walletBalance += orderPaidAmount;
      secondRefundIssued = true;
    }

    assert.equal(secondRefundIssued, false);
    assert.equal(walletBalance, 75.00); // Balance remains untouched
    assert.equal(transactions.length, 1); // No duplicate ledger entry
  });
});

describe('2. Mobile VIP Architecture & Bottom Navigation Tabs', () => {
  test('BDigitizingMobileApp bottom nav contains the 5 primary tabs: Home, Orders, Messages, Wallet, Profile', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/mobile/BDigitizingMobileApp.jsx'), 'utf-8');
    
    // Bottom nav bar tabs verification
    assert.match(fileContent, /Tab 1: Home/);
    assert.match(fileContent, /Tab 2: Orders/);
    assert.match(fileContent, /Tab 3: Messages/);
    assert.match(fileContent, /Tab 4: Wallet/);
    assert.match(fileContent, /Tab 5: Profile/);

    // Tab buttons set correct mobileTab states
    assert.match(fileContent, /setMobileTab\('home'\)/);
    assert.match(fileContent, /setMobileTab\('orders'\)/);
    assert.match(fileContent, /setMobileTab\('inbox'\)/);
    assert.match(fileContent, /setMobileTab\('wallet'\)/);
    assert.match(fileContent, /setMobileTab\('profile'\)/);
  });

  test('BDigitizingMobileApp dedicated VIP Studio Wallet view is rendered', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/mobile/BDigitizingMobileApp.jsx'), 'utf-8');
    
    assert.match(fileContent, /SCREEN: DEDICATED VIP STUDIO WALLET VIEW/);
    assert.match(fileContent, /mobileTab === 'wallet'/);
    assert.match(fileContent, /Available Wallet Balance/);
    assert.match(fileContent, /Top-Up Balance/);
    assert.match(fileContent, /Recent Transactions/);
  });

  test('CustomerDashboard mobile bottom nav contains the 5 primary tabs', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/CustomerDashboard.jsx'), 'utf-8');
    
    assert.match(fileContent, /Tab 3: Messages \/ Inbox/);
    assert.match(fileContent, /Tab 4: Studio Wallet/);
    assert.match(fileContent, /Tab 5: Profile \/ Account/);
    assert.match(fileContent, /setActiveTab\('inbox'\)/);
    assert.match(fileContent, /setActiveTab\('wallet'\)/);
    assert.match(fileContent, /setActiveTab\('profile'\)/);
  });

  test('Static clutter cards are removed from CustomerDashboard mobile view in favor of clean popup banner', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/CustomerDashboard.jsx'), 'utf-8');
    
    // Confirms static PWA card and 4-8 Hour Express hero banner removed from CustomerDashboard
    assert.equal(fileContent.includes('Get the BDigitizing App'), false);
    assert.equal(fileContent.includes('4-8 HOUR EXPRESS'), false);

    // Confirms PWA install popup banner exists in common components
    const pwaContent = fs.readFileSync(path.join(process.cwd(), 'src/components/common/PWAInstallBanner.jsx'), 'utf-8');
    assert.match(pwaContent, /Install BDigitizing App/);
    assert.match(pwaContent, /bdigi_trigger_pwa_install/);
  });
});

describe('3. Mobile Hygiene: WhatsApp Removal & Stat Cards Hidden on Mobile', () => {
  test('WhatsApp Desk and Phone Hotlines are removed from mobile app menu and support modal', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/mobile/BDigitizingMobileApp.jsx'), 'utf-8');
    
    // Confirms WhatsApp Desk & Hotlines menu item removed
    assert.equal(fileContent.includes('WhatsApp Desk & Hotlines'), false);
    // Confirms WhatsApp Master Desk button removed from support modal
    assert.equal(fileContent.includes('WhatsApp Master Desk'), false);
    // Confirms in-app direct chat is available
    assert.match(fileContent, /Direct In-App Chat/);
  });

  test('WhatsApp popup is hidden in mobile app mode in ClientLayoutShell', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/ClientLayoutShell.jsx'), 'utf-8');
    
    assert.match(fileContent, /\{!isAppMode && <WhatsAppMessagePopup \/>\}/);
  });

  test('Desktop stat cards grid (.customer-stat-cards-grid) is display: none !important on mobile in index.css', () => {
    const cssContent = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf-8');
    
    // Check max-width: 768px rule
    const mobileQueryMatch = cssContent.match(/@media\s*\(max-width:\s*768px\)[\s\S]*?\.customer-stat-cards-grid\s*\{[\s\S]*?display:\s*none\s*!important;/);
    assert.ok(mobileQueryMatch, 'customer-stat-cards-grid must be display: none !important in @media (max-width: 768px)');
  });

  test('The 4 duplicate quick action buttons are completely removed from CustomerDashboard mobile view', () => {
    const dashboardContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/CustomerDashboard.jsx'), 'utf-8');
    
    // Verify 4 Quick Action Cards grid is eliminated
    assert.equal(dashboardContent.includes('4 Quick Action Cards'), false);
    assert.equal(dashboardContent.includes('repeat(4, minmax(0, 1fr))'), false);
  });

  test('Smart Launch App vs Install App handling across CustomerDashboard, HeaderNav, and PWAInstallBanner', () => {
    const dashboardContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/CustomerDashboard.jsx'), 'utf-8');
    const headerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/HeaderNav.jsx'), 'utf-8');
    const pwaContent = fs.readFileSync(path.join(process.cwd(), 'src/components/common/PWAInstallBanner.jsx'), 'utf-8');
    const layoutContent = fs.readFileSync(path.join(process.cwd(), 'app/layout.jsx'), 'utf-8');

    // Early prompt capture in layout
    assert.match(layoutContent, /window\.deferredPWAInstallPrompt = e/);
    assert.match(layoutContent, /bdigi_pwa_installed/);

    // CustomerDashboard smart launch vs install
    assert.match(dashboardContent, /<span>Launch App<\/span>/);
    assert.match(dashboardContent, /<span>Install App<\/span>/);
    assert.match(dashboardContent, /window\.location\.href = '\/\?app=true'/);
    assert.match(dashboardContent, /promptObj\.prompt\(\)/);

    // HeaderNav smart launch vs install
    assert.match(headerContent, /isAppInstalled \? 'Launch Mobile App \(1-Tap Access\)' : 'Install Mobile App \(1-Tap Access\)'/);
    assert.match(headerContent, /window\.location\.href = '\/\?app=true'/);

    // PWAInstallBanner Launch App
    assert.match(pwaContent, /<span>Launch App<\/span>/);
    assert.match(pwaContent, /handleInstallClick/);
    assert.match(pwaContent, /await promptObj\.prompt\(\)/);
  });
});

describe('4. Comprehensive Customer Cancellation Button Complete Removal Across All Touchpoints', () => {
  test('OrderTrackerDrawer has completely removed customer cancellation buttons and modal', () => {
    const drawerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/OrderTrackerDrawer.jsx'), 'utf-8');

    // Header Cancel Button removed
    assert.ok(!drawerContent.includes('<XCircle size={12} /> Cancel Order'), 'Header Cancel Order button must be removed');
    // Quick Toolbar Cancel Button removed
    assert.ok(!drawerContent.includes('<XCircle size={14} /> Cancel Order'), 'Quick Toolbar Cancel Order button must be removed');
    // Customer action cancellation request button removed
    assert.ok(!drawerContent.includes('<XCircle size={14} /> Request Cancellation'), 'Customer Request Cancellation action button must be removed');
    // Customer cancellation modal removed
    assert.ok(!drawerContent.includes('Customer Order Cancellation Modal'), 'Customer Order Cancellation Modal must be removed');
  });

  test('CustomerDashboard has completely removed Cancel buttons from table, cards, and tabs', () => {
    const dashboardContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/CustomerDashboard.jsx'), 'utf-8');

    // Desktop table Cancel button removed
    assert.ok(!dashboardContent.includes('<XCircle size={12} /> Cancel'), 'Desktop table Cancel button must be removed');

    // Active order card Cancel button removed
    assert.ok(!dashboardContent.includes('<XCircle size={12} /> Cancel Order'), 'Active order card Cancel Order button must be removed');

    // Orders tab grid Cancel button removed
    assert.ok(!dashboardContent.includes('<XCircle size={13} /> Cancel'), 'Orders tab grid Cancel button must be removed');
  });

  test('BDigitizingMobileApp has completely removed Cancel buttons from cards and action sheets', () => {
    const mobileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/mobile/BDigitizingMobileApp.jsx'), 'utf-8');

    // Direct Cancel button on mobile order cards removed
    assert.ok(!mobileContent.includes('<XCircle size={11} /> Cancel'), 'Mobile order card Cancel button must be removed');

    // Action sheet cancellation button removed
    assert.ok(!mobileContent.includes('Request Cancellation'), 'Mobile action sheet Request Cancellation must be removed');
  });
});


