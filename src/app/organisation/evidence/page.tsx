"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tile, Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { EVIDENCE } from "@/lib/cases";

const ORG_ID = "zenith";
const SOON_CUTOFF = "2026-12-31";

export default function EvidencePage() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [q, setQ] = useState("");
  const [f, setF] = useState<"All" | "In use" | "Unused" | "Expiring">("All");

  const list = EVIDENCE.filter((e) => e.org === ORG_ID);
  const soon = (e: (typeof list)[number]) => !!e.expires && e.expires <= SOON_CUTOFF;
  const rows = list.filter((e) => (!q || e.name.toLowerCase().includes(q.toLowerCase())) && (f === "All" || (f === "Expiring" ? soon(e) : f === "Unused" ? !e.links.length : e.links.length > 0)));

  function upload() {
    EVIDENCE.unshift({ id: `e${EVIDENCE.length + 1}`, org: ORG_ID, name: "Uploaded document.pdf", size: "640 KB", kind: "Upload", by: "A. Okonkwo", when: "19 Oct 2026", expires: "", links: [] });
    bump();
  }

  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Evidence library" sub="Upload a document once and use it for any question. Files keep their integrity record." actions={<Button icon="upload-simple" onClick={upload} testId="ev-upload">Upload</Button>} />
      <div className="card p0">
        <div className="tbl-tools">
          <div className="inp-wrap" style={{ width: 280 }}>
            <Icon name="magnifying-glass" />
            <input className="inp" placeholder="Search files" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="tbl-sub">
          <div className="pills">
            {(["All", "In use", "Unused", "Expiring"] as const).map((x) => (
              <button key={x} className={`pill ${f === x ? "on" : ""}`} onClick={() => setF(x)}>{x === "All" ? "All files" : x === "Expiring" ? "Expiring by 31 Dec" : x}<span className="count">{x === "All" ? list.length : x === "In use" ? list.filter((e) => e.links.length).length : x === "Unused" ? list.filter((e) => !e.links.length).length : list.filter(soon).length}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>File</th><th>Type</th><th className="num">Used in</th><th>Added</th><th>Expires</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((e) => (
                  <tr key={e.id}>
                    <td><div className="row gap8"><Tile icon="file-text" size="sm" /><div><div className="strong">{e.name}</div><div className="cap muted">{e.size}</div></div></div></td>
                    <td className="small">{e.kind}</td>
                    <td className="num tnum">{e.links.length}</td>
                    <td className="small muted">{e.when} · {e.by}</td>
                    <td className="small">{e.expires ? (soon(e) ? <Chip tone="warn" icon="clock">{e.expires}</Chip> : e.expires) : <span className="muted">—</span>}</td>
                    <td className="act-col"><button className="icon-btn" aria-label="Download"><Icon name="download-simple" /></button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="folder-open" size="lg" /><div className="h4">No files here</div><p className="muted small">Upload a document, or attach one while answering.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">{rows.length} of {list.length} files</div>
      </div>
    </AppShell>
  );
}
