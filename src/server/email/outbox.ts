import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./send";
import { renderEmail, type EmailTemplateName } from "./templates";
import type { Json } from "@/contracts/database";

const RETRY_MINUTES = [1, 5, 30, 120];

/**
 * Queues an email, then sends it immediately through Brevo. Always uses the admin (service-
 * role) client — email_outbox has no RLS policies for authenticated/anon at all (see
 * 20261023140300_audit_notifications_email.sql), so this is the one way in or out of that
 * table, matching "the email sender" in the service-role allow-list (spec section 5).
 *
 * Judgement call, documented here and in docs/CHANGELOG.md: the spec says demo-tenant emails
 * "are never sent to the demo addresses" without defining exactly which addresses count. Taken
 * the safer reading — every email in a demo tenant is suppressed, not just the six fixed demo
 * accounts, since nobody presenting a demo wants it accidentally emailing a real inbox a
 * colleague typed in while exploring the invite flow. A copy still goes to DEMO_EMAIL_SINK if
 * set, so presenters can see what would have sent.
 */
export async function queueEmail(input: {
  tenantId: string;
  toEmail: string;
  toName?: string;
  template: EmailTemplateName;
  params: Record<string, unknown>;
}): Promise<{ ok: boolean; outboxId: string }> {
  const admin = createAdminClient();

  const { data: tenant } = await admin.from("tenants").select("is_demo").eq("id", input.tenantId).single();
  const isDemo = tenant?.is_demo === true;

  const { subject, html, text } = await renderEmail(input.template, input.params, isDemo);

  const { data: row, error } = await admin
    .from("email_outbox")
    .insert({
      tenant_id: input.tenantId,
      to_email: input.toEmail,
      to_name: input.toName ?? null,
      template: input.template,
      params: input.params as unknown as Json,
      status: isDemo ? "demo_suppressed" : "queued",
    })
    .select("id")
    .single();

  if (error || !row) {
    throw new Error(`Failed to queue email: ${error?.message ?? "unknown error"}`);
  }

  if (isDemo) {
    if (process.env.DEMO_EMAIL_SINK) {
      await sendEmail({ toEmail: process.env.DEMO_EMAIL_SINK, subject: `[Demo copy → ${input.toEmail}] ${subject}`, html, text });
    }
    return { ok: true, outboxId: row.id };
  }

  const result = await sendEmail({ toEmail: input.toEmail, toName: input.toName, subject, html, text });
  if (result.ok) {
    await admin.from("email_outbox").update({ status: "sent", brevo_message_id: result.messageId }).eq("id", row.id);
  } else {
    await admin
      .from("email_outbox")
      .update({ attempts: 1, next_attempt_at: new Date(Date.now() + RETRY_MINUTES[0] * 60_000).toISOString(), last_error: result.error })
      .eq("id", row.id);
  }
  return { ok: result.ok, outboxId: row.id };
}

/**
 * Called by /api/cron/email. Sends every queued row whose next_attempt_at has passed, and
 * retries failures at 1, 5, 30 and 120 minutes before giving up and marking them failed — the
 * schedule from spec section 8.
 */
export async function processOutbox(): Promise<{ processed: number; sent: number; failed: number }> {
  const admin = createAdminClient();
  const { data: due } = await admin.from("email_outbox").select("*").eq("status", "queued").lte("next_attempt_at", new Date().toISOString()).limit(100);

  let sent = 0;
  let failed = 0;
  for (const row of due ?? []) {
    const { data: tenant } = await admin.from("tenants").select("is_demo").eq("id", row.tenant_id).single();
    const { subject, html, text } = await renderEmail(row.template as EmailTemplateName, row.params as Record<string, unknown>, tenant?.is_demo === true);
    const result = await sendEmail({ toEmail: row.to_email, toName: row.to_name ?? undefined, subject, html, text });

    if (result.ok) {
      await admin.from("email_outbox").update({ status: "sent", brevo_message_id: result.messageId }).eq("id", row.id);
      sent++;
    } else {
      const attempts = row.attempts + 1;
      const nextDelay = RETRY_MINUTES[attempts] ?? null;
      await admin
        .from("email_outbox")
        .update({
          attempts,
          status: nextDelay ? "queued" : "failed",
          next_attempt_at: nextDelay ? new Date(Date.now() + nextDelay * 60_000).toISOString() : row.next_attempt_at,
          last_error: result.error,
        })
        .eq("id", row.id);
      failed++;
    }
  }
  return { processed: due?.length ?? 0, sent, failed };
}
