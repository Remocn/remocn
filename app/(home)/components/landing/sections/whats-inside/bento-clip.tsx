"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { CatalogCard } from "../../ui/catalog-card";
import saved from "./bento.json";
import { type BentoClips, type BentoSlot, DEFAULT_BENTO } from "./bento-clips";
import { TypeRemix } from "./type-remix";

export const SAVED_BENTO: BentoClips = {
  ...DEFAULT_BENTO,
  ...(saved as Partial<BentoClips>),
};

export const BentoClipsContext = createContext<BentoClips>(SAVED_BENTO);

export function BentoClip({
  slot,
  className,
}: {
  slot: BentoSlot;
  className?: string;
}) {
  const clips = useContext(BentoClipsContext);
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative overflow-clip", className)}
    >
      <CatalogCard spec={clips[slot]} />
    </div>
  );
}

export function BentoRemix({ className }: { className?: string }) {
  const clips = useContext(BentoClipsContext);
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative overflow-clip", className)}
    >
      <TypeRemix specs={clips.typography} />
    </div>
  );
}
