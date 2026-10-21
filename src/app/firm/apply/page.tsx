"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile, Kv } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { FIRMS, FIRM_TYPES, FIRM_ACCREDITATIONS, ACC_APPS, FIRM_RULES, STATUS_TONE, submitAccreditationApplication } from "@/lib/mockData";

const FIRM_ID = "deloitte";
const STEPS = ["Firm type", "Documents", "Assessors", "Declarations"];
const DOCS_NEEDED = ["DPCO licence from the data protection authority", "Professional indemnity insurance", "Methodology document", "Assessor CVs and certificates"];

export default function FirmApplyPage() {
  const router = useRouter();
  const toast = useToast();
  const firm = FIRMS.find((f) => f.id === FIRM_ID)!;
  const accs = FIRM_ACCREDITATIONS[firm.id] ?? [];
  const activeApp = ACC_APPS.find((a) => a.firm === firm.id && a.status !== "Accredited" && a.status !== "Declined");
  const held = accs.map((a) => a.type);

  const [step, setStep] = useState(0);
  const [type, setType] = useState(FIRM_TYPES.find((t) => !held.includes(t.name))?.name ?? FIRM_TYPES[0].name);
  const [docs, setDocs] = useState<Record<number, boolean>>({});
  const [assessors, setAssessors] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((firm.people ?? []).filter((p) => p.status === "Active").map((p) => [p.name, true]))
  );
  const [d1, setD1] = useState(false);
  const [d2, setD2] = useState(false);
  const [d3, setD3] = useState(false);
  const [err, setErr] = useState("");
  const [submittedApp, setSubmittedApp] = useState<string | null>(null);

  const curCard = (
    <div className="card col gap12">
      <div className="h4">Current accreditations</div>
      {accs.map((a) => (
        <div key={a.ref} className="row">
          <Tile icon="certificate" tone="ok" size="sm" />
          <div className="grow">
            <div className="strong small">{a.type}</div>
            <div className="cap muted">{a.ref} · until {a.to}</div>
          </div>
          <Chip tone={STATUS_TONE[a.status] ?? "neu"}>{a.status}</Chip>
        </div>
      ))}
    </div>
  );

  if (activeApp && !submittedApp) {
    return (
      <AppShell workspace="firm" crumbs={[{ label: "Profile", href: "/firm/profile" }, { label: "Apply for accreditation" }]}>
        <PageHead title="Application in review" sub="NITDA is reviewing your application. You will be notified of the decision." />
        <div className="grid side">
          <div className="card col gap16">
            <div className="row">
              <Tile icon="hourglass" tone="info" />
              <div className="grow">
                <div className="h4">{activeApp.type}</div>
                <div className="cap muted">Submitted {activeApp.submitted} · decision due {activeApp.due}</div>
              </div>
              <Chip tone={STATUS_TONE[activeApp.status] ?? "neu"}>{activeApp.status}</Chip>
            </div>
            {activeApp.docs.map(([d, ok]) => (
              <div key={d} className="row small">
                <Icon name={ok ? "check-circle" : "warning"} />
                <span>{d}</span>
              </div>
            ))}
          </div>
          {curCard}
        </div>
      </AppShell>
    );
  }

  if (step === 4) {
    return (
      <AppShell workspace="firm" crumbs={[{ label: "Profile", href: "/firm/profile" }, { label: "Apply for accreditation" }]}>
        <PageHead title="Application submitted" />
        <div className="card col gap16" style={{ alignItems: "flex-start" }}>
          <Tile icon="check-circle" tone="ok" size="lg" />
          <div className="h3">{type} application sent to National Information Technology Development Agency</div>
          <p className="muted">Reference <span className="mono">ACC-APP-2026-0311</span>. Decision due within 4 weeks.</p>
          <div className="row">
            <Button variant="secondary" testId="acc-done" onClick={() => router.push("/firm/profile?tab=accreditations")}>Back to profile</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  function next() {
    setErr("");
    if (step === 1 && Object.keys(docs).length < 4) {
      setErr("Upload all four documents to continue");
      return;
    }
    if (step === 2 && !Object.values(assessors).some(Boolean)) {
      setErr("Choose at least one assessor");
      return;
    }
    if (step === 3) {
      if (!(d1 && d2 && d3)) {
        setErr("Confirm all three declarations to submit");
        return;
      }
      const app = submitAccreditationApplication(firm, type, Object.keys(assessors).filter((k) => assessors[k]));
      toast(`${type} application sent to NITDA`, "ok", "certificate");
      setSubmittedApp(app.id);
    }
    setStep((s) => s + 1);
  }

  return (
    <AppShell workspace="firm" crumbs={[{ label: "Profile", href: "/firm/profile" }, { label: "Apply for accreditation" }]}>
      <PageHead title="Apply for accreditation" sub={`Choose a firm type, upload evidence and nominate assessors. The regulator reviews and accredits for ${FIRM_RULES.renewal} months.`} />
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

      <div className="grid side">
        <div className="card col gap16">
          {step === 0 && (
            <div className="col gap16">
              <div className="grid g2" style={{ gap: 12 }}>
                {FIRM_TYPES.map((t) => {
                  const has = held.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`choice ${type === t.name ? "on" : ""}`}
                      disabled={has}
                      style={has ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                      onClick={() => setType(t.name)}
                    >
                      <Tile icon={t.icon} size="sm" />
                      <span className="grow">
                        <b>{t.name}</b>
                        <br />
                        <span className="cap muted">{has ? "Already accredited" : t.criteria[0]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="note"><Icon name="info" />Advisory & remediation firms cannot assess an organisation they advised in the last {FIRM_RULES.conflictMonths} months.</div>
            </div>
          )}

          {step === 1 && (
            <div className="col gap12">
              {DOCS_NEEDED.map((d, i) =>
                docs[i] ? (
                  <div key={d} className="file">
                    <Tile icon="file-text" tone="ok" size="sm" />
                    <div className="grow">
                      <div className="strong">{d}.pdf</div>
                      <div className="cap muted">Uploaded just now</div>
                    </div>
                    <Button variant="tertiary" size="sm" onClick={() => setDocs((prev) => { const n = { ...prev }; delete n[i]; return n; })}>Remove</Button>
                  </div>
                ) : (
                  <div key={d} className="file">
                    <Tile icon="file-text" size="sm" />
                    <div className="grow">
                      <div className="strong">{d}</div>
                      <div className="cap muted">Required</div>
                    </div>
                    <Button variant="secondary" size="sm" icon="upload-simple" testId={`acc-doc-${i}`} onClick={() => setDocs((prev) => ({ ...prev, [i]: true }))}>Upload</Button>
                  </div>
                )
              )}
              {err ? <div className="field"><div className="err"><Icon name="warning-circle" />{err}</div></div> : null}
            </div>
          )}

          {step === 2 && (
            <div className="col gap8">
              <p className="muted small">Choose who will carry out assessments of this type. Their credentials are checked by the regulator.</p>
              {(firm.people ?? []).map((a) => (
                <label key={a.name} className={`choice ${assessors[a.name] ? "on" : ""}`} style={{ cursor: "pointer" }}>
                  <input type="checkbox" className="sr" checked={!!assessors[a.name]} onChange={() => setAssessors((prev) => ({ ...prev, [a.name]: !prev[a.name] }))} />
                  <span className="radio" style={{ borderRadius: 6 }} />
                  <span className="grow">
                    <b>{a.name}</b> <span className="muted small">· {a.role}</span>
                    <br />
                    <span className="cap muted">{a.cred}</span>
                  </span>
                </label>
              ))}
              {err ? <div className="field"><div className="err"><Icon name="warning-circle" />{err}</div></div> : null}
            </div>
          )}

          {step === 3 && (
            <div className="col gap12">
              <label className="check">
                <input type="checkbox" checked={d1} onChange={(e) => setD1(e.target.checked)} />
                <span>Our firm is independent of the organisations we will assess, as defined in the regulator&apos;s rules.</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={d2} onChange={(e) => setD2(e.target.checked)} />
                <span>We have declared every organisation we advised in the last {FIRM_RULES.conflictMonths} months ({(firm.clients ?? []).length} declared).</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={d3} onChange={(e) => setD3(e.target.checked)} />
                <span>We will tell the regulator within 5 working days of any change to our licence or insurance.</span>
              </label>
              {err ? <div className="field"><div className="err"><Icon name="warning-circle" />{err}</div></div> : null}
              <div className="card flat tight">
                <Kv pairs={[["Type", type], ["Documents", `${Object.keys(docs).length} of 4`], ["Assessors", Object.keys(assessors).filter((k) => assessors[k]).join(", ")]]} />
              </div>
            </div>
          )}

          <div className="row between">
            {step ? <Button variant="outline" icon="arrow-left" onClick={() => { setErr(""); setStep((s) => s - 1); }}>Back</Button> : <span />}
            <Button iconRight={step === 3 ? "check" : "arrow-right"} testId="acc-next" onClick={next}>{step === 3 ? "Submit application" : "Continue"}</Button>
          </div>
        </div>
        {curCard}
      </div>
    </AppShell>
  );
}
