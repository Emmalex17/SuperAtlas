"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Field, Tile, AlertBox } from "@/components/ui";
import { InviteEmailPreview } from "@/components/InviteEmailPreview";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { isEmail } from "@/lib/authHelpers";
import { CATEGORIES, tiersOf, catLabel, inviteOrganisation, resendOrInvite } from "@/lib/mockData";

type Mode = "sheet" | "single";

type SheetFlag = "exists" | "tier" | "category" | "expired" | "";
type SheetRow = { org: string; email: string; initials: string; color: string; sector: string; type: string; tier: string; flag: SheetFlag; resolved?: boolean };

const SEED_ROWS: SheetRow[] = [
  { org: "Zenith Bank Plc", email: "compliance@zenith.example", initials: "ZB", color: "#C8102E", sector: "Banking", type: "Commercial bank", tier: "National", flag: "exists" },
  { org: "United Bank for Africa Plc", email: "compliance@ubagroup.example", initials: "UB", color: "#D71920", sector: "Banking", type: "Commercial bank", tier: "International", flag: "exists" },
  { org: "TAJ Bank Ltd", email: "compliance@tajbank.example", initials: "TB", color: "#7A1F5C", sector: "Banking", type: "Non-interest bank", tier: "", flag: "tier" },
  { org: "OPay Digital Services Ltd", email: "compliance@opay.example", initials: "OP", color: "#1DCF9F", sector: "Banking", type: "Microfinance bank", tier: "National", flag: "category" },
  { org: "Sterling Bank Plc", email: "compliance@sterling.example", initials: "SB", color: "#D2232A", sector: "Banking", type: "Commercial bank", tier: "National", flag: "" },
  { org: "Harbour Trust Microfinance Bank", email: "risk@harbourtrust.example", initials: "HT", color: "#00796B", sector: "Banking", type: "Microfinance bank", tier: "State", flag: "" },
  { org: "Brightwater Finance Ltd", email: "admin@brightwater.example", initials: "BF", color: "#2E6F95", sector: "Digital economy", type: "Fintech platform", tier: "", flag: "expired" },
];

export default function InviteOrganisationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("sheet");

  // Single-invite state
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [sector, setSector] = useState(CATEGORIES[0].name);
  const [type, setType] = useState(CATEGORIES[0].types[0].name);
  const [tier, setTier] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  // Bulk-invite state
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<SheetRow[]>(SEED_ROWS);

  const sectorObj = CATEGORIES.find((c) => c.name === sector) ?? CATEGORIES[0];
  const tiers = tiersOf(type);

  function submitSingle(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!org) e2.org = "Enter the organisation name";
    if (!isEmail(email)) e2.email = "Enter a valid email address";
    if (tiers.length && !tier) e2.tier = "Choose a tier for this institution type";
    setErr(e2);
    if (Object.keys(e2).length) return;
    const initials = org.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 2) || "OR";
    inviteOrganisation({ org, email, initials, color: "#3f51b5", sector, type, tier });
    toast(`Invitation sent to ${org}`, "ok", "envelope-simple");
    router.push("/regulator/organisations");
  }

  function upload() {
    setStep(1);
    setTimeout(() => setStep(2), 1000);
  }

  const needs = rows.filter((r) => (r.flag === "tier" && !r.tier) || (r.flag === "category" && !r.resolved)).length;
  const sendable = rows.filter((r) => !(r.flag === "exists") && !(r.flag === "category"));

  function sendSheet() {
    let n = 0;
    rows.forEach((r) => {
      if (r.flag === "exists" || r.flag === "category") return;
      if (r.flag === "expired") {
        resendOrInvite(r);
        n++;
        return;
      }
      inviteOrganisation(r);
      n++;
    });
    toast(`${n} invitations sent`, "ok", "envelope-simple");
    router.push("/regulator/organisations");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Organisations", href: "/regulator/organisations" }, { label: "Invite" }]}>
      <PageHead title="Invite organisations" sub="Each invitation maps the organisation to a category. They can see it when they join, and only you can change it." />
      <div className="seg" role="tablist">
        <button type="button" className={mode === "sheet" ? "on" : ""} onClick={() => setMode("sheet")} data-test="mode-sheet">
          <Icon name="table" /> Spreadsheet
        </button>
        <button type="button" className={mode === "single" ? "on" : ""} onClick={() => setMode("single")} data-test="mode-single">
          <Icon name="user-plus" /> One organisation
        </button>
      </div>

      {mode === "single" && (
        <form className="grid side" onSubmit={submitSingle} noValidate>
          <div className="card col gap16">
            <Field label="Organisation name" error={err.org} htmlFor="in-org">
              <input className={`inp ${err.org ? "invalid" : ""}`} id="in-org" placeholder="e.g. Northgate Bank Plc" value={org} onChange={(e) => setOrg(e.target.value)} />
            </Field>
            <Field label="Compliance contact email" error={err.email} htmlFor="in-email">
              <input className={`inp ${err.email ? "invalid" : ""}`} id="in-email" type="email" placeholder="compliance@organisation.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className="grid g3" style={{ gap: 12 }}>
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
              <Field label="Tier" error={err.tier} htmlFor="in-tier">
                {tiers.length ? (
                  <select className={`sel ${err.tier ? "invalid" : ""}`} id="in-tier" value={tier} onChange={(e) => setTier(e.target.value)}>
                    <option value="">Choose a tier</option>
                    {tiers.map((t) => <option key={t}>{t}</option>)}
                  </select>
                ) : (
                  <input className="inp" id="in-tier" value="" placeholder="No tiers for this type" readOnly />
                )}
              </Field>
            </div>
            <Field label="Personal message" optional htmlFor="in-msg">
              <textarea className="ta" id="in-msg" placeholder="Optional note added to the email" value={msg} onChange={(e) => setMsg(e.target.value)} />
            </Field>
            <div className="row end">
              <Button type="button" variant="outline" onClick={() => router.push("/regulator/organisations")}>Cancel</Button>
              <Button type="submit" icon="envelope-simple" testId="inv-single-send">Send invitation</Button>
            </div>
          </div>
          <div className="col gap12">
            <div className="overline">Email preview</div>
            <InviteEmailPreview org={org} category="" />
          </div>
        </form>
      )}

      {mode === "sheet" && step === 0 && (
        <div className="grid g2">
          <div className="card col gap16">
            <Tile icon="download-simple" size="lg" />
            <div className="h3">1. Fill in the template</div>
            <p className="muted small">One row per organisation: name, contact email, sector, institution type and tier. Use the names from your category list.</p>
            <div className="tbl-wrap" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
              <table className="tbl">
                <thead><tr><th>organisation</th><th>email</th><th>institution_type</th><th>tier</th></tr></thead>
                <tbody><tr><td>Northgate Bank Plc</td><td className="small">compliance@&hellip;</td><td>Commercial bank</td><td>National</td></tr></tbody>
              </table>
            </div>
            <Button variant="secondary" icon="download-simple" onClick={() => toast("Template downloaded")}>Download template (.xlsx)</Button>
          </div>
          <div className="card col gap16">
            <Tile icon="upload-simple" size="lg" />
            <div className="h3">2. Upload it</div>
            <p className="muted small">We match each row to a category and check for organisations already on SuperAtlas. Nothing is sent until you confirm.</p>
            <button className="drop" style={{ padding: 36 }} onClick={upload} data-test="sheet-upload">
              <Tile icon="cloud-arrow-up" size="lg" />
              <b>Drop your invite list here</b>
              <span className="cap muted">.xlsx or .csv · demo uses invite-list.xlsx</span>
            </button>
          </div>
        </div>
      )}

      {mode === "sheet" && step === 1 && (
        <div className="card col" style={{ alignItems: "center", textAlign: "center", padding: 48 }}>
          <Icon name="circle-notch" className="spin" />
          <div className="h3">Reading invite-list.xlsx</div>
          <p className="muted small">Matching 7 rows to your categories</p>
          <div className="bar" style={{ width: "min(360px, 100%)" }}><i style={{ width: "62%" }} /></div>
        </div>
      )}

      {mode === "sheet" && step === 2 && (
        <>
          <div className="file">
            <Icon name="table" />
            <div className="grow">
              <div className="strong">invite-list.xlsx</div>
              <div className="cap muted">7 rows · uploaded just now</div>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => { setStep(0); setRows(SEED_ROWS); }}>Replace file</Button>
          </div>
          {needs ? (
            <AlertBox tone="warn" title={`${needs} row${needs > 1 ? "s" : ""} need your input`} body="Fix them to send. Organisations already on SuperAtlas are skipped automatically." />
          ) : (
            <AlertBox tone="ok" title="Ready to send" body={`${sendable.length} invitations will go out. ${rows.length - sendable.length} rows are skipped.`} />
          )}
          <div className="grid side">
            <div className="card p0">
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Organisation</th><th>Category</th><th>Check</th></tr></thead>
                  <tbody>
                    {rows.map((r, i) => {
                      let catCell: React.ReactNode = <span className="cls"><Icon name="buildings" /><b>{r.type || "Category to confirm"}</b>{r.tier ? <i>{r.tier}</i> : null}</span>;
                      let check: React.ReactNode;
                      if (r.flag === "exists") check = <Chip tone="neu" icon="check">Already in directory · skipped</Chip>;
                      else if (r.flag === "expired") check = <Chip tone="info" icon="arrow-clockwise">Earlier invite expired · will resend</Chip>;
                      else if (r.flag === "tier") {
                        const rowTiers = tiersOf(r.type);
                        catCell = (
                          <div className="row gap8">
                            <span className="cls"><Icon name="buildings" /><b>{r.type}</b></span>
                            <select
                              className="sel"
                              style={{ height: 34, width: 150 }}
                              value={r.tier}
                              data-test="taj-tier"
                              onChange={(e) => setRows((prev) => prev.map((x, j) => (j === i ? { ...x, tier: e.target.value } : x)))}
                            >
                              <option value="">Choose tier</option>
                              {rowTiers.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        );
                        check = r.tier ? <Chip tone="ok" icon="check">Ready</Chip> : <Chip tone="warn" icon="warning">Tier needed</Chip>;
                      } else if (r.flag === "category") {
                        check = r.resolved ? (
                          <Chip tone="neu">Skipped · kept current category</Chip>
                        ) : (
                          <div className="col gap6" style={{ alignItems: "flex-start" }}>
                            <Chip tone="warn" icon="warning">Already in directory as Mobile money operator</Chip>
                            <span className="cap muted" style={{ maxWidth: "34ch" }}>Your file says {r.type}. Category changes go through a classification request.</span>
                            <Button variant="outline" size="sm" testId="opay-resolve" onClick={() => setRows((prev) => prev.map((x, j) => (j === i ? { ...x, resolved: true } : x)))}>Skip row, keep current</Button>
                          </div>
                        );
                      } else check = <Chip tone="ok" icon="check">Ready</Chip>;
                      return (
                        <tr key={r.org} style={(r.flag === "tier" && !r.tier) || (r.flag === "category" && !r.resolved) ? { background: "var(--warn-bg)" } : undefined}>
                          <td>
                            <div className="org">
                              <span className="logo s40" style={{ background: r.color }}>{r.initials}</span>
                              <div>
                                <div className="nm">{r.org}</div>
                                <div className="sub">{r.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{catCell}</td>
                          <td>{check}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col gap12">
              <div className="overline">Email preview</div>
              <InviteEmailPreview org="Northgate Bank Plc" category={catLabel("Commercial bank", "National")} />
            </div>
          </div>
          <div className="row end">
            <Button variant="outline" onClick={() => router.push("/regulator/organisations")}>Cancel</Button>
            <Button icon="envelope-simple" disabled={needs > 0} onClick={sendSheet} testId="sheet-send">Send {sendable.length} invitations</Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
