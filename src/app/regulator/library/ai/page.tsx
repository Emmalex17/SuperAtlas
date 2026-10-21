"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile, AlertBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { AI_EXTRACT_SEED, publishAiRegulation, type AiExtractItem } from "@/lib/cases";

const STEPS = ["Upload", "Read", "Review drafts"];

export default function AddRegulationWithAiPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Cyber Resilience Regulation 2026");
  const [items, setItems] = useState<AiExtractItem[]>(() => AI_EXTRACT_SEED.map((x) => ({ ...x })));
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const acc = items.filter((x) => x.state === "accepted").length;
  const rej = items.filter((x) => x.state === "rejected").length;
  const left = items.length - acc - rej;

  function upload() {
    setStep(1);
    timerRef.current = setTimeout(() => setStep(2), 1400);
  }
  function setItemState(i: number, state: AiExtractItem["state"]) {
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, state } : x)));
  }
  function saveEdit(i: number) {
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, t: editText || x.t, state: "accepted", warn: undefined } : x)));
    setEditing(null);
    toast("Draft edited and accepted");
  }
  function acceptHigh() {
    setItems((prev) => prev.map((x) => (x.conf >= 85 && !x.state ? { ...x, state: "accepted" } : x)));
  }
  function publish() {
    const accepted = items.filter((x) => x.state === "accepted");
    const id = publishAiRegulation(name, accepted);
    toast(`${accepted.length} requirements added as a draft regulation`, "ok", "sparkle");
    router.push(`/regulator/library/${id}`);
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Requirements library", href: "/regulator/library" }, { label: "Add with AI" }]}>
      <PageHead title="Add a regulation with AI" sub="Upload the regulation. AI drafts the requirements; your team decides what goes in." />

      <div className="stepper">
        {STEPS.map((s, i) => {
          const cur = Math.min(step, 2);
          return (
            <span key={s} className="row" style={{ gap: 8 }}>
              {i > 0 ? <span className="step-line" /> : null}
              <span className={`step ${i < cur ? "done" : i === cur ? "on" : ""}`}>
                <span className="n">{i < cur ? <Icon name="check" /> : i + 1}</span>
                {s}
              </span>
            </span>
          );
        })}
      </div>

      {step === 0 && (
        <div className="grid side">
          <div className="card col gap16">
            <div className="field">
              <label htmlFor="ai-name">Regulation name</label>
              <input className="inp" id="ai-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid g2" style={{ gap: 16 }}>
              <div className="field">
                <label htmlFor="ai-ver">Version</label>
                <input className="inp" id="ai-ver" defaultValue="v1.0" />
              </div>
              <div className="field">
                <label htmlFor="ai-eff">Effective date</label>
                <input className="inp" id="ai-eff" type="date" defaultValue="2026-12-01" />
              </div>
            </div>
            <button className="drop" style={{ padding: 40 }} onClick={upload} data-test="ai-upload">
              <Tile icon="file-text" tone="ai" size="lg" />
              <b>Upload the regulation as a PDF</b>
              <span className="cap muted">Up to 200 pages. Demo: uses a sample 22-page PDF.</span>
            </button>
          </div>
          <div className="card col gap12">
            <Tile icon="sparkle" tone="ai" size="lg" />
            <div className="h4">How it works</div>
            {[
              "AI reads the document and drafts one requirement per obligation",
              "Each draft shows the page it came from and a confidence score",
              "Your staff accept, edit or reject every draft. Nothing is published without a person",
            ].map((t, i) => (
              <div className="row top small" key={i}>
                <span className="av s24">{i + 1}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card col gap16" style={{ alignItems: "center", textAlign: "center", padding: 56 }}>
          <Tile icon="sparkle" tone="ai" size="lg" />
          <div className="h3">Reading cyber-resilience-regulation.pdf</div>
          <p className="muted small">22 pages · finding obligations and expected evidence</p>
          <div className="bar" style={{ width: "min(420px, 100%)" }}><i style={{ width: "54%" }} /></div>
        </div>
      )}

      {step === 2 && (
        <>
          <AlertBox
            tone="ai"
            title={`${items.length} requirements drafted from 22 pages`}
            body="Check each one against the source page. Low-confidence drafts are marked."
            actions={<Button variant="secondary" size="sm" testId="ai-accept-high" onClick={acceptHigh}>Accept all above 85%</Button>}
          />
          <div className="row wrap gap8">
            <Chip tone="ok" icon="check">{acc} accepted</Chip>
            <Chip tone="neu" icon="x">{rej} rejected</Chip>
            <Chip tone={left ? "info" : "ok"}>{left} to review</Chip>
          </div>
          <div className="col gap12">
            {items.map((x, i) => (
              <div
                className="card tight row top"
                key={x.ref}
                style={x.state === "accepted" ? { boxShadow: "0 0 0 1.5px var(--ok-border), var(--e1)" } : x.state === "rejected" ? { opacity: 0.6 } : undefined}
              >
                <span className="tag mono">{x.ref}</span>
                <div className="grow col gap6">
                  {editing === i ? (
                    <input className="inp" value={editText} onChange={(e) => setEditText(e.target.value)} />
                  ) : (
                    <div className="strong">{x.t}</div>
                  )}
                  <div className="row wrap gap12 cap muted">
                    <span><Icon name="file-text" /> Page {x.page}</span>
                    <span className="conf">
                      Confidence {x.conf}%
                      <span className="bar"><i style={{ width: `${x.conf}%`, background: x.conf >= 85 ? "var(--ok-icon)" : x.conf >= 70 ? "var(--warn-icon)" : "var(--bad-icon)" }} /></span>
                    </span>
                  </div>
                  {x.warn ? (
                    <div className="note" style={{ padding: "8px 10px" }}>
                      <Icon name="warning" /><span>{x.warn}</span>
                    </div>
                  ) : null}
                </div>
                <div className="row gap4">
                  {x.state === "accepted" ? (
                    <>
                      <Chip tone="ok" icon="check">Accepted</Chip>
                      <button className="icon-btn" aria-label="Undo" title="Undo" onClick={() => setItemState(i, "")}><Icon name="arrow-u-up-left" /></button>
                    </>
                  ) : x.state === "rejected" ? (
                    <>
                      <Chip tone="neu">Rejected</Chip>
                      <button className="icon-btn" aria-label="Undo" title="Undo" onClick={() => setItemState(i, "")}><Icon name="arrow-u-up-left" /></button>
                    </>
                  ) : editing === i ? (
                    <Button size="sm" onClick={() => saveEdit(i)}>Save</Button>
                  ) : (
                    <>
                      <Button variant="tertiary" size="sm" onClick={() => setItemState(i, "rejected")}>Reject</Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditing(i); setEditText(x.t); }}>Edit</Button>
                      <Button variant="secondary" size="sm" testId={`ai-acc-${i}`} onClick={() => setItemState(i, "accepted")}>Accept</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="row end">
            <Button variant="outline" onClick={() => router.push("/regulator/library")}>Cancel</Button>
            <Button testId="ai-publish" disabled={!acc || left > 0} onClick={publish}>Add {acc} requirements to the library</Button>
          </div>
          {left ? <p className="cap muted" style={{ textAlign: "right" }}>Review every draft to continue. {left} left.</p> : null}
        </>
      )}
    </AppShell>
  );
}
