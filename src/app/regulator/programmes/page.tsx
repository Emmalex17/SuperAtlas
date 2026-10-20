"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { SERIES, PROG_STATUSES, currentCycle, cyclesOf, regOfProg, scopeOrgs, progStats, fmtD, type Programme } from "@/lib/cases";
import { TENANT } from "@/lib/mockData";

const PROG_STATUS_TONE: Record<string, "ok" | "warn" | "neu" | "info"> = { Open: "ok", "In review": "info", Closed: "neu", Draft: "neu", Scheduled: "warn" };

export default function ProgrammesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | Programme["status"]>("All");

  const ser = SERIES.map((sr) => ({ sr, cur: currentCycle(sr.id), n: cyclesOf(sr.id).length })).filter((x): x is { sr: typeof x.sr; cur: Programme; n: number } => !!x.cur);
  const rows = ser.filter((x) => (status === "All" || x.cur.status === status) && (!q || (x.sr.name + x.cur.name + x.cur.reg).toLowerCase().includes(q.toLowerCase())));
  const countFor = (s: string) => ser.filter((x) => x.cur.status === s).length;

  return (
    <AppShell workspace="regulator">
      <PageHead
        over="NITDA"
        title="Programmes"
        sub="Assessment programmes and their yearly cycles: which regulation, which organisations, by when, and who assesses them."
        actions={<Button icon="plus">New programme</Button>}
      />

      <div className="card p0">
        <div className="tbl-tools">
          <div className="inp-wrap" style={{ width: 280 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search programmes" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="grow" />
        </div>
        <div className="tbl-sub">
          <div className="pills">
            <button className={`pill ${status === "All" ? "on" : ""}`} onClick={() => setStatus("All")}>All<span className="count">{ser.length}</span></button>
            {PROG_STATUSES.map((s) => (
              <button key={s} className={`pill ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>{s}<span className="count">{countFor(s)}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Current cycle</th>
                <th>Window</th>
                <th className="num">Organisations</th>
                <th>Submitted</th>
                <th>Status</th>
                <th className="act-col" />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map(({ sr, cur: p, n }) => {
                  const s = progStats(p);
                  const reg = regOfProg(p);
                  const notOpenYet = p.status === "Draft" || p.status === "Scheduled";
                  return (
                    <tr key={p.id} className="click" onClick={() => router.push(`/regulator/programmes/${p.id}`)}>
                      <td>
                        <div className="row gap8">
                          <Tile icon="calendar-check" size="sm" />
                          <div>
                            <div className="strong">{sr.name}</div>
                            <div className="cap muted">{reg.ref} {p.ver} · {sr.freq} · {n} cycle{n === 1 ? "" : "s"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="small">
                        <b>{p.cycle}</b>
                        <div className="cap muted">{p.firmMode === "organisation" ? "organisations choose firms" : `${TENANT.short} assigns firms`}</div>
                      </td>
                      <td className="small">{fmtD(p.opens)} – {fmtD(p.closes)}</td>
                      <td className="num tnum">{notOpenYet ? scopeOrgs(p).length : s.n}</td>
                      <td>
                        {notOpenYet ? (
                          <span className="cap muted">Not open yet</span>
                        ) : (
                          <div className="pbar">
                            <div className="bar"><i style={{ width: `${s.pct}%` }} /></div>
                            <span className="cap tnum">{s.done}/{s.n}</span>
                          </div>
                        )}
                      </td>
                      <td><Chip tone={PROG_STATUS_TONE[p.status] ?? "neu"}>{p.status}</Chip></td>
                      <td className="act-col">{p.status === "Draft" ? <Button variant="secondary" size="sm">Continue setup</Button> : null}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon="calendar-check" size="lg" />
                      <div className="h4">No programmes match</div>
                      <p className="muted small">Change the filter, or start a new programme.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{rows.length} of {ser.length} programmes</div>
      </div>
    </AppShell>
  );
}
