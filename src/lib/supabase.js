import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Toggle switch for development mode vs active Supabase production backend
// Set ENABLE_SUPABASE_DATABASE = true to re-enable live Supabase DB & Storage when deploying
export const ENABLE_SUPABASE_DATABASE = false; 

export const isSupabaseConfigured = 
  ENABLE_SUPABASE_DATABASE &&
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseAnonKey.includes('your-anon-key');

// Fallback dummy client or active Supabase client
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
