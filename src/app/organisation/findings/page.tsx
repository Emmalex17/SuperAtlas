"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, AlertBox, Tile, Button } from "@/components/ui";
import { allFindings, effDue, fdOverdue, progOf, fcOf, FD_STATUS_CHIP, TODAY, type FindingWithCase } from "@/lib/cases";
import { FIRMS } from "@/lib/mockData";

const ORG_FD: [string, string, string, (x: FindingWithCase) => boolean][] = [
  ["plan", "To plan", "flag", (x) => x.f.status === "Open"],
  ["progress", "In progress", "wrench", (x) => x.f.status === "In progress"],
  ["firm", "With assessor", "seal-question", (x) => ["Fix submitted", "Verified fixed"].includes(x.f.status ?? "")],
  ["done", "Closed", "lock-simple", (x) => ["Closed", "Noted"].includes(x.f.status ?? "")],
];

export default function OrgFindingsPage() {
  const router = useRouter();
  const [fk, setFk] = useState("");
  const mine = allFindings().filter((x) => x.c.org === "zenith");
  const over = mine.filter((x) => fdOverdue(x.f, TODAY)).length;
  const rows = mine
    .filter((x) => (fk ? ORG_FD.find((c) => c[0] === fk)![3](x) : !["Closed", "Noted"].includes(x.f.status ?? "")))
    .sort((a, b) => Number(fdOverdue(b.f, TODAY)) - Number(fdOverdue(a.f, TODAY)) || (a.f.status === "Open" ? -1 : b.f.status === "Open" ? 1 : 0) || String(effDue(a.f)).localeCompare(String(effDue(b.f))));

  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Findings" sub="Gaps found in your published assessments. Plan each fix, send proof, and your assessor verifies it before NITDA closes it." />
      {over ? (
        <div style={{ marginBottom: 16 }}>
          <AlertBox tone="bad" title={`${over} fix${over > 1 ? "es are" : " is"} overdue`} body="Finish the fix, or ask for more time." />
        </div>
      ) : null}
      <div className="card p0">
        <div className="tbl-sub">
          <div className="pills">
            <button className={`pill ${!fk ? "on" : ""}`} onClick={() => setFk("")}>Open<span className="count">{mine.filter((x) => !["Closed", "Noted"].includes(x.f.status ?? "")).length}</span></button>
            {ORG_FD.map(([k, l, , fn]) => (
              <button key={k} className={`pill ${fk === k ? "on" : ""}`} onClick={() => setFk(k)} data-test={`ofc-${k}`}>{l}<span className="count">{mine.filter(fn).length}</span></button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Finding</th><th>From</th><th>Fix by</th><th>Status</th><th className="act-col" /></tr></thead>
            <tbody>
              {rows.length ? (
                rows.map((x) => {
                  const fm = FIRMS.find((y) => y.id === x.c.firm);
                  const fc = fcOf(x.f.cls);
                  return (
                    <tr key={x.f.id} className="click" onClick={() => router.push(`/organisation/findings/${x.f.id}`)}>
                      <td className="wrap" style={{ minWidth: 300, maxWidth: 420 }}>
                        <div className="row gap8 top"><span className={`chip ${fc.tone}`} title={fc.name}>{x.f.cls}</span><div><div className="strong small">{x.f.title}</div><div className="cap mono muted">{x.f.ref}</div></div></div>
                      </td>
                      <td className="small">{progOf(x.c.prog).name}<div className="cap muted">{fm?.name ?? ""}</div></td>
                      <td className="small">{effDue(x.f) || "No deadline"}</td>
                      <td><Chip tone={FD_STATUS_CHIP[x.f.status ?? ""]?.tone ?? "neu"} icon={FD_STATUS_CHIP[x.f.status ?? ""]?.icon}>{FD_STATUS_CHIP[x.f.status ?? ""]?.label ?? x.f.status}</Chip>{fdOverdue(x.f, TODAY) ? <Chip tone="bad">Overdue</Chip> : null}</td>
                      <td className="act-col" onClick={(e) => e.stopPropagation()}>
                        {x.f.status === "Open" ? <Button size="sm" onClick={() => router.push(`/organisation/findings/${x.f.id}`)}>Plan fix</Button> : x.f.status === "In progress" ? <Button variant="secondary" size="sm" onClick={() => router.push(`/organisation/findings/${x.f.id}`)}>Update</Button> : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="flag" size="lg" /><div className="h4">No findings here</div><p className="muted small">Findings appear when a report is published.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
