"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/Toast";

const DEMO_ACCTS: { workspace: string; name: string; email: string }[] = [
  { workspace: "Regulator", name: "NITDA", email: "m.bello@nitda.gov.ng" },
  { workspace: "Organisation", name: "Zenith Bank", email: "a.okonkwo@zenith.example" },
  { workspace: "Organisation", name: "Moniepoint (data returns)", email: "c.obi@moniepoint.example" },
  { workspace: "Organisation", name: "OPay (enforcement)", email: "k.sule@opay.example" },
  { workspace: "Assurance firm", name: "Deloitte", email: "t.adebayo@deloitte.example" },
];

export function DemoAccess({ onUse }: { onUse: (email: string) => void }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const wrapRef = useRef<HTMLDivElement>(null);

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

  function copy(email: string) {
    navigator.clipboard?.writeText(email).then(
      () => toast(`Copied ${email}`, "ok", "copy"),
      () => toast(`Copied ${email}`, "ok", "copy")
    );
  }

  return (
    <div className="demo-wrap" data-test="demo-accts" ref={wrapRef}>
      <button type="button" className="demo-link" aria-expanded={open} onClick={() => setOpen((v) => !v)} data-test="demo-link">
        Demo access <Icon name={open ? "caret-up" : "caret-down"} />
      </button>
      {open ? (
        <div className="demo-pop" role="region" aria-label="Demo accounts">
          <div className="cap muted" style={{ padding: "2px 4px 6px" }}>Prototype only. Any password and any 6-digit code work.</div>
          {DEMO_ACCTS.map((a) => (
            <div className="demo-row" key={a.email}>
              <span className="grow" style={{ minWidth: 0 }}>
                <b>{a.name}</b>
                <span>{a.workspace} · {a.email}</span>
              </span>
              <button type="button" className="btn btn-secondary btn-sm" aria-label={`Copy ${a.email}`} onClick={() => copy(a.email)} data-test={`copy-${a.email.split("@")[0]}`}>
                <Icon name="copy" /><span>Copy</span>
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setOpen(false); onUse(a.email); }} data-test={`demo-${a.email.split("@")[0]}`}>
                <span>Use</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
