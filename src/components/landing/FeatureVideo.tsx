"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icons";

function reducedMotion(): boolean {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function FeatureVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const startPaused = reducedMotion();
    setPaused(startPaused);
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startPaused) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    const next = !paused;
    setPaused(next);
    if (next) v.pause();
    else v.play().catch(() => {});
  }

  return (
    <div className="sa-motion-frame">
      <video ref={videoRef} className="sa-video" muted loop playsInline preload="metadata" poster={poster} aria-label={label}>
        <source src={src} type="video/mp4" />
      </video>
      <button className="sa-vplay" type="button" onClick={toggle} aria-label={paused ? "Play video" : "Pause video"}>
        <Icon name={paused ? "play" : "pause"} />
      </button>
    </div>
  );
}
