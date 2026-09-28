const ACTIVE_PRODUCTION_STATUSES = new Set(['in_progress', 'digitizing', 'assigned', 'processing', 'production']);
const QC_STATUSES = new Set(['qc', 'quality_check', 'quality-check', 'review']);
const REVISION_STATUSES = new Set(['revision', 'revision_requested', 'modification']);

export function getMobileOrderTrackingState(order = {}) {
  const status = String(order?.status || 'submitted').toLowerCase().trim();
  const paymentStatus = String(order?.payment_status || order?.paymentStatus || '').toLowerCase().trim();
  const paid =
    order?.isPaid === true ||
    order?.paid === true ||
    Boolean(order?.paid_at) ||
    ['paid', 'completed', 'settled', 'verified', 'wallet'].includes(paymentStatus) ||
    ACTIVE_PRODUCTION_STATUSES.has(status) ||
    QC_STATUSES.has(status) ||
    ['delivered', 'completed'].includes(status);

  const unpaid =
    !paid &&
    status !== 'cancelled' &&
    (
      ['awaiting_payment', 'pending_payment', 'submitted', 'pending'].includes(status) ||
      ['unpaid', 'pending'].includes(paymentStatus)
    );

  if (status === 'cancelled') {
    return { status, paid, unpaid: false, stage: 0, progress: 0, label: 'Cancelled', helper: 'This order is closed.', tone: 'danger', ready: false };
  }
  if (status === 'cancellation_requested') {
    return { status, paid, unpaid: false, stage: 1, progress: 20, label: 'Cancellation review', helper: 'The studio is reviewing your request.', tone: 'warning', ready: false };
  }
  if (unpaid) {
    return { status, paid, unpaid: true, stage: 0, progress: 8, label: 'Awaiting payment', helper: 'Pay to release this order into production.', tone: 'payment', ready: false };
  }
  if (REVISION_STATUSES.has(status)) {
    return { status, paid: true, unpaid: false, stage: 2, progress: 58, label: 'Revision in progress', helper: 'Your requested changes are being produced.', tone: 'warning', ready: false };
  }
  if (status === 'completed') {
    return { status, paid: true, unpaid: false, stage: 4, progress: 100, label: 'Completed', helper: 'Order completed and kept in your history.', tone: 'success', ready: true };
  }
  if (status === 'delivered') {
    return { status, paid: true, unpaid: false, stage: 4, progress: 100, label: 'Files ready', helper: 'Production files are ready to review or download.', tone: 'success', ready: true };
  }
  if (QC_STATUSES.has(status)) {
    return { status, paid: true, unpaid: false, stage: 3, progress: 82, label: 'Quality check', helper: 'Final production checks are underway.', tone: 'info', ready: false };
  }
  if (ACTIVE_PRODUCTION_STATUSES.has(status)) {
    return { status, paid: true, unpaid: false, stage: 2, progress: 55, label: 'In production', helper: 'Your design is actively being worked on.', tone: 'info', ready: false };
  }

  return {
    status,
    paid,
    unpaid: false,
    stage: 1,
    progress: 28,
    label: 'Order received',
    helper: paid ? 'Your order is queued for production.' : 'Your order has been received by the studio.',
    tone: 'neutral',
    ready: false
  };
}
