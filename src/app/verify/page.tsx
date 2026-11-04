"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, AlertBox, Tile } from "@/components/ui";
import { OtpInput } from "@/components/OtpInput";
import { Icon } from "@/lib/icons";
import { getPendingAccount, completeSignIn, getPendingRealEmail, clearPendingRealEmail, establishSession, ACCOUNTS, WORKSPACE_HOME, sessionFromBackend } from "@/lib/auth";
import { verifyCode, resendCode, getSession } from "@/server/actions/auth";

/**
 * Two unrelated pending-sign-in sources land here:
 * - A real email code (src/app/signin/page.tsx), verified against the real backend.
 * - src/components/InviteFlow.tsx's still-mock organisation/firm self-service accept flow
 *   (back-end phase 2), which keeps its original "any code except 000000" behaviour untouched.
 * The real path takes priority when both happen to be set (it shouldn't in practice).
 */
export default function VerifyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"real" | "mock" | null>(null);
  const [realEmail, setRealEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trust, setTrust] = useState(false);

  useEffect(() => {
    const pendingReal = getPendingRealEmail();
    if (pendingReal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only store (sessionStorage) that cannot be observed during SSR.
      setRealEmail(pendingReal);
      setMode("real");
      setReady(true);
      return;
    }
    if (!getPendingAccount()) {
      router.replace("/signin");
      return;
    }
    setMode("mock");
    setReady(true);
  }, [router]);

  function finishMock() {
    const account = completeSignIn();
    if (!account) {
      router.replace("/signin");
      return;
    }
    const inviteNext = window.sessionStorage.getItem("superatlas.inviteNext");
    if (inviteNext) {
      window.sessionStorage.removeItem("superatlas.inviteNext");
      router.push(inviteNext);
      return;
    }
    router.push(WORKSPACE_HOME[account.workspace]);
  }

  async function submitRealCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    setErr(null);
    const result = await verifyCode({ email: realEmail, code });
    if (!result.ok) {
      setSubmitting(false);
      setErr(result.error.message);
      return;
    }
    const session = await getSession();
    setSubmitting(false);
    if (!session.ok || !session.data) {
      setErr("Something went wrong. Try again.");
      return;
    }
    const account = ACCOUNTS[realEmail] ?? sessionFromBackend(realEmail, session.data);
    establishSession(account);
    clearPendingRealEmail();
    router.push(WORKSPACE_HOME[account.workspace]);
  }

  async function resend() {
    if (resending) return;
    setResending(true);
    setErr(null);
    const result = await resendCode({ email: realEmail });
    setResending(false);
    if (!result.ok) {
      setErr(result.error.message);
      return;
    }
    setResent(true);
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6 || code === "000000") {
      setErr("That code did not work");
      return;
    }
    setErr(null);
    finishMock();
  }

  function submitRecovery(e: React.FormEvent) {
    e.preventDefault();
    finishMock();
  }

  if (!ready) return null;

  if (mode === "real") {
    return (
      <AuthShell>
        <Tile icon="envelope-simple" size="lg" />
        <div>
          <h2 className="h1" style={{ marginTop: 16 }}>Enter your 6-digit code</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            We emailed a code to <b style={{ color: "var(--text)" }}>{realEmail}</b>. It expires in 10 minutes.
          </p>
        </div>
        {err ? <AlertBox tone="bad" title="That code did not work" body={err} /> : null}
        {resent ? <AlertBox tone="ok" title="New code sent" body="Check your email." /> : null}
        <form className="col gap20" onSubmit={submitRealCode} noValidate>
          <OtpInput invalid={!!err} onChange={setCode} />
          <Button type="submit" size="lg" block disabled={submitting}>{submitting ? "Checking…" : "Verify"}</Button>
        </form>
        <button className="link-btn small" style={{ alignSelf: "flex-start" }} onClick={resend} disabled={resending}>
          {resending ? "Sending…" : "Send a new code"}
        </button>
      </AuthShell>
    );
  }

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
            <OtpInput invalid={!!err} onChange={setCode} />
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
