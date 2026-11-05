# Environment variables

Every variable the app, the seed scripts, or CI reference — what it's for and where its value
actually lives. Names only; no values are recorded here or anywhere else in the repo except
`.env.local` (gitignored). `.env.example` carries the same names with empty values, and
`grep -c "=.\+" .env.example` must return `0` before every commit (the standing secrets rule).

Confirmed against Vercel directly (`vercel env ls`) and `.env.local`/`.env.example` on 5 Nov 2026.

## Supabase

| Variable | Purpose | Where the value lives |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The project's API URL. Public — safe in the client bundle (`NEXT_PUBLIC_` prefix), scoped by RLS, not a secret in itself. | `.env.local`; Vercel (Development/Preview/Production) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anon-role API key client code signs in with. Also public by design — every read/write it makes is still gated by RLS. | `.env.local`; Vercel (all three environments) |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS entirely. Used only by `src/lib/supabase/admin.ts` (server-only) — cron jobs, the email sender, invitation accept/seed scripts, per spec section 5's documented exceptions. Never sent to the browser. | `.env.local`; Vercel (all three, marked Secret) |
| `SUPABASE_PROJECT_REF` | The project ref (`iysretxwhytyathrdxve`) — used by `supabase` CLI commands that take `--project-id` instead of a direct DB URL. | `.env.local`; Vercel |
| `SUPABASE_ACCESS_TOKEN` | A personal Management-API access token (not project-scoped) — used for `supabase db push`/`gen types` when they go through the Management API rather than a direct DB connection. **Expires**; regenerate via the Supabase dashboard (Account → Access Tokens) when `supabase` CLI commands start failing with `401 Invalid access token`. The `--db-url "$DIRECT_URL"` form of `db push`/`gen types` bypasses this token entirely and is the more reliable path. | `.env.local` only — never deployed (a CLI-only credential, not something the running app needs) |
| `DATABASE_URL` | Pooled Postgres connection string (via Supavisor/pgbouncer) — what the app itself would use for a direct connection, and what seed scripts could use as an alternative to the service-role REST client. | `.env.local`; Vercel (all three, marked Secret) |
| `DIRECT_URL` | Unpooled direct Postgres connection string — required for migrations (`supabase db push --db-url`) and `gen types`, since pooled connections don't support the session-level features those need. | `.env.local`; Vercel (all three, marked Secret) |

## Brevo (transactional email)

| Variable | Purpose | Where the value lives |
| --- | --- | --- |
| `BREVO_API_KEY` | Used by `src/server/email/send.ts` for the direct-API path (everything except sign-in codes/password reset, per spec section 8's two-path table). | `.env.local`; Vercel |
| `BREVO_SMTP_LOGIN` | Configured in Supabase Auth's custom SMTP settings (dashboard, not this repo) — sign-in codes and password-reset emails go through this, not the direct API. | `.env.local`; Vercel; also entered directly into the Supabase dashboard's Auth → SMTP settings |
| `BREVO_SMTP_KEY` | Same SMTP path as above. | `.env.local`; Vercel; Supabase dashboard |
| `EMAIL_FROM_ADDRESS` | Sender address for both paths. Sender-verified in Brevo, not domain-verified (no SPF/DKIM) — a deliberate, documented gap for the pilot (see `docs/CHANGELOG.md`'s Step 0 entry). | `.env.local`; Vercel |
| `EMAIL_FROM_NAME` | Sender display name. | `.env.local`; Vercel |
| `EMAIL_REPLY_TO` | Reply-to address shown in every email template's footer. | `.env.local`; Vercel |
| `EMAIL_TRANSPORT` | When set to `log`, `send.ts` writes to the console instead of actually calling Brevo — used in local dev and tests so nothing real gets sent. **Not set in Vercel for any environment** — staging and production both send real email by design. | `.env.local` only (optional — unset means "really send") |
| `DEMO_EMAIL_SINK` | Optional: if set, every demo-tenant email (which is otherwise suppressed — spec's "never sent to the demo addresses" rule) also sends a copy here, for presenters. **Not currently set anywhere** — the operator decided to skip it (see the Step 0 entry in `docs/CHANGELOG.md`). | Not set. Would go in `.env.local` / Vercel if ever enabled. |

## App / deployment

| Variable | Purpose | Where the value lives |
| --- | --- | --- |
| `APP_URL` | The canonical app URL used to build links in emails (invite accept links, password-reset redirect, etc.) and in `next.config.ts`'s security headers. Production value is `https://superatlas-green.vercel.app`. | `.env.local`; Vercel (all three — Development's value points at `localhost`) |
| `STAGING_URL` | The staging deployment's URL. Referenced by `docs/BACKEND_SPEC.md`'s own testing section ("Playwright against `STAGING_URL`") and by `playwright.config.ts`'s `e2e` project as a fallback base URL. | `.env.local`; Vercel |
| `STARTER_ADMIN_EMAIL` | The email `supabase/seed/bootstrap-live.ts` invites as live NITDA's first Regulator Admin. Currently the operator's own address. | `.env.local`; Vercel |
| `CRON_SECRET` | Bearer token every `/api/cron/*` route and the Brevo webhook route check. Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on its own scheduled cron hits; the Supabase `pg_cron` job (the 5-minute email-outbox retry, since Vercel Cron on Hobby only runs daily) reads the same value from Supabase Vault, inserted separately and never written to any migration file. | `.env.local`; Vercel; Supabase Vault (`vault.create_secret`, run once directly against the database) |
| `AI_PROVIDER` | Switches the AI-suggestion features (library/requirement drafting) between `demo` (canned responses) and a real provider — currently always `demo` for the pilot (spec section 13, later-phase register L7). | `.env.local`; Vercel |

## Demo tenant fixed passwords

| Variable | Purpose | Where the value lives |
| --- | --- | --- |
| `DEMO_PASSWORD_NITDA` | `m.bello@nitda.gov.ng`'s fixed password. | `.env.local`; Vercel |
| `DEMO_PASSWORD_ZENITH` | `a.okonkwo@zenith.example`'s fixed password. | `.env.local`; Vercel |
| `DEMO_PASSWORD_MONIEPOINT` | `c.obi@moniepoint.example`'s fixed password. | `.env.local`; Vercel |
| `DEMO_PASSWORD_OPAY` | `k.sule@opay.example`'s fixed password. | `.env.local`; Vercel |
| `DEMO_PASSWORD_DELOITTE` | `t.adebayo@deloitte.example`'s fixed password. | `.env.local`; Vercel |
| `DEMO_PASSWORD_HALCYON` | `b.nwosu@halcyon.example`'s fixed password. | `.env.local`; Vercel |

All six are read server-side only — by `supabase/seed/demo/index.ts` (sets each account's real
Supabase Auth password) and by `listDemoAccounts()` (`src/server/actions/auth.ts`), which
renders them into the sign-in page's "Demo access" panel so a presenter can see and copy the
real password (spec section 14.2) — never hardcoded into the client bundle.

## Listed in `.env.example` but not currently used by any code path

| Variable | Why it's there anyway |
| --- | --- |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Spec's own env-var list (section 2) names these for a CI pipeline that deploys *through* the Vercel CLI/API. This project's actual deploys are Vercel's own GitHub integration (automatic on push) — these three aren't read anywhere in the repo and aren't set in Vercel. Kept in `.env.example` for parity with the spec; harmless to leave unused. |

## CI (`.github/workflows/`)

Neither workflow needs a GitHub Actions repo secret configured:

- **`ci.yml`**'s `lint-typecheck-build` job uses hardcoded placeholder strings (not real
  values) for the Supabase/app vars — `next build` only needs *something* string-shaped at
  build time, it never actually connects.
- **`ci.yml`**'s `unit-and-access` job starts a local Supabase stack (`supabase start`) and
  reads *that* stack's own freshly-generated URL/keys via `supabase status`, writing them to
  `$GITHUB_ENV` for the test run — never touches the shared staging/live project or any stored
  secret.
- **`e2e.yml`** takes `staging_url` as a manual `workflow_dispatch` input (plain text, not a
  secret — a deployment URL isn't sensitive) and runs Playwright against a real, already-
  deployed staging environment; it doesn't need credentials of its own beyond what the app
  itself exposes publicly to any visitor.

If a later phase's e2e tests need to sign in as a real (non-demo) account rather than a demo
one, *that* would need a secret added to the repo (GitHub → Settings → Secrets → Actions) —
not required yet.

## Local-only test variables (never deployed)

| Variable | Purpose |
| --- | --- |
| `TEST_APP_URL` | Base URL for Playwright's `integration` project (a local dev server backed by local Supabase) — defaults to `http://localhost:3200` if unset. |

Local Supabase's own URL/keys (`tests/support/localSupabase.ts`) are read via `supabase status`
at test-run time, not from any env var at all, unless `NEXT_PUBLIC_SUPABASE_URL` etc. are
already set in the shell (which CI's `unit-and-access` job does, to avoid shelling out twice).
