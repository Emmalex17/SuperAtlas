"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, Lockup, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { pwRules } from "@/lib/authHelpers";
import { getInvite, acceptInvite, type InviteDetails } from "@/server/actions/invitations";

/**
 * Real colleague-invite acceptance (spec 7.2) — the person who was invited by an admin lands
 * here from the link in their email. Unrelated to src/components/InviteFlow.tsx, which is the
 * still-mock organisation/firm self-service accept flow (back-end phase 2) with its own
 * simulated inbox step; a real email client already showed them the message, so this page
 * starts straight at "who invited you, set your name and password".
 */
export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<{ name?: string; pw?: string; pw2?: string; terms?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getInvite({ token }).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setLoadError(result.error.message);
        return;
      }
      setInvite(result.data);
      setName("");
    });
  }, [token]);

  const rules = pwRules(pw);

  async function submit(e: React.FormEvent) {
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
    setSubmitting(true);
    const result = await acceptInvite({ token, name: name.trim(), password: pw });
    setSubmitting(false);
    if (!result.ok) {
      setErr({ form: result.error.message });
      return;
    }
    window.sessionStorage.setItem("superatlas.acceptedEmail", invite?.email ?? "");
    router.push("/signin");
  }

  if (loading) return null;

  if (loadError || !invite) {
    return (
      <AuthShell>
        <Tile icon="link-break" tone="warn" size="lg" />
        <div>
          <h2 className="h1">This invitation link is not valid</h2>
          <p className="muted" style={{ marginTop: 6 }}>{loadError ?? "Check the link, or ask whoever invited you to send a new one."}</p>
        </div>
      </AuthShell>
    );
  }

  if (invite.status === "accepted") {
    return (
      <AuthShell>
        <Tile icon="check-circle" tone="solid ok" size="lg" />
        <div>
          <h2 className="h1">This invitation has already been accepted</h2>
          <p className="muted" style={{ marginTop: 6 }}>Sign in with the password you set.</p>
        </div>
        <Button size="lg" block onClick={() => router.push("/signin")}>Go to sign in</Button>
      </AuthShell>
    );
  }

  if (invite.status === "cancelled" || invite.status === "expired") {
    return (
      <AuthShell>
        <Tile icon="link-break" tone="warn" size="lg" />
        <div>
          <h2 className="h1">{invite.status === "cancelled" ? "This invitation was cancelled" : "This invitation has expired"}</h2>
          <p className="muted" style={{ marginTop: 6 }}>Ask {invite.inviterName || "whoever invited you"} to send a new one.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <Lockup size={26} />
        <h2 className="h1" style={{ marginTop: 28 }}>Accept your invitation</h2>
        <p className="muted" style={{ marginTop: 6 }}>Create a password for {invite.email}.</p>
      </div>
      <div className="card flat tight row">
        <div className="grow">
          <div className="strong">{invite.entityName}</div>
          <div className="cap muted">
            {invite.role}
            {invite.inviterName ? ` · invited by ${invite.inviterName}` : ""}
          </div>
        </div>
      </div>
      {err.form ? (
        <div className="field">
          <div className="err">
            <Icon name="warning-circle" />
            {err.form}
          </div>
        </div>
      ) : null}
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
        <Button type="submit" size="lg" block iconRight="arrow-right" disabled={submitting} testId="accept-submit">
          {submitting ? "Setting up your account…" : "Accept and continue"}
        </Button>
      </form>
    </AuthShell>
  );
}
