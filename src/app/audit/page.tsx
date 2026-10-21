"use client";

import { useState } from "react";
import { AnyWorkspaceShell } from "@/components/AnyWorkspaceShell";
import { PageHead, Button, Tile } from "@/components/ui";
import { Drawer } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { getSession } from "@/lib/auth";
import { AUDIT, type AuditEntry } from "@/lib/mockData";

const WORKSPACE_LABEL: Record<string, string> = { regulator: "Regulator", organisation: "Organisation", firm: "Assurance firm" };

export default function AuditPage() {
  const toast = useToast();
  const session = getSession();
  const [who, setWho] = useState("Anyone");
  const [q, setQ] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- applied but intentionally not filtered on, matching the prototype's own auditFilter() (date range is captured but has no effect on the rows shown)
  const [range, setRange] = useState("Last 30 days");
  const [whoDraft, setWhoDraft] = useState("Anyone");
  const [qDraft, setQDraft] = useState("");
  const [rangeDraft, setRangeDraft] = useState("Last 30 days");
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  if (!session) return null;

  const scope = session.workspace === "regulator" ? AUDIT : AUDIT.filter((a) => a.workspace === session.workspace);
  const people = ["Anyone", ...Array.from(new Set(scope.map((a) => a.who)))];
  const rows = scope.filter((a) => (who === "Anyone" || a.who === who) && (!q || (a.record + a.action).toLowerCase().includes(q.toLowerCase())));

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    setQ(qDraft);
    setWho(whoDraft);
    setRange(rangeDraft);
  }

  return (
    <AnyWorkspaceShell>
      <PageHead
        over="Records"
        title="Audit trail"
        sub={session.workspace === "regulator" ? "Every action across your workspace, organisations and firms. Entries cannot be edited or deleted." : "Every action in your workspace. Entries cannot be edited or deleted."}
        actions={<Button variant="outline" icon="export" onClick={() => toast("Export started. You will get an email when it is ready.")}>Export CSV</Button>}
      />
      <form className="card tight row wrap" style={{ gap: 12 }} onSubmit={applyFilter}>
        <div className="inp-wrap grow" style={{ minWidth: 220 }}>
          <Icon name="magnifying-glass" />
          <input className="inp" placeholder="Search records and actions" value={qDraft} onChange={(e) => setQDraft(e.target.value)} />
        </div>
        <select className="sel" style={{ width: 200 }} value={whoDraft} onChange={(e) => setWhoDraft(e.target.value)}>
          {people.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select className="sel" style={{ width: 170 }} value={rangeDraft} onChange={(e) => setRangeDraft(e.target.value)}>
          {["Today", "Last 7 days", "Last 30 days", "This year"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" icon="funnel">Apply</Button>
      </form>
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th /></tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((a, i) => (
                  <tr key={i} className="click" onClick={() => setSelected(a)}>
                    <td className="tnum muted small" style={{ whiteSpace: "nowrap" }}>{a.when}</td>
                    <td>
                      <div className="row gap8">
                        <span className="av s24">{a.initials}</span>
                        <span>{a.who}</span>
                      </div>
                    </td>
                    <td className="strong">{a.action}</td>
                    <td>{a.record}</td>
                    <td><Icon name="caret-right" /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon="funnel" size="lg" />
                      <div className="h4">No matching entries</div>
                      <p className="muted small">Try a different person or search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="cap muted">Showing {rows.length} of {scope.length} entries.</p>

      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <div className="row top">
              <div className="grow">
                <div className="overline">Audit entry</div>
                <h2 className="h3" style={{ marginTop: 4 }}>{selected.action}</h2>
              </div>
              <button className="icon-btn" aria-label="Close" onClick={() => setSelected(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="kv">
              <div>When</div><div>{selected.when}</div>
              <div>Who</div><div>{selected.who}</div>
              <div>Workspace</div><div>{WORKSPACE_LABEL[selected.workspace] ?? selected.workspace}</div>
              <div>Record</div><div>{selected.record}</div>
              <div>IP address</div><div>{selected.ip || "—"}</div>
              <div>Details</div><div>{selected.detail || "—"}</div>
            </div>
            <div className="note">
              <Icon name="lock-simple" />
              Audit entries are read-only. They are kept for 7 years.
            </div>
          </>
        ) : null}
      </Drawer>
    </AnyWorkspaceShell>
  );
}
