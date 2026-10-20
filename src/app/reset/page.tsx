"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, AlertBox, Lockup, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { isEmail, pwRules } from "@/lib/authHelpers";

type Step = "request" | "sent" | "expired" | "limit" | "set" | "done";

const BackLink = () => (
  <Link href="/signin" className="small strong">
    <Icon name="arrow-left" /> Back to sign in
  </Link>
);

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [sends, setSends] = useState(0);
  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErr, setPwErr] = useState<string | undefined>();
  const [pw2Err, setPw2Err] = useState<string | undefined>();

  function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setEmailErr("Enter a valid email address");
      return;
    }
    setEmailErr(undefined);
    setSends(1);
    setStep("sent");
  }

  function resend() {
    if (sends >= 3) {
      setStep("limit");
      return;
    }
    setSends((s) => s + 1);
    setStep("sent");
  }

  function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(undefined);
    setPw2Err(undefined);
    if (!pwRules(pw).ok) {
      setPwErr("Your password needs to meet all four rules");
      return;
    }
    if (pw !== pw2) {
      setPw2Err("The two passwords do not match");
      return;
    }
    setStep("done");
  }

  const rules = pwRules(pw);

  return (
    <AuthShell>
      {step === "request" && (
        <>
          <div>
            <Lockup size={26} />
            <h2 className="h1" style={{ marginTop: 28 }}>Reset your password</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Enter the email you sign in with. If it matches an account, we will send a link that works once, for 30 minutes.
            </p>
          </div>
          <form className="col gap16" onSubmit={submitRequest} noValidate>
            <Field label="Email" error={emailErr} htmlFor="rs-email">
              <input
                className={`inp ${emailErr ? "invalid" : ""}`}
                id="rs-email"
                type="email"
                placeholder="name@organisation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button type="submit" size="lg" block>Send reset link</Button>
          </form>
          <BackLink />
        </>
      )}

      {step === "sent" && (
        <>
          <Tile icon="envelope-simple" tone="info" size="lg" />
          <div>
            <h2 className="h1">Check your email</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              If <b style={{ color: "var(--text)" }}>{email}</b> has an account, a reset link is on its way. It expires in 30 minutes. Check your spam folder if it does not arrive.
            </p>
          </div>
          {sends > 1 ? (
            <AlertBox tone="info" title="New link sent" body="Only the newest link works. Older links have stopped working." />
          ) : null}
          <div className="col gap8">
            <div className="overline">Your inbox</div>
            {Array.from({ length: sends }, (_, i) => sends - 1 - i).map((n, i) => (
              <div key={n} className={`mail-row ${i ? "old" : ""}`}>
                <Icon name="envelope-simple" />
                <div className="grow">
                  <div className="strong small">Reset your SuperAtlas password</div>
                  <div className="cap muted">no-reply@superatlas.example · {i === 0 ? "just now" : i * 2 + " minutes ago"}</div>
                </div>
                <Button variant={i ? "outline" : "secondary"} size="sm" onClick={() => setStep(i ? "expired" : "set")}>
                  Open link
                </Button>
              </div>
            ))}
          </div>
          <div className="row between">
            <button className="link-btn small" onClick={resend}>Resend link</button>
            <button className="link-btn small" onClick={() => setStep("request")}>Use a different email</button>
          </div>
          <BackLink />
        </>
      )}

      {step === "expired" && (
        <>
          <Tile icon="link-break" tone="warn" size="lg" />
          <div>
            <h2 className="h1">This link has expired</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Reset links work once and stop working after 30 minutes, or when a newer link is sent. Ask for a new one.
            </p>
          </div>
          <Button size="lg" block onClick={resend}>Send a new link</Button>
          <BackLink />
        </>
      )}

      {step === "limit" && (
        <>
          <Tile icon="lock-simple" tone="bad" size="lg" />
          <div>
            <h2 className="h1">Too many requests</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              We have sent 3 reset links in the last 15 minutes. To protect the account, wait 15 minutes before asking again. Use the newest link if you have it.
            </p>
          </div>
          <Link href="/signin"><Button variant="outline" size="lg" block>Back to sign in</Button></Link>
        </>
      )}

      {step === "set" && (
        <>
          <div>
            <Lockup size={26} />
            <h2 className="h1" style={{ marginTop: 28 }}>Choose a new password</h2>
            <p className="muted" style={{ marginTop: 6 }}>For {email}. Saving signs you out of every other device.</p>
          </div>
          <form className="col gap16" onSubmit={submitNewPassword} noValidate>
            <Field label="New password" error={pwErr} htmlFor="rs-pw">
              <div className="inp-wrap" style={{ position: "relative" }}>
                <Icon name="lock-simple" />
                <input className={`inp ${pwErr ? "invalid" : ""}`} id="rs-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
              </div>
            </Field>
            <div>
              <div className="pw-meter">
                {[1, 2, 3, 4].map((i) => (
                  <i key={i} className={i <= rules.n ? (rules.n <= 1 ? "on1" : rules.n <= 3 ? "on2" : "on3") : ""} />
                ))}
              </div>
              <div className="rules" style={{ marginTop: 8 }}>
                {rules.rules.map(([met, t]) => (
                  <span key={t} className={met ? "met" : ""}>
                    <Icon name={met ? "check-circle" : "circle-dashed"} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <Field label="Confirm new password" error={pw2Err} htmlFor="rs-pw2">
              <div className="inp-wrap" style={{ position: "relative" }}>
                <Icon name="lock-simple" />
                <input className={`inp ${pw2Err ? "invalid" : ""}`} id="rs-pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              </div>
            </Field>
            <Button type="submit" size="lg" block>Save new password</Button>
          </form>
        </>
      )}

      {step === "done" && (
        <>
          <Tile icon="check-circle" tone="solid ok" size="lg" />
          <div>
            <h2 className="h1">Password changed</h2>
            <p className="muted" style={{ marginTop: 6 }}>Your new password is saved and other devices have been signed out. Sign in to continue.</p>
          </div>
          <Link href="/signin"><Button size="lg" block>Go to sign in</Button></Link>
        </>
      )}
    </AuthShell>
  );
}
