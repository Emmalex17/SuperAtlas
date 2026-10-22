"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Field, Button, StatusChip, AlertBox } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import {
  tplOf,
  retOrgsForTemplate,
  nextVer,
  saveTemplate,
  makeBlankTemplate,
  PENDING_UPLOAD,
  TODAY,
  type ReturnTemplate,
  type ReturnField,
  type ReturnFieldType,
} from "@/lib/returns";
import { allCategoryTypes } from "@/lib/mockData";

const FIELD_TYPES: [ReturnFieldType, string][] = [
  ["number", "Number"],
  ["text", "Text"],
  ["date", "Date"],
  ["yn", "Yes or no"],
];

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export default function ReturnTemplateBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const isNew = id === "new";
  const [t, setT] = useState<ReturnTemplate>(() => {
    if (!isNew) return clone(tplOf(id));
    if (PENDING_UPLOAD.draft) {
      const d = PENDING_UPLOAD.draft;
      PENDING_UPLOAD.draft = null;
      return d;
    }
    return makeBlankTemplate();
  });
  const [parsed] = useState(!isNew ? false : t.source === "Uploaded template");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [errs, setErrs] = useState<Record<string, string>>({});

  const live = t.status === "Active";
  const typeOpts = allCategoryTypes().map((x) => x.name);

  function patch(p: Partial<ReturnTemplate>) {
    setT((cur) => ({ ...cur, ...p }));
  }

  function patchField(i: number, p: Partial<ReturnField>) {
    setT((cur) => {
      const fields = cur.fields.slice();
      fields[i] = { ...fields[i], ...p };
      return { ...cur, fields };
    });
  }

  function addField() {
    setT((cur) => ({ ...cur, fields: [...cur.fields, { key: `f${cur.fields.length + 1}`, label: "", type: "number", unit: "", req: true, min: 0, max: "", lte: "", help: "" }] }));
  }

  function delField(i: number) {
    setT((cur) => (cur.fields.length <= 1 ? cur : { ...cur, fields: cur.fields.filter((_, k) => k !== i) }));
  }

  function toggleType(name: string) {
    setT((cur) => ({ ...cur, types: cur.types.includes(name) ? cur.types.filter((x) => x !== name) : [...cur.types, name] }));
  }

  function save(mode: "draft" | "publish") {
    const e: Record<string, string> = {};
    if (!t.name) e.name = "Enter a name.";
    if (!t.code) e.code = "Enter a short code.";
    if (mode === "publish") {
      if (!t.types.length) e.types = "Choose at least one type of organisation.";
      t.fields.forEach((fd, i) => { if (!fd.label) e[`f${i}`] = "1"; });
    }
    setErrs(e);
    if (Object.keys(e).length) {
      toast("Check the highlighted fields", "bad", "warning");
      return;
    }
    const toSave: ReturnTemplate = { ...t, dueDays: +t.dueDays || 30 };
    const n = retOrgsForTemplate(toSave).length;
    saveTemplate(toSave, mode, TODAY);
    toast(mode === "publish" ? `${toSave.name} published. ${n} organisations will file it.` : "Draft saved", "ok", mode === "publish" ? "paper-plane-tilt" : "check");
    router.push("/regulator/returns");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Data returns", href: "/regulator/returns" }, { label: isNew ? "New template" : t.name || "New template" }]}>
      <div className="rh">
        <div className="rh-main">
          <div className="overline">Data returns · {isNew ? "new template" : `${t.code} ${t.version}`}</div>
          <div className="rh-title">
            <h1 className="h1">{t.name || "New return template"}</h1>
            <StatusChip status={t.status} />
          </div>
        </div>
      </div>

      {parsed ? (
        <div style={{ margin: "16px 0" }}>
          <AlertBox tone="ok" title={`Read ${t.fields.length} fields from agent-network-return.xlsx`} body="Check each field's type and rules. Organisations can fill this in online or upload the same spreadsheet." />
        </div>
      ) : null}
      {live ? (
        <div style={{ margin: "16px 0" }}>
          <AlertBox tone="info" title={`This template is live. Saving creates version ${nextVer(t.version)}; filings already open keep the version they started with.`} />
        </div>
      ) : null}

      <div className="col gap16">
        <div className="card col gap16">
          <div className="h4">Basics</div>
          <div className="grid g2" style={{ gap: 14 }}>
            <Field label="Name" htmlFor="rt-name" error={errs.name}>
              <input className="inp" id="rt-name" placeholder="e.g. Agent network return" value={t.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Short code" htmlFor="rt-code" error={errs.code} hint={errs.code ? undefined : "Used on receipts."}>
              <input className="inp" id="rt-code" placeholder="e.g. ANR" value={t.code} onChange={(e) => patch({ code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Frequency" htmlFor="rt-freq">
              <select className="sel" id="rt-freq" value={t.freq} onChange={(e) => patch({ freq: e.target.value as ReturnTemplate["freq"] })}>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Yearly</option>
              </select>
            </Field>
            <Field label={t.freq === "Monthly" ? "Due on day of next month" : "Due, days after period end"} htmlFor="rt-due">
              <input className="inp" id="rt-due" type="number" value={t.dueDays} onChange={(e) => patch({ dueDays: +e.target.value || 0 })} />
            </Field>
          </div>
          <Field label="Description" htmlFor="rt-desc" optional>
            <textarea className="ta" id="rt-desc" rows={2} placeholder="What this return collects" value={t.desc} onChange={(e) => patch({ desc: e.target.value })} />
          </Field>
          <Field label="Who files" error={errs.types}>
            <div className="grid g3" style={{ gap: "6px 14px" }}>
              {typeOpts.map((name) => (
                <label className="check" key={name}>
                  <input type="checkbox" checked={t.types.includes(name)} onChange={() => toggleType(name)} />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="card p0">
          <div className="tbl-tools">
            <div className="grow">
              <div className="h4">Fields</div>
              <div className="cap muted">What the organisation enters. Rules are checked before they can submit.</div>
            </div>
            <div className="seg sm">
              {([["edit", "Edit", "pencil-simple"], ["preview", "Preview", "eye"]] as const).map(([k, l, i]) => (
                <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)} data-test={`rtv-${k}`}>
                  <Icon name={i} /> {l}
                </button>
              ))}
            </div>
            {view === "edit" ? <Button variant="secondary" size="sm" icon="plus" onClick={addField} testId="rt-add">Add field</Button> : null}
          </div>
          {view === "preview" ? (
            <div style={{ padding: 20, maxWidth: 640 }}>
              {t.fields.filter((fd) => fd.label).length ? (
                <div className="col gap12">
                  {t.fields.filter((fd) => fd.label).map((fd) => (
                    <Field
                      key={fd.key}
                      label={`${fd.label}${fd.unit ? ` (${fd.unit})` : ""}`}
                      optional={!fd.req}
                      hint={[fd.min !== "" && fd.type === "number" ? `Minimum ${fd.min}` : "", fd.max !== "" && fd.type === "number" ? `maximum ${fd.max}` : "", fd.lte ? `not more than ${(t.fields.find((z) => z.key === fd.lte)?.label ?? "").toLowerCase()}` : ""].filter(Boolean).join(", ")}
                    >
                      {fd.type === "yn" ? (
                        <div className="seg sm"><button>Yes</button><button>No</button></div>
                      ) : (
                        <input className="inp" readOnly type={fd.type === "date" ? "date" : "text"} placeholder={fd.type === "number" ? "0" : ""} />
                      )}
                    </Field>
                  ))}
                </div>
              ) : (
                <p className="cap muted">Add a field to see it here.</p>
              )}
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl keep rt-tbl">
                <thead><tr><th>Label</th><th>Type</th><th>Unit</th><th>Min</th><th>Max</th><th>Not more than</th><th>Required</th><th className="act-col" /></tr></thead>
                <tbody>
                  {t.fields.map((fd, i) => (
                    <tr key={fd.key}>
                      <td style={{ minWidth: 220 }}><input className={`inp ${errs[`f${i}`] ? "invalid" : ""}`} placeholder="Field label" value={fd.label} onChange={(e) => patchField(i, { label: e.target.value })} data-test={`rf-l-${i}`} /></td>
                      <td>
                        <select className="sel" style={{ width: 120 }} value={fd.type} onChange={(e) => patchField(i, { type: e.target.value as ReturnFieldType })}>
                          {FIELD_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      </td>
                      <td><input className="inp" style={{ width: 100 }} placeholder="—" value={fd.unit} onChange={(e) => patchField(i, { unit: e.target.value })} /></td>
                      <td><input className="inp" style={{ width: 70 }} value={fd.min} onChange={(e) => patchField(i, { min: e.target.value === "" ? "" : +e.target.value })} /></td>
                      <td><input className="inp" style={{ width: 70 }} value={fd.max} onChange={(e) => patchField(i, { max: e.target.value === "" ? "" : +e.target.value })} /></td>
                      <td>
                        <select className="sel" style={{ width: 170 }} value={fd.lte} onChange={(e) => patchField(i, { lte: e.target.value })}>
                          <option value="">—</option>
                          {t.fields.filter((z, k) => k !== i && z.type === "number" && z.label).map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: "center" }}><input type="checkbox" checked={fd.req} onChange={(e) => patchField(i, { req: e.target.checked })} aria-label="Required" /></td>
                      <td className="act-col">{t.fields.length > 1 ? <button type="button" className="icon-btn" aria-label="Remove field" title="Remove" onClick={() => delField(i)}><Icon name="trash" /></button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="row end">
          <Button variant="tertiary" onClick={() => router.push("/regulator/returns")}>Cancel</Button>
          <Button variant="secondary" onClick={() => save("draft")} testId="rt-draft">Save draft</Button>
          <Button icon="paper-plane-tilt" onClick={() => save("publish")} testId="rt-publish">{live ? `Publish ${nextVer(t.version)}` : "Publish template"}</Button>
        </div>
      </div>
    </AppShell>
  );
}
