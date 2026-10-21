"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnyWorkspaceShell } from "@/components/AnyWorkspaceShell";
import { PageHead, Button, Field, Tile, Chip } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { getSession } from "@/lib/auth";
import { pwRules } from "@/lib/authHelpers";
import { SESSIONS, DEFAULT_MFA_DEVICE, type Session } from "@/lib/mockData";

type Tab = "profile" | "security" | "notif" | "sessions";
const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notif", label: "Notifications" },
  { id: "sessions", label: "Sessions" },
];

const NOTIF_EVENTS: [string, boolean, boolean][] = [
  ["Approvals waiting for me", true, true],
  ["Mentions and comments", true, true],
  ["Deadlines and reminders", true, true],
  ["Status updates", true, false],
  ["Weekly summary", false, true],
];

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const session = getSession();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && TABS.some((t) => t.id === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
      setTab(requested as Tab);
    }
  }, []);
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [newCodesOpen, setNewCodesOpen] = useState(false);
  const [removeMfaOpen, setRemoveMfaOpen] = useState(false);
  const [newPw, setNewPw] = useState("");

  function killSession(i: number) {
    setSessions((prev) => prev.filter((_, idx) => idx !== i));
  }
  function killAll() {
    setSessions((prev) => prev.filter((s) => s.current));
    toast("Signed out of all other devices");
  }
  function submitChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!pwRules(newPw).ok) {
      toast("The new password does not meet the rules", "bad");
      return;
    }
    setChangePwOpen(false);
    setNewPw("");
    toast("Password changed");
  }

  if (!session) return null;

  return (
    <AnyWorkspaceShell>
      <PageHead over="Account" title="My account" />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "sessions" ? <span className="count">{sessions.length}</span> : null}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card col gap20">
          <div className="row">
            <span className="av s40">{session.initials}</span>
            <div className="grow">
              <div className="h4">{session.name}</div>
              <div className="muted small">{session.email}</div>
            </div>
            <Button variant="outline" size="sm" icon="upload-simple" onClick={() => toast("Profile photo updated")}>Change photo</Button>
          </div>
          <form
            className="grid g2"
            style={{ gap: 16 }}
            onSubmit={(e) => {
              e.preventDefault();
              toast("Profile saved");
            }}
          >
            <Field label="Full name" htmlFor="pf-name">
              <input className="inp" id="pf-name" defaultValue={session.name} />
            </Field>
            <Field label="Job title" htmlFor="pf-role">
              <input className="inp" id="pf-role" defaultValue={session.role} />
            </Field>
            <Field label="Email" hint="Your workspace admin can change your email." htmlFor="pf-email">
              <input className="inp" id="pf-email" defaultValue={session.email} readOnly />
            </Field>
            <Field label="Phone" optional htmlFor="pf-phone">
              <input className="inp" id="pf-phone" defaultValue="+234 803 000 0000" />
            </Field>
            <div className="row end" style={{ gridColumn: "1/-1" }}>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </div>
      )}

      {tab === "security" && (
        <>
          <div className="card col gap16">
            <div className="h4">Password</div>
            <p className="muted small">Last changed 3 months ago.</p>
            <div>
              <Button variant="secondary" onClick={() => setChangePwOpen(true)}>Change password</Button>
            </div>
          </div>
          <div className="card col gap16">
            <div className="row">
              <div className="grow">
                <div className="h4">Multi-factor authentication</div>
                <p className="muted small">Required by your workspace. You cannot turn it off.</p>
              </div>
              <Chip tone="ok" icon="shield-check">On</Chip>
            </div>
            <div className="file">
              <Tile icon="fingerprint" size="sm" />
              <div className="grow">
                <div className="strong">{DEFAULT_MFA_DEVICE.name}</div>
                <div className="cap muted">Added {DEFAULT_MFA_DEVICE.added} · last used {DEFAULT_MFA_DEVICE.last}</div>
              </div>
              <Button variant="tertiary" size="sm" onClick={() => setRemoveMfaOpen(true)}>Remove</Button>
            </div>
            <div className="row">
              <Button variant="outline" icon="plus" onClick={() => router.push("/mfa-setup")}>Add another device</Button>
              <Button variant="tertiary" icon="key" onClick={() => setNewCodesOpen(true)}>New recovery codes</Button>
            </div>
          </div>
        </>
      )}

      {tab === "notif" && (
        <>
          <div className="card p0">
            <div className="tbl-wrap">
              <table className="tbl perm">
                <thead>
                  <tr><th>Event</th><th>In the app</th><th>Email</th></tr>
                </thead>
                <tbody>
                  {NOTIF_EVENTS.map(([name, inApp, email]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td><label className="switch"><input type="checkbox" defaultChecked={inApp} /><span /></label></td>
                      <td><label className="switch"><input type="checkbox" defaultChecked={email} /><span /></label></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card col gap16" style={{ maxWidth: 520 }}>
            <Field label="Email digest" htmlFor="dig">
              <select className="sel" id="dig" defaultValue="Daily at 08:00">
                <option>Off</option>
                <option>Daily at 08:00</option>
                <option>Weekly on Monday</option>
              </select>
            </Field>
            <div className="row end">
              <Button onClick={() => toast("Notification preferences saved")}>Save preferences</Button>
            </div>
          </div>
        </>
      )}

      {tab === "sessions" && (
        <>
          <div className="card p0">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Device</th><th>Location</th><th>Last active</th><th></th></tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={s.device + i}>
                      <td>
                        <div className="row gap8">
                          <Icon name={s.device.includes("iPhone") ? "phone" : "cpu"} />
                          {s.device}
                        </div>
                      </td>
                      <td>{s.where}</td>
                      <td>{s.current ? <Chip tone="ok">This device</Chip> : s.when}</td>
                      <td style={{ textAlign: "right" }}>
                        {s.current ? null : <Button variant="tertiary" size="sm" onClick={() => killSession(i)}>Sign out</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <Button variant="danger-soft" icon="sign-out" onClick={killAll}>Sign out of all other devices</Button>
          </div>
        </>
      )}

      <Dialog open={changePwOpen} onClose={() => setChangePwOpen(false)}>
        <div className="row top">
          <div className="grow">
            <div className="row"><Tile icon="lock-simple" size="sm" /><h2 className="h3">Change password</h2></div>
            <p className="muted small" style={{ marginTop: 6 }}>You will stay signed in on this device.</p>
          </div>
        </div>
        <form className="col gap16" onSubmit={submitChangePw}>
          <Field label="Current password" htmlFor="cp0">
            <input className="inp" type="password" id="cp0" />
          </Field>
          <Field label="New password" hint="At least 12 characters with upper and lower case, a number and a symbol." htmlFor="cp1">
            <input className="inp" type="password" id="cp1" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setChangePwOpen(false)}>Cancel</Button>
            <Button type="submit">Change password</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={removeMfaOpen} onClose={() => setRemoveMfaOpen(false)}>
        <div className="row">
          <Tile icon="warning" tone="warn" size="sm" />
          <h2 className="h3">You need at least one device</h2>
        </div>
        <p className="muted small">MFA is required by your workspace. Add a new device before removing this one.</p>
        <div className="row end">
          <Button onClick={() => router.push("/mfa-setup")}>Add a device</Button>
        </div>
      </Dialog>

      <Dialog open={newCodesOpen} onClose={() => setNewCodesOpen(false)}>
        <div className="row">
          <Tile icon="key" size="sm" />
          <h2 className="h3">Create new recovery codes?</h2>
        </div>
        <p className="muted small">Your old codes will stop working immediately.</p>
        <div className="row end">
          <Button variant="outline" onClick={() => setNewCodesOpen(false)}>Cancel</Button>
          <Button onClick={() => router.push("/mfa-setup")}>Create new codes</Button>
        </div>
      </Dialog>
    </AnyWorkspaceShell>
  );
}
