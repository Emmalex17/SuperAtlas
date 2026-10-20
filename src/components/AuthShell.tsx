import type { ReactNode } from "react";
import Link from "next/link";
import { Lockup } from "@/components/ui";
import { Icon } from "@/lib/icons";

const ART_POINTS: { icon: Parameters<typeof Icon>[0]["name"]; t: string; d: string }[] = [
  { icon: "eye", t: "One view of every organisation", d: "Returns, evidence, assessments and findings, side by side." },
  { icon: "seal-check", t: "Independent, accredited assessment", d: "Assurance firms confirm outcomes before you publish." },
  { icon: "chart-line-up", t: "Compliance strength over time", d: "See who is improving, who is slipping, and why." },
];

function Sparkline({ vals, col, end }: { vals: number[]; col: string; end: string }) {
  const w = 90, h = 26, mn = Math.min(...vals), mx = Math.max(...vals);
  const p = vals
    .map((v, i) => `${i ? "L" : "M"}${((i * w) / (vals.length - 1)).toFixed(1)} ${(h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)).toFixed(1)}`)
    .join("");
  const lx = w, ly = h - 3 - ((vals[vals.length - 1] - mn) / (mx - mn || 1)) * (h - 6);
  return (
    <svg viewBox={`0 0 ${w + 4} ${h}`} width={w + 4} height={h} aria-hidden="true">
      <path d={p} fill="none" stroke={col} strokeWidth={1.6} />
      <circle cx={lx} cy={ly} r={2.6} fill={end} />
    </svg>
  );
}

function AuthArt() {
  return (
    <aside className="auth-art">
      <div className="grid-lines" />
      <Link href="/" style={{ position: "relative" }} aria-label="SuperAtlas home">
        <Lockup dark size={30} />
      </Link>
      <div style={{ position: "relative" }} className="col gap20">
        <h1 className="serif" style={{ fontSize: 30, lineHeight: "38px", letterSpacing: "-.02em", maxWidth: "20ch" }}>
          Supervision that shows its working.
        </h1>
        <div className="col" style={{ gap: 14 }}>
          {ART_POINTS.map((p) => (
            <div key={p.t} className="row top" style={{ gap: 12 }}>
              <span className="art-ic">
                <Icon name={p.icon} />
              </span>
              <div>
                <div className="semi small">{p.t}</div>
                <div className="cap" style={{ color: "var(--brand-200)", marginTop: 2 }}>{p.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="art-extra art-card" aria-hidden="true">
        <div className="row between">
          <span className="cap" style={{ color: "var(--brand-200)" }}>Compliance strength</span>
          <span className="cap" style={{ color: "#86efac" }}>+6 pts</span>
        </div>
        <div className="row" style={{ alignItems: "flex-end", gap: 14, marginTop: 4 }}>
          <span className="serif" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>78</span>
          <Sparkline vals={[58, 59.5, 60, 61, 63, 66, 69, 72]} col="#a5b4fc" end="#dba94d" />
        </div>
        <div className="art-bars">
          {([["Governance", 84], ["Access control", 71], ["Incident response", 66]] as [string, number][]).map(([l, v]) => (
            <div key={l}>
              <span>{l}</span>
              <i><b style={{ width: `${v}%` }} /></i>
              <em>{v}</em>
            </div>
          ))}
        </div>
      </div>
      <div className="cap" style={{ position: "relative", color: "var(--brand-200)" }}>© 2026 RegTech365 · Privacy · Terms</div>
    </aside>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <AuthArt />
      <section className="auth-form">
        <div className="inner">{children}</div>
      </section>
    </div>
  );
}
