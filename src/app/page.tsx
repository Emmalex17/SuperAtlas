"use client";

import { useEffect, useRef } from "react";
import { landingPageHtml } from "@/lib/landingContent";

function fitThumbs(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".thumb").forEach((t) => {
    const inner = t.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const k = t.clientWidth / 1440;
    inner.style.transform = `scale(${k})`;
  });
}

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    fitThumbs(el);
    const onResize = () => fitThumbs(el);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: landingPageHtml() }} />;
}
