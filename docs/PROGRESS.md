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

## Current state (2026-10-21, mid-session — paused for a deployment-identity fix)

**Phase:** Step 2 (foundations) is nearly done; one more piece of real Step 3 (P1) work was in flight when this session was paused to fix a deployment-blocking issue (see "Paused for" below). Step 1 (audit) is done and committed (`76fca2e`, `00e9c99`).

**Pushed to `staging` already:**
- `ddf4619` — app shell foundations: Ctrl/⌘K command palette (`src/lib/search.ts`), "waiting for you" tasks drawer with live per-workspace counts (`src/lib/tasks.ts`), bell/user-menu converted to real popovers, sectioned sidebar nav with live count badges, Help dialog, "Powered by SuperAtlas" footer, 15-minute idle-timeout warning. Fixed: Escape now closes Dialog/Drawer; a React Compiler immutability violation in nav/palette rendering. Carried over the signin demo-access popover, two previously-missing demo accounts (Moniepoint, OPay), any-password-works demo auth, reset/signed-out banners.
- `2ec46d0` — added this `PROGRESS.md` hand-over file.
- **These two commits are the ones Vercel is currently blocking** (see "Paused for" below) — they are authored as `emmanueladedeji-svg` with a co-author line, not as Emmalex17. They still need to be deployed/promoted once the identity fix lands (per the standing rule above, a redeploy commit or the next real commit will carry staging forward; these two are not being reverted or rewritten).

**Committed locally as WIP (not yet pushed), on `staging`, needs a proper non-WIP follow-up commit once verification resumes:**
- Rest of Step 2 foundations, all verified against reference screenshots/live dev server before this WIP commit:
  - `StatusChip`/`statusTone()` (the 45-word status→tone/icon map), `FilterPills`, `KTile`, `ChartCard`, `MiniTable` added to `src/components/ui.tsx` (file now needs `"use client"` — added).
  - Chart-kit string-builders `chColumns`, `chBars`, `chStack`, `chFunnel`, `chHeat`, `chDots` added to `src/lib/charts.ts` (visual-only for now, no drill/click — see note below).
  - All the matching CSS ported from `docs/prototype/source/styles.css` into `src/app/globals.css` (`.ktile`, `.kt-*`, `.chcard`, `.ch-*`, `.pill.tone-*`, `.tbl-sub`).
  - These are **built but not yet exercised by a real screen** — no phase screen uses `KTile`/`ChartCard`/the new chart-kit functions yet. Treat them as unverified-in-context until the first dashboard/analytics screen that uses them (P5's Analytics tab, P8/P9's Insights tabs, or P10's dashboards) is built and visually checked against its reference screenshot.
- Real P1 fixes (the two non-"agreed-difference" gaps `PARITY_AUDIT.md` flagged for `signin`), done and verified live:
  - Removed the `/register` link from `src/app/signin/page.tsx` (agreed difference #1 — keep `/register` in code, but it must not be linked from anywhere; it still isn't linked from anywhere else, confirmed by repo-wide grep).
  - `src/components/DemoAccess.tsx`'s popover now closes on outside-click and Escape (it only closed via the toggle/picking an account before).
- The three missing P1 invitation screens — **built and live-verified against their reference screenshots, pixel-matching**:
  - `src/lib/invites.ts` — the `INVITES` data (mirrors the prototype's `auth.js` `INVITES`).
  - `src/components/InviteFlow.tsx` — the shared two-step flow (simulated inbox/email → create-password form) used by all three routes.
  - `src/app/invitation/page.tsx` (NITDA/regulator invite) and `src/app/invitation/[id]/page.tsx` (`zenith`, `deloitte`).
  - `auth.ts` gained `beginPendingSignIn()`; `verify/page.tsx`'s `finish()` now respects a one-shot `superatlas.inviteNext` sessionStorage flag so accepting an invite lands on the right destination (`/welcome` for the regulator invite — org/firm invites land on their plain dashboard since `org/welcome`/`firm/welcome` don't exist yet; P3 will need to update `INVITES[...].next` once those are built).
  - `TENANT` in `src/lib/mockData.ts` gained a `col` field (`#0B7A3E`, NITDA's own brand colour, distinct from the Navy/Forest/Ocean theme swatches) — the prototype's `tenant.col`, which had no app equivalent before. Fixed two real bugs found via screenshot-diffing against the reference images: (1) the invitation email's "tenant" logo was rendering the app's own navy brand colour instead of NITDA's green; (2) the SuperAtlas-branded email's logo mark was rendering the full `Lockup` (icon+text) next to a separately-rendered "SuperAtlas" label, duplicating the wordmark — fixed to use the icon-only `LogoMark`.
  - **Verified live, full flow, both the regulator invite and the Zenith org invite**: inbox screenshot pixel-matches `screens/invitation.jpg`/`screens/invitation_zenith.jpg`, accept-password form works (live password-rules meter correct), routes to `/verify`, MFA code accepted, lands on the correct destination (`/welcome` for NITDA; `/organisation` dashboard, signed in as A. Okonkwo, for Zenith).
  - **Not yet verified**: the Deloitte (`invitation/deloitte`) variant specifically — same code path as Zenith's, same component, so very likely fine, but wasn't individually clicked through before the session was paused. Do this first when resuming.
- None of this WIP has run a final `tsc`/`eslint`/`next build` pass since the very last edits (the `cardMark`/`emailMark` logo fix). It passed clean right before that fix; re-run all three before turning this into a real commit.

## Paused for: fixing Vercel deployment-blocked identity issue

A git/Vercel identity problem was found: commits `ddf4619` and `2ec46d0` are authored as `emmanueladedeji-svg` (with a `Co-authored-by` line), but this repo and Vercel project belong to GitHub account `Emmalex17` — Vercel blocks deployments it can't match to the project owner. Work was paused here, mid-fix, to resolve that first (see the standing rule above). Once fixed and `staging`/`main` are confirmed on the same green commit, resume exactly where this section says to.

## Exact next step on resume

1. Finish verifying the WIP described above: click through `invitation/deloitte` specifically, then run `tsc --noEmit`, `eslint src`, and `npm run build` one more time.
2. Tick `invitation`, `invitation/zenith`, `invitation/deloitte`, and the `signin` row's register-link fix in `docs/prototype/PARITY_INVENTORY.md` / note them "Matches" in `docs/PARITY_AUDIT.md`.
3. Commit all of the WIP as a real commit (not "WIP:") — suggested message: `ui-parity: P1 invitation flow + close remaining P1/foundations gaps`. Follow the standing rule: author as Emmalex17, no co-author line, push to `staging`, confirm the Vercel staging deployment is green, then promote to `main` via PR and confirm production is green, then record the matching `main`/`staging` commit hash here.
4. P1 is then fully closed except the two explicitly-out-of-scope SSO question and (per the audit) possibly MFA/SSO scope confirmation — both already logged as Questions in `PARITY_AUDIT.md`, not blocking.
5. Move to Step 3, P2 (`docs/PARITY_AUDIT.md`'s P2 section — 2 Matches/10 Different/12 Missing, the whole Settings section and settingsShell are the big items there).

## Audit summary (from `docs/PARITY_AUDIT.md`)

| Phase | Matches | Different | Missing |
|---|---|---|---|
| P1 Public site and sign-in | 13 | 0 | 3 |
| P2 Regulator setup, settings, account | 2 | 10 | 12 |
| P3 Organisations and assurance firms | 9 | 5 | 18 |
| P4 Requirements library | 1 | 4 | 3 |
| P5 Programmes and engagements | 3 | 6 | 2 |
| P6 Answering and assessment | 0 | 5 | 6 |
| P7 Review, publishing, findings | 8 | 5 | 5 |
| P8 Data returns | 2 | 4 | 2 |
| P9 Compliance and enforcement | 0 | 6 | 9 |
| P10 Dashboards, search, cross-cutting | 1 | 5 | 1 |
| **Total** | **39** | **50** | **61** |

(P1's "3 Missing" above is now built as WIP, pending the commit described above — will become effectively 16/16 once that commit lands and the inventory is ticked.)

The 10 biggest gaps are listed in `docs/PARITY_AUDIT.md` lines 25-40 — worth re-reading before picking a phase, since several gaps span phases (e.g. the whole Settings section is both a P2 item and a dependency for P9's `settings/compliance`/`settings/actions`).

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
