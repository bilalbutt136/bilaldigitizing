import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('OrderWizardModal mounts StreamlinedOrderFlow without forcing login redirection upfront', () => {
  const source = read('src/components/customer/OrderWizardModal.jsx');

  // Must mount StreamlinedOrderFlow
  assert.equal(source.includes('StreamlinedOrderFlow'), true);
  // Must NOT block guests or force them into an auth redirect wall
  assert.equal(source.includes("navigateTo('/login?redirect=/order')"), false);
});

test('MobileSimpleOrderModal mounts StreamlinedOrderFlow cleanly for mobile visitors', () => {
  const source = read('src/components/customer/MobileSimpleOrderModal.jsx');

  // Must mount StreamlinedOrderFlow
  assert.equal(source.includes('StreamlinedOrderFlow'), true);
  // Must NOT block guests or force them into an auth redirect wall
  assert.equal(source.includes("navigateTo('/login?redirect=/order')"), false);
});

test('StateContext allows guest ordering and preserves pending order resumption post-login', () => {
  const stateContextSource = read('src/context/StateContext.jsx');
  const authModalSource = read('src/components/auth/AuthModal.jsx');

  // StateContext openOrderWizard opens order flow immediately
  assert.equal(stateContextSource.includes('setIsOrderWizardOpen(true)'), true);

  // AuthModal handles pending order resumption
  assert.equal(authModalSource.includes('bdigi_pending_order_wizard'), true);
  assert.equal(authModalSource.includes('handlePostCustomerAuth'), true);
});

