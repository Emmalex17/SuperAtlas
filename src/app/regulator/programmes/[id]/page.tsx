"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Tabs, Kv, Tile, AlertBox } from "@/components/ui";
import { Icon } from "@/lib/icons";
import {
  PROGRAMMES,
  progOf,
  regOfProg,
  casesOf,
  scopeOrgs,
  progStats,
  caseProgress,
  stageGroups,
  seriesOf,
  cyclesOf,
  qsetQs,
  schemeOf,
  fmtD,
  type Programme,
  type Case,
} from "@/lib/cases";
import { ORGANISATIONS, FIRMS, TENANT, catLabel } from "@/lib/mockData";

const PROG_STATUS_TONE: Record<string, "ok" | "warn" | "neu" | "info"> = { Open: "ok", "In review": "info", Closed: "neu", Draft: "neu", Scheduled: "warn" };
const STAGE_TONE: Record<string, "ok" | "warn" | "neu" | "info" | "bad"> = {
  Published: "ok", Approved: "ok", "Signed off": "ok",
  Answering: "info", Assessing: "info", "In preview": "info", Submitted: "info", "Report submitted": "info", "In review": "info", Scheduled: "info",
  "Firm to assign": "neu", "Firm to choose": "neu", "Firm approval": "warn", "Awaiting firm": "warn", Returned: "warn", "Held back": "warn",
};

function orgOf(id: string) {
  return ORGANISATIONS.find((o) => o.id === id);
}
function firmOf(id: string) {
  return FIRMS.find((f) => f.id === id);
}

type Tab = "overview" | "organisations" | "firms" | "questions" | "cycles" | "settings";

function OverviewTab({ p, cs }: { p: Programme; cs: Case[] }) {
  const groups = stageGroups(TENANT.short);
  const s = progStats(p);
  return (
    <>
      <div className="stage-row">
        {groups.map(([l, sts], i) => (
          <div className="stage-c" key={l}>
            <span className="cap muted">{l}</span>
            <b className="tnum">{cs.filter((c) => sts.includes(c.stage)).length}</b>
            {i < groups.length - 1 ? <span className="stage-ar"><Icon name="caret-right" /></span> : null}
          </div>
        ))}
      </div>
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap12">
            <div className="row"><span className="h4 grow">Progress</span><span className="cap muted">{s.done} of {s.n} submitted</span></div>
            <div className="pbar"><div className="bar"><i style={{ width: `${s.pct}%` }} /></div></div>
            <div className="tbl-wrap" style={{ margin: "0 -20px -20px" }}>
              <table className="tbl">
                <thead><tr><th>Organisation</th><th>Stage</th><th>Answered</th></tr></thead>
                <tbody>
                  {cs.length ? (
                    cs.slice(0, 6).map((c) => {
                      const o = orgOf(c.org);
                      const f = firmOf(c.firm);
                      return (
                        <tr key={c.id}>
                          <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{f ? f.name : "Needs a firm"}</div></div></div></td>
                          <td><Chip tone={STAGE_TONE[c.stage] ?? "neu"}>{c.stage}</Chip></td>
                          <td><div className="pbar"><div className="bar"><i style={{ width: `${caseProgress(c)}%` }} /></div><span className="cap tnum">{caseProgress(c)}%</span></div></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={3}><div className="col" style={{ alignItems: "center", padding: 24 }}><Icon name="buildings" /><div className="h4">No organisations yet</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap8">
            <div className="h4">Key dates</div>
            <Kv pairs={[["Opens", fmtD(p.opens)], ["Due", fmtD(p.closes)], ["Questions locked", p.locked || "At launch"]]} />
          </div>
          <div className="card col gap8">
            <div className="h4">Recent activity</div>
            <div className="act-feed">
              {p.activity.length ? (
                p.activity.slice(0, 6).map(([d, w, a], i) => (
                  <div className="act-i" key={i}>
                    <span className="av s24">{w.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase()}</span>
                    <div><div className="small"><b>{w}</b> {a}</div><div className="cap muted">{d}</div></div>
                  </div>
                ))
              ) : (
                <p className="small muted">Nothing yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function OrganisationsTab({ p, cs }: { p: Programme; cs: Case[] }) {
  return (
    <div className="card p0">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Organisation</th><th>Assurance firm</th><th>Stage</th><th>Answered</th><th>Due</th></tr></thead>
          <tbody>
            {cs.length ? (
              cs.map((c) => {
                const o = orgOf(c.org);
                const f = firmOf(c.firm);
                return (
                  <tr key={c.id}>
                    <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                    <td className="small">
                      {f ? (
                        <div className="row gap8"><span className="av s24" style={{ background: f.color }}>{f.initials}</span><div><div>{f.name}</div><div className="cap muted">{c.firmStatus}{c.lead ? ` · lead ${c.lead}` : ""}</div></div></div>
                      ) : c.reqFirm ? (
                        <div><div>{c.reqFirm.name}</div><div className="cap" style={{ color: "var(--warn-fg)" }}>Not accredited · approval needed</div></div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td><Chip tone={STAGE_TONE[c.stage] ?? "neu"}>{c.stage}</Chip></td>
                    <td><div className="pbar"><div className="bar"><i style={{ width: `${caseProgress(c)}%` }} /></div><span className="cap tnum">{caseProgress(c)}%</span></div></td>
                    <td className="small muted">{fmtD(c.due)}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={5}><div className="col" style={{ alignItems: "center", padding: 24 }}><Icon name="buildings" /><div className="h4">No organisations yet</div><p className="muted small">{p.status === "Scheduled" ? "Organisations are added when the programme opens." : "They are added when the programme opens."}</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FirmsTab({ cs }: { cs: Case[] }) {
  const router = useRouter();
  const ids = [...new Set(cs.map((c) => c.firm).filter(Boolean))];
  return (
    <div className="card p0">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Firm</th><th className="num">Organisations</th><th className="num">Accepted</th><th>Lead auditors</th></tr></thead>
          <tbody>
            {ids.length ? (
              ids.map((id) => {
                const f = firmOf(id);
                if (!f) return null;
                const mine = cs.filter((c) => c.firm === id);
                const leads = [...new Set(mine.map((c) => c.lead).filter(Boolean))];
                return (
                  <tr key={id} className="click" onClick={() => router.push(`/regulator/firms/${id}`)}>
                    <td><div className="org"><span className="logo s32" style={{ background: f.color }}>{f.initials}</span><div><div className="nm">{f.name}</div><div className="sub">{f.types.join(" · ")}</div></div></div></td>
                    <td className="num tnum">{mine.length}</td>
                    <td className="num tnum">{mine.filter((c) => c.firmStatus === "Accepted").length}</td>
                    <td className="small">{leads.join(", ") || "—"}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={4}><div className="col" style={{ alignItems: "center", padding: 24 }}><Icon name="briefcase" /><div className="h4">No firms yet</div></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuestionsTab({ p }: { p: Programme }) {
  const onSections = p.qset.sections.filter((s) => s.on);
  const [sid, setSid] = useState(onSections[0]?.id);
  const sec = onSections.find((s) => s.id === sid) ?? onSections[0];
  let n = 0;
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <AlertBox
          tone="info"
          icon="lock-simple"
          title={p.locked ? `Locked on ${p.locked}. Based on ${regOfProg(p).ref} ${p.ver}; ${p.edited || 0} change${p.edited === 1 ? "" : "s"} made for this programme.` : "Editable until the programme opens."}
        />
      </div>
      <div className="card p0">
        <div className="q-layout">
          <div className="q-secs">
            <div className="overline" style={{ padding: "4px 8px 8px" }}>Sections</div>
            {onSections.map((s) => (
              <button key={s.id} className={`q-sec ${s.id === sid ? "on" : ""}`} onClick={() => setSid(s.id)}>
                <span className="grow">{s.name}</span>
                <span className="count">{s.reqs.reduce((a, r) => a + r.questions.length, 0)}</span>
              </button>
            ))}
          </div>
          <div className="col gap8">
            {sec?.reqs.map((r) =>
              r.questions.map((q) => {
                n++;
                return (
                  <div className="q-card" key={q.id}>
                    <div className="row top">
                      <span className="q-n">{n}</span>
                      <div className="grow">
                        <div className="strong">{q.text}</div>
                        <div className="row wrap gap8" style={{ marginTop: 6 }}>
                          <span className="cap muted">{q.hint}</span>
                          <span className="cap mono">{r.ref}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CyclesTab({ p }: { p: Programme }) {
  const router = useRouter();
  const cyc = cyclesOf(p.series);
  return (
    <div className="card p0">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Cycle</th><th>Window</th><th className="num">Organisations</th><th>Status</th></tr></thead>
          <tbody>
            {cyc.map((c) => {
              const s = progStats(c);
              return (
                <tr key={c.id} className={`click ${c.id === p.id ? "strong" : ""}`} onClick={() => router.push(`/regulator/programmes/${c.id}`)}>
                  <td>Cycle {c.cycle}{c.id === p.id ? <span className="cap muted"> · viewing</span> : null}</td>
                  <td className="small">{fmtD(c.opens)} – {fmtD(c.closes)}</td>
                  <td className="num tnum">{s.n}</td>
                  <td><Chip tone={PROG_STATUS_TONE[c.status] ?? "neu"}>{c.status}</Chip></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ p }: { p: Programme }) {
  const reg = regOfProg(p);
  const sc = schemeOf(p.scheme);
  return (
    <div className="card col gap12" style={{ maxWidth: 760 }}>
      <Kv
        pairs={[
          ["Regulation", `${reg.ref} ${p.ver} · ${reg.name}`],
          ["Categories", p.types.join(", ")],
          ["Scoring scheme", sc.name],
          ["Firms", p.firmMode === "organisation" ? "Organisations engage their own; non-accredited firms need approval" : `${TENANT.short} assigns`],
          ["Outcome preview", p.preview ? "On: organisations can see and comment, not change" : "Off"],
          ["Publishing", p.publisher === "firm" ? "Delegated to the firm (approved reports only)" : `${TENANT.short} publishes`],
        ]}
      />
    </div>
  );
}

export default function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const found = PROGRAMMES.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>("overview");

  if (!found) notFound();

  const p = progOf(id);
  const reg = regOfProg(p);
  const cs = casesOf(p.id);
  const sr = seriesOf(p);
  const cyc = cyclesOf(p.series);
  const reqN = cs.filter((c) => c.stage === "Firm approval").length;

  return (
    <AppShell workspace="regulator">
      <div className="ph-card">
        <div className="ph-row">
          <Tile icon="calendar-check" tone="brand" size="lg" />
          <div className="ph-info">
            <div className="overline">Programme{cyc.length > 1 ? ` · ${cyc.length} cycles` : ""}</div>
            <div className="row wrap gap8">
              <h1 className="h1">{sr ? sr.name : p.name}</h1>
              <Chip tone={PROG_STATUS_TONE[p.status] ?? "neu"}>{p.status}</Chip>
            </div>
            <div className="ph-meta">
              <span>Cycle {p.cycle}</span>
              <span><Icon name="book-open-text" />{reg.ref} {p.ver}</span>
              <span><Icon name="calendar-blank" />{fmtD(p.opens)} – {fmtD(p.closes)}</span>
              <span><Icon name="buildings" />{cs.length || scopeOrgs(p).length} organisations</span>
            </div>
          </div>
        </div>
        <Tabs
          items={[
            { id: "overview", label: "Overview" },
            { id: "organisations", label: "Organisations", count: reqN || undefined },
            { id: "firms", label: "Firms" },
            { id: "questions", label: "Questions", count: qsetQs(p.qset).length },
            { id: "cycles", label: "Cycles", count: cyc.length },
            { id: "settings", label: "Settings" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {tab === "overview" ? <OverviewTab p={p} cs={cs} /> : null}
      {tab === "organisations" ? <OrganisationsTab p={p} cs={cs} /> : null}
      {tab === "firms" ? <FirmsTab cs={cs} /> : null}
      {tab === "questions" ? <QuestionsTab p={p} /> : null}
      {tab === "cycles" ? <CyclesTab p={p} /> : null}
      {tab === "settings" ? <SettingsTab p={p} /> : null}
    </AppShell>
  );
}
