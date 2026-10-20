"use client";

import { useEffect, useRef } from "react";

export function OtpInput({ invalid, onChange }: { invalid?: boolean; onChange: (code: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function emit() {
    onChange(refs.current.map((el) => el?.value ?? "").join(""));
  }

  return (
    <div className={`otp ${invalid ? "invalid" : ""}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(-1);
            if (e.target.value && refs.current[i + 1]) refs.current[i + 1]?.focus();
            emit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && refs.current[i - 1]) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
            if (t.length) {
              e.preventDefault();
              refs.current.forEach((el, j) => {
                if (el) el.value = t[j] || "";
              });
              (refs.current[t.length] || refs.current[5])?.focus();
              emit();
            }
          }}
        />
      ))}
    </div>
  );
}
