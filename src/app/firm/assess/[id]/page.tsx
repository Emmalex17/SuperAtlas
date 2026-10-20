"use client";

import { use, useEffect, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Tabs, Field, Button, AlertBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import {
  CASES,
  progOf,
  qsetReqs,
  schemeOf,
  caseScore,
  bandOf,
  recordOutcome,
  startAssessing,
  signOffAndSubmitReport,
  fcOf,
  TODAY,
  type Case,
} from "@/lib/cases";
import { ORGANISATIONS } from "@/lib/mockData";

type Tab = "requirements" | "report";

export default function AssessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("requirements");
  const [idx, setIdx] = useState(0);
  const [note, setNote] = useState("");
  const [decl, setDecl] = useState(false);

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
  const done = reqs.filter((r) => c.outcomes[r.ref]).length;
  const ro = ["Signed off", "Report submitted", "In review", "Approved", "Scheduled", "Held back", "Published"].includes(c.stage);

  const r = reqs[Math.min(idx, reqs.length - 1)];
  const out = c.outcomes[r.ref] ?? { o: "", note: "" };

  function pick(level: string) {
    recordOutcome(c, r.ref, level, note || out.note);
    bump();
  }

  function saveNote(v: string) {
    setNote(v);
    recordOutcome(c, r.ref, out.o, v);
    bump();
  }

  function submitReport() {
    if (done < reqs.length || !decl) {
      toast("Record every outcome and confirm before submitting", "bad");
      return;
    }
    signOffAndSubmitReport(c, TODAY, c.lead || "Lead auditor");
    bump();
    toast("Report submitted to NITDA", "ok", "paper-plane-tilt");
  }

  const sc = caseScore(c);

  return (
    <AppShell workspace="firm">
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{p.name}</div>
          <div className="rh-title"><h1 className="h1">{o?.name}</h1><Chip tone="neu">{c.stage}</Chip></div>
          <div className="rh-meta">{c.lead ? `Lead ${c.lead} · ` : ""}due {c.due}</div>
        </div>
      </div>
      <Tabs items={[{ id: "requirements", label: `Requirements (${done}/${reqs.length})` }, { id: "report", label: "Report and sign-off" }]} active={tab} onChange={setTab} />

      {tab === "requirements" ? (
        <div className="ans-grid" style={{ marginTop: 16 }}>
          <aside className="ans-nav">
            <div className="ans-prog">
              <div className="row between"><b className="small">Outcomes recorded</b><span className="cap tnum">{done}/{reqs.length}</span></div>
              <div className="pbar" style={{ marginTop: 8 }}><div className="bar"><i style={{ width: `${Math.round((done / reqs.length) * 100)}%` }} /></div></div>
            </div>
            <div className="ans-secs">
              {reqs.map((req, k) => {
                const oc = c.outcomes[req.ref];
                return (
                  <button key={req.ref} className={`ans-q ${k === idx ? "on" : ""}`} onClick={() => { setIdx(k); setNote(c.outcomes[req.ref]?.note ?? ""); }} data-test={`ar-${k}`}>
                    <span className={`ans-dot ${oc ? "ok" : ""}`} />
                    <span className="mono" style={{ fontSize: 12, minWidth: 52 }}>{req.ref}</span>
                    <span className="grow ell">{req.t}</span>
                  </button>
                );
              })}
            </div>
          </aside>
          <div className="col gap12" style={{ minWidth: 0 }}>
            <div className="card col gap12">
              <div className="row top">
                <div className="grow">
                  <div className="cap muted">{r.secName} · weight {r.weight || "Normal (2)"}</div>
                  <div className="h3"><span className="mono" style={{ fontSize: 16 }}>{r.ref}</span> {r.t}</div>
                  <p className="small muted" style={{ marginTop: 4 }}>{r.text}</p>
                </div>
              </div>
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
              <Field label="Assessor note" htmlFor="oc-note">
                <textarea className="ta" id="oc-note" rows={2} readOnly={ro} placeholder="What you checked and what you found" value={out.note ?? note} onChange={(e) => saveNote(e.target.value)} />
              </Field>
              {!ro ? (
                <div className="row end">
                  <Button onClick={() => setIdx((i) => Math.min(i + 1, reqs.length - 1))} iconRight={idx === reqs.length - 1 ? undefined : "arrow-right"} testId="oc-save">{idx === reqs.length - 1 ? "Save outcome" : "Save and next"}</Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid side" style={{ marginTop: 16 }}>
          <div className="col gap16">
            <div className="card col gap12">
              <div className="row">
                <div className="grow">
                  <div className="overline">Overall score</div>
                  <div className="row gap8" style={{ alignItems: "baseline" }}><span className="metric">{sc ?? "—"}</span><span className="small muted">{bandOf(sch, sc)}</span></div>
                </div>
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
            <div className="card col gap8">
              <div className="h4">Findings</div>
              {c.findings.length ? c.findings.map((fd) => (
                <div className="row small" key={fd.id}><span className={`chip ${fcOf(fd.cls).tone}`}>{fd.cls}</span><span className="grow">{fd.title}</span><span className="cap mono muted">{fd.ref}</span></div>
              )) : <p className="small muted">No findings raised.</p>}
            </div>
          </div>
          <div className="col gap12">
            <div className="card col gap12">
              <div className="h4">Sign-off</div>
              {ro ? (
                <AlertBox tone="ok" title="Report submitted" body="With NITDA for review." />
              ) : (
                <>
                  <label className="check">
                    <input type="checkbox" checked={decl} disabled={done < reqs.length} onChange={(e) => setDecl(e.target.checked)} />
                    <span className="small">I, {c.lead || "the lead auditor"}, confirm this assessment followed the firm&apos;s methodology and is independent.</span>
                  </label>
                  <Button block icon="seal-check" disabled={done < reqs.length || !decl} onClick={submitReport} testId="so-submit">Sign off and submit report</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
