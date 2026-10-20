import { chLine } from "./charts";
import { esc, ic } from "./markup";

export type MioRegKey = "CBN" | "SEC" | "NITDA";

export const MIO_REGS: Record<MioRegKey, { name: string; strength: number; find: number; ret: string; vals: number[]; feed: [string, string, "returns" | "evidence" | "findings"][] }> = {
  CBN: {
    name: "Central Bank of Nigeria",
    strength: 78,
    find: 23,
    ret: "96%",
    vals: [61, 63, 64, 66, 69, 71, 74, 78],
    feed: [
      ["Zenith Bank", "filed its Q3 prudential return", "returns"],
      ["Moniepoint", "closed 2 findings with evidence", "evidence"],
      ["Copperleaf Microfinance", "has 1 overdue fix", "findings"],
    ],
  },
  SEC: {
    name: "Securities and Exchange Commission",
    strength: 71,
    find: 14,
    ret: "91%",
    vals: [64, 64, 65, 67, 66, 68, 70, 71],
    feed: [
      ["Harbourline Securities", "filed its quarterly CMO return", "returns"],
      ["Kestrel Asset Management", "uploaded its custody attestation", "evidence"],
      ["Crestview Trustees", "received 3 findings", "findings"],
    ],
  },
  NITDA: {
    name: "National Information Technology Development Agency",
    strength: 74,
    find: 31,
    ret: "88%",
    vals: [55, 58, 60, 62, 65, 67, 70, 74],
    feed: [
      ["Northgate Cloud", "submitted its ISR 2026 answers", "returns"],
      ["Unity Health Records", "sent proof for an access-control fix", "evidence"],
      ["Ridgeline Bank", "has a major nonconformity open", "findings"],
    ],
  },
};

export const MIO_ORGS: [string, string, string, MioRegKey[]][] = [
  ["Zenith Bank", "ZB", "#c8102e", ["CBN", "NITDA"]],
  ["Northgate Cloud", "NC", "#0e7490", ["NITDA"]],
  ["Harbourline Securities", "HS", "#1d4ed8", ["SEC"]],
  ["Moniepoint", "MP", "#0055ff", ["CBN", "NITDA"]],
  ["Kestrel Asset Mgmt", "KA", "#7c3aed", ["SEC"]],
  ["Unity Health Records", "UH", "#0f766e", ["NITDA"]],
  ["OPay", "OP", "#0f9d58", ["CBN"]],
  ["Crestview Trustees", "CT", "#9a3412", ["SEC"]],
  ["Ridgeline Bank", "RB", "#1e3a8a", ["CBN", "NITDA"]],
  ["Copperleaf Microfinance", "CM", "#a16207", ["CBN"]],
  ["Brookfield Brokers", "BB", "#be185d", ["SEC"]],
  ["Meadow Pay", "MD", "#15803d", ["CBN", "NITDA"]],
];

export const MIO_COL: Record<"returns" | "evidence" | "findings", string> = { returns: "#818cf8", evidence: "#34d399", findings: "#fbbf24" };

export function mioPos(i: number): { side: 0 | 1; x: number; y: number; cx: number; cy: number } {
  const side = (i % 2 ? 1 : 0) as 0 | 1;
  const k = Math.floor(i / 2);
  return { side, x: side ? 812 : 8, y: 26 + k * 70, cx: side ? 812 : 188, cy: 26 + k * 70 + 22 };
}

export function mioPath(i: number): string {
  const p = mioPos(i);
  const tx = p.side ? 724 : 276;
  const ty = 130 + Math.floor(i / 2) * 36;
  const mx = (p.cx + tx) / 2;
  return `M${p.cx} ${p.cy} C${mx} ${p.cy} ${mx} ${ty} ${tx} ${ty}`;
}

export function mioReduced(): boolean {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function mioPacketsHtml(reg: MioRegKey): string {
  if (mioReduced()) return "";
  const kinds: ("returns" | "evidence" | "findings")[] = ["returns", "evidence", "findings"];
  return MIO_ORGS.map((o, i) =>
    o[3].includes(reg)
      ? [0, 1]
          .map((n) => {
            const k = kinds[(i + n) % 3];
            const d = 2.6 + (i % 3) * 0.35;
            const begin = (n * d / 2 + i * 0.17).toFixed(2);
            return `<circle r="4.5" opacity="0" fill="${MIO_COL[k]}"><animateMotion dur="${d}s" begin="${begin}s" repeatCount="indefinite" path="${mioPath(i)}" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .6 1"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.85;1" dur="${d}s" begin="${begin}s" repeatCount="indefinite"/></circle>`;
          })
          .join("")
      : ""
  ).join("");
}

export function mioCardHtml(reg: MioRegKey): string {
  const r = MIO_REGS[reg];
  const n = MIO_ORGS.filter((o) => o[3].includes(reg)).length;
  return `<div class="row top" style="gap:12px"><div class="grow" style="min-width:0"><div class="overline" style="color:var(--text-2)">Supervision overview</div><b class="mio-title">${esc(r.name)}</b></div><span class="mio-own">${ic("eye")}Only its own organisations</span></div>
    <div class="mio-k">${[
      ["Organisations", n],
      ["Compliance strength", r.strength],
      ["Open findings", r.find],
      ["Returns on time", r.ret],
    ]
      .map(([l, v]) => `<div><span>${l}</span><b class="tnum">${v}</b></div>`)
      .join("")}</div>
    <div class="mio-chart">${chLine({
      w: 460,
      h: 140,
      x: { min: 0, max: 7, ticks: [[0, "Q1 '25"], [2, "Q3 '25"], [4, "Q1 '26"], [6, "Q3 '26"]] },
      y: { min: 50, max: 85, ticks: [50, 65, 80] },
      series: [{ name: "Compliance strength", col: "#4f46e5", w: 2.4, pts: r.vals.map((v, i) => [i, v]), end: String(r.vals[7]) }],
      label: "Compliance strength by quarter",
    })}</div>
    <div class="mio-feed">${r.feed.map(([o, t, k]) => `<div><span class="dot" style="background:${MIO_COL[k]}"></span><b>${esc(o)}</b> ${esc(t)}</div>`).join("")}</div>`;
}
