"use client";

import { use, useReducer, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { TODAY, fmtD } from "@/lib/cases";
import { dPlus } from "@/lib/returns";
import {
  ENF_CASES,
  atOf,
  naira,
  ENF_TONE,
  issueCase,
  withdrawCase,
  remindCase,
  extendCase,
  decideCase,
  recordPayment,
  escalateCase,
  nextActionTypes,
  type EnforcementCase,
  type EnfEvidence,
} from "@/lib/enforcement";
import { ORGANISATIONS } from "@/lib/mockData";

function evLink(e: EnfEvidence): string {
  if (!e.id) return "";
  if (e.kind === "finding") return `/regulator/findings/${e.id}`;
  if (e.kind === "result") return `/regulator/reviews/${e.id}`;
  if (e.kind === "return") return `/regulator/returns/${e.id}`;
  return "";
}

export default function EnforcementCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [extOpen, setExtOpen] = useState(false);
  const [extDate, setExtDate] = useState("");
  const [escOpen, setEscOpen] = useState(false);
  const [escType, setEscType] = useState("");
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [payRef, setPayRef] = useState("");

  const found = ENF_CASES.find((x) => x.id === id);
  if (!found) notFound();
  const c: EnforcementCase = found;
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const t = atOf(c.type);

  function issue() {
    issueCase(c, TODAY);
    bump();
    toast(`Notice issued to ${o?.name}`, "ok", "paper-plane-tilt");
  }
  function withdraw() {
    withdrawCase(c, TODAY);
    bump();
    toast("Case withdrawn");
  }
  function remind() {
    remindCase(c, TODAY, "M. Bello");
    bump();
    toast("Reminder sent", "ok", "bell-ringing");
  }
  function doExtend() {
    extendCase(c, extDate, TODAY, "M. Bello");
    setExtOpen(false);
    bump();
    toast("Deadline extended");
  }
  function decide() {
    if (!outcome) {
      toast("Choose an outcome", "bad");
      return;
    }
    if (!note && /Contest|reduced|withdrawn/i.test(outcome)) {
      toast("Explain the decision in the note", "bad", "warning");
      return;
    }
    decideCase(c, outcome, note, amount, TODAY, "M. Bello");
    bump();
    toast(c.status === "Closed" ? "Case closed. The organisation has been told." : "Decision recorded. Waiting for payment.", "ok", "check-circle");
  }
  function pay() {
    if (!payRef) {
      toast("Enter the payment reference", "bad", "warning");
      return;
    }
    recordPayment(c, payRef, TODAY, "M. Bello");
    bump();
    toast("Payment recorded. Case closed.", "ok", "money");
  }
  function doEscalate() {
    const next = nextActionTypes(t);
    if (!next.length) {
      toast("This is already the strongest action", "info");
      return;
    }
    const newCase = escalateCase(c, escType || next[0].id, TODAY, "M. Bello");
    setEscOpen(false);
    bump();
    toast("Draft the new notice, then send it for sign-off");
    router.push(`/regulator/enforcement/${newCase.id}`);
  }

  const next = nextActionTypes(t);

  let side: React.ReactNode;
  if (c.status === "Awaiting sign-off") {
    side = (
      <>
        <p className="small muted">{c.approver} checks the case and issues the notice. {o?.name} is told straight away.</p>
        <Button block icon="signature" onClick={issue} testId="ec-issue">Sign off and issue{c.approver !== "M. Bello" ? ` (as ${c.approver})` : ""}</Button>
        <Button variant="tertiary" block onClick={withdraw}>Withdraw</Button>
      </>
    );
  } else if (c.status === "Notice issued") {
    const overdue = !!c.respondBy && c.respondBy < TODAY;
    side = (
      <>
        <AlertBox tone={overdue ? "bad" : "info"} title={c.respondBy ? (overdue ? "No response by the deadline" : `Waiting for a response by ${c.respondBy}`) : "Issued"} body={overdue ? "Escalate to the next action, or extend the deadline." : undefined} />
        <Button variant="secondary" block icon="bell-ringing" onClick={remind}>Send a reminder</Button>
        <Button variant="tertiary" block onClick={() => { setExtDate(dPlus(c.respondBy && c.respondBy > TODAY ? c.respondBy : TODAY, 14)); setExtOpen(true); }}>Extend the deadline</Button>
        <Button variant="tertiary" block icon="arrow-fat-line-up" onClick={() => setEscOpen(true)} testId="ec-escalate">Escalate</Button>
      </>
    );
  } else if (c.status === "Response received") {
    const outcomes = t.penalty ? ["Penalty confirmed", "Penalty reduced", "Penalty withdrawn"] : ["Complied", "No further action", "Contest upheld"];
    side = (
      <>
        <p className="small muted">{o?.name} has {c.response?.kind === "accept" ? "accepted" : "contested"}. Decide what happens next.</p>
        <Field label="Outcome" htmlFor="ec-out">
          <select className="sel" id="ec-out" value={outcome} onChange={(e) => setOutcome(e.target.value)} data-test="ec-out">
            <option value="">Choose</option>
            {outcomes.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        {t.penalty ? <Field label="Final amount (₦)" htmlFor="ec-amt"><input className="inp" id="ec-amt" type="number" value={amount || c.penalty?.amount || ""} onChange={(e) => setAmount(e.target.value)} /></Field> : null}
        <Field label="Note" htmlFor="ec-note"><textarea className="ta" id="ec-note" rows={3} placeholder="Your reasons, shared with the organisation" value={note} onChange={(e) => setNote(e.target.value)} data-test="ec-note" /></Field>
        <Button block icon="check-circle" onClick={decide} testId="ec-decide">{t.penalty ? "Record decision" : "Close the case"}</Button>
        <Button variant="secondary" block icon="arrow-fat-line-up" onClick={() => setEscOpen(true)} testId="ec-escalate">Escalate</Button>
        <Button variant="tertiary" block onClick={() => { setExtDate(dPlus(TODAY, 14)); setExtOpen(true); }}>Extend the deadline</Button>
      </>
    );
  } else if (c.status === "Awaiting payment") {
    side = (
      <>
        <AlertBox tone="warn" title={`${naira(c.penalty?.amount)} to pay`} body={`Due ${c.respondBy || ""}${c.penalty?.proof ? ". Proof of payment received." : ""}`} />
        <Field label="Payment reference" htmlFor="ec-ref"><input className="inp" id="ec-ref" placeholder="e.g. REMITA 1234 5678 9012" value={payRef} onChange={(e) => setPayRef(e.target.value)} data-test="ec-ref" /></Field>
        <Button block icon="money" onClick={pay} testId="ec-paid">Record payment and close</Button>
        <Button variant="tertiary" block icon="arrow-fat-line-up" onClick={() => setEscOpen(true)}>Escalate</Button>
      </>
    );
  } else {
    side = <AlertBox tone="ok" title={c.status} body={c.decision ? `${c.decision.outcome} · ${fmtD(c.decision.when)}` : ""} />;
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Enforcement", href: "/regulator/enforcement" }, { label: c.ref }]}>
      <div className="rh">
        <span className="logo s48" style={{ background: o?.color }}>{o?.initials}</span>
        <div className="rh-main">
          <div className="overline">{c.ref} · {t.name}</div>
          <div className="rh-title"><h1 className="h1">{o?.name}</h1><Chip tone={ENF_TONE[c.status] ?? "neu"}>{c.status}</Chip></div>
          <div className="rh-meta">Opened {fmtD(c.opened)} by {c.by}{c.respondBy ? ` · respond by ${fmtD(c.respondBy)}` : ""}{c.penalty ? ` · penalty ${naira(c.penalty.amount)}` : ""}</div>
        </div>
        <div className="rh-act"><Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/organisations/${c.org}`)}>Open organisation</Button></div>
      </div>
      <div className="grid side">
        <div className="col gap16">
          {c.notice || c.reason ? (
            <div className="card col gap8">
              <div className="row"><span className="h4 grow">Notice</span>{c.issued ? <span className="cap muted">Issued {fmtD(c.issued)}</span> : <Chip tone="warn">Not issued yet</Chip>}</div>
              {c.notice ? (
                <>
                  <div className="strong small">{c.notice.subject}</div>
                  <div className="letter">{c.notice.body}</div>
                </>
              ) : (
                <p className="small">{c.reason}</p>
              )}
              <Button variant="tertiary" size="sm" icon="download-simple" onClick={() => toast("Notice downloaded")}>Download notice (PDF)</Button>
            </div>
          ) : null}
          <div className="card col gap8">
            <div className="h4">Evidence</div>
            {c.evidence.length ? (
              c.evidence.map((e, i) => (
                evLink(e) ? (
                  <a key={i} className="small" href={evLink(e)} onClick={(ev) => { ev.preventDefault(); router.push(evLink(e)); }}>{e.label}</a>
                ) : (
                  <span key={i} className="small">{e.label}</span>
                )
              ))
            ) : (
              <p className="small muted">None linked.</p>
            )}
          </div>
          {c.response ? (
            <div className="card col gap8">
              <div className="row"><span className="h4 grow">Response from {o?.name}</span><Chip tone={c.response.kind === "accept" ? "ok" : "warn"}>{c.response.kind === "accept" ? "Accepted" : "Contested"}</Chip></div>
              <p className="small">{c.response.text}</p>
              <div className="cap muted">{c.response.by} · {fmtD(c.response.when)}</div>
            </div>
          ) : null}
          {c.decision ? (
            <div className="card col gap8">
              <div className="h4">Decision</div>
              <Kv pairs={[["Outcome", c.decision.outcome], ["By", c.decision.by], ["When", fmtD(c.decision.when)], ...(c.decision.note ? ([["Note", c.decision.note]] as [string, string][]) : [])]} />
            </div>
          ) : null}
          <div className="card col gap12">
            <div className="h4">Timeline</div>
            <div className="timeline">
              {[...c.timeline].reverse().map(([w, who, a], i) => (
                <div className="tl" key={i}><Tile icon="gavel" size="sm" /><div><div className="small strong">{a}</div><div className="cap muted">{who} · {fmtD(w)}</div></div></div>
              ))}
            </div>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap12"><div className="h4">Next step</div>{side}</div>
          <div className="card col gap8">
            <div className="h4">Case</div>
            <Kv pairs={[["Action", t.name], ["Approver", c.approver], ["Opened from", c.from === "watchlist" ? "Watchlist" : "Manually"], ["Other cases", String(ENF_CASES.filter((x) => x.org === c.org && x.id !== c.id).length)]]} />
          </div>
        </div>
      </div>

      <Dialog open={extOpen} onClose={() => setExtOpen(false)}>
        <div className="row"><Icon name="clock-clockwise" /><h2 className="h3">Extend the deadline</h2></div>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="New date" htmlFor="ex-d"><input className="inp" id="ex-d" type="date" value={extDate} onChange={(e) => setExtDate(e.target.value)} /></Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setExtOpen(false)}>Cancel</Button>
          <Button onClick={doExtend}>Extend</Button>
        </div>
      </Dialog>

      <Dialog open={escOpen} onClose={() => setEscOpen(false)}>
        <div className="row"><Icon name="arrow-fat-line-up" /><h2 className="h3">Escalate</h2></div>
        <p className="muted small">Close {c.ref} as escalated and open a stronger action with the same evidence.</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Next action" htmlFor="es-t">
            <select className="sel" id="es-t" value={escType || next[0]?.id} onChange={(e) => setEscType(e.target.value)} data-test="es-t">
              {next.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setEscOpen(false)}>Cancel</Button>
          <Button onClick={doEscalate} testId="es-go">Escalate</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
