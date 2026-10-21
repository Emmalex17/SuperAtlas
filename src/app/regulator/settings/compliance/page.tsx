"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Chip, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { SERIES, COMPLIANCE_SETTINGS, cyclesOf, saveComplianceSettings } from "@/lib/cases";

export default function ComplianceSettingsPage() {
  const toast = useToast();
  const sers = SERIES.filter((s) => cyclesOf(s.id).length);
  const [bench, setBench] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    sers.forEach((s) => {
      init[s.id] = String(COMPLIANCE_SETTINGS.bench[s.id] ?? 70);
    });
    return init;
  });
  const [watchDays, setWatchDays] = useState(COMPLIANCE_SETTINGS.watchDays);
  const [cyclesRunning, setCyclesRunning] = useState(COMPLIANCE_SETTINGS.cyclesRunning);
  const [lateRuns, setLateRuns] = useState(COMPLIANCE_SETTINGS.lateRuns);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextBench: Record<string, number> = { ...COMPLIANCE_SETTINGS.bench };
    sers.forEach((s) => {
      const v = bench[s.id];
      if (v !== "") nextBench[s.id] = Math.max(0, Math.min(100, +v));
    });
    saveComplianceSettings({ bench: nextBench, watchDays, cyclesRunning, lateRuns });
    toast("Compliance status rules saved");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Compliance status" }]}>
      <SettingsShell active="settings/compliance">
        <PageHead title="Compliance status" sub="Benchmarks and the rules that set each organisation&rsquo;s compliance status." />
        <div className="card col gap12">
          <div className="h4">How status is worked out</div>
          <p className="small muted">Each organisation gets a status for each programme from its latest published report. The score stays fixed until the next cycle; the status moves as findings are fixed and closed.</p>
          <div className="tbl-wrap" style={{ margin: "0 -20px" }}>
            <table className="tbl">
              <thead><tr><th>Status</th><th>Rule</th></tr></thead>
              <tbody>
                <tr><td><Chip tone="ok" icon="check-circle">Compliant</Chip></td><td className="wrap small">Score at or above the programme&rsquo;s benchmark, and no open major nonconformity</td></tr>
                <tr><td><Chip tone="warn" icon="warning">Compliant with conditions</Chip></td><td className="wrap small">At or above the benchmark with a major nonconformity still open, or below it with every nonconformity fixed and closed</td></tr>
                <tr><td><Chip tone="bad" icon="x-circle">Non-compliant</Chip></td><td className="wrap small">Below the benchmark with nonconformities still open</td></tr>
                <tr><td><Chip tone="ai" icon="eye">Enforcement watch</Chip></td><td className="wrap small">A flag on top of the status. Set the rules below.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <form className="card col gap16" onSubmit={submit}>
          <div className="h4">Benchmarks</div>
          <p className="small muted">The score an organisation needs to be compliant in each programme (0 to 100).</p>
          <div className="grid g3" style={{ gap: 14 }}>
            {sers.map((s) => (
              <Field key={s.id} label={s.name} htmlFor={`bench-${s.id}`}>
                <input className="inp" id={`bench-${s.id}`} type="number" min={0} max={100} data-test={`bench-${s.id}`} value={bench[s.id] ?? ""} onChange={(e) => setBench((b) => ({ ...b, [s.id]: e.target.value }))} />
              </Field>
            ))}
          </div>
          <div className="h4" style={{ marginTop: 6 }}>Enforcement watch</div>
          <p className="small muted">An organisation is flagged when any of these is true. Leave a box empty to switch that rule off.</p>
          <div className="grid g3" style={{ gap: 14 }}>
            <Field label="Major nonconformity overdue by more than (days)" hint={watchDays ? "" : "Not set yet, so this rule is off."} htmlFor="cw-days">
              <input className="inp" id="cw-days" type="number" min={1} placeholder="Not set" data-test="cw-days" value={watchDays} onChange={(e) => setWatchDays(e.target.value)} />
            </Field>
            <Field label="Non-compliant in this many cycles running" htmlFor="cw-cycles">
              <input className="inp" id="cw-cycles" type="number" min={1} value={cyclesRunning} onChange={(e) => setCyclesRunning(e.target.value)} />
            </Field>
            <Field label="Late with the same return this many periods running" htmlFor="cw-late">
              <input className="inp" id="cw-late" type="number" min={1} value={lateRuns} onChange={(e) => setLateRuns(e.target.value)} />
            </Field>
          </div>
          <div className="row end">
            <Button type="submit" testId="comp-save">Save</Button>
          </div>
        </form>
      </SettingsShell>
    </AppShell>
  );
}
