import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/contracts/database";

/**
 * A Supabase client for client components. Used sparingly — almost everything in SuperAtlas
 * reads and writes through server actions (src/server/actions/*) so that row-level security
 * and business rules apply consistently; this exists for the few cases that need a live
 * client-side session reference (e.g. reacting to auth state changes).
 */
export function createClient() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
