import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('guest website order hands off to visible auth form instead of toast-only dead end', () => {
  const source = read('src/components/customer/OrderWizardModal.jsx');

  assert.equal(
    source.includes('Please sign in or create an account to finalize your order.'),
    false
  );
  assert.equal(source.includes('const revealGuestAuth = () =>'), true);
  assert.equal(source.includes('guestAuthCardRef.current?.scrollIntoView'), true);
  assert.equal(source.includes('guestEmailInputRef.current?.focus'), true);
  assert.equal(source.includes('Create an account or sign in to place this order'), true);
  assert.equal(source.includes('Your order details and uploaded artwork are saved here'), true);
  assert.equal(
    source.includes("{guestAuthMode === 'signup' ? 'Create Account' : 'Sign In'} & Place Order"),
    true
  );
});

test('guest mobile order uses the same auth handoff without losing the order', () => {
  const source = read('src/components/customer/MobileSimpleOrderModal.jsx');

  assert.equal(
    source.includes('Please sign in or create an account to finalize your order.'),
    false
  );
  assert.equal(source.includes('const revealGuestAuth = () =>'), true);
  assert.equal(source.includes('guestAuthCardRef.current?.scrollIntoView'), true);
  assert.equal(source.includes('Your order and artwork stay saved'), true);
  assert.equal(source.includes('disabled={isSubmitting || isSubmittingAuth}'), true);
  assert.equal(
    source.includes("{guestAuthMode === 'signup' ? 'Create Account' : 'Sign In'} & Place Order"),
    true
  );
});

test('Google guest authentication can continue the same order immediately', () => {
  for (const file of [
    'src/components/customer/OrderWizardModal.jsx',
    'src/components/customer/MobileSimpleOrderModal.jsx'
  ]) {
    const source = read(file);
    assert.equal(source.includes('await handleSubmitOrder({'), true);
    assert.equal(source.includes('email: res.user.email'), true);
    assert.equal(
      source.includes('const hasAuthenticatedOverride = Boolean(authenticatedOverride?.email)'),
      true
    );
    assert.equal(
      source.includes('if (!hasAuthenticatedOverride && !isAuthenticated && !authUser)'),
      true
    );
  }
});
