# SuperAtlas back-end changelog

One entry per phase (`docs/BACKEND_SPEC.md` section 15), newest first. Each entry records what was built, actions added, migrations, screens switched to live data, and parity/test results, per the definition-of-done in section 17.

## Phase 1 — in progress, 23 Oct 2026

**`docs/BACKEND_SPEC.md` added to the repo.** It was read from the handoff materials but never actually copied in, even though RECONCILIATION.md and this file both cite it by that path — fixed now so the path resolves for whoever (or whichever session) reads these docs next.

**Auth: sign-in, codes, lockout, profile and password/email changes** (spec sections 7, 11), the next slice after email infrastructure:
- `20261023150000_auth_attempts.sql` — a small table purely for the 5-failures/15-minutes lockout counter (spec 7.1). Deliberately not `audit_log`: a wrong-password attempt often can't be tied to a tenant (we only learn who someone is, and so which tenant, once the password is right), and `audit_log.tenant_id` is `not null` by design.
- `src/contracts/actions.ts` — the `ActionResult`/`ActionError` shape every server action returns (spec 11's error codes), and the Zod schemas for every `auth` action.
- `src/server/actions/auth.ts` — `signIn`, `verifyCode`, `resendCode`, `signOut`, `requestPasswordReset`, `resetPassword`, `changePassword`, `changeEmail`, `updateProfile`, `getSession`. `signIn` checks the password by actually attempting `signInWithPassword` (there is no `getUserByEmail` in the Admin API — confirmed against `@supabase/auth-js`'s typings), then either keeps that session (demo accounts) or discards it and sends an email code via `signInWithOtp` (everyone else); `verifyCode`'s `verifyOtp` call is what starts the real session. Demo accounts cannot change email or password (spec 7.1).
- `supabase/seed/lib.ts`, `bootstrap-live.ts`, `demo/index.ts` — the live-NITDA bootstrap and the phase-1 slice of the demo seed (tenant, reference data, the six fixed-password demo accounts with minimal organisation/firm identity rows). Not yet the full `prototype-seed.json` dataset — that loads incrementally as each later phase's tables land. Both scripts are idempotent (every write is guarded by a lookup on its natural key) and run via `npm run seed:live` / `npm run seed:demo`.
- **Judgement calls, documented here and in code:** (1) the regulator permission matrix (`src/lib/mockData.ts` ROLES/PERMS) only covers 8 of the 11 keys section 6 names — `enforcement.manage` and `programmes.manage` were given the Admin+Supervisor shape of the other operational permissions, `returns.manage` the Admin-only shape of "manage branding and team"; revisit once NITDA actually uses Settings → Team and roles. (2) The common-password check (spec 7.2) is a short named list, not a breached-password corpus, for a pilot this size.
- **A routing decision reversed from the UI-parity work earlier this session:** the accept-invite flow was fixed then to route to `/mfa-setup` (matching the prototype's own decorative TOTP screen). Section 19's later-phase register (L2) is explicit that the pilot's backend has no real TOTP — email codes are the whole second factor. Once invitations/acceptance is wired to this auth module, accept-invite must route to the real sign-in code flow instead, not the mock enrolment screen. `/mfa-setup` itself stays in the repo, unused by the real flow, ready for when TOTP is actually switched on (L2's own plan).

**Verified end to end** against the real database via a temporary route (deleted after): a demo account signs in with its fixed password alone and gets `needsCode: false`, lands in the right workspace with its tenant/role/permissions correctly resolved by `getSession`; a wrong password returns the same generic message as a non-existent email (no account enumeration); the 5th consecutive failure switches to `rate_limited` and holds even against the *correct* password until the window passes. `tsc`, `eslint` and `next build` all clean. `bootstrap-live.ts` and `demo/index.ts` each run twice with the second run a no-op, confirming idempotency.

**Shipped and confirmed in production:** promoted via [PR #63](https://github.com/Emmalex17/SuperAtlas/pull/63) (merge commit `f28864a`). Re-ran the demo sign-in check directly against the deployed app (an ad-hoc `vercel deploy` preview carrying a secret-gated test route, never committed) rather than trusting the local dev-server result alone — same outcome: fixed-password sign-in, correct workspace, correct tenant/role/permissions from `getSession`. `npm run seed:live` and `npm run seed:demo` have both been run against the one shared Supabase project; `nitda` (empty, starter-admin invitation pending) and `nitda-demo` (six active demo accounts) both exist there now.

**Not done yet in this phase:** invitation server actions (create, accept, resend, cancel) and the team module; wiring the sign-in/verify/accept/profile screens to these actions in place of the current `localStorage` mock (`src/lib/auth.ts`); Phase 1 acceptance tests (no test runner installed yet — still an open item from `docs/RECONCILIATION.md`). Continuing.

---

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

**Shipped and confirmed in production** (not just staging): promoted via PR #61 (merge commit `3498ef6`). `/api/health` returns `{"ok":true}` on `superatlas-green.vercel.app`. The `pg_cron` job's first two scheduled runs (18:55, 19:00 WAT) 404'd because they fired before the production deploy finished — expected, documented above — but a manual trigger immediately after promotion returned `200 {"ok":true,"processed":0,"sent":0,"failed":0}`, confirming the full chain (`pg_cron` → `pg_net` → the live route → vault-secret auth → `processOutbox()`) genuinely works end to end, not just that each piece exists in isolation.

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
