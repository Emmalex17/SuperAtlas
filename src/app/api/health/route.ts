import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checked by the deploy pipeline (spec section 16/17) and the Phase 1 smoke test. Reports
 * database and Brevo reachability; a non-200 response stops a promotion to production.
 */
export async function GET() {
  const checks: Record<string, boolean> = {};

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("tenants").select("id", { count: "exact", head: true });
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": process.env.BREVO_API_KEY ?? "" } });
    checks.brevo = res.ok;
  } catch {
    checks.brevo = false;
  }

  const ok = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
