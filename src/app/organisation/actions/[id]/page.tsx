"use client";

import { use, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { TODAY } from "@/lib/cases";
import { ENF_CASES, atOf, naira, ENF_TONE, respondToCase, uploadPaymentProof, type EnforcementCase } from "@/lib/enforcement";

export default function OrgActionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
        <AlertBox tone="warn" title={`Pay ${naira(c.penalty?.amount)}`} body={`By ${c.respondBy || "the deadline"}. Upload proof once paid.`} />
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
    <AppShell workspace="organisation">
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{c.ref} · from NITDA</div>
          <div className="rh-title"><h1 className="h1">{t.name}</h1><Chip tone={ENF_TONE[c.status] ?? "neu"}>{c.status}</Chip></div>
          <div className="rh-meta">Issued {c.issued}{c.respondBy ? ` · respond by ${c.respondBy}` : ""}{c.penalty ? ` · penalty ${naira(c.penalty.amount)}` : ""}</div>
        </div>
      </div>
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap8"><div className="h4">Reason</div><p className="small">{c.reason}</p></div>
          {c.evidence.length ? (
            <div className="card col gap8">
              <div className="h4">Evidence</div>
              {c.evidence.map((e, i) => <div className="row small" key={i}><span>{e.label}</span></div>)}
            </div>
          ) : null}
          <div className="card col gap12">
            <div className="h4">Timeline</div>
            <div className="timeline">
              {[...c.timeline].reverse().map(([w, who, a], i) => (
                <div className="tl" key={i}><div><div className="small strong">{a}</div><div className="cap muted">{who} · {w}</div></div></div>
              ))}
            </div>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">{c.status === "Notice issued" ? "Your response" : "Status"}</div>
            {side}
          </div>
          <div className="card col gap8">
            <div className="h4">Details</div>
            <Kv pairs={[["Action", t.name], ["Days to respond", t.days ? `${t.days} days` : "—"]]} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
