"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button, Chip, Field, Tabs } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { Popover, MenuItem } from "@/components/Popover";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { ROLES, PERMS } from "@/lib/mockData";
import { listMembers, changeRole, suspendMember, removeMember, type TeamMemberRow } from "@/server/actions/team";
import { inviteColleague, resendInvite, cancelInvite } from "@/server/actions/invitations";

type Tab = "people" | "roles";

export default function TeamPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("people");
  const [team, setTeam] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [roleEditFor, setRoleEditFor] = useState<number | null>(null);
  const [removeFor, setRemoveFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const menuAnchor = useRef<HTMLButtonElement | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Supervisor");
  const [editRole, setEditRole] = useState("");

  async function load() {
    const result = await listMembers();
    setLoading(false);
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    setTeam(result.data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time server fetch on mount, not a derived-state sync.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable for this page's lifetime; re-running it is triggered explicitly after each mutation instead.
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteEmail)) {
      toast("Enter a valid work email", "bad");
      return;
    }
    setBusy(true);
    const result = await inviteColleague({ email: inviteEmail, role: inviteRole });
    setBusy(false);
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    setInviteOpen(false);
    setInviteEmail("");
    toast(`Invitation sent to ${inviteEmail}`, "ok", "envelope-simple");
    load();
  }

  function openRoleEdit(i: number) {
    setMenuFor(null);
    setEditRole(team[i].role);
    setRoleEditFor(i);
  }
  async function saveRole() {
    if (roleEditFor === null) return;
    setBusy(true);
    const result = await changeRole({ membershipId: team[roleEditFor].id, role: editRole });
    setBusy(false);
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    setRoleEditFor(null);
    toast("Role updated");
    load();
  }

  async function resend(i: number) {
    setMenuFor(null);
    const result = await resendInvite({ invitationId: team[i].id });
    toast(result.ok ? "Invitation resent" : result.error.message, result.ok ? "ok" : "bad");
    if (result.ok) load();
  }
  async function cancelPending(i: number) {
    setMenuFor(null);
    const result = await cancelInvite({ invitationId: team[i].id });
    toast(result.ok ? "Invitation cancelled" : result.error.message, result.ok ? "ok" : "bad");
    if (result.ok) load();
  }

  async function confirmRemove() {
    if (removeFor === null) return;
    const p = team[removeFor];
    setBusy(true);
    const result = await removeMember({ membershipId: p.id });
    setBusy(false);
    setRemoveFor(null);
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    toast(`${p.name} removed`);
    load();
  }

  async function suspend(i: number) {
    setMenuFor(null);
    const p = team[i];
    const result = await suspendMember({ membershipId: p.id });
    toast(result.ok ? `${p.name} suspended` : result.error.message, result.ok ? "ok" : "bad");
    if (result.ok) load();
  }

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Team" }]}>
      <SettingsShell active="team">
        <PageHead
          title="Team"
          sub="Give each person a role. Invite a colleague, change their role, or remove their access."
          actions={<Button icon="user-plus" onClick={() => setInviteOpen(true)}>Invite staff</Button>}
        />
        <Tabs items={[{ id: "people", label: "People", count: team.length }, { id: "roles", label: "Roles and permissions" }]} active={tab} onChange={setTab} />

        {tab === "people" && !loading && (
          <div className="card p0">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {team.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <div className="row">
                          <span className="av">{p.name.slice(0, 2).toUpperCase()}</span>
                          <div>
                            <div className="strong">{p.name}</div>
                            <div className="cap muted">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Chip tone={p.role === "Admin" ? "brand" : "neu"}>{p.role}</Chip></td>
                      <td>
                        {p.status === "invited" ? (
                          <Chip tone="info" icon="envelope-simple">Invited</Chip>
                        ) : p.status === "suspended" ? (
                          <Chip tone="warn">Suspended</Chip>
                        ) : (
                          <Chip tone="ok">Active</Chip>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {p.isSelf ? (
                          <span className="cap muted">You</span>
                        ) : (
                          <button ref={menuFor === i ? menuAnchor : undefined} className="icon-btn" aria-label="More" onClick={() => setMenuFor(menuFor === i ? null : i)}>
                            <Icon name="dots-three" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "roles" && (
          <div className="card p0">
            <div className="grid g4" style={{ gap: 16, padding: 16 }}>
              {ROLES.map((r) => (
                <div key={r.name} className="card tight col gap8">
                  <b>{r.name}</b>
                  <p className="small muted">{r.desc}</p>
                </div>
              ))}
            </div>
            <div className="tbl-wrap">
              <table className="tbl perm">
                <thead><tr><th>Permission</th>{ROLES.map((r) => <th key={r.name}>{r.name}</th>)}</tr></thead>
                <tbody>
                  {PERMS.map(([name, ...vals]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      {vals.map((v, i) => (
                        <td key={i}>{v ? <span className="yes"><Icon name="check-circle" /></span> : <span className="no"><Icon name="minus" /></span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Popover open={menuFor !== null} onClose={() => setMenuFor(null)} anchorRef={menuAnchor}>
          {menuFor !== null ? (
            team[menuFor].kind === "invitation" ? (
              <>
                <MenuItem icon={<Icon name="envelope-simple" />} onClick={() => resend(menuFor)}>Resend invitation</MenuItem>
                <MenuItem icon={<Icon name="x" />} danger onClick={() => cancelPending(menuFor)}>Cancel invitation</MenuItem>
              </>
            ) : (
              <>
                <MenuItem icon={<Icon name="pencil-simple" />} onClick={() => openRoleEdit(menuFor)}>Change role</MenuItem>
                {team[menuFor].status === "active" ? <MenuItem icon={<Icon name="pause" />} onClick={() => suspend(menuFor)}>Suspend</MenuItem> : null}
                <MenuItem icon={<Icon name="trash" />} danger onClick={() => { setRemoveFor(menuFor); setMenuFor(null); }}>Remove access</MenuItem>
              </>
            )
          ) : null}
        </Popover>

        <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
          <div className="row"><Icon name="user-plus" /><h2 className="h3">Invite staff</h2></div>
          <p className="muted small">They get an email to accept and set a password.</p>
          <form className="col gap16" onSubmit={sendInvite}>
            <Field label="Work email" htmlFor="st-email">
              <input className="inp" id="st-email" type="email" placeholder="name@regulator.gov.ng" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </Field>
            <Field label="Role" htmlFor="st-role">
              <select className="sel" id="st-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {ROLES.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
            </Field>
            <div className="row end">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send invitation"}</Button>
            </div>
          </form>
        </Dialog>

        <Dialog open={roleEditFor !== null} onClose={() => setRoleEditFor(null)}>
          <div className="row"><Icon name="users" /><h2 className="h3">Change role</h2></div>
          {roleEditFor !== null ? <p className="muted small">{team[roleEditFor].name}</p> : null}
          <div className="col gap16">
            <Field label="Role" htmlFor="sr-role">
              <select className="sel" id="sr-role" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                {ROLES.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
            </Field>
            <div className="row end">
              <Button variant="outline" onClick={() => setRoleEditFor(null)}>Cancel</Button>
              <Button onClick={saveRole} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </Dialog>

        <Dialog open={removeFor !== null} onClose={() => setRemoveFor(null)}>
          <div className="row"><Icon name="warning" /><h2 className="h3">Remove {removeFor !== null ? team[removeFor].name : ""}?</h2></div>
          <p className="muted small">They lose access immediately. Their past actions stay in the audit trail.</p>
          <div className="row end">
            <Button variant="outline" onClick={() => setRemoveFor(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmRemove} disabled={busy}>{busy ? "Removing…" : "Remove access"}</Button>
          </div>
        </Dialog>
      </SettingsShell>
    </AppShell>
  );
}
