# Repository reconciliation (Step 0.5)

Written once at the start of back-end work, then updated whenever the repository's shape diverges from `docs/BACKEND_SPEC.md`'s assumed layout. See `docs/PROGRESS.md` for the day-to-day build log; this file is the structural reference.

## 1. Stack

- **Next.js 16.4.2**, App Router (`src/app/`), Turbopack for dev and build.
- **React 19.3.0**, TypeScript 5, strict mode.
- **Package manager:** npm (`package-lock.json` present; no yarn/pnpm lockfile).
- **Node:** v24.14.0 locally; Vercel builds on Node 24.x.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/turbopack`, plus a large hand-written design-system stylesheet (`src/app/globals.css`) ported from the prototype — most components use plain class names (`.card`, `.btn`, etc.), not Tailwind utility classes, to keep pixel fidelity with the prototype.
- **Deployment:** Vercel, project `superatlas`, team `emmanueladedeji67-3967`, **Hobby plan** (confirmed in Step 0 — affects cron scheduling, see section 6 below).

## 2. Current Supabase usage (before this phase)

- `supabase/` exists with `config.toml` only (`supabase init` was run, project linked to `iysretxwhytyathrdxve`, West Europe / London). **No migrations, no seed scripts, no Supabase client code anywhere in `src/`.**
- `grep -rl "createClient|@supabase" src/` returns nothing — the app is 100% front-end today, reading from static JSON mock data (see section 3).
- No `@supabase/ssr` or any Supabase package in `package.json`.

## 3. Existing routes vs. the prototype's screen inventory

The UI parity work (`docs/PARITY_PROMPT.md`, `docs/prototype/PARITY_AUDIT.md`) already maps every route in `src/app/` to its prototype screen ID — that audit is the source of truth and is not repeated here. Relevant to back-end wiring:

- `src/lib/data/*.json` — the mock data today: plain JSON files (`cases.json`, `compliance.json`, `deadlines.json`, `enfCases.json`, and more), imported directly by `src/lib/*.ts` modules (`cases.ts`, `enforcement.ts`, `returns.ts`, `tasks.ts`, `search.ts`, `mockData.ts`, `auth.ts`, `invites.ts`). These `.ts` modules are the actual data-access layer the screens call into — there is no separate mock-vs-live adapter split yet.
- **Difference from the spec's assumed `src/lib/data/`:** the spec describes `src/lib/data/` as "one interface per area, with a mock adapter (prototype data) and a live adapter (server actions)." Today it's just the raw JSON plus logic-bearing `.ts` files with no adapter interface. **Decision:** introduce the mock/live adapter split module by module as each back-end phase switches that area over (per section 3's "order of work" rule), rather than restructuring the whole data layer up front. The existing `.ts` modules' exported function names become the adapter interface each area's live version must satisfy, so screens keep importing from the same paths.
- `src/lib/auth.ts` currently implements session handling against `localStorage` (`superatlas.session`) for the prototype's demo personas — this is replaced in Phase 1 by real Supabase Auth sessions.

## 4. Environment variables already in use

Before this phase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only (set in Vercel, unused in code). Everything else in the spec's Step 0 table was added this phase — see the Step 0 report in the session log and `.env.example` (names only) for the full list now in place.

## 5. Lint, type-check, test, CI

- `npm run lint` → ESLint 9, flat config (`eslint.config.mjs`), `eslint-config-next` (core-web-vitals + typescript).
- `npx tsc --noEmit` for type-checking (no separate `typecheck` script; add one).
- **No test runner configured** (`vitest`, `playwright` etc. are not in `package.json`). The spec's section 17 testing requirements (unit, access, integration, end-to-end) need these added in Phase 1.
- **No `.github/workflows/` directory exists.** The CI (`ci.yml`) and deploy (`deploy.yml`) pipelines in spec section 16 need to be created from scratch.
- No `vercel.json` yet — needed for cron route declarations (section 16).
- No `docs/CHANGELOG.md` yet — created alongside this file.

## 6. Differences from the spec's assumed layout, and decisions taken

| Spec assumes | Repo has | Decision |
| --- | --- | --- |
| `src/lib/data/` = mock+live adapter pairs | Plain JSON + logic `.ts` files, no adapter split | Introduce the split per area, per phase, not all at once (section 3 above) |
| `src/server/`, `src/contracts/`, `src/emails/` | Don't exist yet | Create as specified; no conflicting structure to reconcile |
| Test suite exists to extend | None exists | Add Vitest + Playwright in Phase 1 as part of "foundations," not assumed already present |
| Favicon/app icons missing (spec section 20 front-end follow-up) | `src/app/icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx` already exist with real content | **Already resolved**, independently of this spec — no action needed; spec's note is stale |
| Vercel Cron can run the 5-minute email job | Hobby plan: Vercel Cron is at most once/day per job | Use Supabase `pg_cron` + `pg_net` for the 5-minute email-retry job and the nightly demo reset; Vercel Cron handles only the one daily job (`/api/cron/daily`), declared in `vercel.json` |
| `EMAIL_FROM_ADDRESS` on a domain with verified SPF/DKIM | Sender-only verified (`emmanuel.adedeji@opexconsult.co.uk`), no domain DNS auth — operator's DNS setup had issues, pilot explicitly doesn't need it | Documented, deliberate pilot-only gap (see Step 0 report). Mail may land in spam. Revisit with proper domain verification before any real NITDA-facing use |
| Regulator demo account `m.bello@nitda.gov.ng` (spec's open item) | — | Operator chose the `.example` alternative: `m.bello@nitda-demo.example` (confirmed, not yet seeded — seeding happens in Phase 1) |

## 7. Supabase connection details on record (values in `.env.local` / Vercel env, not here)

- Project ref `iysretxwhytyathrdxve`, region `eu-west-2` (London), Postgres 17.
- Pooler host `aws-0-eu-west-2.pooler.supabase.com` — port 6543 for `DATABASE_URL` (transaction/pgbouncer mode, app runtime), port 5432 for `DIRECT_URL` (session mode, migrations).
- Supabase Auth custom SMTP configured against Brevo (host `smtp-relay.brevo.com`, port 587); OTP length 6, expiry 10 minutes; public sign-ups off; site URL and redirect allow-list set to `APP_URL`/`STAGING_URL`.

---

*Next: Phase 1 — foundations, email, sign-in. See `docs/PROGRESS.md` for build-by-build status.*
