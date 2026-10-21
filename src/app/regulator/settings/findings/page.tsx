"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { FINDING_CLASSES, saveFindingClasses, type FindingClass } from "@/lib/cases";

const TONE_OPTS: [FindingClass["tone"], string][] = [
  ["bad", "Red"],
  ["warn", "Amber"],
  ["info", "Blue"],
  ["neu", "Grey"],
];

export default function FindingClassesSettingsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<FindingClass[]>(FINDING_CLASSES);

  function update<K extends keyof FindingClass>(i: number, key: K, value: FindingClass[K]) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: value } : row)));
  }
  function moveUp(i: number) {
    if (!i) return;
    setRows((r) => {
      const next = [...r];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }
  function remove(i: number) {
    if (rows.length <= 1) {
      toast("Keep at least one class", "bad");
      return;
    }
    setRows((r) => r.filter((_, j) => j !== i));
  }
  function add() {
    setRows((r) => [...r, { code: "NEW", name: "New class", d: "", days: 60, tone: "info" }]);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rows.some((f) => !f.code || !f.name)) {
      toast("Every class needs a code and a name", "bad");
      return;
    }
    saveFindingClasses(rows);
    toast("Finding classes saved");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Finding classes" }]}>
      <SettingsShell active="settings/findings">
        <PageHead title="Finding classes" sub="Finding classes and how soon each must be fixed." />
        <div className="row wrap">
          <p className="muted small grow">Assessors classify every finding. The class sets how soon the organisation must fix it. Changes apply to findings raised from now on.</p>
          <Button size="sm" icon="plus" onClick={add}>Add class</Button>
        </div>
        <form className="card p0" onSubmit={submit}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Code</th>
                  <th>Name</th>
                  <th>Meaning</th>
                  <th style={{ width: 150 }}>Fix within (days)</th>
                  <th style={{ width: 150 }}>Colour</th>
                  <th className="act-col" />
                </tr>
              </thead>
              <tbody>
                {rows.map((f, i) => (
                  <tr key={i}>
                    <td><input className="inp" style={{ height: 34 }} value={f.code} onChange={(e) => update(i, "code", e.target.value)} /></td>
                    <td><input className="inp" style={{ height: 34 }} value={f.name} onChange={(e) => update(i, "name", e.target.value)} /></td>
                    <td className="wrap"><input className="inp" style={{ height: 34 }} value={f.d} onChange={(e) => update(i, "d", e.target.value)} /></td>
                    <td><input className="inp" type="number" min={0} style={{ height: 34 }} value={f.days} onChange={(e) => update(i, "days", Math.max(0, +e.target.value || 0))} /></td>
                    <td>
                      <select className="sel" style={{ height: 34 }} value={f.tone} onChange={(e) => update(i, "tone", e.target.value as FindingClass["tone"])}>
                        {TONE_OPTS.map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="act-col">
                      <button type="button" className="icon-btn" aria-label="Move up" title="Move up" onClick={() => moveUp(i)}>
                        <Icon name="arrow-up" />
                      </button>
                      <button type="button" className="icon-btn" aria-label="Remove" title="Remove" onClick={() => remove(i)}>
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot row between">
            <span>0 days means no fix deadline. Order sets severity, most severe first.</span>
            <Button type="submit" size="sm" testId="fc-save">Save classes</Button>
          </div>
        </form>
      </SettingsShell>
    </AppShell>
  );
}
