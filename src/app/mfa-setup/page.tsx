"use client";

import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, AlertBox } from "@/components/ui";
import { OtpInput } from "@/components/OtpInput";
import { Icon } from "@/lib/icons";
import { qrSvgPaths, RECOVERY_CODES } from "@/lib/authHelpers";

function Stepper({ step }: { step: number }) {
  const steps = ["Scan", "Confirm", "Save codes"];
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <span key={s} className="row" style={{ gap: 8 }}>
          {i > 0 ? <span className="step-line" /> : null}
          <span className={`step ${i < step ? "done" : i === step ? "on" : ""}`}>
            <span className="n">{i < step ? <Icon name="check" /> : i + 1}</span>
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function MfaSetupPage() {
  const [step, setStep] = useState(0);
  const [err, setErr] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  function submitConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6 || code === "000000") {
      setErr(true);
      return;
    }
    setErr(false);
    setStep(2);
  }

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(RECOVERY_CODES.join("\n"));
      setCopied(true);
    } catch {
      // clipboard unavailable — nothing to fall back to in this demo
    }
  }

  return (
    <AuthShell>
      {step === 0 && (
        <>
          <div>
            <h2 className="h1">Set up multi-factor authentication</h2>
            <p className="muted" style={{ marginTop: 6 }}>Every SuperAtlas account uses a second step. It takes about a minute.</p>
          </div>
          <Stepper step={0} />
          <div className="row top gap20 wrap">
            <div className="qr">
              <svg viewBox="0 0 25 25" width="100%" height="100%" shapeRendering="crispEdges" fill="#101115" role="img" aria-label="QR code for authenticator app" dangerouslySetInnerHTML={{ __html: qrSvgPaths() }} />
            </div>
            <div className="col gap8 grow" style={{ minWidth: 200 }}>
              <b>1. Open an authenticator app</b>
              <span className="muted small">Microsoft Authenticator, Google Authenticator or similar.</span>
              <b style={{ marginTop: 8 }}>2. Scan this code</b>
              <span className="muted small">Can&rsquo;t scan? Enter this key instead:</span>
              <span className="mono" style={{ background: "var(--surface-subtle)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>JBSW Y3DP EHPK 3PXP</span>
            </div>
          </div>
          <Button size="lg" block onClick={() => setStep(1)}>I have scanned the code</Button>
        </>
      )}

      {step === 1 && (
        <>
          <div>
            <h2 className="h1">Enter the code from your app</h2>
            <p className="muted" style={{ marginTop: 6 }}>This confirms the app is set up correctly.</p>
          </div>
          <Stepper step={1} />
          {err ? <AlertBox tone="bad" title="That code did not match" body="Make sure you scanned the code on the previous step, then enter the newest code." /> : null}
          <form className="col gap20" onSubmit={submitConfirm}>
            <OtpInput invalid={err} onChange={setCode} />
            <div className="row">
              <Button variant="outline" onClick={() => setStep(0)} type="button">Back</Button>
              <Button type="submit" className="grow">Confirm</Button>
            </div>
          </form>
          <div className="note" style={{ fontSize: 12.5 }}>
            <Icon name="info" /> Demo: any 6 digits work, except <code className="mono">000000</code>.
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <h2 className="h1">Save your recovery codes</h2>
            <p className="muted" style={{ marginTop: 6 }}>If you lose your phone, each code lets you sign in once. Store them somewhere safe, away from your phone.</p>
          </div>
          <Stepper step={2} />
          <div className="codes">
            {RECOVERY_CODES.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className="row">
            <Button variant="secondary" icon={copied ? "check" : "copy"} onClick={copyCodes}>{copied ? "Copied" : "Copy codes"}</Button>
          </div>
          <label className="check">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            <span>I have saved my recovery codes</span>
          </label>
          <Button size="lg" block disabled={!saved}>Finish setup</Button>
        </>
      )}
    </AuthShell>
  );
}
