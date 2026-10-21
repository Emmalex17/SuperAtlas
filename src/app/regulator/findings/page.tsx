"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Button, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { allFindings, fdCardsWithOverdue, fdOverdue, effDue, progOf, fcOf, fdLog, FD_STATUS_CHIP, FINDING_CLASSES, TODAY, type FindingWithCase } from "@/lib/cases";
import { ORGANISATIONS, FIRMS, catLabel } from "@/lib/mockData";

function fdDue(x: FindingWithCase): React.ReactNode {
  const due = effDue(x.f);
  if (!due) return <span className="cap muted">No deadline</span>;
  const n = Math.round((new Date(due + "T12:00:00").getTime() - new Date(TODAY + "T12:00:00").getTime()) / 864e5);
  const live = ["Open", "In progress"].includes(x.f.status ?? "");
  return (
    <>
      {due}{x.f.ext?.status === "Approved" ? <span className="cap muted"> (extended)</span> : null}
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
      {x.f.ext?.status === "Requested" ? <Chip tone="warn" icon="clock-clockwise">More time asked</Chip> : null}
    </div>
  );
}

export default function FindingsPage() {
  const router = useRouter();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [fk, setFk] = useState("");
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  const all = allFindings();
  const cards = fdCardsWithOverdue(TODAY);
  const rows = all
    .filter((x) => (!fk || cards.find((c) => c[0] === fk)![3](x)) && (cls === "all" || x.f.cls === cls) && (showClosed || fk || !["Closed", "Noted"].includes(x.f.status ?? "")) && (!q || (ORGANISATIONS.find((o) => o.id === x.c.org)?.name ?? "" + x.f.title).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Number(fdOverdue(b.f, TODAY)) - Number(fdOverdue(a.f, TODAY)) || ["MaNC", "MiNC", "OBS", "OFI"].indexOf(a.f.cls) - ["MaNC", "MiNC", "OBS", "OFI"].indexOf(b.f.cls) || String(effDue(a.f)).localeCompare(String(effDue(b.f))));

  function remind(x: FindingWithCase) {
    fdLog(x.f, "Reminder sent", "M. Bello", TODAY);
    bump();
  }

  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Findings" sub="Every finding from published reports, and how each fix is going. Firms verify fixes; you close them." actions={<Button variant="secondary" icon="export">Export</Button>} />
      <div className="card p0">
        <div className="tbl-tools wrap">
          <div className="inp-wrap" style={{ width: 260 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search findings or organisations" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="sel" style={{ width: "auto" }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">
            <option value="all">All classes</option>
            {FINDING_CLASSES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
          </select>
          <span className="grow" />
          {!fk ? (
            <label className="check">
              <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
              <span className="small">Show closed and noted</span>
            </label>
          ) : null}
        </div>
        <div className="tbl-sub">
          <div className="pills">
            <button className={`pill ${!fk ? "on" : ""}`} onClick={() => setFk("")}>All open<span className="count">{all.filter((x) => !["Closed", "Noted"].includes(x.f.status ?? "")).length}</span></button>
            {cards.map(([k, l, , fn]) => (
              <button key={k} className={`pill ${fk === k ? "on" : ""}`} onClick={() => setFk(k)} data-test={`fc-${k}`}>{l}<span className="count">{all.filter(fn).length}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Finding</th><th>Organisation</th><th>From</th><th>Fix by</th><th>Status</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((x) => {
                  const o = ORGANISATIONS.find((y) => y.id === x.c.org);
                  const fm = FIRMS.find((y) => y.id === x.c.firm);
                  const fc = fcOf(x.f.cls);
                  return (
                    <tr key={x.f.id} className="click" onClick={() => router.push(`/regulator/findings/${x.f.id}`)} data-test={`fd-${x.f.id}`}>
                      <td className="wrap" style={{ minWidth: 300, maxWidth: 420 }}>
                        <div className="row gap8 top"><span className={`chip ${fc.tone}`} title={fc.name}>{x.f.cls}</span><div><div className="strong small">{x.f.title}</div><div className="cap mono muted">{x.f.ref}</div></div></div>
                      </td>
                      <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                      <td className="small">{progOf(x.c.prog).name}<div className="cap muted">{fm?.name ?? ""}</div></td>
                      <td className="small">{fdDue(x)}</td>
                      <td><FdChips x={x} /></td>
                      <td className="act-col" onClick={(e) => e.stopPropagation()}>
                        {x.f.status === "Verified fixed" ? (
                          <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/findings/${x.f.id}`)}>Close</Button>
                        ) : x.f.ext?.status === "Requested" ? (
                          <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/findings/${x.f.id}`)}>Decide</Button>
                        ) : fdOverdue(x.f, TODAY) ? (
                          <Button variant="tertiary" size="sm" icon="bell-ringing" onClick={() => remind(x)}>Remind</Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="flag" size="lg" /><div className="h4">No findings here</div><p className="muted small">Change the filter to see more.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{rows.length} finding{rows.length === 1 ? "" : "s"}</div>
      </div>
    </AppShell>
  );
}
