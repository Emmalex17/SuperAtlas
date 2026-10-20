import type { Workspace } from "./auth";

export type Organisation = {
  id: string;
  name: string;
  initials: string;
  color: string;
  sector: string;
  type: string;
  tier: string;
  status: "Verified" | "Pending verification" | "Info requested" | "Invited" | "Invite expired" | "Rejected";
  officer: string;
  joined: string;
  last: string;
  hq: string;
  tags: string[];
};

export const ORGANISATIONS: Organisation[] = [
  { id: "zenith", name: "Zenith Bank Plc", initials: "ZB", color: "#C8102E", sector: "Banking", type: "Commercial bank", tier: "National", status: "Verified", officer: "A. Okonkwo", joined: "Mar 2026", last: "Today", hq: "Lagos", tags: ["Listed", "D-SIB"] },
  { id: "uba", name: "United Bank for Africa Plc", initials: "UB", color: "#D71920", sector: "Banking", type: "Commercial bank", tier: "International", status: "Verified", officer: "F. Adeyemi", joined: "Mar 2026", last: "Yesterday", hq: "Lagos", tags: ["Listed", "D-SIB"] },
  { id: "gtb", name: "Guaranty Trust Bank Ltd", initials: "GT", color: "#E35205", sector: "Banking", type: "Commercial bank", tier: "International", status: "Verified", officer: "O. Bakare", joined: "Apr 2026", last: "2 days ago", hq: "Lagos", tags: ["D-SIB"] },
  { id: "stanbic", name: "Stanbic IBTC Bank Plc", initials: "SI", color: "#0033A1", sector: "Banking", type: "Commercial bank", tier: "National", status: "Pending verification", officer: "N. Eze", joined: "Oct 2026", last: "15 Oct", hq: "Lagos", tags: ["Foreign-owned"] },
  { id: "wema", name: "Wema Bank Plc", initials: "WB", color: "#5C2D91", sector: "Banking", type: "Commercial bank", tier: "Regional", status: "Verified", officer: "T. Lawal", joined: "May 2026", last: "6 Oct", hq: "Lagos", tags: ["Listed"] },
  { id: "jaiz", name: "Jaiz Bank Plc", initials: "JB", color: "#006A4E", sector: "Banking", type: "Non-interest bank", tier: "National", status: "Verified", officer: "H. Musa", joined: "Jun 2026", last: "4 days ago", hq: "Abuja", tags: ["Listed"] },
  { id: "moniepoint", name: "Moniepoint Microfinance Bank", initials: "MP", color: "#0357EE", sector: "Banking", type: "Microfinance bank", tier: "National", status: "Verified", officer: "C. Obi", joined: "Feb 2026", last: "Today", hq: "Lagos", tags: [] },
  { id: "opay", name: "OPay Digital Services Ltd", initials: "OP", color: "#1DCF9F", sector: "Payments", type: "Mobile money operator", tier: "", status: "Verified", officer: "K. Sule", joined: "Jan 2026", last: "3 days ago", hq: "Lagos", tags: [] },
  { id: "crestfield", name: "Crestfield Microfinance Bank Ltd", initials: "CM", color: "#6B4FA0", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Pending verification", officer: "R. Ibrahim", joined: "Oct 2026", last: "17 Oct", hq: "Kano", tags: [] },
  { id: "lumen", name: "Lumen Digital Services Ltd", initials: "LD", color: "#0F766E", sector: "Digital economy", type: "Cloud service provider", tier: "", status: "Info requested", officer: "E. Johnson", joined: "Oct 2026", last: "18 Oct", hq: "Abuja", tags: [] },
  { id: "kestrel", name: "Kestrel Payments Ltd", initials: "KP", color: "#8A5A00", sector: "Payments", type: "Payment solution service provider", tier: "PSSP", status: "Invited", officer: "—", joined: "—", last: "14 Oct", hq: "—", tags: [] },
  { id: "corvid", name: "Corvid Quick Loans Ltd", initials: "CQ", color: "#7A4E2D", sector: "Digital economy", type: "Fintech platform", tier: "", status: "Rejected", officer: "P. Okon", joined: "—", last: "9 Oct", hq: "Lagos", tags: [] },
];

export type Firm = {
  id: string;
  name: string;
  initials: string;
  color: string;
  types: string[];
  status: "Accredited" | "Renewal due" | "In review" | "Suspended";
  assigned: number;
  renews: string;
  since: string;
  city: string;
};

export const FIRMS: Firm[] = [
  { id: "deloitte", name: "Deloitte & Touche (Nigeria)", initials: "D", color: "#4E8A12", types: ["Audit & assurance", "Cybersecurity assessor"], status: "Accredited", assigned: 14, renews: "Jan 2027", since: "Feb 2024", city: "Lagos · Abuja" },
  { id: "kpmg", name: "KPMG Professional Services", initials: "K", color: "#00338D", types: ["Audit & assurance", "Data protection (DPCO)"], status: "Accredited", assigned: 11, renews: "Mar 2027", since: "Mar 2024", city: "Lagos" },
  { id: "pwc", name: "PricewaterhouseCoopers Nigeria", initials: "PwC", color: "#D04A02", types: ["Audit & assurance", "Advisory & remediation"], status: "Accredited", assigned: 9, renews: "Feb 2027", since: "Feb 2025", city: "Lagos" },
  { id: "ey", name: "Ernst & Young Nigeria", initials: "EY", color: "#2E2E38", types: ["Audit & assurance", "Data protection (DPCO)"], status: "Renewal due", assigned: 7, renews: "Nov 2026", since: "Nov 2024", city: "Lagos" },
  { id: "halcyon", name: "Halcyon Assurance Ltd", initials: "HA", color: "#3B5BA5", types: ["Cybersecurity assessor"], status: "In review", assigned: 0, renews: "—", since: "—", city: "Lagos" },
  { id: "northpoint", name: "Northpoint DPCO", initials: "NP", color: "#7A5C3E", types: ["Data protection (DPCO)"], status: "Suspended", assigned: 0, renews: "—", since: "Jun 2025", city: "Ibadan" },
  { id: "meridale", name: "Meridale Partners", initials: "MP", color: "#5B6B2F", types: ["Audit & assurance"], status: "In review", assigned: 0, renews: "—", since: "—", city: "Port Harcourt" },
];

export type CategoryType = { id: string; name: string; tiers: string[] };
export type Category = { id: string; name: string; types: CategoryType[] };

export const CATEGORIES: Category[] = [
  {
    id: "bank",
    name: "Banking",
    types: [
      { id: "cb", name: "Commercial bank", tiers: ["International", "National", "Regional"] },
      { id: "nib", name: "Non-interest bank", tiers: ["National", "Regional"] },
      { id: "mb", name: "Merchant bank", tiers: ["National"] },
      { id: "mfb", name: "Microfinance bank", tiers: ["National", "State", "Unit"] },
    ],
  },
  {
    id: "pay",
    name: "Payments",
    types: [
      { id: "mmo", name: "Mobile money operator", tiers: [] },
      { id: "sp", name: "Switching and processing", tiers: [] },
      { id: "pssp", name: "Payment solution service provider", tiers: ["PSSP", "PTSP", "Super-agent"] },
    ],
  },
  {
    id: "dig",
    name: "Digital economy",
    types: [
      { id: "dc", name: "Data controller of major importance", tiers: ["Ultra-high level", "Extra-high level", "Ordinary-high level"] },
      { id: "csp", name: "Cloud service provider", tiers: [] },
      { id: "fp", name: "Fintech platform", tiers: [] },
    ],
  },
];

export function tiersOf(typeName: string): string[] {
  for (const cat of CATEGORIES) {
    const t = cat.types.find((x) => x.name === typeName);
    if (t) return t.tiers;
  }
  return [];
}

export function catLabel(type: string, tier: string): string {
  return type ? type + (tier ? " · " + tier : "") : "Category to confirm";
}

export const STATUS_TONE: Record<string, "ok" | "warn" | "bad" | "info" | "neu"> = {
  Verified: "ok",
  Accredited: "ok",
  "Pending verification": "warn",
  "Renewal due": "warn",
  "Info requested": "warn",
  "In review": "info",
  Invited: "info",
  "Invite expired": "neu",
  Rejected: "bad",
  Suspended: "bad",
};

export type TeamMember = {
  name: string;
  initials: string;
  email: string;
  role: string;
  portfolio: string;
  status: string;
  last: string;
};

export const TEAM: TeamMember[] = [
  { name: "M. Bello", initials: "MB", email: "m.bello@nitda.gov.ng", role: "Admin", portfolio: "All categories", status: "Active", last: "Now" },
  { name: "N. Adeyemi", initials: "NA", email: "n.adeyemi@nitda.gov.ng", role: "Supervisor", portfolio: "Commercial bank, Non-interest bank", status: "Active", last: "2 hours ago" },
  { name: "J. Okeke", initials: "JO", email: "j.okeke@nitda.gov.ng", role: "Reviewer", portfolio: "Microfinance bank", status: "Active", last: "Yesterday" },
  { name: "S. Danjuma", initials: "SD", email: "s.danjuma@nitda.gov.ng", role: "Viewer", portfolio: "All categories", status: "Active", last: "3 days ago" },
];

export type Notification = {
  id: string;
  workspace: Workspace;
  icon: string;
  tone: "" | "ok" | "warn" | "bad" | "info";
  title: string;
  when: string;
  unread: boolean;
  kind: "Approvals" | "Updates" | "Reminders" | "Mentions";
  href: string;
};

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", workspace: "regulator", icon: "git-diff", tone: "warn", title: "Wema Bank requested a classification change", when: "6 Oct, 10:12", unread: true, kind: "Approvals", href: "/regulator/organisations/wema" },
  { id: "n2", workspace: "regulator", icon: "seal-check", tone: "info", title: "2 organisations are waiting for verification", when: "18 Oct, 16:40", unread: true, kind: "Approvals", href: "/regulator/organisations" },
  { id: "n3", workspace: "regulator", icon: "certificate", tone: "info", title: "Halcyon Assurance applied for Cybersecurity assessor accreditation", when: "11 Oct, 09:05", unread: true, kind: "Approvals", href: "/regulator/firms/halcyon" },
  { id: "n4", workspace: "regulator", icon: "envelope-simple", tone: "", title: "Stanbic IBTC Bank accepted your invitation", when: "15 Oct, 11:30", unread: false, kind: "Updates", href: "/regulator/organisations/stanbic" },
  { id: "n5", workspace: "regulator", icon: "clock", tone: "warn", title: "Ernst & Young Nigeria accreditation renews in 30 days", when: "12 Oct, 08:00", unread: false, kind: "Reminders", href: "/regulator/firms/ey" },
  { id: "n6", workspace: "regulator", icon: "chat-circle-dots", tone: "", title: "N. Adeyemi mentioned you on Crestfield MFB", when: "18 Oct, 17:02", unread: false, kind: "Mentions", href: "/regulator/organisations/crestfield" },
  { id: "n7", workspace: "organisation", icon: "buildings", tone: "info", title: "Finish setting up: add your logo and key officers", when: "Today, 09:00", unread: true, kind: "Reminders", href: "/organisation" },
  { id: "n8", workspace: "organisation", icon: "seal-check", tone: "ok", title: "NITDA verified your organisation", when: "1 Mar, 14:20", unread: false, kind: "Updates", href: "/organisation" },
  { id: "n9", workspace: "firm", icon: "certificate", tone: "info", title: "Your Audit & assurance accreditation renews in January 2027", when: "2 Oct, 09:06", unread: true, kind: "Reminders", href: "/firm" },
  { id: "n10", workspace: "firm", icon: "users", tone: "", title: "Add your assessors to finish setting up", when: "Today, 09:00", unread: true, kind: "Reminders", href: "/firm" },
];

export type AuditEntry = {
  when: string;
  who: string;
  initials: string;
  action: string;
  record: string;
  workspace: Workspace;
  ip: string;
  detail: string;
};

export const AUDIT: AuditEntry[] = [
  { when: "18 Oct 2026, 16:41", who: "System", initials: "SA", action: "Sent reminder", record: "Verification queue (2 waiting)", workspace: "regulator", ip: "—", detail: "Daily digest to supervisors" },
  { when: "15 Oct 2026, 11:30", who: "N. Eze", initials: "NE", action: "Accepted invitation", record: "Stanbic IBTC Bank Plc", workspace: "organisation", ip: "102.89.xx.xx", detail: "Account created, MFA set up" },
  { when: "12 Oct 2026, 09:14", who: "M. Bello", initials: "MB", action: "Added category tier", record: "Payment solution service provider · Super-agent", workspace: "regulator", ip: "41.58.xx.xx", detail: "Before: 2 tiers. After: 3 tiers." },
  { when: "9 Oct 2026, 15:02", who: "M. Bello", initials: "MB", action: "Sent invitation", record: "Kestrel Payments Ltd", workspace: "regulator", ip: "41.58.xx.xx", detail: "Category: Payment solution service provider · PSSP" },
  { when: "6 Oct 2026, 10:12", who: "T. Lawal", initials: "TL", action: "Requested classification change", record: "Wema Bank Plc · CC-0211", workspace: "organisation", ip: "105.112.xx.xx", detail: "Commercial bank · Regional → National" },
  { when: "3 Oct 2026, 10:44", who: "N. Adeyemi", initials: "NA", action: "Created saved group", record: "Tier-1 banks", workspace: "regulator", ip: "41.58.xx.xx", detail: "Rule: Commercial bank · International" },
  { when: "2 Oct 2026, 09:05", who: "T. Adebayo", initials: "TA", action: "Updated firm profile", record: "Deloitte & Touche (Nigeria)", workspace: "firm", ip: "102.88.xx.xx", detail: "Website and offices updated" },
  { when: "1 Oct 2026, 08:00", who: "System", initials: "SA", action: "Sent renewal notice", record: "Ernst & Young Nigeria", workspace: "regulator", ip: "—", detail: "Accreditation renews Nov 2026" },
];

export type Session = { device: string; where: string; when: string; current?: boolean };

export const SESSIONS: Session[] = [
  { device: "Chrome on Windows", where: "Abuja, NG", when: "Active now", current: true },
  { device: "Safari on iPhone", where: "Abuja, NG", when: "2 hours ago" },
  { device: "Edge on Windows", where: "Lagos, NG", when: "3 days ago" },
];

export const DEFAULT_MFA_DEVICE = { name: "Authenticator app (iPhone)", added: "1 Mar 2026", last: "Today" };
