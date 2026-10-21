"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, AlertBox, Lockup } from "@/components/ui";
import { DemoAccess } from "@/components/DemoAccess";
import { Icon } from "@/lib/icons";
import { isEmail } from "@/lib/authHelpers";
import { checkCredentials } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fails, setFails] = useState(0);
  const [error, setError] = useState<{ email?: string; pw?: string; form?: boolean }>({});
  const [signedOut, setSignedOut] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const locked = fails >= 5;

  useEffect(() => {
    if (window.sessionStorage.getItem("superatlas.resetBanner")) {
      window.sessionStorage.removeItem("superatlas.resetBanner");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only, one-shot flag set by the reset-password flow on the previous page.
      setPasswordChanged(true);
    } else if (window.sessionStorage.getItem("superatlas.signedOut")) {
      window.sessionStorage.removeItem("superatlas.signedOut");
      setSignedOut(true);
    }
  }, []);

  function useDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo-password");
    setError({});
    setTimeout(() => document.querySelector<HTMLButtonElement>('[data-test="signin-submit"]')?.focus(), 0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    const nextError: typeof error = {};
    if (!isEmail(email)) nextError.email = "Enter the email address you were invited with";
    if (!password) nextError.pw = "Enter your password";

    if (!nextError.email && !nextError.pw) {
      const account = checkCredentials(email, password);
      if (!account) {
        setFails((f) => f + 1);
        setError({ form: true });
        return;
      }
      setError({});
      router.push("/verify");
      return;
    }
    setError(nextError);
  }

  return (
    <AuthShell>
      <div>
        <Lockup size={26} />
        <h2 className="h1" style={{ marginTop: 28 }}>Sign in</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Regulators, supervised organisations and assurance firms all sign in here. We take you to your workspace.
        </p>
      </div>

      {locked ? (
        <AlertBox
          tone="bad"
          title="Too many attempts"
          body="This account is locked for 15 minutes to keep it safe. Reset your password to get back in sooner."
          actions={<Button variant="secondary" size="sm" onClick={() => router.push("/reset")}>Reset password</Button>}
        />
      ) : error.form ? (
        <AlertBox
          tone="bad"
          title="Email or password is incorrect"
          body={`Check both and try again. ${5 - fails} attempt${5 - fails === 1 ? "" : "s"} left before the account locks for 15 minutes.`}
        />
      ) : passwordChanged ? (
        <AlertBox tone="ok" title="Password changed" body="Sign in with your new password. You were signed out of other devices." />
      ) : signedOut ? (
        <AlertBox tone="info" title="You have signed out" body="" />
      ) : null}

      <form className="col gap16" onSubmit={handleSubmit} noValidate>
        <Field label="Email" error={error.email} htmlFor="si-email">
          <input
            className={`inp ${error.email ? "invalid" : ""}`}
            id="si-email"
            type="email"
            autoComplete="username"
            placeholder="name@organisation.com"
            value={email}
            disabled={locked}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" error={error.pw} htmlFor="si-pw">
          <div className="inp-wrap" style={{ position: "relative" }}>
            <Icon name="lock-simple" />
            <input
              className={`inp ${error.pw ? "invalid" : ""}`}
              id="si-pw"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              disabled={locked}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="suffix">
              <button
                type="button"
                className="icon-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
              >
                <Icon name={showPassword ? "eye-slash" : "eye"} />
              </button>
            </span>
          </div>
        </Field>
        <div className="row between">
          <label className="check">
            <input type="checkbox" defaultChecked />
            <span>Keep me signed in</span>
          </label>
          <Link href="/reset" className="small strong">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" block disabled={locked} testId="signin-submit">Sign in</Button>
      </form>

      <div className="col gap6 small muted">
        <span>
          Organisation not invited yet? <Link href="/register" className="strong">Register your organisation</Link>
        </span>
        <span>
          New to SuperAtlas? <Link href="/demo" className="strong">Book a demo</Link>
        </span>
      </div>

      <DemoAccess onUse={useDemoAccount} />
    </AuthShell>
  );
}
