"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile, Field, AlertBox } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { REGS, regReqs, regQs, createRegulation, importRequirementsDemo } from "@/lib/cases";

const REG_STATUS_TONE: Record<string, "ok" | "warn" | "neu"> = { Published: "ok", Draft: "neu" };

const APPLIES_OPTIONS = ["All", ...Array.from(new Set(REGS.flatMap((r) => r.applies))).sort()];

export default function LibraryPage() {
  const router = useRouter();
  const toast = useToast();
  const [, forceUpdate] = useState(0);
  const [q, setQ] = useState("");
  const [applies, setApplies] = useState("All");
  const [status, setStatus] = useState<"All" | "Published" | "Draft">("All");

  const [importOpen, setImportOpen] = useState(false);
  const [importedMsg, setImportedMsg] = useState<string | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [ref, setRef] = useState("");
  const [category, setCategory] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [effective, setEffective] = useState("2027-01-01");

  const rows = REGS.filter(
    (r) =>
      (applies === "All" || r.applies.includes(applies)) &&
      (status === "All" || r.status === status) &&
      (!q || (r.name + r.ref + r.category).toLowerCase().includes(q.toLowerCase()))
  );

  function submitImport() {
    const msg = importRequirementsDemo();
    setImportOpen(false);
    setImportedMsg(msg);
    toast("Requirements imported");
    forceUpdate((x) => x + 1);
  }

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !ref) {
      toast("Add a name and a reference", "bad");
      return;
    }
    const id = createRegulation({ name, ref, category, version, effective });
    setNewOpen(false);
    setName("");
    setRef("");
    setCategory("");
    setVersion("v1.0");
    setEffective("2027-01-01");
    toast("Regulation created as a draft");
    router.push(`/regulator/library/${id}`);
  }

  return (
    <AppShell workspace="regulator">
      <PageHead
        title="Requirements library"
        sub="The regulations you supervise against, broken into requirements, the questions organisations answer and the evidence they attach."
        actions={
          <>
            <Button variant="outline" icon="table" onClick={() => setImportOpen(true)}>Import spreadsheet</Button>
            <Button variant="secondary" icon="plus" testId="reg-new" onClick={() => setNewOpen(true)}>Add regulation</Button>
            <Button icon="sparkle" testId="add-ai" onClick={() => router.push("/regulator/library/ai")}>Add with AI</Button>
          </>
        }
      />

      {importedMsg ? (
        <div style={{ marginBottom: 16 }}>
          <AlertBox tone="ok" title="Spreadsheet imported" body={importedMsg} actions={<Button variant="tertiary" size="sm" onClick={() => setImportedMsg(null)}>Dismiss</Button>} />
        </div>
      ) : null}

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
                  <tr key={r.id} className="click" onClick={() => router.push(`/regulator/library/${r.id}`)} data-test={`reg-${r.id}`}>
                    <td>
                      <div className="row gap8">
                        <Tile icon="book-open-text" tone={r.isNew ? "ai" : ""} size="sm" />
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
                    <td>
                      <Chip tone={REG_STATUS_TONE[r.status] ?? "neu"}>{r.status}</Chip>
                      {r.isNew ? <Chip tone="ai" icon="sparkle">AI drafted</Chip> : null}
                    </td>
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

      <Dialog open={importOpen} onClose={() => setImportOpen(false)}>
        <div className="row"><h2 className="h3">Import requirements from a spreadsheet</h2></div>
        <p className="muted small">One row per requirement: reference, title, text, questions, evidence, categories.</p>
        <button type="button" className="drop" onClick={submitImport}>
          <Tile icon="cloud-arrow-up" size="lg" />
          <b>Drop your spreadsheet here</b>
          <span className="cap muted">.xlsx or .csv</span>
        </button>
        <div className="row between">
          <Button variant="tertiary" icon="download-simple" onClick={() => toast("Template downloaded")}>Download template</Button>
          <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
        </div>
      </Dialog>

      <Dialog open={newOpen} onClose={() => setNewOpen(false)}>
        <div className="row"><h2 className="h3">Add a regulation</h2></div>
        <p className="muted small">Start with the basics. You add sections, requirements and questions next.</p>
        <form className="col gap16" onSubmit={submitNew}>
          <Field label="Name" htmlFor="rn-name">
            <input className="inp" id="rn-name" placeholder="e.g. Cloud Computing Guidelines 2026" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="Reference" htmlFor="rn-ref">
              <input className="inp" id="rn-ref" placeholder="e.g. CCG" value={ref} onChange={(e) => setRef(e.target.value)} />
            </Field>
            <Field label="Category" htmlFor="rn-cat">
              <input className="inp" id="rn-cat" placeholder="e.g. Cloud services" value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="Version" htmlFor="rn-ver">
              <input className="inp" id="rn-ver" value={version} onChange={(e) => setVersion(e.target.value)} />
            </Field>
            <Field label="Effective date" htmlFor="rn-eff">
              <input className="inp" id="rn-eff" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
            </Field>
          </div>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button type="submit" testId="reg-create">Create regulation</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
