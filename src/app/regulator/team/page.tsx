"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Field, Tabs } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { Popover, MenuItem } from "@/components/Popover";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { getSession } from "@/lib/auth";
import { TEAM, ROLES, PERMS, type TeamMember } from "@/lib/mockData";

type Tab = "people" | "roles";

export default function TeamPage() {
  const toast = useToast();
  const session = getSession();
  const [tab, setTab] = useState<Tab>("people");
  const [team, setTeam] = useState<TeamMember[]>(TEAM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [roleEditFor, setRoleEditFor] = useState<number | null>(null);
  const [removeFor, setRemoveFor] = useState<number | null>(null);
  const menuAnchor = useRef<HTMLButtonElement | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Supervisor");

  const [editRole, setEditRole] = useState("");
  const [editPortfolio, setEditPortfolio] = useState("");

  function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteEmail)) {
      toast("Enter a valid work email", "bad");
      return;
    }
    const name = inviteName || inviteEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setTeam((prev) => [...prev, { name, initials: name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(), email: inviteEmail, role: inviteRole, portfolio: "All categories", status: "Invited", last: "—" }]);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteName("");
    toast(`Invitation sent to ${inviteEmail}`, "ok", "envelope-simple");
  }

  function openRoleEdit(i: number) {
    setMenuFor(null);
    setEditRole(team[i].role);
    setEditPortfolio(team[i].portfolio);
    setRoleEditFor(i);
  }
  function saveRole() {
    if (roleEditFor === null) return;
    setTeam((prev) => prev.map((p, i) => (i === roleEditFor ? { ...p, role: editRole, portfolio: editPortfolio } : p)));
    setRoleEditFor(null);
    toast("Role updated");
  }
  function confirmRemove() {
    if (removeFor === null) return;
    const p = team[removeFor];
    setTeam((prev) => prev.filter((_, i) => i !== removeFor));
    setRemoveFor(null);
    toast(`${p.name} removed`);
  }

  return (
    <AppShell workspace="regulator">
      <PageHead
        title="Team"
        sub="Give each person a role and a portfolio. A portfolio limits a supervisor or reviewer to the categories they look after."
        actions={<Button icon="user-plus" onClick={() => setInviteOpen(true)}>Invite staff</Button>}
      />
      <Tabs items={[{ id: "people", label: "People", count: team.length }, { id: "roles", label: "Roles and permissions" }]} active={tab} onChange={setTab} />

      {tab === "people" && (
        <div className="card p0">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Role</th><th>Portfolio</th><th>Status</th><th>Last active</th><th /></tr></thead>
              <tbody>
                {team.map((p, i) => (
                  <tr key={p.email}>
                    <td>
                      <div className="row">
                        <span className="av">{p.initials}</span>
                        <div>
                          <div className="strong">{p.name}</div>
                          <div className="cap muted">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Chip tone={p.role === "Admin" ? "brand" : "neu"}>{p.role}</Chip></td>
                    <td className="small">{p.portfolio}</td>
                    <td>{p.status === "Invited" ? <Chip tone="info" icon="envelope-simple">Invited</Chip> : <Chip tone="ok">Active</Chip>}</td>
                    <td className="small muted">{p.last}</td>
                    <td style={{ textAlign: "right" }}>
                      {p.name === session?.name ? (
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
        <>
          <div className="grid g4" style={{ gap: 16 }}>
            {ROLES.map((r) => (
              <div key={r.name} className="card tight col gap8">
                <b>{r.name}</b>
                <p className="small muted">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="card p0">
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
        </>
      )}

      <Popover open={menuFor !== null} onClose={() => setMenuFor(null)} anchorRef={menuAnchor}>
        {menuFor !== null ? (
          <>
            <MenuItem icon={<Icon name="pencil-simple" />} onClick={() => openRoleEdit(menuFor)}>Change role or portfolio</MenuItem>
            {team[menuFor].status === "Invited" ? <MenuItem icon={<Icon name="envelope-simple" />} onClick={() => { setMenuFor(null); toast("Invitation resent"); }}>Resend invitation</MenuItem> : null}
            <MenuItem icon={<Icon name="trash" />} danger onClick={() => { setRemoveFor(menuFor); setMenuFor(null); }}>Remove access</MenuItem>
          </>
        ) : null}
      </Popover>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="row"><Icon name="user-plus" /><h2 className="h3">Invite staff</h2></div>
        <p className="muted small">They get an email to set a password and MFA.</p>
        <form className="col gap16" onSubmit={sendInvite}>
          <Field label="Work email" htmlFor="st-email">
            <input className="inp" id="st-email" type="email" placeholder="name@regulator.gov.ng" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          </Field>
          <Field label="Full name" htmlFor="st-name">
            <input className="inp" id="st-name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="st-role">
            <select className="sel" id="st-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.name}>{r.name}</option>)}
            </select>
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit">Send invitation</Button>
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
          <Field label="Portfolio" htmlFor="sr-pf">
            <input className="inp" id="sr-pf" value={editPortfolio} onChange={(e) => setEditPortfolio(e.target.value)} />
          </Field>
          <div className="row end">
            <Button variant="outline" onClick={() => setRoleEditFor(null)}>Cancel</Button>
            <Button onClick={saveRole}>Save</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={removeFor !== null} onClose={() => setRemoveFor(null)}>
        <div className="row"><Icon name="warning" /><h2 className="h3">Remove {removeFor !== null ? team[removeFor].name : ""}?</h2></div>
        <p className="muted small">They lose access immediately. Their past actions stay in the audit trail.</p>
        <div className="row end">
          <Button variant="outline" onClick={() => setRemoveFor(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmRemove}>Remove access</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
