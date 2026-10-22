"use client";

import { use, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  allFindings,
  fdFind,
  effDue,
  savePlan,
  toggleStep,
  addProof,
  submitFix,
  askExtension,
  progOf,
  fcOf,
  fmtD,
  FD_STATUS_CHIP,
  TODAY,
  type RemediationPlan,
} from "@/lib/cases";
import { FIRMS, ORGANISATIONS } from "@/lib/mockData";

const PEOPLE = ["A. Okonkwo", "C. Eze"];

export default function OrgFindingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [editing, setEditing] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [extDate, setExtDate] = useState("");
  const [extReason, setExtReason] = useState("");

  if (!allFindings().some((x) => x.f.id === id)) notFound();
  const { f, c } = fdFind(id);
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const fm = FIRMS.find((x) => x.id === c.firm);
  const fc = fcOf(f.cls);
  const p = progOf(c.prog);

  const [draft, setDraft] = useState<RemediationPlan>(() => f.plan ?? { action: "", owner: "", target: effDue(f) ?? "", steps: [["", false]] });
  const isEditing = editing || (!f.plan && f.status === "Open");

  function updateDraftStep(i: number, value: string) {
    setDraft((d) => ({ ...d, steps: d.steps.map((s, j) => (j === i ? [value, s[1]] : s)) }));
  }
  function addDraftStep() {
    setDraft((d) => ({ ...d, steps: [...d.steps, ["", false]] }));
  }
  function removeDraftStep(i: number) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, j) => j !== i) }));
  }

  function save() {
    if (!draft.action) {
      toast("Describe the fix", "bad");
      return;
    }
    savePlan(f, { ...draft, steps: draft.steps.filter((s) => s[0]) }, TODAY, "A. Okonkwo");
    setEditing(false);
    bump();
    toast(f.plan ? "Plan updated" : "Plan submitted");
  }

  function tickStep(i: number) {
    toggleStep(f, i);
    bump();
  }

  function uploadProof() {
    addProof(f, "Evidence of the fix.pdf", "412 KB");
    bump();
    toast("File added");
  }

  function doSubmitFix() {
    submitFix(f, TODAY, "A. Okonkwo");
    bump();
    toast("Fix submitted for verification", "ok", "paper-plane-tilt");
  }

  function doAskExtension() {
    if (!extDate) {
      toast("Choose a date", "bad");
      return;
    }
    askExtension(f, extDate, extReason, TODAY, "A. Okonkwo");
    setExtOpen(false);
    bump();
    toast("Asked for more time");
  }

  const canPlan = ["Open", "In progress"].includes(f.status ?? "");
  const canProof = f.status === "In progress";

  let side: React.ReactNode;
  if (f.status === "Open") {
    side = <AlertBox tone="info" title="Plan the fix: say what you will do, who owns it and by when. Then work on it and send proof." />;
  } else if (f.status === "In progress") {
    side = (
      <>
        <p className="small muted">When the fix is done, add proof and submit it. {fm?.name ?? "Your assessor"} checks it.</p>
        <Button block icon="paper-plane-tilt" onClick={doSubmitFix} disabled={!f.proof?.length} testId="fix-submit">Submit fix</Button>
        {!f.proof?.length ? <p className="cap muted">Add at least one file of proof first.</p> : null}
      </>
    );
  } else if (f.status === "Fix submitted") {
    side = <AlertBox tone="info" title="With your assessor" body={`${fm?.name ?? "The firm"} is checking the fix.`} />;
  } else if (f.status === "Verified fixed") {
    side = <AlertBox tone="ok" title="Verified fixed" body="Waiting for NITDA to close it." />;
  } else if (f.status === "Closed") {
    side = <AlertBox tone="ok" title="Closed" body={`${f.closed?.by ?? ""} · ${f.closed?.when ?? ""}`} />;
  } else {
    side = <AlertBox tone="info" title="An opportunity for improvement. No fix is required." />;
  }

  return (
    <AppShell workspace="organisation">
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{fc.name} · {f.ref}</div>
          <div className="rh-title"><h1 className="h1">{f.title}</h1><span className="row wrap gap6"><span className={`chip ${fc.tone}`}>{f.cls}</span><Chip tone={FD_STATUS_CHIP[f.status ?? ""]?.tone ?? "neu"} icon={FD_STATUS_CHIP[f.status ?? ""]?.icon}>{FD_STATUS_CHIP[f.status ?? ""]?.label ?? f.status}</Chip></span></div>
          <div className="rh-meta">From the {p.name} report · published {c.published ?? ""}</div>
        </div>
      </div>
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap8"><div className="h4">The finding</div><p className="small">{f.detail || `The assessor found a gap against ${f.ref}. See the published report for the full note.`}</p></div>

          {isEditing ? (
            <div className="card col gap16" data-test="plan-form">
              <div className="row"><span className="h4 grow">Action plan</span>{f.plan ? <Button variant="tertiary" size="sm" onClick={() => setEditing(false)}>Cancel</Button> : null}</div>
              <Field label="What you will do" htmlFor="pl-action">
                <textarea className="ta" id="pl-action" rows={3} placeholder="Describe the fix in a sentence or two" value={draft.action} onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))} data-test="pl-action" />
              </Field>
              <div className="grid g2" style={{ gap: 14 }}>
                <Field label="Owner" htmlFor="pl-owner">
                  <select className="sel" id="pl-owner" value={draft.owner} onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))} data-test="pl-owner">
                    <option value="">Choose a person</option>
                    {PEOPLE.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Target date" htmlFor="pl-target" hint={effDue(f) ? `On or before ${effDue(f)}` : undefined}>
                  <input className="inp" id="pl-target" type="date" max={effDue(f)} value={draft.target} onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))} />
                </Field>
              </div>
              <Field label="Steps" optional>
                <div className="col gap8">
                  {draft.steps.map((s, i) => (
                    <div className="row gap8" key={i}>
                      <input className="inp" placeholder={`Step ${i + 1}`} value={s[0]} onChange={(e) => updateDraftStep(i, e.target.value)} data-test={`pl-s-${i}`} />
                      {draft.steps.length > 1 ? <button className="icon-btn" aria-label="Remove step" onClick={() => removeDraftStep(i)}><Icon name="x" /></button> : null}
                    </div>
                  ))}
                  <div><Button variant="tertiary" size="sm" icon="plus" onClick={addDraftStep}>Add step</Button></div>
                </div>
              </Field>
              <div className="row end"><Button icon="paper-plane-tilt" onClick={save} testId="pl-submit">{f.plan ? "Save plan" : "Submit plan"}</Button></div>
            </div>
          ) : f.plan ? (
            <div className="card col gap12">
              <div className="row"><span className="h4 grow">Action plan</span>{canPlan ? <Button variant="tertiary" size="sm" icon="pencil-simple" onClick={() => setEditing(true)}>Edit plan</Button> : null}</div>
              <p className="small">{f.plan.action}</p>
              <Kv pairs={[["Owner", f.plan.owner || "—"], ["Target date", f.plan.target || "—"]]} />
              {f.plan.steps.filter((s) => s[0]).length ? (
                <div className="col gap6">
                  {f.plan.steps.map((s, i) =>
                    s[0] ? (
                      <label className="check" key={i}>
                        <input type="checkbox" checked={s[1]} onChange={() => tickStep(i)} disabled={!canPlan} />
                        <span className="small">{s[0]}</span>
                      </label>
                    ) : null
                  )}
                </div>
              ) : null}
            </div>
          ) : f.status !== "Noted" ? (
            <div className="card"><div className="col" style={{ alignItems: "center", padding: 24, gap: 8 }}><Tile icon="clipboard-text" size="lg" /><div className="h4">No plan yet</div></div></div>
          ) : null}

          {f.status === "Noted" ? null : (f.proof?.length || canProof) ? (
            <div className="card col gap12">
              <div className="row"><span className="h4 grow">Proof of the fix</span><span className="count">{f.proof?.length ?? 0}</span></div>
              {(f.proof ?? []).map(([name, size], i) => (
                <div className="file" key={i}><div className="grow"><div className="strong small">{name}</div><div className="cap muted">{size}</div></div></div>
              ))}
              {canProof ? (
                <button className="drop" onClick={uploadProof} data-test="pf-add">
                  <Tile icon="upload-simple" size="sm" />
                  <b className="small">Add a file</b>
                  <span className="cap muted">Screenshots, exports, minutes or policies that show the fix works</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {f.verify ? (
            <div className="card col gap8">
              <div className="row"><span className="h4 grow">Verification</span><Chip tone={f.verify.ok ? "ok" : "bad"}>{f.verify.ok ? "Verified fixed" : "Not fixed"}</Chip></div>
              <p className="small">{f.verify.note}</p>
              <div className="cap muted">{f.verify.by} · {fm?.name ?? ""} · {f.verify.when}</div>
            </div>
          ) : null}

          <div className="card col gap12">
            <div className="h4">Activity</div>
            <div className="timeline">
              {[...(f.updates ?? [])].reverse().map(([w, who, a], i) => (
                <div className="tl" key={i}>
                  <Tile icon={/Verified|Closed|approved/i.test(a) ? "check-circle" : /Not fixed|Reopen|declined/i.test(a) ? "x-circle" : "note-pencil"} tone={/Verified|Closed|approved/i.test(a) ? "ok" : /Not fixed|declined/i.test(a) ? "bad" : ""} size="sm" />
                  <div><div className="small strong">{a}</div><div className="cap muted">{who} · {w}</div></div>
                </div>
              ))}
              <div className="tl"><Tile icon="flag" size="sm" /><div><div className="small strong">Raised in the published report</div><div className="cap muted">{fm?.name ?? ""} · {c.published ?? ""}</div></div></div>
            </div>
          </div>
        </div>

        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">Next step</div>
            {side}
            {canPlan && effDue(f) ? (
              f.ext?.status === "Requested" ? (
                <AlertBox tone="warn" title="More time asked" body={`Until ${fmtD(f.ext.date)}. Waiting for NITDA.`} />
              ) : (
                <Button variant="tertiary" block icon="clock-clockwise" onClick={() => setExtOpen((v) => !v)} testId="ext-ask">Ask for more time</Button>
              )
            ) : null}
            {extOpen ? (
              <div className="col gap8" style={{ marginTop: 8 }}>
                <Field label="New target date" htmlFor="ext-date"><input className="inp" id="ext-date" type="date" value={extDate} onChange={(e) => setExtDate(e.target.value)} /></Field>
                <Field label="Reason" htmlFor="ext-reason"><textarea className="ta" id="ext-reason" rows={2} value={extReason} onChange={(e) => setExtReason(e.target.value)} /></Field>
                <Button size="sm" onClick={doAskExtension}>Send request</Button>
              </div>
            ) : null}
          </div>
          <div className="card col gap8">
            <div className="h4">Details</div>
            <Kv
              pairs={[
                ["Class", <span key="c"><span className={`chip ${fc.tone}`}>{f.cls}</span> <span className="small">{fc.name}</span></span>],
                ["Fix by", effDue(f) ? fmtD(effDue(f)) : "No deadline"],
                ...(f.ext?.status === "Approved" ? ([["Original deadline", fmtD(f.due)]] as [string, string][]) : []),
                ["Organisation", o?.name ?? ""],
                ["Assessed by", fm?.name ?? "—"],
                ["Owner", f.plan?.owner || "—"],
              ]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
