"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";
import { Icon } from "@/lib/icons";

const STATS = [
  { label: "Supervised organisations", value: 128, icon: "buildings" as const },
  { label: "Accredited assurance firms", value: 14, icon: "briefcase" as const },
  { label: "Pending verification", value: 2, icon: "seal-check" as const },
  { label: "Open programmes", value: 3, icon: "list-checks" as const },
];

const ACTIVITY = [
  { title: "Wema Bank requested a classification change", when: "6 Oct, 10:12", tone: "warn" as const },
  { title: "2 organisations are waiting for verification", when: "18 Oct, 16:40", tone: "info" as const },
  { title: "Halcyon Assurance applied for accreditation", when: "11 Oct, 09:05", tone: "info" as const },
];

export default function RegulatorDashboard() {
  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Supervision dashboard" sub="An overview of organisations, firms and open programmes." />
      <div className="grid g4">
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
          <div className="h4">Recent activity</div>
        </div>
        <div className="col gap16">
          {ACTIVITY.map((a) => (
            <div key={a.title} className="row between">
              <span>{a.title}</span>
              <div className="row gap8">
                <Chip tone={a.tone}>{a.when}</Chip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
