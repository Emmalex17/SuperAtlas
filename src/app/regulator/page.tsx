"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Tile, TrendChip, Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { lineChart, spark } from "@/lib/charts";
import { getSession } from "@/lib/auth";
import { DASH, ORGANISATIONS, CLASS_REQS, ACC_APPS } from "@/lib/mockData";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function RegulatorDashboard() {
  const session = getSession();
  const firstName = session?.first ?? session?.name ?? "";

  const pendingVerification = ORGANISATIONS.filter((o) => o.status === "Pending verification").length;
  const pendingClass = CLASS_REQS.filter((r) => r.status === "Pending").length;
  const pendingAcc = ACC_APPS.filter((a) => a.status === "In review").length;
  const expiredInvites = ORGANISATIONS.filter((o) => o.status === "Invite expired").length;

  const todo: { icon: string; label: string; n: number; href: string }[] = [
    { icon: "seal-check", label: "Organisations to verify", n: pendingVerification, href: "/regulator/organisations" },
    { icon: "git-diff", label: "Classification changes", n: pendingClass, href: "/regulator/organisations" },
    { icon: "certificate", label: "Accreditation applications", n: pendingAcc, href: "/regulator/firms" },
    { icon: "envelope-simple", label: "Expired invitations", n: expiredInvites, href: "/regulator/organisations" },
  ];

  return (
    <AppShell workspace="regulator">
      <section className="dash-hero">
        <div className="overline" style={{ color: "var(--brand-200)" }}>Supervision overview · {DASH.quarter}</div>
        <h1 className="serif">{greeting()}, {firstName}</h1>
        <p>42 organisations under supervision. Compliance strength is up {DASH.strengthDelta} points this quarter; 3 organisations need attention.</p>
      </section>

      <div className="kpi-row">
        <div className="kpi">
          <div className="row gap8"><Tile icon="chart-line-up" size="sm" /><span className="overline">Compliance strength</span></div>
          <div className="kpi-n tnum">{DASH.strength}</div>
          <div><TrendChip delta={DASH.strengthDelta} /></div>
          <div className="cap muted">Portfolio average · 42 organisations</div>
        </div>
        <div className="kpi">
          <div className="row gap8"><Tile icon="list-checks" size="sm" /><span className="overline">Assessment coverage</span></div>
          <div className="kpi-n tnum">{DASH.coverage}%</div>
          <div><span className="chip neu"><Icon name="minus" />No change</span></div>
          <div className="cap muted">Requirements assessed this period</div>
        </div>
        <div className="kpi">
          <div className="row gap8"><Tile icon="flag" size="sm" /><span className="overline">Open findings</span></div>
          <div className="kpi-n tnum">{DASH.findings}</div>
          <div><span className="chip bad"><Icon name="trend-up" />5 more than last quarter</span></div>
          <div className="cap muted">{DASH.findingsHigh} high severity</div>
        </div>
        <div className="kpi">
          <div className="row gap8"><Tile icon="clock" size="sm" /><span className="overline">Overdue actions</span></div>
          <div className="kpi-n tnum">{DASH.overdue}</div>
          <div><span className="chip bad"><Icon name="trend-up" />2 more than last quarter</span></div>
          <div className="cap muted">Across {DASH.overdueOrgs} organisations</div>
        </div>
      </div>

      <div className="todo-strip">
        {todo.map((t) => (
          <Link key={t.label} href={t.href} className={`todo ${t.n ? "" : "zero"}`}>
            <Tile icon={t.icon} tone={t.n ? "brand" : ""} size="sm" />
            <span className="grow">
              <span className="cap muted" style={{ display: "block" }}>Waiting for you</span>
              <b>{t.label}</b>
            </span>
            <span className="todo-n tnum">{t.n}</span>
            <Icon name="caret-right" />
          </Link>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="row top">
            <div className="grow">
              <div className="h4">Compliance strength · all organisations</div>
              <div className="cap muted">Average score per quarter · band = middle 50% of organisations · Information Security Regulation 2026</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="metric tnum">{DASH.strength}</div>
              <div className="cap" style={{ color: "var(--ok-fg)" }}>+{DASH.strengthDelta} pts vs last quarter</div>
            </div>
          </div>
          <div
            style={{ marginTop: 12 }}
            dangerouslySetInnerHTML={{
              __html: lineChart({ w: 680, h: 240, series: [{ vals: DASH.series, col: "#4f46e5" }], band: [DASH.band.map((b) => b[0]), DASH.band.map((b) => b[1])] }),
            }}
          />
          <div className="row gap16 cap muted">
            <span className="row gap6"><i className="lg-dot" style={{ background: "#4f46e5" }} />Average</span>
            <span className="row gap6"><i className="lg-dot" style={{ background: "#c7d2fe" }} />Middle 50%</span>
          </div>
        </div>
        <div className="card col gap12">
          <div className="row between"><span className="h4">Needs attention</span><span className="cap muted">Biggest drops</span></div>
          {DASH.attention.map((a) => (
            <div key={a.name} className="att">
              <Tile icon="buildings" tone={a.tone === "bad" ? "bad" : "warn"} size="sm" />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="strong ell">{a.name}</div>
                <div className="cap muted ell">{a.sub}</div>
              </div>
              <span dangerouslySetInnerHTML={{ __html: spark(a.vals, "#4f46e5", a.tone === "bad" ? "#b42318" : "#6b6f81") }} />
            </div>
          ))}
          <Link href="/regulator/organisations" className="small strong">View all organisations <Icon name="arrow-right" /></Link>
        </div>
      </div>

      <div className="card p0">
        <div className="tbl-tools">
          <div className="grow">
            <div className="h2">Organisations</div>
            <div className="cap muted">Compliance strength per organisation · Information Security Regulation 2026 · {DASH.quarter}</div>
          </div>
          <Button variant="tertiary" icon="export">Export</Button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Organisation</th><th>Trend (8 quarters)</th><th className="num">Score</th><th>Change</th><th className="num">Coverage</th><th className="num">Open findings</th><th>Next step</th><th /></tr>
            </thead>
            <tbody>
              {DASH.rows.map((r) => (
                <tr key={r.name}>
                  <td>
                    <div className="row gap8">
                      <Tile icon="buildings" size="sm" />
                      <div>
                        <div className="strong">{r.name}</div>
                        <div className="cap muted">{r.type}</div>
                      </div>
                    </div>
                  </td>
                  <td dangerouslySetInnerHTML={{ __html: spark(r.vals, "#4f46e5", r.delta > 0 ? "#1e7a46" : r.delta < 0 ? "#b42318" : "#6b6f81") }} />
                  <td className="num"><b className="serif" style={{ fontSize: 17 }}>{r.score}</b></td>
                  <td><TrendChip delta={r.delta} /></td>
                  <td className="num tnum">{r.coverage}%</td>
                  <td className="num tnum">{r.findings}</td>
                  <td className="small muted">{r.next}</td>
                  <td><Icon name="caret-right" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">Scores come from programmes and assessments. Sample organisations shown.</div>
      </div>
    </AppShell>
  );
}
