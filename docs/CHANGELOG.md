# SuperAtlas back-end changelog

One entry per phase (`docs/BACKEND_SPEC.md` section 15), newest first. Each entry records what was built, actions added, migrations, screens switched to live data, and parity/test results, per the definition-of-done in section 17.

## Phase 1 — in progress, 23 Oct 2026

**Supabase client helpers** (`src/lib/supabase/server.ts`, `client.ts`, `admin.ts`) — server, browser and service-role clients per spec section 5. `src/proxy.ts` added for session refresh (Next.js 16 renamed `middleware.ts` → `proxy.ts`; this project follows that rename from the start rather than using the deprecated name).

**Migrations applied to the shared Supabase project** (`supabase db push`, all 5 confirmed applied, types regenerated and committed):
- `20261023140000_platform_core.sql` — `tenants`, `profiles`, `memberships`, `role_permissions`, `invitations`, shared `updated_at` trigger.
- `20261023140100_reference_data.sql` — category tree (`sector_groups`/`org_types`/`org_tiers`), `scoring_schemes`, `finding_classes`, `action_types`, `tenant_rules`.
- `20261023140200_org_firm_identity.sql` — minimal `organisations`/`firms` (id, name, status only — just enough for `memberships` to reference and for a sidebar to show a name), then tightens `memberships`/`invitations`' `org_id`/`firm_id` with real foreign keys now that the tables exist. Full organisation/firm profile columns are back-end phase 2's job, added additively.
- `20261023140300_audit_notifications_email.sql` — `audit_log` (insert-only, update/delete revoked), `notifications`, `email_outbox`, `email_suppressions`.
- `20261023140400_rls.sql` — `current_membership()`, `current_tenant_id()`, `is_admin()`, `is_regulator(perm)`, `is_org_member()`, `is_firm_member()`, `firm_can_see_org()`/`org_can_see_firm()` (stand-ins returning `false` until phase 4's `cases` table exists); RLS enabled and policies on every table above; explicit grants to `authenticated`.

**Verified:** `tsc --noEmit`, `eslint`, `next build` all clean. Live-checked against the real project: anon key returns `[]` (not an error) querying `tenants` with no session, matching the "zero rows, not a failure" shape RLS should produce; service-role key confirms zero tenants exist yet (correct — bootstrap hasn't run).

**Not done yet in this phase:** bootstrap script (live NITDA + starter admin invite, demo tenant + six demo accounts), `src/server/email/` outbox sender and Brevo templates, sign-in/invitation/profile server actions, screens switched from mock to live data, tests. Continuing.

---

## Step 0 and Step 0.5 — 23 Oct 2026

**Step 0 (credential verification):** all 17 items checked; full pass/fail table recorded in the session log and summarised in `docs/RECONCILIATION.md` section 7. Notable outcomes:
- Brevo API key, SMTP credentials, sender identity all verified working (test email sent and received).
- Supabase Auth configured with Brevo custom SMTP, 6-digit/10-minute OTP, public sign-ups off, site URL and redirect allow-list set.
- Database password reset and both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) confirmed with `select 1`.
- `CRON_SECRET` and the six `DEMO_PASSWORD_*` values generated.
- `AI_PROVIDER=demo` set.
- One deliberate, documented gap: `EMAIL_FROM_ADDRESS` is sender-verified only, not domain-verified (no SPF/DKIM) — operator's choice for the pilot after DNS setup issues. Logged, not silently accepted.
- Vercel confirmed on the Hobby plan, which changes how cron jobs are scheduled (`docs/RECONCILIATION.md` section 6).

**Step 0.5 (repository check):** `docs/RECONCILIATION.md` written — stack, current Supabase usage (none), route-to-mock-data mapping, env vars in use, lint/type-check/test/CI commands, and every difference from the spec's assumed layout with the decision taken for each.

---

*Phase 1 entry starts below as it is built.*
