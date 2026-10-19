export type Workspace = "regulator" | "organisation" | "firm";

export type Account = {
  email: string;
  name: string;
  initials: string;
  role: string;
  workspace: Workspace;
  entityName: string;
};

export const DEMO_PASSWORD = "Demo1234!";

export const ACCOUNTS: Record<string, Account> = {
  "m.bello@nitda.gov.ng": {
    email: "m.bello@nitda.gov.ng",
    name: "M. Bello",
    initials: "MB",
    role: "Supervision lead",
    workspace: "regulator",
    entityName: "National Information Technology Development Agency",
  },
  "a.okonkwo@zenith.example": {
    email: "a.okonkwo@zenith.example",
    name: "A. Okonkwo",
    initials: "AO",
    role: "Chief compliance officer",
    workspace: "organisation",
    entityName: "Zenith Bank Plc",
  },
  "t.adebayo@deloitte.example": {
    email: "t.adebayo@deloitte.example",
    name: "T. Adebayo",
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

export function signIn(email: string, password: string): Account | null {
  const account = ACCOUNTS[email.toLowerCase()];
  if (!account || password !== DEMO_PASSWORD) return null;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, account.email);
  }
  return account;
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
  }
}
