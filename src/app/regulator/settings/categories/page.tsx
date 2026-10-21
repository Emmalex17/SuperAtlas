"use client";

import { useReducer, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button, Chip, Field, Tabs, AlertBox, Tile } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  CATEGORIES,
  TAGS,
  GROUPS,
  CAT_HISTORY,
  allCategoryTypes,
  moveSector,
  moveType,
  addSector,
  addType,
  addTier,
  renameSector,
  renameType,
  deleteSector,
  deleteType,
  addTag,
  removeTag,
  addGroup,
} from "@/lib/mockData";

type Tab = "tree" | "tags" | "groups" | "history";

type AddTarget = { level: "sector" | "type" | "tier"; sectorId?: string; typeId?: string } | null;
type EditTarget = { level: "s" | "t"; sectorId: string; typeId?: string } | null;
type DeleteTarget = { level: "s" | "t"; sectorId: string; typeId?: string; name: string; count: number } | null;

export default function CategoriesSettingsPage() {
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("tree");
  const [addTarget, setAddTarget] = useState<AddTarget>(null);
  const [addName, setAddName] = useState("");
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [tagNew, setTagNew] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupInclude, setGroupInclude] = useState<string[]>([]);

  const total = allCategoryTypes().reduce((a, t) => a + t.count, 0);

  function openAddDialog(target: AddTarget) {
    setAddName("");
    setAddTarget(target);
  }
  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) {
      toast("Enter a name", "bad");
      return;
    }
    if (addTarget?.level === "sector") addSector(addName.trim());
    else if (addTarget?.level === "type" && addTarget.sectorId) addType(addTarget.sectorId, addName.trim());
    else if (addTarget?.level === "tier" && addTarget.sectorId && addTarget.typeId) addTier(addTarget.sectorId, addTarget.typeId, addName.trim());
    toast(`Added "${addName.trim()}"`);
    setAddTarget(null);
    bump();
  }

  function openEditDialog(target: EditTarget, currentName: string) {
    setEditName(currentName);
    setEditTarget(target);
  }
  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (editTarget.level === "s") renameSector(editTarget.sectorId, editName || "");
    else if (editTarget.typeId) renameType(editTarget.sectorId, editTarget.typeId, editName || "");
    toast("Renamed");
    setEditTarget(null);
    bump();
  }

  function tryDelete(level: "s" | "t", sectorId: string, typeId: string | undefined, name: string, count: number) {
    setDeleteTarget({ level, sectorId, typeId, name, count });
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    const ok = deleteTarget.level === "s" ? deleteSector(deleteTarget.sectorId) : deleteType(deleteTarget.sectorId, deleteTarget.typeId!);
    if (ok) toast(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
    bump();
  }

  function submitTag(e: React.FormEvent) {
    e.preventDefault();
    if (!tagNew.trim()) return;
    addTag(tagNew.trim());
    setTagNew("");
    toast("Tag added");
    bump();
  }

  function submitGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim() || !groupInclude.length) {
      toast("Name the group and pick at least one category", "bad");
      return;
    }
    addGroup(groupName.trim(), groupInclude);
    setGroupOpen(false);
    setGroupName("");
    setGroupInclude([]);
    toast("Saved group created");
    bump();
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Categories" }]}>
      <SettingsShell active="settings/categories">
        <PageHead title="Categories" sub="Organise the institutions you supervise by sector, institution type and authorisation tier." />
        <div className="row wrap">
          <p className="muted small grow">Organise the institutions you supervise in three levels: sector, institution type and authorisation tier. Requirements, programmes and dashboards follow this structure.</p>
          <Link href="/regulator/settings/categories/import">
            <Button variant="outline" size="sm" icon="upload-simple" testId="import-cats">Import spreadsheet</Button>
          </Link>
          <Button size="sm" icon="plus" onClick={() => openAddDialog({ level: "sector" })}>Add sector</Button>
        </div>

        <Tabs
          items={[
            { id: "tree", label: "Categories", count: CATEGORIES.length + allCategoryTypes().length },
            { id: "tags", label: "Tags", count: TAGS.length },
            { id: "groups", label: "Saved groups", count: GROUPS.length },
            { id: "history", label: "History" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "tree" ? (
          <div className="grid side">
            <div className="card">
              <div className="row between" style={{ marginBottom: 8 }}>
                <span className="overline">Sector → institution type → tier</span>
                <span className="cap muted tnum">{total} organisations</span>
              </div>
              <div className="tree">
                {CATEGORIES.map((c) => (
                  <div key={c.id}>
                    <div className={`tree-row l1 ${c.isNew ? "sel" : ""}`}>
                      <Icon name="folder-open" />
                      <span>{c.name}</span>
                      {c.isNew ? <Chip tone="brand">New</Chip> : null}
                      <span className="count" style={{ marginLeft: 8 }}>{c.types.reduce((a, t) => a + t.count, 0)}</span>
                      <span className="acts">
                        <button type="button" className="icon-btn" aria-label="Move up" title="Move up" onClick={() => { moveSector(c.id, -1); bump(); }}><Icon name="arrow-up" /></button>
                        <button type="button" className="icon-btn" aria-label="Move down" title="Move down" onClick={() => { moveSector(c.id, 1); bump(); }}><Icon name="arrow-down" /></button>
                        <button type="button" className="icon-btn" aria-label="Add institution type" title="Add institution type" onClick={() => openAddDialog({ level: "type", sectorId: c.id })}><Icon name="plus" /></button>
                        <button type="button" className="icon-btn" aria-label="Rename" title="Rename" onClick={() => openEditDialog({ level: "s", sectorId: c.id }, c.name)}><Icon name="pencil-simple" /></button>
                        <button type="button" className="icon-btn" aria-label="Delete" title="Delete" onClick={() => tryDelete("s", c.id, undefined, c.name, c.types.reduce((a, t) => a + t.count, 0))}><Icon name="trash" /></button>
                      </span>
                    </div>
                    {c.types.map((t) => (
                      <div key={t.id}>
                        <div className={`tree-row l2 ${t.isNew ? "sel" : ""}`}>
                          <Icon name="buildings" />
                          <span>{t.name}</span>
                          {t.isNew ? <Chip tone="brand">New</Chip> : null}
                          <span className="count" style={{ marginLeft: 8 }}>{t.count}</span>
                          <span className="acts">
                            <button type="button" className="icon-btn" aria-label="Move up" title="Move up" onClick={() => { moveType(c.id, t.id, -1); bump(); }}><Icon name="arrow-up" /></button>
                            <button type="button" className="icon-btn" aria-label="Move down" title="Move down" onClick={() => { moveType(c.id, t.id, 1); bump(); }}><Icon name="arrow-down" /></button>
                            <button type="button" className="icon-btn" aria-label="Add tier" title="Add tier" onClick={() => openAddDialog({ level: "tier", sectorId: c.id, typeId: t.id })}><Icon name="plus" /></button>
                            <button type="button" className="icon-btn" aria-label="Rename" title="Rename" onClick={() => openEditDialog({ level: "t", sectorId: c.id, typeId: t.id }, t.name)}><Icon name="pencil-simple" /></button>
                            <button type="button" className="icon-btn" aria-label="Delete" title="Delete" onClick={() => tryDelete("t", c.id, t.id, t.name, t.count)}><Icon name="trash" /></button>
                          </span>
                        </div>
                        <div className="tree-row l3">
                          {t.tiers.length ? (
                            <span className="row wrap gap6">
                              {t.tiers.map((x) => (
                                <span key={x} className="chip brand" style={{ height: 22 }}>{x}</span>
                              ))}
                            </span>
                          ) : (
                            <span className="cap">No tiers</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="col gap24">
              <div className="card col gap12">
                <div className="h4">How categories are used</div>
                {[
                  ["user-plus", "Invitations map each organisation to a category"],
                  ["buildings", "Organisations pick one when they register"],
                  ["book-open-text", "Requirements apply by category"],
                  ["git-diff", "Changes to an organisation's category need your approval"],
                ].map(([i, t]) => (
                  <div className="row small" key={t}>
                    <Tile icon={i} size="sm" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="note">
                <Icon name="lock-simple" />
                <div>Deleting a category that has organisations in it is blocked. Move the organisations first.</div>
              </div>
            </div>
          </div>
        ) : tab === "tags" ? (
          <div className="card col gap16">
            <p className="muted small">Tags cut across categories, for example listed companies or systemically important banks.</p>
            <div className="row wrap gap8">
              {TAGS.map((t, i) => (
                <span key={t} className="chip brand" style={{ height: 30, padding: "0 6px 0 12px" }}>
                  {t}
                  <button className="icon-btn" style={{ width: 22, height: 22 }} aria-label="Remove tag" onClick={() => { removeTag(i); bump(); }}>
                    <Icon name="x" />
                  </button>
                </span>
              ))}
            </div>
            <form className="row" onSubmit={submitTag} style={{ maxWidth: 420 }}>
              <input className="inp" placeholder="New tag name" value={tagNew} onChange={(e) => setTagNew(e.target.value)} />
              <Button type="submit" variant="secondary" icon="plus">Add tag</Button>
            </form>
          </div>
        ) : tab === "groups" ? (
          <>
            <div className="card p0">
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Group</th><th>Rule</th><th>Organisations</th></tr></thead>
                  <tbody>
                    {GROUPS.map((g) => (
                      <tr key={g.name}>
                        <td className="strong">{g.name}</td>
                        <td className="small">{g.rule}</td>
                        <td className="tnum">{g.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <Button variant="secondary" icon="plus" onClick={() => setGroupOpen(true)}>Create saved group</Button>
            </div>
          </>
        ) : (
          <div className="card">
            <div className="timeline">
              {CAT_HISTORY.map((h, i) => (
                <div className="tl" key={i}>
                  <span className="av">{h.who.split(" ").map((w) => w[0]).join("")}</span>
                  <div>
                    <div className="strong">{h.what}</div>
                    <div className="cap muted">{h.who} · {h.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SettingsShell>

      <Dialog open={addTarget !== null} onClose={() => setAddTarget(null)}>
        <div className="row"><h2 className="h3">Add {addTarget?.level === "sector" ? "sector" : addTarget?.level === "type" ? "institution type" : "tier"}</h2></div>
        <p className="muted small">
          {addTarget?.level === "sector" ? "Top level, e.g. Insurance." : addTarget?.level === "type" ? `Under ${CATEGORIES.find((c) => c.id === addTarget.sectorId)?.name}` : "Authorisation level, e.g. National."}
        </p>
        <form className="col gap16" onSubmit={submitAdd}>
          <Field label="Name" htmlFor="cat-name">
            <input className="inp" id="cat-name" value={addName} onChange={(e) => setAddName(e.target.value)} />
          </Field>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setAddTarget(null)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editTarget !== null} onClose={() => setEditTarget(null)}>
        <div className="row"><h2 className="h3">Rename</h2></div>
        <p className="muted small">Organisations keep their place; only the name changes.</p>
        <form className="col gap16" onSubmit={submitEdit}>
          <Field label="Name" htmlFor="cat-ren">
            <input className="inp" id="cat-ren" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        {deleteTarget && deleteTarget.count ? (
          <>
            <AlertBox tone="warn" title="You cannot delete this yet" body={`${deleteTarget.count} organisations are in "${deleteTarget.name}". Move them to another category first, then delete it.`} />
            <div className="row end" style={{ marginTop: 16 }}>
              <Button onClick={() => setDeleteTarget(null)}>OK</Button>
            </div>
          </>
        ) : (
          <>
            <div className="row"><h2 className="h3">Delete &ldquo;{deleteTarget?.name}&rdquo;?</h2></div>
            <div className="row end" style={{ marginTop: 16 }}>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={groupOpen} onClose={() => setGroupOpen(false)} wide>
        <div className="row"><h2 className="h3">Create saved group</h2></div>
        <p className="muted small">A named set of categories you can reuse in programmes and dashboards.</p>
        <form className="col gap16" onSubmit={submitGroup}>
          <Field label="Group name" htmlFor="g-name">
            <input className="inp" id="g-name" placeholder="e.g. Payments and fintech" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </Field>
          <div className="field">
            <label>Include</label>
            <div className="grid g2" style={{ gap: 8 }}>
              {allCategoryTypes().map((t) => (
                <label className="check" key={t.id}>
                  <input
                    type="checkbox"
                    checked={groupInclude.includes(t.name)}
                    onChange={(e) => setGroupInclude((prev) => (e.target.checked ? [...prev, t.name] : prev.filter((x) => x !== t.name)))}
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="row end">
            <Button variant="outline" type="button" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button type="submit">Create group</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
