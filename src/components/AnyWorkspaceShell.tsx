"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession, type Account } from "@/lib/auth";

/** For the ws:"any" screens (notifications, account, audit, search) — renders inside whichever workspace the signed-in account belongs to. */
export function AnyWorkspaceShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<{ checked: boolean; account: Account | null }>({ checked: false, account: null });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only store (localStorage) that cannot be observed during SSR.
    setState({ checked: true, account: getSession() });
  }, []);

  useEffect(() => {
    if (state.checked && !state.account) {
      router.replace("/signin");
    }
  }, [state, router]);

  if (!state.checked || !state.account) return null;

  return <AppShell workspace={state.account.workspace}>{children}</AppShell>;
}
