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

/**
 * The six demo accounts and the screens built against them (dashboards, cases, findings and
 * everything else still backed by src/lib/mockData.ts and src/lib/data/*.json) keep this exact
 * static shape — switching it to data read live from Supabase is each of those screens' own
 * back-end phase's job (phases 2-9), not this one's. Real sign-in (src/server/actions/auth.ts)
 * now gates getting here at all; this dictionary only supplies the *display* session the rest
 * of the still-mock app already depends on. Any real account not listed here (a newly invited
 * colleague, for instance) gets a session built from the real backend's own data instead — see
 * `sessionFromBackend` below — which is honest, if data-sparse, until later phases wire real
 * data for non-demo accounts too.
 */
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
const BRIDGED_ACCOUNT_KEY = "superatlas.sessionAccount";
const PENDING_KEY = "superatlas.pending";
const PENDING_EMAIL_KEY = "superatlas.pendingEmail";

/** Builds a display Account from the real backend's getSession() response, for any signed-in
 * email that isn't one of the six demo accounts above. */
export function sessionFromBackend(
  email: string,
  backend: { workspace: string; role: string; entityName: string; profile: { fullName: string; initials: string | null } },
): Account {
  const name = backend.profile.fullName || email;
  return {
    email,
    name,
    first: name.split(" ")[0] ?? name,
    initials: backend.profile.initials || name.slice(0, 2).toUpperCase(),
    role: backend.role,
    workspace: backend.workspace as Workspace,
    entityName: backend.entityName,
  };
}

/** Writes the final, confirmed session — called once the real backend (or, for the six demo
 * accounts, the password check alone) has established who this is. Stores the full Account
 * alongside the session email, since a real (non-demo) account has no static ACCOUNTS entry
 * for getSession() to look it up from afterwards. */
export function establishSession(account: Account) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, account.email);
    window.localStorage.setItem(BRIDGED_ACCOUNT_KEY, JSON.stringify(account));
    window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
  }
}

/** Real sign-in, step 1: the password was accepted but a real (non-demo) account still needs
 * the emailed code — /verify reads this to know which email it's verifying. */
export function setPendingRealEmail(email: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(PENDING_EMAIL_KEY, email);
}
export function getPendingRealEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PENDING_EMAIL_KEY) || null;
}
export function clearPendingRealEmail() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
}

/**
 * Accept-invitation flow (src/components/InviteFlow.tsx — organisation/firm self-service
 * invite acceptance, still mock-only pending back-end phase 2): establishes the pending
 * sign-in straight from the account's email, skipping password verification. Unrelated to the
 * real colleague-invite accept flow (src/app/accept/[token]/page.tsx), which calls
 * establishSession directly once the real backend confirms the account. Kept as-is so
 * InviteFlow's already-shipped flow is untouched.
 */
export function beginPendingSignIn(email: string): Account | null {
  const account = ACCOUNTS[email.toLowerCase()];
  if (!account) return null;
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

/** Step 2 of the InviteFlow mock path only — called once its (mock) MFA code is accepted. */
export function completeSignIn(): Account | null {
  if (typeof window === "undefined") return null;
  const email = window.sessionStorage.getItem(PENDING_KEY);
  if (!email || !ACCOUNTS[email]) return null;
  window.sessionStorage.removeItem(PENDING_KEY);
  window.localStorage.setItem(SESSION_KEY, email);
  return ACCOUNTS[email];
}

/** For a real (non-demo) account, the full Account is stored alongside the session email at
 * establishSession time, since there is no static ACCOUNTS entry to look it up from. */
function readBridgedAccount(email: string): Account | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BRIDGED_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    const account = JSON.parse(raw) as Account;
    return account.email === email ? account : null;
  } catch {
    return null;
  }
}

export function getSession(): Account | null {
  if (typeof window === "undefined") return null;
  const email = window.localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return ACCOUNTS[email] ?? readBridgedAccount(email);
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(BRIDGED_ACCOUNT_KEY);
    window.sessionStorage.setItem("superatlas.signedOut", "1");
    // Fire-and-forget: also end the real Supabase session (demo accounts have one too, from
    // signInWithPassword). Dynamic import keeps this module callable from components that
    // don't otherwise need the server-action bundle.
    import("@/server/actions/auth").then(({ signOut: signOutReal }) => signOutReal()).catch(() => undefined);
  }
}
