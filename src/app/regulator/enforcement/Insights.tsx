"use client";

import { ChartCard, KTile, MiniTable } from "@/components/ui";
import { chBars, CH } from "@/lib/charts";
import { avg } from "@/lib/cases";
import { ENF_CASES, ACTION_TYPES, OPEN_ENF, ENF_TONE, naira, type EnforcementCase } from "@/lib/enforcement";

const STAGES: EnforcementCase["status"][] = ["Awaiting sign-off", "Notice issued", "Response received", "Awaiting payment", "Closed", "Escalated"];
const TONE_COL: Record<string, string> = { warn: CH.warn, info: CH.brand, neu: CH.neu, ai: CH.ai };

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 864e5);
}

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function EnforcementInsights() {
  const cs = ENF_CASES;
  const closed = cs.filter((c) => c.status === "Closed" && c.decision);
  const days = closed.map((c) => daysBetween(c.opened, c.decision!.when)).filter((v) => v >= 0);
  const byOrg: Record<string, number> = {};
  cs.forEach((c) => { byOrg[c.org] = (byOrg[c.org] ?? 0) + 1; });
  const repeat = Object.keys(byOrg).filter((o) => byOrg[o] > 1);
  const waiting = cs.filter((c) => c.status === "Response received").length;

  const byStage = STAGES.map((st) => ({ l: st, v: cs.filter((c) => c.status === st).length, col: TONE_COL[ENF_TONE[st] ?? "neu"] ?? CH.brand })).filter((x) => x.v);
  const byType = ACTION_TYPES.map((t) => ({ l: t.name, v: cs.filter((c) => c.type === t.id).length, col: CH.ai }));

  const paid = cs.filter((c) => c.penalty?.paid).reduce((a, c) => a + (c.penalty?.amount ?? 0), 0);
  const due = cs.filter((c) => c.penalty && !c.penalty.paid).reduce((a, c) => a + (c.penalty?.amount ?? 0), 0);

  const stageBars = chBars(byStage);
  const typeBars = chBars(byType);

  return (
    <>
      <div className="ktiles">
        <KTile label="Open cases" value={cs.filter((c) => OPEN_ENF.includes(c.status)).length} sub={`${waiting} waiting for your decision`} testId="ek-open" />
        <KTile label="Closed" value={closed.length} sub="All time" testId="ek-closed" />
        <KTile label="Average days to close" value={avg(days) ?? "—"} sub="From opening to decision" />
        <KTile label="Repeat organisations" value={repeat.length} sub="More than one case" testId="ek-repeat" />
      </div>
      <div className="ch-grid2">
        <ChartCard
          title={`${waiting} case${waiting === 1 ? "" : "s"} waiting for a decision`}
          sub="Cases by stage"
          chart={<Html html={stageBars} />}
          table={<MiniTable head={["Stage", "Cases"]} rows={byStage.map((x) => [x.l, x.v])} />}
          testId="enf-stage"
        />
        <ChartCard
          title={`Penalties: ${naira(paid)} paid, ${naira(due)} outstanding`}
          sub="Cases by action"
          chart={<Html html={typeBars} />}
          table={<MiniTable head={["Action", "Cases"]} rows={byType.map((x) => [x.l, x.v])} />}
          testId="enf-type"
        />
      </div>
    </>
  );
}
