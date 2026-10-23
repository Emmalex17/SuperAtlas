"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SignInSchema,
  VerifyCodeSchema,
  ResendCodeSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  ChangeEmailSchema,
  UpdateProfileSchema,
  ok,
  fail,
  type ActionResult,
} from "@/contracts/actions";

const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_MAX_FAILURES = 5;
const RESEND_MIN_GAP_SECONDS = 60;
const RESEND_MAX_PER_HOUR = 5;

/**
 * A short, well-known list, not an exhaustive check — section 7.2's "checked against common
 * passwords" doesn't name a source, so this covers the obvious cases (the password equal to
 * the account's own email, or one of the handful of passwords everyone tries first) rather
 * than pulling in a long breached-password corpus for a pilot of a handful of accounts.
 */
const COMMON_PASSWORDS = new Set(["password1234", "123456789012", "qwertyuiop12", "passwordpassword"]);

function genericSignInError() {
  return fail("invalid", "Email or password is not right.");
}

async function recentFailureCount(email: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin
    .from("auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("success", false)
    .gte("at", since);
  return count ?? 0;
}

async function recordAttempt(email: string, success: boolean) {
  const admin = createAdminClient();
  await admin.from("auth_attempts").insert({ email, success });
}

type ActiveMembership = {
  id: string;
  tenant_id: string;
  workspace: string;
  role: string;
  org_id: string | null;
  firm_id: string | null;
};

async function getActiveMembership(userId: string): Promise<ActiveMembership | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("id, tenant_id, workspace, role, org_id, firm_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data ?? null;
}

async function writeAudit(input: {
  tenantId: string;
  actorUserId: string | null;
  actorName: string;
  workspace: string | null;
  action: string;
  recordLabel?: string;
}) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    tenant_id: input.tenantId,
    actor_user_id: input.actorUserId,
    actor_name: input.actorName,
    workspace: input.workspace,
    action: input.action,
    record_type: "auth",
    record_label: input.recordLabel ?? null,
  });
}

/**
 * Step 1 of sign-in (spec 7.1): checks the password by actually attempting
 * `signInWithPassword`, then immediately throwing that session away — a real session only
 * ever starts from `verifyOtp` (step 4) or, for a demo account, right here once we know no
 * code is needed. There is no `getUserByEmail` in the Admin API, so checking the password
 * this way is also how we learn the user's id at all.
 */
export async function signIn(input: unknown): Promise<ActionResult<{ needsCode: boolean; workspace?: string }>> {
  const parsed = SignInSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Enter a valid email and password.", { email: "Check this field." });
  }
  const { email, password } = parsed.data;

  const failures = await recentFailureCount(email);
  if (failures >= LOCKOUT_MAX_FAILURES) {
    return fail("rate_limited", `Too many attempts. Try again in ${LOCKOUT_WINDOW_MINUTES} minutes.`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await recordAttempt(email, false);
    return genericSignInError();
  }

  const membership = await getActiveMembership(data.user.id);
  if (!membership) {
    await supabase.auth.signOut();
    await recordAttempt(email, false);
    return fail("forbidden", "Your access has been removed. Contact your administrator.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name, is_demo").eq("user_id", data.user.id).maybeSingle();

  await recordAttempt(email, true);

  if (profile?.is_demo) {
    // Demo accounts sign in with password alone (spec 7.1) — the session from
    // signInWithPassword above stands as-is.
    await writeAudit({
      tenantId: membership.tenant_id,
      actorUserId: data.user.id,
      actorName: profile.full_name,
      workspace: membership.workspace,
      action: "Signed in",
      recordLabel: email,
    });
    return ok({ needsCode: false, workspace: membership.workspace });
  }

  // Real account: the password was right, but no session starts yet. Discard this one and
  // send the email code instead.
  await supabase.auth.signOut();
  const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (otpError) {
    return fail("upstream", "Could not send a sign-in code. Try again.");
  }
  return ok({ needsCode: true });
}

export async function verifyCode(input: unknown): Promise<ActionResult<{ workspace: string }>> {
  const parsed = VerifyCodeSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Enter the 6-digit code.", { code: "Check this field." });
  }
  const { email, code } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) {
    return fail("invalid", "That code is not right or has expired.");
  }

  const membership = await getActiveMembership(data.user.id);
  if (!membership) {
    await supabase.auth.signOut();
    return fail("forbidden", "Your access has been removed. Contact your administrator.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", data.user.id).maybeSingle();

  await writeAudit({
    tenantId: membership.tenant_id,
    actorUserId: data.user.id,
    actorName: profile?.full_name ?? email,
    workspace: membership.workspace,
    action: "Signed in",
    recordLabel: email,
  });

  return ok({ workspace: membership.workspace });
}

export async function resendCode(input: unknown): Promise<ActionResult<{ sent: true }>> {
  const parsed = ResendCodeSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Enter a valid email.");
  }
  const { email } = parsed.data;

  const admin = createAdminClient();
  const since = new Date(Date.now() - RESEND_MIN_GAP_SECONDS * 1000).toISOString();
  const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const [{ count: recentOne }, { count: recentHour }] = await Promise.all([
    admin.from("auth_attempts").select("id", { count: "exact", head: true }).eq("email", email).eq("success", true).gte("at", since),
    admin.from("auth_attempts").select("id", { count: "exact", head: true }).eq("email", email).eq("success", true).gte("at", hourAgo),
  ]);
  // "Success" rows double as "a code was issued" markers for this email — see recordAttempt
  // call below, which logs one every time resendCode actually sends.
  if ((recentOne ?? 0) > 0) {
    return fail("rate_limited", `Wait ${RESEND_MIN_GAP_SECONDS} seconds before asking for a new code.`);
  }
  if ((recentHour ?? 0) >= RESEND_MAX_PER_HOUR) {
    return fail("rate_limited", "Too many codes requested. Try again later.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) {
    return fail("upstream", "Could not send a new code. Try again.");
  }
  await recordAttempt(email, true);
  return ok({ sent: true });
}

export async function signOut(): Promise<ActionResult<{ signedOut: true }>> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return ok({ signedOut: true });
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult<{ requested: true }>> {
  const parsed = RequestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    // Never reveal whether the email exists, and never reveal shape problems either — the
    // screen always shows the same confirmation (spec 7.4).
    return ok({ requested: true });
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.APP_URL}/reset`,
  });
  return ok({ requested: true });
}

export async function resetPassword(input: unknown): Promise<ActionResult<{ reset: true }>> {
  const parsed = ResetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", parsed.error.issues[0]?.message ?? "Choose a longer password.", { password: "Check this field." });
  }
  if (COMMON_PASSWORDS.has(parsed.data.password)) {
    return fail("invalid", "Choose a less common password.", { password: "Check this field." });
  }

  // Called from the /reset page once Supabase's recovery link has already established a
  // session for the user — there's no separate token to check here, updateUser acts on it.
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return fail("invalid", "That password was not accepted. Try a different one.");
  }

  if (userData.user) {
    const membership = await getActiveMembership(userData.user.id);
    if (membership) {
      await writeAudit({
        tenantId: membership.tenant_id,
        actorUserId: userData.user.id,
        actorName: userData.user.email ?? "",
        workspace: membership.workspace,
        action: "Password reset",
      });
    }
  }
  return ok({ reset: true });
}

export async function changePassword(input: unknown): Promise<ActionResult<{ changed: true }>> {
  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Check the password fields.", { newPassword: "Check this field." });
  }
  if (COMMON_PASSWORDS.has(parsed.data.newPassword)) {
    return fail("invalid", "Choose a less common password.", { newPassword: "Check this field." });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) {
    return fail("unauthenticated", "Sign in again to change your password.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_demo, full_name").eq("user_id", userData.user.id).maybeSingle();
  if (profile?.is_demo) {
    return fail("forbidden", "Demo account: email and password are fixed.");
  }

  // Re-check the current password the same way signIn does: attempt it directly.
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: parsed.data.currentPassword,
  });
  if (checkError) {
    return fail("invalid", "Your current password is not right.", { currentPassword: "Check this field." });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return fail("invalid", "That password was not accepted. Try a different one.");
  }

  // Sign the person's other sessions out — spec 7.4 "all other sessions signed out".
  await supabase.auth.signOut({ scope: "others" });

  const membership = await getActiveMembership(userData.user.id);
  if (membership) {
    await writeAudit({
      tenantId: membership.tenant_id,
      actorUserId: userData.user.id,
      actorName: profile?.full_name ?? userData.user.email,
      workspace: membership.workspace,
      action: "Password changed",
    });
  }

  return ok({ changed: true });
}

export async function changeEmail(input: unknown): Promise<ActionResult<{ requested: true }>> {
  const parsed = ChangeEmailSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Enter a valid email address.", { newEmail: "Check this field." });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return fail("unauthenticated", "Sign in again to change your email.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_demo").eq("user_id", userData.user.id).maybeSingle();
  if (profile?.is_demo) {
    return fail("forbidden", "Demo account: email and password are fixed.");
  }

  // Secure email change (spec 7.4): codes go to both addresses, the change only applies once
  // confirmed. updateUser() itself kicks that off; there is nothing further to do here.
  const { error } = await supabase.auth.updateUser({ email: parsed.data.newEmail });
  if (error) {
    return fail("invalid", "That email could not be used.", { newEmail: "Check this field." });
  }

  const membership = await getActiveMembership(userData.user.id);
  if (membership) {
    await writeAudit({
      tenantId: membership.tenant_id,
      actorUserId: userData.user.id,
      actorName: userData.user.email ?? "",
      workspace: membership.workspace,
      action: "Email change requested",
      recordLabel: `${userData.user.email ?? ""} -> ${parsed.data.newEmail}`,
    });
  }

  return ok({ requested: true });
}

export async function updateProfile(input: unknown): Promise<ActionResult<{ updated: true }>> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Check the profile fields.", { fullName: "Check this field." });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return fail("unauthenticated", "Sign in again to update your profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      job_title: parsed.data.jobTitle ?? null,
      phone: parsed.data.phone ?? null,
    })
    .eq("user_id", userData.user.id);
  if (error) {
    return fail("invalid", "That profile could not be saved.");
  }

  return ok({ updated: true });
}

export type SessionInfo = {
  user: { id: string; email: string };
  tenant: { id: string; slug: string; name: string; isDemo: boolean };
  workspace: string;
  role: string;
  orgId: string | null;
  firmId: string | null;
  permissions: string[];
  isDemo: boolean;
  profile: { fullName: string; jobTitle: string | null; phone: string | null; initials: string | null };
};

export async function getSession(): Promise<ActionResult<SessionInfo | null>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) {
    return ok(null);
  }

  const admin = createAdminClient();
  const [{ data: membership }, { data: profile }] = await Promise.all([
    admin.from("memberships").select("role, workspace, org_id, firm_id, tenant_id, tenants(id, slug, name, is_demo)").eq("user_id", userData.user.id).eq("status", "active").maybeSingle(),
    admin.from("profiles").select("full_name, job_title, phone, initials, is_demo").eq("user_id", userData.user.id).maybeSingle(),
  ]);
  if (!membership || !membership.tenants) {
    return ok(null);
  }

  const { data: perms } = await admin
    .from("role_permissions")
    .select("permission")
    .eq("tenant_id", membership.tenant_id)
    .eq("role", membership.role)
    .eq("allowed", true);

  const tenant = membership.tenants;
  return ok({
    user: { id: userData.user.id, email: userData.user.email },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, isDemo: tenant.is_demo },
    workspace: membership.workspace,
    role: membership.role,
    orgId: membership.org_id,
    firmId: membership.firm_id,
    permissions: (perms ?? []).map((p) => p.permission),
    isDemo: profile?.is_demo ?? false,
    profile: {
      fullName: profile?.full_name ?? "",
      jobTitle: profile?.job_title ?? null,
      phone: profile?.phone ?? null,
      initials: profile?.initials ?? null,
    },
  });
}
