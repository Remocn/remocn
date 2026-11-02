import type { RefObject, SyntheticEvent } from "react";
import { formatDuration } from "@/lib/video-duration";
import type { ReelClip } from "../../lib/reel-types";

/** The selected clip on screen, with its position in the reel. */
export function Monitor({
  clip,
  number,
  time,
  videoRef,
  videoProps,
  onToggle,
}: {
  clip: ReelClip;
  number: string;
  time: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoProps: {
    onLoadedMetadata: () => void;
    onEnded: () => void;
    onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => void;
  };
  onToggle: () => void;
}) {
  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[14px] bg-dark-raised md:rounded-cta xl:h-[405px] xl:w-[720px]">
      <video
        ref={videoRef}
        src={clip.video}
        poster={clip.poster}
        aria-label={clip.title}
        playsInline
        preload="metadata"
        onClick={onToggle}
        className="size-full cursor-pointer object-cover"
        {...videoProps}
      />
      <span className="pointer-events-none absolute top-2.5 left-2.5 flex h-6 items-center gap-1.5 rounded-tag bg-[#0e1012b8] px-2 text-caption text-[#fafafa] tabular-nums md:top-3 md:left-3">
        <span className="size-1.5 rounded-full bg-primary-bright" />
        clip {number}, {formatDuration(time)} / {formatDuration(clip.duration)}
      </span>
    </div>
  );
}
