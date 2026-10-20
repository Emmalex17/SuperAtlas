"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnyWorkspaceShell } from "@/components/AnyWorkspaceShell";
import { PageHead, Tile, Chip } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { ORGANISATIONS, FIRMS, TEAM, STATUS_TONE } from "@/lib/mockData";

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
  const q = (params.get("q") || "").toLowerCase();
  const [filter, setFilter] = useState("All");

  if (!session) return null;
  const isRegulator = session.workspace === "regulator";

  const orgs = isRegulator ? ORGANISATIONS.filter((o) => (o.name + o.type).toLowerCase().includes(q)) : [];
  const firms = isRegulator ? FIRMS.filter((f) => (f.name + f.types.join(" ")).toLowerCase().includes(q)) : [];
  const people = isRegulator ? TEAM.filter((p) => (p.name + p.role + p.email).toLowerCase().includes(q)) : [];
  const groups: [string, number][] = [
    ["Organisations", orgs.length],
    ["Assurance firms", firms.length],
    ["People", people.length],
  ];
  const show = (k: string) => filter === "All" || filter === k;
  const total = orgs.length + firms.length + people.length;

  return (
    <AnyWorkspaceShell>
      <PageHead over="Search" title={`Results for "${params.get("q") || ""}"`} sub={`${total} results`} />
      <div className="pills">
        <button className={`pill ${filter === "All" ? "on" : ""}`} onClick={() => setFilter("All")}>
          All<span className="count">{total}</span>
        </button>
        {groups.map(([g, c]) => (
          <button key={g} className={`pill ${filter === g ? "on" : ""}`} onClick={() => setFilter(g)}>
            {g}<span className="count">{c}</span>
          </button>
        ))}
      </div>

      {show("Organisations") && orgs.length ? (
        <div className="card p0">
          <div style={{ padding: "16px 24px" }} className="h4">Organisations</div>
          {orgs.map((o) => (
            <button
              key={o.id}
              className="row"
              style={{ width: "100%", border: 0, background: "none", padding: "12px 24px", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}
              onClick={() => router.push(`/regulator/organisations/${o.id}`)}
            >
              <span className="logo s32" style={{ background: o.color }}>{o.initials}</span>
              <div className="grow">
                <div className="strong">{highlight(o.name, q)}</div>
                <div className="cap muted">{o.type}{o.tier ? " · " + o.tier : ""}</div>
              </div>
              <Chip tone={STATUS_TONE[o.status]}>{o.status}</Chip>
            </button>
          ))}
        </div>
      ) : null}

      {show("Assurance firms") && firms.length ? (
        <div className="card p0">
          <div style={{ padding: "16px 24px" }} className="h4">Assurance firms</div>
          {firms.map((f) => (
            <button
              key={f.id}
              className="row"
              style={{ width: "100%", border: 0, background: "none", padding: "12px 24px", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}
              onClick={() => router.push(`/regulator/firms/${f.id}`)}
            >
              <span className="logo s32" style={{ background: f.color }}>{f.initials}</span>
              <div className="grow">
                <div className="strong">{highlight(f.name, q)}</div>
                <div className="cap muted">{f.types.join(" · ")}</div>
              </div>
              <Chip tone={STATUS_TONE[f.status]}>{f.status}</Chip>
            </button>
          ))}
        </div>
      ) : null}

      {show("People") && people.length ? (
        <div className="card p0">
          <div style={{ padding: "16px 24px" }} className="h4">People</div>
          {people.map((p) => (
            <div key={p.email} className="row" style={{ padding: "12px 24px", borderTop: "1px solid var(--border)" }}>
              <span className="av">{p.initials}</span>
              <div className="grow">
                <div className="strong">{highlight(p.name, q)}</div>
                <div className="cap muted">{p.role} · {p.email}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!total ? (
        <div className="card col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
          <Tile icon="magnifying-glass" size="lg" />
          <div className="h4">No results</div>
          <p className="muted small">Try a shorter word, or search by reference such as ISR-4.1.</p>
        </div>
      ) : null}
    </AnyWorkspaceShell>
  );
}
