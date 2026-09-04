/**
 * Order Lifecycle State Machine & Transition Rules
 * Authoritative statuses and valid state transitions for digitizing, vector, and patch orders.
 */

export const ORDER_STATUSES = {
  AWAITING_PAYMENT: 'awaiting_payment',
  SUBMITTED: 'submitted',
  IN_PROGRESS: 'in_progress',
  DIGITIZING: 'digitizing',
  ASSIGNED: 'assigned',
  QC: 'qc',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  REVISION: 'revision',
  CANCELLED: 'cancelled',
};

// Valid status transitions: { currentStatus: [allowedNextStatuses] }
const VALID_TRANSITIONS = {
  [ORDER_STATUSES.AWAITING_PAYMENT]: [ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SUBMITTED]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.IN_PROGRESS]: [ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DIGITIZING]: [ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.ASSIGNED]: [ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.QC]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.REVISION],
  [ORDER_STATUSES.REVISION]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.COMPLETED]: [], // Terminal state
  [ORDER_STATUSES.CANCELLED]: [],  // Terminal state
};

/**
 * Validates if a transition from currentStatus to newStatus is permissible
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export function validateStatusTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) {
    // Unknown current status — allow transition (backward compatibility)
    return true;
  }
  return allowed.includes(newStatus);
}
