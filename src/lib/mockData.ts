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
