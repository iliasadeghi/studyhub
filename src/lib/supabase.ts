import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set in .env.local. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client. Uses the public anon (publishable) key only; every table is
 * protected by Row Level Security, so users can only reach their own data.
 */
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'not-configured', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'studyhub:auth',
  },
});

/** Absolute URL of the app root (handles the deploy base path). */
export function appUrl(path = ''): string {
  return new URL(
    `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`,
    window.location.origin,
  ).toString();
}
