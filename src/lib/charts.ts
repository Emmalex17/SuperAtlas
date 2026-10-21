import { ic, esc } from "./markup";

export const CH = {
  ink: "var(--text)",
  quiet: "var(--text-2)",
  grid: "var(--border)",
  brand: "var(--brand-500)",
  prev: "#9094a3",
  ok: "var(--ok-icon)",
  warn: "var(--warn-icon)",
  bad: "var(--bad-icon)",
  ai: "var(--ai-solid)",
  neu: "var(--neu-icon)",
};

type ChLineSeries = { name?: string; col: string; w?: number; dash?: boolean; dots?: boolean; pts: [number, number][]; end?: string };

export function chLine(o: {
  w?: number;
  h?: number;
  x: { min: number; max: number; ticks?: [number, string][] };
  y: { min: number; max: number; ticks?: number[]; unit?: string };
  series: ChLineSeries[];
  refY?: { v: number; col?: string; label: string }[];
  refX?: { v: number; col?: string; label: string }[];
  label?: string;
}): string {
  const W = o.w || 560, H = o.h || 220, L = 44, R = 16, T = 22, B = 28;
  const xs = o.x, ys = o.y;
  const X = (v: number) => L + ((v - xs.min) / (xs.max - xs.min || 1)) * (W - L - R);
  const Y = (v: number) => T + (1 - (v - ys.min) / (ys.max - ys.min || 1)) * (H - T - B);
  const grid = (ys.ticks || [])
    .map(
      (v) =>
        `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${CH.grid}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12.5" fill="${CH.quiet}">${v}${ys.unit || ""}</text>`
    )
    .join("");
  const xt = (xs.ticks || [])
    .map(([v, l]) => `<text x="${X(v)}" y="${H - 8}" text-anchor="middle" font-size="12.5" fill="${CH.quiet}">${esc(l)}</text>`)
    .join("");
  const refs =
    (o.refY || [])
      .map(
        (r) =>
          `<line x1="${L}" x2="${W - R}" y1="${Y(r.v)}" y2="${Y(r.v)}" stroke="${r.col || CH.warn}" stroke-dasharray="5 4" stroke-width="1.25"/><text x="${L + 6}" y="${Y(r.v) - 6}" font-size="12.5" font-weight="600" fill="${r.col || CH.warn}">${esc(r.label)}</text>`
      )
      .join("") +
    (o.refX || [])
      .map((r) => {
        const nearEnd = X(r.v) > W - R - 50;
        return `<line x1="${X(r.v)}" x2="${X(r.v)}" y1="${T}" y2="${H - B}" stroke="${r.col || CH.quiet}" stroke-dasharray="3 4"/><text x="${X(r.v) + (nearEnd ? -4 : 4)}" y="${T + 10}" text-anchor="${nearEnd ? "end" : "start"}" font-size="12.5" fill="${r.col || CH.quiet}">${esc(r.label)}</text>`;
      })
      .join("");
  const lines = o.series
    .map((s) => {
      const d = s.pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join("");
      const last = s.pts[s.pts.length - 1];
      return `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="${s.w || 2.25}" ${s.dash ? 'stroke-dasharray="6 5"' : ""} stroke-linejoin="round"/>${
        s.dots ? s.pts.map((p) => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.5" fill="var(--surface)" stroke="${s.col}" stroke-width="2"/>`).join("") : ""
      }${
        last && s.end
          ? (() => {
              const near = X(last[0]) > W - R - 60;
              return `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="${s.col}"/><text x="${X(last[0]) + (near ? -8 : 7)}" y="${Y(last[1]) + (near ? -10 : 4)}" text-anchor="${near ? "end" : "start"}" font-size="13" font-weight="600" fill="${s.col}">${esc(s.end)}</text>`;
            })()
          : ""
      }`;
    })
    .join("");
  const key =
    o.series.length > 1 || (o.refY || []).length
      ? `<div class="ch-key">${o.series.map((s) => `<span><i style="background:${s.col};${s.dash ? "opacity:.6" : ""}"></i>${esc(s.name || "")}</span>`).join("")}</div>`
      : "";
  return `<svg class="chsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">${grid}${refs}${lines}${xt}</svg>${key}`;
}

/* Vertical bars (histogram), with an optional benchmark marker between bins — the prototype's chColumns(). */
export function chColumns(o: { bins: { l: string; n: number; col?: string }[]; refAt?: number; refLabel?: string }): string {
  const max = Math.max(1, ...o.bins.map((b) => b.n));
  return `<div class="ch-cols" style="--n:${o.bins.length}">${o.bins
    .map(
      (b, i) =>
        `<div class="ch-col" title="${esc(b.l)}: ${b.n}">${o.refAt === i ? `<span class="ch-ref"><b>${esc(o.refLabel || "")}</b></span>` : ""}<span class="ch-n tnum">${b.n || ""}</span><span class="ch-bar" style="height:${Math.max(b.n ? 4 : 0, (b.n / max) * 100)}%;background:${b.col || CH.brand}"></span><span class="ch-l">${esc(b.l)}</span></div>`
    )
    .join("")}</div>`;
}

/* Horizontal bars: label, value, optional tone colour — the prototype's chBars(). */
export function chBars(rows: { l: string; v: number; vl?: string | number; col?: string }[], o: { max?: number } = {}): string {
  const max = o.max || Math.max(1, ...rows.map((r) => r.v));
  return `<div class="ch-hbars">${rows
    .map(
      (r) =>
        `<div class="ch-hb"><span class="ch-hl" title="${esc(r.l)}">${esc(r.l)}</span><span class="ch-ht"><i style="width:${Math.max(r.v ? 2 : 0, (r.v / max) * 100)}%;background:${r.col || CH.brand}"></i></span><span class="ch-hv tnum">${r.vl ?? r.v}</span></div>`
    )
    .join("")}</div>`;
}

/* Stacked bars: parts of a whole per row — the prototype's chStack(). */
export function chStack(rows: { l: string; vals: { n: number }[]; total?: number }[], parts: { l: string; col: string; ink?: string }[], o: { key?: boolean } = {}): string {
  const key = o.key !== false ? `<div class="ch-key">${parts.map((p) => `<span><i style="background:${p.col}"></i>${esc(p.l)}</span>`).join("")}</div>` : "";
  const body = rows
    .map((r) => {
      const tot = r.vals.reduce((a, v) => a + v.n, 0) || 1;
      const segs = r.vals
        .map((v, i) => (v.n ? `<i style="width:${(v.n / tot) * 100}%;background:${parts[i].col};color:${parts[i].ink || "#fff"}" title="${esc(parts[i].l)}: ${v.n}">${v.n / tot > 0.08 ? v.n : ""}</i>` : ""))
        .join("");
      return `<div class="ch-sr"><span class="ch-hl" title="${esc(r.l)}">${esc(r.l)}</span><span class="ch-st">${segs}</span><span class="ch-hv tnum">${r.total ?? tot}</span></div>`;
    })
    .join("");
  return `<div class="ch-stack">${key}${body}</div>`;
}

/* Funnel: each stage as wide as its count against the first — the prototype's chFunnel(). */
export function chFunnel(stages: { l: string; n: number }[]): string {
  const first = Math.max(1, stages[0].n);
  return `<div class="ch-funnel">${stages
    .map(
      (s, i) =>
        `<div class="ch-fs"><span class="ch-fl">${esc(s.l)}</span><span class="ch-ft"><i style="width:${Math.max(s.n ? 3 : 0, (s.n / first) * 100)}%"></i></span><span class="ch-fv tnum"><b>${s.n}</b>${i ? `<span class="muted"> · ${Math.round((s.n / first) * 100)}%</span>` : ""}</span></div>`
    )
    .join("")}</div>`;
}

/* Heatmap: rows × columns of counts, coloured by count — the prototype's chHeat(). */
export function chHeat(o: { cols: { l: string; t?: string; col?: string }[]; rows: { l: string; t?: string; sec?: boolean; cells: { n: number }[] }[] }): string {
  const max = Math.max(1, ...o.rows.flatMap((r) => r.cells.map((c) => c.n)));
  return `<div class="tbl-wrap"><table class="ch-heat"><thead><tr><th></th>${o.cols.map((c) => `<th title="${esc(c.t || c.l)}">${esc(c.l)}</th>`).join("")}</tr></thead><tbody>${o.rows
    .map(
      (r) =>
        `<tr class="${r.sec ? "sec" : ""}"><th class="${r.sec ? "h-sec" : "h-req"}" title="${esc(r.t || r.l)}">${esc(r.l)}</th>${r.cells
          .map((c, i) => {
            const a = c.n / max;
            const col = o.cols[i].col || CH.bad;
            return `<td>${c.n ? `<span class="hc" style="background:color-mix(in srgb, ${col} ${Math.round(12 + a * 70)}%, var(--surface))" title="${esc(r.t || r.l)} · ${esc(o.cols[i].t || o.cols[i].l)}: ${c.n}">${c.n}</span>` : '<span class="hc z">·</span>'}</td>`;
          })
          .join("")}</tr>`
    )
    .join("")}</tbody></table></div>`;
}

/* Before/after per row (dot plot) — the prototype's chDots(). */
export function chDots(rows: { l: string; a?: number; b?: number }[], o: { min: number; max: number; ref?: number; key?: [string, string] }): string {
  const X = (v: number) => ((v - o.min) / (o.max - o.min)) * 100;
  const key = o.key
    ? `<div class="ch-key"><span><i style="background:${CH.prev}"></i>${esc(o.key[0])}</span><span><i style="background:${CH.brand}"></i>${esc(o.key[1])}</span>${
        o.ref != null ? `<span><i style="background:${CH.warn}"></i>Benchmark ${o.ref}</span>` : ""
      }</div>`
    : "";
  const body = rows
    .map((r) => {
      const ref = o.ref != null ? `<em style="left:${X(o.ref)}%"></em>` : "";
      const seg = r.a != null && r.b != null ? `<s style="left:${Math.min(X(r.a), X(r.b))}%;width:${Math.abs(X(r.b) - X(r.a))}%;background:${r.b >= r.a ? "var(--ok-icon)" : "var(--bad-icon)"}"></s>` : "";
      const pa = r.a != null ? `<i class="pa" style="left:${X(r.a)}%"></i>` : "";
      const pb = r.b != null ? `<i class="pb" style="left:${X(r.b)}%"></i>` : "";
      return `<div class="ch-dr"><span class="ch-hl" title="${esc(r.l)}">${esc(r.l)}</span><span class="ch-dt">${ref}${seg}${pa}${pb}</span><span class="ch-hv tnum">${r.a ?? "—"} → <b>${r.b ?? "—"}</b></span></div>`;
    })
    .join("");
  return `<div class="ch-dots">${key}${body}</div>`;
}

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
