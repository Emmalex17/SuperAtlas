"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button, Field, Kv, Tile } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { FIRM_TYPES, FIRM_RULES, FIRMS, saveFirmRules, saveFirmTypeCriteria } from "@/lib/mockData";

export default function FirmTypesSettingsPage() {
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [editId, setEditId] = useState<string | null>(null);
  const [criteriaDraft, setCriteriaDraft] = useState("");
  const [credsDraft, setCredsDraft] = useState("");

  const [renewal, setRenewal] = useState(FIRM_RULES.renewal);
  const [grace, setGrace] = useState(FIRM_RULES.grace);
  const [conflictMonths, setConflictMonths] = useState(FIRM_RULES.conflictMonths);

  function openEdit(id: string) {
    const t = FIRM_TYPES.find((x) => x.id === id)!;
    setCriteriaDraft(t.criteria.join("\n"));
    setCredsDraft(t.creds);
    setEditId(id);
  }
  function saveEdit() {
    if (!editId) return;
    saveFirmTypeCriteria(
      editId,
      criteriaDraft.split("\n").map((x) => x.trim()).filter(Boolean),
      credsDraft
    );
    setEditId(null);
    bump();
    toast("Criteria updated");
  }

  function submitRules(e: React.FormEvent) {
    e.preventDefault();
    saveFirmRules({ renewal, grace, conflictMonths });
    toast("Firm types saved");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Firm types" }]}>
      <SettingsShell active="settings/firm-types">
        <PageHead title="Firm types" sub="The kinds of assurance firm you accredit." />
        <p className="muted small">Firms apply for accreditation by type. Set what each type must show, and how long accreditation lasts.</p>
        <div className="grid g2">
          {FIRM_TYPES.map((t) => (
            <div key={t.id} className="card col gap12">
              <div className="row">
                <Tile icon={t.icon} />
                <div className="grow h4">{t.name}</div>
                <span className="chip neu">{FIRMS.filter((f) => f.types.includes(t.name)).length} firms</span>
              </div>
              <div className="overline">Accreditation criteria</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }} className="small">
                {t.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <Kv pairs={[["Assessor credentials", t.creds], ["Documents", t.docs]]} />
              <div className="row end">
                <Button variant="tertiary" size="sm" icon="pencil-simple" onClick={() => openEdit(t.id)}>Edit criteria</Button>
              </div>
            </div>
          ))}
        </div>
        <form className="card col gap16" onSubmit={submitRules}>
          <div className="h4">Rules for every type</div>
          <div className="grid g3" style={{ gap: 16 }}>
            <Field label="Accreditation lasts" htmlFor="fr-ren">
              <div className="row gap8">
                <input className="inp" id="fr-ren" type="number" min={1} style={{ width: 100 }} value={renewal} onChange={(e) => setRenewal(e.target.value)} />
                <span className="muted">months</span>
              </div>
            </Field>
            <Field label="Renewal reminder" htmlFor="fr-grace">
              <div className="row gap8">
                <input className="inp" id="fr-grace" type="number" style={{ width: 100 }} value={grace} onChange={(e) => setGrace(e.target.value)} />
                <span className="muted">days before expiry</span>
              </div>
            </Field>
            <Field label="Independence window" hint="A firm cannot assess an organisation it advised in this period." htmlFor="fr-coi">
              <div className="row gap8">
                <input className="inp" id="fr-coi" type="number" style={{ width: 100 }} value={conflictMonths} onChange={(e) => setConflictMonths(e.target.value)} />
                <span className="muted">months</span>
              </div>
            </Field>
          </div>
          <div className="note">Organisations may ask to use a firm that is not accredited. You approve or decline each request (Drop B).</div>
          <div className="row end">
            <Button type="submit" testId="save-ft">Save firm types</Button>
          </div>
        </form>
      </SettingsShell>

      <Dialog open={editId !== null} onClose={() => setEditId(null)} wide>
        <div className="row"><h2 className="h3">Edit {FIRM_TYPES.find((t) => t.id === editId)?.name}</h2></div>
        <p className="muted small">One criterion per line.</p>
        <div className="col gap16">
          <Field label="Criteria" htmlFor="ft-c">
            <textarea className="ta" id="ft-c" rows={5} value={criteriaDraft} onChange={(e) => setCriteriaDraft(e.target.value)} />
          </Field>
          <Field label="Assessor credentials" htmlFor="ft-cr">
            <input className="inp" id="ft-cr" value={credsDraft} onChange={(e) => setCredsDraft(e.target.value)} />
          </Field>
          <div className="row end">
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
