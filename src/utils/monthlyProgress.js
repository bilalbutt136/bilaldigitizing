// Monthly bundles consume one slot per NEW customer design submission.
// Deliveries/revisions never consume slots; they only mark existing designs delivered.
export const MONTHLY_QUOTAS = Object.freeze([10, 25, 50, 100]);

export function getMonthlyProgress(notesOrBundle, deliveriesArg = null, paidAt = null) {
  const notes = notesOrBundle && typeof notesOrBundle === 'object' ? notesOrBundle : {};
  const bundle = notes.monthlyBundle || notes;
  const quota = Number(bundle?.designs);
  if (!MONTHLY_QUOTAS.includes(quota) || bundle?.paymentType !== 'one_time') return null;

  const seen = new Set();
  const designs = [];
  for (const item of Array.isArray(notes.monthlyDesigns) ? notes.monthlyDesigns : []) {
    const id = String(item?.id || '').trim();
    if (!id || seen.has(id) || designs.length >= quota) continue;
    seen.add(id);
    designs.push(item);
  }

  const deliveries = Array.isArray(deliveriesArg) ? deliveriesArg :
    (Array.isArray(notes.deliveries) ? notes.deliveries : []);
  const deliveredIds = new Set();
  for (const delivery of deliveries) {
    const id = String(delivery?.monthlyDesignId || '').trim();
    if (id && seen.has(id) && Array.isArray(delivery.files) && delivery.files.length > 0) deliveredIds.add(id);
  }

  // Preserve previous monthly plans created before individual upload tracking.
  // Their earlier credited deliveries occupy slots instead of resetting usage.
  const legacySeen = new Set();
  for (const entry of deliveries) {
    const deliveryId = String(entry?.id || '').trim();
    if (!deliveryId || legacySeen.has(deliveryId) || entry.monthlyDesignId) continue;
    legacySeen.add(deliveryId);
    const count = Number(entry.monthlyDesignCount);
    if (!Number.isSafeInteger(count) || count <= 0) continue;
    const capacity = Math.min(count, quota - designs.length);
    for (let n = 1; n <= capacity; n++) {
      const id = 'legacy_' + deliveryId + '_' + n;
      if (seen.has(id)) continue;
      seen.add(id);
      designs.push({ id, name: 'Previously delivered design', legacy: true });
      deliveredIds.add(id);
    }
  }
  const uploaded = designs.length;
  const delivered = deliveredIds.size;
  const start = paidAt || notes.paid_at || null;
  const endsAt = start && !Number.isNaN(Date.parse(start))
    ? new Date(Date.parse(start) + 30 * 86400000).toISOString() : null;

  return {
    quota, uploaded, delivered, remaining: quota - uploaded,
    pending: uploaded - delivered, complete: uploaded === quota && delivered === quota,
    expired: Boolean(endsAt && Date.now() >= Date.parse(endsAt)), endsAt,
    planId: bundle.planId || null,
    designs: designs.map((item, index) => ({
      ...item, number: index + 1,
      status: deliveredIds.has(item.id) ? 'Delivered' : 'Submitted'
    }))
  };
}

export function prepareMonthlySubmission(notes, file, title, paidAt, id, now = new Date().toISOString()) {
  const progress = getMonthlyProgress(notes, null, paidAt);
  if (!progress) throw new Error('This order is not a monthly design plan.');
  if (progress.complete || progress.remaining === 0) throw new Error('All plan design slots are used. You cannot upload an extra design.');
  if (progress.expired) throw new Error('The 30-day monthly plan has ended.');
  const key = String(id || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(key)) throw new Error('Invalid design upload ID.');
  if (progress.designs.some(d => d.id === key)) throw new Error('Design already submitted.');
  const url = String(file?.url || '').trim();
  const name = String(file?.name || '').trim().slice(0, 150);
  let host = '';
  let path = '';
  try { const parsed = new URL(url); if (parsed.protocol !== 'https:') throw new Error(); host = parsed.hostname; path = decodeURIComponent(parsed.pathname); } catch {}
  const trustedHost = host === 'res.cloudinary.com' || /^[a-z0-9-]+\.supabase\.co$/i.test(host);
  if (!trustedHost || !path.includes('/monthly-designs/') || !name ||
      !/\.(png|jpe?g|pdf|ai|eps|svg|psd|dst|pes|emb|zip)$/i.test(name)) {
    throw new Error('Upload a valid artwork file (max 50MB) using the upload field.');
  }
  const cleanTitle = String(title || '').trim().slice(0, 100) || name;
  const next = [...(Array.isArray(notes.monthlyDesigns) ? notes.monthlyDesigns : []),
    { id: key, name: cleanTitle, file: { url, name }, submittedAt: now }];
  return { designs: next, progress: getMonthlyProgress({ ...notes, monthlyDesigns: next }, null, paidAt) };
}

export function prepareMonthlyDelivery(notes, incoming, designId, paidAt) {
  const current = getMonthlyProgress(notes, null, paidAt);
  if (!current) throw new Error('This order is not a monthly bundle.');
  // Completed plans allow revisions of an existing design, but never another upload.
  // Existing submitted work can still be finished after the upload window ends.
  const id = String(incoming?.id || '').trim();
  if (!id || id.length > 130 || !Array.isArray(incoming.files) ||
      !incoming.files.some(f => f?.url || f?.public_url || f?.file_url)) {
    throw new Error('Attach finished files before delivery.');
  }
  if ((notes.deliveries || []).some(row => row?.id === id)) throw new Error('This delivery has already been sent.');
  const selected = current.designs.find(item => item.id === String(designId || ''));
  if (!selected) throw new Error('Select a submitted design for this delivery.');
  // Revisions can deliver an existing design again but never create another slot.
  const entry = { ...incoming, id, monthlyDesignId: selected.id, monthlyDesignCount: 0 };
  const deliveries = [entry, ...(Array.isArray(notes.deliveries) ? notes.deliveries : [])];
  const next = getMonthlyProgress({ ...notes, deliveries }, null, paidAt);
  return { deliveries, progress: next, entry };
}
