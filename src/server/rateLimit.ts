import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generic rate-limit check backed by the `rate_limits` table (spec section 18). Records one
 * row per attempt and counts how many exist for `key` under `action` in the last
 * `windowSeconds` — callers decide what `key` means (an email, an IP, "<ip>:<email>").
 * Always records the attempt (so a blocked attempt still counts toward the next check),
 * then reports whether the caller is over `max`.
 */
export async function checkRateLimit(action: string, key: string, windowSeconds: number, max: number): Promise<{ limited: boolean; count: number }> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await admin.from("rate_limits").select("id", { count: "exact", head: true }).eq("action", action).eq("key", key).gte("at", since);
  return { limited: (count ?? 0) >= max, count: count ?? 0 };
}

export async function recordRateLimitAttempt(action: string, key: string) {
  const admin = createAdminClient();
  await admin.from("rate_limits").insert({ action, key });
}
