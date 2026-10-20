"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Button, Chip, Tile, Kv, Tabs, AlertBox } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { STATUS_TONE, CLASS_REQS, AUDIT, catLabel, type Organisation } from "@/lib/mockData";

function orgStatus(o: Organisation): string {
  if (o.status === "Verified" && CLASS_REQS.some((r) => r.org === o.id && r.status === "Pending")) return "Change requested";
  return o.status;
}

type Tab = "overview" | "verification" | "classification" | "invitations" | "people" | "licences" | "activity";

function statusNarrative(o: Organisation): string {
  switch (o.status) {
    case "Verified":
      return "Verified and in your register.";
    case "Invited":
      return `Invitation sent ${o.invite?.sent ?? ""}. Expires ${o.invite?.expires ?? ""}.`;
    case "Invite expired":
      return "The invitation expired before it was accepted.";
    case "Pending verification":
      return "Waiting for your verification.";
    case "Info requested":
      return "Waiting for the organisation to reply.";
    case "Rejected":
      return "Application rejected.";
    default:
      return "";
  }
}

export function OrganisationProfileClient({ org }: { org: Organisation }) {
  const toast = useToast();
  const params = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [note, setNote] = useState("");

  const status = orgStatus(org);
  const reqs = CLASS_REQS.filter((r) => r.org === org.id);
  const pending = reqs.find((r) => r.status === "Pending");
  const officers = org.officers ?? (org.officer && org.officer !== "—" ? [{ initials: org.officer.split(" ").map((w) => w[0]).join(""), name: org.officer, role: "Chief compliance officer", email: org.invite?.email ?? "" }] : []);
  const activity = AUDIT.filter((a) => a.record.includes(org.name.split(" ")[0]));

  const tabItems: { id: Tab; label: string; count?: number }[] = [{ id: "overview", label: "Overview" }];
  if (org.application) tabItems.push({ id: "verification", label: "Verification", count: status === "Pending verification" || status === "Info requested" ? 1 : undefined });
  tabItems.push(
    { id: "classification", label: "Classification", count: pending ? 1 : undefined },
    { id: "invitations", label: "Invitations" },
    { id: "people", label: "People" },
    { id: "licences", label: "Licences" },
    { id: "activity", label: "Activity" }
  );

  let actions = null;
  if (status === "Pending verification" || status === "Info requested") actions = <Button onClick={() => setTab("verification")}>Review application</Button>;
  else if (status === "Change requested") actions = <Button onClick={() => setTab("classification")}>Review change</Button>;
  else if (status === "Invited" || status === "Invite expired") actions = (
    <>
      <Button variant="outline" onClick={() => toast("Invitation revoked")}>Revoke</Button>
      <Button icon="envelope-simple" onClick={() => toast(`Invitation resent to ${org.invite?.email ?? ""}`, "ok", "envelope-simple")}>Resend invitation</Button>
    </>
  );
  else if (status === "Verified") actions = (
    <>
      <Button variant="outline" icon="chat-circle-dots" onClick={() => toast(`Message sent to ${org.officer}`)}>Message</Button>
      <Button variant="secondary" icon="git-diff" onClick={() => toast("Classification change flow is part of a later phase")}>Change category</Button>
    </>
  );

  return (
    <AppShell workspace="regulator">
      <Link href="/regulator/organisations" className="small strong">
        <Icon name="arrow-left" /> Organisations
      </Link>

      <ProfileHeader
        initials={org.initials}
        color={org.color}
        name={org.name}
        statusChip={<Chip tone={STATUS_TONE[status] ?? "neu"}>{status}</Chip>}
        metaLine={<span className="cls"><Icon name="buildings" /><b>{org.type || "Category to confirm"}</b>{org.tier ? <i>{org.tier}</i> : null}</span>}
        web={org.web}
        location={org.hq && org.hq !== "—" ? org.hq : undefined}
        group={org.group}
        actions={actions}
        tabs={<Tabs items={tabItems} active={tab} onChange={setTab} />}
      />

      {tab === "overview" && (
        <div className="grid side">
          <div className="col gap16">
            <div className="card col gap12">
              <div className="h4">Organisation details</div>
              <Kv
                pairs={[
                  ["Legal name", org.name],
                  ["Registration number", org.rc ?? org.application?.rc ?? "—"],
                  ["Website", org.web ?? "—"],
                  ["Head office", org.hq ?? "—"],
                  ["Compliance contact", org.email ?? org.invite?.email ?? "—"],
                  ["Joined", org.joined ?? "—"],
                ]}
              />
            </div>
            <div className="card col gap12">
              <div className="row">
                <span className="h4 grow">Classification</span>
                <Button variant="tertiary" size="sm" onClick={() => setTab("classification")}>Manage</Button>
              </div>
              <Kv
                pairs={[
                  ["Sector", org.sector ?? "—"],
                  ["Institution type", org.type || "To confirm"],
                  ["Authorisation tier", org.tier || "—"],
                  ["Tags", org.tags.join(" · ") || "—"],
                ]}
              />
            </div>
          </div>
          <div className="col gap16">
            <div className="card col gap12">
              <div className="h4">Status</div>
              <div className="mini-steps">
                {[
                  [org.selfReg ? "Registered" : "Invited", !!(org.invite?.email || org.selfReg)],
                  ["Joined", !["Invited", "Invite expired"].includes(org.status)],
                  ["Verified", org.status === "Verified"],
                ].map(([label, done]) => (
                  <div key={label as string} className={done ? "done" : ""}>
                    <span>{done ? <Icon name="check" /> : null}</span>
                    {label}
                  </div>
                ))}
              </div>
              <div className="small muted">{statusNarrative(org)}</div>
            </div>
            <div className="card col gap12">
              <div className="h4">Key officers</div>
              {officers.length ? (
                officers.map((p) => (
                  <div key={p.name} className="row">
                    <span className="av">{p.initials}</span>
                    <div>
                      <div className="strong small">{p.name}</div>
                      <div className="cap muted">{p.role}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="small muted">Added by the organisation after it joins.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "verification" && org.application && (
        <div className="grid side">
          <div className="col gap16">
            <div className="card col gap12">
              <div className="row">
                <span className="h4 grow">Application</span>
                <span className="cap muted">{org.application.route} · submitted {org.application.submitted}</span>
              </div>
              <Kv
                pairs={[
                  ["Category chosen", <span key="c" className="cls"><Icon name="buildings" /><b>{org.type}</b>{org.tier ? <i>{org.tier}</i> : null}</span>],
                  ["Sector", org.sector],
                  ["Registration number", org.application.rc],
                  ["Contact", org.application.contact],
                ]}
              />
              <div className="file">
                <Tile icon="file-text" size="sm" />
                <div className="grow">
                  <div className="strong" style={{ overflowWrap: "anywhere" }}>{org.application.licence}</div>
                  <div className="cap muted">Licence · PDF · integrity recorded</div>
                </div>
              </div>
            </div>
            <div className="card col gap12">
              <div className="h4">Automatic checks</div>
              {org.application.checks.map(([label, ok]) => (
                <div key={label} className="row small">
                  {ok ? <span className="yes"><Icon name="check-circle" /></span> : <span style={{ color: "var(--warn-icon)" }}><Icon name="warning" /></span>}
                  <span className="grow">{label}</span>
                  <Chip tone={ok ? "ok" : "warn"}>{ok ? "Passed" : "Check manually"}</Chip>
                </div>
              ))}
            </div>
          </div>
          <div className="col gap16">
            {status === "Pending verification" || status === "Info requested" ? (
              <div className="card col gap12">
                <div className="h4">Decision</div>
                {status === "Info requested" ? (
                  <div className="note"><Icon name="chat-circle-dots" />You asked: &ldquo;{org.infoMsg}&rdquo; The organisation has not replied yet.</div>
                ) : (
                  <p className="small muted">Approving adds the organisation to your register. It can then complete its profile and receive programmes.</p>
                )}
                <Button icon="seal-check" block onClick={() => toast(`${org.name} approved and verified`, "ok", "seal-check")}>Approve and verify</Button>
                <Button variant="secondary" block onClick={() => toast("Asked the organisation for more information")}>Ask for more information</Button>
                <Button variant="danger-soft" block onClick={() => toast(`${org.name} rejected`, "bad")}>Reject</Button>
              </div>
            ) : (
              <div className="card col gap8">
                {org.status === "Verified" ? (
                  <AlertBox tone="ok" title="Verified" body={`${org.name} is in your register.`} />
                ) : (
                  <AlertBox tone="bad" title="Rejected" body={org.rejectMsg ?? "The applicant was told why."} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "classification" && (
        <>
          {pending ? (
            <div className="card col gap16">
              <div className="row">
                <div className="grow">
                  <div className="overline">Request {pending.ref}</div>
                  <div className="h3">Category change requested</div>
                  <div className="cap muted">By {pending.by} · {pending.date}</div>
                </div>
                <Chip tone="warn" icon="clock">Waiting for you</Chip>
              </div>
              <div className="cmp">
                <div className="card col gap8">
                  <span className="overline">Current</span>
                  <span className="cls"><Icon name="buildings" /><b>{pending.from.type}</b><i>{pending.from.tier}</i></span>
                  <Kv pairs={[["Sector", pending.from.sector], ["Institution type", pending.from.type], ["Authorisation", pending.from.tier || "—"]]} />
                </div>
                <span className="tile" style={{ borderRadius: 999, background: "var(--surface)", boxShadow: "var(--e1)" }}><Icon name="arrow-right" /></span>
                <div className="card col gap8" style={{ boxShadow: "0 0 0 2px var(--brand-500),var(--e1)" }}>
                  <span className="overline" style={{ color: "var(--brand-500)" }}>Proposed</span>
                  <span className="cls"><Icon name="buildings" /><b>{pending.to.type}</b><i>{pending.to.tier}</i></span>
                  <Kv pairs={[["Sector", pending.to.sector], ["Institution type", pending.to.type], ["Authorisation", pending.to.tier || "—"]]} />
                </div>
              </div>
              <div className="grid g2" style={{ gap: 16 }}>
                <div className="col gap8">
                  <div className="h4">Reason given</div>
                  <p className="muted small">{pending.reason}</p>
                  <div className="file">
                    <Tile icon="file-text" size="sm" />
                    <div className="grow">
                      <div className="strong" style={{ overflowWrap: "anywhere" }}>{pending.file}</div>
                      <div className="cap muted">Licence evidence · integrity recorded</div>
                    </div>
                  </div>
                </div>
                {pending.impact ? <AlertBox tone="warn" title="If you approve" body={pending.impact} /> : null}
              </div>
              <div className="col gap12">
                <div className="field">
                  <label htmlFor="cc-note">Note to the organisation</label>
                  <textarea className="ta" id="cc-note" rows={2} placeholder="e.g. Approved. Effective from the next cycle." value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="hint">Required if you reject.</div>
                </div>
                <div className="row end">
                  <Button variant="secondary" onClick={() => toast(`${pending.ref} rejected`)}>Reject</Button>
                  <Button icon="seal-check" onClick={() => toast(`${pending.ref} approved`, "ok", "seal-check")}>Approve change</Button>
                </div>
              </div>
            </div>
          ) : null}
          <div className="grid side">
            <div className="card col gap12">
              <div className="row">
                <span className="h4 grow">Current category</span>
                {org.status === "Verified" ? <Button variant="outline" size="sm" icon="git-diff">Change category</Button> : null}
              </div>
              <Kv pairs={[["Sector", org.sector || "—"], ["Institution type", org.type || "To confirm"], ["Authorisation tier", org.tier || "—"]]} />
              <p className="cap muted"><Icon name="lock-simple" /> Only NITDA can change it. The organisation can ask through a classification request.</p>
            </div>
            <div className="card col gap12">
              <div className="h4">Request history</div>
              {reqs.filter((r) => r.status !== "Pending").length ? (
                reqs.filter((r) => r.status !== "Pending").map((r) => (
                  <div key={r.id} className="row top small">
                    <Tile icon={r.status === "Approved" ? "check-circle" : "x-circle"} tone={r.status === "Approved" ? "ok" : "bad"} size="sm" />
                    <div className="grow">
                      <b>{r.ref} · {r.status}</b>
                      <div className="cap muted">{catLabel(r.from.type, r.from.tier)} → {catLabel(r.to.type, r.to.tier)} · {r.decided ?? ""}</div>
                      {r.note ? <div className="cap" style={{ marginTop: 2 }}>{r.note}</div> : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="small muted">No decided requests.</p>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "invitations" && (
        <div className="grid side">
          <div className="card col gap12">
            <div className="h4">Invitation history</div>
            <div className="timeline">
              {org.invite?.history.length ? (
                org.invite.history.slice().reverse().map(([d, w, by]) => (
                  <div key={d + w} className="tl">
                    <Tile icon={/expired|revoked/i.test(w) ? "clock" : /accepted|verified/i.test(w) ? "check-circle" : "envelope-simple"} tone={/accepted|verified/i.test(w) ? "ok" : ""} size="sm" />
                    <div>
                      <b>{w}</b>
                      <div className="cap muted">{d} · {by}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="small muted">Registered without an invitation.</p>
              )}
            </div>
          </div>
          <div className="card col gap12">
            <div className="h4">Current invitation</div>
            {org.invite?.email ? (
              <>
                <Kv
                  pairs={[
                    ["Sent to", org.invite.email],
                    ["Status", <Chip key="s" tone={STATUS_TONE[status] ?? "neu"}>{status === "Verified" ? "Accepted" : status}</Chip>],
                    ["Sent", org.invite.sent ?? org.invite.history[0]?.[0] ?? "—"],
                    ["Expires", status === "Invited" ? org.invite.expires ?? "—" : "—"],
                  ]}
                />
                <div className="row wrap gap8">
                  <Button variant="outline" size="sm" icon="envelope-open">View email</Button>
                  {status === "Invited" || status === "Invite expired" ? <Button variant="secondary" size="sm" onClick={() => toast(`Invitation resent to ${org.invite?.email}`, "ok", "envelope-simple")}>Resend</Button> : null}
                  {status === "Invited" ? <Button variant="tertiary" size="sm" onClick={() => toast("Invitation revoked")}>Revoke</Button> : null}
                </div>
              </>
            ) : (
              <p className="small muted">No invitation. This organisation registered itself.</p>
            )}
          </div>
        </div>
      )}

      {tab === "people" && (
        <div className="card p0">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Role in SuperAtlas</th><th>Status</th></tr></thead>
              <tbody>
                {[...officers.map((p) => ({ name: p.name, email: p.email, role: p.role, status: "Active" })), ...(org.colleagues ?? []).map((c) => ({ name: c.name || c.email, email: c.email, role: c.role, status: c.status }))].map((p) => (
                  <tr key={p.email}>
                    <td>
                      <div className="row">
                        <span className="av">{p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                        <div>
                          <div className="strong">{p.name}</div>
                          <div className="cap muted">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.role}</td>
                    <td>{p.status === "Active" ? <Chip tone="ok">Active</Chip> : <Chip tone="info">Invited</Chip>}</td>
                  </tr>
                ))}
                {!officers.length && !(org.colleagues ?? []).length ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                        <Tile icon="users" size="lg" />
                        <div className="h4">No people yet</div>
                        <p className="muted small">People appear once the organisation accepts its invitation.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "licences" && (
        <div className="card col gap12">
          {org.status === "Invited" || org.status === "Invite expired" ? (
            <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
              <Tile icon="certificate" size="lg" />
              <div className="h4">No licences yet</div>
              <p className="muted small">The organisation uploads its licence when it accepts the invitation.</p>
            </div>
          ) : (
            <>
              <div className="file">
                <Tile icon="certificate" tone={org.status === "Verified" ? "ok" : ""} size="sm" />
                <div className="grow">
                  <div className="strong">{org.type || "Operating"} licence — {org.tier || "current"}.pdf</div>
                  <div className="cap muted">Issued Jan 2024 · expires Dec 2028 · {org.status === "Verified" ? "verified by NITDA" : "not yet verified"}</div>
                </div>
              </div>
              <div className="file">
                <Tile icon="file-text" size="sm" />
                <div className="grow">
                  <div className="strong">Certificate of incorporation.pdf</div>
                  <div className="cap muted">Uploaded at registration</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="card">
          <div className="timeline">
            {activity.length ? (
              activity.map((a, i) => (
                <div key={i} className="tl">
                  <span className="av">{a.initials}</span>
                  <div>
                    <b>{a.action}</b>
                    <div className="cap muted">{a.who} · {a.when}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
                <Tile icon="clock-counter-clockwise" size="lg" />
                <div className="h4">No activity yet</div>
                <p className="muted small">Actions on this organisation appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
