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

export type CaseAnswer = {
  status: string;
  by: string;
  when: string;
  v?: string;
  comment?: string;
  files?: [string, string][];
  interview?: string;
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
  ext?: unknown;
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
