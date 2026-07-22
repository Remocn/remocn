"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useHoverCapable } from "./use-hover-capable";

export function ShowcaseVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});
  }, [reducedMotion]);

  return (
    <div className="surface-card aspect-video w-full overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={!hoverCapable || hovered || reducedMotion}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        muted
        loop
        playsInline
        preload="metadata"
        className="size-full object-cover"
      />
    </div>
  );
}
