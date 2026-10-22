"use client";

import { use, useEffect, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Tabs, Field, Button, AlertBox, Tile } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { ThreadsPanel } from "@/components/Threads";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  CASES,
  progOf,
  qsetReqs,
  caseQs,
  schemeOf,
  caseScore,
  bandOf,
  outTone,
  divergence,
  recordOutcome,
  startAssessing,
  signOffAndSubmitReport,
  askInformation,
  proposeInterview,
  markInterviewHeld,
  raiseFinding,
  deleteFinding,
  shareOutcomePreview,
  recordQualityReview,
  fcOf,
  FINDING_CLASSES,
  fmtDT,
  TODAY,
  type Case,
} from "@/lib/cases";
import { ORGANISATIONS, FIRMS } from "@/lib/mockData";

type Tab = "requirements" | "requests" | "interviews" | "findings" | "report";

const REPORT_STAGES = ["Signed off", "Report submitted", "In review", "Approved", "Scheduled", "Held back", "Published"];
const ME = "T. Adebayo";

function outCounts(c: Case, sch: ReturnType<typeof schemeOf>) {
  const vals = Object.values(c.outcomes).map((x) => x.o);
  return (
    <div className="row wrap gap6">
      {sch.levels.map(([l, , t]) => {
        const n = vals.filter((v) => v === l).length;
        return n ? <Chip tone={t} key={l}>{n} {l}</Chip> : null;
      })}
    </div>
  );
}

export default function AssessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("requirements");
  const [idx, setIdx] = useState(0);
  const [note, setNote] = useState("");
  const [decl, setDecl] = useState(false);
  const [askFor, setAskFor] = useState<string | null>(null);
  const [askText, setAskText] = useState("");
  const [ivFor, setIvFor] = useState<string | null>(null);
  const [ivSlots, setIvSlots] = useState(["2026-10-27T10:00", "2026-10-28T14:00", "2026-10-29T11:00"]);
  const [ivLink, setIvLink] = useState("https://meet.deloitte.example/zenith-isr");
  const [ivWho, setIvWho] = useState("Chief information security officer");
  const [fdOpen, setFdOpen] = useState<string | null>(null);
  const [fdCls, setFdCls] = useState("MiNC");
  const [fdTitle, setFdTitle] = useState("");
  const [fdDetail, setFdDetail] = useState("");

  const found = CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: Case = found;

  useEffect(() => {
    if (c.stage === "Submitted") {
      startAssessing(c);
      bump();
    }
  }, [c]);

  const p = progOf(c.prog);
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const sch = schemeOf(p.scheme);
  const reqs = qsetReqs(p.qset);
  const qs = caseQs(c);
  const done = reqs.filter((r) => c.outcomes[r.ref]).length;
  const ro = REPORT_STAGES.includes(c.stage);
  const openTh = c.threads.filter((t) => t.status === "Open").length;
  const ivs = c.interviews;

  const ri = Math.min(idx, reqs.length - 1);
  const r = reqs[ri];
  const out = c.outcomes[r.ref] ?? { o: "", note: "" };
  const dv = divergence(c, r, out.o);

  function pick(level: string) {
    recordOutcome(c, r.ref, level, note || out.note);
    bump();
  }
  function saveNote(v: string) {
    setNote(v);
    recordOutcome(c, r.ref, out.o, v);
    bump();
  }
  function saveAndNext() {
    if (!c.outcomes[r.ref]) { toast("Choose an outcome", "bad"); return; }
    if (c.stage === "Submitted") startAssessing(c);
    if (ri < reqs.length - 1) { setIdx(ri + 1); setNote(c.outcomes[reqs[ri + 1].ref]?.note ?? ""); bump(); }
    else { bump(); toast("Outcome saved"); }
  }

  const sc = caseScore(c);
  const ivOpenCount = ivs.filter((i) => i.status !== "Held").length;

  const steps: [string, boolean, string][] = [
    ["Record every outcome", done === reqs.length, `${done} of ${reqs.length}`],
    ...(p.preview ? ([["Share the outcome preview", !!c.previewAt, c.previewAt ? `Shared ${c.previewAt}${c.previewComments?.length ? ` · ${c.previewComments.length} comment${c.previewComments.length > 1 ? "s" : ""}` : " · no comments yet"}` : "The organisation can comment, not change"]] as [string, boolean, string][]) : []),
    ["Quality review", !!c.qr, c.qr ? `${c.qr.by} · ${c.qr.when}` : "A second assessor checks the work"],
    ["Lead auditor sign-off", !!c.signed, c.signed ? `${c.signed.by} · ${c.signed.when}` : `${c.lead || "Lead auditor"} signs`],
    ["Submit to NITDA", c.stage === "Report submitted" || (ro && !!c.reportAt), c.reportAt ? `Submitted ${c.reportAt}` : ""],
  ];

  return (
    <AppShell workspace="firm" crumbs={[{ label: "Engagements", href: "/firm/engagements" }, { label: o?.name ?? "" }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{p.name}</div>
          <div className="rh-title"><h1 className="h1">{o?.name}</h1><Chip tone="neu">{c.stage}</Chip></div>
          <div className="rh-meta">{c.lead ? `Lead ${c.lead} · ` : ""}{c.team.length ? `team ${c.team.join(", ")} · ` : ""}{c.submitted ? `submitted ${c.submitted} · ` : "not submitted yet · "}due {c.due}</div>
        </div>
      </div>
      <Tabs
        items={[
          { id: "requirements", label: `Requirements ${done}/${reqs.length}` },
          { id: "requests", label: "Information requests", count: openTh || undefined },
          { id: "interviews", label: "Interviews", count: ivOpenCount || undefined },
          { id: "findings", label: "Findings", count: c.findings.length || undefined },
          { id: "report", label: "Report and sign-off" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "requirements" ? (
        <div className="ans-grid" style={{ marginTop: 16 }}>
          <aside className="ans-nav">
            <div className="ans-prog">
              <div className="row between"><b className="small">Outcomes recorded</b><span className="cap tnum">{done}/{reqs.length}</span></div>
              <div className="pbar" style={{ marginTop: 8 }}><div className="bar"><i style={{ width: `${Math.round((done / reqs.length) * 100)}%` }} /></div></div>
            </div>
            <div className="ans-secs">
              {p.qset.sections.filter((s) => s.on).map((s) => (
                <div key={s.id}>
                  <div className="cap muted" style={{ padding: "8px 6px 2px", fontWeight: 600 }}>{s.name}</div>
                  {reqs.map((x, k) => [x, k] as const).filter(([x]) => x.sec === s.id).map(([x, k]) => {
                    const oc = c.outcomes[x.ref];
                    return (
                      <button key={x.ref} className={`ans-q ${k === ri ? "on" : ""}`} style={{ paddingLeft: 8 }} data-test={`ar-${k}`} onClick={() => { setIdx(k); setNote(c.outcomes[x.ref]?.note ?? ""); }}>
                        <span className={`ans-dot ${oc ? "ok" : ""}`} />
                        <span className="mono" style={{ fontSize: 12, minWidth: 52 }}>{x.ref}</span>
                        <span className="grow ell">{x.t}</span>
                        {oc ? <span className={`oc-dot ${outTone(sch, oc.o)}`} title={oc.o} /> : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>
          <div className="col gap12" style={{ minWidth: 0 }}>
            <div className="card col gap12">
              <div className="row top">
                <div className="grow">
                  <div className="cap muted">{r.secName} · weight {r.weight || "Normal (2)"}</div>
                  <div className="h3"><span className="mono ref-lg" style={{ fontSize: 16 }}>{r.ref}</span> {r.t}</div>
                  <p className="small muted" style={{ marginTop: 4 }}>{r.text}</p>
                </div>
                <div className="row gap4">
                  <button className="icon-btn" aria-label="Previous requirement" disabled={ri === 0} onClick={() => setIdx(ri - 1)}><Icon name="caret-left" /></button>
                  <button className="icon-btn" aria-label="Next requirement" disabled={ri === reqs.length - 1} onClick={() => setIdx(ri + 1)}><Icon name="caret-right" /></button>
                </div>
              </div>
              <div className="h4">The organisation&apos;s answers</div>
              {r.questions.map((q, n) => {
                const a = c.answers[q.id] ?? {};
                const th = c.threads.find((t) => t.qid === q.id);
                const iv = ivs.find((i) => i.qid === q.id);
                return (
                  <div className="oa" key={q.id}>
                    <div className="row top">
                      <span className="q-n">{n + 1}</span>
                      <div className="grow">
                        <div className="strong small">{q.text}</div>
                        {q.hint === "Yes / No / Not applicable" ? (
                          <div className="oa-v"><Chip tone={a.v === "Yes" ? "ok" : a.v === "No" ? "bad" : "neu"}>{a.v || "No answer"}</Chip></div>
                        ) : (
                          <div className="oa-v"><b>{a.v || "—"}</b></div>
                        )}
                        {a.comment ? <p className="small muted" style={{ marginTop: 4 }}>&ldquo;{a.comment}&rdquo;</p> : null}
                        {(a.files ?? []).map((f, i) => <span className="ev-pill" key={i}><Icon name="paperclip" />{f[0]}</span>)}
                        {a.link ? <span className="ev-pill"><Icon name="link" />{a.link}</span> : null}
                        {q.interview ? <span className="ev-pill iv"><Icon name="video-camera" />Interview {iv?.status ? `· ${iv.status.toLowerCase()}` : "needed"}</span> : null}
                        {th ? <div className="cap" style={{ marginTop: 6, color: th.status === "Open" ? "var(--warn-fg)" : "var(--ok-fg)" }}><Icon name="chat-circle-dots" /> Information request {th.status === "Open" ? "waiting for reply" : "answered"}</div> : null}
                      </div>
                      {!ro ? <Button variant="tertiary" size="sm" icon="chat-circle-dots" testId={`ask-${n}`} onClick={() => { setAskFor(q.id); setAskText(""); }}>Ask</Button> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card col gap12">
              <div className="h4">Outcome <span className="cap muted" style={{ fontWeight: 400 }}>· {sch.name}</span></div>
              <div className="oc-pick">
                {sch.levels.map(([l, pts, tn]) => (
                  <label key={l} className={`oc-o ${tn} ${out.o === l ? "on" : ""}`} data-test={`oc-${l.split(" ")[0]}`}>
                    <input type="radio" name="oc" checked={out.o === l} disabled={ro} onChange={() => pick(l)} />
                    {l}<span className="cap">{pts == null ? "not scored" : `${pts} pts`}</span>
                  </label>
                ))}
              </div>
              {dv ? <AlertBox tone="warn" title="Differs from the organisation's answer" body={dv} /> : null}
              <Field label="Assessor note" htmlFor="oc-note">
                <textarea className="ta" id="oc-note" rows={2} readOnly={ro} placeholder="What you checked and what you found" value={out.note ?? note} onChange={(e) => saveNote(e.target.value)} />
              </Field>
              <div className="row wrap gap8">
                {c.findings.filter((f) => f.ref === r.ref).map((f) => <span className={`chip ${fcOf(f.cls).tone}`} key={f.id}>{f.cls} · {f.title}</span>)}
              </div>
              {!ro ? (
                <div className="row between wrap">
                  <Button variant="outline" size="sm" icon="flag" testId="fd-new" onClick={() => { setFdOpen(r.ref); setFdCls("MiNC"); setFdTitle(""); setFdDetail(""); }}>Raise a finding</Button>
                  <Button iconRight={ri === reqs.length - 1 ? undefined : "arrow-right"} testId="oc-save" onClick={saveAndNext}>{ri === reqs.length - 1 ? "Save outcome" : "Save and next"}</Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "requests" ? (
        <div style={{ marginTop: 16 }}>
          <ThreadsPanel c={c} side="firm" />
        </div>
      ) : null}

      {tab === "interviews" ? (
        <div className="card p0" style={{ marginTop: 16 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Question</th><th>Status</th><th>When</th><th className="act-col" /></tr></thead>
              <tbody>
                {qs.filter((q) => q.interview).length ? (
                  qs.filter((q) => q.interview).map((q) => {
                    const iv = ivs.find((i) => i.qid === q.id);
                    return (
                      <tr key={q.id}>
                        <td className="wrap"><div className="strong small">{q.text}</div><div className="cap mono muted">{q.ref}</div></td>
                        <td>{iv ? <Chip tone={iv.status === "Confirmed" ? "ok" : iv.status === "Held" ? "neu" : "info"}>{iv.status}</Chip> : <Chip tone="warn">Not arranged</Chip>}</td>
                        <td className="small">{iv?.at ? fmtDT(iv.at) : iv ? `${iv.slots.length} times offered` : "—"}</td>
                        <td className="act-col">
                          {!ro && !iv ? <Button variant="secondary" size="sm" testId="iv-propose" onClick={() => { setIvFor(q.id); setIvSlots(["2026-10-27T10:00", "2026-10-28T14:00", "2026-10-29T11:00"]); }}>Propose times</Button> : null}
                          {!ro && iv?.status === "Confirmed" ? <Button variant="tertiary" size="sm" testId="iv-held" onClick={() => { markInterviewHeld(c, q.id); bump(); toast("Interview marked as held"); }}>Mark as held</Button> : null}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={4}><div className="col" style={{ alignItems: "center", padding: 24 }}><Tile icon="video-camera" size="lg" /><div className="h4">No interviews in this programme</div><p className="muted small">Questions with the Interview part appear here.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "findings" ? (
        <div className="card p0" style={{ marginTop: 16 }}>
          <div className="tbl-tools"><span className="small muted grow">Classes and fix deadlines come from NITDA&apos;s settings.</span><Button size="sm" icon="plus" onClick={() => { setFdOpen(reqs[0]?.ref ?? ""); setFdCls("MiNC"); setFdTitle(""); setFdDetail(""); }}>Raise a finding</Button></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Class</th><th>Finding</th><th>Requirement</th><th>Fix by</th><th className="act-col" /></tr></thead>
              <tbody>
                {c.findings.length ? (
                  c.findings.map((f, i) => (
                    <tr key={f.id}>
                      <td><span className={`chip ${fcOf(f.cls).tone}`} title={fcOf(f.cls).name}>{f.cls}</span></td>
                      <td className="wrap"><div className="strong small">{f.title}</div>{f.detail ? <div className="cap muted">{f.detail}</div> : null}</td>
                      <td className="mono small">{f.ref}</td>
                      <td className="small">{f.due || <span className="muted">No deadline</span>}</td>
                      <td className="act-col"><button className="icon-btn" aria-label="Remove finding" onClick={() => { deleteFinding(c, i); bump(); }}><Icon name="trash" /></button></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5}><div className="col" style={{ alignItems: "center", padding: 24 }}><Tile icon="flag" size="lg" /><div className="h4">No findings</div><p className="muted small">Raise findings from a requirement while you assess.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "report" ? (
        <div className="grid side" style={{ marginTop: 16 }}>
          <div className="col gap16">
            <div className="card col gap12">
              <div className="row">
                <div className="grow">
                  <div className="overline">Overall score</div>
                  <div className="row gap8" style={{ alignItems: "baseline" }}><span className="metric">{sc ?? "—"}</span><span className="small muted">{bandOf(sch, sc)}</span></div>
                </div>
                {outCounts(c, sch)}
              </div>
              {p.qset.sections.filter((s) => s.on).map((s) => {
                const ss = caseScore(c, s.id);
                return (
                  <div className="row small" key={s.id}>
                    <span className="grow">{s.name}</span>
                    <span style={{ width: 260 }}><div className="pbar"><div className="bar"><i style={{ width: `${ss || 0}%` }} /></div><span className="cap tnum">{ss == null ? "—" : ss}</span></div></span>
                  </div>
                );
              })}
            </div>
            {c.previewComments?.length ? (
              <div className="card col gap8">
                <div className="h4">Comments from {o?.name}</div>
                {c.previewComments.map((m, i) => (
                  <div className="oa" key={i}>
                    <div className="cap mono muted">{m.ref}</div>
                    <p className="small">&ldquo;{m.text}&rdquo;</p>
                    <div className="cap muted">{m.by} · {m.when}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="card col gap8">
              <div className="h4">Findings</div>
              {c.findings.length ? c.findings.map((f) => (
                <div className="row small" key={f.id}><span className={`chip ${fcOf(f.cls).tone}`}>{f.cls}</span><span className="grow">{f.title}</span><span className="cap mono muted">{f.ref}</span></div>
              )) : <p className="small muted">No findings raised.</p>}
            </div>
          </div>
          <div className="col gap12">
            <div className="card col gap12">
              <div className="h4">Sign-off</div>
              <div className="wf">
                {steps.map(([l, ok, d], i) => (
                  <div className={`wf-s ${ok ? "done" : ""}`} key={l}>
                    <span className="n">{ok ? <Icon name="check" /> : i + 1}</span>
                    <div><b className="small">{l}</b><div className="cap muted">{d}</div></div>
                  </div>
                ))}
              </div>
              {ro ? (
                <AlertBox tone="ok" title="Report submitted" body="With NITDA for review." />
              ) : (
                <>
                  {p.preview ? (
                    <Button variant="outline" block icon="eye" disabled={done < reqs.length} testId="pv-share" onClick={() => { shareOutcomePreview(c, TODAY); bump(); toast("Preview shared. The organisation can comment, not change outcomes.", "ok", "eye"); }}>
                      {c.previewAt ? "Update the preview" : "Share outcome preview"}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    block
                    icon="checks"
                    disabled={done < reqs.length || !!c.qr}
                    testId="qr-do"
                    onClick={() => {
                      const f = FIRMS.find((x) => x.id === c.firm);
                      const reviewer = f?.people?.find((pp) => pp.role === "Assessor" && pp.name !== c.lead && pp.status === "Active")?.name ?? f?.people?.[0]?.name ?? "Second assessor";
                      recordQualityReview(c, reviewer, TODAY);
                      bump();
                      toast(`Quality review recorded by ${reviewer}`, "ok", "checks");
                    }}
                  >
                    {c.qr ? "Quality review done" : "Record quality review"}
                  </Button>
                  <label className="check" style={{ opacity: c.qr && !c.signed ? 1 : 0.5 }}>
                    <input type="checkbox" checked={decl} disabled={!c.qr || !!c.signed} onChange={(e) => setDecl(e.target.checked)} />
                    <span className="small">I, {c.lead || "the lead auditor"}, confirm this assessment followed the firm&apos;s methodology and is independent.</span>
                  </label>
                  <Button
                    block
                    icon="seal-check"
                    disabled={!c.qr || done < reqs.length || (p.preview && !c.previewAt) || !decl}
                    testId="so-submit"
                    onClick={() => {
                      signOffAndSubmitReport(c, TODAY, c.lead || ME);
                      bump();
                      toast("Report submitted to NITDA", "ok", "seal-check");
                    }}
                  >
                    Sign off and submit report
                  </Button>
                  {p.preview && !c.previewAt ? <p className="cap muted">Share the preview before you submit.</p> : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={!!askFor} onClose={() => setAskFor(null)}>
        <div className="row"><h2 className="h3">Ask for more information</h2></div>
        <p className="muted small">{qs.find((q) => q.id === askFor)?.text}</p>
        <form
          className="col gap12"
          onSubmit={(e) => {
            e.preventDefault();
            if (!askText) { toast("Write your request", "bad"); return; }
            askInformation(c, askFor!, askText, `${ME}, ${FIRMS.find((f) => f.id === c.firm)?.name ?? ""}`, TODAY);
            setAskFor(null);
            bump();
            toast("Request sent to the organisation", "ok", "chat-circle-dots");
          }}
        >
          <Field label="Your request" htmlFor="ask-t"><textarea className="ta" id="ask-t" rows={3} placeholder="e.g. Please upload the MFA policy exceptions register." value={askText} onChange={(e) => setAskText(e.target.value)} /></Field>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setAskFor(null)}>Cancel</Button>
            <Button type="submit" testId="ask-go">Send request</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!ivFor} onClose={() => setIvFor(null)} wide>
        <div className="row"><h2 className="h3">Propose interview times</h2></div>
        <p className="muted small">{qs.find((q) => q.id === ivFor)?.text}</p>
        <form
          className="col gap12"
          onSubmit={(e) => {
            e.preventDefault();
            proposeInterview(c, ivFor!, ivSlots, ivLink, ivWho);
            setIvFor(null);
            bump();
            toast("Times sent. The organisation picks one.", "ok", "video-camera");
          }}
        >
          <div className="grid g3" style={{ gap: 10 }}>
            {ivSlots.map((s, i) => (
              <Field label={`Option ${i + 1}`} htmlFor={`iv-s${i}`} key={i}>
                <input className="inp" id={`iv-s${i}`} type="datetime-local" value={s} onChange={(e) => setIvSlots((prev) => prev.map((x, xi) => (xi === i ? e.target.value : x)))} />
              </Field>
            ))}
          </div>
          <Field label="Meeting link" htmlFor="iv-l"><input className="inp" id="iv-l" value={ivLink} onChange={(e) => setIvLink(e.target.value)} /></Field>
          <Field label="Who should attend" htmlFor="iv-w"><input className="inp" id="iv-w" value={ivWho} onChange={(e) => setIvWho(e.target.value)} /></Field>
          <p className="cap muted">Times are West Africa Time (WAT).</p>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setIvFor(null)}>Cancel</Button>
            <Button type="submit" testId="iv-go">Send to organisation</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!fdOpen} onClose={() => setFdOpen(null)} wide>
        <div className="row"><h2 className="h3">Raise a finding</h2></div>
        <p className="muted small">The organisation sees findings when the report is published, and fixes them with an action plan.</p>
        <form
          className="col gap12"
          onSubmit={(e) => {
            e.preventDefault();
            if (!fdTitle) { toast("Give the finding a title", "bad"); return; }
            raiseFinding(c, fdOpen || reqs[0].ref, fdCls, fdTitle, fdDetail, TODAY);
            setFdOpen(null);
            bump();
            toast(`${fdCls} finding raised`, "ok", "flag");
          }}
        >
          <Field label="Requirement" htmlFor="fd-ref">
            <select className="sel" id="fd-ref" value={fdOpen || reqs[0]?.ref} onChange={(e) => setFdOpen(e.target.value)}>
              {reqs.map((rr) => <option key={rr.ref} value={rr.ref}>{rr.ref} · {rr.t}</option>)}
            </select>
          </Field>
          <div className="field">
            <label>Class</label>
            <div className="grid g2" style={{ gap: 8 }}>
              {FINDING_CLASSES.map((fc) => (
                <label className="choice" key={fc.code}>
                  <input type="radio" name="fd-c" className="sr" checked={fdCls === fc.code} onChange={() => setFdCls(fc.code)} />
                  <span className="radio" />
                  <span className="grow"><b>{fc.code} · {fc.name}</b><br /><span className="cap muted">{fc.d} {fc.days ? `Fix within ${fc.days} days.` : ""}</span></span>
                </label>
              ))}
            </div>
          </div>
          <Field label="Title" htmlFor="fd-t"><input className="inp" id="fd-t" placeholder="One line the organisation will understand" value={fdTitle} onChange={(e) => setFdTitle(e.target.value)} /></Field>
          <Field label="Detail" htmlFor="fd-d" optional><textarea className="ta" id="fd-d" rows={2} value={fdDetail} onChange={(e) => setFdDetail(e.target.value)} /></Field>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setFdOpen(null)}>Cancel</Button>
            <Button type="submit" testId="fd-go">Raise finding</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
