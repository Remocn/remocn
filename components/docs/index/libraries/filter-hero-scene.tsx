"use client";

import { AbsoluteFill } from "remotion";
import { VhsFilter } from "@/registry/remocn/vhs-filter";
import { PhotoScene } from "./filter-photo-scenes";

/**
 * Before/after composition: the raw photo, with the filtered photo revealed
 * right of `split` (a 0–1 fraction of the width).
 */
export function FilterSplitScene({ split }: { split: number }) {
  return (
    <AbsoluteFill>
      <PhotoScene />
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}>
        <VhsFilter>
          <PhotoScene />
        </VhsFilter>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
