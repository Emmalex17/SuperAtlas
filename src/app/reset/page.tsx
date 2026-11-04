"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, Lockup, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { isEmail, pwRules } from "@/lib/authHelpers";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset, resetPassword } from "@/server/actions/auth";

type Step = "checking" | "request" | "sent" | "expired" | "limit" | "set" | "done";

const BackLink = () => (
  <Link href="/signin" className="small strong">
    <Icon name="arrow-left" /> Back to sign in
  </Link>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("checking");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [requesting, setRequesting] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErr, setPwErr] = useState<string | undefined>();
  const [pw2Err, setPw2Err] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  // Supabase's browser client processes the recovery link's URL fragment on load and fires
  // PASSWORD_RECOVERY once a session is established from it; an expired or already-used link
  // instead lands here with an #error= fragment and no session.
  useEffect(() => {
    if (window.location.hash.includes("error=")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only URL fragment, which cannot be observed during SSR.
      setStep("expired");
      return;
    }
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStep("set");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setStep((s) => (s === "checking" ? "request" : s));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setEmailErr("Enter a valid email address");
      return;
    }
    setEmailErr(undefined);
    setRequesting(true);
    const result = await requestPasswordReset({ email });
    setRequesting(false);
    if (!result.ok && result.error.code === "rate_limited") {
      setStep("limit");
      return;
    }
    setStep("sent");
  }

  async function resend() {
    setRequesting(true);
    const result = await requestPasswordReset({ email });
    setRequesting(false);
    if (!result.ok && result.error.code === "rate_limited") {
      setStep("limit");
      return;
    }
    setStep("sent");
  }

  async function submitNewPassword(e: React.FormEvent) {
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
    setSaving(true);
    const result = await resetPassword({ password: pw });
    setSaving(false);
    if (!result.ok) {
      setPwErr(result.error.message);
      return;
    }
    setStep("done");
  }

  const rules = pwRules(pw);

  if (step === "checking") return null;

  return (
    <AuthShell>
      {step === "request" && (
        <>
          <div>
            <Lockup size={26} />
            <h2 className="h1" style={{ marginTop: 28 }}>Reset your password</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Enter the email you sign in with. If it matches an account, we will send a link that works once, for 1 hour.
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
            <Button type="submit" size="lg" block disabled={requesting}>{requesting ? "Sending…" : "Send reset link"}</Button>
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
              If <b style={{ color: "var(--text)" }}>{email}</b> has an account, a reset link is on its way. It expires in 1 hour. Check your spam folder if it does not arrive.
            </p>
          </div>
          <div className="row between">
            <button className="link-btn small" onClick={resend} disabled={requesting}>{requesting ? "Sending…" : "Resend link"}</button>
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
              Reset links work once and stop working after an hour, or when a newer link is sent. Ask for a new one.
            </p>
          </div>
          <Button size="lg" block onClick={() => setStep("request")}>Send a new link</Button>
          <BackLink />
        </>
      )}

      {step === "limit" && (
        <>
          <Tile icon="lock-simple" tone="bad" size="lg" />
          <div>
            <h2 className="h1">Too many requests</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              We have sent too many reset links in the last 15 minutes. To protect the account, wait 15 minutes before asking again. Use the newest link if you have it.
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
            <p className="muted" style={{ marginTop: 6 }}>Saving signs you out of every other device.</p>
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
            <Button type="submit" size="lg" block disabled={saving}>{saving ? "Saving…" : "Save new password"}</Button>
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
          <Button
            size="lg"
            block
            testId="reset-done"
            onClick={() => {
              window.sessionStorage.setItem("superatlas.resetBanner", "1");
              router.push("/signin");
            }}
          >
            Go to sign in
          </Button>
        </>
      )}
    </AuthShell>
  );
}
