"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChangeRoleSchema, MembershipIdSchema, SetRolePermissionsSchema, ok, fail, type ActionResult } from "@/contracts/actions";

const ROLES_BY_WORKSPACE: Record<string, string[]> = {
  regulator: ["Admin", "Supervisor", "Reviewer", "Viewer"],
  organisation: ["Admin", "Contributor", "Viewer"],
  firm: ["Admin", "Lead auditor", "Assessor"],
};

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
  if (!userData.user) return { error: fail("unauthenticated", "Sign in again.") };

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("id, tenant_id, workspace, role, org_id, firm_id")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return { error: fail("forbidden", "Your access has been removed. Contact your administrator.") };
  if (membership.role !== "Admin") return { error: fail("forbidden", "Only an Admin can do this.") };

  const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", userData.user.id).maybeSingle();
  return { userId: userData.user.id, name: profile?.full_name ?? userData.user.email ?? "", membership };
}

export type TeamMemberRow = {
  kind: "member" | "invitation";
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastSeenAt: string | null;
  isSelf: boolean;
};

/** Lists active/suspended members plus pending invitations for the caller's own tenant,
 * workspace and organisation/firm scope — the Team page's "People" tab needs both in one
 * list (an invited colleague has no membership row yet). */
export async function listMembers(): Promise<ActionResult<TeamMemberRow[]>> {
  const caller = await requireAdminCaller();
  if ("error" in caller) return caller.error;

  const admin = createAdminClient();
  const scope = { tenant_id: caller.membership.tenant_id, workspace: caller.membership.workspace };

  let membershipQuery = admin.from("memberships").select("id, user_id, role, status, joined_at").eq("tenant_id", scope.tenant_id).eq("workspace", scope.workspace).neq("status", "removed");
  if (caller.membership.org_id) membershipQuery = membershipQuery.eq("org_id", caller.membership.org_id);
  if (caller.membership.firm_id) membershipQuery = membershipQuery.eq("firm_id", caller.membership.firm_id);
  const { data: memberships } = await membershipQuery;

  let inviteQuery = admin.from("invitations").select("id, email, role, status, expires_at").eq("tenant_id", scope.tenant_id).eq("workspace", scope.workspace).eq("status", "pending");
  if (caller.membership.org_id) inviteQuery = inviteQuery.eq("org_id", caller.membership.org_id);
  if (caller.membership.firm_id) inviteQuery = inviteQuery.eq("firm_id", caller.membership.firm_id);
  const { data: invitations } = await inviteQuery;

  const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const usersById = new Map((usersPage?.users ?? []).map((u) => [u.id, u]));

  const userIds = (memberships ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length ? await admin.from("profiles").select("user_id, full_name, last_seen_at").in("user_id", userIds) : { data: [] };
  const profilesById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const memberRows: TeamMemberRow[] = (memberships ?? []).map((m) => {
    const profile = profilesById.get(m.user_id);
    const user = usersById.get(m.user_id);
    return {
      kind: "member",
      id: m.id,
      email: user?.email ?? "",
      name: profile?.full_name ?? user?.email ?? "",
      role: m.role,
      status: m.status,
      lastSeenAt: profile?.last_seen_at ?? null,
      isSelf: m.user_id === caller.userId,
    };
  });

  const inviteRows: TeamMemberRow[] = (invitations ?? []).map((i) => ({
    kind: "invitation",
    id: i.id,
    email: i.email,
    name: i.email,
    role: i.role,
    status: "invited",
    lastSeenAt: null,
    isSelf: false,
  }));

  return ok([...memberRows, ...inviteRows]);
}

async function wouldRemoveLastAdmin(admin: ReturnType<typeof createAdminClient>, membership: { tenant_id: string; workspace: string; org_id: string | null; firm_id: string | null; role: string; id: string }): Promise<boolean> {
  if (membership.role !== "Admin") return false;
  let query = admin
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", membership.tenant_id)
    .eq("workspace", membership.workspace)
    .eq("role", "Admin")
    .eq("status", "active")
    .neq("id", membership.id);
  if (membership.org_id) query = query.eq("org_id", membership.org_id);
  if (membership.firm_id) query = query.eq("firm_id", membership.firm_id);
  const { count } = await query;
  return (count ?? 0) === 0;
}

export async function changeRole(input: unknown): Promise<ActionResult<{ changed: true }>> {
  const caller = await requireAdminCaller();
  if ("error" in caller) return caller.error;

  const parsed = ChangeRoleSchema.safeParse(input);
  if (!parsed.success) return fail("invalid", "Choose a valid role.", { role: "Check this field." });

  const admin = createAdminClient();
  const { data: target } = await admin.from("memberships").select("*").eq("id", parsed.data.membershipId).maybeSingle();
  if (!target || target.tenant_id !== caller.membership.tenant_id || target.workspace !== caller.membership.workspace) {
    return fail("not_found", "That person could not be found.");
  }

  const validRoles = ROLES_BY_WORKSPACE[target.workspace] ?? [];
  if (!validRoles.includes(parsed.data.role)) {
    return fail("invalid", "Choose a valid role.", { role: "Check this field." });
  }

  if (parsed.data.role !== "Admin" && (await wouldRemoveLastAdmin(admin, target))) {
    return fail("conflict", "There must be at least one Admin.");
  }

  const { error } = await admin.from("memberships").update({ role: parsed.data.role }).eq("id", target.id);
  if (error) return fail("upstream", "Could not change the role. Try again.");

  await admin.from("audit_log").insert({
    tenant_id: target.tenant_id,
    actor_user_id: caller.userId,
    actor_name: caller.name,
    workspace: target.workspace,
    action: "Changed role",
    record_type: "membership",
    record_id: target.id,
    record_label: `${target.role} -> ${parsed.data.role}`,
  });

  return ok({ changed: true });
}

async function setMembershipStatus(input: unknown, newStatus: "suspended" | "removed", auditAction: string): Promise<ActionResult<{ updated: true }>> {
  const caller = await requireAdminCaller();
  if ("error" in caller) return caller.error;

  const parsed = MembershipIdSchema.safeParse(input);
  if (!parsed.success) return fail("invalid", "Invalid member.");

  const admin = createAdminClient();
  const { data: target } = await admin.from("memberships").select("*").eq("id", parsed.data.membershipId).maybeSingle();
  if (!target || target.tenant_id !== caller.membership.tenant_id || target.workspace !== caller.membership.workspace) {
    return fail("not_found", "That person could not be found.");
  }
  if (target.user_id === caller.userId) {
    return fail("forbidden", "You cannot do this to your own account.");
  }
  if (await wouldRemoveLastAdmin(admin, target)) {
    return fail("conflict", "There must be at least one Admin.");
  }

  const { error } = await admin.from("memberships").update({ status: newStatus }).eq("id", target.id);
  if (error) return fail("upstream", "Could not update this person. Try again.");

  // No admin API call needed to force the person's existing session out: current_membership()
  // (the security-definer function every RLS policy and server action is built on) already
  // filters on status = 'active', so a suspended/removed row blocks them everywhere that
  // matters the instant this write commits, regardless of whether their JWT is still
  // technically unexpired. The Admin API has no "revoke sessions by user id" call to begin
  // with (confirmed against @supabase/auth-js — admin.signOut takes a JWT, not a user id).

  await admin.from("audit_log").insert({
    tenant_id: target.tenant_id,
    actor_user_id: caller.userId,
    actor_name: caller.name,
    workspace: target.workspace,
    action: auditAction,
    record_type: "membership",
    record_id: target.id,
  });

  return ok({ updated: true });
}

export async function suspendMember(input: unknown): Promise<ActionResult<{ updated: true }>> {
  return setMembershipStatus(input, "suspended", "Suspended team member");
}

export async function removeMember(input: unknown): Promise<ActionResult<{ updated: true }>> {
  return setMembershipStatus(input, "removed", "Removed team member");
}

export async function setRolePermissions(input: unknown): Promise<ActionResult<{ updated: true }>> {
  const caller = await requireAdminCaller();
  if ("error" in caller) return caller.error;

  const parsed = SetRolePermissionsSchema.safeParse(input);
  if (!parsed.success) return fail("invalid", "Invalid permission.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("role_permissions")
    .upsert({ tenant_id: caller.membership.tenant_id, role: parsed.data.role, permission: parsed.data.permission, allowed: parsed.data.allowed }, { onConflict: "tenant_id,role,permission" });
  if (error) return fail("upstream", "Could not save that permission. Try again.");

  await admin.from("audit_log").insert({
    tenant_id: caller.membership.tenant_id,
    actor_user_id: caller.userId,
    actor_name: caller.name,
    workspace: caller.membership.workspace,
    action: "Changed role permission",
    record_type: "role_permissions",
    record_label: `${parsed.data.role}.${parsed.data.permission} = ${parsed.data.allowed}`,
  });

  return ok({ updated: true });
}
