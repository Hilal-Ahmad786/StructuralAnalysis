/**
 * Server Auth Utilities
 * 
 * Authentication helpers for server-side operations.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// ============================================================================
// Auth Helpers
// ============================================================================

/**
 * Create a Supabase client for server components
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user (server-side)
 */
export async function getAuthUser() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getAuthUser();
  
  if (!user) {
    const redirect = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
    throw new Error(`UNAUTHENTICATED:/login${redirect}`);
  }
  
  return user;
}

/**
 * Check if current user owns a resource
 */
export async function isOwner(resourceOwnerId: string): Promise<boolean> {
  const user = await getAuthUser();
  return user?.id === resourceOwnerId;
}

// ============================================================================
// Session Helpers
// ============================================================================

/**
 * Get current session
 */
export async function getSession() {
  const supabase = await createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Refresh session if needed
 */
export async function refreshSession() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
  
  return data.session;
}

// ============================================================================
// Token Helpers
// ============================================================================

/**
 * Get access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

/**
 * Validate a JWT token (basic validation)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}
