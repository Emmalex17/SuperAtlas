"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lockup } from "@/components/ui";
import { Icon, type IconName } from "@/lib/icons";
import { getSession, signOut, type Workspace } from "@/lib/auth";

function subscribeNoop() {
  return () => {};
}
function getServerSnapshot() {
  return null;
}

type NavItem = { icon: IconName; label: string };

const NAV: Record<Workspace, NavItem[]> = {
  regulator: [
    { icon: "squares-four", label: "Dashboard" },
    { icon: "buildings", label: "Organisations" },
    { icon: "briefcase", label: "Assurance firms" },
    { icon: "scroll", label: "Requirements library" },
    { icon: "list-checks", label: "Programmes" },
  ],
  organisation: [
    { icon: "squares-four", label: "Dashboard" },
    { icon: "list-checks", label: "Obligations" },
    { icon: "files", label: "Evidence" },
    { icon: "certificate", label: "Findings" },
  ],
  firm: [
    { icon: "squares-four", label: "Dashboard" },
    { icon: "handshake", label: "Engagements" },
    { icon: "list-checks", label: "Assessments" },
  ],
};

export function AppShell({ workspace, children }: { workspace: Workspace; children: ReactNode }) {
  const router = useRouter();
  const account = useSyncExternalStore(subscribeNoop, getSession, getServerSnapshot);

  useEffect(() => {
    if (!account || account.workspace !== workspace) {
      router.replace("/signin");
    }
  }, [account, workspace, router]);

  if (!account || account.workspace !== workspace) return null;

  const nav = NAV[workspace];

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
        {nav.map((item, i) => (
          <button key={item.label} className={`nav ${i === 0 ? "on" : ""}`} type="button">
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
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
          <button className="user" type="button">
            <span className="av s24">{account.initials}</span>
            <div>
              <b>{account.name}</b>
              <span>{account.role}</span>
            </div>
          </button>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
