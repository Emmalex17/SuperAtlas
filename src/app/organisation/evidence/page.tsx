"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tile, Button, Field, Kv } from "@/components/ui";
import { Dialog, Drawer } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { EVIDENCE, CASES, progOf, qsetQs, fmtD, TODAY } from "@/lib/cases";

const ORG_ID = "zenith";
const SOON_CUTOFF = "2026-12-31";
const EV_TYPES = ["Policy", "Plan", "Report", "Board record", "System export", "Certificate", "Other"];

export default function EvidencePage() {
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [q, setQ] = useState("");
  const [f, setF] = useState<"All" | "In use" | "Unused" | "Expiring">("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("Business continuity plan 2026.pdf");
  const [kind, setKind] = useState("Plan");
  const [expires, setExpires] = useState("");

  const list = EVIDENCE.filter((e) => e.org === ORG_ID);
  const soon = (e: (typeof list)[number]) => !!e.expires && e.expires <= SOON_CUTOFF;
  const rows = list.filter((e) => (!q || e.name.toLowerCase().includes(q.toLowerCase())) && (f === "All" || (f === "Expiring" ? soon(e) : f === "Unused" ? !e.links.length : e.links.length > 0)));
  const opened = EVIDENCE.find((e) => e.id === openId);
  const usedIn = opened
    ? CASES.filter((c) => c.org === opened.org).flatMap((c) => qsetQs(progOf(c.prog).qset).filter((qq) => opened.links.includes(qq.id)).map((qq) => [progOf(c.prog).name, qq.text] as [string, string]))
    : [];

  function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      toast("Name the file", "bad");
      return;
    }
    EVIDENCE.unshift({ id: `e-${Date.now()}`, org: ORG_ID, name, size: "1.1 MB", kind, by: "A. Okonkwo", when: TODAY, expires, links: [] });
    setUploadOpen(false);
    setName("Business continuity plan 2026.pdf");
    setKind("Plan");
    setExpires("");
    bump();
    toast("Uploaded", "ok", "upload-simple");
  }

  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Evidence library" sub="Upload a document once and use it for any question. Files keep their integrity record." actions={<Button icon="upload-simple" onClick={() => setUploadOpen(true)} testId="ev-upload">Upload</Button>} />
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
                  <tr key={e.id} className="click" onClick={() => setOpenId(e.id)}>
                    <td><div className="row gap8"><Tile icon="file-text" size="sm" /><div><div className="strong">{e.name}</div><div className="cap muted">{e.size}</div></div></div></td>
                    <td className="small">{e.kind}</td>
                    <td className="num tnum">{e.links.length}</td>
                    <td className="small muted">{e.when} · {e.by}</td>
                    <td className="small">{e.expires ? (soon(e) ? <Chip tone="warn" icon="clock">{fmtD(e.expires)}</Chip> : fmtD(e.expires)) : <span className="muted">—</span>}</td>
                    <td className="act-col"><button className="icon-btn" aria-label="Download" onClick={(ev) => { ev.stopPropagation(); toast("Download started"); }}><Icon name="download-simple" /></button></td>
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

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <div className="row"><h2 className="h3">Upload to the evidence library</h2></div>
        <p className="muted small">PDF, Word, Excel or images up to 25 MB.</p>
        <form className="col gap16" onSubmit={submitUpload}>
          <button type="button" className="drop" onClick={() => toast("File attached")}>
            <Tile icon="cloud-arrow-up" size="lg" />
            <b>Drop a file here</b>
            <span className="cap muted">or click to choose</span>
          </button>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="Name" htmlFor="eu-n"><input className="inp" id="eu-n" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Type" htmlFor="eu-k">
              <select className="sel" id="eu-k" value={kind} onChange={(e) => setKind(e.target.value)}>
                {EV_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Expires" htmlFor="eu-x" optional hint="We remind you 30 days before.">
            <input className="inp" id="eu-x" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button type="submit" testId="eu-go">Upload</Button>
          </div>
        </form>
      </Dialog>

      <Drawer open={!!opened} onClose={() => setOpenId(null)}>
        {opened ? (
          <>
            <div className="row top">
              <div className="grow">
                <div className="overline">Evidence</div>
                <h2 className="h3" style={{ marginTop: 4 }}>{opened.name}</h2>
              </div>
              <button className="icon-btn" aria-label="Close" onClick={() => setOpenId(null)}><Icon name="x" /></button>
            </div>
            <Kv
              pairs={[
                ["Type", opened.kind],
                ["Size", opened.size],
                ["Added", `${opened.when} by ${opened.by}`],
                ["Expires", opened.expires ? fmtD(opened.expires) : "—"],
                ["Integrity", <span className="mono small" key="i">SHA-256 recorded</span>],
              ]}
            />
            <div className="h4">Used in</div>
            {usedIn.length ? (
              usedIn.map(([pn, qt], i) => (
                <div className="file" key={i}>
                  <Tile icon="question" size="sm" />
                  <div className="grow">
                    <div className="small strong">{qt}</div>
                    <div className="cap muted">{pn}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="small muted">Not used yet. Attach it from any question with &ldquo;From evidence library&rdquo;.</p>
            )}
          </>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
