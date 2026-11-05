import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FilmIcon, guidePanel } from "./guide-ui";

export type PreviewFrame =
  | { line: string }
  | { name: string; sub?: string }
  | { big: string }
  | { logo: string }
  | { screen: string };

export type PreviewBeat = {
  label: string;
  seconds: number;
  frame: PreviewFrame;
};

const SPROCKETS: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgb(255 255 255 / 12%) 0 10px, transparent 10px 23px)",
};

/**
 * Hero for guides without a finished video: the beats laid out as a film
 * strip on the dark stage, with the same bar as the player underneath.
 */
export function GuideStoryboardPreview({
  beats,
  fps = 30,
}: {
  beats: PreviewBeat[];
  fps?: number;
}) {
  const total = beats.reduce((sum, beat) => sum + beat.seconds, 0);

  return (
    <div
      className={cn(
        "not-prose mt-6 flex flex-col gap-2 rounded-card p-2",
        guidePanel,
      )}
    >
      <div
        className="relative flex flex-col justify-center overflow-hidden rounded-control-sm bg-[#141318] pt-[60px] pb-6 sm:aspect-video sm:py-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 42%, #2A2238 0%, #141318 62%)",
        }}
      >
        <span className="absolute top-[18px] left-5 flex h-7 items-center gap-2 rounded-[9px] bg-white/6 px-2.5 text-caption text-[#F5F4F0]">
          <FilmIcon size={13} />
          Storyboard preview
        </span>
        <div className="overflow-x-auto">
          <div className="mx-auto flex w-max min-w-full flex-col sm:w-full">
            <div className="flex flex-col gap-2 bg-[#0B0A0E] px-[18px] py-3">
              <span
                aria-hidden="true"
                className="mx-1 h-[7px]"
                style={SPROCKETS}
              />
              <span className="flex justify-center gap-2.5">
                {beats.map((beat) => (
                  <Frame key={beat.label} frame={beat.frame} />
                ))}
              </span>
              <span
                aria-hidden="true"
                className="mx-1 h-[7px]"
                style={SPROCKETS}
              />
            </div>
            <div className="flex justify-center gap-2.5 px-[18px] pt-3.5">
              {beats.map((beat, index) => (
                <span
                  key={beat.label}
                  className="flex w-[124px] min-w-0 shrink-0 flex-col gap-0.5 text-mono sm:shrink"
                >
                  <span className="flex gap-1.5">
                    <span className="text-white/55">{index + 1}</span>
                    <span className="font-medium text-[#F5F4F0]">
                      {beat.label}
                    </span>
                  </span>
                  <span className="pl-[13px] text-white/55">
                    ~{beat.seconds} s
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-1.5 sm:flex-nowrap">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control-sm bg-dark-raised text-[#F5F4F0]">
          <FilmIcon size={15} />
        </span>
        <span className="shrink-0 text-caption text-[#fafafa] tabular-nums">
          {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
        </span>
        <span className="ml-auto shrink-0 text-caption text-dark-subtle sm:order-last sm:ml-0">
          {total * fps} frames, {fps} fps
        </span>
        <span
          aria-hidden="true"
          className="order-last flex h-10 basis-full gap-[3px] rounded-control-sm bg-dark-raised p-1 sm:order-none sm:grow sm:basis-0"
        >
          {beats.map((beat, index) => (
            <span
              key={beat.label}
              style={{ flexGrow: beat.seconds }}
              className="flex basis-0 items-center rounded-tile bg-white/8 pl-2.5 text-mono text-dark-subtle"
            >
              {index + 1}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function Frame({ frame }: { frame: PreviewFrame }): ReactNode {
  const box =
    "flex h-[70px] w-[124px] min-w-0 shrink-0 sm:shrink flex-col items-center justify-center rounded-[4px] bg-[#19181E] p-2 text-center text-[#F5F4F0]";

  if ("line" in frame) {
    return (
      <span className={cn(box, "text-micro font-medium text-[#EDEBE6]")}>
        {frame.line}
      </span>
    );
  }
  if ("name" in frame) {
    return (
      <span
        className={cn(box, "gap-[3px] p-1.5")}
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, #7C5CC466 0%, #19181E00 55%), radial-gradient(circle at 78% 80%, #C6F43233 0%, #19181E00 45%)",
        }}
      >
        <span className="text-[18px] leading-5 font-semibold tracking-[-0.03em]">
          {frame.name}
        </span>
        {frame.sub && (
          <span className="text-[7px] leading-[9px] text-[#EDEBE6]/70">
            {frame.sub}
          </span>
        )}
      </span>
    );
  }
  if ("screen" in frame) {
    return (
      <span className={cn(box, "items-stretch gap-1 p-2.5")}>
        <span className="flex grow flex-col gap-1 rounded-[3px] bg-[#EDEBE6]/10 p-1.5">
          <span className="h-[3px] w-1/2 rounded-[2px] bg-[#EDEBE6]/60" />
          <span className="h-[3px] w-3/4 rounded-[2px] bg-[#EDEBE6]/30" />
          <span className="mt-auto h-1.5 w-1/4 self-end rounded-[2px] bg-[#D4F25C]" />
        </span>
        <span className="truncate text-[9px] leading-[11px] text-[#EDEBE6]/70">
          {frame.screen}
        </span>
      </span>
    );
  }
  if ("big" in frame) {
    return (
      <span
        className={cn(
          box,
          "text-[18px] leading-5 font-semibold tracking-[-0.03em]",
        )}
      >
        {frame.big}
      </span>
    );
  }
  return (
    <span className={cn(box, "gap-[5px]")}>
      <svg width="22" height="23" viewBox="0 0 16 17" aria-hidden="true">
        <rect
          x="1"
          y="1"
          width="14"
          height="15"
          rx="4"
          fill="none"
          stroke="#F5F4F0"
          strokeWidth="1.6"
        />
        <path
          d="M5.5 12.5V5h3a2.2 2.2 0 0 1 0 4.4h-3M8.5 9.4l2.4 3.1"
          fill="none"
          stroke="#F5F4F0"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[9px] leading-[11px] text-[#EDEBE6]/70">
        {frame.logo}
      </span>
    </span>
  );
}
