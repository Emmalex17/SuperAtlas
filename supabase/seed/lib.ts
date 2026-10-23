/**
 * Shared helpers for the seed scripts (bootstrap-live.ts, demo/index.ts). Run standalone via
 * tsx, outside Next's bundler — so this file never imports src/lib/supabase/admin.ts (its
 * `import "server-only"` guard only resolves inside Next's own build) and never uses the `@/`
 * path alias (tsx does not read tsconfig `paths`). Everything here is plain relative imports
 * and a service-role client built directly from env vars loaded via dotenv.
 */
import { config as loadDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/contracts/database";

loadDotenv({ path: ".env.local" });

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Set it in .env.local before running this script.`);
  }
  return value;
}

export function adminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export type AdminClient = ReturnType<typeof adminClient>;

/**
 * There is no `getUserByEmail` in the Supabase Admin API (confirmed against
 * @supabase/auth-js's GoTrueAdminApi — only listUsers/getUserById/createUser exist). The pilot
 * has, at most, a handful of accounts (one live starter admin, six demo accounts), so a single
 * page of up to 1000 users is enough to find a match by email without a dedicated lookup.
 */
export async function findUserByEmail(admin: AdminClient, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Idempotent: returns the existing user if the email is already registered, else creates one. */
export async function ensureAuthUser(admin: AdminClient, input: { email: string; password?: string; emailConfirm: boolean }) {
  const existing = await findUserByEmail(admin, input.email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: input.emailConfirm,
  });
  if (error) throw error;
  return data.user;
}

export async function ensureTenant(admin: AdminClient, input: { slug: string; name: string; shortName: string; isDemo: boolean }) {
  const { data: existing } = await admin.from("tenants").select("id").eq("slug", input.slug).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from("tenants")
    .insert({ slug: input.slug, name: input.name, short_name: input.shortName, is_demo: input.isDemo })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * The category tree, scoring schemes, finding classes, action types and default rules
 * (BACKEND_SPEC.md sections 9.2/9.3/9.6/14.1), sourced verbatim from the front end's own mock
 * data (src/lib/data/schemes.json, findingClasses.json, actionTypes.json; src/lib/mockData.ts's
 * CATEGORIES) rather than re-typed from the spec's prose — those files are the authoritative
 * words-on-screen per the project's own "exact words" rule. Safe to run twice: every insert is
 * guarded by a lookup on the row's natural key.
 */
export async function loadReferenceData(admin: AdminClient, tenantId: string) {
  const categories: { name: string; types: { name: string; plural: string | null; tiers: string[] }[] }[] = [
    {
      name: "Banking",
      types: [
        { name: "Commercial bank", plural: "Commercial banks", tiers: ["International", "National", "Regional"] },
        { name: "Non-interest bank", plural: "Non-interest banks", tiers: ["National", "Regional"] },
        { name: "Merchant bank", plural: "Merchant banks", tiers: ["National"] },
        { name: "Microfinance bank", plural: "Microfinance banks", tiers: ["National", "State", "Unit"] },
      ],
    },
    {
      name: "Payments",
      types: [
        { name: "Mobile money operator", plural: null, tiers: [] },
        { name: "Switching and processing", plural: null, tiers: [] },
        { name: "Payment solution service provider", plural: null, tiers: ["PSSP", "PTSP", "Super-agent"] },
      ],
    },
    {
      name: "Digital economy",
      types: [
        { name: "Data controller of major importance", plural: null, tiers: ["Ultra-high level", "Extra-high level", "Ordinary-high level"] },
        { name: "Cloud service provider", plural: null, tiers: [] },
        { name: "Fintech platform", plural: null, tiers: [] },
      ],
    },
  ];

  for (let si = 0; si < categories.length; si++) {
    const group = categories[si];
    const { data: sector } = await admin
      .from("sector_groups")
      .upsert({ tenant_id: tenantId, name: group.name, sort: si }, { onConflict: "tenant_id,name" })
      .select("id")
      .single();
    if (!sector) continue;
    for (let ti = 0; ti < group.types.length; ti++) {
      const t = group.types[ti];
      const { data: type } = await admin
        .from("org_types")
        .upsert({ tenant_id: tenantId, sector_group_id: sector.id, name: t.name, plural_name: t.plural, sort: ti }, { onConflict: "tenant_id,sector_group_id,name" })
        .select("id")
        .single();
      if (!type) continue;
      for (let ri = 0; ri < t.tiers.length; ri++) {
        await admin
          .from("org_tiers")
          .upsert({ tenant_id: tenantId, org_type_id: type.id, name: t.tiers[ri], sort: ri }, { onConflict: "tenant_id,org_type_id,name" });
      }
    }
  }

  const schemes = [
    {
      id: "four",
      name: "4-point compliance scale",
      kind: "Outcome scale",
      isDefault: true,
      levels: [
        ["Compliant", 100, "ok"],
        ["Partially compliant", 50, "warn"],
        ["Non-compliant", 0, "bad"],
        ["Not applicable", null, "neu"],
      ],
      bands: [
        ["Strong", 85],
        ["Satisfactory", 70],
        ["Needs improvement", 50],
        ["Weak", 0],
      ],
    },
    {
      id: "maturity",
      name: "Maturity scale",
      kind: "Maturity",
      isDefault: false,
      levels: [
        ["5 · Optimised", 100, "ok"],
        ["4 · Managed", 75, "ok"],
        ["3 · Defined", 50, "warn"],
        ["2 · Developing", 25, "warn"],
        ["1 · Initial", 0, "bad"],
      ],
      bands: [
        ["Advanced", 80],
        ["Established", 60],
        ["Emerging", 0],
      ],
    },
    {
      id: "pf",
      name: "Pass / fail",
      kind: "Binary",
      isDefault: false,
      levels: [
        ["Pass", 100, "ok"],
        ["Fail", 0, "bad"],
        ["Not applicable", null, "neu"],
      ],
      bands: [
        ["Pass", 100],
        ["Fail", 0],
      ],
    },
    {
      id: "sat",
      name: "Satisfactory scale",
      kind: "Rating",
      isDefault: false,
      levels: [
        ["Satisfactory", 100, "ok"],
        ["Needs improvement", 50, "warn"],
        ["Unsatisfactory", 0, "bad"],
      ],
      bands: [
        ["Satisfactory", 75],
        ["Needs improvement", 50],
        ["Unsatisfactory", 0],
      ],
    },
  ];
  for (const s of schemes) {
    const { data: existing } = await admin.from("scoring_schemes").select("id").eq("tenant_id", tenantId).eq("name", s.name).maybeSingle();
    if (existing) continue;
    await admin.from("scoring_schemes").insert({
      tenant_id: tenantId,
      name: s.name,
      kind: s.kind,
      is_default: s.isDefault,
      levels: s.levels,
      bands: s.bands,
    });
  }

  const findingClasses = [
    { code: "MaNC", name: "Major nonconformity", description: "A requirement is not met and the risk is significant.", fixDays: 30, tone: "bad", sort: 0 },
    { code: "MiNC", name: "Minor nonconformity", description: "A requirement is partly met; the gap is contained.", fixDays: 60, tone: "warn", sort: 1 },
    { code: "OBS", name: "Observation", description: "Not a breach yet, but could become one.", fixDays: 90, tone: "info", sort: 2 },
    { code: "OFI", name: "Opportunity for improvement", description: "Good practice the organisation may adopt. No fix deadline.", fixDays: 0, tone: "neu", sort: 3 },
  ];
  for (const f of findingClasses) {
    await admin
      .from("finding_classes")
      .upsert(
        { tenant_id: tenantId, code: f.code, name: f.name, description: f.description, fix_days: f.fixDays, tone: f.tone, sort: f.sort },
        { onConflict: "tenant_id,code" },
      );
  }

  const actionTypes = [
    { key: "advisory", name: "Advisory letter", description: "Points out a gap and expects it fixed. No formal sanction.", responseDays: 21, hasPenalty: false, level: 1 },
    { key: "warning", name: "Warning letter", description: "Formal warning that further action follows if the gap is not fixed.", responseDays: 14, hasPenalty: false, level: 2 },
    { key: "directive", name: "Compliance directive", description: "Orders specific steps by a set date.", responseDays: 30, hasPenalty: false, level: 3 },
    { key: "penalty", name: "Monetary penalty", description: "A fine under the regulation, with a payment deadline.", responseDays: 30, hasPenalty: true, level: 4 },
    { key: "restrict", name: "Restriction or suspension", description: "Limits or suspends an activity or licence until the gap is fixed.", responseDays: 14, hasPenalty: false, level: 5 },
    { key: "referral", name: "Referral", description: "Refers the matter to another authority or to prosecution.", responseDays: 0, hasPenalty: false, level: 6 },
  ];
  for (const a of actionTypes) {
    await admin
      .from("action_types")
      .upsert(
        { tenant_id: tenantId, key: a.key, name: a.name, description: a.description, response_days: a.responseDays, has_penalty: a.hasPenalty, level: a.level },
        { onConflict: "tenant_id,key" },
      );
  }

  // Defaults per spec 14.1: benchmark 70, watch cycles 2, late runs 3, overdue days blank,
  // firm renewal 12 months, grace 30 days, conflict 24 months.
  await admin.from("tenant_rules").upsert({
    tenant_id: tenantId,
    firm_renewal_months: 12,
    firm_grace_days: 30,
    conflict_months: 24,
    compliance_benchmark_default: 70,
    watch_overdue_days: null,
    watch_cycles_running: 2,
    watch_late_runs: 3,
  });

  await loadRolePermissions(admin, tenantId);
}

/**
 * The regulator permission matrix (src/lib/mockData.ts ROLES/PERMS — Settings > Team and
 * roles) maps directly onto 8 of the 11 permission keys named in BACKEND_SPEC.md section 6.
 * The matrix shown on screen doesn't cover `enforcement.manage`, `returns.manage` or
 * `programmes.manage` — there is no existing UI table for those, so this is a judgment call,
 * not a transcription: `programmes.manage` and `enforcement.manage` follow the same
 * Admin+Supervisor shape as the other operational permissions (accrediting firms, publishing
 * reports); `returns.manage` (template configuration, not day-to-day filings) follows the
 * Admin-only shape of "manage branding and team". Documented here and in
 * docs/CHANGELOG.md — revisit if NITDA's actual preference differs once they use it.
 */
async function loadRolePermissions(admin: AdminClient, tenantId: string) {
  const roles = ["Admin", "Supervisor", "Reviewer", "Viewer"];
  const matrix: [string, boolean, boolean, boolean, boolean][] = [
    ["orgs.invite", true, true, false, false],
    ["orgs.classify", true, true, false, false],
    ["firms.accredit", true, true, false, false],
    ["library.edit", true, false, false, false],
    ["reviews.review", true, true, true, false],
    ["reports.publish", true, true, false, false],
    ["settings.manage", true, false, false, false],
    ["dashboards.view", true, true, true, true],
    ["enforcement.manage", true, true, false, false],
    ["returns.manage", true, false, false, false],
    ["programmes.manage", true, true, false, false],
  ];
  for (const [permission, ...values] of matrix) {
    for (let i = 0; i < roles.length; i++) {
      await admin
        .from("role_permissions")
        .upsert(
          { tenant_id: tenantId, role: roles[i], permission: permission as string, allowed: values[i] as boolean },
          { onConflict: "tenant_id,role,permission" },
        );
    }
  }
}
