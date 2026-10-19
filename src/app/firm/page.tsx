"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";
import { Icon } from "@/lib/icons";

const STATS = [
  { label: "Active engagements", value: 14, icon: "handshake" as const },
  { label: "Awaiting your review", value: 5, icon: "files" as const },
  { label: "Reports submitted", value: 22, icon: "certificate" as const },
];

const ENGAGEMENTS = [
  { title: "Zenith Bank — ISR 2026 annual assessment", status: "In progress", tone: "info" as const },
  { title: "Wema Bank — ISR 2026 annual assessment", status: "Report submitted", tone: "ok" as const },
];

export default function FirmDashboard() {
  return (
    <AppShell workspace="firm">
      <PageHead over="Deloitte & Touche (Nigeria)" title="Engagements dashboard" sub="Your assessment work across supervised organisations." />
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
          <div className="h4">Engagements</div>
        </div>
        <div className="col gap16">
          {ENGAGEMENTS.map((e) => (
            <div key={e.title} className="row between">
              <span>{e.title}</span>
              <Chip tone={e.tone}>{e.status}</Chip>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
