"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, Kv, Lockup, LogoMark } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { pwRules } from "@/lib/authHelpers";
import { beginPendingSignIn, ACCOUNTS } from "@/lib/auth";
import { DEADLINES } from "@/lib/cases";
import { TENANT, ORGANISATIONS, FIRMS, orgIdFor, firmIdFor } from "@/lib/mockData";
import type { Invite } from "@/lib/invites";

/** The two-step "accept invitation" flow shared by /invitation, /invitation/zenith and /invitation/deloitte —
 * the simulated inbox and email first (step 0), then create-a-password (step 1). Mirrors the prototype's
 * inviteScreen() in auth.js. Step 2 (MFA) is /verify itself, which this hands off to via sessionStorage so it
 * knows to land on the invite's own onboarding destination instead of the workspace's plain dashboard. */
export function InviteFlow({ invite }: { invite: Invite }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const account = ACCOUNTS[invite.acct];
  const [name, setName] = useState(account?.name ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<{ name?: string; pw?: string; pw2?: string; terms?: string }>({});

  const rules = pwRules(pw);

  function openEmail() {
    setStep(1);
    window.scrollTo(0, 0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (!name.trim()) next.name = "Enter your full name";
    if (!rules.ok) next.pw = "Your password needs to meet all four rules";
    else if (pw !== pw2) next.pw2 = "The two passwords do not match";
    if (!terms) next.terms = "Accept the terms to continue";
    if (Object.keys(next).length) {
      setErr(next);
      return;
    }
    setErr({});
    window.sessionStorage.setItem("superatlas.inviteNext", invite.next);
    beginPendingSignIn(invite.acct);
    router.push("/verify");
  }

  const emailMark =
    invite.brand === "superatlas" ? (
      <LogoMark size={30} />
    ) : (
      <span className="logo s32" style={{ background: TENANT.col }}>
        {TENANT.initials}
      </span>
    );

  const org = account?.workspace === "organisation" ? ORGANISATIONS.find((o) => o.id === orgIdFor(account.entityName)) : undefined;
  const firm = account?.workspace === "firm" ? FIRMS.find((f) => f.id === firmIdFor(account.entityName)) : undefined;
  const cardMark =
    account?.workspace === "regulator" ? (
      <span className="logo s40" style={{ background: TENANT.col }}>{TENANT.initials}</span>
    ) : org ? (
      <span className="logo s40" style={{ background: org.color }}>{org.initials}</span>
    ) : firm ? (
      <span className="logo s40" style={{ background: firm.color }}>{firm.initials}</span>
    ) : null;

  if (step === 0) {
    return (
      <div className="inbox">
        <div className="inbox-bar">
          <Icon name="envelope-simple" />
          <b>Inbox</b>
          <span className="cap muted">{invite.acct}</span>
        </div>
        <div className="inbox-body">
          <div className="mail" style={{ boxShadow: "var(--e1)" }}>
            <div className="mh">
              <b style={{ color: "var(--text)", fontSize: 14 }}>{invite.subject}</b>
              <span>From: {invite.fromName} &lt;{invite.fromAddr}&gt;</span>
              <span>To: {invite.acct}</span>
            </div>
            <div style={{ height: 5, background: invite.brand === "superatlas" ? "var(--brand-500)" : TENANT.col }} />
            <div className="mb col gap16">
              <div className="row gap8">
                {emailMark}
                <b>{invite.brand === "superatlas" ? "SuperAtlas" : "NITDA"}</b>
              </div>
              <p className="small">Hello {account?.first ?? ""},</p>
              <p className="small">{invite.body}</p>
              <Kv pairs={[["Workspace", invite.ent], ["Your role", invite.role], ["Invited by", invite.by]]} />
              <Button onClick={openEmail} testId="inv-open">Accept invitation</Button>
              <p className="cap muted">
                This link expires in {DEADLINES.inviteExpiry} days and works once. If you were not expecting it, ignore this email.
                {invite.brand === "tenant" ? " Powered by SuperAtlas." : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthShell>
      <div>
        <Lockup size={26} />
        <h2 className="h1" style={{ marginTop: 28 }}>Accept your invitation</h2>
        <p className="muted" style={{ marginTop: 6 }}>Create a password for {invite.acct}. Next, you will enter a 6-digit code to verify it&rsquo;s you.</p>
      </div>
      <div className="card flat tight row">
        {cardMark}
        <div className="grow">
          <div className="strong">{invite.ent}</div>
          <div className="cap muted">{invite.role} · invited by {invite.by}</div>
        </div>
      </div>
      <form className="col gap16" onSubmit={submit} noValidate>
        <Field label="Full name" error={err.name} htmlFor="ac-name">
          <input className={`inp ${err.name ? "invalid" : ""}`} id="ac-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Create a password" error={err.pw} htmlFor="ac-pw">
          <div className="inp-wrap" style={{ position: "relative" }}>
            <Icon name="lock-simple" />
            <input className={`inp ${err.pw ? "invalid" : ""}`} id="ac-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
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
        <Field label="Confirm password" error={err.pw2} htmlFor="ac-pw2">
          <div className="inp-wrap" style={{ position: "relative" }}>
            <Icon name="lock-simple" />
            <input className={`inp ${err.pw2 ? "invalid" : ""}`} id="ac-pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </Field>
        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>I accept the terms of use and privacy notice.</span>
        </label>
        {err.terms ? (
          <div className="field">
            <div className="err">
              <Icon name="warning-circle" />
              {err.terms}
            </div>
          </div>
        ) : null}
        <Button type="submit" size="lg" block iconRight="arrow-right" testId="accept-submit">Accept and continue</Button>
      </form>
    </AuthShell>
  );
}
