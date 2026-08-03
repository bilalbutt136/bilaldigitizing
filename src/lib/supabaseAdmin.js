import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const isValidUrl = (url) => {
  if (!url || url.includes('your-project-ref')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidRoleKey = (key) => Boolean(key && !key.includes('your-service-role-key') && key.length > 20);

export const hasServiceRole = isValidUrl(supabaseUrl) && isValidRoleKey(serviceRoleKey);

const initSupabaseAdmin = () => {
  if (!hasServiceRole) return null;
  try {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (err) {
    console.warn('Supabase Admin client initialization warning:', err.message);
    return null;
  }
};

export const supabaseAdmin = initSupabaseAdmin();

