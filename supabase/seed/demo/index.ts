/**
 * Demo tenant seed, phase 1 slice (BACKEND_SPEC.md section 14.2). Creates tenant
 * `nitda-demo`, its reference data, and the six fixed-password demo accounts with minimal
 * organisation/firm identity rows — just enough for each account to land in a real workspace.
 *
 * Deliberately NOT the full prototype-seed.json dataset (43 organisations, 86 assessment
 * cases, and so on) — those tables (programmes, cases, findings, filings, enforcement cases)
 * don't exist yet. That full import is incremental, one back-end phase at a time, as each
 * table lands; see docs/RECONCILIATION.md and docs/CHANGELOG.md.
 *
 * Idempotent: every insert is guarded by a lookup on its natural key, so running this twice
 * changes nothing (it does not implement the nightly reset — that is /api/cron/demo-reset,
 * a later phase, which deletes and reloads rather than merely upserting).
 *
 * Run with: npx tsx supabase/seed/demo/index.ts
 */
import { adminClient, ensureAuthUser, ensureTenant, loadReferenceData, requireEnv } from "../lib";

type DemoAccount = {
  email: string;
  passwordEnv: string;
  fullName: string;
  initials: string;
  workspace: "regulator" | "organisation" | "firm";
  entity?: { kind: "organisation" | "firm"; name: string; shortName?: string; initials: string; colour: string; status: string };
  role: string;
};

const ACCOUNTS: DemoAccount[] = [
  { email: "m.bello@nitda.gov.ng", passwordEnv: "DEMO_PASSWORD_NITDA", fullName: "M. Bello", initials: "MB", workspace: "regulator", role: "Admin" },
  {
    email: "a.okonkwo@zenith.example",
    passwordEnv: "DEMO_PASSWORD_ZENITH",
    fullName: "A. Okonkwo",
    initials: "AO",
    workspace: "organisation",
    role: "Admin",
    entity: { kind: "organisation", name: "Zenith Bank (Demo)", shortName: "Zenith Bank", initials: "ZB", colour: "#C8102E", status: "active" },
  },
  {
    email: "c.obi@moniepoint.example",
    passwordEnv: "DEMO_PASSWORD_MONIEPOINT",
    fullName: "C. Obi",
    initials: "CO",
    workspace: "organisation",
    role: "Admin",
    entity: { kind: "organisation", name: "Moniepoint Microfinance Bank (Demo)", shortName: "Moniepoint", initials: "MP", colour: "#0357EE", status: "active" },
  },
  {
    email: "k.sule@opay.example",
    passwordEnv: "DEMO_PASSWORD_OPAY",
    fullName: "K. Sule",
    initials: "KS",
    workspace: "organisation",
    role: "Admin",
    entity: { kind: "organisation", name: "OPay Digital Services (Demo)", shortName: "OPay", initials: "OP", colour: "#1DCF9F", status: "active" },
  },
  {
    email: "t.adebayo@deloitte.example",
    passwordEnv: "DEMO_PASSWORD_DELOITTE",
    fullName: "T. Adebayo",
    initials: "TA",
    workspace: "firm",
    role: "Lead auditor",
    entity: { kind: "firm", name: "Deloitte & Touche (Demo)", initials: "DT", colour: "#4E8A12", status: "Accredited" },
  },
  {
    email: "b.nwosu@halcyon.example",
    passwordEnv: "DEMO_PASSWORD_HALCYON",
    fullName: "B. Nwosu",
    initials: "BN",
    workspace: "firm",
    role: "Admin",
    // Fictional — stays as-is, no "(Demo)" suffix (spec section 14.2).
    entity: { kind: "firm", name: "Halcyon Assurance", initials: "HA", colour: "#3B5BA5", status: "Accredited" },
  },
];

async function ensureOrganisation(admin: ReturnType<typeof adminClient>, tenantId: string, entity: NonNullable<DemoAccount["entity"]>) {
  if (entity.kind === "organisation") {
    const { data: existing } = await admin.from("organisations").select("id").eq("tenant_id", tenantId).eq("name", entity.name).maybeSingle();
    if (existing) return existing.id;
    const { data, error } = await admin
      .from("organisations")
      .insert({ tenant_id: tenantId, name: entity.name, short_name: entity.shortName ?? null, initials: entity.initials, colour: entity.colour, status: entity.status })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
  const { data: existing } = await admin.from("firms").select("id").eq("tenant_id", tenantId).eq("name", entity.name).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from("firms")
    .insert({ tenant_id: tenantId, name: entity.name, initials: entity.initials, colour: entity.colour, status: entity.status })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const admin = adminClient();

  const tenantId = await ensureTenant(admin, { slug: "nitda-demo", name: "NITDA (Demo)", shortName: "NITDA", isDemo: true });
  console.log(`tenant "nitda-demo" -> ${tenantId}`);

  await loadReferenceData(admin, tenantId);
  console.log("reference data loaded");

  for (const account of ACCOUNTS) {
    const password = requireEnv(account.passwordEnv);
    const authUser = await ensureAuthUser(admin, { email: account.email, password, emailConfirm: true });
    if (!authUser) throw new Error(`could not create or find auth user for ${account.email}`);

    await admin.from("profiles").upsert({
      user_id: authUser.id,
      full_name: account.fullName,
      initials: account.initials,
      is_demo: true,
    });

    let orgId: string | null = null;
    let firmId: string | null = null;
    if (account.entity) {
      const entityId = await ensureOrganisation(admin, tenantId, account.entity);
      if (account.entity.kind === "organisation") orgId = entityId;
      else firmId = entityId;
    }

    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (existingMembership) {
      console.log(`${account.email}: membership already exists — skipping`);
      continue;
    }

    const { error } = await admin.from("memberships").insert({
      tenant_id: tenantId,
      user_id: authUser.id,
      workspace: account.workspace,
      role: account.role,
      org_id: orgId,
      firm_id: firmId,
      status: "active",
      joined_at: new Date().toISOString(),
    });
    if (error) throw error;
    console.log(`${account.email}: membership created (${account.workspace} / ${account.role})`);
  }
}

main()
  .then(() => {
    console.log("demo seed: done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("demo seed: failed", err);
    process.exit(1);
  });
