"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, AlertBox, Tile } from "@/components/ui";
import { OtpInput } from "@/components/OtpInput";
import { Icon } from "@/lib/icons";
import { getPendingAccount, completeSignIn, WORKSPACE_HOME } from "@/lib/auth";

export default function VerifyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [err, setErr] = useState(false);
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trust, setTrust] = useState(false);

  useEffect(() => {
    if (!getPendingAccount()) {
      router.replace("/signin");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only store (sessionStorage) that cannot be observed during SSR.
    setReady(true);
  }, [router]);

  function finish() {
    const account = completeSignIn();
    if (!account) {
      router.replace("/signin");
      return;
    }
    router.push(WORKSPACE_HOME[account.workspace]);
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6 || code === "000000") {
      setErr(true);
      return;
    }
    setErr(false);
    finish();
  }

  function submitRecovery(e: React.FormEvent) {
    e.preventDefault();
    finish();
  }

  if (!ready) return null;

  return (
    <AuthShell>
      {recovery ? (
        <>
          <Tile icon="key" size="lg" />
          <div>
            <h2 className="h1" style={{ marginTop: 16 }}>Use a recovery code</h2>
            <p className="muted" style={{ marginTop: 6 }}>Enter one of the 10 codes you saved when you set up MFA. Each code works once.</p>
          </div>
          <form className="col gap16" onSubmit={submitRecovery}>
            <Field label="Recovery code" htmlFor="rc">
              <input className="inp" id="rc" placeholder="XXXX-XXXX" style={{ fontFamily: "var(--mono)", letterSpacing: ".1em" }} value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} />
            </Field>
            <Button type="submit" size="lg" block>Continue</Button>
          </form>
          <button className="link-btn small" onClick={() => setRecovery(false)}>Use authenticator code instead</button>
        </>
      ) : (
        <>
          <Tile icon="fingerprint" size="lg" />
          <div>
            <h2 className="h1" style={{ marginTop: 16 }}>Enter your 6-digit code</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Open your authenticator app and enter the code for <b style={{ color: "var(--text)" }}>SuperAtlas</b>.
            </p>
          </div>
          {err ? <AlertBox tone="bad" title="That code did not work" body="Codes change every 30 seconds. Enter the newest code from your app." /> : null}
          <form className="col gap20" onSubmit={submitCode} noValidate>
            <OtpInput invalid={err} onChange={setCode} />
            <label className="check">
              <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} />
              <span>Trust this device for 30 days</span>
            </label>
            <Button type="submit" size="lg" block>Verify</Button>
          </form>
          <div className="col gap8">
            <button className="link-btn small" style={{ alignSelf: "flex-start" }} onClick={() => setRecovery(true)}>
              Use a recovery code
            </button>
            <span className="cap muted">Lost your device? Ask your workspace admin to reset MFA.</span>
          </div>
          <div className="note" style={{ fontSize: 12.5 }}>
            <Icon name="info" /> Demo: any 6 digits work, except <code className="mono">000000</code>, which shows the error.
          </div>
        </>
      )}
    </AuthShell>
  );
}
