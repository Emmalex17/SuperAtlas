"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tile, Button, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { myEngs, engGroup, progOf, acceptEngagement, declineEngagement, publishCase as firmPublishCase, TODAY, type Case } from "@/lib/cases";
import { ORGANISATIONS, catLabel } from "@/lib/mockData";

const FIRM_ID = "deloitte";
const FIRM_NAME = "Deloitte & Touche (Nigeria)";
const LEADS = ["T. Adebayo", "I. Okafor", "R. Salami"];

const STAGE_TONE: Record<string, "ok" | "warn" | "neu" | "info"> = { Published: "ok", Approved: "ok", "Signed off": "ok", Answering: "info", Assessing: "info", Submitted: "info", "Report submitted": "info" };

export default function EngagementsPage() {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [group, setGroup] = useState<"All" | "Requests" | "Active" | "Submitted" | "Completed">("All");
  const [acceptFor, setAcceptFor] = useState<Case | null>(null);
  const [lead, setLead] = useState(LEADS[0]);
  const [team, setTeam] = useState<string[]>([LEADS[1]]);
  const [declineFor, setDeclineFor] = useState<Case | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const es = myEngs(FIRM_ID);
  const rows = es.filter((c) => (group === "All" ? true : engGroup(c) === group));

  function doAccept() {
    if (!acceptFor) return;
    acceptEngagement(acceptFor, lead, team, TODAY, FIRM_NAME);
    setAcceptFor(null);
    bump();
    toast("Engagement accepted. Team named.", "ok", "handshake");
  }

  function doDecline() {
    if (!declineFor || !declineReason) {
      toast("Give a reason", "bad");
      return;
    }
    declineEngagement(declineFor, declineReason, FIRM_NAME);
    setDeclineFor(null);
    setDeclineReason("");
    bump();
    toast("Engagement declined");
  }

  function publish(c: Case) {
    firmPublishCase(c, TODAY);
    bump();
    toast("Published", "ok", "paper-plane-tilt");
  }

  return (
    <AppShell workspace="firm">
      <PageHead over="Deloitte & Touche (Nigeria)" title="Engagements" sub="Organisations you assess, from request to published report." />
      <div className="card p0">
        <div className="tbl-sub">
          <div className="pills">
            {(["All", "Requests", "Active", "Submitted", "Completed"] as const).map((g) => (
              <button key={g} className={`pill ${group === g ? "on" : ""}`} onClick={() => setGroup(g)} data-test={`eg-${g}`}>{g}<span className="count">{g === "All" ? es.length : es.filter((c) => engGroup(c) === g).length}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Organisation</th><th>Programme</th><th>Team</th><th>Stage</th><th>Due</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((c) => {
                  const o = ORGANISATIONS.find((x) => x.id === c.org);
                  const p = progOf(c.prog);
                  const isRequest = ["Assigned", "Requested by you"].includes(c.firmStatus);
                  return (
                    <tr key={c.id}>
                      <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                      <td className="small"><div>{p.name}</div><div className="cap muted">{c.firmStatus === "Requested by you" ? "Requested by the organisation" : c.firmStatus === "Assigned" ? "Assigned by NITDA" : c.firmStatus}</div></td>
                      <td className="small">{c.lead ? <>{c.lead}{c.team.length ? <div className="cap muted">+ {c.team.join(", ")}</div> : null}</> : <span className="muted">Lead not named yet</span>}</td>
                      <td><Chip tone={isRequest ? "warn" : STAGE_TONE[c.stage] ?? "neu"}>{isRequest ? "Requested" : c.stage}</Chip></td>
                      <td className="small muted">{c.due}</td>
                      <td className="act-col">
                        {isRequest ? (
                          <div className="row end gap4">
                            <Button variant="tertiary" size="sm" onClick={() => setDeclineFor(c)}>Decline</Button>
                            <Button variant="secondary" size="sm" onClick={() => { setAcceptFor(c); setLead(LEADS[0]); setTeam([LEADS[1]]); }} testId={`eng-accept-${c.org}`}>Accept</Button>
                          </div>
                        ) : ["Submitted", "Assessing", "In preview", "Signed off", "Returned"].includes(c.stage) ? (
                          <Button variant={c.stage === "Submitted" ? "primary" : "secondary"} size="sm" onClick={() => router.push(`/firm/assess/${c.id}`)} testId={`assess-${c.org}`}>{c.stage === "Submitted" ? "Start assessment" : "Open"}</Button>
                        ) : c.stage === "Approved" && p.publisher === "firm" ? (
                          <Button size="sm" icon="paper-plane-tilt" onClick={() => publish(c)} testId={`fpub-${c.org}`}>Publish</Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="kanban" size="lg" /><div className="h4">No engagements here</div><p className="muted small">Requests appear when NITDA assigns you, or an organisation engages you.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={acceptFor !== null} onClose={() => setAcceptFor(null)}>
        <div className="row"><h2 className="h3">Accept engagement</h2></div>
        <p className="muted small">{acceptFor ? `${ORGANISATIONS.find((o) => o.id === acceptFor.org)?.name} · ${progOf(acceptFor.prog).name}` : ""}</p>
        <div className="col gap12">
          <Field label="Lead auditor" htmlFor="ea-lead">
            <select className="sel" id="ea-lead" value={lead} onChange={(e) => setLead(e.target.value)}>
              {LEADS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <div className="field">
            <label>Team</label>
            <div className="col gap6">
              {LEADS.filter((n) => n !== lead).map((n) => (
                <label className="check" key={n}>
                  <input type="checkbox" checked={team.includes(n)} onChange={(e) => setTeam((t) => (e.target.checked ? [...t, n] : t.filter((x) => x !== n)))} />
                  <span className="small">{n}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="row end">
          <Button variant="outline" onClick={() => setAcceptFor(null)}>Cancel</Button>
          <Button onClick={doAccept} testId="ea-go">Accept and name team</Button>
        </div>
      </Dialog>

      <Dialog open={declineFor !== null} onClose={() => setDeclineFor(null)}>
        <div className="row"><h2 className="h3">Decline this engagement?</h2></div>
        <p className="muted small">Tell them why, for example a conflict of interest or capacity.</p>
        <Field label="Reason" htmlFor="ed-r"><textarea className="ta" id="ed-r" rows={3} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} /></Field>
        <div className="row end">
          <Button variant="outline" onClick={() => setDeclineFor(null)}>Cancel</Button>
          <Button variant="danger" onClick={doDecline}>Decline</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
