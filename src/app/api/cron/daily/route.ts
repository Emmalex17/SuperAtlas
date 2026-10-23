import { NextResponse } from "next/server";

/**
 * 06:00 WAT daily job (spec section 11): return and fix reminders, overdue marking, scheduled
 * publishing, firm accreditation renewal reminders. Each of those depends on tables that don't
 * exist until later back-end phases (returns: phase 7, findings/publishing: phase 6, firm
 * accreditations: phase 2's full columns) — this route is authenticated and wired into
 * vercel.json now so the schedule exists from Phase 1, and each phase adds its own check here
 * as the data it needs lands, rather than this file being built all at once ahead of the data
 * it would act on.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Nothing to do yet — see the comment above for what lands here, and when.
  console.log(JSON.stringify({ action: "cron.daily", ran: [], at: new Date().toISOString() }));
  return NextResponse.json({ ok: true, ran: [] });
}
