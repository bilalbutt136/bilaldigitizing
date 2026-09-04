import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function resolveOrdersQueryTarget({
  isAdmin,
  user,
  emailParam,
  clientEmailFilter,
  orderIdsParam,
  configuredAdmins = []
}) {
  const normConfiguredAdmins = configuredAdmins.map(e => e.toLowerCase().trim());
  let targetEmail = null;

  if (isAdmin) {
    const requestedFilter = (clientEmailFilter || emailParam || '').toLowerCase().trim();
    const isSelfAdmin = requestedFilter && (
      (user?.email && requestedFilter === user.email.toLowerCase().trim()) ||
      normConfiguredAdmins.includes(requestedFilter)
    );
    if (requestedFilter && !isSelfAdmin) {
      targetEmail = requestedFilter;
    }
  } else if (user?.email) {
    targetEmail = user.email.toLowerCase().trim();
  }

  let parsedOrderIds = [];
  if (orderIdsParam) {
    parsedOrderIds = orderIdsParam
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length >= 3 && id.length <= 100)
      .slice(0, 10);
  }

  const shouldBlock = !isAdmin && !targetEmail && parsedOrderIds.length === 0;

  return { targetEmail, parsedOrderIds, shouldBlock };
}

describe('Admin & Customer Orders Query Resolution', () => {
  const adminUser = { email: 'shahidbutt59191@gmail.com' };
  const configuredAdmins = ['shahidbutt59191@gmail.com'];

  test('Admin calling fetchAll with self admin emailParam does NOT filter out studio orders', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: true,
      user: adminUser,
      emailParam: 'shahidbutt59191@gmail.com',
      configuredAdmins
    });

    assert.equal(result.targetEmail, null, 'targetEmail should be null so admin fetches all studio orders');
    assert.equal(result.shouldBlock, false);
  });

  test('Admin calling fetchAll without any emailParam fetches all studio orders', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: true,
      user: adminUser,
      emailParam: null,
      configuredAdmins
    });

    assert.equal(result.targetEmail, null);
    assert.equal(result.shouldBlock, false);
  });

  test('Admin filtering by a specific client email returns that client email', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: true,
      user: adminUser,
      clientEmailFilter: 'client@apparel.com',
      configuredAdmins
    });

    assert.equal(result.targetEmail, 'client@apparel.com');
    assert.equal(result.shouldBlock, false);
  });

  test('Regular customer strictly queries only their own authenticated session email', () => {
    const customerUser = { email: 'customer@gmail.com' };
    const result = resolveOrdersQueryTarget({
      isAdmin: false,
      user: customerUser,
      emailParam: 'other@gmail.com',
      configuredAdmins
    });

    assert.equal(result.targetEmail, 'customer@gmail.com', 'Customer must only query their own email');
    assert.equal(result.shouldBlock, false);
  });

  test('Unauthenticated guest cannot query arbitrary email and is blocked without orderIds', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: false,
      user: null,
      emailParam: 'victim@gmail.com',
      configuredAdmins
    });

    assert.equal(result.targetEmail, null);
    assert.equal(result.shouldBlock, true);
  });

  test('Unauthenticated guest with valid orderIds is allowed to view specific guest orders', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: false,
      user: null,
      orderIdsParam: '#1234, #5678',
      configuredAdmins
    });

    assert.deepEqual(result.parsedOrderIds, ['#1234', '#5678']);
    assert.equal(result.shouldBlock, false);
  });
});
