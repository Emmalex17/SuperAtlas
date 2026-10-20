"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Tile, Chip } from "@/components/ui";
import { Icon } from "@/lib/icons";

const BULLETS = [
  "Define return templates and due dates by category",
  "Each entity in a group files separately",
  "Late returns flagged after the grace period",
  "Validation rules and resubmission requests",
];

export default function ReturnsPage() {
  return (
    <AppShell workspace="regulator">
      <PageHead title="Data returns" />
      <div className="card soon-card">
        <div className="row top" style={{ gap: 16 }}>
          <Tile icon="hourglass" size="lg" />
          <div className="grow">
            <div className="row gap8">
              <span className="h3">Arrives in a later phase</span>
              <Chip tone="neu">Planned</Chip>
            </div>
            <p className="muted small" style={{ marginTop: 4 }}>This area is designed and scoped. It will be built in a following phase.</p>
            <p className="muted small" style={{ marginTop: 4 }}>Periodic returns filed straight to you. No firm involved.</p>
            <ul className="soon-list">
              {BULLETS.map((b) => (
                <li key={b}><Icon name="check" /><span>{b}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
