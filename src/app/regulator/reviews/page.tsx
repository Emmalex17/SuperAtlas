"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead, Tile, Chip } from "@/components/ui";
import { Icon } from "@/lib/icons";

const BULLETS = [
  "Assign reviewers from your team",
  "Approve, then publish yourself or delegate publishing to a firm (approved reports only)",
  "Publish one, many or all, now or on a schedule",
  "Scheduled publishing holds unapproved reports and lists them in the tracker",
];

export default function ReviewsPage() {
  return (
    <AppShell workspace="regulator">
      <PageHead title="Reviews & publishing" />
      <div className="card soon-card">
        <div className="row top" style={{ gap: 16 }}>
          <Tile icon="hourglass" size="lg" />
          <div className="grow">
            <div className="row gap8">
              <span className="h3">Arrives in a later phase</span>
              <Chip tone="neu">Planned</Chip>
            </div>
            <p className="muted small" style={{ marginTop: 4 }}>This area is designed and scoped. It will be built in a following phase.</p>
            <p className="muted small" style={{ marginTop: 4 }}>Review assessed reports, approve them, then publish now or on a schedule.</p>
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
