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
