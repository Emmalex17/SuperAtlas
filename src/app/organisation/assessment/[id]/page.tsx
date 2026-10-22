"use client";

import { use, useReducer, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Tabs, Button, Tile, AlertBox, Kv, StatusChip } from "@/components/ui";
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
  replyToThread,
  confirmInterviewSlot,
  addPreviewComment,
  fmtDT,
  TODAY,
  type Case,
} from "@/lib/cases";
import { FIRMS } from "@/lib/mockData";

type Tab = "requests" | "interviews" | "preview" | "answers";

const DONE_STAGES = ["Report submitted", "In review", "Approved", "Scheduled", "Held back", "Published"];
const ME = "A. Okonkwo";

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

export default function OrgAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("requests");
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const found = CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: Case = found;

  const p = progOf(c.prog);
  const f = FIRMS.find((x) => x.id === c.firm);
  const sch = schemeOf(p.scheme);
  const qs = caseQs(c);
  const openTh = c.threads.filter((t) => t.status === "Open").length;
  const ivs = c.interviews;

  return (
    <AppShell workspace="organisation" crumbs={[{ label: "Obligations", href: "/organisation/obligations" }, { label: p.name }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{f ? `Assessment by ${f.name}` : "Assessment"}</div>
          <div className="rh-title"><h1 className="h1">{p.name}</h1><StatusChip status={c.stage} /></div>
          <div className="rh-meta">{c.submitted ? <>Submitted {c.submitted}{c.receipt ? <> · receipt <span className="mono">{c.receipt}</span></> : null}</> : "Not submitted yet"}</div>
        </div>
      </div>
      <Tabs
        items={[
          { id: "requests", label: "Requests from assessor", count: openTh || undefined },
          { id: "interviews", label: "Interviews", count: ivs.filter((i) => i.status === "Times proposed").length || undefined },
          { id: "preview", label: "Outcome preview" },
          { id: "answers", label: "Your answers" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "requests" ? (
        <div style={{ marginTop: 16 }}>
          <ThreadsPanel
            c={c}
            side="org"
            onReply={(threadIndex, text, file) => {
              replyToThread(c, threadIndex, text, ME, TODAY, file);
              bump();
              toast("Reply sent");
            }}
          />
        </div>
      ) : null}

      {tab === "interviews" ? (
        <div className="col gap12" style={{ marginTop: 16 }}>
          {ivs.length ? (
            ivs.map((iv, i) => {
              const q = qs.find((x) => x.id === iv.qid);
              return (
                <div className="card col gap12" key={i}>
                  <div className="row top">
                    <div className="grow">
                      <div className="cap mono muted">{q?.ref}</div>
                      <div className="strong">{q?.text}</div>
                      <div className="cap muted">Attendee: {iv.who}</div>
                    </div>
                    <Chip tone={iv.status === "Confirmed" ? "ok" : iv.status === "Held" ? "neu" : "warn"}>{iv.status}</Chip>
                  </div>
                  {iv.status === "Times proposed" ? (
                    <div className="field">
                      <label>Pick a time (WAT)</label>
                      <div className="grid g3" style={{ gap: 8 }}>
                        {iv.slots.map((s, k) => (
                          <button
                            key={k}
                            type="button"
                            className="choice"
                            data-test={`iv-pick-${k}`}
                            onClick={() => {
                              confirmInterviewSlot(c, i, k);
                              bump();
                              toast("Interview confirmed and added to calendars", "ok", "video-camera");
                            }}
                          >
                            <span className="radio" />
                            <span><b className="small">{fmtDT(s)}</b></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : iv.at ? (
                    <Kv pairs={[["When", fmtDT(iv.at)], ["Link", <span className="small" key="l">{iv.link}</span>]]} />
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="card">
              <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                <Tile icon="video-camera" size="lg" />
                <div className="h4">No interviews yet</div>
                <p className="muted small">Your assessor proposes times for questions that need an interview.</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {tab === "preview" ? (
        <div style={{ marginTop: 16 }}>
          {!c.previewAt ? (
            <div className="card">
              <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                <Tile icon="eye" size="lg" />
                <div className="h4">No preview yet</div>
                <p className="muted small">{p.preview ? "Your assessor shares outcomes here before submitting the report." : "This programme does not use outcome preview. You see results when the report is published."}</p>
              </div>
            </div>
          ) : (
            <>
              <AlertBox tone="info" icon="eye" title="Preview only" body={`These are ${f?.name}'s outcomes before the report is submitted. You can comment on any of them. You cannot change them.`} />
              <div className="grid side" style={{ marginTop: 16 }}>
                <div className="card p0">
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Requirement</th><th>Outcome</th><th>Assessor note</th><th className="act-col" /></tr></thead>
                      <tbody>
                        {qsetReqs(p.qset).map((r) => {
                          const o = c.outcomes[r.ref] ?? { o: "", note: "" };
                          const cm = c.previewComments?.find((m) => m.ref === r.ref);
                          return (
                            <tr key={r.ref}>
                              <td className="wrap"><span className="mono small" style={{ color: "var(--brand-600)" }}>{r.ref}</span> <span className="small">{r.t}</span></td>
                              <td>{o.o ? <Chip tone={outTone(sch, o.o)}>{o.o}</Chip> : "—"}</td>
                              <td className="wrap small muted">
                                {o.note || ""}
                                {cm ? <div className="cap" style={{ color: "var(--brand-600)", marginTop: 4 }}><Icon name="chat-text" /> Your comment: {cm.text}</div> : null}
                              </td>
                              <td className="act-col">
                                {!DONE_STAGES.includes(c.stage) ? (
                                  <Button variant="tertiary" size="sm" testId={`pv-c-${r.ref}`} onClick={() => { setCommentFor(r.ref); setCommentText(cm?.text ?? ""); }}>{cm ? "Edit comment" : "Comment"}</Button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card col gap8">
                  <div className="overline">Score in preview</div>
                  <div className="row gap8" style={{ alignItems: "baseline" }}><span className="metric">{caseScore(c) ?? "—"}</span><span className="small muted">{bandOf(sch, caseScore(c))}</span></div>
                  {outCounts(c, sch)}
                  <p className="cap muted">Final scores are set when NITDA approves the report.</p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "answers" ? (
        <div className="card col gap8" style={{ marginTop: 16 }}>
          <div className="note"><Icon name="lock-simple" /><span>Your submitted answers are locked.</span></div>
          <div><Button variant="secondary" onClick={() => router.push(`/organisation/answer/${c.id}`)}>Open your answers</Button></div>
        </div>
      ) : null}

      <Dialog open={!!commentFor} onClose={() => setCommentFor(null)}>
        <div className="row"><Icon name="chat-text" /><h2 className="h3">Comment on this outcome</h2></div>
        <p className="muted small">{commentFor}. The assessor sees your comment; the outcome stays theirs to decide.</p>
        <form
          className="col gap12"
          onSubmit={(e) => {
            e.preventDefault();
            if (!commentText) { toast("Write your comment", "bad"); return; }
            addPreviewComment(c, commentFor!, commentText, ME, TODAY);
            setCommentFor(null);
            bump();
            toast("Comment sent to the assessor");
          }}
        >
          <textarea className="ta" rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setCommentFor(null)}>Cancel</Button>
            <Button type="submit" testId="pc-go">Send comment</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
