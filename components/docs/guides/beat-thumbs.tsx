import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny frames that hint at what each beat looks like. Always dark, like the
 * videos themselves (#141318 is the recipes' default background).
 */
export type BeatLook =
  | "lines"
  | "swirl"
  | "slide"
  | "words"
  | "montage"
  | "stack"
  | "terminal"
  | "logo"
  | "line"
  | "tease"
  | "reveal"
  | "date"
  | "screen"
  | "number";

const bar = "h-1 shrink-0 rounded-[2px]";
const ink = "bg-[#EDEBE6]";
const MONTAGE: CSSProperties["backgroundImage"][] = [
  "linear-gradient(180deg, #3B2F5C, #141318)",
  "linear-gradient(160deg, #1F4E5A, #141318)",
  "linear-gradient(200deg, #5A2D4E, #2A1F3D)",
  "linear-gradient(180deg, #2E3A1E, #141318)",
  "linear-gradient(140deg, #4A3A6E, #1C1A2A)",
  "linear-gradient(180deg, #6B5A3A, #141318)",
];

export function BeatThumb({ look }: { look: BeatLook }) {
  const frame =
    "flex h-[58px] shrink-0 items-center justify-center overflow-hidden rounded-tile bg-[#141318]";

  switch (look) {
    case "lines":
      return (
        <div className={cn(frame, "flex-col gap-[5px]")}>
          <span className={cn(bar, ink, "w-[34px]")} />
          <span className={cn(bar, "w-6 bg-[#EDEBE6]/50")} />
        </div>
      );
    case "swirl":
      return (
        <div className={frame}>
          <span
            className="size-[30px] rounded-full"
            style={{
              backgroundImage:
                "conic-gradient(from 40deg, #C6F43280, #7C5CC4 33%, #141318 67%, #C6F43280)",
            }}
          />
        </div>
      );
    case "slide":
      return (
        <div className={cn(frame, "gap-[3px]")}>
          <span className={cn(bar, "w-1.5 bg-[#EDEBE6]/20")} />
          <span className={cn(bar, ink, "w-[30px]")} />
        </div>
      );
    case "words":
      return (
        <div className={cn(frame, "gap-1")}>
          <span className={cn(bar, ink, "w-2.5")} />
          <span className={cn(bar, ink, "w-1.5")} />
          <span className={cn(bar, ink, "w-3.5")} />
          <span className={cn(bar, "w-2.5 bg-[#EDEBE6]/40")} />
        </div>
      );
    case "montage":
      return (
        <div className={cn(frame, "items-stretch justify-start gap-0.5")}>
          {MONTAGE.map((backgroundImage) => (
            <span
              key={String(backgroundImage)}
              className="grow basis-0"
              style={{ backgroundImage }}
            />
          ))}
        </div>
      );
    case "stack":
      return (
        <div className={cn(frame, "flex-col items-start gap-[5px] pl-[22px]")}>
          <span className={cn(bar, ink, "w-10")} />
          <span className={cn(bar, ink, "w-[30px]")} />
          <span className={cn(bar, "w-9 bg-[#EDEBE6]/40")} />
        </div>
      );
    case "terminal":
      return (
        <div className={cn(frame, "gap-1")}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="m6 6 7 6-7 6"
              fill="none"
              stroke="#EDEBE699"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={cn(bar, ink, "w-[34px]")} />
          <span className="h-3 w-1.5 shrink-0 rounded-[1px] bg-[#D4F25C]" />
        </div>
      );
    case "logo":
      return (
        <div
          className={cn(frame, "flex-col gap-1.5")}
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 45%, #7C5CC455 0%, #14131800 60%)",
          }}
        >
          <span className="size-4 shrink-0 rounded-[5px] border-2 border-[#EDEBE6]" />
          <span className="h-[3px] w-6 shrink-0 rounded-[2px] bg-[#EDEBE6]/50" />
        </div>
      );
    case "line":
      return (
        <div className={frame}>
          <span className={cn(bar, ink, "w-12")} />
        </div>
      );
    case "tease":
      return (
        <div className={cn(frame, "gap-1.5")}>
          <span className={cn(bar, "w-3.5 bg-[#EDEBE6]/20")} />
          <span className={cn(bar, ink, "w-11")} />
        </div>
      );
    case "reveal":
      return (
        <div
          className={cn(frame, "flex-col gap-[5px]")}
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 35%, #7C5CC455 0%, #14131800 50%), radial-gradient(circle at 75% 75%, #C6F43226 0%, #14131800 45%)",
          }}
        >
          <span className="h-2 w-14 shrink-0 rounded-[3px] bg-[#F5F4F0]" />
          <span className="h-[3px] w-10 shrink-0 rounded-[2px] bg-[#EDEBE6]/50" />
        </div>
      );
    case "date":
      return (
        <div className={frame}>
          <span className="h-2.5 w-[52px] shrink-0 rounded-[3px] bg-[#F5F4F0]" />
        </div>
      );
    case "screen":
      return (
        <div className={frame}>
          <span className="flex h-[34px] w-[52px] flex-col gap-1 rounded-[4px] bg-[#EDEBE6]/12 p-1.5">
            <span className="h-[3px] w-6 rounded-[2px] bg-[#EDEBE6]/60" />
            <span className="h-[3px] w-9 rounded-[2px] bg-[#EDEBE6]/30" />
            <span className="mt-auto h-1.5 w-4 self-end rounded-[2px] bg-[#D4F25C]" />
          </span>
        </div>
      );
    case "number":
      return (
        <div className={frame}>
          <span className="text-[20px] leading-none font-semibold tracking-[-0.03em] text-[#F5F4F0]">
            18
          </span>
        </div>
      );
  }
}
