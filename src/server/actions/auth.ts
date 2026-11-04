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
  UpdateNotificationPrefsSchema,
  ok,
  fail,
  type ActionResult,
} from "@/contracts/actions";
import { isCommonPassword } from "@/server/passwordPolicy";
import { checkRateLimit, recordRateLimitAttempt } from "@/server/rateLimit";
import { queueEmail } from "@/server/email/outbox";
import type { Json } from "@/contracts/database";

const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_MAX_FAILURES = 5;
const RESEND_MIN_GAP_SECONDS = 60;
const RESEND_MAX_PER_HOUR = 5;

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

const RESET_WINDOW_SECONDS = 15 * 60;
const RESET_MAX_PER_WINDOW = 3;

export async function requestPasswordReset(input: unknown): Promise<ActionResult<{ requested: true }>> {
  const parsed = RequestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    // Never reveal whether the email exists, and never reveal shape problems either — the
    // screen always shows the same confirmation (spec 7.4).
    return ok({ requested: true });
  }

  // Rate-limiting by the attempted email string, not by whether it has an account — telling
  // someone "too many requests" reveals nothing about account existence (spec 18).
  const { limited } = await checkRateLimit("password_reset", parsed.data.email, RESET_WINDOW_SECONDS, RESET_MAX_PER_WINDOW);
  if (limited) {
    return fail("rate_limited", "Too many requests. Wait 15 minutes before asking again.");
  }
  await recordRateLimitAttempt("password_reset", parsed.data.email);

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
  if (isCommonPassword(parsed.data.password)) {
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
  // A forgotten-password reset is a password change — spec 18's "sign out everywhere on
  // password change" applies here too, not just to changePassword's own current-password flow.
  await supabase.auth.signOut({ scope: "others" });

  if (userData.user?.email) {
    const membership = await getActiveMembership(userData.user.id);
    if (membership) {
      const admin = createAdminClient();
      const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", userData.user.id).maybeSingle();
      await writeAudit({
        tenantId: membership.tenant_id,
        actorUserId: userData.user.id,
        actorName: profile?.full_name ?? userData.user.email,
        workspace: membership.workspace,
        action: "Password reset",
      });
      await sendPasswordChangedEmail(admin, membership.tenant_id, userData.user.email, profile?.full_name ?? "");
    }
  }
  return ok({ reset: true });
}

export async function changePassword(input: unknown): Promise<ActionResult<{ changed: true }>> {
  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Check the password fields.", { newPassword: "Check this field." });
  }
  if (isCommonPassword(parsed.data.newPassword)) {
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
    await sendPasswordChangedEmail(admin, membership.tenant_id, userData.user.email, profile?.full_name ?? "");
  }

  return ok({ changed: true });
}

async function sendPasswordChangedEmail(admin: ReturnType<typeof createAdminClient>, tenantId: string, toEmail: string, fullName: string) {
  const { data: tenant } = await admin.from("tenants").select("name").eq("id", tenantId).single();
  await queueEmail({
    tenantId,
    toEmail,
    toName: fullName || undefined,
    template: "password_changed",
    params: { tenantName: tenant?.name ?? "SuperAtlas", fullName, replyTo: process.env.EMAIL_REPLY_TO ?? "" },
  });
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

export async function updateNotificationPrefs(input: unknown): Promise<ActionResult<{ updated: true }>> {
  const parsed = UpdateNotificationPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Those preferences could not be saved.");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return fail("unauthenticated", "Sign in again to update your preferences.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: parsed.data.prefs as unknown as Json })
    .eq("user_id", userData.user.id);
  if (error) {
    return fail("invalid", "Those preferences could not be saved.");
  }

  return ok({ updated: true });
}

export type DemoAccountInfo = { email: string; name: string; workspace: string; password: string };

const DEMO_ACCOUNTS: { email: string; name: string; workspace: string; passwordEnv: string }[] = [
  { email: "m.bello@nitda.gov.ng", name: "NITDA", workspace: "Regulator", passwordEnv: "DEMO_PASSWORD_NITDA" },
  { email: "a.okonkwo@zenith.example", name: "Zenith Bank", workspace: "Organisation", passwordEnv: "DEMO_PASSWORD_ZENITH" },
  { email: "c.obi@moniepoint.example", name: "Moniepoint (data returns)", workspace: "Organisation", passwordEnv: "DEMO_PASSWORD_MONIEPOINT" },
  { email: "k.sule@opay.example", name: "OPay (enforcement)", workspace: "Organisation", passwordEnv: "DEMO_PASSWORD_OPAY" },
  { email: "t.adebayo@deloitte.example", name: "Deloitte", workspace: "Assurance firm", passwordEnv: "DEMO_PASSWORD_DELOITTE" },
];

/**
 * The demo access panel (spec section 14.2: "lists these accounts with Copy and Use buttons
 * and shows each fixed password. The server renders the passwords from the secrets.") — the
 * passwords are read from env vars here, server-side, and never baked into the client bundle.
 */
export async function listDemoAccounts(): Promise<ActionResult<DemoAccountInfo[]>> {
  return ok(
    DEMO_ACCOUNTS.map((a) => ({
      email: a.email,
      name: a.name,
      workspace: a.workspace,
      password: process.env[a.passwordEnv] ?? "",
    })),
  );
}

export async function signOutOtherSessions(): Promise<ActionResult<{ signedOut: true }>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return fail("unauthenticated", "Sign in again.");
  }
  await supabase.auth.signOut({ scope: "others" });
  return ok({ signedOut: true });
}

export type SessionInfo = {
  user: { id: string; email: string };
  tenant: { id: string; slug: string; name: string; isDemo: boolean };
  workspace: string;
  role: string;
  orgId: string | null;
  firmId: string | null;
  /** The regulator's, organisation's or firm's own name — whichever the workspace is scoped
   * to. Lets a caller build a display session without a second round trip to resolve it. */
  entityName: string;
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

  const [{ data: perms }, entityName] = await Promise.all([
    admin.from("role_permissions").select("permission").eq("tenant_id", membership.tenant_id).eq("role", membership.role).eq("allowed", true),
    resolveEntityName(admin, membership),
  ]);

  const tenant = membership.tenants;
  return ok({
    user: { id: userData.user.id, email: userData.user.email },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, isDemo: tenant.is_demo },
    workspace: membership.workspace,
    role: membership.role,
    orgId: membership.org_id,
    firmId: membership.firm_id,
    entityName,
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

async function resolveEntityName(
  admin: ReturnType<typeof createAdminClient>,
  membership: { org_id: string | null; firm_id: string | null; tenants: { name: string } | null },
): Promise<string> {
  if (membership.org_id) {
    const { data } = await admin.from("organisations").select("name").eq("id", membership.org_id).maybeSingle();
    if (data) return data.name;
  }
  if (membership.firm_id) {
    const { data } = await admin.from("firms").select("name").eq("id", membership.firm_id).maybeSingle();
    if (data) return data.name;
  }
  return membership.tenants?.name ?? "";
}
