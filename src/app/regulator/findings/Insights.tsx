"use client";

import { ChartCard, KTile, MiniTable } from "@/components/ui";
import { chStack, chLine, CH } from "@/lib/charts";
import { allFindings, avg, fmtD, effDue, TODAY, type CaseFinding } from "@/lib/cases";
import { ORGANISATIONS } from "@/lib/mockData";

function Html({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 864e5);
}

export default function FindingsInsights() {
  const all = allFindings().filter((x) => x.f.cls !== "OFI");
  const open = all.filter((x) => !["Closed", "Noted"].includes(x.f.status ?? ""));
  const over = open.filter((x) => effDue(x.f) && ["Open", "In progress"].includes(x.f.status ?? "") && effDue(x.f)! < TODAY);
  const closed = all.filter((x) => x.f.status === "Closed" && x.f.closedDate);

  const pubISO = (x: { c: { published?: string } }) => {
    if (!x.c.published) return null;
    const d = new Date(x.c.published);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  const ttc = (k: string) => {
    const days = closed
      .filter((x) => x.f.cls === k && pubISO(x))
      .map((x) => daysBetween(pubISO(x)!, x.f.closedDate!))
      .filter((v) => v >= 0);
    return avg(days);
  };

  const clsList = ["MaNC", "MiNC", "OBS"];
  const colOf: Record<string, string> = { MaNC: CH.bad, MiNC: CH.warn, OBS: CH.brand };
  const types = [...new Set(open.map((x) => ORGANISATIONS.find((o) => o.id === x.c.org)?.type).filter((t): t is string => !!t))].sort();
  const stackRows = types.map((t) => ({
    l: t,
    vals: clsList.map((k) => ({ n: open.filter((x) => x.f.cls === k && ORGANISATIONS.find((o) => o.id === x.c.org)?.type === t).length })),
    total: open.filter((x) => ORGANISATIONS.find((o) => o.id === x.c.org)?.type === t).length,
  }));
  const stack = chStack(
    stackRows,
    clsList.map((k) => ({ l: k, col: colOf[k] }))
  );

  const ends: string[] = [];
  for (let m = 7; m >= 0; m--) {
    const d = new Date("2026-10-01T12:00:00");
    d.setMonth(d.getMonth() - m);
    d.setDate(0);
    ends.push(d.toISOString().slice(0, 10));
  }
  ends.push(TODAY);
  const overAt = (d: string) =>
    all.filter((x) => {
      const due = effDue(x.f);
      const pub = pubISO(x) ?? "";
      return due && due < d && (!x.f.closedDate || x.f.closedDate > d) && (x.f.status !== "Closed" || x.f.closedDate) && pub <= d;
    }).length;
  const pts: [number, number][] = ends.map((d, i) => [i, overAt(d)]);
  const line = chLine({
    w: 560,
    h: 210,
    x: { min: 0, max: ends.length - 1, ticks: ends.map((d, i) => [i, i === ends.length - 1 ? "Today" : new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { month: "short" })]) },
    y: { min: 0, max: Math.max(5, ...pts.map((p) => p[1])), ticks: [0, Math.max(5, ...pts.map((p) => p[1]))] },
    series: [{ name: "Overdue fixes", col: CH.bad, pts, end: String(pts[pts.length - 1][1]) }],
    label: "Overdue fixes at each month end",
  });

  const majorOverdue = (f: CaseFinding) => f.cls === "MaNC";

  return (
    <>
      <div className="ktiles">
        <KTile label="Open findings" value={open.length} sub="Across all programmes" testId="fi-open" />
        <KTile label="Overdue" value={over.length} sub={`${over.filter((x) => majorOverdue(x.f)).length} major`} testId="fi-over" />
        <KTile label="Closed" value={closed.length} sub="All time" />
        <KTile label="Days to close a major" value={ttc("MaNC") ?? "—"} sub={`Minor ${ttc("MiNC") ?? "—"} · observation ${ttc("OBS") ?? "—"}`} />
      </div>
      <div className="ch-grid2">
        <ChartCard title="Open findings by category and class" sub="Current open findings" chart={<Html html={stack} />} table={<MiniTable head={["Category", ...clsList]} rows={types.map((t) => [t, ...clsList.map((k) => open.filter((x) => x.f.cls === k && ORGANISATIONS.find((o) => o.id === x.c.org)?.type === t).length)])} />} testId="fi-cat" />
        <ChartCard title={`${over.length} fixes overdue today`} sub="Overdue fixes at the end of each month" chart={<Html html={line} />} table={<MiniTable head={["Month end", "Overdue"]} rows={ends.map((d, i) => [fmtD(d), pts[i][1]])} />} testId="fi-trend" />
      </div>
    </>
  );
}
