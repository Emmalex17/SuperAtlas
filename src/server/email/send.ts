import "server-only";

/**
 * The one place that calls Brevo's transactional API (docs/BACKEND_SPEC.md section 8). Server
 * actions never call this directly — they queue a row in email_outbox (src/server/email/
 * outbox.ts) and the outbox processor calls this. Supabase Auth's own emails (codes, password
 * reset, email change) go a separate path entirely, through Brevo SMTP configured directly in
 * Supabase Auth settings — this function is for everything else.
 */
export type SendEmailInput = {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.EMAIL_TRANSPORT === "log") {
    // Intentional: the documented local/test transport (spec section 8).
    console.log("[email:log]", { to: input.toEmail, subject: input.subject });
    return { ok: true, messageId: "log-transport" };
  }

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME;
  if (!apiKey || !fromEmail || !fromName) {
    return { ok: false, error: "Brevo is not configured (BREVO_API_KEY / EMAIL_FROM_ADDRESS / EMAIL_FROM_NAME)" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: input.toEmail, name: input.toName }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: typeof body?.message === "string" ? body.message : `Brevo returned ${res.status}` };
    }
    return { ok: true, messageId: typeof body?.messageId === "string" ? body.messageId : "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error calling Brevo" };
  }
}
