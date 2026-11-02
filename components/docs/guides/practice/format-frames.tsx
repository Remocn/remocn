import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shader still used as the hero visual of the example frame. */
const SHADER = "/landing/shader-violet.png";

const title = "font-semibold tracking-[-0.04em] text-[#F4F2EC]";
const accent = "text-[#D4F25C]";

/** The same "Meet remocn" beat as 16:9, 9:16 and 1:1. */
export function GuideFormatFrames() {
  return (
    <ul className="not-prose mt-6 flex flex-wrap items-start gap-4 pt-2 sm:flex-nowrap">
      <Format
        className="basis-full sm:basis-0 sm:grow-[373]"
        label="16:9 horizontal"
        note="YouTube, X, your landing page"
      >
        <div className="flex h-[210px] flex-col justify-center gap-3.5 px-[26px]">
          <span
            className={cn(title, "flex gap-1.5 text-[22px] leading-[26px]")}
          >
            Meet <span className={accent}>remocn</span>
          </span>
          <span className="flex gap-2.5">
            <Still className="h-[88px] max-w-[155px] grow basis-0 rounded-tile" />
            <Lines
              className="h-[88px] max-w-[155px] grow basis-0 gap-1.5 rounded-tile px-3"
              bar="h-1.5"
              widths={[96, 70, 110]}
            />
          </span>
        </div>
      </Format>
      <Format
        className="w-[118px] shrink-0 sm:w-0 sm:grow-[118]"
        label="9:16 vertical"
        note="Reels, Shorts, TikTok"
      >
        <div className="relative flex h-[210px] flex-col items-center justify-center gap-2">
          <span
            className={cn(
              title,
              "flex flex-col items-center text-ui leading-[18px]",
            )}
          >
            Meet <span className={accent}>remocn</span>
          </span>
          <Still className="h-[42px] w-[84px] rounded-tag" />
          <Lines
            className="h-[42px] w-[84px] gap-1 rounded-tag px-[9px]"
            bar="h-1"
            widths={[52, 38, 60]}
          />
          {/* Platform UI covers the top and bottom edges of a vertical video. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[30px] bg-[#F5D0FE]/16"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-9 bg-[#F5D0FE]/16"
          />
        </div>
      </Format>
      <Format
        className="min-w-0 grow basis-0 sm:grow-[210]"
        label="1:1 square"
        note="Some feeds"
      >
        <div className="flex h-[210px] flex-col justify-center gap-3 px-[18px]">
          <span
            className={cn(title, "flex gap-[5px] text-[19px] leading-[22px]")}
          >
            Meet <span className={accent}>remocn</span>
          </span>
          <span className="flex gap-2">
            <Still className="h-16 max-w-[83px] grow basis-0 rounded-[7px]" />
            <Lines
              className="h-16 max-w-[83px] grow basis-0 gap-[5px] rounded-[7px] px-[9px]"
              bar="h-[5px]"
              widths={[52, 38, 60]}
            />
          </span>
        </div>
      </Format>
    </ul>
  );
}

function Format({
  label,
  note,
  className,
  children,
}: {
  label: string;
  note: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={cn("flex flex-col gap-3", className)}>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-cta bg-[#141318] dark:shadow-[0_0_0_1px_var(--color-hairline)]"
      >
        {children}
      </div>
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-small font-medium text-foreground">{label}</span>
        <span className="text-caption leading-[18px] text-muted-foreground">
          {note}
        </span>
      </div>
    </li>
  );
}

function Still({ className }: { className?: string }) {
  return (
    <span
      className={cn("block bg-cover bg-center", className)}
      style={{ backgroundImage: `url(${SHADER})` }}
    />
  );
}

/** Three text lines, the middle one in the accent colour. */
function Lines({
  className,
  bar,
  widths,
}: {
  className?: string;
  bar: string;
  widths: [number, number, number];
}) {
  const tones = ["bg-[#F4F2EC]/70", "bg-[#D4F25C]", "bg-[#F4F2EC]/30"];
  return (
    <span className={cn("flex flex-col justify-center bg-white/7", className)}>
      {widths.map((width, index) => (
        <span
          key={tones[index]}
          className={cn("max-w-full rounded-[3px]", bar, tones[index])}
          style={{ width }}
        />
      ))}
    </span>
  );
}
