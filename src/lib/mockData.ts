import type { Workspace } from "./auth";

export type OrgApplication = {
  route: string;
  submitted: string;
  rc: string;
  licence: string;
  contact: string;
  checks: [string, boolean][];
};
export type OrgInvite = { email: string; sent?: string; expires?: string; by?: string; history: [string, string, string][] };
export type OrgOfficer = { initials: string; name: string; role: string; email: string };
export type OrgColleague = { email: string; name: string; role: string; status: string };
export type OrgLink = { name: string; rel: string };
export type OrgOnboard = { profile: boolean; logo: boolean; officers: boolean; people: boolean; group: boolean };

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
  rc?: string;
  email?: string;
  web?: string;
  isNew?: boolean;
  selfReg?: boolean;
  infoMsg?: string;
  rejectMsg?: string;
  group?: string;
  application?: OrgApplication;
  invite?: OrgInvite;
  officers?: OrgOfficer[];
  colleagues?: OrgColleague[];
  links?: OrgLink[];
  logoUp?: boolean;
  onboard?: OrgOnboard;
};

/** Marks every self-service onboarding step done, the prototype's lazy `o.onboard = o.onboard || {...}`
 * default — an organisation only shows an incomplete setup card once something explicitly clears a step. */
export function ensureOrgOnboard(o: Organisation): OrgOnboard {
  if (!o.onboard) o.onboard = { profile: true, logo: true, officers: true, people: true, group: true };
  return o.onboard;
}

/** Everyone at an organisation who can be assigned a question or a section to answer — the
 * prototype's orgPeople(). */
export function orgPeople(o: Organisation): string[] {
  return [...(o.officers ?? []).map((p) => p.name), ...(o.colleagues ?? []).filter((c) => (c.status || "Active") === "Active").map((c) => c.name || c.email)];
}

export const ORGANISATIONS: Organisation[] = [
  { id: "zenith", name: "Zenith Bank Plc", initials: "ZB", color: "#C8102E", sector: "Banking", type: "Commercial bank", tier: "National", status: "Verified", officer: "A. Okonkwo", joined: "Mar 2026", last: "Today", hq: "Lagos", tags: ["Listed", "D-SIB"], web: "zenithbank.com", rc: "RC 000000 (sample)", email: "compliance@zenith.example",
    officers: [{ initials: "AO", name: "A. Okonkwo", role: "Chief compliance officer", email: "a.okonkwo@zenith.example" }],
    colleagues: [{ email: "c.eze@zenith.example", name: "C. Eze", role: "Contributor", status: "Active" }],
    invite: { email: "a.okonkwo@zenith.example", history: [["1 Mar 2026", "Invitation sent", "M. Bello"], ["2 Mar 2026", "Invitation accepted", "A. Okonkwo"]] },
    onboard: { profile: true, logo: false, officers: false, people: false, group: false } },
  { id: "uba", name: "United Bank for Africa Plc", initials: "UB", color: "#D71920", sector: "Banking", type: "Commercial bank", tier: "International", status: "Verified", officer: "F. Adeyemi", joined: "Mar 2026", last: "Yesterday", hq: "Lagos", tags: ["Listed", "D-SIB"], web: "ubagroup.com",
    invite: { email: "compliance@ubagroup.example", history: [["1 Mar 2026", "Invitation sent", "M. Bello"], ["4 Mar 2026", "Invitation accepted", "F. Adeyemi"]] } },
  { id: "gtb", name: "Guaranty Trust Bank Ltd", initials: "GT", color: "#E35205", sector: "Banking", type: "Commercial bank", tier: "International", status: "Verified", officer: "O. Bakare", joined: "Apr 2026", last: "2 days ago", hq: "Lagos", tags: ["D-SIB"], web: "gtbank.com",
    invite: { email: "compliance@gtbank.example", history: [["2 Apr 2026", "Invitation sent", "N. Adeyemi"], ["3 Apr 2026", "Invitation accepted", "O. Bakare"]] } },
  { id: "stanbic", name: "Stanbic IBTC Bank Plc", initials: "SI", color: "#0033A1", sector: "Banking", type: "Commercial bank", tier: "National", status: "Pending verification", officer: "N. Eze", joined: "Oct 2026", last: "15 Oct", hq: "Lagos", tags: ["Foreign-owned"], web: "stanbicibtcbank.com",
    invite: { email: "compliance@stanbicibtc.example", history: [["2 Oct 2026", "Invitation sent", "M. Bello"], ["15 Oct 2026", "Invitation accepted", "N. Eze"], ["15 Oct 2026", "Profile submitted for verification", "N. Eze"]] },
    application: { route: "Invitation", submitted: "15 Oct 2026", rc: "RC 000001 (sample)", licence: "Banking licence — national authorisation.pdf", contact: "N. Eze · Chief compliance officer", checks: [["RC number format", true], ["Licence category matches chosen category", true], ["No duplicate organisation", true], ["Contact email on organisation domain", true]] } },
  { id: "wema", name: "Wema Bank Plc", initials: "WB", color: "#5C2D91", sector: "Banking", type: "Commercial bank", tier: "Regional", status: "Verified", officer: "T. Lawal", joined: "May 2026", last: "6 Oct", hq: "Lagos", tags: ["Listed"], web: "wemabank.com",
    invite: { email: "compliance@wemabank.example", history: [["2 May 2026", "Invitation sent", "N. Adeyemi"], ["5 May 2026", "Invitation accepted", "T. Lawal"]] } },
  { id: "jaiz", name: "Jaiz Bank Plc", initials: "JB", color: "#006A4E", sector: "Banking", type: "Non-interest bank", tier: "National", status: "Verified", officer: "H. Musa", joined: "Jun 2026", last: "4 days ago", hq: "Abuja", tags: ["Listed"], web: "jaizbankplc.com",
    invite: { email: "compliance@jaizbank.example", history: [["1 Jun 2026", "Invitation sent", "M. Bello"], ["2 Jun 2026", "Invitation accepted", "H. Musa"]] } },
  { id: "moniepoint", name: "Moniepoint Microfinance Bank", initials: "MP", color: "#0357EE", sector: "Banking", type: "Microfinance bank", tier: "National", status: "Verified", officer: "C. Obi", joined: "Feb 2026", last: "Today", hq: "Lagos", tags: [], web: "moniepoint.com",
    invite: { email: "compliance@moniepoint.example", history: [["3 Feb 2026", "Invitation sent", "M. Bello"], ["4 Feb 2026", "Invitation accepted", "C. Obi"]] } },
  { id: "opay", name: "OPay Digital Services Ltd", initials: "OP", color: "#1DCF9F", sector: "Payments", type: "Mobile money operator", tier: "", status: "Verified", officer: "K. Sule", joined: "Jan 2026", last: "3 days ago", hq: "Lagos", tags: [], web: "opayweb.com", rc: "RC 000004 (sample)", email: "compliance@opay.example",
    invite: { email: "compliance@opay.example", history: [["10 Jan 2026", "Invitation sent", "M. Bello"], ["12 Jan 2026", "Invitation accepted", "K. Sule"]] } },
  { id: "crestfield", name: "Crestfield Microfinance Bank Ltd", initials: "CM", color: "#6B4FA0", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Pending verification", officer: "R. Ibrahim", joined: "Oct 2026", last: "17 Oct", hq: "Kano", tags: [], web: "crestfieldmfb.example", selfReg: true,
    application: { route: "Self-registration", submitted: "17 Oct 2026", rc: "RC 000002 (sample)", licence: "MFB licence — state.pdf", contact: "R. Ibrahim · Compliance officer", checks: [["RC number format", true], ["Licence category matches chosen category", true], ["No duplicate organisation", true], ["Contact email on organisation domain", false]] } },
  { id: "lumen", name: "Lumen Digital Services Ltd", initials: "LD", color: "#0F766E", sector: "Digital economy", type: "Cloud service provider", tier: "", status: "Info requested", officer: "E. Johnson", joined: "Oct 2026", last: "18 Oct", hq: "Abuja", tags: [], web: "lumendigital.example", selfReg: true,
    infoMsg: "Please upload your cloud service provider licence. The certificate of incorporation does not show the licensed activity.",
    application: { route: "Self-registration", submitted: "18 Oct 2026", rc: "RC 000003 (sample)", licence: "Certificate of incorporation.pdf", contact: "E. Johnson · Head of risk", checks: [["RC number format", true], ["Licence category matches chosen category", false], ["No duplicate organisation", true], ["Contact email on organisation domain", true]] } },
  { id: "kestrel", name: "Kestrel Payments Ltd", initials: "KP", color: "#8A5A00", sector: "Payments", type: "Payment solution service provider", tier: "PSSP", status: "Invited", officer: "—", joined: "—", last: "14 Oct", hq: "—", tags: [],
    invite: { email: "compliance@kestrel.example", sent: "14 Oct 2026", expires: "28 Oct 2026", by: "M. Bello", history: [["14 Oct 2026", "Invitation sent", "M. Bello"]] } },
  { id: "corvid", name: "Corvid Quick Loans Ltd", initials: "CQ", color: "#7A4E2D", sector: "Digital economy", type: "Fintech platform", tier: "", status: "Rejected", officer: "P. Okon", joined: "—", last: "9 Oct", hq: "Lagos", tags: [], selfReg: true,
    rejectMsg: "The licence uploaded belongs to a different company. You can apply again with the correct licence.",
    application: { route: "Self-registration", submitted: "7 Oct 2026", rc: "RC 000006 (sample)", licence: "Operating licence.pdf", contact: "P. Okon · Director", checks: [["RC number format", true], ["Licence category matches chosen category", false], ["No duplicate organisation", true], ["Contact email on organisation domain", false]] } },
  // The following organisations appear only as subjects of past programme cycles and published
  // assessment reports (seeded alongside the programme/case data below) — they carry no
  // invite/onboarding history of their own beyond the record shown here.
  { id: "lagoon", name: "Lagoon Microfinance Bank Ltd", initials: "LM", color: "#00838F", sector: "Banking", type: "Microfinance bank", tier: "National", status: "Verified", officer: "S. Adewale", joined: "Apr 2026", last: "12 Oct", hq: "Lagos", tags: [], web: "lagoonmfb.example",
    invite: { email: "compliance@lagoonmfb.example", history: [["1 Apr 2026", "Invitation sent", "J. Okeke"], ["3 Apr 2026", "Invitation accepted", "S. Adewale"]] } },
  { id: "savannah", name: "Savannah Microfinance Bank Ltd", initials: "SM", color: "#9E6A03", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Verified", officer: "A. Garba", joined: "Apr 2026", last: "12 Oct", hq: "Kaduna", tags: [], web: "savannahmfb.example",
    invite: { email: "compliance@savannahmfb.example", history: [["1 Apr 2026", "Invitation sent", "J. Okeke"], ["3 Apr 2026", "Invitation accepted", "A. Garba"]] } },
  { id: "unity", name: "Unity Community Microfinance Bank", initials: "UC", color: "#6D4C9F", sector: "Banking", type: "Microfinance bank", tier: "Unit", status: "Verified", officer: "E. Okon", joined: "Apr 2026", last: "12 Oct", hq: "Calabar", tags: [], web: "unitymfb.example",
    invite: { email: "compliance@unitymfb.example", history: [["1 Apr 2026", "Invitation sent", "J. Okeke"], ["3 Apr 2026", "Invitation accepted", "E. Okon"]] } },
  { id: "palmgrove", name: "Palmgrove Bank Plc", initials: "PB", color: "#2F6B3A", sector: "Banking", type: "Commercial bank", tier: "National", status: "Verified", officer: "R. Ade", joined: "Jun 2024", last: "4 days ago", hq: "Kano", tags: [], web: "palmgrove.example",
    invite: { email: "compliance@palmgrove.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "R. Ade"]] } },
  { id: "cedarwood", name: "Cedarwood Bank Plc", initials: "CB", color: "#7A4B2A", sector: "Banking", type: "Commercial bank", tier: "Regional", status: "Verified", officer: "U. Nnamdi", joined: "Jun 2024", last: "2 days ago", hq: "Port Harcourt", tags: [], web: "cedarwood.example",
    invite: { email: "compliance@cedarwood.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "U. Nnamdi"]] } },
  { id: "orchid", name: "Orchid Commercial Bank Ltd", initials: "OC", color: "#8E3B8C", sector: "Banking", type: "Commercial bank", tier: "National", status: "Verified", officer: "F. Bello", joined: "Jun 2024", last: "Yesterday", hq: "Abuja", tags: [], web: "orchid.example",
    invite: { email: "compliance@orchid.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "F. Bello"]] } },
  { id: "ridgeline", name: "Ridgeline Bank Plc", initials: "RB", color: "#1F4E79", sector: "Banking", type: "Commercial bank", tier: "International", status: "Verified", officer: "T. Okafor", joined: "Mar 2024", last: "12 Oct", hq: "Kano", tags: [], web: "ridgeline.example",
    invite: { email: "compliance@ridgeline.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "T. Okafor"]] } },
  { id: "tidewater", name: "Tidewater Bank Plc", initials: "TB", color: "#0E7C86", sector: "Banking", type: "Commercial bank", tier: "Regional", status: "Verified", officer: "S. Ibe", joined: "Apr 2024", last: "Yesterday", hq: "Abuja", tags: [], web: "tidewater.example",
    invite: { email: "compliance@tidewater.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "S. Ibe"]] } },
  { id: "ironwood", name: "Ironwood Bank Ltd", initials: "IB", color: "#4A4A4A", sector: "Banking", type: "Commercial bank", tier: "National", status: "Verified", officer: "D. Musa", joined: "Jun 2024", last: "4 days ago", hq: "Abuja", tags: [], web: "ironwood.example",
    invite: { email: "compliance@ironwood.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "D. Musa"]] } },
  { id: "harbourline", name: "Harbourline Bank Plc", initials: "HB", color: "#2B5DA8", sector: "Banking", type: "Commercial bank", tier: "National", status: "Verified", officer: "G. Eke", joined: "Mar 2024", last: "4 days ago", hq: "Lagos", tags: [], web: "harbourline.example",
    invite: { email: "compliance@harbourline.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "G. Eke"]] } },
  { id: "harmattan", name: "Harmattan Microfinance Bank", initials: "HM", color: "#A35C2B", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Verified", officer: "B. Yusuf", joined: "May 2024", last: "Today", hq: "Ibadan", tags: [], web: "harmattan.example",
    invite: { email: "compliance@harmattan.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "B. Yusuf"]] } },
  { id: "riverbend", name: "Riverbend Microfinance Bank", initials: "RM", color: "#2D7D6F", sector: "Banking", type: "Microfinance bank", tier: "National", status: "Verified", officer: "L. Okoro", joined: "Jan 2025", last: "2 days ago", hq: "Benin City", tags: [], web: "riverbend.example",
    invite: { email: "compliance@riverbend.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "L. Okoro"]] } },
  { id: "kolanut", name: "Kolanut Microfinance Bank", initials: "KM", color: "#7B2D26", sector: "Banking", type: "Microfinance bank", tier: "Unit", status: "Verified", officer: "N. Uche", joined: "May 2024", last: "2 days ago", hq: "Benin City", tags: [], web: "kolanut.example",
    invite: { email: "compliance@kolanut.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "N. Uche"]] } },
  { id: "ember", name: "Ember Microfinance Bank", initials: "EM", color: "#C2410C", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Verified", officer: "C. Nwankwo", joined: "May 2024", last: "2 days ago", hq: "Owerri", tags: [], web: "ember.example",
    invite: { email: "compliance@ember.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "C. Nwankwo"]] } },
  { id: "weaver", name: "Weaver Microfinance Bank", initials: "WM", color: "#5B4B8A", sector: "Banking", type: "Microfinance bank", tier: "Unit", status: "Verified", officer: "M. Danladi", joined: "May 2024", last: "2 days ago", hq: "Abeokuta", tags: [], web: "weaver.example",
    invite: { email: "compliance@weaver.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "M. Danladi"]] } },
  { id: "sahel", name: "Sahel Commercial Bank Ltd", initials: "SC", color: "#B5651D", sector: "Banking", type: "Commercial bank", tier: "Regional", status: "Verified", officer: "A. Lawan", joined: "Jun 2024", last: "Today", hq: "Kano", tags: [], web: "sahel.example",
    invite: { email: "compliance@sahel.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "A. Lawan"]] } },
  { id: "copperleaf", name: "Copperleaf Microfinance Bank", initials: "CL", color: "#9A5B13", sector: "Banking", type: "Microfinance bank", tier: "National", status: "Verified", officer: "M. Danladi", joined: "Mar 2025", last: "Today", hq: "Ibadan", tags: [], web: "copperleaf.example",
    invite: { email: "compliance@copperleaf.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "M. Danladi"]] } },
  { id: "tamarind", name: "Tamarind Microfinance Bank", initials: "TM", color: "#6B7A1E", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Verified", officer: "L. Okoro", joined: "Mar 2024", last: "4 days ago", hq: "Owerri", tags: [], web: "tamarind.example",
    invite: { email: "compliance@tamarind.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "L. Okoro"]] } },
  { id: "hilltop", name: "Hilltop Community Microfinance Bank", initials: "HC", color: "#3E6A8A", sector: "Banking", type: "Microfinance bank", tier: "Unit", status: "Verified", officer: "N. Uche", joined: "Mar 2025", last: "Today", hq: "Ibadan", tags: [], web: "hilltop.example",
    invite: { email: "compliance@hilltop.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "N. Uche"]] } },
  { id: "mangrove", name: "Mangrove Microfinance Bank", initials: "MM", color: "#1E6B52", sector: "Banking", type: "Microfinance bank", tier: "State", status: "Verified", officer: "I. Peters", joined: "May 2024", last: "12 Oct", hq: "Ibadan", tags: [], web: "mangrove.example",
    invite: { email: "compliance@mangrove.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "I. Peters"]] } },
  { id: "okrahill", name: "Okra Hill Microfinance Bank", initials: "OH", color: "#7A8B2E", sector: "Banking", type: "Microfinance bank", tier: "Unit", status: "Verified", officer: "O. Salami", joined: "Mar 2025", last: "12 Oct", hq: "Ibadan", tags: [], web: "okrahill.example",
    invite: { email: "compliance@okrahill.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "O. Salami"]] } },
  { id: "tollgate", name: "Tollgate Payments Ltd", initials: "TP", color: "#334155", sector: "Payments", type: "Payment solution service provider", tier: "PSSP", status: "Verified", officer: "P. Akin", joined: "Feb 2025", last: "Today", hq: "Lagos", tags: [], web: "tollgate.example",
    invite: { email: "compliance@tollgate.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "P. Akin"]] } },
  { id: "linkbridge", name: "Linkbridge Payments Ltd", initials: "LP", color: "#0F766E", sector: "Payments", type: "Payment solution service provider", tier: "PTSP", status: "Verified", officer: "Y. Bala", joined: "Apr 2025", last: "Yesterday", hq: "Lagos", tags: [], web: "linkbridge.example",
    invite: { email: "compliance@linkbridge.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "Y. Bala"]] } },
  { id: "signalpay", name: "Signalpay Ltd", initials: "SP", color: "#B91C1C", sector: "Payments", type: "Payment solution service provider", tier: "PSSP", status: "Verified", officer: "Z. Eze", joined: "Jul 2025", last: "2 days ago", hq: "Lagos", tags: [], web: "signalpay.example",
    invite: { email: "compliance@signalpay.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "Z. Eze"]] } },
  { id: "cascade", name: "Cascade Mobile Money Ltd", initials: "CM", color: "#0369A1", sector: "Payments", type: "Mobile money operator", tier: "", status: "Verified", officer: "H. Obi", joined: "Feb 2025", last: "4 days ago", hq: "Lagos", tags: [], web: "cascade.example",
    invite: { email: "compliance@cascade.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "H. Obi"]] } },
  { id: "pocketline", name: "Pocketline Mobile Money Ltd", initials: "PM", color: "#7C3AED", sector: "Payments", type: "Mobile money operator", tier: "", status: "Verified", officer: "P. Akin", joined: "Apr 2025", last: "12 Oct", hq: "Lagos", tags: [], web: "pocketline.example",
    invite: { email: "compliance@pocketline.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "P. Akin"]] } },
  { id: "ledgerline", name: "Ledgerline Technologies Ltd", initials: "LT", color: "#15803D", sector: "Digital economy", type: "Fintech platform", tier: "", status: "Verified", officer: "Y. Bala", joined: "Jul 2025", last: "Today", hq: "Lagos", tags: [], web: "ledgerline.example",
    invite: { email: "compliance@ledgerline.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "Y. Bala"]] } },
  { id: "quillfin", name: "Quillfin Ltd", initials: "QF", color: "#BE185D", sector: "Digital economy", type: "Fintech platform", tier: "", status: "Verified", officer: "Z. Eze", joined: "Feb 2025", last: "Yesterday", hq: "Lagos", tags: [], web: "quillfin.example",
    invite: { email: "compliance@quillfin.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "Z. Eze"]] } },
  { id: "stratus", name: "Stratus Cloud Nigeria Ltd", initials: "SN", color: "#475569", sector: "Digital economy", type: "Cloud service provider", tier: "", status: "Verified", officer: "H. Obi", joined: "Apr 2025", last: "2 days ago", hq: "Lagos", tags: [], web: "stratus.example",
    invite: { email: "compliance@stratus.example", history: [["1 Mar 2024", "Invitation sent", "J. Okeke"], ["4 Mar 2024", "Invitation accepted", "H. Obi"]] } },
];

export type ClassificationRequest = {
  id: string;
  ref: string;
  org: string;
  by: string;
  date: string;
  from: { sector: string; type: string; tier: string };
  to: { sector: string; type: string; tier: string };
  reason: string;
  file: string;
  status: "Pending" | "Approved" | "Rejected";
  decided?: string;
  note?: string;
  impact?: string;
};

export const CLASS_REQS: ClassificationRequest[] = [
  { id: "cc211", ref: "CC-0211", org: "wema", by: "T. Lawal, Chief compliance officer", date: "6 Oct 2026", from: { sector: "Banking", type: "Commercial bank", tier: "Regional" }, to: { sector: "Banking", type: "Commercial bank", tier: "National" }, reason: "We received national authorisation in September. The new licence is attached.", file: "National authorisation letter.pdf", status: "Pending", impact: "Wema Bank moves into the National tier. 12 additional requirements apply from the next cycle." },
  { id: "cc188", ref: "CC-0188", org: "moniepoint", by: "C. Obi, Head of compliance", date: "2 Jun 2026", from: { sector: "Banking", type: "Microfinance bank", tier: "State" }, to: { sector: "Banking", type: "Microfinance bank", tier: "National" }, reason: "National MFB licence granted in May.", file: "National MFB licence.pdf", status: "Approved", decided: "9 Jun 2026", note: "Approved. Effective from the next cycle." },
];

export type FirmPerson = { name: string; initials: string; role: "Lead auditor" | "Assessor"; title: string; cred: string; expires: string; status: string };
export type FirmClient = { org: string; orgId?: string; initials: string; color: string; service: string; since: string };
export type FirmAccreditation = { type: string; ref: string; from: string; to: string; status: string };
export type AccApplication = {
  id: string;
  firm: string;
  type: string;
  submitted: string;
  due: string;
  status: "In review" | "Info requested" | "Accredited" | "Declined";
  docs: [string, boolean][];
  assessors: [string, string, boolean][];
  decl: string;
  infoMsg?: string;
};

export type FirmOnboard = { profile: boolean; logo: boolean; people: boolean; clients: boolean };

export type Firm = {
  id: string;
  name: string;
  initials: string;
  color: string;
  types: string[];
  status: "Accredited" | "Renewal due" | "In review" | "Suspended" | "Approved for one programme";
  oneOff?: boolean;
  assigned: number;
  renews: string;
  since: string;
  city: string;
  web?: string;
  email?: string;
  suspendReason?: string;
  people?: FirmPerson[];
  clients?: FirmClient[];
  logoUp?: boolean;
  onboard?: FirmOnboard;
};

/** Marks every self-service onboarding step done, mirroring ensureOrgOnboard() above for firms. */
export function ensureFirmOnboard(f: Firm): FirmOnboard {
  if (!f.onboard) f.onboard = { profile: true, logo: true, people: true, clients: true };
  return f.onboard;
}

export const FIRMS: Firm[] = [
  { id: "deloitte", name: "Deloitte & Touche (Nigeria)", initials: "D", color: "#4E8A12", types: ["Audit & assurance", "Cybersecurity assessor"], status: "Accredited", assigned: 14, renews: "Jan 2027", since: "Feb 2024", city: "Lagos · Abuja", web: "deloitte.com/ng", email: "regulatory@deloitte.example",
    people: [
      { name: "T. Adebayo", initials: "TA", role: "Lead auditor", title: "Partner, risk advisory", cred: "FCA, CISA", expires: "Dec 2027", status: "Active" },
      { name: "I. Okafor", initials: "IO", role: "Assessor", title: "Director, cyber", cred: "CISSP, ISO 27001 Lead Auditor", expires: "Jun 2027", status: "Active" },
      { name: "R. Salami", initials: "RS", role: "Assessor", title: "Senior manager, audit", cred: "CIPP/E (in progress)", expires: "—", status: "Pending credential" },
    ],
    clients: [
      { org: "Northgate Bank Plc", initials: "NB", color: "#1F4E79", service: "IT strategy advisory", since: "Jan 2026" },
      { org: "Kestrel Payments Ltd", initials: "KP", color: "#8A5A00", service: "Remediation support", since: "Jul 2025" },
    ],
    onboard: { profile: true, logo: false, people: false, clients: false } },
  { id: "kpmg", name: "KPMG Professional Services", initials: "K", color: "#00338D", types: ["Audit & assurance", "Data protection (DPCO)"], status: "Accredited", assigned: 11, renews: "Mar 2027", since: "Mar 2024", city: "Lagos", web: "kpmg.com/ng",
    people: [
      { name: "O. Fashola", initials: "OF", role: "Lead auditor", title: "Partner", cred: "FCA, CIPP/E", expires: "Mar 2028", status: "Active" },
      { name: "G. Uche", initials: "GU", role: "Assessor", title: "Manager", cred: "CISA", expires: "Aug 2027", status: "Active" },
    ], clients: [] },
  { id: "pwc", name: "PricewaterhouseCoopers Nigeria", initials: "PwC", color: "#D04A02", types: ["Audit & assurance", "Advisory & remediation"], status: "Accredited", assigned: 9, renews: "Feb 2027", since: "Feb 2025", city: "Lagos", web: "pwc.com/ng",
    people: [{ name: "E. Ajayi", initials: "EA", role: "Lead auditor", title: "Partner", cred: "FCA", expires: "Feb 2028", status: "Active" }],
    clients: [{ org: "Guaranty Trust Bank Ltd", orgId: "gtb", initials: "GT", color: "#E35205", service: "Core banking security advisory", since: "Mar 2026" }] },
  { id: "ey", name: "Ernst & Young Nigeria", initials: "EY", color: "#2E2E38", types: ["Audit & assurance", "Data protection (DPCO)"], status: "Renewal due", assigned: 7, renews: "Nov 2026", since: "Nov 2024", city: "Lagos", web: "ey.com/ng",
    people: [{ name: "S. Bello", initials: "SB", role: "Lead auditor", title: "Partner", cred: "FCA, CIPM", expires: "Jan 2027", status: "Active" }], clients: [] },
  { id: "halcyon", name: "Halcyon Assurance Ltd", initials: "HA", color: "#3B5BA5", types: ["Cybersecurity assessor"], status: "In review", assigned: 0, renews: "—", since: "—", city: "Lagos", email: "hello@halcyon.example",
    people: [
      { name: "B. Nwosu", initials: "BN", role: "Lead auditor", title: "Lead assessor", cred: "OSCP, CISSP", expires: "Apr 2028", status: "Active" },
      { name: "F. Olatunji", initials: "FO", role: "Assessor", title: "Security consultant", cred: "CEH", expires: "Sep 2027", status: "Active" },
    ], clients: [] },
  { id: "northpoint", name: "Northpoint DPCO", initials: "NP", color: "#7A5C3E", types: ["Data protection (DPCO)"], status: "Suspended", assigned: 0, renews: "—", since: "Jun 2025", city: "Ibadan", suspendReason: "Licence lapsed with the data protection authority",
    people: [{ name: "L. Ade", initials: "LA", role: "Lead auditor", title: "Principal", cred: "CIPP/E", expires: "Expired", status: "Active" }], clients: [] },
  { id: "meridale", name: "Meridale Partners", initials: "MP", color: "#5B6B2F", types: ["Audit & assurance"], status: "In review", assigned: 0, renews: "—", since: "—", city: "Port Harcourt", email: "office@meridale.example",
    people: [
      { name: "P. Eke", initials: "PE", role: "Lead auditor", title: "Managing partner", cred: "FCA", expires: "Oct 2027", status: "Active" },
      { name: "S. Ojo", initials: "SO", role: "Assessor", title: "Senior associate", cred: "ACA, CISA", expires: "Jan 2028", status: "Active" },
    ], clients: [{ org: "Harbour Trust Microfinance Bank", initials: "HT", color: "#00796B", service: "Policy review", since: "Mar 2026" }] },
];

export const FIRM_ACCREDITATIONS: Record<string, FirmAccreditation[]> = {
  deloitte: [{ type: "Audit & assurance", ref: "ACC-2026-0142", from: "1 Feb 2026", to: "31 Jan 2027", status: "Active" }, { type: "Cybersecurity assessor", ref: "ACC-2026-0187", from: "1 Mar 2026", to: "28 Feb 2027", status: "Active" }],
  kpmg: [{ type: "Audit & assurance", ref: "ACC-2026-0110", from: "1 Apr 2026", to: "31 Mar 2027", status: "Active" }, { type: "Data protection (DPCO)", ref: "ACC-2026-0111", from: "1 Apr 2026", to: "31 Mar 2027", status: "Active" }],
  pwc: [{ type: "Audit & assurance", ref: "ACC-2026-0098", from: "1 Mar 2026", to: "28 Feb 2027", status: "Active" }, { type: "Advisory & remediation", ref: "ACC-2026-0099", from: "1 Mar 2026", to: "28 Feb 2027", status: "Active" }],
  ey: [{ type: "Audit & assurance", ref: "ACC-2025-0301", from: "1 Dec 2025", to: "30 Nov 2026", status: "Renewal due" }, { type: "Data protection (DPCO)", ref: "ACC-2025-0302", from: "1 Dec 2025", to: "30 Nov 2026", status: "Renewal due" }],
  northpoint: [{ type: "Data protection (DPCO)", ref: "ACC-2025-0207", from: "1 Jul 2025", to: "30 Jun 2026", status: "Suspended" }],
};

export const ACC_APPS: AccApplication[] = [
  { id: "acc2", firm: "halcyon", type: "Cybersecurity assessor", submitted: "11 Oct 2026", due: "8 Nov 2026", status: "In review", docs: [["Company registration", true], ["Professional indemnity insurance", false], ["Methodology document", true], ["Assessor CVs and certificates (2)", true]], assessors: [["B. Nwosu", "OSCP, CISSP", true], ["F. Olatunji", "CEH", true]], decl: "Independence declaration signed. Advisory clients declared: 0." },
  { id: "acc3", firm: "meridale", type: "Audit & assurance", submitted: "16 Oct 2026", due: "13 Nov 2026", status: "In review", docs: [["Company registration", true], ["Professional indemnity insurance", true], ["Audit methodology", true], ["Assessor CVs and certificates (3)", true]], assessors: [["P. Eke", "FCA", true], ["S. Ojo", "ACA, CISA", true]], decl: "Independence declaration signed. Advisory clients declared: 1." },
];

export type CategoryType = { id: string; name: string; plural?: string; count: number; tiers: string[]; isNew?: boolean };
export type Category = { id: string; name: string; types: CategoryType[]; isNew?: boolean };

export const CATEGORIES: Category[] = [
  {
    id: "bank",
    name: "Banking",
    types: [
      { id: "cb", name: "Commercial bank", plural: "Commercial banks", count: 24, tiers: ["International", "National", "Regional"] },
      { id: "nib", name: "Non-interest bank", plural: "Non-interest banks", count: 5, tiers: ["National", "Regional"] },
      { id: "mb", name: "Merchant bank", plural: "Merchant banks", count: 6, tiers: ["National"] },
      { id: "mfb", name: "Microfinance bank", plural: "Microfinance banks", count: 58, tiers: ["National", "State", "Unit"] },
    ],
  },
  {
    id: "pay",
    name: "Payments",
    types: [
      { id: "mmo", name: "Mobile money operator", count: 22, tiers: [] },
      { id: "sp", name: "Switching and processing", count: 6, tiers: [] },
      { id: "pssp", name: "Payment solution service provider", count: 12, tiers: ["PSSP", "PTSP", "Super-agent"] },
    ],
  },
  {
    id: "dig",
    name: "Digital economy",
    types: [
      { id: "dc", name: "Data controller of major importance", count: 21, tiers: ["Ultra-high level", "Extra-high level", "Ordinary-high level"] },
      { id: "csp", name: "Cloud service provider", count: 7, tiers: [] },
      { id: "fp", name: "Fintech platform", count: 6, tiers: [] },
    ],
  },
];

export const TAGS: string[] = ["Listed", "D-SIB", "Systemically important", "Foreign-owned"];

export type CatGroup = { name: string; rule: string; count: number };
export const GROUPS: CatGroup[] = [
  { name: "DMBs (deposit money banks)", rule: "Commercial bank + Non-interest bank + Merchant bank", count: 35 },
  { name: "Tier-1 banks", rule: "Commercial bank · International", count: 8 },
];

export type CatHistoryEntry = { when: string; who: string; what: string };
export const CAT_HISTORY: CatHistoryEntry[] = [
  { when: "12 Oct 2026", who: "M. Bello", what: 'Added tier "Super-agent" under Payment solution service provider' },
  { when: "3 Oct 2026", who: "N. Adeyemi", what: 'Created saved group "Tier-1 banks"' },
  { when: "1 Mar 2026", who: "M. Bello", what: "Imported 3 sectors, 10 types and 19 tiers from spreadsheet" },
];

function logCatHistory(what: string) {
  CAT_HISTORY.unshift({ when: "Today", who: "M. Bello", what });
}

export function allCategoryTypes(): CategoryType[] {
  return CATEGORIES.flatMap((c) => c.types);
}

export function moveSector(sectorId: string, dir: 1 | -1) {
  const i = CATEGORIES.findIndex((c) => c.id === sectorId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= CATEGORIES.length) return;
  [CATEGORIES[i], CATEGORIES[j]] = [CATEGORIES[j], CATEGORIES[i]];
}

export function moveType(sectorId: string, typeId: string, dir: 1 | -1) {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  if (!c) return;
  const i = c.types.findIndex((t) => t.id === typeId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= c.types.length) return;
  [c.types[i], c.types[j]] = [c.types[j], c.types[i]];
}

export function addSector(name: string) {
  CATEGORIES.push({ id: `s${Date.now()}`, name, types: [], isNew: true });
  logCatHistory(`Added sector "${name}"`);
}

export function addType(sectorId: string, name: string) {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  if (!c) return;
  c.types.push({ id: `t${Date.now()}`, name, count: 0, tiers: [], isNew: true });
  logCatHistory(`Added institution type "${name}"`);
}

export function addTier(sectorId: string, typeId: string, name: string) {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  const t = c?.types.find((x) => x.id === typeId);
  if (!t) return;
  t.tiers.push(name);
  logCatHistory(`Added tier "${name}"`);
}

export function renameSector(sectorId: string, name: string) {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  if (!c) return;
  const old = c.name;
  c.name = name;
  logCatHistory(`Renamed "${old}" to "${name}"`);
}

export function renameType(sectorId: string, typeId: string, name: string) {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  const t = c?.types.find((x) => x.id === typeId);
  if (!t) return;
  const old = t.name;
  t.name = name;
  logCatHistory(`Renamed "${old}" to "${name}"`);
}

export function deleteSector(sectorId: string): boolean {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  if (!c) return false;
  const n = c.types.reduce((a, t) => a + t.count, 0);
  if (n) return false;
  const idx = CATEGORIES.indexOf(c);
  CATEGORIES.splice(idx, 1);
  logCatHistory(`Deleted "${c.name}"`);
  return true;
}

export function deleteType(sectorId: string, typeId: string): boolean {
  const c = CATEGORIES.find((x) => x.id === sectorId);
  const t = c?.types.find((x) => x.id === typeId);
  if (!c || !t) return false;
  if (t.count) return false;
  c.types = c.types.filter((x) => x.id !== typeId);
  logCatHistory(`Deleted "${t.name}"`);
  return true;
}

export function addTag(name: string) {
  TAGS.push(name);
}
export function removeTag(i: number) {
  TAGS.splice(i, 1);
}

export function addGroup(name: string, include: string[]) {
  const count = allCategoryTypes().filter((t) => include.includes(t.name)).reduce((a, t) => a + t.count, 0);
  GROUPS.push({ name, rule: include.join(" + "), count });
}

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

/** Logs a new audit-trail entry for the signed-in regulator persona — the prototype's addAudit()
 * (core.js). Not yet called by every mutator in this codebase, only the ones built against it. */
export function addAudit(action: string, record: string, detail = "") {
  AUDIT.unshift({ when: "Just now", who: "M. Bello", initials: "MB", action, record, workspace: "regulator", ip: "41.58.xx.xx", detail });
}

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

export const TENANT = {
  name: "NITDA",
  full: "National Information Technology Development Agency",
  short: "NITDA",
  initials: "NI",
  /** The tenant's own brand colour — distinct from the app-wide Navy/Forest/Ocean theme swatches, used for
   * the tenant's logo mark (e.g. on invitation emails). Matches the prototype's tenant.col. */
  col: "#0B7A3E",
  legal: "National Information Technology Development Agency",
  domain: "superatlas.nitda.gov.ng",
  mandate:
    "Develops and regulates information technology in Nigeria, and supervises organisations for compliance with the frameworks and guidelines published in the requirements library.",
  email: "supervision@nitda.gov.ng",
  phone: "+234 9 000 0000",
  address: "No. 28 Port Harcourt Crescent, Area 11, Garki, Abuja",
  sectors: ["Banking", "Payments", "Digital economy"],
  theme: "default" as "default" | "forest" | "ocean",
  logoUploaded: true,
};

export const THEMES: { key: "default" | "forest" | "ocean"; name: string; desc: string; swatches: [string, string, string] }[] = [
  { key: "default", name: "SuperAtlas default", desc: "Navy and indigo", swatches: ["#1b2056", "#4f46e5", "#dba94d"] },
  { key: "forest", name: "Forest", desc: "Deep green", swatches: ["#0f3d2a", "#15803d", "#dba94d"] },
  { key: "ocean", name: "Ocean", desc: "Deep blue", swatches: ["#0b2e4f", "#0369a1", "#dba94d"] },
];

export const Q_LABELS = ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26", "Q2 '26", "Q3 '26", "Q4 '26"];

export const DASH = {
  quarter: "Q3 2026",
  strength: 78,
  strengthDelta: 6,
  coverage: 86,
  findings: 23,
  findingsHigh: 9,
  overdue: 7,
  overdueOrgs: 4,
  series: [58, 59.5, 60, 61, 63, 66, 69, 72],
  band: [
    [52, 65],
    [53, 67],
    [54, 68],
    [55, 70],
    [57, 72],
    [60, 74],
    [63, 79],
    [67, 84],
  ] as [number, number][],
  attention: [
    { name: "Example Cloud Services Ltd", sub: "Down 8 pts · 2 findings", vals: [76, 75, 74, 74, 72, 70, 68, 62], tone: "bad" as const },
    { name: "Eastport Payments", sub: "Down 5 pts · coverage 64%", vals: [68, 67, 67, 65, 64, 63, 61, 58], tone: "bad" as const },
    { name: "Harbour Fintech", sub: "3 actions overdue", vals: [68, 69, 67, 68, 70, 69, 69, 69], tone: "neu" as const },
  ],
  rows: [
    { name: "Riverside Digital Bank", type: "Commercial bank", vals: [72, 74, 74, 77, 79, 81, 83, 85], score: 85, delta: 2, coverage: 96, findings: 1, next: "Monitoring" },
    { name: "Demo Hosting Ltd", type: "Cloud service provider", vals: [68, 70, 70, 73, 75, 77, 79, 81], score: 81, delta: 3, coverage: 92, findings: 2, next: "Assessment closed" },
    { name: "Northgate Data Centres", type: "Data centre operator", vals: [60, 62, 61, 64, 66, 68, 71, 74], score: 74, delta: 6, coverage: 88, findings: 4, next: "CAP in progress" },
    { name: "Harbour Fintech", type: "Fintech platform", vals: [68, 69, 67, 68, 70, 69, 69, 69], score: 69, delta: 0, coverage: 80, findings: 3, next: "3 actions overdue" },
    { name: "Example Cloud Services Ltd", type: "Cloud service provider", vals: [76, 75, 74, 74, 72, 70, 68, 62], score: 62, delta: -8, coverage: 71, findings: 7, next: "Findings issued" },
    { name: "Eastport Payments", type: "Payment service provider", vals: [68, 67, 67, 65, 64, 63, 61, 58], score: 58, delta: -5, coverage: 64, findings: 6, next: "Assessment due" },
  ],
};

export const FIRM_TYPES = [
  {
    id: "audit",
    name: "Audit & assurance",
    icon: "certificate",
    criteria: ["Registered audit firm in good standing", "Professional indemnity insurance of at least ₦500m", "At least 2 partners with FCA or equivalent"],
    creds: "FCA, ACA, CISA",
    docs: "Registration, insurance, methodology, assessor CVs",
  },
  {
    id: "dpco",
    name: "Data protection (DPCO)",
    icon: "lock-simple",
    criteria: ["Current DPCO licence from the data protection authority", "Named data protection lead", "Documented audit methodology"],
    creds: "CIPP/E, CIPM, CDPO",
    docs: "DPCO licence, insurance, methodology, assessor CVs",
  },
  {
    id: "cyber",
    name: "Cybersecurity assessor",
    icon: "shield-check",
    criteria: ["At least 3 certified assessors", "Penetration testing methodology", "Secure evidence handling procedure"],
    creds: "CISSP, OSCP, ISO 27001 Lead Auditor",
    docs: "Registration, insurance, methodology, assessor CVs",
  },
  {
    id: "advisory",
    name: "Advisory & remediation",
    icon: "users",
    criteria: ["Registered consulting firm", "Conflict-of-interest policy", "Cannot assess an organisation it advised in the last 24 months"],
    creds: "Relevant professional certification",
    docs: "Registration, conflict policy, team CVs",
  },
];

export const FIRM_RULES = { renewal: "12", grace: "30", conflictMonths: "24" };

export function saveFirmRules(patch: Partial<typeof FIRM_RULES>) {
  Object.assign(FIRM_RULES, patch);
}

export function saveFirmTypeCriteria(id: string, criteria: string[], creds: string) {
  const t = FIRM_TYPES.find((x) => x.id === id);
  if (t) {
    t.criteria = criteria;
    t.creds = creds;
  }
}

export const ROLES = [
  { name: "Admin", desc: "Everything, including settings, team and branding" },
  { name: "Supervisor", desc: "Manage organisations and firms in their portfolio; approve and publish" },
  { name: "Reviewer", desc: "Review reports and returns assigned to them" },
  { name: "Viewer", desc: "Read-only access to dashboards and records" },
];

export const PERMS: [string, boolean, boolean, boolean, boolean][] = [
  ["Invite and verify organisations", true, true, false, false],
  ["Approve classification changes", true, true, false, false],
  ["Accredit assurance firms", true, true, false, false],
  ["Edit requirements and scoring", true, false, false, false],
  ["Review reports and returns", true, true, true, false],
  ["Publish reports", true, true, false, false],
  ["Manage branding and team", true, false, false, false],
  ["View dashboards", true, true, true, true],
];

/** The signed-in account carries an entityName, not an id — these resolve which organisation/firm record it is. */
export function orgIdFor(entityName: string): string | undefined {
  return ORGANISATIONS.find((o) => o.name === entityName)?.id;
}
export function firmIdFor(entityName: string): string | undefined {
  return FIRMS.find((f) => f.name === entityName)?.id;
}

const TODAY_LABEL = "Today";

/** Adds a newly-invited organisation to the directory — the prototype's newInvited(). Used by both the
 * single-organisation and the bulk-spreadsheet invite flows. */
export function inviteOrganisation(r: { org: string; email: string; initials: string; color: string; sector: string; type: string; tier: string }): string {
  const id = r.org
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  ORGANISATIONS.push({
    id,
    name: r.org,
    initials: r.initials,
    color: r.color,
    sector: r.sector,
    type: r.type,
    tier: r.tier,
    status: "Invited",
    officer: "—",
    joined: "—",
    last: TODAY_LABEL,
    hq: "—",
    tags: [],
    isNew: true,
    web: r.email.split("@")[1],
    invite: { email: r.email, sent: "19 Oct 2026", expires: "2 Nov 2026", by: "M. Bello", history: [["19 Oct 2026", "Invitation sent", "M. Bello"]] },
  });
  return id;
}

/** Resends an invitation to an organisation whose earlier one expired — if no matching record exists yet
 * (this app's sample directory is a subset of the prototype's), falls back to inviting it fresh so the row
 * still goes out, matching the prototype's own resend behaviour where it can. */
export function resendOrInvite(r: { org: string; email: string; initials: string; color: string; sector: string; type: string; tier: string }): string {
  const existing = ORGANISATIONS.find((o) => o.name === r.org);
  if (existing) {
    existing.status = "Invited";
    existing.invite = { email: r.email, sent: "19 Oct 2026", expires: "2 Nov 2026", by: "M. Bello", history: [...(existing.invite?.history ?? []), ["19 Oct 2026", "Invitation resent", "M. Bello"]] };
    return existing.id;
  }
  return inviteOrganisation(r);
}

/* ================= Self-service onboarding (org/welcome, org/team, org/profile) =================
 * Mutators behind the organisation's own setup wizard and team/profile screens — the prototype's
 * ACT.form_obProfile/obLogo/form_obOfficer/obOffDel/form_obColleague/form_obLink (onboarding.js)
 * and ACT.form_myOrg/myFirm (workspace.js). */

export function saveOrgProfile(o: Organisation, patch: { rc?: string; web?: string; hq?: string; email?: string }) {
  Object.assign(o, patch);
}

export function setOrgLogoUploaded(o: Organisation) {
  o.logoUp = true;
}

export function addOrgOfficer(o: Organisation, officer: { name: string; role: string; email: string }) {
  const initials = officer.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  (o.officers ??= []).push({ initials, name: officer.name, role: officer.role, email: officer.email });
}

export function removeOrgOfficer(o: Organisation, index: number) {
  o.officers?.splice(index, 1);
}

export function inviteColleague(o: Organisation, email: string, role: string) {
  const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  (o.colleagues ??= []).push({ email, name, role, status: "Invited" });
}

export function addOrgLink(o: Organisation, link: OrgLink) {
  (o.links ??= []).push(link);
  o.group = link.name;
}

export function completeOrgOnboardStep(o: Organisation, step: keyof OrgOnboard) {
  ensureOrgOnboard(o)[step] = true;
}

/** An organisation's own "Request a classification change" submission — the prototype's ACT.form_cc. */
export function requestClassificationChange(o: Organisation, to: { sector: string; type: string; tier: string }, reason: string, file: string) {
  const ref = `CC-0${219 + CLASS_REQS.length}`;
  CLASS_REQS.unshift({
    id: `cc-${Date.now()}`,
    ref,
    org: o.id,
    by: `${o.officer}, Chief compliance officer`,
    date: "19 Oct 2026",
    from: { sector: o.sector, type: o.type, tier: o.tier },
    to,
    reason,
    file,
    status: "Pending",
    impact: `${o.name} moves to ${catLabel(to.type, to.tier)}. Requirements for that category apply from the next cycle. Open submissions keep their current requirements.`,
  });
  return ref;
}

export function withdrawClassificationRequest(id: string) {
  const i = CLASS_REQS.findIndex((r) => r.id === id);
  if (i >= 0) CLASS_REQS.splice(i, 1);
}

/* ---------- Self-service onboarding (firm/welcome, firm/team, firm/profile) ---------- */

export function saveFirmProfile(f: Firm, patch: { web?: string; city?: string; email?: string }) {
  Object.assign(f, patch);
}

export function setFirmLogoUploaded(f: Firm) {
  f.logoUp = true;
}

export function addFirmPerson(f: Firm, person: { name: string; role: "Lead auditor" | "Assessor"; title?: string; cred?: string; expires?: string }) {
  const initials = person.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  (f.people ??= []).push({ name: person.name, initials, role: person.role, title: person.title ?? "", cred: person.cred || "—", expires: person.expires || "—", status: "Active" });
}

export function removeFirmPerson(f: Firm, index: number) {
  f.people?.splice(index, 1);
}

export function declareFirmClient(f: Firm, client: { org: string; service?: string; since?: string }) {
  const initials = client.org.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  (f.clients ??= []).push({ org: client.org, initials, color: "#607D8B", service: client.service || "Advisory", since: client.since || "2026" });
}

export function removeFirmClient(f: Firm, index: number) {
  f.clients?.splice(index, 1);
}

export function completeFirmOnboardStep(f: Firm, step: keyof FirmOnboard) {
  ensureFirmOnboard(f)[step] = true;
}

/** A firm's own "Apply for accreditation" submission — the prototype's ACT.accNext (step 3 → 4). */
export function submitAccreditationApplication(f: Firm, type: string, assessorNames: string[]): AccApplication {
  const docsNeeded = ["DPCO licence from the data protection authority", "Professional indemnity insurance", "Methodology document", "Assessor CVs and certificates"];
  const app: AccApplication = {
    id: `acc-${Date.now()}`,
    firm: f.id,
    type,
    submitted: "Today",
    due: "16 Nov 2026",
    status: "In review",
    docs: docsNeeded.map((d) => [d, true] as [string, boolean]),
    assessors: assessorNames.map((n) => {
      const p = (f.people ?? []).find((x) => x.name === n);
      return [n, p?.cred || "—", p?.status === "Active"] as [string, string, boolean];
    }),
    decl: `Independence declaration signed. Advisory clients declared: ${(f.clients ?? []).length}.`,
  };
  ACC_APPS.unshift(app);
  return app;
}
