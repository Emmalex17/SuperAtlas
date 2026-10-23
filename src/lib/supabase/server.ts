import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/contracts/database";

/**
 * A Supabase client for server components and server actions, scoped to the signed-in
 * person's session via cookies. Row-level security applies to everything read or written
 * through this client — it never bypasses a policy. Create a fresh one per request; never
 * cache or share this across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component that can't set cookies (no response to attach
          // them to). Harmless as long as middleware.ts is refreshing the session on every
          // request, which it is — see src/middleware.ts.
        }
      },
    },
  });
}
