"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { inviteColleague, ORGANISATIONS } from "@/lib/mockData";

const ORG_ID = "zenith";

const ROLE_CARDS: [string, string][] = [
  ["Organisation admin", "Manages profile, team and settings"],
  ["Compliance officer", "Approves and submits answers and returns"],
  ["Contributor", "Answers requirements assigned to them"],
  ["Executive viewer", "Read-only view of status and results"],
];

export default function OrgTeamPage() {
  const toast = useToast();
  const org = ORGANISATIONS.find((o) => o.id === ORG_ID)!;
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Contributor");

  const rows = [
    ...(org.officers ?? []).map((p) => ({ name: p.name, email: p.email, role: "Organisation admin", title: p.role, status: "Active" })),
    ...(org.colleagues ?? []).map((c) => ({ name: c.name || c.email, email: c.email, role: c.role, title: "", status: c.status || "Invited" })),
  ];

  function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast("Enter a valid email", "bad");
      return;
    }
    inviteColleague(org, email, role);
    setInviteOpen(false);
    setEmail("");
    bump();
    toast(`Invitation sent to ${email}`, "ok", "envelope-simple");
  }

  return (
    <AppShell workspace="organisation">
      <PageHead title="Team" sub={`People in ${org.name} who use SuperAtlas, and what each can do.`} actions={<Button icon="user-plus" testId="org-invite" onClick={() => setInviteOpen(true)}>Invite colleague</Button>} />

      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email}>
                  <td>
                    <div className="row">
                      <span className="av">{r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                      <div>
                        <div className="strong">{r.name}</div>
                        <div className="cap muted">{r.email}{r.title ? ` · ${r.title}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td><Chip tone={r.role === "Organisation admin" ? "brand" : "neu"}>{r.role}</Chip></td>
                  <td>{r.status === "Active" ? <Chip tone="ok">Active</Chip> : <Chip tone="info" icon="envelope-simple">Invited</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid g4" style={{ gap: 12 }}>
        {ROLE_CARDS.map(([n, d]) => (
          <div key={n} className="card tight col gap4">
            <b className="small">{n}</b>
            <span className="cap muted">{d}</span>
          </div>
        ))}
      </div>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="row"><h2 className="h3">Invite a colleague</h2></div>
        <p className="muted small">They get an email to set a password and MFA.</p>
        <form className="col gap16" onSubmit={submitInvite}>
          <Field label="Work email" htmlFor="oi-email">
            <input className="inp" id="oi-email" type="email" placeholder={`name@${org.web ?? "organisation.com"}`} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="oi-role">
            <select className="sel" id="oi-role" value={role} onChange={(e) => setRole(e.target.value)}>
              {["Contributor", "Compliance officer", "Executive viewer", "Organisation admin"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit">Send invitation</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
