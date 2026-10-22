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

## Current state (2026-10-22, ~13:30)

**Phase:** Step 1 (audit) done. Step 2 (foundations) substantially done. **P1-P8 (Step 3) are all fully closed: 16/16, 24/24, 32/32, 8/8, 11/11, 11/11, 18/18, and 8/8 Matches.** Next: P9 (Compliance and enforcement).

**P8 is complete — 8/8 Matches (up from 2/8 at session start).** Built:
1. `regulator/returns` Insights tab (new `Insights.tsx`, mirroring the prototype's `retInsights()`): 4 KTiles, a stacked "Filing on time by return and period" chart and a "late by organisation" bar chart, both with the chart kit's "View as table" toggle.
2. `regulator/returns/template/[id]` — the return-template builder, built from scratch (route didn't exist). Basics, "who files" type checkboxes, a Fields table (label/type/unit/min/max/not-more-than/required) with Edit/Preview toggle, Save draft/Publish — publishing a brand-new template opens the first filing period for every eligible organisation, matching `ACT.rtSave`.
3. Wired the dead "New template" and "Upload a template" buttons, and fixed the Templates-tab row action (was wrongly opening the Schedule dialog) to open the builder. Added the "Default grace period … (change)" line to the Schedule tab.
4. `org/return`: the "Upload template" filing mode (seg toggle, "Download template" button, drop zone that auto-fills figures), the one-time "Filed. Receipt …" success banner, wired the dead "Download filed copy" buttons, and the sign-off dialog (Prepared by/Approved by/declaration) that was missing entirely — submission went straight through with no confirmation before.
5. Added the `Data returns > …` breadcrumb to both filing-detail screens (`returns/filing`, `org/return`) — confirmed this is not a structural gap (`AppShell`'s `crumbs` prop already exists and is used elsewhere), just not passed on these two pages.

Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean. Live-verified end to end: Insights tab charts/table-toggle, template builder create→publish (new filings appeared for the right 15 organisations), an org return filed via the upload-template path through the sign-off dialog to a receipt, "Download filed copy" toast. Committed as `9a96f0c` + `e0f3e3c` (Emmalex17, no co-author lines), pushed to staging, confirmed Ready (200 on `/regulator/returns` and `/organisation/returns`), promoted via PR #48 (merge commit `aa18969`), confirmed production Ready (200 on both routes). `origin/main` = `aa189698e1a766f2b941e89b7e3034f62265b2d6`, `origin/staging` = `e0f3e3c008aaddba46ca798e3966a3b4b832256a`, `git diff origin/staging origin/main --stat` empty (zero content drift).

**P7 is complete — 18/18 Matches (up from 8/18 at session start).** Built:
1. `firm/findings` (Fixes to verify / Being fixed / Verified and closed tabs) and `firm/finding` (the firm's verify/not-fixed decision panel) — the whole firm-side finding workflow was missing entirely. Added a "Findings" item to the firm sidebar nav (was absent) with a live Fix-submitted count.
2. `findings` Register tab: Insights tab (new `Insights.tsx`, built on the existing chart kit — KTiles, open-findings-by-category stack, 8-month overdue trend line), gear-icon link to Finding classes, working Export toast.
3. `reviews/report`: a real "Organisation said" column (derived from the org's own Yes/No answers, was hardcoded `—`), the "Organisation's comments on the preview" card, and the Quality review row. Widened `CaseOutcome.override` with a `from` field so "Was X · changed by Y" shows correctly.
4. `org/report`: "Plan your fixes" button, the full star-rating card (new `addRating`/`ratingFor` in cases.ts — rate the firm once per case, read-only after), and wired the dead "Download report" button.
5. "Original deadline" and "Organisation" Kv rows added to `findings/view` and `org/finding`.
6. **Bonus fix**: swapped flat `tone="neu"` status chips for the existing `StatusChip` component (full colour/icon vocabulary) in `reviews` (tracker + report), and — caught while doing that — in several pages *this same session* had already written with the identical oversight: `programmes/[id]/Analytics.tsx`, `firm/assess`, `org/assessment`, `org/answer`, `org/obligations`.

**Correction to the standing audit, not a new fix:** `settings/findings` (the finding-classes editor) was flagged "Missing" in the P7 audit, but it was actually already fully built and wired in an earlier P2 commit (`3ddf379`) — the P2 inventory already had it checked off. The P7 audit's claim was stale. Lightly re-authored it to the same behaviour while fixing the (genuinely missing) gear-icon link to it from `findings`.

Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean. Live-verified end to end: a full star rating submitted on `org/report`, a submitted fix verified on `firm/finding` (status → "Verified fixed", nav badge updated). Committed as `64b2bd5` + `3027b6b` + `650b03b` (Emmalex17, no co-author lines), pushed to staging, confirmed Ready, promoted via PR #47 (merge commit `9cae06b`), confirmed production Ready (new routes 200). `origin/main` = `9cae06bd8ae2813a63206d8437e8353c4bb0683d`, `origin/staging` = `650b03b093c94507ac78bb80d6730d4f1cfde187`, `git diff origin/staging origin/main --stat` empty (zero content drift).

**P6 is complete — 11/11 Matches (up from 0/11 at session start, the worst-scoring phase of the whole audit).** Built:
1. `org/answer` rebuilt from a single scrolling page into the prototype's one-question-at-a-time wizard: sidebar section/question nav with progress, All/Unanswered/Mine/Flagged filters, per-question flagging and assignment, the "Assign questions" dialog, "Explain this question" AI box, "Rephrase with AI", real Upload/Add-a-link/From-evidence-library evidence actions, and a "Previous answer" reference dialog.
2. `org/submit` extracted to its own route (`.../answer/[id]/submit`) — by-section progress, Not-answered/Answered-No/Flagged-for-you lists that jump back to the question via `?q=`, and the submitted-receipt view.
3. `org/evidence`'s Upload dialog (name/type/expiry) and a drawer (integrity record + "Used in" list) on each row.
4. `firm/assess` rebuilt with all 5 tabs: Requirements now shows "The organisation's answers" per question (value, comment, evidence pills, interview pill, Ask button) plus a divergence warning when the assessor's outcome conflicts with the org's own answers; new Information requests, Interviews and Findings tabs; Report and sign-off gained the full stepper (outcomes → preview → quality review → sign-off → submit) with real gating. Live-verified end to end: recorded all 8 outcomes, shared the preview, recorded quality review, signed off, submitted — case correctly moved to "Report submitted".
5. `org/assessment` built from scratch (didn't exist anywhere before) — Requests from assessor, Interviews (slot-picking), Outcome preview (per-requirement comments), Your answers. `org/obligations`'s submitted-case action now correctly routes here with a real "Respond (N)" count instead of opening the locked answer wizard.
6. A shared `ThreadsPanel` component (`src/components/Threads.tsx`) for the information-request thread view both firm/assess and org/assessment need.

**Data-layer work underpinning all of the above:** widened `Question` with `comment`/`evidence`/`interview` flags (carried through `makeQSet` from the library's `NormQuestion`) and `Case` with properly typed `Thread`/`Interview`/`PreviewComment`/`QualityReview` structures, replacing a placeholder `threads: unknown[]`. Added ~20 new mutators (`toggleFlag`, `askInformation`, `replyToThread`, `proposeInterview`, `raiseFinding`, `shareOutcomePreview`, `recordQualityReview`, etc.).

**Real, previously-undiscovered data-quality bug found and fixed:** all 1,029 seed answers across every case had `status: "answered"` stored but no actual `v` value — meaning `answerComplete()` (used by this phase's new completeness checks) always disagreed with `caseProgress()`'s `status`-based check used elsewhere (e.g. the Obligations table's "41%"). Backfilled plausible values per question type via a one-time script; confirmed org/answer's own progress bar now agrees with the Obligations table everywhere.

Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean. Committed as `3865f60` + `4424ebe` + `8b2ad1d` (Emmalex17, no co-author lines), pushed to staging, confirmed Ready, promoted via PR #46 (merge commit `87843d4`), confirmed production Ready (all new routes 200). `origin/main` = `87843d4ce6cc7f78aaa77b2e0c761f00bd7985e6`, `origin/staging` = `8b2ad1dc36b3a53e455ebfd41cfec7b445acf63b`, `git diff origin/staging origin/main --stat` empty (zero content drift).

**P5 is complete — 11/11 Matches (up from 3/11 at session start).** Built:
1. `programmes` list: List/Calendar view toggle + full Calendar (month grid of Opens/Due events), wired "New programme"/"Continue setup"/scoring-settings buttons.
2. `programmes/new`: the 6-step programme wizard (Basics → Scope → Question set → Scoring and deadlines → Settings → Review and launch), reusing the shared `SuggestQuestionsDialog` for per-requirement AI drafts in the programme's own editable question-set copy.
3. `programmes/view` (`[id]/page.tsx`): Overview header actions (Send reminder to all / Edit programme / more-menu) + cycle picker + Key-dates Reminders row; Organisations tab bulk-select/assign-firm (with a real independence check)/review-request flows; Questions tab answer-part badges; Cycles tab full 7-column table + Run-next-cycle; Settings tab Reminders row.
4. `programmes/view` → Analytics tab (`Analytics.tsx`, new file): the full 5-sub-tab surface (Progress/Results/Sections/Over time/Remediation) with the shared filter bar, built entirely on the pre-existing chart kit (`src/lib/charts.ts`) and `KTile`/`ChartCard`/`MiniTable` components from earlier phases — this was the single largest remaining gap in the whole PARITY_PROMPT effort and turned out tractable specifically because that chart-kit infrastructure already existed.
5. `org/obligations`'s Choose-a-firm dialog: Accredited-firms/Another-firm segmented toggle, the non-accredited-firm request form, independence-conflict row blocking, declined-last-request banner.

**Key data fix found while building:** seeded a real PwC/GTB independence conflict (`FIRMS.pwc.clients`, with a new `FirmClient.orgId` field) matching the prototype's own demo scenario exactly — without it, the Assign-firm dialog's conflict-blocking logic had no case in our data to ever exercise, so it couldn't be verified as actually working. Live-verified it now correctly blocks the assignment.

**Deliberate adaptation (documented, not a gap):** Analytics' chart kit renders static SVG/HTML strings (`dangerouslySetInnerHTML`), not interactive React elements, so per-chart-element drill-down dialogs (click a bar → see the org list) are not wired — each `ChartCard` instead offers the existing "View as table" toggle. This is the same adaptation P3's `organisations/category` screen already used and shipped as a "Matches" screen, so it is a precedent-consistent choice, not a shortcut invented for this phase.

All new/changed screens live-verified in browser (not just visually): the full wizard end-to-end (create → schedule → edit draft → re-save, with AI-suggested questions), the Assign-firm independence block, the Review-request approve flow, all 5 Analytics sub-tabs against real multi-cycle (2024/2025/2026) data with zero console errors, and org/obligations' non-accredited-firm request flow end to end.

Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean. Committed across 4 staging commits (`c49893b`, `deece17`, `289aa25`, `97da221`; all Emmalex17, no co-author lines), each pushed and confirmed Ready, promoted via PR #45 (merge commit `b5eddbc`), confirmed production Ready (new routes 200). `origin/main` = `b5eddbc46671dd63d3ef1a11d07476a2ed303dc3`, `origin/staging` = `97da2219be34de36779d60b9f4772cd316674251`, `git diff origin/staging origin/main --stat` empty (zero content drift).

**P4 is complete — 8/8 Matches (up from 1/8 at session start).** Built the three missing screens:
1. `library/requirement` (standalone requirement view: Previous/Next/Edit, Questions-asked with badges + Suggest-questions-with-AI, Evidence required, Guidance, Details/Applies-to sidebar).
2. `library/edit` (combined new/edit requirement editor: editable question rows, evidence add/remove, Suggest-with-AI, Applies-to checkbox grid, Weight/Scoring-scheme fields).
3. `library/ai` (3-step "Add a regulation with AI" wizard: Upload/Read/Review drafts, confidence bars, accept/reject/edit per draft, publishes a new Draft regulation).

Plus wired every previously-dead button on `library` and `library/[id]` (Add regulation, Import spreadsheet, Actions card, section/requirement add/rename, Add question), and extracted a shared `SuggestQuestionsDialog` component (`src/components/SuggestQuestions.tsx`) used by both `library/requirement` and `library/edit`.

**Key architectural fix found while building:** restructured `RegRequirement.questions` from a per-render-derived raw-tuple shape to a `NormQuestion[]` normalized **once** at module load (`normalizeRegsQuestions(REGS)`, mirroring the prototype's own one-time `SEED.regs.forEach` pass in `data.js`). The original approach silently dropped Evidence/Interview flags on any question added after the seed data, since `normQ()`'s flag-derivation only works for index-0 questions — caught via live browser testing (added a question with Evidence checked, it didn't render the badge), not just type-checking.

All three new screens live-verified end-to-end in browser (not just visually): the Suggest-questions-with-AI flow (3→7 questions, badges intact, toast correct), the new-requirement create flow (auto-numbered ref `ISR-7.3`, save, navigate), and the full AI wizard (upload → read → accept 6/reject 1 → publish new Draft "Cyber Resilience Regulation 2026" regulation) — all with zero console errors on a freshly-restarted dev server (ruling out stale-chunk false positives).

Verified: `tsc --noEmit`, `eslint src`, `npm run build` all clean. Committed as `bfae02c` (Emmalex17, no co-author line), pushed to staging, confirmed Ready (all 3 new routes 200), promoted via PR #44 (merge commit `1bc6bb1`), confirmed production Ready (all 3 new routes 200). `origin/main` = `1bc6bb1cab41c483a78b4a26376c7b6564c2a3c4`, `origin/staging` = `bfae02c14d1dbd6eefca3a87cddd307f9c8f3cdd`, `git diff origin/staging origin/main --stat` empty (zero content drift).

**P3 is complete — 32/32 Matches (up from 10/32 at session start).** Full build list, in order:
1. `organisations/category` (category ranking screen) + shared compliance helpers in `cases.ts`/`enforcement.ts`.
2. `organisations/profile`'s Compliance tab + a shared `Scorecard` component.
3. The prototype's global `polishDom()` pass (dash → "None yet"/"None") — a previously-undiscovered gap affecting every already-shipped P1/P2 screen, not just P3.
4. Finding-status chip labels (`FD_STATUS_TONE` → `FD_STATUS_CHIP`) — a second previously-undiscovered gap, fixed across 5 pages.
5. The category-cards pins system on `organisations` (list page) + the "Organisation"/"Firm" sidebar nav sections.
6. `firms/profile`'s Performance tab + a shared `Stars` component.
7. Self-service `org/team`, `org/profile` (5 tabs), `firm/team`, `firm/profile` (5 tabs).
8. `org/welcome` (5-step wizard), `firm/welcome` (4-step wizard), `firm/apply` (4-step accreditation application).
9. Wired `INVITES.zenith.next`/`deloitte.next` to the new wizards; verified end to end (accept invite → MFA → lands on the wizard).
10. **Fixed a real gap against `firm/apply`'s pilot note** ("keep the screen in code but remove every entry point — firms are invited by NITDA"): the prototype's own screenshots show "Apply for accreditation" buttons on `firm/profile` and `firm/welcome`, but the pilot note requires those removed too, not just the public-nav link. Caught by re-reading `PARITY_INVENTORY.md`'s pilot note carefully while writing the final audit, after having built the buttons to match the prototype screenshots exactly — removed both, route stays fully built and reachable only by direct URL (same treatment as P1's `register`).
11. Rewrote `docs/PARITY_AUDIT.md`'s P3 section (32/32, full per-row notes) and ticked all 32 `PARITY_INVENTORY.md` checkboxes.

**Noted but deliberately left for P9** (flagged in the audit, not fixed here — real scope creep risk otherwise): the prototype's organisation-workspace nav has one "Compliance" item (`org/compliance`) with `org/exposure`/`org/actions` folded in as sub-views, not the app's current standalone "Regulatory actions" item (`/organisation/actions`, built in an earlier phase). P9's own audit already tracks `org/compliance` as entirely missing — this is that phase's problem to solve, not a P3 self-service-workspace one.

Every screen in this list was live-verified against its `docs/prototype/screens/*.jpg` reference (pixel/text match) before being marked done — see the commit messages for `fa77ffc`, `10a9085`, `1f6aa4e`, `cc1fda6`, `c09a68c`, `02c0743` for full per-commit detail.

**Pushed to `staging` and `main` (PR #43, merge commit `d4affcb`), both deployed `Ready` and verified live** — `origin/main` = `d4affcb`, `origin/staging` = `02c0743`, `git diff origin/staging origin/main --stat` empty (zero content drift). Production (`superatlas-green.vercel.app`) returns 200 at `/signin`.

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

**P3 is done.** Move to Step 3, P4 (Requirements library) — `docs/PARITY_AUDIT.md`'s P4 section (1/8 Matches, 4 Different, 3 Missing) is the next read. Biggest items per that section: `library/requirement` (standalone requirement detail view) and `library/edit` (requirement editor) don't exist at all; `library/ai` ("Add regulation with AI" stepper) doesn't exist; the `library` list's three action buttons ("Add regulation", "Import spreadsheet", "Add with AI") are all dead (no `onClick`/`href`); `library/regulation`'s left-aside "Actions" card (Edit details/Add requirement/Create new version/Publish/Archive) is missing entirely, as are several smaller pieces (search box, "Expand all", per-question badge pills, the Evidence tab's row-click-to-open). Read the full P4 section and its "Questions" before starting — in particular, confirm whether the missing "Actions" card + `library/edit` + `library/ai` should be treated as one connected "no requirement/regulation authoring exists" gap or several separate fixes, per that section's own open question.

## Audit summary (from `docs/PARITY_AUDIT.md`, P1–P3 now updated)

| Phase | Matches | Different | Missing |
|---|---|---|---|
| P1 Public site and sign-in | **16** | **0** | **0** |
| P2 Regulator setup, settings, account | **24** | **0** | **0** |
| P3 Organisations and assurance firms | **32** | **0** | **0** |
| P4 Requirements library | 1 | 4 | 3 |
| P5 Programmes and engagements | 3 | 6 | 2 |
| P6 Answering and assessment | 0 | 5 | 6 |
| P7 Review, publishing, findings | 8 | 5 | 5 |
| P8 Data returns | 2 | 4 | 2 |
| P9 Compliance and enforcement | 0 | 6 | 9 |
| P10 Dashboards, search, cross-cutting | 1 | 5 | 1 |
| **Total** | **87** | **35** | **28** |

The 10 biggest gaps are listed in `docs/PARITY_AUDIT.md` — #3 (P3 self-service workspaces), #4 (P2 Settings), #6 (app shell) and #9 (P1 invitations/signin) are now all marked resolved there. **#1 (P9's org-side Compliance surface, 0/15 matches) is now the single biggest open item** — and per this session's P3 closing note, it also covers the nav/IA question (prototype's unified `org/compliance` vs. the app's standalone `/organisation/actions`) flagged while building P3's "Organisation" nav section. #2 (P6, assessors can't see organisation answers) is tied for biggest at 0/11 matches.

## Remaining Step 2 foundations (lower priority, not blocking later phases)

- Sidebar brand block: prototype shows tenant logo+name+"Supervision workspace"/"Supervised by NITDA" subtitle + a collapse/rail toggle (`[` key). App still shows the SuperAtlas logo instead. Cosmetic, not blocking page builds.
- Remaining phases still need to adopt the `crumbs` prop screen-by-screen as they're built (P2 was the first phase to pass it; P3 did too, including the new self-service screens).
- Toast: prototype auto-dismisses at 4200ms with an explicit × button; app dismisses at 3500ms with no × button.
- Dialog: still missing auto-focus-of-first-field on open (prototype's `openDialog` does this).
- Chart-kit drill/click interactivity (`data-act="drill"` → opens a drawer of organisations) is still deliberately not built. P3 reached the first real case where the prototype uses it (the peer-comparison `chBars` on `firms/profile`/`firm/profile`'s Performance tab, click a bar to open that firm's own performance) and made the deliberate call to skip it rather than expand `chBars`'s shared API mid-phase — a secondary analytics affordance, not a blocking gap (the same firm is still reachable via the firms list). Revisit if a future phase's screen genuinely needs click-through (not just visual) drill-down.
- `KTile`/`ChartCard`/the chart-kit functions are no longer unexercised — P3 put `chDots`, `chStack`, `chLine`, and `chBars` into real, live-verified screens (`organisations/category`, both Compliance tabs, both Performance tabs). Still unused: `chColumns`, `chFunnel`, `chHeat` — first real use (and visual verification) will come whenever a later phase's analytics/Insights screen needs one.

## How to resume cleanly

1. `git config user.name; git config user.email` — confirm it's Emmalex17's identity (see standing rule above) before committing anything.
2. `git status`, `git log --oneline -10`, `git log origin/staging..staging` — check for anything uncommitted or unpushed.
3. Re-read this file top to bottom, then `docs/PARITY_AUDIT.md`'s "10 biggest gaps" and the phase table above.
4. Dev server: `npm run dev -- -p 3100` (background). Demo sign-in: `/signin` → "Demo access" popover, or set `localStorage.setItem("superatlas.session", "<email>")` directly for the account in `src/lib/auth.ts` and navigate straight to a workspace route.
5. Before any destructive git command, `git status` first.
6. Commit message convention for phase work: `ui-parity: P<n> <name>`. Push to `staging`, confirm staging deploy is green, then promote to `main` via PR per the standing rule — never commit to `main` directly.
7. If a `git push` fails with `HTTP 400` / `unexpected disconnect while reading sideband packet` on this machine, it's an HTTP/2 negotiation quirk with this network, not a real error — retry with `git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin staging` (one-off flags, nothing persisted to git config).
