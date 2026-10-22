"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lockup, LogoMark, Button, Tile } from "@/components/ui";
import { Dialog, Drawer, Popover } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon, type IconName } from "@/lib/icons";
import { getSession, signOut, type Account, type Workspace } from "@/lib/auth";
import { polishDom } from "@/lib/polishDom";
import { NOTIFICATIONS } from "@/lib/mockData";
import { myTasks, taskTotal, dueText } from "@/lib/tasks";
import { searchIndex, searchRun } from "@/lib/search";
import { orgIdFor, firmIdFor } from "@/lib/mockData";
import { CASES, allFindings } from "@/lib/cases";
import { ENF_CASES } from "@/lib/enforcement";
import { FILINGS } from "@/lib/returns";
import { CLASS_REQS, ACC_APPS } from "@/lib/mockData";

type NavItem = { icon: IconName; label: string; href: string; section?: string; count?: number };

/** Flags the first item of each section run, so the sidebar can render a divider before it. */
function withSectionBreaks(nav: NavItem[]): { item: NavItem; showSection: boolean }[] {
  let lastSection = "";
  return nav.map((item) => {
    const showSection = Boolean(item.section && item.section !== lastSection);
    if (showSection) lastSection = item.section!;
    return { item, showSection };
  });
}

/** Flags the first result of each group run, so the command palette can render a group header above it. */
function withGroupHeaders<T extends { group: string }>(rows: T[]): { row: T; showHeader: boolean }[] {
  let lastGroup = "";
  return rows.map((row) => {
    const showHeader = row.group !== lastGroup;
    lastGroup = row.group;
    return { row, showHeader };
  });
}

function regulatorCount(key: "organisations" | "firms" | "enforcement" | "reviews" | "findings" | "returns"): number {
  switch (key) {
    case "organisations":
      return CLASS_REQS.filter((r) => r.status === "Pending").length;
    case "firms":
      return ACC_APPS.filter((a) => a.status === "In review").length;
    case "enforcement":
      return ENF_CASES.filter((c) => ["Awaiting sign-off", "Response received"].includes(c.status)).length;
    case "reviews":
      return CASES.filter((c) => c.stage === "Report submitted").length;
    case "findings":
      return allFindings().filter((x) => x.f.status === "Verified fixed" || (x.f.ext && x.f.ext.status === "Requested")).length;
    case "returns":
      return FILINGS.filter((f) => ["Submitted", "Resubmitted"].includes(f.status)).length;
  }
}

function buildNav(account: Account): NavItem[] {
  const ws = account.workspace;
  if (ws === "regulator") {
    return [
      { icon: "squares-four", label: "Dashboard", href: "/regulator" },
      { icon: "buildings", label: "Organisations", href: "/regulator/organisations", section: "Supervise", count: regulatorCount("organisations") },
      { icon: "briefcase", label: "Assurance firms", href: "/regulator/firms", count: regulatorCount("firms") },
      { icon: "gavel", label: "Enforcement", href: "/regulator/enforcement", count: regulatorCount("enforcement") },
      { icon: "book-open-text", label: "Requirements library", href: "/regulator/library", section: "Assess" },
      { icon: "calendar-check", label: "Programmes", href: "/regulator/programmes" },
      { icon: "stamp", label: "Reviews & publishing", href: "/regulator/reviews", count: regulatorCount("reviews") },
      { icon: "flag", label: "Findings", href: "/regulator/findings", count: regulatorCount("findings") },
      { icon: "table", label: "Data returns", href: "/regulator/returns", section: "Collect", count: regulatorCount("returns") },
    ];
  }
  if (ws === "organisation") {
    const orgId = orgIdFor(account.entityName);
    const obligationsCount = orgId ? CASES.filter((c) => c.org === orgId && ["Firm to choose", "In preview"].includes(c.stage)).length : 0;
    const returnsCount = orgId ? FILINGS.filter((f) => f.org === orgId && f.status === "Queried").length : 0;
    const findingsCount = orgId ? allFindings().filter((x) => x.c.org === orgId && x.f.status === "Open").length : 0;
    const complianceCount = orgId ? ENF_CASES.filter((c) => c.org === orgId && c.status === "Notice issued").length : 0;
    return [
      { icon: "squares-four", label: "Dashboard", href: "/organisation" },
      { icon: "shield-check", label: "Compliance", href: "/organisation/compliance", count: complianceCount },
      { icon: "list-checks", label: "Obligations", href: "/organisation/obligations", section: "Work", count: obligationsCount },
      { icon: "table", label: "Data returns", href: "/organisation/returns", count: returnsCount },
      { icon: "flag", label: "Findings", href: "/organisation/findings", count: findingsCount },
      { icon: "files", label: "Evidence library", href: "/organisation/evidence" },
      { icon: "users", label: "Team", href: "/organisation/team", section: "Organisation" },
      { icon: "identification-card", label: "Profile", href: "/organisation/profile" },
    ];
  }
  // firm
  const firmId = firmIdFor(account.entityName);
  const engagementsCount = firmId ? CASES.filter((c) => c.firm === firmId && (c.stage === "Firm to choose" || c.firmStatus === "Invited")).length : 0;
  const firmFindingsCount = firmId ? allFindings().filter((x) => x.c.firm === firmId && x.f.status === "Fix submitted").length : 0;
  return [
    { icon: "squares-four", label: "Dashboard", href: "/firm" },
    { icon: "handshake", label: "Engagements", href: "/firm/engagements", section: "Work", count: engagementsCount },
    { icon: "flag", label: "Findings", href: "/firm/findings", count: firmFindingsCount },
    { icon: "list-checks", label: "Assessments", href: "/firm/assessments" },
    { icon: "users", label: "Team", href: "/firm/team", section: "Firm" },
    { icon: "identification-card", label: "Profile", href: "/firm/profile" },
  ];
}

// Session lives in localStorage, which only exists on the client. We can't
// read it during the server-rendered pass, so the first client render must
// also render nothing (to match the server output and avoid a hydration
// mismatch) and only resolve the real session once, after mount.
function useSessionOnMount() {
  const [state, setState] = useState<{ checked: boolean; account: Account | null }>({ checked: false, account: null });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only store (localStorage) that cannot be observed during SSR; there is no external-store API that avoids this without reintroducing the same hydration race.
    setState({ checked: true, account: getSession() });
  }, []);
  return state;
}

const IDLE_MS = 15 * 60 * 1000;

export type Crumb = { label: string; href?: string };

export function AppShell({ workspace, crumbs, children }: { workspace: Workspace; crumbs?: Crumb[]; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { checked, account } = useSessionOnMount();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteSel, setPaletteSel] = useState(0);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [idleWarn, setIdleWarn] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(60);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Keeps "—" placeholders dressed as words everywhere in the app shell, matching the
  // prototype's polishDom() pass, which re-runs after every render/dialog/drawer open.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let pending = false;
    const run = () => {
      pending = false;
      polishDom(root);
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(run);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => observer.disconnect();
  }, [checked, account]);

  useEffect(() => {
    if (checked && (!account || account.workspace !== workspace)) {
      router.replace("/signin");
    }
  }, [checked, account, workspace, router]);

  // Ctrl/⌘K and "/" open the command palette from anywhere on an app screen; Escape closes it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName || "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 15-minute idle timeout, with a 60-second countdown warning — only while signed into an app screen.
  useEffect(() => {
    if (!account) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIdleSeconds(60);
        setIdleWarn(true);
      }, IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [account]);

  useEffect(() => {
    if (!idleWarn) return;
    const interval = setInterval(() => {
      setIdleSeconds((n) => {
        if (n <= 1) {
          clearInterval(interval);
          signOut();
          router.push("/signin");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [idleWarn, router]);

  if (!checked || !account || account.workspace !== workspace) return null;

  const nav = buildNav(account);
  const unreadNotifs = NOTIFICATIONS.filter((n) => n.workspace === workspace && n.unread);
  const tasks = myTasks(account);
  const totalTasks = taskTotal(account);
  const index = searchIndex(account, nav);
  const paletteResults = paletteQuery.trim() ? searchRun(index, paletteQuery, 9) : index.filter((h) => h.group === "Pages").slice(0, 8);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function openPalette() {
    setPaletteQuery("");
    setPaletteSel(0);
    setPaletteOpen(true);
  }

  function goPalette(href: string) {
    setPaletteOpen(false);
    router.push(href);
  }

  function onPaletteKey(e: React.KeyboardEvent) {
    const n = paletteResults.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPaletteSel((s) => (s + 1) % Math.max(n, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPaletteSel((s) => (s - 1 + n) % Math.max(n, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = paletteResults[paletteSel];
      if (hit) goPalette(hit.href);
      else if (paletteQuery.trim()) {
        setPaletteOpen(false);
        router.push(`/search?q=${encodeURIComponent(paletteQuery)}`);
      }
    }
  }

  function markAllRead() {
    NOTIFICATIONS.forEach((n) => {
      if (n.workspace === workspace) n.unread = false;
    });
    bump();
    toast("All notifications marked as read");
  }

  return (
    <div className="app" ref={rootRef}>
      <aside className="sb">
        <div className="sb-brand">
          <Lockup dark size={24} />
        </div>
        <div className="sb-org">
          <span className="av s24">{account.initials}</span>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="small strong" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {account.entityName}
            </div>
          </div>
        </div>
        {withSectionBreaks(nav).map(({ item, showSection }) => {
          const active =
            item.href === `/${workspace}`
              ? pathname === item.href
              : item.href === "/organisation/compliance"
                ? ["/organisation/compliance", "/organisation/exposure", "/organisation/actions"].some((p) => pathname.startsWith(p))
                : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {showSection ? <div className="sb-sec">{item.section}</div> : null}
              <Link key={item.href} href={item.href} className={`nav ${active ? "on" : ""} ${item.count ? "has-count" : ""}`} title={item.count ? `${item.label}: ${item.count} waiting for you` : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.count ? <span className="count">{item.count}</span> : null}
              </Link>
            </div>
          );
        })}
        <div className="sb-bottom">
          <button className="nav" type="button" onClick={() => setHelpOpen(true)}>
            <Icon name="question" />
            <span>Help</span>
          </button>
          {workspace === "regulator" ? (
            <Link
              href="/regulator/settings/categories"
              className={`nav ${
                pathname.startsWith("/regulator/settings") || pathname === "/regulator/profile" || pathname.startsWith("/regulator/profile/") || pathname === "/regulator/team" ? "on" : ""
              }`}
            >
              <Icon name="gear-six" />
              <span>Settings</span>
            </Link>
          ) : null}
          <div className="sb-foot">
            <LogoMark size={16} variant="white" />
            <span>Powered by SuperAtlas</span>
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <nav className="crumbs grow" aria-label="Breadcrumb">
            {crumbs && crumbs.length ? (
              crumbs.map((c, i) => (
                <span key={i}>
                  {i > 0 ? <Icon name="caret-right" /> : null}
                  {i < crumbs.length - 1 && c.href ? <Link href={c.href}>{c.label}</Link> : i < crumbs.length - 1 ? <span>{c.label}</span> : <b>{c.label}</b>}
                </span>
              ))
            ) : (
              <b>{account.entityName}</b>
            )}
          </nav>
          <form
            className="search"
            role="search"
            onSubmit={submitSearch}
            onClick={(e) => {
              e.preventDefault();
              openPalette();
            }}
          >
            <Icon name="magnifying-glass" />
            <input placeholder="Search" aria-label="Search or jump to a page" value={query} onChange={(e) => setQuery(e.target.value)} readOnly data-test="top-search" />
            <kbd>{typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"}</kbd>
          </form>
          <button className="icon-btn tb-tasks" type="button" aria-label={`Tasks waiting for you${totalTasks ? `: ${totalTasks}` : ""}`} title="Waiting for you" onClick={() => setTasksOpen(true)}>
            <Icon name="check-square-offset" />
            {totalTasks ? <span className="tb-n tnum">{totalTasks > 99 ? "99+" : totalTasks}</span> : null}
          </button>
          <div style={{ position: "relative" }}>
            <button className="icon-btn" aria-label="Notifications" title="Notifications" style={{ position: "relative" }} onClick={() => setBellOpen((o) => !o)}>
              <Icon name="bell" />
              {unreadNotifs.length ? <span className="bell-dot" /> : null}
            </button>
            <Popover open={bellOpen} onClose={() => setBellOpen(false)} width={380}>
              <div className="row between" style={{ padding: "8px 10px" }}>
                <b>Notifications</b>
                <button className="link-btn small" type="button" onClick={markAllRead}>
                  Mark all read
                </button>
              </div>
              {NOTIFICATIONS.filter((n) => n.workspace === workspace)
                .slice(0, 5)
                .map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    className="menu-item"
                    style={{ alignItems: "flex-start" }}
                    onClick={() => {
                      n.unread = false;
                      setBellOpen(false);
                    }}
                  >
                    <Icon name={n.icon as IconName} />
                    <div className="grow">
                      <div className={`small ${n.unread ? "semi" : ""}`}>{n.title}</div>
                      <div className="cap muted">{n.when}</div>
                    </div>
                  </Link>
                ))}
              <hr className="sep" style={{ margin: "6px 0" }} />
              <Link href="/notifications" className="menu-item" onClick={() => setBellOpen(false)}>
                <Icon name="tray" />
                <span>View all notifications</span>
              </Link>
            </Popover>
          </div>
          <div style={{ position: "relative" }}>
            <button className="user" type="button" onClick={() => setUserOpen((o) => !o)}>
              <span className="av s24">{account.initials}</span>
              <div>
                <b>{account.name}</b>
                <span>{account.role}</span>
              </div>
              <Icon name="caret-down" />
            </button>
            <Popover open={userOpen} onClose={() => setUserOpen(false)} width={260}>
              <div className="row" style={{ padding: 10 }}>
                <span className="av s40">{account.initials}</span>
                <div>
                  <div className="semi">{account.name}</div>
                  <div className="cap muted">{account.email}</div>
                </div>
              </div>
              <hr className="sep" style={{ margin: "4px 0" }} />
              <Link href="/account" className="menu-item" onClick={() => setUserOpen(false)}>
                <Icon name="user-circle" />
                <span>My account</span>
              </Link>
              <Link href="/audit" className="menu-item" onClick={() => setUserOpen(false)}>
                <Icon name="clock-counter-clockwise" />
                <span>Audit trail</span>
              </Link>
              <hr className="sep" style={{ margin: "4px 0" }} />
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  signOut();
                  router.push("/signin");
                }}
              >
                <Icon name="sign-out" />
                <span>Sign out</span>
              </button>
            </Popover>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>

      {/* Command palette — Ctrl/⌘K or "/" */}
      <Dialog open={paletteOpen} onClose={() => setPaletteOpen(false)}>
        <div className="qs" role="combobox" aria-expanded="true" aria-controls="qs-res" aria-haspopup="listbox">
          <div className="qs-in">
            <Icon name="magnifying-glass" />
            <input
              autoFocus
              placeholder="Search or jump to a page"
              autoComplete="off"
              aria-label="Search or jump to a page"
              value={paletteQuery}
              onChange={(e) => {
                setPaletteQuery(e.target.value);
                setPaletteSel(0);
              }}
              onKeyDown={onPaletteKey}
            />
            <kbd>Esc</kbd>
          </div>
          <div className="qs-res" id="qs-res" role="listbox">
            {withGroupHeaders(paletteResults).map(({ row: hit, showHeader }, i) => (
              <div key={`${hit.group}-${hit.href}-${i}`}>
                {showHeader ? <div className="qs-g">{hit.group}</div> : null}
                <button type="button" role="option" aria-selected={i === paletteSel} className={`qs-row ${i === paletteSel ? "on" : ""}`} onClick={() => goPalette(hit.href)}>
                  <Icon name={hit.icon} />
                  <span className="grow ell">
                    <b>{hit.title}</b>
                    <span className="cap muted"> · {hit.sub}</span>
                  </span>
                  {i === paletteSel ? <kbd>Enter</kbd> : null}
                </button>
              </div>
            ))}
            {paletteQuery.trim() ? (
              <button
                type="button"
                className="qs-row qs-all"
                onClick={() => {
                  setPaletteOpen(false);
                  router.push(`/search?q=${encodeURIComponent(paletteQuery)}`);
                }}
              >
                <Icon name="magnifying-glass" />
                <span className="grow">See all results for &ldquo;{paletteQuery.trim()}&rdquo;</span>
              </button>
            ) : null}
            {paletteQuery.trim() && !paletteResults.length ? <div className="qs-empty">Nothing matches. Try a shorter word.</div> : null}
          </div>
          <div className="qs-foot">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> move
            </span>
            <span>
              <kbd>Enter</kbd> open
            </span>
            <span>
              <kbd>⌘</kbd>
              <kbd>K</kbd> open this anywhere
            </span>
          </div>
        </div>
      </Dialog>

      {/* Tasks waiting for you */}
      <Drawer open={tasksOpen} onClose={() => setTasksOpen(false)}>
        <div className="col gap16">
          <div className="row top">
            <div className="grow">
              <div className="overline">Waiting for you</div>
              <h2 className="h3" style={{ marginTop: 4 }}>
                {totalTasks ? `${totalTasks} task${totalTasks === 1 ? "" : "s"}` : "All clear"}
              </h2>
            </div>
            <button className="icon-btn" type="button" aria-label="Close" onClick={() => setTasksOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          {tasks.filter((g) => g.items.length).length ? (
            tasks
              .filter((g) => g.items.length)
              .map((g) => (
                <section key={g.id} className="tp-g">
                  <div className="row gap8">
                    <span className="tile brand sm">
                      <Icon name={g.icon as IconName} />
                    </span>
                    <b className="grow">{g.label}</b>
                    <span className="count">{g.items.length}</span>
                    <Link href={g.href} className="link small strong" onClick={() => setTasksOpen(false)}>
                      Open
                    </Link>
                  </div>
                  <div className="list">
                    {g.items.slice(0, 5).map((item, i) => {
                      const due = dueText(item.due);
                      return (
                        <Link key={i} href={item.href} className="list-row tp-row" onClick={() => setTasksOpen(false)}>
                          <span className="grow" style={{ minWidth: 0 }}>
                            <span className="strong small" style={{ display: "block" }}>
                              {item.title}
                            </span>
                            {item.sub || due ? (
                              <span className="cap muted">
                                {item.sub || ""}
                                {item.sub && due ? " · " : ""}
                                {due ? <span style={{ color: due.tone === "bad" ? "var(--bad-fg)" : due.tone === "warn" ? "var(--warn-fg)" : undefined }}>{due.text}</span> : null}
                              </span>
                            ) : null}
                          </span>
                          <Icon name="caret-right" />
                        </Link>
                      );
                    })}
                    {g.items.length > 5 ? (
                      <Link href={g.href} className="list-row small strong tp-more" onClick={() => setTasksOpen(false)}>
                        See all {g.items.length}
                      </Link>
                    ) : null}
                  </div>
                </section>
              ))
          ) : (
            <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
              <Tile icon="check-circle" size="lg" />
              <div className="h4">Nothing is waiting for you</div>
              <p className="muted small">New work appears here as soon as it arrives.</p>
            </div>
          )}
        </div>
      </Drawer>

      {/* Help */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)}>
        <div className="col gap16">
          <div className="row top">
            <div className="grow">
              <h2 className="h3">Help</h2>
              <p className="muted small">Guides and support for {account.entityName} on SuperAtlas</p>
            </div>
            <button className="icon-btn" type="button" aria-label="Close" onClick={() => setHelpOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          <div className="list">
            {([
              ["book-open-text", "Getting started guide", "How your workspace is organised"],
              ["play-circle", "Short videos", "Two-minute walkthroughs of common tasks"],
              ["chat-circle-dots", "Contact support", "support@superatlas.example · replies within one working day"],
            ] as [IconName, string, string][]).map(([icon, title, desc]) => (
              <button
                key={title}
                className="list-row"
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  toast(`Opening ${title.toLowerCase()}`);
                }}
              >
                <span className="tile sm">
                  <Icon name={icon} />
                </span>
                <span className="grow">
                  <span className="strong" style={{ display: "block" }}>
                    {title}
                  </span>
                  <span className="cap muted">{desc}</span>
                </span>
                <Icon name="caret-right" />
              </button>
            ))}
          </div>
        </div>
      </Dialog>

      {/* 15-minute idle warning */}
      <Dialog open={idleWarn} onClose={() => {}} sticky>
        <div className="col" style={{ alignItems: "center", textAlign: "center", gap: 14 }}>
          <span className="tile warn lg">
            <Icon name="hourglass" />
          </span>
          <h2 className="h2">Are you still there?</h2>
          <p className="muted">
            For security, you will be signed out in <b className="tnum" style={{ color: "var(--text)" }}>{idleSeconds}</b> seconds because you have been inactive. Unsaved changes will be lost.
          </p>
          <div className="bar" style={{ width: "100%" }}>
            <i style={{ width: `${(idleSeconds / 60) * 100}%`, background: "var(--warn-icon)" }} />
          </div>
          <div className="row" style={{ width: "100%" }}>
            <Button
              variant="outline"
              className="grow"
              onClick={() => {
                setIdleWarn(false);
                signOut();
                router.push("/signin");
              }}
            >
              Sign out now
            </Button>
            <Button
              className="grow"
              onClick={() => {
                setIdleWarn(false);
                toast("You are still signed in");
              }}
            >
              Stay signed in
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
