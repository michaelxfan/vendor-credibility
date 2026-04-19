import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 * - Prefers SERVICE_ROLE_KEY (required for writes).
 * - Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY for reads (dashboard has
 *   a public_read RLS policy).
 * Never expose the service role key to the browser.
 */

let cached: SupabaseClient | null = null;

function pickKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!pickKey();
}

export function hasServiceRole(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** Throws if env vars aren't set. */
export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = pickKey();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.local.example → .env.local and fill in values from the Supabase dashboard."
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Returns null if env vars aren't set. Use for reads that should degrade to empty. */
export function getSupabaseServerOrNull(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return getSupabaseServer();
}
