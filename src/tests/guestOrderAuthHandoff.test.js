import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('OrderWizardModal never shows confusing inline login details and directs unauthenticated orders cleanly to login', () => {
  const source = read('src/components/customer/OrderWizardModal.jsx');

  // Must NEVER show inline login / account creation fields on Step 5
  assert.equal(source.includes('Studio Account Setup / Sign In'), false);
  assert.equal(source.includes('Create an account or sign in to place this order'), false);
  assert.equal(source.includes('guestAuthCardRef'), false);
  assert.equal(source.includes('Your Full Name *'), false);
  assert.equal(source.includes('Create Account & Place Order'), false);

  // Must preserve order draft and route cleanly to login
  assert.equal(source.includes("navigateTo('/login?redirect=/order')"), true);
  assert.equal(source.includes('bdigi_pending_order_draft'), true);
  assert.equal(source.includes('Sign In to Place Order'), true);
  assert.equal(source.includes('Confirm & Place Order'), true);
});

test('MobileSimpleOrderModal never shows confusing inline login details and directs unauthenticated orders cleanly to login', () => {
  const source = read('src/components/customer/MobileSimpleOrderModal.jsx');

  // Must NEVER show inline checkout login card on mobile
  assert.equal(source.includes('Customer Checkout Details'), false);
  assert.equal(source.includes('Instant One-Tap Google Checkout'), false);
  assert.equal(source.includes('guestAuthCardRef'), false);
  assert.equal(source.includes('Create Account & Place Order'), false);

  // Must preserve order draft and route cleanly to login
  assert.equal(source.includes("navigateTo('/login?redirect=/order')"), true);
  assert.equal(source.includes('bdigi_pending_order_draft'), true);
  assert.equal(source.includes('Sign In to Place Order'), true);
  assert.equal(source.includes('Place Order Now'), true);
});

test('StateContext and AuthModal seamlessly guard order entry and resume pending orders post-login', () => {
  const stateContextSource = read('src/context/StateContext.jsx');
  const authModalSource = read('src/components/auth/AuthModal.jsx');

  // StateContext openOrderWizard directs unauthenticated users to login
  assert.equal(stateContextSource.includes("navigateTo('/login?redirect=/order')"), true);
  assert.equal(stateContextSource.includes('bdigi_pending_order_wizard'), true);

  // AuthModal handles pending order resumption
  assert.equal(authModalSource.includes('bdigi_pending_order_wizard'), true);
  assert.equal(authModalSource.includes('handlePostCustomerAuth'), true);
});
