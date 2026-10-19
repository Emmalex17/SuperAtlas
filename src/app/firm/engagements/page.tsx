"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";

const ENGAGEMENTS = [
  { title: "Zenith Bank — ISR 2026 annual assessment", status: "In progress", tone: "info" as const },
  { title: "Wema Bank — ISR 2026 annual assessment", status: "Report submitted", tone: "ok" as const },
];

export default function EngagementsPage() {
  return (
    <AppShell workspace="firm">
      <PageHead over="Deloitte & Touche (Nigeria)" title="Engagements" sub="Your assessment work across supervised organisations." />
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Engagement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ENGAGEMENTS.map((e) => (
                <tr key={e.title}>
                  <td>{e.title}</td>
                  <td><Chip tone={e.tone}>{e.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
