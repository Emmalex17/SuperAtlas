import { ic } from "./markup";

export const Q = ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26", "Q2 '26", "Q3 '26", "Q4 '26"];

type Series = { vals: number[]; col: string };
type Mark = { i: number; y: number; label: string; w: number; tone?: "bad" | "ok" };

export function lineChart({
  w = 640,
  h = 220,
  series = [],
  band,
  marks = [],
  yLabels = true,
}: {
  w?: number;
  h?: number;
  series?: Series[];
  band?: [number[], number[]];
  marks?: Mark[];
  yLabels?: boolean;
}): string {
  const L = yLabels ? 34 : 6, R = 10, T = 8, B = 26, iw = w - L - R, ih = h - T - B;
  const X = (i: number) => L + (i * iw) / (Q.length - 1);
  const Y = (v: number) => T + ih - (v / 100) * ih;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
  let s = `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Compliance strength over eight quarters" style="display:block;overflow:visible">`;
  [0, 25, 50, 75, 100].forEach((v) => {
    s += `<line x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e1e2e6" ${v ? 'stroke-dasharray="3 4"' : ""}/>`;
    if (yLabels) s += `<text x="${L - 10}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#6b6f81">${v}</text>`;
  });
  Q.forEach((q, i) => {
    s += `<text x="${X(i)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#6b6f81">${q}</text>`;
  });
  marks.forEach((m) => {
    s += `<line x1="${X(m.i)}" x2="${X(m.i)}" y1="${T}" y2="${T + ih}" stroke="#b8bac4"/><rect x="${X(m.i) - m.w / 2}" y="${Y(m.y) - 11}" width="${m.w}" height="22" rx="6" fill="#fff" stroke="#e1e2e6"/><text x="${X(m.i)}" y="${Y(m.y) + 4}" text-anchor="middle" font-size="10.5" font-weight="500" fill="${m.tone === "bad" ? "#b42318" : "#1e7a46"}">${m.label}</text>`;
  });
  if (band) {
    s += `<path d="${path(band[1])}${band[0]
      .slice()
      .reverse()
      .map((v, j) => `L${X(Q.length - 1 - j).toFixed(1)} ${Y(v).toFixed(1)}`)
      .join("")}Z" fill="#c7d2fe" opacity=".55"/>`;
  }
  series.forEach((se) => {
    s += `<path d="${path(se.vals)}" fill="none" stroke="${se.col}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const last = se.vals.length - 1;
    s += `<circle cx="${X(last)}" cy="${Y(se.vals[last])}" r="4.5" fill="#fff" stroke="${se.col}" stroke-width="2"/>`;
  });
  return s + "</svg>";
}

export const AVG = [58, 60, 61, 63, 66, 68, 72, 78];
export const LO = [52, 53, 55, 57, 59, 61, 65, 72];
export const HI = [65, 67, 68, 70, 72, 74, 79, 84];

export function spark(vals: number[], col: string, end: string): string {
  const w = 90, h = 26, mn = Math.min(...vals), mx = Math.max(...vals);
  const p = vals
    .map((v, i) => `${i ? "L" : "M"}${((i * w) / (vals.length - 1)).toFixed(1)} ${(h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)).toFixed(1)}`)
    .join("");
  const lx = w, ly = h - 3 - ((vals[vals.length - 1] - mn) / (mx - mn || 1)) * (h - 6);
  return `<svg viewBox="0 0 ${w + 4} ${h}" width="${w + 4}" height="${h}" aria-hidden="true"><path d="${p}" fill="none" stroke="${col}" stroke-width="1.6"/><circle cx="${lx}" cy="${ly}" r="2.6" fill="${end}"/></svg>`;
}

const DASH_ROWS: [string, string, number, string, "up" | "down" | "flat", string, number, string, number[]][] = [
  ["Riverside Digital Bank", "Commercial bank", 85, "+2 pts", "up", "96%", 1, "Monitoring", [70, 72, 71, 75, 78, 80, 83, 85]],
  ["Demo Hosting Ltd", "Cloud service provider", 81, "+3 pts", "up", "92%", 2, "Assessment closed", [66, 68, 67, 71, 74, 76, 78, 81]],
  ["Northgate Data Centres", "Data centre operator", 74, "+6 pts", "up", "88%", 4, "CAP in progress", [55, 57, 56, 60, 63, 66, 68, 74]],
  ["Harbour Fintech", "Fintech", 69, "0 pts", "flat", "80%", 3, "3 actions overdue", [70, 68, 71, 69, 70, 68, 69, 69]],
  ["Example Cloud Services Ltd", "Cloud service provider", 62, "−8 pts", "down", "71%", 7, "Findings issued", [78, 77, 75, 76, 72, 70, 70, 62]],
  ["Eastport Payments", "Payment service provider", 58, "−5 pts", "down", "64%", 6, "Assessment due", [70, 68, 69, 66, 65, 63, 63, 58]],
];

export function miniDash(th: "default" | "forest" | "ocean"): string {
  const T = {
    default: { side: "#1b2056", act: "#4338ca", p: "#4f46e5", hero: "radial-gradient(70% 140% at 100% 0%, #4f46e5, transparent 70%), #141845" },
    forest: { side: "#0f3d2a", act: "#116432", p: "#15803d", hero: "radial-gradient(70% 140% at 100% 0%, #15803d, transparent 70%), #0b2e20" },
    ocean: { side: "#0b2e4f", act: "#075985", p: "#0369a1", hero: "radial-gradient(70% 140% at 100% 0%, #0369a1, transparent 70%), #08233d" },
  }[th];
  const nav = ["My queue", "Dashboards", "Programmes & calendar", "Reporting cycles", "Findings", "Organisations", "Assurance firms", "Requirements library"];
  const name = { default: "Regulator", forest: "Forest Supervisory Authority", ocean: "Ocean Markets Commission" }[th];
  return `<div style="display:grid;grid-template-columns:248px 1fr;font-family:var(--sans);color:var(--text);background:#f4f5fb;height:1300px">
    <div style="background:${T.side};color:#fff;padding:20px 12px;display:flex;flex-direction:column;gap:4px"><div style="display:flex;gap:10px;align-items:center;padding:4px 8px 18px"><span style="width:36px;height:36px;border-radius:10px;background:${T.p};display:grid;place-items:center">${ic("shield-check")}</span><div><b style="font-size:15px">${name}</b><div style="font-size:12px;opacity:.75">Supervision workspace</div></div></div>${nav.map((n, i) => `<div style="padding:10px 12px;border-radius:10px;font-size:15px;${i === 0 ? "background:" + T.act : ""}">${n}</div>`).join("")}</div>
    <div style="padding:0 32px"><div style="height:64px;display:flex;align-items:center;color:#6b6f81;font-size:15px">Dashboards › Supervision overview</div>
      <div style="background:${T.hero};border-radius:24px;color:#fff;padding:36px 38px 140px"><div style="font-size:12px;font-weight:600;letter-spacing:.06em">SUPERVISION OVERVIEW · Q3 2026</div><div style="font:600 40px/48px var(--serif);margin-top:10px">Good morning, Amina</div><div style="font-size:17px;opacity:.85;margin-top:8px">42 organisations under supervision. Compliance strength is up 6 points this quarter.</div></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:-110px 22px 0">${[
        ["Compliance strength", "78", "6 pts this quarter", "up"],
        ["Assessment coverage", "86%", "No change", "flat"],
        ["Open findings", "23", "5 more than last quarter", "down"],
        ["Overdue actions", "7", "2 more than last quarter", "down"],
      ]
        .map(([l, n, t, k]) => `<div style="background:#fff;border-radius:20px;padding:22px"><div class="ws-stat"><div class="lab">${l}</div><div class="num" style="font-size:36px">${n}</div></div><span class="trend ${k}">${t}</span></div>`)
        .join("")}</div>
      <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:20px;margin-top:22px"><div style="background:#fff;border-radius:20px;padding:22px"><b style="font-size:18px">Compliance strength · all organisations</b><div style="margin-top:14px">${lineChart({ w: 640, h: 260, series: [{ vals: AVG, col: T.p }], band: [LO, HI] })}</div></div><div style="background:#fff;border-radius:20px;padding:22px"><b style="font-size:18px">Needs attention</b>${["Example Cloud…", "Eastport Payme…", "Harbour Fintech"].map((n) => `<div style="margin-top:14px;background:#f4f5fb;border-radius:14px;padding:14px;font-size:15px;font-weight:500">${n}</div>`).join("")}</div></div>
      <div style="background:#fff;border-radius:20px;margin-top:22px;overflow:hidden"><div style="padding:22px;font:600 26px var(--serif)">Organisations</div>${DASH_ROWS.map(
        (r) =>
          `<div style="display:grid;grid-template-columns:2.2fr 1fr .6fr 1fr 1.2fr;gap:12px;align-items:center;padding:16px 22px;border-top:1px solid #e1e2e6;font-size:15px"><span><b style="font-weight:500">${r[0]}</b><br><span style="color:#6b6f81;font-size:13px">${r[1]}</span></span>${spark(r[8], T.p, r[4] === "down" ? "#b42318" : r[4] === "up" ? "#1e7a46" : "#6b6f81")}<b class="serif" style="font-size:18px">${r[2]}</b><span class="trend ${r[4]}" style="margin:0">${r[3]}</span><span style="color:#6b6f81">${r[7]}</span></div>`
      ).join("")}</div>
    </div></div>`;
}
