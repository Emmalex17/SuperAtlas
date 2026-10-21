"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Field, Chip } from "@/components/ui";
import { Icon, type IconName } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import {
  ORGANISATIONS,
  ensureOrgOnboard,
  saveOrgProfile,
  setOrgLogoUploaded,
  addOrgOfficer,
  removeOrgOfficer,
  inviteColleague,
  addOrgLink,
  completeOrgOnboardStep,
  type OrgOnboard,
} from "@/lib/mockData";

const ORG_ID = "zenith";

const ORG_STEPS: [keyof OrgOnboard, string, IconName][] = [
  ["profile", "Organisation profile", "identification-card"],
  ["logo", "Logo", "image"],
  ["officers", "Key officers", "users"],
  ["people", "Invite colleagues", "user-plus"],
  ["group", "Group links", "buildings"],
];

export default function OrgWelcomePage() {
  const router = useRouter();
  const toast = useToast();
  const org = ORGANISATIONS.find((o) => o.id === ORG_ID)!;
  const onboard = ensureOrgOnboard(org);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const firstIncomplete = ORG_STEPS.find(([k]) => !onboard[k])?.[0] ?? "profile";
  const [step, setStep] = useState<keyof OrgOnboard>(firstIncomplete);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("step");
    if (requested && ORG_STEPS.some(([k]) => k === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
      setStep(requested as keyof OrgOnboard);
    }
  }, []);

  const done = ORG_STEPS.filter(([k]) => onboard[k]).length;

  function advance(k: keyof OrgOnboard) {
    completeOrgOnboardStep(org, k);
    const next = ORG_STEPS.find(([sk]) => !onboard[sk]);
    if (next) {
      setStep(next[0]);
      bump();
    } else {
      toast("Setup complete. Your profile is ready.", "ok", "check-circle");
      router.push("/organisation");
    }
  }

  // Profile step
  const [trade, setTrade] = useState(org.name.replace(/ (Plc|Ltd|Limited)$/, ""));
  const [rc, setRc] = useState(org.rc ?? "");
  const [web, setWeb] = useState(org.web ?? "");
  const [hq, setHq] = useState(org.hq ?? "");
  const [email, setEmail] = useState(org.email ?? "");

  function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    saveOrgProfile(org, { rc, web, hq, email });
    toast("Profile saved");
    advance("profile");
  }

  // Officers step
  const [ofName, setOfName] = useState("");
  const [ofRole, setOfRole] = useState("Chief information security officer");
  const [ofEmail, setOfEmail] = useState("");

  function submitOfficer(e: React.FormEvent) {
    e.preventDefault();
    if (!ofName || !ofEmail) {
      toast("Add a name and email", "bad");
      return;
    }
    addOrgOfficer(org, { name: ofName, role: ofRole, email: ofEmail });
    setOfName("");
    setOfEmail("");
    bump();
    toast("Officer added");
  }

  // Colleagues step
  const [coEmail, setCoEmail] = useState("");
  const [coRole, setCoRole] = useState("Contributor · answers assigned requirements");

  function submitColleague(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(coEmail)) {
      toast("Enter a valid email", "bad");
      return;
    }
    inviteColleague(org, coEmail, coRole.split(" · ")[0]);
    setCoEmail("");
    bump();
    toast(`Invitation sent to ${coEmail}`, "ok", "envelope-simple");
  }

  // Group links step
  const [linkName, setLinkName] = useState("");
  const [linkRel, setLinkRel] = useState("Holding company");

  function submitLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkName) return;
    addOrgLink(org, { name: linkName, rel: linkRel });
    setLinkName("");
    bump();
    toast("Group link added");
  }

  const stepDef = ORG_STEPS.find(([k]) => k === step)!;

  return (
    <AppShell workspace="organisation">
      <div className="ph">
        <span className="logo s48" style={{ background: org.color }}>{org.initials}</span>
        <div className="grow">
          <div className="overline">Getting started</div>
          <h1 className="h1" style={{ marginTop: 2 }}>Set up {org.name}</h1>
          <p className="muted small" style={{ marginTop: 2 }}>
            Category: <b style={{ color: "var(--text)", fontWeight: 500 }}>{org.type}{org.tier ? ` · ${org.tier}` : ""}</b>, set by NITDA
          </p>
        </div>
        <div className="page-progress">
          <div className="grow"><div className="bar"><i style={{ width: `${(done / ORG_STEPS.length) * 100}%` }} /></div></div>
          <span className="cap strong tnum">{done} of {ORG_STEPS.length}</span>
        </div>
      </div>

      <div className="grid side-l">
        <div className="card tight vsteps">
          {ORG_STEPS.map(([k, l], n) => (
            <button key={k} className={`vstep ${step === k ? "on" : ""} ${onboard[k] ? "done" : ""}`} onClick={() => setStep(k)}>
              <span className="n">{onboard[k] ? <Icon name="check" /> : n + 1}</span>
              {l}
            </button>
          ))}
          <hr className="sep" style={{ margin: "8px 0" }} />
          <Button variant="tertiary" icon="eye" onClick={() => router.push("/organisation/profile")}>View profile</Button>
        </div>

        <div className="card col gap16">
          <div className="row">
            <span className="tile"><Icon name={stepDef[2]} /></span>
            <div className="h3">{stepDef[1]}</div>
          </div>

          {step === "profile" && (
            <form className="col gap16" onSubmit={submitProfile}>
              <div className="grid g2" style={{ gap: 16 }}>
                <Field label="Legal name" hint="From your invitation. Contact the regulator to change it." htmlFor="ob-name">
                  <input className="inp" id="ob-name" value={org.name} readOnly />
                </Field>
                <Field label="Trading name" htmlFor="ob-trade">
                  <input className="inp" id="ob-trade" value={trade} onChange={(e) => setTrade(e.target.value)} />
                </Field>
                <Field label="Registration number" htmlFor="ob-rc">
                  <input className="inp" id="ob-rc" value={rc} onChange={(e) => setRc(e.target.value)} />
                </Field>
                <Field label="Website" htmlFor="ob-web">
                  <input className="inp" id="ob-web" value={web} onChange={(e) => setWeb(e.target.value)} />
                </Field>
                <Field label="Head office" htmlFor="ob-hq">
                  <input className="inp" id="ob-hq" value={hq} onChange={(e) => setHq(e.target.value)} />
                </Field>
                <Field label="Compliance contact email" htmlFor="ob-em">
                  <input className="inp" id="ob-em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              </div>
              <div className="row end">
                <Button type="submit" icon="arrow-right" testId="wiz-next">Save and continue</Button>
              </div>
            </form>
          )}

          {step === "logo" && (
            <div className="col gap16">
              <p className="muted small">Your logo appears to the regulator and your assurance firm wherever your organisation is listed.</p>
              <div className="grid g2" style={{ gap: 12 }}>
                {["On light", "On dark"].map((l, i) => (
                  <div key={l} className="col" style={{ alignItems: "center", gap: 8, padding: 18, borderRadius: 14, background: i ? "var(--brand-800)" : "var(--canvas)" }}>
                    <span className="logo s48" style={{ background: org.color }}>{org.initials}</span>
                    <span className="cap" style={{ color: i ? "var(--brand-200)" : "var(--text-2)" }}>{l}</span>
                  </div>
                ))}
              </div>
              {org.logoUp ? (
                <div className="file">
                  <Icon name="image" />
                  <div className="grow">
                    <div className="strong">{org.id}-logo.svg</div>
                    <div className="cap muted">18 KB · square · uploaded just now</div>
                  </div>
                  <Button variant="tertiary" size="sm" onClick={() => { setOrgLogoUploaded(org); bump(); }}>Replace</Button>
                </div>
              ) : (
                <button type="button" className="drop" data-test="ob-logo" onClick={() => { setOrgLogoUploaded(org); bump(); toast("Logo uploaded", "ok", "image"); }}>
                  <Icon name="upload-simple" />
                  <b>Upload your logo</b>
                  <span className="cap muted">SVG or PNG, square, at least 256 px</span>
                </button>
              )}
              <div className="note"><Icon name="info" />Until a logo is uploaded, your initials are shown in your brand colour.</div>
              <div className="row end">
                <Button variant="tertiary" onClick={() => advance("logo")}>Skip for now</Button>
                <Button icon="arrow-right" disabled={!org.logoUp} testId="ob-logo-next" onClick={() => advance("logo")}>Continue</Button>
              </div>
            </div>
          )}

          {step === "officers" && (
            <div className="col gap16">
              <p className="muted small">The regulator sees these people as your accountable officers.</p>
              {(org.officers ?? []).map((p, i) => (
                <div key={p.email} className="file">
                  <span className="av">{p.initials}</span>
                  <div className="grow">
                    <div className="strong">{p.name}</div>
                    <div className="cap muted">{p.role}</div>
                  </div>
                  {i ? (
                    <button className="icon-btn" aria-label="Remove" onClick={() => { removeOrgOfficer(org, i); bump(); }}><Icon name="trash" /></button>
                  ) : (
                    <Chip tone="brand">You</Chip>
                  )}
                </div>
              ))}
              <form className="card flat tight col gap12" onSubmit={submitOfficer}>
                <b className="small">Add an officer</b>
                <div className="grid g3" style={{ gap: 12 }}>
                  <input className="inp" placeholder="Full name" value={ofName} onChange={(e) => setOfName(e.target.value)} />
                  <select className="sel" value={ofRole} onChange={(e) => setOfRole(e.target.value)}>
                    {["Chief information security officer", "Head, internal audit", "Data protection officer", "Chief risk officer", "Managing director"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <input className="inp" placeholder="Email" type="email" value={ofEmail} onChange={(e) => setOfEmail(e.target.value)} />
                </div>
                <div className="row end">
                  <Button type="submit" variant="secondary" icon="plus" testId="of-add">Add officer</Button>
                </div>
              </form>
              <div className="row end">
                <Button icon="arrow-right" disabled={(org.officers ?? []).length < 2} testId="ob-off-next" onClick={() => advance("officers")}>Continue</Button>
              </div>
              {(org.officers ?? []).length < 2 ? <p className="cap muted" style={{ textAlign: "right" }}>Add at least one more officer.</p> : null}
            </div>
          )}

          {step === "people" && (
            <div className="col gap16">
              <p className="muted small">Colleagues help answer requirements and file returns. You choose what each person can do.</p>
              {(org.colleagues ?? []).map((p) => (
                <div key={p.email} className="file">
                  <span className="av">{(p.name || p.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                  <div className="grow">
                    <div className="strong">{p.email}</div>
                    <div className="cap muted">{p.role}</div>
                  </div>
                  <Chip tone="info" icon="envelope-simple">Invited</Chip>
                </div>
              ))}
              <form className="card flat tight col gap12" onSubmit={submitColleague}>
                <div className="grid g2" style={{ gap: 12, gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }}>
                  <input className="inp" placeholder={`colleague@${org.web || "organisation.com"}`} type="email" value={coEmail} onChange={(e) => setCoEmail(e.target.value)} />
                  <select className="sel" value={coRole} onChange={(e) => setCoRole(e.target.value)}>
                    {["Contributor · answers assigned requirements", "Compliance officer · approves and submits", "Executive viewer · read only", "Organisation admin"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="row end">
                  <Button type="submit" variant="secondary" icon="envelope-simple" testId="co-add">Send invite</Button>
                </div>
              </form>
              <div className="row end">
                <Button variant="tertiary" onClick={() => advance("people")}>Skip for now</Button>
                <Button icon="arrow-right" disabled={!(org.colleagues ?? []).length} testId="ob-people-next" onClick={() => advance("people")}>Continue</Button>
              </div>
            </div>
          )}

          {step === "group" && (
            <div className="col gap16">
              <div className="note"><Icon name="info" />Each entity answers on its own — linking a holding company or subsidiary is for reference only. Every entity keeps its own requirements, answers, scores and findings.</div>
              {(org.links ?? []).map((l) => (
                <div key={l.name} className="file">
                  <Icon name="buildings" />
                  <div className="grow">
                    <div className="strong">{l.name}</div>
                    <div className="cap muted">{l.rel}</div>
                  </div>
                  <Chip tone="ok">Linked</Chip>
                </div>
              ))}
              <form className="card flat tight col gap12" onSubmit={submitLink}>
                <div className="grid g2" style={{ gap: 12 }}>
                  <input className="inp" placeholder="Linked entity name" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
                  <select className="sel" value={linkRel} onChange={(e) => setLinkRel(e.target.value)}>
                    {["Holding company", "Subsidiary", "Sister company"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="row end">
                  <Button type="submit" variant="secondary" icon="plus">Add link</Button>
                </div>
              </form>
              <div className="row end">
                <Button variant="tertiary" onClick={() => advance("group")}>No group links</Button>
                <Button testId="ob-finish" onClick={() => advance("group")}>Finish setup</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
