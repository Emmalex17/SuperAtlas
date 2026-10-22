import actionTypesData from "./data/actionTypes.json";
import enfCasesData from "./data/enfCases.json";
import { ORGANISATIONS, catLabel, type Organisation, TENANT } from "./mockData";
import { CASES, SERIES, COMPLIANCE_SETTINGS, NC_OPEN, allFindings, effDue, progOf, fdOverdue, caseScore, compStatus, orgOverall, fcOf, latestResult, liveSeries, benchOf, avg, pct, fmtD, TODAY, type ProgrammeSeries, type Case } from "./cases";
import { FILINGS, tplOf, isFiled, retStatus } from "./returns";
import type { ScorecardData } from "@/components/Scorecard";

export type ActionType = { id: string; name: string; d: string; days: number; penalty: boolean; level: number };

export type EnfPenalty = { amount: number; paid?: boolean; ref?: string; paidAt?: string; proof?: [string, string] };
export type EnfDecision = { outcome: string; note: string; when: string; by: string };
export type EnfResponse = { kind: "accept" | "contest"; text: string; when: string; by: string };
export type EnfEvidence = { kind: "finding" | "result" | "return"; id: string; label: string };

export type EnforcementCase = {
  id: string;
  ref: string;
  org: string;
  type: string;
  status: "Awaiting sign-off" | "Notice issued" | "Response received" | "Awaiting payment" | "Closed" | "Escalated" | "Withdrawn";
  opened: string;
  issued?: string;
  respondBy?: string;
  reason: string;
  by: string;
  approver: string;
  from: "watchlist" | "manual";
  evidence: EnfEvidence[];
  timeline: [string, string, string][];
  response?: EnfResponse;
  decision?: EnfDecision;
  penalty?: EnfPenalty | null;
  notice?: { subject: string; body: string };
};

export const ACTION_TYPES = actionTypesData as unknown as ActionType[];
export const ENF_CASES = enfCasesData as unknown as EnforcementCase[];

export function atOf(id: string | undefined): ActionType {
  return ACTION_TYPES.find((t) => t.id === id) ?? ACTION_TYPES[0];
}

export function caseE(id: string | undefined): EnforcementCase | undefined {
  return ENF_CASES.find((c) => c.id === id);
}

export function naira(n: number | undefined): string {
  return `₦${Number(n || 0).toLocaleString("en-GB")}`;
}

export const OPEN_ENF = ["Awaiting sign-off", "Notice issued", "Response received", "Awaiting payment"];

export function enfOpenFor(org: string): EnforcementCase | undefined {
  return ENF_CASES.find((c) => c.org === org && OPEN_ENF.includes(c.status));
}

export const ENF_TONE: Record<string, "warn" | "info" | "neu" | "ai"> = {
  "Awaiting sign-off": "warn",
  "Notice issued": "info",
  "Response received": "warn",
  "Awaiting payment": "warn",
  Closed: "neu",
  Escalated: "ai",
  Withdrawn: "neu",
};

export function caseLog(c: EnforcementCase, what: string, who: string, today: string) {
  c.timeline.push([today, who, what]);
}

export type WatchReason = { rule: "overdue" | "cycles" | "returns" | "manual"; text: string; ev: EnfEvidence | null };
export type WatchEntry = { org: string; reasons: WatchReason[] };

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 864e5);
}

/** In-memory session additions/removals from the rule-computed watchlist (mirrors the prototype's S.watchManual / S.watchDismissed). */
const watchManual: { org: string; reason: string; by: string; when: string }[] = [];
const watchDismissed: Record<string, { sig: string }> = {};

export function watchlist(): WatchEntry[] {
  const cp = COMPLIANCE_SETTINGS;
  const out: Record<string, WatchEntry> = {};
  const add = (org: string, why: WatchReason) => {
    (out[org] ??= { org, reasons: [] }).reasons.push(why);
  };

  const days = +cp.watchDays;
  if (days > 0) {
    allFindings()
      .filter((x) => x.f.cls === "MaNC" && !["Closed", "Noted", "Verified fixed"].includes(x.f.status ?? "") && effDue(x.f) && daysBetween(effDue(x.f)!, TODAY) > days)
      .forEach((x) => add(x.c.org, { rule: "overdue", text: `Major nonconformity overdue by ${daysBetween(effDue(x.f)!, TODAY)} days: ${x.f.title}`, ev: { kind: "finding", id: x.f.id, label: `${x.f.cls}: ${x.f.title} (${progOf(x.c.prog).name})` } }));
  }

  const n = +cp.cyclesRunning;
  if (n > 0) {
    SERIES.forEach((sr) => {
      const b = +(cp.bench[sr.id] ?? 70);
      const orgs = [...new Set(CASES.filter((c) => progOf(c.prog).series === sr.id && c.stage === "Published").map((c) => c.org))];
      orgs.forEach((org) => {
        const res = CASES.filter((c) => c.org === org && c.stage === "Published" && c.score != null && progOf(c.prog).series === sr.id)
          .sort((a, c) => +progOf(c.prog).cycle - +progOf(a.prog).cycle)
          .slice(0, n);
        if (res.length === n && res.every((c) => (c.score ?? 0) < b)) {
          add(org, { rule: "cycles", text: `Below the ${sr.name} benchmark (${b}) in ${n} cycles running: ${res.map((c) => `${progOf(c.prog).cycle} scored ${c.score}`).join(", ")}`, ev: { kind: "result", id: res[0].id, label: `${progOf(res[0].prog).name}: score ${res[0].score}` } });
        }
      });
    });
  }

  const lr = +cp.lateRuns;
  if (lr > 0) {
    const keys = [...new Set(FILINGS.map((f) => `${f.org}|${f.tpl}`))];
    keys.forEach((k) => {
      const [org, tpl] = k.split("|");
      const fs = FILINGS.filter((f) => f.org === org && f.tpl === tpl && (isFiled(f) || f.due < TODAY))
        .sort((a, b) => b.pkey.localeCompare(a.pkey))
        .slice(0, lr);
      if (fs.length === lr && fs.every((f) => f.lateBy || retStatus(f) === "Late")) {
        add(org, { rule: "returns", text: `Late with ${tplOf(tpl).name} ${lr} periods running`, ev: { kind: "return", id: fs[0].id, label: `${tplOf(tpl).name} ${fs[0].period}` } });
      }
    });
  }

  watchManual.forEach((m) => add(m.org, { rule: "manual", text: `Added by ${m.by}: ${m.reason}`, ev: null }));

  return Object.values(out)
    .filter((w) => {
      const d = watchDismissed[w.org];
      if (!d) return true;
      const sig = w.reasons.filter((r) => r.rule !== "manual").map((r) => r.text).join("|");
      return d.sig !== sig;
    })
    .sort((a, b) => b.reasons.length - a.reasons.length || (ORGANISATIONS.find((o) => o.id === a.org)?.name ?? "").localeCompare(ORGANISATIONS.find((o) => o.id === b.org)?.name ?? ""));
}

/* ---- mutators ---- */

export function dismissFromWatchlist(org: string, reason: string, by: string, today: string) {
  const w = watchlist().find((x) => x.org === org);
  const sig = w ? w.reasons.filter((r) => r.rule !== "manual").map((r) => r.text).join("|") : "";
  watchDismissed[org] = { sig };
  const idx = watchManual.findIndex((m) => m.org === org);
  if (idx >= 0) watchManual.splice(idx, 1);
  void reason;
  void by;
  void today;
}

export function addToWatchlist(org: string, reason: string, by: string, today: string) {
  watchManual.push({ org, reason, by, when: today });
  delete watchDismissed[org];
}

let caseSeq = ENF_CASES.length + 1;

export function openEnfCase(org: string, type: string, respondBy: string, amount: string, approver: string, evidence: EnfEvidence[], today: string, byName: string, notice?: { subject: string; body: string }, from: "watchlist" | "manual" = "manual"): EnforcementCase {
  const t = atOf(type);
  const c: EnforcementCase = {
    id: `ec${caseSeq++}`,
    ref: `EC-2026-${String(ENF_CASES.length + 1).padStart(3, "0")}`,
    org,
    type,
    status: "Awaiting sign-off",
    opened: today,
    respondBy: respondBy || undefined,
    reason: evidence.map((e) => e.label).join("; "),
    by: byName,
    approver: approver || byName,
    from,
    evidence,
    timeline: [[today, byName, `Case opened and sent for sign-off to ${approver || byName}`]],
    penalty: t.penalty ? { amount: +amount || 0 } : null,
    notice,
  };
  ENF_CASES.unshift(c);
  return c;
}

/** Candidate evidence for a new case against an organisation: the reasons it's on the watchlist
 * (if any), plus any other open nonconformities, below-benchmark results, and late returns not
 * already covered — the prototype's enfEvidence(). */
export function enfEvidence(orgId: string): (EnfEvidence & { checked: boolean })[] {
  const items: (EnfEvidence & { checked: boolean })[] = [];
  const w = watchlist().find((x) => x.org === orgId);
  (w?.reasons ?? []).forEach((r) => {
    if (r.ev) items.push({ ...r.ev, checked: true });
  });
  allFindings()
    .filter((x) => x.c.org === orgId && NC_OPEN_ENF(x.f) && !items.some((i) => i.id === x.f.id))
    .forEach((x) => items.push({ kind: "finding", id: x.f.id, label: `${x.f.cls}: ${x.f.title} (${progOf(x.c.prog).name})`, checked: false }));
  CASES.filter((c) => c.org === orgId && c.stage === "Published" && c.score != null && c.score < benchOf(progOf(c.prog)) && !items.some((i) => i.id === c.id))
    .forEach((c) => items.push({ kind: "result", id: c.id, label: `${progOf(c.prog).name}: score ${c.score}`, checked: false }));
  FILINGS.filter((f) => f.org === orgId && retStatus(f) === "Late").forEach((f) => items.push({ kind: "return", id: f.id, label: `${tplOf(f.tpl).name} ${f.period}: late`, checked: false }));
  return items;
}
function NC_OPEN_ENF(f: { cls: string; status?: string }): boolean {
  return ["MaNC", "MiNC"].includes(f.cls) && !["Closed", "Noted"].includes(f.status ?? "");
}

/** Drafts the notice subject/body for a new case, from the organisation, action type and the
 * evidence ticked so far — the prototype's noticeText(). */
export function draftNotice(org: Organisation | undefined, type: ActionType, evidence: (EnfEvidence & { checked: boolean })[], respondBy: string, amount: string, byName: string): { subject: string; body: string } {
  const ev = evidence.filter((e) => e.checked);
  const subject = `${type.name}: ${org ? org.name : ""}`;
  const body = `Dear ${org ? org.officer || "Compliance officer" : ""},\n\n${TENANT.name} is issuing this ${type.name.toLowerCase()} because of the following:\n${ev.map((e) => `• ${e.label}`).join("\n") || "• (add the reasons)"}\n\n${type.penalty ? `A penalty of ${naira(+amount || 0)} applies. ` : ""}${type.days ? `Please respond by ${respondBy ? fmtD(respondBy) : "(date)"}: accept and send your fix plan, or contest with supporting documents.` : "No response is needed."}\n\n${byName}\n${TENANT.short}`;
  return { subject, body };
}

export function issueCase(c: EnforcementCase, today: string) {
  c.status = "Notice issued";
  c.issued = today;
  if (c.type === "referral") {
    c.status = "Closed";
    c.decision = { outcome: "Referred", note: "", when: today, by: c.approver };
  }
  caseLog(c, "Signed off and issued the notice", c.approver, today);
}

export function withdrawCase(c: EnforcementCase, today: string) {
  c.status = "Withdrawn";
  caseLog(c, "Withdrawn before issue", c.approver, today);
}

export function remindCase(c: EnforcementCase, today: string, byName: string) {
  caseLog(c, "Reminder sent", byName, today);
}

export function extendCase(c: EnforcementCase, newDate: string, today: string, byName: string) {
  c.respondBy = newDate;
  if (c.status === "Response received" && !c.penalty) c.status = "Notice issued";
  caseLog(c, `Deadline extended to ${newDate}`, byName, today);
}

export function decideCase(c: EnforcementCase, outcome: string, note: string, amount: string, today: string, byName: string) {
  c.decision = { outcome, note, when: today, by: byName };
  if (c.penalty && /confirmed|reduced/.test(outcome)) {
    c.penalty.amount = +amount || c.penalty.amount;
    c.status = "Awaiting payment";
    caseLog(c, `Penalty ${outcome === "Penalty reduced" ? `reduced to ${naira(c.penalty.amount)}` : "confirmed"}; waiting for payment`, byName, today);
  } else {
    c.status = "Closed";
    caseLog(c, `Closed: ${outcome.toLowerCase()}`, byName, today);
  }
}

export function recordPayment(c: EnforcementCase, ref: string, today: string, byName: string) {
  if (!c.penalty) return;
  c.penalty.paid = true;
  c.penalty.ref = ref;
  c.penalty.paidAt = today;
  c.status = "Closed";
  c.decision = { ...(c.decision ?? { outcome: "", note: "", when: today, by: byName }), outcome: "Penalty paid", when: today, by: byName };
  caseLog(c, `Payment of ${naira(c.penalty.amount)} recorded (${ref}); case closed`, byName, today);
}

export function escalateCase(c: EnforcementCase, nextTypeId: string, today: string, byName: string): EnforcementCase {
  const next = atOf(nextTypeId);
  c.status = "Escalated";
  c.decision = { outcome: `Escalated to ${next.name.toLowerCase()}`, note: "", when: today, by: byName };
  caseLog(c, `Escalated to ${next.name.toLowerCase()}`, byName, today);
  return openEnfCase(c.org, nextTypeId, "", "", c.approver, c.evidence, today, byName);
}

export function nextActionTypes(current: ActionType): ActionType[] {
  return ACTION_TYPES.filter((a) => a.level > current.level);
}

export function myEnfCases(orgId: string): EnforcementCase[] {
  return ENF_CASES.filter((c) => c.org === orgId && c.issued);
}

export function COMPLIANCE_WATCH_OFF(): boolean {
  return !(+COMPLIANCE_SETTINGS.watchDays > 0);
}

export function respondToCase(c: EnforcementCase, kind: "accept" | "contest", text: string, today: string, byName: string) {
  c.response = { kind, text, when: today, by: byName };
  c.status = "Response received";
  caseLog(c, kind === "accept" ? "Accepted with a fix plan" : "Contested with documents", byName, today);
}

export function uploadPaymentProof(c: EnforcementCase, today: string, byName: string) {
  if (!c.penalty) return;
  c.penalty.proof = [`Payment receipt ${c.ref}.pdf`, "120 KB"];
  caseLog(c, "Proof of payment uploaded", byName, today);
}

export function saveActionType(id: string | undefined, patch: Omit<ActionType, "id" | "level">) {
  if (id) {
    const a = ACTION_TYPES.find((x) => x.id === id);
    if (a) Object.assign(a, patch);
    return a;
  }
  const next: ActionType = { id: `at${ACTION_TYPES.length + 1}`, level: Math.max(0, ...ACTION_TYPES.map((a) => a.level)) + 1, ...patch };
  ACTION_TYPES.push(next);
  return next;
}

/* ================= Organisation compliance exposure =================
 * An organisation's own live programme series, and what could draw regulatory action against
 * it — the prototype's mySeries()/orgExposure() (c4.js). Lives here, not in cases.ts, because
 * it reads enforcement cases and cases.ts must not import this module (it's the other way round). */

export function mySeries(orgId: string): ProgrammeSeries[] {
  return liveSeries().filter((sr) => CASES.some((c) => c.org === orgId && progOf(c.prog).series === sr.id && c.stage === "Published"));
}

export type ExposureLevel = "High" | "Medium" | "Low";
export type ExposureItem = { lv: ExposureLevel; t: string; why: string; go: string };

export const LV_TONE: Record<ExposureLevel, "bad" | "warn" | "neu"> = { High: "bad", Medium: "warn", Low: "neu" };

export function orgExposure(orgId: string, perspective: "regulator" | "organisation" = "regulator"): ExposureItem[] {
  const out: ExposureItem[] = [];
  const add = (lv: ExposureLevel, t: string, why: string, go: string) => out.push({ lv, t, why, go });
  const caseGo = (c: EnforcementCase) => (perspective === "organisation" ? `/organisation/actions/${c.id}` : `/regulator/enforcement/${c.id}`);
  const findingGo = (f: { id: string }) => (perspective === "organisation" ? `/organisation/findings/${f.id}` : `/regulator/findings/${f.id}`);
  const seriesGo = (sid: string) => (perspective === "organisation" ? `/organisation/compliance/${encodeURIComponent(sid)}` : `/regulator/organisations/category/${encodeURIComponent(sid)}`);
  const returnGo = (f: { id: string }) => (perspective === "organisation" ? `/organisation/returns/${f.id}` : `/regulator/returns/${f.id}`);

  ENF_CASES.filter((c) => c.org === orgId && OPEN_ENF.includes(c.status) && c.issued).forEach((c) =>
    add("High", `Open regulatory notice ${c.ref}`, `${atOf(c.type).name}${c.respondBy ? ", respond by " + fmtD(c.respondBy) : ""}`, caseGo(c))
  );

  allFindings()
    .filter((x) => x.c.org === orgId && !["Closed", "Noted"].includes(x.f.status ?? "") && x.f.cls !== "OFI")
    .forEach((x) => {
      const f = x.f;
      const ov = fdOverdue(f, TODAY);
      if (f.cls === "MaNC" || ov) add("High", f.title, `${fcOf(f.cls).name}${ov ? ", fix overdue" : ""} · ${progOf(x.c.prog).name}`, findingGo(f));
      else if (f.cls === "MiNC") add("Medium", f.title, `Minor nonconformity, fix by ${fmtD(effDue(f))}`, findingGo(f));
      else add("Low", f.title, `Observation, fix by ${fmtD(effDue(f))}`, findingGo(f));
    });

  mySeries(orgId).forEach((sr) => {
    const c = latestResult(orgId, sr.id);
    if (!c) return;
    const st = compStatus(c);
    const b = +(COMPLIANCE_SETTINGS.bench[sr.id] ?? 70);
    if (st === "Non-compliant") add("High", `Non-compliant in ${sr.name}`, `Score ${c.score} against a benchmark of ${b}`, seriesGo(sr.id));
    else if (st === "Compliant with conditions")
      add("Medium", `Compliant with conditions in ${sr.name}`, c.score! < b ? `Score ${c.score} is below the benchmark of ${b}` : "A major nonconformity is still open", seriesGo(sr.id));
    progOf(c.prog)
      .qset.sections.filter((s) => s.on)
      .forEach((s) => {
        const v = caseScore(c, s.id);
        if (v != null && v < b && st !== "Non-compliant") add("Medium", `${s.name.replace(/^\d+\.\s*/, "")} below the benchmark`, `${v} in ${progOf(c.prog).name}`, seriesGo(sr.id));
      });
  });

  FILINGS.filter((f) => f.org === orgId && tplOf(f.tpl).status === "Active").forEach((f) => {
    const st = retStatus(f);
    if (st === "Late") add("High", `${tplOf(f.tpl).name} (${f.period}) not filed`, "Past the due date and the grace period", returnGo(f));
    else if (st === "Overdue") add("Medium", `${tplOf(f.tpl).name} (${f.period}) overdue`, "Inside the grace period", returnGo(f));
    else if (f.status === "Queried") add("Medium", `Query on ${tplOf(f.tpl).name} (${f.period})`, "Answer and resubmit", returnGo(f));
  });

  const rank: Record<ExposureLevel, number> = { High: 0, Medium: 1, Low: 2 };
  return out.sort((a, b) => rank[a.lv] - rank[b.lv]);
}

/* ---------- Peer (category) averages, anonymised and shown only with enough organisations ---------- */

export const PEER_MIN = 5;

function casesOfProg(progId: string): Case[] {
  return CASES.filter((c) => c.prog === progId);
}

/** The anonymised average score for other organisations of the same type in this programme —
 * only shown once at least PEER_MIN of them have a published result, the prototype's peerAvg(). */
export function peerAvg(orgId: string, progId: string): { a: number | null; n: number } {
  const type = ORGANISATIONS.find((o) => o.id === orgId)?.type;
  const sc = casesOfProg(progId).filter((c) => c.stage === "Published" && c.score != null && ORGANISATIONS.find((o) => o.id === c.org)?.type === type);
  return sc.length >= PEER_MIN ? { a: avg(sc.map((c) => c.score!)), n: sc.length } : { a: null, n: sc.length };
}

/** The anonymised category average for one section of this programme — the prototype's peerSec(). */
export function peerSec(orgId: string, progId: string, sectionId: string): number | null {
  const type = ORGANISATIONS.find((o) => o.id === orgId)?.type;
  const sc = casesOfProg(progId).filter((c) => c.stage === "Published" && ORGANISATIONS.find((o) => o.id === c.org)?.type === type);
  return sc.length >= PEER_MIN ? avg(sc.map((c) => caseScore(c, sectionId)).filter((v): v is number => v != null)) : null;
}

/** The printable/downloadable compliance scorecard for one organisation — shared by the regulator's
 * organisation profile and the organisation's own "Export scorecard" button on Compliance. */
export function buildOrgScorecard(org: Organisation): ScorecardData {
  const scSers = mySeries(org.id);
  const scFs = allFindings().filter((x) => x.c.org === org.id && x.f.cls !== "OFI");
  const scFl = FILINGS.filter((f) => f.org === org.id && (isFiled(f) || f.due < TODAY));
  return {
    title: org.name,
    sub: `Compliance scorecard · ${catLabel(org.type, org.tier)}`,
    kpis: [
      ["Overall status", orgOverall(org.id)],
      ["Open findings", scFs.filter((x) => !["Closed", "Noted"].includes(x.f.status ?? "")).length],
      ["Returns on time", scFl.length ? `${pct(scFl.filter((f) => isFiled(f) && !f.lateBy).length, scFl.length)}%` : "—"],
      ["Open enforcement cases", ENF_CASES.filter((c) => c.org === org.id && OPEN_ENF.includes(c.status)).length],
    ],
    head: ["Programme", "Cycle", "Score", "Benchmark", "Status", "Open nonconformities"],
    rows: scSers.map((sr) => {
      const c = latestResult(org.id, sr.id)!;
      return [sr.name, progOf(c.prog).cycle, c.score ?? "—", "", compStatus(c), (c.findings || []).filter(NC_OPEN).length];
    }),
    extra: ["Exposure", orgExposure(org.id, "organisation").slice(0, 8).map((e) => [e.t, e.lv, e.why] as [string, string, string])],
    file: `${org.initials}-scorecard-${TODAY}.csv`,
  };
}
