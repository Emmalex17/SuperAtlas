"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button, Chip, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { ACTION_TYPES, ENF_CASES, saveActionType, atOf } from "@/lib/enforcement";

export default function ActionTypesSettingsPage() {
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [editId, setEditId] = useState<string | null | "">(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [days, setDays] = useState(14);
  const [penalty, setPenalty] = useState(false);

  function openEdit(id: string) {
    const a = atOf(id);
    setName(a.name);
    setDesc(a.d);
    setDays(a.days);
    setPenalty(a.penalty);
    setEditId(id);
  }
  function openAdd() {
    setName("");
    setDesc("");
    setDays(14);
    setPenalty(false);
    setEditId("");
  }
  function save() {
    if (!name) {
      toast("Enter a name", "bad");
      return;
    }
    saveActionType(editId || undefined, { name, d: desc, days, penalty });
    setEditId(null);
    bump();
  }

  const sorted = [...ACTION_TYPES].sort((a, b) => a.level - b.level);

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Action types" }]}>
      <SettingsShell active="settings/actions">
        <PageHead title="Action types" sub="The enforcement actions you can take, how long organisations have to respond, and which carry a penalty." actions={<Button size="sm" icon="plus" onClick={openAdd} testId="at-add">Add action type</Button>} />
        <div className="card p0">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Action</th><th className="num">Days to respond</th><th>Penalty</th><th className="num">Cases</th><th className="act-col" /></tr></thead>
              <tbody>
                {sorted.map((a) => (
                  <tr key={a.id}>
                    <td className="wrap">
                      <div className="strong small">{a.name}</div>
                      <div className="cap muted">{a.d}</div>
                    </td>
                    <td className="num tnum">{a.days || "No response"}</td>
                    <td>{a.penalty ? <Chip tone="warn">Has a penalty</Chip> : <span className="cap muted">No</span>}</td>
                    <td className="num tnum">{ENF_CASES.filter((c) => c.type === a.id).length}</td>
                    <td className="act-col">
                      <button type="button" className="icon-btn" aria-label="Edit" title="Edit" onClick={() => openEdit(a.id)}>
                        <Icon name="pencil-simple" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot">Ordered from mildest to strongest. Escalation moves to a stronger action.</div>
        </div>
      </SettingsShell>

      <Dialog open={editId !== null} onClose={() => setEditId(null)}>
        <div className="row"><h2 className="h3">{editId ? "Edit action type" : "Add action type"}</h2></div>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Name" htmlFor="at-n">
            <input className="inp" id="at-n" data-test="at-n" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="What it means" htmlFor="at-d">
            <textarea className="ta" id="at-d" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <Field label="Days to respond" hint="0 means no response is needed." htmlFor="at-days">
            <input className="inp" id="at-days" type="number" min={0} value={days} onChange={(e) => setDays(+e.target.value || 0)} />
          </Field>
          <label className="check">
            <input type="checkbox" checked={penalty} onChange={(e) => setPenalty(e.target.checked)} />
            <span>Carries a monetary penalty</span>
          </label>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setEditId(null)}>Cancel</Button>
          <Button onClick={save} testId="at-save">Save</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
