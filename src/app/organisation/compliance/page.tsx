"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CompChip, StatusChip, Tile } from "@/components/ui";
import { ComplianceHead } from "@/components/ComplianceHead";
import { Icon } from "@/lib/icons";
import { CASES, NC_OPEN, progOf, latestResult, prevResult, compStatus, pct } from "@/lib/cases";
import { mySeries, peerAvg } from "@/lib/enforcement";

const ORG_ID = "zenith";

function ProgressBar({ pct: p, label }: { pct: number; label: string }) {
  return (
    <div className="pbar">
      <div className="bar"><i style={{ width: `${p}%` }} /></div>
      <span className="cap tnum">{label}</span>
    </div>
  );
}

export default function OrgCompliancePage() {
  const router = useRouter();
  const sers = mySeries(ORG_ID);
  const live = CASES.filter((c) => c.org === ORG_ID && c.stage !== "Published" && !sers.some((sr) => sr.id === progOf(c.prog).series));

  return (
    <AppShell workspace="organisation">
      <ComplianceHead active="/organisation/compliance" />
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Programme</th><th>Latest result</th><th className="num">Score</th><th className="num">Change</th><th className="num">Category average</th><th>Status</th><th>Fixes left</th></tr></thead>
            <tbody>
              {sers.length ? (
                sers.map((sr) => {
                  const c = latestResult(ORG_ID, sr.id)!;
                  const pv = prevResult(ORG_ID, sr.id);
                  const pa = peerAvg(ORG_ID, c.prog);
                  const all = (c.findings || []).filter((f) => ["MaNC", "MiNC"].includes(f.cls));
                  const left = all.filter(NC_OPEN).length;
                  return (
                    <tr key={sr.id} className="click" onClick={() => router.push(`/organisation/compliance/${encodeURIComponent(sr.id)}`)} data-test={`mc-${sr.id}`}>
                      <td className="strong small">{sr.name}</td>
                      <td className="small">{progOf(c.prog).cycle} · published {c.published ?? ""}</td>
                      <td className="num tnum strong">{c.score}</td>
                      <td className="num tnum">{pv ? `${c.score! - pv.score! > 0 ? "+" : ""}${c.score! - pv.score!}` : "—"}</td>
                      <td className="num tnum">{pa.a ?? <span className="cap muted">Not shown</span>}</td>
                      <td><CompChip status={compStatus(c)} /></td>
                      <td style={{ width: 180 }}>{all.length ? <ProgressBar pct={pct(all.length - left, all.length)} label={`${left} left`} /> : <span className="cap muted">None</span>}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="shield-check" size="lg" /><div className="h4">No published results yet</div><p className="muted small">Your status appears when your first report is published.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">Category averages are anonymised and shown only when at least 5 organisations in your category have results.</div>
      </div>
      {live.length ? (
        <div className="card col gap8" style={{ marginTop: 16 }}>
          <div className="h4">In progress</div>
          {live.map((c) => (
            <div className="row small" key={c.id}>
              <Icon name="hourglass" />
              <span className="grow">{progOf(c.prog).name}</span>
              <StatusChip status={c.stage} />
            </div>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
