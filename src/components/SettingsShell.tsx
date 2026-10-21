"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

export type SettingsId =
  | "profile"
  | "profile/branding"
  | "team"
  | "settings/categories"
  | "settings/categories/import"
  | "settings/firm-types"
  | "settings/scoring"
  | "settings/deadlines"
  | "settings/findings"
  | "settings/compliance"
  | "settings/actions";

type NavEntry = [label: string, id: SettingsId, also?: SettingsId[]];

/** Mirrors the prototype's SETTINGS_NAV (docs/prototype/source/core.js) — one shared left nav for the
 * regulator's workspace and supervision settings. */
export const SETTINGS_NAV: [group: string, items: NavEntry[]][] = [
  ["Workspace", [["Profile", "profile"], ["Branding", "profile/branding"], ["Team", "team"]]],
  [
    "Supervision",
    [
      ["Categories", "settings/categories", ["settings/categories/import"]],
      ["Firm types", "settings/firm-types"],
      ["Scoring schemes", "settings/scoring"],
      ["Deadlines & reminders", "settings/deadlines"],
      ["Finding classes", "settings/findings"],
      ["Compliance status", "settings/compliance"],
      ["Action types", "settings/actions"],
    ],
  ],
];

const HREF: Record<SettingsId, string> = {
  profile: "/regulator/profile",
  "profile/branding": "/regulator/profile/branding",
  team: "/regulator/team",
  "settings/categories": "/regulator/settings/categories",
  "settings/categories/import": "/regulator/settings/categories/import",
  "settings/firm-types": "/regulator/settings/firm-types",
  "settings/scoring": "/regulator/settings/scoring",
  "settings/deadlines": "/regulator/settings/deadlines",
  "settings/findings": "/regulator/settings/findings",
  "settings/compliance": "/regulator/settings/compliance",
  "settings/actions": "/regulator/settings/actions",
};

/** The persistent left-nav layout every Workspace/Supervision settings screen renders inside — the
 * prototype's settingsShell(). */
export function SettingsShell({ active, children }: { active: SettingsId; children: ReactNode }) {
  return (
    <div className="set-shell">
      <nav className="set-nav" aria-label="Settings">
        {SETTINGS_NAV.map(([group, items]) => (
          <Fragment key={group}>
            <div className="set-g">{group}</div>
            {items.map(([label, id, also]) => (
              <Link key={id} href={HREF[id]} className={id === active || also?.includes(active) ? "on" : ""} data-test={`set-${id.replace(/\//g, "-")}`}>
                {label}
              </Link>
            ))}
          </Fragment>
        ))}
      </nav>
      <div className="set-body">{children}</div>
    </div>
  );
}
