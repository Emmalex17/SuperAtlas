"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Button, Chip, Tile, Kv, Tabs, AlertBox, Tag, ChartCard, KTile, MiniTable, Stars } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { STATUS_TONE, FIRM_ACCREDITATIONS, ACC_APPS, AUDIT, FIRM_RULES, FIRMS, ORGANISATIONS, TENANT, type Firm, type AccApplication } from "@/lib/mockData";
import { CASES, RATINGS, progOf, caseOf, avg, avg1, pct, type Case } from "@/lib/cases";
import { chLine, chBars, CH } from "@/lib/charts";

type Tab = "overview" | "accreditations" | "people" | "performance" | "assignments" | "activity";

function reportDays(c: Case): number | null {
  if (c.reportDays != null) return c.reportDays;
  const a = c.submitted ? new Date(c.submitted.split(",")[0]) : null;
  const b = c.reportAt ? new Date(c.reportAt) : null;
  if (!a || !b || isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 864e5));
}

function leadOf(f: Firm) {
  return f.people?.find((p) => p.role === "Lead auditor");
}

function AccReview({ app, firm }: { app: AccApplication; firm: Firm }) {
  const toast = useToast();
  const [from, setFrom] = useState("2026-11-01");
  const [to, setTo] = useState("2027-10-31");
  const missing = app.docs.filter(([, ok]) => !ok).length;
  return (
    <div className="card col gap16">
      <div className="row">
        <div className="grow">
          <div className="overline">Application</div>
          <div className="h3">{app.type}</div>
          <div className="cap muted">Submitted {app.submitted} · decision due {app.due}</div>
        </div>
        <Chip tone={STATUS_TONE[app.status] ?? "info"}>{app.status}</Chip>
      </div>
      {app.status === "Info requested" ? <div className="note"><Icon name="chat-circle-dots" />You asked: &ldquo;{app.infoMsg ?? ""}&rdquo; Waiting for the firm.</div> : null}
      <div className="grid g2" style={{ gap: 16 }}>
        <div className="col gap8">
          <div className="h4">Documents</div>
          {app.docs.map(([d, ok]) => (
            <div key={d} className="file">
              <Tile icon="file-text" tone={ok ? "" : "warn"} size="sm" />
              <div className="grow">
                <div className="strong small">{d}</div>
                <div className="cap muted">{ok ? "Uploaded · integrity checked" : "Missing"}</div>
              </div>
              <Chip tone={ok ? "ok" : "warn"} icon={ok ? "check" : "warning"}>{ok ? "Received" : "Missing"}</Chip>
            </div>
          ))}
        </div>
        <div className="col gap8">
          <div className="h4">Nominated assessors</div>
          {app.assessors.map(([n, c, ok]) => (
            <div key={n} className="file">
              <span className="av">{n.split(" ").map((w) => w[0]).join("")}</span>
              <div className="grow">
                <div className="strong small">{n}</div>
                <div className="cap muted">{c}</div>
              </div>
              <Chip tone={ok ? "ok" : "warn"}>{ok ? "Meets criteria" : "Not yet"}</Chip>
            </div>
          ))}
          <p className="cap muted">{app.decl}</p>
        </div>
      </div>
      {missing ? <AlertBox tone="warn" title={`${missing} document${missing > 1 ? "s are" : " is"} missing`} body="Ask for the missing documents before accrediting." /> : null}
      <div className="row wrap" style={{ alignItems: "flex-end", gap: 12 }}>
        <div className="field">
          <label htmlFor="ac-from">Accredited from</label>
          <input className="inp" id="ac-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ac-to">Accredited until</label>
          <input className="inp" id="ac-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <span className="cap muted" style={{ paddingBottom: 10 }}>{FIRM_RULES.renewal} months, set in Settings</span>
        <span className="grow" />
        <Button variant="danger-soft" onClick={() => toast(`${firm.name}'s application declined`)}>Decline</Button>
        <Button variant="secondary" onClick={() => toast("Asked the firm for more information")}>Ask for more information</Button>
        <Button icon="seal-check" disabled={missing > 0} onClick={() => toast(`${firm.name} accredited`, "ok", "seal-check")}>Accredit firm</Button>
      </div>
    </div>
  );
}

export function FirmProfileClient({ firm }: { firm: Firm }) {
  const toast = useToast();
  const params = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);

  const accs = FIRM_ACCREDITATIONS[firm.id] ?? [];
  const apps = ACC_APPS.filter((a) => a.firm === firm.id);
  const openApps = apps.filter((a) => a.status === "In review" || a.status === "Info requested");
  const people = firm.people ?? [];
  const activity = AUDIT.filter((a) => a.record.includes(firm.name.split(" ")[0]));
  const lead = leadOf(firm);

  let actions = null;
  if (firm.status === "Suspended") actions = <Button icon="seal-check" onClick={() => toast(`${firm.name} reinstated`, "ok", "seal-check")}>Reinstate</Button>;
  else if (firm.status === "In review") actions = <Button onClick={() => setTab("accreditations")}>Review application</Button>;
  else if (firm.status === "Accredited" || firm.status === "Renewal due") actions = (
    <>
      <Button variant="outline" onClick={() => toast(`${firm.name} suspended`)}>Suspend</Button>
      <Button icon="arrow-clockwise" onClick={() => toast(`${firm.name}'s accreditation renewed`, "ok", "arrow-clockwise")}>Renew accreditation</Button>
    </>
  );

  const tabItems: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "performance", label: "Performance" },
    { id: "accreditations", label: "Accreditations", count: openApps.length || undefined },
    { id: "people", label: "People", count: people.length },
    { id: "assignments", label: "Assignments" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <AppShell workspace="regulator">
      <Link href="/regulator/firms" className="small strong">
        <Icon name="arrow-left" /> Assurance firms
      </Link>

      <ProfileHeader
        initials={firm.initials}
        color={firm.color}
        name={firm.name}
        statusChip={<Chip tone={STATUS_TONE[firm.status] ?? "neu"}>{firm.status}</Chip>}
        metaLine={<div className="row wrap gap6">{firm.types.map((t) => <Tag key={t}>{t}</Tag>)}</div>}
        web={firm.web}
        location={firm.city}
        actions={actions}
        tabs={<Tabs items={tabItems} active={tab} onChange={setTab} />}
      />

      {tab === "overview" && (
        <div className="grid side">
          <div className="col gap16">
            <div className="card col gap12">
              <div className="h4">Firm details</div>
              <Kv
                pairs={[
                  ["Firm name", firm.name],
                  ["Website", firm.web ?? "—"],
                  ["Offices", firm.city],
                  ["Firm types", firm.types.join(", ")],
                  ["Accredited since", firm.since],
                  ["Renews", firm.renews],
                ]}
              />
            </div>
            {firm.status === "Suspended" ? (
              <AlertBox tone="bad" title="Suspended" body={firm.suspendReason ?? "See the audit trail for the reason."} />
            ) : (firm.clients?.length ?? 0) > 0 ? (
              <AlertBox tone="info" title="Independence" body={`${firm.name.split(" ")[0]} has declared ${firm.clients!.length} advisory client${firm.clients!.length > 1 ? "s" : ""}. It cannot be assigned to assess them for ${FIRM_RULES.conflictMonths} months.`} />
            ) : null}
          </div>
          <div className="col gap16">
            <div className="card col gap8">
              <div className="h4">At a glance</div>
              {[
                ["Organisations assigned", firm.assigned],
                ["Lead auditor", lead ? lead.name : "—"],
                ["Assessors", people.filter((p) => p.role === "Assessor").length],
                ["Active accreditations", accs.filter((a) => a.status === "Active").length],
              ].map(([k, v]) => (
                <div key={k as string} className="row between small">
                  <span className="muted">{k}</span>
                  <b className="tnum">{v}</b>
                </div>
              ))}
            </div>
            {openApps.length ? (
              <div className="card col gap8">
                <AlertBox tone="info" title={`${openApps.length} application${openApps.length > 1 ? "s" : ""} to review`} body={openApps.map((a) => a.type).join(", ")} actions={<Button size="sm" onClick={() => setTab("accreditations")}>Review</Button>} />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {tab === "performance" && <FirmPerformanceTab firm={firm} />}

      {tab === "accreditations" && (
        <>
          {openApps.map((a) => <AccReview key={a.id} app={a} firm={firm} />)}
          <div className="card col gap12">
            <div className="h4">Accreditations</div>
            {accs.length ? (
              accs.map((a) => (
                <div key={a.ref} className="file">
                  <Tile icon="certificate" tone={a.status === "Active" ? "ok" : a.status === "Suspended" ? "bad" : "warn"} size="sm" />
                  <div className="grow">
                    <div className="strong">{a.type}</div>
                    <div className="cap muted">{a.ref} · {a.from} to {a.to}</div>
                  </div>
                  <Chip tone={STATUS_TONE[a.status] ?? "neu"}>{a.status}</Chip>
                </div>
              ))
            ) : (
              <p className="small muted">No accreditations yet.</p>
            )}
          </div>
        </>
      )}

      {tab === "people" && (
        <div className="card p0">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Credential expiry</th><th>Status</th></tr></thead>
              <tbody>
                {people.length ? (
                  people.map((p) => (
                    <tr key={p.name}>
                      <td>
                        <div className="row">
                          <span className="av">{p.initials}</span>
                          <div>
                            <div className="strong">{p.name}</div>
                            <div className="cap muted">{p.title}</div>
                          </div>
                        </div>
                      </td>
                      <td><Chip tone={p.role === "Lead auditor" ? "brand" : "neu"}>{p.role}</Chip></td>
                      <td className="small">{p.cred}</td>
                      <td className={`small ${p.expires === "Expired" ? "" : "muted"}`}>{p.expires === "Expired" ? <Chip tone="bad">Expired</Chip> : p.expires}</td>
                      <td><Chip tone={STATUS_TONE[p.status] ?? "neu"}>{p.status}</Chip></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                        <Tile icon="users" size="lg" />
                        <div className="h4">No people yet</div>
                        <p className="muted small">The firm adds its lead auditor and assessors during setup.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "assignments" && (
        <div className="card">
          <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
            <Tile icon="kanban" size="lg" />
            <div className="h4">Assignments arrive with programmes</div>
            <p className="muted small">When programmes launch, the organisations this firm is assigned to will be listed here, with independence checks.</p>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="card">
          <div className="timeline">
            {activity.length ? (
              activity.map((a, i) => (
                <div key={i} className="tl">
                  <span className="av">{a.initials}</span>
                  <div>
                    <b>{a.action}</b>
                    <div className="cap muted">{a.who} · {a.when}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                <Tile icon="clock-counter-clockwise" size="lg" />
                <div className="h4">No activity yet</div>
                <p className="muted small">Actions on this firm appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

/** The regulator's view of a firm's track record — published reports, ratings from organisations,
 * turnaround time, how often outcomes were overridden, and how it compares with peers. The
 * prototype's firmPerf(f, 'reg') (c5.js). */
function FirmPerformanceTab({ firm }: { firm: Firm }) {
  const router = useRouter();
  const pub = CASES.filter((c) => c.firm === firm.id && c.stage === "Published");
  const rs = RATINGS.filter((r) => r.firm === firm.id);
  const outs = pub.flatMap((c) => Object.values(c.outcomes || {}));
  const ov = outs.filter((o) => o.override).length;
  const days = pub.map(reportDays).filter((v): v is number => v != null);
  const years = [...new Set(pub.map((c) => +progOf(c.prog).cycle))].sort((a, b) => a - b);
  const byYear = years.map((y) => {
    const cs = pub.filter((c) => +progOf(c.prog).cycle === y);
    const r = rs.filter((x) => cs.some((c) => c.id === x.case));
    const yOuts = cs.flatMap((c) => Object.values(c.outcomes || {}));
    return { y, n: cs.length, r: avg1(r.map((x) => x.stars)), d: avg(cs.map(reportDays).filter((v): v is number => v != null)), ov: pct(yOuts.filter((o) => o.override).length, yOuts.length) };
  });
  const peers = FIRMS.filter((x) => RATINGS.some((r) => r.firm === x.id))
    .map((x) => ({ l: x.name, v: avg1(RATINGS.filter((r) => r.firm === x.id).map((r) => r.stars)) ?? 0, col: x.id === firm.id ? CH.brand : CH.prev }))
    .sort((a, b) => b.v - a.v);

  return (
    <>
      <div className="ktiles">
        <KTile label="Reports published" value={pub.length} sub={`${years.length} cycle${years.length === 1 ? "" : "s"}`} />
        <KTile label="Average rating" value={rs.length ? <>{avg1(rs.map((r) => r.stars))}<small> / 5</small></> : "—"} sub={`${rs.length} rating${rs.length === 1 ? "" : "s"}`} testId="fp-rating" />
        <KTile label="Days to report" value={avg(days) ?? "—"} sub="From submission to signed report, on average" />
        <KTile label={`Outcomes changed by ${TENANT.short}`} value={`${pct(ov, outs.length)}%`} sub={`${ov} of ${outs.length} outcomes`} testId="fp-override" />
      </div>

      <div className="ch-grid2">
        <ChartCard
          title={byYear.length ? `Average rating ${byYear.filter((b) => b.r != null).map((b) => b.r).join(" → ")}` : "No ratings yet"}
          sub="Average organisation rating per cycle"
          chart={
            years.length > 1 ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: chLine({
                    w: 560,
                    h: 200,
                    x: { min: years[0] - 0.2, max: years[years.length - 1] + 0.2, ticks: years.map((y) => [y, String(y)]) },
                    y: { min: 1, max: 5, ticks: [1, 3, 5] },
                    series: [{ name: "Average rating", col: CH.warn, dots: true, pts: byYear.filter((b) => b.r != null).map((b) => [b.y, b.r!] as [number, number]), end: String(byYear[byYear.length - 1]?.r ?? "") }],
                    label: "Average rating by cycle",
                  }),
                }}
              />
            ) : (
              <p className="small muted">Trends appear after a second cycle.</p>
            )
          }
          table={<MiniTable head={["Cycle", "Reports", "Average rating", "Days to report", "Outcomes changed"]} rows={byYear.map((b) => [b.y, b.n, b.r ?? "—", b.d ?? "—", `${b.ov}%`])} />}
        />
        <ChartCard title="Compared with other firms" sub="Average rating from organisations · click to open" chart={<div dangerouslySetInnerHTML={{ __html: chBars(peers, { max: 5 }) }} />} />
      </div>

      <div className="card p0">
        <div className="tbl-tools">
          <div className="grow">
            <div className="h4">Ratings</div>
            <div className="cap muted">Newest first</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Organisation</th><th>Report</th><th>Rating</th><th>Comment</th></tr></thead>
            <tbody>
              {rs.length ? (
                [...rs].reverse().slice(0, 12).map((r) => {
                  const org = ORGANISATIONS.find((o) => o.id === r.org);
                  const c = caseOf(r.case);
                  return (
                    <tr key={r.id} className="click" onClick={() => router.push(`/regulator/organisations/${r.org}`)}>
                      <td>
                        {org ? (
                          <div className="org">
                            <span className="logo s32" style={{ background: org.color }}>{org.initials}</span>
                            <div className="nm">{org.name}</div>
                          </div>
                        ) : (
                          r.org
                        )}
                      </td>
                      <td className="small">{progOf(c?.prog).name}</td>
                      <td><Stars n={r.stars} /></td>
                      <td className="wrap small" style={{ maxWidth: 360 }}>{r.comment}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon="star" size="lg" />
                      <div className="h4">No ratings yet</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
