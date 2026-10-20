"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tabs, Field, AlertBox, Tile, Button } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { CASES, progOf, caseScore, fmtD, assignReviewer, publishOrScheduleSelected, type Case } from "@/lib/cases";
import { ORGANISATIONS, FIRMS, TEAM, catLabel } from "@/lib/mockData";

const TODAY = "2026-10-19";

type TabId = "queue" | "approved" | "scheduled" | "held" | "published" | "tracker";
const REV_TABS: { id: TabId; label: string; match: (c: Case) => boolean }[] = [
  { id: "queue", label: "Review queue", match: (c) => c.stage === "Report submitted" || c.stage === "In review" },
  { id: "approved", label: "Approved", match: (c) => c.stage === "Approved" },
  { id: "scheduled", label: "Scheduled", match: (c) => c.stage === "Scheduled" },
  { id: "held", label: "Held back", match: (c) => c.stage === "Held back" },
  { id: "published", label: "Published", match: (c) => c.stage === "Published" },
  { id: "tracker", label: "Tracker", match: (c) => ["Approved", "Scheduled", "Held back", "Published"].includes(c.stage) },
];
const SUB: Record<TabId, string> = {
  queue: "Reports submitted by firms. Assign a reviewer, then confirm, return or change outcomes.",
  approved: "Approved reports. Publish now, or schedule a date.",
  scheduled: "Reports that publish automatically on their date.",
  held: "Reports that were not approved when publishing was scheduled. They publish once approved.",
  published: "Organisations can see these reports and their findings.",
  tracker: "Every approved report and what happened to it, including who has opened theirs.",
};
const EMPTY_ICON: Record<TabId, string> = { queue: "stamp", approved: "check-circle", scheduled: "calendar-blank", held: "pause-circle", published: "seal-check", tracker: "list-checks" };

function reviewers() {
  return TEAM.filter((t) => ["Reviewer", "Supervisor", "Admin"].includes(t.role) && t.status === "Active");
}

export default function ReviewsPage() {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<TabId>("queue");
  const [progFilter, setProgFilter] = useState("All");
  const [sel, setSel] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPick, setAssignPick] = useState("");
  const [pubMode, setPubMode] = useState<"now" | "schedule" | null>(null);
  const [pubDate, setPubDate] = useState("2026-10-31");
  const [pubHold, setPubHold] = useState(true);

  const def = REV_TABS.find((t) => t.id === tab)!;
  const all = CASES.filter((c) => progFilter === "All" || c.prog === progFilter);
  const rows = all.filter(def.match);
  const selRows = sel.filter((id) => rows.some((c) => c.id === id));
  const countFor = (id: TabId) => all.filter(REV_TABS.find((t) => t.id === id)!.match).length;

  const progs = [...new Set(CASES.filter((c) => REV_TABS[5].match(c) || REV_TABS[0].match(c)).map((c) => c.prog))];

  function changeTab(t: TabId) {
    setTab(t);
    setSel([]);
  }
  function toggleSel(id: string) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function selectAll() {
    setSel((s) => (s.length === rows.length ? [] : rows.map((c) => c.id)));
  }

  function assignGo() {
    if (!assignPick) return;
    assignReviewer(selRows, assignPick);
    const n = selRows.length;
    setSel([]);
    setAssignOpen(false);
    bump();
    toast(`${n} report${n === 1 ? "" : "s"} assigned to ${assignPick}`, "ok", "user-plus");
  }

  function pubGo() {
    if (!pubMode) return;
    if (pubMode === "schedule" && (!pubDate || pubDate <= TODAY)) {
      toast("Choose a date after today", "bad");
      return;
    }
    const n = selRows.length;
    const { held } = publishOrScheduleSelected(selRows, pubMode, TODAY, pubDate, pubHold);
    if (pubMode === "now") {
      toast(`${n} report${n === 1 ? "" : "s"} published`, "ok", "paper-plane-tilt");
      setTab("published");
    } else {
      toast(`${n} scheduled for ${fmtD(pubDate)}${held ? `. ${held} held back until approved.` : ""}`, "ok", "calendar-blank");
      setTab(held ? "held" : "scheduled");
    }
    setSel([]);
    setPubMode(null);
    bump();
  }

  const pendingForSchedule = (() => {
    const cs = selRows.map((id) => CASES.find((c) => c.id === id)!);
    const progsSel = [...new Set(cs.map((c) => c.prog))];
    return CASES.filter((c) => progsSel.includes(c.prog) && ["Report submitted", "In review", "Returned", "Assessing", "Submitted", "In preview", "Signed off", "Answering"].includes(c.stage));
  })();

  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Reviews & publishing" sub="Check each firm's report, approve it, then publish it to the organisation." />
      <div className="card p0">
        <Tabs items={REV_TABS.map((t) => ({ id: t.id, label: t.label, count: countFor(t.id) }))} active={tab} onChange={changeTab} />
        <div className="tbl-tools wrap">
          <select className="sel" style={{ width: 280, height: 36 }} value={progFilter} onChange={(e) => { setProgFilter(e.target.value); setSel([]); }}>
            <option value="All">All programmes</option>
            {progs.map((id) => <option key={id} value={id}>{progOf(id).name}</option>)}
          </select>
          <span className="small muted grow">{SUB[tab]}</span>
          {selRows.length ? <span className="small strong">{selRows.length} selected</span> : null}
          {tab === "queue" ? (
            <Button size="sm" icon="user-plus" disabled={!selRows.length} onClick={() => setAssignOpen(true)} testId="rev-assign">Assign reviewer</Button>
          ) : null}
          {tab === "approved" ? (
            <>
              <Button variant="outline" size="sm" icon="calendar-blank" disabled={!selRows.length} onClick={() => setPubMode("schedule")} testId="pub-schedule">Schedule</Button>
              <Button size="sm" icon="paper-plane-tilt" disabled={!selRows.length} onClick={() => setPubMode("now")} testId="pub-now">{selRows.length ? `Publish ${selRows.length} now` : "Publish now"}</Button>
            </>
          ) : null}
          {tab === "held" ? (
            <Button variant="outline" size="sm" onClick={() => changeTab("queue")}>Review held reports</Button>
          ) : null}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {["queue", "approved"].includes(tab) ? (
                  <th style={{ width: 36 }}><input type="checkbox" checked={!!selRows.length && selRows.length === rows.length} onChange={selectAll} aria-label="Select all" /></th>
                ) : null}
                <th>Organisation</th>
                <th>Programme</th>
                <th>Firm</th>
                <th className="num">Score</th>
                {tab === "queue" ? <><th>Reviewer</th><th>Submitted</th></> : null}
                {tab === "tracker" ? <><th>Status</th><th>Opened by organisation</th></> : null}
                {tab === "scheduled" ? <th>Publishes</th> : null}
                {tab === "held" ? <th>Why held</th> : null}
                {tab === "published" ? <><th>Published</th><th>Opened</th></> : null}
                {tab === "approved" ? <th>Approved</th> : null}
                <th className="act-col" />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((c) => {
                  const o = ORGANISATIONS.find((x) => x.id === c.org);
                  const p = progOf(c.prog);
                  const f = FIRMS.find((x) => x.id === c.firm);
                  const sc = c.score ?? caseScore(c);
                  return (
                    <tr key={c.id} className="click" onClick={() => router.push(`/regulator/reviews/${c.id}`)} data-test={`rev-${c.id}`}>
                      {["queue", "approved"].includes(tab) ? (
                        <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.includes(c.id)} onChange={() => toggleSel(c.id)} aria-label={`Select ${o?.name}`} data-test={`rsel-${c.id}`} /></td>
                      ) : null}
                      <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                      <td className="small">{p.name}{p.publisher === "firm" ? <div className="cap muted">Publishing delegated to firm</div> : null}</td>
                      <td className="small">{f ? f.name : "—"}</td>
                      <td className="num"><b className="serif">{sc ?? "—"}</b></td>
                      {tab === "queue" ? (
                        <>
                          <td className="small">{c.reviewer ? <div className="row gap6"><span className="av s20">{c.reviewer.split(" ").map((x) => x[0]).join("")}</span>{c.reviewer}</div> : <span className="cap" style={{ color: "var(--warn-fg)" }}>Not assigned</span>}</td>
                          <td className="small muted">{c.reportAt || "—"}</td>
                        </>
                      ) : null}
                      {tab === "tracker" ? (
                        <>
                          <td><Chip tone="neu">{c.stage}</Chip>{c.pubAt && c.stage === "Scheduled" ? <div className="cap muted">{fmtD(c.pubAt)}</div> : null}</td>
                          <td className="small">{c.stage === "Published" ? (c.opened ? <Chip tone="ok" icon="eye">Opened {c.openedAt || ""}</Chip> : <Chip tone="neu">Not opened yet</Chip>) : "—"}</td>
                        </>
                      ) : null}
                      {tab === "scheduled" ? <td className="small">{fmtD(c.pubAt)}</td> : null}
                      {tab === "held" ? <td className="small wrap">{c.holdReason || "Not approved in time"}</td> : null}
                      {tab === "published" ? (
                        <>
                          <td className="small muted">{c.published || ""}</td>
                          <td>{c.opened ? <Chip tone="ok" icon="eye">Opened</Chip> : <Chip tone="neu">Not yet</Chip>}</td>
                        </>
                      ) : null}
                      {tab === "approved" ? <td className="small muted">{c.approved?.when || ""}{c.approved?.by ? ` · ${c.approved.by}` : ""}</td> : null}
                      <td className="act-col"><Icon name="caret-right" /></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon={EMPTY_ICON[tab]} size="lg" />
                      <div className="h4">Nothing here</div>
                      <p className="muted small">{tab === "queue" ? "Reports appear when firms submit them." : "No reports in this list yet."}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <div className="row"><Icon name="user-plus" /><h2 className="h3">Assign a reviewer</h2></div>
        <p className="muted small">{selRows.length} report{selRows.length === 1 ? "" : "s"}. The reviewer gets an email and the reports appear in their queue.</p>
        <div className="col gap8">
          {reviewers().map((t) => (
            <label key={t.name} className={`choice ${assignPick === t.name ? "on" : ""}`}>
              <input type="radio" name="rv" className="sr" checked={assignPick === t.name} onChange={() => setAssignPick(t.name)} />
              <span className="radio" />
              <span className="av">{t.initials}</span>
              <span className="grow"><b>{t.name}</b><br /><span className="cap muted">{t.role} · {t.portfolio}</span></span>
              <span className="cap muted">{CASES.filter((c) => c.reviewer === t.name && c.stage === "In review").length} in review</span>
            </label>
          ))}
        </div>
        <div className="row end">
          <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button onClick={assignGo} testId="ra-go">Assign</Button>
        </div>
      </Dialog>

      <Dialog open={pubMode !== null} onClose={() => setPubMode(null)} wide>
        <div className="row"><Icon name={pubMode === "now" ? "paper-plane-tilt" : "calendar-blank"} /><h2 className="h3">{pubMode === "now" ? "Publish now" : "Schedule publishing"}</h2></div>
        <p className="muted small">{selRows.length} approved report{selRows.length === 1 ? "" : "s"}. Organisations are emailed and see their report and findings.</p>
        <div className="col gap12">
          {pubMode === "schedule" ? (
            <>
              <Field label="Publish on" hint="Reports publish at 09:00 WAT on this date." htmlFor="pub-d">
                <input className="inp" id="pub-d" type="date" value={pubDate} onChange={(e) => setPubDate(e.target.value)} />
              </Field>
              {pendingForSchedule.length ? (
                <>
                  <AlertBox tone="warn" title={`${pendingForSchedule.length} report${pendingForSchedule.length === 1 ? " is" : "s are"} not approved yet`} body="They will be held back, not published, and listed under Held back until you approve them." />
                  <label className="choice on" style={{ cursor: "pointer" }}>
                    <input type="checkbox" className="sr" checked={pubHold} onChange={(e) => setPubHold(e.target.checked)} />
                    <span className="radio" style={{ borderRadius: 6 }} />
                    <span className="grow">Include them in this schedule (held until approved)</span>
                  </label>
                </>
              ) : null}
            </>
          ) : null}
          <div className="card flat tight">
            {selRows.map((id) => {
              const c = CASES.find((x) => x.id === id)!;
              const o = ORGANISATIONS.find((x) => x.id === c.org);
              return (
                <div className="row small" style={{ padding: "4px 0" }} key={id}>
                  <span className="av s20" style={{ background: o?.color }}>{o?.initials}</span>
                  <span className="grow">{o?.name}</span>
                  <span className="cap muted">{progOf(c.prog).name}</span>
                </div>
              );
            })}
          </div>
          <div className="row end">
            <Button variant="outline" onClick={() => setPubMode(null)}>Cancel</Button>
            <Button onClick={pubGo} testId="pub-go">{pubMode === "now" ? "Publish" : "Schedule"}</Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
