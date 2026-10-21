"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Button, Chip, Tile, Field, Tabs, AlertBox } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import {
  ORGANISATIONS,
  CATEGORIES,
  CLASS_REQS,
  STATUS_TONE,
  catLabel,
  tiersOf,
  saveOrgProfile,
  setOrgLogoUploaded,
  addOrgLink,
  requestClassificationChange,
  withdrawClassificationRequest,
} from "@/lib/mockData";

const ORG_ID = "zenith";

type Tab = "details" | "classification" | "licences" | "group" | "settings";

export default function OrgProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const org = ORGANISATIONS.find((o) => o.id === ORG_ID)!;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("details");

  const reqs = CLASS_REQS.filter((r) => r.org === org.id);
  const pending = reqs.find((r) => r.status === "Pending");

  // Details tab
  const [rc, setRc] = useState(org.rc ?? "");
  const [web, setWeb] = useState(org.web ?? "");
  const [hq, setHq] = useState(org.hq ?? "");
  const [email, setEmail] = useState(org.email ?? "");

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    saveOrgProfile(org, { rc, web, hq, email });
    toast("Profile saved");
    bump();
  }

  // Classification tab
  const [sector, setSector] = useState(org.sector);
  const [type, setType] = useState(org.type);
  const [tier, setTier] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState("");
  const sectorObj = CATEGORIES.find((c) => c.name === sector) ?? CATEGORIES[0];
  const tiers = tiersOf(type);

  function submitClassification(e: React.FormEvent) {
    e.preventDefault();
    if (type === org.type && tier === org.tier) {
      toast("Choose a category different from your current one", "bad");
      return;
    }
    if (tiers.length && !tier) {
      toast("Choose a tier", "bad");
      return;
    }
    if (!reason) {
      toast("Explain why you are asking for the change", "bad");
      return;
    }
    if (!file) {
      toast("Attach the licence that supports the change", "bad");
      return;
    }
    requestClassificationChange(org, { sector, type, tier }, reason, file);
    setReason("");
    setFile("");
    bump();
    toast("Request sent to NITDA", "ok", "git-diff");
  }

  // Group links tab
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

  // Settings tab
  const [mfa, setMfa] = useState(true);
  const [digest, setDigest] = useState(true);
  const [evidenceUpload, setEvidenceUpload] = useState(false);

  return (
    <AppShell workspace="organisation">
      <ProfileHeader
        initials={org.initials}
        color={org.color}
        name={org.name}
        statusChip={<Chip tone={STATUS_TONE[org.status] ?? "neu"}>{org.status}</Chip>}
        metaLine={<span className="cls"><Icon name="buildings" /><b>{org.type || "Category to confirm"}</b>{org.tier ? <i>{org.tier}</i> : null}</span>}
        web={org.web}
        location={org.hq && org.hq !== "—" ? org.hq : undefined}
        tabs={
          <Tabs
            items={[
              { id: "details", label: "Details" },
              { id: "classification", label: "Classification", count: pending ? 1 : undefined },
              { id: "licences", label: "Licences" },
              { id: "group", label: "Group links" },
              { id: "settings", label: "Settings" },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      />

      {tab === "details" && (
        <form className="grid side" onSubmit={submitDetails}>
          <div className="card col gap16">
            <div className="h4">Organisation details</div>
            <div className="grid g2" style={{ gap: 14 }}>
              <Field label="Legal name" hint={"Set by NITDA. Ask them to change it."} htmlFor="mo-name">
                <input className="inp" id="mo-name" value={org.name} readOnly />
              </Field>
              <Field label="Registration number" htmlFor="mo-rc">
                <input className="inp" id="mo-rc" value={rc} onChange={(e) => setRc(e.target.value)} />
              </Field>
              <Field label="Website" htmlFor="mo-web">
                <input className="inp" id="mo-web" value={web} onChange={(e) => setWeb(e.target.value)} />
              </Field>
              <Field label="Head office" htmlFor="mo-hq">
                <input className="inp" id="mo-hq" value={hq} onChange={(e) => setHq(e.target.value)} />
              </Field>
              <Field label="Compliance contact email" htmlFor="mo-em">
                <input className="inp" id="mo-em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </div>
            <div className="row end">
              <Button type="submit">Save changes</Button>
            </div>
          </div>
          <div className="col gap16">
            <div className="card col gap12">
              <div className="h4">Logo</div>
              <div className="grid g2" style={{ gap: 10 }}>
                {["On light", "On dark"].map((l, i) => (
                  <div key={l} className="col" style={{ alignItems: "center", gap: 6, padding: 14, borderRadius: 12, background: i ? "var(--brand-800)" : "var(--canvas)" }}>
                    <span className="logo s40" style={{ background: org.color }}>{org.initials}</span>
                    <span className="cap" style={{ color: i ? "var(--brand-200)" : "var(--text-2)" }}>{l}</span>
                  </div>
                ))}
              </div>
              <Button variant="tertiary" icon="upload-simple" onClick={() => { setOrgLogoUploaded(org); bump(); toast("Logo uploaded", "ok", "image"); }}>
                {org.logoUp ? "Replace logo" : "Upload logo"}
              </Button>
            </div>
            <div className="card col gap12">
              <div className="row">
                <span className="h4 grow">Key officers</span>
                <Button variant="tertiary" size="sm" onClick={() => router.push("/organisation/welcome?step=officers")}>Manage</Button>
              </div>
              {(org.officers ?? []).map((p) => (
                <div key={p.email} className="row">
                  <span className="av">{p.initials}</span>
                  <div>
                    <div className="strong small">{p.name}</div>
                    <div className="cap muted">{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {tab === "classification" && (
        <div className="grid side">
          <div className="col gap16">
            {pending ? (
              <div className="card col gap16">
                <div className="row">
                  <Tile icon="hourglass" tone="info" />
                  <div className="grow">
                    <div className="h4">{pending.ref} · with NITDA</div>
                    <div className="cap muted">Submitted {pending.date} by {pending.by}</div>
                  </div>
                  <Chip tone="info">In review</Chip>
                </div>
                <div className="grid g2" style={{ gap: 12 }}>
                  <div className="card flat tight col gap6">
                    <span className="overline">From</span>
                    <span className="cls"><Icon name="buildings" /><b>{pending.from.type}</b><i>{pending.from.tier}</i></span>
                  </div>
                  <div className="card flat tight col gap6" style={{ borderColor: "var(--brand-400)" }}>
                    <span className="overline" style={{ color: "var(--brand-500)" }}>To</span>
                    <span className="cls"><Icon name="buildings" /><b>{pending.to.type}</b><i>{pending.to.tier}</i></span>
                  </div>
                </div>
                <p className="small muted">{pending.reason}</p>
                <div className="file">
                  <Tile icon="file-text" size="sm" />
                  <div className="grow">
                    <div className="strong" style={{ overflowWrap: "anywhere" }}>{pending.file}</div>
                    <div className="cap muted">Attached licence</div>
                  </div>
                </div>
                <div>
                  <Button variant="danger-soft" size="sm" onClick={() => { withdrawClassificationRequest(pending.id); bump(); toast("Request withdrawn"); }}>Withdraw request</Button>
                </div>
              </div>
            ) : (
              <form className="card col gap16" onSubmit={submitClassification}>
                <div>
                  <div className="h4">Request a classification change</div>
                  <p className="small muted" style={{ marginTop: 2 }}>Your category decides which requirements and returns apply to you. NITDA must approve any change.</p>
                </div>
                <div className="grid g3" style={{ gap: 12 }}>
                  <Field label="Sector" htmlFor="cc-sector">
                    <select className="sel" id="cc-sector" value={sector} onChange={(e) => { setSector(e.target.value); const s = CATEGORIES.find((c) => c.name === e.target.value); setType(s?.types[0].name ?? ""); setTier(""); }}>
                      {CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Institution type" htmlFor="cc-type">
                    <select className="sel" id="cc-type" value={type} onChange={(e) => { setType(e.target.value); setTier(""); }}>
                      {sectorObj.types.map((t) => <option key={t.id}>{t.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Tier" htmlFor="cc-tier">
                    {tiers.length ? (
                      <select className="sel" id="cc-tier" value={tier} onChange={(e) => setTier(e.target.value)}>
                        <option value="">Choose a tier</option>
                        {tiers.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    ) : (
                      <input className="inp" value="" placeholder="No tiers for this type" readOnly />
                    )}
                  </Field>
                </div>
                <Field label="Why are you asking for this change?" htmlFor="cc-reason">
                  <textarea className="ta" id="cc-reason" placeholder="e.g. Our licence was upgraded to international authorisation in September." value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                {file ? (
                  <div className="file">
                    <Tile icon="file-text" tone="ok" size="sm" />
                    <div className="grow">
                      <div className="strong">{file}</div>
                      <div className="cap muted">640 KB · uploaded just now</div>
                    </div>
                    <Button variant="tertiary" size="sm" type="button" onClick={() => setFile("")}>Remove</Button>
                  </div>
                ) : (
                  <button type="button" className="drop" onClick={() => setFile("New licence.pdf")} data-test="cc-file">
                    <Tile icon="upload-simple" size="sm" />
                    <b>Attach the new licence</b>
                    <span className="cap muted">Required · PDF up to 10 MB</span>
                  </button>
                )}
                <AlertBox tone="info" title="" body="If approved, new requirements apply from the next cycle. Work you have already submitted is not affected." />
                <div className="row end">
                  <Button type="submit" testId="cc-submit">Submit request</Button>
                </div>
              </form>
            )}
          </div>
          <div className="col gap16">
            <div className="card col gap12">
              <div className="row">
                <span className="h4 grow">Current category</span>
                <span className="row gap6 cap muted"><Icon name="lock-simple" />Set by NITDA</span>
              </div>
              <Field label="Sector"><p className="strong" style={{ margin: 0 }}>{org.sector}</p></Field>
              <Field label="Institution type"><p className="strong" style={{ margin: 0 }}>{org.type}</p></Field>
              <Field label="Authorisation"><p className="strong" style={{ margin: 0 }}>{org.tier || "—"}</p></Field>
            </div>
            <div className="card col gap8">
              <div className="h4">History</div>
              {reqs.filter((r) => r.status !== "Pending").length ? (
                reqs.filter((r) => r.status !== "Pending").map((r) => (
                  <div key={r.id} className="small">
                    <b>{r.ref} · {r.status}</b>
                    <div className="cap muted">{catLabel(r.to.type, r.to.tier)} · {r.decided ?? ""}</div>
                  </div>
                ))
              ) : (
                <p className="small muted">No earlier requests.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "licences" && (
        <div className="card col gap12">
          <div className="file">
            <Tile icon="certificate" tone="ok" size="sm" />
            <div className="grow">
              <div className="strong">{org.type || "Operating"} licence — {org.tier || "current"}.pdf</div>
              <div className="cap muted">Issued Jan 2024 · expires Dec 2028 · verified by NITDA</div>
            </div>
          </div>
          <div className="file">
            <Tile icon="file-text" size="sm" />
            <div className="grow">
              <div className="strong">Certificate of incorporation.pdf</div>
              <div className="cap muted">Uploaded at registration</div>
            </div>
          </div>
          <div>
            <Button variant="secondary" icon="upload-simple" onClick={() => toast("Licence uploaded. NITDA will check it.")}>Upload a licence</Button>
          </div>
        </div>
      )}

      {tab === "group" && (
        <div className="card col gap12">
          <AlertBox tone="info" title="Each entity answers on its own" body="Linking a holding company or subsidiary is for reference. Every entity keeps its own requirements, answers, scores and findings." />
          {(org.links ?? []).length ? (
            (org.links ?? []).map((l) => (
              <div key={l.name} className="file">
                <Tile icon="buildings" size="sm" />
                <div className="grow">
                  <div className="strong">{l.name}</div>
                  <div className="cap muted">{l.rel}</div>
                </div>
                <Chip tone="ok">Linked</Chip>
              </div>
            ))
          ) : (
            <p className="small muted">No group links.</p>
          )}
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
        </div>
      )}

      {tab === "settings" && (
        <div className="card col gap16" style={{ maxWidth: 640 }}>
          {([
            ["Require MFA for all colleagues", mfa, setMfa],
            ["Email digest of due items to compliance officers", digest, setDigest],
            ["Allow contributors to upload to the evidence library", evidenceUpload, setEvidenceUpload],
          ] as [string, boolean, (v: boolean) => void][]).map(([label, on, set]) => (
            <div key={label} className="row between">
              <span>{label}</span>
              <label className="switch">
                <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
                <span />
              </label>
            </div>
          ))}
          <div className="row end">
            <Button onClick={() => toast("Settings saved")}>Save settings</Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
