"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Button, Tile } from "@/components/ui";
import { myEnfCases, atOf, ENF_TONE } from "@/lib/enforcement";

export default function OrgActionsPage() {
  const router = useRouter();
  const cs = myEnfCases("zenith").sort((a, b) => (b.issued ?? "").localeCompare(a.issued ?? ""));

  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Regulatory actions" sub="Notices from NITDA and what they need from you. Respond by the deadline: accept with a fix plan, or contest with documents." />
      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Notice</th><th>Issued</th><th>Respond by</th><th>Status</th><th className="act-col" /></tr></thead>
            <tbody>
              {cs.length ? (
                cs.map((c) => (
                  <tr key={c.id} className="click" onClick={() => router.push(`/organisation/actions/${c.id}`)} data-test={`oa-${c.id}`}>
                    <td><div className="strong small">{atOf(c.type).name}</div><div className="cap mono muted">{c.ref}</div></td>
                    <td className="small">{c.issued}</td>
                    <td className="small">{c.respondBy || "—"}</td>
                    <td><Chip tone={ENF_TONE[c.status] ?? "neu"}>{c.status}</Chip></td>
                    <td className="act-col">{c.status === "Notice issued" ? <Button size="sm" onClick={() => router.push(`/organisation/actions/${c.id}`)}>Respond</Button> : null}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="gavel" size="lg" /><div className="h4">No regulatory actions</div><p className="muted small">Nothing here, and nothing needed.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
