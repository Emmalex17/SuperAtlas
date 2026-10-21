# SuperAtlas UI parity — progress hand-over

Read this first when resuming. Keep it updated after every screen or significant step, per `docs/PARITY_PROMPT.md`.

## Deployment-identity fix — resolved 2026-10-21 ~07:25

**Cause (confirmed via `vercel inspect` on the blocked deployment):** commits `ddf4619`/`2ec46d0` (and, it turned out, `00e9c99`/`76fca2e` too) were authored with email `emmanuel.adedeji@opexconsult.co.uk`, which GitHub resolves to login `emmanueladedeji-svg` — not `Emmalex17`, the repo/Vercel project owner. Vercel's exact message: *"The deployment was blocked because the commit author doesn't have permission to create deployments for this project."*

**Fix applied:** set this repo's local git identity (not global) to `user.name "Emmalex17"`, `user.email "90387855+Emmalex17@users.noreply.github.com"` (GitHub's own noreply address for that account, user id 90387855 — confirmed via `gh api user`; the user chose this over supplying a real email). Committed the standing-rule doc update (`87b4b29`) under that identity with no co-author line, pushed to `staging`, confirmed the Vercel preview deployment went to `Ready` (not Blocked), then merged PR #35 into `main` with a merge commit (`c0084da`) and confirmed the production deployment also went to `Ready`. Verified both staging (`superatlas-git-staging-emmanueladedeji67-3967.vercel.app`) and production (`superatlas-green.vercel.app`) load the sign-in page and that sign-in (NITDA demo account) reaches the MFA step correctly.

A follow-up docs-only commit (`ff38f67`, recording this fix) was then pushed to `staging`, confirmed `Ready` there, and promoted the same way via a second PR (#36, merge commit `abab4eb` on `main`). **Attempted a fast-forward merge of `origin/staging` into local `main` first** (to get literally-identical hashes) — it failed (`fatal: Not possible to fast-forward`), because PR #35's merge commit (`c0084da`) exists only on `main`'s line, not `staging`'s, so the two branches' commit graphs diverge even though content matches. No history was rewritten or force-pushed to recover from this; the merge was simply aborted (cleanly, nothing was in progress) and a normal merge-commit PR was used instead, same as #35.

**Final confirmed state:** `origin/main` = `2b8050c`, `origin/staging` = `4990367` — different SHAs (expected, per the above), but `git diff origin/staging origin/main --stat` is empty: **zero content drift**. Production (`superatlas-green.vercel.app`) deployment for `2b8050c` reached `Ready` and was confirmed live (sign-in page loads, no `/register` link, demo-access popover present). Staging deployment for `4990367` also reached `Ready`.

(Note: this exact edit, recording the `2b8050c`/`4990367` hashes, is itself not yet promoted past `staging` as its own PR — it's a one-line bookkeeping update, not a "screen, fix, or phase," so per the standing rule's spirit it travels with the next real commit instead of spawning a fourth PR purely to promote itself. Everything substantive above is already live on both `staging` and `main`.)

**Note for future promotions:** since `main` now permanently carries merge commits that never land on `staging`, a true fast-forward will not be possible again without first rebasing one branch onto the other (a history-rewriting operation this project avoids per its git-safety rules). Going forward, use a merge-commit PR for every `staging` → `main` promotion (as both #35 and #36 did) and treat an **empty `git diff origin/staging origin/main`** as the correct verification of "in sync" — not identical hashes.

The earlier (now superseded) `ddf4619`/`2ec46d0` commits were never reverted or rewritten — they're still in history, just no longer the tip of anything that gets deployed standalone; their content shipped as part of this same promotion.

---

## Standing rule (deployment identity and promotion) — follow every session, no exceptions

- This repo and its Vercel project belong to GitHub account **Emmalex17**. Vercel blocks any deployment whose commit author it can't match to the project owner/team — so every commit must be authored as Emmalex17, with **no `Co-authored-by` lines**.
- At the **start of every session**, check `git config user.name` and `git config user.email` match the Emmalex17 identity before committing anything.
- After every screen, fix, or phase:
  1. Commit as Emmalex17 (no co-author lines).
  2. Push to `staging` and confirm the staging Vercel deployment succeeds (not "Blocked", not failed).
  3. Promote to `main` through a pull request from `staging` into `main` (or a fast-forward merge) — confirm the production deployment succeeds.
  4. Confirm `main` and `staging` are in sync — `git diff origin/staging origin/main --stat` is empty (zero content drift). The hashes themselves (`git rev-parse origin/main` / `origin/staging`) will usually differ once any promotion has used a merge commit, which is expected, not a problem — see "Deployment-identity fix" above for why. Record both hashes and confirm the diff is empty here.
- **Never** commit directly to `main`, **never** force-push, **never** promote `staging` → `main` while a check is red.

## Current state (2026-10-21, ~07:40)

**Phase:** Step 1 (audit) done. Step 2 (foundations) substantially done. **P1 (Step 3) is now fully closed: 16/16 Matches.** About to start P2.

**Pushed to `staging` and `main`, both deployed `Ready` and verified live:**
- App shell foundations: Ctrl/⌘K command palette (`src/lib/search.ts`), "waiting for you" tasks drawer with live per-workspace counts (`src/lib/tasks.ts`), bell/user-menu converted to real popovers, sectioned sidebar nav with live count badges, Help dialog, "Powered by SuperAtlas" footer, 15-minute idle-timeout warning. Escape now closes Dialog/Drawer (it didn't before).
- Shared `StatusChip`/`statusTone()` (45-word status→tone/icon map), `FilterPills`, `KTile`, `ChartCard`, `MiniTable` (`src/components/ui.tsx`); chart-kit string-builders `chColumns`, `chBars`, `chStack`, `chFunnel`, `chHeat`, `chDots` (`src/lib/charts.ts`); all matching CSS in `globals.css`. **Built but not yet exercised by a real screen** — unverified-in-context until the first dashboard/analytics screen that needs one (P5's Analytics tab, P8/P9's Insights tabs, P10's dashboards). Drill/click interactivity deliberately deferred to that point too.
- **P1 fully closed, 16/16 Matches** (was 13/16, 3 Missing): built the three invitation screens (`src/lib/invites.ts`, `src/components/InviteFlow.tsx`, `src/app/invitation/page.tsx`, `src/app/invitation/[id]/page.tsx`), all three live-verified pixel-identical to their reference screenshots with the full accept → password → MFA → destination flow working (regulator → `/welcome`, Zenith → `/organisation`, Deloitte → `/firm` — the latter two land on the plain dashboard rather than `org/welcome`/`firm/welcome` since those don't exist yet; P3 should update `INVITES[...].next` once built). Removed `signin`'s leftover `/register` link. `DemoAccess` popover now closes on outside-click/Escape. `TENANT.col` (`#0B7A3E`) added to `mockData.ts` — fixes the invitation emails' NITDA logo colour.
- `docs/prototype/PARITY_INVENTORY.md`'s full P1 section (13 checkboxes) ticked; `docs/PARITY_AUDIT.md` updated (P1 section, overview table, gaps #6 and #9 marked resolved/fixed).
- Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean on the final commit.

No WIP outstanding. Working tree clean as of this point in the session.

## Exact next step

Move to Step 3, P2 (`docs/PARITY_AUDIT.md`'s P2 section — 2 Matches/10 Different/12 Missing). The biggest item is the entire regulator Settings section (`settings/categories`, `settings/scoring`, `settings/firm-types`, `settings/deadlines`, `settings/findings`, `settings/compliance`, `settings/actions` — all Missing, though their typed JSON data already exists and is unused) plus the shared `settingsShell`/`SETTINGS_NAV` left-nav layout that `profile`, `profile/branding`, and `team` all need to be rebuilt under (currently ad-hoc top tabs with no left nav, wrong breadcrumb). Read the full P2 section in `docs/PARITY_AUDIT.md` (and its "Questions") before starting — there's an open question there about whether to build `settingsShell` as shared infrastructure first (affects 4+ already-built screens plus all 7 missing ones) before any individual Settings screen.

## Audit summary (from `docs/PARITY_AUDIT.md`, P1 now updated)

| Phase | Matches | Different | Missing |
|---|---|---|---|
| P1 Public site and sign-in | **16** | **0** | **0** |
| P2 Regulator setup, settings, account | 2 | 10 | 12 |
| P3 Organisations and assurance firms | 9 | 5 | 18 |
| P4 Requirements library | 1 | 4 | 3 |
| P5 Programmes and engagements | 3 | 6 | 2 |
| P6 Answering and assessment | 0 | 5 | 6 |
| P7 Review, publishing, findings | 8 | 5 | 5 |
| P8 Data returns | 2 | 4 | 2 |
| P9 Compliance and enforcement | 0 | 6 | 9 |
| P10 Dashboards, search, cross-cutting | 1 | 5 | 1 |
| **Total** | **42** | **50** | **58** |

The 10 biggest gaps are listed in `docs/PARITY_AUDIT.md` — worth re-reading before picking a phase; #6 (app shell) and #9 (P1 invitations/signin) are now marked resolved there, so #4 (P2 Settings) is effectively the next biggest open item and lines up with where P2 picks up.

## Remaining Step 2 foundations (lower priority, not blocking Step 3)

- Settings shell (`settingsShell`/`SETTINGS_NAV`) — build when P2's Settings screens are actually built.
- Sidebar brand block: prototype shows tenant logo+name+"Supervision workspace"/"Supervised by NITDA" subtitle + a collapse/rail toggle (`[` key). App still shows the SuperAtlas logo instead. Cosmetic, not blocking page builds.
- Per-page breadcrumbs: `AppShell`'s `crumbs` prop exists and works (tested), but no page passes it yet — each phase's screens need to pass their own `crumbs` as they're built.
- Toast: prototype auto-dismisses at 4200ms with an explicit × button; app dismisses at 3500ms with no × button.
- Dialog: still missing auto-focus-of-first-field on open (prototype's `openDialog` does this).
- Chart-kit drill/click interactivity (`data-act="drill"` → opens a drawer of organisations) was deliberately left out of the new `chBars`/`chColumns`/`chStack`/`chFunnel`/`chHeat`/`chDots` — build it when the first screen that needs it is reached, since the drawer content needed to design the drill API concretely only exists once there's a real caller.

## How to resume cleanly

1. `git config user.name; git config user.email` — confirm it's Emmalex17's identity (see standing rule above) before committing anything.
2. `git status`, `git log --oneline -10`, `git log origin/staging..staging` — check for anything uncommitted or unpushed.
3. Re-read this file top to bottom, then `docs/PARITY_AUDIT.md`'s "10 biggest gaps" and the phase table above.
4. Dev server: `npm run dev -- -p 3100` (background). Demo sign-in: `/signin` → "Demo access" popover, or set `localStorage.setItem("superatlas.session", "<email>")` directly for the account in `src/lib/auth.ts` and navigate straight to a workspace route.
5. Before any destructive git command, `git status` first.
6. Commit message convention for phase work: `ui-parity: P<n> <name>`. Push to `staging`, confirm staging deploy is green, then promote to `main` via PR per the standing rule — never commit to `main` directly.
7. If a `git push` fails with `HTTP 400` / `unexpected disconnect while reading sideband packet` on this machine, it's an HTTP/2 negotiation quirk with this network, not a real error — retry with `git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin staging` (one-off flags, nothing persisted to git config).
