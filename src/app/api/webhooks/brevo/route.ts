import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Brevo bounce/complaint webhook (spec section 8). Verified by a shared secret in the query
 * string (Brevo doesn't sign webhook payloads; a secret path/query parameter is its documented
 * verification method) rather than a header, since Brevo's webhook config UI only offers a
 * plain URL. Marks the address in email_suppressions; later sends to it are skipped.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const events = await request.json().catch(() => null);
  if (!Array.isArray(events)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const admin = createAdminClient();
  for (const event of events) {
    const email = event?.email as string | undefined;
    const kind = event?.event as string | undefined;
    if (!email || !["hard_bounce", "soft_bounce", "blocked", "spam", "invalid_email"].includes(kind ?? "")) continue;

    const { data: outboxRow } = await admin.from("email_outbox").select("tenant_id").eq("to_email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!outboxRow) continue; // No record of ever emailing this address from this project — nothing to suppress against.

    await admin.from("email_suppressions").upsert({ tenant_id: outboxRow.tenant_id, email, reason: kind! }, { onConflict: "tenant_id,email" });
  }

  return NextResponse.json({ ok: true });
}
