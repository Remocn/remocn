"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const MASK = "radial-gradient(72% 78% at 50% 50%, #000 42%, transparent 100%)";

function Clip({
  theme,
  className,
  paused,
}: {
  theme: "light" | "dark";
  className: string;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // The other theme's clip is `display: none` and never intersects, so only
  // the visible one plays (and it picks up again after a theme switch).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [paused]);

  return (
    <video
      ref={videoRef}
      src={`/not-found-${theme}.mp4`}
      poster={`/not-found-${theme}.jpg`}
      muted
      loop
      playsInline
      preload="metadata"
      className={cn("absolute inset-0 size-full object-cover", className)}
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    />
  );
}

export function NotFoundVideo() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <Clip theme="light" className="dark:hidden" paused={reducedMotion} />
      <Clip theme="dark" className="hidden dark:block" paused={reducedMotion} />
    </div>
  );
}
