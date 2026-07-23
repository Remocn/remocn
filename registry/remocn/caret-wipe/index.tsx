"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type CaretWipeProps = {
  /** Sweep direction. `right` types the screen left→right; `left` reverses it. */
  direction?: "left" | "right";
  /** The caret's color — the remocn lime by default. */
  caretColor?: string;
  /** Caret bar width in px. */
  caretWidth?: number;
  /** Caret bar height as a fraction of frame height (0–1), vertically centered. */
  caretHeight?: number;
};

// ---------------------------------------------------------------------------
// caret-wipe — a typographic scene transition.
//
// A single tall caret (the remocn text cursor) sweeps across the frame in one
// eased pass. The caret IS the wipe boundary: the region it has PASSED shows
// the incoming scene (freshly "typed in" — it settles down and un-blurs just
// behind the caret), while the region it has NOT reached still shows the
// outgoing scene (being "backspaced" — it lifts and blurs as it's consumed).
//
// Both scenes share whatever backdrop sits behind the TransitionSeries, so the
// complementary clips never expose a seam. Pure frame-driven interpolate — no
// CSS keyframes — so it seeks correctly and renders identically every time.
// ---------------------------------------------------------------------------
const CaretWipePresentation: React.FC<
  TransitionPresentationComponentProps<CaretWipeProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    direction = "right",
    caretColor = "#C3E88D",
    caretWidth = 3,
    caretHeight = 0.5,
  } = passedProps;

  const entering = presentationDirection === "entering";
  const p = presentationProgress;
  const goingRight = direction === "right";

  // Eased sweep so the caret decelerates as it lands the last column.
  const eased = interpolate(p, [0, 1], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  // Caret position as a percent of frame width; the wipe boundary.
  const caretX = goingRight ? eased * 100 : (1 - eased) * 100;

  if (!entering) {
    // Outgoing: keep only the column the caret hasn't reached yet, and let it
    // lift + blur as it's consumed (backspaced).
    const keep = goingRight
      ? `inset(0 0 0 ${caretX}%)` // keep the right band [caretX, 100]
      : `inset(0 ${100 - caretX}% 0 0)`; // keep the left band [0, caretX]
    return (
      <AbsoluteFill
        style={{
          clipPath: keep,
          WebkitClipPath: keep,
          transform: `translateY(${interpolate(p, [0, 1], [0, -6], clampOpts)}px)`,
          filter: `blur(${interpolate(p, [0.1, 1], [0, 4], clampOpts)}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  // Incoming: reveal only the column the caret has already passed, and let it
  // settle down + sharpen just behind the caret (typed in).
  const reveal = goingRight
    ? `inset(0 ${100 - caretX}% 0 0)` // reveal the left band [0, caretX]
    : `inset(0 0 0 ${caretX}%)`; // reveal the right band [caretX, 100]

  // The caret fades in at the very start and out at the very end so it never
  // pops on/off at the transition's frame edges.
  const caretOpacity = interpolate(
    p,
    [0, 0.08, 0.92, 1],
    [0, 1, 1, 0],
    clampOpts,
  );

  return (
    <AbsoluteFill>
      {/* Freshly typed content, clipped to the passed column. */}
      <AbsoluteFill
        style={{
          clipPath: reveal,
          WebkitClipPath: reveal,
          transform: `translateY(${interpolate(p, [0, 1], [3, 0], clampOpts)}px)`,
          filter: `blur(${interpolate(p, [0, 0.8], [2, 0], clampOpts)}px)`,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* The caret — drawn on top, unclipped, only in the entering pass so it
          appears exactly once. */}
      <AbsoluteFill style={{ pointerEvents: "none", opacity: caretOpacity }}>
        <div
          style={{
            position: "absolute",
            left: `${caretX}%`,
            top: `${(1 - caretHeight) * 50}%`,
            height: `${caretHeight * 100}%`,
            width: caretWidth,
            transform: "translateX(-50%)",
            background: caretColor,
            borderRadius: caretWidth,
            boxShadow: `0 0 18px ${caretColor}, 0 0 6px ${caretColor}`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function caretWipe(
  props: CaretWipeProps = {},
): TransitionPresentation<CaretWipeProps> {
  return {
    component: CaretWipePresentation,
    props,
  };
}
