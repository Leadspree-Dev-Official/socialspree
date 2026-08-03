import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing Supabase environment configuration');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
