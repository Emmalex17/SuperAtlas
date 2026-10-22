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
  retErrors,
  graceOf,
  saveDraft,
  submitFiling,
  periodCode,
  UPLOAD_SAMPLE,
  TODAY,
  daysBetween,
  type Filing,
} from "@/lib/returns";
import { ORGANISATIONS, orgPeople } from "@/lib/mockData";

const ME = "A. Okonkwo";
const ORG_ID = "zenith";

function dueLine(f: Filing): React.ReactNode {
  if (isFiled(f)) return <span className="cap muted">Filed {(f.filedAt || "").split(",")[0]}</span>;
  const n = daysBetween(TODAY, f.due);
  if (n < 0) return <span className="cap" style={{ color: "var(--bad-fg)" }}>{-n} day{n === -1 ? "" : "s"} overdue</span>;
  if (n === 0) return <span className="cap" style={{ color: "var(--warn-fg)" }}>Due today</span>;
  return <span className="cap muted">Due in {n} days</span>;
}

export default function OrgReturnFilingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const found = FILINGS.find((x) => x.id === id);
  if (!found) notFound();
  const f: Filing = found;

  const t = tplOf(f.tpl);
  const pv = prevFiling(f);
  const editable = !isFiled(f) || f.status === "Queried";
  const openQ = f.queries.filter((q) => q.status === "Open");
  const org = ORGANISATIONS.find((o) => o.id === ORG_ID);
  const people = org ? orgPeople(org) : [];

  const [draft, setDraft] = useState<Record<string, string | number>>(() => ({ ...f.values }));
  const [touched, setTouched] = useState(false);
  const [reply, setReply] = useState("");
  const [mode, setMode] = useState<"online" | "upload">("online");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [justFiled, setJustFiled] = useState(false);

  const [signOpen, setSignOpen] = useState(false);
  const [approver, setApprover] = useState(ME);
  const [declared, setDeclared] = useState(false);
  const [fromUpload, setFromUpload] = useState(false);

  const errs = touched ? retErrors(t, draft) : {};
  const nErr = Object.keys(errs).length;

  function setField(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function doSaveDraft() {
    saveDraft(f, draft);
    bump();
    toast("Draft saved");
  }

  function downloadFiledCopy() {
    toast("Filed copy downloaded (PDF)");
  }

  function downloadTemplate() {
    toast("Template downloaded");
  }

  function doUpload() {
    const sample = UPLOAD_SAMPLE[t.id] ?? {};
    setDraft(sample);
    setTouched(true);
    setFromUpload(true);
    setUploadedFile(`${t.code.toLowerCase()}-${periodCode(f).toLowerCase()}.xlsx`);
    setMode("online");
    const n = Object.keys(retErrors(t, sample)).length;
    toast(n ? `Read ${t.fields.length} figures from your file. ${n} need${n === 1 ? "s" : ""} fixing.` : `Read ${t.fields.length} figures from your file`, n ? "warn" : "ok", "file-xls");
  }

  function openSubmit() {
    setTouched(true);
    const e = retErrors(t, draft);
    if (Object.keys(e).length) {
      setMode("online");
      toast("Fix the problems first", "bad", "warning");
      return;
    }
    if (f.status === "Queried" && !reply) {
      toast("Add a reply to the query", "bad", "warning");
      return;
    }
    setApprover(ME);
    setDeclared(false);
    setSignOpen(true);
  }

  function doSubmit() {
    if (!declared) {
      toast("Tick the declaration to submit", "bad", "warning");
      return;
    }
    submitFiling(f, draft, ME, approver, TODAY, `RET-${t.code}`, fromUpload ? "Upload" : "Online");
    setSignOpen(false);
    setJustFiled(true);
    bump();
    toast(`${f.status === "Resubmitted" ? "Resubmitted" : "Filed"}. Receipt ${f.receipt}`, "ok", "seal-check");
  }

  const head = (
    <div className="rh">
      <div className="rh-main">
        <div className="overline">{t.code} {t.version} · {t.freq}</div>
        <div className="rh-title"><h1 className="h1">{t.name} · {f.period}</h1><Chip tone={RET_CHIP_TONE[retStatus(f)] ?? "neu"}>{retStatus(f)}</Chip></div>
        <div className="rh-meta">Due {f.due} · {dueLine(f)}</div>
      </div>
    </div>
  );

  const crumbs = [{ label: "Data returns", href: "/organisation/returns" }, { label: `${t.name} · ${f.period}` }];

  if (!editable) {
    return (
      <AppShell workspace="organisation" crumbs={crumbs}>
        {head}
        {justFiled ? (
          <div style={{ margin: "16px 0" }}>
            <AlertBox
              tone="ok"
              icon="seal-check"
              title={`Filed. Receipt ${f.receipt}`}
              body="NITDA has your return and will review it. You will be told if they have questions."
              actions={<Button size="sm" variant="secondary" icon="download-simple" onClick={downloadFiledCopy}>Download filed copy</Button>}
            />
          </div>
        ) : null}
        <div className="grid side">
          <div className="col gap16">
            <div className="card p0">
              <div className="tbl-tools"><span className="h4 grow">What you filed</span>{f.ver > 1 ? <Chip tone="info">Version {f.ver}</Chip> : null}</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Field</th><th className="num">{f.period}</th><th className="num">{pv ? pv.period : ""}</th></tr></thead>
                  <tbody>
                    {t.fields.map((fd) => (
                      <tr key={fd.key}>
                        <td className="wrap small">{fd.label}{fd.unit ? <span className="cap muted"> ({fd.unit})</span> : null}</td>
                        <td className="num tnum strong">{fd.type === "number" ? fmtNum(f.values[fd.key]) : <span className="small" style={{ fontWeight: 400 }}>{f.values[fd.key] || "—"}</span>}</td>
                        <td className="num tnum muted">{pv && fd.type === "number" ? fmtNum(pv.values[fd.key]) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {f.queries.length ? (
              <div className="card col gap12">
                <div className="h4">Queries from NITDA</div>
                {f.queries.map((q, i) => (
                  <div className="oa" key={i}>
                    <div className="small strong">{(t.fields.find((x) => x.key === q.field) ?? { label: "Whole return" }).label}</div>
                    <p className="small">{q.msg}</p>
                    {q.reply ? <div className="reply"><div className="cap muted">Your reply</div><p className="small">{q.reply}</p></div> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="col gap16">
            <div className="card col gap8">
              <div className="h4">Receipt</div>
              <Kv pairs={[["Receipt", <span className="mono small" key="r" data-test="ret-receipt">{f.receipt}</span>], ["Filed", f.filedAt ?? "—"], ["Prepared by", f.filedBy ?? "—"], ["Approved by", f.approvedBy ?? "—"], ["Status", <Chip tone={RET_CHIP_TONE[retStatus(f)] ?? "neu"} key="s">{retStatus(f)}</Chip>]]} />
              <Button variant="secondary" block icon="download-simple" onClick={downloadFiledCopy}>Download filed copy</Button>
            </div>
            <div className="card col gap12">
              <div className="h4">History</div>
              <div className="timeline">
                {[...f.history].reverse().map(([w, a, b], i) => (
                  <div className="tl" key={i}>
                    <Tile icon={/Accept/.test(a) ? "check-circle" : /Quer/.test(a) ? "chat-circle-dots" : "paper-plane-tilt"} tone={/Accept/.test(a) ? "ok" : ""} size="sm" />
                    <div><div className="small strong">{a}</div><div className="cap muted">{b} · {w}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell workspace="organisation" crumbs={crumbs}>
      {head}
      {openQ.length ? (
        <div style={{ margin: "16px 0" }}>
          <AlertBox tone="warn" title={`NITDA has ${openQ.length} quer${openQ.length > 1 ? "ies" : "y"} on this return`} body="Correct the figure or confirm it, explain in your reply, then resubmit. Your first filing is kept in the history." />
        </div>
      ) : null}
      <div className="grid side">
        <div className="col gap16">
          <div className="row">
            <div className="seg" role="tablist" aria-label="How to file">
              {([["online", "Fill in online", "pencil-simple"], ["upload", "Upload template", "upload-simple"]] as const).map(([k, l, i]) => (
                <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)} data-test={`rm-${k}`}>
                  <Icon name={i} /> {l}
                </button>
              ))}
            </div>
            <span className="grow" />
            {uploadedFile ? <Chip icon="file-xls">{uploadedFile}</Chip> : null}
          </div>

          {mode === "upload" ? (
            <div className="card col gap12">
              <div className="h4">Upload the filled-in template</div>
              <p className="small muted">Download the template, fill it in, then upload it. We read the figures and check them before you submit.</p>
              <div className="row">
                <Button variant="secondary" size="sm" icon="download-simple" onClick={downloadTemplate}>Download template (.xlsx)</Button>
              </div>
              <button type="button" className="drop" onClick={doUpload} data-test="ret-upload">
                <Tile icon="file-xls" tone="ok" size="sm" />
                <b className="small">Choose your file</b>
                <span className="cap muted">.xlsx or .csv · up to 10 MB</span>
              </button>
            </div>
          ) : (
            <div className="card col gap16" id="ret-form">
              {nErr ? <AlertBox tone="bad" title={`${nErr} problem${nErr > 1 ? "s" : ""} to fix before you submit`} body={Object.entries(errs).map(([k, m]) => `${t.fields.find((x) => x.key === k)!.label}: ${m}`).join(" · ")} /> : null}
              <div className="grid g2" style={{ gap: "16px 18px" }}>
                {t.fields.map((fd) => {
                  const v = draft[fd.key];
                  const p = pv ? pv.values[fd.key] : null;
                  const vr = fd.type === "number" ? variance(v, p) : null;
                  const q = openQ.find((x) => x.field === fd.key);
                  const hint = [fd.help, pv && fd.type === "number" && p != null ? `${pv.period}: ${fmtNum(p)}${vr != null && Math.abs(vr) >= VAR_FLAG ? ` · ${vr > 0 ? "+" : ""}${vr}%, add a note if this is right` : ""}` : ""].filter(Boolean).join(" · ");
                  return (
                    <div key={fd.key} style={fd.type === "text" ? { gridColumn: "1/-1" } : undefined}>
                      {q ? <div className="cap" style={{ color: "var(--warn-fg)", marginBottom: 4 }}>NITDA asked: {q.msg}</div> : null}
                      <Field label={`${fd.label}${fd.unit ? ` (${fd.unit})` : ""}`} htmlFor={`rv-${fd.key}`} optional={!fd.req} error={errs[fd.key]} hint={errs[fd.key] ? undefined : hint}>
                        <input
                          className="inp"
                          id={`rv-${fd.key}`}
                          type={fd.type === "date" ? "date" : fd.type === "number" ? "number" : "text"}
                          value={v ?? ""}
                          onChange={(e) => setField(fd.key, e.target.value)}
                          data-test={`rv-${fd.key}`}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
              {openQ.length ? (
                <Field label="Your reply to NITDA" htmlFor="rv-reply">
                  <textarea className="ta" id="rv-reply" rows={3} placeholder="Explain the change, or why the figure is right" value={reply} onChange={(e) => setReply(e.target.value)} data-test="rv-reply" />
                </Field>
              ) : null}
            </div>
          )}
          <div className="row end">
            <Button variant="secondary" onClick={doSaveDraft} testId="ret-draft">Save draft</Button>
            <Button icon="paper-plane-tilt" onClick={openSubmit} testId="ret-submit">{f.status === "Queried" ? "Resubmit" : "Check and submit"}</Button>
          </div>
        </div>
        <div className="col gap16">
          <div className="card col gap8">
            <div className="h4">About this return</div>
            <p className="small muted">{t.desc}</p>
            <Kv pairs={[["Period", f.period], ["Due", f.due], ["Grace period", `${graceOf(t)} days`], ["Template", `${t.code} ${t.version}`]]} />
          </div>
          <div className="card col gap8">
            <div className="h4">Before you submit</div>
            <p className="small muted">Someone must approve the return. You can approve it yourself if you are allowed to sign for {org?.name ?? "your organisation"}.</p>
            <p className="small muted">After you submit you get a receipt. You can&apos;t change a filed return unless NITDA queries it.</p>
          </div>
        </div>
      </div>

      <Dialog open={signOpen} onClose={() => setSignOpen(false)}>
        <div className="row"><Icon name="seal-check" /><h2 className="h3">{f.status === "Queried" ? "Resubmit return" : "Sign off and submit"}</h2></div>
        <p className="muted small">{t.name} · {f.period} to NITDA</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Prepared by" htmlFor="so-prep">
            <input className="inp" id="so-prep" value={ME} readOnly />
          </Field>
          <Field label="Approved by" htmlFor="so-appr" hint="The person who confirms the figures are right.">
            <select className="sel" id="so-appr" value={approver} onChange={(e) => setApprover(e.target.value)}>
              {(people.length ? people : [ME]).map((n) => <option key={n} value={n}>{n === ME ? `${n} (you)` : n}</option>)}
            </select>
          </Field>
          <label className="check">
            <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} data-test="so-decl" />
            <span>I confirm these figures are complete and correct to the best of my knowledge, and that {org?.name ?? "the organisation"} has approved them for filing.</span>
          </label>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setSignOpen(false)}>Cancel</Button>
          <Button icon="paper-plane-tilt" onClick={doSubmit} testId="so-submit">{f.status === "Queried" ? "Resubmit" : "Submit return"}</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
