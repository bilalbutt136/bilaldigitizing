import { createAdminClient } from './supabase/admin.js';

function parseStoredValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed.replace(/^["']|["']$/g, '');
  }
}

export async function getPrivateServerConfig(key) {
  if (!key) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('private_server_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return parseStoredValue(data?.value);
}

export async function getPrivateTextConfig(key) {
  const value = await getPrivateServerConfig(key);
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    const candidate = value.secret ?? value.value ?? value.key ?? '';
    return String(candidate || '').trim();
  }
  return String(value).trim();
}
