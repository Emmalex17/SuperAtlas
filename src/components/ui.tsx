"use client";

import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/lib/icons";

export type ChipTone = "ok" | "warn" | "bad" | "info" | "neu" | "ai" | "brand";

export function LogoMark({ size = 28, variant = "navy" }: { size?: number; variant?: "navy" | "white" }) {
  const shield = variant === "white" ? "#ffffff" : "#1B2056";
  const lines = variant === "white" ? "#1B2056" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="37 32 54 64" aria-label="SuperAtlas" role="img">
      <path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill={shield} />
      <path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke={lines} strokeWidth={3} fill="none" />
      <path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke={lines} strokeWidth={2.2} fill="none" />
      <path d="M49.5 63H62" stroke={lines} strokeWidth={2.2} />
      <path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Lockup({ dark = false, size = 28 }: { dark?: boolean; size?: number }) {
  return (
    <span className="row" style={{ gap: 10 }}>
      <LogoMark size={size} variant={dark ? "white" : "navy"} />
      <span style={{ font: `600 ${Math.round(size * 0.72)}px/1 var(--sans)`, letterSpacing: "-.01em", color: dark ? "#fff" : "var(--brand-700)" }}>
        Super<span style={{ fontFamily: "var(--serif)", fontWeight: 700 }}>Atlas</span>
      </span>
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "outline" | "tertiary" | "danger" | "danger-soft" | "authority" | "gold" | "ghost-light";
type ButtonSize = "sm" | "lg";

export function Button({
  children,
  variant = "primary",
  size,
  block,
  icon,
  iconRight,
  disabled,
  type = "button",
  className = "",
  onClick,
  testId,
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: IconName | string;
  iconRight?: IconName | string;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
  testId?: string;
}) {
  const cls = ["btn", `btn-${variant}`, size ? `btn-${size}` : "", block ? "btn-block" : "", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick} data-test={testId}>
      {icon ? <Icon name={icon} /> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} /> : null}
    </button>
  );
}

export function Chip({ children, tone = "neu", icon }: { children: ReactNode; tone?: ChipTone; icon?: IconName }) {
  return (
    <span className={`chip ${tone}`}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

type ToneWord = "" | "ok" | "warn" | "bad" | "info" | "neu" | "ai" | "solid";
type Tone = ToneWord | `${ToneWord} ${ToneWord}`;

export function Tile({ icon, tone = "", size = "" }: { icon: IconName | string; tone?: Tone | string; size?: "" | "sm" | "lg" }) {
  return (
    <span className={`tile ${tone} ${size}`}>
      <Icon name={icon} />
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  optional,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label ? (
        <label htmlFor={htmlFor}>
          {label} {optional ? <span className="muted" style={{ fontWeight: 400 }}>(optional)</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <div className="err">
          <Icon name="warning-circle" />
          {error}
        </div>
      ) : hint ? (
        <div className="hint">{hint}</div>
      ) : null}
    </div>
  );
}

export function AlertBox({
  tone,
  title,
  body,
  actions,
  icon,
}: {
  tone: "ok" | "warn" | "bad" | "info" | "ai";
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
  icon?: IconName;
}) {
  const defaults: Record<string, IconName> = { ok: "check-circle", warn: "warning", bad: "warning-octagon", info: "info", ai: "sparkle" };
  return (
    <div className={`alert ${tone}`}>
      <Tile icon={icon ?? defaults[tone]} tone={`solid ${tone === "ai" ? "" : tone}` as Tone} size="sm" />
      <div className="grow">
        <div className="t">{title}</div>
        {body ? <div className="b">{body}</div> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

export function PageHead({ over, title, sub, actions }: { over?: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="ph">
      <div className="grow">
        {over ? <div className="overline">{over}</div> : null}
        <h1 className="h1" style={{ marginTop: 4 }}>{title}</h1>
        {sub ? <p className="muted">{sub}</p> : null}
      </div>
      {actions ? <div className="row wrap">{actions}</div> : null}
    </div>
  );
}

export function Tabs<T extends string>({ items, active, onChange }: { items: { id: T; label: string; count?: number }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" className={t.id === active ? "on" : ""} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined ? <span className="count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** A tab bar whose "tabs" are really separate routes sharing one header — the prototype's
 * routeTabs(), used by screens like org/compliance that split one logical page across several
 * URLs (org/compliance, org/exposure, org/actions) instead of client-side tab state. */
export function RouteTabs({ items, active }: { items: { label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <Link key={t.href} role="tab" className={t.href === active ? "on" : ""} href={t.href}>
          {t.label}
          {t.count !== undefined ? <span className="count">{t.count}</span> : null}
        </Link>
      ))}
    </div>
  );
}

export function Kv({ pairs }: { pairs: [string, ReactNode][] }) {
  return (
    <div className="kv">
      {pairs.map(([k, v]) => (
        <Fragment key={k}>
          <div>{k}</div>
          <div>{v}</div>
        </Fragment>
      ))}
    </div>
  );
}

export function TrendChip({ delta }: { delta: number }) {
  if (delta > 0) return <Chip tone="ok" icon="trend-up">+{delta} pts</Chip>;
  if (delta < 0) return <Chip tone="bad" icon="trend-down">{delta} pts</Chip>;
  return <Chip tone="neu" icon="minus">0 pts</Chip>;
}

/** Maps a status word to a consistent (tone, icon) pair — one shared vocabulary for every status chip in the
 * app, ported from the prototype's statusChip() (docs/prototype/source/core.js). An unrecognised status
 * falls back to a plain neutral chip with no icon, rather than guessing. */
const STATUS_TONE: Record<string, [ChipTone, IconName]> = {
  Verified: ["ok", "seal-check"],
  Accredited: ["ok", "seal-check"],
  Active: ["ok", "seal-check"],
  Accepted: ["ok", "check-circle"],
  Approved: ["ok", "check-circle"],
  Published: ["ok", "check-circle"],
  Live: ["ok", "seal-check"],
  "Pending verification": ["warn", "hourglass"],
  "Renewal due": ["warn", "clock"],
  "Change requested": ["warn", "git-diff"],
  "In review": ["info", "hourglass"],
  "Under review": ["info", "hourglass"],
  Pending: ["info", "clock"],
  Invited: ["info", "envelope-simple"],
  "Info requested": ["warn", "chat-circle-dots"],
  Draft: ["neu", "note-pencil"],
  Expired: ["neu", "clock"],
  Open: ["ok", "play-circle"],
  Scheduled: ["info", "calendar-blank"],
  Closed: ["neu", "lock-simple"],
  "Firm to assign": ["warn", "user-plus"],
  "Firm to choose": ["warn", "handshake"],
  "Firm approval": ["warn", "hourglass"],
  "Awaiting firm": ["info", "hourglass"],
  Answering: ["info", "pencil-simple"],
  Submitted: ["info", "paper-plane-tilt"],
  Assessing: ["info", "magnifying-glass"],
  "Report submitted": ["info", "file-text"],
  "Held back": ["warn", "pause-circle"],
  Requested: ["warn", "hourglass"],
  Assigned: ["info", "user-plus"],
  "Not started": ["neu", "circle-dashed"],
  Answered: ["ok", "check-circle"],
  "Changes requested": ["warn", "arrow-u-up-left"],
  "In preview": ["info", "eye"],
  "Signed off": ["ok", "seal-check"],
  Returned: ["warn", "arrow-u-up-left"],
  Overdue: ["bad", "warning"],
  Filed: ["ok", "check-circle"],
  Queried: ["warn", "chat-circle-dots"],
  Due: ["info", "clock"],
  Late: ["bad", "clock"],
  "Fix in progress": ["info", "wrench"],
  "Fix submitted": ["info", "paper-plane-tilt"],
  "Verified fixed": ["ok", "check-circle"],
  "Extension requested": ["warn", "clock-clockwise"],
  "Invite expired": ["neu", "clock"],
  "Pending credential": ["warn", "hourglass"],
  Revoked: ["neu", "x-circle"],
  Suspended: ["bad", "warning-octagon"],
  Rejected: ["bad", "x-circle"],
  Declined: ["bad", "x-circle"],
};

export function statusTone(status: string): { tone: ChipTone; icon?: IconName } {
  const hit = STATUS_TONE[status];
  return hit ? { tone: hit[0], icon: hit[1] } : { tone: "neu" };
}

export function StatusChip({ status }: { status: string }) {
  const { tone, icon } = statusTone(status);
  return (
    <Chip tone={tone} icon={icon}>
      {status}
    </Chip>
  );
}

const COMP_CHIP: Record<string, [ChipTone, IconName]> = {
  Compliant: ["ok", "check-circle"],
  "Compliant with conditions": ["warn", "warning"],
  "Non-compliant": ["bad", "x-circle"],
  "Not assessed": ["neu", "circle-dashed"],
  "Enforcement watch": ["ai", "eye"],
};

/** A compliance-status chip — the prototype's compChip(). Separate from StatusChip since these four words
 * ("Compliant", "Compliant with conditions", "Non-compliant", "Not assessed") carry their own tone/icon
 * mapping distinct from the general ~45-word statusChip() vocabulary. */
export function CompChip({ status }: { status: string }) {
  const hit = COMP_CHIP[status];
  return (
    <Chip tone={hit ? hit[0] : "neu"} icon={hit?.[1]}>
      {status}
    </Chip>
  );
}

/** A read-only 1-5 star rating display — the prototype's starsHtml(). */
export function Stars({ n }: { n: number }) {
  const rounded = Math.round(n);
  return (
    <span className="stars" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= rounded ? "on" : ""}>★</i>
      ))}
    </span>
  );
}

/** One filter-pill row with counts, used inside a table card — the prototype's fpills(). Tones "warn"/"bad"
 * colour a pill's count badge when it needs attention (e.g. "Overdue 6"); omit `tone` for a plain pill. */
export function FilterPills<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { key: T; label: string; count?: number; tone?: "warn" | "bad"; testId?: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="tbl-sub">
      <div className="pills">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`pill ${active === it.key ? "on" : ""} ${it.tone && it.count ? `tone-${it.tone}` : ""}`}
            onClick={() => onChange(it.key)}
            data-test={it.testId}
          >
            {it.label}
            {it.count !== undefined ? <span className="count">{it.count}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Headline KPI figure with a delta chip against a comparison period — the prototype's kTile(). Pass
 * `onClick` to make it open a drill-down (matches the prototype's "click a figure to see the list" pattern). */
export function KTile({
  label,
  value,
  delta,
  unit,
  sub,
  vs,
  goodUp = true,
  onClick,
  testId,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  unit?: string;
  sub?: string;
  vs?: string;
  goodUp?: boolean;
  onClick?: () => void;
  testId?: string;
}) {
  const hasDelta = delta !== undefined && !Number.isNaN(delta);
  const good = hasDelta ? (goodUp ? delta! > 0 : delta! < 0) : false;
  const content = (
    <>
      <span className="kt-l">{label}</span>
      <span className="kt-v tnum">{value}</span>
      <span className="kt-s">
        {!hasDelta ? (
          <span className="muted">{sub || " "}</span>
        ) : (
          <>
            <span className={`kt-d ${delta === 0 ? "" : good ? "up" : "down"}`}>
              <Icon name={delta! > 0 ? "arrow-up-right" : delta! < 0 ? "arrow-down-right" : "minus"} />
              {delta! > 0 ? "+" : ""}
              {delta}
              {unit || ""}
            </span>{" "}
            <span className="muted">{vs || "vs last cycle"}</span>
          </>
        )}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="ktile click" onClick={onClick} data-test={testId}>
        {content}
      </button>
    );
  }
  return (
    <div className="ktile" data-test={testId}>
      {content}
    </div>
  );
}

/** Chart card: title states the finding; "View as table" swaps the drawing for its numbers — the
 * prototype's chCard(). Pass `table` only when a table equivalent is meaningful for that chart. */
export function ChartCard({
  title,
  sub,
  chart,
  table,
  foot,
  testId,
  className,
}: {
  title: string;
  sub?: string;
  chart: ReactNode;
  table?: ReactNode;
  foot?: ReactNode;
  testId?: string;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <div className={`card col gap12 chcard ${className || ""}`} data-test={testId ? `ch-${testId}` : undefined}>
      <div className="row top">
        <div className="grow">
          <div className="h4">{title}</div>
          {sub ? (
            <div className="cap muted" style={{ marginTop: 2 }}>
              {sub}
            </div>
          ) : null}
        </div>
        {table ? (
          <button type="button" className="link-btn small" onClick={() => setAsTable((v) => !v)}>
            {asTable ? "View as chart" : "View as table"}
          </button>
        ) : null}
      </div>
      {asTable && table ? table : chart}
      {foot ? <div className="cap muted">{foot}</div> : null}
    </div>
  );
}

/** The numbers behind a ChartCard's "View as table" toggle — the prototype's miniTable(). */
export function MiniTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl keep">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={i ? "num" : ""}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((v, i) => (
                <td key={i} className={i ? "num tnum" : "small"}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
