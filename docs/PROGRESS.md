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

## Current state (2026-10-21, ~16:45)

**Phase:** Step 1 (audit) done. Step 2 (foundations) substantially done. **P1 and P2 (Step 3) are both fully closed: 16/16 and 24/24 Matches.** P3 (Organisations and assurance firms) now underway — see below for what's done.

**Pushed to `staging` and `main` (PR #42, merge commit `7171986`), both deployed `Ready` and verified live** — `origin/main` = `7171986`, `origin/staging` = `1f6aa4e`, `git diff origin/staging origin/main --stat` empty (zero content drift). Production (`superatlas-green.vercel.app`) and staging (`superatlas-git-staging-emmanueladedeji67-3967.vercel.app`) both return 200.

**Deployment infra note (2026-10-21, after the mid-session resume):** GitHub → Vercel's auto-deploy webhook stopped firing for plain `git push` events partway through this session (confirmed via `gh api repos/.../commits/<sha>/status` returning `total_count: 0` for several minutes after a push that previously would have triggered a build within seconds). PR-open events still triggered builds fine (used for PR #42's checks). Worked around it for both the `staging` push and the `main` merge by running `vercel deploy --yes` (staging) / `vercel deploy --prod --yes` (production) directly, then `vercel alias set <new-deployment> superatlas-git-staging-....vercel.app` for the staging alias (the production alias updates automatically on `--prod` deploys). Both verified `Ready` and returning 200 afterwards. **If a future session hits the same "pushed but no Vercel status after ~30s" symptom, this manual-deploy-and-alias workaround is the fix** — check the Vercel GitHub integration in the dashboard if it keeps recurring.

- Built the regulator's **Performance tab** on `firms/[id]/FirmProfileClient.tsx` (reports published, average rating, days to report, outcomes changed by NITDA, rating-trend chart, peer comparison, ratings table) — the prototype's `firmPerf(f, 'reg')`. Added a shared `Stars` component (`src/components/ui.tsx`) and `avg1()` helper (`src/lib/cases.ts`), both will be reused by the self-service `firm/profile` Performance tab next. Live-verified: exact pixel/numeric match against `docs/prototype/screens/firms_profile__performance.jpg` (all 4 ktiles, chart values, 4-firm peer comparison, all 11 ratings rows). Also confirmed firms/profile's "People 3" tab-count badge was already correctly wired from earlier work — no fix needed there.

### P3 progress this session

- Built `organisations/category/[type]` (the category ranking screen: ktiles, section-scores dot chart, compliance-status stacked bar, ranking table, scorecard export) — live-verified pixel-close against `docs/prototype/screens/organisations_category.jpg`.
- Built `organisations/profile`'s **Compliance** tab (status-by-programme table, score history line chart, section scores bar chart, findings list, returns/enforcement summary, scorecard export) — shown only when an organisation is Verified, added alongside the existing Verification tab. Live-verified pixel/text-match against `docs/prototype/screens/organisations_profile__compliance.jpg`.
- Added shared compliance-calculation infrastructure to `src/lib/cases.ts` (`compStatus`, `orgOverall`, `liveSeries`, `latestResult`, `prevResult`, `benchOf`, `COMP_STATUSES`) and `src/lib/enforcement.ts` (`mySeries`, `orgExposure`, `LV_TONE` — the latter two live in enforcement.ts, not cases.ts, because they read `ENF_CASES`/`atOf` and cases.ts must not import enforcement.ts). Deliberate reuse investment: this same infrastructure is needed again for P9 (compliance/enforcement) and P10 (dashboards), and `orgExposure`/`mySeries` will be needed again for the self-service org workspace (`org/dashboard`, `org/compliance`) still pending in P3.
- Built a shared `Scorecard` dialog component (`src/components/Scorecard.tsx`) — printable/CSV-exportable, used by both new screens above; will be reused by P10's dashboard board-pack export.
- **Found and fixed a real, previously-undiscovered global parity gap**: the prototype wraps its entire render cycle in a `polishDom()` pass (`c7.js`) that replaces literal "—"/"-" placeholder text with words ("None yet" in numeric contexts, "None" elsewhere) everywhere in the app, not just on new screens — it affects every already-shipped P1/P2 screen too. Ported it as `src/lib/polishDom.ts` plus a `MutationObserver`-driven effect in `AppShell.tsx`. Hit and fixed a real bug while building it: the effect's dependency array was initially `[]`, so it ran once before `AppShell`'s session check resolved (when the ref was still `null`) and never ran again — fixed by depending on `[checked, account]` so it re-runs once the real shell mounts. Also initially used `requestAnimationFrame` to schedule the DOM walk, which never fires while the browser tab is backgrounded/hidden — switched to `queueMicrotask`, which isn't visibility-throttled, since a user could otherwise leave a tab backgrounded and never see dashes resolve.
- **Found and fixed a second global parity gap**: finding-status chips (`FD_STATUS_TONE` → renamed `FD_STATUS_CHIP`) were printing the raw status value (e.g. "Open") instead of the prototype's `fdChip()` label map (e.g. "Open" reads as "Plan needed", with a `flag` icon) — confirmed against `docs/prototype/screens/findings.jpg`. Fixed in `src/lib/cases.ts` and all 5 consumers: `regulator/findings/page.tsx`, `regulator/findings/[id]/page.tsx`, `organisation/findings/page.tsx`, `organisation/findings/[id]/page.tsx`, and the new Compliance tab.
- Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean. Committed as `fa77ffc` (Emmalex17, no co-author line), pushed to staging, confirmed Ready, promoted via PR #40 (merge commit `6541c76`), confirmed production Ready.

Not yet done, not yet reflected in `docs/PARITY_AUDIT.md`'s P3 section or `docs/prototype/PARITY_INVENTORY.md` — see "Exact next step".

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

No WIP outstanding. Working tree clean as of this point in the session.

## Exact next step

P3 build order from here. `firms/profile`'s Performance tab (and the already-correct "People 3" label) are now done — see above. Remaining:

1. **Build the self-service workspace screens — the single largest remaining P3 chunk.** Prototype source fully read this session (`docs/prototype/source/onboarding.js` lines 149-305, `docs/prototype/source/workspace.js` lines 1-131) — exact copy ready to port, no further source-reading needed before building. Build order:
   - Data layer first: extend `Organisation` (mockData.ts) with `onboard: {profile,logo,officers,people,group}`, `links: {name,rel}[]`, `logoUp?: boolean` (officers/colleagues already exist); extend `Firm` with the same `onboard`/`logoUp` shape (people/clients already exist). Add mutators: officer add/remove, colleague invite, link add, logo-upload toggle (org side); assessor add/remove, client declare/remove, logo-upload toggle (firm side) — mirroring the prototype's `ACT.form_obProfile`/`obLogo`/`form_obOfficer`/`obOffDel`/`form_obColleague`/`form_obLink` and `ACT.form_fbProfile`/`fbLogo`/`form_fbAssessor`/`fbAsDel`/`form_fbClient`/`fbClDel`.
   - `org/team` (`src/app/organisation/team/page.tsx`): NAME/ROLE/STATUS table (officers as "Organisation admin" + colleagues), "Invite colleague" dialog, 4 role-description cards. Simplest screen, build first to validate the data layer.
   - `firm/team` (`src/app/firm/team/page.tsx`): PERSON/ROLE/CREDENTIALS/CREDENTIAL EXPIRY/STATUS table, "Add person" dialog, remove action (except self).
   - `org/profile` (`src/app/organisation/profile/page.tsx`, 5 tabs: Details/Classification/Licences/Group links/Settings) — Details is a form (Legal name read-only/Registration number/Website/Head office/Compliance contact email + Logo card + Key officers card linking to org/welcome); Classification is the self-service "Request a classification change" flow (reuses `catSelects`-equivalent cascading sector/type/tier selects already built for P2's categories import wizard — check `src/app/regulator/settings/categories/import/page.tsx` for the pattern) gated on `CLASS_REQS` pending-request state; Licences is upload-only (no real file logic needed, matches regulator-side pattern already built); Group links lists `org.links` + "Add a link" (routes to org/welcome's group step); Settings is 3 toggle switches + "Save settings" (no real persistence needed, matches prototype's own no-op `savedToast`).
   - `firm/profile` (`src/app/firm/profile/page.tsx`, 5 tabs: Details/Performance/Accreditations/Assessors/Advisory clients) — Performance tab reuses this session's `firmPerf`-equivalent logic in "firm" mode (`side !== 'reg'`: drop the peer-comparison chart and ratings table, add "What organisations said" — last 5 ratings, names hidden); Accreditations tab lists `FIRM_ACCREDITATIONS`/open `ACC_APPS` plus an "Apply for accreditation" button going to `firm/apply`; Assessors tab is a read-only version of firm/team's table; Advisory clients tab lists `firm.clients` + "Declare a client" form.
   - `org/welcome` (`src/app/organisation/welcome/page.tsx`) and `firm/welcome` (`src/app/firm/welcome/page.tsx`) — 5-step and 4-step vertical-stepper wizards reusing the exact same mutators built for team/profile above (`obAdvance`/`fbAdvance` step-completion pattern: mark step done in `onboard`, jump to next incomplete step, redirect to dashboard once all done). Build these **last** since they're the most complex UI but reuse everything else.
   - `firm/apply`: build the application form (per `docs/prototype/source` — not yet read this session, read before building) but leave it **unlinked from public nav**, per the already-agreed deliberate difference; only reachable via firm/profile's/firm/welcome's "Apply for accreditation" buttons.
2. Once `org/welcome`/`firm/welcome` exist, update `src/lib/invites.ts`'s `INVITES.zenith.next`/`INVITES.deloitte.next` to point at them instead of the plain `/organisation`/`/firm` dashboards (noted as a follow-up when P1's invitation flow was built).
3. Once all of the above is built and verified: tick checkboxes in `docs/prototype/PARITY_INVENTORY.md`'s P3 section, rewrite `docs/PARITY_AUDIT.md`'s P3 section (currently stale at 10/32 Matches — does not yet reflect this session's `organisations/category` / Compliance tab / pins-system / Performance-tab work), update the phase table below, commit as `ui-parity: P3 complete — X/32 Matches`, push/promote/verify per the standing rule, then move to P4.

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
