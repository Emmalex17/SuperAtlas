"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Button, KTile, ChartCard, MiniTable, CompChip } from "@/components/ui";
import { Scorecard, type ScorecardData } from "@/components/Scorecard";
import { chDots, chStack, CH } from "@/lib/charts";
import {
  SERIES,
  COMPLIANCE_SETTINGS,
  liveSeries,
  latestResult,
  prevResult,
  progOf,
  caseScore,
  compStatus,
  currentCycle,
  avg,
  pct,
  NC_OPEN,
  TODAY,
} from "@/lib/cases";
import { ORGANISATIONS, allCategoryTypes } from "@/lib/mockData";

export default function CategoryRankingPage({ params }: { params: Promise<{ type: string }> }) {
  const { type: typeParam } = use(params);
  const type = decodeURIComponent(typeParam);
  const router = useRouter();
  const sers = liveSeries();
  const [serId, setSerId] = useState(sers.find((s) => s.id === "isr")?.id ?? sers[0]?.id ?? "isr");
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const sr = SERIES.find((s) => s.id === serId) ?? sers[0];

  const verifiedOrgs = ORGANISATIONS.filter((o) => o.status === "Verified");
  const os = verifiedOrgs.filter((o) => o.type === type);
  const res = os
    .map((o) => ({ o, c: latestResult(o.id, sr.id), pv: prevResult(o.id, sr.id) }))
    .sort((a, b) => (b.c?.score ?? -1) - (a.c?.score ?? -1));
  const done = res.filter((r) => r.c);
  const b = +(COMPLIANCE_SETTINGS.bench[sr.id] ?? 70);
  const met = done.filter((r) => r.c!.score! >= b);
  const allDone = verifiedOrgs.map((o) => latestResult(o.id, sr.id)).filter((c): c is NonNullable<typeof c> => !!c);
  const latestProg = done.length ? progOf(done[0].c!.prog) : currentCycle(sr.id);
  const secs = latestProg ? latestProg.qset.sections.filter((s) => s.on) : [];
  const typeDef = allCategoryTypes().find((t) => t.name === type);
  const plural = typeDef?.plural ?? `${type}s`;

  const secRows = secs.map((s) => ({
    l: s.name,
    a: avg(allDone.map((c) => caseScore(c, s.id)).filter((v): v is number => v != null)) ?? undefined,
    b: avg(done.map((r) => caseScore(r.c!, s.id)).filter((v): v is number => v != null)) ?? undefined,
  }));

  const statusParts = [
    { l: "Compliant", col: CH.ok },
    { l: "Compliant with conditions", col: CH.warn },
    { l: "Non-compliant", col: CH.bad },
    { l: "Not assessed", col: "var(--neu-strong)", ink: "var(--text)" },
  ];
  const statusVals = ["Compliant", "Compliant with conditions", "Non-compliant", "Not assessed"].map((s) => ({
    n: res.filter((r) => compStatus(r.c) === s).length,
  }));

  function scorecardData(): ScorecardData {
    return {
      title: plural,
      sub: `Category scorecard · ${sr.name}`,
      kpis: [
        ["Organisations", os.length],
        ["Assessed", done.length],
        ["Average score", avg(done.map((r) => r.c!.score!)) ?? "—"],
        ["Non-compliant", res.filter((r) => compStatus(r.c) === "Non-compliant").length],
      ],
      head: ["Rank", "Organisation", "Score", "Status", "Open nonconformities"],
      rows: res.map((r, i) => [r.c ? i + 1 : "—", r.o.name, r.c?.score ?? "—", compStatus(r.c), r.c ? (r.c.findings || []).filter(NC_OPEN).length : "—"]),
      file: `${type.replace(/ /g, "-").toLowerCase()}-scorecard-${TODAY}.csv`,
    };
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Organisations", href: "/regulator/organisations" }, { label: plural }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">Category</div>
          <div className="rh-title">
            <h1 className="h1">{plural}</h1>
            <Chip tone="neu">{os.length} organisations</Chip>
          </div>
          <div className="rh-meta">Ranked by their latest {sr.name} result</div>
        </div>
        <div className="rh-act">
          {sers.length > 1 ? (
            <select className="sel" aria-label="Programme" style={{ width: "auto", height: 36 }} value={sr.id} onChange={(e) => setSerId(e.target.value)}>
              {sers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : null}
          <Button variant="secondary" icon="export" testId="cat-export" onClick={() => setScorecardOpen(true)}>Export scorecard</Button>
        </div>
      </div>

      <div className="ktiles">
        <KTile label="Organisations" value={os.length} />
        <KTile label="Assessed" value={done.length} sub={`${os.length - done.length} not assessed yet`} />
        <KTile label="Average score" value={avg(done.map((r) => r.c!.score!)) ?? "—"} sub={`All categories: ${avg(allDone.map((c) => c.score!)) ?? "—"}`} />
        <KTile label={`Met the benchmark (${b})`} value={<>{met.length}<small> · {pct(met.length, done.length)}%</small></>} testId="ck-met" />
      </div>

      <div className="ch-grid2">
        <ChartCard
          title={`Section scores: ${plural.toLowerCase()} against all organisations`}
          sub={`Average section score in the latest ${sr.name} results`}
          chart={<div dangerouslySetInnerHTML={{ __html: chDots(secRows, { min: 0, max: 100, ref: b, key: ["All organisations", plural] }) }} />}
          table={<MiniTable head={["Section", "All organisations", plural]} rows={secRows.map((r) => [r.l, r.a ?? "—", r.b ?? "—"])} />}
        />
        <ChartCard
          title="Compliance status"
          sub={`${sr.name}, latest result`}
          chart={<div dangerouslySetInnerHTML={{ __html: chStack([{ l: plural, vals: statusVals, total: res.length }], statusParts) }} />}
        />
      </div>

      <div className="card p0">
        <div className="tbl-tools">
          <div className="grow">
            <div className="h4">Ranking</div>
            <div className="cap muted">Click an organisation to see its compliance history</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl dense">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Organisation</th>
                <th className="num">Score</th>
                <th className="num">Change</th>
                <th>Status</th>
                {secs.map((s) => <th key={s.id} className="num" title={s.name}>{s.name.replace(/^\d+\.\s*/, "").split(" ")[0]}</th>)}
                <th className="num">Open findings</th>
              </tr>
            </thead>
            <tbody>
              {res.map((r, i) => {
                const d = r.c && r.pv ? r.c.score! - r.pv.score! : null;
                const openF = r.c ? (r.c.findings || []).filter(NC_OPEN).length : 0;
                return (
                  <tr key={r.o.id} className="click" onClick={() => router.push(`/regulator/organisations/${r.o.id}?tab=compliance`)} data-test={`rank-${r.o.id}`}>
                    <td className="num tnum muted">{r.c ? i + 1 : "—"}</td>
                    <td>
                      <div className="org">
                        <span className="logo s32" style={{ background: r.o.color }}>{r.o.initials}</span>
                        <div>
                          <div className="nm">{r.o.name}</div>
                          <div className="sub">{r.o.tier || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num tnum strong" style={{ color: r.c && r.c.score! < b ? "var(--bad-fg)" : "inherit" }}>{r.c ? r.c.score : "—"}</td>
                    <td className="num tnum">{d == null ? <span className="muted">—</span> : <span style={{ color: d >= 0 ? "var(--ok-fg)" : "var(--bad-fg)" }}>{d > 0 ? "+" : ""}{d}</span>}</td>
                    <td><CompChip status={compStatus(r.c)} /></td>
                    {secs.map((s) => {
                      const v = r.c ? caseScore(r.c, s.id) : null;
                      return <td key={s.id} className="num tnum">{v ?? "—"}</td>;
                    })}
                    <td className="num tnum">{openF || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Scorecard
        open={scorecardOpen}
        onClose={() => setScorecardOpen(false)}
        data={scorecardOpen ? scorecardData() : null}
      />
    </AppShell>
  );
}
