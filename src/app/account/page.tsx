"use client";

import { useEffect, useState } from "react";
import { AnyWorkspaceShell } from "@/components/AnyWorkspaceShell";
import { PageHead, Button, Field, Tile, Chip } from "@/components/ui";
import { Dialog } from "@/components/Overlay";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { getSession, ACCOUNTS } from "@/lib/auth";
import { pwRules } from "@/lib/authHelpers";
import { SESSIONS, type Session } from "@/lib/mockData";
import { updateProfile, changePassword, changeEmail, updateNotificationPrefs, signOutOtherSessions } from "@/server/actions/auth";

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
  const toast = useToast();
  const session = getSession();
  const isDemo = session ? session.email in ACCOUNTS : false;
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
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [fullName, setFullName] = useState(session?.name ?? "");
  const [jobTitle, setJobTitle] = useState(session?.role ?? "");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean | string>>({});
  const [notifSaving, setNotifSaving] = useState(false);

  function killSession(i: number) {
    setSessions((prev) => prev.filter((_, idx) => idx !== i));
  }
  async function killAll() {
    const result = await signOutOtherSessions();
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    setSessions((prev) => prev.filter((s) => s.current));
    toast("Signed out of all other devices");
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    const result = await updateProfile({ fullName, jobTitle, phone });
    setProfileSaving(false);
    toast(result.ok ? "Profile saved" : result.error.message, result.ok ? "ok" : "bad");
  }

  async function submitChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!pwRules(newPw).ok) {
      toast("The new password does not meet the rules", "bad");
      return;
    }
    setPwSaving(true);
    const result = await changePassword({ currentPassword: curPw, newPassword: newPw });
    setPwSaving(false);
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    setChangePwOpen(false);
    setCurPw("");
    setNewPw("");
    toast("Password changed");
  }

  async function submitChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    const result = await changeEmail({ newEmail });
    setEmailSaving(false);
    if (!result.ok) {
      toast(result.error.message, "bad");
      return;
    }
    setChangeEmailOpen(false);
    setNewEmail("");
    toast("Check both your old and new email to confirm the change");
  }

  async function saveNotifPrefs() {
    setNotifSaving(true);
    const result = await updateNotificationPrefs({ prefs: notifPrefs });
    setNotifSaving(false);
    toast(result.ok ? "Notification preferences saved" : result.error.message, result.ok ? "ok" : "bad");
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
          </div>
          <form className="grid g2" style={{ gap: 16 }} onSubmit={submitProfile}>
            <Field label="Full name" htmlFor="pf-name">
              <input className="inp" id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Job title" htmlFor="pf-role">
              <input className="inp" id="pf-role" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </Field>
            <Field label="Email" hint={isDemo ? "Demo account: email and password are fixed." : "Changing this sends a code to both your old and new address."} htmlFor="pf-email">
              <div className="row gap8">
                <input className="inp" id="pf-email" value={session.email} readOnly style={{ flex: 1 }} />
                {!isDemo ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setChangeEmailOpen(true)}>Change</Button>
                ) : null}
              </div>
            </Field>
            <Field label="Phone" optional htmlFor="pf-phone">
              <input className="inp" id="pf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <div className="row end" style={{ gridColumn: "1/-1" }}>
              <Button type="submit" disabled={profileSaving}>{profileSaving ? "Saving…" : "Save changes"}</Button>
            </div>
          </form>
        </div>
      )}

      {tab === "security" && (
        <>
          <div className="card col gap16">
            <div className="h4">Password</div>
            {isDemo ? (
              <p className="muted small">Demo account: email and password are fixed.</p>
            ) : (
              <>
                <p className="muted small">Change it any time. You will stay signed in on this device; other devices are signed out.</p>
                <div>
                  <Button variant="secondary" onClick={() => setChangePwOpen(true)}>Change password</Button>
                </div>
              </>
            )}
          </div>
          <div className="card col gap16">
            <div className="row">
              <div className="grow">
                <div className="h4">Sign-in verification</div>
                <p className="muted small">
                  {isDemo
                    ? "Demo accounts sign in with the password alone, with no email code."
                    : "A 6-digit code is emailed to you every time you sign in. This cannot be turned off."}
                </p>
              </div>
              <Chip tone="ok" icon="shield-check">{isDemo ? "Password only" : "Email code"}</Chip>
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
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            defaultChecked={inApp}
                            onChange={(e) => setNotifPrefs((p) => ({ ...p, [`${name}.inApp`]: e.target.checked }))}
                          />
                          <span />
                        </label>
                      </td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            defaultChecked={email}
                            onChange={(e) => setNotifPrefs((p) => ({ ...p, [`${name}.email`]: e.target.checked }))}
                          />
                          <span />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card col gap16" style={{ maxWidth: 520 }}>
            <Field label="Email digest" htmlFor="dig">
              <select className="sel" id="dig" defaultValue="Daily at 08:00" onChange={(e) => setNotifPrefs((p) => ({ ...p, digest: e.target.value }))}>
                <option>Off</option>
                <option>Daily at 08:00</option>
                <option>Weekly on Monday</option>
              </select>
            </Field>
            <div className="row end">
              <Button disabled={notifSaving} onClick={saveNotifPrefs}>{notifSaving ? "Saving…" : "Save preferences"}</Button>
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
            <input className="inp" type="password" id="cp0" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
          </Field>
          <Field label="New password" hint="At least 12 characters with upper and lower case, a number and a symbol." htmlFor="cp1">
            <input className="inp" type="password" id="cp1" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setChangePwOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pwSaving}>{pwSaving ? "Changing…" : "Change password"}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={changeEmailOpen} onClose={() => setChangeEmailOpen(false)}>
        <div className="row"><Tile icon="envelope-simple" size="sm" /><h2 className="h3">Change email</h2></div>
        <p className="muted small">We will send a code to both your old and new address. The change applies once both are confirmed.</p>
        <form className="col gap16" onSubmit={submitChangeEmail}>
          <Field label="New email" htmlFor="ce0">
            <input className="inp" type="email" id="ce0" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </Field>
          <div className="row end">
            <Button type="button" variant="outline" onClick={() => setChangeEmailOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={emailSaving}>{emailSaving ? "Sending…" : "Send confirmation"}</Button>
          </div>
        </form>
      </Dialog>
    </AnyWorkspaceShell>
  );
}
