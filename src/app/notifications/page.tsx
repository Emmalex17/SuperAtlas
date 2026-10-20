"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnyWorkspaceShell } from "@/components/AnyWorkspaceShell";
import { PageHead, Button, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { getSession } from "@/lib/auth";
import { NOTIFICATIONS, type Notification } from "@/lib/mockData";

const KINDS = ["All", "Unread", "Approvals", "Mentions", "Reminders", "Updates"] as const;

export default function NotificationsPage() {
  const router = useRouter();
  const session = getSession();
  const workspace = session?.workspace;
  const [filter, setFilter] = useState<(typeof KINDS)[number]>("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const mine = NOTIFICATIONS.filter((n) => n.workspace === workspace).map((n) => ({ ...n, unread: n.unread && !readIds.has(n.id) }));
  const list = mine.filter((n) => (filter === "All" ? true : filter === "Unread" ? n.unread : n.kind === filter));

  function open(n: Notification) {
    setReadIds((prev) => new Set(prev).add(n.id));
    router.push(n.href);
  }

  return (
    <AnyWorkspaceShell>
      <PageHead
        over="Inbox"
        title="Notifications"
        sub="Everything that needs your attention, newest first. Email digests follow your preferences in My account."
        actions={
          <>
            <Button variant="secondary" icon="check" onClick={() => setReadIds(new Set(mine.map((n) => n.id)))}>Mark all as read</Button>
            <Button variant="outline" icon="gear-six" onClick={() => router.push("/account")}>Preferences</Button>
          </>
        }
      />
      <div className="pills">
        {KINDS.map((k) => {
          const c = k === "All" ? mine.length : k === "Unread" ? mine.filter((n) => n.unread).length : mine.filter((n) => n.kind === k).length;
          return (
            <button key={k} className={`pill ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {k}
              <span className="count">{c}</span>
            </button>
          );
        })}
      </div>
      <div className="card p0">
        {list.length ? (
          list.map((n) => (
            <button
              key={n.id}
              className="row"
              style={{ width: "100%", border: 0, background: n.unread ? "var(--brand-50)" : "transparent", padding: "16px 24px", borderTop: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}
              onClick={() => open(n)}
            >
              <Tile icon={n.icon} tone={n.tone} />
              <div className="grow">
                <div className={n.unread ? "semi" : ""}>{n.title}</div>
                <div className="cap muted" style={{ marginTop: 2 }}>{n.when} · {n.kind}</div>
              </div>
              {n.unread ? <span className="dot" style={{ background: "var(--brand-500)" }} /> : null}
              <Icon name="caret-right" />
            </button>
          ))
        ) : (
          <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
            <Tile icon="tray" size="lg" />
            <div className="h4">Nothing here</div>
            <p className="muted small">No notifications match this filter.</p>
          </div>
        )}
      </div>
    </AnyWorkspaceShell>
  );
}
