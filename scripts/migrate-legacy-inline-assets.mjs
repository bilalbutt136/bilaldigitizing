import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const MIME_EXTENSION = {
  'application/pdf': 'pdf',
  'application/octet-stream': 'bin',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav'
};

const uploadCache = new Map();
const rollbackActions = [];
const stats = {
  inlineOccurrences: 0,
  uniqueAssets: 0,
  uploadedBytes: 0,
  ordersUpdated: 0,
  orderFilesUpdated: 0,
  siteConfigUpdated: 0
};

function isInlineDataUrl(value) {
  return typeof value === 'string' && /^data:[^;]+;base64,/i.test(value);
}

function parseDataUrl(value) {
  const match = String(value).match(/^data:([^;]+);base64,(.+)$/is);
  if (!match) throw new Error('Invalid base64 Data URL.');
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64')
  };
}

function sanitizePathSegment(value) {
  return String(value || 'unknown')
    .replace(/^#+/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80) || 'unknown';
}

function extensionFrom(nameHint, mimeType) {
  const fromName = String(nameHint || '').split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName) && fromName !== String(nameHint || '').toLowerCase()) {
    return fromName;
  }
  if (mimeType === 'application/octet-stream' && /\.dst$/i.test(String(nameHint || ''))) return 'dst';
  return MIME_EXTENSION[mimeType] || 'bin';
}

async function persistInlineAsset(dataUrl, { bucket, prefix, nameHint }) {
  stats.inlineOccurrences += 1;

  if (uploadCache.has(dataUrl)) {
    return uploadCache.get(dataUrl);
  }

  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const hash = createHash('sha256').update(buffer).digest('hex');
  const ext = extensionFrom(nameHint, mimeType);
  const storagePath = `${prefix}/${hash.slice(0, 24)}.${ext}`;

  stats.uniqueAssets += 1;
  stats.uploadedBytes += buffer.length;

  if (APPLY) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: false
      });

    if (error && !/already exists|duplicate/i.test(error.message || '')) {
      throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const result = {
    url: data.publicUrl,
    storagePath,
    mimeType,
    size: buffer.length
  };
  uploadCache.set(dataUrl, result);
  return result;
}

async function replaceInlineDeep(value, context, nameHint = '') {
  if (isInlineDataUrl(value)) {
    const stored = await persistInlineAsset(value, { ...context, nameHint });
    return { value: stored.url, changed: true };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const out = [];
    for (const item of value) {
      const result = await replaceInlineDeep(item, context, nameHint);
      changed ||= result.changed;
      out.push(result.value);
    }
    return { value: out, changed };
  }

  if (value && typeof value === 'object') {
    let changed = false;
    const out = { ...value };
    const objectNameHint = value.file_name || value.filename || value.name || nameHint;

    for (const [key, child] of Object.entries(value)) {
      const result = await replaceInlineDeep(child, context, objectNameHint);
      if (result.changed) {
        changed = true;
        out[key] = result.value;
      }
    }
    return { value: out, changed };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      const result = await replaceInlineDeep(parsed, context, nameHint);
      if (result.changed) {
        return { value: JSON.stringify(result.value), changed: true };
      }
    } catch {
      // Plain text; nothing to migrate.
    }
  }

  return { value, changed: false };
}

async function migrateOrders() {
  const fields = 'id, notes, output_file_url, artwork_url, image_url, logo, worker_file_url, worker_files';
  const { data: rows, error } = await supabase.from('orders').select(fields);
  if (error) throw error;

  for (const row of rows || []) {
    const original = { ...row };
    const updates = {};
    const context = {
      bucket: 'order-files',
      prefix: `legacy-inline/orders/${sanitizePathSegment(row.id)}`
    };

    for (const field of ['notes', 'output_file_url', 'artwork_url', 'image_url', 'logo', 'worker_file_url', 'worker_files']) {
      const result = await replaceInlineDeep(row[field], context);
      if (result.changed) updates[field] = result.value;
    }

    if (!Object.keys(updates).length) continue;
    stats.ordersUpdated += 1;
    if (!APPLY) continue;

    const { error: updateError } = await supabase.from('orders').update(updates).eq('id', row.id);
    if (updateError) throw updateError;
    rollbackActions.push(async () => {
      const restore = {};
      for (const key of Object.keys(updates)) restore[key] = original[key];
      await supabase.from('orders').update(restore).eq('id', row.id);
    });
  }
}

async function migrateOrderFiles() {
  const fields = 'id, order_id, file_name, file_format, file_type, file_url, public_url, file_path';
  const { data: rows, error } = await supabase.from('order_files').select(fields);
  if (error) throw error;

  for (const row of rows || []) {
    const inline = isInlineDataUrl(row.file_url) ? row.file_url : (isInlineDataUrl(row.public_url) ? row.public_url : null);
    if (!inline) continue;

    const original = { ...row };
    const stored = await persistInlineAsset(inline, {
      bucket: 'order-files',
      prefix: `legacy-inline/order-files/${sanitizePathSegment(row.order_id)}`,
      nameHint: row.file_name || `file.${row.file_format || 'bin'}`
    });

    stats.orderFilesUpdated += 1;
    if (!APPLY) continue;

    const updates = {
      file_url: stored.url,
      public_url: stored.url,
      file_path: stored.storagePath
    };
    const { error: updateError } = await supabase.from('order_files').update(updates).eq('id', row.id);
    if (updateError) throw updateError;
    rollbackActions.push(async () => {
      await supabase.from('order_files').update({
        file_url: original.file_url,
        public_url: original.public_url,
        file_path: original.file_path
      }).eq('id', row.id);
    });
  }
}

async function migrateSiteConfig() {
  const { data: rows, error } = await supabase.from('site_config').select('key, value');
  if (error) throw error;

  for (const row of rows || []) {
    const result = await replaceInlineDeep(row.value, {
      bucket: 'media-gallery',
      prefix: `legacy-inline/site-config/${sanitizePathSegment(row.key)}`
    });

    if (!result.changed) continue;
    stats.siteConfigUpdated += 1;
    if (!APPLY) continue;

    const { error: updateError } = await supabase
      .from('site_config')
      .update({ value: result.value })
      .eq('key', row.key);

    if (updateError) throw updateError;
    rollbackActions.push(async () => {
      await supabase.from('site_config').update({ value: row.value }).eq('key', row.key);
    });
  }
}

async function countRemainingInlineAssets() {
  let count = 0;

  const targets = [
    ['orders', '*'],
    ['order_files', '*'],
    ['site_config', '*']
  ];

  for (const [table, fields] of targets) {
    const { data, error } = await supabase.from(table).select(fields);
    if (error) throw error;
    for (const row of data || []) {
      const serialized = JSON.stringify(row);
      count += (serialized.match(/data:[^"'\\]+;base64,[A-Za-z0-9+/=]+/g) || []).length;
    }
  }

  return count;
}

try {
  await migrateOrders();
  await migrateOrderFiles();
  await migrateSiteConfig();

  const remaining = APPLY ? await countRemainingInlineAssets() : null;
  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    ...stats,
    remainingInlineOccurrences: remaining
  }, null, 2));

  if (APPLY && remaining !== 0) {
    throw new Error(`Migration verification failed: ${remaining} inline Data URLs remain.`);
  }
} catch (error) {
  if (APPLY && rollbackActions.length) {
    console.error('Migration failed; rolling back database row updates...');
    for (const rollback of rollbackActions.reverse()) {
      try { await rollback(); } catch {}
    }
  }
  throw error;
}
