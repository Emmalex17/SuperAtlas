"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHead, Chip, Tabs, Tile, Button, AlertBox, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { TODAY } from "@/lib/cases";
import { watchlist, enfOpenFor, ENF_CASES, OPEN_ENF, ENF_TONE, atOf, naira, dismissFromWatchlist, addToWatchlist, openEnfCase, COMPLIANCE_WATCH_OFF } from "@/lib/enforcement";
import { ORGANISATIONS, catLabel } from "@/lib/mockData";

type Tab = "watch" | "cases";

const RULE_ICON: Record<string, string> = { overdue: "warning", cycles: "chart-line-down", returns: "table", manual: "user" };

export default function EnforcementPage() {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("watch");
  const [enfF, setEnfF] = useState<"open" | "closed" | "all">("open");
  const [dismissOrg, setDismissOrg] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addOrg, setAddOrg] = useState("");
  const [addReason, setAddReason] = useState("");

  const wl = watchlist();
  const cs = ENF_CASES;
  const openN = cs.filter((c) => OPEN_ENF.includes(c.status)).length;

  function doDismiss() {
    if (!dismissOrg || !dismissReason) {
      toast("Give a reason", "bad", "warning");
      return;
    }
    dismissFromWatchlist(dismissOrg, dismissReason, "M. Bello", TODAY);
    setDismissOrg(null);
    setDismissReason("");
    bump();
    toast("Dismissed. The reason is kept in the audit trail.");
  }

  function doAdd() {
    if (!addOrg || !addReason) {
      toast("Give a reason", "bad", "warning");
      return;
    }
    addToWatchlist(addOrg, addReason, "M. Bello", TODAY);
    setAddOpen(false);
    setAddReason("");
    bump();
    toast(`${ORGANISATIONS.find((o) => o.id === addOrg)?.name} added to the watchlist`);
  }

  function openCaseFromWatch(org: string) {
    const c = openEnfCase(org, "advisory", "", "", "M. Bello", [], TODAY, "M. Bello");
    bump();
    router.push(`/regulator/enforcement/${c.id}`);
  }

  const verifiedOrgs = ORGANISATIONS.filter((o) => o.status === "Verified").sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Enforcement" sub="Organisations flagged by your rules, and the action you take: notices, responses, decisions and penalties." actions={<Button icon="plus" onClick={() => setAddOpen(true)} testId="enf-new">Open a case</Button>} />
      <Tabs items={[{ id: "watch", label: "Watchlist", count: wl.length }, { id: "cases", label: "Cases", count: openN }]} active={tab} onChange={setTab} />

      {tab === "watch" ? (
        <>
          {COMPLIANCE_WATCH_OFF() ? (
            <div style={{ margin: "16px 0" }}>
              <AlertBox tone="info" title="The overdue-fix rule is off" body="Set how many days a major nonconformity can be overdue before an organisation is flagged." />
            </div>
          ) : null}
          <div className="card p0">
            <div className="tbl-tools">
              <div className="grow">
                <div className="h4">Watchlist</div>
                <div className="cap muted">Flagged by the compliance rules, or added by your team. Open a case, or dismiss with a reason.</div>
              </div>
              <Button variant="secondary" size="sm" icon="plus" onClick={() => setAddOpen(true)} testId="watch-add">Add an organisation</Button>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Organisation</th><th>Why it is flagged</th><th>Case</th><th className="act-col" /></tr></thead>
                <tbody>
                  {wl.length ? (
                    wl.map((w) => {
                      const o = ORGANISATIONS.find((x) => x.id === w.org);
                      const oc = enfOpenFor(w.org);
                      return (
                        <tr key={w.org} data-test={`watch-${w.org}`}>
                          <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                          <td className="wrap" style={{ maxWidth: 520 }}>
                            <ul className="why">
                              {w.reasons.map((r, i) => (
                                <li key={i}><Icon name={RULE_ICON[r.rule] ?? "dot"} /><span>{r.text}</span></li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            {oc ? (
                              <>
                                <a href={`/regulator/enforcement/${oc.id}`} className="small strong">{oc.ref}</a>
                                <div><Chip tone={ENF_TONE[oc.status] ?? "neu"}>{oc.status}</Chip></div>
                              </>
                            ) : (
                              <span className="cap muted">None open</span>
                            )}
                          </td>
                          <td className="act-col">
                            <div className="row end gap4">
                              {!oc ? <Button size="sm" onClick={() => openCaseFromWatch(w.org)} testId={`enf-new-${w.org}`}>Open a case</Button> : null}
                              <Button variant="tertiary" size="sm" onClick={() => setDismissOrg(w.org)} testId={`dismiss-${w.org}`}>Dismiss</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={4}><div className="col" style={{ alignItems: "center", padding: 40 }}><Tile icon="eye" size="lg" /><div className="h4">Nobody is flagged</div><p className="muted small">Organisations appear here when they meet a compliance rule.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="tbl-foot">{wl.length} organisation{wl.length === 1 ? "" : "s"} flagged</div>
          </div>
        </>
      ) : (
        <div className="card p0">
          <div className="tbl-sub">
            <div className="pills">
              {([["open", "Open"], ["closed", "Closed"], ["all", "All"]] as const).map(([k, l]) => (
                <button key={k} className={`pill ${enfF === k ? "on" : ""}`} onClick={() => setEnfF(k)} data-test={`ef-${k}`}>{l}<span className="count">{k === "open" ? cs.filter((c) => OPEN_ENF.includes(c.status)).length : k === "closed" ? cs.filter((c) => !OPEN_ENF.includes(c.status)).length : cs.length}</span></button>
              ))}
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Case</th><th>Organisation</th><th>Action</th><th>Opened</th><th>Respond by</th><th>Status</th></tr></thead>
              <tbody>
                {cs.filter((c) => (enfF === "open" ? OPEN_ENF.includes(c.status) : enfF === "closed" ? !OPEN_ENF.includes(c.status) : true)).sort((a, b) => b.opened.localeCompare(a.opened)).map((c) => {
                  const o = ORGANISATIONS.find((x) => x.id === c.org);
                  const late = c.status === "Notice issued" && c.respondBy && c.respondBy < TODAY;
                  return (
                    <tr key={c.id} className="click" onClick={() => router.push(`/regulator/enforcement/${c.id}`)} data-test={`case-${c.id}`}>
                      <td className="mono small">{c.ref}</td>
                      <td><div className="org"><span className="logo s32" style={{ background: o?.color }}>{o?.initials}</span><div><div className="nm">{o?.name}</div><div className="sub">{o ? catLabel(o.type, o.tier) : ""}</div></div></div></td>
                      <td className="small">{atOf(c.type).name}{c.penalty ? <div className="cap muted">{naira(c.penalty.amount)}</div> : null}</td>
                      <td className="small">{c.opened}</td>
                      <td className="small">{c.respondBy || "—"}{late ? <div className="cap" style={{ color: "var(--bad-fg)" }}>No response yet</div> : null}</td>
                      <td><Chip tone={ENF_TONE[c.status] ?? "neu"}>{c.status}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dismissOrg !== null} onClose={() => setDismissOrg(null)}>
        <div className="row"><Icon name="eye-slash" /><h2 className="h3">Dismiss from the watchlist</h2></div>
        <p className="muted small">{ORGANISATIONS.find((o) => o.id === dismissOrg)?.name} stays off the list until a new reason flags it again.</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Reason" htmlFor="wd-r"><textarea className="ta" id="wd-r" rows={3} placeholder="Why no action is needed now" value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} data-test="wd-r" /></Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setDismissOrg(null)}>Cancel</Button>
          <Button onClick={doDismiss} testId="wd-go">Dismiss</Button>
        </div>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <div className="row"><Icon name="eye" /><h2 className="h3">Add an organisation to the watchlist</h2></div>
        <p className="muted small">For concerns the rules do not catch, such as a complaint or a news report.</p>
        <div className="col gap12" style={{ marginTop: 16 }}>
          <Field label="Organisation" htmlFor="wa-org">
            <select className="sel" id="wa-org" value={addOrg} onChange={(e) => setAddOrg(e.target.value)} data-test="wa-org">
              <option value="">Choose an organisation</option>
              {verifiedOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <Field label="Reason" htmlFor="wa-r"><textarea className="ta" id="wa-r" rows={3} placeholder="What is the concern?" value={addReason} onChange={(e) => setAddReason(e.target.value)} data-test="wa-r" /></Field>
        </div>
        <div className="row end" style={{ marginTop: 20 }}>
          <Button variant="tertiary" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={doAdd} testId="wa-go">Add</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
