"use client";

import { use, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Chip, Tabs, Kv, Tile, Field, AlertBox } from "@/components/ui";
import { Dialog, Drawer } from "@/components/Overlay";
import { Popover, MenuItem } from "@/components/Popover";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import AnalyticsTab from "./Analytics";
import {
  PROGRAMMES,
  progOf,
  regOfProg,
  casesOf,
  caseOf,
  scopeOrgs,
  progStats,
  caseProgress,
  stageGroups,
  seriesOf,
  cyclesOf,
  qsetQs,
  qsetQParts,
  schemeOf,
  fmtD,
  benchOf,
  accredited,
  conflictOf,
  assignFirmToCases,
  approveFirmRequest,
  declineFirmRequest,
  remindAllOutstanding,
  nextCycle,
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

type Tab = "overview" | "analytics" | "organisations" | "firms" | "questions" | "cycles" | "settings";

function OverviewTab({ p, cs }: { p: Programme; cs: Case[] }) {
  const router = useRouter();
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
                        <tr key={c.id} className="click" onClick={() => router.push(`/regulator/programmes/${p.id}?tab=organisations`)}>
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
            <Kv pairs={[["Opens", fmtD(p.opens)], ["Due", fmtD(p.closes)], ["Reminders", `${String(p.reminders)} days before`], ["Questions locked", p.locked || "At launch"]]} />
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

function OrganisationsTab({
  p,
  cs,
  sel,
  setSel,
  onAssign,
  onReview,
}: {
  p: Programme;
  cs: Case[];
  sel: string[];
  setSel: (v: string[]) => void;
  onAssign: (caseIds: string[]) => void;
  onReview: (c: Case) => void;
}) {
  const toast = useToast();
  const showSel = p.firmMode === "regulator" && p.status === "Open";
  function toggle(id: string) {
    setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  }
  function toggleAll() {
    setSel(sel.length === cs.length ? [] : cs.map((c) => c.id));
  }
  function sendReminder() {
    const n = sel.length;
    setSel([]);
    toast(`Reminder sent to ${n} organisation${n === 1 ? "" : "s"}`, "ok", "bell");
  }
  return (
    <div className="card p0">
      {showSel ? (
        <div className="tbl-tools">
          <span className={`small ${sel.length ? "strong" : "muted"}`}>{sel.length ? `${sel.length} selected` : "Select organisations to assign a firm or send a reminder"}</span>
          <span className="grow" />
          <Button variant="outline" size="sm" icon="bell" disabled={!sel.length} onClick={sendReminder}>Send reminder</Button>
          <Button size="sm" icon="user-plus" testId="bulk-assign" disabled={!sel.length} onClick={() => onAssign(sel)}>Assign firm</Button>
        </div>
      ) : null}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {showSel ? <th style={{ width: 36 }}><input type="checkbox" aria-label="Select all" checked={!!sel.length && sel.length === cs.length} onChange={toggleAll} /></th> : null}
              <th>Organisation</th><th>Assurance firm</th><th>Stage</th><th>Answered</th><th>Due</th><th className="act-col" />
            </tr>
          </thead>
          <tbody>
            {cs.length ? (
              cs.map((c) => {
                const o = orgOf(c.org);
                const f = firmOf(c.firm);
                return (
                  <tr key={c.id}>
                    {showSel ? <td><input type="checkbox" aria-label={`Select ${o?.name}`} data-test={`sel-${c.org}`} checked={sel.includes(c.id)} onChange={() => toggle(c.id)} /></td> : null}
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
                    <td className="act-col">
                      {c.stage === "Firm approval" ? (
                        <Button variant="secondary" size="sm" testId={`firmreq-${c.org}`} onClick={() => onReview(c)}>Review request</Button>
                      ) : c.stage === "Firm to assign" && p.status === "Open" ? (
                        <Button variant="tertiary" size="sm" onClick={() => onAssign([c.id])}>Assign firm</Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={showSel ? 7 : 6}><div className="col" style={{ alignItems: "center", padding: 24 }}><Icon name="buildings" /><div className="h4">No organisations yet</div><p className="muted small">They are added when the programme opens.</p></div></td></tr>
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
                const parts = qsetQParts(q);
                return (
                  <div className="q-card" key={q.id}>
                    <div className="row top">
                      <span className="q-n">{n}</span>
                      <div className="grow">
                        <div className="strong">{q.text}</div>
                        <div className="row wrap gap8" style={{ marginTop: 6 }}>
                          <span className="qp">
                            <span className="qp-c">{parts.choiceLabel}</span>
                            {parts.comment ? <span className="qp-p"><Icon name="chat-text" />Comment</span> : null}
                          </span>
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

function CyclesTab({ p, onRunNext }: { p: Programme; onRunNext: () => void }) {
  const router = useRouter();
  const cyc = cyclesOf(p.series);
  const b = benchOf(p);
  return (
    <div className="card p0">
      <div className="tbl-tools">
        <div className="grow">
          <div className="h4">Cycles</div>
          <div className="cap muted">Each cycle reuses the programme&apos;s set-up. Results stay with the cycle they were assessed in.</div>
        </div>
        <Button variant="secondary" size="sm" icon="arrow-clockwise" testId="prog-next" onClick={onRunNext}>Run next cycle</Button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Cycle</th><th>Window</th><th className="num">Organisations</th><th>Submitted</th><th className="num">Average score</th><th className="num">Met benchmark ({b})</th><th>Status</th></tr></thead>
          <tbody>
            {cyc.map((c) => {
              const ccs = casesOf(c.id);
              const pub = ccs.filter((x) => x.stage === "Published");
              const scores = pub.map((x) => x.score).filter((v): v is number => v != null);
              const avgScore = scores.length ? Math.round(scores.reduce((a, v) => a + v, 0) / scores.length) : null;
              const met = scores.filter((v) => v >= b).length;
              const s = progStats(c);
              const notOpenYet = c.status === "Draft" || c.status === "Scheduled";
              return (
                <tr key={c.id} className={`click ${c.id === p.id ? "sel" : ""}`} data-test={`cyc-${c.cycle}`} onClick={() => router.push(`/regulator/programmes/${c.id}`)}>
                  <td><b>{c.cycle}</b>{c.id === p.id ? <Chip tone="brand">Viewing</Chip> : null}</td>
                  <td className="small">{fmtD(c.opens)} – {fmtD(c.closes)}</td>
                  <td className="num tnum">{ccs.length || scopeOrgs(c).length}</td>
                  <td>{notOpenYet ? <span className="cap muted">Not open yet</span> : <div className="pbar"><div className="bar"><i style={{ width: `${s.pct}%` }} /></div><span className="cap tnum">{s.done}/{s.n}</span></div>}</td>
                  <td className="num tnum">{avgScore ?? "—"}</td>
                  <td className="num tnum">{scores.length ? `${met} of ${scores.length}` : "—"}</td>
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
          ["Reminders", `${String(p.reminders)} days before; escalate after ${String(p.escalate)} days`],
          ["Firms", p.firmMode === "organisation" ? "Organisations engage their own; non-accredited firms need approval" : `${TENANT.short} assigns`],
          ["Outcome preview", p.preview ? "On: organisations can see and comment, not change" : "Off"],
          ["Publishing", p.publisher === "firm" ? "Delegated to the firm (approved reports only)" : `${TENANT.short} publishes`],
        ]}
      />
    </div>
  );
}

function AssignFirmDialog({
  programmeId,
  caseIds,
  onClose,
  onDone,
}: {
  programmeId: string;
  caseIds: string[];
  onClose: () => void;
  onDone: (assigned: number, firmName: string) => void;
}) {
  const fs = accredited();
  const [firmId, setFirmId] = useState(fs[0]?.id ?? "");
  const firm = firmOf(firmId);
  const rows = caseIds.map((cid) => caseOf(cid)).filter((c): c is Case => !!c);
  const ok = firm ? rows.filter((c) => !conflictOf(firm, c.org)).length : 0;

  return (
    <Dialog open onClose={onClose} wide>
      <div className="row"><Icon name="user-plus" /><h2 className="h3">Assign an assurance firm</h2></div>
      <p className="muted small">{caseIds.length} organisation{caseIds.length === 1 ? "" : "s"} selected. The firm is asked to accept and name its team.</p>
      <div className="col gap12">
        <Field label="Firm" htmlFor="af-firm">
          <select className="sel" id="af-firm" data-test="af-firm" value={firmId} onChange={(e) => setFirmId(e.target.value)}>
            {fs.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.types.join(", ")}</option>)}
          </select>
        </Field>
        <div className="card flat tight">
          <div className="overline" style={{ marginBottom: 4 }}>Independence check</div>
          {rows.map((c) => {
            const o = orgOf(c.org);
            const cf = firm ? conflictOf(firm, c.org) : undefined;
            return (
              <div className="row small" style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }} key={c.id}>
                <span className="logo s24" style={{ background: o?.color }}>{o?.initials}</span>
                <span className="grow">{o?.name}</span>
                {cf ? <Chip tone="bad" icon="prohibit">Blocked: advised since {cf.since}</Chip> : c.firm ? <Chip tone="warn">Replaces {firmOf(c.firm)?.name}</Chip> : <Chip tone="ok" icon="check">OK</Chip>}
              </div>
            );
          })}
        </div>
        {firm && ok < rows.length ? (
          <AlertBox tone="warn" title={`${rows.length - ok} cannot be assigned to ${firm.name}`} body={`The firm advised ${rows.length - ok === 1 ? "this organisation" : "these organisations"} recently. Pick another firm for ${rows.length - ok === 1 ? "it" : "them"}.`} />
        ) : null}
        <div className="row end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button testId="af-go" disabled={!ok} onClick={() => { const res = assignFirmToCases(programmeId, caseIds, firmId, "M. Bello"); onDone(res.assigned, firm?.name ?? ""); }}>Assign to {ok}</Button>
        </div>
      </div>
    </Dialog>
  );
}

function ReviewRequestDrawer({ c, onClose, onDone }: { c: Case | null; onClose: () => void; onDone: (approved: boolean) => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  if (!c || !c.reqFirm) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;
  const o = orgOf(c.org);
  const r = c.reqFirm;
  return (
    <Drawer open onClose={onClose}>
      <div className="row top">
        <div className="grow">
          <div className="overline">Firm request · {progOf(c.prog).name}</div>
          <h2 className="h3" style={{ marginTop: 4 }}>{o?.name} wants to use {r.name}</h2>
        </div>
        <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
      </div>
      <AlertBox tone="warn" title="This firm is not accredited" body={`${r.name} is not on ${TENANT.short}'s accredited list. Approving lets it assess ${o?.name} for this programme only.`} />
      <Kv pairs={[["Requested by", `${r.by} · ${r.when}`], ["Firm contact", r.contact], ["Credentials", r.creds], ["Reason", r.reason]]} />
      <div className="file"><Icon name="file-text" /><span className="grow">{r.file}</span></div>
      <Field label="Note to the organisation" htmlFor="fr-note" hint="Required if you decline">
        <textarea className="ta" id="fr-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="row end">
        <Button
          variant="danger-soft"
          onClick={() => {
            if (!note) { toast("Add a note so the organisation knows why", "bad"); return; }
            declineFirmRequest(c.id, note, "M. Bello");
            onDone(false);
          }}
        >
          Decline
        </Button>
        <Button icon="seal-check" testId="firmreq-approve" onClick={() => { approveFirmRequest(c.id, "M. Bello"); onDone(true); }}>Approve for this programme</Button>
      </div>
    </Drawer>
  );
}

export default function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const found = PROGRAMMES.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>("overview");
  const [sel, setSel] = useState<string[]>([]);
  const [assignFor, setAssignFor] = useState<string[] | null>(null);
  const [reviewCase, setReviewCase] = useState<Case | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "analytics") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, used only to land on the Analytics tab when the cycle picker there navigates here.
      setTab("analytics");
    }
  }, []);

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
              <span className="cyc-pick">
                <Icon name="arrows-clockwise" />
                {cyc.length > 1 ? (
                  <select className="sel" aria-label="Cycle" data-test="prog-cycle" value={p.id} onChange={(e) => router.push(`/regulator/programmes/${e.target.value}`)}>
                    {cyc.map((c) => <option key={c.id} value={c.id}>Cycle {c.cycle}</option>)}
                  </select>
                ) : (
                  <>Cycle {p.cycle}</>
                )}
              </span>
              <span><Icon name="book-open-text" />{reg.ref} {p.ver}</span>
              <span><Icon name="calendar-blank" />{fmtD(p.opens)} – {fmtD(p.closes)}</span>
              <span><Icon name="buildings" />{cs.length || scopeOrgs(p).length} organisations</span>
            </div>
          </div>
          <div className="row wrap gap8">
            {p.status === "Draft" || p.status === "Scheduled" ? (
              <Button variant="secondary" icon="pencil-simple" onClick={() => router.push(`/regulator/programmes/new?edit=${p.id}`)}>Edit programme</Button>
            ) : p.status === "Open" ? (
              <Button
                variant="outline"
                icon="bell"
                onClick={() => {
                  const n = remindAllOutstanding(p.id, "M. Bello");
                  bump();
                  toast(`Reminder sent to ${n} organisations that have not submitted`, "ok", "bell");
                }}
              >
                Send reminder to all
              </Button>
            ) : null}
            <button ref={moreRef} className="icon-btn bordered" aria-label="More actions" title="More actions" data-test={`more-prog-${p.id}`} onClick={() => setMoreOpen((v) => !v)}><Icon name="dots-three" /></button>
          </div>
        </div>
        <Tabs
          items={[
            { id: "overview", label: "Overview" },
            { id: "analytics", label: "Analytics" },
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
      {tab === "analytics" ? <AnalyticsTab p={p} /> : null}
      {tab === "organisations" ? (
        <OrganisationsTab
          p={p}
          cs={cs}
          sel={sel}
          setSel={setSel}
          onAssign={(ids) => setAssignFor(ids)}
          onReview={(c) => setReviewCase(c)}
        />
      ) : null}
      {tab === "firms" ? <FirmsTab cs={cs} /> : null}
      {tab === "questions" ? <QuestionsTab p={p} /> : null}
      {tab === "cycles" ? (
        <CyclesTab
          p={p}
          onRunNext={() => {
            const res = nextCycle(p.id, "M. Bello");
            toast(res.reused ? `Cycle ${progOf(res.id).cycle} is already set up` : `Cycle ${progOf(res.id).cycle} drafted. Check the dates, then launch.`, "info");
            router.push(`/regulator/programmes/new?edit=${res.id}`);
          }}
        />
      ) : null}
      {tab === "settings" ? <SettingsTab p={p} /> : null}

      <Popover open={moreOpen} onClose={() => setMoreOpen(false)} anchorRef={moreRef}>
        <MenuItem
          icon={<Icon name="arrow-clockwise" />}
          onClick={() => {
            setMoreOpen(false);
            const res = nextCycle(p.id, "M. Bello");
            toast(res.reused ? `Cycle ${progOf(res.id).cycle} is already set up` : `Cycle ${progOf(res.id).cycle} drafted from cycle ${p.cycle}. Check the dates, then launch.`, "ok", "arrow-clockwise");
            router.push(`/regulator/programmes/new?edit=${res.id}`);
          }}
        >
          Run next cycle
        </MenuItem>
        <MenuItem
          icon={<Icon name="export" />}
          onClick={() => { setMoreOpen(false); toast("Export started. You will get an email with the CSV file."); }}
        >
          Export cycle results (CSV)
        </MenuItem>
      </Popover>

      {assignFor ? (
        <AssignFirmDialog
          programmeId={p.id}
          caseIds={assignFor}
          onClose={() => setAssignFor(null)}
          onDone={(assigned, firmName) => {
            setAssignFor(null);
            setSel([]);
            bump();
            toast(`${firmName} assigned to ${assigned} organisation${assigned === 1 ? "" : "s"}. Waiting for the firm to accept.`, "ok", "user-plus");
          }}
        />
      ) : null}

      <ReviewRequestDrawer
        c={reviewCase}
        onClose={() => setReviewCase(null)}
        onDone={(approved) => {
          setReviewCase(null);
          bump();
          toast(approved ? "Approved. The firm can start." : "Declined. The organisation will choose another firm.", approved ? "ok" : "info");
        }}
      />
    </AppShell>
  );
}
