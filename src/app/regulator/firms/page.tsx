"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip } from "@/components/ui";
import { FIRMS, STATUS_TONE } from "@/lib/mockData";

export default function FirmsListPage() {
  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Assurance firms" sub={`${FIRMS.length} accredited and applicant firms.`} />
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Firm</th>
                <th>Accreditation types</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Renews</th>
              </tr>
            </thead>
            <tbody>
              {FIRMS.map((f) => (
                <tr key={f.id} className="click">
                  <td>
                    <Link href={`/regulator/firms/${f.id}`} className="org">
                      <span className="logo s32" style={{ background: f.color }}>{f.initials}</span>
                      <div>
                        <div className="nm">{f.name}</div>
                        <div className="sub">{f.city}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="wrap">{f.types.join(", ")}</td>
                  <td>
                    <Chip tone={STATUS_TONE[f.status]}>{f.status}</Chip>
                  </td>
                  <td>{f.assigned}</td>
                  <td>{f.renews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
