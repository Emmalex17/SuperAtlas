"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MyHero } from "@/components/MyHero";
import { Chip, CompChip, StatusChip, Button, Tile } from "@/components/ui";
import { Scorecard, type ScorecardData } from "@/components/Scorecard";
import { myCases, progOf, caseProgress, compStatus, benchOf, latestResult, NC_OPEN, fmtD } from "@/lib/cases";
import { mySeries, orgExposure, LV_TONE, buildOrgScorecard, type ExposureItem } from "@/lib/enforcement";
import { ORGANISATIONS, FIRMS, ensureOrgOnboard } from "@/lib/mockData";
import { getSession } from "@/lib/auth";
import { taskTotal, orgTodo } from "@/lib/tasks";

const ORG_ID = "zenith";
const ORG_STEPS: [string, string][] = [
  ["profile", "Organisation profile"],
  ["logo", "Logo"],
  ["officers", "Key officers"],
  ["people", "Invite colleagues"],
  ["group", "Group links"],
];

export default function OrganisationDashboard() {
  const router = useRouter();
  const account = getSession();
  const firstName = account?.first ?? account?.name ?? "";
  const [scorecardOpen, setScorecardOpen] = useState(false);

  const org = ORGANISATIONS.find((o) => o.id === ORG_ID);
  const onboard = org ? ensureOrgOnboard(org) : null;
  const doneSteps = onboard ? ORG_STEPS.filter(([k]) => onboard[k as keyof typeof onboard]).length : ORG_STEPS.length;

  const sers = mySeries(ORG_ID);
  const ex: ExposureItem[] = orgExposure(ORG_ID, "organisation");
  const hi = ex.filter((e) => e.lv === "High").length;
  const cases = myCases(ORG_ID).filter((c) => c.stage !== "Published");

  const top = account
    ? orgTodo(ORG_ID)
        .slice(0, 3)
        .map((x) => ({ icon: x.icon, title: x.title, due: x.due, href: x.href }))
    : [];
  const totalTasks = account ? taskTotal(account) : 0;

  function scorecardData(): ScorecardData | null {
    return org ? buildOrgScorecard(org) : null;
  }

  return (
    <AppShell workspace="organisation" crumbs={[{ label: "My dashboard" }]}>
      <MyHero
        entity={org ? { name: org.name, initials: org.initials, color: org.color } : undefined}
        firstName={firstName}
        line={`Supervised by NITDA as ${org?.type ?? ""}${sers.length ? `. Overall: ${(latestResult(ORG_ID, sers[0].id) ? compStatus(latestResult(ORG_ID, sers[0].id)) : "Not assessed").toLowerCase()}${hi ? `, with ${hi} high exposure item${hi === 1 ? "" : "s"}` : ""}.` : ". No published results yet."}`}
        top={top}
        totalTasks={totalTasks}
        actions={
          <>
            <Button variant="ghost-light" size="sm" icon="export" onClick={() => setScorecardOpen(true)} testId="export-scorecard">Export scorecard</Button>
            <Button variant="ghost-light" size="sm" icon="shield-check" onClick={() => router.push("/organisation/compliance")}>Open compliance</Button>
          </>
        }
      />

      {doneSteps < ORG_STEPS.length ? (
        <div className="card col gap12 setup-card">
          <div className="row">
            <div className="grow">
              <div className="h4">Finish setting up</div>
              <div className="cap muted">{doneSteps} of {ORG_STEPS.length} done</div>
            </div>
            <Button size="sm" iconRight="arrow-right" onClick={() => router.push("/organisation/welcome")} testId="continue-setup">Continue setup</Button>
          </div>
        </div>
      ) : null}

      {sers.length ? (
        <>
          <div className="row">
            <span className="h4 grow">Compliance</span>
            <Button variant="tertiary" size="sm" onClick={() => router.push("/organisation/compliance")}>Open compliance</Button>
          </div>
          <div className="comp-cards">
            {sers.map((sr) => {
              const c = latestResult(ORG_ID, sr.id);
              if (!c) return null;
              const b = benchOf(progOf(c.prog));
              const st = compStatus(c);
              const left = (c.findings ?? []).filter(NC_OPEN).length;
              const all = (c.findings ?? []).filter((f) => ["MaNC", "MiNC"].includes(f.cls)).length;
              return (
                <button key={sr.id} type="button" className="comp-card" onClick={() => router.push(`/organisation/compliance/${encodeURIComponent(sr.id)}`)} data-test={`cc-${sr.id}`}>
                  <div className="row top"><span className="grow strong">{sr.name}</span><CompChip status={st} /></div>
                  <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
                    <span className="metric tnum">{c.score}</span>
                    <span className="cap muted">/ 100 · benchmark {b} · {progOf(c.prog).cycle}</span>
                  </div>
                  <div className="cc-bar"><i style={{ width: `${c.score}%`, background: (c.score ?? 0) < b ? "var(--bad-icon)" : "var(--brand-500)" }} /><em style={{ left: `${b}%` }} /></div>
                  <div className="cap muted">{left ? `${left} nonconformit${left === 1 ? "y" : "ies"} to fix` : all ? "All nonconformities fixed" : "No findings"}</div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="col gap16">
        <div className="card p0 col">
          <div className="tbl-tools">
            <div className="grow">
              <div className="h4">Regulatory exposure</div>
              <div className="cap muted">What could draw action from NITDA</div>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => router.push("/organisation/exposure")}>View all</Button>
          </div>
          <div className="list">
            {ex.length ? (
              ex.slice(0, 6).map((e, i) => (
                <button key={i} className="list-row" onClick={() => router.push(e.go)}>
                  <Chip tone={LV_TONE[e.lv]}>{e.lv}</Chip>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="strong small ell" style={{ display: "block" }}>{e.t}</span>
                    <span className="cap muted ell" style={{ display: "block" }}>{e.why}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="col" style={{ alignItems: "center", padding: "16px 20px" }}>
                <Tile icon="shield-check" size="lg" />
                <div className="h4">Nothing exposed</div>
                <p className="muted small">No open findings, late returns or notices.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p0">
          <div className="tbl-tools"><span className="h4 grow">Your obligations</span><Button variant="tertiary" size="sm" onClick={() => router.push("/organisation/obligations")}>View all</Button></div>
          {cases.length ? (
            <div className="list">
              {cases.map((c) => {
                const p = progOf(c.prog);
                const fm = FIRMS.find((f) => f.id === c.firm);
                return (
                  <button key={c.id} className="list-row" onClick={() => router.push("/organisation/obligations")}>
                    <Tile icon="list-checks" size="sm" />
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="strong" style={{ display: "block" }}>{p.name}</span>
                      <span className="cap muted">Due {fmtD(c.due)} · {fm ? fm.name : "no firm yet"}</span>
                    </span>
                    <StatusChip status={c.stage} />
                    <span style={{ width: 140 }}>
                      <div className="pbar"><div className="bar"><i style={{ width: `${caseProgress(c)}%` }} /></div></div>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="col" style={{ alignItems: "center", padding: 20 }}>
              <Tile icon="list-checks" size="lg" />
              <div className="h4">Nothing due</div>
              <p className="muted small">Programmes appear here when NITDA opens one that applies to you.</p>
            </div>
          )}
        </div>
      </div>

      <Scorecard open={scorecardOpen} onClose={() => setScorecardOpen(false)} data={scorecardOpen ? scorecardData() : null} />
    </AppShell>
  );
}
