"use client";

import { use, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  allFindings,
  fdFind,
  effDue,
  fdOverdue,
  fdLog,
  closeFinding,
  reopenFinding,
  decideExtension,
  progOf,
  fcOf,
  FD_STATUS_TONE,
  TODAY,
} from "@/lib/cases";
import { ORGANISATIONS, FIRMS } from "@/lib/mockData";

export default function RegulatorFindingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [closeNote, setCloseNote] = useState("");

  if (!allFindings().some((x) => x.f.id === id)) notFound();
  const { f, c } = fdFind(id);
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const fm = FIRMS.find((x) => x.id === c.firm);
  const fc = fcOf(f.cls);
  const p = progOf(c.prog);

  function remind() {
    fdLog(f, "Reminder sent", "M. Bello", TODAY);
    bump();
    toast(`Reminder sent to ${o?.name}`, "ok", "bell-ringing");
  }

  function close() {
    closeFinding(f, TODAY, "M. Bello");
    bump();
    toast("Finding closed");
  }

  function reopen() {
    reopenFinding(f, closeNote, TODAY, "M. Bello");
    bump();
    toast("Finding reopened");
  }

  function decideExt(approve: boolean) {
    decideExtension(f, approve, TODAY, "M. Bello");
    bump();
    toast(approve ? "Extension approved" : "Extension declined");
  }

  let side: React.ReactNode;
  if (f.status === "Verified fixed") {
    side = (
      <>
        <p className="small muted">{fm ? fm.name : "The firm"} verified the fix. Close the finding, or reopen it if you are not satisfied.</p>
        <Field label="Note" htmlFor="cl-note" hint="Required if you reopen">
          <textarea className="ta" id="cl-note" rows={2} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
        </Field>
        <Button block icon="lock-simple" onClick={close} testId="fd-close">Close finding</Button>
        <Button variant="secondary" block icon="arrow-counter-clockwise" onClick={reopen}>Reopen</Button>
      </>
    );
  } else if (f.status === "Closed") {
    side = <AlertBox tone="ok" title="Closed" body={`${f.closed?.by ?? ""} · ${f.closed?.when ?? ""}`} />;
  } else if (f.status === "Noted") {
    side = <AlertBox tone="info" title="Opportunity for improvement. No fix is required." />;
  } else {
    side = (
      <>
        {f.status === "Fix submitted" ? (
          <AlertBox tone="info" title="With the firm to verify" body={fm?.name ?? ""} />
        ) : (
          <AlertBox
            tone={fdOverdue(f, TODAY) ? "bad" : "info"}
            title={fdOverdue(f, TODAY) ? "Overdue" : f.status === "Open" ? "Waiting for a plan" : "Fix in progress"}
            body={fdOverdue(f, TODAY) ? `Past the deadline of ${effDue(f)}.` : `${o?.name} has until ${effDue(f)}.`}
          />
        )}
        <Button variant="secondary" block icon="bell-ringing" onClick={remind} testId="fd-remind">Send a reminder</Button>
      </>
    );
  }

  const tl = [...(f.updates ?? [])].reverse();

  return (
    <AppShell workspace="regulator">
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{fc.name} · {f.ref} · {o?.name}</div>
          <div className="rh-title"><h1 className="h1">{f.title}</h1><span className="row wrap gap6"><span className={`chip ${fc.tone}`}>{f.cls}</span><Chip tone={FD_STATUS_TONE[f.status ?? ""] ?? "neu"}>{f.status}</Chip>{fdOverdue(f, TODAY) ? <Chip tone="bad" icon="warning">Overdue</Chip> : null}</span></div>
          <div className="rh-meta">From the {p.name} report · published {c.published ?? ""}</div>
        </div>
      </div>
      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap8"><div className="h4">The finding</div><p className="small">{f.detail || `The assessor found a gap against ${f.ref}. See the published report for the full note.`}</p></div>
          {f.plan ? (
            <div className="card col gap12">
              <div className="h4">Action plan</div>
              <p className="small">{f.plan.action}</p>
              <Kv pairs={[["Owner", f.plan.owner || "—"], ["Target date", f.plan.target || "—"]]} />
              {f.plan.steps.filter((s) => s[0]).length ? (
                <div className="col gap6">
                  {f.plan.steps.filter((s) => s[0]).map((s, i) => (
                    <div className="row gap8 small" key={i}><Icon name={s[1] ? "check-circle" : "circle-dashed"} className={s[1] ? "ok-t" : ""} /><span>{s[0]}</span></div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : f.status !== "Noted" ? (
            <div className="card">
              <div className="col" style={{ alignItems: "center", padding: 24, gap: 8 }}><Tile icon="clipboard-text" size="lg" /><div className="h4">No plan yet</div><p className="muted small">{o?.name} has not planned this fix yet.</p></div>
            </div>
          ) : null}
          {f.proof?.length ? (
            <div className="card col gap12">
              <div className="row"><span className="h4 grow">Proof of the fix</span><span className="count">{f.proof.length}</span></div>
              {f.proof.map(([name, size], i) => (
                <div className="file" key={i}><div className="grow"><div className="strong small">{name}</div><div className="cap muted">{size}</div></div></div>
              ))}
            </div>
          ) : null}
          {f.verify ? (
            <div className="card col gap8">
              <div className="row"><span className="h4 grow">Verification</span><Chip tone={f.verify.ok ? "ok" : "bad"}>{f.verify.ok ? "Verified fixed" : "Not fixed"}</Chip></div>
              <p className="small">{f.verify.note}</p>
              <div className="cap muted">{f.verify.by} · {fm?.name ?? ""} · {f.verify.when}</div>
            </div>
          ) : null}
          <div className="card col gap12">
            <div className="h4">Activity</div>
            <div className="timeline">
              {tl.map(([w, who, a], i) => (
                <div className="tl" key={i}>
                  <Tile icon={/Verified|Closed|approved/i.test(a) ? "check-circle" : /Not fixed|Reopen|declined/i.test(a) ? "x-circle" : /time/i.test(a) ? "clock-clockwise" : /Remind/.test(a) ? "bell-ringing" : "note-pencil"} tone={/Verified|Closed|approved/i.test(a) ? "ok" : /Not fixed|Reopen|declined/i.test(a) ? "bad" : ""} size="sm" />
                  <div><div className="small strong">{a}</div><div className="cap muted">{who} · {w}</div></div>
                </div>
              ))}
              <div className="tl"><Tile icon="flag" size="sm" /><div><div className="small strong">Raised in the published report</div><div className="cap muted">{fm?.name ?? ""} · {c.published ?? ""}</div></div></div>
            </div>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">Decision</div>
            {side}
            {f.ext?.status === "Requested" ? (
              <div className="ext-box col gap8">
                <div className="row gap8">
                  <Tile icon="clock-clockwise" tone="warn" size="sm" />
                  <div className="grow"><div className="small strong">More time asked: until {f.ext.date}</div><div className="cap muted">{f.ext.by} · {f.ext.when} · now due {f.due}</div></div>
                </div>
                <p className="small">&quot;{f.ext.reason}&quot;</p>
                <div className="row">
                  <Button size="sm" icon="check" onClick={() => decideExt(true)} testId="ext-approve">Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => decideExt(false)} testId="ext-decline">Decline</Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="card col gap8">
            <div className="h4">Details</div>
            <Kv pairs={[["Class", <span key="c"><span className={`chip ${fc.tone}`}>{f.cls}</span> <span className="small">{fc.name}</span></span>], ["Fix by", effDue(f) || "No deadline"], ["Organisation", o?.name ?? ""], ["Assessed by", fm?.name ?? "—"], ["Owner", f.plan?.owner || "—"]]} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
