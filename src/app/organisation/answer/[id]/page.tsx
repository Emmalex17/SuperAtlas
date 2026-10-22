"use client";

import { use, useEffect, useReducer, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Field, Button, Tile, Kv } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  CASES,
  EVIDENCE,
  progOf,
  regOfProg,
  qsetReqs,
  caseQs,
  answerComplete,
  questionChoice,
  saveAnswer,
  isSubmitted,
  toggleFlag,
  assignQuestion,
  saveSectionAssignments,
  addEvidenceFile,
  addEvidenceLink,
  removeEvidenceFile,
  removeEvidenceLink,
  attachFromLibrary,
  TODAY,
  type Case,
  type Question,
} from "@/lib/cases";
import { FIRMS, ORGANISATIONS, orgPeople } from "@/lib/mockData";

const ME = "A. Okonkwo";

/** Reference-only answers from the previous cycle, shown for context — never used as the current answer. */
const PREV: Record<string, [string, string, string]> = {
  "ISR-1.1#0": ["Yes", "Policy v4.1 approved by the board on 12 Sep 2025.", "ISR self-assessment 2025 (imported)"],
  "ISR-4.1#0": ["No", "MFA covered administrators only; remote users were planned for 2026.", "ISR self-assessment 2025 (imported)"],
  "ISR-7.1#0": ["Yes", "Plan in place; tested in November 2025.", "ISR self-assessment 2025 (imported)"],
};

function aiExplain(q: Question, req: { t: string; guidance?: string; evidence?: string[] }): { what: string; ev: string; guidance: string } {
  const ev = (req.evidence ?? []).join("; ");
  const choice = questionChoice(q.hint);
  const what = `NITDA wants to know whether "${req.t}" is in place and working. ${choice === "yn" ? "Answer Yes only if it is fully in place today. If it is partly in place, answer No and explain what is missing and when it will be done." : "Give a short, specific answer."}`;
  return { what, ev, guidance: req.guidance ?? "" };
}

function aiRephrase(t: string): string {
  let s = t.trim().replace(/\s+/g, " ");
  const map: [RegExp, string][] = [[/\bdont\b/gi, "do not"], [/\bdon't\b/gi, "do not"], [/\bwe've\b/gi, "we have"], [/\bit's\b/gi, "it is"], [/\bcant\b|\bcan't\b/gi, "cannot"], [/\bmgt\b/gi, "management"], [/\bQ([1-4]) (\d{2})\b/g, "Q$1 20$2"], [/\bpls\b/gi, "please"], [/\bbcos\b|\bbcoz\b/gi, "because"], [/ ,/g, ","]];
  map.forEach(([a, b]) => { s = s.replace(a, b); });
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/^(we|our|the|this|it)\b/i.test(s)) s = `We confirm that ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

function initialsOf(name: string): string {
  return name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
}

const FILTERS = ["All", "Unanswered", "Mine", "Flagged"] as const;
type Filter = (typeof FILTERS)[number];

export default function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const [qIdx, setQIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>("All");
  const [qParam, setQParam] = useState<number | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [explainFor, setExplainFor] = useState<string | null>(null);
  const [rephrase, setRephrase] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [libOpen, setLibOpen] = useState(false);
  const [libPicked, setLibPicked] = useState<string[]>([]);
  const [prevOpen, setPrevOpen] = useState(false);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("q");
    const n = raw ? parseInt(raw, 10) : NaN;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string (the question index org/submit's lists jump to), which cannot be observed during SSR.
    setQParam(Number.isFinite(n) ? n : -1);
  }, []);

  const found = CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: Case = found;

  const p = progOf(c.prog);
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const fm = FIRMS.find((x) => x.id === c.firm);
  const qs = caseQs(c);
  const reqs = qsetReqs(p.qset);
  const secs = p.qset.sections.filter((s) => s.on);
  const ro = isSubmitted(c);
  const people = o ? orgPeople(o) : [];

  const done = qs.filter((q) => answerComplete(q, c.answers[q.id])).length;
  const pct = qs.length ? Math.round((done / qs.length) * 100) : 0;
  const idx = Math.min(qIdx, qs.length - 1);
  const q = qs[idx];
  const req = reqs.find((r) => r.ref === q.ref)!;
  const a = c.answers[q.id] ?? {};
  const choice = questionChoice(q.hint);
  const neg = choice === "yn" && (a.v === "No" || a.v === "Not applicable");
  const assignee = (x: typeof q) => c.answers[x.id]?.assignee || c.assign[x.sec] || "";

  function isOpen(secId: string) {
    return open[secId] ?? secId === q.sec;
  }

  function goTo(k: number) {
    const next = Math.max(0, Math.min(k, qs.length - 1));
    setQIdx(next);
    setOpen((prev) => ({ ...prev, [qs[next].sec]: true }));
    setExplainFor(null);
    setRephrase(null);
  }

  useEffect(() => {
    if (qParam != null && qParam >= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time jump to the question org/submit's lists linked to, driven by the URL query string read above.
      goTo(qParam);
      setQParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once when the one-time URL-read effect above resolves `qParam`; `goTo` itself is stable within a render.
  }, [qParam]);

  function shown(x: typeof q) {
    if (filter === "All") return true;
    if (filter === "Unanswered") return !answerComplete(x, c.answers[x.id]);
    if (filter === "Mine") return assignee(x) === ME;
    return !!c.answers[x.id]?.flag;
  }

  function update(patch: { v?: string; comment?: string }) {
    saveAnswer(c, q.id, patch, ME, TODAY, q);
    bump();
  }

  function save() {
    const current = c.answers[q.id];
    if (!answerComplete(q, current)) {
      toast(choice && !current?.v ? "Choose an answer first" : current?.v === "No" || current?.v === "Not applicable" ? "Explain your answer before saving" : q.evidence ? "Attach evidence, or answer No and explain" : "Complete the answer", "bad");
      return;
    }
    if (idx < qs.length - 1) goTo(idx + 1);
    else { bump(); toast("Saved"); }
  }

  const ass = Object.values(c.assign).filter(Boolean).length;

  return (
    <AppShell workspace="organisation" crumbs={[{ label: "Obligations", href: "/organisation/obligations" }, { label: p.name }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{o?.name}</div>
          <div className="rh-title"><h1 className="h1">{p.name}</h1><Chip tone="neu">{c.stage}</Chip></div>
          <div className="rh-meta">Due {TODAY <= c.due ? c.due : c.due} · {fm ? `Assessed by ${fm.name}` : "Needs a firm"} · {p.preview ? "Outcome preview on" : "Results when published"}</div>
        </div>
        <div className="rh-act">
          {!ro ? <Button variant="outline" icon="users" testId="an-assign" onClick={() => { setAssignDraft({ ...c.assign }); setAssignOpen(true); }}>Assign questions{ass ? ` (${ass})` : ""}</Button> : null}
        </div>
      </div>

      {ro ? (
        <div style={{ margin: "16px 0" }}>
          <AlertBox
            tone="ok"
            title={`Submitted ${c.submitted ?? ""}`}
            body="Answers are locked. Your assessor may ask for more information."
            actions={c.stage === "In preview" ? <Button size="sm" onClick={() => router.push(`/organisation/assessment/${c.id}`)}>Open outcome preview</Button> : undefined}
          />
        </div>
      ) : null}

      <div className="ans-grid" style={{ marginTop: 16 }}>
        <aside className="ans-nav">
          <div className="ans-prog">
            <div className="row between"><b className="small">{regOfProg(p).ref} {p.ver}</b><Chip tone="brand">{secs.length} sections</Chip></div>
            <div className="pbar" style={{ marginTop: 8 }}><div className="bar"><i style={{ width: `${pct}%` }} /></div><span className="cap tnum">{pct}%</span></div>
            <div className="cap muted">{done} of {qs.length} answered</div>
          </div>
          <div className="seg sm ans-flt">
            {FILTERS.map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
          <div className="ans-secs">
            {secs.map((s) => {
              const sq = qs.filter((x) => x.sec === s.id);
              const sd = sq.filter((x) => answerComplete(x, c.answers[x.id])).length;
              const vis = sq.filter(shown);
              if (!vis.length && filter !== "All") return null;
              return (
                <div className="ans-sec" key={s.id}>
                  <button className="ans-sh" onClick={() => setOpen((prev) => ({ ...prev, [s.id]: !isOpen(s.id) }))}>
                    <Icon name={isOpen(s.id) ? "caret-down" : "caret-right"} />
                    <span className="grow">{s.name}</span>
                    <span className={`cap tnum ${sd === sq.length ? "ok-t" : "muted"}`}>{sd}/{sq.length}</span>
                    {c.assign[s.id] ? <span className="av s20" title={`Section assigned to ${c.assign[s.id]}`}>{initialsOf(c.assign[s.id])}</span> : null}
                  </button>
                  {isOpen(s.id)
                    ? vis.map((x) => {
                        const k = qs.indexOf(x);
                        const ok = answerComplete(x, c.answers[x.id]);
                        const as_ = assignee(x);
                        return (
                          <button key={x.id} className={`ans-q ${k === idx ? "on" : ""}`} data-test={`aq-${k}`} onClick={() => goTo(k)}>
                            <span className={`ans-dot ${ok ? "ok" : c.answers[x.id] ? "part" : ""}`} />
                            <span className="grow ell">{k + 1}. {x.text}</span>
                            {c.answers[x.id]?.flag ? <Icon name="flag" /> : null}
                            {as_ ? <span className="av s20" title={as_}>{initialsOf(as_)}</span> : null}
                          </button>
                        );
                      })
                    : null}
                </div>
              );
            })}
          </div>
          {!ro ? <Button block variant={pct === 100 ? "primary" : "secondary"} testId="go-submit" onClick={() => router.push(`/organisation/answer/${c.id}/submit`)}>Review and submit</Button> : null}
        </aside>

        <div className="col gap12" style={{ minWidth: 0 }}>
          <section className="ans-card">
            <div className="ans-qh">
              <button className="icon-btn" aria-label="Previous question" disabled={idx === 0} onClick={() => goTo(idx - 1)}><Icon name="caret-left" /></button>
              <span className="cap" style={{ color: "var(--brand-200)" }}>Question {idx + 1} of {qs.length} · {q.ref}</span>
              <button className="icon-btn" aria-label="Next question" disabled={idx === qs.length - 1} onClick={() => goTo(idx + 1)}><Icon name="caret-right" /></button>
              <span className="grow" />
              {!ro ? (
                <button className="icon-btn" aria-label="Flag" title={a.flag ? "Remove flag" : "Flag for the compliance officer"} onClick={() => { toggleFlag(c, q.id, ME, TODAY); bump(); toast(a.flag ? "Flag removed" : "Flagged for the compliance officer", "info", "flag"); }}>
                  <Icon name={a.flag ? "flag-banner" : "flag"} />
                </button>
              ) : null}
            </div>
            <div className="ans-qt">{q.text}</div>
          </section>

          <div className="card col gap16">
            <div className="ctx">
              <div className="row top">
                <div className="grow">
                  <div className="cap muted">{req.secName} · {req.ref} {req.t}</div>
                  <p className="small" style={{ marginTop: 4 }}>{req.text}</p>
                </div>
                <Button variant="tertiary" size="sm" icon="sparkle" testId="an-explain" onClick={() => setExplainFor(explainFor === q.id ? null : q.id)}>Explain this question</Button>
              </div>
              {explainFor === q.id ? (() => {
                const { what, ev, guidance } = aiExplain(q, req);
                return (
                  <div className="ai-box">
                    <p><b>What this asks:</b> {what}</p>
                    {ev ? <p><b>Evidence that usually works:</b> {ev}.</p> : null}
                    {guidance ? <p><b>NITDA guidance:</b> {guidance}</p> : null}
                    <div className="cap muted"><Icon name="sparkle" /> AI explanation from the regulation and NITDA&apos;s guidance. It does not answer for you.</div>
                  </div>
                );
              })() : null}
            </div>

            {choice === "yn" ? (
              <div className="field">
                <label>Your answer</label>
                <div className="yn">
                  {["Yes", "No", "Not applicable"].map((v) => (
                    <label key={v} className={`yn-o ${a.v === v ? "on" : ""}`} data-test={`yn-${v.split(" ")[0]}`}>
                      <input type="radio" name="an-v" checked={a.v === v} disabled={ro} onChange={() => update({ v })} />
                      <span className="radio" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <Field label="Your answer" htmlFor="an-v">
                {choice === "text" ? (
                  <textarea className="ta" id="an-v" rows={2} readOnly={ro} value={a.v ?? ""} onChange={(e) => update({ v: e.target.value })} />
                ) : (
                  <input className="inp" id="an-v" type={choice === "number" ? "number" : "date"} readOnly={ro} value={a.v ?? ""} onChange={(e) => update({ v: e.target.value })} />
                )}
              </Field>
            )}

            {q.comment || neg ? (
              <div className="field">
                <div className="row between">
                  <label htmlFor="an-c">{neg ? (a.v === "No" ? "What is missing, and when will it be fixed?" : "Why does this not apply?") : <>Explain your answer <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></>}</label>
                  {!ro ? <Button variant="tertiary" size="sm" icon="sparkle" testId="an-rephrase" onClick={() => { const t = a.comment ?? ""; if (!t) { toast("Write your explanation first. AI only tidies your own words.", "info", "sparkle"); return; } setRephrase(aiRephrase(t)); }}>Rephrase with AI</Button> : null}
                </div>
                <textarea className="ta" id="an-c" rows={3} readOnly={ro} placeholder="Write in your own words. AI can tidy the wording, not the facts." value={a.comment ?? ""} onChange={(e) => update({ comment: e.target.value })} />
                {rephrase ? (
                  <div className="ai-box">
                    <div className="cap muted"><Icon name="sparkle" /> Suggested wording (same facts)</div>
                    <p className="small">{rephrase}</p>
                    <div className="row gap8">
                      <Button size="sm" testId="an-rephrase-use" onClick={() => { update({ comment: rephrase }); setRephrase(null); toast("Wording updated"); }}>Use this</Button>
                      <Button variant="tertiary" size="sm" onClick={() => setRephrase(null)}>Keep mine</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {q.evidence ? (
              <div className="field">
                <label>Attach the proof {neg ? <span className="muted" style={{ fontWeight: 400 }}>(optional for this answer)</span> : null}</label>
                <div className="ev-box">
                  {(a.files ?? []).map((f, i) => (
                    <div className="file" key={i}>
                      <Tile icon="file-text" tone="ok" size="sm" />
                      <div className="grow"><div className="strong small">{f[0]}</div><div className="cap muted">{f[1]}</div></div>
                      {!ro ? <button className="icon-btn" aria-label="Remove" onClick={() => { removeEvidenceFile(c, q.id, i); bump(); }}><Icon name="x" /></button> : null}
                    </div>
                  ))}
                  {a.link ? (
                    <div className="file">
                      <Tile icon="link" tone="info" size="sm" />
                      <div className="grow"><div className="strong small ell">{a.link}</div><div className="cap muted">Link</div></div>
                      {!ro ? <button className="icon-btn" aria-label="Remove" onClick={() => { removeEvidenceLink(c, q.id); bump(); }}><Icon name="x" /></button> : null}
                    </div>
                  ) : null}
                  {!ro ? (
                    <div className="ev-acts">
                      <Button
                        variant="outline"
                        size="sm"
                        icon="upload-simple"
                        testId="an-upload"
                        onClick={() => {
                          const nm = `${req.evidence?.[(a.files?.length ?? 0) % Math.max(1, req.evidence?.length ?? 1)] ?? "Supporting document"}.pdf`;
                          addEvidenceFile(c, q.id, nm, "820 KB · uploaded just now", ME, TODAY, c.org);
                          bump();
                          toast("File uploaded and saved to your evidence library", "ok", "upload-simple");
                        }}
                      >
                        Upload
                      </Button>
                      <Button variant="outline" size="sm" icon="link" testId="an-link" onClick={() => setLinkOpen(true)}>Add a link</Button>
                      <Button variant="outline" size="sm" icon="folder-open" testId="an-lib" onClick={() => { setLibPicked([]); setLibOpen(true); }}>From evidence library</Button>
                    </div>
                  ) : null}
                  {req.evidence?.length ? <div className="cap muted">Expected: {req.evidence.join("; ")}</div> : null}
                </div>
              </div>
            ) : null}

            {q.interview ? (
              <div className="iv-note">
                <Tile icon="video-camera" tone="ai" size="sm" />
                <div className="grow">
                  <b className="small">Interview</b>
                  <div className="cap muted">{c.interviews.some((x) => x.qid === q.id) ? "Interview arranged. See it under Interviews when your assessor confirms a time." : "Your assessor will ask to speak to the person responsible. You choose a time when they propose slots."}</div>
                </div>
              </div>
            ) : null}

            <div className="ans-foot">
              <div className="row gap8 wrap">
                {!ro ? (
                  <>
                    <span className="cap muted">Assigned to</span>
                    <select className="sel" style={{ width: 170, height: 32 }} value={assignee(q)} onChange={(e) => { assignQuestion(c, q.id, e.target.value, ME, TODAY); bump(); toast(e.target.value ? `Assigned to ${e.target.value}` : "Unassigned"); }}>
                      <option value="">Nobody</option>
                      {people.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </>
                ) : null}
                {PREV[q.id] ? <Button variant="tertiary" size="sm" icon="clock-counter-clockwise" onClick={() => setPrevOpen(true)}>Previous answer</Button> : null}
              </div>
              <div className="row gap8">
                {answerComplete(q, a) ? <Chip tone="ok" icon="check">Answered</Chip> : a.by ? <Chip tone="warn">Incomplete</Chip> : null}
                {!ro ? <Button iconRight={idx === qs.length - 1 ? undefined : "arrow-right"} testId="an-save" onClick={save}>{idx === qs.length - 1 ? "Save" : "Save and next"}</Button> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)}>
        <div className="row"><h2 className="h3">Add a link</h2></div>
        <p className="muted small">For example a SharePoint or Google Drive document your assessor can open.</p>
        <form
          className="col gap16"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^https?:\/\/\S+\.\S+/.test(linkUrl)) { toast("Enter a full link starting with https://", "bad"); return; }
            addEvidenceLink(c, q.id, linkUrl, ME, TODAY);
            setLinkOpen(false);
            setLinkUrl("");
            bump();
            toast("Link added");
          }}
        >
          <Field label="Link" htmlFor="al-url"><input className="inp" id="al-url" placeholder="https://" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} /></Field>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button type="submit" testId="al-go">Add link</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={libOpen} onClose={() => setLibOpen(false)} wide>
        <div className="row"><h2 className="h3">Choose from your evidence library</h2></div>
        <p className="muted small">Files you uploaded before. One file can support many questions.</p>
        <div className="col gap8">
          {EVIDENCE.filter((e) => e.org === c.org).map((e) => (
            <label className="choice" key={e.id}>
              <input type="checkbox" className="sr" checked={libPicked.includes(e.id)} onChange={(ev) => setLibPicked((prev) => (ev.target.checked ? [...prev, e.id] : prev.filter((x) => x !== e.id)))} />
              <span className="radio" style={{ borderRadius: 6 }} />
              <Tile icon="file-text" size="sm" />
              <span className="grow"><b className="small">{e.name}</b><br /><span className="cap muted">{e.kind} · {e.when}{e.links.length ? ` · used ${e.links.length} time${e.links.length > 1 ? "s" : ""}` : ""}</span></span>
            </label>
          ))}
        </div>
        <div className="row end">
          <Button variant="outline" onClick={() => setLibOpen(false)}>Cancel</Button>
          <Button
            testId="lib-go"
            onClick={() => {
              if (!libPicked.length) { toast("Choose at least one file", "bad"); return; }
              attachFromLibrary(c, q.id, libPicked, ME, TODAY);
              setLibOpen(false);
              bump();
              toast(`${libPicked.length} file${libPicked.length > 1 ? "s" : ""} attached`);
            }}
          >
            Attach selected
          </Button>
        </div>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} wide>
        <div className="row"><h2 className="h3">Assign questions</h2></div>
        <p className="muted small">Give each section to a colleague. You can change single questions on the question itself.</p>
        <div className="col gap8">
          {secs.map((s) => (
            <div className="row" style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }} key={s.id}>
              <span className="grow"><b className="small">{s.name}</b><br /><span className="cap muted">{qs.filter((x) => x.sec === s.id).length} questions</span></span>
              <select className="sel" style={{ width: 190 }} value={assignDraft[s.id] ?? ""} onChange={(e) => setAssignDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}>
                <option value="">Nobody</option>
                {people.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}
        </div>
        {people.length < 2 ? <div className="note"><Icon name="user-plus" /><span>Invite colleagues from Team to share the work.</span></div> : null}
        <div className="row end">
          <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button
            testId="as-go"
            onClick={() => {
              saveSectionAssignments(c, assignDraft);
              setAssignOpen(false);
              bump();
              toast("Assignments saved. Colleagues are emailed.", "ok", "users");
            }}
          >
            Save assignments
          </Button>
        </div>
      </Dialog>

      <Dialog open={prevOpen} onClose={() => setPrevOpen(false)}>
        {PREV[q.id] ? (
          <>
            <div className="row"><Icon name="clock-counter-clockwise" /><h2 className="h3">Previous answer</h2></div>
            <p className="muted small">{PREV[q.id][2]}</p>
            <Kv pairs={[["Answer", PREV[q.id][0]], ["Explanation", PREV[q.id][1]]]} />
            <p className="cap muted">Shown for reference. Answer for today.</p>
            <div className="row end"><Button variant="outline" onClick={() => setPrevOpen(false)}>Close</Button></div>
          </>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
