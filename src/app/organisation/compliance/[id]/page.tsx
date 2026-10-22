"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CompChip, Chip, ChartCard, KTile, StatusChip, Button, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { chLine, chDots, CH } from "@/lib/charts";
import { CASES, SERIES, progOf, caseScore, compStatus, benchOf, schemeOf, outTone, fcOf, latestResult, prevResult, NC_OPEN } from "@/lib/cases";
import { mySeries, peerAvg, peerSec } from "@/lib/enforcement";
import { FIRMS } from "@/lib/mockData";

const ORG_ID = "zenith";

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function OrgComplianceProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const sid = decodeURIComponent(id);

  const sr = SERIES.find((s) => s.id === sid) ?? mySeries(ORG_ID)[0];
  if (!sr) {
    return (
      <AppShell workspace="organisation">
        <div className="card"><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="shield-check" size="lg" /><div className="h4">No results yet</div></div></div>
      </AppShell>
    );
  }

  const c = latestResult(ORG_ID, sr.id)!;
  const p = progOf(c.prog);
  const b = benchOf(p);
  const sch = schemeOf(p.scheme);
  const pv = prevResult(ORG_ID, sr.id);
  const firm = FIRMS.find((f) => f.id === c.firm);

  const mine = CASES.filter((x) => x.org === ORG_ID && x.stage === "Published" && x.score != null && progOf(x.prog).series === sr.id).sort((a, x) => +progOf(a.prog).cycle - +progOf(x.prog).cycle);
  const pa = peerAvg(ORG_ID, c.prog);
  const peerPts: [number, number][] = mine.map((x) => [+progOf(x.prog).cycle, peerAvg(ORG_ID, x.prog).a]).filter((x): x is [number, number] => x[1] != null);
  const yrs = mine.map((x) => +progOf(x.prog).cycle);

  const line =
    mine.length > 1
      ? chLine({
          w: 560,
          h: 220,
          x: { min: yrs[0] - 0.2, max: yrs[yrs.length - 1] + 0.2, ticks: yrs.map((y) => [y, String(y)]) },
          y: { min: 0, max: 100, ticks: [0, 50, 100] },
          series: [
            ...(peerPts.length ? [{ name: "Category average (anonymised)", col: CH.prev, dash: true, w: 1.75, pts: peerPts, end: `avg ${peerPts[peerPts.length - 1][1]}` }] : []),
            { name: "Your score", col: CH.brand, dots: true, pts: mine.map((x) => [+progOf(x.prog).cycle, x.score!]), end: String(c.score) },
          ],
          refY: [{ v: b, label: `Benchmark ${b}` }],
          label: "Your score across cycles",
        })
      : "";

  const secs = p.qset.sections
    .filter((s) => s.on)
    .map((s) => ({ s, v: caseScore(c, s.id), peer: peerSec(ORG_ID, c.prog, s.id) }))
    .sort((a, x) => (a.v ?? 999) - (x.v ?? 999));
  const dots = chDots(
    secs.map((x) => ({ l: x.s.name, a: x.peer ?? undefined, b: x.v ?? undefined })),
    { min: 0, max: 100, ref: b, key: ["Category average", "Your score"] }
  );

  const finds = c.findings ?? [];
  const left = finds.filter(NC_OPEN).length;

  return (
    <AppShell workspace="organisation" crumbs={[{ label: "Compliance", href: "/organisation/compliance" }, { label: sr.name }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">Programme · {p.name}</div>
          <div className="rh-title"><h1 className="h1">{sr.name}</h1><CompChip status={compStatus(c)} /></div>
          <div className="rh-meta">Latest result published {c.published ?? ""} · assessed by {firm?.name ?? "—"}</div>
        </div>
        <div className="rh-act"><Button variant="secondary" size="sm" onClick={() => router.push(`/organisation/report/${c.id}`)}>Open the report</Button></div>
      </div>

      <div className="ktiles">
        <KTile label="Your score" value={c.score ?? "—"} delta={pv ? c.score! - pv.score! : undefined} vs={pv ? `vs ${progOf(pv.prog).cycle}` : undefined} sub={`Benchmark ${b}`} />
        <KTile label="Category average" value={pa.a ?? "—"} sub={pa.a != null ? `Anonymised · ${pa.n} organisations` : "Not shown: fewer than 5 in your category"} testId="k-peer" />
        <KTile label="Nonconformities left" value={left} sub={`${finds.filter((f) => ["MaNC", "MiNC"].includes(f.cls)).length - left} fixed and closed`} />
        <KTile label="Sections below the benchmark" value={secs.filter((x) => x.v != null && x.v < b).length} sub={`of ${secs.length}`} />
      </div>

      <div className="ch-grid2">
        <ChartCard
          title={`${c.score} in ${p.cycle}${pv ? `, ${c.score! >= pv.score! ? "up" : "down"} from ${pv.score}` : ""}`}
          sub="Your score in each cycle, with the benchmark and the anonymised category average"
          chart={mine.length > 1 ? <Html html={line} /> : <p className="small muted">Your trend appears after a second cycle.</p>}
          testId="oc-trend"
        />
        <ChartCard title="Sections against your category" sub="Your section score and the anonymised category average" chart={<Html html={dots} />} testId="oc-secs" />
      </div>

      <div className="card col gap12">
        <div>
          <div className="h4">Trace a gap to its fix</div>
          <div className="cap muted">Weakest sections first. Open a finding to see or update its action plan.</div>
        </div>
        {secs.map(({ s, v }) => {
          const weak = v != null && v < b;
          return (
            <details key={s.id} open={weak} className="trace" data-test={`tr-${s.id}`}>
              <summary>
                <span className="grow strong small">{s.name}</span>
                {weak ? <Chip tone="bad">Below benchmark</Chip> : null}
                <span className="tnum strong" style={{ width: 40, textAlign: "right" }}>{v ?? "—"}</span>
                <Icon name="caret-down" />
              </summary>
              {s.reqs.map((r) => {
                const oc = c.outcomes[r.ref] ?? {};
                const fs = finds.filter((f) => f.ref === r.ref);
                return (
                  <div className="tr-req" key={r.ref}>
                    <div className="row top">
                      <span className="mono small" style={{ color: "var(--brand-600)" }}>{r.ref}</span>
                      <span className="grow small">{r.t}</span>
                      {oc.o ? <Chip tone={outTone(sch, oc.o)}>{oc.o}</Chip> : null}
                    </div>
                    {fs.map((f) => (
                      <button key={f.id} className="tr-f" onClick={() => router.push(`/organisation/findings/${f.id}`)} data-test={`trf-${f.id}`}>
                        <span className={`chip ${fcOf(f.cls).tone}`}>{f.cls}</span>
                        <span className="grow">{f.title}</span>
                        <StatusChip status={f.status ?? ""} />
                        {f.plan ? <span className="cap muted">Owner {f.plan.owner}</span> : f.status === "Open" ? <span className="cap" style={{ color: "var(--warn-fg)" }}>No plan yet</span> : null}
                        <Icon name="caret-right" />
                      </button>
                    ))}
                  </div>
                );
              })}
            </details>
          );
        })}
      </div>
    </AppShell>
  );
}
