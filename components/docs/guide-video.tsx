"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function GuideVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
    } else {
      void video.play().catch(() => {});
    }
  }, [reducedMotion]);

  return (
    <div className="surface-card not-prose mb-6 aspect-video w-full overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={hovered || reducedMotion}
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
