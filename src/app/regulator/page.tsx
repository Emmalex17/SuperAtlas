"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MyHero } from "@/components/MyHero";
import { ChartCard, MiniTable, Chip, Button, Tile } from "@/components/ui";
import { Scorecard, type ScorecardData } from "@/components/Scorecard";
import { chStack, chBars, chDots, CH } from "@/lib/charts";
import {
  liveSeries,
  compStatus,
  orgOverall,
  latestResult,
  prevResult,
  allFindings,
  fdOverdue,
  pct,
  avg,
  TODAY,
  COMP_STATUSES,
} from "@/lib/cases";
import { FILINGS, tplOf, isFiled, type Filing } from "@/lib/returns";
import { watchlist, enfOpenFor, ENF_TONE } from "@/lib/enforcement";
import { getSession } from "@/lib/auth";
import { myTasks, taskTotal } from "@/lib/tasks";
import { ORGANISATIONS } from "@/lib/mockData";

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Returns filed on time in the latest due period of each active return template — the
 * prototype's returnsOnTime(). */
function returnsOnTime(): { fs: Filing[]; on: Filing[] }[] {
  const tps = [...new Set(FILINGS.map((f) => f.tpl))].map(tplOf).filter((t) => t.status === "Active");
  const rows: { fs: Filing[]; on: Filing[] }[] = [];
  tps.forEach((t) => {
    const periods = [...new Set(FILINGS.filter((f) => f.tpl === t.id && f.due <= TODAY).map((f) => f.pkey))].sort().reverse();
    const pk = periods[0];
    if (!pk) return;
    const fs = FILINGS.filter((f) => f.tpl === t.id && f.pkey === pk);
    rows.push({ fs, on: fs.filter((f) => isFiled(f) && !f.lateBy) });
  });
  return rows;
}

export default function RegulatorDashboard() {
  const router = useRouter();
  const account = getSession();
  const firstName = account?.first ?? account?.name ?? "";
  const [boardOpen, setBoardOpen] = useState(false);

  const orgs = ORGANISATIONS.filter((o) => o.status === "Verified");
  const sers = liveSeries();

  const by = (st: string) => orgs.filter((o) => orgOverall(o.id) === st);
  const nonc = by("Non-compliant");
  const comp = by("Compliant");
  const cond = by("Compliant with conditions");
  const na = by("Not assessed");

  const open = allFindings().filter((x) => !["Closed", "Noted"].includes(x.f.status ?? "") && x.f.cls !== "OFI");
  const over = open.filter((x) => fdOverdue(x.f, TODAY));
  const major = open.filter((x) => x.f.cls === "MaNC");

  const rot = returnsOnTime();
  const allF = rot.flatMap((r) => r.fs);
  const onF = rot.flatMap((r) => r.on);

  const parts = [
    { l: "Compliant", col: CH.ok },
    { l: "Compliant with conditions", col: CH.warn },
    { l: "Non-compliant", col: CH.bad },
    { l: "Not assessed", col: "var(--neu-strong)", ink: "var(--text)" },
  ];
  const stRows = sers.map((sr) => {
    const ids = orgs.map((o) => o.id);
    return {
      l: sr.name,
      vals: parts.map((pt) => ({ n: ids.filter((id) => compStatus(latestResult(id, sr.id)) === pt.l).length })),
      total: ids.length,
    };
  });
  const stack = chStack(stRows, parts);

  const types = [...new Set(orgs.map((o) => o.type))].sort();
  const catRows = types.map((t) => {
    const os = orgs.filter((o) => o.type === t);
    const sc = os
      .map((o) => sers.map((sr) => latestResult(o.id, sr.id)?.score).find((v) => v != null))
      .filter((v): v is number => v != null);
    return { t, n: os.length, a: avg(sc), nc: os.filter((o) => orgOverall(o.id) === "Non-compliant").length };
  });
  const catBars = chBars(
    catRows.filter((r) => r.a != null).map((r) => ({ l: r.t, lh: `${r.t} (${r.n})`, v: r.a!, col: CH.brand, vl: r.a! })),
    { max: 100 }
  );

  const drops = orgs
    .flatMap((o) =>
      sers
        .map((sr) => {
          const a = prevResult(o.id, sr.id);
          const b = latestResult(o.id, sr.id);
          return a && b && a.score != null && b.score != null ? { o, a: a.score, b: b.score, d: b.score - a.score } : null;
        })
        .filter((x): x is { o: (typeof orgs)[number]; a: number; b: number; d: number } => !!x)
    )
    .sort((x, y) => x.d - y.d)
    .slice(0, 5)
    .filter((x) => x.d < 0);
  const dropsChart = chDots(
    drops.map((x) => ({ l: x.o.name, a: x.a, b: x.b })),
    { min: 0, max: 100, ref: 70, key: ["Previous", "Latest"] }
  );

  const wl = watchlist().slice(0, 5);

  const top = account
    ? myTasks(account)
        .filter((g) => g.items.length)
        .slice(0, 3)
        .map((g) => ({ icon: g.icon, title: g.say(g.items.length), href: g.href }))
    : [];
  const totalTasks = account ? taskTotal(account) : 0;

  function boardPackData(): ScorecardData {
    return {
      title: "Supervision board pack",
      sub: `NITDA · ${TODAY}`,
      kpis: [
        ["Organisations", orgs.length],
        ["Non-compliant", nonc.length],
        ["Overdue fixes", over.length],
        ["On the watchlist", watchlist().length],
      ],
      head: ["Programme", ...COMP_STATUSES],
      rows: sers.map((sr) => [sr.name, ...COMP_STATUSES.map((s) => orgs.filter((o) => compStatus(latestResult(o.id, sr.id)) === s).length)]),
      extra: ["Watchlist", watchlist().slice(0, 10).map((w) => [ORGANISATIONS.find((o) => o.id === w.org)?.name ?? w.org, `${w.reasons.length} reason${w.reasons.length > 1 ? "s" : ""}`, w.reasons[0].text] as [string, string, string])],
      file: `board-pack-${TODAY}.csv`,
    };
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "My dashboard" }]}>
      <MyHero
        firstName={firstName}
        line=""
        top={top}
        totalTasks={totalTasks}
        actions={
          <>
            <Button variant="ghost-light" size="sm" icon="file-text" onClick={() => setBoardOpen(true)} testId="board-pack">Board pack</Button>
            <Button variant="ghost-light" size="sm" icon="plus" onClick={() => router.push("/regulator/programmes/new")}>New programme</Button>
            <Button variant="ghost-light" size="sm" icon="gavel" onClick={() => router.push("/regulator/enforcement/new")}>Issue a regulatory action</Button>
          </>
        }
      />

      <div className="kpi-row">
        <button type="button" className="kpi" onClick={() => router.push("/regulator/organisations")} data-test="dk-orgs">
          <div className="row gap8"><Tile icon="buildings" size="sm" /><span className="overline">Organisations</span></div>
          <div className="kpi-n tnum">{orgs.length}</div>
          <div className="cap muted">{comp.length} compliant · {na.length} not assessed yet</div>
        </button>
        <button type="button" className="kpi" onClick={() => router.push("/regulator/organisations")} data-test="dk-nonc">
          <div className="row gap8"><Tile icon="x-circle" size="sm" /><span className="overline">Non-compliant</span></div>
          <div className="kpi-n tnum">{nonc.length}</div>
          <div className="cap muted">{cond.length} more compliant with conditions</div>
        </button>
        <button type="button" className="kpi" onClick={() => router.push("/regulator/findings")} data-test="dk-find">
          <div className="row gap8"><Tile icon="flag" size="sm" /><span className="overline">Open findings</span></div>
          <div className="kpi-n tnum">{open.length}</div>
          <div className="cap muted">{over.length} overdue · {major.length} major</div>
        </button>
        <button type="button" className="kpi" onClick={() => router.push("/regulator/returns")} data-test="dk-ret">
          <div className="row gap8"><Tile icon="table" size="sm" /><span className="overline">Returns on time</span></div>
          <div className="kpi-n tnum">{allF.length ? pct(onF.length, allF.length) : 0}%</div>
          <div className="cap muted">{onF.length} of {allF.length} in the latest period</div>
        </button>
      </div>
      <p className="scope-line cap muted">All {orgs.length} organisations under supervision · latest published results</p>

      <div className="ch-grid2">
        <ChartCard
          title={`${nonc.length} organisations non-compliant in at least one programme`}
          sub="Compliance status by programme, from each organisation's latest published result"
          chart={<Html html={stack} />}
          table={<MiniTable head={["Programme", ...parts.map((p) => p.l)]} rows={stRows.map((r) => [r.l, ...r.vals.map((v) => v.n)])} />}
          testId="dash-status"
        />
        <ChartCard
          title="Average score by category"
          sub="Latest published score"
          chart={<Html html={catBars} />}
          table={<MiniTable head={["Category", "Organisations", "Average score", "Non-compliant"]} rows={catRows.map((r) => [r.t, r.n, r.a ?? "—", r.nc])} />}
          foot={
            <div className="row wrap gap6">
              {catRows.map((r) => (
                <Link key={r.t} href={`/regulator/organisations/category/${encodeURIComponent(r.t)}`} className="pill" data-test={`cat-${r.t.replace(/ /g, "-")}`}>
                  {r.t}
                  <span className="count">{r.n}</span>
                </Link>
              ))}
            </div>
          }
          testId="dash-cat"
        />
      </div>

      <div className="ch-grid2">
        <div className="card p0 col">
          <div className="tbl-tools">
            <div className="grow">
              <div className="h4">Watchlist</div>
              <div className="cap muted">{watchlist().length} flagged by your rules</div>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => router.push("/regulator/enforcement")}>Open enforcement</Button>
          </div>
          <div className="list">
            {wl.length ? (
              wl.map((w) => {
                const o = ORGANISATIONS.find((x) => x.id === w.org);
                const oc = enfOpenFor(w.org);
                return (
                  <button key={w.org} className="list-row" onClick={() => router.push(`/regulator/organisations/${w.org}`)}>
                    <span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="strong ell" style={{ display: "block" }}>{o?.name}</span>
                      <span className="cap muted ell" style={{ display: "block" }}>{w.reasons[0].text}{w.reasons.length > 1 ? ` · +${w.reasons.length - 1} more` : ""}</span>
                    </span>
                    {oc ? <Chip tone={ENF_TONE[oc.status] ?? "neu"}>{oc.status}</Chip> : <Chip tone="neu">No case</Chip>}
                  </button>
                );
              })
            ) : (
              <div style={{ padding: "16px 20px" }} className="small muted">Nobody flagged</div>
            )}
          </div>
        </div>
        <ChartCard
          title={drops.length ? `${drops.length} biggest drops since the previous cycle` : "No drops since the previous cycle"}
          sub="Score in the previous and latest cycle"
          chart={<Html html={dropsChart} />}
          testId="dash-drops"
        />
      </div>

      <Scorecard open={boardOpen} onClose={() => setBoardOpen(false)} data={boardOpen ? boardPackData() : null} />
    </AppShell>
  );
}
