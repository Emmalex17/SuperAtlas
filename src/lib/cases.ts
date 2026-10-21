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
import { ORGANISATIONS, allCategoryTypes, addAudit, FIRMS, type Firm } from "./mockData";
import type { IconName } from "./icons";

/** A requirement's raw question, as the regulation text states it: the question itself, plus a hint describing the expected kind of answer (e.g. "Yes / No / Not applicable", "Date", "Short text"). */
export type RawQuestion = [string, string];

export type RegRequirement = {
  ref: string;
  t: string;
  text: string;
  guidance?: string;
  weight?: string;
  evidence?: string[];
  /** Normalised in place, once, right after REGS loads (see normalizeRegsQuestions below) — so
   * every consumer always sees the rich {q, choice, comment, evidence, interview} shape, exactly
   * like the prototype's own S.regs after its one-time SEED.regs normalisation pass. On disk
   * (regs.json) this field is still raw [text, hint] tuples; the cast is corrected at runtime
   * before anything else reads REGS. */
  questions: NormQuestion[];
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
  isNew?: boolean;
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
normalizeRegsQuestions(REGS);
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

export function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, v) => a + v, 0) / nums.length);
}

export function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 100) : 0;
}

/** A 1-decimal-place average — the prototype's avg1(), used for star ratings. */
export function avg1(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, v) => a + v, 0) / nums.length) * 10) / 10;
}

/** A nonconformity that's still open — the prototype's NC_OPEN(). */
export const NC_OPEN = (f: CaseFinding) => ["MaNC", "MiNC"].includes(f.cls) && !["Closed", "Noted"].includes(f.status ?? "");

/** Programme series that have at least one Published case — the ones that actually drive compliance status. */
export function liveSeries(): ProgrammeSeries[] {
  return SERIES.filter((sr) => CASES.some((c) => c.stage === "Published" && progOf(c.prog).series === sr.id));
}

/** The latest Published result for one organisation in one programme series — the prototype's latestResult(). */
export function latestResult(orgId: string, seriesId: string): Case | undefined {
  return CASES.filter((c) => c.org === orgId && c.stage === "Published" && progOf(c.prog).series === seriesId).sort((a, b) => String(progOf(b.prog).cycle).localeCompare(String(progOf(a.prog).cycle)))[0];
}

/** The result before the latest one, for computing a score change — the prototype's prevResult(). */
export function prevResult(orgId: string, seriesId: string): Case | undefined {
  return CASES.filter((c) => c.org === orgId && c.stage === "Published" && c.score != null && progOf(c.prog).series === seriesId).sort((a, b) => +progOf(b.prog).cycle - +progOf(a.prog).cycle)[1];
}

export function benchOf(p: Programme): number {
  return +(COMPLIANCE_SETTINGS.bench[p.series] ?? 70);
}

export const COMP_STATUSES = ["Compliant", "Compliant with conditions", "Non-compliant", "Not assessed"] as const;
export type CompStatusValue = (typeof COMP_STATUSES)[number];

/** Compliance status for one published result — the prototype's compStatus(). */
export function compStatus(c: Case | undefined): CompStatusValue {
  if (!c || c.stage !== "Published" || c.score == null) return "Not assessed";
  const b = benchOf(progOf(c.prog));
  const fs = c.findings || [];
  const openMa = fs.some((f) => f.cls === "MaNC" && !["Closed", "Noted"].includes(f.status ?? ""));
  const openNC = fs.some(NC_OPEN);
  if (c.score >= b) return openMa ? "Compliant with conditions" : "Compliant";
  return openNC ? "Non-compliant" : "Compliant with conditions";
}

const COMP_SEV: Record<CompStatusValue, number> = { "Non-compliant": 3, "Compliant with conditions": 2, Compliant: 1, "Not assessed": 0 };

/** Worst compliance status across an organisation's latest result in each live series — the prototype's orgOverall(). */
export function orgOverall(orgId: string): CompStatusValue {
  const statuses = liveSeries()
    .map((sr) => compStatus(latestResult(orgId, sr.id)))
    .filter((s) => s !== "Not assessed");
  return statuses.sort((a, b) => COMP_SEV[b] - COMP_SEV[a])[0] ?? "Not assessed";
}

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

/** A finding's status chip — tone, icon and label — the prototype's fdChip() map. "Open"
 * reads as "Plan needed": the organisation hasn't started a fix yet. */
export const FD_STATUS_CHIP: Record<string, { tone: "warn" | "info" | "ok" | "neu"; icon: IconName; label: string }> = {
  Open: { tone: "warn", icon: "flag", label: "Plan needed" },
  "In progress": { tone: "info", icon: "wrench", label: "In progress" },
  "Fix submitted": { tone: "info", icon: "paper-plane-tilt", label: "Fix submitted" },
  "Verified fixed": { tone: "ok", icon: "seal-check", label: "Verified fixed" },
  Closed: { tone: "neu", icon: "lock-simple", label: "Closed" },
  Noted: { tone: "neu", icon: "note", label: "Noted" },
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

export function saveDeadlines(patch: Partial<Deadlines>) {
  Object.assign(DEADLINES, patch);
}

export function saveComplianceSettings(patch: Partial<ComplianceSettings>) {
  Object.assign(COMPLIANCE_SETTINGS, patch);
}

export function setDefaultScheme(id: string) {
  SCHEMES.forEach((s) => {
    s.def = s.id === id;
  });
}

export function saveSchemeBands(id: string, bands: [string, number][]) {
  const s = SCHEMES.find((x) => x.id === id);
  if (s) s.bands = bands;
}

export function copyScheme(id: string): ScoringScheme {
  const src = SCHEMES.find((x) => x.id === id) ?? SCHEMES[0];
  const copy: ScoringScheme = { ...src, id: `sc${SCHEMES.length + 1}`, name: `${src.name} (copy)`, def: false, used: 0, levels: [...src.levels], bands: [...src.bands] };
  SCHEMES.push(copy);
  return copy;
}

export function saveFindingClasses(next: FindingClass[]) {
  FINDING_CLASSES.length = 0;
  FINDING_CLASSES.push(...next);
}

/* ================= Requirements library (P4) =================
 * `library`, `library/regulation`, `library/requirement`, `library/edit`, `library/ai` — the
 * prototype's library.js and qmodel.js. On disk (regs.json), each requirement's `questions` is a
 * RawQuestion ([text, hint]) tuple, matching the prototype's own seed data (data.js ~line 146).
 * normalizeRegsQuestions() converts every one of them, once, into the rich {q, choice, comment,
 * evidence, interview} shape in place — exactly mirroring the prototype's own one-time SEED.regs
 * normalisation pass (data.js lines 234-240), including its two hand-set interview overrides.
 * From then on REGS carries only the rich shape: new questions (added via a dialog, or through
 * createRequirement/updateRequirement) are pushed as NormQuestion objects directly, never round-
 * tripped back through a hint string — the same "normalise once, objects forever" model the
 * prototype's S.regs uses after boot. */

export type NormQuestion = { q: string; choice: "yn" | "text" | "number" | "date" | ""; comment: boolean; evidence: boolean; interview: boolean };

/** Idempotent, like the prototype's own normQ (data.js): a Fast Refresh reload can re-run the
 * module-level normalizeRegsQuestions() call below against data this same function already
 * normalised on a previous pass, so anything that isn't a raw tuple is returned unchanged. */
function normQ(raw: RawQuestion | NormQuestion, i: number, req: RegRequirement): NormQuestion {
  if (!Array.isArray(raw)) return raw;
  const [q, ty] = raw;
  const yn = /Yes/.test(ty);
  return {
    q,
    choice: yn ? "yn" : /text/i.test(ty) ? "text" : ty === "Number" ? "number" : ty === "Date" ? "date" : "",
    comment: yn || /Long/.test(ty),
    evidence: (i === 0 && (req.evidence?.length ?? 0) > 0) || ty === "File upload",
    interview: false,
  };
}

function normalizeRegsQuestions(regs: Regulation[]) {
  regs.forEach((r) =>
    r.sections.forEach((s) =>
      s.reqs.forEach((req) => {
        const raw = req.questions as unknown as (RawQuestion | NormQuestion)[];
        req.questions = raw.map((x, i) => normQ(x, i, req));
      })
    )
  );
  const isr = regs.find((r) => r.id === "isr");
  const find = (ref: string) => isr?.sections.flatMap((s) => s.reqs).find((q) => q.ref === ref);
  const q12 = find("ISR-1.2");
  if (q12?.questions[1]) q12.questions[1].interview = true;
  const q71 = find("ISR-7.1");
  if (q71?.questions[0]) q71.questions[0].interview = true;
}

/** A requirement's questions — already normalised at module load, see normalizeRegsQuestions()
 * above. Kept as a named accessor so call sites read the same as the prototype's own usage. */
export function normalizedQuestions(req: RegRequirement): NormQuestion[] {
  return req.questions;
}

export const CHOICES: [string, string][] = [
  ["yn", "Yes / No / Not applicable"],
  ["text", "Text"],
  ["number", "Number"],
  ["date", "Date"],
  ["", "No choice"],
];

export function choiceLabel(c: string): string {
  return (CHOICES.find((x) => x[0] === c) ?? CHOICES[4])[1];
}

export const PARTS: [string, string, IconName][] = [
  ["comment", "Comment", "chat-text"],
  ["evidence", "Evidence", "paperclip"],
  ["interview", "Interview", "video-camera"],
];

/** AI: draft questions for a requirement (never answers) — the prototype's suggestQs(). */
export function suggestQs(req: { ref: string; t: string }): NormQuestion[] {
  const t = req.t.charAt(0).toLowerCase() + req.t.slice(1);
  return [
    { q: `Is there ${/^(a|an|the)\b/i.test(t) ? "" : "a "}${t} in place today?`, choice: "yn", comment: true, evidence: true, interview: false },
    { q: `Who is accountable for this, and how often is it reviewed?`, choice: "text", comment: false, evidence: false, interview: false },
    { q: `When was it last reviewed, tested or approved?`, choice: "date", comment: false, evidence: true, interview: false },
    { q: `Walk the assessor through how this works in practice.`, choice: "", comment: false, evidence: false, interview: true },
  ];
}

export function regReqs(r: Regulation): RegRequirement[] {
  return r.sections.flatMap((s) => s.reqs);
}
export function regQs(r: Regulation): number {
  return regReqs(r).reduce((n, req) => n + req.questions.length, 0);
}
export function orgsCovered(r: { applies: string[] }): number {
  const types = allCategoryTypes();
  return r.applies.reduce((n, name) => n + (types.find((t) => t.name === name)?.count ?? 0), 0);
}

export function findReq(ref: string): { reg: Regulation; sec: RegSection; q: RegRequirement } | null {
  for (const reg of REGS) {
    for (const sec of reg.sections) {
      const q = sec.reqs.find((x) => x.ref === ref);
      if (q) return { reg, sec, q };
    }
  }
  return null;
}

export function createRegulation(input: { name: string; ref: string; category: string; version: string; effective: string }): string {
  const id = `r${REGS.length + 1}-${Date.now()}`;
  REGS.push({
    id,
    ref: input.ref.toUpperCase(),
    name: input.name,
    category: input.category || "General",
    version: input.version || "v1.0",
    effective: fmtD(input.effective || "2027-01-01"),
    updated: "Today",
    status: "Draft",
    file: "",
    applies: [],
    desc: "",
    sections: [{ id: `s-${Date.now()}`, name: "1. General", reqs: [] }],
  });
  addAudit("Created regulation", input.name);
  return id;
}

/** The demo "Import requirements from a spreadsheet" outcome — the prototype's ACT.reqImportGo,
 * which always adds the same one row to Consumer Protection Rules if it isn't there yet. */
export function importRequirementsDemo(): string {
  const r = REGS.find((x) => x.id === "cpr");
  const msg = "consumer-protection.xlsx: 12 rows read, 11 already in the library, 1 added to Consumer Protection Rules (CPR-4.1).";
  if (r && !r.sections.some((s) => s.name.startsWith("4."))) {
    r.sections.push({
      id: "s4",
      name: "4. Disclosure",
      reqs: [
        {
          ref: "CPR-4.1",
          t: "Publish fees and charges",
          text: "Publish all fees and charges in plain language before a customer signs up.",
          guidance: "",
          weight: "Normal (2)",
          evidence: ["Published tariff"],
          questions: [{ q: "Are all fees published before sign-up?", choice: "yn", comment: true, evidence: true, interview: false }],
        },
      ],
    });
  }
  addAudit("Imported requirements", "consumer-protection.xlsx");
  return msg;
}

export function addRegulationSection(regId: string, name: string): string | null {
  const r = REGS.find((x) => x.id === regId);
  if (!r) return null;
  if (name.replace(/^\d+\.\s*/, "").length < 2) return null;
  const s: RegSection = { id: `s-${Date.now()}`, name, reqs: [] };
  r.sections.push(s);
  return s.id;
}

export function renameRegulationSection(regId: string, sectionId: string, name: string) {
  const s = REGS.find((x) => x.id === regId)?.sections.find((x) => x.id === sectionId);
  if (s && name) s.name = name;
}

export function editRegulationDetails(regId: string, patch: { name: string; category: string; version: string; desc: string; applies: string[] }) {
  const r = REGS.find((x) => x.id === regId);
  if (!r) return;
  Object.assign(r, { name: patch.name || r.name, category: patch.category, version: patch.version, desc: patch.desc, applies: patch.applies, updated: "Today" });
  addAudit("Edited regulation", r.name);
}

export function createRegulationVersion(regId: string) {
  const r = REGS.find((x) => x.id === regId);
  if (!r) return;
  const m = r.version.match(/v(\d+)\.(\d+)/);
  r.version = m ? `v${m[1]}.${+m[2] + 1}` : r.version + ".1";
  r.status = "Draft";
  r.updated = "Today";
  addAudit("Created regulation version", `${r.name} ${r.version}`);
}

export function publishRegulation(regId: string): { ok: boolean; message?: string } {
  const r = REGS.find((x) => x.id === regId);
  if (!r) return { ok: false };
  if (!regReqs(r).length || !r.applies.length) return { ok: false, message: "Add at least one requirement and choose who it applies to before publishing" };
  r.status = "Published";
  r.updated = "Today";
  addAudit("Published regulation", r.name);
  return { ok: true };
}

export function archiveRegulation(regId: string) {
  const r = REGS.find((x) => x.id === regId);
  if (!r) return;
  r.status = "Archived";
  addAudit("Archived regulation", r.name);
}

export function addQuestionToRequirement(ref: string, question: NormQuestion) {
  const f = findReq(ref);
  if (!f) return;
  f.q.questions.push(question);
}

export function addSuggestedQuestions(ref: string, list: NormQuestion[]) {
  const f = findReq(ref);
  if (!f) return;
  f.q.questions.push(...list);
  f.reg.updated = "Today";
  addAudit("AI questions added", f.q.ref, `${list.length} question(s) suggested by AI`);
}

export type RequirementFormData = {
  ref: string;
  t: string;
  text: string;
  guidance: string;
  weight: string;
  evidence: string[];
  questions: NormQuestion[];
  applies: string[];
};

/** Creates a new requirement in a regulation's section — the prototype's ACT.form_req (new case). */
export function createRequirement(regId: string, sectionId: string, data: RequirementFormData): string {
  const reg = REGS.find((x) => x.id === regId) ?? REGS[0];
  const sec = reg.sections.find((s) => s.id === sectionId) ?? reg.sections[reg.sections.length - 1];
  sec.reqs.push({ ref: data.ref, t: data.t, text: data.text, guidance: data.guidance, weight: data.weight, evidence: data.evidence.filter(Boolean), questions: data.questions.filter((x) => x.q) });
  reg.updated = "Today";
  addAudit("Added requirement", data.ref);
  return data.ref;
}

/** Saves an existing requirement — the prototype's ACT.form_req (edit case). */
export function updateRequirement(ref: string, data: RequirementFormData) {
  const f = findReq(ref);
  if (!f) return;
  Object.assign(f.q, { ref: data.ref, t: data.t, text: data.text, guidance: data.guidance, weight: data.weight, evidence: data.evidence.filter(Boolean), questions: data.questions.filter((x) => x.q) });
  f.reg.updated = "Today";
  addAudit("Edited requirement", data.ref);
}

/** The next default ref for a new requirement in a section — the prototype's inline numbering in
 * screen('library/edit'). */
export function nextRequirementRef(reg: Regulation, sec: RegSection): string {
  const n = regReqs(reg).filter((x) => x.ref.startsWith(`${reg.ref}-${parseInt(sec.name) || 1}.`)).length + 1;
  return `${reg.ref}-${parseInt(sec.name) || 1}.${n}`;
}

export type AiExtractItem = { ref: string; t: string; page: number; conf: number; state: "" | "accepted" | "rejected"; warn?: string };

export const AI_EXTRACT_SEED: AiExtractItem[] = [
  { ref: "CRR-2.1", t: "Maintain a cyber resilience strategy approved by the board", page: 4, conf: 96, state: "" },
  { ref: "CRR-2.2", t: "Test the business continuity plan at least once a year", page: 5, conf: 93, state: "" },
  { ref: "CRR-3.1", t: "Keep an up-to-date inventory of critical information assets", page: 7, conf: 91, state: "" },
  { ref: "CRR-3.4", t: "Encrypt customer data at rest and in transit", page: 9, conf: 88, state: "" },
  { ref: "CRR-4.2", t: "Run vulnerability scans monthly and fix critical findings within 14 days", page: 12, conf: 84, state: "" },
  { ref: "CRR-5.1", t: "Report cyber incidents that affect customers within 24 hours", page: 15, conf: 79, state: "" },
  { ref: "CRR-6.3", t: "Third-party providers should be reviewed periodically", page: 18, conf: 62, state: "", warn: "Vague wording: \"periodically\" has no frequency. Consider setting one." },
];

/** Publishes the AI-drafted regulation from its accepted items — the prototype's ACT.aiPublish. */
export function publishAiRegulation(name: string, accepted: AiExtractItem[]): string {
  const id = "crr";
  REGS.unshift({
    id,
    ref: "CRR",
    name,
    category: "Cyber resilience",
    version: "v1.0",
    effective: "1 Dec 2026",
    updated: "Today",
    status: "Draft",
    isNew: true,
    file: "cyber-resilience-regulation.pdf",
    desc: "Drafted with AI from the uploaded PDF and reviewed by your team. Check questions and evidence, then publish.",
    applies: ["Commercial bank", "Microfinance bank", "Payment solution service provider"],
    sections: [
      {
        id: "ai1",
        name: "1. Drafted requirements",
        reqs: accepted.map((x) => ({
          ref: x.ref,
          t: x.t,
          text: x.t + ".",
          guidance: "",
          weight: "Normal (2)",
          evidence: ["Evidence to be confirmed"],
          questions: [{ q: "Does the organisation meet this requirement?", choice: "yn", comment: true, evidence: true, interview: false }],
        })),
      },
    ],
  });
  addAudit("Added regulation with AI", `${name} · ${accepted.length} requirements`);
  return id;
}

/* ================= P5: Programmes and engagements ================= */

export function progActivity(p: Programme, who: string, what: string) {
  p.activity.unshift(["Today", who, what]);
}

export function accredited(): Firm[] {
  return FIRMS.filter((f) => f.status === "Accredited" || f.status === "Renewal due");
}

export function conflictOf(f: Firm, orgId: string) {
  return (f.clients ?? []).find((c) => c.orgId === orgId);
}

function hintForChoice(q: NormQuestion): string {
  if (q.choice === "yn") return "Yes / No / Not applicable";
  if (q.choice === "date") return "Date";
  if (q.choice === "number") return "Number";
  if (q.choice === "text") return q.comment ? "Long text" : "Short text";
  return "Short text";
}

/** A programme takes its own editable copy of the regulation's current requirement set — the
 * prototype's makeQSet() (bdata.js). Edited for this programme only; the library is unaffected. */
export function makeQSet(reg: Regulation): QSet {
  return {
    ver: reg.version,
    sections: reg.sections.map((s) => ({
      id: s.id,
      name: s.name,
      on: true,
      reqs: s.reqs.map((r) => ({
        ref: r.ref,
        t: r.t,
        text: r.text,
        guidance: r.guidance,
        weight: r.weight,
        evidence: r.evidence ? [...r.evidence] : [],
        questions: r.questions.map((q, i) => ({ id: `${r.ref}#${i}`, text: q.q, hint: hintForChoice(q) })),
      })),
    })),
  };
}

/** Every answer part a question asks for, derived from its stored hint string for display —
 * the Questions tab's equivalent of the library's qParts() badges. */
export function qsetQParts(q: Question): { choiceLabel: string; comment: boolean } {
  return { choiceLabel: q.hint, comment: q.hint === "Yes / No / Not applicable" || q.hint === "Long text" };
}

export function createDraftProgramme(): Programme {
  const reg = REGS.find((r) => r.status === "Published") ?? REGS[0];
  const defScheme = SCHEMES.find((s) => s.def) ?? SCHEMES[0];
  return {
    id: `p-${Date.now()}`,
    name: "",
    reg: reg.id,
    ver: reg.version,
    status: "Draft",
    opens: "2027-01-15",
    closes: "2027-03-31",
    created: "Today",
    types: reg.applies.filter((a) => allCategoryTypes().some((t) => t.name === a)).slice(0, 2),
    desc: "",
    firmMode: "regulator",
    preview: true,
    publisher: "regulator",
    by: "M. Bello",
    scheme: defScheme.id,
    reminders: DEADLINES.reminders,
    escalate: DEADLINES.escalate,
    exclude: [],
    series: "",
    cycle: "",
    qset: makeQSet(reg),
    activity: [],
  };
}

/** Saves a draft or launched programme — the prototype's saveProg(). Creates the programme's
 * series (and its first cycle number) the first time it is saved. */
export function saveProgramme(p: Programme) {
  if (!p.series) {
    p.series = `s-${p.id}`;
    p.cycle = (p.opens || "2027").slice(0, 4);
    SERIES.push({ id: p.series, name: p.name.replace(/\s*\b20\d\d\b\s*/, " ").trim(), reg: p.reg, freq: "Yearly" });
  }
  const i = PROGRAMMES.findIndex((x) => x.id === p.id);
  if (i >= 0) PROGRAMMES[i] = p;
  else PROGRAMMES.unshift(p);
}

/** Launches a programme now, or schedules it for its opening date if that is in the future —
 * the prototype's ACT.form_pw final step. Returns true if scheduled, false if launched now. */
export function launchOrSchedule(p: Programme, today: string, byName: string): boolean {
  const future = p.opens > today;
  p.status = future ? "Scheduled" : "Open";
  p.locked = future ? "" : "Today";
  if (!future) {
    scopeOrgs(p).forEach((o) => {
      CASES.push({
        id: `c-${Date.now()}-${o.id}`,
        prog: p.id,
        org: o.id,
        firm: "",
        firmStatus: "",
        team: [],
        lead: "",
        answers: {},
        assign: {},
        outcomes: {},
        findings: [],
        threads: [],
        interviews: [],
        stage: p.firmMode === "organisation" ? "Firm to choose" : "Firm to assign",
        due: p.closes,
      });
    });
  }
  progActivity(p, byName, future ? `scheduled the programme to open on ${fmtD(p.opens)}` : `launched the programme to ${scopeOrgs(p).length} organisations`);
  saveProgramme(p);
  addAudit(future ? "Scheduled programme" : "Launched programme", p.name);
  return future;
}

/** Bulk-assigns an assurance firm to cases, skipping any organisation the firm has an active
 * independence conflict with — the prototype's ACT.assignGo(). */
export function assignFirmToCases(programmeId: string, caseIds: string[], firmId: string, byName: string): { assigned: number; blocked: number } {
  const p = progOf(programmeId);
  const firm = FIRMS.find((f) => f.id === firmId);
  if (!firm) return { assigned: 0, blocked: caseIds.length };
  let assigned = 0;
  caseIds.forEach((cid) => {
    const c = caseOf(cid);
    if (!c || conflictOf(firm, c.org)) return;
    c.firm = firm.id;
    c.firmStatus = "Assigned";
    c.stage = "Awaiting firm";
    c.lead = "";
    assigned++;
  });
  if (assigned) {
    progActivity(p, byName, `assigned ${firm.name} to ${assigned} organisation${assigned === 1 ? "" : "s"}`);
    addAudit("Assigned firm", `${firm.name} · ${assigned} organisations · ${p.name}`);
  }
  return { assigned, blocked: caseIds.length - assigned };
}

/** Regulator approves a non-accredited firm an organisation asked to use, for this programme
 * only — the prototype's ACT.firmReqGo('yes'). Creates a one-off firm record if needed. */
export function approveFirmRequest(caseId: string, byName: string) {
  const c = caseOf(caseId);
  if (!c || !c.reqFirm) return;
  const org = ORGANISATIONS.find((o) => o.id === c.org);
  const id = `x-${c.reqFirm.name.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  if (!FIRMS.find((f) => f.id === id)) {
    FIRMS.push({
      id,
      name: c.reqFirm.name,
      initials: c.reqFirm.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      color: "#5E6A71",
      types: ["Data protection (DPCO)"],
      status: "Approved for one programme",
      assigned: 0,
      renews: "—",
      since: "—",
      city: "—",
      people: [{ name: "Lead assessor", initials: "LA", role: "Lead auditor", title: "", cred: c.reqFirm.creds, expires: "—", status: "Active" }],
      clients: [],
      oneOff: true,
    });
  }
  c.firm = id;
  c.firmStatus = "Approved";
  c.stage = "Answering";
  c.lead = "Lead assessor";
  const p = progOf(c.prog);
  progActivity(p, byName, `approved ${org?.name ?? "the organisation"}'s firm request`);
  addAudit("Approved firm request", `${org?.name ?? ""} · ${p.name}`);
}

/** Regulator declines a non-accredited firm request — the prototype's ACT.firmReqGo('no'). */
export function declineFirmRequest(caseId: string, note: string, byName: string) {
  const c = caseOf(caseId);
  if (!c) return;
  const org = ORGANISATIONS.find((o) => o.id === c.org);
  c.firmStatus = "Declined";
  c.stage = "Firm to choose";
  c.declineNote = note;
  c.reqFirm = undefined;
  const p = progOf(c.prog);
  progActivity(p, byName, `declined ${org?.name ?? "the organisation"}'s firm request`);
  addAudit("Declined firm request", `${org?.name ?? ""} · ${p.name}`);
}

/** Sends a reminder to every organisation in a programme that has not submitted — the
 * prototype's ACT.progRemindAll(). */
export function remindAllOutstanding(programmeId: string, byName: string): number {
  const p = progOf(programmeId);
  const n = casesOf(programmeId).filter((c) => !isSubmitted(c)).length;
  progActivity(p, byName, `sent a reminder to ${n} organisations`);
  return n;
}

/** Drafts the next yearly cycle from the latest one, or reuses an already-drafted future cycle
 * if one exists — the prototype's ACT.progNext(). Returns the cycle's programme id to open in
 * the edit wizard. */
export function nextCycle(programmeId: string, byName: string): { id: string; reused: boolean } {
  const p = progOf(programmeId);
  const cyc = cyclesOf(p.series);
  const pending = cyc.find((c) => ["Draft", "Scheduled"].includes(c.status) && +c.cycle > +p.cycle);
  if (pending) return { id: pending.id, reused: true };
  const last = cyc[0];
  const y = String(+last.cycle + 1);
  const yr = (d: string) => (d ? String(+d.slice(0, 4) + 1) + d.slice(4) : d);
  const n: Programme = {
    ...last,
    id: `p-${Date.now()}`,
    cycle: y,
    name: last.name.replace(/\b20\d\d\b/, y),
    status: "Draft",
    opens: yr(last.opens),
    closes: yr(last.closes),
    created: "Today",
    by: byName,
    activity: [["Today", byName, `drafted cycle ${y} from cycle ${last.cycle}`]],
    locked: "",
    edited: 0,
    published: undefined,
    exclude: [],
    qset: JSON.parse(JSON.stringify(last.qset)) as QSet,
  };
  PROGRAMMES.push(n);
  addAudit("Drafted next programme cycle", n.name);
  return { id: n.id, reused: false };
}
