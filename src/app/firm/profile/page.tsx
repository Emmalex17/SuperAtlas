"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Button, Chip, Tile, Field, Tabs, AlertBox, ChartCard, KTile, MiniTable, Stars } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { FIRMS, STATUS_TONE, FIRM_ACCREDITATIONS, ACC_APPS, FIRM_RULES, saveFirmProfile, declareFirmClient, removeFirmClient } from "@/lib/mockData";
import { CASES, RATINGS, progOf, avg, avg1, pct, type Case } from "@/lib/cases";
import { chLine, CH } from "@/lib/charts";

const FIRM_ID = "deloitte";

type Tab = "details" | "performance" | "accreditations" | "people" | "clients";

function reportDays(c: Case): number | null {
  if (c.reportDays != null) return c.reportDays;
  const a = c.submitted ? new Date(c.submitted.split(",")[0]) : null;
  const b = c.reportAt ? new Date(c.reportAt) : null;
  if (!a || !b || isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 864e5));
}

export default function FirmProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const firm = FIRMS.find((f) => f.id === FIRM_ID)!;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("details");

  const accs = FIRM_ACCREDITATIONS[firm.id] ?? [];
  const apps = ACC_APPS.filter((a) => a.firm === firm.id);

  // Details tab
  const [web, setWeb] = useState(firm.web ?? "");
  const [city, setCity] = useState(firm.city ?? "");
  const [email, setEmail] = useState(firm.email ?? "");

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    saveFirmProfile(firm, { web, city, email });
    toast("Profile saved");
    bump();
  }

  // Advisory clients tab
  const [clOrg, setClOrg] = useState("");
  const [clService, setClService] = useState("");
  const [clSince, setClSince] = useState("");

  function submitClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clOrg) {
      toast("Enter the organisation", "bad");
      return;
    }
    declareFirmClient(firm, { org: clOrg, service: clService, since: clSince });
    setClOrg("");
    setClService("");
    setClSince("");
    bump();
    toast("Client declared");
  }

  // Performance data (self-service mode: no peer comparison, names hidden on ratings)
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

  return (
    <AppShell workspace="firm">
      <ProfileHeader
        initials={firm.initials}
        color={firm.color}
        name={firm.name}
        statusChip={<Chip tone={STATUS_TONE[firm.status] ?? "neu"}>{firm.status}</Chip>}
        metaLine={<div className="row wrap gap6">{firm.types.map((t) => <Chip key={t} tone="neu">{t}</Chip>)}</div>}
        web={firm.web}
        location={firm.city}
        tabs={
          <Tabs
            items={[
              { id: "details", label: "Details" },
              { id: "performance", label: "Performance" },
              { id: "accreditations", label: "Accreditations" },
              { id: "people", label: "Assessors", count: (firm.people ?? []).length },
              { id: "clients", label: "Advisory clients", count: (firm.clients ?? []).length },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      />

      {tab === "details" && (
        <form className="card col gap16" style={{ maxWidth: 760 }} onSubmit={submitDetails}>
          <div className="grid g2" style={{ gap: 14 }}>
            <Field label="Firm name" htmlFor="mf-name">
              <input className="inp" id="mf-name" value={firm.name} readOnly />
            </Field>
            <Field label="Website" htmlFor="mf-web">
              <input className="inp" id="mf-web" value={web} onChange={(e) => setWeb(e.target.value)} />
            </Field>
            <Field label="Offices" htmlFor="mf-city">
              <input className="inp" id="mf-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Contact email" htmlFor="mf-em">
              <input className="inp" id="mf-em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <div className="row end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      )}

      {tab === "performance" && (
        <>
          <div className="ktiles">
            <KTile label="Reports published" value={pub.length} sub={`${years.length} cycle${years.length === 1 ? "" : "s"}`} />
            <KTile label="Average rating" value={rs.length ? <>{avg1(rs.map((r) => r.stars))}<small> / 5</small></> : "—"} sub={`${rs.length} rating${rs.length === 1 ? "" : "s"}`} testId="fp-rating" />
            <KTile label="Days to report" value={avg(days) ?? "—"} sub="From submission to signed report, on average" />
            <KTile label="Outcomes changed by NITDA" value={`${pct(ov, outs.length)}%`} sub={`${ov} of ${outs.length} outcomes`} testId="fp-override" />
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
            <div className="card col gap12">
              <div className="h4">What organisations said</div>
              <p className="cap muted">Names are hidden. NITDA sees who said what.</p>
              {rs.length ? (
                [...rs].slice(-5).reverse().map((r) => (
                  <div key={r.id} className="oa">
                    <Stars n={r.stars} />
                    <p className="small" style={{ marginTop: 4 }}>{r.comment || "No comment"}</p>
                  </div>
                ))
              ) : (
                <p className="small muted">No ratings yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "accreditations" && (
        <div className="card col gap12">
          <div className="row">
            <span className="h4 grow">Accreditations</span>
            <Button size="sm" icon="certificate" testId="go-apply" onClick={() => router.push("/firm/apply")}>Apply for accreditation</Button>
          </div>
          {accs.map((a) => (
            <div key={a.ref} className="file">
              <Tile icon="certificate" tone={a.status === "Active" ? "ok" : "warn"} size="sm" />
              <div className="grow">
                <div className="strong">{a.type}</div>
                <div className="cap muted">{a.ref} · {a.from} to {a.to}</div>
              </div>
              <Chip tone={STATUS_TONE[a.status] ?? "neu"}>{a.status}</Chip>
            </div>
          ))}
          {apps.filter((a) => a.status !== "Accredited").map((a) => (
            <div key={a.id} className="file">
              <Tile icon="hourglass" tone={a.status === "Info requested" ? "warn" : "info"} size="sm" />
              <div className="grow">
                <div className="strong">{a.type} application</div>
                <div className="cap muted">
                  Submitted {a.submitted}{a.status === "In review" ? ` · decision due ${a.due}` : ""}
                </div>
                {a.infoMsg && a.status === "Info requested" ? <div className="cap" style={{ marginTop: 4 }}>NITDA: {a.infoMsg}</div> : null}
              </div>
              <Chip tone={STATUS_TONE[a.status] ?? "neu"}>{a.status}</Chip>
            </div>
          ))}
          {!accs.length && !apps.length ? (
            <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
              <Tile icon="certificate" size="lg" />
              <div className="h4">No accreditations yet</div>
              <p className="muted small">Apply by firm type. NITDA reviews your documents and assessors.</p>
            </div>
          ) : null}
        </div>
      )}

      {tab === "people" && (
        <div className="card p0">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Expires</th></tr></thead>
              <tbody>
                {(firm.people ?? []).map((p) => (
                  <tr key={p.name}>
                    <td>
                      <div className="strong">{p.name}</div>
                      <div className="cap muted">{p.title}</div>
                    </td>
                    <td><Chip tone={p.role === "Lead auditor" ? "brand" : "neu"}>{p.role}</Chip></td>
                    <td className="small">{p.cred}</td>
                    <td className="small muted">{p.expires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "clients" && (
        <div className="card col gap12">
          <AlertBox tone="info" title="Why we ask" body={`You cannot be assigned to assess an organisation you advised in the last ${FIRM_RULES.conflictMonths} months. Declaring clients lets SuperAtlas block conflicts automatically.`} />
          {(firm.clients ?? []).length ? (
            (firm.clients ?? []).map((c, i) => (
              <div key={c.org} className="file">
                <span className="logo s32" style={{ background: c.color }}>{c.initials}</span>
                <div className="grow">
                  <div className="strong">{c.org}</div>
                  <div className="cap muted">{c.service} · since {c.since}</div>
                </div>
                <button className="icon-btn" aria-label="Remove" onClick={() => { removeFirmClient(firm, i); bump(); }}>
                  <Icon name="trash" />
                </button>
              </div>
            ))
          ) : (
            <p className="small muted">No advisory clients declared.</p>
          )}
          <form className="card flat tight col gap12" onSubmit={submitClient}>
            <b className="small">Declare a client</b>
            <div className="grid g3" style={{ gap: 12 }}>
              <input className="inp" placeholder="Organisation" value={clOrg} onChange={(e) => setClOrg(e.target.value)} />
              <input className="inp" placeholder="Service provided" value={clService} onChange={(e) => setClService(e.target.value)} />
              <input className="inp" placeholder="Since, e.g. Feb 2026" value={clSince} onChange={(e) => setClSince(e.target.value)} />
            </div>
            <div className="row end">
              <Button type="submit" variant="secondary" icon="plus">Declare client</Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
