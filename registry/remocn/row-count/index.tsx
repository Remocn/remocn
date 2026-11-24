"use client";

import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type RowCountElementId, rowCountTimeline } from "./timeline";

const plex = loadPlexSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface RowCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  label?: string;
  accent?: string;
  /** Color of the digits and top rule; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the digits and label. Load it yourself; IBM Plex Sans by default. */
  fontFamily?: string;
  /** Frames the count takes to reach `value`. */
  countLength?: number;
  /** Size of the stack and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the rule, the first row, the label and the
   * count, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<RowCountElementId>;
}

const THEMES = {
  dark: {
    bg: "#0F1B2D",
    ink: "#F3F5F8",
    muted: "#93A1B5",
    comma: "#4D5D75",
    rule: "rgba(243, 245, 248, 0.22)",
    accent: "#FF9900",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0F1B2D",
    muted: "#5A677A",
    comma: "#B5BDC9",
    rule: "rgba(15, 27, 45, 0.2)",
    accent: "#C76A00",
  },
} as const;

const FIG = 0.6;
const COMMA = 0.26;
const ROW = 1.0;
const TRACK = -0.02;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.3, 0.1, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function groups(n: number): string[] {
  const s = String(Math.max(0, Math.floor(n)));
  const out: string[] = [];
  for (let end = s.length; end > 0; end -= 3) {
    out.unshift(s.slice(Math.max(0, end - 3), end));
  }
  return out;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function RowCount(props: RowCountProps) {
  const {
    value = 27300000,
    from = 1,
    prefix = "",
    label = "frames rendered in every region, every night",
    accent,
    ink,
    background,
    fontFamily = plex.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    rowCountTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const count = tl.get("count");
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const target = Math.max(1, Math.floor(value));
  const start = Math.min(target, Math.max(1, Math.floor(from)));
  const finalRows = groups(target).length;

  const p = interpolate(t, [count.start, count.end], [0, 1], {
    ...CLAMP,
    easing: EASE_COUNT,
  });
  const live =
    p >= 1
      ? target
      : Math.floor(start * (target / start) ** Math.min(1, Math.max(0, p)));
  const g = groups(live);
  const rows = g.length;

  const rowBorn = useMemo(() => {
    const born: number[] = [];
    for (let k = 0; k < finalRows; k++) {
      const thresh = 1000 ** k;
      if (thresh <= start) {
        born.push(-100);
        continue;
      }
      let lo = count.start;
      let hi = count.end;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        const pm = interpolate(mid, [count.start, count.end], [0, 1], {
          ...CLAMP,
          easing: EASE_COUNT,
        });
        const v = start * (target / start) ** pm;
        if (v >= thresh) hi = mid;
        else lo = mid;
      }
      born.push(hi);
    }
    return born;
  }, [finalRows, start, target, count]);

  const shift = (k: number, at = t) => {
    let s = 0;
    for (let j = k + 1; j < finalRows; j++) {
      s += spring({
        frame: at - rowBorn[j] + count.beat("pushLead"),
        fps,
        config: { damping: 16, stiffness: 140, mass: 0.8 },
      });
    }
    return s;
  };
  let rowsAnim = 1;
  for (let k = 1; k < finalRows; k++) {
    rowsAnim += spring({
      frame: t - rowBorn[k] + count.beat("pushLead"),
      fps,
      config: { damping: 16, stiffness: 140, mass: 0.8 },
    });
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * 0.09;
  const prefixW = prefix ? Array.from(prefix).length * FIG : 0;
  const colW = prefixW + 3 * FIG + 2 * TRACK;
  const labelSize = label
    ? portrait
      ? Math.min(W * 0.06, H * 0.034)
      : Math.min(H * 0.042, W * 0.026)
    : 0;
  const labelW = portrait ? W - margin * 2 : W * 0.34;
  const labelBlock = portrait && label ? labelSize * 1.3 * 3 + margin * 0.6 : 0;
  const ruleY = margin;
  const avail = H - margin * 2 - labelBlock - margin * 0.3;
  const F = Math.min(
    avail / (Math.max(2, finalRows) * ROW),
    (W * (portrait ? 0.74 : 0.5)) / (colW + COMMA),
    H * 0.3,
  );
  const rowH = F * ROW;
  const colRight = W - margin - COMMA * F;
  const firstTop = ruleY + labelBlock + margin * 0.3;

  const ruleEl = tl.get("rule");
  const enterEl = tl.get("enter");
  const labelEl0 = tl.get("label");
  const ruleP = interpolate(t, [ruleEl.start, ruleEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const enter = interpolate(t, [enterEl.start, enterEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelP = interpolate(t, [labelEl0.start, labelEl0.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const rowEls = g.map((grp, idx) => {
    const k = rows - 1 - idx;
    const born = interpolate(
      t,
      [rowBorn[k], rowBorn[k] + count.beat("rise")],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const isNew = k === 0 ? enter : born;
    // A row pushed down by the rows born above it is laid out in its final
    // slot and travels there by transform all its life: layout rounds a box
    // and a baseline to whole pixels, so a row eased by `top` clicks down
    // pixel by pixel, and handing it back to layout when it settles snaps it
    // by that rounding.
    const slot = firstTop + (finalRows - 1 - k) * rowH;
    const pushAt = (f: number) => {
      const dy = (shift(k, f) - (finalRows - 1 - k)) * rowH;
      return Math.abs(dy) > 1e-3 ? dy : 0;
    };
    const dy = pushAt(t);
    const pushing = pushAt(t + 1) !== dy || pushAt(t - 1) !== dy;
    const topness = Math.max(0, 1 - Math.abs(rowsAnim - 1 - k));
    const text = (k === rows - 1 ? prefix : "") + grp;
    const comma = k > 0;
    return (
      <div key={`r${k}`}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: slot,
            height: rowH,
            overflow: "hidden",
            transform: `translateY(${dy}px)${glide(pushing)}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: W - colRight,
              // The rise into the row is a transform for the same reason.
              top: 0,
              transform: `translateY(${(isNew - 1) * rowH}px)${glide(midway(isNew))}`,
              height: rowH,
              display: "flex",
              alignItems: "baseline",
              fontFamily,
              fontWeight: 500,
              fontSize: F,
              lineHeight: `${rowH}px`,
              letterSpacing: `${TRACK}em`,
              fontFeatureSettings: '"tnum" 1, "lnum" 1',
              whiteSpace: "pre",
            }}
          >
            <span style={{ position: "relative", color: fg }}>
              {text}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: topness,
                  color: accent ?? c.accent,
                }}
              >
                {text}
              </span>
            </span>
            {comma ? (
              <span
                style={{
                  position: "absolute",
                  left: "100%",
                  color: c.comma,
                  letterSpacing: 0,
                }}
              >
                ,
              </span>
            ) : null}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: margin + (W - margin * 2) * (1 - isNew),
            right: margin,
            top: slot + rowH,
            transform: dy !== 0 ? `translateY(${dy}px)` : undefined,
            height: 1,
            background: c.rule,
          }}
        />
      </div>
    );
  });

  const labelEl = label ? (
    <div
      style={{
        position: "absolute",
        left: margin,
        width: labelW,
        top: ruleY + labelSize * 0.9,
        height: labelSize * 1.3 * 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 400,
          fontSize: labelSize,
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
          color: c.muted,
          textWrap: "balance",
          transform: `translateY(${(1 - labelP) * labelSize * 4}px)${glide(midway(labelP))}`,
        }}
      >
        {label}
      </div>
    </div>
  ) : null;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: margin,
            top: ruleY,
            width: (W - margin * 2) * ruleP,
            height: Math.max(2, H * 0.003),
            background: fg,
          }}
        />
        {rowEls}
        {labelEl}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
