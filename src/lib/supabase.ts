import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
export const SUPABASE_URL = (env.VITE_SUPABASE_URL || 'https://qglhbesenigpspgkgbac.supabase.co') as string;
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PbJKlmuW9t-UMF3GmlLtvw_CEWLn0dN') as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment configuration. Using production fallback endpoints.');
}

/**
 * Standard Supabase client instance with built-in Auth, Token Refresh, and Storage persistence.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

