"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { TENANT } from "@/lib/mockData";

export default function RegulatorProfilePage() {
  const toast = useToast();
  const [name, setName] = useState(TENANT.name);
  const [short, setShort] = useState(TENANT.short);
  const [legal, setLegal] = useState(TENANT.legal);
  const [mandate, setMandate] = useState(TENANT.mandate);
  const [sectors, setSectors] = useState<string[]>(TENANT.sectors);
  const [email, setEmail] = useState(TENANT.email);
  const [phone, setPhone] = useState(TENANT.phone);
  const [address, setAddress] = useState(TENANT.address);
  const [logoUploaded, setLogoUploaded] = useState(TENANT.logoUploaded);
  const [nameErr, setNameErr] = useState<string | undefined>();

  const allSectors = ["Banking", "Payments", "Digital economy", "Insurance", "Capital markets", "Pensions"];

  function toggleSector(s: string) {
    setSectors((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setNameErr("Enter the name to show in SuperAtlas");
      return;
    }
    setNameErr(undefined);
    toast("Profile saved");
  }

  return (
    <AppShell workspace="regulator">
      <PageHead title="Profile" sub="How NITDA appears to organisations and assurance firms, on screen and in emails." />
      <div className="tabs" role="tablist">
        <button role="tab" className="on">Details</button>
        <Link href="/regulator/profile/branding" role="tab">Branding</Link>
      </div>

      <form className="grid side" onSubmit={submit} noValidate>
        <div className="card col gap20">
          <div className="h4">Details</div>
          <div className="grid g2" style={{ gap: 16 }}>
            <Field label="Name shown in SuperAtlas" error={nameErr} htmlFor="t-name">
              <input className={`inp ${nameErr ? "invalid" : ""}`} id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Short name" hint='Used in status text, e.g. "With NITDA". Up to 8 characters.' htmlFor="t-short">
              <input className="inp" id="t-short" maxLength={8} value={short} onChange={(e) => setShort(e.target.value)} />
            </Field>
          </div>
          <Field label="Legal name" htmlFor="t-legal">
            <input className="inp" id="t-legal" value={legal} onChange={(e) => setLegal(e.target.value)} />
          </Field>
          <Field label="Mandate" hint="Shown on your profile and in invitation emails." htmlFor="t-mandate">
            <textarea className="ta" id="t-mandate" value={mandate} onChange={(e) => setMandate(e.target.value)} />
          </Field>
          <div className="field">
            <label>Sectors you supervise</label>
            <div className="row wrap gap8">
              {allSectors.map((s) => (
                <label key={s} className={`pill ${sectors.includes(s) ? "on" : ""}`} style={{ cursor: "pointer" }}>
                  <input type="checkbox" className="sr" checked={sectors.includes(s)} onChange={() => toggleSector(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="grid g2" style={{ gap: 16 }}>
            <Field label="Supervision email" htmlFor="t-email">
              <input className="inp" id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="t-phone">
              <input className="inp" id="t-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Address" htmlFor="t-addr">
            <input className="inp" id="t-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="submit">Save profile</Button>
          </div>
        </div>

        <div className="col gap24">
          <div className="card col gap16">
            <div className="h4">Logo</div>
            <div className="row">
              <span className="logo s64" style={logoUploaded ? { background: "#fff", color: "var(--brand-700)", boxShadow: "inset 0 0 0 1px var(--border)" } : undefined}>{TENANT.initials}</span>
              <div className="small muted">Square SVG or PNG, at least 256 px. Shown in the sidebar, sign-in page and emails.</div>
            </div>
            {logoUploaded ? (
              <div className="file">
                <Icon name="image" />
                <div className="grow">
                  <div className="strong">regulator-logo.svg</div>
                  <div className="cap muted">24 KB · uploaded just now</div>
                </div>
                <Button variant="tertiary" size="sm" type="button" onClick={() => { setLogoUploaded(false); toast("Logo removed", "ok", "image"); }}>Remove</Button>
              </div>
            ) : (
              <button type="button" className="drop" onClick={() => { setLogoUploaded(true); toast("Logo uploaded", "ok", "image"); }}>
                <Icon name="upload-simple" />
                <b className="small">Upload logo</b>
                <span className="cap muted">Drag a file here or click to choose</span>
              </button>
            )}
          </div>
          <div className="card col gap12">
            <div className="h4">Preview</div>
            <div className="preview-box" style={{ padding: 16, background: "var(--sidebar)", color: "#fff", border: 0 }}>
              <div className="row">
                <span className="logo s40" style={logoUploaded ? { background: "#fff", color: "var(--brand-700)" } : undefined}>{TENANT.initials}</span>
                <div>
                  <b>{name}</b>
                  <div className="cap" style={{ color: "var(--brand-200)" }}>Supervision workspace</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
