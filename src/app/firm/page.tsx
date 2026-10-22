"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MyHero } from "@/components/MyHero";
import { ChartCard, MiniTable, StatusChip, Button } from "@/components/ui";
import { chBars, CH } from "@/lib/charts";
import { myEngs, engGroup, allFindings, avg1, progOf, fmtD, RATINGS, TODAY, type Case } from "@/lib/cases";
import { FIRMS, ORGANISATIONS, ensureFirmOnboard } from "@/lib/mockData";
import { getSession } from "@/lib/auth";
import { myTasks, taskTotal, dueText } from "@/lib/tasks";

const FIRM_ID = "deloitte";
const FIRM_STEPS: [string, string][] = [
  ["profile", "Firm profile"],
  ["logo", "Logo"],
  ["people", "Lead auditor and assessors"],
  ["clients", "Advisory clients"],
];

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 864e5);
}

export default function FirmDashboard() {
  const router = useRouter();
  const account = getSession();
  const firstName = account?.first ?? account?.name ?? "";

  const firm = FIRMS.find((f) => f.id === FIRM_ID);
  const onboard = firm ? ensureFirmOnboard(firm) : null;
  const doneSteps = onboard ? FIRM_STEPS.filter(([k]) => onboard[k as keyof typeof onboard]).length : FIRM_STEPS.length;

  const cs = myEngs(FIRM_ID);
  const act = cs.filter((c) => ["Requests", "Active", "Submitted"].includes(engGroup(c)));
  const req = cs.filter((c) => engGroup(c) === "Requests");
  const fix = allFindings().filter((x) => x.c.firm === FIRM_ID && x.f.status === "Fix submitted");
  const rs = RATINGS.filter((r) => r.firm === FIRM_ID);
  const soon = act.filter((c) => c.due && daysBetween(TODAY, c.due) <= 45).sort((a, b) => a.due.localeCompare(b.due));

  const groups = (["Requests", "Active", "Submitted", "Completed"] as const).map((g) => ({
    l: g,
    v: cs.filter((c) => engGroup(c) === g).length,
    col: g === "Requests" ? CH.warn : g === "Completed" ? CH.ok : CH.brand,
  }));
  const stageBars = chBars(groups);

  const people = (firm?.people ?? []).filter((p) => p.status !== "Removed");
  const load = people
    .map((p) => ({ l: p.name, lh: `${p.name} (${p.role})`, v: act.filter((c) => c.lead === p.name).length, col: act.filter((c) => c.lead === p.name).length > 4 ? CH.bad : CH.brand }))
    .sort((a, b) => b.v - a.v);
  const loadBars = chBars(load);

  function goCase(c: Case) {
    if (["Submitted", "Assessing", "In preview", "Signed off", "Returned"].includes(c.stage)) router.push(`/firm/assess/${c.id}`);
    else router.push("/firm/engagements");
  }

  const top = account
    ? myTasks(account)
        .filter((g) => g.items.length)
        .slice(0, 3)
        .map((g) => ({ icon: g.icon, title: g.say(g.items.length), href: g.href }))
    : [];
  const totalTasks = account ? taskTotal(account) : 0;

  return (
    <AppShell workspace="firm" crumbs={[{ label: "My dashboard" }]}>
      <MyHero
        entity={firm ? { name: firm.name, initials: firm.initials, color: firm.color } : undefined}
        firstName={firstName}
        line={firm ? (firm.status === "Accredited" || firm.status === "Renewal due" ? `Accredited by NITDA for ${firm.types.join(" and ")}.` : `Your accreditation application is ${firm.status.toLowerCase()} with NITDA.`) : ""}
        top={top}
        totalTasks={totalTasks}
        actions={
          <>
            <Button variant="ghost-light" size="sm" icon="kanban" onClick={() => router.push("/firm/engagements")}>Engagements</Button>
            <Button variant="ghost-light" size="sm" icon="chart-line-up" onClick={() => router.push("/firm/profile")}>Performance</Button>
          </>
        }
      />

      {doneSteps < FIRM_STEPS.length ? (
        <div className="card col gap12 setup-card">
          <div className="row">
            <div className="grow">
              <div className="h4">Finish setting up</div>
              <div className="cap muted">{doneSteps} of {FIRM_STEPS.length} done</div>
            </div>
            <Button size="sm" iconRight="arrow-right" onClick={() => router.push("/firm/welcome")} testId="continue-setup">Continue setup</Button>
          </div>
        </div>
      ) : null}

      <div className="ktiles">
        <div className="ktile" data-test="fk-act">
          <span className="kt-l">Active engagements</span>
          <span className="kt-v tnum">{act.length}</span>
          <span className="kt-s muted">{cs.filter((c) => engGroup(c) === "Submitted").length} submitted and waiting for you</span>
        </div>
        <div className="ktile" data-test="fk-req">
          <span className="kt-l">Requests</span>
          <span className="kt-v tnum">{req.length}</span>
          <span className="kt-s muted">{req.length ? "Accept or decline" : "None waiting"}</span>
        </div>
        <div className="ktile" data-test="fk-fix">
          <span className="kt-l">Fixes to verify</span>
          <span className="kt-v tnum">{fix.length}</span>
          <span className="kt-s muted">Organisations sent proof</span>
        </div>
        <div className="ktile">
          <span className="kt-l">Average rating</span>
          <span className="kt-v tnum">{rs.length ? <>{avg1(rs.map((r) => r.stars))}<small> / 5</small></> : "—"}</span>
          <span className="kt-s muted">{rs.length} rating{rs.length === 1 ? "" : "s"} from organisations</span>
        </div>
      </div>

      <div className="ch-grid2">
        <div className="card p0 col">
          <div className="tbl-tools">
            <div className="grow">
              <div className="h4">Due soon</div>
              <div className="cap muted">Active engagements due in the next 45 days</div>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => router.push("/firm/engagements")}>All engagements</Button>
          </div>
          <div className="list">
            {soon.length ? (
              soon.slice(0, 6).map((c) => {
                const o = ORGANISATIONS.find((x) => x.id === c.org);
                const due = dueText(c.due);
                return (
                  <button key={c.id} className="list-row" onClick={() => goCase(c)} data-test={`fsoon-${c.id}`}>
                    <span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="strong small ell" style={{ display: "block" }}>{o?.name}</span>
                      <span className="cap muted">{progOf(c.prog).name} · {due ? due.text : fmtD(c.due)}</span>
                    </span>
                    <StatusChip status={c.stage} />
                  </button>
                );
              })
            ) : (
              <div style={{ padding: "12px 20px" }} className="small muted">Nothing due soon</div>
            )}
          </div>
        </div>
        <ChartCard
          title={load.some((x) => x.v > 4) ? `${load.filter((x) => x.v > 4).length} people have more than 4 active engagements` : "Team workload is even"}
          sub="Active engagements per person, as lead"
          chart={<Html html={loadBars} />}
          table={<MiniTable head={["Person", "Active engagements"]} rows={load.map((x) => [x.l, x.v])} />}
          testId="f-load"
        />
      </div>

      <ChartCard
        title={`${act.length} active, ${groups[3].v} completed`}
        sub="Engagements by stage"
        chart={<Html html={stageBars} />}
        testId="f-stage"
      />
    </AppShell>
  );
}
