import type { ReactNode } from "react";
import { Icon } from "@/lib/icons";

export function ProfileHeader({
  initials,
  color,
  name,
  statusChip,
  metaLine,
  web,
  location,
  group,
  actions,
  tabs,
}: {
  initials: string;
  color: string;
  name: string;
  statusChip: ReactNode;
  metaLine: ReactNode;
  web?: string;
  location?: string;
  group?: string;
  actions?: ReactNode;
  tabs: ReactNode;
}) {
  return (
    <div className="ph-card">
      <div className="ph-row">
        <span className="logo s56" style={{ background: color }}>{initials}</span>
        <div className="ph-info">
          <div className="row wrap gap8">
            <h1 className="h1">{name}</h1>
            {statusChip}
          </div>
          <div className="ph-meta">
            {metaLine}
            {web ? <span><Icon name="globe" />{web}</span> : null}
            {location ? <span><Icon name="map-pin" />{location}</span> : null}
            {group ? <span><Icon name="buildings" />Group: {group}</span> : null}
          </div>
        </div>
        <div className="row wrap gap8">{actions}</div>
      </div>
      {tabs}
    </div>
  );
}
