import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";

/** The launch video's beats, weighted by their length on screen. */
const BEATS: { label: string; weight: number }[] = [
  { label: "Pain", weight: 76 },
  { label: "Reveal", weight: 57 },
  { label: "Tagline", weight: 57 },
  { label: "Positioning", weight: 86 },
  { label: "Montage", weight: 145 },
  { label: "Value", weight: 95 },
  { label: "Install", weight: 76 },
  { label: "Outro", weight: 76 },
];

/** Bar heights (px) of the music bed; the last eight are the fade-out. */
const WAVE = [
  6, 16, 30, 28, 25, 16, 11, 21, 19, 24, 15, 8, 10, 18, 19, 28, 37, 38, 28, 21,
  29, 23, 36, 28, 19, 10, 7, 14, 14, 26, 30, 24, 22, 15, 18, 28, 39, 36, 28, 22,
  14, 12, 23, 26, 21, 21, 14, 17, 20, 24, 40, 32, 32, 29, 17, 22, 21, 32, 31,
  22, 17, 6, 14, 21, 28, 30, 32, 29, 21, 27, 26, 39, 37, 33, 22, 10, 12, 20, 18,
  24, 16, 11, 10, 24, 25, 34, 36, 37, 25, 22, 20, 17, 14, 12, 9, 6,
];
const FADE_FROM = WAVE.length - 8;

const RULER = [
  { label: "0 s", span: 10 },
  { label: "10 s", span: 10 },
  { label: "20 s", span: 10 },
  { label: "30 s", span: 5 },
];

/** A video track with one music bed underneath it, fading over the outro. */
export function GuideMusicTimeline() {
  return (
    <figure
      className={cn(
        "not-prose mt-6 flex flex-col gap-2.5 rounded-card px-4 pt-[18px] pb-5 sm:px-5",
        guideCard,
      )}
    >
      <figcaption className="flex flex-col gap-0.5 pb-1.5 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="text-[15px] leading-5 font-medium text-foreground">
          Same video, one track underneath
        </span>
        <span className="text-caption text-muted-foreground">
          Launch video, about 35 s
        </span>
      </figcaption>

      <div
        aria-hidden="true"
        className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0"
      >
        <div className="flex min-w-[560px] flex-col gap-2.5">
          <div className="flex text-mono text-subtle">
            {RULER.map((mark) => (
              <span
                key={mark.label}
                style={{ flexGrow: mark.span }}
                className="basis-0"
              >
                {mark.label}
              </span>
            ))}
            <span>35 s</span>
          </div>
          <div className="flex gap-1">
            {BEATS.map((beat) => (
              <span
                key={beat.label}
                style={{ flexGrow: beat.weight }}
                className="flex h-11 basis-0 items-center overflow-hidden rounded-tile bg-[#141318] px-2 text-mono whitespace-nowrap text-[#F4F2EC] dark:bg-secondary dark:text-foreground"
              >
                {beat.label}
              </span>
            ))}
          </div>
          <div className="flex h-[60px] items-center gap-[2px] rounded-tile bg-surface-muted px-3">
            {WAVE.map((height, index) => (
              <span
                key={index}
                style={{ height }}
                className={cn(
                  "max-w-[5px] min-w-0 grow basis-0 rounded-[3px]",
                  index < FADE_FROM ? "bg-foreground" : "bg-subtle-line",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1 text-caption leading-[18px] text-body sm:flex-row sm:items-start sm:justify-between">
        <span className="flex items-start gap-2">
          <span className="mt-1 size-2.5 shrink-0 rounded-[3px] bg-foreground" />
          Music bed under the whole video, quiet enough to never compete
        </span>
        <span className="flex shrink-0 items-start gap-2">
          <span className="mt-1 size-2.5 shrink-0 rounded-[3px] bg-subtle-line" />
          Fades out over the outro
        </span>
      </div>
    </figure>
  );
}
