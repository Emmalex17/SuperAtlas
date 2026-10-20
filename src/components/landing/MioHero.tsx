"use client";

import { useEffect, useRef, useState } from "react";
import { MIO_REGS, MIO_ORGS, mioPos, mioPath, mioPacketsHtml, mioCardHtml, mioReduced, type MioRegKey } from "@/lib/mio";

const REG_KEYS = Object.keys(MIO_REGS) as MioRegKey[];

export function MioHero() {
  const [reg, setReg] = useState<MioRegKey>("CBN");
  const userPickedRef = useRef(false);
  const visibleRef = useRef(true);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      visibleRef.current = entries[0].isIntersecting;
    });
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (mioReduced()) return;
    const t = setInterval(() => {
      if (userPickedRef.current || !visibleRef.current || document.hidden) return;
      setReg((cur) => REG_KEYS[(REG_KEYS.indexOf(cur) + 1) % REG_KEYS.length]);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  function pick(k: MioRegKey) {
    userPickedRef.current = true;
    setReg(k);
  }

  return (
    <div className="mio" data-test="mio" data-reg={reg} ref={stageRef}>
      <div className="mio-tabs" role="tablist" aria-label="Show a regulator's view">
        {REG_KEYS.map((k) => (
          <button key={k} role="tab" aria-selected={k === reg} className={k === reg ? "on" : ""} onClick={() => pick(k)} data-test={`mio-${k}`}>
            {k}
          </button>
        ))}
      </div>
      <div className="mio-stage">
        <svg className="mio-svg" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
          <g className="mio-paths">
            {MIO_ORGS.map((o, i) => (
              <path key={i} d={mioPath(i)} className={o[3].includes(reg) ? "on" : ""} data-i={i} />
            ))}
          </g>
          <g className="mio-pk" dangerouslySetInnerHTML={{ __html: mioPacketsHtml(reg) }} />
        </svg>
        <div className="mio-nodes">
          {MIO_ORGS.map((o, i) => {
            const p = mioPos(i);
            return (
              <div
                key={i}
                className={`mio-node ${o[3].includes(reg) ? "on" : ""} ${p.side ? "r" : ""}`}
                style={{ "--x": `${p.x / 10}%`, "--y": `${p.y}px` } as React.CSSProperties}
                data-i={i}
              >
                <span className="mio-ini" style={{ background: o[2] }}>
                  {o[1]}
                </span>
                <span className="ell">{o[0]}</span>
              </div>
            );
          })}
        </div>
        <div className="mio-card" aria-live="polite" dangerouslySetInnerHTML={{ __html: mioCardHtml(reg) }} />
      </div>
      <div className="mio-legend">
        {Object.entries({ returns: "#818cf8", evidence: "#34d399", findings: "#fbbf24" }).map(([k, c]) => (
          <span key={k}>
            <span className="dot" style={{ background: c }} />
            {k[0].toUpperCase() + k.slice(1)}
          </span>
        ))}
        <span className="mio-note">Each regulator sees only the organisations it supervises</span>
      </div>
    </div>
  );
}
