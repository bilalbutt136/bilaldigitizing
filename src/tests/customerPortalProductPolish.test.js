import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboard = fs.readFileSync('src/components/customer/CustomerDashboard.jsx', 'utf8');
const chat = fs.readFileSync('src/components/customer/CustomerSupportChat.jsx', 'utf8');
const chatHeader = fs.readFileSync('src/components/customer/CustomerChatHeader.jsx', 'utf8');
const chatImage = fs.readFileSync('src/components/customer/ChatAttachmentImage.jsx', 'utf8');
const profile = fs.readFileSync('src/components/customer/CustomerProfilePanel.jsx', 'utf8');
const ordersHeader = fs.readFileSync('src/components/customer/OrdersManagementHeader.jsx', 'utf8');
const readyBanner = fs.readFileSync('src/components/customer/OrdersReadyBanner.jsx', 'utf8');
const mobileOrder = fs.readFileSync('src/components/customer/MobileOrderTrackingCard.jsx', 'utf8');
const css = fs.readFileSync('src/styles/customerPortalPolish.css', 'utf8');

describe('Customer Portal Product Polish Regression', () => {
  test('profile and orders experiences are modularized instead of remaining dashboard monolith markup', () => {
    assert.match(dashboard, /import CustomerProfilePanel from/);
    assert.match(dashboard, /import OrdersManagementHeader from/);
    assert.match(dashboard, /import OrdersReadyBanner from/);
    assert.match(dashboard, /<CustomerProfilePanel/);
    assert.match(dashboard, /<OrdersManagementHeader/);
    assert.match(dashboard, /<OrdersReadyBanner/);

    assert.match(profile, /Account details/);
    assert.match(profile, /Studio wallet/);
    assert.match(profile, /Preferences/);
    assert.match(ordersHeader, /role="tablist"/);
    assert.match(readyBanner, /Production files are available/);
  });

  test('chat uses light modular chrome with safe attachment previews', () => {
    assert.match(chat, /<CustomerChatHeader/);
    assert.match(chat, /<ChatAttachmentImage/);
    assert.equal(chat.includes("linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"), false);
    assert.equal(chat.includes('Sound ON'), false);
    assert.equal(chat.includes('<img'), false);

    assert.match(chatHeader, /Private workspace for quotes, artwork, and custom offers/);
    assert.match(chatImage, /const failedChatImageUrls = new Set\(\)/);
    assert.match(chatImage, /failedChatImageUrls\.has\(normalizedSrc\)/);
    assert.match(chatImage, /failedChatImageUrls\.add\(normalizedSrc\)/);
  });

  test('chat effects have stable dependencies and explicit realtime cleanup', () => {
    assert.equal(chat.includes('oxlint-disable react-hooks/exhaustive-deps'), false);
    assert.equal(chat.includes('}, [conversationId, messages.length, userEmail]);'), false);
    assert.match(chat, /\}, \[conversationId, userEmail\]\);/);
    assert.match(chat, /document\.visibilityState === 'hidden'/);
    assert.match(chat, /\}, 30000\);/);
    assert.match(chat, /unsubscribeMessages\(\);/);
    assert.match(chat, /supabase\.removeChannel\(channel\);/);
    assert.match(chat, /clearInterval\(interval\);/);
    assert.match(chat, /clearTimeout\(toastTimeoutRef\.current\);/);
    assert.match(chat, /clearTimeout\(scrollTimeoutRef\.current\);/);
  });

  test('mobile order cards are memoized and expose clear payment/tracking/file actions', () => {
    assert.match(mobileOrder, /export default React\.memo\(MobileOrderTrackingCard\)/);
    assert.match(mobileOrder, /Pay order/);
    assert.match(mobileOrder, /Track order/);
    assert.match(mobileOrder, /View files/);
    assert.match(mobileOrder, /mobile-order-progress-track/);
    assert.match(mobileOrder, /mobile-order-status-panel/);
  });

  test('mobile CSS enforces responsive hierarchy, overflow safety, and accessible touch targets', () => {
    assert.match(css, /\.customer-profile-shell/);
    assert.match(css, /\.customer-profile-shell[\s\S]*max-width: 100%/);
    assert.match(css, /\.orders-ready-banner[\s\S]*grid-template-columns/);
    assert.match(css, /\.mobile-order-actions button[\s\S]*min-height: 44px/);
    assert.match(css, /\.customer-chat-icon-button[\s\S]*width: 44px;[\s\S]*height: 44px/);
    assert.match(css, /\.customer-chat-composer button[\s\S]*min-height: 44px/);
    assert.match(css, /@media \(max-width: 640px\)/);
    assert.match(css, /\.customer-mobile-context-header button\[aria-label="Open account profile"\][\s\S]*width: 44px !important/);
  });
});
