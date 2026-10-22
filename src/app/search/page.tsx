"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnyWorkspaceShell } from "@/components/AnyWorkspaceShell";
import { buildNav } from "@/components/AppShell";
import { PageHead, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { getSession } from "@/lib/auth";
import { searchIndex, searchRun, SEARCH_GROUPS, type SearchHit } from "@/lib/search";

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "var(--accent-soft)", borderRadius: 3 }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const session = getSession();
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState(q);

  if (!session) return null;

  const nav = buildNav(session);
  const index = searchIndex(session, nav);
  const all = searchRun(index, q);
  const groups = SEARCH_GROUPS.map((g): [string, SearchHit[]] => [g, all.filter((x) => x.group === g)]).filter(([, l]) => l.length);
  const shown = filter === "All" ? groups : groups.filter(([g]) => g === filter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <AnyWorkspaceShell crumbs={[{ label: "Search" }]}>
      <PageHead
        over="Search"
        title={q ? `Results for "${q}"` : "Search"}
        sub={q ? `${all.length} result${all.length === 1 ? "" : "s"}` : "Search programmes, findings, returns, reports and more"}
      />
      <form className="inp-wrap" style={{ maxWidth: 520 }} onSubmit={submit}>
        <Icon name="magnifying-glass" />
        <input className="inp" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search" data-test="search-q" />
      </form>

      {groups.length ? (
        <div className="pills">
          <button className={`pill ${filter === "All" ? "on" : ""}`} onClick={() => setFilter("All")}>
            All<span className="count">{all.length}</span>
          </button>
          {groups.map(([g, l]) => (
            <button key={g} className={`pill ${filter === g ? "on" : ""}`} onClick={() => setFilter(g)} data-test={`sg-${g}`}>
              {g}<span className="count">{l.length}</span>
            </button>
          ))}
        </div>
      ) : null}

      {shown.map(([g, l]) => {
        const cap = filter === "All" ? 6 : 200;
        const rows = l.slice(0, cap);
        return (
          <div className="card p0" key={g} data-test={`sres-${g}`}>
            <div className="tbl-tools"><span className="h4 grow">{g}</span><span className="cap muted">{l.length}</span></div>
            <div className="list">
              {rows.map((x, i) => (
                <button key={i} className="list-row" onClick={() => router.push(x.href)}>
                  <Tile icon={x.icon} size="sm" />
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="strong small" style={{ display: "block" }}>{highlight(x.title, q.toLowerCase())}</span>
                    <span className="cap muted">{x.sub}</span>
                  </span>
                  <Icon name="caret-right" />
                </button>
              ))}
              {filter === "All" && l.length > 6 ? (
                <button className="list-row small strong" style={{ color: "var(--link)" }} onClick={() => setFilter(g)}>
                  Show all {l.length} {g.toLowerCase()}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {q && !all.length ? (
        <div className="card col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
          <Tile icon="magnifying-glass" size="lg" />
          <div className="h4">No results</div>
          <p className="muted small">Try a shorter word, or a reference such as ISR-4.1.</p>
        </div>
      ) : null}
    </AnyWorkspaceShell>
  );
}
