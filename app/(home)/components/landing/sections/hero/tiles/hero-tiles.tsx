"use client";

import { cn } from "@/lib/utils";
import { AfterEffectsMark } from "./ae-mark";
import { aeDuration, type HeroTilesConfig, resolveReel } from "./config";
import saved from "./hero-tiles.json";
import { TilePlayer } from "./tile-player";

const config = saved as HeroTilesConfig;
const reel = resolveReel(config);
const firstClip = reel.clips[0];

const loadVideoTile = () =>
  import("./video-tile").then((m) => ({ default: m.VideoTileComposition }));
const loadAeTile = () =>
  import("./ae-tile").then((m) => ({ default: m.AeTileComposition }));

const PLACEHOLDER = "absolute inset-0 block [transform-origin:50%_50%]";

export function HeroVideoTile({ className }: { className?: string }) {
  return (
    <TilePlayer
      lazyComponent={loadVideoTile}
      config={config}
      durationInFrames={reel.durationInFrames}
      stillFrame={Math.round(config.video.beat * 0.7)}
      className={className}
      placeholder={
        <span
          className={cn(
            PLACEHOLDER,
            "shadow-[0_1px_2px_#0E10120F,0_5px_10px_#0E101214,0_11px_22px_#0E101214]",
          )}
          style={{
            background: firstClip.background,
            borderRadius: `${firstClip.radius * 100}%`,
            transform: `rotate(${config.video.tilt}deg)`,
          }}
        />
      }
    />
  );
}

export function HeroAeTile({ className }: { className?: string }) {
  return (
    <TilePlayer
      lazyComponent={loadAeTile}
      config={config}
      durationInFrames={aeDuration(config)}
      stillFrame={Math.round(aeDuration(config) * 0.5)}
      className={className}
      placeholder={
        <span
          className={cn(PLACEHOLDER, "overflow-clip rounded-[18%]")}
          style={{ transform: `rotate(${config.ae.tilt}deg)` }}
        >
          <AfterEffectsMark className="block size-full" />
        </span>
      }
    />
  );
}
