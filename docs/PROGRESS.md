# SuperAtlas UI parity — progress hand-over

Read this first when resuming. Keep it updated after every screen or significant step, per `docs/PARITY_PROMPT.md`.

## Current state (2026-10-21, ~06:55)

**Phase:** Step 2 (foundations), in progress. Step 1 (audit) is done and committed (`76fca2e`, `00e9c99`).

**Just finished and pushed to `staging` (`ddf4619`):**
- Ctrl/⌘K command palette (`src/lib/search.ts`, wired into `AppShell.tsx`)
- "Waiting for you" tasks drawer with live per-workspace counts (`src/lib/tasks.ts`)
- Bell and user-menu top-bar buttons converted to real popovers (`Overlay.tsx`'s new `Popover`)
- Sectioned sidebar nav with live count badges (`buildNav` in `AppShell.tsx`)
- Help dialog, "Powered by SuperAtlas" footer
- 15-minute idle-timeout warning with 60s countdown
- Fixed: Escape now closes `Dialog`/`Drawer` (it didn't before, despite the UI showing an `Esc` hint)
- Fixed: a React Compiler immutability violation in nav/palette rendering (mutating a loop variable during render — moved to pure module-level helpers `withSectionBreaks`/`withGroupHeaders`)
- Carried over from the signin-page work already in flight: `DemoAccess.tsx` popover, two demo accounts (Moniepoint, OPay) that the popover listed but `auth.ts` was missing, any-password-works demo auth, reset/signed-out banners on sign-in

Verified live (dev server, port 3100) across all three workspace dashboards: shell renders correctly, palette search/Escape-close, task drawer, popovers all work. `tsc`, `eslint`, `next build` all clean.

**Remaining Step 2 foundations (not started yet):**
- Shared `statusChip()` helper — prototype has one function mapping ~45 status words to a consistent (tone, icon) pair, used everywhere. App currently has per-page ad-hoc `STATUS_TONE` maps (tone only, no icon, not guaranteed consistent).
- Shared `fpills()` helper — filter-pill row with counts. Currently hand-rolled on every page that has one (notifications, search, audit, organisations, etc.) — 4+ duplicates.
- `kTile` — headline KPI tile with delta chip + drill-into-drawer. No equivalent; dashboards use bespoke `.kpi` divs.
- `chCard` — chart wrapper with "View as table" toggle. No equivalent anywhere.
- Chart kit: `chBars`/`chColumns` (bar/histogram), `chStack` (stacked bar), `chFunnel`, `chHeat` (heatmap), `chDots` (before/after dot plot) — only `chLine` exists today in `src/lib/charts.ts`.
- Settings shell (`settingsShell`/`SETTINGS_NAV`) — deferred until P2's Settings screens are actually built (no point building the shell with nothing to put in it yet).
- Sidebar brand block: prototype shows tenant logo+name+"Supervision workspace"/"Supervised by NITDA" subtitle + a collapse/rail toggle (`[` key). App still shows the SuperAtlas logo instead. Lower priority — cosmetic, not blocking page builds.
- Per-page breadcrumbs: `AppShell`'s `crumbs` prop exists and works (tested), but no page passes it yet — each phase's screens need to pass their own `crumbs` as they're built.
- Toast: prototype auto-dismisses at 4200ms with an explicit × button; app dismisses at 3500ms with no × button.
- Dialog: still missing auto-focus-of-first-field on open (prototype's `openDialog` does this). Low priority, deferred.

**Not started:** Step 3, all 10 phases, 0/144 checkboxes ticked in `docs/prototype/PARITY_INVENTORY.md`.

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

The 10 biggest gaps are listed in `docs/PARITY_AUDIT.md` lines 25-40 — worth re-reading before picking a phase, since several gaps span phases (e.g. the whole Settings section is both a P2 item and a dependency for P9's `settings/compliance`/`settings/actions`).

## Exact next step

Continue Step 2: build `statusChip`, `fpills`, `kTile`, `chCard`, and the missing chart-kit functions (`chBars`, `chStack`, `chFunnel`, `chHeat`, `chDots`) in `src/lib/charts.ts` / `src/components/ui.tsx`, porting from `docs/prototype/source/core.js` and `c0.js`. Verify each against the prototype's rendering before moving to Step 3, P1.

## How to resume cleanly

1. `git status`, `git log --oneline -10`, `git log origin/staging..staging` — check for anything uncommitted or unpushed.
2. Re-read this file, then `docs/PARITY_AUDIT.md`'s "10 biggest gaps" and the phase table above.
3. Dev server: `npm run dev -- -p 3100` (background). Demo sign-in: `/signin` → "Demo access" popover, or set `localStorage.setItem("superatlas.session", "<email>")` directly for the account in `src/lib/auth.ts` and navigate straight to a workspace route.
4. Before any destructive git command, `git status` first.
5. Commit message convention for phase work: `ui-parity: P<n> <name>`. Push to `staging` only (never `main` directly — this repo's standing rule is `main` must never be ahead of `staging`).
6. If a `git push` fails with `HTTP 400` / `unexpected disconnect while reading sideband packet` on this machine, it's an HTTP/2 negotiation quirk with this network, not a real error — retry with `git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin staging` (one-off flags, nothing persisted to git config).
