import { TENANT } from "@/lib/mockData";
import { DEADLINES } from "@/lib/cases";
import { Icon } from "@/lib/icons";

/** The invitation-email preview shown beside both the single and the bulk-upload invite forms — the
 * prototype's emailPreview(). */
export function InviteEmailPreview({ org, category }: { org: string; category: string }) {
  return (
    <div className="mail">
      <div className="mh">
        <b style={{ color: "var(--text)" }}>{TENANT.name} invites {org || "your organisation"} to SuperAtlas</b>
        <span>From: {TENANT.name} &lt;no-reply@{TENANT.domain}&gt;</span>
      </div>
      <div style={{ height: 5, background: "var(--brand-500)" }} />
      <div className="mb col gap12">
        <div className="row gap8">
          <span className="logo s32">{TENANT.initials}</span>
          <b>{TENANT.name}</b>
        </div>
        <p className="small">Hello,</p>
        <p className="small">
          {TENANT.name} supervises {org || "your organisation"} as a <b>{category || "category to confirm"}</b>. Accept this invitation to set up your organisation&rsquo;s account. You will answer requirements and file returns here.
        </p>
        <span className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start", boxShadow: "none" }}>Accept invitation</span>
        <p className="cap muted"><Icon name="clock" /> The link expires in {DEADLINES.inviteExpiry} days. Powered by SuperAtlas.</p>
      </div>
    </div>
  );
}
