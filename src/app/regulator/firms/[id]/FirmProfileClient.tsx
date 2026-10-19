"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Chip, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { STATUS_TONE, type Firm } from "@/lib/mockData";

export function FirmProfileClient({ firm }: { firm: Firm }) {
  return (
    <AppShell workspace="regulator">
      <Link href="/regulator/firms" className="small strong">
        <Icon name="arrow-left" /> Assurance firms
      </Link>
      <div className="ph-card">
        <div className="ph-cover" style={{ background: firm.color }} />
        <div className="ph-row">
          <span className="logo s88" style={{ background: firm.color }}>{firm.initials}</span>
          <div className="grow">
            <h1 className="h1">{firm.name}</h1>
            <div className="ph-meta">
              <span><Icon name="map-pin" /> {firm.city}</span>
              <span><Icon name="briefcase" /> {firm.types.join(", ")}</span>
            </div>
          </div>
          <Chip tone={STATUS_TONE[firm.status]}>{firm.status}</Chip>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-h">
            <Tile icon="certificate" size="sm" />
            <div className="h4">Accreditation</div>
          </div>
          <div className="kv">
            <div>Accredited since</div>
            <div>{firm.since}</div>
            <div>Renews</div>
            <div>{firm.renews}</div>
            <div>Assigned organisations</div>
            <div>{firm.assigned}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <Tile icon="tag" size="sm" />
            <div className="h4">Accreditation types</div>
          </div>
          <div className="pills">
            {firm.types.map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
