"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tabs, Tile, Button, AlertBox, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  RETURN_TEMPLATES,
  activeFilings,
  tplOf,
  retStatus,
  retRank,
  retOrgs,
  dueRule,
  graceOf,
  isFiled,
  RET_CARDS,
  RET_CHIP_TONE,
  remindFiling,
  TODAY,
  type Filing,
  type ReturnTemplate,
} from "@/lib/returns";
import { ORGANISATIONS, TEAM, catLabel } from "@/lib/mockData";

type Tab = "filings" | "templates" | "schedule";

function reviewers() {
  return TEAM.filter((t) => ["Reviewer", "Supervisor", "Admin"].includes(t.role) && t.status === "Active");
}

function RetChip({ f }: { f: Filing }) {
  const st = retStatus(f);
  return <Chip tone={RET_CHIP_TONE[st] ?? "neu"}>{st}</Chip>;
}

function dueLine(f: Filing): React.ReactNode {
  if (isFiled(f)) return <span className="cap muted">Filed {(f.filedAt || "").split(",")[0]}{f.lateBy ? ` · ${f.lateBy} day${f.lateBy > 1 ? "s" : ""} late` : ""}</span>;
  const n = Math.round((new Date(f.due + "T12:00:00").getTime() - new Date(TODAY + "T12:00:00").getTime()) / 864e5);
  if (n < 0) return <span className="cap" style={{ color: "var(--bad-fg)" }}>{-n} day{n === -1 ? "" : "s"} overdue</span>;
  if (n === 0) return <span className="cap" style={{ color: "var(--warn-fg)" }}>Due today</span>;
  if (n <= 7) return <span className="cap" style={{ color: "var(--warn-fg)" }}>{n === 1 ? "Due tomorrow" : `Due in ${n} days`}</span>;
  return <span className="cap muted">Due in {n} days</span>;
}

export default function ReturnsPage() {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("filings");
  const [fk, setFk] = useState("");
  const [tp, setTp] = useState("all");
  const [per, setPer] = useState("all");
  const [q, setQ] = useState("");
  const [escOpen, setEscOpen] = useState(false);
  const [escTo, setEscTo] = useState(reviewers()[0]?.name ?? "");
  const [escNote, setEscNote] = useState("Late with the Sep 2026 cyber incident return after reminders.");
  const [schedOpen, setSchedOpen] = useState<ReturnTemplate | null>(null);

  const active = RETURN_TEMPLATES.filter((t) => t.status === "Active");
  const pool = activeFilings();
  const late = pool.filter(RET_CARDS[3][3]);

  function orgOf(id: string) {
    return ORGANISATIONS.find((o) => o.id === id);
  }

  function doRemind(f: Filing) {
    remindFiling(f, "M. Bello", TODAY);
    bump();
    toast(`Reminder sent to ${orgOf(f.org)?.name}`, "ok", "bell-ringing");
  }

  function remindAll() {
    late.forEach((f) => remindFiling(f, "M. Bello", TODAY));
    bump();
    toast(`Reminders sent to ${late.length} organisation${late.length > 1 ? "s" : ""}`, "ok", "bell-ringing");
  }

  function escalateGo() {
    setEscOpen(false);
    toast(`Escalated to ${escTo || "supervision lead"}`, "ok", "arrow-fat-line-up");
  }

  let filingsBody: React.ReactNode = null;
  if (tab === "filings") {
    const pers = [...new Set(pool.filter((f) => tp === "all" || f.tpl === tp).map((f) => f.period))];
    const rows = pool
      .filter((f) => (!fk || RET_CARDS.find((c) => c[0] === fk)![3](f)) && (tp === "all" || f.tpl === tp) && (per === "all" || f.period === per) && (!q || (orgOf(f.org)?.name ?? "").toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => retRank(a) - retRank(b) || b.due.localeCompare(a.due) || (orgOf(a.org)?.name ?? "").localeCompare(orgOf(b.org)?.name ?? ""));

    filingsBody = (
      <div className="card p0">
        <div className="tbl-tools wrap">
          <div className="inp-wrap" style={{ width: 240 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search organisations" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="sel" style={{ width: "auto", maxWidth: 260 }} value={tp} onChange={(e) => { setTp(e.target.value); setPer("all"); }} aria-label="Return">
            <option value="all">All returns</option>
            {active.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="sel" style={{ width: "auto" }} value={per} onChange={(e) => setPer(e.target.value)} aria-label="Period">
            <option value="all">All periods</option>
            {pers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="grow" />
          {fk === "late" && rows.length ? (
            <>
              <Button variant="secondary" size="sm" icon="bell-ringing" onClick={remindAll} testId="ret-remind-all">Remind all ({rows.length})</Button>
              <Button variant="tertiary" size="sm" icon="arrow-fat-line-up" onClick={() => setEscOpen(true)}>Escalate</Button>
            </>
          ) : (
            <Button variant="tertiary" size="sm" icon="export" onClick={() => toast("Export started. You will get an email with the CSV file.")}>Export</Button>
          )}
        </div>
        <div className="tbl-sub">
          <div className="pills">
            <button className={`pill ${!fk ? "on" : ""}`} onClick={() => setFk("")}>All<span className="count">{pool.length}</span></button>
            {RET_CARDS.map(([k, l, , fn]) => (
              <button key={k} className={`pill ${fk === k ? "on" : ""}`} onClick={() => setFk(k)} data-test={`rf-${k}`}>{l}<span className="count">{pool.filter(fn).length}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Organisation</th><th>Return</th><th>Period</th><th>Due</th><th>Status</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((f) => {
                  const t = tplOf(f.tpl);
                  const o = orgOf(f.org);
                  const st = retStatus(f);
                  return (
                    <tr key={f.id} className="click" onClick={() => router.push(`/regulator/returns/${f.id}`)} data-test={`fil-${f.id}`}>
                      <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                      <td><div className="strong small">{t.name}</div><div className="cap mono muted">{t.code} {t.version}</div></td>
                      <td className="small">{f.period}</td>
                      <td className="small">{f.due}<div>{dueLine(f)}</div></td>
                      <td><RetChip f={f} />{f.reminders && !isFiled(f) ? <div className="cap muted" style={{ marginTop: 2 }}>{f.reminders} reminder{f.reminders > 1 ? "s" : ""} sent</div> : null}</td>
                      <td className="act-col" onClick={(e) => e.stopPropagation()}>
                        {["Submitted", "Resubmitted"].includes(f.status) ? (
                          <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/returns/${f.id}`)}>Review</Button>
                        ) : ["Late", "Overdue"].includes(st) ? (
                          <Button variant="tertiary" size="sm" icon="bell-ringing" onClick={() => doRemind(f)} testId={`remind-${f.id}`}>Remind</Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="table" size="lg" /><div className="h4">No filings match</div><p className="muted small">Change the filters to see more.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{rows.length} filing{rows.length === 1 ? "" : "s"}</div>
      </div>
    );
  } else if (tab === "templates") {
    filingsBody = (
      <div className="card p0">
        <div className="tbl-tools">
          <div className="grow">
            <div className="h4">Return templates</div>
            <div className="cap muted">Each template says what is filed, by whom and how often. Organisations fill it in online or upload the spreadsheet.</div>
          </div>
          <Button variant="secondary" size="sm" icon="upload-simple" testId="rt-upload">Upload a template</Button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Template</th><th>Frequency</th><th>Who files</th><th className="num">Fields</th><th>Built</th><th>Status</th><th className="act-col" /></tr></thead>
            <tbody>
              {RETURN_TEMPLATES.map((t) => (
                <tr key={t.id} data-test={`rt-${t.id}`}>
                  <td><div className="row gap8"><Tile icon="table" size="sm" /><div><div className="strong">{t.name}</div><div className="cap mono muted">{t.code} {t.version} · updated {t.updated}</div></div></div></td>
                  <td className="small">{t.freq}</td>
                  <td className="small wrap" style={{ maxWidth: 260 }}>{t.types.join(", ")}<div className="cap muted">{retOrgs(t)} organisations</div></td>
                  <td className="num tnum">{t.fields.length}</td>
                  <td className="small">{t.source === "Uploaded template" ? <><Icon name="file-xls" /> Uploaded</> : "Online"}</td>
                  <td><Chip tone={t.status === "Active" ? "ok" : "neu"}>{t.status}</Chip></td>
                  <td className="act-col"><Button variant="tertiary" size="sm" onClick={() => setSchedOpen(t)}>{t.status === "Draft" ? "Continue" : "Edit"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    filingsBody = (
      <div className="card p0">
        <div className="tbl-tools">
          <div className="grow">
            <div className="h4">Schedule and reminders</div>
            <div className="cap muted">When each return is due and when filers are reminded.</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Return</th><th>Frequency</th><th>Due</th><th>Grace period</th><th>Reminders</th><th>Next due</th><th className="act-col" /></tr></thead>
            <tbody>
              {active.map((t) => {
                const nx = pool.filter((f) => f.tpl === t.id && f.due >= TODAY).sort((a, b) => a.due.localeCompare(b.due))[0];
                return (
                  <tr key={t.id}>
                    <td><div className="strong small">{t.name}</div><div className="cap mono muted">{t.code}</div></td>
                    <td className="small">{t.freq}</td>
                    <td className="small">{dueRule(t)}</td>
                    <td className="small">{graceOf(t)} days{t.grace === "" ? <span className="cap muted"> (default)</span> : null}</td>
                    <td className="small">{t.reminders} days before</td>
                    <td className="small">{nx ? `${nx.due} (${nx.period})` : "—"}</td>
                    <td className="act-col"><Button variant="tertiary" size="sm" onClick={() => setSchedOpen(t)} testId={`sched-${t.id}`}>Edit</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Data returns" sub="Periodic figures filed straight to NITDA. No firm involved." actions={<Button icon="plus">New template</Button>} />
      <Tabs
        items={[
          { id: "filings", label: "Filings", count: pool.filter(RET_CARDS[1][3]).length || undefined },
          { id: "templates", label: "Templates", count: RETURN_TEMPLATES.length },
          { id: "schedule", label: "Schedule" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "filings" && late.length && !fk ? (
        <div style={{ margin: "16px 0" }}>
          <AlertBox tone="bad" title={`${late.length} filing${late.length > 1 ? "s are" : " is"} late`} body="Past the due date and the grace period. Remind them, or escalate to supervision." actions={<Button size="sm" variant="secondary" onClick={() => setFk("late")} testId="show-late">Show late filings</Button>} />
        </div>
      ) : null}
      <div style={{ marginTop: 16 }}>{filingsBody}</div>

      <Dialog open={escOpen} onClose={() => setEscOpen(false)}>
        <div className="row"><Icon name="arrow-fat-line-up" /><h2 className="h3">Escalate late filings</h2></div>
        <p className="muted small">Supervision leads are told and the late filings are flagged on each organisation&apos;s profile.</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Escalate to" htmlFor="esc-to">
            <select className="sel" id="esc-to" value={escTo} onChange={(e) => setEscTo(e.target.value)}>
              {reviewers().map((t) => <option key={t.name} value={t.name}>{t.name} · {t.role}</option>)}
            </select>
          </Field>
          <Field label="Note" htmlFor="esc-note">
            <textarea className="ta" id="esc-note" rows={3} value={escNote} onChange={(e) => setEscNote(e.target.value)} />
          </Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setEscOpen(false)}>Cancel</Button>
          <Button onClick={escalateGo} testId="esc-do">Escalate</Button>
        </div>
      </Dialog>

      <Dialog open={!!schedOpen} onClose={() => setSchedOpen(null)}>
        {schedOpen ? (
          <>
            <div className="row"><Icon name="calendar-blank" /><h2 className="h3">Schedule: {schedOpen.name}</h2></div>
            <p className="muted small">Changes apply from the next period. Filings already open keep their due date.</p>
            <div className="grid g2" style={{ gap: 14, marginTop: 16 }}>
              <Field label="Frequency" htmlFor="sc-freq"><select className="sel" id="sc-freq" defaultValue={schedOpen.freq}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></Field>
              <Field label={schedOpen.freq === "Monthly" ? "Due on day" : "Due, days after period end"} htmlFor="sc-due"><input className="inp" id="sc-due" type="number" defaultValue={schedOpen.dueDays} /></Field>
              <Field label="Grace period (days)" htmlFor="sc-grace" hint="Leave empty to use the default."><input className="inp" id="sc-grace" type="number" defaultValue={schedOpen.grace} /></Field>
              <Field label="Reminders, days before due" htmlFor="sc-rem"><input className="inp" id="sc-rem" defaultValue={schedOpen.reminders} /></Field>
            </div>
            <div className="row end" style={{ marginTop: 20 }}>
              <Button variant="tertiary" onClick={() => setSchedOpen(null)}>Cancel</Button>
              <Button
                testId="sched-save"
                onClick={() => {
                  const freq = (document.getElementById("sc-freq") as HTMLSelectElement).value as ReturnTemplate["freq"];
                  const due = +(document.getElementById("sc-due") as HTMLInputElement).value || schedOpen.dueDays;
                  const grace = (document.getElementById("sc-grace") as HTMLInputElement).value;
                  const rem = (document.getElementById("sc-rem") as HTMLInputElement).value;
                  Object.assign(schedOpen, { freq, dueDays: due, grace, reminders: rem });
                  setSchedOpen(null);
                  bump();
                  toast("Schedule saved");
                }}
              >
                Save schedule
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
