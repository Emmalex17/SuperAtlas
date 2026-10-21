"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lockup, Button, Field, Chip } from "@/components/ui";
import { BrandPreview } from "@/components/BrandPreview";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { isEmail } from "@/lib/authHelpers";
import { TENANT, THEMES, ROLES } from "@/lib/mockData";

const STEPS = ["Profile", "Branding", "Team"];

type Invite = { email: string; role: string };

export default function WelcomePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(TENANT.name);
  const [short, setShort] = useState(TENANT.short);
  const [legal, setLegal] = useState(TENANT.legal);
  const [mandate, setMandate] = useState(TENANT.mandate);
  const [email, setEmail] = useState(TENANT.email);
  const [phone, setPhone] = useState(TENANT.phone);
  const [logoUploaded, setLogoUploaded] = useState(TENANT.logoUploaded);
  const [theme, setTheme] = useState<(typeof THEMES)[number]["key"]>(TENANT.theme);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Supervisor");

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      toast("Enter the name to show", "bad");
      return;
    }
    setStep(1);
  }

  function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(inviteEmail)) {
      toast("Enter a valid work email", "bad");
      return;
    }
    setInvites((prev) => [...prev, { email: inviteEmail, role: inviteRole }]);
    toast(`Invitation sent to ${inviteEmail}`, "ok", "envelope-simple");
    setInviteEmail("");
  }

  function finish() {
    toast(`${short} is ready`, "ok", "check-circle");
    router.push("/regulator");
  }

  return (
    <div className="wiz">
      <header className="wiz-top">
        <span className="logo s32">{TENANT.initials}</span>
        <b>{short}</b>
        <span className="muted small">Workspace setup</span>
        <span className="grow" />
        <span className="row gap8 cap muted"><Lockup size={16} />Powered by SuperAtlas</span>
      </header>
      <div className="wiz-body">
        <div className="wiz-steps">
          {STEPS.map((l, i) => (
            <div key={l} className={`ws-step ${i < step ? "done" : i === step ? "on" : ""}`}>
              <span className="n">{i < step ? <Icon name="check" /> : i + 1}</span>
              {l}
            </div>
          ))}
        </div>
        <div className="card col gap20 wiz-card">
          {step === 0 && (
            <>
              <div>
                <h1 className="h1">Confirm your profile</h1>
                <p className="muted" style={{ marginTop: 4 }}>RegTech365 filled this in from your agreement. Check it; organisations see it in invitations and on your profile.</p>
              </div>
              <form className="col gap16" onSubmit={saveProfile} noValidate>
                <div className="grid g2" style={{ gap: 14 }}>
                  <Field label="Name shown in SuperAtlas" htmlFor="w-name">
                    <input className="inp" id="w-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Short name" hint={`Used in status text, e.g. "With ${short}"`} htmlFor="w-short">
                    <input className="inp" id="w-short" maxLength={8} value={short} onChange={(e) => setShort(e.target.value)} />
                  </Field>
                </div>
                <Field label="Legal name" htmlFor="w-legal">
                  <input className="inp" id="w-legal" value={legal} onChange={(e) => setLegal(e.target.value)} />
                </Field>
                <Field label="Mandate" htmlFor="w-mandate">
                  <textarea className="ta" id="w-mandate" rows={3} value={mandate} onChange={(e) => setMandate(e.target.value)} />
                </Field>
                <div className="grid g2" style={{ gap: 14 }}>
                  <Field label="Supervision email" htmlFor="w-email">
                    <input className="inp" id="w-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Phone" htmlFor="w-phone">
                    <input className="inp" id="w-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                </div>
                <div className="row">
                  <span className="logo s48">{TENANT.initials}</span>
                  <div className="grow small muted">{logoUploaded ? "Logo uploaded by RegTech365." : "No logo yet. Initials are shown."}</div>
                  <Button type="button" variant="outline" size="sm" icon="upload-simple" onClick={() => { setLogoUploaded(true); toast("Logo uploaded", "ok", "image"); }}>
                    {logoUploaded ? "Replace logo" : "Upload logo"}
                  </Button>
                </div>
                <div className="row end">
                  <Button type="submit" iconRight="arrow-right">Save and continue</Button>
                </div>
              </form>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h1 className="h1">Choose your branding</h1>
                <p className="muted" style={{ marginTop: 4 }}>Your colours appear inside the workspace and on the emails you send. Sign-in stays SuperAtlas-branded so everyone has one place to sign in.</p>
              </div>
              <div className="grid g3" style={{ gap: 10 }}>
                {THEMES.map((t) => (
                  <button key={t.key} type="button" className={`choice ${theme === t.key ? "on" : ""}`} onClick={() => setTheme(t.key)}>
                    <span className="radio" />
                    <span className="grow">
                      <b>{t.name}</b>
                      <br />
                      <span className="cap muted">{t.desc}</span>
                    </span>
                    <span className="row gap4">
                      {t.swatches.map((c) => <i key={c} style={{ width: 14, height: 14, borderRadius: 4, background: c, display: "inline-block" }} />)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="preview-box">
                <BrandPreview view="app" themeKey={theme} />
              </div>
              <div className="row between">
                <Button variant="outline" icon="arrow-left" onClick={() => setStep(0)}>Back</Button>
                <Button iconRight="arrow-right" onClick={() => setStep(2)}>Save and continue</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h1 className="h1">Invite your team</h1>
                <p className="muted" style={{ marginTop: 4 }}>Add the people who will supervise with you. You can do this later from Team.</p>
              </div>
              {invites.map((i) => (
                <div key={i.email} className="file">
                  <span className="av">{i.email.split("@")[0].slice(0, 2).toUpperCase()}</span>
                  <div className="grow">
                    <div className="strong">{i.email}</div>
                    <div className="cap muted">{i.role}</div>
                  </div>
                  <Chip tone="info" icon="envelope-simple">Invited</Chip>
                </div>
              ))}
              <form className="row wrap" style={{ gap: 10 }} onSubmit={sendInvite} noValidate>
                <input className="inp" style={{ flex: 1, minWidth: 220 }} type="email" placeholder={`name@${email.split("@")[1] || "regulator.gov.ng"}`} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <select className="sel" style={{ width: 160 }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r.name}>{r.name}</option>)}
                </select>
                <Button type="submit" variant="secondary" icon="plus">Invite</Button>
              </form>
              <div className="row between">
                <Button variant="outline" icon="arrow-left" onClick={() => setStep(1)}>Back</Button>
                <div className="row gap8">
                  {!invites.length ? <Button variant="tertiary" onClick={finish}>Skip for now</Button> : null}
                  <Button iconRight="arrow-right" onClick={finish}>Go to dashboard</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
