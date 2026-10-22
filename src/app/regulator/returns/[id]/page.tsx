"use client";

import { use, useReducer, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, AlertBox, Kv, Field, Button, Tile } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  FILINGS,
  tplOf,
  prevFiling,
  isFiled,
  retStatus,
  fmtNum,
  variance,
  VAR_FLAG,
  RET_CHIP_TONE,
  dPlus,
  acceptFiling,
  queryFiling,
  askToResubmit,
  remindFiling,
  TODAY,
  type Filing,
} from "@/lib/returns";
import { ORGANISATIONS, catLabel } from "@/lib/mockData";

export default function RegulatorFilingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [queryOpen, setQueryOpen] = useState(false);
  const [queryField, setQueryField] = useState("");
  const [queryMsg, setQueryMsg] = useState("");
  const [queryBy, setQueryBy] = useState(dPlus(TODAY, 5));
  const [resubOpen, setResubOpen] = useState(false);
  const [resubMsg, setResubMsg] = useState("");

  const found = FILINGS.find((x) => x.id === id);
  if (!found) notFound();
  const f: Filing = found;

  const t = tplOf(f.tpl);
  const o = ORGANISATIONS.find((x) => x.id === f.org);
  const pv = prevFiling(f);
  const filed = isFiled(f);
  const st = retStatus(f);
  const openQ = f.queries.filter((q) => q.status === "Open");
  const nFlag = t.fields.filter((fd) => fd.type === "number" && pv && Math.abs(variance(f.values[fd.key], pv.values[fd.key]) ?? 0) >= VAR_FLAG).length;
  const otherPeriods = FILINGS.filter((x) => x.tpl === f.tpl && x.org === f.org && x.id !== f.id).sort((a, b) => b.pkey.localeCompare(a.pkey));

  function openQuery(key: string) {
    const fd = t.fields.find((x) => x.key === key) ?? t.fields.find((x) => x.type === "number" && pv && Math.abs(variance(f.values[x.key], pv.values[x.key]) ?? 0) >= VAR_FLAG) ?? t.fields[0];
    const sug = pv && fd.type === "number" ? `${fd.label} is ${fmtNum(f.values[fd.key])}${fd.unit ? ` ${fd.unit}` : ""}, against ${fmtNum(pv.values[fd.key])} in ${pv.period}. Please confirm the figure, or correct it, and tell us what changed.` : "";
    setQueryField(fd.key);
    setQueryMsg(sug);
    setQueryBy(dPlus(TODAY, 5));
    setQueryOpen(true);
  }

  function sendQuery() {
    if (!queryMsg) {
      toast("Write the question", "bad", "warning");
      return;
    }
    const fd = t.fields.find((x) => x.key === queryField)!;
    queryFiling(f, queryField, queryMsg, queryBy, "M. Bello", TODAY, fd.label);
    setQueryOpen(false);
    bump();
    toast("Query sent", "ok", "chat-circle-dots");
  }

  function accept() {
    acceptFiling(f, "M. Bello", TODAY);
    bump();
    toast("Return accepted. The organisation has been told.", "ok", "check-circle");
  }

  function sendBack() {
    askToResubmit(f, resubMsg, "M. Bello", TODAY);
    setResubOpen(false);
    bump();
    toast("Sent back to the organisation");
  }

  function remind() {
    remindFiling(f, "M. Bello", TODAY);
    bump();
    toast(`Reminder sent to ${o?.name}`, "ok", "bell-ringing");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Data returns", href: "/regulator/returns" }, { label: `${o?.name ?? ""} · ${t.code} ${f.period}` }]}>
      <div className="rh">
        <span className="logo s48" style={{ background: o?.color }}>{o?.initials}</span>
        <div className="rh-main">
          <div className="overline">{t.name} · {f.period}</div>
          <div className="rh-title"><h1 className="h1">{o?.name}</h1><Chip tone={RET_CHIP_TONE[st] ?? "neu"}>{st}</Chip></div>
          <div className="rh-meta">{o ? catLabel(o.type, o.tier) : ""} · due {f.due}{f.ver > 1 ? ` · version ${f.ver}` : ""}</div>
        </div>
      </div>

      <div className="grid side">
        <div className="col gap16">
          {!filed ? (
            <div className="card">
              <div className="col" style={{ alignItems: "center", textAlign: "center", padding: 24, gap: 8 }}>
                <Tile icon="hourglass" size="lg" />
                <div className="h4">Not filed yet</div>
                <p className="muted small">{o?.name} has {f.status === "Draft" ? "started a draft but not submitted" : "not started this return"}. {st === "Late" ? "It is past the due date and the grace period." : ""}</p>
                <Button variant="secondary" icon="bell-ringing" onClick={remind} testId="remind-one">Send a reminder</Button>
              </div>
            </div>
          ) : (
            <>
              {nFlag && f.status !== "Accepted" ? (
                <AlertBox tone="warn" title={`${nFlag} figure${nFlag > 1 ? "s" : ""} changed by ${VAR_FLAG}% or more since ${pv?.period}`} body="Large changes are not always wrong. Query a figure if you want the organisation to confirm or correct it." />
              ) : null}
              <div className="card p0">
                <div className="tbl-tools"><span className="h4 grow">Figures</span><span className="cap muted">{pv ? `Compared with ${pv.period}` : "No earlier period to compare with"}</span></div>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Field</th><th className="num">{f.period}</th><th className="num">{pv ? pv.period : "Last period"}</th><th>Change</th><th className="act-col" /></tr></thead>
                    <tbody>
                      {t.fields.map((fd) => {
                        const v = f.values[fd.key];
                        const p = pv ? pv.values[fd.key] : null;
                        const vr = fd.type === "number" ? variance(v, p) : null;
                        const flag = vr != null && Math.abs(vr) >= VAR_FLAG;
                        const q = f.queries.find((x) => x.field === fd.key && x.status === "Open");
                        return (
                          <tr key={fd.key} className={q ? "row-warn" : ""}>
                            <td className="wrap"><div className="small strong">{fd.label}</div>{fd.unit ? <div className="cap muted">{fd.unit}</div> : null}</td>
                            <td className="num tnum strong">{fd.type === "number" ? fmtNum(v) : <span className="small" style={{ fontWeight: 400 }}>{v || "—"}</span>}</td>
                            <td className="num tnum muted">{pv && fd.type === "number" ? fmtNum(p) : "—"}</td>
                            <td>{vr == null ? <span className="cap muted">—</span> : flag ? <Chip tone="warn" icon="warning">{vr > 0 ? "+" : ""}{vr}%</Chip> : <span className="cap tnum muted">{vr > 0 ? "+" : ""}{vr}%</span>}</td>
                            <td className="act-col">{q ? <Chip tone="warn" icon="chat-circle-dots">Queried</Chip> : filed && f.status !== "Accepted" ? <Button variant="tertiary" size="sm" icon="chat-circle-dots" onClick={() => openQuery(fd.key)} testId={`q-${fd.key}`}>Query</Button> : null}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {f.queries.length ? (
            <div className="card col gap12">
              <div className="h4">Queries</div>
              {f.queries.map((qu, i) => {
                const fd = t.fields.find((x) => x.key === qu.field) ?? { label: "Whole return" };
                return (
                  <div className="oa" key={i}>
                    <div className="row"><span className="small strong grow">{fd.label}</span><Chip tone={qu.status === "Open" ? "warn" : "ok"}>{qu.status === "Open" ? "Waiting for reply" : "Answered"}</Chip></div>
                    <p className="small" style={{ marginTop: 4 }}>{qu.msg}</p>
                    <div className="cap muted">{qu.by} · {qu.when}</div>
                    {qu.reply ? <div className="reply"><div className="cap muted">{o?.name} replied{qu.from != null ? ` · changed ${fmtNum(qu.from)} → ${fmtNum(qu.to)}` : ""}</div><p className="small">{qu.reply}</p></div> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="card col gap12">
            <div className="h4">History</div>
            <div className="timeline">
              {f.history.length ? (
                [...f.history].reverse().map(([w, a, b], i) => (
                  <div className="tl" key={i}>
                    <Tile icon={/Accept/.test(a) ? "check-circle" : /Quer/.test(a) ? "chat-circle-dots" : /Remind/.test(a) ? "bell-ringing" : "paper-plane-tilt"} tone={/Accept/.test(a) ? "ok" : /Quer/.test(a) ? "warn" : ""} size="sm" />
                    <div><div className="small strong">{a}</div><div className="cap muted">{b} · {w}</div></div>
                  </div>
                ))
              ) : (
                <p className="cap muted">Nothing yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">Decision</div>
            {["Submitted", "Resubmitted"].includes(f.status) ? (
              <>
                <p className="small muted">Accept the return, or query a figure. A query sends it back to the organisation to confirm or correct.</p>
                <Button block icon="check-circle" onClick={accept} testId="ret-accept">Accept return</Button>
                <Button variant="secondary" block icon="chat-circle-dots" onClick={() => openQuery(t.fields[0].key)} testId="ret-query">Query a figure</Button>
                <Button variant="tertiary" block icon="arrow-u-up-left" onClick={() => setResubOpen(true)} testId="ret-resub">Ask to resubmit</Button>
              </>
            ) : f.status === "Queried" ? (
              <AlertBox tone="warn" title={`${openQ.length} quer${openQ.length === 1 ? "y" : "ies"} open`} body={`Waiting for ${o?.name} to reply and resubmit.`} />
            ) : f.status === "Accepted" ? (
              <AlertBox tone="ok" title="Accepted" body={`${f.acceptedBy || ""}${f.acceptedAt ? ` · ${f.acceptedAt}` : ""}`} />
            ) : (
              <>
                <AlertBox tone={st === "Late" ? "bad" : "info"} title={st === "Late" ? "Late" : "Not filed yet"} body={`${f.reminders || 0} reminder${f.reminders === 1 ? "" : "s"} sent${f.lastReminder ? `, last on ${f.lastReminder}` : ""}.`} />
                <Button block variant="secondary" icon="bell-ringing" onClick={remind}>Send a reminder</Button>
              </>
            )}
          </div>
          <div className="card col gap8">
            <div className="h4">Filing</div>
            <Kv pairs={[["Receipt", <span className="mono small" key="r">{f.receipt || "—"}</span>], ["Filed", f.filedAt || "—"], ["Prepared by", f.filedBy || "—"], ["Approved by", f.approvedBy || "—"], ["How", f.source === "Upload" ? "Uploaded template" : "Filled in online"], ["Template", `${t.code} ${t.version}`], ["Due", f.due + (f.lateBy ? ` (${f.lateBy} days late)` : "")]]} />
          </div>
          <div className="card col gap8">
            <div className="h4">Other periods</div>
            {otherPeriods.length ? (
              otherPeriods.map((x) => (
                <a key={x.id} href={`/regulator/returns/${x.id}`} className="list-row" style={{ padding: "8px 0", borderTop: 0, minHeight: 0, display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="grow small">{x.period}</span>
                  <Chip tone={RET_CHIP_TONE[retStatus(x)] ?? "neu"}>{retStatus(x)}</Chip>
                </a>
              ))
            ) : (
              <p className="cap muted">None.</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={queryOpen} onClose={() => setQueryOpen(false)}>
        <div className="row"><Icon name="chat-circle-dots" /><h2 className="h3">Query a figure</h2></div>
        <p className="muted small">{o?.name} is asked to confirm or correct it, then resubmit.</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Figure" htmlFor="rq-field">
            <select className="sel" id="rq-field" value={queryField} onChange={(e) => setQueryField(e.target.value)}>
              {t.fields.map((fd) => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
            </select>
          </Field>
          <Field label="Question" htmlFor="rq-msg">
            <textarea className="ta" id="rq-msg" rows={4} placeholder="What do you want them to check?" value={queryMsg} onChange={(e) => setQueryMsg(e.target.value)} data-test="rq-msg" />
          </Field>
          <Field label="Reply by" htmlFor="rq-by">
            <input className="inp" id="rq-by" type="date" value={queryBy} onChange={(e) => setQueryBy(e.target.value)} />
          </Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setQueryOpen(false)}>Cancel</Button>
          <Button onClick={sendQuery} testId="rq-send">Send query</Button>
        </div>
      </Dialog>

      <Dialog open={resubOpen} onClose={() => setResubOpen(false)}>
        <div className="row"><Icon name="arrow-u-up-left" /><h2 className="h3">Ask to resubmit</h2></div>
        <p className="muted small">Use this when the whole return needs redoing, for example the wrong period was filed.</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Reason" htmlFor="rs-msg">
            <textarea className="ta" id="rs-msg" rows={3} placeholder="Tell them what is wrong" value={resubMsg} onChange={(e) => setResubMsg(e.target.value)} />
          </Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setResubOpen(false)}>Cancel</Button>
          <Button onClick={sendBack}>Send back</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
