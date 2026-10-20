"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/lib/icons";

type ToastItem = { id: number; message: string; tone: "ok" | "info" | "warn" | "bad"; icon: IconName };

type ToastFn = (message: string, tone?: ToastItem["tone"], icon?: IconName) => void;

const ToastContext = createContext<ToastFn>(() => {});

const DEFAULT_ICON: Record<ToastItem["tone"], IconName> = { ok: "check-circle", info: "info", warn: "warning", bad: "warning-octagon" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback<ToastFn>((message, tone = "ok", icon) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message, tone, icon: icon ?? DEFAULT_ICON[tone] }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <span className={`tile ${t.tone === "bad" ? "bad" : t.tone === "warn" ? "warn" : t.tone === "info" ? "info" : "ok"}`}>
              <Icon name={t.icon} />
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
