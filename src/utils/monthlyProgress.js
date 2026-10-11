// Monthly bundle delivery accounting. Count completed designs, not file attachments
// or generic re-delivery versions. Each delivery ID can contribute at most once.
export const MONTHLY_QUOTAS = Object.freeze([10, 25, 50, 100]);
export function getMonthlyProgress(notesOrBundle, deliveriesArg = null, paidAt = null) {
  const notes = notesOrBundle && typeof notesOrBundle === 'object' ? notesOrBundle : {};
  const bundle = notes.monthlyBundle || notes;
  const quota = Number(bundle?.designs);
  if (!MONTHLY_QUOTAS.includes(quota) || bundle?.paymentType !== 'one_time') return null;
  const deliveries = Array.isArray(deliveriesArg) ? deliveriesArg : (Array.isArray(notes.deliveries) ? notes.deliveries : []);
  const seen = new Set();
  let delivered = 0;
  for (const entry of deliveries) {
    const id = String(entry?.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const count = Number(entry.monthlyDesignCount);
    if (Number.isSafeInteger(count) && count > 0 && count <= quota) delivered += count;
  }
  delivered = Math.min(quota, delivered);
  const durationDays = Number(bundle.durationDays) === 30 ? 30 : 30;
  const start = paidAt || notes.paid_at || null;
  const endsAt = start && !Number.isNaN(Date.parse(start))
    ? new Date(Date.parse(start) + durationDays * 86400000).toISOString() : null;
  return {
    quota, delivered, remaining: Math.max(0, quota - delivered),
    complete: delivered >= quota, endsAt,
    expired: Boolean(endsAt && Date.now() >= Date.parse(endsAt)),
    planId: bundle.planId || null
  };
}

export function prepareMonthlyDelivery(notes, incoming, designCount, paidAt) {
  const current = getMonthlyProgress(notes, null, paidAt);
  if (!current) throw new Error('This order is not a monthly bundle.');
  if (current.complete) throw new Error('Monthly bundle is already completed.');
  if (current.expired) throw new Error('The 30-day monthly period has ended.');
  const id = String(incoming?.id || '').trim();
  if (!id || id.length > 130 || !Array.isArray(incoming.files) || !incoming.files.some(f => f?.url || f?.public_url || f?.file_url)) {
    throw new Error('Attach completed design files before counting delivery.');
  }
  if ((notes.deliveries || []).some(row => row?.id === id)) {
    throw new Error('This delivery has already been counted. Refresh the order.');
  }
  const number = Number(designCount);
  if (!Number.isSafeInteger(number) || number < 0 || number > current.remaining) {
    throw new Error('Design count exceeds your remaining monthly allowance.');
  }
  // Zero denotes revised versions of an already-counted design.
  const entry = { ...incoming, id, monthlyDesignCount: number };
  const deliveries = [entry, ...(Array.isArray(notes.deliveries) ? notes.deliveries : [])];
  const next = getMonthlyProgress({ ...notes, deliveries }, null, paidAt);
  return { deliveries, progress: next, entry };
}
