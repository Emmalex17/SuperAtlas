"use client";

import { use, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Field, AlertBox, Kv, Button } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { CASES, progOf, caseScore, bandOf, outTone, schemeOf, qsetReqs, fcOf, fmtD, approveCase, returnCase, publishCase, cancelScheduleOn, overrideOutcome, type Case } from "@/lib/cases";
import { ORGANISATIONS, FIRMS, TEAM } from "@/lib/mockData";

const TODAY = "2026-10-19";

function reviewers() {
  return TEAM.filter((t) => ["Reviewer", "Supervisor", "Admin"].includes(t.role) && t.status === "Active");
}

function outCounts(c: Case, sch: ReturnType<typeof schemeOf>) {
  const vals = Object.values(c.outcomes).map((x) => x.o);
  return (
    <div className="row wrap gap6">
      {sch.levels.map(([l, , t]) => {
        const n = vals.filter((v) => v === l).length;
        return n ? <Chip key={l} tone={t}>{n} {l}</Chip> : null;
      })}
    </div>
  );
}

export default function ReviewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [ovOpen, setOvOpen] = useState<string | null>(null);
  const [ovVal, setOvVal] = useState("");
  const [ovReason, setOvReason] = useState("");
  const [rvWho, setRvWho] = useState("");
  const [rvNote, setRvNote] = useState("");

  const found = CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: Case = found;

  const p = progOf(c.prog);
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const f = FIRMS.find((x) => x.id === c.firm);
  const sch = schemeOf(p.scheme);
  const reqs = qsetReqs(p.qset);
  const sc = caseScore(c) ?? c.score;
  const canDecide = c.stage === "Report submitted" || c.stage === "In review";
  const held = c.stage === "Held back";
  const ovN = Object.values(c.outcomes).filter((x) => x.override).length;

  function approve() {
    const wasHeld = c.stage === "Held back";
    approveCase(c, rvWho || c.reviewer || "M. Bello", TODAY);
    toast(wasHeld ? `Approved. It will publish with the rest on ${fmtD(c.pubAt)}.` : "Report approved");
    bump();
  }

  function returnToFirm() {
    if (!rvNote) {
      toast("Say what the firm should fix", "bad");
      return;
    }
    returnCase(c, rvWho || c.reviewer || "M. Bello", rvNote);
    toast("Returned to the firm", "info");
    bump();
  }

  function publishNow() {
    publishCase(c, TODAY);
    toast("Published. The organisation is emailed.", "ok", "paper-plane-tilt");
    bump();
  }

  function cancelSchedule() {
    cancelScheduleOn(c);
    toast("Schedule cancelled");
    bump();
  }

  function openOverride(ref: string) {
    const oc = c.outcomes[ref];
    setOvVal(oc?.o ?? "");
    setOvReason("");
    setOvOpen(ref);
  }

  function saveOverride() {
    if (!ovOpen || !ovVal || !ovReason) {
      toast("Choose an outcome and give a reason", "bad");
      return;
    }
    overrideOutcome(c, ovOpen, ovVal, ovReason, "M. Bello");
    setOvOpen(null);
    bump();
    toast("Outcome changed. Score updated.");
  }

  return (
    <AppShell workspace="regulator">
      <div className="rh">
        <span className="logo s48" style={{ background: o?.color }}>{o?.initials}</span>
        <div className="rh-main">
          <div className="overline">{p.name}{f ? ` · ${f.name}` : ""}</div>
          <div className="rh-title"><h1 className="h1">{o?.name}</h1><Chip tone="neu">{c.stage}</Chip></div>
          <div className="rh-meta">Signed off by {c.signed?.by || c.lead || "the firm"}{c.reportAt ? ` · submitted ${c.reportAt}` : ""}{c.reviewer ? ` · reviewer ${c.reviewer}` : ""}</div>
        </div>
      </div>

      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap12">
            <div className="row">
              <div className="grow">
                <div className="overline">Score</div>
                <div className="row gap8" style={{ alignItems: "baseline" }}>
                  <span className="metric">{sc ?? "—"}</span>
                  <span className="small muted">{bandOf(sch, sc)}</span>
                  {ovN ? <Chip tone="info" icon="pencil-simple">{ovN} outcome{ovN > 1 ? "s" : ""} changed by NITDA</Chip> : null}
                </div>
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

          <div className="card p0">
            <div className="tbl-tools"><span className="h4 grow">Outcomes</span><span className="cap muted">Change an outcome only with a reason. The firm and organisation see the change.</span></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Requirement</th><th>Organisation said</th><th>Firm outcome</th><th>Note</th><th className="act-col" /></tr></thead>
                <tbody>
                  {reqs.map((r) => {
                    const oc = c.outcomes[r.ref] ?? {};
                    return (
                      <tr key={r.ref}>
                        <td className="wrap"><span className="mono small" style={{ color: "var(--brand-600)" }}>{r.ref}</span> <span className="small">{r.t}</span></td>
                        <td className="small">—</td>
                        <td>
                          {oc.o ? <Chip tone={outTone(sch, oc.o)}>{oc.o}</Chip> : "—"}
                          {oc.override ? <div className="cap" style={{ color: "var(--info-fg)", marginTop: 2 }}>Was {oc.override.by}</div> : null}
                        </td>
                        <td className="wrap small muted">{oc.override ? oc.override.reason : oc.note || ""}</td>
                        <td className="act-col">{canDecide ? <Button variant="tertiary" size="sm" onClick={() => openOverride(r.ref)} testId={`ov-${r.ref}`}>Change</Button> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {c.findings.length ? (
            <div className="card col gap8">
              <div className="h4">Findings</div>
              {c.findings.map((fd) => (
                <div className="row small" key={fd.id}>
                  <span className={`chip ${fcOf(fd.cls).tone}`}>{fd.cls}</span>
                  <span className="grow">{fd.title}</span>
                  <span className="cap mono muted">{fd.ref}</span>
                  <span className="cap muted">{fd.due ? `fix by ${fmtD(fd.due)}` : ""}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">Decision</div>
            {canDecide || held ? (
              <>
                <Field label="Reviewer" htmlFor="rv-who">
                  <select className="sel" id="rv-who" value={rvWho || c.reviewer || "M. Bello"} onChange={(e) => setRvWho(e.target.value)}>
                    {reviewers().map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="Note" htmlFor="rv-note">
                  <textarea className="ta" id="rv-note" rows={2} placeholder="Required if you return the report" value={rvNote} onChange={(e) => setRvNote(e.target.value)} />
                </Field>
                <Button block icon="check-circle" onClick={approve} testId="rv-approve">Approve report</Button>
                {!held ? <Button variant="secondary" block icon="arrow-u-up-left" onClick={returnToFirm} testId="rv-return">Return to firm</Button> : null}
              </>
            ) : c.stage === "Approved" ? (
              <>
                <AlertBox tone="ok" title="Approved" body={`${c.approved?.by || ""} · ${c.approved?.when || ""}`} />
                {p.publisher === "firm" ? <AlertBox tone="info" title={`Publishing is delegated to ${f ? f.name : "the firm"} for this programme. You can still publish it yourself.`} /> : null}
                <Button block icon="paper-plane-tilt" onClick={publishNow} testId="pub-one">Publish now</Button>
              </>
            ) : c.stage === "Scheduled" ? (
              <>
                <AlertBox tone="info" title={`Publishes on ${fmtD(c.pubAt)}`} body="Organisations are emailed when it publishes." />
                <Button variant="outline" block onClick={cancelSchedule}>Cancel schedule</Button>
              </>
            ) : c.stage === "Published" ? (
              <AlertBox tone="ok" title={`Published ${c.published || ""}`} body={c.opened ? "The organisation has opened it." : "Not opened yet."} />
            ) : c.stage === "Returned" ? (
              <AlertBox tone="warn" title="Returned to the firm" body={c.returnNote || ""} />
            ) : (
              <AlertBox tone="info" title="Waiting for the firm." />
            )}
          </div>
          <div className="card col gap8">
            <div className="h4">Engagement</div>
            <Kv pairs={[["Firm", f ? f.name : "—"], ["Lead auditor", c.lead || "—"], ["Organisation submitted", c.submitted || "—"]]} />
          </div>
        </div>
      </div>

      <Dialog open={ovOpen !== null} onClose={() => setOvOpen(null)}>
        <div className="row"><Icon name="pencil-simple" /><h2 className="h3">Change outcome</h2></div>
        <p className="muted small">{ovOpen} · the firm said {(ovOpen && c.outcomes[ovOpen]?.o) || "nothing"}</p>
        <div className="col gap12">
          <div className="oc-pick">
            {sch.levels.map(([l, , tn]) => (
              <label key={l} className={`oc-o ${tn} ${ovVal === l ? "on" : ""}`}>
                <input type="radio" name="ov-o" value={l} checked={ovVal === l} onChange={() => setOvVal(l)} />
                {l}
              </label>
            ))}
          </div>
          <Field label="Reason" htmlFor="ov-r">
            <textarea className="ta" id="ov-r" rows={2} placeholder="Why NITDA disagrees with the firm" value={ovReason} onChange={(e) => setOvReason(e.target.value)} />
          </Field>
          <div className="row end">
            <Button variant="outline" onClick={() => setOvOpen(null)}>Cancel</Button>
            <Button onClick={saveOverride} testId="ov-go">Change outcome</Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
