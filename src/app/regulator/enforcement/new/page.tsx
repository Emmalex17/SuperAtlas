"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Field, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { TODAY } from "@/lib/cases";
import { dPlus } from "@/lib/returns";
import { ACTION_TYPES, atOf, watchlist, enfEvidence, draftNotice, openEnfCase, type EnfEvidence, type ActionType } from "@/lib/enforcement";
import { ORGANISATIONS, TEAM } from "@/lib/mockData";

function reviewers() {
  return TEAM.filter((t) => ["Reviewer", "Supervisor", "Admin"].includes(t.role) && t.status === "Active");
}

function Choice({ active, onClick, title, desc, testId }: { active: boolean; onClick: () => void; title: ReactNode; desc: string; testId?: string }) {
  return (
    <button type="button" className={`choice ${active ? "on" : ""}`} data-test={testId} onClick={onClick}>
      <span className="radio" />
      <span className="grow"><b className="small">{title}</b><br /><span className="cap muted">{desc}</span></span>
    </button>
  );
}

const ME = "M. Bello";

export default function OpenEnforcementCasePage() {
  const router = useRouter();
  const toast = useToast();
  const [prefillOrg, setPrefillOrg] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
    setPrefillOrg(sp.get("org"));
  }, []);

  const [org, setOrg] = useState("");
  const [type, setType] = useState("");
  const [respondBy, setRespondBy] = useState("");
  const [amount, setAmount] = useState("");
  const [approver, setApprover] = useState("");
  const [evidence, setEvidence] = useState<(EnfEvidence & { checked: boolean })[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (prefillOrg && !org) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- applying the ?org= prefill once it's known, before the person has touched the form.
      setOrg(prefillOrg);
      setEvidence(enfEvidence(prefillOrg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillOrg]);

  const orgs = ORGANISATIONS.filter((o) => o.status === "Verified").sort((a, b) => a.name.localeCompare(b.name));
  const t: ActionType | null = type ? atOf(type) : null;
  const orgObj = ORGANISATIONS.find((o) => o.id === org);
  const defaultApprover = (reviewers().find((r) => r.name !== ME) ?? reviewers()[0])?.name ?? "";

  function chooseOrg(id: string) {
    setOrg(id);
    setEvidence(id ? enfEvidence(id) : []);
    setEdited(false);
    setSubject("");
    setBody("");
  }

  function chooseType(id: string) {
    if (type !== id) setRespondBy("");
    setType(id);
    setEdited(false);
  }

  function rebuild() {
    setEdited(false);
  }

  // Until the person edits the subject/body themselves, the notice is derived fresh from the
  // organisation, action, evidence and respond-by/amount on every render — never written back
  // into state, so this never needs a setState-during-render.
  const effectiveRespondBy = respondBy || (t?.days ? dPlus(TODAY, t.days) : "");
  const draft = t && !edited ? draftNotice(orgObj, t, evidence, effectiveRespondBy, amount, ME) : null;
  const displaySubject = draft ? draft.subject : subject;
  const displayBody = draft ? draft.body : body;

  function toggleEvidence(i: number) {
    setEvidence((ev) => ev.map((e, k) => (k === i ? { ...e, checked: !e.checked } : e)));
  }

  function submit() {
    if (!org) { toast("Choose an organisation", "bad", "warning"); return; }
    if (!type || !t) { toast("Choose an action", "bad", "warning"); return; }
    if (t.penalty && !(+amount > 0)) { toast("Enter the penalty amount", "bad", "warning"); return; }
    if (!displayBody) { toast("Write the notice", "bad", "warning"); return; }
    const appr = approver || defaultApprover;
    const from = watchlist().some((w) => w.org === org) ? "watchlist" : "manual";
    const c = openEnfCase(org, type, t.days ? effectiveRespondBy : "", amount, appr, evidence.filter((e) => e.checked), TODAY, ME, { subject: displaySubject, body: displayBody }, from);
    toast(`${c.ref} sent to ${appr} for sign-off`, "ok", "signature");
    router.push(`/regulator/enforcement/${c.id}`);
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Enforcement", href: "/regulator/enforcement" }, { label: "Open a case" }]}>
      <PageHead title="Open a case" sub="Choose the action, link the evidence, and draft the notice. A second person signs it off before it is issued." />
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">1. Organisation</div>
            <Field label="">
              <select className="sel" value={org} onChange={(e) => chooseOrg(e.target.value)} data-test="en-org">
                <option value="">Choose an organisation</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="card col gap12">
            <div className="h4">2. Action</div>
            <div className="grid g2" style={{ gap: 8 }}>
              {ACTION_TYPES.map((a) => (
                <Choice key={a.id} active={type === a.id} onClick={() => chooseType(a.id)} title={a.name} desc={a.d} testId={`en-type-${a.id}`} />
              ))}
            </div>
            {t ? (
              <div className="grid g2" style={{ gap: 14 }}>
                {t.days ? (
                  <Field label="Respond by" htmlFor="en-by" hint={`Default ${t.days} days`}>
                    <input className="inp" id="en-by" type="date" value={effectiveRespondBy} onChange={(e) => setRespondBy(e.target.value)} data-test="en-by" />
                  </Field>
                ) : null}
                {t.penalty ? (
                  <Field label="Penalty amount (₦)" htmlFor="en-amt">
                    <input className="inp" id="en-amt" type="number" placeholder="e.g. 5000000" value={amount} onChange={(e) => setAmount(e.target.value)} data-test="en-amt" />
                  </Field>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="card col gap12">
            <div className="h4">3. Evidence</div>
            {org ? (
              evidence.length ? (
                <div className="col gap6">
                  {evidence.map((e, i) => (
                    <label className="check" key={i} data-test={`en-ev-${i}`}>
                      <input type="checkbox" checked={e.checked} onChange={() => toggleEvidence(i)} />
                      <span><span className={`chip neu`}>{e.kind === "finding" ? "Finding" : e.kind === "result" ? "Result" : "Return"}</span> {e.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="small muted">No findings, low scores or late returns on record. Explain the reason in the notice.</p>
              )
            ) : (
              <p className="small muted">Choose an organisation first.</p>
            )}
          </div>
          <div className="card col gap12">
            <div className="row"><span className="h4 grow">4. Notice</span>{t ? <Button variant="tertiary" size="sm" icon="arrow-counter-clockwise" onClick={rebuild}>Rebuild from template</Button> : null}</div>
            {t ? (
              <>
                <Field label="Subject" htmlFor="en-subj">
                  <input className="inp" id="en-subj" value={displaySubject} onChange={(e) => { setSubject(e.target.value); setBody(displayBody); setEdited(true); }} />
                </Field>
                <Field label="Letter" htmlFor="en-body" hint="The organisation sees this in its workspace and by email.">
                  <textarea className="ta" id="en-body" rows={12} value={displayBody} onChange={(e) => { setBody(e.target.value); setSubject(displaySubject); setEdited(true); }} data-test="en-body" />
                </Field>
              </>
            ) : (
              <p className="small muted">Choose an action to draft the notice.</p>
            )}
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap12" style={{ position: "sticky", top: 70 }}>
            <div className="h4">Sign-off</div>
            <Field label="Approver" htmlFor="en-appr" hint="They check the case and issue the notice.">
              <select className="sel" id="en-appr" value={approver || defaultApprover} onChange={(e) => setApprover(e.target.value)}>
                {reviewers().map((r) => <option key={r.name} value={r.name}>{r.name} · {r.role}</option>)}
              </select>
            </Field>
            <Button block icon="signature" onClick={submit} testId="en-submit">Send for sign-off</Button>
            <Button variant="tertiary" block onClick={() => router.push("/regulator/enforcement")}>Cancel</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
