"use client";

import { use, useReducer, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { TODAY, fmtD } from "@/lib/cases";
import { ENF_CASES, atOf, naira, ENF_TONE, respondToCase, uploadPaymentProof, type EnforcementCase, type EnfEvidence } from "@/lib/enforcement";

function evLink(e: EnfEvidence): string {
  if (!e.id) return "";
  if (e.kind === "finding") return `/organisation/findings/${e.id}`;
  if (e.kind === "result") return `/organisation/report/${e.id}`;
  if (e.kind === "return") return `/organisation/returns/${e.id}`;
  return "";
}

export default function OrgActionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [kind, setKind] = useState<"accept" | "contest">("accept");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<[string, string][]>([]);

  const found = ENF_CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: EnforcementCase = found;
  const t = atOf(c.type);

  function attach() {
    setFiles((fs) => [...fs, [kind === "accept" ? "Fix plan and timeline.pdf" : `Supporting evidence ${fs.length + 1}.pdf`, "240 KB"]]);
    toast("Attached", "ok", "upload-simple");
  }

  function send() {
    if (!text) {
      toast(kind === "accept" ? "Add your fix plan" : "Explain why you disagree", "bad", "warning");
      return;
    }
    respondToCase(c, kind, text, TODAY, "A. Okonkwo");
    bump();
    toast("Response sent to NITDA", "ok", "paper-plane-tilt");
  }

  function uploadProof() {
    uploadPaymentProof(c, TODAY, "A. Okonkwo");
    bump();
    toast("Proof of payment sent", "ok", "upload-simple");
  }

  let side: React.ReactNode;
  if (c.status === "Notice issued" && t.days) {
    side = (
      <>
        <div className="seg" role="tablist">
          {(["accept", "contest"] as const).map((k) => (
            <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)} data-test={`oa-kind-${k}`}>{k === "accept" ? "Accept" : "Contest"}</button>
          ))}
        </div>
        <Field label={kind === "accept" ? "Your fix plan" : "Why you disagree"} htmlFor="oa-text">
          <textarea className="ta" id="oa-text" rows={5} placeholder={kind === "accept" ? "What you will do, who owns it, and by when" : "Explain, and attach your evidence"} value={text} onChange={(e) => setText(e.target.value)} data-test="oa-text" />
        </Field>
        {files.map(([name, size], i) => <div className="file" key={i}><div className="grow"><div className="strong small">{name}</div><div className="cap muted">{size}</div></div></div>)}
        <button className="drop" onClick={attach} data-test="oa-file"><Tile icon="upload-simple" size="sm" /><b className="small">Attach a document</b></button>
        <Button block icon="paper-plane-tilt" onClick={send} testId="oa-send">Send response</Button>
      </>
    );
  } else if (c.status === "Awaiting payment") {
    side = (
      <>
        <AlertBox tone="warn" title={`Pay ${naira(c.penalty?.amount)}`} body={`By ${c.respondBy ? fmtD(c.respondBy) : "the deadline"}. Upload proof once paid.`} />
        {c.penalty?.proof ? (
          <div className="file"><div className="grow"><div className="strong small">{c.penalty.proof[0]}</div><div className="cap muted">{c.penalty.proof[1]}</div></div></div>
        ) : (
          <button className="drop" onClick={uploadProof} data-test="oa-proof"><Tile icon="upload-simple" size="sm" /><b className="small">Upload proof of payment</b></button>
        )}
      </>
    );
  } else if (c.status === "Response received") {
    side = <AlertBox tone="info" title="Response sent" body="NITDA will decide and tell you." />;
  } else {
    side = <AlertBox tone={c.status === "Closed" ? "ok" : "info"} title={c.status} body={c.decision?.outcome ?? ""} />;
  }

  return (
    <AppShell workspace="organisation" crumbs={[{ label: "Compliance", href: "/organisation/compliance" }, { label: "Regulatory actions", href: "/organisation/actions" }, { label: c.ref }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{c.ref} · from NITDA</div>
          <div className="rh-title"><h1 className="h1">{t.name}</h1><Chip tone={ENF_TONE[c.status] ?? "neu"}>{c.status}</Chip></div>
          <div className="rh-meta">Issued {c.issued ? fmtD(c.issued) : ""}{c.respondBy ? ` · respond by ${fmtD(c.respondBy)}` : ""}{c.penalty ? ` · penalty ${naira(c.penalty.amount)}` : ""}</div>
        </div>
      </div>
      <div className="grid side">
        <div className="col gap16">
          {c.notice || c.reason ? (
            <div className="card col gap8">
              <div className="row"><span className="h4 grow">Notice</span>{c.issued ? <span className="cap muted">Issued {fmtD(c.issued)}</span> : <Chip tone="warn">Not issued yet</Chip>}</div>
              {c.notice ? (
                <>
                  <div className="strong small">{c.notice.subject}</div>
                  <div className="letter">{c.notice.body}</div>
                </>
              ) : (
                <p className="small">{c.reason}</p>
              )}
              <Button variant="tertiary" size="sm" icon="download-simple" onClick={() => toast("Notice downloaded")}>Download notice (PDF)</Button>
            </div>
          ) : null}
          {c.evidence.length ? (
            <div className="card col gap8">
              <div className="h4">Evidence</div>
              {c.evidence.map((e, i) => (
                evLink(e) ? (
                  <a key={i} className="small" href={evLink(e)} onClick={(ev) => { ev.preventDefault(); router.push(evLink(e)); }}>{e.label}</a>
                ) : (
                  <span key={i} className="small">{e.label}</span>
                )
              ))}
            </div>
          ) : null}
          {c.decision ? (
            <div className="card col gap8">
              <div className="h4">Decision</div>
              <Kv pairs={[["Outcome", c.decision.outcome], ["By", c.decision.by], ["When", fmtD(c.decision.when)], ...(c.decision.note ? ([["Note", c.decision.note]] as [string, string][]) : [])]} />
            </div>
          ) : null}
          <div className="card col gap12">
            <div className="h4">Timeline</div>
            <div className="timeline">
              {[...c.timeline].reverse().map(([w, who, a], i) => (
                <div className="tl" key={i}><div><div className="small strong">{a}</div><div className="cap muted">{who} · {fmtD(w)}</div></div></div>
              ))}
            </div>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">{c.status === "Notice issued" ? "Your response" : "Status"}</div>
            {side}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
