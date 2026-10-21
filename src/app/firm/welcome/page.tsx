"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Field } from "@/components/ui";
import { Icon, type IconName } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import {
  FIRMS,
  ensureFirmOnboard,
  saveFirmProfile,
  setFirmLogoUploaded,
  addFirmPerson,
  removeFirmPerson,
  declareFirmClient,
  removeFirmClient,
  completeFirmOnboardStep,
  type FirmOnboard,
} from "@/lib/mockData";

const FIRM_ID = "deloitte";

const FIRM_STEPS: [keyof FirmOnboard, string, IconName][] = [
  ["profile", "Firm profile", "identification-card"],
  ["logo", "Logo", "image"],
  ["people", "Lead auditor and assessors", "users"],
  ["clients", "Advisory clients", "handshake"],
];

export default function FirmWelcomePage() {
  const router = useRouter();
  const toast = useToast();
  const firm = FIRMS.find((f) => f.id === FIRM_ID)!;
  const onboard = ensureFirmOnboard(firm);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const firstIncomplete = FIRM_STEPS.find(([k]) => !onboard[k])?.[0] ?? "profile";
  const [step, setStep] = useState<keyof FirmOnboard>(firstIncomplete);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("step");
    if (requested && FIRM_STEPS.some(([k]) => k === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
      setStep(requested as keyof FirmOnboard);
    }
  }, []);

  const done = FIRM_STEPS.filter(([k]) => onboard[k]).length;

  function advance(k: keyof FirmOnboard) {
    completeFirmOnboardStep(firm, k);
    const next = FIRM_STEPS.find(([sk]) => !onboard[sk]);
    if (next) {
      setStep(next[0]);
      bump();
    } else {
      toast("Firm setup complete");
      router.push("/firm");
    }
  }

  // Profile step
  const [web, setWeb] = useState(firm.web ?? "");
  const [city, setCity] = useState(firm.city ?? "");
  const [email, setEmail] = useState(firm.email ?? "");

  function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    saveFirmProfile(firm, { web, city, email });
    toast("Profile saved");
    advance("profile");
  }

  // People step
  const [asName, setAsName] = useState("");
  const [asRole, setAsRole] = useState<"Assessor" | "Lead auditor">("Assessor");
  const [asCred, setAsCred] = useState("");
  const [asExp, setAsExp] = useState("");

  function submitAssessor(e: React.FormEvent) {
    e.preventDefault();
    if (!asName || !asCred) {
      toast("Add a name and credentials", "bad");
      return;
    }
    addFirmPerson(firm, { name: asName, role: asRole, cred: asCred, expires: asExp });
    setAsName("");
    setAsCred("");
    setAsExp("");
    bump();
    toast("Person added");
  }

  // Clients step
  const [clOrg, setClOrg] = useState("");
  const [clService, setClService] = useState("");
  const [clSince, setClSince] = useState("");

  function submitClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clOrg) {
      toast("Enter the organisation", "bad");
      return;
    }
    declareFirmClient(firm, { org: clOrg, service: clService, since: clSince });
    setClOrg("");
    setClService("");
    setClSince("");
    bump();
    toast("Client declared");
  }

  const stepDef = FIRM_STEPS.find(([k]) => k === step)!;
  const accredited = firm.status === "Accredited" || firm.status === "Renewal due";

  return (
    <AppShell workspace="firm">
      <div className="ph">
        <span className="logo s48" style={{ background: firm.color }}>{firm.initials}</span>
        <div className="grow">
          <div className="overline">Getting started</div>
          <h1 className="h1" style={{ marginTop: 2 }}>Set up {firm.name}</h1>
          <p className="muted small" style={{ marginTop: 2 }}>
            {accredited ? `Accredited by NITDA for ${firm.types.join(" and ")}` : `Accreditation ${firm.status.toLowerCase()}`}
          </p>
        </div>
        <div className="page-progress">
          <div className="grow"><div className="bar"><i style={{ width: `${(done / FIRM_STEPS.length) * 100}%` }} /></div></div>
          <span className="cap strong tnum">{done} of {FIRM_STEPS.length}</span>
        </div>
      </div>

      <div className="grid side-l">
        <div className="card tight vsteps">
          {FIRM_STEPS.map(([k, l], n) => (
            <button key={k} className={`vstep ${step === k ? "on" : ""} ${onboard[k] ? "done" : ""}`} onClick={() => setStep(k)}>
              <span className="n">{onboard[k] ? <Icon name="check" /> : n + 1}</span>
              {l}
            </button>
          ))}
          <hr className="sep" style={{ margin: "8px 0" }} />
          <Button variant="tertiary" icon="certificate" onClick={() => router.push("/firm/apply")}>Apply for accreditation</Button>
        </div>

        <div className="card col gap16">
          <div className="row">
            <span className="tile"><Icon name={stepDef[2]} /></span>
            <div className="h3">{stepDef[1]}</div>
          </div>

          {step === "profile" && (
            <form className="col gap16" onSubmit={submitProfile}>
              <div className="grid g2" style={{ gap: 16 }}>
                <Field label="Firm name" htmlFor="fb-name">
                  <input className="inp" id="fb-name" value={firm.name} readOnly />
                </Field>
                <Field label="Website" htmlFor="fb-web">
                  <input className="inp" id="fb-web" value={web} onChange={(e) => setWeb(e.target.value)} />
                </Field>
                <Field label="Offices" htmlFor="fb-city">
                  <input className="inp" id="fb-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
                <Field label="Contact email" htmlFor="fb-em">
                  <input className="inp" id="fb-em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              </div>
              <div className="row end">
                <Button type="submit" icon="arrow-right" testId="wiz-next">Save and continue</Button>
              </div>
            </form>
          )}

          {step === "logo" && (
            <div className="col gap16">
              <div className="row">
                <span className="logo s64" style={{ background: firm.color }}>{firm.initials}</span>
                <p className="small muted">Shown to the regulator and to organisations you assess.</p>
              </div>
              {firm.logoUp ? (
                <div className="file">
                  <Icon name="image" />
                  <div className="grow">
                    <div className="strong">{firm.id}-logo.svg</div>
                    <div className="cap muted">Uploaded just now</div>
                  </div>
                </div>
              ) : (
                <button type="button" className="drop" onClick={() => { setFirmLogoUploaded(firm); bump(); }}>
                  <Icon name="upload-simple" />
                  <b>Upload your logo</b>
                  <span className="cap muted">Use the official file. Initials show until then.</span>
                </button>
              )}
              <div className="row end">
                <Button variant="tertiary" onClick={() => advance("logo")}>Skip for now</Button>
                <Button icon="arrow-right" disabled={!firm.logoUp} onClick={() => advance("logo")}>Continue</Button>
              </div>
            </div>
          )}

          {step === "people" && (
            <div className="col gap16">
              <div className="tbl-wrap" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
                <table className="tbl">
                  <thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Expires</th><th /></tr></thead>
                  <tbody>
                    {(firm.people ?? []).map((a, i) => (
                      <tr key={a.name}>
                        <td>
                          <div className="strong">{a.name}</div>
                          <div className="cap muted">{a.title}</div>
                        </td>
                        <td><span className={`chip ${a.role === "Lead auditor" ? "brand" : "neu"}`}>{a.role}</span></td>
                        <td className="small">{a.cred}</td>
                        <td className="small">{a.expires}</td>
                        <td>
                          <button className="icon-btn" aria-label="Remove" onClick={() => { removeFirmPerson(firm, i); bump(); }}>
                            <Icon name="trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form className="card flat tight col gap12" onSubmit={submitAssessor}>
                <b className="small">Add a person</b>
                <div className="grid g4" style={{ gap: 12 }}>
                  <input className="inp" placeholder="Full name" value={asName} onChange={(e) => setAsName(e.target.value)} />
                  <select className="sel" value={asRole} onChange={(e) => setAsRole(e.target.value as "Assessor" | "Lead auditor")}>
                    <option>Assessor</option>
                    <option>Lead auditor</option>
                  </select>
                  <input className="inp" placeholder="Credentials, e.g. CISA, CIPP/E" value={asCred} onChange={(e) => setAsCred(e.target.value)} />
                  <input className="inp" placeholder="Credential expiry, e.g. Mar 2028" value={asExp} onChange={(e) => setAsExp(e.target.value)} />
                </div>
                <div className="row end">
                  <Button type="submit" variant="secondary" icon="plus" testId="as-add">Add assessor</Button>
                </div>
              </form>
              <div className="row end">
                <Button icon="arrow-right" testId="fb-as-next" onClick={() => advance("people")}>Continue</Button>
              </div>
            </div>
          )}

          {step === "clients" && (
            <div className="col gap16">
              <div className="note"><Icon name="info" />You cannot be assigned to assess an organisation you advised in the last 24 months. Declaring clients here lets the system block conflicts automatically.</div>
              {(firm.clients ?? []).map((c, i) => (
                <div key={c.org} className="file">
                  <span className="logo s32" style={{ background: c.color }}>{c.initials}</span>
                  <div className="grow">
                    <div className="strong">{c.org}</div>
                    <div className="cap muted">{c.service} · since {c.since}</div>
                  </div>
                  <button className="icon-btn" aria-label="Remove" onClick={() => { removeFirmClient(firm, i); bump(); }}>
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
              <form className="card flat tight col gap12" onSubmit={submitClient}>
                <b className="small">Declare a client</b>
                <div className="grid g3" style={{ gap: 12 }}>
                  <input className="inp" placeholder="Organisation" value={clOrg} onChange={(e) => setClOrg(e.target.value)} />
                  <input className="inp" placeholder="Service provided" value={clService} onChange={(e) => setClService(e.target.value)} />
                  <input className="inp" placeholder="Since, e.g. Feb 2026" value={clSince} onChange={(e) => setClSince(e.target.value)} />
                </div>
                <div className="row end">
                  <Button type="submit" variant="secondary" icon="plus">Declare client</Button>
                </div>
              </form>
              <div className="row end">
                <Button testId="fb-finish" onClick={() => advance("clients")}>Finish setup</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
