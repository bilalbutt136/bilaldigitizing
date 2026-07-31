import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name, fallbackName) => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[name]) return process.env[name];
    if (fallbackName && process.env[fallbackName]) return process.env[fallbackName];
  }
  if (typeof window !== 'undefined') {
    if (window.__ENV__ && window.__ENV__[name]) return window.__ENV__[name];
  }
  return '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL') || 'https://olyvwiqduzmkkubyoyvv.supabase.co';
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') || 'sb_publishable_r57d3KY6Ru767j3Z6_ZnlA_v4Hxt2Ss';

export const ENABLE_SUPABASE_DATABASE = true; 

export const isSupabaseConfigured = 
  ENABLE_SUPABASE_DATABASE &&
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false }
    });
