import "server-only";
import { render } from "@react-email/render";
import InviteOrg, { inviteOrgText, type InviteOrgParams } from "@/emails/InviteOrg";
import InviteFirm, { inviteFirmText, type InviteFirmParams } from "@/emails/InviteFirm";
import InviteColleague, { inviteColleagueText, type InviteColleagueParams } from "@/emails/InviteColleague";
import InviteAccepted, { inviteAcceptedText, type InviteAcceptedParams } from "@/emails/InviteAccepted";
import PasswordChanged, { passwordChangedText, type PasswordChangedParams } from "@/emails/PasswordChanged";
import DailyDigest, { dailyDigestText, type DailyDigestParams } from "@/emails/DailyDigest";

/**
 * One entry per email_outbox.template value. Phase 1 covers the six templates the spec scopes
 * to this phase (section 8 table, section 15 phase 1 bullet) — every other row in that table
 * (programme_launched, case_submitted, report_published, return_due, notice_issued, and so on)
 * is added to this registry by the back-end phase that introduces the action triggering it,
 * never built ahead of the data it needs to describe.
 */
export const EMAIL_TEMPLATES = {
  invite_org: {
    subject: (p: InviteOrgParams) => `${p.tenantName} invites ${p.orgName} to SuperAtlas`,
    html: (p: InviteOrgParams) => render(InviteOrg(p)),
    text: inviteOrgText,
  },
  invite_firm: {
    subject: (p: InviteFirmParams) => `${p.tenantName} invites ${p.firmName} to SuperAtlas`,
    html: (p: InviteFirmParams) => render(InviteFirm(p)),
    text: inviteFirmText,
  },
  invite_colleague: {
    subject: (p: InviteColleagueParams) => `You are invited to ${p.entityName} on SuperAtlas`,
    html: (p: InviteColleagueParams) => render(InviteColleague(p)),
    text: inviteColleagueText,
  },
  invite_accepted: {
    subject: (p: InviteAcceptedParams) => `${p.acceptedByName} accepted your invitation`,
    html: (p: InviteAcceptedParams) => render(InviteAccepted(p)),
    text: inviteAcceptedText,
  },
  password_changed: {
    subject: () => "Your SuperAtlas password was changed",
    html: (p: PasswordChangedParams) => render(PasswordChanged(p)),
    text: passwordChangedText,
  },
  daily_digest: {
    subject: (p: DailyDigestParams) => (p.lines.length ? `${p.lines.length} waiting for you on SuperAtlas` : "Waiting for you on SuperAtlas"),
    html: (p: DailyDigestParams) => render(DailyDigest(p)),
    text: dailyDigestText,
  },
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;

/** Renders a queued email_outbox row's subject/html/text from its template name and params. */
export async function renderEmail(template: EmailTemplateName, params: Record<string, unknown>, isDemo: boolean) {
  const entry = EMAIL_TEMPLATES[template];
  if (!entry) throw new Error(`Unknown email template: ${template}`);
  // Type safety across the registry's per-template param shapes is enforced at the call site
  // (src/server/actions/* pass the exact params type each template expects); here we just need
  // the uniform (subject, html, text) shape to hand to the sender.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry entries have distinct param types; this is the one place they're used uniformly.
  const typedParams = params as any;
  const subject = isDemo ? `[Demo] ${entry.subject(typedParams)}` : entry.subject(typedParams);
  const html = await entry.html(typedParams);
  const text = entry.text(typedParams);
  return { subject, html, text };
}
