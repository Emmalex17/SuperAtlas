"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, CompChip, KTile, ChartCard, MiniTable, Tile } from "@/components/ui";
import { chLine, chColumns, chBars, chStack, chFunnel, chHeat, chDots, CH } from "@/lib/charts";
import {
  casesOf,
  cyclesOf,
  isSubmitted,
  caseProgress,
  compStatus,
  caseScore,
  benchOf,
  fcOf,
  qsetReqs,
  avg,
  pct,
  fmtD,
  TODAY,
  remindAllOutstanding,
  FINDING_CLASSES,
  fdOverdue,
  type Programme,
  type Case,
} from "@/lib/cases";
import { ORGANISATIONS, FIRMS, catLabel } from "@/lib/mockData";
import { useToast } from "@/components/Toast";

const AN_TABS: [string, string][] = [["progress", "Progress"], ["results", "Results"], ["sections", "Sections"], ["time", "Over time"], ["remediation", "Remediation"]];
const DONE_ASSESS = ["Signed off", "Report submitted", "In review", "Returned", "Approved", "Scheduled", "Held back", "Published"];
const DONE_REVIEW = ["Approved", "Scheduled", "Held back", "Published"];

function daysFrom(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 864e5);
}
function orgOf(id: string) {
  return ORGANISATIONS.find((o) => o.id === id);
}
function orgName(id: string) {
  return orgOf(id)?.name ?? id;
}
function hasResults(p: Programme) {
  return casesOf(p.id).some((c) => c.stage === "Published");
}

type AnFilterState = { cat: string; firm: string; cmp: string };

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function AnalyticsTab({ p }: { p: Programme }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<string>(p.status === "Open" ? "progress" : "results");
  const [filter, setFilter] = useState<AnFilterState>({ cat: "all", firm: "all", cmp: "auto" });
  const [showAllOrgs, setShowAllOrgs] = useState(false);

  const cyc = cyclesOf(p.series);
  const older = cyc.filter((c) => c.id !== p.id && +c.cycle < +p.cycle && c.status !== "Draft");
  const cmp = filter.cmp === "auto" ? older[0] ?? null : filter.cmp === "none" ? null : cyc.find((c) => c.id === filter.cmp) ?? null;
  const keep = (c: Case) => (filter.cat === "all" || orgOf(c.org)?.type === filter.cat) && (filter.firm === "all" || c.firm === filter.firm);
  const cs = casesOf(p.id).filter(keep);
  const cc = cmp ? casesOf(cmp.id).filter(keep) : [];

  const types = [...new Set([...casesOf(p.id), ...cc].map((c) => orgOf(c.org)?.type).filter((x): x is string => !!x))].sort();
  const firmIds = [...new Set(casesOf(p.id).map((c) => c.firm).filter(Boolean))];

  const needsRes = ["results", "sections", "remediation"].includes(tab) && !hasResults(p);

  return (
    <>
      <div className="row wrap gap12" style={{ marginBottom: 16 }}>
        <label className="row gap6 small">Cycle
          <select className="sel" aria-label="Cycle" value={p.id} onChange={(e) => router.push(`/regulator/programmes/${e.target.value}?tab=analytics`)}>
            {cyc.filter((c) => c.status !== "Draft").map((c) => <option key={c.id} value={c.id}>{c.cycle}{c.status === "Open" ? " (open)" : ""}</option>)}
          </select>
        </label>
        <label className="row gap6 small">Compare with
          <select className="sel" aria-label="Compare with" value={filter.cmp} onChange={(e) => setFilter({ ...filter, cmp: e.target.value })}>
            <option value="auto">{cmp && filter.cmp === "auto" ? `${cmp.cycle} (previous)` : "Previous cycle"}</option>
            <option value="none">No comparison</option>
            {cyc.filter((c) => c.id !== p.id && c.status !== "Draft").map((c) => <option key={c.id} value={c.id}>{c.cycle}</option>)}
          </select>
        </label>
        <label className="row gap6 small">Category
          <select className="sel" aria-label="Category" value={filter.cat} onChange={(e) => setFilter({ ...filter, cat: e.target.value })}>
            <option value="all">All categories</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="row gap6 small">Firm
          <select className="sel" aria-label="Firm" value={filter.firm} onChange={(e) => setFilter({ ...filter, firm: e.target.value })}>
            <option value="all">All firms</option>
            {firmIds.map((id) => <option key={id} value={id}>{FIRMS.find((f) => f.id === id)?.name ?? id}</option>)}
          </select>
        </label>
        <span className="grow" />
        <Button variant="tertiary" size="sm" icon="export" onClick={() => toast("Export started. You will get an email with the CSV and charts.")}>Export</Button>
      </div>

      <div className="seg" role="tablist" aria-label="Analytics" style={{ marginBottom: 16 }}>
        {AN_TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} data-test={`an-${k}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {needsRes ? (
        <div className="card">
          <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
            <Tile icon="chart-bar" size="lg" />
            <div className="h4">No results published for {p.cycle} yet</div>
            <p className="muted small">{p.status === "Open" ? "Results appear here as reports are published. Progress shows how this cycle is going." : "Publish reports to see results."}</p>
          </div>
        </div>
      ) : tab === "progress" ? (
        <ProgressPanel p={p} cs={cs} cc={cc} cmp={cmp} toast={toast} />
      ) : tab === "results" ? (
        <ResultsPanel p={p} cs={cs} cc={cc} cmp={cmp} router={router} />
      ) : tab === "sections" ? (
        <SectionsPanel p={p} cs={cs} router={router} />
      ) : tab === "time" ? (
        <TimePanel p={p} cyc={cyc} cmp={cmp} keep={keep} showAllOrgs={showAllOrgs} setShowAllOrgs={setShowAllOrgs} router={router} />
      ) : (
        <RemediationPanel p={p} cs={cs} router={router} />
      )}
    </>
  );
}

function ProgressPanel({ p, cs, cc, cmp, toast }: { p: Programme; cs: Case[]; cc: Case[]; cmp: Programme | null; toast: ReturnType<typeof useToast> }) {
  const n = cs.length;
  const win = daysFrom(p.opens, p.closes);
  const live = p.status === "Open";
  const day = live ? Math.max(0, Math.min(win, daysFrom(p.opens, TODAY))) : win;
  const left = daysFrom(TODAY, p.closes);
  const sub = cs.filter(isSubmitted);
  const notSub = cs.filter((c) => !isSubmitted(c));
  const subBy = (list: Case[], open: string, d: number) => list.filter((c) => c.subDate && daysFrom(open, c.subDate) <= d).length;
  const curPct = pct(sub.length, n);
  const prevAt = cmp ? pct(subBy(cc, cmp.opens, day), cc.length) : null;

  const grp: [string, Case[]][] = [
    ["In scope", cs],
    ["Firm in place", cs.filter((c) => c.stage !== "Firm to assign" && c.stage !== "Firm to choose" && c.stage !== "Firm approval" && c.stage !== "Awaiting firm")],
    ["Started answering", cs.filter((c) => Object.keys(c.answers || {}).length || isSubmitted(c))],
    ["Submitted", sub],
    ["Assessed by the firm", cs.filter((c) => DONE_ASSESS.includes(c.stage))],
    ["Reviewed by NITDA", cs.filter((c) => DONE_REVIEW.includes(c.stage))],
    ["Published", cs.filter((c) => c.stage === "Published")],
  ];
  const funnel = chFunnel(grp.map(([l, list]) => ({ l, n: list.length })));

  const curve = (list: Case[], open: string, upto: number) => {
    const pts: [number, number][] = [];
    for (let d = 0; d <= upto; d += 2) pts.push([d, pct(subBy(list, open, d), list.length)]);
    if (pts.length && pts[pts.length - 1][0] !== upto) pts.push([upto, pct(subBy(list, open, upto), list.length)]);
    return pts;
  };
  const series = [{ name: p.cycle, col: CH.brand, pts: curve(cs, p.opens, day), dots: false, end: `${curPct}%` }];
  if (cmp) series.unshift({ name: cmp.cycle, col: CH.prev, dash: true, w: 1.75, pts: curve(cc, cmp.opens, daysFrom(cmp.opens, cmp.closes)), dots: false, end: undefined } as never);
  const ticks: [number, string][] = [];
  for (let d = 0; d <= win; d += 14) ticks.push([d, `Day ${d}`]);
  const line = chLine({ w: 560, h: 240, x: { min: 0, max: win, ticks }, y: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], unit: "%" }, series, refX: [...(live ? [{ v: day, label: "Today", col: CH.brand }] : []), { v: win, label: "Due", col: CH.bad }], label: "Share of organisations submitted by day" });
  const lineTitle = live ? `${sub.length} of ${n} submitted, ${left} days before the deadline` : `${sub.length} of ${n} submitted by the deadline`;
  const lineSub = cmp ? `Share submitted by day since opening · ${cmp.cycle} had ${prevAt}% by day ${day}` : "Share submitted by day since opening";

  const catTypes = [...new Set(cs.map((c) => orgOf(c.org)?.type).filter((x): x is string => !!x))];
  const byCat = chStack(
    catTypes.map((t) => {
      const l = cs.filter((c) => orgOf(c.org)?.type === t);
      const s = l.filter(isSubmitted);
      return { l: t, vals: [{ n: s.length }, { n: l.length - s.length }], total: `${pct(s.length, l.length)}%` };
    }),
    [{ l: "Submitted", col: CH.brand }, { l: "Not submitted", col: "var(--neu-strong)", ink: "var(--text)" }]
  );
  const late = notSub.filter((c) => c.due < TODAY);

  return (
    <>
      <div className="ktiles">
        <KTile label="In scope" value={n} sub="All categories" testId="k-scope" />
        <KTile label="Submitted" value={<>{sub.length}<small> · {curPct}%</small></>} delta={prevAt == null ? undefined : curPct - prevAt} unit=" pts" vs={cmp ? `vs ${cmp.cycle} at this point` : undefined} testId="k-sub" />
        <KTile label="Not submitted yet" value={notSub.length} sub={late.length ? `${late.length} past the deadline` : "None late"} testId="k-not" />
        <KTile label={live ? "Days to the deadline" : "Window"} value={live ? Math.max(0, left) : `${win} days`} sub={`Due ${fmtD(p.closes)}`} />
      </div>
      <div className="ch-grid2">
        <ChartCard title={lineTitle} sub={lineSub} chart={<Html html={line} />} table={<MiniTable head={["Day", `${p.cycle} submitted`]} rows={series[series.length - 1].pts.filter((_, i) => i % 3 === 0).map(([d, v]) => [`Day ${d}`, `${v}%`])} />} testId="prog-line" />
        <ChartCard title={`${grp[6][1].length ? `${grp[6][1].length} published` : "Nothing published yet"}; ${grp[1][1].length} of ${n} have a firm in place`} sub="From scoped to published" chart={<Html html={funnel} />} table={<MiniTable head={["Stage", "Organisations"]} rows={grp.map(([l, list]) => [l, list.length])} />} testId="prog-funnel" />
      </div>
      <div className="ch-grid2">
        <ChartCard title="Submission by category" sub="Current submitted share" chart={<Html html={byCat} />} testId="prog-cat" />
        <div className="card p0 col">
          <div className="tbl-tools">
            <div className="grow">
              <div className="h4">Not submitted yet</div>
              <div className="cap muted">{notSub.length} organisation{notSub.length === 1 ? "" : "s"} · newest stage first</div>
            </div>
            {live && notSub.length ? (
              <Button
                variant="secondary"
                size="sm"
                icon="bell-ringing"
                testId="an-remind"
                onClick={() => {
                  const sent = remindAllOutstanding(p.id, "M. Bello");
                  toast(`Reminders sent to ${sent} organisations`, "ok", "bell-ringing");
                }}
              >
                Remind all ({notSub.length})
              </Button>
            ) : null}
          </div>
          <div className="tbl-wrap" style={{ maxHeight: 330, overflow: "auto" }}>
            <table className="tbl">
              <tbody>
                {notSub.length ? (
                  [...notSub].sort((a, b) => caseProgress(b) - caseProgress(a)).map((c) => (
                    <tr key={c.id}>
                      <td><div className="org"><span className="logo s32" style={{ background: orgOf(c.org)?.color }}>{orgOf(c.org)?.initials}</span><div><div className="nm">{orgName(c.org)}</div><div className="sub">{FIRMS.find((f) => f.id === c.firm)?.name ?? "Needs a firm"}</div></div></div></td>
                      <td><Chip tone="neu">{c.stage}</Chip></td>
                      <td style={{ width: 120, paddingRight: 20 }}><div className="pbar"><div className="bar"><i style={{ width: `${caseProgress(c)}%` }} /></div></div></td>
                    </tr>
                  ))
                ) : (
                  <tr><td><div className="col" style={{ alignItems: "center", padding: 24 }}><Tile icon="check-circle" tone="solid ok" size="sm" /><div className="h4">Everyone has submitted</div></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function ResultsPanel({ p, cs, cc, cmp, router }: { p: Programme; cs: Case[]; cc: Case[]; cmp: Programme | null; router: ReturnType<typeof useRouter> }) {
  const b = benchOf(p);
  const pub = cs.filter((c) => c.stage === "Published" && c.score != null);
  const prevPub = cc.filter((c) => c.stage === "Published" && c.score != null);
  const prevOf = (org: string) => prevPub.find((c) => c.org === org)?.score;
  const met = pub.filter((c) => (c.score ?? 0) >= b);
  const nonc = pub.filter((c) => compStatus(c) === "Non-compliant");
  const pMet = pct(met.length, pub.length);
  const ppMet = pct(prevPub.filter((c) => (c.score ?? 0) >= b).length, prevPub.length);

  const bins: [number, number, string][] = [[0, 49, "0–49"], [50, 59, "50–59"], [60, 69, "60–69"], [70, 79, "70–79"], [80, 89, "80–89"], [90, 100, "90–100"]];
  const refAt = bins.findIndex((x) => b >= x[0] && b <= x[1]);
  const hist = chColumns({ bins: bins.map(([lo, hi, l]) => ({ l, n: pub.filter((c) => (c.score ?? -1) >= lo && (c.score ?? -1) <= hi).length, col: hi < b ? CH.bad : CH.brand })), refAt, refLabel: `Benchmark ${b}` });

  const stParts = [{ l: "Compliant", col: CH.ok }, { l: "Compliant with conditions", col: CH.warn }, { l: "Non-compliant", col: CH.bad }];
  const statusOf = (c: Case) => compStatus(c);
  const catTypes = [...new Set(pub.map((c) => orgOf(c.org)?.type).filter((x): x is string => !!x))];
  const stRows = [
    { l: "All organisations", vals: stParts.map((s) => ({ n: pub.filter((c) => statusOf(c) === s.l).length })), total: pub.length },
    ...catTypes.map((t) => ({ l: t, vals: stParts.map((s) => ({ n: pub.filter((c) => orgOf(c.org)?.type === t && statusOf(c) === s.l).length })), total: pub.filter((c) => orgOf(c.org)?.type === t).length })),
  ];
  const sorted = [...pub].sort((a, c) => (c.score ?? 0) - (a.score ?? 0));

  return (
    <>
      <div className="ktiles">
        <KTile label="Scoped" value={cs.length} delta={cmp ? cs.length - cc.length : undefined} vs={cmp ? `vs ${cmp.cycle}` : undefined} testId="k-scoped" />
        <KTile label="Completed (published)" value={pub.length} delta={cmp ? pub.length - prevPub.length : undefined} vs={cmp ? `vs ${cmp.cycle}` : undefined} testId="k-done" />
        <KTile label={`Met the benchmark (${b})`} value={<>{met.length}<small> · {pMet}%</small></>} delta={cmp && prevPub.length ? pMet - ppMet : undefined} unit=" pts" vs={cmp ? `vs ${cmp.cycle}` : undefined} testId="k-met" />
        <KTile label="Non-compliant" value={nonc.length} delta={cmp ? nonc.length - prevPub.filter((c) => statusOf(c) === "Non-compliant").length : undefined} goodUp={false} vs={cmp ? `vs ${cmp.cycle}` : undefined} testId="k-nonc" />
      </div>
      <div className="ch-grid2">
        <ChartCard title={`${met.length} of ${pub.length} met the benchmark of ${b}; average score ${avg(pub.map((c) => c.score ?? 0)) ?? "—"}`} sub="Organisations by score" chart={<Html html={hist} />} table={<MiniTable head={["Score", "Organisations"]} rows={bins.map(([lo, hi, l]) => [l, pub.filter((c) => (c.score ?? -1) >= lo && (c.score ?? -1) <= hi).length])} />} testId="res-hist" />
        <ChartCard title={`${nonc.length} non-compliant, ${pub.filter((c) => statusOf(c) === "Compliant with conditions").length} compliant with conditions`} sub="Compliance status now, after fixes closed since publishing" chart={<Html html={chStack(stRows, stParts)} />} table={<MiniTable head={["Group", ...stParts.map((x) => x.l)]} rows={stRows.map((r) => [r.l, ...r.vals.map((v) => v.n)])} />} testId="res-status" />
      </div>
      <div className="card p0">
        <div className="tbl-tools"><div className="grow"><div className="h4">Results</div><div className="cap muted">{pub.length} published · sorted by score</div></div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Organisation</th><th>Firm</th><th className="num">Score</th><th className="num">Change</th><th>Status</th><th className="num">Open findings</th></tr></thead>
            <tbody>
              {sorted.map((c) => {
                const pv = prevOf(c.org);
                const d = pv == null ? null : (c.score ?? 0) - pv;
                const open = (c.findings || []).filter((f) => !["Closed", "Noted"].includes(f.status ?? "")).length;
                return (
                  <tr key={c.id} className="click" onClick={() => router.push(`/regulator/organisations/${c.org}`)}>
                    <td><div className="org"><span className="logo s32" style={{ background: orgOf(c.org)?.color }}>{orgOf(c.org)?.initials}</span><div><div className="nm">{orgName(c.org)}</div><div className="sub">{orgOf(c.org) ? catLabel(orgOf(c.org)!.type, orgOf(c.org)!.tier) : ""}</div></div></div></td>
                    <td className="small">{FIRMS.find((f) => f.id === c.firm)?.name ?? "—"}</td>
                    <td className="num tnum strong" style={{ color: (c.score ?? 0) < b ? "var(--bad-fg)" : "inherit" }}>{c.score}</td>
                    <td className="num tnum">{d == null ? <span className="muted">new</span> : <span style={{ color: d >= 0 ? "var(--ok-fg)" : "var(--bad-fg)" }}>{d > 0 ? "+" : ""}{d}</span>}</td>
                    <td><CompChip status={statusOf(c)} /></td>
                    <td className="num tnum">{open || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SectionsPanel({ p, cs, router }: { p: Programme; cs: Case[]; router: ReturnType<typeof useRouter> }) {
  const pub = cs.filter((c) => c.stage === "Published");
  const secs = p.qset.sections.filter((s) => s.on);
  const CLS = FINDING_CLASSES.map((f) => f.code);
  const colOf: Record<string, string> = { MaNC: CH.bad, MiNC: CH.warn, OBS: CH.brand, OFI: CH.neu };
  const who = (filterFn: (f: NonNullable<Case["findings"]>[number]) => boolean) => pub.filter((c) => (c.findings || []).some(filterFn));

  type Row = { sec?: boolean; key: string; l: string; cells: { n: number }[] };
  const rows: Row[] = [];
  secs.forEach((s) => {
    const sreqs = s.reqs.map((r) => r.ref);
    rows.push({ sec: true, key: s.id, l: s.name, cells: CLS.map((k) => ({ n: who((f) => f.cls === k && sreqs.includes(f.ref)).length })) });
    s.reqs.forEach((r) => rows.push({ key: r.ref, l: `${r.ref} ${r.t}`, cells: CLS.map((k) => ({ n: who((f) => f.cls === k && f.ref === r.ref).length })) }));
  });
  const heat = chHeat({ cols: CLS.map((k) => ({ l: k, t: fcOf(k).name, col: colOf[k] || CH.brand })), rows });
  const secRows = rows.filter((r) => r.sec);
  const topN = Math.max(0, ...secRows.map((r) => r.cells[0].n));
  const tops = secRows.filter((r) => r.cells[0].n === topN).map((r) => r.l.replace(/^\d+\.\s*/, ""));
  const worst = topN ? { l: tops.join(" and "), n: topN } : null;

  const reqs = qsetReqs(p.qset);
  const gaps = reqs
    .map((r) => ({ r, l: who((f) => f.ref === r.ref && ["MaNC", "MiNC"].includes(f.cls)) }))
    .filter((x) => x.l.length)
    .sort((a, b2) => b2.l.length - a.l.length)
    .slice(0, 10);

  const parts = [{ l: "Compliant", col: CH.ok }, { l: "Partially compliant", col: CH.warn }, { l: "Non-compliant", col: CH.bad }];
  const mix = secs.map((s) => ({
    l: s.name,
    vals: parts.map((pt) => ({ n: pub.reduce((a, c) => a + s.reqs.filter((r) => (c.outcomes[r.ref] || {}).o === pt.l).length, 0) })),
    total: avg(pub.map((c) => caseScore(c, s.id)).filter((v): v is number => v != null)) ?? undefined,
  }));

  return (
    <>
      <ChartCard
        title={worst && worst.n ? `${worst.l} ${tops.length > 1 ? "have" : "has"} the most major nonconformities: ${worst.n} organisations${tops.length > 1 ? " each" : ""}` : "Findings by section and class"}
        sub={`Number of organisations with a finding · ${pub.length} published reports in ${p.cycle}`}
        chart={<Html html={heat} />}
        foot={CLS.map((k) => `${k} ${fcOf(k).name.toLowerCase()}`).join(" · ")}
        testId="sec-heat"
      />
      <div className="ch-grid2">
        <ChartCard
          title={gaps.length ? `${gaps[0].r.t} is the most common gap (${gaps[0].l.length} organisations)` : "No nonconformities"}
          sub="Requirements ranked by organisations with a major or minor nonconformity"
          chart={<Html html={chBars(gaps.map((g) => ({ l: `${g.r.ref} ${g.r.t}`, v: g.l.length, col: CH.bad })))} />}
          table={<MiniTable head={["Requirement", "Organisations"]} rows={gaps.map((g) => [`${g.r.ref} ${g.r.t}`, g.l.length])} />}
          testId="sec-gaps"
        />
        <ChartCard
          title="Outcomes by section"
          sub="Requirement outcomes across all published reports · right: average section score"
          chart={<Html html={chStack(mix, parts)} />}
          table={<MiniTable head={["Section", ...parts.map((x) => x.l), "Average score"]} rows={mix.map((m) => [m.l, ...m.vals.map((v) => v.n), m.total ?? "—"])} />}
          testId="sec-mix"
        />
      </div>
      <p className="cap muted">Click a row in Results to open an organisation&apos;s profile. <Button variant="tertiary" size="sm" onClick={() => router.push(`/regulator/programmes/${p.id}?tab=organisations`)}>View organisations</Button></p>
    </>
  );
}

function TimePanel({
  p,
  cyc,
  cmp,
  keep,
  showAllOrgs,
  setShowAllOrgs,
  router,
}: {
  p: Programme;
  cyc: Programme[];
  cmp: Programme | null;
  keep: (c: Case) => boolean;
  showAllOrgs: boolean;
  setShowAllOrgs: (v: boolean) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const withResults = cyc.filter((c) => hasResults(c)).sort((a, b) => +a.cycle - +b.cycle);
  if (withResults.length < 2) {
    return (
      <div className="card">
        <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
          <Tile icon="chart-line-up" size="lg" />
          <div className="h4">Trends appear after the second cycle</div>
          <p className="muted small">There is only one cycle with published results so far.</p>
        </div>
      </div>
    );
  }
  const b = benchOf(p);
  const pubOf = (c: Programme) => casesOf(c.id).filter((x) => x.stage === "Published" && x.score != null && keep(x));
  const avgPts: [number, number][] = withResults.map((c, i) => [i, avg(pubOf(c).map((x) => x.score ?? 0)) ?? 0]);
  const metPts: [number, number][] = withResults.map((c, i) => [i, pct(pubOf(c).filter((x) => (x.score ?? 0) >= b).length, pubOf(c).length)]);
  const xt: [number, string][] = withResults.map((c, i) => [i, c.cycle]);
  const l1 = chLine({ w: 460, h: 210, x: { min: -0.2, max: withResults.length - 0.8, ticks: xt }, y: { min: 0, max: 100, ticks: [0, 50, 100] }, series: [{ name: "Average score", col: CH.brand, pts: avgPts, dots: true, end: String(avgPts[avgPts.length - 1][1]) }], refY: [{ v: b, label: `Benchmark ${b}` }], label: "Average score per cycle" });
  const l2 = chLine({ w: 460, h: 210, x: { min: -0.2, max: withResults.length - 0.8, ticks: xt }, y: { min: 0, max: 100, ticks: [0, 50, 100], unit: "%" }, series: [{ name: "Met the benchmark", col: CH.ok, pts: metPts, dots: true, end: `${metPts[metPts.length - 1][1]}%` }], label: "Share meeting the benchmark per cycle" });

  const base = cmp && hasResults(cmp) ? cmp : withResults[withResults.length - 2];
  const top = hasResults(p) ? p : withResults[withResults.length - 1];
  const bc = pubOf(base);
  const tc = pubOf(top);
  const secs = top.qset.sections.filter((s) => s.on);
  const secRows = secs.map((s) => ({ l: s.name, a: avg(bc.map((c) => caseScore(c, s.id)).filter((v): v is number => v != null)) ?? undefined, b: avg(tc.map((c) => caseScore(c, s.id)).filter((v): v is number => v != null)) ?? undefined }));
  const both = tc
    .filter((c) => bc.some((x) => x.org === c.org))
    .map((c) => ({ l: orgName(c.org), a: bc.find((x) => x.org === c.org)?.score ?? 0, b: c.score ?? 0, org: c.org }))
    .sort((x, y) => x.b - x.a - (y.b - y.a));
  const shown = showAllOrgs ? both : both.slice(0, 10);
  const drop = both.filter((x) => x.b < x.a).length;

  const nc = (f: NonNullable<Case["findings"]>[number]) => ["MaNC", "MiNC"].includes(f.cls);
  const reps = top.qset.sections
    .filter((s) => s.on)
    .flatMap((s) => s.reqs)
    .map((r) => {
      const orgs = tc.filter((c) => (c.findings || []).some((f) => nc(f) && f.ref === r.ref) && bc.some((x) => x.org === c.org && (x.findings || []).some((f) => nc(f) && f.ref === r.ref)));
      return { r, orgs };
    })
    .filter((x) => x.orgs.length)
    .sort((a, b2) => b2.orgs.length - a.orgs.length);

  return (
    <>
      <div className="ch-grid2">
        <ChartCard title={`Average score ${avgPts[0][1]} → ${avgPts[avgPts.length - 1][1]} across ${withResults.length} cycles`} sub="Average score of published reports per cycle" chart={<Html html={l1} />} table={<MiniTable head={["Cycle", "Average score"]} rows={withResults.map((c, i) => [c.cycle, avgPts[i][1]])} />} testId="time-avg" />
        <ChartCard title={`${metPts[metPts.length - 1][1]}% met the benchmark in ${withResults[withResults.length - 1].cycle}, from ${metPts[0][1]}% in ${withResults[0].cycle}`} sub={`Share of organisations scoring ${b} or more`} chart={<Html html={l2} />} table={<MiniTable head={["Cycle", "Met the benchmark"]} rows={withResults.map((c, i) => [c.cycle, `${metPts[i][1]}%`])} />} testId="time-met" />
      </div>
      <div className="ch-grid2">
        <ChartCard title={`Section scores, ${base.cycle} → ${top.cycle}`} sub="Average section score in each cycle" chart={<Html html={chDots(secRows, { min: 0, max: 100, ref: b, key: [base.cycle, top.cycle] })} />} table={<MiniTable head={["Section", base.cycle, top.cycle]} rows={secRows.map((r) => [r.l, r.a ?? "—", r.b ?? "—"])} />} testId="time-sec" />
        <ChartCard
          title={`${drop} of ${both.length} organisations scored lower than in ${base.cycle}`}
          sub={`Score in ${base.cycle} and ${top.cycle} · biggest drops first`}
          chart={
            <>
              <Html html={chDots(shown, { min: 0, max: 100, ref: b, key: [base.cycle, top.cycle] })} />
              {both.length > 10 ? <button className="link-btn small" onClick={() => setShowAllOrgs(!showAllOrgs)}>{showAllOrgs ? "Show the first 10" : `Show all ${both.length}`}</button> : null}
            </>
          }
          table={<MiniTable head={["Organisation", base.cycle, top.cycle]} rows={both.map((x) => [x.l, x.a, x.b])} />}
          testId="time-org"
        />
      </div>
      <ChartCard
        title={reps.length ? `${reps.reduce((a, x) => a + x.orgs.length, 0)} repeat findings: the same gap in ${base.cycle} and ${top.cycle}` : "No repeat findings"}
        sub="A major or minor nonconformity on the same requirement in both cycles is the strongest sign a fix did not hold"
        chart={reps.length ? <Html html={chBars(reps.map((x) => ({ l: `${x.r.ref} ${x.r.t}`, v: x.orgs.length, col: CH.ai })))} /> : <p className="small muted">None.</p>}
        table={<MiniTable head={["Requirement", "Organisations"]} rows={reps.map((x) => [`${x.r.ref} ${x.r.t}`, x.orgs.length])} />}
        testId="time-rep"
      />
      {void router}
    </>
  );
}

function RemediationPanel({ p, cs, router }: { p: Programme; cs: Case[]; router: ReturnType<typeof useRouter> }) {
  const pub = cs.filter((c) => c.stage === "Published");
  const all = pub.flatMap((c) => (c.findings || []).filter((f) => f.cls !== "OFI").map((f) => ({ f, c })));
  const closed = all.filter((x) => x.f.status === "Closed");
  const open = all.filter((x) => !["Closed", "Noted"].includes(x.f.status ?? ""));
  const over = open.filter((x) => fdOverdue(x.f, TODAY));
  const pubDateRaw = pub[0]?.published || p.closes;
  const pubISO = (() => {
    const d = new Date(pubDateRaw);
    return isNaN(d.getTime()) ? p.closes : d.toISOString().slice(0, 10);
  })();
  const closeDateOf = (x: { f: NonNullable<Case["findings"]>[number] }) => x.f.closedDate || null;
  const days = closed.map((x) => (closeDateOf(x) ? daysFrom(pubISO, closeDateOf(x)!) : null)).filter((v): v is number => v != null && v >= 0);

  const months = Math.max(1, Math.min(20, Math.ceil(daysFrom(pubISO, TODAY) / 30)));
  const pts: [number, number][] = [];
  for (let m = 0; m <= months; m++) pts.push([m, closed.filter((x) => closeDateOf(x) && daysFrom(pubISO, closeDateOf(x)!) <= m * 30).length]);
  const line = chLine({
    w: 560,
    h: 230,
    x: { min: 0, max: months, ticks: pts.filter(([m]) => m % Math.max(1, Math.ceil(months / 8)) === 0).map(([m]) => [m, `Month ${m}`]) },
    y: { min: 0, max: Math.max(4, all.length), ticks: [0, Math.round(all.length / 2), all.length] },
    series: [{ name: "Closed", col: CH.ok, pts, end: `${closed.length} closed` }],
    refY: [{ v: all.length, label: `${all.length} raised`, col: CH.quiet }],
    label: "Findings closed since publishing",
  });
  const clsList = ["MaNC", "MiNC", "OBS"];
  const byCls = clsList.map((k) => {
    const l = over.filter((x) => x.f.cls === k);
    return { l: `${k} · ${fcOf(k).name}`, v: l.length, col: k === "MaNC" ? CH.bad : k === "MiNC" ? CH.warn : CH.brand };
  });
  const firmIds = [...new Set(all.map((x) => x.c.firm))].filter(Boolean);
  const byFirm = firmIds
    .map((id) => {
      const l = all.filter((x) => x.c.firm === id);
      const cl = l.filter((x) => x.f.status === "Closed");
      const d = cl.map((x) => (closeDateOf(x) ? daysFrom(pubISO, closeDateOf(x)!) : null)).filter((v): v is number => v != null);
      return { id, n: l.length, cl: cl.length, d: avg(d) };
    })
    .sort((a, b2) => b2.n - a.n);

  return (
    <>
      <div className="ktiles">
        <KTile label="Findings raised" value={all.length} sub="Not counting opportunities for improvement" testId="k-raised" />
        <KTile label="Closed" value={<>{closed.length}<small> · {pct(closed.length, all.length)}%</small></>} sub="Verified by the firm and closed" testId="k-closed" />
        <KTile label="Still open" value={open.length} sub={`${over.length} overdue`} testId="k-open" />
        <KTile label="Average days to close" value={avg(days) ?? "—"} sub="From publishing to closing" />
      </div>
      <div className="ch-grid2">
        <ChartCard title={`${closed.length} of ${all.length} findings closed since ${fmtD(pubISO)}`} sub="Cumulative findings closed by month since the reports were published" chart={<Html html={line} />} table={<MiniTable head={["Month", "Closed"]} rows={pts.map(([m, v]) => [`Month ${m}`, v])} />} testId="rem-line" />
        <ChartCard title={over.length ? `${over.length} fixes are overdue` : "No overdue fixes"} sub="Open findings past their fix-by date, by class" chart={<Html html={chBars(byCls)} />} table={<MiniTable head={["Class", "Overdue"]} rows={byCls.map((x) => [x.l, x.v])} />} testId="rem-over" />
      </div>
      <div className="card p0">
        <div className="tbl-tools"><div className="grow"><div className="h4">By firm</div><div className="cap muted">The firm that raised the findings verifies the fixes</div></div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Firm</th><th className="num">Findings</th><th>Closed</th><th className="num">Average days to close</th></tr></thead>
            <tbody>
              {byFirm.map((r) => {
                const f = FIRMS.find((x) => x.id === r.id);
                return (
                  <tr key={r.id} className="click" onClick={() => router.push(`/regulator/firms/${r.id}`)}>
                    <td><div className="org"><span className="logo s32" style={{ background: f?.color }}>{f?.initials}</span><div><div className="nm">{f?.name}</div><div className="sub">{f?.types.join(" · ")}</div></div></div></td>
                    <td className="num tnum">{r.n}</td>
                    <td style={{ width: 220 }}><div className="pbar"><div className="bar"><i style={{ width: `${pct(r.cl, r.n)}%` }} /></div><span className="cap tnum">{r.cl}/{r.n}</span></div></td>
                    <td className="num tnum">{r.d ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
