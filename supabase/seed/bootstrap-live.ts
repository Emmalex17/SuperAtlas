/**
 * Live NITDA bootstrap (BACKEND_SPEC.md section 14.1). Run once, in phase 1, and safe to run
 * again — every step is guarded by a lookup on its own natural key, so a second run changes
 * nothing. Creates no organisations, firms, programmes, regulations or results: just the
 * tenant, its reference data, and an invitation for the starter admin.
 *
 * Run with: npx tsx supabase/seed/bootstrap-live.ts
 */
import { randomBytes, createHash } from "node:crypto";
import { adminClient, ensureTenant, loadReferenceData, requireEnv } from "./lib";

async function main() {
  const admin = adminClient();
  const starterAdminEmail = requireEnv("STARTER_ADMIN_EMAIL").trim().toLowerCase();

  const tenantId = await ensureTenant(admin, {
    slug: "nitda",
    name: "National Information Technology Development Agency",
    shortName: "NITDA",
    isDemo: false,
  });
  console.log(`tenant "nitda" -> ${tenantId}`);

  await loadReferenceData(admin, tenantId);
  console.log("reference data loaded (category tree, scoring schemes, finding classes, action types, tenant rules, role permissions)");

  // Idempotent invite: if the starter admin already has a membership (accepted or still
  // pending), there is nothing to do. If a pending invitations row already exists, leave it
  // (resending is the inviter's own action, not bootstrap's).
  const { data: existingMembership } = await admin
    .from("memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("workspace", "regulator")
    .maybeSingle();
  if (existingMembership) {
    console.log("starter admin already has a membership — skipping invite");
    return;
  }
  const { data: existingInvite } = await admin
    .from("invitations")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("email", starterAdminEmail)
    .eq("status", "pending")
    .maybeSingle();
  if (existingInvite) {
    console.log(`starter admin already has a pending invitation (${existingInvite.id}) — skipping`);
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();

  const { error: inviteError } = await admin.from("invitations").insert({
    tenant_id: tenantId,
    email: starterAdminEmail,
    workspace: "regulator",
    role: "Admin",
    org_id: null,
    firm_id: null,
    token_hash: tokenHash,
    expires_at: expiresAt,
    status: "pending",
    payload: {},
  });
  if (inviteError) throw inviteError;

  const appUrl = process.env.APP_URL ?? "";
  console.log(`invitation created for ${starterAdminEmail}`);
  console.log(`accept link (send this, or paste it in a browser yourself): ${appUrl}/accept/${token}`);
  console.log("note: this link is only shown once here — it is not retrievable again (only the hash is stored).");

  // Phase 1 doesn't yet have the email-sending side of inviteOrganisation/inviteColleague
  // wired (that's the invitations module, still to be built) — so bootstrap prints the link
  // rather than silently doing nothing. Once src/server/actions/invitations.ts exists, this
  // script can switch to queuing the invite_colleague email through the outbox instead.
}

main()
  .then(() => {
    console.log("bootstrap-live: done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("bootstrap-live: failed", err);
    process.exit(1);
  });
