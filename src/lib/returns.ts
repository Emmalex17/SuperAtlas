import returnTemplatesData from "./data/returnTemplates.json";
import filingsData from "./data/filings.json";
import { ORGANISATIONS, type Organisation } from "./mockData";
import { DEADLINES, fmtD } from "./cases";

export type ReturnFieldType = "number" | "text" | "date" | "yn";

export type ReturnField = {
  key: string;
  label: string;
  type: ReturnFieldType;
  unit: string;
  req: boolean;
  min: number | "";
  max: number | "";
  lte: string;
  help: string;
};

export type ReturnTemplate = {
  id: string;
  code: string;
  name: string;
  freq: "Monthly" | "Quarterly" | "Yearly";
  types: string[];
  dueDays: number;
  grace: string;
  status: "Active" | "Draft";
  version: string;
  source: string;
  updated: string;
  reminders: string;
  desc: string;
  fields: ReturnField[];
};

export type ReturnQuery = { field: string; msg: string; by: string; when: string; status: "Open" | "Answered"; replyBy?: string; reply?: string; from?: number; to?: number };

export type Filing = {
  id: string;
  org: string;
  tpl: string;
  period: string;
  pkey: string;
  due: string;
  status: "Not started" | "Draft" | "Submitted" | "Resubmitted" | "Queried" | "Accepted";
  values: Record<string, string | number>;
  history: [string, string, string][];
  queries: ReturnQuery[];
  reminders: number;
  source: string;
  ver: number;
  lastReminder?: string;
  filedAt?: string;
  filedBy?: string;
  approvedBy?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  receipt?: string;
  lateBy?: number;
};

export const RETURN_TEMPLATES = returnTemplatesData as unknown as ReturnTemplate[];
export const FILINGS = filingsData as unknown as Filing[];

export const TODAY = "2026-10-19";
export const VAR_FLAG = 50;
export const FILED_STATUSES: Filing["status"][] = ["Submitted", "Resubmitted", "Accepted"];

export function tplOf(id: string): ReturnTemplate {
  return RETURN_TEMPLATES.find((t) => t.id === id) ?? RETURN_TEMPLATES[0];
}

export function filingOf(id: string | undefined): Filing | undefined {
  return FILINGS.find((f) => f.id === id);
}

export function isFiled(f: Filing): boolean {
  return FILED_STATUSES.includes(f.status);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 864e5);
}
export { daysBetween };

export function dPlus(d: string, n: number): string {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export function graceOf(t: ReturnTemplate): number {
  return +(t.grace !== "" && t.grace != null ? t.grace : DEADLINES.returnsGrace || 0);
}

/** The status a person actually sees: unfiled past due+grace is Late, past due inside grace is Overdue. */
export function retStatus(f: Filing): string {
  if (isFiled(f)) return f.status;
  const t = tplOf(f.tpl);
  const left = daysBetween(TODAY, f.due);
  if (left < -graceOf(t)) return "Late";
  if (left < 0) return "Overdue";
  return f.status;
}

export const RET_CHIP_TONE: Record<string, "neu" | "info" | "warn" | "ok" | "bad"> = {
  "Not started": "neu",
  Draft: "neu",
  Submitted: "info",
  Resubmitted: "info",
  Queried: "warn",
  Accepted: "ok",
  Late: "bad",
  Overdue: "warn",
};

export function fmtNum(v: string | number | undefined | null): string {
  if (v === "" || v == null) return "—";
  const n = typeof v === "number" ? v : /^-?\d+(\.\d+)?$/.test(String(v)) ? Number(v) : null;
  return n == null ? String(v) : n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

export function prevFiling(f: Filing): Filing | undefined {
  const t = tplOf(f.tpl);
  void t;
  return FILINGS.filter((x) => x.tpl === f.tpl && x.org === f.org && x.pkey < f.pkey && isFiled(x)).sort((a, b) => b.pkey.localeCompare(a.pkey))[0];
}

export function variance(cur: unknown, prev: unknown): number | null {
  if (cur === "" || cur == null || prev === "" || prev == null || isNaN(+cur) || isNaN(+prev)) return null;
  if (+prev === 0) return +cur === 0 ? 0 : null;
  return Math.round(((+cur - +prev) / Math.abs(+prev)) * 100);
}

export function retErrors(t: ReturnTemplate, v: Record<string, string | number>): Record<string, string> {
  const e: Record<string, string> = {};
  t.fields.forEach((fd) => {
    const x = v[fd.key];
    if (x === "" || x == null) {
      if (fd.req) e[fd.key] = `Enter ${fd.label.toLowerCase()}.`;
      return;
    }
    if (fd.type === "number") {
      if (isNaN(+x)) {
        e[fd.key] = "Enter a number.";
        return;
      }
      if (fd.min !== "" && +x < +fd.min) e[fd.key] = `Must be ${fd.min} or more.`;
      else if (fd.max !== "" && +x > +fd.max) e[fd.key] = `Must be ${fd.max} or less.`;
      else if (fd.lte) {
        const o = t.fields.find((z) => z.key === fd.lte);
        if (o && v[o.key] !== "" && v[o.key] != null && +x > +v[o.key]) e[fd.key] = `Cannot be more than ${o.label.toLowerCase()} (${fmtNum(v[o.key])}).`;
      }
    }
  });
  return e;
}

export function retOrgs(t: ReturnTemplate): number {
  return ORGANISATIONS.filter((o) => t.types.includes(o.type)).length;
}

export function retOrgsForTemplate(t: ReturnTemplate): Organisation[] {
  return ORGANISATIONS.filter((o) => t.types.includes(o.type));
}

export function nextVer(v: string): string {
  const m = /v(\d+)\.(\d+)/.exec(v || "v1.0");
  return m ? `v${m[1]}.${+m[2] + 1}` : "v1.1";
}

export function dueRule(t: ReturnTemplate): string {
  return t.freq === "Yearly" ? `${t.dueDays} days after year end` : t.freq === "Monthly" ? `Day ${t.dueDays} of the next month` : `${t.dueDays} days after quarter end`;
}

export const RET_CARDS: [string, string, string, (f: Filing) => boolean][] = [
  ["due", "Due", "clock", (f) => !isFiled(f) && ["Not started", "Draft"].includes(retStatus(f)) && daysBetween(TODAY, f.due) <= 31],
  ["review", "To review", "stamp", (f) => ["Submitted", "Resubmitted"].includes(f.status)],
  ["queried", "Queried", "chat-circle-dots", (f) => f.status === "Queried"],
  ["late", "Late", "warning", (f) => ["Late", "Overdue"].includes(retStatus(f))],
  ["accepted", "Accepted", "check-circle", (f) => f.status === "Accepted"],
];

export const ORG_RET_CARDS: [string, string, string, (f: Filing) => boolean][] = [
  ["due", "Due soon", "clock", (f) => !isFiled(f) && daysBetween(TODAY, f.due) >= 0 && daysBetween(TODAY, f.due) <= 31],
  ["late", "Overdue", "warning", (f) => !isFiled(f) && daysBetween(TODAY, f.due) < 0],
  ["queried", "Queried", "chat-circle-dots", (f) => f.status === "Queried"],
  ["filed", "Filed", "check-circle", (f) => FILED_STATUSES.includes(f.status)],
];

export function retRank(f: Filing): number {
  const st = retStatus(f);
  if (["Submitted", "Resubmitted"].includes(st)) return 0;
  if (st === "Late") return 1;
  if (st === "Overdue") return 2;
  if (st === "Queried") return 3;
  if (!isFiled(f) && daysBetween(TODAY, f.due) <= 7) return 4;
  if (!isFiled(f)) return 6;
  return 5;
}

export function activeFilings(): Filing[] {
  return FILINGS.filter((f) => tplOf(f.tpl).status === "Active");
}

export function myFilings(orgId: string): Filing[] {
  return FILINGS.filter((f) => f.org === orgId && tplOf(f.tpl).status === "Active");
}

/* ================= Mutators (see the equivalent note in cases.ts: FILINGS is an in-memory
 * mock store shared for the session; writes live here, not inline in components) ================= */

export function remindFiling(f: Filing, byName: string, today: string) {
  f.reminders = (f.reminders || 0) + 1;
  f.lastReminder = today;
  f.history.push([today, "Reminder sent", byName]);
}

export function acceptFiling(f: Filing, byName: string, today: string) {
  f.status = "Accepted";
  f.acceptedBy = byName;
  f.acceptedAt = today;
  f.history.push([today, "Accepted", byName]);
}

export function queryFiling(f: Filing, fieldKey: string, msg: string, replyBy: string, byName: string, today: string, fieldLabel: string) {
  f.queries.push({ field: fieldKey, msg, by: byName, when: today, status: "Open", replyBy });
  f.status = "Queried";
  f.history.push([today, `Queried: ${fieldLabel.toLowerCase()}`, byName]);
}

export function askToResubmit(f: Filing, msg: string, byName: string, today: string) {
  f.queries.push({ field: "", msg: msg || "Please resubmit the return.", by: byName, when: today, status: "Open" });
  f.status = "Queried";
  f.history.push([today, "Asked to resubmit", byName]);
}

export function saveDraft(f: Filing, values: Record<string, string | number>) {
  f.values = { ...f.values, ...values };
  if (f.status === "Not started") f.status = "Draft";
}

export function submitFiling(f: Filing, values: Record<string, string | number>, preparedBy: string, approvedBy: string, today: string, receiptPrefix: string, source: "Online" | "Upload" = "Online") {
  const wasQueried = f.status === "Queried";
  f.values = { ...f.values, ...values };
  f.status = wasQueried ? "Resubmitted" : "Submitted";
  f.filedAt = `${today}, 09:00`;
  f.filedBy = preparedBy;
  f.approvedBy = approvedBy;
  f.source = source;
  f.ver = (f.ver || 1) + (wasQueried ? 1 : 0);
  if (!f.receipt) f.receipt = `${receiptPrefix}-${f.id.toUpperCase()}`;
  f.history.push([today, wasQueried ? "Resubmitted" : "Submitted", preparedBy]);
  if (wasQueried) f.queries.forEach((q) => { if (q.status === "Open") q.status = "Answered"; });
}

export function periodCode(f: Filing): string {
  return f.pkey.replace("-", "");
}

/** Figures a freshly-"read" uploaded spreadsheet would contain, keyed by template id — stand-ins
 * for the parsing step on org/return's "Upload template" filing mode. */
export const UPLOAD_SAMPLE: Record<string, Record<string, string | number>> = {
  rt1: { customers: 10450000, digital: 8790000, txValue: 3310000, failRate: 0.7, fraudN: 380, fraudLoss: 212.4, cmpRecv: 40200, cmpRes: 41900, officer: "C. Obi" },
  rt2: { incidents: 12, major: 0, in24: 0, downtime: 0.5, summary: "" },
  rt3: { activities: 40, dsar: 90, dsarMet: 88, breaches: 0, dpo: "Data protection officer" },
};

function periodFor(t: ReturnTemplate, today: string): { period: string; pkey: string; due: string } {
  if (t.freq === "Monthly") return { period: "Nov 2026", pkey: "2026-11", due: dPlus("2026-12-01", t.dueDays) };
  if (t.freq === "Yearly") return { period: "2026", pkey: "2026", due: dPlus("2026-12-31", t.dueDays) };
  void today;
  return { period: "Q4 2026", pkey: "2026-Q4", due: dPlus("2026-12-31", t.dueDays) };
}

/** Opens the first filing period for every eligible organisation when a brand-new template publishes. */
export function createFilingsForTemplate(t: ReturnTemplate) {
  if (FILINGS.some((f) => f.tpl === t.id)) return;
  const { period, pkey, due } = periodFor(t, TODAY);
  retOrgsForTemplate(t).forEach((o, i) => {
    FILINGS.push({ id: `rn${t.id}${i}`, tpl: t.id, period, pkey, due, org: o.id, status: "Not started", values: {}, history: [], queries: [], reminders: 0, source: "Online", ver: 1 });
  });
}

/** Saves a draft, or publishes (bumping the version and opening filings on first publish). */
export function saveTemplate(t: ReturnTemplate, mode: "draft" | "publish", today: string) {
  t.updated = fmtD(today);
  if (mode === "publish") {
    t.version = t.status === "Active" ? nextVer(t.version) : "v1.0";
    t.status = "Active";
  }
  const ix = RETURN_TEMPLATES.findIndex((x) => x.id === t.id);
  if (ix >= 0) RETURN_TEMPLATES[ix] = t;
  else RETURN_TEMPLATES.push(t);
  if (mode === "publish") createFilingsForTemplate(t);
}

/** Holds a freshly-"uploaded" draft between the regulator returns list (where the file is chosen)
 * and the template builder route, which reads and clears it on mount. Nothing is written into
 * RETURN_TEMPLATES until the person saves or publishes it there. */
export const PENDING_UPLOAD: { draft: ReturnTemplate | null } = { draft: null };

let newTplSeq = 0;

export function makeBlankTemplate(): ReturnTemplate {
  newTplSeq += 1;
  return {
    id: `rtnew${newTplSeq}`,
    code: "",
    name: "",
    freq: "Quarterly",
    types: [],
    dueDays: 30,
    grace: "",
    status: "Draft",
    version: "v0.1",
    source: "Built online",
    updated: fmtD(TODAY),
    reminders: "7, 3, 1",
    desc: "",
    fields: [{ key: "f1", label: "", type: "number", unit: "", req: true, min: 0, max: "", lte: "", help: "" }],
  };
}

let uploadedTplSeq = 0;

/** A fresh draft created from the regulator's "Upload a template" flow — mirrors the prototype's
 * hardcoded parsed example, since this mock has no real spreadsheet to read. */
export function makeUploadedDraft(today: string): ReturnTemplate {
  uploadedTplSeq += 1;
  const field = (key: string, label: string, type: ReturnFieldType, o: Partial<ReturnField> = {}): ReturnField => ({ key, label, type, unit: "", req: true, min: "", max: "", lte: "", help: "", ...o });
  return {
    id: `rtup${uploadedTplSeq}`,
    code: "AGN",
    name: "Agent network return",
    freq: "Quarterly",
    types: ["Payment solution service provider"],
    dueDays: 30,
    grace: "",
    status: "Draft",
    version: "v0.1",
    source: "Uploaded template",
    updated: fmtD(today),
    reminders: "7, 3, 1",
    desc: "Read from agent-network-return.xlsx.",
    fields: [
      field("agents", "Active agents", "number", { min: 0 }),
      field("newAgents", "New agents this quarter", "number", { min: 0 }),
      field("states", "States covered", "number", { min: 0, max: 37 }),
      field("agentTx", "Agent transaction value", "number", { unit: "₦ million", min: 0 }),
      field("agentCmp", "Agent-related complaints", "number", { min: 0 }),
    ],
  };
}
