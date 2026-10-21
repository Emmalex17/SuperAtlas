export type InviteId = "invitation" | "zenith" | "deloitte";

export type Invite = {
  acct: string;
  fromName: string;
  fromAddr: string;
  brand: "superatlas" | "tenant";
  subject: string;
  ent: string;
  role: string;
  by: string;
  /** Where /verify sends this account once MFA passes, instead of its workspace's plain dashboard —
   * matches the prototype's INVITES[...].next. */
  next: string;
  body: string;
};

/** Mirrors the prototype's INVITES (docs/prototype/source/auth.js) — the three invitation routes a new
 * regulator/organisation/firm admin lands on from the (simulated) email that invited them in. */
export const INVITES: Record<InviteId, Invite> = {
  invitation: {
    acct: "m.bello@nitda.gov.ng",
    fromName: "RegTech365 onboarding",
    fromAddr: "onboarding@superatlas.example",
    brand: "superatlas",
    subject: "Set up NITDA on SuperAtlas",
    ent: "NITDA",
    role: "Workspace admin",
    by: "RegTech365 onboarding team",
    next: "/welcome",
    body: "RegTech365 has created a SuperAtlas workspace for the National Information Technology Development Agency. As the workspace admin, you will confirm your profile and branding, then invite your team.",
  },
  zenith: {
    acct: "a.okonkwo@zenith.example",
    fromName: "NITDA",
    fromAddr: "no-reply@superatlas.nitda.gov.ng",
    brand: "tenant",
    subject: "NITDA invites Zenith Bank Plc to SuperAtlas",
    ent: "Zenith Bank Plc",
    role: "Organisation admin",
    by: "M. Bello, NITDA",
    next: "/organisation/welcome",
    body: "NITDA supervises Zenith Bank Plc as a Commercial bank · National. Accept this invitation to set up your organisation. You will answer requirements and file returns here.",
  },
  deloitte: {
    acct: "t.adebayo@deloitte.example",
    fromName: "NITDA",
    fromAddr: "no-reply@superatlas.nitda.gov.ng",
    brand: "tenant",
    subject: "NITDA invites Deloitte & Touche (Nigeria) to SuperAtlas",
    ent: "Deloitte & Touche (Nigeria)",
    role: "Firm admin",
    by: "M. Bello, NITDA",
    next: "/firm/welcome",
    body: "Deloitte & Touche (Nigeria) is accredited by NITDA for Audit & assurance and Cybersecurity assessor work. Accept this invitation to set up your firm and add your assessors.",
  },
};
