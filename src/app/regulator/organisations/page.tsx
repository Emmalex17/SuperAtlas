"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile } from "@/components/ui";
import { Popover, MenuItem } from "@/components/Popover";
import { Icon, type IconName } from "@/lib/icons";
import { ORGANISATIONS, STATUS_TONE, CLASS_REQS, type Organisation } from "@/lib/mockData";

function orgStatus(o: Organisation): string {
  if (o.status === "Verified" && CLASS_REQS.some((r) => r.org === o.id && r.status === "Pending")) return "Change requested";
  return o.status;
}

const CARDS: { label: string; icon: IconName; match: (o: Organisation) => boolean }[] = [
  { label: "Commercial banks", icon: "bank", match: (o) => o.type === "Commercial bank" },
  { label: "Non-interest banks", icon: "bank", match: (o) => o.type === "Non-interest bank" },
  { label: "Microfinance banks", icon: "bank", match: (o) => o.type === "Microfinance bank" },
  { label: "Payments", icon: "credit-card", match: (o) => o.sector === "Payments" },
  { label: "Digital economy", icon: "cloud", match: (o) => o.sector === "Digital economy" },
];

const STATUSES = ["All", "Verified", "Invited", "Pending verification", "Info requested", "Change requested", "Invite expired", "Rejected"];

export default function OrganisationsListPage() {
  const router = useRouter();
  const [card, setCard] = useState<string | null>(null);
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuAnchor = useRef<HTMLButtonElement | null>(null);

  const activeCard = CARDS.find((c) => c.label === card);
  const base = ORGANISATIONS.filter((o) => (!activeCard || activeCard.match(o)) && (!q || (o.name + o.officer + (o.web ?? "")).toLowerCase().includes(q.toLowerCase())));
  const rows = base.filter((o) => status === "All" ? true : orgStatus(o) === status);
  const countFor = (s: string) => (s === "All" ? base.length : base.filter((o) => orgStatus(o) === s).length);
  const visibleStatuses = STATUSES.filter((s) => ["All", "Verified", "Invited", "Pending verification"].includes(s) || countFor(s) || s === status);

  function rowAction(o: Organisation) {
    const st = orgStatus(o);
    if (st === "Pending verification" || st === "Info requested") return <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/organisations/${o.id}?tab=verification`)}>Review</Button>;
    if (st === "Change requested") return <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/organisations/${o.id}?tab=classification`)}>Review change</Button>;
    if (st === "Invited" || st === "Invite expired") return <Button variant="tertiary" size="sm">Resend</Button>;
    return null;
  }

  const menuOrg = ORGANISATIONS.find((o) => o.id === menuFor);

  return (
    <AppShell workspace="regulator">
      <PageHead
        over="NITDA"
        title="Organisations"
        sub="Everyone you supervise, from invitation to verified. Open an organisation to verify it, review a category change or manage its invitation."
        actions={
          <>
            <Button variant="outline" icon="export">Export</Button>
            <Link href="/regulator/organisations/invite"><Button icon="user-plus">Invite organisations</Button></Link>
          </>
        }
      />

      <div className="cat-cards" style={{ ["--n" as string]: CARDS.length }}>
        {CARDS.map((c) => (
          <button key={c.label} className={`cat-card ${card === c.label ? "on" : ""}`} onClick={() => setCard(card === c.label ? null : c.label)}>
            <Tile icon={c.icon} tone={card === c.label ? "brand" : ""} size="sm" />
            <span className="cat-l">{c.label}</span>
            <b className="tnum">{ORGANISATIONS.filter(c.match).length}</b>
          </button>
        ))}
      </div>

      <div className="card p0">
        <div className="tbl-tools">
          <div className="inp-wrap" style={{ width: 280 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search name, officer or website" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {activeCard ? (
            <span className="filter-chip">
              <Icon name="funnel" />
              {activeCard.label}
              <button className="icon-btn" aria-label="Clear category filter" onClick={() => setCard(null)}><Icon name="x" /></button>
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
              <tr><th>Organisation</th><th>Category</th><th>Status</th><th>Last activity</th><th className="act-col" /></tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((o) => (
                  <tr key={o.id} className="click" onClick={() => router.push(`/regulator/organisations/${o.id}`)}>
                    <td>
                      <div className="org">
                        <span className="logo s32" style={{ background: o.color }}>{o.initials}</span>
                        <div>
                          <div className="nm">{o.name}</div>
                          <div className="sub">{o.officer && o.officer !== "—" ? `${o.officer} · ${o.web ?? ""}` : o.web}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="cls"><Icon name="buildings" /><b>{o.type || "Category to confirm"}</b>{o.tier ? <i>{o.tier}</i> : null}</span></td>
                    <td>
                      <Chip tone={STATUS_TONE[orgStatus(o)] ?? "neu"}>{orgStatus(o)}</Chip>
                      {o.isNew ? <Chip tone="brand">New</Chip> : null}
                    </td>
                    <td className="small muted">{o.last || "—"}</td>
                    <td className="act-col">
                      <div className="row end gap4" onClick={(e) => e.stopPropagation()}>
                        {rowAction(o)}
                        <button
                          ref={menuFor === o.id ? menuAnchor : undefined}
                          className="icon-btn"
                          aria-label="More actions"
                          onClick={() => setMenuFor(menuFor === o.id ? null : o.id)}
                        >
                          <Icon name="dots-three" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                      <Tile icon="magnifying-glass" size="lg" />
                      <div className="h4">No organisations match</div>
                      <p className="muted small">Try another status, category or search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{ORGANISATIONS.length} organisations managed on SuperAtlas</div>
      </div>

      <Popover open={!!menuFor} onClose={() => setMenuFor(null)} anchorRef={menuAnchor}>
        {menuOrg ? (
          <>
            <MenuItem icon={<Icon name="eye" />} onClick={() => { setMenuFor(null); router.push(`/regulator/organisations/${menuOrg.id}`); }}>Open profile</MenuItem>
            {orgStatus(menuOrg) === "Verified" || orgStatus(menuOrg) === "Change requested" ? (
              <MenuItem icon={<Icon name="git-diff" />} onClick={() => setMenuFor(null)}>Change category</MenuItem>
            ) : null}
            {menuOrg.status === "Invited" || menuOrg.status === "Invite expired" ? (
              <>
                <MenuItem icon={<Icon name="arrow-clockwise" />} onClick={() => setMenuFor(null)}>Resend invitation</MenuItem>
                <MenuItem icon={<Icon name="x-circle" />} danger onClick={() => setMenuFor(null)}>Revoke invitation</MenuItem>
              </>
            ) : null}
            {menuOrg.status === "Pending verification" || menuOrg.status === "Info requested" ? (
              <MenuItem icon={<Icon name="seal-check" />} onClick={() => { setMenuFor(null); router.push(`/regulator/organisations/${menuOrg.id}?tab=verification`); }}>Review application</MenuItem>
            ) : null}
          </>
        ) : null}
      </Popover>
    </AppShell>
  );
}
