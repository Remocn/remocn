import type { ReactNode } from "react";
import { HeroAeTile, HeroVideoTile } from "./tiles/hero-tiles";

const HEADLINE = "You want the video, not the ordeal";

export const TILE_SLOT = "size-[46px] md:size-[0.839em]";

/**
 * Display headline with two rotated tiles between the words. The tiles are
 * sized in `em`, so the whole line scales with the font size per breakpoint.
 * Mobile breaks into four lines ("You want / the ▢ video, / not the ▢ /
 * ordeal"), md+ into two.
 */
export function HeroHeadline({
  videoTile = <HeroVideoTile className={TILE_SLOT} />,
  aeTile = <HeroAeTile className={TILE_SLOT} />,
}: {
  videoTile?: ReactNode;
  aeTile?: ReactNode;
}) {
  return (
    <h1 className="flex flex-col items-center pt-7 text-[52px] leading-none tracking-[-0.05em] text-foreground md:pt-9 md:text-[72px] lg:text-[96px] xl:text-display">
      <span className="sr-only">{HEADLINE}</span>
      <span
        aria-hidden="true"
        className="hero-in flex flex-col items-center [--reveal-i:1] md:flex-row md:gap-[0.177em]"
      >
        <span className="whitespace-pre">
          You want<span className="hidden md:inline"> the</span>
        </span>
        <span className="flex items-center gap-2.5 md:gap-[0.177em]">
          <span className="md:hidden">the</span>
          {videoTile}
          <span>video,</span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className="hero-in flex flex-col items-center [--reveal-i:2] md:flex-row md:gap-[0.177em]"
      >
        <span className="flex items-center gap-2.5 md:gap-[0.177em]">
          <span className="whitespace-pre">not the</span>
          {aeTile}
        </span>
        <span className="text-title-muted">ordeal</span>
      </span>
    </h1>
  );
}
