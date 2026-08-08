import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing Supabase environment configuration');

type ClerkTokenProvider = () => Promise<string | null>;
let clerkTokenProvider: ClerkTokenProvider | null = null;

/** Connect the browser Supabase client to the active Clerk session. */
export function setClerkTokenProvider(provider: ClerkTokenProvider | null): void {
  clerkTokenProvider = provider;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => {
    if (!clerkTokenProvider) return null;
    try {
      const token = await clerkTokenProvider();
      return (token && typeof token === 'string' && token.trim().length > 0) ? token : null;
    } catch {
      return null;
    }
  },
});
