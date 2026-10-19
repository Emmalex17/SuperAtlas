"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Lockup, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Commercial bank");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
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
          {submitted ? (
            <div className="col gap16" style={{ alignItems: "center", textAlign: "center" }}>
              <Tile icon="seal-check" tone="ok" size="lg" />
              <h2 className="h1">Application submitted</h2>
              <p className="muted">
                NITDA will review <b>{orgName}</b>&rsquo;s application and respond by email. This is a demo —
                no application is actually sent, and nothing is saved.
              </p>
              <Link href="/signin"><Button variant="outline">Back to sign in</Button></Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="h1" style={{ marginTop: 28 }}>Register your organisation</h2>
                <p className="muted" style={{ marginTop: 6 }}>Tell NITDA a little about your organisation to get started.</p>
              </div>
              <form className="col gap16" onSubmit={handleSubmit} noValidate>
                <Field label="Organisation name" htmlFor="reg-org">
                  <input className="inp" id="reg-org" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
                </Field>
                <Field label="Work email" htmlFor="reg-email">
                  <input className="inp" id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Field>
                <Field label="Category" htmlFor="reg-category">
                  <select className="sel" id="reg-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Commercial bank</option>
                    <option>Microfinance bank</option>
                    <option>Payment solution service provider</option>
                  </select>
                </Field>
                <Button type="submit" size="lg" block>Submit application</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
