"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { isEmail } from "@/lib/authHelpers";
import { CATEGORIES, tiersOf } from "@/lib/mockData";

export default function InviteOrganisationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [sector, setSector] = useState(CATEGORIES[0].name);
  const [type, setType] = useState(CATEGORIES[0].types[0].name);
  const [tier, setTier] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  const sectorObj = CATEGORIES.find((c) => c.name === sector) ?? CATEGORIES[0];
  const tiers = tiersOf(type);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!org) e2.org = "Enter the organisation name";
    if (!isEmail(email)) e2.email = "Enter a valid email address";
    if (tiers.length && !tier) e2.tier = "Choose a tier for this institution type";
    setErr(e2);
    if (Object.keys(e2).length) return;
    toast(`Invitation sent to ${org}`, "ok", "envelope-simple");
    router.push("/regulator/organisations");
  }

  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Invite organisations" sub="Each invitation maps the organisation to a category. They can see it when they join, and only you can change it." />
      <form className="grid side" onSubmit={submit} noValidate>
        <div className="card col gap16">
          <Field label="Organisation name" error={err.org} htmlFor="in-org">
            <input className={`inp ${err.org ? "invalid" : ""}`} id="in-org" placeholder="e.g. Northgate Bank Plc" value={org} onChange={(e) => setOrg(e.target.value)} />
          </Field>
          <Field label="Compliance contact email" error={err.email} htmlFor="in-email">
            <input className={`inp ${err.email ? "invalid" : ""}`} id="in-email" type="email" placeholder="compliance@organisation.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Sector" htmlFor="in-sector">
            <select className="sel" id="in-sector" value={sector} onChange={(e) => { setSector(e.target.value); const s = CATEGORIES.find((c) => c.name === e.target.value); setType(s?.types[0].name ?? ""); setTier(""); }}>
              {CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Institution type" htmlFor="in-type">
            <select className="sel" id="in-type" value={type} onChange={(e) => { setType(e.target.value); setTier(""); }}>
              {sectorObj.types.map((t) => <option key={t.id}>{t.name}</option>)}
            </select>
          </Field>
          {tiers.length ? (
            <Field label="Authorisation tier" error={err.tier} htmlFor="in-tier">
              <select className={`sel ${err.tier ? "invalid" : ""}`} id="in-tier" value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="">Choose tier</option>
                {tiers.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="Personal message" optional htmlFor="in-msg">
            <textarea className="ta" id="in-msg" placeholder="Optional note added to the email" value={msg} onChange={(e) => setMsg(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => router.push("/regulator/organisations")}>Cancel</Button>
            <Button type="submit" icon="envelope-simple">Send invitation</Button>
          </div>
        </div>
        <div className="col gap12">
          <div className="overline">Email preview</div>
          <div className="mail">
            <div className="mh">
              <b style={{ color: "var(--text)" }}>NITDA invites {org || "your organisation"} to SuperAtlas</b>
              <span>From: NITDA &lt;no-reply@superatlas.nitda.gov.ng&gt;</span>
            </div>
            <div style={{ height: 5, background: "var(--brand-500)" }} />
            <div className="mb col gap12">
              <div className="row gap8">
                <span className="logo s32">NI</span>
                <b>NITDA</b>
              </div>
              <p className="small">Hello,</p>
              <p className="small">
                NITDA supervises {org || "your organisation"} as a <b>{type}{tier ? ` · ${tier}` : ""}</b>. Accept this invitation to set up your organisation&rsquo;s account. You will answer requirements and file returns here.
              </p>
              <span className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start", boxShadow: "none" }}>Accept invitation</span>
              <p className="cap muted"><Icon name="clock" /> The link expires in 14 days. Powered by SuperAtlas.</p>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
