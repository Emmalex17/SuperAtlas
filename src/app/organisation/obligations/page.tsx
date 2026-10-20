"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tile, Button } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { myCases, progOf, regOfProg, qsetQs, caseProgress, obligationAction, engageFirm, TODAY } from "@/lib/cases";
import { FIRMS } from "@/lib/mockData";

const ORG_ID = "zenith";

export default function ObligationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [filter, setFilter] = useState<"Active" | "Completed" | "All">("Active");
  const [chooseFor, setChooseFor] = useState<string | null>(null);
  const [pickFirm, setPickFirm] = useState("");

  const cs = myCases(ORG_ID);
  const isActive = (c: (typeof cs)[number]) => c.stage !== "Published" && progOf(c.prog).status !== "Closed";
  const rows = cs.filter((c) => (filter === "All" ? true : filter === "Active" ? isActive(c) : !isActive(c)));
  const accreditedFirms = FIRMS.filter((f) => f.status === "Accredited");

  function doEngage() {
    if (!chooseFor || !pickFirm) {
      toast("Choose a firm", "bad");
      return;
    }
    const c = cs.find((x) => x.id === chooseFor)!;
    engageFirm(c, pickFirm, TODAY, "A. Okonkwo");
    setChooseFor(null);
    setPickFirm("");
    bump();
    toast(`Request sent to ${FIRMS.find((f) => f.id === pickFirm)?.name}`, "ok", "handshake");
  }

  function actionFor(c: (typeof cs)[number]) {
    const action = obligationAction(c);
    if (action === "choose-firm") return <Button variant="secondary" size="sm" onClick={() => setChooseFor(c.id)} testId={`engage-${c.prog}`}>Choose a firm</Button>;
    if (action === "answer") return <Button variant={Object.keys(c.answers).length ? "secondary" : "primary"} size="sm" onClick={() => router.push(`/organisation/answer/${c.id}`)} testId={`answer-${c.prog}`}>{Object.keys(c.answers).length ? "Continue" : "Start answering"}</Button>;
    if (action === "view-report") return <Button variant="tertiary" size="sm" onClick={() => router.push(`/organisation/report/${c.id}`)}>View report</Button>;
    if (action === "view") return <Button variant="tertiary" size="sm" onClick={() => router.push(`/organisation/answer/${c.id}`)}>View</Button>;
    if (action === "assess-respond") return <Button variant="tertiary" size="sm" onClick={() => router.push(`/organisation/answer/${c.id}`)}>Open</Button>;
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

      <Dialog open={chooseFor !== null} onClose={() => setChooseFor(null)}>
        <div className="row"><h2 className="h3">Choose an assurance firm</h2></div>
        <p className="muted small">The firm is asked to accept.</p>
        <div className="col gap8">
          {accreditedFirms.map((f) => (
            <label key={f.id} className={`choice ${pickFirm === f.id ? "on" : ""}`}>
              <input type="radio" name="eng-f" className="sr" checked={pickFirm === f.id} onChange={() => setPickFirm(f.id)} />
              <span className="radio" />
              <span className="av" style={{ background: f.color }}>{f.initials}</span>
              <span className="grow"><b>{f.name}</b><br /><span className="cap muted">{f.types.join(" · ")}</span></span>
            </label>
          ))}
        </div>
        <div className="row end">
          <Button variant="outline" onClick={() => setChooseFor(null)}>Cancel</Button>
          <Button onClick={doEngage} testId="eng-go">Engage firm</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
