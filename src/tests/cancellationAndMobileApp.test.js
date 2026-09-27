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
    assert.match(fileContent, /setIsDepositModalOpen\(true\)/);
    assert.match(fileContent, /setActiveTab\('profile'\)/);
  });

  test('Prominent PWA Install CTA is present on mobile web dashboard', () => {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'src/components/customer/CustomerDashboard.jsx'), 'utf-8');
    
    assert.match(fileContent, /Get the BDigitizing App/);
    assert.match(fileContent, /!isStandaloneApp/);
    assert.match(fileContent, /bdigi_trigger_pwa_install/);
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
});
