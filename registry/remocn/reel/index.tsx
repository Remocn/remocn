"use client";

import { AbsoluteFill, Easing, Img, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type ReelElementId, reelTimeline } from "./timeline";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const EASE_OUT = Easing.out(Easing.cubic);

export type ReelProps = {
  images: string[];
  width?: number;
  height?: number;
  radius?: number;
  step?: number;
  reveal?: number;
  objectPosition?: string;
  background?: string;
  /**
   * Moves, trims or stretches single image reveals, by the ids in
   * `./timeline`. Frames on the scene timeline.
   */
  timing?: Timing<ReelElementId>;
};

export function Reel(props: ReelProps) {
  const {
    images,
    width = 1180,
    height = 676,
    radius = 16,
    objectPosition = "top",
    background = "#050506",
    timing,
  } = props;
  const frame = useSceneFrame();
  const {
    width: compWidth,
    height: compHeight,
    durationInFrames,
  } = useSceneConfig();
  const tl = useTimeline(reelTimeline, props, durationInFrames, timing);
  const left = (compWidth - width) / 2;
  const top = (compHeight - height) / 2;

  return (
    <AbsoluteFill>
      {images.map((src, i) => {
        const { start, end } = tl.get(`image:${i}`);
        const p = interpolate(frame, [start, end], [0, 1], {
          ...clamp,
          easing: EASE_OUT,
        });
        if (p <= 0) return null;
        const inset = (1 - p) * 50;
        const imgScale = interpolate(p, [0, 1], [1.08, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top,
              width,
              height,
              zIndex: i,
              clipPath: `inset(${inset}% ${inset}% round ${radius}px)`,
              WebkitClipPath: `inset(${inset}% ${inset}% round ${radius}px)`,
              background,
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              willChange: "clip-path",
            }}
          >
            <Img
              src={src}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition,
                scale: `${imgScale}`,
                // A photograph, no text: on its own layer Chrome scales one
                // decoded texture. Without it the resampling quality depends
                // on what the tab drew before, and a render split over
                // several tabs shimmers across the whole picture.
                willChange: "transform",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: radius,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
