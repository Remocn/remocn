"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type SlitScanElementId, slitScanTimeline } from "./timeline";

const { fontFamily: bricolage } = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SlitScanProps {
  word?: string;
  caption?: string;
  slices?: number;
  /** Frames the farthest slice lags behind the word at the start. */
  trail?: number;
  fontWeight?: number;
  accent?: string;
  /** Text color of the settled word; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the fluted ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the word and caption. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  grain?: boolean;
  /** Size of the word and caption, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the slide, the trail, the ground, the rule and
   * the caption, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<SlitScanElementId>;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const LAG = 34;

const MOVE = Easing.bezier(0.3, 0.1, 0.2, 1);
const RESOLVE = Easing.bezier(0.65, 0, 0.35, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.14)",
    band: 0.42,
    rib: "70",
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    band: 0.34,
    rib: "60",
    grain: 0.04,
  },
} as const;

/**
 * gradients.sh "fluted" palette, ordered as a heat trail: the freshest stale
 * slices run hot, the oldest cool off to blue.
 */
const FLUTED = {
  dark: ["#FFE2C4", "#FF7A3D", "#2F7BFF", "#3A47C8"],
  light: ["#FF7A3D", "#E2562A", "#2F7BFF", "#1D2A8F"],
} as const;

function mix(a: string, b: string, k: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (v: number, sh: number) => (v >> sh) & 255;
  const c = (sh: number) =>
    Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * k)
      .toString(16)
      .padStart(2, "0");
  return `#${c(16)}${c(8)}${c(0)}`;
}

function sample(stops: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

/** Advance widths (em) for Bricolage Grotesque 500 at -0.035em tracking. */
function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.25;
    else if ("ijlI.,:;'!|".includes(ch)) w += 0.26;
    else if ("ftr".includes(ch)) w += 0.38;
    else if ("mwMW".includes(ch)) w += 0.84;
    else if (ch >= "A" && ch <= "Z") w += 0.64;
    else w += 0.56;
    w -= 0.035;
  }
  return Math.max(w, 0.5);
}

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
          baseFrequency="0.9"
          numOctaves={2}
          seed={9}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function splitTail(word: string) {
  const m = word.match(/^(.*?)([.!?]+)$/);
  return m ? [m[1], m[2]] : [word, ""];
}

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

export function SlitScan(props: SlitScanProps) {
  const {
    word = "Faster.",
    caption = "First render in 1.8s, down from 4.7s",
    slices = 120,
    trail = LAG,
    fontWeight = 500,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = bricolage,
    grain = true,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    slitScanTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const move = tl.get("move");
  const ground = tl.get("ground");
  const trailEl = tl.get("trail");
  const resolve = tl.get("resolve");
  const rule = tl.get("rule");
  const captionEl = tl.get("caption");
  const u = H / 720;
  const stage = THEMES[theme];
  const heat = FLUTED[theme];
  const n = Math.max(24, Math.round(slices));

  const em = widthEm(word);
  const size = Math.min(300 * u, (0.74 * W) / em);
  const wordW = em * size;
  const travel = W / 2 + wordW / 2 + 40 * u;
  const lift = -0.06 * H;

  const lag =
    trail *
    interpolate(t, [trailEl.start, trailEl.end], [0.35, 1], CLAMP) *
    (1 - RESOLVE(interpolate(t, [resolve.start, resolve.end], [0, 1], CLAMP)));
  const lagK = lag / Math.max(1, trail);
  const pos = (tau: number) =>
    travel *
    (1 - MOVE(interpolate(tau, [move.start, move.end], [0, 1], CLAMP)));

  const [body, tail] = splitTail(word);
  const sw = W / n;
  const gap = Math.max(0, 1.2 * u * Math.min(1, lagK * 1.6));

  const capIn = SETTLE(
    interpolate(t, [captionEl.start, captionEl.end], [0, 1], CLAMP),
  );
  const ruleIn = SETTLE(interpolate(t, [rule.start, rule.end], [0, 1], CLAMP));
  const capSize = Math.max(15, 24 * u);
  const baseY = H / 2 + lift + size * 0.5;

  // Fluted ground: the same heat palette as a low band behind the word,
  // ribbed into the slice pitch so the slits read as glass flutes.
  const bandIn = interpolate(t, [ground.start, ground.end], [0, 1], CLAMP);
  const flow = interpolate(
    t,
    [ground.start, ground.start + ground.beat("drift")],
    [-4, 4],
  );
  const bandStops = `${heat[3]} ${8 + flow}%, ${heat[2]} ${34 + flow}%, ${heat[1]} ${62 + flow}%, ${heat[0]} ${88 + flow}%`;
  const ribW = Math.max(4, W / n) * 2;

  const cols = [];
  const now = pos(t);
  const stale = 0.015 * size;
  let prevU = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n;
    const d = lag * s ** 1.8;
    const left = i * sw;
    const raw = left - pos(t - d);
    const u = Math.max(raw, prevU);
    prevU = u;
    const x = left - u;
    const isStale = Math.abs(x - now) > stale;
    const color = isStale
      ? sample(heat, (Math.abs(x - now) / (0.75 * wordW)) ** 0.7)
      : (ink ?? stage.fg);
    cols.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left,
          top: 0,
          width: sw + 0.75 - (isStale ? gap : 0),
          height: H,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -left,
            top: 0,
            width: W,
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(${x}px, ${lift}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight,
              fontSize: size,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              color,
              paddingBottom: 0.06 * size,
            }}
          >
            {body}
            {tail ? <span style={{ color: accent }}>{tail}</span> : null}
          </div>
        </div>
      </div>,
    );
  }

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined
            ? stage.bg
            : background === "transparent"
              ? undefined
              : background,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: bandIn * stage.band,
              backgroundImage: `linear-gradient(90deg, ${bandStops})`,
              WebkitMaskImage: `radial-gradient(72% 40% at 50% ${50 + (lift / H) * 100 + 4}%, #000 0%, rgba(0,0,0,0.4) 55%, transparent 100%)`,
              maskImage: `radial-gradient(72% 40% at 50% ${50 + (lift / H) * 100 + 4}%, #000 0%, rgba(0,0,0,0.4) 55%, transparent 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: bandIn,
              backgroundImage: `repeating-linear-gradient(90deg, ${stage.bg}00 0px, ${stage.bg}00 ${ribW / 2}px, ${stage.bg}${stage.rib} ${ribW / 2}px, ${stage.bg}${stage.rib} ${ribW}px)`,
            }}
          />
        </>
      ) : null}
      <ScaleLayer scale={scale}>
        {cols}
        <div
          style={{
            position: "absolute",
            left: W / 2 - (wordW * 0.5 * ruleIn) / 1,
            top: baseY + 34 * u,
            width: wordW * ruleIn,
            height: Math.max(1, u),
            background: stage.hair,
          }}
        />
        {caption ? (
          <div
            style={{
              position: "absolute",
              left: 0.08 * W,
              right: 0.08 * W,
              top: baseY + 58 * u,
              textAlign: "center",
              fontFamily,
              fontWeight: 400,
              fontSize: capSize,
              letterSpacing: "-0.005em",
              fontVariantNumeric: "tabular-nums",
              color: stage.muted,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 10 * u}px)${glide(midway(capIn))}`,
            }}
          >
            {caption}
          </div>
        ) : null}
      </ScaleLayer>
      {grain ? <Grain opacity={stage.grain} /> : null}
    </AbsoluteFill>
  );
}
