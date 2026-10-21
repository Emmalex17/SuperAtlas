"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { Popover, MenuItem } from "@/components/Popover";
import { Icon, type IconName } from "@/lib/icons";
import { ORGANISATIONS, CATEGORIES, allCategoryTypes, STATUS_TONE, CLASS_REQS, type Organisation } from "@/lib/mockData";
import { useToast } from "@/components/Toast";

function orgStatus(o: Organisation): string {
  if (o.status === "Verified" && CLASS_REQS.some((r) => r.org === o.id && r.status === "Pending")) return "Change requested";
  return o.status;
}

type CatOption = { key: string; label: string; kind: "sector" | "type"; value: string; icon: IconName; group: string };

const SECTOR_IC: Record<string, IconName> = { Banking: "bank", Payments: "credit-card", "Digital economy": "cloud" };
const TYPE_IC: Record<string, IconName> = {
  "Microfinance bank": "piggy-bank",
  "Mobile money operator": "device-mobile",
  "Switching and processing": "arrows-left-right",
  "Payment solution service provider": "credit-card",
  "Data controller of major importance": "database",
  "Cloud service provider": "cloud",
  "Fintech platform": "lightning",
};

/** Every category, pinnable as a card: one option per sector, one per type — the prototype's catOptions(). */
function catOptions(): CatOption[] {
  return CATEGORIES.flatMap((c) => [
    { key: `s:${c.name}`, label: c.name, kind: "sector" as const, value: c.name, icon: SECTOR_IC[c.name] ?? "squares-four", group: "Sectors" },
    ...c.types.map((t) => ({ key: `t:${t.name}`, label: t.plural ?? t.name, kind: "type" as const, value: t.name, icon: TYPE_IC[t.name] ?? SECTOR_IC[c.name] ?? "buildings", group: c.name })),
  ]);
}

const DEFAULT_PINS = ["t:Commercial bank", "t:Non-interest bank", "t:Merchant bank", "t:Microfinance bank", "s:Payments", "s:Digital economy"];
const PINS_KEY = "sa-catpins";

function inCard(o: Organisation, c: CatOption | undefined): boolean {
  if (!c) return true;
  return c.kind === "type" ? o.type === c.value : o.sector === c.value;
}

/** Organisations this regulator manages on SuperAtlas (invited onwards), excluding rejected ones. */
function managed(): Organisation[] {
  return ORGANISATIONS.filter((o) => o.status !== "Rejected");
}

const STATUSES = ["All", "Verified", "Invited", "Pending verification", "Info requested", "Change requested", "Invite expired", "Rejected"];

export default function OrganisationsListPage() {
  const router = useRouter();
  const toast = useToast();
  const [card, setCard] = useState<string | null>(null);
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuAnchor = useRef<HTMLButtonElement | null>(null);

  const [pinKeys, setPinKeys] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only store (localStorage) that cannot be observed during SSR.
      if (saved) setPinKeys(JSON.parse(saved));
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const [allOpen, setAllOpen] = useState(false);
  const allAnchor = useRef<HTMLButtonElement | null>(null);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [draftPins, setDraftPins] = useState<string[]>([]);

  const opts = catOptions();
  const pins = (pinKeys ?? DEFAULT_PINS).map((k) => opts.find((o) => o.key === k)).filter((o): o is CatOption => !!o);
  const groups = [...new Set(opts.map((o) => o.group))];
  const activeCard = opts.find((c) => c.key === card);
  const catCount = (c: CatOption) => managed().filter((o) => inCard(o, c)).length;

  const base = ORGANISATIONS.filter((o) => inCard(o, activeCard) && (!q || (o.name + o.officer + (o.web ?? "")).toLowerCase().includes(q.toLowerCase())));
  const rows = base.filter((o) => (status === "All" ? true : orgStatus(o) === status));
  const countFor = (s: string) => (s === "All" ? base.length : base.filter((o) => orgStatus(o) === s).length);
  const visibleStatuses = STATUSES.filter((s) => ["All", "Verified", "Invited", "Pending verification"].includes(s) || countFor(s) || s === status);
  const insightsType = activeCard ? allCategoryTypes().find((t) => t.name === activeCard.label || t.plural === activeCard.label) : undefined;

  function rowAction(o: Organisation) {
    const st = orgStatus(o);
    if (st === "Pending verification" || st === "Info requested") return <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/organisations/${o.id}?tab=verification`)}>Review</Button>;
    if (st === "Change requested") return <Button variant="secondary" size="sm" onClick={() => router.push(`/regulator/organisations/${o.id}?tab=classification`)}>Review change</Button>;
    if (st === "Invited" || st === "Invite expired") return <Button variant="tertiary" size="sm">Resend</Button>;
    return null;
  }

  function openCustomise() {
    setAllOpen(false);
    setDraftPins(pinKeys ?? DEFAULT_PINS);
    setCustomiseOpen(true);
  }

  function toggleDraftPin(key: string, checked: boolean) {
    setDraftPins((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
  }

  function savePins() {
    if (!draftPins.length) {
      toast("Choose at least one card", "bad");
      return;
    }
    setPinKeys(draftPins);
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(draftPins));
    } catch {
      // ignore unavailable storage
    }
    setCustomiseOpen(false);
    toast("Category cards saved");
  }

  function resetPins() {
    setPinKeys(null);
    try {
      localStorage.removeItem(PINS_KEY);
    } catch {
      // ignore unavailable storage
    }
    setCustomiseOpen(false);
    toast("Category cards reset");
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
            <Link href="/regulator/settings/categories" className="icon-btn bordered" title="Category settings" aria-label="Category settings">
              <Icon name="gear-six" />
            </Link>
            <Button variant="outline" icon="export">Export</Button>
            <Link href="/regulator/organisations/invite"><Button icon="user-plus">Invite organisations</Button></Link>
          </>
        }
      />

      <div className="cat-cards" style={{ ["--n" as string]: pins.length + 1 }}>
        {pins.map((c) => (
          <button key={c.key} className={`cat-card ${card === c.key ? "on" : ""}`} onClick={() => setCard(card === c.key ? null : c.key)} data-test={`cat-${c.value.split(" ")[0].toLowerCase()}`} title={c.label}>
            <Tile icon={c.icon} tone={card === c.key ? "brand" : ""} size="sm" />
            <span className="cat-l">{c.label}</span>
            <b className="tnum">{catCount(c)}</b>
          </button>
        ))}
        <div style={{ position: "relative" }}>
          <button ref={allAnchor} className={`cat-card more ${card && !pins.some((p) => p.key === card) ? "on" : ""}`} onClick={() => setAllOpen((o) => !o)} data-test="cat-all" style={{ width: "100%" }}>
            <Tile icon="dots-three" size="sm" />
            <span className="cat-l">All categories</span>
            <span className="cat-more">{opts.length} to choose from <Icon name="caret-down" /></span>
          </button>
          <Popover open={allOpen} onClose={() => setAllOpen(false)} anchorRef={allAnchor}>
            <div className="row between" style={{ padding: "6px 8px 8px" }}>
              <b>All categories</b>
              <button type="button" className="link-btn small" onClick={openCustomise}>Choose cards</button>
            </div>
            <div className="cat-pop">
              {groups.map((g) => (
                <div key={g}>
                  <div className="overline" style={{ padding: "8px 10px 4px" }}>{g}</div>
                  {opts.filter((o) => o.group === g).map((o) => (
                    <button key={o.key} type="button" className={`menu-item ${card === o.key ? "on" : ""}`} onClick={() => { setCard(o.key); setAllOpen(false); }}>
                      <Icon name={o.icon} />
                      <span className="grow">{o.label}</span>
                      <span className="tnum muted small">{catCount(o)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </Popover>
        </div>
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
          {insightsType ? (
            <Button variant="tertiary" size="sm" icon="chart-bar" testId="cat-insights" onClick={() => router.push(`/regulator/organisations/category/${encodeURIComponent(insightsType.name)}`)}>
              Category insights
            </Button>
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
        <div className="tbl-foot">{managed().length} organisations managed on SuperAtlas</div>
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

      <Dialog open={customiseOpen} onClose={() => setCustomiseOpen(false)} wide>
        <div className="row top">
          <div className="grow">
            <h2 className="h3">Choose your category cards</h2>
            <p className="muted small">Pick up to 6 to show above the table. Every category stays available under All categories. This only changes your view.</p>
          </div>
          <button className="icon-btn" type="button" aria-label="Close" onClick={() => setCustomiseOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
        <div className="pin-grid">
          {groups.map((g) => (
            <div key={g}>
              <div className="overline" style={{ marginBottom: 6 }}>{g}</div>
              {opts.filter((o) => o.group === g).map((o) => {
                const checked = draftPins.includes(o.key);
                const disabled = !checked && draftPins.length >= 6;
                return (
                  <label className="check" key={o.key}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => toggleDraftPin(o.key, e.target.checked)} />
                    <span>{o.label} <span className="muted">· {catCount(o)}</span></span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <p className="cap muted">{draftPins.length} of 6 chosen</p>
        <div className="row between">
          <Button variant="tertiary" onClick={resetPins}>Reset to default</Button>
          <div className="row gap8">
            <Button variant="outline" onClick={() => setCustomiseOpen(false)}>Cancel</Button>
            <Button onClick={savePins} testId="pin-save">Save cards</Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
