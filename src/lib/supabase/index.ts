/**
 * Supabase Exports
 */

export { createClient } from './client';
export { createServerSupabaseClient, getServerUser, getServerSession } from './server';
// Note: supabaseAdmin is intentionally NOT exported here to prevent accidental client-side import
