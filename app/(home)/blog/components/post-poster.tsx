import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import { PlayGlyph } from "../../components/site-page/play-glyph";

/**
 * Poster frame of a post's video with a play key: a plain 36px key on large
 * cards, a key + duration chip on small ones.
 */
export function PostPoster({
  poster,
  duration,
  size,
}: {
  poster: string | null;
  duration: number | null;
  size: "lg" | "sm";
}) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden bg-dark-surface shadow-[0_0_0_1px_var(--hairline)]",
        size === "lg" ? "rounded-card" : "rounded-cta",
      )}
    >
      {poster && (
        // biome-ignore lint/performance/noImgElement: remote CDN video posters of arbitrary origin
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.19,1,0.22,1)] motion-safe:group-hover:scale-[1.015]"
        />
      )}
      {size === "lg" ? (
        <span className="absolute bottom-3.5 left-3.5 flex size-9 items-center justify-center rounded-[10px] bg-[#fafafa]">
          <PlayGlyph />
        </span>
      ) : (
        <span className="absolute bottom-2.5 left-2.5 flex h-8 items-center gap-2 rounded-[10px] bg-[#0e1012b8] pr-2.5 pl-1">
          <span className="flex size-6 items-center justify-center rounded-[7px] bg-[#fafafa]">
            <PlayGlyph className="h-2 w-1.5" />
          </span>
          {duration !== null && (
            <span className="text-caption text-[#fafafa] tabular-nums">
              {formatDuration(duration)}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
