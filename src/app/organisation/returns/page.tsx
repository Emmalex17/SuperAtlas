"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tile, Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { myFilings, tplOf, retStatus, isFiled, ORG_RET_CARDS, RET_CHIP_TONE, TODAY, daysBetween, type Filing } from "@/lib/returns";

function dueLine(f: Filing): React.ReactNode {
  if (isFiled(f)) return <span className="cap muted">Filed {(f.filedAt || "").split(",")[0]}{f.lateBy ? ` · ${f.lateBy} day${f.lateBy > 1 ? "s" : ""} late` : ""}</span>;
  const n = daysBetween(TODAY, f.due);
  if (n < 0) return <span className="cap" style={{ color: "var(--bad-fg)" }}>{-n} day{n === -1 ? "" : "s"} overdue</span>;
  if (n === 0) return <span className="cap" style={{ color: "var(--warn-fg)" }}>Due today</span>;
  if (n <= 7) return <span className="cap" style={{ color: "var(--warn-fg)" }}>{n === 1 ? "Due tomorrow" : `Due in ${n} days`}</span>;
  return <span className="cap muted">Due in {n} days</span>;
}

function FilingsTable({ rows, heading, showPills, fk, setFk, all }: { rows: Filing[]; heading: string; showPills: boolean; fk: string; setFk: (k: string) => void; all: Filing[] }) {
  const router = useRouter();
  return (
    <div className="card p0">
      {showPills ? (
        <div className="tbl-sub">
          <div className="pills">
            <button className={`pill ${!fk ? "on" : ""}`} onClick={() => setFk("")}>All<span className="count">{all.length}</span></button>
            {ORG_RET_CARDS.map(([k, l, , fn]) => (
              <button key={k} className={`pill ${fk === k ? "on" : ""}`} onClick={() => setFk(k)} data-test={`orc-${k}`}>{l}<span className="count">{all.filter(fn).length}</span></button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="tbl-tools"><span className="h4 grow">{heading}</span><span className="count">{rows.length}</span></div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Return</th><th>Period</th><th>Due</th><th>Status</th><th className="act-col" /></tr></thead>
          <tbody>
            {rows.length ? (
              rows.map((f) => {
                const t = tplOf(f.tpl);
                const st = retStatus(f);
                const label = f.status === "Queried" ? "Respond" : isFiled(f) ? "View" : f.status === "Draft" ? "Continue" : "Start";
                return (
                  <tr key={f.id} className="click" onClick={() => router.push(`/organisation/returns/${f.id}`)} data-test={`oret-${f.id}`}>
                    <td><div className="row gap8"><Tile icon="table" tone={f.status === "Queried" ? "warn" : ""} size="sm" /><div><div className="strong">{t.name}</div><div className="cap muted">{t.freq} · {t.code}</div></div></div></td>
                    <td className="small">{f.period}</td>
                    <td className="small">{f.due}<div>{dueLine(f)}</div></td>
                    <td><Chip tone={RET_CHIP_TONE[st] ?? "neu"}>{st}</Chip></td>
                    <td className="act-col"><Button variant={f.status === "Queried" ? "primary" : isFiled(f) ? "tertiary" : daysBetween(TODAY, f.due) <= 7 ? "primary" : "secondary"} size="sm">{label}</Button></td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={5}><div className="col" style={{ alignItems: "center", padding: 24 }}><Icon name="check-circle" /><div className="h4">Nothing here</div><p className="muted small">You are up to date.</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrgReturnsPage() {
  const [fk, setFk] = useState("");
  const all = myFilings("zenith");
  const rows = all.filter((f) => !fk || ORG_RET_CARDS.find((c) => c[0] === fk)![3](f)).sort((a, b) => Number(isFiled(a)) - Number(isFiled(b)) || (a.status === "Queried" ? -1 : b.status === "Queried" ? 1 : 0) || a.due.localeCompare(b.due));
  const todo = rows.filter((f) => !isFiled(f) || f.status === "Queried");
  const done = rows.filter((f) => isFiled(f) && f.status !== "Queried");

  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Data returns" sub="Periodic figures you file straight to NITDA. Fill them in online or upload the template." />
      <div className="col gap16">
        {fk ? (
          <FilingsTable rows={rows} heading={ORG_RET_CARDS.find((c) => c[0] === fk)![1]} showPills fk={fk} setFk={setFk} all={all} />
        ) : (
          <>
            <FilingsTable rows={todo} heading="To do" showPills fk={fk} setFk={setFk} all={all} />
            <FilingsTable rows={done} heading="Filed" showPills={false} fk={fk} setFk={setFk} all={all} />
          </>
        )}
      </div>
    </AppShell>
  );
}
