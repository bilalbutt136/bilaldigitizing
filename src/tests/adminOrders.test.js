import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function resolveOrdersQueryTarget({
  isAdmin,
  isWorker = false,
  user,
  workerData = null,
  emailParam,
  clientEmailFilter,
  workerIdParam
}) {
  if (!user?.email) {
    return { targetEmail: null, targetWorkerId: null, shouldBlock: true };
  }

  let targetEmail = null;
  let targetWorkerId = null;

  if (isAdmin) {
    targetEmail = (clientEmailFilter || emailParam || '').toLowerCase().trim() || null;
    targetWorkerId = workerIdParam || null;
  } else if (isWorker) {
    targetWorkerId = workerData?.id || user.id;
  } else {
    targetEmail = user.email.toLowerCase().trim();
  }

  return { targetEmail, targetWorkerId, shouldBlock: false };
}

describe('Admin, Worker & Customer Orders Query Resolution', () => {
  const adminUser = { id: 'admin-id', email: 'admin@example.com' };

  test('admin without filters fetches all studio orders', () => {
    const result = resolveOrdersQueryTarget({ isAdmin: true, user: adminUser });
    assert.equal(result.targetEmail, null);
    assert.equal(result.targetWorkerId, null);
    assert.equal(result.shouldBlock, false);
  });

  test('admin can explicitly filter by a client email', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: true,
      user: adminUser,
      clientEmailFilter: 'client@apparel.com'
    });

    assert.equal(result.targetEmail, 'client@apparel.com');
    assert.equal(result.shouldBlock, false);
  });

  test('regular customer ignores caller supplied email and uses verified session email', () => {
    const customerUser = { id: 'customer-id', email: 'customer@gmail.com' };
    const result = resolveOrdersQueryTarget({
      isAdmin: false,
      user: customerUser,
      emailParam: 'victim@gmail.com'
    });

    assert.equal(result.targetEmail, 'customer@gmail.com');
    assert.equal(result.targetWorkerId, null);
    assert.equal(result.shouldBlock, false);
  });

  test('verified worker is restricted to their trusted worker id', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: false,
      isWorker: true,
      user: { id: 'auth-worker-id', email: 'worker@example.com' },
      workerData: { id: 'worker-profile-id' },
      workerIdParam: 'other-worker-id'
    });

    assert.equal(result.targetWorkerId, 'worker-profile-id');
    assert.equal(result.targetEmail, null);
    assert.equal(result.shouldBlock, false);
  });

  test('unauthenticated callers are blocked even if they know an email or order id', () => {
    const result = resolveOrdersQueryTarget({
      isAdmin: false,
      user: null,
      emailParam: 'victim@gmail.com'
    });

    assert.equal(result.shouldBlock, true);
    assert.equal(result.targetEmail, null);
    assert.equal(result.targetWorkerId, null);
  });
});
