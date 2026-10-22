"use client";

import { use, useReducer, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile, Kv, AlertBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { CASES, progOf, caseQs, answerComplete, submitAnswers, fmtD, type Case, type Question } from "@/lib/cases";
import { FIRMS } from "@/lib/mockData";

const ME = "A. Okonkwo";

type QsRow = Question & { ref: string; sec: string };

function JumpList({ list, allQs, caseId, emptyText, router }: { list: QsRow[]; allQs: QsRow[]; caseId: string; emptyText: string; router: ReturnType<typeof useRouter> }) {
  if (!list.length) return <p className="small muted">{emptyText}</p>;
  return (
    <div className="list" style={{ margin: "0 -20px -20px" }}>
      {list.map((qq) => (
        <button key={qq.id} className="list-row" onClick={() => router.push(`/organisation/answer/${caseId}?q=${allQs.indexOf(qq)}`)}>
          <span className="mono small" style={{ color: "var(--brand-600)", minWidth: 60 }}>{qq.ref}</span>
          <span className="grow ell">{qq.text}</span>
          <Icon name="caret-right" />
        </button>
      ))}
    </div>
  );
}

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
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
  const qs = caseQs(c);
  const secs = p.qset.sections.filter((s) => s.on);

  if (c.receipt) {
    const files = qs.reduce((n, qq) => n + (c.answers[qq.id]?.files?.length ?? 0) + (c.answers[qq.id]?.link ? 1 : 0), 0);
    return (
      <AppShell workspace="organisation" crumbs={[{ label: "Obligations", href: "/organisation/obligations" }, { label: p.name, href: `/organisation/answer/${c.id}` }, { label: "Review and submit" }]}>
        <PageHead title="Submitted" sub={p.name} />
        <div className="card col gap16" style={{ maxWidth: 720 }}>
          <Tile icon="check-circle" tone="solid ok" size="lg" />
          <div className="h3">Your answers are with {fm ? fm.name : "your assessor"}</div>
          <Kv
            pairs={[
              ["Receipt", <span className="mono" key="r">{c.receipt}</span>],
              ["Submitted", `${c.submitted} by ${c.submittedBy}`],
              ["Questions", `${qs.length} answered`],
              ["Evidence", `${files} files and links`],
            ]}
          />
          <div className="row">
            <Button variant="outline" icon="download-simple" onClick={() => toast("Copy downloaded")}>Download a copy (PDF)</Button>
            <Button variant="secondary" onClick={() => router.push("/organisation/obligations")}>Back to obligations</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const unans = qs.filter((qq) => !answerComplete(qq, c.answers[qq.id]));
  const noA = qs.filter((qq) => c.answers[qq.id]?.v === "No");
  const flagged = qs.filter((qq) => c.answers[qq.id]?.flag);
  const done = qs.length - unans.length;

  function submit() {
    if (!decl) { toast("Tick the confirmation to submit", "bad"); return; }
    submitAnswers(c, "Today, 21:40", ME, c.org.toUpperCase());
    bump();
    toast(`Submitted. Receipt ${c.receipt}`, "ok", "paper-plane-tilt");
  }

  return (
    <AppShell workspace="organisation" crumbs={[{ label: "Obligations", href: "/organisation/obligations" }, { label: p.name, href: `/organisation/answer/${c.id}` }, { label: "Review and submit" }]}>
      <PageHead title="Review and submit" sub={`${p.name} · due ${fmtD(c.due)}. Check the answers, then submit them to your assessor. You cannot change them afterwards.`} />
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap12">
            <div className="row"><span className="h4 grow">By section</span><span className="cap muted">{done} of {qs.length} answered</span></div>
            {secs.map((s) => {
              const sq = qs.filter((qq) => qq.sec === s.id);
              const sd = sq.filter((qq) => answerComplete(qq, c.answers[qq.id])).length;
              return (
                <div className="row small" key={s.id}>
                  <span className="grow">{s.name}</span>
                  <span style={{ width: 220 }}>
                    <div className="pbar"><div className="bar"><i style={{ width: `${Math.round((sd / sq.length) * 100)}%` }} /></div><span className="cap tnum">{sd}/{sq.length}</span></div>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="card col gap8">
            <div className="row"><span className="h4 grow">Not answered yet</span><Chip tone="neu">{unans.length}</Chip></div>
            <JumpList list={unans} allQs={qs} caseId={c.id} emptyText="Every question is answered." router={router} />
          </div>
          <div className="card col gap8">
            <div className="row"><span className="h4 grow">Answered No</span><Chip tone="neu">{noA.length}</Chip></div>
            <JumpList list={noA} allQs={qs} caseId={c.id} emptyText="None." router={router} />
          </div>
          <div className="card col gap8">
            <div className="row"><span className="h4 grow">Flagged for you</span><Chip tone="neu">{flagged.length}</Chip></div>
            <JumpList list={flagged} allQs={qs} caseId={c.id} emptyText="Nothing flagged." router={router} />
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">Submit</div>
            {unans.length ? (
              <AlertBox tone="warn" title={`${unans.length} question${unans.length > 1 ? "s" : ""} to finish`} body="Submit unlocks when every question is answered." />
            ) : (
              <AlertBox tone="ok" title="Ready to submit" body="Every question has an answer." />
            )}
            <label className="check" style={{ opacity: unans.length ? 0.5 : 1 }}>
              <input type="checkbox" checked={decl} disabled={!!unans.length} onChange={(e) => setDecl(e.target.checked)} />
              <span className="small">I confirm these answers are accurate and complete, and I am authorised to submit them.</span>
            </label>
            <Button block icon="paper-plane-tilt" disabled={unans.length > 0} onClick={submit} testId="an-submit">Submit to assessor</Button>
            <p className="cap muted">Only the compliance officer or organisation admin can submit.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
