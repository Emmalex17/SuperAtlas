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

## Current state (2026-10-21, ~09:15)

**Phase:** Step 1 (audit) done. Step 2 (foundations) substantially done. **P1 and P2 (Step 3) are both now fully closed: 16/16 and 24/24 Matches.** About to start P3.

**Pushed to `staging` and `main` as of the last promotion (identity-fix commits through `ca1a1db`/`d018a29`), both deployed `Ready` and verified live.** The P2 work below is committed locally but **not yet pushed** — see "Exact next step" for the pending promotion.

- App shell foundations, chart-kit/shared components, and P1 (16/16 Matches) — see git history, all previously pushed and confirmed live.
- **P2 fully closed, 24/24 Matches** (was 2/24, 10 Different, 12 Missing):
  - Built `SettingsShell`/`SETTINGS_NAV` (`src/components/SettingsShell.tsx`) — the shared left-nav layout (Workspace: Profile/Branding/Team, Supervision: Categories/Firm types/Scoring schemes/Deadlines & reminders/Finding classes/Compliance status/Action types). Found and fixed a real bug while building it: wrapping each nav group in its own `<div>` broke the prototype's flat flex-column structure, causing multi-word labels ("Firm types") to word-wrap mid-phrase — fixed by using `Fragment` instead, keeping `.set-g`/`<a>` as direct children of `.set-nav` like the prototype's own flat HTML.
  - Wired real per-page breadcrumbs through `AppShell`'s `crumbs` prop on every P2 screen (first phase to actually use it).
  - Added the regulator sidebar's "Settings" gear-icon link between Help and the footer (`AppShell.tsx`), with `pathname`-based active-state matching across all settings routes plus `profile`/`profile/branding`/`team`. Removed "Team" and "Profile" as separate top-level sidebar items (they live under Settings in the prototype, not the main nav).
  - Built all 7 missing `settings/*` screens (`src/app/regulator/settings/{categories,categories/import,scoring,firm-types,deadlines,findings,compliance,actions}/page.tsx`), wiring up the previously-orphaned `schemes.json`/`deadlines.json`/`findingClasses.json`/`compliance.json`/`actionTypes.json` data layer via new exports (`SCHEMES`/`DEADLINES`/`FINDING_CLASSES`/`COMPLIANCE_SETTINGS`/`ACTION_TYPES`) and new mutators in `src/lib/cases.ts`/`enforcement.ts`. Added `CATEGORIES` counts/`TAGS`/`GROUPS`/`CAT_HISTORY` plus a full set of mutators to `mockData.ts` for the categories tree editor (add/rename/delete/reorder at sector/type/tier level, tag add/remove, saved-group create) and the 3-step categories-import wizard (exact 18-row seed, duplicate/missing-sector fix flows) — live-verified end to end, including a real import that added 7 new categories correctly.
  - Fixed `profile/branding`'s "Profile"-instead-of-"Branding" heading bug.
  - Fixed `welcome`'s missing live branding preview-box by extracting the existing `profile/branding` preview into a shared `BrandPreview` component (`src/components/BrandPreview.tsx`), used by both screens now.
  - Fixed `notifications`/`account`'s "Preferences" deep-link — `account/page.tsx` now reads a `?tab=` query param via `window.location.search` in a `useEffect` (avoiding `useSearchParams()`'s Suspense-boundary requirement, consistent with this codebase's established browser-only-read pattern), and `notifications`'s "Preferences" button pushes to `/account?tab=notif`.
  - Fixed `audit`'s missing "Apply" button — filters are now staged in draft state and only applied on form submit, matching the prototype (was live-filtering on every keystroke before).
  - Built `organisations/invite`'s full "Spreadsheet" bulk-invite mode (mode-switch segmented control defaulting to Spreadsheet, template download, upload, a processing step, review table with per-row tier-fix/category-conflict resolution, "Send N invitations") alongside the existing single-organisation form, sharing a new `InviteEmailPreview` component (`src/components/InviteEmailPreview.tsx`). Added `inviteOrganisation`/`resendOrInvite` mutators to `mockData.ts`. Live-verified end to end: fixed both error rows, sent 4 invitations, confirmed all 4 landed in the organisations directory with correct categories and "Invited" status.
- `docs/prototype/PARITY_INVENTORY.md`'s full P2 section (23 checkboxes) ticked, plus `organisations/invite`'s checkbox (filed under P3 in that doc). `docs/PARITY_AUDIT.md` updated: P2 section rewritten, overview table, "10 biggest gaps" #4 marked resolved, P3's `organisations/invite` row (it was duplicated across both phase tables in the original audit) updated to Matches too.
- Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean.

No WIP outstanding beyond the pending commit/push/promote described next. Working tree has the P2 changes staged for commit as of this point.

## Exact next step

1. Commit the P2 work as Emmalex17 (check identity first) with message `ui-parity: P2 complete — 24/24 Matches`, push to `staging`, confirm the Vercel staging deployment is green, then promote to `main` via a merge-commit PR (per the standing rule), confirm production is green, and record the final `main`/`staging` hashes here (with a `git diff origin/staging origin/main --stat` empty-diff check, not literal hash equality — see the "Deployment-identity fix" section above for why).
2. Move to Step 3, P3 (`docs/PARITY_AUDIT.md`'s P3 section — now 10/32 Matches, 4 Different, 18 Missing after today's `organisations/invite` fix). The biggest items: the entire org-side "Compliance" tabbed surface doesn't exist (tracked as gap #1, now the single biggest gap in the whole project); `org/welcome`, `org/team`, `org/profile` (5 tabs), `firm/welcome`, `firm/team`, `firm/profile` (5 tabs) are all missing — orgs/firms have no self-service workspace at all (gap #3); `organisations/category` (the category drill-down ranking screen) is missing; `organisations/profile`'s Compliance tab and `firms/profile`'s Performance tab are both missing. Read the full P3 section and its "Questions" before starting.
3. Once P3's `org/welcome`/`firm/welcome` exist, update `src/lib/invites.ts`'s `INVITES.zenith.next`/`INVITES.deloitte.next` to point at them instead of the plain `/organisation`/`/firm` dashboards (noted as a follow-up when P1's invitation flow was built).

## Audit summary (from `docs/PARITY_AUDIT.md`, P1 and P2 now updated)

| Phase | Matches | Different | Missing |
|---|---|---|---|
| P1 Public site and sign-in | **16** | **0** | **0** |
| P2 Regulator setup, settings, account | **24** | **0** | **0** |
| P3 Organisations and assurance firms | 10 | 4 | 18 |
| P4 Requirements library | 1 | 4 | 3 |
| P5 Programmes and engagements | 3 | 6 | 2 |
| P6 Answering and assessment | 0 | 5 | 6 |
| P7 Review, publishing, findings | 8 | 5 | 5 |
| P8 Data returns | 2 | 4 | 2 |
| P9 Compliance and enforcement | 0 | 6 | 9 |
| P10 Dashboards, search, cross-cutting | 1 | 5 | 1 |
| **Total** | **64** | **39** | **46** |

(Totals carry a ~1-row bookkeeping wrinkle from `organisations/invite` being listed in both P2's and P3's tables in the original Step-1 audit — not worth untangling further; both occurrences now correctly say Matches.)

The 10 biggest gaps are listed in `docs/PARITY_AUDIT.md` — #4 (P2 Settings), #6 (app shell) and #9 (P1 invitations/signin) are now all marked resolved there, so #1 (P9's org-side Compliance surface) and #3 (P3's missing org/firm self-service workspaces) are the two biggest open items, and #3 lines up with where P3 picks up.

## Remaining Step 2 foundations (lower priority, not blocking Step 3)

- Sidebar brand block: prototype shows tenant logo+name+"Supervision workspace"/"Supervised by NITDA" subtitle + a collapse/rail toggle (`[` key). App still shows the SuperAtlas logo instead. Cosmetic, not blocking page builds.
- Remaining phases still need to adopt the `crumbs` prop screen-by-screen as they're built (P2 is the first phase to actually pass it).
- Toast: prototype auto-dismisses at 4200ms with an explicit × button; app dismisses at 3500ms with no × button.
- Dialog: still missing auto-focus-of-first-field on open (prototype's `openDialog` does this).
- Chart-kit drill/click interactivity (`data-act="drill"` → opens a drawer of organisations) was deliberately left out of the new `chBars`/`chColumns`/`chStack`/`chFunnel`/`chHeat`/`chDots` — build it when the first screen that needs it is reached, since the drawer content needed to design the drill API concretely only exists once there's a real caller.
- `KTile`/`ChartCard`/the chart-kit functions are still unexercised by any real screen — first real use (and visual verification) will come whenever P5/P8/P9/P10's analytics/Insights/dashboard screens are built.

## How to resume cleanly

1. `git config user.name; git config user.email` — confirm it's Emmalex17's identity (see standing rule above) before committing anything.
2. `git status`, `git log --oneline -10`, `git log origin/staging..staging` — check for anything uncommitted or unpushed.
3. Re-read this file top to bottom, then `docs/PARITY_AUDIT.md`'s "10 biggest gaps" and the phase table above.
4. Dev server: `npm run dev -- -p 3100` (background). Demo sign-in: `/signin` → "Demo access" popover, or set `localStorage.setItem("superatlas.session", "<email>")` directly for the account in `src/lib/auth.ts` and navigate straight to a workspace route.
5. Before any destructive git command, `git status` first.
6. Commit message convention for phase work: `ui-parity: P<n> <name>`. Push to `staging`, confirm staging deploy is green, then promote to `main` via PR per the standing rule — never commit to `main` directly.
7. If a `git push` fails with `HTTP 400` / `unexpected disconnect while reading sideband packet` on this machine, it's an HTTP/2 negotiation quirk with this network, not a real error — retry with `git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin staging` (one-off flags, nothing persisted to git config).
