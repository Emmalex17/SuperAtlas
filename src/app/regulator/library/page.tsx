"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { REGS, type Regulation } from "@/lib/cases";

const REG_STATUS_TONE: Record<string, "ok" | "warn" | "neu"> = { Published: "ok", Draft: "neu" };

function regReqs(r: Regulation) {
  return r.sections.flatMap((s) => s.reqs);
}
function regQs(r: Regulation) {
  return regReqs(r).reduce((n, req) => n + req.questions.length, 0);
}

const APPLIES_OPTIONS = ["All", ...Array.from(new Set(REGS.flatMap((r) => r.applies))).sort()];

export default function LibraryPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [applies, setApplies] = useState("All");
  const [status, setStatus] = useState<"All" | "Published" | "Draft">("All");

  const rows = REGS.filter(
    (r) =>
      (applies === "All" || r.applies.includes(applies)) &&
      (status === "All" || r.status === status) &&
      (!q || (r.name + r.ref + r.category).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell workspace="regulator">
      <PageHead
        over="NITDA"
        title="Requirements library"
        sub="The regulations you supervise against, broken into requirements, the questions organisations answer and the evidence they attach."
        actions={
          <>
            <Button variant="outline" icon="table">Import spreadsheet</Button>
            <Button variant="secondary" icon="plus">Add regulation</Button>
            <Button icon="sparkle">Add with AI</Button>
          </>
        }
      />

      <div className="card p0">
        <div className="tbl-tools">
          <div className="inp-wrap" style={{ width: 300 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search regulations" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="sel" style={{ width: 250 }} value={applies} onChange={(e) => setApplies(e.target.value)}>
            {APPLIES_OPTIONS.map((a) => (
              <option key={a} value={a}>{a === "All" ? "Applies to: all categories" : a}</option>
            ))}
          </select>
          <span className="grow" />
          <div className="seg sm">
            {(["All", "Published", "Draft"] as const).map((x) => (
              <button key={x} className={status === x ? "on" : ""} onClick={() => setStatus(x)}>{x}</button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Regulation</th>
                <th>Version</th>
                <th>Effective</th>
                <th className="num">Sections</th>
                <th className="num">Requirements</th>
                <th className="num">Questions</th>
                <th>Applies to</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="click" onClick={() => router.push(`/regulator/library/${r.id}`)}>
                    <td>
                      <div className="row gap8">
                        <Tile icon="book-open-text" size="sm" />
                        <div>
                          <div className="strong">{r.name}</div>
                          <div className="cap muted">{r.ref} · {r.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="small">{r.version}</td>
                    <td className="small">{r.effective}</td>
                    <td className="num tnum">{r.sections.length}</td>
                    <td className="num tnum">{regReqs(r).length}</td>
                    <td className="num tnum">{regQs(r)}</td>
                    <td className="small">{r.applies.length} categor{r.applies.length === 1 ? "y" : "ies"}</td>
                    <td><Chip tone={REG_STATUS_TONE[r.status] ?? "neu"}>{r.status}</Chip></td>
                    <td><Icon name="caret-right" /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon="book-open-text" size="lg" />
                      <div className="h4">No regulations match</div>
                      <p className="muted small">Change the filters, or add a regulation.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{rows.length} of {REGS.length} regulations</div>
      </div>
    </AppShell>
  );
}
