"use client";

import { use, useReducer, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Chip, Tabs, Kv, Tag, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon, type IconName } from "@/lib/icons";
import {
  REGS,
  type Regulation,
  type RegSection,
  type RegRequirement,
  regReqs,
  regQs,
  orgsCovered,
  normalizedQuestions,
  PARTS,
  choiceLabel,
  addRegulationSection,
  renameRegulationSection,
  editRegulationDetails,
  createRegulationVersion,
  publishRegulation,
  archiveRegulation,
  addQuestionToRequirement,
  type NormQuestion,
} from "@/lib/cases";
import { allCategoryTypes } from "@/lib/mockData";

const REG_STATUS_TONE: Record<string, "ok" | "warn" | "neu"> = { Published: "ok", Draft: "neu" };

type Tab = "structure" | "questions" | "evidence" | "versions";

function QParts({ q }: { q: NormQuestion }) {
  return (
    <span className="qp">
      {q.choice ? <span className="qp-c">{choiceLabel(q.choice)}</span> : null}
      {PARTS.filter(([k]) => q[k as keyof NormQuestion]).map(([k, l, i]) => (
        <span className="qp-p" key={k}><Icon name={i as IconName} />{l}</span>
      ))}
    </span>
  );
}

function StructureTab({
  r,
  open,
  setOpen,
  query,
  setQuery,
  onExpandAll,
  onAddSection,
  onRenameSection,
  onAddRequirement,
}: {
  r: Regulation;
  open: Record<string, boolean>;
  setOpen: (o: Record<string, boolean>) => void;
  query: string;
  setQuery: (q: string) => void;
  onExpandAll: () => void;
  onAddSection: () => void;
  onRenameSection: (sec: RegSection) => void;
  onAddRequirement: (sec: RegSection) => void;
}) {
  const router = useRouter();
  const q = query.trim().toLowerCase();
  return (
    <>
      <div className="tbl-tools">
        <div className="inp-wrap" style={{ width: 280 }}>
          <Icon name="magnifying-glass" />
          <input className="inp" placeholder="Search requirements" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <span className="grow" />
        <Button variant="tertiary" size="sm" onClick={onExpandAll}>Expand all</Button>
        <Button variant="outline" size="sm" icon="plus" onClick={onAddSection}>Add section</Button>
      </div>
      <div className="clause-tree">
        {r.sections.map((s) => (
          <div className="cl-sec" key={s.id}>
            <div className="cl-row sec" role="button" tabIndex={0} onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}>
              <Icon name={open[s.id] ? "caret-down" : "caret-right"} />
              <b className="grow">{s.name}</b>
              <span className="cap muted">{s.reqs.length} requirement{s.reqs.length === 1 ? "" : "s"}</span>
              <span className="acts">
                <button className="icon-btn" aria-label="Add requirement" onClick={(e) => { e.stopPropagation(); onAddRequirement(s); }}><Icon name="plus" /></button>
                <button className="icon-btn" aria-label="Rename section" onClick={(e) => { e.stopPropagation(); onRenameSection(s); }}><Icon name="pencil-simple" /></button>
              </span>
            </div>
            {open[s.id]
              ? s.reqs.length
                ? s.reqs
                    .filter((req) => !q || (req.ref + req.t).toLowerCase().includes(q))
                    .map((req) => (
                      <div className="cl-row req" key={req.ref} onClick={() => router.push(`/regulator/library/requirement?ref=${encodeURIComponent(req.ref)}`)}>
                        <span className="mono ref">{req.ref}</span>
                        <span className="grow strong">{req.t}</span>
                        <span className="cl-meta"><Icon name="question" />{req.questions.length}</span>
                        <span className="cl-meta"><Icon name="paperclip" />{(req.evidence ?? []).length}</span>
                        <span className="acts">
                          <button className="icon-btn" aria-label="View" onClick={(e) => { e.stopPropagation(); router.push(`/regulator/library/requirement?ref=${encodeURIComponent(req.ref)}`); }}><Icon name="eye" /></button>
                          <button className="icon-btn" aria-label="Edit" onClick={(e) => { e.stopPropagation(); router.push(`/regulator/library/edit?ref=${encodeURIComponent(req.ref)}`); }}><Icon name="pencil-simple" /></button>
                        </span>
                      </div>
                    ))
                : (
                  <div className="cl-row req muted small">
                    No requirements yet. <Button variant="tertiary" size="sm" onClick={() => onAddRequirement(s)}>Add requirement</Button>
                  </div>
                )
              : null}
          </div>
        ))}
      </div>
    </>
  );
}

function QuestionsTab({ r, onAddSection, onAddQuestion }: { r: Regulation; onAddSection: () => void; onAddQuestion: (sec: RegSection) => void }) {
  const router = useRouter();
  const [sid, setSid] = useState(r.sections[0].id);
  const sec = r.sections.find((s) => s.id === sid) ?? r.sections[0];
  let n = 0;
  return (
    <div className="q-layout">
      <div className="q-secs">
        <div className="overline" style={{ padding: "4px 8px 8px" }}>Sections</div>
        {r.sections.map((s) => (
          <button key={s.id} className={`q-sec ${s.id === sid ? "on" : ""}`} onClick={() => setSid(s.id)}>
            <span className="grow">{s.name}</span>
            <span className="count">{s.reqs.reduce((a, req) => a + req.questions.length, 0)}</span>
          </button>
        ))}
        <button className="q-sec add" onClick={onAddSection}><Icon name="plus" /><span>Add a section</span></button>
      </div>
      <div className="col gap12">
        {sec.reqs.length ? (
          sec.reqs.flatMap((req) =>
            normalizedQuestions(req).map((qq, qi) => {
              n++;
              return (
                <div className="q-card" key={`${req.ref}#${qi}`}>
                  <div className="row top">
                    <span className="q-n">{n}</span>
                    <div className="grow">
                      <div className="strong">{qq.q}</div>
                      <div className="row wrap gap8" style={{ marginTop: 6 }}>
                        <QParts q={qq} />
                        <button type="button" className="cap mono link-btn" onClick={() => router.push(`/regulator/library/requirement?ref=${encodeURIComponent(req.ref)}`)}>{req.ref}</button>
                      </div>
                    </div>
                    <button className="icon-btn" aria-label="Edit" onClick={() => router.push(`/regulator/library/edit?ref=${encodeURIComponent(req.ref)}`)}><Icon name="pencil-simple" /></button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className="card flat">
            <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "24px 16px", gap: 8 }}>
              <Icon name="question" />
              <div className="h4">No questions in this section</div>
              <p className="muted small">Add a requirement, then the questions organisations answer for it.</p>
            </div>
          </div>
        )}
        <div><Button variant="outline" size="sm" icon="plus" disabled={!sec.reqs.length} onClick={() => onAddQuestion(sec)}>Add question</Button></div>
      </div>
    </div>
  );
}

function EvidenceTab({ r }: { r: Regulation }) {
  const router = useRouter();
  const rows = r.sections.flatMap((s) => s.reqs.flatMap((q) => (q.evidence ?? []).map((ev) => ({ ev, q, sName: s.name }))));
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Evidence item</th><th>Requirement</th><th>Section</th></tr></thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i} className="click" onClick={() => router.push(`/regulator/library/requirement?ref=${encodeURIComponent(row.q.ref)}`)}>
                <td><div className="row gap8"><Icon name="paperclip" /><span>{row.ev}</span></div></td>
                <td><span className="mono small">{row.q.ref}</span> <span className="small muted">{row.q.t}</span></td>
                <td className="small muted">{row.sName}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={3}><div className="col" style={{ alignItems: "center", textAlign: "center", padding: "24px 16px" }}><Icon name="paperclip" /><div className="h4">No evidence yet</div></div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function VersionsTab({ r }: { r: Regulation }) {
  const rows: [string, string, string, boolean?][] = [
    [r.version, r.updated || r.effective, "Current version", true],
    ["v1.4", "1 Jun 2025", "Wording changed in sections 4 and 7"],
    ["v1.0", "1 Jan 2024", "First published"],
  ].slice(0, r.version === "v1.0" ? 1 : 3) as [string, string, string, boolean?][];
  return (
    <div className="timeline" style={{ padding: 20 }}>
      {rows.map(([v, d, n, cur]) => (
        <div className="tl" key={v}>
          <span className={`tile sm ${cur ? "brand" : ""}`}><Icon name="git-commit" /></span>
          <div className="grow">
            <div className="row gap8"><span className="tag mono">{v}</span><b>{n}</b></div>
            <div className="cap muted">{d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RegulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const r = REGS.find((x) => x.id === id);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("structure");
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries((r?.sections ?? []).map((s, i) => [s.id, i < 2])));
  const [query, setQuery] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editApplies, setEditApplies] = useState<string[]>([]);

  const [secAddOpen, setSecAddOpen] = useState(false);
  const [secName, setSecName] = useState("");

  const [secRenameTarget, setSecRenameTarget] = useState<RegSection | null>(null);
  const [secRenameName, setSecRenameName] = useState("");

  const [versionConfirmOpen, setVersionConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const [qAddSec, setQAddSec] = useState<RegSection | null>(null);
  const [qaReqRef, setQaReqRef] = useState("");
  const [qaText, setQaText] = useState("");
  const [qaChoice, setQaChoice] = useState<NormQuestion["choice"]>("yn");
  const [qaComment, setQaComment] = useState(true);
  const [qaEvidence, setQaEvidence] = useState(true);
  const [qaInterview, setQaInterview] = useState(false);

  if (!r) notFound();

  const reqs = regReqs(r);
  const det: [string, React.ReactNode][] = [
    ["Title", r.name],
    ["Reference", <span className="mono" key="ref">{r.ref}</span>],
    ["Category", r.category],
    ["Status", <Chip tone={REG_STATUS_TONE[r.status] ?? "neu"} key="st">{r.status}</Chip>],
    ["Version", r.version],
    ["Effective from", r.effective],
    ["Total sections", r.sections.length],
    ["Total requirements", reqs.length],
    ["Total questions", regQs(r)],
    ["Organisations covered", orgsCovered(r)],
    ["Last updated", r.updated || "—"],
  ];

  function openEdit() {
    setEditName(r!.name);
    setEditCategory(r!.category);
    setEditVersion(r!.version);
    setEditDesc(r!.desc);
    setEditApplies(r!.applies.slice());
    setEditOpen(true);
  }
  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    editRegulationDetails(r!.id, { name: editName, category: editCategory, version: editVersion, desc: editDesc, applies: editApplies });
    setEditOpen(false);
    bump();
    toast("Details saved");
  }

  function submitSecAdd(e: React.FormEvent) {
    e.preventDefault();
    const sid = addRegulationSection(r!.id, secName);
    if (!sid) {
      toast("Name the section", "bad");
      return;
    }
    setOpen({ ...open, [sid]: true });
    setSecAddOpen(false);
    setSecName("");
    bump();
    toast("Section added");
  }

  function submitSecRename(e: React.FormEvent) {
    e.preventDefault();
    if (!secRenameTarget) return;
    renameRegulationSection(r!.id, secRenameTarget.id, secRenameName);
    setSecRenameTarget(null);
    bump();
    toast("Section renamed");
  }

  function doCreateVersion() {
    createRegulationVersion(r!.id);
    setVersionConfirmOpen(false);
    bump();
    toast(`${r!.version} created as a draft`);
  }

  function doPublish() {
    const res = publishRegulation(r!.id);
    if (!res.ok) {
      toast(res.message ?? "Could not publish", "bad");
      return;
    }
    bump();
    toast(`${r!.name} published`);
  }

  function doArchive() {
    archiveRegulation(r!.id);
    setArchiveConfirmOpen(false);
    bump();
    toast("Regulation archived");
  }

  function openQAdd(sec: RegSection) {
    setQAddSec(sec);
    setQaReqRef(sec.reqs[0]?.ref ?? "");
    setQaText("");
    setQaChoice("yn");
    setQaComment(true);
    setQaEvidence(true);
    setQaInterview(false);
  }
  function submitQAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!qaText) {
      toast("Write the question", "bad");
      return;
    }
    addQuestionToRequirement(qaReqRef, { q: qaText, choice: qaChoice, comment: qaComment, evidence: qaEvidence, interview: qaInterview });
    setQAddSec(null);
    bump();
    toast("Question added");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Requirements library", href: "/regulator/library" }, { label: r.name }]}>
      <div className="reg-layout">
        <aside className="col gap16">
          <div className="card col gap12">
            <div className="h4">Details</div>
            <Kv pairs={det} />
            {r.applies.length ? (
              <div>
                <div className="cap muted" style={{ marginBottom: 6 }}>Applies to</div>
                <div className="row wrap gap6">{r.applies.map((a) => <Tag key={a}>{a}</Tag>)}</div>
              </div>
            ) : null}
          </div>
          <div className="card col gap4">
            <div className="h4" style={{ marginBottom: 6 }}>Actions</div>
            <button className="menu-item" onClick={openEdit}><Icon name="pencil-simple" /><span>Edit details</span></button>
            <button className="menu-item" onClick={() => router.push(`/regulator/library/edit?reg=${encodeURIComponent(r.id)}&sec=${encodeURIComponent(r.sections[r.sections.length - 1].id)}`)}><Icon name="plus" /><span>Add requirement</span></button>
            <button className="menu-item" onClick={() => setVersionConfirmOpen(true)}><Icon name="copy" /><span>Create new version</span></button>
            {r.status === "Draft" ? (
              <button className="menu-item" onClick={doPublish}><Icon name="paper-plane-tilt" /><span>Publish regulation</span></button>
            ) : (
              <button className="menu-item" onClick={() => setArchiveConfirmOpen(true)}><Icon name="archive" /><span>Archive regulation</span></button>
            )}
          </div>
        </aside>
        <section className="col gap16" style={{ minWidth: 0 }}>
          <div>
            <div className="row wrap gap8">
              <span className="tag mono">{r.ref}</span>
              <Chip tone={REG_STATUS_TONE[r.status] ?? "neu"}>{r.status}</Chip>
            </div>
            <h1 className="h1" style={{ marginTop: 6 }}>{r.name}</h1>
            {r.desc ? <p className="muted" style={{ marginTop: 4, maxWidth: "80ch" }}>{r.desc}</p> : null}
          </div>
          <div className="card p0">
            <Tabs
              items={[
                { id: "structure", label: "Requirements", count: reqs.length },
                { id: "questions", label: "Questions", count: regQs(r) },
                { id: "evidence", label: "Evidence", count: reqs.reduce((a, q) => a + (q.evidence ?? []).length, 0) },
                { id: "versions", label: "Versions" },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div style={{ padding: tab === "versions" ? 0 : 16 }}>
              {tab === "structure" ? (
                <StructureTab
                  r={r}
                  open={open}
                  setOpen={setOpen}
                  query={query}
                  setQuery={setQuery}
                  onExpandAll={() => setOpen(Object.fromEntries(r.sections.map((s) => [s.id, true])))}
                  onAddSection={() => { setSecName(`${r.sections.length + 1}. `); setSecAddOpen(true); }}
                  onRenameSection={(sec) => { setSecRenameTarget(sec); setSecRenameName(sec.name); }}
                  onAddRequirement={(sec) => router.push(`/regulator/library/edit?reg=${encodeURIComponent(r.id)}&sec=${encodeURIComponent(sec.id)}`)}
                />
              ) : null}
              {tab === "questions" ? (
                <QuestionsTab
                  r={r}
                  onAddSection={() => { setSecName(`${r.sections.length + 1}. `); setSecAddOpen(true); }}
                  onAddQuestion={openQAdd}
                />
              ) : null}
              {tab === "evidence" ? <EvidenceTab r={r} /> : null}
              {tab === "versions" ? <VersionsTab r={r} /> : null}
            </div>
          </div>
        </section>
      </div>

      {/* Edit details */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} wide>
        <div className="row"><h2 className="h3">Edit details</h2></div>
        <p className="muted small mono">{r.ref}</p>
        <form className="col gap16" onSubmit={submitEdit}>
          <Field label="Name" htmlFor="re-name">
            <input className="inp" id="re-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="Category" htmlFor="re-cat">
              <input className="inp" id="re-cat" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
            </Field>
            <Field label="Version" htmlFor="re-ver">
              <input className="inp" id="re-ver" value={editVersion} onChange={(e) => setEditVersion(e.target.value)} />
            </Field>
          </div>
          <Field label="Description" htmlFor="re-desc">
            <textarea className="ta" id="re-desc" rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          </Field>
          <div className="field">
            <label>Applies to</label>
            <div className="grid g2" style={{ gap: 6 }}>
              {allCategoryTypes().map((t) => (
                <label className="check" key={t.id}>
                  <input type="checkbox" checked={editApplies.includes(t.name)} onChange={(e) => setEditApplies((prev) => (e.target.checked ? [...prev, t.name] : prev.filter((x) => x !== t.name)))} />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Add section */}
      <Dialog open={secAddOpen} onClose={() => setSecAddOpen(false)}>
        <div className="row"><h2 className="h3">Add a section</h2></div>
        <p className="muted small">Sections group related requirements, e.g. &ldquo;5. Operations security&rdquo;.</p>
        <form className="col gap16" onSubmit={submitSecAdd}>
          <Field label="Section name" htmlFor="sec-name">
            <input className="inp" id="sec-name" value={secName} onChange={(e) => setSecName(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setSecAddOpen(false)}>Cancel</Button>
            <Button type="submit">Add section</Button>
          </div>
        </form>
      </Dialog>

      {/* Rename section */}
      <Dialog open={!!secRenameTarget} onClose={() => setSecRenameTarget(null)}>
        <div className="row"><h2 className="h3">Rename section</h2></div>
        <form className="col gap16" onSubmit={submitSecRename}>
          <Field label="Section name" htmlFor="sec-ren">
            <input className="inp" id="sec-ren" value={secRenameName} onChange={(e) => setSecRenameName(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setSecRenameTarget(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Create new version */}
      <Dialog open={versionConfirmOpen} onClose={() => setVersionConfirmOpen(false)}>
        <div className="row"><h2 className="h3">Create a new version?</h2></div>
        <p className="muted small">A draft copy of {r.version} is made. Programmes keep using {r.version} until you publish the new one.</p>
        <div className="row end">
          <Button variant="outline" onClick={() => setVersionConfirmOpen(false)}>Cancel</Button>
          <Button onClick={doCreateVersion}>Create draft version</Button>
        </div>
      </Dialog>

      {/* Archive */}
      <Dialog open={archiveConfirmOpen} onClose={() => setArchiveConfirmOpen(false)}>
        <div className="row"><h2 className="h3">Archive {r.name}?</h2></div>
        <p className="muted small">It stays readable for past programmes but cannot be used in new ones.</p>
        <div className="row end">
          <Button variant="outline" onClick={() => setArchiveConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={doArchive}>Archive</Button>
        </div>
      </Dialog>

      {/* Add a question */}
      <Dialog open={!!qAddSec} onClose={() => setQAddSec(null)}>
        <div className="row"><h2 className="h3">Add a question</h2></div>
        <p className="muted small">Organisations answer it as part of the requirement.</p>
        {qAddSec ? (
          <form className="col gap16" onSubmit={submitQAdd}>
            <Field label="Requirement" htmlFor="qa-req">
              <select className="sel" id="qa-req" value={qaReqRef} onChange={(e) => setQaReqRef(e.target.value)}>
                {qAddSec.reqs.map((req: RegRequirement) => <option key={req.ref} value={req.ref}>{req.ref} · {req.t}</option>)}
              </select>
            </Field>
            <Field label="Question" htmlFor="qa-q">
              <textarea className="ta" id="qa-q" rows={2} placeholder="e.g. Who approved the current policy?" value={qaText} onChange={(e) => setQaText(e.target.value)} />
            </Field>
            <div className="field">
              <label>Answer parts</label>
              <div className="q-parts">
                <select className="sel" style={{ width: 220, height: 32 }} value={qaChoice} onChange={(e) => setQaChoice(e.target.value as NormQuestion["choice"])}>
                  <option value="yn">Yes / No / Not applicable</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="">No choice</option>
                </select>
                <label className="part-tog"><input type="checkbox" checked={qaComment} onChange={(e) => setQaComment(e.target.checked)} /><Icon name="chat-text" />Comment</label>
                <label className="part-tog"><input type="checkbox" checked={qaEvidence} onChange={(e) => setQaEvidence(e.target.checked)} /><Icon name="paperclip" />Evidence</label>
                <label className="part-tog"><input type="checkbox" checked={qaInterview} onChange={(e) => setQaInterview(e.target.checked)} /><Icon name="video-camera" />Interview</label>
              </div>
              <div className="hint">Tick every part the organisation must give for this question.</div>
            </div>
            <div className="row end">
              <Button type="button" variant="outline" onClick={() => setQAddSec(null)}>Cancel</Button>
              <Button type="submit">Add question</Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
