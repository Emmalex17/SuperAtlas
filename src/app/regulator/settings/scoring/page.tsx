"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button, Chip } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { SCHEMES, schemeOf, setDefaultScheme, saveSchemeBands, copyScheme } from "@/lib/cases";

const BAND_COLORS = ["var(--ok-solid)", "#3f9b62", "var(--warn-icon)", "var(--bad-icon)"];

export default function ScoringSettingsPage() {
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [sel, setSel] = useState("four");
  const [editOpen, setEditOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [bandDraft, setBandDraft] = useState<[string, string][]>([]);

  const s = schemeOf(sel);

  function openEdit() {
    setBandDraft(s.bands.map(([n, m]) => [n, String(m)]));
    setEditOpen(true);
  }
  function saveBands() {
    const nb: [string, number][] = bandDraft.map(([n, m]) => [n, +m]);
    for (let i = 1; i < nb.length; i++) {
      if (nb[i][1] >= nb[i - 1][1]) {
        toast("Each band must start lower than the one above it", "bad");
        return;
      }
    }
    saveSchemeBands(s.id, nb);
    setEditOpen(false);
    bump();
    toast("Rating bands saved");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Scoring schemes" }]}>
      <SettingsShell active="settings/scoring">
        <PageHead title="Scoring schemes" sub="How assessor outcomes become scores and rating bands." />
        <div className="row wrap">
          <p className="muted small grow">The assessor chooses an outcome for each requirement. The scheme turns outcomes into scores and rating bands. Scores use the assessor outcome only, never the organisation&rsquo;s own answer. Programmes pick a scheme; the default is used otherwise.</p>
          <Button size="sm" icon="plus" onClick={() => setNewOpen(true)}>New scheme</Button>
        </div>
        <div className="grid side-l">
          <div className="col gap8">
            {SCHEMES.map((x) => (
              <button key={x.id} type="button" className={`choice ${x.id === sel ? "on" : ""}`} onClick={() => setSel(x.id)} data-test={`sch-${x.id}`}>
                <span className="grow">
                  <b>{x.name}</b>
                  <br />
                  <span className="cap muted">{x.kind} · used in {x.used} programme{x.used === 1 ? "" : "s"}</span>
                </span>
                {x.def ? <Chip tone="brand" icon="star">Default</Chip> : null}
              </button>
            ))}
          </div>
          <div className="col gap24">
            <div className="card col gap16">
              <div className="row">
                <div className="grow">
                  <div className="overline">{s.kind}</div>
                  <div className="h3">{s.name}</div>
                </div>
                {s.def ? <Chip tone="brand" icon="star">Default for new programmes</Chip> : <Button variant="secondary" size="sm" onClick={() => { setDefaultScheme(s.id); bump(); toast("Default scheme changed"); }}>Make default</Button>}
              </div>
              <div className="tbl-wrap" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
                <table className="tbl">
                  <thead><tr><th>Outcome</th><th>Points</th><th>Meaning</th></tr></thead>
                  <tbody>
                    {s.levels.map(([n, p, t]) => (
                      <tr key={n}>
                        <td><Chip tone={t}>{n}</Chip></td>
                        <td className="tnum">{p === null ? <span className="muted">Not scored</span> : p}</td>
                        <td className="small muted">{p === null ? "Left out of the score; the requirement does not apply" : p === 100 ? "Fully meets the requirement" : p === 0 ? "Does not meet the requirement" : "Meets part of the requirement"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card col gap16">
              <div className="row">
                <div className="h4 grow">Rating bands</div>
                <Button variant="tertiary" size="sm" icon="pencil-simple" onClick={openEdit}>Edit bands</Button>
              </div>
              <p className="small muted">The overall score (0 to 100) is the weighted average of scored requirements.</p>
              <div style={{ display: "flex", height: 36, borderRadius: 10, overflow: "hidden" }}>
                {s.bands.map(([n, min], i) => {
                  const max = i === 0 ? 100 : s.bands[i - 1][1];
                  const w = Math.max(max - min, 8);
                  return (
                    <div key={n} style={{ flex: w, background: BAND_COLORS[i] || "var(--neu-icon)", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>
                      {n}
                    </div>
                  );
                })}
              </div>
              <div className="grid g4" style={{ gap: 8 }}>
                {s.bands.map(([n, min], i) => (
                  <div className="small" key={n}>
                    <b>{n}</b>
                    <br />
                    <span className="muted tnum">{i === 0 ? `${min} to 100` : `${min} to ${s.bands[i - 1][1] - 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SettingsShell>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="row"><h2 className="h3">Edit rating bands</h2></div>
        <p className="muted small">Set the lowest score for each band. The top band runs to 100.</p>
        <div className="col gap12">
          {bandDraft.map(([n, m], i) => (
            <div className="row" key={i}>
              <input className="inp" style={{ flex: 1 }} value={n} onChange={(e) => setBandDraft((b) => b.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} />
              <span className="muted small">from</span>
              <input
                className="inp"
                type="number"
                min={0}
                max={100}
                style={{ width: 90 }}
                value={m}
                readOnly={i === bandDraft.length - 1}
                onChange={(e) => setBandDraft((b) => b.map((x, j) => (j === i ? [x[0], e.target.value] : x)))}
              />
            </div>
          ))}
          <div className="row end">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveBands}>Save bands</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={newOpen} onClose={() => setNewOpen(false)}>
        <div className="row"><h2 className="h3">New scoring scheme</h2></div>
        <p className="muted small">Start from a template, then adjust levels and bands.</p>
        <div className="col gap8">
          {SCHEMES.map((x) => (
            <button
              key={x.id}
              type="button"
              className="choice"
              onClick={() => {
                const copy = copyScheme(x.id);
                setSel(copy.id);
                setNewOpen(false);
                bump();
                toast("Scheme created");
              }}
            >
              <span className="grow">
                <b>Copy {x.name}</b>
                <br />
                <span className="cap muted">{x.levels.length} levels</span>
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    </AppShell>
  );
}
