"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tabs, Button, Tile } from "@/components/ui";
import { allFindings, fdOverdue, effDue, progOf, fcOf, fmtD, FD_STATUS_CHIP, TODAY, type FindingWithCase } from "@/lib/cases";
import { ORGANISATIONS, catLabel } from "@/lib/mockData";

const FIRM_ID = "deloitte";

type Tab = "verify" | "open" | "done";

function FdDue({ x }: { x: FindingWithCase }) {
  const due = effDue(x.f);
  if (!due) return <span className="cap muted">No deadline</span>;
  const n = Math.round((new Date(`${due}T12:00:00`).getTime() - new Date(`${TODAY}T12:00:00`).getTime()) / 864e5);
  const live = ["Open", "In progress"].includes(x.f.status ?? "");
  return (
    <>
      {fmtD(due)}{x.f.ext?.status === "Approved" ? <span className="cap muted"> (extended)</span> : null}
      {live ? <div className="cap" style={{ color: n < 0 ? "var(--bad-fg)" : n <= 14 ? "var(--warn-fg)" : "var(--text-3)" }}>{n < 0 ? `${-n} days overdue` : n === 0 ? "Due today" : `${n} days left`}</div> : null}
    </>
  );
}

function FdChips({ x }: { x: FindingWithCase }) {
  const s = FD_STATUS_CHIP[x.f.status ?? ""];
  return (
    <div className="row wrap gap6">
      <Chip tone={s?.tone ?? "neu"} icon={s?.icon}>{s?.label ?? x.f.status}</Chip>
      {fdOverdue(x.f, TODAY) ? <Chip tone="bad" icon="warning">Overdue</Chip> : null}
    </div>
  );
}

export default function FirmFindingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("verify");

  const mine = allFindings().filter((x) => x.c.firm === FIRM_ID);
  const sets: Record<Tab, FindingWithCase[]> = {
    verify: mine.filter((x) => x.f.status === "Fix submitted"),
    open: mine.filter((x) => ["Open", "In progress"].includes(x.f.status ?? "")),
    done: mine.filter((x) => ["Verified fixed", "Closed", "Noted"].includes(x.f.status ?? "")),
  };
  const rows = sets[tab];

  return (
    <AppShell workspace="firm">
      <PageHead title="Findings" sub="Findings you raised in published reports. When an organisation submits a fix, check the proof and verify it." />
      <Tabs
        items={[
          { id: "verify", label: "Fixes to verify", count: sets.verify.length },
          { id: "open", label: "Being fixed", count: sets.open.length },
          { id: "done", label: "Verified and closed", count: sets.done.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="card p0" style={{ marginTop: 16 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Finding</th><th>Organisation</th><th>From</th><th>Fix by</th><th>Status</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((x) => {
                  const o = ORGANISATIONS.find((y) => y.id === x.c.org);
                  const fc = fcOf(x.f.cls);
                  return (
                    <tr key={x.f.id} className="click" onClick={() => router.push(`/firm/findings/${x.f.id}`)} data-test={`fd-${x.f.id}`}>
                      <td className="wrap" style={{ minWidth: 300, maxWidth: 420 }}>
                        <div className="row gap8 top"><span className={`chip ${fc.tone}`} title={fc.name}>{x.f.cls}</span><div><div className="strong small">{x.f.title}</div><div className="cap mono muted">{x.f.ref}</div></div></div>
                      </td>
                      <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                      <td className="small">{progOf(x.c.prog).name}</td>
                      <td className="small"><FdDue x={x} /></td>
                      <td><FdChips x={x} /></td>
                      <td className="act-col" onClick={(e) => e.stopPropagation()}>
                        {x.f.status === "Fix submitted" ? <Button size="sm" onClick={() => router.push(`/firm/findings/${x.f.id}`)}>Verify</Button> : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="flag" size="lg" /><div className="h4">{tab === "verify" ? "No fixes waiting" : "Nothing here"}</div><p className="muted small">{tab === "verify" ? "You are told when an organisation submits a fix." : ""}</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
