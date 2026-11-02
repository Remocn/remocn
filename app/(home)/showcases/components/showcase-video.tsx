"use client";

import { useEffect, useRef } from "react";
import { useLoopControls } from "../../components/site-page/use-loop-controls";

export function ShowcaseVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster: string;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { reducedMotion, videoProps } = useLoopControls();

  // Loops only while on screen, and comes back only if it was playing when
  // it left; reduced motion leaves it on the poster.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    let resume = true;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        visible = true;
        if (resume) void video.play().catch(() => {});
      } else if (visible) {
        visible = false;
        resume = !video.paused;
        video.pause();
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-[14px] bg-dark-raised md:rounded-cta">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={label}
        muted
        loop
        playsInline
        preload="metadata"
        className="size-full object-cover outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/60"
        {...videoProps}
      />
    </div>
  );
}
