"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  balance,
  type CoverRingElementId,
  coverRingTimeline,
  DEFAULT_CAPTION,
  DEFAULT_LINE,
  tileCount,
} from "./timeline";

const geist = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const newsreader = loadSerif("italic", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface CoverRingProps {
  images?: string[];
  line?: string;
  caption?: string;
  theme?: "dark" | "light";
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  ink?: string;
  accent?: string;
  fog?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /** Typeface for the line and caption. Load it yourself; Geist by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between words as the opening line reveals. */
  stagger?: number;
  /** Size of the ring and copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  /**
   * Moves, trims or stretches the line's rows, the push, single tiles, the
   * collapse, the bars, the caption and the pulse, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<CoverRingElementId>;
}

const THEMES = {
  dark: {
    background: "#010605",
    ink: "#ecfff7",
    accent: "#8ff0cc",
    ground: "kiruna" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    shadowRgb: "0,8,6",
    edge: "rgba(4,22,18,0.9)",
    scrim: "rgba(1,8,6,0.55)",
  },
  light: {
    background: "#eef3f0",
    ink: "#0f241d",
    accent: "#0f8a6c",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "aurora",
      background: "#eef3f0",
      colors: ["#0e9a7e", "#55e6bd", "#bfeede", "#e4f2ec"],
      scale: 0.75,
      warp: 0.45,
      grain: 0.12,
      seed: 106,
    } as Partial<GradientParams> | undefined,
    shadowRgb: "18,70,56",
    edge: "rgba(160,196,184,0.95)",
    scrim: "rgba(240,246,243,0.6)",
  },
};

const DEFAULT_IMAGES = [
  "templates/launch-anything/rocket.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "reel/reel-1.jpg",
  "templates/product-showcase/sculpture.jpg",
  "templates/launch-anything/earth.jpg",
  "templates/brand-guidelines/chair.jpg",
  "reel/reel-4.jpg",
  "templates/launch-anything/desk.jpg",
  "templates/product-showcase/courtyard.jpg",
  "reel/reel-6.jpg",
];

const EASE_ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const EASE_MOVE = Easing.bezier(0.83, 0, 0.17, 1);
const EASE_CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const SPRING_CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const SPRING_CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function mix(color: string, pct: number) {
  return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

function RevealWords({
  text,
  start,
  frame,
  stagger,
  rise,
  accentFrom,
  carried = false,
}: {
  text: string;
  start: number;
  frame: number;
  stagger: number;
  /** Frames each word takes to rise. */
  rise: number;
  accentFrom?: number;
  /** An ancestor already tilts this frame; one tilt in the chain is enough. */
  carried?: boolean;
}) {
  const glide = useGlide();
  const words = text.split(" ");
  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: "0.24em",
      }}
    >
      {words.map((word, i) => {
        const p = interpolate(
          frame,
          [start + i * stagger, start + i * stagger + rise],
          [0, 1],
          { ...CLAMP, easing: EASE_ENTER },
        );
        const accent = accentFrom !== undefined && i >= accentFrom;
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              padding: "0.06em 0.06em 0.18em",
              margin: "-0.06em -0.06em -0.18em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 140}%)${glide(
                  p > 5e-4 && p < 1 - 5e-4 && !carried,
                )}`,
                filter: `blur(${(1 - p) * 6}px)`,
                fontFamily: accent ? newsreader.fontFamily : undefined,
                fontStyle: accent ? "italic" : undefined,
                letterSpacing: accent ? "-0.02em" : undefined,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </span>
  );
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

export function CoverRing(props: CoverRingProps) {
  const {
    images,
    line = DEFAULT_LINE,
    caption = DEFAULT_CAPTION,
    theme = "dark",
    background,
    ink,
    accent,
    fog,
    ground,
    groundParams,
    fontFamily = geist.fontFamily,
    fontWeight = 300,
    scale = 1,
    delay = 0,
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    coverRingTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const pushEl = tl.get("push");
  const lineOutEl = tl.get("lineOut");
  const collapse = tl.get("collapse");
  const bars = tl.get("bars");
  const captionEl = tl.get("caption");
  const pulseEl = tl.get("pulse");
  const enterTime = (i: number) => tl.get(`tile:${i}`).start;
  const t = THEMES[theme];
  const light = theme === "light";
  const bg = background ?? t.background;
  const fg = ink ?? t.ink;
  const acc = accent ?? t.accent;
  const preset = ground ?? (groundParams ? undefined : t.ground);
  const gParams =
    groundParams ??
    (fog ? { ...(t.groundParams ?? {}), colors: fog } : t.groundParams);
  const srcs =
    images && images.length > 0 ? images : DEFAULT_IMAGES.map(staticFile);
  const portrait = H > W;
  const n = tileCount(srcs.length);

  const cx = W / 2;
  const cy = H * (portrait ? 0.46 : 0.5);
  const rx = portrait ? W * 0.39 : W * 0.33;
  const ry = portrait ? H * 0.25 : H * 0.36;
  const tilt = (-12 * Math.PI) / 180;
  const tile = portrait ? W * 0.25 : W * 0.118;
  const dot = portrait ? W * 0.05 : W * 0.026;
  const dotGap = dot * 1.9;
  const dots = 5;
  const lineSize = portrait ? W * 0.062 : W * 0.034;
  const capSize = portrait ? W * 0.12 : W * 0.074;
  const capGap = portrait ? H * 0.035 : H * 0.06;
  const barMax = portrait ? H * 0.09 : H * 0.17;
  const liftAt = (f: number) =>
    interpolate(f, [bars.start, bars.end], [0, (capSize * 1.1 + capGap) / 2], {
      ...CLAMP,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    });

  const collapseAt = (f: number) =>
    interpolate(f, [collapse.start, collapse.end], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });

  const rotAt = (f: number) => {
    const c = interpolate(f, [collapse.start, collapse.end], [0, 1], CLAMP);
    return -0.4 + f * 0.0095 + c * c * 1.8;
  };

  const tileAt = (i: number, f: number) => {
    const e0 = enterTime(i);
    const land = spring({ frame: f - e0, fps, config: SPRING_CARD });
    const q = collapseAt(f);
    const theta = rotAt(f) + (i / n) * Math.PI * 2;
    const ex = Math.cos(theta) * rx;
    const ey = Math.sin(theta) * ry;
    const rxp = ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const ryp = ex * Math.sin(tilt) + ey * Math.cos(tilt);
    const depth = (Math.sin(theta) + 1) / 2;
    const fly = 1 - land;
    const jitter = random(`cr2-j-${i}`) - 0.5;
    const ringX = cx + rxp * (1 + fly * 1.4) + fly * jitter * W * 0.25;
    const ringY = cy + ryp * (1 + fly * 1.4) + fly * H * 0.12;
    const k = i % dots;
    const dx = cx + (k - (dots - 1) / 2) * dotGap;
    const dy = cy - liftAt(f);
    const x = ringX * (1 - q) + dx * q;
    const y = ringY * (1 - q) + dy * q;
    return { x, y, depth, theta, land, q, fly, jitter };
  };

  const barP = spring({
    frame: frame - bars.start,
    fps,
    config: SPRING_CHIP,
  });
  const pulse = interpolate(
    frame,
    [pulseEl.start, pulseEl.start + pulseEl.beat("peak"), pulseEl.end],
    [0, 1, 0],
    { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
  );
  const barHeights = [0.5, 0.82, 0.6, 1, 0.7];
  const pulseHeights = [0.9, 0.46, 1, 0.58, 0.95];

  const lineOut = interpolate(frame, [lineOutEl.start, lineOutEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_EXIT,
  });
  const pushAt = (f: number) =>
    interpolate(f, [pushEl.start, pushEl.end], [1, 1.05], {
      ...CLAMP,
      easing: EASE_CAMERA,
    });
  const push = pushAt(frame);
  // The push carries every line of copy, so its tilt covers them all. Its
  // ease is very flat at both ends: compare with the neighbouring frames,
  // weighed by how far below or above the centre the copy sits (only
  // vertical travel snaps), so the long tail counts as rest.
  const reach = H / 4;
  const pushing =
    Math.abs(pushAt(frame + speed) - push) * reach > 1e-3 ||
    Math.abs(push - pushAt(frame - speed)) * reach > 1e-3;
  // The caption is laid out where the lift leaves it; the ride there is a
  // transform, since layout rounds a baseline to whole pixels.
  const liftEnd = liftAt(bars.end);
  const captionDy = liftEnd - liftAt(frame);
  const lifting =
    Math.abs(liftAt(frame + speed) - liftAt(frame)) > 1e-3 ||
    Math.abs(liftAt(frame) - liftAt(frame - speed)) > 1e-3;
  // A tile rests on its dot; it is laid out there and every other place it
  // passes through is a transform, since layout rounds a box to whole pixels.
  const tileRest = (i: number) => ({
    x: cx + ((i % dots) - (dots - 1) / 2) * dotGap,
    y: cy - liftEnd,
  });

  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => tileAt(a, frame).depth - tileAt(b, frame).depth,
  );

  const captionWords = caption.split(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      {background === undefined ? (
        <>
          <GshGround
            preset={preset}
            params={gParams}
            timeOffset={light ? 3 : 4}
            timeScale={0.8}
          />
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(${portrait ? "60% 26%" : "36% 34%"} at 50% ${(cy / H) * 100}%, ${t.scrim} 0%, transparent 74%)`,
            }}
          />
        </>
      ) : null}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        {order.map((i) => {
          const now = tileAt(i, frame);
          const prev = tileAt(i, frame - 1);
          const vx = Math.min(9, Math.abs(now.x - prev.x) * 0.12);
          const vy = Math.min(9, Math.abs(now.y - prev.y) * 0.12);
          return (
            <filter
              key={`f-${i}`}
              id={`cr2-mb-${i}`}
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
            >
              <feGaussianBlur stdDeviation={`${vx} ${vy}`} />
            </filter>
          );
        })}
      </svg>
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${push})${glide(pushing)}`,
            perspective: portrait ? 2200 : 1400,
            perspectiveOrigin: `50% ${(cy / H) * 100}%`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: cx - (portrait ? W * 0.34 : W * 0.2),
              width: portrait ? W * 0.68 : W * 0.4,
              top: cy,
              height: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily,
              fontWeight,
              fontSize: lineSize,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: fg,
              opacity: 1 - lineOut,
              transform: `scale(${1 - lineOut * 0.2})`,
              filter: `blur(${lineOut * 8}px)`,
              zIndex: 50,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {balance(line).map((row, r) => {
                const rowEl = tl.get(`row:${r}`);
                return (
                  <RevealWords
                    key={row}
                    text={row}
                    start={rowEl.start}
                    frame={frame}
                    stagger={rowEl.beat("stagger")}
                    rise={rowEl.beat("rise")}
                    carried={pushing}
                  />
                );
              })}
            </div>
          </div>
          {order.map((i, z) => {
            const s = tileAt(i, frame);
            if (frame < enterTime(i)) return null;
            const prev = tileAt(i, frame - 1);
            const moving = Math.hypot(s.x - prev.x, s.y - prev.y) > 3;
            const depthScale = 0.62 + 0.52 * s.depth;
            const sizeRing = tile * depthScale * (1 + s.fly * 1.6);
            const size = sizeRing * (1 - s.q) + dot * s.q;
            const flat = 1 - s.q;
            const rotY = -Math.cos(s.theta) * 28 * flat;
            const rotX = (12 - Math.sin(s.theta) * 6) * flat;
            const rotZ = (s.jitter * 16 + s.fly * s.jitter * 70) * flat;
            const depthBlur = (1 - s.depth) * (light ? 4 : 5) * flat;
            const fill = interpolate(s.q, [0.5, 0.92], [0, 1], CLAMP);
            const enter = Math.min(1, Math.max(0, s.land) * 3);
            const dim = light
              ? 1 - (1 - s.depth) * 0.12 * flat
              : (0.45 + 0.55 * s.depth) * flat + s.q;
            const extra = i >= dots;
            const fadeExtra = extra
              ? interpolate(s.q, [0.72, 0.98], [1, 0], CLAMP)
              : 1;
            const barShape = !extra && frame >= bars.start;
            const k = i % dots;
            const hBar =
              dot +
              (barMax * (barHeights[k] ?? 0.7) - dot) * barP +
              barMax *
                ((pulseHeights[k] ?? 0.7) - (barHeights[k] ?? 0.7)) *
                pulse;
            const w = size;
            const h = barShape ? hBar : size;
            const radius = s.q > 0.6 ? Math.min(w, h) / 2 : size * 0.16;
            const ex = -Math.cos(s.theta) * 0.035 * size * flat;
            const ey = 0.04 * size * flat;
            const edge = [1, 2, 3, 4]
              .map(
                (m) =>
                  `${(ex * m) / 4}px ${(ey * m) / 4}px 0 0 ${m === 4 ? t.edge : mix(t.edge, 70)}`,
              )
              .join(", ");
            const lift = size * (0.12 + 0.2 * s.depth) * flat;
            const rest = tileRest(i);
            const tx = s.x - rest.x;
            const ty = s.y - rest.y;
            const travel =
              Math.abs(tx) < 1e-3 && Math.abs(ty) < 1e-3
                ? ""
                : `translate(${tx}px, ${ty}px) `;
            const shadow =
              s.q > 0.6
                ? `0 0 ${dot * 1.2}px ${mix(acc, 50)}, 0 0 ${dot * 0.3}px ${mix(acc, 70)}`
                : `${edge}, 0 ${lift * 0.3}px ${lift * 0.5}px rgba(${t.shadowRgb},0.28), 0 ${lift}px ${lift * 2.2}px rgba(${t.shadowRgb},0.38)`;
            return (
              <div
                key={`cr-${i}`}
                style={{
                  position: "absolute",
                  left: rest.x - w / 2,
                  top: rest.y - h / 2,
                  width: w,
                  height: h,
                  borderRadius: radius,
                  zIndex: z,
                  opacity: enter * fadeExtra,
                  transform: `${travel}rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
                  filter: `${moving ? `url(#cr2-mb-${i}) ` : ""}blur(${depthBlur + Math.max(0, s.fly) * 8}px) brightness(${dim})`,
                  boxShadow: shadow,
                  backgroundColor: acc,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    overflow: "hidden",
                    opacity: 1 - fill,
                  }}
                >
                  <Img
                    src={srcs[i % srcs.length] as string}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      backgroundImage:
                        "linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.24) 100%)",
                      boxShadow:
                        "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.35)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: cy - liftEnd + barMax * 0.5 + capGap,
              transform:
                Math.abs(captionDy) > 1e-3
                  ? `translateY(${captionDy}px)${glide(lifting && !pushing)}`
                  : undefined,
              textAlign: "center",
              fontFamily,
              fontSize: capSize,
              letterSpacing: "-0.045em",
              fontWeight,
              lineHeight: 1,
              color: fg,
            }}
          >
            <RevealWords
              text={caption}
              start={captionEl.start}
              frame={frame}
              stagger={captionEl.beat("stagger")}
              rise={captionEl.beat("rise")}
              accentFrom={Math.max(1, captionWords.length - 1)}
              carried={pushing || lifting}
            />
          </div>
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default CoverRing;
