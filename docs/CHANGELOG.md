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

**Email infrastructure** (spec sections 8/11), the next slice of Phase 1:
- `src/emails/` — shared `EmailLayout` plus the six templates this phase scopes to: `InviteOrg`, `InviteFirm`, `InviteColleague`, `InviteAccepted`, `PasswordChanged`, `DailyDigest` (skeleton — real task content wires up in phase 9 alongside `v_tasks`). Every other template in section 8's table is added by the phase whose action triggers it.
- `src/server/email/templates.ts` — the template registry (`EMAIL_TEMPLATES`), `renderEmail()`.
- `src/server/email/send.ts` — the one place that calls Brevo's transactional API; `EMAIL_TRANSPORT=log` writes to console instead, per spec.
- `src/server/email/outbox.ts` — `queueEmail()` and `processOutbox()` (1/5/30/120-minute retry schedule). **Judgement call, documented in code and here:** the spec says demo-tenant email is "never sent to the demo addresses" without defining which addresses count — read as the safer "every email in a demo tenant is suppressed," not just the six fixed accounts, since a demo shouldn't ever risk emailing a real inbox someone typed in while exploring. `DEMO_EMAIL_SINK`, if set, gets a copy.
- `20261023140500_email_cron.sql` — schedules the outbox retry job via Supabase `pg_cron` + `pg_net` every 5 minutes (Hobby plan can't run Vercel Cron that often — `docs/RECONCILIATION.md` section 6). The `CRON_SECRET` value itself was never written to a migration file or any committed file: it's stored in Supabase Vault (`vault.create_secret`, inserted directly against the database, not from SQL in this repo) and the scheduled job reads it from `vault.decrypted_secrets` at call time.
- Route handlers: `/api/cron/email` (outbox processor, used by both the pg_cron job and, if the plan ever changes, Vercel Cron), `/api/cron/daily` (authenticated skeleton — each later phase adds its own check as the data it acts on lands, rather than being built ahead of that data), `/api/health` (database + Brevo reachability), `/api/webhooks/brevo` (bounce/complaint → `email_suppressions`, verified by `CRON_SECRET` as a query param since Brevo's webhook config doesn't support custom headers).
- `vercel.json` — the one daily cron Vercel itself runs.

**Verified:** `tsc`/`eslint`/`next build` clean, including the four new routes. Sent a real email through the full template → Brevo pipeline (not just the raw API call from Step 0) via a temporary test route, confirmed accepted with a message ID, then deleted the test route. Confirmed the `pg_cron` job is scheduled and active, and the vault secret is readable. The job's first live call will 404 until this ships to production (the URL it calls is the production domain) — expected, not a bug; verified after promotion.

**Not done yet in this phase:** bootstrap script (live NITDA + starter admin invite, demo tenant + six demo accounts), sign-in/invitation/profile server actions, screens switched from mock to live data, tests. Continuing.

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
