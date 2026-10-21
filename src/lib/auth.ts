export type Workspace = "regulator" | "organisation" | "firm";

export type Account = {
  email: string;
  name: string;
  first: string;
  initials: string;
  role: string;
  workspace: Workspace;
  entityName: string;
};

/** Prototype only: any password works, matching the source prototype's own demo auth exactly. */
export const DEMO_PASSWORD = "Demo1234!";

export const ACCOUNTS: Record<string, Account> = {
  "m.bello@nitda.gov.ng": {
    email: "m.bello@nitda.gov.ng",
    name: "M. Bello",
    first: "Musa",
    initials: "MB",
    role: "Supervision lead",
    workspace: "regulator",
    entityName: "National Information Technology Development Agency",
  },
  "a.okonkwo@zenith.example": {
    email: "a.okonkwo@zenith.example",
    name: "A. Okonkwo",
    first: "Adaeze",
    initials: "AO",
    role: "Chief compliance officer",
    workspace: "organisation",
    entityName: "Zenith Bank Plc",
  },
  "c.obi@moniepoint.example": {
    email: "c.obi@moniepoint.example",
    name: "C. Obi",
    first: "Chidi",
    initials: "CO",
    role: "Head of compliance",
    workspace: "organisation",
    entityName: "Moniepoint Microfinance Bank",
  },
  "k.sule@opay.example": {
    email: "k.sule@opay.example",
    name: "K. Sule",
    first: "Kemi",
    initials: "KS",
    role: "Head of compliance",
    workspace: "organisation",
    entityName: "OPay Digital Services Ltd",
  },
  "t.adebayo@deloitte.example": {
    email: "t.adebayo@deloitte.example",
    name: "T. Adebayo",
    first: "Tunde",
    initials: "TA",
    role: "Partner, risk advisory",
    workspace: "firm",
    entityName: "Deloitte & Touche (Nigeria)",
  },
};

export const WORKSPACE_HOME: Record<Workspace, string> = {
  regulator: "/regulator",
  organisation: "/organisation",
  firm: "/firm",
};

const SESSION_KEY = "superatlas.session";
const PENDING_KEY = "superatlas.pending";

/** Step 1 of sign-in: checks the account exists and a password was entered. Any password works — this is a
 * prototype with no real backend, matching the source prototype's own behaviour. Does not establish a
 * session — MFA still has to pass. */
export function checkCredentials(email: string, password: string): Account | null {
  const account = ACCOUNTS[email.toLowerCase()];
  if (!account || !password) return null;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PENDING_KEY, account.email);
  }
  return account;
}

export function getPendingAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const email = window.sessionStorage.getItem(PENDING_KEY);
  if (!email) return null;
  return ACCOUNTS[email] ?? null;
}

/** Step 2 of sign-in: called once the MFA code is accepted. Establishes the real session. */
export function completeSignIn(): Account | null {
  if (typeof window === "undefined") return null;
  const email = window.sessionStorage.getItem(PENDING_KEY);
  if (!email || !ACCOUNTS[email]) return null;
  window.sessionStorage.removeItem(PENDING_KEY);
  window.localStorage.setItem(SESSION_KEY, email);
  return ACCOUNTS[email];
}

export function getSession(): Account | null {
  if (typeof window === "undefined") return null;
  const email = window.localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return ACCOUNTS[email] ?? null;
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.setItem("superatlas.signedOut", "1");
  }
}
