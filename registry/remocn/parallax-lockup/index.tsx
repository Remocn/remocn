"use client";

import { loadVariableFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Variable cut, so display sizes pick up the tight, ink-trapped optical size. */
const display = loadVariableFont("normal", { subsets: ["latin"] });

export interface ParallaxLockupProps {
  /**
   * The statement, one string per line. Each line is sized so all lines end
   * flush on both sides; shorter lines come out bigger. Three lines of
   * falling length read best.
   */
  lines?: string[];
  /** Index of the line that lands in the gradient fill. -1 for none. */
  accentLine?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Beat sheet (30fps):
//  0–8     lines already crossing the frame, cropped by its edges
//  0–94    one scroll: lines slide in alternate directions, each at its own
//          parallax rate (bigger type travels further, so it moves faster,
//          both across and up), so the leading closes as they lock on the
//          same frame
//  80–98   the accent line takes its gradient as the block locks
//  94–150  poster: a solid justified block, slow push
const SCROLL_END = 94;
const ACCENT_AT = 80;
const ACCENT_END = 98;

const SCROLL = Easing.bezier(0.3, 0.42, 0.1, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const WEIGHT = 500;
const PROBE = 200;
/** Display tracking, in em. */
const TRACK = -0.035;

/**
 * The accent line fills with the gradients.sh "fluted" palette: the accent
 * blue running into ember and cream on dark, deeper stops on light. Blue and
 * ember are near-complements and go grey when mixed in sRGB, so the hand-off
 * runs through their OKLCH midpoint instead.
 */
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F4F0",
    fluted: (accent: string): [string, number][] => [
      [accent, 0],
      ["#2F7BFF", 0.28],
      ["#D65FC9", 0.5],
      ["#FF7A3D", 0.72],
      ["#FFE2C4", 1],
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    fluted: (accent: string): [string, number][] => [
      ["#1D2A8F", 0],
      [accent, 0.28],
      ["#C841B4", 0.52],
      ["#E8622B", 0.76],
      ["#FF7A3D", 1],
    ],
  },
} as const;

/** Ink box of one line, in em at font-size 1, relative to the text origin. */
interface LineInk {
  left: number;
  right: number;
  ascent: number;
  descent: number;
}

function measure(lines: string[]): LineInk[] {
  const ctx = document.createElement("canvas").getContext("2d");
  return lines.map((text) => {
    const n = [...text].length;
    if (!ctx) {
      return { left: 0, right: n * 0.56, ascent: 0.73, descent: 0 };
    }
    ctx.font = `${WEIGHT} ${PROBE}px "${display.fontFamily}"`;
    const m = ctx.measureText(text);
    return {
      left: -m.actualBoundingBoxLeft / PROBE,
      // tracking shifts every glyph after the first
      right: m.actualBoundingBoxRight / PROBE + TRACK * (n - 1),
      ascent: m.actualBoundingBoxAscent / PROBE,
      descent: Math.max(0, m.actualBoundingBoxDescent / PROBE),
    };
  });
}

function useInk(lines: string[]) {
  const [ink, setInk] = useState<LineInk[] | null>(null);
  const [handle] = useState(() =>
    delayRender("parallax-lockup: measuring lines"),
  );
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    Promise.all([
      display.waitUntilDone(),
      document.fonts.load(`${WEIGHT} ${PROBE}px "${display.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setInk(measure(lines));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [lines, handle]);

  return ink;
}

export function ParallaxLockup({
  lines = ["Every launch", "deserves", "a film"],
  accentLine = 2,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ParallaxLockupProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const key = lines.join("\n");
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on content
  const stable = useMemo(() => lines, [key]);
  const ink = useInk(stable);

  const layout = useMemo(() => {
    if (!ink) return null;
    // Size every line to one ink width, then fit the block to the frame.
    const widths = ink.map((l) => Math.max(0.1, l.right - l.left));
    const unit = (block: number) => {
      const sizes = widths.map((w) => block / w);
      const gap = block * 0.042;
      const tops: number[] = [];
      const bases: number[] = [];
      let y = 0;
      sizes.forEach((s, i) => {
        if (i > 0) {
          const prev = sizes[i - 1];
          y += Math.max(gap, ink[i - 1].descent * prev + gap * 0.4);
        }
        tops.push(y);
        y += ink[i].ascent * s;
        bases.push(y);
      });
      return { sizes, tops, bases, height: y };
    };
    let block = W * 0.6;
    const probe = unit(block);
    const maxH = H * 0.74;
    if (probe.height > maxH) block *= maxH / probe.height;
    const set = unit(block);
    const left = (W - block) / 2;
    const top = (H - set.height) / 2;
    const maxSize = Math.max(...set.sizes);
    return {
      lines: set.sizes.map((s, i) => ({
        size: s,
        x: left - ink[i].left * s,
        y: top + set.bases[i],
        rate: s / maxSize,
      })),
    };
  }, [ink, W, H]);

  const scroll = interpolate(frame, [0, SCROLL_END], [0, 1], {
    ...CLAMP,
    easing: SCROLL,
  });
  const rest = 1 - scroll;
  const rise = H * 0.05 * rest;
  const push = interpolate(frame, [SCROLL_END - 30, 150], [1, 1.018], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const accentIn = interpolate(frame, [ACCENT_AT, ACCENT_END], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, overflow: "hidden" }}>
      {layout ? (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 50%",
          }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`f${uid}`}
              x1="0"
              y1="0.2"
              x2="1"
              y2={0.8 + Math.sin(frame / 40) * 0.15}
            >
              {c.fluted(accent).map(([col, offset]) => (
                <stop
                  key={offset}
                  offset={offset}
                  stopColor={interpolateColors(accentIn, [0, 1], [c.fg, col])}
                />
              ))}
            </linearGradient>
          </defs>
          {layout.lines.map((l, i) => {
            const dir = i % 2 === 0 ? 1 : -1;
            const travel = dir * W * 0.66 * l.rate * rest;
            const color = i === accentLine ? `url(#f${uid})` : c.fg;
            return (
              <text
                key={`${i}-${stable[i]}`}
                x={l.x + travel}
                // nearer (bigger) lines also climb further: the leading
                // closes as the scroll lands
                y={l.y + rise + H * 0.09 * l.rate * rest}
                fill={color}
                style={{
                  fontFamily: display.fontFamily,
                  fontWeight: WEIGHT,
                  fontSize: l.size,
                  letterSpacing: `${TRACK}em`,
                }}
              >
                {stable[i]}
              </text>
            );
          })}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
}
