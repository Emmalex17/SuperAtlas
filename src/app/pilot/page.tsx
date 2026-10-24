"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Tile } from "@/components/ui";
import { isEmail } from "@/lib/authHelpers";
import { mkFooter } from "@/lib/landingContent";
import { SiteHeader } from "@/components/landing/SiteHeader";

const PHASES: [string, string][] = [
  ["Configure", "We map one regulation or standard, your workflow and branding into SuperAtlas."],
  ["Run", "A selected group of organisations respond; assessors review; your team supervises."],
  ["Decide", "Review results, compliance strength and feedback with your stakeholders."],
];

const INCLUDED: [string, string, string][] = [
  ["identification-card", "A branded workspace", "Your name, colours and sign-in page."],
  ["users", "Support from our team", "A product specialist and a weekly check in."],
  ["book-open-text", "One regulation, loaded", "Drafted with AI from your PDF, reviewed by your staff."],
  ["file-text", "A results pack", "Scores, findings, adoption and a rollout plan."],
];

export default function PilotPage() {
  const [sent, setSent] = useState(false);
  const [org, setOrg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [size, setSize] = useState("50 to 200");
  const [reg, setReg] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!org) e2.org = "Enter the regulator or authority";
    if (!name) e2.name = "Enter your name";
    if (!isEmail(email)) e2.email = "Enter a valid work email";
    setErr(e2);
    if (Object.keys(e2).length) return;
    setSent(true);
  }

  return (
    <div className="mk">
      <SiteHeader />
      <section className="band b-white" style={{ paddingBlock: 64 }}>
        <div className="wrap">
          <div className="head" style={{ marginBottom: 32 }}>
            <div className="eyebrow">Proof of value</div>
            <h1 className="mk-h2">See it working on your own use case first</h1>
            <p className="lead">Start with one supervisory use case and a selected group of organisations, then decide on wider rollout.</p>
          </div>
          <div className="cgrid c3">
            {PHASES.map(([t, p], n) => (
              <div key={t} className="mcard soft">
                <span className="numc">{n + 1}</span>
                <b>{t}</b>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="band b-canvas" style={{ paddingBlock: 64 }}>
        <div className="wrap split">
          <div>
            <h2 className="h2">What is included</h2>
            <div className="feat-list">
              {INCLUDED.map(([icon, t, d]) => (
                <div key={t} className="feat">
                  <Tile icon={icon} size="sm" />
                  <div>
                    <b>{t}</b>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card flat" style={{ marginTop: 24 }}>
              <b className="small">What we need from you</b>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-2)", fontSize: 14, lineHeight: "24px" }}>
                <li>A named project lead and two supervisors</li>
                <li>One regulation or framework to load</li>
                <li>Up to 10 institutions willing to take part</li>
              </ul>
            </div>
          </div>
          <div>
            {sent ? (
              <div className="mk-form-card">
                <Tile icon="check-circle" tone="solid ok" />
                <h2 className="h2">Request received</h2>
                <p className="muted small">
                  We will contact <b style={{ color: "var(--text)" }}>{email}</b> within one working day. Reference <span className="mono">POV-2026-0217</span>.
                </p>
                <div>
                  <Link href="/"><Button variant="secondary">Back to the site</Button></Link>
                </div>
              </div>
            ) : (
              <form className="mk-form-card" onSubmit={submit} noValidate>
                <h2 className="h2">Request a proof of value</h2>
                <Field label="Regulator or authority" error={err.org} htmlFor="p-org">
                  <input className={`inp ${err.org ? "invalid" : ""}`} id="p-org" value={org} onChange={(e) => setOrg(e.target.value)} />
                </Field>
                <div className="grid g2" style={{ gap: 14 }}>
                  <Field label="Your name" error={err.name} htmlFor="p-name">
                    <input className={`inp ${err.name ? "invalid" : ""}`} id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Work email" error={err.email} htmlFor="p-email">
                    <input className={`inp ${err.email ? "invalid" : ""}`} id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                </div>
                <Field label="Institutions you supervise" htmlFor="p-size">
                  <select className="sel" id="p-size" value={size} onChange={(e) => setSize(e.target.value)}>
                    {["Fewer than 50", "50 to 200", "200 to 1,000", "More than 1,000"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Which regulation would you start with?" optional htmlFor="p-reg">
                  <input className="inp" id="p-reg" value={reg} onChange={(e) => setReg(e.target.value)} />
                </Field>
                <div className="row end">
                  <Button type="submit" iconRight="arrow-right">Request a proof of value</Button>
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
