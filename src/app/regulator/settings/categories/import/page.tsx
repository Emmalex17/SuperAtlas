"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { CATEGORIES } from "@/lib/mockData";

const STEPS = ["Template and upload", "Check rows", "Confirm"];

type ImportRow = [sector: string, type: string, tier: string, result: "ok" | "new" | "dup" | "noparent"];

const IMPORT_CATS: ImportRow[] = [
  ["Banking", "Commercial bank", "International", "ok"],
  ["Banking", "Commercial bank", "National", "ok"],
  ["Banking", "Commercial bank", "Regional", "ok"],
  ["Banking", "Merchant bank", "National", "ok"],
  ["Banking", "Microfinance bank", "National", "ok"],
  ["Banking", "Microfinance bank", "State", "ok"],
  ["Banking", "Microfinance bank", "Unit", "ok"],
  ["Banking", "Primary mortgage bank", "National", "new"],
  ["Banking", "Primary mortgage bank", "State", "new"],
  ["Banking", "Finance company", "", "new"],
  ["Banking", "Bureau de change", "", "new"],
  ["Payments", "Mobile money operator", "", "ok"],
  ["Payments", "Switching and processing", "", "ok"],
  ["Payments", "Payment solution service provider", "PSSP", "ok"],
  ["Insurance", "Life insurer", "", "new"],
  ["Insurance", "General insurer", "", "new"],
  ["Banking", "Commercial Bank", "International", "dup"],
  ["", "Development finance institution", "National", "noparent"],
];

export default function ImportCategoriesPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [fixes, setFixes] = useState<Record<string, "fix" | "skip">>({});

  const errs = IMPORT_CATS.filter((r) => (r[3] === "dup" || r[3] === "noparent") && !fixes[r[1]]).length;
  const newRows = IMPORT_CATS.filter((r) => r[3] === "new" || (r[3] === "noparent" && fixes[r[1]] === "fix"));

  function upload() {
    setStep(1);
    setTimeout(() => setStep(2), 1100);
  }
  function confirm() {
    const findSector = (name: string) => {
      let sec = CATEGORIES.find((c) => c.name === name);
      if (!sec) {
        sec = { id: `s${Date.now()}`, name, types: [], isNew: true };
        CATEGORIES.push(sec);
      }
      return sec;
    };
    let added = 0;
    IMPORT_CATS.forEach((r) => {
      const take = r[3] === "new" || (r[3] === "noparent" && fixes[r[1]] === "fix");
      if (!take) return;
      const sec = findSector(r[0] || "Banking");
      let t = sec.types.find((x) => x.name === r[1]);
      if (!t) {
        t = { id: `t${Date.now()}${added}`, name: r[1], count: 0, tiers: [], isNew: true };
        sec.types.push(t);
      }
      if (r[2] && !t.tiers.includes(r[2])) t.tiers.push(r[2]);
      added++;
    });
    toast(`Imported ${added} new categories`);
    router.push("/regulator/settings/categories");
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Categories", href: "/regulator/settings/categories" }, { label: "Import" }]}>
      <PageHead title="Import categories from a spreadsheet" sub="Add many sectors, institution types and tiers at once. Nothing changes until you confirm." />
      <div className="stepper">
        {STEPS.map((s, i) => {
          const cur = step === 0 ? 0 : step === 1 ? 1 : 2;
          return (
            <span key={s} className="row" style={{ gap: 8 }}>
              {i > 0 ? <span className="step-line" /> : null}
              <span className={`step ${i < cur ? "done" : i === cur ? "on" : ""}`}>
                <span className="n">{i < cur ? <Icon name="check" /> : i + 1}</span>
                {s}
              </span>
            </span>
          );
        })}
      </div>

      {step === 0 && (
        <div className="grid g2">
          <div className="card col gap16">
            <Tile icon="download-simple" size="lg" />
            <div className="h3">1. Download the template</div>
            <p className="muted small">One row per tier. Leave the tier blank if a type has none.</p>
            <div className="tbl-wrap" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
              <table className="tbl">
                <thead><tr><th>sector</th><th>institution_type</th><th>tier</th><th>code</th></tr></thead>
                <tbody>
                  <tr><td>Banking</td><td>Microfinance bank</td><td>State</td><td className="mono">MFB-S</td></tr>
                  <tr><td>Payments</td><td>Mobile money operator</td><td></td><td className="mono">MMO</td></tr>
                </tbody>
              </table>
            </div>
            <Button variant="secondary" icon="download-simple" onClick={() => toast("Template downloaded")}>Download template (.xlsx)</Button>
          </div>
          <div className="card col gap16">
            <Tile icon="upload-simple" size="lg" />
            <div className="h3">2. Upload your file</div>
            <p className="muted small">.xlsx or .csv, up to 2,000 rows. We check every row before anything changes.</p>
            <button className="drop" style={{ padding: 36 }} onClick={upload} data-test="imp-upload">
              <Tile icon="cloud-arrow-up" size="lg" />
              <b>Drop your spreadsheet here</b>
              <span className="cap muted">or click to choose a file</span>
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card col gap16" style={{ alignItems: "center", textAlign: "center", padding: 48 }}>
          <Icon name="circle-notch" className="spin" />
          <div className="h3">Checking categories.xlsx</div>
          <p className="muted small">Reading 18 rows and comparing them with your current categories.</p>
          <div className="bar" style={{ width: "min(360px, 100%)" }}><i style={{ width: "68%" }} /></div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="file">
            <Icon name="table" />
            <div className="grow">
              <div className="strong">categories.xlsx</div>
              <div className="cap muted">18 rows · uploaded just now</div>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => { setStep(0); setFixes({}); }}>Replace file</Button>
          </div>
          <div className="grid g4" style={{ gap: 16 }}>
            {([
              ["Rows read", 18, ""],
              ["Already exist", IMPORT_CATS.filter((r) => r[3] === "ok").length, "neu"],
              ["New", newRows.length, "ok"],
              ["Need fixing", errs, errs ? "warn" : "ok"],
            ] as [string, number, string][]).map(([l, n, t]) => (
              <div className="card tight" key={l}>
                <div className="cap muted">{l}</div>
                <div className="metric tnum" style={{ fontSize: 24, marginTop: 2, color: t === "warn" ? "var(--warn-solid)" : "var(--text)" }}>{n}</div>
              </div>
            ))}
          </div>
          {errs ? (
            <div className="alert warn">
              <Tile icon="warning" tone="solid warn" size="sm" />
              <div className="grow">
                <div className="t">{errs} row{errs > 1 ? "s" : ""} need your input</div>
                <div className="b">Fix or skip them. Rows that need fixing are not imported.</div>
              </div>
            </div>
          ) : (
            <div className="alert ok">
              <Tile icon="check-circle" tone="solid ok" size="sm" />
              <div className="grow">
                <div className="t">Every row is ready</div>
                <div className="b">{newRows.length} new categories will be added. Existing categories are not changed.</div>
              </div>
            </div>
          )}
          <div className="card p0">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Row</th><th>Sector</th><th>Institution type</th><th>Tier</th><th>Result</th></tr></thead>
                <tbody>
                  {IMPORT_CATS.map((r, i) => {
                    const fx = fixes[r[1]];
                    let res: React.ReactNode;
                    if (r[3] === "ok") res = <Chip tone="neu">Already exists</Chip>;
                    else if (r[3] === "new") res = <Chip tone="ok" icon="plus">New</Chip>;
                    else if (r[3] === "dup")
                      res = fx ? (
                        <Chip tone="neu">Skipped</Chip>
                      ) : (
                        <div className="row gap8">
                          <Chip tone="warn" icon="warning">Duplicate of &ldquo;Commercial bank&rdquo;</Chip>
                          <Button variant="outline" size="sm" data-test="fix-dup" onClick={() => setFixes((f) => ({ ...f, [r[1]]: "skip" }))}>Skip row</Button>
                        </div>
                      );
                    else
                      res =
                        fx === "fix" ? (
                          <Chip tone="ok" icon="plus">New · under Banking</Chip>
                        ) : fx === "skip" ? (
                          <Chip tone="neu">Skipped</Chip>
                        ) : (
                          <div className="row gap8">
                            <Chip tone="warn" icon="warning">Sector missing</Chip>
                            <Button variant="outline" size="sm" data-test="fix-parent" onClick={() => setFixes((f) => ({ ...f, [r[1]]: "fix" }))}>Put under Banking</Button>
                            <Button variant="tertiary" size="sm" onClick={() => setFixes((f) => ({ ...f, [r[1]]: "skip" }))}>Skip</Button>
                          </div>
                        );
                    return (
                      <tr key={i} style={(r[3] === "dup" || r[3] === "noparent") && !fx ? { background: "var(--warn-bg)" } : undefined}>
                        <td className="tnum muted">{i + 2}</td>
                        <td>{r[0] || <span className="muted">—</span>}</td>
                        <td>{r[1]}</td>
                        <td>{r[2] || <span className="muted">—</span>}</td>
                        <td>{res}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="row end">
            <Button variant="outline" onClick={() => router.push("/regulator/settings/categories")}>Cancel</Button>
            <Button disabled={errs > 0} onClick={confirm} testId="imp-confirm">Import {newRows.length} new categories</Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
