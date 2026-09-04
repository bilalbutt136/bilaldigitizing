import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_STATUSES, validateStatusTransition } from '../utils/orderLifecycle.js';

describe('Order Lifecycle State Machine', () => {
  test('validates standard forward workflow progression', () => {
    assert.equal(validateStatusTransition(ORDER_STATUSES.AWAITING_PAYMENT, ORDER_STATUSES.SUBMITTED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.IN_PROGRESS), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DIGITIZING), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.QC), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED), true);
  });

  test('validates revision workflow', () => {
    assert.equal(validateStatusTransition(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.REVISION), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.REVISION, ORDER_STATUSES.IN_PROGRESS), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.REVISION, ORDER_STATUSES.DELIVERED), true);
  });

  test('validates cancellation pathways', () => {
    assert.equal(validateStatusTransition(ORDER_STATUSES.AWAITING_PAYMENT, ORDER_STATUSES.CANCELLED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.CANCELLED), true);
    assert.equal(validateStatusTransition(ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED), true);
  });

  test('rejects transitions from terminal states', () => {
    assert.equal(validateStatusTransition(ORDER_STATUSES.COMPLETED, ORDER_STATUSES.IN_PROGRESS), false);
    assert.equal(validateStatusTransition(ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED), false);
    assert.equal(validateStatusTransition(ORDER_STATUSES.CANCELLED, ORDER_STATUSES.SUBMITTED), false);
  });
});
