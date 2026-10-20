"use client";

import { use, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { CASES, progOf, caseScore, bandOf, outTone, schemeOf, qsetReqs, fcOf, fmtD, markOpened } from "@/lib/cases";
import { FIRMS, ORGANISATIONS } from "@/lib/mockData";

const TODAY = "2026-10-19";

export default function OrgReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = CASES.find((x) => x.id === id);
  const published = c && c.stage === "Published" ? c : undefined;

  useEffect(() => {
    if (published) markOpened(published, TODAY);
  }, [published]);

  if (!published) {
    return (
      <AppShell workspace="organisation">
        <PageHead title="Report" />
        <div className="card">
          <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
            <Icon name="file-text" />
            <div className="h4">No published report</div>
            <p className="muted small">Reports appear here when NITDA publishes them.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const p = progOf(published.prog);
  const sch = schemeOf(p.scheme);
  const reqs = qsetReqs(p.qset);
  const sc = published.score ?? caseScore(published);
  const f = FIRMS.find((x) => x.id === published.firm);
  const o = ORGANISATIONS.find((x) => x.id === published.org);

  return (
    <AppShell workspace="organisation">
      <div className="rep-hero">
        <div className="grow">
          <div className="overline" style={{ color: "var(--brand-200)" }}>Published {published.published || ""} · {p.name}</div>
          <h1 className="serif">{o?.name}</h1>
          <p>Assessed by {f ? f.name : "—"}. Approved by NITDA.</p>
        </div>
        <div className="rep-score"><span>{sc ?? "—"}</span><b>{bandOf(sch, sc)}</b></div>
      </div>
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">By section</div>
            {p.qset.sections.filter((s) => s.on).map((s) => {
              const ss = caseScore(published, s.id);
              return (
                <div className="row small" key={s.id}>
                  <span className="grow">{s.name}</span>
                  <span style={{ width: 280 }}><div className="pbar"><div className="bar"><i style={{ width: `${ss || 0}%` }} /></div><span className="cap tnum">{ss == null ? "—" : ss}</span></div></span>
                </div>
              );
            })}
          </div>
          <div className="card p0">
            <div className="tbl-tools">
              <span className="h4 grow">Outcomes</span>
              <div className="row wrap gap6">
                {sch.levels.map(([l, , t]) => {
                  const n = Object.values(published.outcomes).filter((x) => x.o === l).length;
                  return n ? <Chip key={l} tone={t}>{n} {l}</Chip> : null;
                })}
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Requirement</th><th>Outcome</th><th>Assessor note</th></tr></thead>
                <tbody>
                  {reqs.map((r) => {
                    const oc = published.outcomes[r.ref] ?? {};
                    return (
                      <tr key={r.ref}>
                        <td className="wrap"><span className="mono small" style={{ color: "var(--brand-600)" }}>{r.ref}</span> <span className="small">{r.t}</span></td>
                        <td>{oc.o ? <Chip tone={outTone(sch, oc.o)}>{oc.o}</Chip> : "—"}</td>
                        <td className="wrap small muted">{oc.override ? oc.override.reason : oc.note || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap8">
            <div className="row"><span className="h4 grow">Findings</span><span className="count">{published.findings.length}</span></div>
            {published.findings.length ? (
              published.findings.map((fd) => (
                <div className="row small top" key={fd.id}>
                  <span className={`chip ${fcOf(fd.cls).tone}`}>{fd.cls}</span>
                  <div className="grow">
                    <div>{fd.title}</div>
                    <div className="cap muted">{fd.ref}{fd.due ? ` · fix by ${fmtD(fd.due)}` : ""}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="small muted">No findings.</p>
            )}
          </div>
          <div className="card col gap8">
            <Button variant="outline" block icon="download-simple">Download report (PDF)</Button>
            <p className="cap muted">The report and your answers are kept for 7 years.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
