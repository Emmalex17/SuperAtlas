import type { Account, Workspace } from "./auth";
import { ORGANISATIONS, FIRMS } from "./mockData";
import type { IconName } from "./icons";

export type SearchHit = { group: string; icon: IconName; title: string; sub: string; href: string };

type NavEntry = { icon: IconName; label: string; href: string };

/** One search index per workspace: each person only finds what their workspace can open. Mirrors the
 * prototype's searchIndex() in c7.js. The full catalogue (programmes, findings, returns, reports,
 * enforcement, requirements) is reserved for the dedicated /search page rebuild — this covers the
 * command palette's primary job of jumping to a page or a named organisation/firm. */
export function searchIndex(account: Account, navItems: NavEntry[]): SearchHit[] {
  const ws: Workspace = account.workspace;
  const hits: SearchHit[] = navItems.map((n) => ({ group: "Pages", icon: n.icon, title: n.label, sub: "Go to page", href: n.href }));
  if (ws === "regulator") {
    ORGANISATIONS.forEach((o) => hits.push({ group: "Organisations", icon: "buildings", title: o.name, sub: `${o.sector} · ${o.type}`, href: `/regulator/organisations/${o.id}` }));
    FIRMS.forEach((f) => hits.push({ group: "Assurance firms", icon: "briefcase", title: f.name, sub: f.types.join(", "), href: `/regulator/firms/${f.id}` }));
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
      const score = (h: SearchHit) => (h.title.toLowerCase().startsWith(query) ? 0 : h.title.toLowerCase().includes(query) ? 1 : 2);
      return score(a) - score(b);
    })
    .slice(0, max ?? 999);
}
