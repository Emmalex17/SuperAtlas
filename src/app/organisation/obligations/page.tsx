"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";

const OBLIGATIONS = [
  { title: "ISR 2026 annual assessment", due: "30 Nov 2026", tone: "warn" as const },
  { title: "Data protection compliance 2026", due: "Choose an assessor", tone: "info" as const },
];

export default function ObligationsPage() {
  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Obligations" sub="Everything your organisation owes NITDA." />
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Obligation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {OBLIGATIONS.map((o) => (
                <tr key={o.title}>
                  <td>{o.title}</td>
                  <td><Chip tone={o.tone}>{o.due}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
