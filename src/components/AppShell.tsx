"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lockup } from "@/components/ui";
import { Icon, type IconName } from "@/lib/icons";
import { getSession, signOut, type Account, type Workspace } from "@/lib/auth";
import { NOTIFICATIONS } from "@/lib/mockData";

type NavItem = { icon: IconName; label: string; href: string };

const NAV: Record<Workspace, NavItem[]> = {
  regulator: [
    { icon: "squares-four", label: "Dashboard", href: "/regulator" },
    { icon: "buildings", label: "Organisations", href: "/regulator/organisations" },
    { icon: "briefcase", label: "Assurance firms", href: "/regulator/firms" },
    { icon: "gavel", label: "Enforcement", href: "/regulator/enforcement" },
    { icon: "book-open-text", label: "Requirements library", href: "/regulator/library" },
    { icon: "calendar-check", label: "Programmes", href: "/regulator/programmes" },
    { icon: "stamp", label: "Reviews & publishing", href: "/regulator/reviews" },
    { icon: "flag", label: "Findings", href: "/regulator/findings" },
    { icon: "table", label: "Data returns", href: "/regulator/returns" },
    { icon: "users", label: "Team", href: "/regulator/team" },
    { icon: "identification-card", label: "Profile", href: "/regulator/profile" },
  ],
  organisation: [
    { icon: "squares-four", label: "Dashboard", href: "/organisation" },
    { icon: "list-checks", label: "Obligations", href: "/organisation/obligations" },
    { icon: "table", label: "Data returns", href: "/organisation/returns" },
    { icon: "flag", label: "Findings", href: "/organisation/findings" },
    { icon: "gavel", label: "Regulatory actions", href: "/organisation/actions" },
    { icon: "files", label: "Evidence", href: "/organisation/evidence" },
  ],
  firm: [
    { icon: "squares-four", label: "Dashboard", href: "/firm" },
    { icon: "handshake", label: "Engagements", href: "/firm/engagements" },
    { icon: "list-checks", label: "Assessments", href: "/firm/assessments" },
  ],
};

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

export function AppShell({ workspace, children }: { workspace: Workspace; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { checked, account } = useSessionOnMount();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (checked && (!account || account.workspace !== workspace)) {
      router.replace("/signin");
    }
  }, [checked, account, workspace, router]);

  if (!checked || !account || account.workspace !== workspace) return null;

  const nav = NAV[workspace];
  const unreadCount = NOTIFICATIONS.filter((n) => n.workspace === workspace && n.unread).length;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="app">
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
        {nav.map((item) => {
          const active = item.href === `/${workspace}` ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav ${active ? "on" : ""}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="sb-foot">
          <button
            className="nav"
            type="button"
            onClick={() => {
              signOut();
              router.push("/signin");
            }}
          >
            <Icon name="sign-out" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="crumbs grow">
            <b>{account.entityName}</b>
          </div>
          <form className="search" role="search" onSubmit={submitSearch}>
            <Icon name="magnifying-glass" />
            <input
              placeholder={workspace === "regulator" ? "Search organisations, firms, requirements" : "Search requirements, people"}
              aria-label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <Link href="/notifications" className="icon-btn" aria-label="Notifications" style={{ position: "relative" }}>
            <Icon name="bell" />
            {unreadCount ? <span className="bell-dot" /> : null}
          </Link>
          <Link href="/account" className="user">
            <span className="av s24">{account.initials}</span>
            <div>
              <b>{account.name}</b>
              <span>{account.role}</span>
            </div>
          </Link>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
