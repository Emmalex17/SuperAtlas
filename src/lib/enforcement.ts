import actionTypesData from "./data/actionTypes.json";
import enfCasesData from "./data/enfCases.json";
import { ORGANISATIONS } from "./mockData";
import { CASES, SERIES, COMPLIANCE_SETTINGS, allFindings, effDue, progOf, fdOverdue, caseScore, compStatus, fcOf, latestResult, liveSeries, fmtD, TODAY, type ProgrammeSeries } from "./cases";
import { FILINGS, tplOf, isFiled, retStatus } from "./returns";

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

export function openEnfCase(org: string, type: string, respondBy: string, amount: string, approver: string, evidence: EnfEvidence[], today: string, byName: string): EnforcementCase {
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
    from: "manual",
    evidence,
    timeline: [[today, byName, "Case opened"]],
    penalty: t.penalty ? { amount: +amount || 0 } : null,
  };
  ENF_CASES.unshift(c);
  return c;
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

export function orgExposure(orgId: string): ExposureItem[] {
  const out: ExposureItem[] = [];
  const add = (lv: ExposureLevel, t: string, why: string, go: string) => out.push({ lv, t, why, go });

  ENF_CASES.filter((c) => c.org === orgId && OPEN_ENF.includes(c.status) && c.issued).forEach((c) =>
    add("High", `Open regulatory notice ${c.ref}`, `${atOf(c.type).name}${c.respondBy ? ", respond by " + fmtD(c.respondBy) : ""}`, `/regulator/enforcement/${c.id}`)
  );

  allFindings()
    .filter((x) => x.c.org === orgId && !["Closed", "Noted"].includes(x.f.status ?? "") && x.f.cls !== "OFI")
    .forEach((x) => {
      const f = x.f;
      const ov = fdOverdue(f, TODAY);
      if (f.cls === "MaNC" || ov) add("High", f.title, `${fcOf(f.cls).name}${ov ? ", fix overdue" : ""} · ${progOf(x.c.prog).name}`, `/regulator/findings/${f.id}`);
      else if (f.cls === "MiNC") add("Medium", f.title, `Minor nonconformity, fix by ${fmtD(effDue(f))}`, `/regulator/findings/${f.id}`);
      else add("Low", f.title, `Observation, fix by ${fmtD(effDue(f))}`, `/regulator/findings/${f.id}`);
    });

  mySeries(orgId).forEach((sr) => {
    const c = latestResult(orgId, sr.id);
    if (!c) return;
    const st = compStatus(c);
    const b = +(COMPLIANCE_SETTINGS.bench[sr.id] ?? 70);
    if (st === "Non-compliant") add("High", `Non-compliant in ${sr.name}`, `Score ${c.score} against a benchmark of ${b}`, `/regulator/organisations/category/${encodeURIComponent(sr.id)}`);
    else if (st === "Compliant with conditions")
      add("Medium", `Compliant with conditions in ${sr.name}`, c.score! < b ? `Score ${c.score} is below the benchmark of ${b}` : "A major nonconformity is still open", `/regulator/organisations/category/${encodeURIComponent(sr.id)}`);
    progOf(c.prog)
      .qset.sections.filter((s) => s.on)
      .forEach((s) => {
        const v = caseScore(c, s.id);
        if (v != null && v < b && st !== "Non-compliant") add("Medium", `${s.name.replace(/^\d+\.\s*/, "")} below the benchmark`, `${v} in ${progOf(c.prog).name}`, `/regulator/organisations/category/${encodeURIComponent(sr.id)}`);
      });
  });

  FILINGS.filter((f) => f.org === orgId && tplOf(f.tpl).status === "Active").forEach((f) => {
    const st = retStatus(f);
    if (st === "Late") add("High", `${tplOf(f.tpl).name} (${f.period}) not filed`, "Past the due date and the grace period", `/regulator/returns/${f.id}`);
    else if (st === "Overdue") add("Medium", `${tplOf(f.tpl).name} (${f.period}) overdue`, "Inside the grace period", `/regulator/returns/${f.id}`);
    else if (f.status === "Queried") add("Medium", `Query on ${tplOf(f.tpl).name} (${f.period})`, "Answer and resubmit", `/regulator/returns/${f.id}`);
  });

  const rank: Record<ExposureLevel, number> = { High: 0, Medium: 1, Low: 2 };
  return out.sort((a, b) => rank[a.lv] - rank[b.lv]);
}
