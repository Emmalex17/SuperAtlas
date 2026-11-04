"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { listDemoAccounts, type DemoAccountInfo } from "@/server/actions/auth";

export function DemoAccess({ onUse }: { onUse: (email: string, password: string) => void }) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<DemoAccountInfo[]>([]);
  const toast = useToast();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || accounts.length) return;
    listDemoAccounts().then((result) => {
      if (result.ok) setAccounts(result.data);
    });
  }, [open, accounts.length]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast(`Copied ${label}`, "ok", "copy"),
      () => toast(`Copied ${label}`, "ok", "copy"),
    );
  }

  return (
    <div className="demo-wrap" data-test="demo-accts" ref={wrapRef}>
      <button type="button" className="demo-link" aria-expanded={open} onClick={() => setOpen((v) => !v)} data-test="demo-link">
        Demo access <Icon name={open ? "caret-up" : "caret-down"} />
      </button>
      {open ? (
        <div className="demo-pop" role="region" aria-label="Demo accounts">
          <div className="cap muted" style={{ padding: "2px 4px 6px" }}>Each account&apos;s real password. Sign-in skips the email code for these.</div>
          {accounts.map((a) => (
            <div className="demo-row" key={a.email}>
              <span className="grow" style={{ minWidth: 0 }}>
                <b>{a.name}</b>
                <span>
                  {a.workspace} · {a.email} · <code className="mono">{a.password || "…"}</code>
                </span>
              </span>
              <button type="button" className="btn btn-secondary btn-sm" aria-label={`Copy password for ${a.email}`} onClick={() => copy(a.password, "password")} data-test={`copy-${a.email.split("@")[0]}`}>
                <Icon name="copy" /><span>Copy</span>
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setOpen(false); onUse(a.email, a.password); }} data-test={`demo-${a.email.split("@")[0]}`}>
                <span>Use</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
