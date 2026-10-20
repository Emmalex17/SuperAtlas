"use client";

import { use, useReducer, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Field, Button, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { CASES, progOf, regOfProg, qsetQs, answerComplete, questionChoice, saveAnswer, submitAnswers, isSubmitted, TODAY, type Case, type Question } from "@/lib/cases";
import { FIRMS } from "@/lib/mockData";

export default function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [decl, setDecl] = useState(false);

  const found = CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: Case = found;

  const p = progOf(c.prog);
  const fm = FIRMS.find((x) => x.id === c.firm);
  const qs = qsetQs(p.qset);
  const secs = p.qset.sections.filter((s) => s.on);
  const ro = isSubmitted(c);
  const done = qs.filter((q) => answerComplete(q, c.answers[q.id])).length;
  const pct = qs.length ? Math.round((done / qs.length) * 100) : 0;

  function update(qid: string, patch: { v?: string; comment?: string }, q: Question) {
    saveAnswer(c, qid, patch, "A. Okonkwo", TODAY, q);
    bump();
  }

  function attach(qid: string) {
    const a = c.answers[qid] ?? { status: "draft", by: "A. Okonkwo", when: TODAY };
    a.files = [...(a.files ?? []), ["Supporting document.pdf", "412 KB"]];
    c.answers[qid] = a;
    bump();
    toast("File attached");
  }

  function submit() {
    if (!decl || pct < 100) {
      toast("Answer every question and confirm before submitting", "bad");
      return;
    }
    submitAnswers(c, TODAY, "A. Okonkwo", c.org.toUpperCase());
    bump();
    toast(`Submitted. Receipt ${c.receipt}`, "ok", "paper-plane-tilt");
  }

  if (c.receipt && ro) {
    return (
      <AppShell workspace="organisation">
        <div className="card col gap16" style={{ maxWidth: 720 }}>
          <Tile icon="check-circle" tone="solid ok" size="lg" />
          <div className="h3">Your answers are with {fm ? fm.name : "your assessor"}</div>
          <p className="muted small">Receipt <span className="mono">{c.receipt}</span> · submitted {c.submitted} by {c.submittedBy}</p>
          <Button variant="secondary" onClick={() => router.push("/organisation/obligations")}>Back to obligations</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell workspace="organisation">
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{regOfProg(p).ref} {p.ver}</div>
          <div className="rh-title"><h1 className="h1">{p.name}</h1><Chip tone="neu">{c.stage}</Chip></div>
          <div className="rh-meta">Due {c.due} · {fm ? `Assessed by ${fm.name}` : "Needs a firm"}</div>
        </div>
      </div>
      {ro ? (
        <div style={{ margin: "16px 0" }}>
          <AlertBox tone="ok" title={`Submitted ${c.submitted ?? ""}`} body="Answers are locked. Your assessor may ask for more information." />
        </div>
      ) : null}
      <div className="card col gap8" style={{ marginBottom: 16 }}>
        <div className="row between"><b className="small">{done} of {qs.length} answered</b><span className="cap tnum">{pct}%</span></div>
        <div className="pbar"><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>
      </div>
      <div className="col gap16">
        {secs.map((s) => {
          const reqs = s.reqs;
          return (
            <div className="card col gap16" key={s.id}>
              <div className="h4">{s.name}</div>
              {reqs.map((r) =>
                r.questions.map((q) => {
                  const a = c.answers[q.id];
                  const choice = questionChoice(q.hint);
                  const neg = choice === "yn" && (a?.v === "No" || a?.v === "Not applicable");
                  return (
                    <div className="col gap8" key={q.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      <div className="cap muted">{r.ref} · {r.t}</div>
                      <div className="strong small">{q.text}</div>
                      {choice === "yn" ? (
                        <div className="yn">
                          {["Yes", "No", "Not applicable"].map((v) => (
                            <label key={v} className={`yn-o ${a?.v === v ? "on" : ""}`}>
                              <input type="radio" name={`an-${q.id}`} checked={a?.v === v} disabled={ro} onChange={() => update(q.id, { v }, q)} />
                              <span className="radio" />
                              {v}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Field label="Your answer" htmlFor={`an-${q.id}`}>
                          {choice === "text" ? (
                            <textarea className="ta" id={`an-${q.id}`} rows={2} readOnly={ro} value={a?.v ?? ""} onChange={(e) => update(q.id, { v: e.target.value }, q)} />
                          ) : (
                            <input className="inp" id={`an-${q.id}`} type={choice === "number" ? "number" : "date"} readOnly={ro} value={a?.v ?? ""} onChange={(e) => update(q.id, { v: e.target.value }, q)} />
                          )}
                        </Field>
                      )}
                      {neg ? (
                        <Field label={a?.v === "No" ? "What is missing, and when will it be fixed?" : "Why does this not apply?"} htmlFor={`an-c-${q.id}`}>
                          <textarea className="ta" id={`an-c-${q.id}`} rows={2} readOnly={ro} value={a?.comment ?? ""} onChange={(e) => update(q.id, { comment: e.target.value }, q)} />
                        </Field>
                      ) : null}
                      {!ro && (a?.files?.length ?? 0) === 0 ? (
                        <div><Button variant="outline" size="sm" icon="upload-simple" onClick={() => attach(q.id)}>Attach evidence</Button></div>
                      ) : a?.files?.length ? (
                        <div className="row small gap6"><Icon name="paperclip" /><span>{a.files[0][0]}</span></div>
                      ) : null}
                      <div>{answerComplete(q, a) ? <Chip tone="ok" icon="check">Answered</Chip> : null}</div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
      {!ro ? (
        <div className="card col gap12" style={{ marginTop: 16, maxWidth: 560 }}>
          <div className="h4">Submit</div>
          {pct < 100 ? <AlertBox tone="warn" title="Some questions are not answered" body="Submit unlocks when every question is answered." /> : <AlertBox tone="ok" title="Ready to submit" body="Every question has an answer." />}
          <label className="check" style={{ opacity: pct < 100 ? 0.5 : 1 }}>
            <input type="checkbox" checked={decl} disabled={pct < 100} onChange={(e) => setDecl(e.target.checked)} />
            <span className="small">I confirm these answers are accurate and complete, and I am authorised to submit them.</span>
          </label>
          <Button block icon="paper-plane-tilt" disabled={pct < 100 || !decl} onClick={submit} testId="an-submit">Submit to assessor</Button>
        </div>
      ) : null}
    </AppShell>
  );
}
