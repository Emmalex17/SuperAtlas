"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { SERIES, PROG_STATUSES, currentCycle, cyclesOf, regOfProg, scopeOrgs, progStats, fmtD, TODAY, type Programme } from "@/lib/cases";
import { TENANT } from "@/lib/mockData";

const PROG_STATUS_TONE: Record<string, "ok" | "warn" | "neu" | "info"> = { Open: "ok", "In review": "info", Closed: "neu", Draft: "neu", Scheduled: "warn" };

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function Calendar({ rows }: { rows: { sr: { name: string }; cur: Programme }[] }) {
  const router = useRouter();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [y, mo] = month.split("-").map(Number);
  const first = new Date(y, mo - 1, 1);
  const days = new Date(y, mo, 0).getDate();
  const lead = (first.getDay() + 6) % 7;

  const events: [string, string, string, "open" | "due", string][] = rows
    .filter((r) => r.cur.status !== "Draft")
    .flatMap((r) => [
      [r.cur.opens, "Opens", r.sr.name, "open", r.cur.id] as [string, string, string, "open" | "due", string],
      [r.cur.closes, "Due", r.sr.name, "due", r.cur.id] as [string, string, string, "open" | "due", string],
    ])
    .filter((e) => e[0] && e[0].startsWith(month));

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < lead; i++) cells.push(<div className="cal-d off" key={`off-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const ds = `${month}-${String(d).padStart(2, "0")}`;
    const es = events.filter((e) => e[0] === ds);
    cells.push(
      <div className={`cal-d ${ds === TODAY ? "today" : ""}`} key={ds}>
        <span className="cal-n">{d}</span>
        {es.map((e, i) => (
          <button key={i} className={`cal-e ${e[3]}`} title={`${e[1]}: ${e[2]}`} onClick={() => router.push(`/regulator/programmes/${e[4]}`)}>
            <b>{e[1]}</b> {e[2]}
          </button>
        ))}
      </div>
    );
  }

  function move(delta: number) {
    const dt = new Date(y, mo - 1 + delta, 1);
    setMonth(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="cal">
      <div className="row between" style={{ padding: "12px 20px" }}>
        <div className="row gap8">
          <button className="icon-btn" aria-label="Previous month" title="Previous month" onClick={() => move(-1)}><Icon name="caret-left" /></button>
          <b className="h4" style={{ minWidth: 150, textAlign: "center" }}>{monthLabel(month)}</b>
          <button className="icon-btn" aria-label="Next month" title="Next month" onClick={() => move(1)}><Icon name="caret-right" /></button>
        </div>
        <div className="row gap12 cap muted">
          {([["open", "Opens"], ["due", "Due"]] as const).map(([k, l]) => (
            <span className="row gap6" key={k}><i className={`cal-key ${k}`} />{l}</span>
          ))}
        </div>
      </div>
      <div className="cal-g">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div className="cal-h" key={d}>{d}</div>)}
        {cells}
      </div>
    </div>
  );
}

export default function ProgrammesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | Programme["status"]>("All");
  const [view, setView] = useState<"list" | "calendar">("list");

  const ser = SERIES.map((sr) => ({ sr, cur: currentCycle(sr.id), n: cyclesOf(sr.id).length })).filter((x): x is { sr: typeof x.sr; cur: Programme; n: number } => !!x.cur);
  const rows = ser.filter((x) => (status === "All" || x.cur.status === status) && (!q || (x.sr.name + x.cur.name + x.cur.reg).toLowerCase().includes(q.toLowerCase())));
  const countFor = (s: string) => ser.filter((x) => x.cur.status === s).length;

  return (
    <AppShell workspace="regulator">
      <PageHead
        title="Programmes"
        sub="Assessment programmes and their yearly cycles: which regulation, which organisations, by when, and who assesses them."
        actions={
          <>
            <button className="icon-btn bordered" title="Scoring and deadline settings" aria-label="Scoring and deadline settings" onClick={() => router.push("/regulator/settings/scoring")}><Icon name="gear-six" /></button>
            <Button icon="plus" testId="prog-new" onClick={() => router.push("/regulator/programmes/new")}>New programme</Button>
          </>
        }
      />

      <div className="card p0">
        <div className="tbl-tools">
          <div className="inp-wrap" style={{ width: 280 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search programmes" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="grow" />
          <div className="seg sm" role="tablist" aria-label="View">
            {([["list", "List", "list-bullets"], ["calendar", "Calendar", "calendar-blank"]] as const).map(([k, l, i]) => (
              <button key={k} className={view === k ? "on" : ""} data-test={`view-${k}`} onClick={() => setView(k)}><Icon name={i} /> {l}</button>
            ))}
          </div>
        </div>

        {view === "calendar" ? (
          <Calendar rows={rows} />
        ) : (
          <>
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
                        <tr key={p.id} className="click" data-test={`prog-${p.id}`} onClick={() => router.push(p.status === "Draft" ? `/regulator/programmes/new?edit=${p.id}` : `/regulator/programmes/${p.id}`)}>
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
                          <td className="act-col">
                            {p.status === "Draft" ? (
                              <span onClick={(e) => e.stopPropagation()}>
                                <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/programmes/new?edit=${p.id}`)}>Continue setup</Button>
                              </span>
                            ) : null}
                          </td>
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
          </>
        )}
      </div>
    </AppShell>
  );
}
