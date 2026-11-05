"use client";

import { useCallback } from "react";
import type { Reel } from "../../lib/reel-types";
import { ClipList } from "./clip-list";
import { Inspector } from "./inspector";
import { Monitor } from "./monitor";
import { Timeline } from "./timeline";
import { useReelPlayer } from "./use-reel-player";

/**
 * The showcases editor: monitor and inspector over the reel timeline, and
 * the clip list under it. All clips play back to back through one player.
 */
export function ShowcaseReel({ reel }: { reel: Reel }) {
  const player = useReelPlayer(reel.clips);
  const number = String(player.index + 1).padStart(2, "0");
  const { select } = player;

  // Cueing from the list brings the editor back into view.
  const cueFromList = useCallback(
    (index: number) => {
      select(index);
      document.getElementById("reel-editor")?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    },
    [select],
  );

  return (
    <>
      <section
        id="reel-editor"
        aria-label="Showcase reel"
        className="landing-container scroll-mt-6"
      >
        <div className="flex flex-col gap-3 rounded-panel bg-dark-surface p-2.5 md:gap-6 md:p-6 xl:rounded-shell dark:bg-surface dark:shadow-[0_0_0_1px_var(--hairline)]">
          <div className="flex flex-col gap-3 md:gap-6 xl:flex-row">
            <Monitor
              clip={player.clip}
              number={number}
              time={player.time}
              videoRef={player.videoRef}
              videoProps={player.videoProps}
              onToggle={player.toggle}
            />
            <Inspector
              clip={player.clip}
              number={number}
              count={reel.clips.length}
            />
          </div>
          <Timeline
            reel={reel}
            index={player.index}
            reelTime={player.reelTime}
            playing={player.playing}
            onToggle={player.toggle}
            onSelect={select}
            onSeek={player.seek}
          />
        </div>
      </section>

      <ClipList
        clips={reel.clips}
        index={player.index}
        onSelect={cueFromList}
      />
    </>
  );
}
