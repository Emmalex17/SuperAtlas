"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function Popover({ open, onClose, anchorRef, children }: { open: boolean; onClose: () => void; anchorRef: React.RefObject<HTMLElement | null>; children: ReactNode }) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- measuring the anchor's DOM position after mount, the sanctioned use of useLayoutEffect + setState.
      setPos(null);
      return;
    }
    const rect = anchorRef.current?.getBoundingClientRect();
    setPos({ top: (rect?.bottom ?? 0) + window.scrollY + 4, right: rect ? window.innerWidth - rect.right : 0 });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (popRef.current?.contains(e.target as Node) || anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;

  return (
    <div ref={popRef} className="popover" style={{ top: pos.top, right: pos.right, position: "absolute" }}>
      {children}
    </div>
  );
}

export function MenuItem({ icon, children, onClick, danger }: { icon?: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button className="menu-item" style={danger ? { color: "var(--bad-fg)" } : undefined} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
