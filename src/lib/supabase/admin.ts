/**
 * Supabase Admin Client
 * 
 * ⚠️ SERVER-ONLY - Never import this in client components!
 * 
 * Uses the service role key which bypasses RLS.
 * Only use for operations that require elevated privileges (e.g., share links).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('supabaseAdmin cannot be used in the browser');
}

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the Supabase admin client (lazy initialization)
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase admin client not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

// For backward compatibility, export as supabaseAdmin but it will throw if called without env vars
export const supabaseAdmin = {
  rpc: async (fn: string, params: Record<string, unknown>) => {
    return getSupabaseAdmin().rpc(fn, params);
  },
  from: (table: string) => {
    return getSupabaseAdmin().from(table);
  },
  get storage() {
    return getSupabaseAdmin().storage;
  },
};
