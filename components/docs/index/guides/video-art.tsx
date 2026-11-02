import type { ReactNode } from "react";

/**
 * Still artwork for guides whose page has no finished video (and therefore no
 * poster) yet. Keyed by guide slug; anything missing falls back to its title.
 */
export const VIDEO_ART: Record<string, ReactNode> = {
  teaser: (
    <span className="flex size-full items-center justify-center bg-dark-surface">
      <span className="absolute inset-0 bg-[url(/landing/shader-magenta.png)] bg-cover bg-center opacity-85" />
      <span className="relative text-[28px] leading-[34px] font-semibold tracking-[-0.03em] text-[#fafafa]">
        something is coming
      </span>
    </span>
  ),
  "product-demo": (
    <span className="flex size-full items-center justify-center bg-dark-surface">
      <span className="absolute inset-0 bg-[url(/bg.jpg)] bg-cover bg-center opacity-80" />
      <span className="relative flex items-center gap-2 text-lead leading-[26px] tracking-title text-[#fafafa]">
        <svg
          viewBox="0 0 24 24"
          className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="m16 10 6-3v10l-6-3" />
        </svg>
        Remocn Studio
      </span>
    </span>
  ),
  "changelog-video": (
    <span className="flex size-full flex-col justify-center gap-2 bg-[#f4f4f5] pl-10 text-lead leading-[26px] font-semibold tracking-title text-[#0e1012]">
      {["New components", "Improvements", "Fixes"].map((line, index) => (
        <span
          key={line}
          className="flex items-center gap-2.5"
          style={{ opacity: [1, 0.45, 0.18][index] }}
        >
          <span className="size-2 rounded-full bg-current" />
          {line}
        </span>
      ))}
    </span>
  ),
};

export function FallbackArt({ title }: { title: string }) {
  return (
    <span className="flex size-full items-center justify-center bg-surface-muted text-lead font-semibold tracking-title text-foreground">
      {title}
    </span>
  );
}
