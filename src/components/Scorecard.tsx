"use client";

import { Dialog } from "@/components/Overlay";
import { Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { fmtD, TODAY } from "@/lib/cases";
import { getSession } from "@/lib/auth";

export type ScorecardData = {
  title: string;
  sub: string;
  kpis: [string, string | number][];
  head: string[];
  rows: (string | number)[][];
  extra?: [string, [string, string, string][]];
  file: string;
};

function csvDownload(name: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v ?? "").replace(/"/g, '""')}"` : String(v ?? ""))).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

/** The printable/downloadable compliance scorecard — the prototype's scorecard dialog (c5.js). Shared by
 * organisation-level, category-level, and (eventually) board-pack exports. */
export function Scorecard({ open, onClose, data }: { open: boolean; onClose: () => void; data: ScorecardData | null }) {
  const toast = useToast();
  const session = getSession();
  if (!data) return null;
  return (
    <Dialog open={open} onClose={onClose} wide>
      <div className="score-doc" data-test="scorecard">
        <div className="row top">
          <div className="grow">
            <div className="overline">{data.sub}</div>
            <h2 className="h2" style={{ marginTop: 4 }}>{data.title}</h2>
            <div className="cap muted">As of {fmtD(TODAY)} · prepared by {session?.name ?? ""} on SuperAtlas</div>
          </div>
          <button className="icon-btn no-print" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="sc-kpis">
          {data.kpis.map(([l, v]) => (
            <div key={l}>
              <span className="cap muted">{l}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <table className="tbl keep">
          <thead><tr>{data.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i}>{r.map((v, j) => <td key={j} className="small">{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {data.extra && data.extra[1].length ? (
          <>
            <div className="h4" style={{ marginTop: 6 }}>{data.extra[0]}</div>
            <div className="sc-list">
              {data.extra[1].map((r, i) => (
                <div key={i}>
                  <div className="row gap8">
                    <b className="small grow">{r[0]}</b>
                    <span className="cap muted">{r[1]}</span>
                  </div>
                  <div className="cap muted">{r[2]}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
        <div className="row end no-print sc-acts" style={{ marginTop: 8 }}>
          <Button
            variant="secondary"
            icon="file-csv"
            testId="sc-csv"
            onClick={() => {
              csvDownload(data.file, [data.head, ...data.rows]);
              toast(`${data.file} downloaded (${data.rows.length} rows)`, "ok", "download-simple");
            }}
          >
            Download CSV
          </Button>
          <Button icon="printer" testId="sc-print" onClick={() => window.print()}>Print or save as PDF</Button>
        </div>
      </div>
    </Dialog>
  );
}
