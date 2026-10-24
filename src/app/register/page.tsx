"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { isEmail } from "@/lib/authHelpers";
import { CATEGORIES, tiersOf, catLabel } from "@/lib/mockData";
import { mkFooter } from "@/lib/landingContent";
import { SiteHeader } from "@/components/landing/SiteHeader";

const STEPS = ["Organisation", "Category", "Licence", "Your details", "Review"];

type FormState = {
  name: string;
  trading: string;
  rc: string;
  web: string;
  addr: string;
  sector: string;
  type: string;
  tier: string;
  licNo: string;
  lic: string;
  person: string;
  title: string;
  email: string;
  phone: string;
};

const INITIAL: FormState = {
  name: "",
  trading: "",
  rc: "",
  web: "",
  addr: "",
  sector: CATEGORIES[0].name,
  type: CATEGORIES[0].types[0].name,
  tier: "",
  licNo: "",
  lic: "",
  person: "",
  title: "",
  email: "",
  phone: "",
};

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [declared, setDeclared] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function pickSector(sectorName: string) {
    const sector = CATEGORIES.find((c) => c.name === sectorName)!;
    setV((prev) => ({ ...prev, sector: sectorName, type: sector.types[0].name, tier: "" }));
    setErr({});
  }
  function pickType(typeName: string) {
    setV((prev) => ({ ...prev, type: typeName, tier: "" }));
    setErr({});
  }
  function pickTier(tier: string) {
    setV((prev) => ({ ...prev, tier }));
    setErr({});
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (step === 0) {
      if (!v.name) e2.name = "Enter the legal name";
      if (!v.rc) e2.rc = "Enter the registration number";
    }
    if (step === 1 && tiersOf(v.type).length && !v.tier) e2.tier = "Choose a tier";
    if (step === 2 && !v.lic) e2.lic = "Upload your licence to continue";
    if (step === 3) {
      if (!v.person) e2.person = "Enter your name";
      if (!isEmail(v.email)) e2.email = "Enter a valid work email";
    }
    if (step === 4 && !declared) e2.decl = "Confirm the declaration to submit";
    setErr(e2);
    if (Object.keys(e2).length) return;
    if (step === 4) {
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  }

  const sector = CATEGORIES.find((c) => c.name === v.sector) ?? CATEGORIES[0];
  const type = sector.types.find((t) => t.name === v.type);
  const tiers = tiersOf(v.type);

  return (
    <div className="mk" style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <SiteHeader />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px var(--side-gutter-r) 80px var(--side-gutter-l)", display: "flex", flexDirection: "column", gap: 24 }}>
        {done ? (
          <div className="card col gap16" style={{ padding: 40, alignItems: "flex-start" }}>
            <Tile icon="check-circle" tone="solid ok" size="lg" />
            <h1 className="h1">Application received</h1>
            <p className="muted" style={{ fontSize: 16, lineHeight: "25px" }}>
              NITDA will verify {v.name} and confirm your category. We have emailed <b style={{ color: "var(--text)" }}>{v.email}</b> a link to set your password. Reference <span className="mono">REG-2026-0458</span>.
            </p>
            <div className="timeline" style={{ width: "100%" }}>
              {[
                ["check-circle" as const, "ok" as const, "Application submitted", "Just now"],
                ["hourglass" as const, "info" as const, "Verification by the regulator", "Usually within 3 working days"],
                ["buildings" as const, "neu" as const, "Complete your profile and invite colleagues", "After verification"],
              ].map(([icon, tone, a, b]) => (
                <div key={a} className="tl">
                  <Tile icon={icon} tone={tone} size="sm" />
                  <div>
                    <b>{a}</b>
                    <div className="cap muted">{b}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row wrap">
              <Link href="/"><Button variant="outline">Back to the site</Button></Link>
            </div>
          </div>
        ) : (
          <>
            <div>
              <span className="overline">Register your organisation</span>
              <h1 className="h1" style={{ marginTop: 6 }}>Join NITDA on SuperAtlas</h1>
              <p className="muted" style={{ marginTop: 6 }}>For organisations supervised by NITDA that have not received an invitation.</p>
            </div>
            <div className="stepper">
              {STEPS.map((s, i) => (
                <span key={s} className="row" style={{ gap: 8 }}>
                  {i > 0 ? <span className="step-line" /> : null}
                  <span className={`step ${i < step ? "done" : i === step ? "on" : ""}`}>
                    <span className="n">{i < step ? <Icon name="check" /> : i + 1}</span>
                    {s}
                  </span>
                </span>
              ))}
            </div>
            <form className="card col gap20" onSubmit={next} noValidate>
              {step === 0 && (
                <>
                  <div className="grid g2" style={{ gap: 16 }}>
                    <Field label="Legal name" error={err.name} htmlFor="r-name">
                      <input className={`inp ${err.name ? "invalid" : ""}`} id="r-name" value={v.name} onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field label="Trading name" optional htmlFor="r-trading">
                      <input className="inp" id="r-trading" value={v.trading} onChange={(e) => set("trading", e.target.value)} />
                    </Field>
                    <Field label="Registration number" error={err.rc} htmlFor="r-rc">
                      <input className={`inp ${err.rc ? "invalid" : ""}`} id="r-rc" value={v.rc} onChange={(e) => set("rc", e.target.value)} />
                    </Field>
                    <Field label="Website" optional htmlFor="r-web">
                      <input className="inp" id="r-web" value={v.web} onChange={(e) => set("web", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Head office address" htmlFor="r-addr">
                    <input className="inp" id="r-addr" value={v.addr} onChange={(e) => set("addr", e.target.value)} />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <div className="lbl" style={{ marginBottom: 8 }}>Sector</div>
                    <div className="grid g3" style={{ gap: 8 }}>
                      {CATEGORIES.map((c) => (
                        <button key={c.id} type="button" className={`choice ${c.name === v.sector ? "on" : ""}`} onClick={() => pickSector(c.name)}>
                          <span className="radio" />
                          <span>
                            <b>{c.name}</b>
                            <br />
                            <span className="cap muted">{c.types.length} institution types</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="lbl" style={{ marginBottom: 8 }}>Institution type</div>
                    <div className="grid g2" style={{ gap: 8 }}>
                      {sector.types.map((t) => (
                        <button key={t.id} type="button" className={`choice ${t.name === v.type ? "on" : ""}`} onClick={() => pickType(t.name)}>
                          <span className="radio" />
                          <span>
                            <b>{t.name}</b>
                            <br />
                            <span className="cap muted">{t.tiers.length ? "Tiers: " + t.tiers.join(", ") : "No tiers"}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {type && tiers.length ? (
                    <div>
                      <div className="lbl" style={{ marginBottom: 8 }}>
                        Authorisation tier{" "}
                        {err.tier ? (
                          <span className="err" style={{ display: "inline-flex", color: "var(--bad-fg)", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                            <Icon name="warning-circle" /> {err.tier}
                          </span>
                        ) : null}
                      </div>
                      <div className="row wrap gap8">
                        {tiers.map((t) => (
                          <button key={t} type="button" className={`pill ${t === v.tier ? "on" : ""}`} onClick={() => pickTier(t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="note">
                    <Icon name="lock-simple" />
                    Choose the category on your licence. The regulator checks it during verification, and only the regulator can change it later.
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label="Licence number" htmlFor="r-licno">
                    <input className="inp" id="r-licno" value={v.licNo} onChange={(e) => set("licNo", e.target.value)} />
                  </Field>
                  {v.lic ? (
                    <div className="file">
                      <Tile icon="file-text" tone="ok" size="sm" />
                      <div className="grow">
                        <div className="strong" style={{ overflowWrap: "anywhere" }}>{v.lic}</div>
                        <div className="cap muted">1.8 MB · uploaded just now</div>
                      </div>
                      <Button variant="tertiary" size="sm" type="button" onClick={() => set("lic", "")}>Remove</Button>
                    </div>
                  ) : (
                    <button type="button" className="drop" onClick={() => set("lic", "Microfinance banking licence — state.pdf")}>
                      <Tile icon="upload-simple" size="sm" />
                      <b>Upload your operating licence</b>
                      <span className="cap muted">PDF, up to 10 MB</span>
                    </button>
                  )}
                  {err.lic ? (
                    <div className="field">
                      <div className="err"><Icon name="warning-circle" />{err.lic}</div>
                    </div>
                  ) : null}
                </>
              )}

              {step === 3 && (
                <div className="grid g2" style={{ gap: 16 }}>
                  <Field label="Your full name" error={err.person} htmlFor="r-person">
                    <input className={`inp ${err.person ? "invalid" : ""}`} id="r-person" value={v.person} onChange={(e) => set("person", e.target.value)} />
                  </Field>
                  <Field label="Job title" htmlFor="r-title">
                    <input className="inp" id="r-title" value={v.title} onChange={(e) => set("title", e.target.value)} />
                  </Field>
                  <Field label="Work email" error={err.email} hint="Use your organisation's domain. We will send a link to set your password." htmlFor="r-email">
                    <input className={`inp ${err.email ? "invalid" : ""}`} id="r-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
                  </Field>
                  <Field label="Phone" optional htmlFor="r-phone">
                    <input className="inp" id="r-phone" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
                  </Field>
                </div>
              )}

              {step === 4 && (
                <>
                  <div className="kv">
                    <div>Legal name</div><div>{v.name}</div>
                    <div>Registration number</div><div>{v.rc}</div>
                    <div>Head office</div><div>{v.addr}</div>
                    <div>Category</div><div>{catLabel(v.type, v.tier)}</div>
                    <div>Licence</div><div>{v.lic} · {v.licNo}</div>
                    <div>Contact</div>
                    <div>
                      {v.person} · {v.title}
                      <br />
                      <span className="muted small">{v.email}</span>
                    </div>
                  </div>
                  <label className="check">
                    <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
                    <span>I confirm these details are accurate and I am authorised to register this organisation.</span>
                  </label>
                  {err.decl ? (
                    <div className="field">
                      <div className="err"><Icon name="warning-circle" />{err.decl}</div>
                    </div>
                  ) : null}
                </>
              )}

              <div className="row between">
                {step ? (
                  <Button variant="outline" icon="arrow-left" type="button" onClick={() => setStep((s) => s - 1)}>Back</Button>
                ) : (
                  <Link href="/signin" className="small strong">Already have an account? Sign in</Link>
                )}
                <Button type="submit" iconRight={step === 4 ? "check" : "arrow-right"}>{step === 4 ? "Submit application" : "Continue"}</Button>
              </div>
            </form>
          </>
        )}
      </div>
      <div dangerouslySetInnerHTML={{ __html: mkFooter() }} />
    </div>
  );
}
