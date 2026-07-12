import { Player } from "@remotion/player";
import { Pause, Play } from "lucide-react";
import type { RegistryEntry } from "@/registry/__index__";
import { usePlayerControls } from "../hooks/use-player-controls";
import { dims } from "../lib/dims";
import type { GitHubStarsInputProps, Orientation } from "../lib/types";

export function PlayerFrame({
  entry,
  inputProps,
  orientation,
  reduced: _reduced,
}: {
  entry: RegistryEntry;
  inputProps: GitHubStarsInputProps;
  orientation: Orientation;
  reduced: boolean;
}) {
  const { ref, playing, togglePlay } = usePlayerControls(true);
  const { width, height } = dims(orientation);

  return (
    // Player card — a fixed 16:9 frame so toggling orientation never reflows
    // the page. Vertical renders pillarboxed + centered inside it, while the
    // Player still gets the true 720×1280 composition so the exported MP4 is
    // genuinely vertical (only the on-page container width stays constant).
    <div
      className="group surface-card relative w-full overflow-hidden rounded-2xl sm:rounded-3xl"
      style={{ aspectRatio: "1280 / 720" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="h-full"
          style={
            orientation === "vertical"
              ? {
                  height: "100%",
                  width: "auto",
                  aspectRatio: `${width} / ${height}`,
                }
              : { width: "100%", height: "100%" }
          }
        >
          <Player
            ref={ref}
            lazyComponent={entry.load}
            inputProps={inputProps}
            durationInFrames={entry.config.durationInFrames}
            fps={entry.config.fps}
            compositionWidth={width}
            compositionHeight={height}
            style={{ width: "100%", height: "100%", display: "block" }}
            loop
            acknowledgeRemotionLicense
          />
        </div>
      </div>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause preview" : "Play preview"}
        className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span
          aria-hidden
          data-show={!playing}
          className="pointer-events-none flex size-14 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none data-[show=true]:opacity-100"
        >
          {playing ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 translate-x-0.5" />
          )}
        </span>
      </button>
    </div>
  );
}
