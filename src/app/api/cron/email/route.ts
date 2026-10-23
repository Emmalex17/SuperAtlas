import { NextResponse } from "next/server";
import { processOutbox } from "@/server/email/outbox";

/**
 * Sends queued emails and retries failures (spec section 8/11). On the Hobby Vercel plan this
 * is called every 5 minutes by a Supabase pg_cron job (see the scheduling migration), not by
 * Vercel Cron, which is capped at once a day per job on Hobby — see docs/RECONCILIATION.md
 * section 6. Requires the same bearer secret either way.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const result = await processOutbox();
  console.log(JSON.stringify({ action: "cron.email", ...result, at: new Date().toISOString() }));
  return NextResponse.json({ ok: true, ...result });
}
