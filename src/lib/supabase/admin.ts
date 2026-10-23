import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/contracts/database";

/**
 * The service-role Supabase client. Bypasses row-level security entirely, so it is used only
 * by cron jobs, seed scripts, the email sender and invitation acceptance (src/server/actions/
 * invitations.ts) — the handful of places section 5/6 of the back-end spec names as the
 * exception to "every read and write goes through RLS". Every call made with this client must
 * write its own audit_log row with actor = 'system', since RLS-based audit triggers don't see
 * service-role writes the same way.
 *
 * Never import this file from a client component or anything that could end up in a browser
 * bundle — the `server-only` import above makes that a build error, not just a convention.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
