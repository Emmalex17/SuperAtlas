"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tile, Button, Field, AlertBox } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { myCases, progOf, regOfProg, qsetQs, caseProgress, obligationAction, engageFirm, requestNonAccreditedFirm, accredited, conflictOf, TODAY } from "@/lib/cases";
import { FIRMS } from "@/lib/mockData";
import { isEmail } from "@/lib/authHelpers";

const ORG_ID = "zenith";

export default function ObligationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [filter, setFilter] = useState<"Active" | "Completed" | "All">("Active");
  const [chooseFor, setChooseFor] = useState<string | null>(null);
  const [pickFirm, setPickFirm] = useState("");
  const [engMode, setEngMode] = useState<"list" | "other">("list");
  const [otherName, setOtherName] = useState("");
  const [otherEmail, setOtherEmail] = useState("");
  const [otherCreds, setOtherCreds] = useState("");
  const [otherWhy, setOtherWhy] = useState("");
  const [otherFile, setOtherFile] = useState(false);

  const cs = myCases(ORG_ID);
  const isActive = (c: (typeof cs)[number]) => c.stage !== "Published" && progOf(c.prog).status !== "Closed";
  const rows = cs.filter((c) => (filter === "All" ? true : filter === "Active" ? isActive(c) : !isActive(c)));
  const accreditedFirms = accredited();
  const chooseCase = cs.find((x) => x.id === chooseFor);

  function closeChoose() {
    setChooseFor(null);
    setPickFirm("");
    setEngMode("list");
    setOtherName("");
    setOtherEmail("");
    setOtherCreds("");
    setOtherWhy("");
    setOtherFile(false);
  }

  function doEngage() {
    if (!chooseFor || !pickFirm) {
      toast("Choose a firm", "bad");
      return;
    }
    const c = cs.find((x) => x.id === chooseFor)!;
    engageFirm(c, pickFirm, TODAY, "A. Okonkwo");
    const firmName = FIRMS.find((f) => f.id === pickFirm)?.name;
    closeChoose();
    bump();
    toast(`Request sent to ${firmName}`, "ok", "handshake");
  }

  function doEngageOther() {
    if (!otherName || !isEmail(otherEmail) || !otherWhy) {
      toast("Add the firm name, a valid email and your reason", "bad");
      return;
    }
    const c = cs.find((x) => x.id === chooseFor)!;
    requestNonAccreditedFirm(c, {
      name: otherName,
      contact: otherEmail,
      reason: otherWhy,
      creds: otherCreds || "—",
      file: `${otherName} profile.pdf`,
      when: "Today",
      by: "A. Okonkwo",
    });
    closeChoose();
    bump();
    toast("Sent to NITDA for approval", "ok", "paper-plane-tilt");
  }

  function actionFor(c: (typeof cs)[number]) {
    const action = obligationAction(c);
    if (action === "choose-firm") return <Button variant="secondary" size="sm" onClick={() => setChooseFor(c.id)} testId={`engage-${c.prog}`}>Choose a firm</Button>;
    if (action === "answer") return <Button variant={Object.keys(c.answers).length ? "secondary" : "primary"} size="sm" onClick={() => router.push(`/organisation/answer/${c.id}`)} testId={`answer-${c.prog}`}>{Object.keys(c.answers).length ? "Continue" : "Start answering"}</Button>;
    if (action === "view-report") return <Button variant="tertiary" size="sm" onClick={() => router.push(`/organisation/report/${c.id}`)}>View report</Button>;
    if (action === "view") return <Button variant="tertiary" size="sm" onClick={() => router.push(`/organisation/answer/${c.id}`)}>View</Button>;
    if (action === "assess-respond") {
      const need = c.threads.filter((t) => t.status === "Open").length + c.interviews.filter((i) => i.status === "Times proposed").length;
      return <Button variant={need ? "primary" : "tertiary"} size="sm" onClick={() => router.push(`/organisation/assessment/${c.id}`)} testId={`oa-${c.prog}`}>{need ? `Respond (${need})` : "Open"}</Button>;
    }
    return null;
  }

  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Obligations" sub="Programmes NITDA has opened for Zenith Bank Plc. Each entity in a group answers on its own." />
      <div className="card p0">
        <div className="tbl-sub">
          <div className="pills">
            {(["Active", "Completed", "All"] as const).map((f) => (
              <button key={f} className={`pill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)} data-test={`obl-${f.toLowerCase()}`}>{f}<span className="count">{f === "All" ? cs.length : f === "Active" ? cs.filter(isActive).length : cs.filter((c) => !isActive(c)).length}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Programme</th><th>Assurance firm</th><th>Stage</th><th>Answered</th><th>Due</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((c) => {
                  const p = progOf(c.prog);
                  const fm = FIRMS.find((f) => f.id === c.firm);
                  return (
                    <tr key={c.id}>
                      <td><div className="strong">{p.name}</div><div className="cap muted">{regOfProg(p).ref} {p.ver} · {qsetQs(p.qset).length} questions</div></td>
                      <td className="small">
                        {fm ? (
                          <>{fm.name}<div className="cap muted">{c.firmStatus}</div></>
                        ) : c.reqFirm ? (
                          <>{c.reqFirm.name}<div className="cap" style={{ color: "var(--warn-fg)" }}>Waiting for NITDA approval</div></>
                        ) : p.firmMode === "organisation" ? (
                          <span className="cap" style={{ color: "var(--warn-fg)" }}>You choose{c.declineNote ? " (last request declined)" : ""}</span>
                        ) : (
                          <span className="muted">NITDA assigns</span>
                        )}
                      </td>
                      <td><Chip tone="neu">{c.stage}</Chip></td>
                      <td>{c.stage === "Published" ? <><b className="serif">{c.score}</b> <span className="cap muted">score</span></> : <div className="pbar"><div className="bar"><i style={{ width: `${caseProgress(c)}%` }} /></div><span className="cap tnum">{caseProgress(c)}%</span></div>}</td>
                      <td className="small muted">{c.due}</td>
                      <td className="act-col">{actionFor(c)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="list-checks" size="lg" /><div className="h4">Nothing here</div><p className="muted small">Programmes appear when NITDA opens one that applies to you.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={chooseFor !== null} onClose={closeChoose} wide>
        <div className="row"><h2 className="h3">Choose an assurance firm</h2></div>
        <p className="muted small">{chooseCase ? progOf(chooseCase.prog).name : ""}. The firm is asked to accept.</p>

        {chooseCase?.declineNote ? <AlertBox tone="bad" title="NITDA declined your last request" body={chooseCase.declineNote} /> : null}

        <div className="seg" style={{ alignSelf: "flex-start" }}>
          <button className={engMode === "list" ? "on" : ""} onClick={() => setEngMode("list")}>Accredited firms</button>
          <button className={engMode === "other" ? "on" : ""} data-test="eng-other" onClick={() => setEngMode("other")}>Another firm</button>
        </div>

        {engMode === "list" ? (
          <>
            <div className="col gap8">
              {accreditedFirms.map((f) => {
                const conflict = chooseCase ? conflictOf(f, chooseCase.org) : undefined;
                return (
                  <label key={f.id} className="choice" style={conflict ? { opacity: 0.55 } : undefined}>
                    <input type="radio" name="eng-f" className="sr" checked={pickFirm === f.id} disabled={!!conflict} onChange={() => setPickFirm(f.id)} />
                    <span className="radio" />
                    <span className="av" style={{ background: f.color }}>{f.initials}</span>
                    <span className="grow"><b>{f.name}</b><br /><span className="cap muted">{conflict ? `Not available: advised you since ${conflict.since}` : f.types.join(" · ")}</span></span>
                  </label>
                );
              })}
            </div>
            <div className="row end">
              <Button variant="outline" onClick={closeChoose}>Cancel</Button>
              <Button onClick={doEngage} testId="eng-go">Engage firm</Button>
            </div>
          </>
        ) : (
          <div className="col gap12">
            <AlertBox tone="info" title="NITDA's approval is needed" body="A firm that is not accredited needs NITDA's approval before it can start." />
            <div className="grid g2" style={{ gap: 12 }}>
              <Field label="Firm name" htmlFor="eo-name"><input className="inp" id="eo-name" value={otherName} onChange={(e) => setOtherName(e.target.value)} /></Field>
              <Field label="Contact email" htmlFor="eo-email"><input className="inp" id="eo-email" type="email" value={otherEmail} onChange={(e) => setOtherEmail(e.target.value)} /></Field>
            </div>
            <Field label="Assessor credentials" htmlFor="eo-cred"><input className="inp" id="eo-cred" placeholder="e.g. CIPP/E (2)" value={otherCreds} onChange={(e) => setOtherCreds(e.target.value)} /></Field>
            <Field label="Why this firm?" htmlFor="eo-why"><textarea className="ta" id="eo-why" rows={2} value={otherWhy} onChange={(e) => setOtherWhy(e.target.value)} /></Field>
            <button type="button" className="drop" onClick={() => { setOtherFile(true); toast("Firm profile attached"); }}>
              <Tile icon="upload-simple" size="sm" />
              <b className="small">{otherFile ? "Firm profile attached" : "Attach the firm's profile"}</b>
            </button>
            <div className="row end">
              <Button variant="outline" onClick={closeChoose}>Cancel</Button>
              <Button onClick={doEngageOther} testId="eo-go">Send for approval</Button>
            </div>
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
