"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";
import { Icon } from "@/lib/icons";

const STATS = [
  { label: "Open obligations", value: 2, icon: "list-checks" as const },
  { label: "Evidence items on file", value: 46, icon: "files" as const },
  { label: "Findings to close", value: 3, icon: "warning-circle" as const },
];

const OBLIGATIONS = [
  { title: "ISR 2026 annual assessment", due: "Due 30 Nov 2026", tone: "warn" as const },
  { title: "Data protection compliance 2026", due: "Choose an assessor", tone: "info" as const },
];

export default function OrganisationDashboard() {
  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Compliance dashboard" sub="Everything your organisation owes NITDA, in one place." />
      <div className="grid g3">
        {STATS.map((s) => (
          <div key={s.label} className="card stat">
            <Icon name={s.icon} />
            <div className="metric">{s.value}</div>
            <div className="small muted">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-h">
          <div className="h4">Open obligations</div>
        </div>
        <div className="col gap16">
          {OBLIGATIONS.map((o) => (
            <div key={o.title} className="row between">
              <span>{o.title}</span>
              <Chip tone={o.tone}>{o.due}</Chip>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
