"use server";

import { randomBytes, createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueEmail } from "@/server/email/outbox";
import { isCommonPassword } from "@/server/passwordPolicy";
import { checkRateLimit, recordRateLimitAttempt } from "@/server/rateLimit";
import { InviteColleagueSchema, InviteIdSchema, GetInviteSchema, AcceptInviteSchema, ok, fail, type ActionResult } from "@/contracts/actions";

/**
 * Phase 1 scope only: colleague invites — inviting a person into the inviter's own tenant,
 * workspace and organisation/firm. inviteOrganisation/inviteFirm (which create a *new*
 * organisation or firm record) need columns organisations/firms don't have yet (category,
 * tier, accreditation types — see 20261023140200_org_firm_identity.sql's own comment); those
 * land in phase 2 alongside the rest of that table's profile columns.
 */

const ROLES_BY_WORKSPACE: Record<string, string[]> = {
  regulator: ["Admin", "Supervisor", "Reviewer", "Viewer"],
  organisation: ["Admin", "Contributor", "Viewer"],
  firm: ["Admin", "Lead auditor", "Assessor"],
};

const INVITE_EXPIRY_DAYS = 7;
const ACCEPT_WINDOW_SECONDS = 15 * 60;
const ACCEPT_MAX_PER_WINDOW = 10;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type CallerMembership = {
  id: string;
  tenant_id: string;
  workspace: string;
  role: string;
  org_id: string | null;
  firm_id: string | null;
};

async function requireAdminCaller(): Promise<{ userId: string; name: string; membership: CallerMembership } | { error: ActionResult<never> }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: fail("unauthenticated", "Sign in again.") };
  }
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("id, tenant_id, workspace, role, org_id, firm_id")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) {
    return { error: fail("forbidden", "Your access has been removed. Contact your administrator.") };
  }
  if (membership.role !== "Admin") {
    return { error: fail("forbidden", "Only an Admin can do this.") };
  }
  const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", userData.user.id).maybeSingle();
  return { userId: userData.user.id, name: profile?.full_name ?? userData.user.email ?? "", membership };
}

async function entityNameFor(admin: ReturnType<typeof createAdminClient>, membership: Pick<CallerMembership, "tenant_id" | "org_id" | "firm_id">): Promise<string> {
  if (membership.org_id) {
    const { data } = await admin.from("organisations").select("name").eq("id", membership.org_id).maybeSingle();
    if (data) return data.name;
  }
  if (membership.firm_id) {
    const { data } = await admin.from("firms").select("name").eq("id", membership.firm_id).maybeSingle();
    if (data) return data.name;
  }
  const { data: tenant } = await admin.from("tenants").select("name").eq("id", membership.tenant_id).single();
  return tenant?.name ?? "SuperAtlas";
}

export async function inviteColleague(input: unknown): Promise<ActionResult<{ invitationId: string }>> {
  const caller = await requireAdminCaller();
  if ("error" in caller) return caller.error;

  const parsed = InviteColleagueSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Enter a valid email and role.", { email: "Check this field." });
  }
  const { email, role } = parsed.data;
  const validRoles = ROLES_BY_WORKSPACE[caller.membership.workspace] ?? [];
  if (!validRoles.includes(role)) {
    return fail("invalid", "Choose a valid role.", { role: "Check this field." });
  }

  const admin = createAdminClient();

  const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingUser = existingUsers?.users.find((u) => u.email?.toLowerCase() === email);
  if (existingUser) {
    const { data: activeMembership } = await admin.from("memberships").select("id").eq("user_id", existingUser.id).eq("status", "active").maybeSingle();
    if (activeMembership) {
      return fail("conflict", "This email already has a SuperAtlas account.");
    }
  }

  const { data: pendingInvite } = await admin
    .from("invitations")
    .select("id")
    .eq("tenant_id", caller.membership.tenant_id)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();
  if (pendingInvite) {
    return fail("conflict", "This email already has a pending invitation. Resend it instead.");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60_000).toISOString();

  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({
      tenant_id: caller.membership.tenant_id,
      email,
      workspace: caller.membership.workspace,
      role,
      org_id: caller.membership.org_id,
      firm_id: caller.membership.firm_id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: "pending",
      invited_by: caller.userId,
      payload: {},
    })
    .select("id")
    .single();
  if (error || !invitation) {
    return fail("upstream", "Could not create the invitation. Try again.");
  }

  const entityName = await entityNameFor(admin, caller.membership);
  const { data: tenant } = await admin.from("tenants").select("name").eq("id", caller.membership.tenant_id).single();

  await queueEmail({
    tenantId: caller.membership.tenant_id,
    toEmail: email,
    template: "invite_colleague",
    params: {
      tenantName: tenant?.name ?? "SuperAtlas",
      entityName,
      inviterName: caller.name,
      role,
      acceptUrl: `${process.env.APP_URL}/accept/${token}`,
      replyTo: process.env.EMAIL_REPLY_TO ?? "",
      expiresInDays: INVITE_EXPIRY_DAYS,
    },
  });

  await admin.from("audit_log").insert({
    tenant_id: caller.membership.tenant_id,
    actor_user_id: caller.userId,
    actor_name: caller.name,
    workspace: caller.membership.workspace,
    action: "Invited colleague",
    record_type: "invitation",
    record_id: invitation.id,
    record_label: email,
  });

  return ok({ invitationId: invitation.id });
}

async function requireInviteOwnership(invitationId: string) {
  const caller = await requireAdminCaller();
  if ("error" in caller) return caller;
  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("id", invitationId).maybeSingle();
  if (!invitation || invitation.tenant_id !== caller.membership.tenant_id || invitation.workspace !== caller.membership.workspace) {
    return { error: fail("not_found", "That invitation could not be found.") };
  }
  return { caller, invitation };
}

export async function resendInvite(input: unknown): Promise<ActionResult<{ resent: true }>> {
  const parsed = InviteIdSchema.safeParse(input);
  if (!parsed.success) return fail("invalid", "Invalid invitation.");

  const result = await requireInviteOwnership(parsed.data.invitationId);
  if ("error" in result) return result.error;
  const { caller, invitation } = result;

  if (invitation.status === "accepted" || invitation.status === "cancelled") {
    return fail("conflict", "This invitation can no longer be resent.");
  }

  const admin = createAdminClient();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60_000).toISOString();

  const { error } = await admin
    .from("invitations")
    .update({ token_hash: tokenHash, expires_at: expiresAt, status: "pending" })
    .eq("id", invitation.id);
  if (error) return fail("upstream", "Could not resend the invitation. Try again.");

  const entityName = await entityNameFor(admin, caller.membership);
  const { data: tenant } = await admin.from("tenants").select("name").eq("id", invitation.tenant_id).single();

  await queueEmail({
    tenantId: invitation.tenant_id,
    toEmail: invitation.email,
    template: "invite_colleague",
    params: {
      tenantName: tenant?.name ?? "SuperAtlas",
      entityName,
      inviterName: caller.name,
      role: invitation.role,
      acceptUrl: `${process.env.APP_URL}/accept/${token}`,
      replyTo: process.env.EMAIL_REPLY_TO ?? "",
      expiresInDays: INVITE_EXPIRY_DAYS,
    },
  });

  await admin.from("audit_log").insert({
    tenant_id: invitation.tenant_id,
    actor_user_id: caller.userId,
    actor_name: caller.name,
    workspace: caller.membership.workspace,
    action: "Resent invitation",
    record_type: "invitation",
    record_id: invitation.id,
    record_label: invitation.email,
  });

  return ok({ resent: true });
}

export async function cancelInvite(input: unknown): Promise<ActionResult<{ cancelled: true }>> {
  const parsed = InviteIdSchema.safeParse(input);
  if (!parsed.success) return fail("invalid", "Invalid invitation.");

  const result = await requireInviteOwnership(parsed.data.invitationId);
  if ("error" in result) return result.error;
  const { caller, invitation } = result;

  const admin = createAdminClient();
  const { error } = await admin.from("invitations").update({ status: "cancelled" }).eq("id", invitation.id);
  if (error) return fail("upstream", "Could not cancel the invitation. Try again.");

  await admin.from("audit_log").insert({
    tenant_id: invitation.tenant_id,
    actor_user_id: caller.userId,
    actor_name: caller.name,
    workspace: caller.membership.workspace,
    action: "Cancelled invitation",
    record_type: "invitation",
    record_id: invitation.id,
    record_label: invitation.email,
  });

  return ok({ cancelled: true });
}

export type InviteDetails = {
  status: "pending" | "expired" | "accepted" | "cancelled";
  tenantName: string;
  entityName: string;
  workspace: string;
  role: string;
  inviterName: string;
  email: string;
};

/** Public — no auth. The accept page shows who invited the person and to what (spec 7.2). */
export async function getInvite(input: unknown): Promise<ActionResult<InviteDetails>> {
  const parsed = GetInviteSchema.safeParse(input);
  if (!parsed.success) return fail("not_found", "That invitation link is not valid.");

  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("token_hash", hashToken(parsed.data.token)).maybeSingle();
  if (!invitation) return fail("not_found", "That invitation link is not valid.");

  const isExpired = new Date(invitation.expires_at).getTime() < Date.now();
  const status: InviteDetails["status"] = invitation.status === "accepted" ? "accepted" : invitation.status === "cancelled" ? "cancelled" : isExpired ? "expired" : "pending";

  const { data: tenant } = await admin.from("tenants").select("name").eq("id", invitation.tenant_id).single();
  const entityName = await entityNameFor(admin, invitation);

  let inviterName = "";
  if (invitation.invited_by) {
    const { data: inviterProfile } = await admin.from("profiles").select("full_name").eq("user_id", invitation.invited_by).maybeSingle();
    inviterName = inviterProfile?.full_name ?? "";
  }

  return ok({
    status,
    tenantName: tenant?.name ?? "SuperAtlas",
    entityName,
    workspace: invitation.workspace,
    role: invitation.role,
    inviterName,
    email: invitation.email,
  });
}

/** Public — no auth. Creates the account and membership; the person then signs in normally
 * with the email code (spec 7.2 step 5) — this does not establish a session itself. */
export async function acceptInvite(input: unknown): Promise<ActionResult<{ workspace: string }>> {
  const parsed = AcceptInviteSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Check your name and password.", { password: "Check this field." });
  }
  if (isCommonPassword(parsed.data.password)) {
    return fail("invalid", "Choose a less common password.", { password: "Check this field." });
  }

  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("token_hash", hashToken(parsed.data.token)).maybeSingle();
  if (!invitation) return fail("not_found", "That invitation link is not valid.");
  if (invitation.status === "accepted") return fail("conflict", "This invitation has already been accepted.");
  if (invitation.status === "cancelled") return fail("conflict", "This invitation has been cancelled.");
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return fail("conflict", "This invitation has expired. Ask for a new one.");
  }

  const { limited } = await checkRateLimit("invite_accept", invitation.email, ACCEPT_WINDOW_SECONDS, ACCEPT_MAX_PER_WINDOW);
  if (limited) {
    return fail("rate_limited", "Too many attempts. Try again later.");
  }
  await recordRateLimitAttempt("invite_accept", invitation.email);

  const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingUser = existingUsers?.users.find((u) => u.email?.toLowerCase() === invitation.email);
  if (existingUser) {
    const { data: activeMembership } = await admin.from("memberships").select("id").eq("user_id", existingUser.id).eq("status", "active").maybeSingle();
    if (activeMembership) {
      return fail("conflict", "This email already has a SuperAtlas account.");
    }
  }

  const user =
    existingUser ??
    (
      await admin.auth.admin.createUser({
        email: invitation.email,
        password: parsed.data.password,
        email_confirm: true,
      })
    ).data.user;
  if (!user) {
    return fail("upstream", "Could not create your account. Try again.");
  }
  if (existingUser) {
    await admin.auth.admin.updateUserById(user.id, { password: parsed.data.password });
  }

  await admin.from("profiles").upsert({ user_id: user.id, full_name: parsed.data.name, is_demo: false });

  const { error: membershipError } = await admin.from("memberships").insert({
    tenant_id: invitation.tenant_id,
    user_id: user.id,
    workspace: invitation.workspace,
    role: invitation.role,
    org_id: invitation.org_id,
    firm_id: invitation.firm_id,
    status: "active",
    joined_at: new Date().toISOString(),
    invited_by: invitation.invited_by,
  });
  if (membershipError) {
    return fail("upstream", "Could not finish setting up your account. Try again.");
  }

  await admin.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invitation.id);

  const entityName = await entityNameFor(admin, invitation);
  const { data: tenant } = await admin.from("tenants").select("name").eq("id", invitation.tenant_id).single();

  if (invitation.invited_by) {
    await admin.from("notifications").insert({
      tenant_id: invitation.tenant_id,
      user_id: invitation.invited_by,
      title: `${parsed.data.name} accepted your invitation`,
      body: `${parsed.data.name} has joined ${entityName}.`,
      kind: "invitation",
      icon: "user-check",
      tone: "ok",
      link_route: "/regulator/team",
    });

    const { data: inviterProfile } = await admin.from("profiles").select("full_name").eq("user_id", invitation.invited_by).maybeSingle();
    const { data: inviterUser } = await admin.auth.admin.getUserById(invitation.invited_by);
    if (inviterUser.user?.email) {
      await queueEmail({
        tenantId: invitation.tenant_id,
        toEmail: inviterUser.user.email,
        toName: inviterProfile?.full_name ?? undefined,
        template: "invite_accepted",
        params: {
          tenantName: tenant?.name ?? "SuperAtlas",
          acceptedByName: parsed.data.name,
          entityName,
          recordUrl: `${process.env.APP_URL}/regulator/team`,
          replyTo: process.env.EMAIL_REPLY_TO ?? "",
        },
      });
    }
  }

  await admin.from("audit_log").insert({
    tenant_id: invitation.tenant_id,
    actor_user_id: user.id,
    actor_name: parsed.data.name,
    workspace: invitation.workspace,
    action: "Invitation accepted",
    record_type: "invitation",
    record_id: invitation.id,
    record_label: invitation.email,
  });

  return ok({ workspace: invitation.workspace });
}
