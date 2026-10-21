"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({ open, onClose, children, wide, sticky }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean; sticky?: boolean }) {
  useEffect(() => {
    if (!open || sticky) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, sticky, onClose]);
  if (!open) return null;
  return (
    <div className="scrim" onClick={sticky ? undefined : onClose}>
      <div className={`dialog ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer">{children}</div>
    </>
  );
}

/** A floating panel anchored under a trigger button — the prototype's openPop(). Closes on outside click or Escape. */
export function Popover({ open, onClose, children, width = 320, align = "right" }: { open: boolean; onClose: () => void; children: ReactNode; width?: number; align?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="popover" style={{ position: "absolute", [align === "right" ? "right" : "left"]: 0, top: "calc(100% + 8px)", width, zIndex: 30 }}>
      {children}
    </div>
  );
}
