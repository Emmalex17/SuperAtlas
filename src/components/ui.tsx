import { Fragment, type ReactNode } from "react";
import { Icon, type IconName } from "@/lib/icons";

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

export function Chip({ children, tone = "neu", icon }: { children: ReactNode; tone?: "ok" | "warn" | "bad" | "info" | "neu" | "ai" | "brand"; icon?: IconName }) {
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
