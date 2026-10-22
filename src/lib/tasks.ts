import type { Account, Workspace } from "./auth";
import { orgIdFor, firmIdFor, ORGANISATIONS, CLASS_REQS, ACC_APPS, FIRMS, catLabel } from "./mockData";
import { CASES, allFindings, caseProgress, progOf, TODAY as CASE_TODAY, effDue, fmtD } from "./cases";
import { FILINGS, tplOf, isFiled } from "./returns";
import { ENF_CASES } from "./enforcement";

export type TaskItem = { title: string; sub?: string; due?: string; href: string };
export type TaskGroup = { id: string; icon: string; label: string; href: string; items: TaskItem[] };

function daysBetween(today: string, d: string): number {
  return Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);
}

export function dueText(d: string | undefined): { text: string; tone: "bad" | "warn" | "neu" } | null {
  if (!d) return null;
  const n = daysBetween(CASE_TODAY, d);
  if (n < 0) return { text: `${-n} day${n === -1 ? "" : "s"} overdue`, tone: "bad" };
  if (n === 0) return { text: "Due today", tone: "warn" };
  if (n <= 7) return { text: `Due in ${n} day${n === 1 ? "" : "s"}`, tone: "warn" };
  return { text: `Due ${fmtD(d)}`, tone: "neu" };
}

/** Everything the signed-in organisation still needs to act on, soonest first. Mirrors the prototype's orgTodo(). */
export function orgTodo(orgId: string): (TaskItem & { icon: string; group: "act" | "ret" | "fix" | "asm" })[] {
  const out: (TaskItem & { icon: string; group: "act" | "ret" | "fix" | "asm" })[] = [];
  CASES.filter((c) => c.org === orgId).forEach((c) => {
    const p = progOf(c.prog);
    if (c.stage === "Firm to choose") out.push({ icon: "handshake", group: "asm", title: `Choose a firm for ${p.name}`, due: c.due, href: "/organisation/obligations" });
    if (c.stage === "Answering") out.push({ icon: "pencil-simple", group: "asm", title: `Finish answering ${p.name}`, sub: `${caseProgress(c)}% answered`, due: c.due, href: "/organisation/obligations" });
    if (c.stage === "In preview") out.push({ icon: "eye", group: "asm", title: `Look at the outcome preview for ${p.name}`, due: c.due, href: "/organisation/obligations" });
  });
  FILINGS.filter((f) => f.org === orgId && tplOf(f.tpl).status === "Active").forEach((f) => {
    if (f.status === "Queried") out.push({ icon: "chat-circle-dots", group: "ret", title: `Answer the query on ${tplOf(f.tpl).name} (${f.period})`, due: CASE_TODAY, href: `/organisation/returns/${f.id}` });
    else if (!isFiled(f) && daysBetween(CASE_TODAY, f.due) <= 31) out.push({ icon: "table", group: "ret", title: `File ${tplOf(f.tpl).name} (${f.period})`, due: f.due, href: `/organisation/returns/${f.id}` });
  });
  allFindings()
    .filter((x) => x.c.org === orgId)
    .forEach((x) => {
      const f = x.f;
      if (f.status === "Open") out.push({ icon: "flag", group: "fix", title: `Plan the fix: ${f.title}`, due: effDue(f), href: `/organisation/findings/${f.id}` });
      else if (f.status === "In progress") out.push({ icon: "wrench", group: "fix", title: `Finish the fix: ${f.title}`, due: effDue(f), href: `/organisation/findings/${f.id}` });
    });
  ENF_CASES.filter((c) => c.org === orgId).forEach((c) => {
    if (c.status === "Notice issued") out.push({ icon: "gavel", group: "act", title: `Respond to case ${c.id}`, due: c.respondBy, href: `/organisation/actions/${c.id}` });
    if (c.status === "Awaiting payment") out.push({ icon: "money", group: "act", title: `Pay the penalty for case ${c.id}`, due: c.respondBy, href: `/organisation/actions/${c.id}` });
  });
  return out.sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
}

const plural = (n: number, one: string, many?: string) => (n === 1 ? one : many || `${one}s`);

/** Grouped "waiting for you" lists, per workspace. Mirrors the prototype's myTasks() in d1.js. */
export function myTasks(account: Account): (TaskGroup & { say: (n: number) => string })[] {
  const ws: Workspace = account.workspace;
  if (ws === "regulator") {
    const orgN = (id: string) => ORGANISATIONS.find((o) => o.id === id)?.name ?? id;
    const firmN = (id: string) => FIRMS.find((f) => f.id === id)?.name ?? id;
    const groups: (TaskGroup & { say: (n: number) => string })[] = [
      {
        id: "enf",
        icon: "gavel",
        label: "Enforcement decisions",
        href: "/regulator/enforcement",
        say: (n) => `${n} enforcement ${plural(n, "decision")} waiting for you`,
        items: ENF_CASES.filter((c) => ["Awaiting sign-off", "Response received"].includes(c.status)).map((c) => ({ title: `${orgN(c.org)} case`, sub: c.status, href: `/regulator/enforcement/${c.id}` })),
      },
      {
        id: "rep",
        icon: "stamp",
        label: "Reports to review",
        href: "/regulator/reviews",
        say: (n) => `${n} ${plural(n, "report")} to review before publishing`,
        items: CASES.filter((c) => c.stage === "Report submitted").map((c) => ({ title: orgN(c.org), sub: progOf(c.prog).name, href: `/regulator/reviews/${c.id}` })),
      },
      {
        id: "ret",
        icon: "table",
        label: "Returns to review",
        href: "/regulator/returns",
        say: (n) => `${n} ${plural(n, "return")} to review`,
        items: FILINGS.filter((f) => ["Submitted", "Resubmitted"].includes(f.status)).map((f) => ({ title: orgN(f.org), sub: `${tplOf(f.tpl).name} · ${f.period || ""}`, href: `/regulator/returns/${f.id}` })),
      },
      {
        id: "fix",
        icon: "flag",
        label: "Fixes to close",
        href: "/regulator/findings",
        say: (n) => `${n} ${plural(n, "fix", "fixes")} verified by the firm, ready to close`,
        items: allFindings()
          .filter((x) => x.f.status === "Verified fixed")
          .map((x) => ({ title: x.f.title, sub: orgN(x.c.org), href: `/regulator/findings/${x.f.id}` })),
      },
      {
        id: "ver",
        icon: "seal-check",
        label: "Organisations to verify",
        href: "/regulator/organisations",
        say: (n) => `${n} ${plural(n, "organisation")} to verify`,
        items: ORGANISATIONS.filter((o) => o.status === "Pending verification").map((o) => ({ title: o.name, sub: catLabel(o.type, o.tier), href: `/regulator/organisations/${o.id}` })),
      },
      {
        id: "cls",
        icon: "git-diff",
        label: "Classification changes",
        href: "/regulator/organisations",
        say: (n) => `${n} classification ${plural(n, "change")} to decide`,
        items: CLASS_REQS.filter((r) => r.status === "Pending").map((r) => ({ title: orgN(r.org), sub: "Asked for a different category", href: `/regulator/organisations/${r.org}` })),
      },
      {
        id: "acc",
        icon: "certificate",
        label: "Accreditation applications",
        href: "/regulator/firms",
        say: (n) => `${n} accreditation ${plural(n, "application")} to review`,
        items: ACC_APPS.filter((a) => a.status === "In review").map((a) => ({ title: firmN(a.firm), sub: a.type, href: `/regulator/firms/${a.firm}` })),
      },
    ];
    return groups;
  }
  if (ws === "organisation") {
    const orgId = orgIdFor(account.entityName);
    const todo = orgId ? orgTodo(orgId) : [];
    const pick = (group: "act" | "ret" | "fix" | "asm") => todo.filter((x) => x.group === group);
    return [
      { id: "act", icon: "gavel", label: "Regulatory actions", href: "/organisation/actions", say: (n) => `${n} regulatory ${plural(n, "action")}`, items: pick("act") },
      { id: "ret", icon: "table", label: "Data returns", href: "/organisation/returns", say: (n) => `${n} ${plural(n, "return")}`, items: pick("ret") },
      { id: "fix", icon: "flag", label: "Findings to fix", href: "/organisation/findings", say: (n) => `${n} ${plural(n, "finding")} to fix`, items: pick("fix") },
      { id: "asm", icon: "list-checks", label: "Assessments", href: "/organisation/obligations", say: (n) => `${n} ${plural(n, "assessment")}`, items: pick("asm") },
    ];
  }
  // firm
  const firmId = firmIdFor(account.entityName);
  const cs = firmId ? CASES.filter((c) => c.firm === firmId) : [];
  const orgNf = (id: string) => ORGANISATIONS.find((o) => o.id === id)?.name ?? id;
  return [
    {
      id: "req",
      icon: "envelope-simple",
      label: "Engagement requests",
      href: "/firm/engagements",
      say: (n) => `${n} engagement ${plural(n, "request")} to accept or decline`,
      items: cs.filter((c) => c.stage === "Firm to choose" || c.firmStatus === "Invited").map((c) => ({ title: orgNf(c.org), sub: progOf(c.prog).name, href: "/firm/engagements" })),
    },
    {
      id: "asm",
      icon: "clipboard-text",
      label: "Assessments to complete",
      href: "/firm/engagements",
      say: (n) => `${n} ${plural(n, "assessment")} submitted and waiting for you`,
      items: cs
        .filter((c) => ["Submitted", "Assessing", "In preview", "Returned"].includes(c.stage))
        .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
        .map((c) => ({ title: orgNf(c.org), sub: `${progOf(c.prog).name} · ${c.stage}`, due: c.due, href: `/firm/assess/${c.id}` })),
    },
    {
      id: "fix",
      icon: "flag",
      label: "Fixes to verify",
      href: "/firm/findings",
      say: (n) => `${n} ${plural(n, "fix", "fixes")} sent with proof, waiting for you to verify`,
      items: allFindings()
        .filter((x) => x.c.firm === firmId && x.f.status === "Fix submitted")
        .map((x) => ({ title: x.f.title, sub: orgNf(x.c.org), href: `/firm/findings/${x.f.id}` })),
    },
  ];
}

export function taskTotal(account: Account): number {
  return myTasks(account).reduce((a, g) => a + g.items.length, 0);
}
