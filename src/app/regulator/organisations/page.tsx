"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";
import { ORGANISATIONS, STATUS_TONE } from "@/lib/mockData";

export default function OrganisationsListPage() {
  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Organisations" sub={`${ORGANISATIONS.length} organisations under supervision.`} />
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Type</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Officer</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {ORGANISATIONS.map((o) => (
                <tr key={o.id} className="click">
                  <td>
                    <Link href={`/regulator/organisations/${o.id}`} className="org">
                      <span className="logo s32" style={{ background: o.color }}>{o.initials}</span>
                      <div>
                        <div className="nm">{o.name}</div>
                        <div className="sub">{o.hq}</div>
                      </div>
                    </Link>
                  </td>
                  <td>{o.type}</td>
                  <td>{o.tier || "—"}</td>
                  <td>
                    <Chip tone={STATUS_TONE[o.status]}>{o.status}</Chip>
                  </td>
                  <td>{o.officer}</td>
                  <td>{o.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
