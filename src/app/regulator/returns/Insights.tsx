"use client";

import { ChartCard, KTile, MiniTable } from "@/components/ui";
import { chStack, chBars, CH } from "@/lib/charts";
import { pct } from "@/lib/cases";
import { RETURN_TEMPLATES, FILINGS, tplOf, isFiled, TODAY, type Filing } from "@/lib/returns";
import { ORGANISATIONS } from "@/lib/mockData";

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ReturnsInsights() {
  const tps = RETURN_TEMPLATES.filter((t) => t.status === "Active");
  const due = FILINGS.filter((f) => tplOf(f.tpl).status === "Active" && f.due <= TODAY);

  const groups: { t: (typeof tps)[number]; pk: string; fs: Filing[] }[] = [];
  tps.forEach((t) => {
    const pks = [...new Set(due.filter((f) => f.tpl === t.id).map((f) => f.pkey))].sort();
    pks.forEach((pk) => groups.push({ t, pk, fs: due.filter((f) => f.tpl === t.id && f.pkey === pk) }));
  });
  const parts = [
    { l: "On time", col: CH.ok },
    { l: "Late", col: CH.warn },
    { l: "Not filed", col: CH.bad },
  ];
  const rows = groups.map((g) => {
    const on = g.fs.filter((f) => isFiled(f) && !f.lateBy);
    const late = g.fs.filter((f) => isFiled(f) && f.lateBy);
    const nf = g.fs.filter((f) => !isFiled(f));
    return { l: `${g.t.code} ${g.fs[0].period}`, vals: [on, late, nf].map((l) => ({ n: l.length })), total: `${pct(on.length, g.fs.length)}%` };
  });
  const stack = chStack(rows, parts);

  const filed = due.filter(isFiled);
  const queried = filed.filter((f) => f.queries.length);
  const late = due.filter((f) => f.lateBy || !isFiled(f));
  const byOrg: Record<string, Filing[]> = {};
  late.forEach((f) => { byOrg[f.org] = (byOrg[f.org] ?? []).concat(f); });
  const repOrgs = Object.keys(byOrg).sort((a, b) => byOrg[b].length - byOrg[a].length);
  const orgName = (id: string) => ORGANISATIONS.find((o) => o.id === id)?.name ?? id;
  const lateBars = chBars(repOrgs.slice(0, 10).map((id) => ({ l: orgName(id), v: byOrg[id].length, col: CH.warn })));

  return (
    <>
      <div className="ktiles">
        <KTile label="Filings due so far" value={due.length} />
        <KTile label="Filed on time" value={`${pct(filed.filter((f) => !f.lateBy).length, due.length || 1)}%`} sub={`${filed.filter((f) => !f.lateBy).length} of ${due.length}`} />
        <KTile label="Late or not filed" value={late.length} sub="Past the due date" testId="ri-late" />
        <KTile label="Queried" value={`${pct(queried.length, filed.length || 1)}%`} sub={`${queried.length} of ${filed.length} filed returns`} />
      </div>
      <div className="ch-grid2">
        <ChartCard
          title="Filing on time by return and period"
          sub="Click a segment to see who"
          chart={<Html html={stack} />}
          table={<MiniTable head={["Return and period", ...parts.map((p) => p.l)]} rows={rows.map((r) => [r.l, ...r.vals.map((v) => v.n)])} />}
          testId="ri-period"
        />
        <ChartCard
          title={repOrgs.length ? `${repOrgs.length} organisations late at least once` : "Nobody late"}
          sub="Late or not filed, by organisation"
          chart={<Html html={lateBars} />}
          testId="ri-orgs"
        />
      </div>
    </>
  );
}
