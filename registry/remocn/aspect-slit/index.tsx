"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Film-title serif for the hero, its sans sibling for the caption. */
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
const sans = loadSans("normal", { weights: ["400"], subsets: ["latin"] });

export interface AspectSlitProps {
  /** Short title. It first appears inside the slit, then grows to hero size. */
  title?: string;
  /** Small line under the hero title. Pass "" to hide. */
  caption?: string;
  /** Height of the narrowest slit, as a share of the frame height. */
  slit?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Beat sheet (30fps):
//  0–24    letterbox bars close from 16:9 to 2.39:1 (already moving on frame 0)
//  24–32   a beat on scope
//  32–64   the bars keep closing to a thin slit
//  50–74   the title rises into the slit from behind the lower bar; holds,
//          tracking tightening, to 98
//  98–138  bars open back to full frame; the title grows to hero size, never
//          taller than the opening
//  128–150 caption settles under the title; poster hold to 180
const SCOPE_AT = -6;
const SCOPE_END = 24;
const SLIT_AT = 32;
const SLIT_END = 64;
const RISE_AT = 50;
const RISE_END = 74;
const OPEN_AT = 98;
const OPEN_END = 138;
const GROW_AT = 102;
const GROW_END = 146;
const CAPTION_AT = 128;
const CAPTION_END = 150;

/** Bars: a mechanical matte, eased at both ends. */
const BARS = Easing.bezier(0.62, 0, 0.3, 1);
const OPEN = Easing.bezier(0.7, 0, 0.22, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Hero tracking at full size, in em. The serif wants less than a grotesk. */
const HERO_TRACK = -0.022;

interface TitleMetrics {
  /** Cap top and baseline inside a line-height: 1 box, in em. */
  capTop: number;
  baseline: number;
  /** Descender depth below the baseline, in em. */
  descent: number;
  /** Title advance at 1em with hero tracking, in em. */
  width: number;
}

function measureTitle(title: string): TitleMetrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const n = Math.max(1, [...title].length);
  if (!ctx) {
    return { capTop: 0.2, baseline: 0.85, descent: 0.22, width: n * 0.42 };
  }
  ctx.font = `400 200px "${serif.fontFamily}"`;
  const box = ctx.measureText("H");
  const run = ctx.measureText(title);
  const asc = box.fontBoundingBoxAscent / 200;
  const desc = box.fontBoundingBoxDescent / 200;
  const baseline = 0.5 + (asc - desc) / 2;
  return {
    capTop: baseline - box.actualBoundingBoxAscent / 200,
    baseline,
    descent: Math.max(0.12, run.actualBoundingBoxDescent / 200),
    width: run.width / 200 + HERO_TRACK * (n - 1),
  };
}

function useTitleMetrics(title: string) {
  const [metrics, setMetrics] = useState<TitleMetrics | null>(null);
  const [handle] = useState(() => delayRender("aspect-slit: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      serif.waitUntilDone(),
      sans.waitUntilDone(),
      document.fonts.load(`400 100px "${serif.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measureTitle(title));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [title, handle]);
  return metrics;
}

/**
 * The opening is lit by a gradients.sh palette: "mesh" on dark (built on the
 * accent), "pixel-glass" washed onto the off-white stage for light. Blob
 * positions drift a few percent over the shot.
 */
const BLOBS = {
  dark: [
    { color: "#8796EE", x: 16, y: 20, a: 0.9 },
    { color: "#ACCENT", x: 84, y: 26, a: 0.95 },
    { color: "#0E1645", x: 70, y: 96, a: 0.6 },
    { color: "#1D2A8F", x: 22, y: 82, a: 0.85 },
    { color: "#ACCENT", x: 52, y: 48, a: 0.8 },
    { color: "#ECDCF2", x: 92, y: 62, a: 0.55 },
  ],
  light: [
    { color: "#7A3CFF", x: 18, y: 24, a: 0.2 },
    { color: "#FF4FB8", x: 82, y: 30, a: 0.16 },
    { color: "#3D6BFF", x: 66, y: 84, a: 0.22 },
    { color: "#ACCENT", x: 24, y: 82, a: 0.14 },
  ],
} as const;

const THEMES = {
  dark: {
    bars: "#0A0A0B",
    ground: "#2E45B7",
    ink: "#FFFFFF",
    caption: "rgba(255,255,255,0.78)",
    grain: 0.07,
    accentPeriod: false,
  },
  light: {
    bars: "#0A0A0B",
    ground: "#F4F3F1",
    ink: "#111113",
    caption: "#5E5C57",
    grain: 0.05,
    accentPeriod: true,
  },
} as const;

const alpha = (color: string, a: number) =>
  `color-mix(in oklab, ${color} ${Math.round(a * 100)}%, transparent)`;

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function AspectSlit({
  title = "Now showing.",
  caption = "A launch film, built in React.",
  slit = 0.125,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: AspectSlitProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const metrics = useTitleMetrics(title);

  // Bar height per side.
  const scopeBar = Math.max(0, (H - W / 2.39) / 2);
  const slitH = Math.round(H * slit);
  const slitBar = (H - slitH) / 2;
  const toScope = interpolate(frame, [SCOPE_AT, SCOPE_END], [0, 1], {
    ...CLAMP,
    easing: BARS,
  });
  const toSlit = interpolate(frame, [SLIT_AT, SLIT_END], [0, 1], {
    ...CLAMP,
    easing: BARS,
  });
  const open = interpolate(frame, [OPEN_AT, OPEN_END], [0, 1], {
    ...CLAMP,
    easing: OPEN,
  });
  const closed = toScope * scopeBar + toSlit * (slitBar - scopeBar);
  const bar = closed * (1 - open);
  const opening = H - 2 * bar;

  const drift = (k: number) => ({
    x: Math.sin(frame / 44 + k * 1.7) * 3,
    y: Math.cos(frame / 57 + k * 2.3) * 2.5,
  });
  const ground = [
    ...BLOBS[theme].map((b, k) => {
      const o = drift(k);
      const col = b.color === "#ACCENT" ? accent : b.color;
      return `radial-gradient(85% 95% at ${(b.x + o.x).toFixed(2)}% ${(b.y + o.y).toFixed(2)}%, ${alpha(col, b.a)} 0%, transparent 68%)`;
    }),
    c.ground,
  ].join(", ");

  const bars = (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: Math.ceil(bar),
          backgroundColor: c.bars,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: W,
          height: Math.ceil(bar),
          backgroundColor: c.bars,
        }}
      />
    </>
  );

  if (!metrics) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ground,
          overflow: "hidden",
        }}
      >
        {bars}
      </div>
    );
  }
  const { capTop: CAP_TOP, baseline: BASELINE } = metrics;

  // Title sizes: in the slit its caps take about half the gap; at hero size it
  // spans most of the width.
  const slitSize = (slitH * 0.5) / (BASELINE - CAP_TOP);
  const heroSize = Math.min(H * 0.3, (W * 0.78) / metrics.width);
  const grow = interpolate(frame, [GROW_AT, GROW_END], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // A slow push while it sits in the slit, so the hold is never frozen.
  const push = interpolate(frame, [RISE_END - 6, OPEN_AT + 4], [0, 1], CLAMP);
  const wanted = slitSize * (1 + 0.035 * push) + (heroSize - slitSize) * grow;
  // Framed, never clipped: the ink stays inside the opening with room to spare.
  const size = Math.min(
    wanted,
    (opening * 0.6) / (BASELINE + metrics.descent - CAP_TOP),
  );
  const scale = size / heroSize;

  const rise = interpolate(frame, [RISE_AT, RISE_END], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tracking = interpolate(
    frame,
    [RISE_AT, OPEN_AT, GROW_END],
    [0.01, -0.012, HERO_TRACK],
    CLAMP,
  );

  const captionIn = interpolate(frame, [CAPTION_AT, CAPTION_END], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const captionSize = H * 0.034;
  const captionGap = H * 0.028;

  // Cap-height centre of the title sits on the frame centre, then the group
  // (title + caption) recentres as the caption arrives.
  const capMid = ((CAP_TOP + BASELINE) / 2) * size;
  const descender = metrics.descent * size;
  const groupShift = -captionIn * (descender + captionGap + captionSize) * 0.5;
  // Starts with its cap line just behind the lower bar's edge, wherever it is.
  const riseFrom = opening / 2 + ((BASELINE - CAP_TOP) / 2) * size + 2;
  const titleTop = H / 2 - capMid + groupShift + (1 - rise) * riseFrom;
  const baseline = titleTop + BASELINE * size;

  const body =
    c.accentPeriod && title.endsWith(".") ? title.slice(0, -1) : title;
  const period = body !== title;

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <Grain opacity={c.grain} />
      {rise > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: titleTop,
            height: heroSize,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: serif.fontFamily,
              fontWeight: 400,
              fontSize: heroSize,
              lineHeight: 1,
              letterSpacing: `${tracking}em`,
              color: c.ink,
              whiteSpace: "nowrap",
              transform: `scale(${scale})`,
              transformOrigin: "50% 0%",
              // letter-spacing trails the last glyph; pad it back to centre the ink
              paddingRight: `${-tracking}em`,
            }}
          >
            {body}
            {period ? <span style={{ color: accent }}>.</span> : null}
          </div>
        </div>
      ) : null}

      {caption && captionIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: baseline + descender + captionGap - captionSize * 0.2,
            textAlign: "center",
            fontFamily: sans.fontFamily,
            fontWeight: 400,
            fontSize: captionSize,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            color: c.caption,
            opacity: captionIn,
            transform: `translateY(${(1 - captionIn) * H * 0.012}px)`,
          }}
        >
          {caption}
        </div>
      ) : null}

      {bars}
    </AbsoluteFill>
  );
}
