"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Tabs, Kv, Tag } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { REGS, type Regulation, type RegSection } from "@/lib/cases";
import { ORGANISATIONS } from "@/lib/mockData";

const REG_STATUS_TONE: Record<string, "ok" | "warn" | "neu"> = { Published: "ok", Draft: "neu" };

function regReqs(r: Regulation) {
  return r.sections.flatMap((s) => s.reqs);
}
function regQs(r: Regulation) {
  return regReqs(r).reduce((n, req) => n + req.questions.length, 0);
}
function orgsCovered(r: Regulation) {
  return ORGANISATIONS.filter((o) => r.applies.includes(o.type)).length;
}

type Tab = "structure" | "questions" | "evidence" | "versions";

function StructureTab({ r, open, setOpen }: { r: Regulation; open: Record<string, boolean>; setOpen: (o: Record<string, boolean>) => void }) {
  return (
    <div className="clause-tree">
      {r.sections.map((s: RegSection) => (
        <div className="cl-sec" key={s.id}>
          <div className="cl-row sec" role="button" tabIndex={0} onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}>
            <Icon name={open[s.id] ? "caret-down" : "caret-right"} />
            <b className="grow">{s.name}</b>
            <span className="cap muted">{s.reqs.length} requirement{s.reqs.length === 1 ? "" : "s"}</span>
          </div>
          {open[s.id]
            ? s.reqs.length
              ? s.reqs.map((q) => (
                  <div className="cl-row req" key={q.ref}>
                    <span className="mono ref">{q.ref}</span>
                    <span className="grow strong">{q.t}</span>
                    <span className="cl-meta"><Icon name="question" />{q.questions.length}</span>
                    <span className="cl-meta"><Icon name="paperclip" />{(q.evidence ?? []).length}</span>
                  </div>
                ))
              : <div className="cl-row req muted small">No requirements yet.</div>
            : null}
        </div>
      ))}
    </div>
  );
}

function QuestionsTab({ r }: { r: Regulation }) {
  const [sid, setSid] = useState(r.sections[0].id);
  const sec = r.sections.find((s) => s.id === sid) ?? r.sections[0];
  let n = 0;
  return (
    <div className="q-layout">
      <div className="q-secs">
        <div className="overline" style={{ padding: "4px 8px 8px" }}>Sections</div>
        {r.sections.map((s) => (
          <button key={s.id} className={`q-sec ${s.id === sid ? "on" : ""}`} onClick={() => setSid(s.id)}>
            <span className="grow">{s.name}</span>
            <span className="count">{s.reqs.reduce((a, q) => a + q.questions.length, 0)}</span>
          </button>
        ))}
      </div>
      <div className="col gap12">
        {sec.reqs.length ? (
          sec.reqs.map((q) =>
            q.questions.map((qq, qi) => {
              n++;
              return (
                <div className="q-card" key={`${q.ref}#${qi}`}>
                  <div className="row top">
                    <span className="q-n">{n}</span>
                    <div className="grow">
                      <div className="strong">{qq[0]}</div>
                      <div className="row wrap gap8" style={{ marginTop: 6 }}>
                        <span className="cap muted">{qq[1]}</span>
                        <span className="cap mono">{q.ref}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className="card flat">
            <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "24px 16px", gap: 8 }}>
              <Icon name="question" />
              <div className="h4">No questions in this section</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceTab({ r }: { r: Regulation }) {
  const rows = r.sections.flatMap((s) => s.reqs.flatMap((q) => (q.evidence ?? []).map((ev) => ({ ev, q, sName: s.name }))));
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Evidence item</th><th>Requirement</th><th>Section</th></tr></thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i}>
                <td><div className="row gap8"><Icon name="paperclip" /><span>{row.ev}</span></div></td>
                <td><span className="mono small">{row.q.ref}</span> <span className="small muted">{row.q.t}</span></td>
                <td className="small muted">{row.sName}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={3}><div className="col" style={{ alignItems: "center", textAlign: "center", padding: "24px 16px" }}><Icon name="paperclip" /><div className="h4">No evidence yet</div></div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function VersionsTab({ r }: { r: Regulation }) {
  const rows: [string, string, string, boolean?][] = [
    [r.version, r.updated || r.effective, "Current version", true],
    ["v1.4", "1 Jun 2025", "Wording changed in sections 4 and 7"],
    ["v1.0", "1 Jan 2024", "First published"],
  ].slice(0, r.version === "v1.0" ? 1 : 3) as [string, string, string, boolean?][];
  return (
    <div className="timeline" style={{ padding: 20 }}>
      {rows.map(([v, d, n, cur]) => (
        <div className="tl" key={v}>
          <span className={`tile sm ${cur ? "brand" : ""}`}><Icon name="git-commit" /></span>
          <div className="grow">
            <div className="row gap8"><span className="tag mono">{v}</span><b>{n}</b></div>
            <div className="cap muted">{d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RegulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const r = REGS.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>("structure");
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries((r?.sections ?? []).map((s, i) => [s.id, i < 2])));

  if (!r) notFound();

  const reqs = regReqs(r);
  const det: [string, React.ReactNode][] = [
    ["Title", r.name],
    ["Reference", <span className="mono" key="ref">{r.ref}</span>],
    ["Category", r.category],
    ["Status", <Chip tone={REG_STATUS_TONE[r.status] ?? "neu"} key="st">{r.status}</Chip>],
    ["Version", r.version],
    ["Effective from", r.effective],
    ["Total sections", r.sections.length],
    ["Total requirements", reqs.length],
    ["Total questions", regQs(r)],
    ["Organisations covered", orgsCovered(r)],
    ["Last updated", r.updated || "—"],
  ];

  return (
    <AppShell workspace="regulator">
      <div className="reg-layout">
        <aside className="col gap16">
          <div className="card col gap12">
            <div className="h4">Details</div>
            <Kv pairs={det} />
            {r.applies.length ? (
              <div>
                <div className="cap muted" style={{ marginBottom: 6 }}>Applies to</div>
                <div className="row wrap gap6">{r.applies.map((a) => <Tag key={a}>{a}</Tag>)}</div>
              </div>
            ) : null}
          </div>
        </aside>
        <section className="col gap16" style={{ minWidth: 0 }}>
          <div>
            <div className="row wrap gap8">
              <span className="tag mono">{r.ref}</span>
              <Chip tone={REG_STATUS_TONE[r.status] ?? "neu"}>{r.status}</Chip>
            </div>
            <h1 className="h1" style={{ marginTop: 6 }}>{r.name}</h1>
            {r.desc ? <p className="muted" style={{ marginTop: 4, maxWidth: "80ch" }}>{r.desc}</p> : null}
          </div>
          <div className="card p0">
            <Tabs
              items={[
                { id: "structure", label: "Requirements", count: reqs.length },
                { id: "questions", label: "Questions", count: regQs(r) },
                { id: "evidence", label: "Evidence", count: reqs.reduce((a, q) => a + (q.evidence ?? []).length, 0) },
                { id: "versions", label: "Versions" },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div style={{ padding: tab === "versions" ? 0 : 16 }}>
              {tab === "structure" ? <StructureTab r={r} open={open} setOpen={setOpen} /> : null}
              {tab === "questions" ? <QuestionsTab r={r} /> : null}
              {tab === "evidence" ? <EvidenceTab r={r} /> : null}
              {tab === "versions" ? <VersionsTab r={r} /> : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
