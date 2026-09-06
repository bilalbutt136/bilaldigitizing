import { createClient } from '@supabase/supabase-js';

// Module-level singleton to reuse the client across warm serverless invocations
// instead of creating a new TCP connection on every request.
let _adminClient = null;

export function createAdminClient() {
  // Return cached client if already initialized (warm lambda / edge reuse)
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration.');
  }

  _adminClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options
        });
      }
    }
  });

  return _adminClient;
}
