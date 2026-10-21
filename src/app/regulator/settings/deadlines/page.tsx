"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { PageHead, Button, Field, Tile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { DEADLINES, saveDeadlines } from "@/lib/cases";

export default function DeadlinesSettingsPage() {
  const toast = useToast();
  const [win, setWin] = useState(DEADLINES.window);
  const [returnsGrace, setReturnsGrace] = useState(DEADLINES.returnsGrace);
  const [reminders, setReminders] = useState(DEADLINES.reminders);
  const [escalate, setEscalate] = useState(DEADLINES.escalate);
  const [inviteExpiry, setInviteExpiry] = useState(DEADLINES.inviteExpiry);
  const [digest, setDigest] = useState(DEADLINES.digest);
  const [tz, setTz] = useState(DEADLINES.tz);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveDeadlines({ window: win, returnsGrace, reminders, escalate, inviteExpiry, digest, tz });
    toast("Deadlines and reminders saved");
  }

  const reminderDays = reminders.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Settings", href: "/regulator/settings/categories" }, { label: "Deadlines & reminders" }]}>
      <SettingsShell active="settings/deadlines">
        <PageHead title="Deadlines & reminders" sub="Default windows, reminders and grace periods." />
        <p className="muted small">Defaults for new programmes and returns. Each programme can change them.</p>
        <form className="grid side" onSubmit={submit}>
          <div className="col gap24">
            <div className="card col gap16">
              <div className="h4">Responses and returns</div>
              <div className="grid g2" style={{ gap: 16 }}>
                <Field label="Default response window" htmlFor="dl-win">
                  <div className="row gap8">
                    <input className="inp" id="dl-win" type="number" style={{ width: 110 }} value={win} onChange={(e) => setWin(e.target.value)} />
                    <span className="muted">days</span>
                  </div>
                </Field>
                <Field label="Grace period for returns" htmlFor="dl-grace">
                  <div className="row gap8">
                    <input className="inp" id="dl-grace" type="number" style={{ width: 110 }} value={returnsGrace} onChange={(e) => setReturnsGrace(e.target.value)} />
                    <span className="muted">days, then marked late</span>
                  </div>
                </Field>
              </div>
              <Field label="Send reminders" hint="Days before the due date, separated by commas." htmlFor="dl-rem">
                <input className="inp" id="dl-rem" value={reminders} onChange={(e) => setReminders(e.target.value)} />
              </Field>
              <Field label="Escalate overdue work to the supervisor after" htmlFor="dl-esc">
                <div className="row gap8">
                  <input className="inp" id="dl-esc" type="number" style={{ width: 110 }} value={escalate} onChange={(e) => setEscalate(e.target.value)} />
                  <span className="muted">days overdue</span>
                </div>
              </Field>
            </div>
            <div className="card col gap16">
              <div className="h4">Invitations and digests</div>
              <div className="grid g2" style={{ gap: 16 }}>
                <Field label="Invitations expire after" htmlFor="dl-inv">
                  <div className="row gap8">
                    <input className="inp" id="dl-inv" type="number" style={{ width: 110 }} value={inviteExpiry} onChange={(e) => setInviteExpiry(e.target.value)} />
                    <span className="muted">days</span>
                  </div>
                </Field>
                <Field label="Supervisor digest" htmlFor="dl-dig">
                  <select className="sel" id="dl-dig" value={digest} onChange={(e) => setDigest(e.target.value)}>
                    {["Off", "Daily at 08:00", "Weekly on Monday"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Time zone" htmlFor="dl-tz">
                <select className="sel" id="dl-tz" value={tz} onChange={(e) => setTz(e.target.value)}>
                  {["West Africa Time (WAT, UTC+1)", "GMT (UTC+0)", "East Africa Time (UTC+3)"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="row end">
              <Button type="submit" testId="save-deadlines">Save deadlines</Button>
            </div>
          </div>
          <div className="card col gap12">
            <div className="h4">Example</div>
            <p className="small muted">A response due on 30 November:</p>
            <div className="timeline">
              {reminderDays.map((n) => (
                <div className="tl" key={n}>
                  <Tile icon="bell" tone="info" size="sm" />
                  <div className="small">
                    <b>Reminder</b>
                    <br />
                    <span className="muted">{n} day{n === "1" ? "" : "s"} before</span>
                  </div>
                </div>
              ))}
              <div className="tl">
                <Tile icon="flag" tone="warn" size="sm" />
                <div className="small">
                  <b>Due</b>
                  <br />
                  <span className="muted">30 Nov</span>
                </div>
              </div>
              <div className="tl">
                <Tile icon="warning" tone="bad" size="sm" />
                <div className="small">
                  <b>Escalated to supervisor</b>
                  <br />
                  <span className="muted">{escalate} days overdue</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </SettingsShell>
    </AppShell>
  );
}
