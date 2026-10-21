# Prompt: rebuild the SuperAtlas UI to match the approved prototype, screen by screen

Paste everything below the line into Claude Code, after the parity kit has been committed to the repository.

---

## Standing rule: deployment identity and promotion (read before committing anything)

This repository and its Vercel project belong to GitHub account **Emmalex17**. Vercel blocks any deployment whose commit author it can't match to the project owner/team, so:

- At the start of every session, check `git config user.name` and `git config user.email` match the Emmalex17 identity before committing anything.
- Every commit must be authored as Emmalex17, with **no `Co-authored-by` lines**.
- After every screen, fix, or phase: commit as Emmalex17 → push to `staging` → confirm the staging Vercel deployment succeeds (not "Blocked", not failed) → promote to `main` through a pull request from `staging` into `main` (a merge commit is expected and fine) → confirm the production deployment succeeds → confirm `main` and `staging` are in sync (`git diff origin/staging origin/main --stat` is empty — the commit hashes themselves will usually differ once a merge commit has been used, which is expected) and record both hashes in `docs/PROGRESS.md`.
- **Never** commit directly to `main`, **never** force-push, **never** promote `staging` → `main` while a check is red.

---

You are working in the SuperAtlas Next.js + TypeScript repository. Your job is to make the app match the approved clickable prototype exactly, page by page, with no outliers. Until now the app has drifted from the prototype. From this point on, the prototype is the specification, and "close enough" is not done.

## The source of truth (all in the repository)

| Path | What it is |
| --- | --- |
| `docs/prototype/superatlas-prototype.html` | The approved prototype, version 22. Open it in a browser and click through it. On the sign-in page, the small grey "Demo access" link lists accounts for the regulator (NITDA), organisations (Zenith, Moniepoint, OPay) and the firm (Deloitte). |
| `docs/prototype/source/` | The prototype's source code: `styles.css` (every colour, size, spacing and component style) and one JS file per area. Each screen is defined by `screen('<route>', { render() { ... } })`. When you need the exact words, layout or behaviour of a screen, read its `render()` and its `ACT.*` handlers here. |
| `docs/prototype/PARITY_INVENTORY.md` | The checklist: all 80 screens grouped in 10 phases, each with workspace, breadcrumb, headings, tabs, table columns, filter pills, fields, buttons and a reference screenshot for the screen and for each tab. |
| `docs/prototype/inventory.json` | The same inventory as data, for automated comparison. |
| `docs/prototype/screens/` | 144 reference screenshots at 1440 px wide, one per screen and per tab state. |
| `docs/prototype/data/prototype-seed.json` | The prototype's full dataset, used for a mock data layer until the back end provides each part. |
| `docs/BACKEND_SPEC.md` | The back-end contract another agent (Codex) is building. Do not edit back-end paths (`supabase/`, `src/server/`, `src/app/api/`). |

## Rules that are not negotiable

1. **Copy, do not reinterpret.** Same words (character for character, sentence case, British spelling), same order of sections, same columns, same buttons, same empty states, same status names and colours, same density. Do not add features, rename things, merge screens, or "improve" the design. If you believe something in the prototype is wrong, finish the screen exactly as the prototype has it, and list your concern in `docs/PARITY_AUDIT.md` under "Questions". Do not change it yourself.
2. **Never guess.** If you are unsure what a screen does, open the prototype and click it, then read its source in `docs/prototype/source/`. Every button in the prototype does something; yours must do the same thing (navigate, open a drawer or dialog, show a toast, change a state).
3. **Every state, not only the default.** Each tab, filter, empty state, error message, dialog, drawer, toast, loading placeholder and each workspace's version of a shared screen must be built.
4. **The only deliberate differences** (agreed with the product owner):
    - "Register your organisation" on sign-in and the firm's "Apply for accreditation": keep the screens in code, but remove every link to them.
    - Authenticator-app setup (`mfa-setup`): keep the screen, but do not link it. The sign-in code arrives by email.
    - Demo data must show a "Demo data" banner. Real dates replace the prototype's fixed 19 Oct 2026.
    - The favicon and app icons must be added.
5. **Data.** Build every screen against a typed data layer in `src/lib/data/` with one interface per area. Until the back end ships an area (see `docs/CHANGELOG.md` and `src/contracts/`), implement it with a mock adapter that reads `docs/prototype/data/prototype-seed.json` and applies the same calculations as the prototype source (for example `compStatus`, `watchlist` and `caseScore`). Switch an area to the real server actions when Codex announces them. A screen must never be left unbuilt because the back end is not ready.
6. **No placeholders.** No "Coming soon", no TODO screens, no dead buttons. A screen is either matching the prototype or not done.
7. **Evidence, not claims.** You may tick a screen only after showing that it matches (see "How to verify").

## Step 1: audit first (no feature code in this step)

1. Read `PARITY_INVENTORY.md` fully and open the prototype.
2. For the app shell, check: the sidebar for each workspace (sections, labels, order, counts), the top bar (search with Ctrl/⌘K, tasks button with count, bell, user menu), the breadcrumb, the "My dashboard" naming, design tokens (colours, fonts Inter, Source Serif 4 and JetBrains Mono, sizes, radii, spacing, minimum 12px text), and the shared components (buttons, chips, pills, tabs, tables, cards, KPI tiles, charts, drawers, dialogs, toasts, empty states).
3. For each of the 80 screens and each tab state, record in `docs/PARITY_AUDIT.md` one row: route, app path, status (Missing, Different, Matches) and the specific differences (wrong words, missing column, missing tab, different layout, dead button, missing state).
4. Commit the audit to `staging` and post a short summary to me: counts by status per phase, plus the 10 biggest gaps. Then continue straight to Step 2, unless something blocks you.

## Step 2: foundations

Before any page work, make the shell and the components match the prototype, because every page depends on them:

- Design tokens from `docs/prototype/source/styles.css` into the app's styling system (CSS variables or Tailwind theme), names kept.
- Fonts: Inter, Source Serif 4 and JetBrains Mono.
- Components that render like the prototype's helpers in `core.js` and `c0.js`: `btn`, `chip`/`statusChip`, `pill`/`fpills`, `tabs`/`routeTabs`, tables, `kTile`, `chCard` with "View as table", the chart kit (`chLine`, `chBars`, `chStack`, `chFunnel`, `chHeat`, `chDots`), drawer, dialog, toast, `empty`, `pageHead`, the settings shell.
- App shell per workspace: sidebar from `NAV` in `core.js` and `d1.js` (exact sections, labels, icons, counts), top bar, task panel, Ctrl/⌘K switcher, notifications, idle-timeout warning.

Verify the shell on three screens per workspace before moving on.

## Step 3: build phase by phase, P1 to P10

Follow the phases in `PARITY_INVENTORY.md` in order. For each phase:

1. For each screen in the phase: read its entry, its screenshot(s) and its source, then build or fix it until every listed heading, tab, column, pill, field and button is present with the same words. Build every tab state and every interaction too.
2. Verify it (below), then tick its box in `PARITY_INVENTORY.md` and set it to "Matches" in `PARITY_AUDIT.md`.
3. When every screen in the phase is ticked, run lint, type-check and tests. Commit with the message `ui-parity: P<n> <name>`, push to `staging`, and post me a phase report: the screens done, before and after screenshots of two key screens, and any open questions.
4. Continue to the next phase without waiting.

Phases: P1 Public site and sign-in · P2 Regulator setup, settings and account · P3 Organisations and assurance firms · P4 Requirements library · P5 Programmes and engagements · P6 Answering and assessment · P7 Review, publishing and findings · P8 Data returns · P9 Compliance and enforcement · P10 Dashboards, search and cross-cutting.

## How to verify each screen

- **Text parity:** run `tools/parity/extract.cjs` against the app route. It collects the same fields as `inventory.json`: headings, tabs, table headers, pills, fields, buttons. Diff the result against the prototype entry. Every prototype item must be present. Extra items are allowed only if they are in the agreed differences.
- **Visual parity:** screenshot the app screen at 1440 px and put it next to the reference screenshot. Layout, order, spacing, colours and density must match. Then check 1000 px and 390 px. There must be no sideways scrolling, and on phones tables become cards as in the prototype.
- **Behaviour parity:** click every button and tab on the screen in both the app and the prototype. Each must lead to the same place or state.
- **Journeys:** `docs/prototype/tests/prototype-tests.cjs` holds the prototype's 219 automated checks. Port the checks for each phase to Playwright against the app, and keep them passing.

## Definition of done for the whole job

- All 80 screens and all tab states are ticked in `PARITY_INVENTORY.md` with evidence.
- `PARITY_AUDIT.md` shows zero "Missing" and zero "Different", and every agreed difference is listed.
- The ported journey tests pass at 1440, 1000 and 390 px.
- Everything is pushed to `staging` and deployed.

## How to report

Keep chat updates short. Post one message per phase, in this shape: "P<n> done: <x>/<y> screens match. Evidence: <files>. Open questions: <list or none>. Starting P<n+1>." If you are blocked, say exactly what blocks you and continue with the next screen you can do.
