"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Lockup, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);
    setSent(true);
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="grid-lines" />
        <Lockup dark size={26} />
      </div>
      <div className="auth-form">
        <div className="inner">
          <Link href="/signin" className="small strong">
            <Icon name="arrow-left" /> Back to sign in
          </Link>
          {sent ? (
            <div className="col gap16" style={{ alignItems: "center", textAlign: "center" }}>
              <Tile icon="envelope-simple" tone="ok" size="lg" />
              <h2 className="h1">Check your email</h2>
              <p className="muted">
                If an account exists for <b>{email}</b>, we&rsquo;ve sent a link to reset your password. This is a demo —
                no email is actually sent.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>Use a different email</Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="h1" style={{ marginTop: 28 }}>Reset password</h2>
                <p className="muted" style={{ marginTop: 6 }}>Enter your email and we&rsquo;ll send you a reset link.</p>
              </div>
              <form className="col gap16" onSubmit={handleSubmit} noValidate>
                <Field label="Email" error={error} htmlFor="reset-email">
                  <input
                    className={`inp ${error ? "invalid" : ""}`}
                    id="reset-email"
                    type="email"
                    placeholder="name@organisation.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Button type="submit" size="lg" block>Send reset link</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
