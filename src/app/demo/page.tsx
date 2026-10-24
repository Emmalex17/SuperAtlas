"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { isEmail } from "@/lib/authHelpers";
import { mkFooter } from "@/lib/landingContent";
import { SiteHeader } from "@/components/landing/SiteHeader";

const WHO_LABEL: Record<string, string> = { regulator: "Regulator", organisation: "Supervised organisation", firm: "Assurance firm" };
const SLOT_LABEL: Record<string, string> = { morning: "Morning (9:00 to 12:00 WAT)", midday: "Midday (12:00 to 14:00 WAT)", afternoon: "Afternoon (14:00 to 17:00 WAT)" };

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STEPS: [string, string, string][] = [
  ["envelope-simple", "We confirm by email", "Within one working day, with a calendar invitation for your chosen slot."],
  ["monitor-play", "45-minute walkthrough", "Your categories, a sample regulation, review and publishing, on video call."],
  ["flag", "A proof-of-value plan", "If it fits, a pilot on one use case with your own organisations."],
];

export default function DemoPage() {
  const [sent, setSent] = useState(false);
  const [who, setWho] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("morning");
  const [msg, setMsg] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!who) e2.who = "Choose who you are";
    if (!name) e2.name = "Enter your full name";
    if (!isEmail(email)) e2.email = "Enter a work email like name@organisation.gov.ng";
    if (!org) e2.org = "Enter your organisation";
    if (date) {
      const d = new Date(date + "T12:00:00").getDay();
      if (d === 0 || d === 6) e2.date = "Choose a weekday";
    }
    if (!consent) e2.consent = "Tick the box so we can reply to you";
    setErr(e2);
    if (Object.keys(e2).length) return;
    setSent(true);
  }

  return (
    <div className="mk">
      <SiteHeader />
      <section className="band b-canvas" style={{ paddingBlock: 56 }}>
        <div className="wrap split">
          <div>
            <div className="eyebrow">Book a demo</div>
            <h1 className="mk-h2">See SuperAtlas on your own supervision work</h1>
            <p className="lead" style={{ fontSize: 17, lineHeight: "26px" }}>
              Tell us who you are and when suits you. We tailor the walkthrough to the institutions you supervise or the work you do.
            </p>
            <div className="next-card">
              <div className="overline">What happens next</div>
              <ol className="next-steps">
                {STEPS.map(([icon, t, d], n) => (
                  <li key={t}>
                    <span className="nx-ic">
                      <Icon name={icon} />
                      <b>{n + 1}</b>
                    </span>
                    <div>
                      <b>{t}</b>
                      <p>{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="next-who">
                <span className="av" style={{ width: 32, height: 32 }}>RT</span>
                <div>
                  <b>You will speak to a SuperAtlas product specialist</b>
                  <p>Someone who has set up supervision programmes with regulators, not a sales script.</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            {sent ? (
              <div className="mk-form-card">
                <Tile icon="check-circle" tone="solid ok" />
                <h2 className="h2">Thanks, {name.split(" ")[0]}. Your request is in.</h2>
                <p className="muted small">
                  We will email <b style={{ color: "var(--text)" }}>{email}</b> within one working day to confirm your demo. Reference <span className="mono">DEMO-2026-1043</span>.
                </p>
                <div className="card flat tight">
                  <div className="kv">
                    <div>You are</div><div>{WHO_LABEL[who] || ""}</div>
                    <div>Preferred date</div><div>{date ? fmtDate(date) : "Any weekday"}</div>
                    <div>Preferred time</div><div>{SLOT_LABEL[time] || ""}</div>
                  </div>
                </div>
                <div className="row">
                  <Link href="/"><Button variant="secondary">Back to the site</Button></Link>
                  <Link href="/pilot"><Button variant="tertiary" iconRight="arrow-right">About proof of value</Button></Link>
                </div>
              </div>
            ) : (
              <form className="mk-form-card" onSubmit={submit} noValidate>
                <div>
                  <h2 className="h2">Book a demo</h2>
                  <p className="muted small" style={{ marginTop: 4 }}>45 minutes, shaped around your work.</p>
                </div>
                <Field label="I am a" error={err.who} htmlFor="d-who">
                  <select className={`sel ${err.who ? "invalid" : ""}`} id="d-who" value={who} onChange={(e) => setWho(e.target.value)}>
                    <option value="">Choose one</option>
                    <option value="regulator">Regulator</option>
                    <option value="organisation">Supervised organisation</option>
                    <option value="firm">Assurance firm</option>
                  </select>
                </Field>
                <div className="grid g2" style={{ gap: 14 }}>
                  <Field label="Full name" error={err.name} htmlFor="d-name">
                    <input className={`inp ${err.name ? "invalid" : ""}`} id="d-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Work email" error={err.email} htmlFor="d-email">
                    <input className={`inp ${err.email ? "invalid" : ""}`} id="d-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Organisation" error={err.org} htmlFor="d-org">
                    <input className={`inp ${err.org ? "invalid" : ""}`} id="d-org" value={org} onChange={(e) => setOrg(e.target.value)} />
                  </Field>
                  <Field label="Job title" optional htmlFor="d-title">
                    <input className="inp" id="d-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </Field>
                </div>
                <Field label="Country" htmlFor="d-country">
                  <select className="sel" id="d-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {["Nigeria", "Ghana", "Kenya", "Rwanda", "South Africa", "Other"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid g2" style={{ gap: 14 }}>
                  <Field label="Preferred demo date" error={err.date} hint={err.date ? undefined : "Weekdays only"} htmlFor="d-date">
                    <input className={`inp ${err.date ? "invalid" : ""}`} id="d-date" type="date" min="2026-10-20" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                  <Field label="Preferred time" htmlFor="d-time">
                    <select className="sel" id="d-time" value={time} onChange={(e) => setTime(e.target.value)}>
                      <option value="morning">Morning, 9–12 WAT</option>
                      <option value="midday">Midday, 12–2 pm WAT</option>
                      <option value="afternoon">Afternoon, 2–5 pm WAT</option>
                    </select>
                  </Field>
                </div>
                <Field label="What would you like to see?" optional htmlFor="d-msg">
                  <textarea className="ta" id="d-msg" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
                </Field>
                <label className="check">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>RegTech365 may contact me about this request.</span>
                </label>
                {err.consent ? (
                  <div className="field">
                    <div className="err"><Icon name="warning-circle" />{err.consent}</div>
                  </div>
                ) : null}
                <div className="row end">
                  <Button type="submit" iconRight="arrow-right">Request demo</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      <div dangerouslySetInnerHTML={{ __html: mkFooter() }} />
    </div>
  );
}
