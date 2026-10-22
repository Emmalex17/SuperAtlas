import type { Account, Workspace } from "./auth";
import { ORGANISATIONS, FIRMS, orgIdFor, firmIdFor } from "./mockData";
import { CASES, REGS, progOf, myCases, allFindings } from "./cases";
import { FILINGS, tplOf, isFiled, retStatus } from "./returns";
import { ENF_CASES, atOf, mySeries } from "./enforcement";
import type { IconName } from "./icons";

export type SearchHit = { group: string; icon: IconName; title: string; sub: string; href: string };

type NavEntry = { icon: IconName; label: string; href: string };

export const SEARCH_GROUPS = ["Pages", "Organisations", "Programmes", "Engagements", "Findings", "Returns", "Reports", "Enforcement", "Assurance firms", "Requirements"];

function orgName(id: string): string {
  return ORGANISATIONS.find((o) => o.id === id)?.name ?? "";
}

/** One search index per workspace: each person only finds what their workspace can open. Mirrors the
 * prototype's searchIndex() in c7.js — reused by both the command palette (a short, page-weighted
 * slice) and the full /search results page. */
export function searchIndex(account: Account, navItems: NavEntry[]): SearchHit[] {
  const ws: Workspace = account.workspace;
  const R = ws === "regulator";
  const O = ws === "organisation";
  const F = ws === "firm";
  const hits: SearchHit[] = navItems.map((n) => ({ group: "Pages", icon: n.icon, title: n.label, sub: "Go to page", href: n.href }));

  if (R) {
    ORGANISATIONS.forEach((o) => hits.push({ group: "Organisations", icon: "buildings", title: o.name, sub: `${o.sector} · ${o.type}`, href: `/regulator/organisations/${o.id}` }));
    FIRMS.forEach((f) => hits.push({ group: "Assurance firms", icon: "briefcase", title: f.name, sub: f.types.join(", "), href: `/regulator/firms/${f.id}` }));
  }

  const orgId = O ? orgIdFor(account.entityName) : undefined;
  const firmId = F ? firmIdFor(account.entityName) : undefined;

  if (R) {
    [...new Set(CASES.map((c) => c.prog))].forEach((progId) => {
      const p = progOf(progId);
      if (p.status === "Draft") return;
      hits.push({ group: "Programmes", icon: "calendar-check", title: p.name, sub: `${p.status} · cycle ${p.cycle}`, href: `/regulator/programmes/${p.id}` });
    });
  }
  if (O && orgId) {
    mySeries(orgId).forEach((sr) => hits.push({ group: "Programmes", icon: "calendar-check", title: sr.name, sub: "Your results over time", href: `/organisation/compliance/${encodeURIComponent(sr.id)}` }));
    myCases(orgId)
      .filter((c) => c.stage !== "Published")
      .forEach((c) => hits.push({ group: "Programmes", icon: "clipboard-text", title: progOf(c.prog).name, sub: `In progress · ${c.stage}`, href: "/organisation/obligations" }));
  }

  if (F && firmId) {
    CASES.filter((c) => c.firm === firmId && c.stage !== "Published").forEach((c) => {
      const assessable = ["Submitted", "Assessing", "In preview", "Signed off", "Returned"].includes(c.stage);
      hits.push({ group: "Engagements", icon: "clipboard-text", title: `${orgName(c.org)} · ${progOf(c.prog).name}`, sub: c.stage, href: assessable ? `/firm/assess/${c.id}` : "/firm/engagements" });
    });
  }

  allFindings()
    .filter((x) => R || (O && x.c.org === orgId) || (F && x.c.firm === firmId))
    .forEach((x) => {
      const href = R ? `/regulator/findings/${x.f.id}` : O ? `/organisation/findings/${x.f.id}` : `/firm/findings/${x.f.id}`;
      hits.push({ group: "Findings", icon: "flag", title: x.f.title, sub: `${x.f.cls}${R || F ? ` · ${orgName(x.c.org)}` : ""} · ${x.f.status}`, href });
    });

  if (R) {
    const seenTpl = new Set<string>();
    FILINGS.forEach((f) => {
      const t = tplOf(f.tpl);
      if (!seenTpl.has(t.id)) {
        seenTpl.add(t.id);
        hits.push({ group: "Returns", icon: "table", title: t.name, sub: `Return template · ${t.status}`, href: `/regulator/returns/template/${t.id}` });
      }
    });
    FILINGS.filter((f) => isFiled(f))
      .slice(0, 400)
      .forEach((f) => hits.push({ group: "Returns", icon: "file-text", title: `${orgName(f.org)} · ${tplOf(f.tpl).name}`, sub: `${f.period ?? ""} · ${retStatus(f)}`, href: `/regulator/returns/${f.id}` }));
  }
  if (O && orgId) {
    FILINGS.filter((f) => f.org === orgId).forEach((f) => hits.push({ group: "Returns", icon: "file-text", title: tplOf(f.tpl).name, sub: `${f.period ?? ""} · ${retStatus(f)}`, href: `/organisation/returns/${f.id}` }));
  }

  CASES.filter((c) => c.stage === "Published" && (R || (O && c.org === orgId) || (F && c.firm === firmId))).forEach((c) => {
    const href = R ? `/regulator/reviews/${c.id}` : O ? `/organisation/report/${c.id}` : `/firm/assess/${c.id}`;
    hits.push({ group: "Reports", icon: "file-text", title: `${R || F ? `${orgName(c.org)} · ` : ""}${progOf(c.prog).name}`, sub: `Published report · score ${c.score ?? "not given"}`, href });
  });

  if (R) {
    ENF_CASES.forEach((c) => hits.push({ group: "Enforcement", icon: "gavel", title: `${orgName(c.org)} · ${atOf(c.type).name}`, sub: c.status, href: `/regulator/enforcement/${c.id}` }));
  }

  if (R) {
    REGS.forEach((reg) => reg.sections.forEach((s) => s.reqs.forEach((q) => hits.push({ group: "Requirements", icon: "book-open-text", title: `${q.ref} ${q.t}`, sub: reg.name, href: `/regulator/library/requirement?ref=${encodeURIComponent(q.ref)}` }))));
  }

  return hits;
}

export function searchRun(index: SearchHit[], q: string, max?: number): SearchHit[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const words = query.split(/\s+/);
  const key = (h: SearchHit) => `${h.title} ${h.sub}`.toLowerCase();
  return index
    .filter((h) => words.every((w) => key(h).includes(w)))
    .sort((a, b) => {
      const score = (h: SearchHit) => (h.title.toLowerCase().startsWith(query) ? 0 : h.title.toLowerCase().includes(query) ? 1 : 2) + SEARCH_GROUPS.indexOf(h.group) / 100;
      return score(a) - score(b);
    })
    .slice(0, max ?? 999);
}
