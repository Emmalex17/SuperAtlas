"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile, Tag } from "@/components/ui";
import { Popover, MenuItem } from "@/components/Popover";
import { Icon } from "@/lib/icons";
import { FIRMS, FIRM_TYPES, STATUS_TONE, type Firm } from "@/lib/mockData";

const STATUSES = ["All", "Accredited", "Renewal due", "In review", "Suspended"];

function leadOf(f: Firm) {
  return f.people?.find((p) => p.role === "Lead auditor");
}

export default function FirmsListPage() {
  const router = useRouter();
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuAnchor = useRef<HTMLButtonElement | null>(null);

  const base = FIRMS.filter((f) => (!type || f.types.includes(type)) && (!q || f.name.toLowerCase().includes(q.toLowerCase())));
  const rows = base.filter((f) => status === "All" ? true : f.status === status);
  const countFor = (s: string) => (s === "All" ? base.length : base.filter((f) => f.status === s).length);
  const visibleStatuses = STATUSES.filter((s) => ["All", "Accredited", "In review"].includes(s) || countFor(s) || s === status);

  function rowAction(f: Firm) {
    if (f.status === "In review") return <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/firms/${f.id}?tab=accreditations`)}>Review application</Button>;
    if (f.status === "Renewal due") return <Button variant="tertiary" size="sm">Renew</Button>;
    return null;
  }

  const menuFirm = FIRMS.find((f) => f.id === menuFor);

  return (
    <AppShell workspace="regulator">
      <PageHead
        over="NITDA"
        title="Assurance firms"
        sub="Firms accredited to assess the organisations you supervise. Accreditation lasts 12 months. Open a firm to review its application or its people."
        actions={
          <>
            <Button variant="outline" icon="export">Export</Button>
            <Button icon="user-plus">Invite a firm</Button>
          </>
        }
      />

      <div className="cat-cards c4">
        {FIRM_TYPES.map((t) => (
          <button key={t.id} className={`cat-card ${type === t.name ? "on" : ""}`} onClick={() => setType(type === t.name ? null : t.name)}>
            <Tile icon={t.icon} tone={type === t.name ? "brand" : ""} size="sm" />
            <span className="cap muted">{t.name}</span>
            <b className="tnum">{FIRMS.filter((f) => f.types.includes(t.name)).length}</b>
            <span className="cap muted">{FIRMS.filter((f) => f.types.includes(t.name) && f.status === "Accredited").length} accredited</span>
          </button>
        ))}
      </div>

      <div className="card p0">
        <div className="tbl-tools">
          <div className="inp-wrap" style={{ width: 280 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search firms" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {type ? (
            <span className="filter-chip">
              <Icon name="funnel" />
              {type}
              <button className="icon-btn" aria-label="Clear firm type filter" onClick={() => setType(null)}><Icon name="x" /></button>
            </span>
          ) : null}
          <span className="grow" />
          <span className="cap muted">{rows.length} shown</span>
        </div>
        <div className="tbl-sub">
          <div className="pills">
            {visibleStatuses.map((s) => (
              <button key={s} className={`pill ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>
                {s}<span className="count">{countFor(s)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Firm</th><th>Firm types</th><th>Status</th><th>Lead auditor</th><th className="num">Assessors</th><th className="num">Assigned</th><th>Renews</th><th className="act-col" /></tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((f) => {
                  const lead = leadOf(f);
                  return (
                    <tr key={f.id} className="click" onClick={() => router.push(`/regulator/firms/${f.id}`)}>
                      <td>
                        <div className="org">
                          <span className="logo s32" style={{ background: f.color }}>{f.initials}</span>
                          <div>
                            <div className="nm">{f.name}</div>
                            <div className="sub">{f.city}</div>
                          </div>
                        </div>
                      </td>
                      <td><div className="row wrap gap6">{f.types.map((t) => <Tag key={t}>{t}</Tag>)}</div></td>
                      <td><Chip tone={STATUS_TONE[f.status] ?? "neu"}>{f.status}</Chip></td>
                      <td className="small">{lead ? lead.name : "—"}</td>
                      <td className="num tnum">{f.people?.filter((p) => p.role === "Assessor").length ?? 0}</td>
                      <td className="num tnum">{f.assigned}</td>
                      <td className="small muted">{f.renews}</td>
                      <td className="act-col">
                        <div className="row end gap4" onClick={(e) => e.stopPropagation()}>
                          {rowAction(f)}
                          <button ref={menuFor === f.id ? menuAnchor : undefined} className="icon-btn" aria-label="More actions" onClick={() => setMenuFor(menuFor === f.id ? null : f.id)}>
                            <Icon name="dots-three" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon="briefcase" size="lg" />
                      <div className="h4">No firms match</div>
                      <p className="muted small">Try another status or firm type.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{rows.length} of {FIRMS.length} firms</div>
      </div>

      <Popover open={!!menuFor} onClose={() => setMenuFor(null)} anchorRef={menuAnchor}>
        {menuFirm ? (
          <>
            <MenuItem icon={<Icon name="eye" />} onClick={() => { setMenuFor(null); router.push(`/regulator/firms/${menuFirm.id}`); }}>Open profile</MenuItem>
            {menuFirm.status === "Accredited" || menuFirm.status === "Renewal due" ? (
              <>
                <MenuItem icon={<Icon name="arrow-clockwise" />} onClick={() => setMenuFor(null)}>Renew accreditation</MenuItem>
                <MenuItem icon={<Icon name="warning-octagon" />} danger onClick={() => setMenuFor(null)}>Suspend</MenuItem>
              </>
            ) : null}
            {menuFirm.status === "Suspended" ? <MenuItem icon={<Icon name="seal-check" />} onClick={() => setMenuFor(null)}>Reinstate</MenuItem> : null}
            {menuFirm.status === "In review" ? <MenuItem icon={<Icon name="certificate" />} onClick={() => { setMenuFor(null); router.push(`/regulator/firms/${menuFirm.id}?tab=accreditations`); }}>Review application</MenuItem> : null}
          </>
        ) : null}
      </Popover>
    </AppShell>
  );
}
