"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Chip, Tile } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { STATUS_TONE, type Organisation } from "@/lib/mockData";

export function OrganisationProfileClient({ org }: { org: Organisation }) {
  return (
    <AppShell workspace="regulator">
      <Link href="/regulator/organisations" className="small strong">
        <Icon name="arrow-left" /> Organisations
      </Link>
      <div className="ph-card">
        <div className="ph-cover" style={{ background: org.color }} />
        <div className="ph-row">
          <span className="logo s88" style={{ background: org.color }}>{org.initials}</span>
          <div className="grow">
            <h1 className="h1">{org.name}</h1>
            <div className="ph-meta">
              <span><Icon name="map-pin" /> {org.hq}</span>
              <span><Icon name="buildings" /> {org.type}</span>
              {org.tier ? <span><Icon name="tag" /> {org.tier}</span> : null}
            </div>
          </div>
          <Chip tone={STATUS_TONE[org.status]}>{org.status}</Chip>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-h">
            <Tile icon="user-circle" size="sm" />
            <div className="h4">Compliance officer</div>
          </div>
          <div className="kv">
            <div>Name</div>
            <div>{org.officer}</div>
            <div>Sector</div>
            <div>{org.sector}</div>
            <div>Joined</div>
            <div>{org.joined}</div>
            <div>Last activity</div>
            <div>{org.last}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <Tile icon="tag" size="sm" />
            <div className="h4">Tags</div>
          </div>
          <div className="pills">
            {org.tags.length ? org.tags.map((t) => <span key={t} className="pill">{t}</span>) : <span className="muted small">No tags</span>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
