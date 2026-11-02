import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pills laid over a hero frame: a light lead pill, glassy ones after it. */
export function HeroPill({
  lead,
  children,
}: {
  lead?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-8 items-center rounded-[10px] px-3 text-caption leading-4",
        lead ? "bg-white text-[#0e1012]" : "bg-white/16 text-white",
      )}
    >
      {children}
    </span>
  );
}

/** Small dark label in a hero corner (file names, timecodes, frame counts). */
export function HeroTag({
  mono,
  className,
  children,
}: {
  mono?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-7 items-center rounded-tile bg-[#0e101273] px-[9px] text-mono leading-4 text-[#fafafa] sm:px-2.5",
        mono ? "font-mono" : "font-sans",
        className,
      )}
    >
      {children}
    </span>
  );
}
