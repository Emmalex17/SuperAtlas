"use client";

import { useReducer, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Chip, Field } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { getSession } from "@/lib/auth";
import { addFirmPerson, removeFirmPerson, FIRMS } from "@/lib/mockData";

const FIRM_ID = "deloitte";

export default function FirmTeamPage() {
  const toast = useToast();
  const session = getSession();
  const firm = FIRMS.find((f) => f.id === FIRM_ID)!;
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Assessor" | "Lead auditor">("Assessor");
  const [title, setTitle] = useState("");
  const [cred, setCred] = useState("");
  const [expires, setExpires] = useState("");

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast("Add a name and a valid email", "bad");
      return;
    }
    addFirmPerson(firm, { name, role, title, cred, expires });
    setAddOpen(false);
    setName("");
    setEmail("");
    setTitle("");
    setCred("");
    setExpires("");
    bump();
    toast(`${name} added`);
  }

  function removePerson(i: number) {
    removeFirmPerson(firm, i);
    bump();
  }

  return (
    <AppShell workspace="firm">
      <PageHead title="Team" sub={`Your lead auditor and assessors. NITDA checks credentials when you apply for accreditation.`} actions={<Button icon="user-plus" testId="firm-person" onClick={() => setAddOpen(true)}>Add person</Button>} />

      <div className="card p0">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Credential expiry</th><th>Status</th><th /></tr></thead>
            <tbody>
              {(firm.people ?? []).map((p, i) => (
                <tr key={`${p.name}-${i}`}>
                  <td>
                    <div className="row">
                      <span className="av">{p.initials}</span>
                      <div>
                        <div className="strong">{p.name}</div>
                        <div className="cap muted">{p.title}</div>
                      </div>
                    </div>
                  </td>
                  <td><Chip tone={p.role === "Lead auditor" ? "brand" : "neu"}>{p.role}</Chip></td>
                  <td className="small">{p.cred}</td>
                  <td className="small muted">{p.expires}</td>
                  <td>{p.status === "Active" ? <Chip tone="ok">Active</Chip> : <Chip tone="warn">{p.status}</Chip>}</td>
                  <td className="act-col">
                    {p.name === session?.name ? (
                      <span className="cap muted">You</span>
                    ) : (
                      <button className="icon-btn" aria-label="Remove" onClick={() => removePerson(i)}>
                        <Icon name="trash" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} wide>
        <div className="row"><h2 className="h3">Add a person</h2></div>
        <p className="muted small">They get an email to join your firm on SuperAtlas.</p>
        <form className="col gap16" onSubmit={submitAdd}>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="Full name" htmlFor="fp-name">
              <input className="inp" id="fp-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="fp-email">
              <input className="inp" id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role" htmlFor="fp-role">
              <select className="sel" id="fp-role" value={role} onChange={(e) => setRole(e.target.value as "Assessor" | "Lead auditor")}>
                <option>Assessor</option>
                <option>Lead auditor</option>
              </select>
            </Field>
            <Field label="Job title" htmlFor="fp-title" optional>
              <input className="inp" id="fp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Credentials" htmlFor="fp-cred">
              <input className="inp" id="fp-cred" placeholder="e.g. CISA, CIPP/E" value={cred} onChange={(e) => setCred(e.target.value)} />
            </Field>
            <Field label="Credential expiry" htmlFor="fp-exp">
              <input className="inp" id="fp-exp" placeholder="e.g. Mar 2028" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </Field>
          </div>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit">Add person</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
