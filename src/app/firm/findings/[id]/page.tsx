"use client";

import { use, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { allFindings, fdFind, effDue, fmtD, verifyFix, progOf, fcOf, FD_STATUS_CHIP, TODAY, type FindingWithCase } from "@/lib/cases";
import { ORGANISATIONS, FIRMS } from "@/lib/mockData";

const FIRM_ID = "deloitte";
const ME = "T. Adebayo";

export default function FirmFindingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [note, setNote] = useState("");

  const match: FindingWithCase | undefined = allFindings().find((x) => x.f.id === id && x.c.firm === FIRM_ID);
  if (!match) notFound();
  const { f, c } = fdFind(id);
  const o = ORGANISATIONS.find((x) => x.id === c.org);
  const fm = FIRMS.find((x) => x.id === c.firm);
  const fc = fcOf(f.cls);
  const p = progOf(c.prog);

  function verify(ok: boolean) {
    if (!note) {
      toast("Add a note on what you checked", "bad");
      return;
    }
    verifyFix(f, ok, note, TODAY, ME, fm?.name ?? "");
    setNote("");
    bump();
    toast(ok ? "Verified. NITDA will close it." : "Sent back to the organisation");
  }

  let side: React.ReactNode;
  if (f.status === "Fix submitted") {
    side = (
      <>
        <p className="small muted">Check the proof. If the fix works, verify it. If not, say what is missing; the organisation keeps working on it.</p>
        <Field label="Note" htmlFor="vf-note">
          <textarea className="ta" id="vf-note" rows={3} placeholder="What you checked" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button block icon="seal-check" onClick={() => verify(true)} testId="vf-ok">Verified fixed</Button>
        <Button variant="secondary" block icon="x-circle" onClick={() => verify(false)} testId="vf-no">Not fixed</Button>
      </>
    );
  } else if (f.status === "Verified fixed") {
    side = <AlertBox tone="ok" title="You verified this fix" body="Waiting for NITDA to close it." />;
  } else if (f.status === "Closed") {
    side = <AlertBox tone="ok" title="Closed" body={`${f.closed?.by ?? ""} · ${f.closed?.when ?? ""}`} />;
  } else {
    side = <AlertBox tone="info" title={`${o?.name ?? "The organisation"} is still working on this fix.`} />;
  }

  const tl = [...(f.updates ?? [])].reverse();

  return (
    <AppShell workspace="firm" crumbs={[{ label: "Findings", href: "/firm/findings" }, { label: f.title }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">{fc.name} · {f.ref} · {o?.name}</div>
          <div className="rh-title"><h1 className="h1">{f.title}</h1><span className="row wrap gap6"><span className={`chip ${fc.tone}`}>{f.cls}</span><Chip tone={FD_STATUS_CHIP[f.status ?? ""]?.tone ?? "neu"} icon={FD_STATUS_CHIP[f.status ?? ""]?.icon}>{FD_STATUS_CHIP[f.status ?? ""]?.label ?? f.status}</Chip></span></div>
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
              <Kv pairs={[["Owner", f.plan.owner || "—"], ["Target date", f.plan.target ? fmtD(f.plan.target) : "—"]]} />
              {f.plan.steps.filter((s) => s[0]).length ? (
                <div className="col gap6">
                  {f.plan.steps.filter((s) => s[0]).map((s, i) => (
                    <div className="row gap8 small" key={i}><Icon name={s[1] ? "check-circle" : "circle-dashed"} className={s[1] ? "ok-t" : ""} /><span>{s[0]}</span></div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {f.proof?.length ? (
            <div className="card col gap12">
              <div className="row"><span className="h4 grow">Proof of the fix</span><span className="count">{f.proof.length}</span></div>
              {f.proof.map(([name, size], i) => (
                <div className="file" key={i}><Icon name="file-text" /><div className="grow"><div className="strong small">{name}</div><div className="cap muted">{size}</div></div></div>
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
            <div className="h4">Verification</div>
            {side}
          </div>
          <div className="card col gap8">
            <div className="h4">Details</div>
            <Kv
              pairs={[
                ["Class", <span key="c"><span className={`chip ${fc.tone}`}>{f.cls}</span> <span className="small">{fc.name}</span></span>],
                ["Fix by", effDue(f) ? fmtD(effDue(f)) : "No deadline"],
                ...(f.ext?.status === "Approved" ? ([["Original deadline", fmtD(f.due)]] as [string, string][]) : []),
                ["Organisation", o?.name ?? ""],
                ["Owner", f.plan?.owner || "—"],
              ]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
