import regsData from "./data/regs.json";
import programmesData from "./data/programmes.json";
import casesData from "./data/cases.json";
import evidenceData from "./data/evidence.json";
import findingClassesData from "./data/findingClasses.json";
import ratingsData from "./data/ratings.json";
import seriesData from "./data/series.json";
import complianceData from "./data/compliance.json";
import schemesData from "./data/schemes.json";
import deadlinesData from "./data/deadlines.json";
import { ORGANISATIONS } from "./mockData";

/** A requirement's raw question, as the regulation text states it: the question itself, plus a hint describing the expected kind of answer (e.g. "Yes / No / Not applicable", "Date", "Short text"). */
export type RawQuestion = [string, string];

export type RegRequirement = {
  ref: string;
  t: string;
  text: string;
  guidance?: string;
  weight?: string;
  evidence?: string[];
  questions: RawQuestion[];
};

export type RegSection = { id: string; name: string; reqs: RegRequirement[] };

export type Regulation = {
  id: string;
  ref: string;
  name: string;
  category: string;
  version: string;
  effective: string;
  updated: string;
  status: string;
  file: string;
  applies: string[];
  desc: string;
  sections: RegSection[];
};

/** A question as it appears inside a programme's own (editable) copy of the regulation: the raw [question, hint] pair normalised into an addressable object, `id` being `${requirementRef}#${index}`. */
export type Question = { id: string; text: string; hint: string };

export type Requirement = {
  ref: string;
  t: string;
  text: string;
  guidance?: string;
  weight?: string;
  evidence?: string[];
  questions: Question[];
};

export type Section = { id: string; name: string; on: boolean; reqs: Requirement[] };

export type QSet = { ver: string; sections: Section[] };

export type Programme = {
  id: string;
  name: string;
  reg: string;
  status: "Draft" | "Scheduled" | "Open" | "In review" | "Closed";
  opens: string;
  closes: string;
  created: string;
  types: string[];
  desc: string;
  locked?: string;
  firmMode: "regulator" | "organisation";
  preview: boolean;
  publisher: "regulator" | "firm";
  by: string;
  scheme: string;
  reminders: unknown;
  escalate: unknown;
  exclude?: string[];
  series: string;
  cycle: string;
  published?: string;
  edited?: number;
  qset: QSet;
  ver: string;
  activity: [string, string, string][];
};

/** A programme series is the recurring assessment (e.g. "ISR annual assessment"); each year's run is one Programme ("cycle") sharing the series id. */
export type ProgrammeSeries = { id: string; name: string; reg: string; freq: "Yearly" | "One-off" };

export type ComplianceSettings = { bench: Record<string, number>; watchDays: string; cyclesRunning: string; lateRuns: string };

export type ScoringScheme = {
  id: string;
  name: string;
  def?: boolean;
  kind: string;
  used: number;
  levels: [string, number | null, "ok" | "warn" | "bad" | "neu"][];
  bands: [string, number][];
};

export type Deadlines = { window: string; reminders: string; escalate: string; inviteExpiry: string; returnsGrace: string; tz: string; digest: string };

export type QuestionChoice = "yn" | "text" | "number" | "date";

export type CaseAnswer = {
  status: string;
  by: string;
  when: string;
  v?: string;
  comment?: string;
  files?: [string, string][];
  link?: string;
  interview?: string;
  flag?: boolean;
  assignee?: string;
};

export type CaseOutcome = { o: string; note: string; override?: { by: string; reason: string } };

export type RemediationPlan = { action: string; owner: string; target: string; steps: [string, boolean][] };
export type RemediationVerify = { by: string; when: string; ok: boolean; note: string };
export type RemediationClosed = { by: string; when: string };

export type CaseFinding = {
  id: string;
  ref: string;
  cls: string;
  title: string;
  due: string;
  status?: string;
  detail?: string;
  plan?: RemediationPlan;
  proof?: [string, string][];
  updates?: [string, string, string][];
  verify?: RemediationVerify;
  closed?: RemediationClosed;
  closedDate?: string;
  ext?: { status: "Requested" | "Approved" | "Declined"; date: string; reason: string; by: string; when: string };
};

export type ReqFirmRequest = { name: string; contact: string; reason: string; file: string; creds: string; when: string; by: string };

export type Case = {
  id: string;
  prog: string;
  org: string;
  firm: string;
  firmStatus: string;
  team: string[];
  lead: string;
  answers: Record<string, CaseAnswer>;
  assign: Record<string, string>;
  outcomes: Record<string, CaseOutcome>;
  findings: CaseFinding[];
  threads: unknown[];
  interviews: { at?: string }[];
  stage: string;
  due: string;
  reqFirm?: ReqFirmRequest;
  declineNote?: string;
  submitted?: string;
  submittedBy?: string;
  receipt?: string;
  subDate?: string;
  reportAt?: string;
  reportDays?: number;
  pubAt?: string;
  holdReason?: string;
  returnNote?: string;
  score?: number;
  published?: string;
  opened?: boolean;
  openedAt?: string;
  reviewer?: string;
  approved?: { by: string; when: string };
  signed?: { by: string; when: string };
};

export type Evidence = { id: string; org: string; name: string; size: string; kind: string; by: string; when: string; expires: string; links: string[] };

export type FindingClass = { code: string; name: string; d: string; days: number; tone: "bad" | "warn" | "info" | "neu" };

export type Rating = { id: string; firm: string; org: string; case: string; stars: number; comment: string; when: string };

export const REGS = regsData as unknown as Regulation[];
export const PROGRAMMES = programmesData as unknown as Programme[];
export const CASES = casesData as unknown as Case[];
export const EVIDENCE = evidenceData as unknown as Evidence[];
export const FINDING_CLASSES = findingClassesData as unknown as FindingClass[];
export const RATINGS = ratingsData as unknown as Rating[];
export const SERIES = seriesData as unknown as ProgrammeSeries[];
export const COMPLIANCE_SETTINGS = complianceData as unknown as ComplianceSettings;
export const SCHEMES = schemesData as unknown as ScoringScheme[];
export const DEADLINES = deadlinesData as unknown as Deadlines;

/** The prototype's fixed "today" — all its seed data (due dates, "X days ago" activity, etc.) is written relative to this date. */
export const TODAY = "2026-10-19";

export function schemeOf(id: string): ScoringScheme {
  return SCHEMES.find((s) => s.id === id) ?? SCHEMES[0];
}

function reqWeight(w: string | undefined): number {
  if (w && /High/.test(w)) return 3;
  if (w && /Low/.test(w)) return 1;
  return 2;
}

/** A case's overall (or single-section) score: the weighted average of its scored outcomes on the programme's scoring scheme, or null if nothing is scored yet. */
export function caseScore(c: Case, onlySec?: string): number | null {
  const p = progOf(c.prog);
  const sch = schemeOf(p.scheme);
  let num = 0;
  let den = 0;
  qsetReqs(p.qset)
    .filter((r) => !onlySec || r.sec === onlySec)
    .forEach((r) => {
      const o = c.outcomes[r.ref];
      if (!o) return;
      const lv = sch.levels.find((l) => l[0] === o.o);
      if (!lv || lv[1] === null) return;
      num += lv[1] * reqWeight(r.weight);
      den += reqWeight(r.weight);
    });
  return den ? Math.round(num / den) : null;
}

export function bandOf(sch: ScoringScheme, sc: number | null | undefined): string {
  if (sc == null) return "—";
  return (sch.bands.find((b) => sc >= b[1]) ?? sch.bands[sch.bands.length - 1])[0];
}

export function outTone(sch: ScoringScheme, o: string | undefined): "ok" | "warn" | "bad" | "neu" {
  const lv = sch.levels.find((l) => l[0] === o);
  return lv ? lv[2] : "neu";
}

export const PROG_STATUSES = ["Draft", "Scheduled", "Open", "In review", "Closed"] as const;

export function fmtD(d: string | undefined): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function regOf(id: string): Regulation {
  return REGS.find((r) => r.id === id) ?? REGS[0];
}

export function regOfProg(p: Programme): Regulation {
  return REGS.find((r) => r.id === p.reg) ?? REGS[0];
}

export function progOf(id: string | undefined): Programme {
  return PROGRAMMES.find((p) => p.id === id) ?? PROGRAMMES[0];
}

/** All cycles (Programme runs) of a series, most recent cycle first. */
export function cyclesOf(seriesId: string): Programme[] {
  return PROGRAMMES.filter((p) => p.series === seriesId).sort((a, b) => String(b.cycle).localeCompare(String(a.cycle)));
}

/** The cycle a series is "on" right now: the open/in-review one if there is one, else its most recent cycle. */
export function currentCycle(seriesId: string): Programme | undefined {
  const cs = cyclesOf(seriesId);
  return cs.find((p) => p.status === "Open" || p.status === "In review") ?? cs[0];
}

export function casesOf(progId: string): Case[] {
  return CASES.filter((c) => c.prog === progId);
}

export function caseOf(id: string | undefined): Case | undefined {
  return CASES.find((c) => c.id === id);
}

export function qsetQs(qs: QSet): (Question & { ref: string; sec: string })[] {
  return qs.sections
    .filter((s) => s.on)
    .flatMap((s) => s.reqs.flatMap((r) => r.questions.map((q) => ({ ...q, ref: r.ref, sec: s.id }))));
}

export function qsetReqs(qs: QSet): (Requirement & { sec: string; secName: string })[] {
  return qs.sections.filter((s) => s.on).flatMap((s) => s.reqs.map((r) => ({ ...r, sec: s.id, secName: s.name })));
}

/** Organisations a programme applies to: verified orgs of a matching type, minus any explicit exclusions. */
export function scopeOrgs(p: Programme) {
  return ORGANISATIONS.filter((o) => o.status === "Verified" && p.types.includes(o.type) && !(p.exclude ?? []).includes(o.id));
}

export function fcOf(code: string): FindingClass {
  return FINDING_CLASSES.find((f) => f.code === code) ?? FINDING_CLASSES[0];
}

export function myCases(orgId: string): Case[] {
  return CASES.filter((c) => c.org === orgId && progOf(c.prog).status !== "Draft");
}

export function myEngs(firmId: string): Case[] {
  return CASES.filter((c) => c.firm === firmId);
}

export function seriesOf(p: Programme): ProgrammeSeries | undefined {
  return SERIES.find((s) => s.id === p.series);
}

/** The programme-level questions a case's organisation must answer. */
export function caseQs(c: Case) {
  return qsetQs(progOf(c.prog).qset);
}

/** Percentage of a case's questions that have been answered. */
export function caseProgress(c: Case): number {
  const qs = caseQs(c);
  if (!qs.length) return 0;
  const n = qs.filter((q) => c.answers[q.id]?.status === "answered").length;
  return Math.round((n / qs.length) * 100);
}

/** The five broad pipeline groups a case's stage falls into, for the programme overview funnel. */
export function stageGroups(tenantShort: string): [string, string[]][] {
  return [
    ["Needs a firm", ["Firm to assign", "Firm to choose", "Firm approval", "Awaiting firm"]],
    ["Answering", ["Answering"]],
    ["With the firm", ["Submitted", "Assessing", "In preview", "Signed off"]],
    [`With ${tenantShort}`, ["Report submitted", "In review", "Returned", "Approved", "Scheduled", "Held back"]],
    ["Published", ["Published"]],
  ];
}

/** Progress stats for a programme: how many of its scoped organisations have reached a "done" stage. */
const DONE_STAGES = new Set(["Submitted", "Report submitted", "Approved", "Signed off", "Published"]);
export function progStats(p: Programme): { n: number; done: number; pct: number } {
  const scoped = scopeOrgs(p);
  const cases = casesOf(p.id);
  const n = scoped.length;
  const done = cases.filter((c) => DONE_STAGES.has(c.stage)).length;
  return { n, done, pct: n ? Math.round((done / n) * 100) : 0 };
}

/* ================= Mutators =================
 * CASES (and the other data arrays in this module) are an in-memory mock store shared across
 * the whole client session, mirroring the prototype's own global-state-plus-render() model.
 * These functions are the only place that writes to it; callers re-render by bumping their own
 * local tick state afterwards. Keeping the writes here (rather than inline in components) is
 * also why the mutation itself doesn't trip the React compiler's render-purity lint rule — it
 * isn't reachable from a component's render path. */

export function assignReviewer(ids: string[], reviewerName: string) {
  ids.map((id) => caseOf(id)).forEach((c) => {
    if (!c) return;
    c.reviewer = reviewerName;
    c.stage = "In review";
  });
}

export function approveCase(c: Case, reviewerName: string, today: string) {
  c.reviewer = reviewerName || c.reviewer;
  c.approved = { by: reviewerName, when: fmtD(today) };
  c.score = caseScore(c) ?? c.score;
  if (c.stage === "Held back") {
    c.stage = "Scheduled";
    c.holdReason = "";
  } else {
    c.stage = "Approved";
  }
}

export function returnCase(c: Case, reviewerName: string, note: string) {
  c.reviewer = reviewerName || c.reviewer;
  c.stage = "Returned";
  c.returnNote = note;
  c.signed = undefined;
}

export function publishCase(c: Case, today: string) {
  c.stage = "Published";
  c.published = fmtD(today);
  c.score = c.score ?? caseScore(c) ?? undefined;
  c.opened = false;
}

export function markOpened(c: Case, today: string) {
  if (c.opened) return;
  c.opened = true;
  c.openedAt = fmtD(today);
}

export function cancelScheduleOn(c: Case) {
  c.stage = "Approved";
  c.pubAt = undefined;
}

export function overrideOutcome(c: Case, ref: string, value: string, reason: string, byName: string) {
  const oc = c.outcomes[ref];
  c.outcomes[ref] = { ...oc, o: value, override: { by: byName, reason } };
  if (c.stage === "Report submitted") {
    c.stage = "In review";
    c.reviewer = c.reviewer || byName;
  }
}

export function publishOrScheduleSelected(ids: string[], mode: "now" | "schedule", today: string, date?: string, holdUnapproved?: boolean): { published: number; scheduled: number; held: number } {
  const cs = ids.map((id) => caseOf(id)).filter((c): c is Case => !!c);
  if (mode === "now") {
    cs.forEach((c) => publishCase(c, today));
    return { published: cs.length, scheduled: 0, held: 0 };
  }
  const progsSel = [...new Set(cs.map((c) => c.prog))];
  cs.forEach((c) => {
    c.stage = "Scheduled";
    c.pubAt = date;
  });
  let held = 0;
  if (holdUnapproved && date) {
    CASES.filter((c) => progsSel.includes(c.prog) && ["Report submitted", "In review", "Returned"].includes(c.stage)).forEach((c) => {
      c.stage = "Held back";
      c.pubAt = date;
      c.holdReason = `Not approved when publishing was scheduled for ${fmtD(date)}`;
      held++;
    });
  }
  return { published: 0, scheduled: cs.length, held };
}

/* ================= Findings & remediation =================
 * Findings live inside each Case's `findings` array (raised while a firm assesses it, see
 * firm/assess in the prototype — not yet ported). This section is the register across every
 * published case's findings, plus the remediation lifecycle: the organisation plans a fix,
 * submits proof, the firm verifies it, the regulator closes it. */

export type FindingWithCase = { f: CaseFinding; c: Case };

export function allFindings(): FindingWithCase[] {
  return CASES.filter((c) => c.stage === "Published").flatMap((c) =>
    c.findings.map((f) => {
      if (!f.status) f.status = fcOf(f.cls).days ? "Open" : "Noted";
      if (!f.updates) f.updates = [];
      if (!f.proof) f.proof = [];
      return { f, c };
    })
  );
}

export function fdFind(id: string | undefined): FindingWithCase {
  return allFindings().find((x) => x.f.id === id) ?? allFindings()[0];
}

export function effDue(f: CaseFinding): string | undefined {
  return f.ext && f.ext.status === "Approved" ? f.ext.date : f.due;
}

export function fdOverdue(f: CaseFinding, today: string): boolean {
  const due = effDue(f);
  return !!due && ["Open", "In progress"].includes(f.status ?? "") && due < today;
}

export function fdLog(f: CaseFinding, what: string, who: string, today: string) {
  (f.updates ??= []).push([today, who, what]);
}

export const FD_CARDS: [string, string, string, (x: FindingWithCase) => boolean][] = [
  ["plan", "Plan needed", "flag", (x) => x.f.status === "Open"],
  ["progress", "In progress", "wrench", (x) => x.f.status === "In progress"],
  ["verify", "With firm to verify", "seal-question", (x) => x.f.status === "Fix submitted"],
  ["close", "Ready to close", "seal-check", (x) => x.f.status === "Verified fixed"],
];

export function fdCardsWithOverdue(today: string): [string, string, string, (x: FindingWithCase) => boolean][] {
  return [
    ...FD_CARDS,
    ["overdue", "Overdue", "warning", (x) => fdOverdue(x.f, today)],
    ["ext", "More time asked", "clock-clockwise", (x) => !!x.f.ext && x.f.ext.status === "Requested"],
  ];
}

export const FD_STATUS_TONE: Record<string, "warn" | "info" | "ok" | "neu"> = {
  Open: "warn",
  "In progress": "info",
  "Fix submitted": "info",
  "Verified fixed": "ok",
  Closed: "neu",
  Noted: "neu",
};

/* ---- mutators (see note above the Reviews mutators for why these live here) ---- */

export function savePlan(f: CaseFinding, plan: RemediationPlan, today: string, byName: string) {
  const isNew = !f.plan;
  f.plan = plan;
  if (f.status === "Open") f.status = "In progress";
  fdLog(f, isNew ? "Plan submitted" : "Plan updated", byName, today);
}

export function toggleStep(f: CaseFinding, index: number) {
  if (!f.plan) return;
  const step = f.plan.steps[index];
  if (step) step[1] = !step[1];
}

export function addProof(f: CaseFinding, fileName: string, size: string) {
  (f.proof ??= []).push([fileName, size]);
}

export function submitFix(f: CaseFinding, today: string, byName: string) {
  f.status = "Fix submitted";
  fdLog(f, "Fix submitted with proof", byName, today);
}

export function verifyFix(f: CaseFinding, ok: boolean, note: string, today: string, byName: string, firmName: string) {
  f.verify = { by: byName, when: today, ok, note };
  f.status = ok ? "Verified fixed" : "In progress";
  fdLog(f, ok ? "Verified fixed" : "Not fixed", firmName, today);
}

export function closeFinding(f: CaseFinding, today: string, byName: string) {
  f.status = "Closed";
  f.closed = { by: byName, when: today };
  fdLog(f, "Closed", byName, today);
}

export function reopenFinding(f: CaseFinding, note: string, today: string, byName: string) {
  f.status = "In progress";
  f.closed = undefined;
  fdLog(f, `Reopened${note ? `: ${note}` : ""}`, byName, today);
}

export function askExtension(f: CaseFinding, date: string, reason: string, today: string, byName: string) {
  f.ext = { status: "Requested", date, reason, by: byName, when: today };
  fdLog(f, "More time asked", byName, today);
}

export function decideExtension(f: CaseFinding, approved: boolean, today: string, byName: string) {
  if (!f.ext) return;
  f.ext.status = approved ? "Approved" : "Declined";
  if (approved) f.due = f.ext.date;
  fdLog(f, approved ? "More time approved" : "More time declined", byName, today);
}

/* ================= Answering (organisation) & engagement ================= */

export const LATE_STAGES = ["Submitted", "Assessing", "In preview", "Signed off", "Report submitted", "In review", "Returned", "Approved", "Scheduled", "Held back", "Published"];

export function isSubmitted(c: Case): boolean {
  return LATE_STAGES.includes(c.stage);
}

/** The regulation text only tells us the expected *kind* of answer via its hint ("Yes / No / Not applicable", "Date", "Number", "Short text", "Long text") — there's no separate machine-readable choice flag in the data, so we infer it here. */
export function questionChoice(hint: string): QuestionChoice {
  if (/yes.*no/i.test(hint)) return "yn";
  if (/^date$/i.test(hint)) return "date";
  if (/^number$/i.test(hint)) return "number";
  return "text";
}

export function answerComplete(q: Question, a: CaseAnswer | undefined): boolean {
  if (!a) return false;
  const choice = questionChoice(q.hint);
  if (!a.v) return false;
  const neg = choice === "yn" && (a.v === "No" || a.v === "Not applicable");
  if (neg && !(a.comment || "").trim()) return false;
  return true;
}

export function saveAnswer(c: Case, qid: string, patch: Partial<CaseAnswer>, byName: string, today: string, q: Question) {
  const existing = c.answers[qid] ?? ({ status: "draft", by: byName, when: today } as CaseAnswer);
  const merged: CaseAnswer = { ...existing, ...patch, by: existing.by || byName, when: today };
  merged.status = answerComplete(q, merged) ? "answered" : "draft";
  c.answers[qid] = merged;
}

export function submitAnswers(c: Case, today: string, byName: string, receiptSuffix: string) {
  c.stage = "Submitted";
  c.submitted = today;
  c.submittedBy = byName;
  c.receipt = `SUB-${c.prog.toUpperCase()}-${receiptSuffix}`;
}

export function obligationAction(c: Case): "choose-firm" | "answer" | "assess-respond" | "view-report" | "view" | "none" {
  if (c.stage === "Firm to choose") return "choose-firm";
  if (["Answering", "Awaiting firm", "Firm to assign", "Firm approval"].includes(c.stage)) return "answer";
  if (isSubmitted(c) && c.stage !== "Published") return "assess-respond";
  if (c.stage === "Published") return "view-report";
  if (isSubmitted(c)) return "view";
  return "none";
}

export function engageFirm(c: Case, firmId: string, today: string, byName: string) {
  void today;
  c.firm = firmId;
  c.firmStatus = "Requested by you";
  c.stage = "Awaiting firm";
  c.declineNote = undefined;
  void byName;
}

export function requestNonAccreditedFirm(c: Case, req: ReqFirmRequest) {
  c.reqFirm = req;
  c.firmStatus = "Requested";
  c.stage = "Firm approval";
  c.declineNote = undefined;
}

export const ENG_ACTIVE_STAGES = ["Report submitted", "In review", "Approved", "Scheduled", "Held back"];

export function engGroup(c: Case): "Requests" | "Completed" | "Submitted" | "Active" {
  if (["Assigned", "Requested by you"].includes(c.firmStatus)) return "Requests";
  if (c.stage === "Published") return "Completed";
  if (ENG_ACTIVE_STAGES.includes(c.stage) && c.stage !== ("Returned" as string)) return "Submitted";
  return "Active";
}

export function acceptEngagement(c: Case, lead: string, team: string[], today: string, firmName: string) {
  c.lead = lead;
  c.team = team;
  c.firmStatus = "Accepted";
  if (["Awaiting firm", "Firm to assign", "Firm to choose"].includes(c.stage)) c.stage = "Answering";
  void today;
  void firmName;
}

export function declineEngagement(c: Case, reason: string, firmName: string) {
  c.firm = "";
  c.firmStatus = "Declined";
  c.stage = progOf(c.prog).firmMode === "organisation" ? "Firm to choose" : "Firm to assign";
  c.declineNote = `${firmName} declined: ${reason}`;
}

export function startAssessing(c: Case) {
  if (c.stage === "Submitted") c.stage = "Assessing";
}

export function recordOutcome(c: Case, ref: string, outcome: string, note: string) {
  c.outcomes[ref] = { ...(c.outcomes[ref] ?? { o: "", note: "" }), o: outcome, note };
}

export function signOffAndSubmitReport(c: Case, today: string, byName: string) {
  c.signed = { by: byName, when: today };
  c.stage = "Report submitted";
  c.reportAt = today;
}
